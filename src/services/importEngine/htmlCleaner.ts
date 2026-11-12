/**
 * Universal Rich HTML Sanitizer & Cleaner
 * Cleans content copied from Google Docs, MS Word, Notion, and documentation websites.
 * Strips tracking styles, unrolls redundant spans, and preserves semantic document structures.
 */

import DOMPurify from 'dompurify';

function sanitizeWithDOMPurify(dirty: string, config?: any): string {
  if (typeof window !== 'undefined') {
    if (typeof (DOMPurify as any).sanitize === 'function') {
      return (DOMPurify as any).sanitize(dirty, config);
    }
    if (typeof DOMPurify === 'function') {
      return (DOMPurify as any)(window).sanitize(dirty, config);
    }
  }
  return dirty;
}

/**
 * Checks if copied HTML is actually just a pre/code wrapper around plain text or Markdown.
 */
export function isHtmlJustCodeWrapper(html: string): boolean {
  if (!html) return false;
  const trimmed = html.trim();
  return (
    /^<pre><code[\s\S]*<\/code><\/pre>$/i.test(trimmed) ||
    /^<!--StartFragment-->\s*<pre>[\s\S]*<\/pre>\s*<!--EndFragment-->$/i.test(trimmed)
  );
}

/**
 * Normalizes Google redirect links (e.g. https://www.google.com/url?q=TARGET_URL).
 */
export function unwrapGoogleRedirect(url: string): string {
  try {
    if (url.includes('google.com/url?') && url.includes('q=')) {
      const parsed = new URL(url);
      const target = parsed.searchParams.get('q');
      if (target) return target;
    }
  } catch {
    // ignore
  }
  return url;
}

/**
 * Cleans Google Docs, MS Word, and Web HTML into clean semantic HTML.
 */
export function cleanRichHtml(rawHtml: string): string {
  if (!rawHtml) return '';

  let html = rawHtml;

  // 1. Strip HTML comments, doctype, and styles
  html = html.replace(/<!--[\s\S]*?-->/g, '');
  html = html.replace(/<style[\s\S]*?<\/style>/gi, '');
  html = html.replace(/<link[\s\S]*?>/gi, '');
  html = html.replace(/<meta[\s\S]*?>/gi, '');
  html = html.replace(/<title[\s\S]*?<\/title>/gi, '');

  // 2. Remove Microsoft Office specific tags: <o:p>, <w:...>
  html = html.replace(/<\/?\w+:[^>]*>/gi, '');

  // 3. Remove Google Docs internal wrapper: <b id="docs-internal-guid-...">
  html = html.replace(/<b id="docs-internal-guid-[^"]*"[^>]*>([\s\S]*?)<\/b>/gi, '$1');

  // 4. Unwrap Google redirect links
  html = html.replace(/href="([^"]*google\.com\/url\?q=[^"]*)"/gi, (_match, url) => {
    return `href="${unwrapGoogleRedirect(url)}"`;
  });

  // 5. Sanitize with DOMPurify while keeping TipTap tags and attributes
  const sanitized = sanitizeWithDOMPurify(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'hr',
      'strong', 'b', 'em', 'i', 'u', 's', 'del', 'strike',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
      'blockquote', 'pre', 'code',
      'a', 'img', 'span', 'div',
      'label', 'input',
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'target', 'rel',
      'data-type', 'data-latex', 'data-code', 'data-checked',
      'checked', 'type',
      'colspan', 'rowspan', 'colwidth', 'class',
    ],
  });

  // 6. Clean empty spans and excessive nesting
  let cleaned = sanitized
    .replace(/<span\s*>([\s\S]*?)<\/span>/gi, '$1')
    .replace(/<span class=""\s*>([\s\S]*?)<\/span>/gi, '$1')
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/<div>\s*<\/div>/gi, '');

  return cleaned;
}

