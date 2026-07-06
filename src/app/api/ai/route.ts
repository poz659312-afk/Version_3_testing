import { NextRequest, NextResponse } from 'next/server';
import { getServerStudentSession } from '@/lib/auth-server';
import { checkRateLimit, RateLimitTier } from '@/lib/rate-limit';
import { google } from 'googleapis';
import pdf from 'pdf-parse';
import { getCachedAIResult, setCachedAIResult } from '@/lib/persistent-ai-cache';

const pdfParse = pdf;
const ZENMUX_API_KEY = process.env.ZENMUX_API_KEY || "sk-ai-v1-4f6c49c11caf0b84b2a96dc6db4803ff119981f776ada57de2211d5f2030767f";
const ZENMUX_API_URL = "https://zenmux.ai/api/v1/chat/completions";

// Production scale high-reasoning models
const PRIMARY_AI_MODEL = "anthropic/claude-sonnet-4.6";
const FAST_CHAT_MODEL = "anthropic/claude-sonnet-4.6"; // Optimized for fast, short-form responses like chunk summarization

// Helper function to handle fetch retries with exponential backoff for high concurrency
async function fetchWithRetry(url: string, options: any, retries = 3, delay = 1000) {
  let lastStatus = 0;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
      lastStatus = response.status;
      if (response.status === 429 || response.status >= 500) {
        console.warn(`[AI Route Retry] Request failed with status ${response.status}. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error(`Failed after maximum retries. Last status code: ${lastStatus}`);
}

// Lightweight chunk summarizer with semantic caching and graceful degradation
async function summarizeChunk(chunk: string, index: number, total: number, apiKey: string, language: string): Promise<string> {
  try {
    // 1. Check persistent cache for this exact semantic chunk to prevent redundant API calls
    const cached = await getCachedAIResult(chunk, 'chunk-summary', language);
    if (cached) {
      console.log(`[AI Chunk Cache Hit] Instantly returning cached summary for chunk ${index + 1}/${total}.`);
      return cached;
    }

    const keyPreview = apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : 'undefined';
    console.log(`[AI summarizeChunk] Calling ZenMux for chunk ${index + 1}/${total} with key: ${keyPreview}, Length: ${apiKey?.length}`);
    
    // 2. Fetch with backoff retry
    const response = await fetchWithRetry(ZENMUX_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: FAST_CHAT_MODEL,
        messages: [
          { role: "system", content: `You are Neuri AI. Summarize the following text for a study guide. Capture all critical information, terms, formulas, and concepts in high-density, highly compact bullet points. Retain all technical details but omit conversational filler. Respond in ${language}.` },
          { role: "user", content: chunk.slice(0, 12000) }
        ],
        max_tokens: 600,
        temperature: 0.1
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI Chunk Error] Attempt failed with status: ${response.status}. Body: ${errorText}`);
      return chunk.slice(0, 800); // Graceful degradation fallback
    }
    
    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || chunk.slice(0, 800);
    
    // 3. Cache the successful chunk summary for future uploads
    if (summary && summary.trim().length > 50) {
      await setCachedAIResult(chunk, 'chunk-summary', language, summary);
    }
    
    return summary;
  } catch (e) {
    console.error(`[AI Chunk Exception] Failed for chunk ${index + 1}/${total}:`, e);
    return chunk.slice(0, 800); // Graceful degradation fallback
  }
}

