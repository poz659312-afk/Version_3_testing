import { estimateTokens, calculateGroqBudget } from "./token-budget-manager";
import { chunkDocumentSemantically, DocumentChunk } from "./semantic-chunker";
import {
  CEREBRAS_MODELS,
  GROQ_MODELS,
  GOOGLE_MODELS,
  SAMBANOVA_MODELS,
  OPENROUTER_MODELS,
  CLOUDFLARE_MODELS,
  getProviderLayerInfo,
} from "./marline/providers/config";
import { marlineRouter } from "./marline/router";
import { ProviderId } from "./marline/providers/types";

// Re-export model lists for existing callers and backward compatibility
export {
  CEREBRAS_MODELS,
  GROQ_MODELS,
  GOOGLE_MODELS,
  SAMBANOVA_MODELS,
  OPENROUTER_MODELS,
  CLOUDFLARE_MODELS,
};


export interface OrchestratorResult {
  stream: ReadableStream<Uint8Array>;
  tier: string;
  tierLabel: string;
  model: string;
  provider?: ProviderId;
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
  provider: string;
  model: string;
  input_tokens: number;
  actual_output_budget: number;
  routing_decision: string;
  chunk_count: number;
  duration_ms: number;
  status: 'success' | 'fallback' | 'failed';
}

function logMetric(metric: PerformanceMetric) {
  console.log(`[Marline AI Observability] ${JSON.stringify(metric)}`);
}

/**
 * Concurrency limiter to process document chunks with controlled parallelism.
 */
const MAX_CONCURRENT_CHUNKS = 2;

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const idx = currentIndex++;
      results[idx] = await fn(items[idx], idx);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

/**
 * Performs chunked summarization on large documents using the multi-layer router
 * followed by a live-streamed Final Synthesis.
 */
async function executeChunkedSummarization(
  options: OrchestratorOptions,
  chunks: DocumentChunk[]
): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const { language, systemPrompt, metadataName, onDeductCredits } = options;

  console.log(`[Marline Drive AI] Processing ${chunks.length} chunks with concurrency limit ${MAX_CONCURRENT_CHUNKS}...`);

  // Step 1: Process chunks with concurrency limiter
  const chunkSummaries = await mapWithConcurrency(chunks, MAX_CONCURRENT_CHUNKS, async (chunk) => {
    const chunkInputTokens = estimateTokens(chunk.text) + 200;
    const chunkMessages: Array<{ role: 'system' | 'user'; content: string }> = [
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

    const response = await marlineRouter.executeGenerateWithFallback(
      {
        messages: chunkMessages,
        maxTokens: 1200,
        temperature: 0.2,
      },
      {
        task: 'summarize',
        inputTokens: chunkInputTokens,
        desiredOutputTokens: 1200,
      }
    );

    return { id: chunk.id, title: chunk.title, summary: response.content };
  });

  // Step 2: Final Synthesis via Router (Live Streaming)
  const combinedSummariesText = chunkSummaries
    .map((cs) => `### Section ${cs.id}: ${cs.title}\n${cs.summary}`)
    .join("\n\n---\n\n");

  const synthesisInputTokens = estimateTokens(combinedSummariesText) + estimateTokens(systemPrompt) + 300;
  const finalMessages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: `Document Name: ${metadataName}\n\nBelow are the structured chapter summaries derived strictly from the source document (${chunks.length} parts):\n\n${combinedSummariesText}\n\nPlease synthesize these into the final, complete, unified academic study guide in ${language}, strictly adhering to all formatting standards (Executive Overview, Core Concepts Table, Detailed Thematic Analysis covering all parts, Key Pitfalls, and Exam Review Questions). Ground every section 100% in these provided summaries without introducing any external topics or outside facts.`
    }
  ];

  const synthesisStreamResponse = await marlineRouter.executeStreamWithFallback(
    {
      messages: finalMessages,
      maxTokens: 3400,
      temperature: 0.1,
    },
    {
      task: 'summarize',
      inputTokens: synthesisInputTokens,
      desiredOutputTokens: 3400,
      requiresStreaming: true,
    }
  );

  // Wrap stream with credit deduction hook
  const rawReader = synthesisStreamResponse.stream.getReader();
  let hasDeducted = false;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await rawReader.read();
        if (done) {
          controller.close();
          if (!hasDeducted) {
            hasDeducted = true;
            await onDeductCredits().catch((e) => console.warn("Credit deduction error:", e));
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
      rawReader.cancel();
    },
  });

  const { tier, tierLabel } = getProviderLayerInfo(synthesisStreamResponse.provider);

  logMetric({
    task: options.task,
    provider: synthesisStreamResponse.provider,
    model: synthesisStreamResponse.model,
    input_tokens: estimateTokens(options.sanitizedContext),
    actual_output_budget: 3400,
    routing_decision: 'chunked_synthesis',
    chunk_count: chunks.length,
    duration_ms: Date.now() - startTime,
    status: 'success',
  });

  return {
    stream,
    tier,
    tierLabel,
    model: synthesisStreamResponse.model,
    provider: synthesisStreamResponse.provider,
  };
}

