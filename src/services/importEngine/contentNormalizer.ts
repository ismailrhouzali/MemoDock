/**
 * Universal Content Normalizer
 * Context-aware normalization for AI-generated text, escaped Markdown,
 * HTML entities, and inconsistent whitespace.
 */

/**
 * Safely decodes HTML entities into literal characters without executing scripts.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';

  return text
    .replace(/&#x20;/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return _;
      }
    })
    .replace(/&#([0-9]+);/g, (_, dec) => {
      try {
        return String.fromCharCode(parseInt(dec, 10));
      } catch {
        return _;
      }
    });
}

/**
 * Normalizes escaped Markdown syntax frequently produced by ChatGPT, Claude, and Gemini.
 * Preserves backslashes inside LaTeX commands (e.g. \bar, \sum, \frac) and code blocks.
 */
export function normalizeEscapedMarkdown(rawText: string): string {
  if (!rawText) return '';

  let text = rawText;

  // 1. Normalize escaped horizontal rules: \---, \***, \___
  text = text.replace(/^[ \t]*\\(---|\*\*\*|___)[ \t]*$/gm, '$1');

  // 2. Normalize escaped headings: \### Title, \## Title, \# Title
  text = text.replace(/^[ \t]*\\(#{1,6})[ \t]+/gm, '$1 ');

  // 3. Normalize escaped bullet lists: \* Item, \- Item, \+ Item
  text = text.replace(/^[ \t]*\\([\*\-\+])[ \t]+/gm, '$1 ');

  // 4. Normalize escaped blockquotes: \> Quote
  text = text.replace(/^[ \t]*\\>[ \t]+/gm, '> ');

  // 5. Normalize escaped numbered lists: \1. Item, \2. Item
  text = text.replace(/^[ \t]*\\(\d+)\.[ \t]+/gm, '$1. ');

  // 6. Normalize escaped math delimiters: \\( -> \(, \\) -> \), \\\[ -> \[, \\\] -> \]
  text = text.replace(/\\\\([()\[\]])/g, '\\$1');

  // 7. Normalize escaped bold/italic when backslashed: \*\*bold\*\* -> **bold**
  text = text.replace(/\\\*\\\*(.+?)\\\*\\\*/g, '**$1**');
  text = text.replace(/\\_\\_(.+?)\\_\\_/g, '__$1__');

  // 8. Normalize escaped inline code: \`code\` -> `code`
  text = text.replace(/\\`(.+?)\\`/g, '`$1`');

  return text;
}

/**
 * Cleans excessive blank lines and trailing whitespace while preserving intentional paragraph separation.
 */
export function normalizeWhitespace(text: string): string {
  if (!text) return '';

  return text
    // Replace carriage returns
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Reduce 3+ consecutive newlines to 2
    .replace(/\n{3,}/g, '\n\n')
    // Trim end of lines
    .replace(/[ \t]+$/gm, '')
    .trim();
}

/**
 * Full normalization pipeline for copied content.
 */
export function normalizeContent(rawText: string): string {
  if (!rawText) return '';

  // Step 1: Decode HTML entities
  let result = decodeHtmlEntities(rawText);

  // Step 2: Context-aware escaped markdown normalization
  result = normalizeEscapedMarkdown(result);

  // Step 3: Whitespace normalization
  result = normalizeWhitespace(result);

  return result;
}

