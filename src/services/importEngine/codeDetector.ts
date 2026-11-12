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

  // Match ```lang\ncode\n```
  const codeRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;

  const replaced = text.replace(codeRegex, (_match, rawLang, rawCode) => {
    // If it's a mermaid block, let the mermaid block processor handle it
    if (rawLang.toLowerCase() === 'mermaid') {
      return _match;
    }

    const lang = (rawLang.trim() || inferCodeLanguage(rawCode)).toLowerCase();
    const id = `___CODE_BLOCK_${placeholders.length}_${Math.random().toString(36).substring(2, 6)}___`;

    placeholders.push({
      id,
      lang,
      code: rawCode.replace(/\r\n/g, '\n'),
    });

    codeCount++;
    return `\n\n${id}\n\n`;
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

    // Replace both exact ID and <p>wrapped ID
    const wrappedPattern = new RegExp(`<p>\\s*${item.id}\\s*<\\/p>`, 'g');
    if (wrappedPattern.test(restored)) {
      restored = restored.replace(wrappedPattern, codeHtml);
    } else {
      restored = restored.replace(item.id, codeHtml);
    }
  }

  return restored;
}

