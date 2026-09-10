import {
  AIProviderAdapter,
  AIRequest,
  AIResponse,
  AIStreamResponse,
  ProviderError,
  ProviderId,
} from './providers/types';
import { MARLINE_PROVIDERS, isLayerEnabled } from './providers/config';
import { providerHealthCache } from './providers/health-cache';
import { createAllAdapters } from './providers/adapters';

export interface RouteSelectionParams {
  task?: 'summarize' | 'translate' | 'chat' | 'quiz' | string;
  inputTokens: number;
  desiredOutputTokens: number;
  requiresStreaming?: boolean;
  requiresJsonMode?: boolean;
  preferredProvider?: ProviderId;
  /** Explicit list of provider layers to disable for testing (e.g. ['cerebras', 'groq']) */
  disabledLayers?: ProviderId[];
  /** Optional per-request boolean overrides for layer toggles */
  layerToggles?: Partial<Record<ProviderId, boolean>>;
}

export interface ScoredProvider {
  adapter: AIProviderAdapter;
  score: number;
  reasons: string[];
  eligible: boolean;
}

export class MarlineRouter {
  private adapters: Record<ProviderId, AIProviderAdapter>;

  constructor(adapters?: Record<ProviderId, AIProviderAdapter>) {
    this.adapters = adapters || createAllAdapters();
  }

  public getAdapter(id: ProviderId): AIProviderAdapter {
    const adapter = this.adapters[id];
    if (!adapter) {
      throw new Error(`Unknown provider: ${id}`);
    }
    return adapter;
  }

  /**
   * Deterministic scoring calculation for each provider.
   */
  public scoreProvider(id: ProviderId, params: RouteSelectionParams): ScoredProvider {
    const adapter = this.adapters[id];
    const meta = MARLINE_PROVIDERS[id];
    const health = providerHealthCache.getHealth(id);
    const reasons: string[] = [];
    let eligible = true;
    

    // 0. Manual Testing Toggle check (Code boolean / Env variable / Per-request toggle)
    const isGloballyActive = isLayerEnabled(id);
    const isExplicitlyDisabled =
      params.disabledLayers?.includes(id) ||
      (params.layerToggles && params.layerToggles[id] === false);

    if (!isGloballyActive || isExplicitlyDisabled) {

      let score = -9999;
      eligible = false;
      reasons.push('Disabled manually via Layer Toggle (testing mode)');
      return {
        adapter,
        score,
        reasons,
        eligible: false,
      };
    }

    // 1. Base score derived from default priority (Layer 1=100, Layer 2=85, Layer 3=70, Layer 4=55, Layer 5=40)
    let score = Math.max(10, 115 - meta.priority * 15);
    reasons.push(`Base priority ${meta.priority} (score ${score})`);

    // 2. Configuration check
    if (!adapter.isConfigured()) {
      score -= 1000;
      eligible = false;
      reasons.push('Not configured / missing API keys');
    }

    // 3. Health & Cooldown check
    if (!providerHealthCache.isAvailable(id)) {
      score -= 500;
      eligible = false;
      const cooldownSec = health.cooldownUntil
        ? Math.ceil((health.cooldownUntil - Date.now()) / 1000)
        : 0;
      reasons.push(`In active cooldown (${cooldownSec}s remaining, last error: ${health.lastCategory || 'unknown'})`);
    } else if (health.consecutiveFailures > 0) {
      const penalty = health.consecutiveFailures * 30;
      score -= penalty;
      reasons.push(`Recent failures penalty (-${penalty} pts)`);
    }

    // 4. Token Budget & TPM Limits
    const totalRequiredTokens = params.inputTokens + params.desiredOutputTokens + meta.safetyMargin;
    if (totalRequiredTokens > meta.tpmLimit) {
      // If request knowingly exceeds provider TPM limit
      score -= 200;
      reasons.push(`Exceeds TPM limit (${totalRequiredTokens} > ${meta.tpmLimit})`);
      // For Groq specifically, exceeding TPM is a strict rejection
      if (id === 'groq') {
        eligible = false;
      }
    } else {
      score += 20;
      reasons.push('Fits comfortably within token budget');
    }

    // 5. Capability check (JSON Object Mode)
    if (params.requiresJsonMode && !meta.supportsJsonMode) {
      score -= 300;
      eligible = false;
      reasons.push('Does not support JSON mode');
    }

    // 6. Capability check (Streaming)
    if (params.requiresStreaming && !meta.supportsStreaming) {
      score -= 300;
      eligible = false;
      reasons.push('Does not support streaming');
    }

    // 7. Preferred provider boost (e.g. for testing)
    if (params.preferredProvider === id) {
      score += 200;
      reasons.push('Explicitly preferred provider');
    }

    return {
      adapter,
      score,
      reasons,
      eligible,
    };
  }

