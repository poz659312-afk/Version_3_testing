import { CerebrasAdapter } from './cerebras-adapter';
import { GroqAdapter } from './groq-adapter';
import { GoogleAdapter } from './google-adapter';
import { OpenRouterAdapter } from './openrouter-adapter';
import { CloudflareAdapter } from './cloudflare-adapter';
import { AIProviderAdapter, ProviderId } from '../types';

export * from './base-adapter';
export * from './cerebras-adapter';
export * from './groq-adapter';
export * from './google-adapter';
export * from './openrouter-adapter';
export * from './cloudflare-adapter';
export {
  MARLINE_LAYER_TOGGLES,
  isLayerEnabled,
  setLayerEnabled,
} from '../config';

export function createAllAdapters(): Record<ProviderId, AIProviderAdapter> {
  return {
    cerebras: new CerebrasAdapter(),
    groq: new GroqAdapter(),
    google: new GoogleAdapter(),
    openrouter: new OpenRouterAdapter(),
    cloudflare: new CloudflareAdapter(),
  };
}

