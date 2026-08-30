import { calculateGroqBudget, estimateTokens, GROQ_TPM_LIMIT, GROQ_SAFETY_MARGIN } from "./token-budget-manager";
import { chunkDocumentSemantically, DocumentChunk } from "./semantic-chunker";

export const GROQ_MODELS = [
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant"
];

export const OPENROUTER_MODELS = [
  "nvidia/nemotron-3.5-lightning:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3-ultra-550b-a55b:free",
  "google/gemma-4-31b-it:free"
];

export interface OrchestratorResult {
  stream: ReadableStream<Uint8Array>;
  tier: 'Tier 1' | 'Tier 2';
  tierLabel: string;
  model: string;
}

export interface OrchestratorOptions {
  task: 'summarize' | 'translate' | 'chat';
  language: string;
  systemPrompt: string;
  sanitizedContext: string;
  metadataName: string;
  messages: Array<{ role: string; content: string }>;
  groqKey?: string;
  openRouterKey?: string;
  onDeductCredits: () => Promise<void>;
  currentCredits: number;
  dynamicTokenCost: number;
}

interface PerformanceMetric {
  task: string;
  model: string;
  input_tokens: number;
  actual_output_budget: number;
  routing_decision: 'direct_groq' | 'chunked_groq' | 'fallback_openrouter';
  chunk_count: number;
  duration_ms: number;
  status: 'success' | 'fallback' | 'failed';
}

/**
 * Logs privacy-safe, structured observability metrics without exposing user content.
 */
function logMetric(metric: PerformanceMetric) {
  console.log(`[Marline AI Observability] ${JSON.stringify(metric)}`);
}

/**
 * Creates an SSE formatted data chunk.
 */
function sseChunk(content: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
}

function sseDone(): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: [DONE]\n\n`);
}

/**
 * Executes an AI completion with timeout and error classification.
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 15000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Non-streaming LLM call helper for intermediate chunk summarization.
 */
async function callGroqNonStreaming(
  model: string,
  groqKey: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens: number
): Promise<string> {
  const response = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  }, 12000);

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq ${model} non-streaming call failed (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Performs chunked summarization on large documents using Groq for chunk analysis
 * followed by a live-streamed Final Synthesis via Groq.
 */
async function executeChunkedSummarization(
  options: OrchestratorOptions,
  chunks: DocumentChunk[]
): Promise<ReadableStream<Uint8Array>> {
  const startTime = Date.now();
  const { groqKey, openRouterKey, language, systemPrompt, metadataName, onDeductCredits } = options;

  if (!groqKey) {
    throw new Error("Groq API key required for chunked summarization");
  }

  const activeGroqModel = GROQ_MODELS[0];

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Step 1: Process chunks with concurrency limiter
        const chunkSummaries: Array<{ id: number; title: string; summary: string }> = [];

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkInputTokens = estimateTokens(chunk.text) + 200;
          const chunkMaxTokens = Math.min(1200, Math.max(600, GROQ_TPM_LIMIT - chunkInputTokens - GROQ_SAFETY_MARGIN));

          const chunkMessages = [
            {
              role: "system",
              content: `You are an expert academic analyst. Summarize Part ${chunk.id}/${chunks.length} ("${chunk.title}") of "${metadataName}".
