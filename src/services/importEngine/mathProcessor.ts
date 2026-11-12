/**
 * Universal Mathematical Content Processor
 * Automatically recognizes LaTeX delimiters and transforms them into KaTeX-compatible nodes.
 * Accurately distinguishes between mathematical equations and currency dollar amounts ($230,000).
 */

export interface MathExtractionResult {
  text: string;
  mathCount: number;
}

/**
 * Checks if a string enclosed in $...$ looks like an ordinary currency or price rather than LaTeX.
 */
function isCurrencyAmount(content: string): boolean {
  const trimmed = content.trim();
  // e.g. 230,000 or 1,200.50 or 50 or 50.00
  if (/^\d{1,3}(,\d{3})*(\.\d+)?$/.test(trimmed)) return true;
  if (/^\d+(\.\d+)?$/.test(trimmed)) return true;
  if (/^\d+\s*(USD|EUR|GBP|CAD|AUD|JPY|CHF|CAD|K|M|B)?$/i.test(trimmed)) return true;
  return false;
}

/**
 * Checks if content contains mathematical indicators (operators, LaTeX commands, Greek letters, variables).
 */
function hasMathIndicators(content: string): boolean {
  if (/\\(frac|sum|prod|int|sqrt|alpha|beta|gamma|delta|sigma|mu|bar|hat|vec|partial|times|div|pm|approx|neq|le|ge|in|subset|cup|cap|to|infty|lim|sin|cos|tan|log|ln)/i.test(content)) {
    return true;
  }
  if (/[=+\-_^/\\<>]/.test(content)) {
    return true;
  }
  // Single variable identifier like $x$, $y$, $n$, $i$
  if (/^[a-zA-Z]$/.test(content.trim())) {
    return true;
  }
  return false;
}

/**
 * Extracts and converts both inline and block mathematical formulas into TipTap HTML nodes.
 */
export function processMathematics(text: string): MathExtractionResult {
  if (!text) return { text: '', mathCount: 0 };

  let processed = text;
  let mathCount = 0;

  // 1. Process Block Math: \[ ... \]
  processed = processed.replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula) => {
    const cleanFormula = formula.trim().replace(/"/g, '&quot;');
    if (!cleanFormula) return '';
    mathCount++;
    return `\n\n<div data-type="math-block" data-latex="${cleanFormula}"></div>\n\n`;
  });

  // 2. Process Block Math: $$ ... $$
  processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula) => {
    const cleanFormula = formula.trim().replace(/"/g, '&quot;');
    if (!cleanFormula) return '';
    mathCount++;
    return `\n\n<div data-type="math-block" data-latex="${cleanFormula}"></div>\n\n`;
  });

  // 3. Process Inline Math: \( ... \)
  processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula) => {
    const cleanFormula = formula.trim().replace(/"/g, '&quot;');
    if (!cleanFormula) return '';
    mathCount++;
    return `<span data-type="math-inline" data-latex="${cleanFormula}"></span>`;
  });

  // 4. Process TeX Inline Math: $...$ with currency protection
  // Pattern: $ followed by non-space, anything without newlines, followed by non-space, ending with $
  processed = processed.replace(/(?<!\\|\$)\$([^\s$](?:[^$\n]*?[^\s$])?)\$(?!\$)/g, (fullMatch, formula) => {
    // If it's a currency figure like $230,000, do NOT convert!
    if (isCurrencyAmount(formula)) {
      return fullMatch;
    }

    // If it contains mathematical indicators or variables:
    if (hasMathIndicators(formula)) {
      const cleanFormula = formula.trim().replace(/"/g, '&quot;');
      mathCount++;
      return `<span data-type="math-inline" data-latex="${cleanFormula}"></span>`;
    }

    return fullMatch;
  });

  return { text: processed, mathCount };
}

