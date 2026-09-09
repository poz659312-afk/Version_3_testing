import {
  AIProviderAdapter,
  AIRequest,
  AIResponse,
  AIStreamResponse,
  ProviderError,
  ProviderErrorCategory,
  ProviderId,
} from '../types';

export function sseChunk(content: string): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`);
}

export function sseDone(): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(`data: [DONE]\n\n`);
}

export interface ThoughtFilter {
  push(chunk: string): void;
  flush(): void;
}

/**
 * Creates a stream thought filter that strips <think>...</think> and <thought>...</thought>
 * tags and their enclosed thinking tokens even when split across chunk boundaries.
 */
export function createThoughtFilter(onContent: (cleanChunk: string) => void): ThoughtFilter {
  let inThink = false;
  let buffer = '';

  return {
    push(chunk: string) {
      buffer += chunk;
      while (buffer.length > 0) {
        if (!inThink) {
          const thinkStart = buffer.search(/<(?:think|thought)>/i);
          if (thinkStart !== -1) {
            if (thinkStart > 0) {
              onContent(buffer.slice(0, thinkStart));
            }
            const match = buffer.slice(thinkStart).match(/^<(?:think|thought)>/i);
            const matchLen = match ? match[0].length : 7;
            buffer = buffer.slice(thinkStart + matchLen);
            inThink = true;
          } else {
            const partialMatch = buffer.match(/<[a-z0-9_]*$/i);
            if (
              partialMatch &&
              ('<think>'.startsWith(partialMatch[0].toLowerCase()) ||
                '<thought>'.startsWith(partialMatch[0].toLowerCase()))
            ) {
              const safeLen = partialMatch.index ?? 0;
              if (safeLen > 0) {
                onContent(buffer.slice(0, safeLen));
                buffer = buffer.slice(safeLen);
              }
              break;
            } else {
              onContent(buffer);
              buffer = '';
            }
          }
        } else {
          const thinkEnd = buffer.search(/<\/(?:think|thought)>/i);
          if (thinkEnd !== -1) {
            const match = buffer.slice(thinkEnd).match(/^<\/(?:think|thought)>/i);
            const matchLen = match ? match[0].length : 8;
            buffer = buffer.slice(thinkEnd + matchLen);
            inThink = false;
          } else {
            const partialEnd = buffer.match(/<\/[a-z0-9_]*$/i);
            if (
              partialEnd &&
              ('</think>'.startsWith(partialEnd[0].toLowerCase()) ||
                '</thought>'.startsWith(partialEnd[0].toLowerCase()))
            ) {
              buffer = partialEnd[0];
            } else {
              buffer = '';
            }
            break;
          }
        }
      }
    },
    flush() {
      if (!inThink && buffer.length > 0) {
        onContent(buffer);
        buffer = '';
      }
    },
  };
}

/**
 * Strips internal thinking tags, reasoning blocks, and scratchpad prefixes
 * from completed responses.
 */
export function stripThinking(text?: string | null): string {
  if (!text || typeof text !== 'string') return text || '';
  let clean = text;

  // 1. Remove XML-like thinking/thought tags
  clean = clean.replace(/<think>[\s\S]*?<\/think>/gi, '');
  clean = clean.replace(/<thought>[\s\S]*?<\/thought>/gi, '');
  clean = clean.replace(/<think>[\s\S]*$/gi, '');
  clean = clean.replace(/<thought>[\s\S]*$/gi, '');

  // 2. Remove English meta-thinking / scratchpad text at the beginning
  clean = clean.replace(
    /^(?:Thinking Process:?|Thought Process:?|Internal Reasoning:?|We need to respond as|Let's craft|The user says|The user asks|The user wants)[\s\S]*?(?=[#\u0600-\u06FF]|\n\n)/i,
    ''
  );

  // 3. Remove markdown thinking block headers like **Thinking Process:**
  clean = clean.replace(
    /^\s*\*{1,2}(?:Thinking Process|Thought Process|Internal Reasoning)\*{1,2}:?[\s\S]*?(?:\n\n+|(?=[#\u0600-\u06FF]))/i,
    ''
  );

  return clean.trim();
}

export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = 20000
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err: unknown) {
    clearTimeout(id);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms`);
    }
    throw err;
  }
}

export abstract class BaseProviderAdapter implements AIProviderAdapter {
  abstract readonly id: ProviderId;
  abstract readonly defaultPriority: number;

  abstract getAvailableModels(): string[];
  abstract getDefaultModel(): string;
  abstract isConfigured(): boolean;

  abstract generate(request: AIRequest): Promise<AIResponse>;
  abstract stream(request: AIRequest): Promise<AIStreamResponse>;

  public classifyError(error: unknown, status?: number): ProviderError {
    if (error && typeof error === 'object' && 'category' in error && 'message' in error) {
      return error as ProviderError;
    }

    const message = error instanceof Error
      ? error.message
      : (typeof error === 'object' && error !== null && 'message' in error)
      ? String((error as Record<string, unknown>).message)
      : String(error);

    const lower = message.toLowerCase();

    let category: ProviderErrorCategory = 'UNKNOWN';
    let retryable = false;

    if (lower.includes('not configured') || lower.includes('missing api key') || lower.includes('account id is not configured')) {
      category = 'AUTH_ERROR';
      retryable = false;
    } else if (status === 429 || lower.includes('429') || lower.includes('rate limit') || lower.includes('too many requests')) {
      if (lower.includes('daily') || lower.includes('quota') || lower.includes('credit limit')) {
        category = 'DAILY_QUOTA';
        retryable = false;
      } else {
        category = 'RATE_LIMIT';
        retryable = true;
      }
    } else if (status === 402 || lower.includes('payment_method_required') || lower.includes('insufficient_quota') || lower.includes('payment required')) {
      category = 'AUTH_ERROR';
      retryable = false;
    } else if (status === 401 || status === 403 || lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('invalid api key')) {
      category = 'AUTH_ERROR';
      retryable = false;
    }
 else if (status === 404 || lower.includes('model_not_found') || lower.includes('does not exist') || lower.includes('invalid model')) {
      category = 'MODEL_UNAVAILABLE';
      retryable = false;
    } else if (status === 413 || lower.includes('context_length_exceeded') || lower.includes('tokens exceeds') || lower.includes('tpm limit')) {
      category = 'TOKEN_LIMIT';
      retryable = true;
    } else if (lower.includes('timed out') || lower.includes('timeout') || lower.includes('aborterror')) {
      category = 'TIMEOUT';
      retryable = true;
    } else if (status && status >= 500) {
      category = 'SERVER_ERROR';
      retryable = true;
    } else if (status === 400 || lower.includes('bad request')) {
      category = 'BAD_REQUEST';
      retryable = false;
    }

    return {
      provider: this.id,
      category,
      retryable,
      message,
      status,
      raw: error,
    };
  }
}
