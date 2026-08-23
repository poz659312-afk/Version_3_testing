import { NextRequest, NextResponse } from 'next/server';
import { getServerStudentSession } from '@/lib/auth-server';
import { checkRateLimit, RateLimitTier } from '@/lib/rate-limit';
import { google } from 'googleapis';
import pdf from 'pdf-parse';
import { getCachedAIResult, setCachedAIResult } from '@/lib/persistent-ai-cache';

const pdfParse = pdf;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Multi-tier Fallback Providers & Models (100% Free & Highly Capable)
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

// Helper to execute LLM calls with multi-tier fallback (OpenRouter -> Groq)
async function executeLLMWithFallback({
  messages,
  max_tokens = 1500,
  temperature = 0.2,
  stream = false
}: {
  messages: any[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}): Promise<{ response?: Response; data?: any; error?: string }> {
  let lastError = "";

  // TIER 1: Try OpenRouter Free Models
  if (OPENROUTER_API_KEY) {
    for (const model of OPENROUTER_MODELS) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://chameleon-nu.vercel.app",
            "X-Title": "Marline AI"
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: max_tokens,
            temperature: temperature,
            stream: stream
          })
        });

        if (res.ok) {
          if (stream) {
            return { response: res };
          }
          const data = await res.json();
          if (data.choices?.[0]?.message?.content) {
            return { data: data };
          }
        } else {
          lastError = await res.text();
          console.warn(`[Marline Drive AI] OpenRouter ${model} failed (${res.status}):`, lastError);
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`[Marline Drive AI] OpenRouter ${model} error:`, err.message);
      }
    }
  }

  // TIER 2: Fallback to Groq API
  if (GROQ_API_KEY) {
    for (const model of GROQ_MODELS) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: messages,
            max_tokens: max_tokens,
            temperature: temperature,
            stream: stream
          })
        });

        if (res.ok) {
          if (stream) {
            return { response: res };
          }
          const data = await res.json();
          if (data.choices?.[0]?.message?.content) {
            return { data: data };
          }
        } else {
          lastError = await res.text();
          console.warn(`[Marline Drive AI] Groq ${model} failed (${res.status}):`, lastError);
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`[Marline Drive AI] Groq ${model} error:`, err.message);
      }
    }
  }

  return { error: lastError || "All AI providers failed" };
}