Extract only the key concepts, definitions, formulas, and critical insights that are explicitly present in this specific part in ${language}.
Do NOT introduce any external information or ungrounded concepts.
Output clean structured bullet points and LaTeX formulas.`
            },
            {
              role: "user",
              content: `Document Part Content:\n${chunk.text}\n\nPlease provide a dense, strictly grounded academic summary of this part only.`
            }
          ];

          const summary = await callGroqNonStreaming(activeGroqModel, groqKey, chunkMessages, chunkMaxTokens);
          chunkSummaries.push({ id: chunk.id, title: chunk.title, summary });
        }

        // Step 2: Final Synthesis via Groq (Live Streaming)
        const combinedSummariesText = chunkSummaries
          .map((cs) => `### Section ${cs.id}: ${cs.title}\n${cs.summary}`)
          .join("\n\n---\n\n");

        const synthesisInputTokens = estimateTokens(combinedSummariesText) + estimateTokens(systemPrompt) + 300;
        const synthesisBudget = calculateGroqBudget({
          inputTokens: synthesisInputTokens,
          desiredOutputTokens: 3400,
          task: 'summarize',
        });

        const finalMessages = [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Document Name: ${metadataName}\n\nBelow are the structured chapter summaries derived strictly from the source document (${chunks.length} parts):\n\n${combinedSummariesText}\n\nPlease synthesize these into the final, complete, unified academic study guide in ${language}, strictly adhering to all formatting standards (Executive Overview, Core Concepts Table, Detailed Thematic Analysis covering all parts, Key Pitfalls, and Exam Review Questions). Ground every section 100% in these provided summaries without introducing any external topics or outside facts.`
          }
        ];

        const synthesisResponse = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: activeGroqModel,
            messages: finalMessages,
            stream: true,
            temperature: 0.1,
            max_tokens: synthesisBudget.actualMaxTokens,
          }),
        }, 15000);

        if (!synthesisResponse.ok || !synthesisResponse.body) {
          const errText = await synthesisResponse.text();
          throw new Error(`Synthesis failed (${synthesisResponse.status}): ${errText}`);
        }

        // Stream final synthesis tokens live to the user
        const reader = synthesisResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) {
            const chunkStr = decoder.decode(value, { stream: true });
            buffer += chunkStr;
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith("data: ") && !trimmed.includes("[DONE]")) {
                try {
                  const parsed = JSON.parse(trimmed.slice(6));
                  const delta = parsed.choices?.[0]?.delta;
                  const deltaContent = delta?.content ?? delta?.reasoning ?? "";
                  if (deltaContent) {
                    controller.enqueue(sseChunk(deltaContent));
                  }
                } catch (_) {}
              }
            }
          }
        }

        controller.enqueue(sseDone());
        controller.close();
        await onDeductCredits();

        logMetric({
          task: options.task,
          model: activeGroqModel,
          input_tokens: estimateTokens(options.sanitizedContext),
          actual_output_budget: synthesisBudget.actualMaxTokens,
          routing_decision: 'chunked_groq',
          chunk_count: chunks.length,
          duration_ms: Date.now() - startTime,
          status: 'success',
        });
      } catch (err: any) {
        console.warn("[Marline Drive AI] Chunked Groq failed, falling back to OpenRouter:", err.message);
        // Fallback to Tier 2 OpenRouter for complete doc
        if (openRouterKey) {
          try {
            const fallbackStream = await executeOpenRouterStream(options);
            const reader = fallbackStream.getReader();
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              if (value) controller.enqueue(value);
            }
            controller.close();
            await onDeductCredits();
          } catch (fbErr: any) {
            controller.error(fbErr);
          }
        } else {
          controller.error(err);
        }
      }
    }
  });
}

/**
 * Direct Live Stream from Tier 1 (Groq) with precise token budgeting.
 */
async function executeDirectGroqStream(
  options: OrchestratorOptions,
  apiMessages: Array<{ role: string; content: string }>,
  budgetedMaxTokens: number
): Promise<ReadableStream<Uint8Array>> {
  const startTime = Date.now();
  const { groqKey, onDeductCredits } = options;

  let lastErrorText = "";

  for (const model of GROQ_MODELS) {
    try {
      console.log(`[Marline Drive AI] Tier 1: Streaming with Groq ${model} (Budget: ${budgetedMaxTokens} tokens)`);
      const response = await fetchWithTimeout("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          stream: true,
          temperature: 0.1,
          max_tokens: budgetedMaxTokens,
        }),
      }, 12000);

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        const encoder = new TextEncoder();
        let hasDeducted = false;

        logMetric({
          task: options.task,
          model,
          input_tokens: estimateTokens(JSON.stringify(apiMessages)),
          actual_output_budget: budgetedMaxTokens,
          routing_decision: 'direct_groq',
          chunk_count: 1,
          duration_ms: Date.now() - startTime,
          status: 'success',
        });

        return new ReadableStream<Uint8Array>({
          async pull(controller) {
            try {
              const { value, done } = await reader.read();
              if (done) {
                controller.close();
                if (!hasDeducted) {
                  hasDeducted = true;
                  await onDeductCredits();
                }
              } else if (value) {
                if (!hasDeducted) {
                  hasDeducted = true;
                  onDeductCredits().catch((e) => console.warn("Credit deduction error:", e));
                }
                controller.enqueue(value);
              }
            } catch (err) {
              controller.error(err);
            }
          },
          cancel() {
            reader.cancel();
          },
        });
      } else {
        lastErrorText = await response.text();
        console.warn(`[Marline Drive AI] Groq ${model} rejected (${response.status}):`, lastErrorText);
      }
    } catch (err: any) {
      console.warn(`[Marline Drive AI] Groq ${model} exception:`, err.message);
      lastErrorText = err.message;
    }
  }

  throw new Error(`All Groq Tier 1 models failed: ${lastErrorText}`);
}

/**
 * Fallback Stream from Tier 2 (OpenRouter) with massive context and zero 8k TPM limit.
 */
async function executeOpenRouterStream(
  options: OrchestratorOptions
): Promise<ReadableStream<Uint8Array>> {
  const startTime = Date.now();
  const { openRouterKey, systemPrompt, sanitizedContext, metadataName, language, task, onDeductCredits } = options;

  if (!openRouterKey) {
    throw new Error("No OpenRouter API key configured for Tier 2 fallback");
  }

  const apiMessages = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Document Name: ${metadataName}\n\nDocument Text Content:\n${sanitizedContext}\n\nPlease generate the comprehensive university study guide in ${language}, fully written out without omitting any sections.`
    }
  ];

  let lastErrorText = "";

  for (const model of OPENROUTER_MODELS) {
    try {
      console.log(`[Marline Drive AI] Tier 2: Falling back to OpenRouter ${model}`);
      const response = await fetchWithTimeout("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://chameleon-nu.vercel.app",
          "X-Title": "Marline AI",
        },
        body: JSON.stringify({
          model,
          messages: apiMessages,
          stream: true,
          temperature: 0.1,
          max_tokens: task === 'summarize' ? 3600 : 1800,
        }),
      }, 15000);

      if (response.ok && response.body) {
        const reader = response.body.getReader();
        let hasDeducted = false;

        logMetric({
          task: options.task,
          model,
          input_tokens: estimateTokens(JSON.stringify(apiMessages)),
          actual_output_budget: 3600,
          routing_decision: 'fallback_openrouter',
          chunk_count: 1,
          duration_ms: Date.now() - startTime,
          status: 'fallback',
        });

        return new ReadableStream<Uint8Array>({
          async pull(controller) {
            try {
              const { value, done } = await reader.read();
              if (done) {
                controller.close();
                if (!hasDeducted) {
                  hasDeducted = true;
                  await onDeductCredits();
                }
              } else if (value) {
                if (!hasDeducted) {
                  hasDeducted = true;
                  onDeductCredits().catch((e) => console.warn("Credit deduction error:", e));
                }
                controller.enqueue(value);
              }
            } catch (err) {
              controller.error(err);
            }
          },
          cancel() {
            reader.cancel();
          },
        });
      } else {
        lastErrorText = await response.text();
        console.warn(`[Marline Drive AI] OpenRouter ${model} failed (${response.status}):`, lastErrorText);
      }
    } catch (err: any) {
      console.warn(`[Marline Drive AI] OpenRouter ${model} error:`, err.message);
      lastErrorText = err.message;
    }
  }

  throw new Error(`All OpenRouter Tier 2 models failed: ${lastErrorText}`);
}

