import assert from "node:assert";
import { estimateTokens, calculateGroqBudget, GROQ_TPM_LIMIT, GROQ_SAFETY_MARGIN } from "../token-budget-manager";
import { chunkDocumentSemantically } from "../semantic-chunker";

export function runDriveAITests() {
  const englishText = "This is a standard academic text with 10 words.";
  const arabicText = "هذا نص أكاديمي قياسي يحتوي على عدة كلمات لشرح المفاهيم الرياضية.";
  
  const engTokens = estimateTokens(englishText);
  const arTokens = estimateTokens(arabicText);

  assert.ok(engTokens > 5, "English tokens estimate failed");
  assert.ok(arTokens > 10, "Arabic tokens estimate failed");

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
  assert.ok(chunks.length > 1);
}
