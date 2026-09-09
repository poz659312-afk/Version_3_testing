import assert from "node:assert";
import {
  estimateTokens,
  calculateGroqBudget,
  calculateProviderBudget,
  GROQ_TPM_LIMIT,
  GROQ_SAFETY_MARGIN,
  TOKEN_SAFETY_MARGIN,
} from "../token-budget-manager";
import { chunkDocumentSemantically } from "../semantic-chunker";
import { MarlineRouter } from "../marline/router";
import { providerHealthCache } from "../marline/providers/health-cache";
import { BaseProviderAdapter } from "../marline/providers/adapters/base-adapter";
import { AIRequest, AIResponse, AIStreamResponse, ProviderId } from "../marline/providers/types";

class MockAdapter extends BaseProviderAdapter {
  constructor(
    public readonly id: ProviderId,
    public readonly defaultPriority: number,
    public configured: boolean = true,
    public failWith?: Error
  ) {
    super();
  }

  getAvailableModels(): string[] {
    return ["mock-model"];
  }

  getDefaultModel(): string {
    return "mock-model";
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    if (this.failWith) throw this.failWith;
    return {
      provider: this.id,
      model: "mock-model",
      content: "mock response",
      durationMs: 10,
    };
  }

  async stream(request: AIRequest): Promise<AIStreamResponse> {
    if (this.failWith) throw this.failWith;
    const encoder = new TextEncoder();
    return {
      provider: this.id,
      model: "mock-model",
      stream: new ReadableStream({
        start(c) {
          c.enqueue(encoder.encode("mock chunk"));
          c.close();
        },
      }),
      durationMs: 10,
    };
  }
}

