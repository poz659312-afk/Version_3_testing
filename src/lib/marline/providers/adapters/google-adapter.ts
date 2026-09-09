import { BaseProviderAdapter, fetchWithTimeout, sseChunk, sseDone, createThoughtFilter, stripThinking } from './base-adapter';
import { AIRequest, AIResponse, AIStreamResponse, ProviderId } from '../types';
import { getProviderSecrets, GOOGLE_MODELS, MARLINE_PROVIDERS } from '../config';

export class GoogleAdapter extends BaseProviderAdapter {
  readonly id: ProviderId = 'google';
  readonly defaultPriority = MARLINE_PROVIDERS.google.priority;

  getAvailableModels(): string[] {
    return [...GOOGLE_MODELS];
  }

  getDefaultModel(): string {
    return MARLINE_PROVIDERS.google.defaultModel;
  }

  isConfigured(): boolean {
    return getProviderSecrets().google.isConfigured;
  }

  private getApiKey(): string {
    const { apiKey } = getProviderSecrets().google;
    if (!apiKey) {
      throw new Error('Google AI Studio API key is not configured in environment (GOOGLE_AI_API_KEY or GEMINI_API_KEY).');
    }
    return apiKey;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const startTime = Date.now();
    const apiKey = this.getApiKey();
    const model = request.model || this.getDefaultModel();
    const maxTokens = request.maxTokens || MARLINE_PROVIDERS.google.defaultMaxTokens;

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
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      request.timeoutMs || 30000
    );

    if (!response.ok) {
      const errText = await response.text();
      throw this.classifyError(new Error(`Google AI Studio error (${response.status}): ${errText}`), response.status);
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
    const model = request.model || this.getDefaultModel();
    const maxTokens = request.maxTokens || MARLINE_PROVIDERS.google.defaultMaxTokens;

    const response = await fetchWithTimeout(
      'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
      request.timeoutMs || 25000
    );

    if (!response.ok || !response.body) {
      const errText = await response.text();
      throw this.classifyError(new Error(`Google AI Studio stream error (${response.status}): ${errText}`), response.status);
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
