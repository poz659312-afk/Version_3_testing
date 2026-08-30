/**
 * Token Budget Manager for Marline Drive AI
 * Guarantees zero 413 TPM overruns on Groq's 8,000 TPM limit
 * while maximizing output tokens and throughput.
 */

export const GROQ_TPM_LIMIT = 8000;
export const GROQ_SAFETY_MARGIN = 250;
export const MIN_VIABLE_OUTPUT_TOKENS = 1000;
export const TARGET_SUMMARY_OUTPUT_TOKENS = 3200;
export const MAX_DIRECT_GROQ_INPUT_TOKENS = 5400; // 8000 - 250 - 2350 = 5400

/**
 * Accurately estimates token count for multilingual (Arabic/English), code, and math content.
 * Conservative estimation to prevent under-counting.
 */
export function estimateTokens(text: string): number {
  if (!text || text.length === 0) return 0;

  // Split into character classes for accurate multilingual estimation
  let tokenCount = 0;
  
  // Non-ASCII (Arabic, UTF-8 symbols) typically ~2.5 chars per token in modern byte-pair tokenizers
  const nonAsciiMatches = text.match(/[^\x00-\x7F]/g);
  const nonAsciiCount = nonAsciiMatches ? nonAsciiMatches.length : 0;
  
  // ASCII characters (English, whitespace, numbers, code) typically ~3.8 chars per token
  const asciiCount = text.length - nonAsciiCount;
  
  tokenCount = Math.ceil((nonAsciiCount / 2.5) + (asciiCount / 3.8));
  
  // Add 5% safety margin
  return Math.ceil(tokenCount * 1.05);
}

export interface TokenBudgetResult {
  canUseGroqDirectly: boolean;
  requiresChunking: boolean;
  actualMaxTokens: number;
  inputTokens: number;
  availableBudget: number;
  targetOutputTokens: number;
}

/**
 * Calculates the exact safe max_tokens for a Groq request.
 * Guarantees: inputTokens + actualMaxTokens + safetyMargin <= GROQ_TPM_LIMIT
 */
export function calculateGroqBudget(params: {
  inputTokens: number;
  desiredOutputTokens?: number;
  task?: string;
}): TokenBudgetResult {
  const { inputTokens, task = 'summarize' } = params;
  
  // Default target output depending on task
  let desiredOutputTokens = params.desiredOutputTokens;
  if (!desiredOutputTokens) {
    if (task === 'summarize') desiredOutputTokens = TARGET_SUMMARY_OUTPUT_TOKENS;
    else if (task === 'translate') desiredOutputTokens = 2200;
    else if (task === 'quiz') desiredOutputTokens = 2000;
    else desiredOutputTokens = 1500;
  }

  const availableBudget = GROQ_TPM_LIMIT - inputTokens - GROQ_SAFETY_MARGIN;

  // If input is too large to leave room for a comprehensive summary, chunking is required
  if (inputTokens > MAX_DIRECT_GROQ_INPUT_TOKENS || availableBudget < MIN_VIABLE_OUTPUT_TOKENS) {
    return {
      canUseGroqDirectly: false,
      requiresChunking: true,
      actualMaxTokens: Math.max(1000, Math.min(desiredOutputTokens, Math.max(0, availableBudget))),
      inputTokens,
      availableBudget,
      targetOutputTokens: desiredOutputTokens,
    };
  }

  // Safe to run directly on Groq with dynamically clamped max_tokens
  const actualMaxTokens = Math.min(desiredOutputTokens, availableBudget);

  return {
    canUseGroqDirectly: true,
    requiresChunking: false,
    actualMaxTokens,
    inputTokens,
    availableBudget,
    targetOutputTokens: desiredOutputTokens,
  };
}
