/**
 * Universal Smart Content Import Engine
 * Comprehensive ingestion, normalization, detection, and conversion pipeline.
 */

import { marked } from 'marked';
import { normalizeContent } from './contentNormalizer';
import { processMathematics } from './mathProcessor';
import { normalizeMarkdownTables, isTsvTable, convertTsvToHtmlTable } from './tableProcessor';
import { protectCodeBlocks, restoreCodeBlocks } from './codeDetector';
import { cleanRichHtml, isHtmlJustCodeWrapper } from './htmlCleaner';
import { readTextFile, parseDocxFile, extractPdfText, createPdfAttachment } from './fileParsers';
import { parsePptxFile } from './pptxParser';
import { Attachment } from '../../db/types';

// Configure marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

export interface ImportStats {
  headingsCount: number;
  paragraphsCount: number;
  tablesCount: number;
  mathCount: number;
  codeCount: number;
  imagesCount: number;
}

export interface IngestionResult {
  type: 'html' | 'markdown' | 'tsv' | 'code' | 'text' | 'image' | 'file';
  detectedSource: string;
  html: string;
  plainText: string;
  stats: ImportStats;
  isComplex: boolean;
}

/**
 * Checks whether text contains Markdown syntax patterns.
 */
export function isMarkdownSyntax(text: string): boolean {
  if (!text || text.trim().length === 0) return false;
  const trimmed = text.trim();

  const hasHeadings = /^#{1,6}\s+\S+/m.test(trimmed) || /^[ \t]*\\#{1,6}\s+\S+/m.test(trimmed);
  const hasTable = /\|.+?\|.+?\|\s*\n\s*\|[-:\s|]+\|/m.test(trimmed);
  const hasFencedCode = /```[\s\S]*?```/m.test(trimmed);
  const hasTaskList = /^[\*\-\+]\s+\[[ xX]\]\s+\S+/m.test(trimmed);
  const hasListItems = /(?:^[\*\-\+]\s+\S+.*\n+){2,}/m.test(trimmed) || /(?:^\d+\.\s+\S+.*\n+){2,}/m.test(trimmed);
  const hasBlockquote = /^>\s+\S+/m.test(trimmed) || /^[ \t]*\\>\s+\S+/m.test(trimmed);
  const hasMathDelimiters = /\\\(.+?\\\)/.test(trimmed) || /\\\[[\s\S]*?\\\]/.test(trimmed) || /\$\$[\s\S]*?\$\$/.test(trimmed);
  const hasBoldOrItalic = /(\*\*|__)[^\s\n].*?(\*\*|__)/m.test(trimmed);
  const hasLinks = /\[.+?\]\((?:https?:\/\/|\/|#).*?\)/m.test(trimmed);
  const hasHr = /^(?:---|\*\*\*|___)\s*$/m.test(trimmed) || /^[ \t]*\\(---|\*\*\*|___)\s*$/m.test(trimmed);

  return (
    hasHeadings ||
    hasTable ||
    hasFencedCode ||
    hasTaskList ||
    hasBlockquote ||
    hasMathDelimiters ||
    hasHr ||
    (hasListItems && (hasBoldOrItalic || hasLinks))
  );
}

/**
 * Counts structural elements for the preview badge.
 */
function calculateStats(html: string): ImportStats {
  const headingsCount = (html.match(/<h[1-6][^>]*>/gi) || []).length;
  const paragraphsCount = (html.match(/<p[^>]*>/gi) || []).length;
  const tablesCount = (html.match(/<table[^>]*>/gi) || []).length;
  const mathCount = (html.match(/data-type="math-(?:block|inline)"/gi) || []).length;
  const codeCount = (html.match(/<pre[^>]*><code[^>]*>/gi) || []).length;
  const imagesCount = (html.match(/<img[^>]*>/gi) || []).length;

  return {
    headingsCount,
    paragraphsCount,
    tablesCount,
    mathCount,
    codeCount,
    imagesCount,
  };
}

/**
 * Converts a raw text or Markdown string into fully structured TipTap HTML.
 */
export function convertTextToTipTapHtml(rawText: string): IngestionResult {
  if (!rawText || !rawText.trim()) {
    return {
      type: 'text',
      detectedSource: 'Empty text',
      html: '',
      plainText: '',
      stats: { headingsCount: 0, paragraphsCount: 0, tablesCount: 0, mathCount: 0, codeCount: 0, imagesCount: 0 },
      isComplex: false,
    };
  }

  // 1. Normalize escaped characters & decode HTML entities
  let text = normalizeContent(rawText);

  // 2. Protect Code Blocks
  const codeResult = protectCodeBlocks(text);
  text = codeResult.text;

  // 3. Process Mermaid Diagrams
  text = text.replace(/```mermaid([\s\S]*?)```/gi, (_match, code) => {
    const clean = code.trim().replace(/"/g, '&quot;');
    return `\n\n<div data-type="mermaid-block" data-code="${clean}"></div>\n\n`;
  });

  // 4. Process Mathematical Expressions (LaTeX inline \(...\), $...$, block \[...\], $$...$$)
  const mathResult = processMathematics(text);
  text = mathResult.text;

  // 5. Process Tables (TSV & Markdown)
  const tableResult = normalizeMarkdownTables(text);
  text = tableResult.text;

  // 6. Process Task Lists (- [ ] / - [x])
  text = text.replace(/^([\*\-\+])\s+\[ \]\s+(.*)$/gm, (_match, _bullet, itemText) => {
    return `<li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>${itemText}</p></div></li>`;
  });
  text = text.replace(/^([\*\-\+])\s+\[[xX]\]\s+(.*)$/gm, (_match, _bullet, itemText) => {
    return `<li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>${itemText}</p></div></li>`;
  });
  text = text.replace(
    /(<li data-type="taskItem"[\s\S]*?<\/li>\s*)+/g,
    (taskListBlock) => `<ul data-type="taskList">${taskListBlock}</ul>`
  );

  // 7. Parse with Marked
  const parsed = marked.parse(text, { async: false }) as string;

  // 8. Restore Code Blocks
  let finalHtml = restoreCodeBlocks(parsed, codeResult.placeholders);

  // 9. Clean Rich HTML
  finalHtml = cleanRichHtml(finalHtml);

  const stats = calculateStats(finalHtml);
  const isComplex = stats.headingsCount > 2 || stats.tablesCount > 0 || stats.mathCount > 0 || stats.codeCount > 0;

  let detectedSource = 'Markdown Document';
  if (stats.mathCount > 0) detectedSource = 'Markdown with Mathematical Notation';
  if (stats.tablesCount > 0 && stats.mathCount > 0) detectedSource = 'Scientific/Educational Article';
  else if (stats.tablesCount > 0) detectedSource = 'Document with Tables';
  else if (stats.codeCount > 0) detectedSource = 'Technical Code Document';

  return {
    type: 'markdown',
    detectedSource,
    html: finalHtml,
    plainText: rawText,
    stats,
    isComplex,
  };
}

/**
 * Main Clipboard Event Handler: automatically extracts, detects format, and converts to TipTap HTML.
 */
export function processUniversalClipboard(event: ClipboardEvent): IngestionResult {
  const clipboardData = event.clipboardData;
  if (!clipboardData) {
    return {
      type: 'text',
      detectedSource: 'Clipboard empty',
      html: '',
      plainText: '',
      stats: { headingsCount: 0, paragraphsCount: 0, tablesCount: 0, mathCount: 0, codeCount: 0, imagesCount: 0 },
      isComplex: false,
    };
  }

  // 1. Check for Image Paste
  if (clipboardData.items) {
    for (let i = 0; i < clipboardData.items.length; i++) {
      const item = clipboardData.items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          return {
            type: 'image',
            detectedSource: 'Clipboard Image',
            html: '',
            plainText: '',
            stats: { headingsCount: 0, paragraphsCount: 0, tablesCount: 0, mathCount: 0, codeCount: 0, imagesCount: 1 },
            isComplex: false,
          };
        }
      }
    }
  }

  const plainText = clipboardData.getData('text/plain') || '';
  const htmlText = clipboardData.getData('text/html') || '';

  // 2. Check for Spreadsheet TSV Table
  if (isTsvTable(plainText)) {
    const tsvHtml = convertTsvToHtmlTable(plainText);
    const cleaned = cleanRichHtml(tsvHtml);
    const stats = calculateStats(cleaned);
    return {
      type: 'tsv',
      detectedSource: 'Spreadsheet Table (Excel / Sheets)',
      html: cleaned,
      plainText,
      stats,
      isComplex: true,
    };
  }

  // 3. Check if plainText contains Markdown / LaTeX / AI Escapes
  const hasMarkdown = isMarkdownSyntax(plainText);

  // If HTML is merely a wrapper around code or Markdown (from ChatGPT/GitHub/VS Code):
  const isWrapper = isHtmlJustCodeWrapper(htmlText);

  if (hasMarkdown || isWrapper) {
    return convertTextToTipTapHtml(plainText);
  }

  // 4. Process Rich HTML (from Google Docs, MS Word, Webpages)
  if (htmlText && htmlText.trim().length > 0) {
    const cleaned = cleanRichHtml(htmlText);
    const stats = calculateStats(cleaned);
    return {
      type: 'html',
      detectedSource: 'Rich Web / Word Document',
      html: cleaned,
      plainText,
      stats,
      isComplex: stats.tablesCount > 0 || stats.headingsCount > 2 || stats.codeCount > 0,
    };
  }

  // 5. Fallback: Process plain text
  return convertTextToTipTapHtml(plainText);
}

/**
 * Universal File Import Handler: parses MD, TXT, HTML, DOCX, or PDF.
 */
export async function processUniversalFile(
  file: File,
  noteId: string,
  options?: { extractPdfTextMode?: boolean; enablePptxOcr?: boolean; onProgress?: (msg: string) => void }
): Promise<{
  action: 'insert_html' | 'create_attachment';
  html?: string;
  markdown?: string;
  attachment?: Attachment;
  source: string;
}> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  // 0. PowerPoint (.pptx) Import -> Markdown + OCR
  if (ext === 'pptx') {
    const pptx = await parsePptxFile(file, {
      enableOcr: options?.enablePptxOcr !== false,
      onProgress: options?.onProgress,
    });
    return {
      action: 'insert_html',
      html: pptx.html,
      markdown: pptx.markdown,
      source: `PowerPoint (.pptx): ${file.name} (${pptx.slideCount} slides, ${pptx.imageCount} images, ${pptx.ocrCount} OCR)`,
    };
  }

  // 1. DOCX Import
  if (ext === 'docx') {
    const html = await parseDocxFile(file);
    return {
      action: 'insert_html',
      html,
      source: `Word Document (.docx): ${file.name}`,
    };
  }

  // 2. PDF Import
  if (ext === 'pdf') {
    if (options?.extractPdfTextMode) {
      const extractedText = await extractPdfText(file);
      const converted = convertTextToTipTapHtml(extractedText);
      return {
        action: 'insert_html',
        html: converted.html,
        source: `PDF Text Extraction: ${file.name}`,
      };
    } else {
      const attachment = await createPdfAttachment(file, noteId);
      return {
        action: 'create_attachment',
        attachment,
        source: `PDF Attachment: ${file.name}`,
      };
    }
  }

  // 3. Markdown / Plain Text
  if (ext === 'md' || ext === 'markdown' || ext === 'txt') {
    const text = await readTextFile(file);
    const converted = convertTextToTipTapHtml(text);
    return {
      action: 'insert_html',
      html: converted.html,
      source: `Text / Markdown: ${file.name}`,
    };
  }

  // 4. HTML file
  if (ext === 'html' || ext === 'htm') {
    const rawHtml = await readTextFile(file);
    const cleaned = cleanRichHtml(rawHtml);
    return {
      action: 'insert_html',
      html: cleaned,
      source: `HTML File: ${file.name}`,
    };
  }

  // Fallback as plain text
  const raw = await readTextFile(file);
  const converted = convertTextToTipTapHtml(raw);
  return {
    action: 'insert_html',
    html: converted.html,
    source: `File: ${file.name}`,
  };
}

