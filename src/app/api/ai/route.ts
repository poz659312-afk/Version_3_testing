import { NextRequest, NextResponse } from 'next/server';
import { getServerStudentSession } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, RateLimitTier } from '@/lib/rate-limit';
import { google } from 'googleapis';
import pdf from 'pdf-parse';
import { getCachedAIResult, setCachedAIResult } from '@/lib/persistent-ai-cache';

const pdfParse = pdf;

// Multi-tier Fallback Models (100% Free & Lightning Fast)
// TIER 1 (Default): Ultra-fast Groq Models with 131k context windows
const GROQ_MODELS = [
  "qwen/qwen3.8-27b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-120b",
  "openai/gpt-oss-20b"
];

// TIER 2 (Fallback): OpenRouter Free Models
const OPENROUTER_MODELS = [
  "openrouter/free",
  "nvidia/nemotron-3.5-lightning:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "minimax/minimax-m2.7:free"
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerStudentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const supabaseAdmin = createAdminClient() as any;
    const { data: userRecord } = await supabaseAdmin
      .from('chameleons')
      .select('ai_credits')
      .eq('auth_id', session.auth_id)
      .single();

    return NextResponse.json({
      credits: userRecord?.ai_credits ?? 20,
      maxCredits: 20
    });
  } catch (err: any) {
    return NextResponse.json({ credits: 20, maxCredits: 20 });
  }
}

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

    // Clean excessive blank lines and whitespace to maximize information density per character
    const cleanedFileContent = fileContent.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    const MAX_CONTEXT_CHARS = 9500;
    const sanitizedContext = cleanedFileContent.length > MAX_CONTEXT_CHARS
      ? cleanedFileContent.slice(0, MAX_CONTEXT_CHARS) + "\n\n[... Content truncated for optimal response speed ...]"
      : cleanedFileContent;

    // Dynamic token cost calculation:
    // Scale smoothly from 1 to 10 tokens max based on extracted document size:
    const baseLength = Math.max(sanitizedContext.length, 1000);
    const dynamicTokenCost = Math.min(10, Math.max(1, Math.ceil(baseLength / 3500)));

    const supabaseAdmin = createAdminClient() as any;
    let currentCredits = 20;

    try {
      const { data: userRecord } = await supabaseAdmin
        .from('chameleons')
        .select('ai_credits')
        .eq('auth_id', session.auth_id)
        .single();
      if (userRecord && typeof userRecord.ai_credits === 'number') {
        currentCredits = userRecord.ai_credits;
      }
    } catch (err) {
      console.warn("[Marline AI] Could not query ai_credits:", err);
    }

    if (currentCredits < dynamicTokenCost) {
      return NextResponse.json({
        error: `رصيد الـ AI غير كافٍ. يتطلب هذا الملف ${dynamicTokenCost} نقطة، ورصيدك الحالي ${currentCredits} نقطة من 20. يتم تجديد الرصيد يومياً!`,
        remainingCredits: currentCredits,
        requiredCredits: dynamicTokenCost
      }, { status: 429 });
    }

    // Helper to deduct credits in database
    const deductCredits = async () => {
      const newCredits = Math.max(0, currentCredits - dynamicTokenCost);
      try {
        await supabaseAdmin
          .from('chameleons')
          .update({ ai_credits: newCredits })
          .eq('auth_id', session.auth_id);
      } catch (err) {
        console.warn("[Marline AI] Failed to update ai_credits in DB:", err);
      }
    };

    // 1. PERSISTENT CACHE LOOKUP
    // NOTE: quiz cache key now includes question count so different counts don't collide
    const isCoreTask = task === 'summarize' || task === 'quiz' || task === 'translate';
    const shouldCache = isCoreTask && messages.length === 0 && sanitizedContext.length > 0;
    const cacheTaskKey = task === 'quiz' ? `quiz:${safeQuestionCount}` : task;

    if (shouldCache) {
      const cachedResult = await getCachedAIResult(sanitizedContext, cacheTaskKey, language);
      if (cachedResult) {
        console.log(`[Marline Cache Hit] Instantly returning cached result for ${cacheTaskKey} in ${language}.`);
        await deductCredits();
        if (task === 'quiz') {
          return NextResponse.json({ result: cachedResult }, {
            headers: {
              'X-AI-Credits-Remaining': Math.max(0, currentCredits - dynamicTokenCost).toString(),
              'X-AI-Credits-Cost': dynamicTokenCost.toString()
            }
          });
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
              'X-AI-Credits-Remaining': Math.max(0, currentCredits - dynamicTokenCost).toString(),
              'X-AI-Credits-Cost': dynamicTokenCost.toString()
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

      // Tier 1: Groq (Primary & Fast)
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
                await deductCredits();
                if (shouldCache) {
                  await setCachedAIResult(sanitizedContext, cacheTaskKey, language, finalQuestions);
                }
                return NextResponse.json({ result: finalQuestions }, {
                  headers: {
                    'X-AI-Credits-Remaining': Math.max(0, currentCredits - dynamicTokenCost).toString(),
                    'X-AI-Credits-Cost': dynamicTokenCost.toString()
                  }
                });
              }
            } else {
              lastError = await res.text();
            }
          } catch (err: any) {
            lastError = err.message;
          }
        }
      }

      // Tier 2: OpenRouter Nemotron (Fallback)
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
                await deductCredits();
                if (shouldCache) {
                  await setCachedAIResult(sanitizedContext, cacheTaskKey, language, finalQuestions);
                }
                return NextResponse.json({ result: finalQuestions }, {
                  headers: {
                    'X-AI-Credits-Remaining': Math.max(0, currentCredits - dynamicTokenCost).toString(),
                    'X-AI-Credits-Cost': dynamicTokenCost.toString()
                  }
                });
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
    const systemPrompt = `You are Marline AI, an elite university professor and academic study guide author.
    Language: ${language}.

    CRITICAL FORMATTING & SYNTAX STANDARDS:
    1. GFM Tables:
       - Every table MUST have a standard header row, delimiter row (| --- | --- |), and data rows.
       - Each table row MUST be on its own independent line starting with | and ending with |.
       - NEVER output multiple rows on a single line or use inline ||.
       - Inside table cells, use plain text or simple inline math $...$. Never place unescaped vertical pipes inside cells (use \\mid or \\Vert instead).
    2. Mathematical Formulas (LaTeX):
       - Inline math: Wrap strictly in $...$ (e.g., $P(X_{n+1} = j \\mid X_n = i) = p_{ij}$).
       - NEVER place $ inside brackets or functions (e.g. write $P(A \\mid B)$, NEVER P(\\mid$B$)).
       - Block / Display equations & Matrices: ALWAYS enclose on separate lines wrapped in $$...$$ (e.g. $$\\begin{bmatrix} Q & R \\\\ 0 & I \\end{bmatrix}$$).
       - Never place display matrices inline within text sentences.
    3. Code & SQL: Always enclose in fenced code blocks (\`\`\`sql, \`\`\`python, etc.).
    4. Section Dividers: Use a single \`---\` before major section headings.

    FIXED ACADEMIC STUDY GUIDE STRUCTURE:
    - 📌 **Executive Overview**: High-level synthesis of learning goals and core concepts.
    - 🧠 **Core Concepts & Definitions**: Key terminology and foundational definitions.
    - 🔍 **Detailed Thematic Analysis**: In-depth explanations of every topic/methodology with bullet points, code, and LaTeX where relevant.
    - ⚖️ **Comparison & Evaluation Table**: A clean GFM table comparing methods/approaches (or "Key Trade-offs" if not applicable).
    - ⚠️ **Key Pitfalls & Exam Traps**: Common misconceptions and edge cases.
    - 💡 **Real-World Case Examples**: Practical implementation scenarios.
    - 🎯 **High-Yield Exam Review Questions**: 3 to 5 conceptual review questions with model answers.

    Completeness: Ensure the study guide covers all topics comprehensively to the very end without cutting off. Output only the clean, complete study guide without meta-commentary.`;

    const apiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (task === 'summarize') {
      apiMessages.push({
        role: "user",
        content: `Document Name: ${metadata.name || 'Academic File'}\n\nDocument Text Content:\n${sanitizedContext}\n\nPlease generate a comprehensive, in-depth, and beautifully formatted university study guide for this document in ${language}, following the fixed structure and formatting rules exactly. Every section and every table must be fully written out and complete — do not leave any table row, section, or placeholder empty.`
      });
    } else if (task === 'translate') {
      apiMessages.push({
        role: "user",
        content: `Document Name: ${metadata.name || 'Academic File'}\n\nDocument Text Content:\n${sanitizedContext}\n\nTranslate and structure the main points of this document into ${language} while preserving all technical accuracy, formatting, and depth.`
      });
    } else if (messages.length > 0) {
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
      
      // Trim chat history to the last 6 messages to prevent token limit overflow
      const recentMessages = messages.slice(-6);
      apiMessages.push(...recentMessages);
    }

    // Filter and sanitize all messages to ensure strictly valid non-empty string contents
    const sanitizedApiMessages = apiMessages
      .filter(m => m && typeof m.content === 'string' && m.content.trim().length > 0)
      .map(m => ({ role: m.role || 'user', content: m.content.trim() }));

    let lastErrorText = "";

    // Helper: read initial stream chunks to guarantee the model is actively emitting tokens before handing off
    async function testAndWrapStream(
      response: globalThis.Response,
      timeoutMs: number,
      tierNotice?: string
    ): Promise<ReadableStream<Uint8Array>> {
      const reader = response.body!.getReader();
      const collectedChunks: Uint8Array[] = [];
      const decoder = new TextDecoder();
      let hasTokens = false;

      const startTime = Date.now();
      while (Date.now() - startTime < timeoutMs) {
        const { value, done } = await Promise.race([
          reader.read(),
          new Promise<{ value: undefined; done: true }>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout waiting for stream tokens")), timeoutMs)
          )
        ]);

        if (done) break;
        if (value) {
          collectedChunks.push(value);
          const chunkStr = decoder.decode(value);
          if (chunkStr.includes('"choices"') || chunkStr.includes('"delta"') || chunkStr.includes('data:')) {
            hasTokens = true;
            break;
          }
        }
      }

      if (!hasTokens && collectedChunks.length === 0) {
        reader.cancel();
        throw new Error("Stream closed without emitting content");
      }

      const encoder = new TextEncoder();
      return new ReadableStream<Uint8Array>({
        async start(controller) {
          if (tierNotice) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ tier_notice: "redirect_to_tier_2", message: tierNotice })}\n\n`)
            );
          }
          for (const chunk of collectedChunks) {
            controller.enqueue(chunk);
          }
        },
        async pull(controller) {
          try {
            const { value, done } = await reader.read();
            if (done) {
              controller.close();
            } else if (value) {
              controller.enqueue(value);
            }
          } catch (err) {
            controller.error(err);
          }
        },
        cancel() {
          reader.cancel();
        }
      });
    }

    // Calculate estimated input tokens to intelligently manage Groq's 8000 TPM limit
    const totalInputChars = sanitizedApiMessages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    const estimatedInputTokens = Math.ceil(totalInputChars / 3.5);
    const groqMaxTokens = Math.min(3200, Math.max(1000, 7400 - estimatedInputTokens));

    // TIER 1: Groq Models (Primary & Ultra Fast - for documents within TPM budget)
    if (groqKey && (estimatedInputTokens + 1000 <= 7500)) {
      for (const model of GROQ_MODELS) {
        try {
          console.log(`[Marline Drive AI] Tier 1: Attempting Groq model: ${model} (Budgeted max_tokens: ${groqMaxTokens})`);
          const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: model,
              messages: sanitizedApiMessages,
              stream: true,
              temperature: 0.3,
              max_tokens: groqMaxTokens
            })
          });

          const contentType = response.headers.get("content-type") || "";

          if (response.ok && response.body && contentType.includes("text/event-stream")) {
            const validatedStream = await testAndWrapStream(response, 12000);
            await deductCredits();
            console.log(`[Marline Drive AI] Streaming successfully with Tier 1: Groq ${model}`);
            return new Response(validatedStream, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
                "X-AI-Credits-Remaining": Math.max(0, currentCredits - dynamicTokenCost).toString(),
                "X-AI-Credits-Cost": dynamicTokenCost.toString()
              }
            });
          } else {
            lastErrorText = await response.text();
            console.warn(`[Marline Drive AI] Tier 1 Groq ${model} rejected (${response.status}):`, lastErrorText);
          }
        } catch (err: any) {
          console.warn(`[Marline Drive AI] Tier 1 Groq ${model} error/timeout:`, err.message);
          lastErrorText = err.message;
        }
      }
    }

    // TIER 2: Seamless Auto-Failover to OpenRouter Models (Large Context, No 8k TPM Limit)
    if (openRouterKey) {
      for (const model of OPENROUTER_MODELS) {
        try {
          console.log(`[Marline Drive AI] Tier 2: Falling back to OpenRouter model: ${model}`);
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
              messages: sanitizedApiMessages,
              stream: true,
              temperature: 0.3,
              max_tokens: task === 'summarize' ? 3800 : 1800
            })
          });

          const contentType = response.headers.get("content-type") || "";

          if (response.ok && response.body && contentType.includes("text/event-stream")) {
            const validatedStream = await testAndWrapStream(
              response,
              7000,
              `Tier 1 busy. Redirected automatically to Tier 2 (${model}).`
            );
            await deductCredits();
            console.log(`[Marline Drive AI] Streaming successfully with Tier 2: OpenRouter ${model}`);
            return new Response(validatedStream, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
                "X-AI-Credits-Remaining": Math.max(0, currentCredits - dynamicTokenCost).toString(),
                "X-AI-Credits-Cost": dynamicTokenCost.toString()
              }
            });
          } else {
            lastErrorText = await response.text();
            console.warn(`[Marline Drive AI] Tier 2 OpenRouter ${model} failed (${response.status}):`, lastErrorText);
          }
        } catch (err: any) {
          console.warn(`[Marline Drive AI] Tier 2 OpenRouter ${model} exception:`, err.message);
          lastErrorText = err.message;
        }
      }
    }

    return NextResponse.json({ error: lastErrorText || "All AI tiers failed to respond" }, { status: 502 });

  } catch (error) {
    console.error('[Marline Drive AI] Global error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Internal error: ${errorMessage}` }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
