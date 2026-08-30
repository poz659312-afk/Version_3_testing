import assert from "node:assert";
import { normalizeLatexMath, cleanQuestionMetaPhrases, extractTableFromQuestion, normalizeQuizQuestionItem } from "../quiz-math-normalizer";

export function runQuizMathTests() {
  const sample1 = "What is the result of a CROSS JOIN between two tables with $m$ and $n$ rows?";
  const normalized1 = normalizeLatexMath(sample1);
  assert.strictEqual(normalized1, sample1);
  assert.ok(!normalized1.includes("LATEX_TOKEN"));

  const screenshotSample = "What are the three types of market basket (p-o-s) data mentioned in the document?";
  assert.strictEqual(cleanQuestionMetaPhrases(screenshotSample), "What are the three types of market basket (p-o-s) data?");

  const metaSample1 = "According to the lecture, what is the formula for MSE?";
  assert.strictEqual(cleanQuestionMetaPhrases(metaSample1), "What is the formula for MSE?");

  const metaSample2 = "بحسب المحاضرة، ما هي مصفوفة الانتقال الاحتمالية؟";
  assert.strictEqual(cleanQuestionMetaPhrases(metaSample2), "ما هي مصفوفة الانتقال الاحتمالية؟");

  const metaSample3 = "ما هو شرط الحالة الماصة وفقاً للمستند؟";
  assert.strictEqual(cleanQuestionMetaPhrases(metaSample3), "ما هو شرط الحالة الماصة؟");

  // Test table extraction
  const questionWithTable = "Based on the transaction dataset:\n| TID | Items |\n| --- | --- |\n| 1 | {a, b, d} |\n| 2 | {b, c, d} |\nWhat is the support for itemset {b, d}?";
  const extracted = extractTableFromQuestion(questionWithTable);
  assert.ok(extracted.table !== null);
  assert.ok(extracted.table.includes("| TID | Items |"));
  assert.ok(!extracted.question.includes("| TID | Items |"));

  const rawItem = {
    numb: 1,
    type: "Multiple Choice",
    question: "What are the three types of market basket (p-o-s) data mentioned in the document?",
    options: [
      "A) Prices, Discounts, and Taxes",
      "B) Items, Quantities, and Dates",
      "C) Customers, Stores, and Regions",
      "D) Sales, Profits, and Losses"
    ],
    answer: "A) Prices, Discounts, and Taxes",
    explanation: "The three primary types are prices, discounts, and taxes."
  };

  const item = normalizeQuizQuestionItem(rawItem);
  assert.strictEqual(item.options.length, 4);
  assert.strictEqual(item.question, "What are the three types of market basket (p-o-s) data?");
  assert.ok(item.options[0].startsWith("A) "));
  assert.ok(item.options[1].startsWith("B) "));
  assert.ok(item.options[2].startsWith("C) "));
  assert.ok(item.options[3].startsWith("D) "));
  assert.strictEqual(item.answer, item.options[0]);
}
