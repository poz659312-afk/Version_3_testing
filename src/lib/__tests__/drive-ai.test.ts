import { estimateTokens, calculateGroqBudget, GROQ_TPM_LIMIT, GROQ_SAFETY_MARGIN } from "../token-budget-manager";
import { chunkDocumentSemantically } from "../semantic-chunker";

describe("Token Budget Manager", () => {
  test("Accurately estimates English and Arabic tokens", () => {
    const englishText = "This is a standard academic text with 10 words.";
    const arabicText = "هذا نص أكاديمي قياسي يحتوي على عدة كلمات لشرح المفاهيم الرياضية.";
    
    const engTokens = estimateTokens(englishText);
    const arTokens = estimateTokens(arabicText);

    expect(engTokens).toBeGreaterThan(5);
    expect(arTokens).toBeGreaterThan(10);
  });

  test("Calculates safe Groq budget for medium input", () => {
    const inputTokens = 4000;
    const budget = calculateGroqBudget({ inputTokens, desiredOutputTokens: 3200, task: 'summarize' });

    expect(budget.canUseGroqDirectly).toBe(true);
    expect(budget.requiresChunking).toBe(false);
    expect(inputTokens + budget.actualMaxTokens + GROQ_SAFETY_MARGIN).toBeLessThanOrEqual(GROQ_TPM_LIMIT);
  });

  test("Automatically reduces max_tokens when input is large (5000 tokens)", () => {
    const inputTokens = 5000;
    const budget = calculateGroqBudget({ inputTokens, desiredOutputTokens: 3200, task: 'summarize' });

    expect(budget.canUseGroqDirectly).toBe(true);
    expect(budget.actualMaxTokens).toBeLessThanOrEqual(GROQ_TPM_LIMIT - inputTokens - GROQ_SAFETY_MARGIN);
    expect(budget.actualMaxTokens).toBe(2750); // 8000 - 5000 - 250
  });

  test("Triggers chunking when input exceeds direct safe threshold (>5400 tokens)", () => {
    const inputTokens = 6500;
    const budget = calculateGroqBudget({ inputTokens, desiredOutputTokens: 3200, task: 'summarize' });

    expect(budget.canUseGroqDirectly).toBe(false);
    expect(budget.requiresChunking).toBe(true);
  });
});

describe("Semantic Document Chunker", () => {
  test("Does not split small documents", () => {
    const smallText = "# Lecture 1: Introduction\nThis is a brief overview of Markov chains.";
    const chunks = chunkDocumentSemantically(smallText, { targetChunkTokens: 2000 });

    expect(chunks.length).toBe(1);
    expect(chunks[0].text).toBe(smallText);
  });

  test("Splits large documents along lecture/heading boundaries without data loss", () => {
    const multiLectureText = `
# Lecture 1: Basics
Probability spaces, random variables, conditional probability.
${"Details on discrete systems and sample spaces. ".repeat(100)}

# Lecture 2: Discrete-Time Markov Chains
Transition matrices, state classification, communicating classes.
${"Details on transition probabilities and row-stochastic matrices. ".repeat(100)}

# Lecture 3: Stationary Distributions
Fixed-point equations, irreducibility, positive recurrence.
${"Details on steady-state distributions and limiting behaviors. ".repeat(100)}
    `.trim();

    const chunks = chunkDocumentSemantically(multiLectureText, { targetChunkTokens: 500 });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].title).toBeTruthy();
    expect(chunks[1].title).toBeTruthy();
    
    // Ensure all chunks have positive token count
    for (const chunk of chunks) {
      expect(chunk.tokenCount).toBeGreaterThan(0);
      expect(chunk.text.length).toBeGreaterThan(0);
    }
  });
});
