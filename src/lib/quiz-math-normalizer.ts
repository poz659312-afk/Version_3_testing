/**
 * Safely normalizes LaTeX math notations without dangerous placeholder tokens.
 */
export function normalizeLatexMath(text?: string | null): string {
  if (!text || typeof text !== 'string') return text || '';

  // 1. Normalize \( ... \) to $ ... $ and \[ ... \] to $$ ... $$
  let s = text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$1$');

  // 2. Fix unescaped limits e.g. lim_n\to\infty -> \lim_{n \to \infty}
  s = s.replace(/\blim_([a-zA-Z0-9]+)\\to\\infty/g, '\\lim_{$1 \\to \\infty}');
  s = s.replace(/\blim_\{([^}]+)\}\\to\\infty/g, '\\lim_{$1 \\to \\infty}');
  s = s.replace(/\blim_([a-zA-Z0-9]+)/g, '\\lim_{$1}');

  // 3. Auto-wrap unwrapped matrix and superscript expressions like (I-Q)^{-1}R
  s = s.replace(/(?<!\$)\b([A-Za-z0-9_()\[\]]*\([A-Za-z0-9+\-_]+\)\^\{?[a-zA-Z0-9\-+]+\}?[A-Za-z0-9_()\[\]]*)(?!\$)/g, (match) => {
    return `$${match}$`;
  });

  // 4. Heal any accidental placeholder artifacts if present
  s = s.replace(/_{0,}LATEX_TOKEN_\d+_{0,}/gi, '$m$');
  s = s.replace(/_{0,}MATH_TOKEN_\d+_{0,}/gi, '$m$');

  return s;
}

/**
 * Normalizes all fields of a quiz question item (question, options, answer, explanation).
 * Enforces strictly 4 options (A, B, C, D), clean letter prefixes, and exact answer matching.
 */
export function normalizeQuizQuestionItem(q: any): any {
  if (!q || typeof q !== 'object') return q;

  const normalizedQuestion = normalizeLatexMath(q.question);
  const normalizedExplanation = q.explanation ? normalizeLatexMath(q.explanation) : q.explanation;
  
  let rawOptions: string[] = Array.isArray(q.options) ? q.options : [];

  // Clamp strictly to 4 options (A, B, C, D)
  if (rawOptions.length > 4) {
    const ansClean = (q.answer || '').replace(/^[A-Z]\s*[\).\-]\s*/i, '').trim();
    const ansIdx = rawOptions.findIndex(opt => opt.replace(/^[A-Z]\s*[\).\-]\s*/i, '').trim() === ansClean);
    if (ansIdx >= 4) {
      rawOptions = [rawOptions[0], rawOptions[1], rawOptions[2], rawOptions[ansIdx]];
    } else {
      rawOptions = rawOptions.slice(0, 4);
    }
  }

  // Ensure standard prefixes (A), B), C), D))
  const letters = ['A', 'B', 'C', 'D'];
  const formattedOptions = rawOptions.map((opt, idx) => {
    const letter = letters[idx] || 'A';
    const cleanedText = opt.replace(/^[A-Z]\s*[\).\-]\s*/i, '').trim();
    return `${letter}) ${normalizeLatexMath(cleanedText)}`;
  });

  // Ensure answer matches one of the formatted options
  let normalizedAnswer = q.answer || '';
  if (typeof q.answer === 'string' && formattedOptions.length > 0) {
    const origAnswerClean = q.answer.replace(/^[A-Z]\s*[\).\-]\s*/i, '').trim();
    const match = formattedOptions.find(opt => {
      const optClean = opt.replace(/^[A-Z]\s*[\).\-]\s*/i, '').trim();
      return optClean === origAnswerClean || opt === q.answer.trim();
    });
    normalizedAnswer = match || formattedOptions[0];
  }

  return {
    ...q,
    type: "Multiple Choice",
    question: normalizedQuestion,
    options: formattedOptions,
    answer: normalizedAnswer,
    explanation: normalizedExplanation
  };
}
