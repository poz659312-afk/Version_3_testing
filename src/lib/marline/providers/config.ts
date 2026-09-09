import { ProviderId } from './types';

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  priority: number;
  layer: number;
  tier: string;
  tierLabel: string;
  models: string[];
  defaultModel: string;
  defaultMaxTokens: number;
  tpmLimit: number;
  safetyMargin: number;
  supportsStreaming: boolean;
  supportsJsonMode: boolean;
}

export const CEREBRAS_MODELS = [
  'gpt-oss-120b',
  'qwen-3.8-27b',
  'gemma-4-31b',
] as const;

export const GROQ_MODELS = [
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'groq/compound-mini',
  'groq/compound',
] as const;

export const GOOGLE_MODELS = [
  'gemini-2.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
] as const;

// Backward-compatible alias
export const SAMBANOVA_MODELS = GOOGLE_MODELS;

export const OPENROUTER_MODELS = [
  'nvidia/nemotron-3.5-lightning:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
  'nex-agi/nex-n2.5-mini:free',
  'liquid/lfm-2.5-2.6b:free',
  'google/gemma-4-31b-it:free',
] as const;

export const CLOUDFLARE_MODELS = [
  '@cf/qwen/qwen3.8-27b',
  '@cf/deepseek-ai/deepseek-v4-flash-0731',
  '@cf/openai/gpt-oss-120b',
  '@cf/openai/gpt-oss-20b',
  '@cf/google/gemma-3-12b-it',

] as const;

export const MARLINE_PROVIDERS: Record<ProviderId, ProviderMeta> = {
  cerebras: {
    id: 'cerebras',
    name: 'Cerebras Inference',
    priority: 1,
    layer: 1,
    tier: 'Layer 1',
    tierLabel: 'Premier Ultra Fast Tier (LAYER 1)',
    models: [...CEREBRAS_MODELS],
    defaultModel: 'gpt-oss-120b',
    defaultMaxTokens: 3200,
    tpmLimit: 60000,
    safetyMargin: 200,
    supportsStreaming: true,
    supportsJsonMode: true,
  },
  groq: {
    id: 'groq',
    name: 'Groq LPU',
    priority: 2,
    layer: 2,
    tier: 'Layer 2',
    tierLabel: 'Accelerated Ultra Fast Tier (LAYER 2)',
    models: [...GROQ_MODELS],
    defaultModel: 'openai/gpt-oss-120b',
    defaultMaxTokens: 3200,
    tpmLimit: 8000,
    safetyMargin: 250,
    supportsStreaming: true,
    supportsJsonMode: true,
  },
  google: {
    id: 'google',
    name: 'Google AI Studio',
    priority: 3,
    layer: 3,
    tier: 'Layer 3',
    tierLabel: 'Extended Deep Reasoning Tier (LAYER 3)',
    models: [...GOOGLE_MODELS],
    defaultModel: 'gemini-2.5-flash',
    defaultMaxTokens: 4000,
    tpmLimit: 1000000, // 1M tokens massive context
    safetyMargin: 200,
    supportsStreaming: true,
    supportsJsonMode: true,
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Free)',
    priority: 4,
    layer: 4,
    tier: 'Layer 4',
    tierLabel: 'Resilient Adaptive Tier (LAYER 4)',
    models: [...OPENROUTER_MODELS],
    defaultModel: 'nvidia/nemotron-3.5-lightning:free',
    defaultMaxTokens: 3200,
    tpmLimit: 40000,
    safetyMargin: 200,
    supportsStreaming: true,
    supportsJsonMode: true,
  },
  cloudflare: {
    id: 'cloudflare',
    name: 'Cloudflare Workers AI',
    priority: 5,
    layer: 5,
    tier: 'Layer 5',
    tierLabel: 'Global Edge Serverless Tier (LAYER 5)',
    models: [...CLOUDFLARE_MODELS],
    defaultModel: '@cf/qwen/qwen3.8-27b',
    defaultMaxTokens: 2048,
    tpmLimit: 30000,
    safetyMargin: 200,
    supportsStreaming: true,
    supportsJsonMode: false,
  },
};

/**
 * Returns canonical Layer details (layer number, tier ID, and human-facing tierLabel) for any provider.
 */
export function getProviderLayerInfo(provider?: string | ProviderId): {
  layer: number;
  tier: string;
  tierLabel: string;
} {
  const normalized = (provider || '').toLowerCase() as ProviderId;
  const meta = MARLINE_PROVIDERS[normalized] || (normalized === ('sambanova' as any) ? MARLINE_PROVIDERS.google : undefined);
  if (meta) {
    return {
      layer: meta.layer,
      tier: meta.tier,
      tierLabel: meta.tierLabel,
    };
  }
  return {
    layer: 1,
    tier: 'Layer 1',
    tierLabel: 'Premier Ultra Fast Tier (LAYER 1)',
  };
}

/**
 * Server-only helper to safely resolve provider credentials from process.env.
 * NEVER returns secrets to client payloads.
 */
export function getProviderSecrets() {
  return {
    cerebras: {
      apiKey: process.env.CEREBRAS_API_KEY || '',
      isConfigured: !!process.env.CEREBRAS_API_KEY,
    },
    groq: {
      apiKey: process.env.GROQ_API_KEY || '',
      isConfigured: !!process.env.GROQ_API_KEY,
    },
    google: {
      apiKey: process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '',
      isConfigured: !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY),
    },
    openrouter: {
      apiKey: process.env.OPENROUTER_API_KEY || '',
      isConfigured: !!process.env.OPENROUTER_API_KEY,
    },
    cloudflare: {
      apiKey: process.env.CLOUDFLARE_API_KEY || process.env.CLOUDFLARE_API_TOKEN || '',
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
      isConfigured: !!(process.env.CLOUDFLARE_API_KEY || process.env.CLOUDFLARE_API_TOKEN) && !!process.env.CLOUDFLARE_ACCOUNT_ID,
    },
  };
}