  /**
   * Evaluates all providers and returns a prioritized list of viable candidates.
   */
  public selectProviderChain(params: RouteSelectionParams): AIProviderAdapter[] {
    const providerIds: ProviderId[] = ['cerebras', 'groq', 'google', 'openrouter', 'cloudflare'];
    const scored = providerIds.map((id) => this.scoreProvider(id, params));

    // Sort by eligibility first, then by descending score
    scored.sort((a, b) => {
      if (a.eligible !== b.eligible) {
        return a.eligible ? -1 : 1;
      }
      return b.score - a.score;
    });

    const viable = scored.filter((s) => s.eligible);
    if (viable.length > 0) {
      return viable.map((s) => s.adapter);
    }

    // If no provider is strictly eligible (e.g., all under cooldown or non-configured),
    // return all configured & non-disabled providers in score order as a last-ditch fallback
    return scored
      .filter((s) => {
        const id = s.adapter.id as ProviderId;
        const isGloballyActive = isLayerEnabled(id);
        const isExplicitlyDisabled =
          params.disabledLayers?.includes(id) ||
          (params.layerToggles && params.layerToggles[id] === false);
        return s.adapter.isConfigured() && isGloballyActive && !isExplicitlyDisabled;
      })
      .map((s) => s.adapter);
  }

  /**
   * Executes a streaming request with intelligent, transparent multi-layer fallback.
   */
  public async executeStreamWithFallback(
    request: AIRequest,
    params: RouteSelectionParams
  ): Promise<AIStreamResponse> {
    const chain = this.selectProviderChain(params);

    if (chain.length === 0) {
      throw new Error('No AI providers configured or available to fulfill request.');
    }

    console.log(
      `[Marline Router] Routing stream request (task: ${params.task}, in: ${params.inputTokens}, out: ${params.desiredOutputTokens}). Candidate chain: ${chain.map((c) => c.id).join(' -> ')}`
    );

    let lastError: ProviderError | Error | null = null;

    for (let i = 0; i < chain.length; i++) {
      const adapter = chain[i];
      const providerId = adapter.id;
      const isLast = i === chain.length - 1;

      try {
        console.log(`[Marline Router] Attempting Layer ${MARLINE_PROVIDERS[providerId].priority} (${providerId})...`);
        const streamResponse = await adapter.stream(request);
        providerHealthCache.recordSuccess(providerId);
        console.log(`[Marline Router] Layer ${MARLINE_PROVIDERS[providerId].priority} (${providerId}) stream initiated successfully.`);
        return streamResponse;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const classified: ProviderError =
          typeof adapter.classifyError === 'function'
            ? adapter.classifyError(err)
            : {
                provider: providerId,
                category: 'UNKNOWN',
                retryable: false,
                message: errorMsg,
              };

        providerHealthCache.recordFailure(providerId, classified.category, classified.message);
        lastError = classified;

        console.warn(
          `[Marline Router] Layer ${MARLINE_PROVIDERS[providerId].priority} (${providerId}) failed: [${classified.category}] ${classified.message}`
        );

        if (isLast) {
          console.error('[Marline Router] All providers in fallback chain exhausted.');
          break;
        }

        console.log(`[Marline Router] Falling back to next available provider: ${chain[i + 1].id}...`);
      }
    }

    throw lastError || new Error('All AI providers failed to generate stream response.');
  }

  /**
   * Executes a non-streaming request with intelligent multi-layer fallback.
   */
  public async executeGenerateWithFallback(
    request: AIRequest,
    params: RouteSelectionParams
  ): Promise<AIResponse> {
    const chain = this.selectProviderChain(params);

    if (chain.length === 0) {
      throw new Error('No AI providers configured or available to fulfill request.');
    }

    let lastError: ProviderError | Error | null = null;

    for (let i = 0; i < chain.length; i++) {
      const adapter = chain[i];
      const providerId = adapter.id;
      const isLast = i === chain.length - 1;

      try {
        const response = await adapter.generate(request);
        providerHealthCache.recordSuccess(providerId);
        return response;
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const classified: ProviderError =
          typeof adapter.classifyError === 'function'
            ? adapter.classifyError(err)
            : {
                provider: providerId,
                category: 'UNKNOWN',
                retryable: false,
                message: errorMsg,
              };

        providerHealthCache.recordFailure(providerId, classified.category, classified.message);
        lastError = classified;

        if (isLast) break;
      }
    }

    throw lastError || new Error('All AI providers failed to generate response.');
  }

  /**
   * Executes a request against a single specific provider WITHOUT fallback.
   * Dedicated for benchmarking and the developer test lab.
   */
  public async executeDirect(
    providerId: ProviderId,
    request: AIRequest
  ): Promise<AIResponse> {
    const adapter = this.getAdapter(providerId);
    return adapter.generate(request);
  }
}

// Global Singleton Router
export const marlineRouter = new MarlineRouter();
