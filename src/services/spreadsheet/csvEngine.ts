/**
 * RFC 4180 Compliant CSV / TSV / Delimited Text Parser & Serializer
 * Zero-dependency, lightweight, supports quoted cells, newlines within quotes,
 * delimiter auto-detection and UTF-8 encoding.
 */

export interface ParsedCsvResult {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

/**
 * Detects the most probable delimiter in the first few lines of text.
 */
export function detectDelimiter(text: string): string {
  const sample = text.slice(0, 4096);
  const lines = sample.split(/\r?\n/).filter((l) => l.trim().length > 0).slice(0, 10);
  if (lines.length === 0) return ',';

  const candidates = [',', ';', '\t', '|'];
  let bestDelimiter = ',';
  let bestScore = -1;

  for (const delim of candidates) {
    const counts = lines.map((line) => {
      let count = 0;
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuote = !inQuote;
        else if (line[i] === delim && !inQuote) count++;
      }
      return count;
    });

    // Delimiter must appear at least once and be consistent across lines
    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;

    if (avg > 0 && max - min <= 1) {
      const score = avg * 10 - (max - min);
      if (score > bestScore) {
        bestScore = score;
        bestDelimiter = delim;
      }
    }
  }

  return bestDelimiter;
}

/**
 * Parses raw CSV/TSV text into structured headers and rows.
 */
export function parseCsv(rawText: string, forcedDelimiter?: string): ParsedCsvResult {
  // Strip UTF-8 BOM if present
  let text = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText;
  const delimiter = forcedDelimiter || detectDelimiter(text);

  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote "" -> "
        currentCell += '"';
        i += 2;
        continue;
      } else {
        // Toggle quotes mode
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (!inQuotes && char === delimiter) {
      // Cell boundary
      currentRow.push(currentCell.trim());
      currentCell = '';
      i++;
      continue;
    }

    if (!inQuotes && (char === '\r' || char === '\n')) {
      // Row boundary
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n of \r\n
      }
      currentRow.push(currentCell.trim());
      currentCell = '';

      // Ignore entirely empty rows at end
      if (currentRow.some((c) => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      i++;
      continue;
    }

    currentCell += char;
    i++;
  }

  // Push final cell/row if remaining
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some((c) => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) {
    return {
      headers: ['Column A', 'Column B', 'Column C'],
      rows: [['', '', '']],
      delimiter,
    };
  }

  // First row as headers
  let headers = rows[0];
  const dataRows = rows.slice(1);

  // If only 1 row or headers are empty numbers, handle gracefully
  headers = headers.map((h, idx) => (h && h.trim().length > 0 ? h.trim() : `Column ${idx + 1}`));

  // Normalize column count across all rows
  const colCount = headers.length;
  const normalizedRows = dataRows.map((r) => {
    if (r.length < colCount) {
      return [...r, ...Array(colCount - r.length).fill('')];
    }
    return r.slice(0, colCount);
  });

  return {
    headers,
    rows: normalizedRows.length > 0 ? normalizedRows : [Array(colCount).fill('')],
    delimiter,
  };
}

/**
 * Serializes headers and rows back into RFC 4180 CSV string.
 */
export function exportToCsv(headers: string[], rows: string[][], delimiter = ','): string {
  const formatCell = (val: string | null | undefined): string => {
    const s = val === null || val === undefined ? '' : String(val);
    if (s.includes('"') || s.includes(delimiter) || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines: string[] = [];
  lines.push(headers.map(formatCell).join(delimiter));

  for (const row of rows) {
    lines.push(row.map(formatCell).join(delimiter));
  }

  return lines.join('\r\n');
}

/**
 * Triggers browser download of CSV file.
 */
export function downloadCsvFile(filename: string, csvContent: string): void {
  const cleanName = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

