import assert from "node:assert";
import { normalizeLatexMath, normalizeQuizQuestionItem } from "../quiz-math-normalizer";

export function runQuizMathTests() {
  const rawQuestion = "In the gambler’s ruin absorbing probability formula, lim_n\\to\\infty P^n = [0 | (I-Q)^{-1}R ; 0 | I], what does the matrix (I-Q)^{-1}R represent?";
  const normalized = normalizeLatexMath(rawQuestion);

  assert.ok(normalized.includes("$\\lim_{n \\to \\infty}"));
  assert.ok(normalized.includes("\\begin{bmatrix}"));
  assert.ok(normalized.includes("$(I-Q)^{-1}R$"));

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
  assert.ok(item.question.includes("$\\lambda"));
  assert.ok(item.options[0].includes("$\\lambda"));
  assert.strictEqual(item.answer, item.options[0]);
  assert.ok(item.explanation.includes("$\\lambda"));
}