/**
 * Master Performance-First Drive AI Orchestrator with 5-Provider Multi-Layer Router.
 * Automatically routes across Cerebras, Groq, SambaNova, OpenRouter, and Cloudflare Workers AI.
 */
export async function orchestrateDriveAI(options: OrchestratorOptions): Promise<OrchestratorResult> {
  const startTime = Date.now();
  const { systemPrompt, sanitizedContext, metadataName, language, task, messages, onDeductCredits } = options;

  const apiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
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
    for (const msg of recentMessages) {
      const role = (msg.role === 'assistant' ? 'assistant' : 'user') as 'system' | 'user' | 'assistant';
      apiMessages.push({ role, content: msg.content });
    }
  }

  const sanitizedApiMessages = apiMessages
    .filter((m) => m && typeof m.content === 'string' && m.content.trim().length > 0)
    .map((m) => ({ role: m.role || 'user', content: m.content.trim() }));

  const totalInputTokens = estimateTokens(JSON.stringify(sanitizedApiMessages));
  const desiredOutputTokens = task === 'summarize' ? 3200 : (task === 'translate' ? 2200 : 1800);

  // ROUTE 1: Check if large document requires semantic chunking (> 5,400 tokens on summarize)
  const groqBudget = calculateGroqBudget({
    inputTokens: totalInputTokens,
    desiredOutputTokens,
    task,
  });

  if (task === 'summarize' && groqBudget.requiresChunking && sanitizedContext.length > 8000) {
    const chunks = chunkDocumentSemantically(sanitizedContext, {
      targetChunkTokens: 2800,
      maxChunkTokens: 3600,
    });

    if (chunks.length > 1) {
      console.log(`[Marline Drive AI] Document size (${totalInputTokens} tokens) requires semantic chunking into ${chunks.length} parts.`);
      return executeChunkedSummarization(options, chunks);
    }
  }

  // ROUTE 2: Direct Multi-Layer Streaming through Marline Router
  const streamResponse = await marlineRouter.executeStreamWithFallback(
    {
      messages: sanitizedApiMessages,
      maxTokens: desiredOutputTokens,
      temperature: 0.15,
    },
    {
      task,
      inputTokens: totalInputTokens,
      desiredOutputTokens,
      requiresStreaming: true,
    }
  );

  const rawReader = streamResponse.stream.getReader();
  let hasDeducted = false;

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { value, done } = await rawReader.read();
        if (done) {
          controller.close();
          if (!hasDeducted) {
            hasDeducted = true;
            await onDeductCredits().catch((e) => console.warn("Credit deduction error:", e));
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
      rawReader.cancel();
    },
  });

  const { tier, tierLabel } = getProviderLayerInfo(streamResponse.provider);

  logMetric({
    task,
    provider: streamResponse.provider,
    model: streamResponse.model,
    input_tokens: totalInputTokens,
    actual_output_budget: desiredOutputTokens,
    routing_decision: `direct_${streamResponse.provider}`,
    chunk_count: 1,
    duration_ms: Date.now() - startTime,
    status: 'success',
  });

  return {
    stream,
    tier,
    tierLabel,
    model: streamResponse.model,
    provider: streamResponse.provider,
  };
}