export async function POST(req: NextRequest) {
  try {
    const keyPreview = ZENMUX_API_KEY 
      ? `${ZENMUX_API_KEY.slice(0, 6)}...${ZENMUX_API_KEY.slice(-4)}` 
      : 'undefined';
    console.log(`[AI POST] Initializing request. Key Preview: ${keyPreview}, Length: ${ZENMUX_API_KEY?.length}`);

    if (!ZENMUX_API_KEY) {
      console.error("Missing ZENMUX_API_KEY");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const session = await getServerStudentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimit = checkRateLimit(session.auth_id, RateLimitTier.AI);
    if (!rateLimit.success) {
      return NextResponse.json({ 
        error: 'Daily limit reached. You can perform 10 AI actions per day.',
        reset: rateLimit.reset
      }, { status: 429 });
    }

    const { fileId, task, language = 'English', messages = [], difficulty = 'medium', numQuestions = 10 } = await req.json();

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
    let isImage = metadata.mimeType?.startsWith('image/');

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

    // 1. PERSISTENT CACHE LOOKUP (Only for core tasks to avoid chat collisions)
    const isCoreTask = task === 'summarize' || task === 'quiz' || task === 'translate';
    const shouldCache = isCoreTask && messages.length === 0 && fileContent.trim().length > 0;
    const cacheTaskKey = task === 'quiz' ? `${task}-${difficulty}-${numQuestions}` : task;

    if (shouldCache) {
      const cachedResult = await getCachedAIResult(fileContent, cacheTaskKey, language);
      if (cachedResult) {
        console.log(`[AI Cache Hit] Instantly returning cached result for ${cacheTaskKey} in ${language}.`);
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

    const currentModel = PRIMARY_AI_MODEL;

    // 2. HIERARCHICAL COMPRESSION & SEMANTIC CHUNKING WITH DYNAMIC TPM-SAFE SCHEDULING
    let contextualText = '';
    if (fileContent.trim().length > 0) {
      if (fileContent.length <= 6000) {
        contextualText = fileContent;
      } else {
        console.log(`[AI Pipeline] Activating Hierarchical Summarization for large document (${fileContent.length} chars).`);
        const chunkSize = 12000;
        const chunks: string[] = [];
        for (let i = 0; i < fileContent.length; i += chunkSize) {
          chunks.push(fileContent.substring(i, i + chunkSize));
        }
        
        // Define dynamic orchestration strategy parameters
        const MAX_CONCURRENT_CHUNKS = parseInt(process.env.MAX_CONCURRENT_CHUNKS || '2', 10);
        const totalChunks = Math.min(chunks.length, 6);
        const estimatedTokens = Math.floor(fileContent.length / 4);
        
        let concurrencyLimit = MAX_CONCURRENT_CHUNKS;
        let batchDelay = 1000; // Delay in milliseconds between batch schedules
        let strategy = "Parallel";
        
        // Adaptive Batching Orchestration Strategy
        if (totalChunks <= 2 || estimatedTokens <= 6000) {
          concurrencyLimit = 2;
          batchDelay = 0;
          strategy = "Parallel (Low Token / Safe)";
        } else if (totalChunks <= 4 || estimatedTokens <= 12000) {
          concurrencyLimit = 2;
          batchDelay = 1500;
          strategy = "Adaptive Concurrency (Medium PDF / Balanced)";
        } else {
          concurrencyLimit = 1;
          batchDelay = 2500;
          strategy = "Rolling Sequential (Huge PDF / Strict TPM Protection)";
        }
        
        console.log(`[AI Pipeline Strategy] Selecting Strategy: ${strategy} for ${totalChunks} chunks (Est. Tokens: ${estimatedTokens}). Concurrency Limit: ${concurrencyLimit}, Batch Throttle Delay: ${batchDelay}ms`);

        const chunkSummaries: string[] = new Array(totalChunks);
        const activePromises: Promise<void>[] = [];
        
        // Orchestrate chunk processing queue
        for (let i = 0; i < totalChunks; i++) {
          const chunkIndex = i;
          const chunkPromise = (async () => {
            // Apply defensive delay to chunks outside the initial concurrency window
            if (batchDelay > 0 && chunkIndex >= concurrencyLimit) {
              const throttlingDelay = Math.floor(chunkIndex / concurrencyLimit) * batchDelay;
              console.log(`[AI Pipeline Throttle] Delaying chunk ${chunkIndex + 1}/${totalChunks} by ${throttlingDelay}ms to prevent Groq TPM overflow.`);
              await new Promise(resolve => setTimeout(resolve, throttlingDelay));
            }
            
            const summary = await summarizeChunk(
              chunks[chunkIndex], 
              chunkIndex, 
              totalChunks, 
              ZENMUX_API_KEY,
              language
            );
            chunkSummaries[chunkIndex] = summary;
          })();
          
          activePromises.push(chunkPromise);
        }
        
        // Await all scheduled active chunk jobs to complete safely
        await Promise.all(activePromises);
        contextualText = chunkSummaries.join("\n\n");
      }
    }

    // 3. QUIZ GENERATION SEPARATED FROM FULL PDF CONTEXT
    if (task === 'quiz') {
      let quizContext = fileContent;
      if (fileContent.length > 6000) {
        const cachedSummary = await getCachedAIResult(fileContent, 'summarize', language);
        if (cachedSummary) {
          quizContext = cachedSummary;
          console.log(`[AI Quiz Context] Reusing compressed cached summary to generate quiz. Token efficiency: 100%.`);
        } else {
          quizContext = contextualText;
        }
      }

      console.log(`[AI POST - Quiz] Fetching ZenMux completions. Key Preview: ${ZENMUX_API_KEY ? `${ZENMUX_API_KEY.slice(0, 6)}...${ZENMUX_API_KEY.slice(-4)}` : 'undefined'}`);
      const response = await fetchWithRetry(ZENMUX_API_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ZENMUX_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: PRIMARY_AI_MODEL,
          messages: [
            { 
              role: "system", 
              content: `You are Neuri AI. Output a JSON array of exactly ${numQuestions} Multiple Choice Questions (MCQs) in ${language} at a "${difficulty}" difficulty level.
Schema: {"numb":number,"type":"Multiple Choice","question":"...","options":["...","...","...","..."],"answer":"...","explanation":"..."}.
The "answer" field MUST match one of the four options exactly.
Provide an informative "explanation" for why the answer is correct and why other options are incorrect.
Output ONLY a raw JSON array. Do not include markdown code blocks, backticks, or any conversational text.` 
            },
            { role: "user", content: `Context:\n${quizContext.slice(0, 12000)}\n\nGenerate the ${numQuestions} MCQs at "${difficulty}" difficulty.` }
          ],
          temperature: 0.2
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[AI POST - Quiz Error] HTTP status: ${response.status}. Body: ${errorText}`);
        return NextResponse.json({ error: `AI service failed: ${errorText}` }, { status: 502 });
      }

      const aiData = await response.json();
      let result = aiData.choices?.[0]?.message?.content;
      try {
        const cleaned = result.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        const finalQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);
        
        if (shouldCache && finalQuestions.length > 0) {
          await setCachedAIResult(fileContent, cacheTaskKey, language, finalQuestions);
        }
        return NextResponse.json({ result: finalQuestions });
      } catch (e) {
        console.error("Failed to parse quiz JSON:", e);
        return NextResponse.json({ error: "Failed to generate structured quiz." }, { status: 502 });
      }
    }

    // 4. SUMMARIZE & TRANSLATE TASKS
    // Permanent prompt compressed from ~900 tokens to under 120 tokens
    const systemPrompt = `You are Neuri AI. Respond in ${language}. Use $$...$$ for math. Separate sections with ---.${contextualText ? `\n\nContext:\n${contextualText}` : ''}`;

    const apiMessages: any[] = [
      { role: "system", content: systemPrompt }
    ];

    if (messages.length > 0) {
      apiMessages.push(...messages);
    } else {
      if (task === 'summarize') {
        apiMessages.push({
          role: "user",
          content: `You are an elite academic professor. Generate an exhaustive, high-density professional study guide based on the provided context.
Ensure the summary is highly detailed, educational, and structured as follows:

1. Executive Summary & Contextual Introduction
   - A detailed overview of the subject matter, historical/practical context, and its significance.
---
2. Deep-Dive Core Concepts & Theories
   - Comprehensive, hierarchically organized explanations of all key terms, ideas, and theories mentioned. Use bold terms and bullet points. Include step-by-step breakdowns of complex processes.
---
3. Technical Formulas, Equations & Data Tables
   - Provide a complete reference table of all formulas, equations, and key data points. Use LaTeX ($$...$$) for isolated equations and $...$ for inline terms. Explain each variable clearly.
---
4. Strategic Exam Preparation & Applied Practice
   - High-yield exam tips, common student misconceptions, and potential exam-style conceptual questions with explanations.
---
5. Key Takeaways & Synthesis
   - A final synthesis of the material, outlining the main conclusions and broader applications.

Important Guidelines:
- You must separate the 5 sections with exactly "---" on its own line.
- Do not summarize vaguely; include actual details, names, dates, rules, and mathematical relations.
- Keep the writing highly professional, clear, and dense with educational value.`
        });
      } else if (task === 'translate') {
        apiMessages.push({
          role: "user",
          content: `Translate and restructure the key points of the context into ${language}. Use structured bullet points, separate key sections using horizontal lines (---) on separate lines, and only include formulas in isolated block LaTeX ($$...$$).`
        });
      }
    }

    // Adaptive output token budgeting
    const dynamicMaxTokens = fileContent.length <= 6000 ? 1500 : 2500;

    console.log(`[AI POST - Summarize] Fetching ZenMux completions. Key Preview: ${ZENMUX_API_KEY ? `${ZENMUX_API_KEY.slice(0, 6)}...${ZENMUX_API_KEY.slice(-4)}` : 'undefined'}`);
    const response = await fetchWithRetry(ZENMUX_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ZENMUX_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: PRIMARY_AI_MODEL,
        messages: apiMessages,
        max_tokens: dynamicMaxTokens,
        temperature: 0.1,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AI POST - Summarize Error] HTTP status: ${response.status}. Body: ${errorText}`);
      return NextResponse.json({ error: `AI service failed: ${errorText}` }, { status: 502 });
    }

    // Clone the standard response body to process and cache background text asynchronously without blocking
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
              } catch (e) {}
            }
          }
          if (fullResponseText.trim().length > 100) {
            setCachedAIResult(fileContent, cacheTaskKey, language, fullResponseText);
          }
        } catch (cacheErr) {
          console.error('[AI Cache Stream Save Error]:', cacheErr);
        }
      }).catch(err => {
        console.error('[AI Cache Background Save Error]:', err);
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
    console.error('AI processing error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Failed to process AI request: ${errorMessage}` }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';