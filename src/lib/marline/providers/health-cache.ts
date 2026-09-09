import { ProviderErrorCategory, ProviderHealth, ProviderId } from './types';

class ProviderHealthCache {
  private health: Map<ProviderId, ProviderHealth> = new Map();

  constructor() {
    const providers: ProviderId[] = ['cerebras', 'groq', 'google', 'openrouter', 'cloudflare'];
    for (const p of providers) {
      this.health.set(p, {
        provider: p,
        healthy: true,
        consecutiveFailures: 0,
        lastFailureAt: null,
        cooldownUntil: null,
      });
    }
  }

  public isAvailable(provider: ProviderId): boolean {
    const entry = this.health.get(provider);
    if (!entry) return true;
    if (entry.cooldownUntil && Date.now() < entry.cooldownUntil) {
      return false;
    }
    return true;
  }

  public recordSuccess(provider: ProviderId): void {
    const entry = this.health.get(provider);
    if (entry) {
      entry.healthy = true;
      entry.consecutiveFailures = 0;
      entry.cooldownUntil = null;
      entry.lastCategory = undefined;
      entry.lastErrorMessage = undefined;
    }
  }

  public recordFailure(
    provider: ProviderId,
    category: ProviderErrorCategory,
    error?: unknown
  ): void {
    const entry = this.health.get(provider) || {
      provider,
      healthy: true,
      consecutiveFailures: 0,
      lastFailureAt: null,
      cooldownUntil: null,
    };

    entry.consecutiveFailures += 1;
    entry.lastFailureAt = Date.now();
    entry.lastCategory = category;
    entry.lastErrorMessage = error instanceof Error ? error.message : String(error);

    let cooldownMs = 15000; // default 15s

    switch (category) {
      case 'DAILY_QUOTA':
        // Cool down for 4 hours on daily quota
        cooldownMs = 4 * 60 * 60 * 1000;
        entry.healthy = false;
        break;
      case 'AUTH_ERROR':
        // Auth error usually needs manual intervention or account setup
        cooldownMs = 30 * 60 * 1000;
        entry.healthy = false;
        break;
      case 'RATE_LIMIT':
        // Backoff: 20s, 60s, 180s
        cooldownMs = Math.min(180000, 20000 * Math.pow(2, entry.consecutiveFailures - 1));
        break;
      case 'TIMEOUT':
      case 'SERVER_ERROR':
        cooldownMs = Math.min(60000, 10000 * entry.consecutiveFailures);
        break;
      default:
        cooldownMs = 15000;
        break;
    }

    entry.cooldownUntil = Date.now() + cooldownMs;
    this.health.set(provider, entry);

    console.warn(
      `[Marline Health Cache] Provider ${provider} cooldown for ${(cooldownMs / 1000).toFixed(0)}s (Reason: ${category}, Failures: ${entry.consecutiveFailures})`
    );
  }

  public getHealth(provider: ProviderId): ProviderHealth {
    const entry = this.health.get(provider);
    if (!entry) {
      return {
        provider,
        healthy: true,
        consecutiveFailures: 0,
        lastFailureAt: null,
        cooldownUntil: null,
      };
    }
    const isUnderCooldown = !!entry.cooldownUntil && Date.now() < entry.cooldownUntil;
    return {
      ...entry,
      healthy: entry.healthy && !isUnderCooldown,
    };
  }

  public getAllHealth(): Record<ProviderId, ProviderHealth> {
    const result = {} as Record<ProviderId, ProviderHealth>;
    for (const p of Array.from(this.health.keys())) {
      result[p] = this.getHealth(p);
    }
    return result;
  }


  public resetCooldown(provider: ProviderId): void {
    const entry = this.health.get(provider);
    if (entry) {
      entry.cooldownUntil = null;
      entry.consecutiveFailures = 0;
      entry.healthy = true;
    }
  }
}

// Global in-memory instance
export const providerHealthCache = new ProviderHealthCache();
