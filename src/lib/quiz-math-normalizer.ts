/**
 * Normalizes and wraps unwrapped LaTeX formulas, equations, limits, matrices,
 * and mathematical expressions into standard $ ... $ and $$ ... $$ KaTeX delimiters.
 */
export function normalizeLatexMath(text?: string | null): string {
  if (!text || typeof text !== 'string') return text || '';

  // 1. Normalize \( ... \) to $ ... $ and \[ ... \] to $$ ... $$
  let s = text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');

  // 2. Protect existing $...$ and $$...$$
  const mathTokens: string[] = [];
  s = s.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]+\$/g, (m) => {
    mathTokens.push(m);
    return `__LATEX_TOKEN_${mathTokens.length - 1}__`;
  });

  // 3. Fix unescaped limits e.g. lim_n\to\infty -> \lim_{n \to \infty}
  s = s.replace(/\blim_([a-zA-Z0-9]+)\\to\\infty/g, '\\lim_{$1 \\to \\infty}');
  s = s.replace(/\blim_\{([^}]+)\}\\to\\infty/g, '\\lim_{$1 \\to \\infty}');
  s = s.replace(/\blim_([a-zA-Z0-9]+)/g, '\\lim_{$1}');

  // 4. Wrap expressions containing LaTeX commands or superscripts/subscripts with mathematical operators
  s = s.replace(/((?:\\lim_\{[^}]+\}|\\(?:to|infty|frac|sum|prod|int|sqrt|alpha|beta|gamma|theta|lambda|mu|sigma|pi|le|ge|neq|approx|in|partial|times|cdot|pm|mathbf|mathcal|begin|end)|\([A-Za-z0-9+\-_]+\)\^\{?[a-zA-Z0-9\-+]+\}?|[A-Za-z0-9]+\^\{?[a-zA-Z0-9\-+]+\}?|[A-Za-z0-9]+_\{?[a-zA-Z0-9\-+]+\}?)[^,?.!\n]*?(?=[,?.!\n]|$))/g, (match) => {
    const trimmed = match.trim();
    if (!trimmed || trimmed.startsWith('__LATEX_TOKEN_')) return match;

    const words = trimmed.split(/\s+/);
    const mathPart: string[] = [];
    const textPart: string[] = [];
    let inTrailingText = false;

    for (let i = 0; i < words.length; i++) {
      const w = words[i];
      if (!inTrailingText && (/[\\^_{}=+\-*\/<>|;]/.test(w) || /^(lim|det|P|Q|R|I|A|B|C|X|Y|Z|0|1|2|3|4|5|6|7|8|9)$/i.test(w) || w.length <= 2)) {
        mathPart.push(w);
      } else {
        inTrailingText = true;
        textPart.push(w);
      }
    }

    if (mathPart.length > 0) {
      let mStr = mathPart.join(' ');
      // Clean up bracketed matrices: [0 | (I-Q)^{-1}R ; 0 | I] -> \begin{bmatrix} 0 & (I-Q)^{-1}R \\ 0 & I \end{bmatrix}
      mStr = mStr.replace(/\[([\s\S]*?)\]/g, (_, matrixContent) => {
        const cleanedRows = matrixContent.replace(/;\s*/g, ' \\\\ ').replace(/\|\s*/g, ' & ');
        return `\\begin{bmatrix} ${cleanedRows} \\end{bmatrix}`;
      });
      return `$${mStr}$` + (textPart.length > 0 ? ' ' + textPart.join(' ') : '');
    }

    return `$${trimmed}$`;
  });

  // 5. Standalone expressions like (I-Q)^{-1}R
  s = s.replace(/(?<!\$)\b([A-Za-z0-9_()\[\]]*\([A-Za-z0-9+\-_]+\)\^\{?[a-zA-Z0-9\-+]+\}?[A-Za-z0-9_()\[\]]*)(?!\$)/g, (match) => {
    return `$${match}$`;
  });

  // 6. Restore preserved math tokens
  s = s.replace(/__LATEX_TOKEN_(\d+)__/g, (_, idx) => mathTokens[parseInt(idx, 10)]);

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
    // If the answer is in an option > 4, include it within the 4
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
