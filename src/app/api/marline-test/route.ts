import { NextRequest, NextResponse } from 'next/server';
import { MARLINE_PROVIDERS } from '@/lib/marline/providers/config';
import { ProviderId, ProviderMetrics } from '@/lib/marline/providers/types';
import { marlineRouter } from '@/lib/marline/router';
import { providerHealthCache } from '@/lib/marline/providers/health-cache';
import { estimateTokens } from '@/lib/token-budget-manager';

const ALLOWED_PROVIDERS: ProviderId[] = ['cerebras', 'groq', 'google', 'openrouter', 'cloudflare'];

/**
 * GET: Returns sanitized metadata for all 5 providers (no secrets).
 */
export async function GET() {
  try {
    const providers = ALLOWED_PROVIDERS.map((id) => {
      const meta = MARLINE_PROVIDERS[id];
      const adapter = marlineRouter.getAdapter(id);
      const health = providerHealthCache.getHealth(id);
      return {
        id,
        name: meta.name,
        priority: meta.priority,
        models: meta.models,
        defaultModel: meta.defaultModel,
        isConfigured: adapter.isConfigured(),
        health: {
          healthy: health.healthy,
          cooldownRemainingSec: health.cooldownUntil
            ? Math.max(0, Math.ceil((health.cooldownUntil - Date.now()) / 1000))
            : 0,
          consecutiveFailures: health.consecutiveFailures,
          lastCategory: health.lastCategory,
        },
      };
    });

    return NextResponse.json({ providers });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST: Runs an isolated benchmark/test against a single provider WITHOUT fallback.
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const { providerId, model, prompt, outputSize = 'normal', stream = false } = body;

    // 1. Validation & Security Guards
    if (!providerId || !ALLOWED_PROVIDERS.includes(providerId)) {
      return NextResponse.json(
        { error: `Invalid provider ID. Must be one of: ${ALLOWED_PROVIDERS.join(', ')}` },
        { status: 400 }
      );
    }

    const meta = MARLINE_PROVIDERS[providerId as ProviderId];
    const selectedModel = model || meta.defaultModel;

    // Validate model against allowlist to prevent injection
    if (!meta.models.includes(selectedModel)) {
      return NextResponse.json(
        { error: `Model '${selectedModel}' is not allowed for provider '${providerId}'.` },
        { status: 400 }
      );
    }

    // Validate prompt length
    if (typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }
    if (prompt.length > 5000) {
      return NextResponse.json({ error: 'Prompt exceeds maximum length of 5,000 characters.' }, { status: 400 });
    }

    // Determine max tokens based on outputSize
    let maxTokens = 450;
    if (outputSize === 'short') maxTokens = 150;
    else if (outputSize === 'detailed') maxTokens = 900;

    const adapter = marlineRouter.getAdapter(providerId as ProviderId);

    if (!adapter.isConfigured()) {
      const metric: ProviderMetrics = {
        provider: providerId as ProviderId,
        model: selectedModel,
        ttftMs: 0,
        totalMs: Date.now() - startTime,
        inputTokens: estimateTokens(prompt),
        outputTokens: 0,
        tokensPerSec: 0,
        status: 'FAILED',
        error: {
          provider: providerId as ProviderId,
          category: 'AUTH_ERROR',
          retryable: false,
          message: `Provider ${providerId} is not configured in server environment.`,
        },
      };
      return NextResponse.json(metric);
    }

    const inputTokens = estimateTokens(prompt);
    const messages: Array<{ role: 'user'; content: string }> = [
      { role: 'user', content: prompt.trim() }
    ];

    // 2. STREAMING MODE
    if (stream) {
      const encoder = new TextEncoder();
      let ttftMs = 0;
      let outputText = '';

      try {
        const streamResponse = await adapter.stream({
          model: selectedModel,
          messages,
          maxTokens,
          temperature: 0.2,
        });

        const reader = streamResponse.stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const sseStream = new ReadableStream<Uint8Array>({
          async start(controller) {
            try {
              while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                if (value) {
                  if (ttftMs === 0) {
                    ttftMs = Date.now() - startTime;
                  }
                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split('\n');
                  buffer = lines.pop() || '';

                  for (const line of lines) {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('data: ') && !trimmed.includes('[DONE]')) {
                      try {
                        const parsed = JSON.parse(trimmed.slice(6));
                        const delta = parsed.choices?.[0]?.delta?.content || '';
                        if (delta) {
                          outputText += delta;
                          controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ type: 'chunk', text: delta })}\n\n`)
                          );
                        }
                      } catch {
                        // Ignore malformed json chunks
                      }
                    }
                  }
                }
              }

              const totalMs = Date.now() - startTime;
              const outputTokens = estimateTokens(outputText);
              const genDurationSec = Math.max((totalMs - ttftMs) / 1000, 0.05);
              const tokensPerSec = Math.round(outputTokens / genDurationSec);

              const metrics: ProviderMetrics = {
                provider: providerId as ProviderId,
                model: selectedModel,
                ttftMs: ttftMs || totalMs,
                totalMs,
                inputTokens,
                outputTokens,
                tokensPerSec,
                status: 'SUCCESS',
                contentSample: outputText.slice(0, 300),
              };

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'metrics', metrics })}\n\n`)
              );
              controller.enqueue(encoder.encode('data: [DONE]\n\n'));
              controller.close();
            } catch (err: unknown) {
              const classified = adapter.classifyError(err);
              const totalMs = Date.now() - startTime;
              const errorMetrics: ProviderMetrics = {
                provider: providerId as ProviderId,
                model: selectedModel,
                ttftMs: 0,
                totalMs,
                inputTokens,
                outputTokens: 0,
                tokensPerSec: 0,
                status: 'FAILED',
                error: classified,
              };
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ type: 'error', metrics: errorMetrics })}\n\n`)
              );
              controller.close();
            }
          },
          cancel() {
            reader.cancel();
          },
        });

        return new Response(sseStream, {
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',
          },
        });
      } catch (streamErr: unknown) {
        const classified = adapter.classifyError(streamErr);
        const metric: ProviderMetrics = {
          provider: providerId as ProviderId,
          model: selectedModel,
          ttftMs: 0,
          totalMs: Date.now() - startTime,
          inputTokens,
          outputTokens: 0,
          tokensPerSec: 0,
          status: 'FAILED',
          error: classified,
        };
        return NextResponse.json(metric);
      }
    }

    // 3. NON-STREAMING MODE
    try {
      const result = await adapter.generate({
        model: selectedModel,
        messages,
        maxTokens,
        temperature: 0.2,
      });

      const totalMs = Date.now() - startTime;
      const outputTokens = result.usage?.completionTokens || estimateTokens(result.content);
      const ttftMs = Math.round(totalMs * 0.4); // estimated TTFT for non-streaming
      const genDurationSec = Math.max(totalMs / 1000, 0.05);
      const tokensPerSec = Math.round(outputTokens / genDurationSec);

      const metric: ProviderMetrics = {
        provider: providerId as ProviderId,
        model: selectedModel,
        ttftMs,
        totalMs,
        inputTokens: result.usage?.promptTokens || inputTokens,
        outputTokens,
        tokensPerSec,
        status: 'SUCCESS',
        contentSample: result.content,
      };

      return NextResponse.json(metric);
    } catch (genErr: unknown) {
      const classified = adapter.classifyError(genErr);
      const metric: ProviderMetrics = {
        provider: providerId as ProviderId,
        model: selectedModel,
        ttftMs: 0,
        totalMs: Date.now() - startTime,
        inputTokens,
        outputTokens: 0,
        tokensPerSec: 0,
        status: 'FAILED',
        error: classified,
      };

      return NextResponse.json(metric);
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal test endpoint error';
    return NextResponse.json(
      {
        error: errorMsg,
        status: 'FAILED',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
