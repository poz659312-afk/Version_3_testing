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
    const systemPrompt = `You are Marline AI, an elite university academic, research, and study assistant.
Language: ${language}.

CORE PRINCIPLE — Adapt to the subject, never force a fixed template:
Before writing anything, silently identify what kind of material this is (e.g. math/engineering, programming, medical/first-aid, literature, business, law, history, language learning...) and what it actually needs. Do NOT default to the same structure for every document.
- Only include code blocks if the material is actually about programming/algorithms.
- Only include LaTeX formulas ($$...$$ block, $...$ inline) if the material is genuinely mathematical/quantitative.
- If the material calls for comparing two or more things (e.g. two conditions, two techniques, two eras), use a clear comparison table.
- If the material describes a process, sequence, or relationships that are easier to grasp visually, describe it as a simple step list or a short textual "graph"/flow description instead of forcing an irrelevant formula or code block.
- For procedural/practical subjects (e.g. first aid, lab protocols), prioritize clear numbered steps and warnings over any technical notation.
- Choose section headings that fit the actual content of this specific document — don't reuse a fixed set of headings across unrelated subjects.

Content rules:
- Keep the explanation simplified and student-friendly — clarify jargon in plain language the first time it appears.
- Base everything primarily on the provided document. If you add outside knowledge that is NOT found in the document (e.g. extra context, a fact to fill a gap, a clarifying example), prefix that specific point with a small tag like "**[Not in the PDF]**" so the student knows it's supplementary.
- Separate distinct points/sections with a dotted horizontal rule (e.g. a line of "┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄" or similar), not a plain "---" and not empty blank dividers.
- Keep everything dense, well-organized, and genuinely useful for exam prep — no filler, no repeated ideas, no empty horizontal lines used as spacing.`;

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
          content: `Document: ${metadata.name || 'Academic File'}\n\nContent:\n${sanitizedContext}\n\nFirst figure out what subject/type of material this is, then generate a structured study guide with sections and elements (code, formulas, comparison tables, step lists, warnings, etc.) that actually fit THIS material — do not use a generic fixed template. Follow the CORE PRINCIPLE and content rules from your system instructions exactly, including the dotted separators between distinct points and the "[Not in the PDF]" tag for anything not sourced from the document.`
        });
      } else if (task === 'translate') {
        apiMessages.push({
          role: "user",
          content: `Document: ${metadata.name || 'Academic File'}\n\nContent:\n${sanitizedContext}\n\nTranslate and structure the main points of this document into ${language}, adapting the structure to fit this specific material as described in your instructions.`
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