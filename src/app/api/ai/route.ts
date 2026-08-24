import { NextRequest, NextResponse } from 'next/server';
import { getServerStudentSession } from '@/lib/auth-server';
import { checkRateLimit, RateLimitTier } from '@/lib/rate-limit';
import { google } from 'googleapis';
import pdf from 'pdf-parse';
import { getCachedAIResult, setCachedAIResult } from '@/lib/persistent-ai-cache';

const pdfParse = pdf;

// Multi-tier Fallback Models (100% Free & Fast)
const OPENROUTER_MODELS = [
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3.5-lightning:free"
];

const GROQ_MODELS = [
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
  "allam-2-7b"
];

export async function POST(req: NextRequest) {
  try {
    const openRouterKey = process.env.OPENROUTER_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    if (!openRouterKey && !groqKey) {
      console.error("[Marline Drive AI] Missing API keys");
      return NextResponse.json({ error: 'Server configuration error: Missing AI API keys' }, { status: 500 });
    }

    const session = await getServerStudentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized: Please log in' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(session.auth_id, RateLimitTier.AI);
    if (!rateLimit.success) {
      return NextResponse.json({
        error: 'Daily limit reached. You can perform 20 AI actions per day.',
        reset: rateLimit.reset
      }, { status: 429 });
    }

    const {
      fileId,
      task,
      language = 'English',
      messages = [],
      questionCount = 8
    } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    // Clamp question count to a sane range so the model isn't abused into huge outputs (supports up to 50 questions)
    const safeQuestionCount = Math.min(Math.max(parseInt(String(questionCount), 10) || 8, 1), 50);

    const drive = google.drive({
      version: 'v3',
      auth: process.env.GOOGLE_DRIVE_API_KEY
    });

    const metadataResponse = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, parents'
    });
    const metadata = metadataResponse.data;

    const MAX_FILE_SIZE = 15 * 1024 * 1024;
    if (metadata.size && parseInt(metadata.size) > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File is too large. Maximum size is 15MB.' }, { status: 413 });
    }

    let fileContent = '';

    if (messages.length <= 1) {
      try {
        if (metadata.mimeType === 'application/vnd.google-apps.document') {
          const exportResponse = await drive.files.export(
            { fileId, mimeType: 'text/plain' },
            { responseType: 'text' }
          );
          fileContent = exportResponse.data as string;
        } else if (metadata.mimeType === 'application/pdf') {
          const dlResponse = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
          );
          const buffer = Buffer.from(dlResponse.data as ArrayBuffer);
          const data = await pdfParse(buffer);
          fileContent = data.text || '';
        } else if (metadata.mimeType?.startsWith('text/') || metadata.mimeType === 'application/json') {
          const dlResponse = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
          );
          const buffer = Buffer.from(dlResponse.data as ArrayBuffer);
          fileContent = buffer.toString('utf-8');
        }
      } catch (extractError) {
        console.error("[Marline Drive AI] Error extracting file content:", extractError);
        fileContent = `Document Name: ${metadata.name || 'Academic File'}`;
      }
    }

    // Trim context to fit context window comfortably (up to 35,000 characters)
    const sanitizedContext = fileContent.trim().length > 35000
      ? fileContent.slice(0, 35000) + "\n\n[... Remaining content truncated for optimal speed ...]"
      : fileContent.trim();

    // 1. PERSISTENT CACHE LOOKUP
    // NOTE: quiz cache key now includes question count so different counts don't collide
    const isCoreTask = task === 'summarize' || task === 'quiz' || task === 'translate';
    const shouldCache = isCoreTask && messages.length === 0 && sanitizedContext.length > 0;
    const cacheTaskKey = task === 'quiz' ? `quiz:${safeQuestionCount}` : task;

    if (shouldCache) {
      const cachedResult = await getCachedAIResult(sanitizedContext, cacheTaskKey, language);
      if (cachedResult) {
        console.log(`[Marline Cache Hit] Instantly returning cached result for ${cacheTaskKey} in ${language}.`);
        if (task === 'quiz') {
          return NextResponse.json({ result: cachedResult });
        } else {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              const chunk = `data: ${JSON.stringify({
                choices: [{ delta: { content: cachedResult } }]
              })}\n\n`;
              controller.enqueue(encoder.encode(chunk));
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            }
          });
          return new Response(stream, {
            headers: {
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive',
            },
          });
        }
      }
    }

    // 2. QUIZ GENERATION TASK (Static JSON output)
    if (task === 'quiz') {
      const quizPrompt = [
        {
          role: "system",
          content: `You are Marline AI, an expert quiz author. Output a JSON array of exactly ${safeQuestionCount} high-yield Multiple Choice Questions in ${language}, based strictly on the provided document content.

Schema: [{"numb":1,"type":"Multiple Choice","question":"...","options":["A) <full option text>","B) <full option text>","C) <full option text>","D) <full option text>"],"answer":"A) <full option text>","explanation":"..."}]

Rules:
- Each option string MUST include its letter prefix ("A) ", "B) ", "C) ", "D) ") followed by the FULL, complete answer text (not just the letter).
- "answer" MUST be an exact, character-for-character match of one full string from "options" (letter prefix included).
- Questions must test real understanding of the document (concepts, definitions, application, calculations, distinctions between similar ideas) — avoid trivial or out-of-context questions.
- Vary difficulty and question style where the material allows it.
- Return raw JSON array only. No markdown wrapping, no commentary, no trailing text.`
        },
        {
          role: "user",
          content: `Document Content:\n${sanitizedContext || metadata.name}\n\nGenerate ${safeQuestionCount} MCQs.`
        }
      ];

      let lastError = "";

      // Tier 1: OpenRouter
      if (openRouterKey) {
        for (const model of OPENROUTER_MODELS) {
          try {
            const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openRouterKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://chameleon-nu.vercel.app",
                "X-Title": "Marline AI"
              },
              body: JSON.stringify({
                model: model,
                messages: quizPrompt,
                max_tokens: Math.min(400 * safeQuestionCount, 6000),
                temperature: 0.1
              })
            });

            if (res.ok) {
              const data = await res.json();
              const rawContent = data.choices?.[0]?.message?.content || "";
              const cleaned = rawContent.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              const finalQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

              if (finalQuestions.length > 0) {
                if (shouldCache) {
                  await setCachedAIResult(sanitizedContext, cacheTaskKey, language, finalQuestions);
                }
                return NextResponse.json({ result: finalQuestions });
              }
            } else {
              lastError = await res.text();
            }
          } catch (err: any) {
            lastError = err.message;
          }
        }
      }

      // Tier 2: Groq
      if (groqKey) {
        for (const model of GROQ_MODELS) {
          try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${groqKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: model,
                messages: quizPrompt,
                max_tokens: Math.min(400 * safeQuestionCount, 6000),
                temperature: 0.1
              })
            });

            if (res.ok) {
              const data = await res.json();
              const rawContent = data.choices?.[0]?.message?.content || "";
              const cleaned = rawContent.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              const finalQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

              if (finalQuestions.length > 0) {
                if (shouldCache) {
                  await setCachedAIResult(sanitizedContext, cacheTaskKey, language, finalQuestions);
                }
                return NextResponse.json({ result: finalQuestions });
              }
            } else {
              lastError = await res.text();
            }
          } catch (err: any) {
            lastError = err.message;
          }
        }
      }

      return NextResponse.json({ error: `Failed to generate quiz: ${lastError}` }, { status: 502 });
    }

    // 3. SUMMARIZE, TRANSLATE & CHAT STREAMING TASKS
    const systemPrompt = `You are Marline AI, a world-class academic study assistant, university professor, and exam preparation specialist.
Language: ${language}.

GOAL:
Produce an in-depth, rich, beautifully structured, and highly engaging university study guide from the provided document. The summary must be exhaustive, covering all core concepts, definitions, processes, and comparisons without superficial brevity or empty filler.

CRITICAL FORMATTING & SYNTAX STANDARDS:
1. STRICT STANDARD GITHUB FLAVORED MARKDOWN (GFM):
   - TABLES: Always format comparison tables with standard markdown:
     | Header 1 | Header 2 | Header 3 |
     | :--- | :--- | :--- |
     | Value 1 | Value 2 | Value 3 |
     NEVER use double pipes (||), NEVER omit table headers or separator rows, and NEVER insert empty gap lines inside tables.
   - FORMULAS & CODE:
     - Use LaTeX syntax for math and stats ($$...$$ block, $...$ inline).
     - Use fenced code blocks (\`\`\`python, \`\`\`cpp) only when the document is about coding or algorithms.
   - SECTION DIVIDERS: Use clean markdown \`---\` between major thematic parts. Do NOT use unicode dotted lines (┄┄┄) or scattered dashes.

2. ACADEMIC STUDY GUIDE STRUCTURE:
   - 📌 **Executive Overview**: High-level synthesis of what this lecture/chapter is about, its significance, and core learning goals.
   - 🧠 **Core Concepts & Definitions**: Clear breakdown (or table) of all key terminology, definitions, and foundational concepts introduced in the text.
   - 🔍 **Detailed Thematic Analysis**: In-depth, thorough coverage of every topic, subtopic, taxonomy, and methodology in the document. Explain the "Why" and "How" with clear bullet points.
   - ⚖️ **Comparison & Evaluation Tables**: When different methods, tools, modes, pros/cons, or approaches are mentioned, provide crystal-clear comparison tables.
   - ⚠️ **Key Pitfalls, Biases & Common Mistakes**: Highlight common student misconceptions, edge cases, error types, or exam traps.
   - 💡 **Real-World Case Examples**: Concrete practical scenarios illustrating theoretical points in action.
   - 🎯 **High-Yield Exam Review Questions**: 3 to 5 conceptual review questions with concise model answers to reinforce learning.

3. QUALITY GUARANTEE:
   - Base all core facts on the provided document. If you add outside knowledge to clarify an ambiguous point, tag it with "**[Supplementary Context]**".
   - Make it rich, educational, and exam-ready.`;

    const apiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (messages.length > 0) {
      if (sanitizedContext) {
        apiMessages.push({
          role: "user",
          content: `Document Context (${metadata.name || 'File'}):\n${sanitizedContext}`
        });
        apiMessages.push({
          role: "assistant",
          content: `I have analyzed "${metadata.name || 'this document'}". How can I assist you with it?`
        });
      }
      apiMessages.push(...messages);
    } else {
      if (task === 'summarize') {
        apiMessages.push({
          role: "user",
          content: `Document Name: ${metadata.name || 'Academic File'}\n\nDocument Text Content:\n${sanitizedContext}\n\nPlease generate a comprehensive, in-depth, and beautifully formatted university study guide for this document in ${language}. Ensure every major topic, definition, comparison table, and process is fully detailed, structured with clear headings and standard GFM markdown tables, and ready for high-yield exam revision.`
        });
      } else if (task === 'translate') {
        apiMessages.push({
          role: "user",
          content: `Document Name: ${metadata.name || 'Academic File'}\n\nDocument Text Content:\n${sanitizedContext}\n\nTranslate and structure the main points of this document into ${language} while preserving all technical accuracy, formatting, and depth.`
        });
      }
    }

    let lastErrorText = "";

    // TIER 1: OpenRouter Free Models
    if (openRouterKey) {
      for (const model of OPENROUTER_MODELS) {
        try {
          console.log(`[Marline Drive AI] Attempting OpenRouter model: ${model}`);
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openRouterKey}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "https://chameleon-nu.vercel.app",
              "X-Title": "Marline AI"
            },
            body: JSON.stringify({
              model: model,
              messages: apiMessages,
              stream: true,
              temperature: 0.3,
              max_tokens: 4096
            })
          });

          if (response.ok && response.body) {
            console.log(`[Marline Drive AI] Streaming successfully with OpenRouter ${model}`);
            return new Response(response.body, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive"
              }
            });
          } else {
            lastErrorText = await response.text();
            console.warn(`[Marline Drive AI] OpenRouter ${model} failed (${response.status}):`, lastErrorText);
          }
        } catch (err: any) {
          console.warn(`[Marline Drive AI] OpenRouter ${model} fetch exception:`, err.message);
          lastErrorText = err.message;
        }
      }
    }

    // TIER 2: Seamless Fallback to Groq
    if (groqKey) {
      for (const model of GROQ_MODELS) {
        try {
          console.log(`[Marline Drive AI] Falling back to Groq model: ${model}`);
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: model,
              messages: apiMessages,
              stream: true,
              temperature: 0.3,
              max_tokens: 4096
            })
          });

          if (response.ok && response.body) {
            console.log(`[Marline Drive AI] Streaming successfully with Groq ${model}`);
            return new Response(response.body, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive"
              }
            });
          } else {
            lastErrorText = await response.text();
            console.warn(`[Marline Drive AI] Groq ${model} failed (${response.status}):`, lastErrorText);
          }
        } catch (err: any) {
          console.warn(`[Marline Drive AI] Groq ${model} fetch exception:`, err.message);
          lastErrorText = err.message;
        }
      }
    }

    return NextResponse.json({ error: lastErrorText || "All AI providers failed" }, { status: 502 });

  } catch (error) {
    console.error('[Marline Drive AI] Global error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Internal error: ${errorMessage}` }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';