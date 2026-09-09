/**
 * Common types and abstractions for the 5-Provider Marline AI Architecture.
 */

export type ProviderId = 'cerebras' | 'groq' | 'google' | 'openrouter' | 'cloudflare';
export type LegacyProviderId = ProviderId | 'sambanova';

export type ProviderErrorCategory =
  | 'RATE_LIMIT'
  | 'DAILY_QUOTA'
  | 'TOKEN_LIMIT'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'AUTH_ERROR'
  | 'MODEL_UNAVAILABLE'
  | 'BAD_REQUEST'
  | 'UNKNOWN';

export interface ProviderError {
  provider: ProviderId;
  category: ProviderErrorCategory;
  retryable: boolean;
  message: string;
  status?: number;
  raw?: unknown;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  responseFormat?: { type: 'json_object' | 'text' };
  timeoutMs?: number;
}

export interface AIResponse {
  provider: ProviderId;
  model: string;
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  durationMs: number;
}

export interface AIStreamResponse {
  provider: ProviderId;
  model: string;
  stream: ReadableStream<Uint8Array>;
  durationMs?: number;
}

export interface ProviderHealth {
  provider: ProviderId;
  healthy: boolean;
  consecutiveFailures: number;
  lastFailureAt: number | null;
  cooldownUntil: number | null;
  lastCategory?: ProviderErrorCategory;
  lastErrorMessage?: string;
}

export interface ProviderMetrics {
  provider: ProviderId;
  model: string;
  ttftMs: number;
  totalMs: number;
  inputTokens: number;
  outputTokens: number;
  tokensPerSec: number;
  status: 'SUCCESS' | 'FAILED';
  httpStatus?: number;
  error?: ProviderError;
  contentSample?: string;
}

export interface AIProviderAdapter {
  readonly id: ProviderId;
  readonly defaultPriority: number;

  getAvailableModels(): string[];
  getDefaultModel(): string;
  isConfigured(): boolean;

  generate(request: AIRequest): Promise<AIResponse>;
  stream(request: AIRequest): Promise<AIStreamResponse>;
  classifyError(error: unknown, status?: number): ProviderError;
}
