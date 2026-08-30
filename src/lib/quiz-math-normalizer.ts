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
 * Strips unnatural meta-referencing phrases from question text
 * e.g., "According to the document,", "As mentioned in the lecture,", "بحسب ما ورد في المحاضرة", etc.
 */
export function cleanQuestionMetaPhrases(text?: string | null): string {
  if (!text || typeof text !== 'string') return text || '';
  let cleaned = text.trim();

  // English prefix strippers
  cleaned = cleaned.replace(/^(?:According to (?:the )?(?:provided |given )?(?:document|lecture|text|notes|material|slides|chapter|file),?\s*)/i, '');
  cleaned = cleaned.replace(/^(?:Based on (?:the )?(?:provided |given )?(?:document|lecture|text|notes|material|slides|chapter|file),?\s*)/i, '');
  cleaned = cleaned.replace(/^(?:As (?:mentioned|stated|discussed|described|presented) in (?:the )?(?:provided |given )?(?:document|lecture|text|notes|material|slides|file),?\s*)/i, '');
  cleaned = cleaned.replace(/^(?:In (?:the )?(?:provided |given )?(?:document|lecture|text|notes|material|slides|file),?\s*)/i, '');
  cleaned = cleaned.replace(/^(?:From (?:the )?(?:provided |given )?(?:document|lecture|text|notes|material|slides|file),?\s*)/i, '');

  // English suffix strippers
  cleaned = cleaned.replace(/(?:,?\s*)?(?:according to|as (?:mentioned|stated|discussed) in|based on|provided in) (?:the )?(?:provided |given )?(?:document|lecture|text|notes|material|slides|file)\s*\??$/i, '?');
  cleaned = cleaned.replace(/\s*\((?:as )?(?:mentioned|stated|based on) (?:in )?(?:the )?(?:document|lecture|text|notes|file)\)/gi, '');

  // Arabic prefix strippers
  cleaned = cleaned.replace(/^(?:وفقاً\s*(?:لـ?|لما ورد في |لما جاء في )?|بحسب\s*(?:ما ورد في |ما جاء في )?|بناءً على\s*(?:ما ورد في )?|طبقاً\s*(?:لـ?|لما ورد في )?|كما ورد في |كما ذُ?كر في |حسب |استناداً إلى )(?:المستند|المحاضرة|الملف|النص|السياق|المذكرة|المادة)(?:\s*(?:المرفق|المعطى|المقدم|المذكور))?[،,\s]*/i, '');

  // Arabic suffix strippers
  cleaned = cleaned.replace(/[،,\s]*(?:وفقاً\s*(?:لـ?|لما ورد في )?|بحسب\s*(?:ما ورد في )?|بناءً على |طبقاً لـ?|كما ورد في |كما ذُ?كر في |حسب |المذكور(?:ة)? في )(?:المستند|المحاضرة|الملف|النص|السياق|المذكرة)(?:\s*(?:المرفق|المعطى|المقدم))?\s*(\؟|\?)?$/i, '$1');

  // Strip leading punctuation left over
  cleaned = cleaned.replace(/^[،,\-:\s]+/, '');

  // Capitalize first letter if English
  if (cleaned.length > 0 && /^[a-z]/.test(cleaned)) {
    cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  return cleaned.trim();
}

/**
 * Extracts any embedded Markdown/LaTeX table from the question prompt so it can be viewed in a separate reference modal.
 */
export function extractTableFromQuestion(question?: string | null, existingTable?: string | null): { question: string; table: string | null } {
  if (existingTable && typeof existingTable === 'string' && existingTable.trim().length > 0) {
    return { question: (question || '').trim(), table: existingTable.trim() };
  }

  let q = question || '';
  let extractedTable: string | null = null;

  // 1. Check for Markdown GFM table inside question
  const mdTableRegex = /(\|[^\n]+\|\r?\n\|[-:\s|]+\|\r?\n(?:\|[^\n]+\|\r?\n?)+)/m;
  const mdMatch = q.match(mdTableRegex);
  if (mdMatch) {
    extractedTable = mdMatch[1].trim();
    q = q.replace(mdMatch[1], '').trim();
  }

  // 2. Check for LaTeX array or tabular inside question
  const latexTableRegex = /(\\begin\{(?:array|tabular|matrix|pmatrix|bmatrix)\}[\s\S]*?\\end\{(?:array|tabular|matrix|pmatrix|bmatrix)\})/m;
  const latexMatch = q.match(latexTableRegex);
  if (latexMatch && !extractedTable) {
    extractedTable = latexMatch[1].trim();
    q = q.replace(latexMatch[1], '').trim();
  }

  return {
    question: q.trim(),
    table: extractedTable
  };
}

/**
 * Normalizes all fields of a quiz question item (question, options, answer, explanation, table).
 * Enforces strictly 4 options (A, B, C, D), clean letter prefixes, exact answer matching, stripped meta-phrases, and isolated reference tables.
 */
export function normalizeQuizQuestionItem(q: any): any {
  if (!q || typeof q !== 'object') return q;

  // Extract separate reference table if present or embedded
  const { question: rawQ, table: rawTable } = extractTableFromQuestion(q.question, q.table);
  const normalizedQuestion = cleanQuestionMetaPhrases(normalizeLatexMath(rawQ));
  const normalizedTable = rawTable ? normalizeLatexMath(rawTable) : null;
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
    table: normalizedTable,
    options: formattedOptions,
    answer: normalizedAnswer,
    explanation: normalizedExplanation
  };
}
