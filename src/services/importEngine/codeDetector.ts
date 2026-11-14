/**
 * Universal Code Block Detector & Protector
 * Detects code blocks, infers missing programming languages, and protects code from unwanted markdown parsing.
 */

export interface CodeBlockPlaceholder {
  id: string;
  lang: string;
  code: string;
}

export interface CodeExtractionResult {
  text: string;
  placeholders: CodeBlockPlaceholder[];
  codeCount: number;
}

/**
 * Infers programming language from code content when language tag is missing.
 */
export function inferCodeLanguage(code: string): string {
  const trimmed = code.trim();

  // Python
  if (/(?:def\s+\w+\s*\(|import\s+\w+|from\s+\w+\s+import|class\s+\w+:|elif\s+|self\.|print\s*\()/m.test(trimmed)) {
    return 'python';
  }

  // TypeScript / JavaScript
  if (/(?:const\s+\w+\s*=|let\s+\w+\s*=|function\s+\w*\(|console\.log|export\s+(?:default|const)|interface\s+\w+|type\s+\w+\s*=|=>)/m.test(trimmed)) {
    return 'typescript';
  }

  // HTML / XML
  if (/^<(!DOCTYPE|html|div|span|p|head|body|script|style)/i.test(trimmed)) {
    return 'html';
  }

  // JSON
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      JSON.parse(trimmed);
      return 'json';
    } catch {
      // not strict JSON
    }
  }

  // SQL
  if (/\b(SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|CREATE\s+TABLE|ALTER\s+TABLE|DELETE\s+FROM)\b/i.test(trimmed)) {
    return 'sql';
  }

  // Bash / Shell
  if (/(?:^#!\/bin\/(?:bash|sh)|(?:npm|yarn|pnpm|git|docker|curl|wget|chmod|chown|systemctl)\s+)/m.test(trimmed)) {
    return 'bash';
  }

  // CSS
  if (/(?:[a-z0-9-_#.]+\s*\{\s*[a-z-]+:\s*[^}]+\})/i.test(trimmed)) {
    return 'css';
  }

  // C / C++ / Java
  if (/(?:#include\s*<|public\s+static\s+void\s+main|std::|printf\s*\()/m.test(trimmed)) {
    return 'cpp';
  }

  return 'plaintext';
}

/**
 * Extracts fenced code blocks into placeholders to protect them from Markdown/LaTeX transformations.
 */
export function protectCodeBlocks(text: string): CodeExtractionResult {
  if (!text) return { text: '', placeholders: [], codeCount: 0 };

  const placeholders: CodeBlockPlaceholder[] = [];
  let codeCount = 0;

  // Match ```lang\ncode\n``` supporting CRLF, LF, trailing spaces, and diverse languages (c++, c#, etc.)
  const codeRegex = /```([a-zA-Z0-9_#+.-]*)[^\S\r\n]*\r?\n([\s\S]*?)\r?\n?```/g;

  const replaced = text.replace(codeRegex, (_match, rawLang, rawCode) => {
    // If it's a mermaid block, let the mermaid block processor handle it
    if (rawLang.toLowerCase() === 'mermaid') {
      return _match;
    }

    const lang = (rawLang.trim() || inferCodeLanguage(rawCode)).toLowerCase();
    // Unique placeholder without underscores so Markdown parsers (like marked) do NOT parse them into <em><strong>
    const id = `MEMODOCKCODEBLOCK${placeholders.length}X${Math.random().toString(36).substring(2, 8)}`;

    placeholders.push({
      id,
      lang,
      code: rawCode.replace(/\r\n/g, '\n'),
    });

    codeCount++;
    // Use HTML block div with unique identifier that marked preserves untouched
    return `\n\n<div data-code-placeholder="${id}"></div>\n\n`;
  });

  return { text: replaced, placeholders, codeCount };
}

/**
 * Restores code block placeholders back into semantic HTML pre/code tags with syntax classes.
 */
export function restoreCodeBlocks(html: string, placeholders: CodeBlockPlaceholder[]): string {
  let restored = html;

  for (const item of placeholders) {
    const escapedCode = item.code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const codeHtml = `<pre><code class="language-${item.lang}">${escapedCode}</code></pre>`;

    // 1. Direct replacement of the placeholder div (with or without <p> wrapper)
    const divPattern = new RegExp(`<p>\\s*<div[^>]*data-code-placeholder=["']${item.id}["'][^>]*>\\s*<\\/div>\\s*<\\/p>|<div[^>]*data-code-placeholder=["']${item.id}["'][^>]*>\\s*<\\/div>`, 'gi');
    
    // 2. Bare or p/em/strong wrapped ID pattern
    const generalPattern = new RegExp(`(?:<p>)?(?:<\\w+>)*\\s*${item.id}\\s*(?:<\\/\\w+>)*(?:<\\/p>)?`, 'gi');

    if (divPattern.test(restored)) {
      restored = restored.replace(divPattern, codeHtml);
    } else if (generalPattern.test(restored)) {
      restored = restored.replace(generalPattern, codeHtml);
    } else {
      restored = restored.replace(item.id, codeHtml);
    }
  }

  // Safety cleanup: in case any un-restored legacy placeholder like CODE_BLOCK_0_... lingers in text
  restored = restored.replace(/<p>\s*<em><strong>\s*CODE_BLOCK_\d+_[a-zA-Z0-9]+\s*<\/strong><\/em>\s*<\/p>/gi, '');
  restored = restored.replace(/<em><strong>\s*CODE_BLOCK_\d+_[a-zA-Z0-9]+\s*<\/strong><\/em>/gi, '');

  return restored;
}

