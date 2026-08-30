import { NextRequest, NextResponse } from 'next/server';
import { getServerStudentSession } from '@/lib/auth-server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, RateLimitTier } from '@/lib/rate-limit';
import { google } from 'googleapis';
import pdf from 'pdf-parse';
import { getCachedAIResult, setCachedAIResult } from '@/lib/persistent-ai-cache';
import { normalizeQuizQuestionItem } from '@/lib/quiz-math-normalizer';

const pdfParse = pdf;

// Multi-tier Fallback Models (100% Free & Lightning Fast)
// TIER 1 (Default): Ultra-fast Groq Models with 131k context windows
const GROQ_MODELS = [
  "openai/gpt-oss-120b",
  "qwen/qwen3.6-27b",
  "openai/gpt-oss-20b"
];

// TIER 2 (Fallback): OpenRouter Nemotron & Free Models
const OPENROUTER_MODELS = [
  "nvidia/nemotron-3.5-lightning:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free"
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

    // 2. QUIZ GENERATION TASK (High-Yield Academic Assessment)
    if (task === 'quiz') {
      const quizSystemPrompt = `You are Marline AI, an elite academic exam creator and assessment specialist.
Language: ${language}.

Your mission: Generate a JSON object containing EXACTLY ${safeQuestionCount} Multiple Choice Questions grounded STRICTLY and EXCLUSIVELY in the provided document text.

JSON SCHEMA:
{
  "questions": [
    {
      "numb": 1,
      "type": "Multiple Choice",
      "question": "Direct academic question in ${language} with LaTeX math like $p_{ij}$",
      "table": "Optional GFM table or LaTeX array with reference dataset/matrix needed for this question, or null if not needed",
      "options": [
        "A) Short, crisp option (1-2 lines max, 15-20 words max)",
        "B) Short, crisp option (1-2 lines max, 15-20 words max)",
        "C) Short, crisp option (1-2 lines max, 15-20 words max)",
        "D) Short, crisp option (1-2 lines max, 15-20 words max)"
      ],
      "answer": "A) Exact string matching one of the 4 options above",
      "explanation": "Concise 1-2 sentence explanation of why this answer is correct based strictly on the document"
    }
  ]
}

CRITICAL ANTI-HALLUCINATION & STRICT GROUNDING RULES:
1. ZERO EXTERNAL INFORMATION: Every single question, option, answer, and explanation MUST be derived 100% directly from the provided text content. Do NOT use outside knowledge, external facts, or unmentioned topics.
2. NO FABRICATION OR SPECULATION: Do NOT invent formulas, dates, names, terms, or statistics that are not present in the document.
3. EXACT COUNT: You MUST generate EXACTLY ${safeQuestionCount} questions. Never fewer, never more.
4. STRICTLY 4 OPTIONS: Every question must have EXACTLY 4 options (A, B, C, D). NEVER generate 5 options (no E).
5. OPTION CONCISENESS (NO ESSAYS): Options MUST be short, crisp choices (maximum 15-20 words, 1-2 lines). NEVER write long multi-sentence paragraphs as options.
6. EXACT ANSWER MATCH: The "answer" field MUST be an exact character-for-character copy of one of the 4 option strings.
7. MATHEMATICAL FORMULAS (LaTeX): Enclose all mathematical notations, symbols ($P$, $\\pi$, $p_{ij}$), matrices, and formulas strictly inside single dollar signs $...$.
8. HIGH-YIELD RIGOR: Test conceptual understanding, definitions, derivations, and distinctions explicitly discussed in the source document.
9. NO META-REFERENCES IN QUESTIONS: NEVER use phrases like "According to the document", "As mentioned in the lecture", "Based on the text", "In the provided notes", "وفقاً للمستند", "بحسب المحاضرة", "المذكور في الملف", etc. Formulate every question directly, naturally, and academically (e.g., "What is the formula for MSE?", NEVER "According to the document, what is the formula for MSE?").
10. AUTHENTIC RAW REFERENCE TABLES FOR CALCULATIONS:
   - When creating questions that require calculation or data analysis (e.g., Data Mining Support/Confidence/Lift, Markov Chain Transition Matrices, Relational Database schemas, Truth Tables, Confusion Matrices):
     * You MUST place the COMPLETE RAW DATASET / TABLE in the "table" field (e.g., 4 to 6 transaction rows like "| TID | Items |" with transaction IDs and itemsets, or a mathematical matrix "\\begin{bmatrix} ... \\end{bmatrix}").
     * STRICT PROHIBITION: NEVER place the final answer, calculated metric (e.g. support percentage), or solution inside the reference table! The reference table is strictly the problem input data so the student calculates the answer themselves.
     * In the "explanation" field, provide the complete formula and step-by-step calculation (e.g., "Support({b, d}) = count({b, d}) / Total = 3 / 5 = 60%").
     * If a question does not require reference data or a matrix, set "table" to null.`;

      // Sample representative document content if oversized to ensure questions span the entire lecture
      let quizContext = sanitizedContext || metadata.name || 'Academic File';
      if (quizContext.length > 8000) {
        const head = quizContext.slice(0, 3500);
        const mid = quizContext.slice(Math.floor(quizContext.length / 2) - 1500, Math.floor(quizContext.length / 2) + 1500);
        const tail = quizContext.slice(-2000);
        quizContext = `${head}\n\n[... Section Break ...]\n\n${mid}\n\n[... Section Break ...]\n\n${tail}`;
      }

      const quizMessages = [
        { role: "system", content: quizSystemPrompt },
        { role: "user", content: `Source Document: "${metadata.name || 'Lecture Notes'}"\n\nContent:\n${quizContext}\n\nGenerate EXACTLY ${safeQuestionCount} high-yield MCQs in ${language}. Ground all questions, options, and answers 100% in this content only without adding any external topics. Output valid JSON.` }
      ];

      const QUIZ_GROQ_MODELS = [
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768"
      ];

      let lastError = "";

      // Tier 1: Ultra-fast Groq Models
      if (groqKey) {
        for (const model of QUIZ_GROQ_MODELS) {
          try {
            const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${groqKey}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: model,
                messages: quizMessages,
                response_format: { type: "json_object" },
                max_tokens: Math.min(320 * safeQuestionCount, 4000),
                temperature: 0.05
              })
            });

            if (res.ok) {
              const data = await res.json();
              const rawContent = data.choices?.[0]?.message?.content || "";
              const cleaned = rawContent.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              const finalQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

              if (finalQuestions.length > 0) {
                // Ensure proper numbering and LaTeX math normalization
                finalQuestions.forEach((q: any, idx: number) => { q.numb = idx + 1; });
                const normalizedQuestions = finalQuestions.map(normalizeQuizQuestionItem);
                await deductCredits();
                if (shouldCache) {
                  await setCachedAIResult(sanitizedContext, cacheTaskKey, language, normalizedQuestions);
                }
                return NextResponse.json({ result: normalizedQuestions }, {
                  headers: {
                    'X-AI-Credits-Remaining': Math.max(0, currentCredits - dynamicTokenCost).toString(),
                    'X-AI-Credits-Cost': dynamicTokenCost.toString(),
                    'X-AI-Tier': 'Tier 1',
                    'X-AI-Tier-Label': 'Premier Ultra Fast Tier'
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

      // Tier 2: OpenRouter Fallback
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
                messages: quizMessages,
                response_format: { type: "json_object" },
                max_tokens: Math.min(320 * safeQuestionCount, 4000),
                temperature: 0.05
              })
            });

            if (res.ok) {
              const data = await res.json();
              const rawContent = data.choices?.[0]?.message?.content || "";
              const cleaned = rawContent.replace(/```json|```/g, '').trim();
              const parsed = JSON.parse(cleaned);
              const finalQuestions = Array.isArray(parsed) ? parsed : (parsed.questions || []);

              if (finalQuestions.length > 0) {
                finalQuestions.forEach((q: any, idx: number) => { q.numb = idx + 1; });
                const normalizedQuestions = finalQuestions.map(normalizeQuizQuestionItem);
                await deductCredits();
                if (shouldCache) {
                  await setCachedAIResult(sanitizedContext, cacheTaskKey, language, normalizedQuestions);
                }
                return NextResponse.json({ result: normalizedQuestions }, {
                  headers: {
                    'X-AI-Credits-Remaining': Math.max(0, currentCredits - dynamicTokenCost).toString(),
                    'X-AI-Credits-Cost': dynamicTokenCost.toString(),
                    'X-AI-Tier': 'Tier 2',
                    'X-AI-Tier-Label': 'Secondary Extended Tier'
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

    // 3. SUMMARIZE, TRANSLATE & CHAT STREAMING TASKS (Orchestrated Architecture)
    const systemPrompt = `You are Marline AI, an elite university professor and academic study guide author.
    Language: ${language}.

    CRITICAL ANTI-HALLUCINATION & STRICT GROUNDING POLICY:
    - 100% GROUNDED IN SOURCE: Every definition, concept, explanation, formula, code block, and table in this study guide MUST be derived directly and exclusively from the provided document content.
    - ZERO EXTERNAL INVENTIONS: Do NOT fabricate, assume, or introduce external topics, unmentioned libraries, outside case studies, or extraneous tangents not found in the source material.
    - FACTUAL FIDELITY: Maintain strict precision to the exact methods, notations, equations, and topics presented in the text.

    CRITICAL FORMATTING & SYNTAX STANDARDS:
    1. GFM Tables (Keep Compact & Never Overly Wide):
       - Maximum 2 to 4 columns. NEVER create wide tables with massive paragraphs in cells.
       - Table cells must contain short, crisp summaries or keywords. For detailed multi-line explanations, use bullet lists outside the table instead.
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
    - 📌 **Executive Overview**: High-level synthesis of learning goals and core concepts found in the text.
    - 🧠 **Core Concepts & Definitions**: Key terminology and foundational definitions from the text.
    - 🔍 **Detailed Thematic Analysis**: In-depth explanations of every topic/methodology in the text with bullet points, code, and LaTeX where relevant.
    - ⚖️ **Comparison & Evaluation Table**: A clean, compact 2-4 column GFM table comparing methods/approaches found in the document.
    - ⚠️ **Key Pitfalls & Exam Traps**: Common misconceptions and edge cases specifically related to the material.
    - 💡 **Real-World Case Examples**: Practical implementation scenarios illustrating the document's concepts.
    - 🎯 **High-Yield Exam Review Questions**: 3 to 5 conceptual review questions with model answers based on the material.

    COMPLETENESS GUARANTEE:
    - You must write out every single section completely and thoroughly without stopping midway or omitting any lecture/chapter from the source document.
    - Do not truncate or abbreviate with "etc.". Output the complete study guide to the very end.
    - Output ONLY the clean, final academic study guide without any meta-commentary or thinking scratchpad.`;

    const { orchestrateDriveAI } = await import('@/lib/drive-ai-orchestrator');

    const { stream, tier, tierLabel, model } = await orchestrateDriveAI({
      task: (task || 'summarize') as any,
      language,
      systemPrompt,
      sanitizedContext,
      metadataName: metadata.name || 'Academic File',
      messages,
      groqKey,
      openRouterKey,
      onDeductCredits: deductCredits,
      currentCredits,
      dynamicTokenCost,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-AI-Credits-Remaining": Math.max(0, currentCredits - dynamicTokenCost).toString(),
        "X-AI-Credits-Cost": dynamicTokenCost.toString(),
        "X-AI-Tier": tier,
        "X-AI-Tier-Label": tierLabel,
        "X-AI-Model": model
      },
    });

  } catch (error) {
    console.error('[Marline Drive AI] Global error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: `Internal error: ${errorMessage}` }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
