/**
 * Native Zero-Dependency XLSX Workbook Reader & XML Parser
 * Decompresses standard .xlsx zip packages using browser standard DecompressionStream
 * and parses worksheets and shared string tables via DOMParser.
 */

export interface XlsxSheetResult {
  name: string;
  headers: string[];
  rows: string[][];
}

/**
 * Reads local files from a ZIP archive ArrayBuffer.
 */
async function unzipEntries(buffer: ArrayBuffer): Promise<Map<string, string>> {
  const fileMap = new Map<string, string>();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  let offset = 0;
  const len = bytes.length;

  while (offset + 30 < len) {
    // Check local header signature: PK\x03\x04 (0x04034b50)
    const sig = view.getUint32(offset, true);
    if (sig !== 0x04034b50) {
      break;
    }

    const compMethod = view.getUint16(offset + 8, true);
    const compSize = view.getUint32(offset + 18, true);
    const uncompSize = view.getUint32(offset + 22, true);
    const nameLen = view.getUint16(offset + 26, true);
    const extraLen = view.getUint16(offset + 28, true);

    const nameBytes = bytes.slice(offset + 30, offset + 30 + nameLen);
    const fileName = new TextDecoder().decode(nameBytes);
    const dataStart = offset + 30 + nameLen + extraLen;
    const dataEnd = dataStart + compSize;

    if (dataEnd <= len && compSize > 0) {
      const compressedData = bytes.slice(dataStart, dataEnd);
      let text = '';

      if (compMethod === 0) {
        // Uncompressed
        text = new TextDecoder().decode(compressedData);
      } else if (compMethod === 8) {
        // Deflate compression - use native Web Streams DecompressionStream
        try {
          const ds = new DecompressionStream('deflate-raw');
          const writer = ds.writable.getWriter();
          writer.write(compressedData);
          writer.close();

          const response = new Response(ds.readable);
          const decompressed = await response.arrayBuffer();
          text = new TextDecoder().decode(decompressed);
        } catch {
          // Fallback or ignore unparsable streams
        }
      }

      if (text) {
        fileMap.set(fileName.replace(/\\/g, '/'), text);
      }
    }

    // Move to next local file header
    offset = dataEnd;
    // Align or find next PK
    while (offset + 4 < len && view.getUint32(offset, true) !== 0x04034b50) {
      offset++;
      // Stop if central directory signature PK\x01\x02
      if (view.getUint32(offset, true) === 0x02014b50) break;
    }
    if (offset + 4 < len && view.getUint32(offset, true) === 0x02014b50) {
      break;
    }
  }

  return fileMap;
}

/**
 * Converts Excel column letter (e.g. 'A', 'B', 'AA') to 0-based index.
 */
function colLetterToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
}

/**
 * Parses an XLSX ArrayBuffer into structured sheets, headers, and rows.
 */
export async function parseXlsxWorkbook(buffer: ArrayBuffer): Promise<XlsxSheetResult[]> {
  const files = await unzipEntries(buffer);
  const domParser = new DOMParser();

  // 1. Parse Shared Strings dictionary if present (xl/sharedStrings.xml)
  const sharedStrings: string[] = [];
  const sstXml = files.get('xl/sharedStrings.xml');
  if (sstXml) {
    const sstDoc = domParser.parseFromString(sstXml, 'application/xml');
    const siNodes = sstDoc.getElementsByTagName('si');
    for (let i = 0; i < siNodes.length; i++) {
      const tNodes = siNodes[i].getElementsByTagName('t');
      let combined = '';
      for (let j = 0; j < tNodes.length; j++) {
        combined += tNodes[j].textContent || '';
      }
      sharedStrings.push(combined);
    }
  }

  // 2. Discover Sheet Names from xl/workbook.xml
  const sheetNames: { rId: string; name: string }[] = [];
  const wbXml = files.get('xl/workbook.xml');
  if (wbXml) {
    const wbDoc = domParser.parseFromString(wbXml, 'application/xml');
    const sheets = wbDoc.getElementsByTagName('sheet');
    for (let i = 0; i < sheets.length; i++) {
      const name = sheets[i].getAttribute('name') || `Sheet ${i + 1}`;
      const rId = sheets[i].getAttribute('r:id') || `rId${i + 1}`;
      sheetNames.push({ rId, name });
    }
  }

  // 3. Parse individual worksheets
  const results: XlsxSheetResult[] = [];
  let sheetIndex = 1;

  for (const [path, content] of files.entries()) {
    if (path.startsWith('xl/worksheets/sheet') && path.endsWith('.xml')) {
      const sheetName = sheetNames[sheetIndex - 1]?.name || `Sheet ${sheetIndex}`;
      sheetIndex++;

      const sheetDoc = domParser.parseFromString(content, 'application/xml');
      const rowNodes = sheetDoc.getElementsByTagName('row');
      const rawRows: { rowIndex: number; cells: { colIndex: number; val: string }[] }[] = [];

      let maxCol = 0;

      for (let r = 0; r < rowNodes.length; r++) {
        const rowNode = rowNodes[r];
        const rIndex = parseInt(rowNode.getAttribute('r') || String(r + 1), 10) - 1;
        const cNodes = rowNode.getElementsByTagName('c');
        const cells: { colIndex: number; val: string }[] = [];

        for (let c = 0; c < cNodes.length; c++) {
          const cNode = cNodes[c];
          const cellRef = cNode.getAttribute('r') || '';
          const colLetters = cellRef.replace(/[0-9]/g, '');
          const colIndex = colLetters ? colLetterToIndex(colLetters) : c;
          if (colIndex > maxCol) maxCol = colIndex;

          const cellType = cNode.getAttribute('t');
          const vNode = cNode.getElementsByTagName('v')[0];
          let val = vNode?.textContent || '';

          if (cellType === 's') {
            // Shared string lookup
            const sstIdx = parseInt(val, 10);
            val = sharedStrings[sstIdx] || '';
          } else if (cellType === 'b') {
            // Boolean
            val = val === '1' ? 'TRUE' : 'FALSE';
          } else if (cellType === 'inlineStr') {
            const isNode = cNode.getElementsByTagName('t')[0];
            val = isNode?.textContent || '';
          }

          cells.push({ colIndex, val });
        }

        rawRows.push({ rowIndex: rIndex, cells });
      }

      if (rawRows.length === 0) continue;

      // Normalize into 2D grid
      const colCount = Math.max(maxCol + 1, 1);
      const grid: string[][] = [];

      for (const r of rawRows) {
        const rowArr = Array(colCount).fill('');
        for (const cell of r.cells) {
          if (cell.colIndex < colCount) {
            rowArr[cell.colIndex] = cell.val;
          }
        }
        grid.push(rowArr);
      }

      if (grid.length > 0) {
        let headers = grid[0].map((h, i) => (h && h.trim().length > 0 ? h.trim() : `Column ${i + 1}`));
        const dataRows = grid.slice(1);

        results.push({
          name: sheetName,
          headers,
          rows: dataRows.length > 0 ? dataRows : [Array(headers.length).fill('')],
        });
      }
    }
  }

  // Fallback if no sheet parsed
  if (results.length === 0) {
    results.push({
      name: 'Sheet 1',
      headers: ['Column A', 'Column B', 'Column C'],
      rows: [['', '', '']],
    });
  }

  return results;
}