// Lightweight chunk summarizer with semantic caching and graceful degradation
async function summarizeChunk(chunk: string, index: number, total: number, language: string): Promise<string> {
  try {
    const cached = await getCachedAIResult(chunk, 'chunk-summary', language);
    if (cached) {
      return cached;
    }

    const { data } = await executeLLMWithFallback({
      messages: [
        { role: "system", content: `You are Marline AI. Summarize concisely in ${language}. Extract key facts, definitions, formulas, and main points only.` },
        { role: "user", content: chunk.slice(0, 10000) }
      ],
      max_tokens: 500,
      temperature: 0.1,
      stream: false
    });

    const summary = data?.choices?.[0]?.message?.content || chunk.slice(0, 800);

    if (summary && summary.trim().length > 50) {
      await setCachedAIResult(chunk, 'chunk-summary', language, summary);
    }

    return summary;
  } catch (e) {
    console.error(`[Marline Chunk Error] Failed for chunk ${index + 1}/${total}:`, e);
    return chunk.slice(0, 800);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY && !GROQ_API_KEY) {
      console.error("Missing AI API keys in environment");
      return NextResponse.json({ error: 'Server configuration error: No AI keys' }, { status: 500 });
    }

    const session = await getServerStudentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(session.auth_id, RateLimitTier.AI);
    if (!rateLimit.success) {
      return NextResponse.json({
        error: 'Daily limit reached. You can perform 20 AI actions per day.',
        reset: rateLimit.reset
      }, { status: 429 });
    }

    const { fileId, task, language = 'English', messages = [] } = await req.json();

    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    const drive = google.drive({
      version: 'v3',
      auth: process.env.GOOGLE_DRIVE_API_KEY
    });

    const metadataResponse = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, parents'
    });
    const metadata = metadataResponse.data;

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (metadata.size && parseInt(metadata.size) > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File is too large. Maximum size is 10MB.' }, { status: 413 });
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
          fileContent = data.text;
        } else if (metadata.mimeType?.startsWith('text/') || metadata.mimeType === 'application/json') {
          const dlResponse = await drive.files.get(
            { fileId, alt: 'media' },
            { responseType: 'arraybuffer' }
          );
          const buffer = Buffer.from(dlResponse.data as ArrayBuffer);
          fileContent = buffer.toString('utf-8');
        }
      } catch (extractError) {
        console.error("Error extracting file content:", extractError);
        return NextResponse.json({ error: 'Failed to extract text from the document.' }, { status: 422 });
      }
    }

    // 1. PERSISTENT CACHE LOOKUP
    const isCoreTask = task === 'summarize' || task === 'quiz' || task === 'translate';
    const shouldCache = isCoreTask && messages.length === 0 && fileContent.trim().length > 0;

    if (shouldCache) {
      const cachedResult = await getCachedAIResult(fileContent, task, language);
      if (cachedResult) {
        console.log(`[Marline Cache Hit] Instantly returning cached result for ${task} in ${language}.`);
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

    // 2. HIERARCHICAL COMPRESSION & SEMANTIC CHUNKING
    let contextualText = '';
    if (fileContent.trim().length > 0) {
      if (fileContent.length <= 8000) {
        contextualText = fileContent;
      } else {
        const chunkSize = 12000;
        const chunks: string[] = [];
        for (let i = 0; i < fileContent.length; i += chunkSize) {
          chunks.push(fileContent.substring(i, i + chunkSize));
        }

        const totalChunks = Math.min(chunks.length, 6);
        const chunkSummaries: string[] = new Array(totalChunks);
        const activePromises: Promise<void>[] = [];

        for (let i = 0; i < totalChunks; i++) {
          const chunkIndex = i;
          const chunkPromise = (async () => {
            const summary = await summarizeChunk(
              chunks[chunkIndex],
              chunkIndex,
              totalChunks,
              language
            );
            chunkSummaries[chunkIndex] = summary;
          })();

          activePromises.push(chunkPromise);
        }

        await Promise.all(activePromises);
        contextualText = chunkSummaries.join("\n\n");
      }
    }

    // 3. QUIZ GENERATION TASK
    if (task === 'quiz') {
      let quizContext = fileContent;
      if (fileContent.length > 6000) {
        const cachedSummary = await getCachedAIResult(fileContent, 'summarize', language);
        quizContext = cachedSummary || contextualText;
      }

      const { data, error } = await executeLLMWithFallback({
        messages: [
          {
            role: "system",
            content: `You are Marline AI. Output a JSON array of 5-10 high-yield Multiple Choice Questions in ${language}. Schema: {"numb":number,"type":"Multiple Choice","question":"...","options":["...","...","...","..."],"answer":"...","explanation":"..."}. answer MUST match 1 option exactly. Return raw JSON array only, no markdown wrapping.`
          },
          { role: "user", content: `Context:\n${quizContext.slice(0, 12000)}\n\nGenerate MCQs.` }
        ],
        max_tokens: 1500,
        temperature: 0.1,
        stream: false
      });

      if (error || !data) {
        return NextResponse.json({ error: `AI quiz generation failed: ${error}` }, { status: 502 });
      }

      const result = data.choices?.[0]?.message?.content;
      try {
        const cleaned = result.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const finalQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

        if (shouldCache && finalQuestions.length > 0) {
          await setCachedAIResult(fileContent, task, language, finalQuestions);
        }
        return NextResponse.json({ result: finalQuestions });
      } catch (e) {
        console.error("Failed to parse quiz JSON:", e);
        return NextResponse.json({ error: "Failed to generate structured quiz." }, { status: 502 });
      }
    }

    // 4. SUMMARIZE, TRANSLATE & CHAT STREAMING TASKS
    const systemPrompt = `You are Marline AI, an elite academic and coding companion for university students.
Respond in ${language}.
When providing summaries:
- Create structured, high-yield, engaging study notes.
- Use $$...$$ for LaTeX math formulas and code blocks \`\`\` for programming code.
- Separate main sections with horizontal rules (---).
- Include key concepts, exam tips, formulas/code examples, and bulleted takeaways.${contextualText ? `\n\nContext Document:\n${contextualText}` : ''}`;

    const apiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (messages.length > 0) {
      apiMessages.push(...messages);
    } else {
      if (task === 'summarize') {
        apiMessages.push({
          role: "user",
          content: `Generate a comprehensive, structured study guide from this document.
Format:
1. Executive Summary & Overview
---
2. Core Concepts & Definitions (hierarchical bullets)
---
3. Essential Formulas, Tables & Code Examples (if applicable)
---
4. High-Yield Exam Tips & Common Pitfalls
---
5. Key Takeaways Summary
Use "---" between sections. Be dense, clear, and educational.`
        });
      } else if (task === 'translate') {
        apiMessages.push({
          role: "user",
          content: `Translate and restructure the key points of the context document into ${language}. Use structured bullet points, separate key sections with (---), and format formulas in LaTeX ($$...$$).`
        });
      }
    }

    const { response, error } = await executeLLMWithFallback({
      messages: apiMessages,
      max_tokens: 1800,
      temperature: 0.2,
      stream: true
    });

    if (error || !response || !response.body) {
      return NextResponse.json({ error: `Marline AI service error: ${error}` }, { status: 502 });
    }

    // Background caching of stream response
    if (shouldCache) {
      const clonedResponse = response.clone();
      clonedResponse.text().then(streamBuffer => {
        try {
          let fullResponseText = '';
          const lines = streamBuffer.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6).trim();
              if (jsonStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content || '';
                fullResponseText += content;
              } catch (e) { }
            }
          }
          if (fullResponseText.trim().length > 100) {
            setCachedAIResult(fileContent, task, language, fullResponseText);
          }
        } catch (cacheErr) {
          console.error('[Marline Cache Stream Save Error]:', cacheErr);
        }
      }).catch(err => {
        console.error('[Marline Cache Background Save Error]:', err);
      });
    }

    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Marline AI processing error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to process AI request: ${errorMessage}` }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';