export function runDriveAITests() {
  console.log("=== Running Marline Drive AI Multi-Layer Tests ===");

  // 1. Text & Token Estimation Tests
  const englishText = "This is a standard academic text with 10 words.";
  const arabicText = "هذا نص أكاديمي قياسي يحتوي على عدة كلمات لشرح المفاهيم الرياضية.";

  const engTokens = estimateTokens(englishText);
  const arTokens = estimateTokens(arabicText);

  assert.ok(engTokens > 5, "English tokens estimate failed");
  assert.ok(arTokens > 10, "Arabic tokens estimate failed");
  console.log("✓ Token estimation tests passed.");

  // 2. Groq Budgeting Tests
  const inputTokens = 4000;
  const budget = calculateGroqBudget({ inputTokens, desiredOutputTokens: 3200, task: 'summarize' });
  assert.strictEqual(budget.canUseGroqDirectly, true);
  assert.strictEqual(budget.requiresChunking, false);
  assert.ok(inputTokens + budget.actualMaxTokens + GROQ_SAFETY_MARGIN <= GROQ_TPM_LIMIT);

  const largeInputTokens = 5000;
  const largeBudget = calculateGroqBudget({ inputTokens: largeInputTokens, desiredOutputTokens: 3200, task: 'summarize' });
  assert.strictEqual(largeBudget.canUseGroqDirectly, true);
  assert.strictEqual(largeBudget.actualMaxTokens, 2750);

  const chunkInputTokens = 6500;
  const chunkBudget = calculateGroqBudget({ inputTokens: chunkInputTokens, desiredOutputTokens: 3200, task: 'summarize' });
  assert.strictEqual(chunkBudget.canUseGroqDirectly, false);
  assert.strictEqual(chunkBudget.requiresChunking, true);
  console.log("✓ Groq budget management tests passed.");

  // 3. Multi-Provider Budgeting Tests
  const cerebrasBudget = calculateProviderBudget({
    inputTokens: 10000,
    tpmLimit: 60000,
    safetyMargin: TOKEN_SAFETY_MARGIN,
    desiredOutputTokens: 3200,
  });
  assert.strictEqual(cerebrasBudget.canFitDirectly, true);
  assert.strictEqual(cerebrasBudget.actualMaxTokens, 3200);

  const tightBudget = calculateProviderBudget({
    inputTokens: 7500,
    tpmLimit: 8000,
    safetyMargin: TOKEN_SAFETY_MARGIN,
    desiredOutputTokens: 3200,
  });
  assert.strictEqual(tightBudget.canFitDirectly, false);
  assert.strictEqual(tightBudget.requiresChunking, true);
  console.log("✓ Multi-provider generalized budgeting passed.");

  // 4. Semantic Chunking Tests
  const smallText = "# Lecture 1: Introduction\nThis is a brief overview of Markov chains.";
  const smallChunks = chunkDocumentSemantically(smallText, { targetChunkTokens: 2000 });
  assert.strictEqual(smallChunks.length, 1);

  const multiLectureText = `
# Lecture 1: Basics
Probability spaces, random variables.
${"Details on discrete systems and sample spaces. ".repeat(100)}

# Lecture 2: Discrete-Time Markov Chains
Transition matrices, state classification.
${"Details on transition probabilities. ".repeat(100)}
  `.trim();

  const chunks = chunkDocumentSemantically(multiLectureText, { targetChunkTokens: 500 });
  assert.ok(chunks.length > 1, "Semantic chunking should segment multi-lecture text");
  console.log("✓ Semantic chunking tests passed.");

  // 5. Error Classification Tests
  const mockAdapter = new MockAdapter('cerebras', 1);
  const rateLimitErr = mockAdapter.classifyError(new Error("Rate limit reached"), 429);
  assert.strictEqual(rateLimitErr.category, "RATE_LIMIT");
  assert.strictEqual(rateLimitErr.retryable, true);

  const quotaErr = mockAdapter.classifyError(new Error("Daily credit limit exceeded"), 429);
  assert.strictEqual(quotaErr.category, "DAILY_QUOTA");
  assert.strictEqual(quotaErr.retryable, false);

  const authErr = mockAdapter.classifyError(new Error("PAYMENT_METHOD_REQUIRED"), 402);
  assert.strictEqual(authErr.category, "AUTH_ERROR");
  assert.strictEqual(authErr.retryable, false);

  const timeoutErr = mockAdapter.classifyError(new Error("Request timed out after 15000ms"));
  assert.strictEqual(timeoutErr.category, "TIMEOUT");
  assert.strictEqual(timeoutErr.retryable, true);
  console.log("✓ Error classification tests passed.");

  // 6. Provider Health Cache Tests
  providerHealthCache.recordSuccess('cerebras');
  assert.strictEqual(providerHealthCache.isAvailable('cerebras'), true);

  providerHealthCache.recordFailure('cerebras', 'RATE_LIMIT');
  assert.strictEqual(providerHealthCache.isAvailable('cerebras'), false);
  const health = providerHealthCache.getHealth('cerebras');
  assert.strictEqual(health.consecutiveFailures, 1);

  providerHealthCache.resetCooldown('cerebras');
  assert.strictEqual(providerHealthCache.isAvailable('cerebras'), true);
  console.log("✓ Health cache cooldown & recovery tests passed.");

  // 7. Router Score & Fallback Tests
  const mockAdapters: Record<ProviderId, any> = {
    cerebras: new MockAdapter('cerebras', 1, true),
    groq: new MockAdapter('groq', 2, true),
    google: new MockAdapter('google', 3, true),
    openrouter: new MockAdapter('openrouter', 4, true),
    cloudflare: new MockAdapter('cloudflare', 5, true),
  };


  const router = new MarlineRouter(mockAdapters);

  // Default ordering should prioritize Layer 1 (Cerebras)
  const chain1 = router.selectProviderChain({
    inputTokens: 1000,
    desiredOutputTokens: 1000,
  });
  assert.strictEqual(chain1[0].id, 'cerebras', 'Cerebras should be priority 1 when healthy');

  // If Cerebras is down/in cooldown, Groq should be top
  providerHealthCache.recordFailure('cerebras', 'RATE_LIMIT');
  const chain2 = router.selectProviderChain({
    inputTokens: 1000,
    desiredOutputTokens: 1000,
  });
  assert.strictEqual(chain2[0].id, 'groq', 'Groq should be selected when Cerebras is in cooldown');

  // Reset health for clean state
  providerHealthCache.resetCooldown('cerebras');

  console.log("✓ Smart router prioritization & fallback tests passed.");
  console.log("=== ALL MARLINE DRIVE AI TESTS PASSED! ===");
}

if (process.argv[1]?.includes('drive-ai.test')) {
  runDriveAITests();
}