/**
 * Master Performance-First Drive AI Orchestrator.
 * Dynamically routes to Direct Groq, Semantic Chunking, or OpenRouter fallback.
 */
export async function orchestrateDriveAI(options: OrchestratorOptions): Promise<OrchestratorResult> {
  const { groqKey, openRouterKey, systemPrompt, sanitizedContext, metadataName, language, task, messages } = options;

  const apiMessages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt }
  ];

  if (task === 'summarize') {
    apiMessages.push({
      role: "user",
      content: `Document Name: ${metadataName || 'Academic File'}\n\nDocument Text Content:\n${sanitizedContext}\n\nPlease generate a comprehensive, in-depth, and beautifully formatted university study guide for this document in ${language}, following the fixed structure and formatting rules exactly. Every section and every table must be fully written out and complete. Start immediately with the title and summary without any thinking scratchpads.`
    });
  } else if (task === 'translate') {
    apiMessages.push({
      role: "user",
      content: `Document Name: ${metadataName || 'Academic File'}\n\nDocument Text Content:\n${sanitizedContext}\n\nTranslate and structure the main points of this document into ${language} while preserving all technical accuracy, formatting, and depth.`
    });
  } else if (messages.length > 0) {
    if (sanitizedContext) {
      apiMessages.push({
        role: "user",
        content: `Document Context (${metadataName || 'File'}):\n${sanitizedContext}`
      });
      apiMessages.push({
        role: "assistant",
        content: `I have analyzed "${metadataName || 'this document'}". How can I assist you with it?`
      });
    }
    const recentMessages = messages.slice(-6);
    apiMessages.push(...recentMessages);
  }

  const sanitizedApiMessages = apiMessages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({ role: m.role || 'user', content: m.content.trim() }));

  const totalInputTokens = estimateTokens(JSON.stringify(sanitizedApiMessages));
  const budget = calculateGroqBudget({
    inputTokens: totalInputTokens,
    desiredOutputTokens: 3200,
    task,
  });

  // ROUTE 1: Direct Groq (Small to Medium documents <= 5,400 tokens)
  if (groqKey && budget.canUseGroqDirectly) {
    try {
      const stream = await executeDirectGroqStream(options, sanitizedApiMessages, budget.actualMaxTokens);
      return {
        stream,
        tier: 'Tier 1',
        tierLabel: 'Premier Ultra Fast Tier',
        model: GROQ_MODELS[0]
      };
    } catch (groqErr: any) {
      console.warn("[Marline Drive AI] Direct Groq failed, attempting OpenRouter fallback:", groqErr.message);
    }
  }

  // ROUTE 2: Large Document Semantic Chunking via Groq (Documents > 5,400 tokens)
  if (groqKey && task === 'summarize' && budget.requiresChunking) {
    try {
      const chunks = chunkDocumentSemantically(sanitizedContext, {
        targetChunkTokens: 2800,
        maxChunkTokens: 3600,
      });

      if (chunks.length > 1) {
        console.log(`[Marline Drive AI] Document size (${totalInputTokens} tokens) requires semantic chunking into ${chunks.length} parts.`);
        const stream = await executeChunkedSummarization(options, chunks);
        return {
          stream,
          tier: 'Tier 1',
          tierLabel: 'Premier Ultra Fast Tier',
          model: GROQ_MODELS[0]
        };
      }
    } catch (chunkErr: any) {
      console.warn("[Marline Drive AI] Chunked Groq failed, falling back to OpenRouter:", chunkErr.message);
    }
  }

  // ROUTE 3: OpenRouter Tier 2 Fallback (128k context, zero TPM limits)
  if (openRouterKey) {
    const stream = await executeOpenRouterStream(options);
    return {
      stream,
      tier: 'Tier 2',
      tierLabel: 'Secondary Extended Tier',
      model: OPENROUTER_MODELS[0]
    };
  }

  throw new Error("No AI providers available to fulfill request");
}
