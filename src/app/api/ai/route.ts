import { NextRequest, NextResponse } from 'next/server';
import { getServerStudentSession } from '@/lib/auth-server';
import { checkRateLimit, RateLimitTier } from '@/lib/rate-limit';
import { google } from 'googleapis';
import pdf from 'pdf-parse';
import { getCachedAIResult, setCachedAIResult } from '@/lib/persistent-ai-cache';

const pdfParse = pdf;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Production scale lightweight inference models
const PRIMARY_AI_MODEL = "llama-3.1-8b-instant";
const FAST_CHAT_MODEL = "llama-3.1-8b-instant";

// Helper function to handle fetch retries with exponential backoff for high concurrency
async function fetchWithRetry(url: string, options: any, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      
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
  throw new Error("Failed after maximum retries");
}

// Lightweight parallel chunk summarizer
async function summarizeChunk(chunk: string, index: number, total: number, apiKey: string): Promise<string> {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: FAST_CHAT_MODEL,
        messages: [
          { role: "system", content: "Summarize academic content concisely. Capture key formulas, definitions, and equations in brief bullets. Output strictly in the document language." },
          { role: "user", content: `Part ${index + 1} of ${total}:\n${chunk.slice(0, 12000)}` }
        ],
        max_tokens: 350,
        temperature: 0.1
      })
    });
    if (!response.ok) return chunk.slice(0, 800);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || chunk.slice(0, 800);
  } catch (e) {
    return chunk.slice(0, 800);
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!OPENROUTER_API_KEY) {
      console.error("Missing OPENROUTER_API_KEY environment variable");
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

    if (shouldCache) {
      const cachedResult = await getCachedAIResult(fileContent, task, language);
      if (cachedResult) {
        console.log(`[AI Cache Hit] Instantly returning cached result for ${task} in ${language}.`);
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

    // 2. HIERARCHICAL COMPRESSION & SEMANTIC CHUNKING
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
        
        // Summarize only up to the first 6 chunks in parallel to remain fully safe
        const chunkSummaries = await Promise.all(
          chunks.slice(0, 6).map((chunk, idx) => 
            summarizeChunk(chunk, idx, Math.min(chunks.length, 6), OPENROUTER_API_KEY || '')
          )
        );
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

      const response = await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: currentModel,
          messages: [
            { 
              role: "system", 
              content: `You are Neuri, an elite university academic exam generator. 
Output strictly a valid JSON array of 5 to 10 multiple-choice questions.
Respond strictly in ${language}.
Each question object MUST strictly follow this JSON schema:
{
  "numb": number,
  "type": "Multiple Choice",
  "question": "string",
  "options": ["string", "string", "string", "string"],
  "answer": "string",
  "explanation": "string"
}
CRITICAL RULES:
1. The "answer" property MUST be a string that matches EXACTLY and LITERALLY one of the 4 strings inside the "options" array.
2. The "options" array MUST contain exactly 4 unique choices.
3. The distractors (wrong choices) must be highly professional, realistic, and smart. Do not use repetitive words or lazy structures.
4. Output ONLY the raw JSON array. Do not include markdown wraps, conversational filler, or code blocks in your response.` 
            },
            { role: "user", content: `Context:\n${quizContext.slice(0, 10000)}\n\nGenerate structured multiple-choice quiz questions based strictly on the academic context above.` }
          ],
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json({ error: `AI service failed: ${errorText}` }, { status: 502 });
      }

      const aiData = await response.json();
      let result = aiData.choices?.[0]?.message?.content;
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

    // 4. SUMMARIZE & TRANSLATE TASKS
    // Permanent prompt compressed from ~900 tokens to under 120 tokens
    const systemPrompt = `You are Neuri, an elite university academic assistant. Transliteration: Name is "نيوري" or "نيوري AI" in Arabic. Never use other forms.
Respond strictly in ${language}. Ground answers strictly in the context. Format mathematical equations strictly in Display LaTeX blocks ($$...$$) on empty, separate lines. Do not use inline math. Write fractions professionally using vertical block LaTeX (\\frac{num}{den}) instead of slashes (/), and multiplication using (\\cdot) instead of asterisks (*). Separate all main sections with horizontal divider lines (---) on a separate line.${contextualText ? `\n\nContext:\n${contextualText}` : ''}`;

    const apiMessages = [
      { role: "system", content: systemPrompt }
    ];

    if (messages.length > 0) {
      apiMessages.push(...messages);
    } else {
      if (task === 'summarize') {
        apiMessages.push({
          role: "user",
          content: `You are an elite academic study-guide generator. Transform the academic context into a premium university-level study guide that outperforms typical AI summaries by balancing academic depth, clarity, compression efficiency, readability, and exam usefulness.

Structure & Constraints:
1. Introduction: Objective of the document.
---
2. Core Topics & Hierarchical Guide: Preserve ALL important concepts (definitions, core theories, assumptions, exceptions, advantages/disadvantages, comparisons, use cases, important examples, exam-critical details). Use an aggressive compression without losing meaning. Organize like premium lecture notes with a clear educational hierarchy (# Main Topic, ## Subtopic, ### Key Concept).
---
3. Formula Handling & High-Quality Comparisons: For every important mathematical formula/equation present, you MUST explain its variables, intuitive meaning, and when it is used. Write equations strictly on a separate empty line in Display LaTeX ($$...$$). If any concepts are related or comparable, generate concise and highly insightful comparison tables (e.g. | Method | Advantages | Disadvantages | Best Use Case |).
---
4. Exam-Oriented Enhancement & Visuals: For key topics, include why it matters, common confusion points, and typical exam traps/confusion points. Draw a visual Mermaid.js diagram/flowchart ONLY if the text describes a process, flow, or system architecture where a diagram genuinely improves conceptual understanding. Otherwise, do not draw one.
---
5. Key Takeaways: Vital insights.

CRITICAL REQUIREMENT: You MUST strictly write "---" on its own separate empty line to separate each of the sections above. Do not skip the "---" separator lines under any circumstance.`
        });
      } else if (task === 'translate') {
        apiMessages.push({
          role: "user",
          content: `Translate and restructure the key points of the context into ${language}. Use structured bullet points, separate key sections using horizontal lines (---) on separate lines, and only include equations in isolated block LaTeX ($$...$$) or diagrams in Mermaid.js if they are explicitly present in the source context.`
        });
      }
    }

    // Adaptive output token budgeting
    const dynamicMaxTokens = fileContent.length <= 6000 ? 1200 : 1800;

    const response = await fetchWithRetry("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: currentModel,
        messages: apiMessages,
        max_tokens: dynamicMaxTokens,
        temperature: 0.1,
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
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
            setCachedAIResult(fileContent, task, language, fullResponseText);
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
    return NextResponse.json({ error: 'Failed to process AI request' }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
