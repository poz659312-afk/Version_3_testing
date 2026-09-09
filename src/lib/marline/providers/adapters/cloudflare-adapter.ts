import { BaseProviderAdapter, fetchWithTimeout, sseChunk, sseDone, createThoughtFilter, stripThinking } from './base-adapter';
import { AIRequest, AIResponse, AIStreamResponse, ProviderId } from '../types';
import { CLOUDFLARE_MODELS, getProviderSecrets, MARLINE_PROVIDERS } from '../config';

export class CloudflareAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = 'cloudflare';
  readonly defaultPriority = MARLINE_PROVIDERS.cloudflare.priority;

  getAvailableModels(): string[] {
    return [...CLOUDFLARE_MODELS];
  }

  getDefaultModel(): string {
    return MARLINE_PROVIDERS.cloudflare.defaultModel;
  }

  isConfigured(): boolean {
    const { apiKey, accountId } = getProviderSecrets().cloudflare;
    return !!apiKey && !!accountId;
  }

  private getCredentials(): { apiKey: string; accountId: string } {
    const { apiKey, accountId } = getProviderSecrets().cloudflare;
    if (!apiKey) {
      throw new Error('Cloudflare API key is not configured in environment (CLOUDFLARE_API_KEY or CLOUDFLARE_API_TOKEN).');
    }
    if (!accountId) {
      throw new Error('Cloudflare Account ID is not configured (CLOUDFLARE_ACCOUNT_ID). Workers AI REST API requires an account ID.');
    }
    return { apiKey, accountId };
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const { apiKey, accountId } = this.getCredentials();
    const model = request.model || this.getDefaultModel();
    const maxTokens = request.maxTokens || MARLINE_PROVIDERS.cloudflare.defaultMaxTokens;

    const body = {
      messages: request.messages,
      stream: false,
      max_tokens: maxTokens,
    };

    const response = await fetchWithTimeout(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      request.timeoutMs || 25000
    );

    if (!response.ok) {
      const errText = await response.text();
      throw this.classifyError(new Error(`Cloudflare error (${response.status}): ${errText}`), response.status);
    }

    const data = await response.json();
    const rawContent = data.result?.response || (typeof data.result === 'string' ? data.result : '');
    const content = stripThinking(rawContent);

    return {
      provider: this.id,
      model,
      content,
      finishReason: 'stop',
      durationMs: Date.now() - startTime,
    };
  }

  async stream(request: AIRequest): Promise<AIStreamResponse> {
    const startTime = Date.now();
    const { apiKey, accountId } = this.getCredentials();
    const model = request.model || this.getDefaultModel();
    const maxTokens = request.maxTokens || MARLINE_PROVIDERS.cloudflare.defaultMaxTokens;

    const response = await fetchWithTimeout(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: request.messages,
          stream: true,
          max_tokens: maxTokens,
        }),
      },
      request.timeoutMs || 20000
    );

    if (!response.ok || !response.body) {
      const errText = await response.text();
      throw this.classifyError(new Error(`Cloudflare stream error (${response.status}): ${errText}`), response.status);
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
                    // Cloudflare stream chunk format: { response: "text" }
                    const chunkText = parsed.response || '';
                    if (chunkText) {
                      thoughtFilter.push(chunkText);
                    }
                  } catch {
                    // Ignore JSON parsing errors for malformed stream lines
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
