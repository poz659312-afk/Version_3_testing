import assert from "node:assert";
import { normalizeLatexMath, normalizeQuizQuestionItem } from "../quiz-math-normalizer";

export function runQuizMathTests() {
  const sample1 = "What is the result of a CROSS JOIN between two tables with $m$ and $n$ rows?";
  const normalized1 = normalizeLatexMath(sample1);
  assert.strictEqual(normalized1, sample1);
  assert.ok(!normalized1.includes("LATEX_TOKEN"));

  const alreadyFormatted = "Find the value of $\\pi$ such that $\\pi P = \\pi$ and $\\sum_{i} \\pi_i = 1$.";
  const normalized2 = normalizeLatexMath(alreadyFormatted);
  assert.strictEqual(normalized2, alreadyFormatted);

  const rawItem = {
    numb: 1,
    type: "Multiple Choice",
    question: "What is det(A - \\lambda I) = 0?",
    options: [
      "A) Characteristic equation for \\lambda",
      "B) Trace of matrix A",
      "C) (I-Q)^{-1}R matrix",
      "D) Zero vector \\vec{0}"
    ],
    answer: "A) Characteristic equation for \\lambda",
    explanation: "The equation det(A - \\lambda I) = 0 yields the eigenvalues \\lambda_i of matrix A."
  };

  const item = normalizeQuizQuestionItem(rawItem);
  assert.strictEqual(item.options.length, 4);
  assert.ok(item.options[0].startsWith("A) "));
  assert.ok(item.options[1].startsWith("B) "));
  assert.ok(item.options[2].startsWith("C) "));
  assert.ok(item.options[3].startsWith("D) "));
  assert.strictEqual(item.answer, item.options[0]);
}
