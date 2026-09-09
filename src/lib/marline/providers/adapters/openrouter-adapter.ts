import { BaseProviderAdapter, fetchWithTimeout, sseChunk, sseDone, createThoughtFilter, stripThinking } from './base-adapter';
import { AIRequest, AIResponse, AIStreamResponse, ProviderId } from '../types';
import { getProviderSecrets, MARLINE_PROVIDERS, OPENROUTER_MODELS } from '../config';

export class OpenRouterAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = 'openrouter';
  readonly defaultPriority = MARLINE_PROVIDERS.openrouter.priority;

  getAvailableModels(): string[] {
    return [...OPENROUTER_MODELS];
  }

  getDefaultModel(): string {
    return MARLINE_PROVIDERS.openrouter.defaultModel;
  }

  isConfigured(): boolean {
    return getProviderSecrets().openrouter.isConfigured;
  }

  private getApiKey(): string {
    const { apiKey } = getProviderSecrets().openrouter;
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured in environment (OPENROUTER_API_KEY).');
    }
    return apiKey;
  }

  /**
   * Enforces free-only models to protect against accidental paid routing.
   */
  private validateFreeModel(model: string): string {
    const isFree = model.endsWith(':free');
    if (!isFree) {
      console.warn(`[OpenRouter Adapter] Model ${model} is not a free-tier model. Enforcing free default: ${this.getDefaultModel()}`);
      return this.getDefaultModel();
    }
    return model;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();
    const model = this.validateFreeModel(request.model || this.getDefaultModel());
    const maxTokens = request.maxTokens || MARLINE_PROVIDERS.openrouter.defaultMaxTokens;

    const body: Record<string, unknown> = {
      model,
      messages: request.messages,
      stream: false,
      temperature: request.temperature ?? 0.2,
      max_tokens: maxTokens,
    };

    if (request.responseFormat?.type === 'json_object') {
      body.response_format = { type: 'json_object' };
    }

    const response = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://chameleon-nu.vercel.app',
          'X-Title': 'Marline AI',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      request.timeoutMs || 25000
    );

    if (!response.ok) {
      const errText = await response.text();
      throw this.classifyError(new Error(`OpenRouter error (${response.status}): ${errText}`), response.status);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    const content = stripThinking(message?.content || '');

    return {
      provider: this.id,
      model,
      content,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      finishReason: choice?.finish_reason,
      durationMs: Date.now() - startTime,
    };
  }

  async stream(request: AIRequest): Promise<AIStreamResponse> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();
    const model = this.validateFreeModel(request.model || this.getDefaultModel());
    const maxTokens = request.maxTokens || MARLINE_PROVIDERS.openrouter.defaultMaxTokens;

    const response = await fetchWithTimeout(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://chameleon-nu.vercel.app',
          'X-Title': 'Marline AI',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: request.messages,
          stream: true,
          temperature: request.temperature ?? 0.2,
          max_tokens: maxTokens,
        }),
      },
      request.timeoutMs || 20000
    );

    if (!response.ok || !response.body) {
      const errText = await response.text();
      throw this.classifyError(new Error(`OpenRouter stream error (${response.status}): ${errText}`), response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const thoughtFilter = createThoughtFilter((cleanChunk) => {
          controller.enqueue(sseChunk(cleanChunk));
        });

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            if (value) {
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ') && !trimmed.includes('[DONE]')) {
                  try {
                    const parsed = JSON.parse(trimmed.slice(6));
                    const delta = parsed.choices?.[0]?.delta;
                    // Strictly use content only. NEVER stream internal reasoning to the client!
                    const deltaContent = delta?.content || '';
                    if (deltaContent) {
                      thoughtFilter.push(deltaContent);
                    }
                  } catch {
                    // Ignore JSON parsing errors for non-data lines
                  }

                }
              }
            }
          }
          thoughtFilter.flush();
          controller.enqueue(sseDone());
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
      cancel() {
        reader.cancel();
      },
    });

    return {
      provider: this.id,
      model,
      stream,
      durationMs: Date.now() - startTime,
    };
  }
}
