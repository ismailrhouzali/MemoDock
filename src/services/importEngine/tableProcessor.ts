/**
 * Universal Table Processor
 * Recognizes and converts Markdown tables, HTML tables, and spreadsheet TSV data (Google Sheets / Excel).
 */

export interface TableProcessResult {
  text: string;
  tablesCount: number;
}

/**
 * Checks if a string contains Tab-Separated Values (TSV) from Excel, Sheets, or Calc.
 */
export function isTsvTable(text: string): boolean {
  if (!text || !text.includes('\t')) return false;

  const lines = text.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return false;

  // Check if at least 2 consecutive lines have tabs
  let tabLineCount = 0;
  for (const line of lines) {
    if (line.includes('\t')) {
      tabLineCount++;
    }
  }

  return tabLineCount >= 2 && tabLineCount >= lines.length * 0.7;
}

/**
 * Converts TSV lines into semantic HTML table.
 */
export function convertTsvToHtmlTable(tsv: string): string {
  const lines = tsv.trim().split('\n').filter((l) => l.trim().length > 0);
  if (lines.length === 0) return '';

  const headerCells = lines[0].split('\t');
  const theadHtml = `<thead><tr>${headerCells
    .map((c) => `<th><p>${c.trim() || '&nbsp;'}</p></th>`)
    .join('')}</tr></thead>`;

  const bodyRows = lines.slice(1).map((line) => {
    const cells = line.split('\t');
    // Pad cells if fewer than header
    while (cells.length < headerCells.length) {
      cells.push('');
    }
    return `<tr>${cells
      .slice(0, headerCells.length)
      .map((c) => `<td><p>${c.trim() || '&nbsp;'}</p></td>`)
      .join('')}</tr>`;
  });

  const tbodyHtml = `<tbody>${bodyRows.join('')}</tbody>`;

  return `\n\n<table>${theadHtml}${tbodyHtml}</table>\n\n`;
}

/**
 * Normalizes Markdown tables to ensure valid GFM table structure for Marked parser.
 */
export function normalizeMarkdownTables(text: string): TableProcessResult {
  if (!text) return { text: '', tablesCount: 0 };

  let processed = text;
  let tablesCount = 0;

  // 1. Convert TSV blocks if present
  if (isTsvTable(processed)) {
    // Check if the entire text is a TSV table or contains a TSV block
    const blocks = processed.split(/\n\s*\n/);
    processed = blocks
      .map((block) => {
        if (isTsvTable(block)) {
          tablesCount++;
          return convertTsvToHtmlTable(block);
        }
        return block;
      })
      .join('\n\n');
  }

  // 2. Count existing Markdown tables
  const mdTableRegex = /\|.+?\|.+?\|\s*\n\s*\|[-:\s|]+\|/g;
  const matches = processed.match(mdTableRegex);
  if (matches) {
    tablesCount += matches.length;
  }

  return { text: processed, tablesCount };
}

