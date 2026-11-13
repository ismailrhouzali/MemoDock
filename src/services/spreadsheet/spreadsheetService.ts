import { db } from '../../db/db';
import { Spreadsheet, SpreadsheetSheet } from '../../db/types';
import { parseCsv, exportToCsv, downloadCsvFile } from './csvEngine';
import { parseXlsxWorkbook } from './xlsxEngine';

export const spreadsheetService = {
  /**
   * Retrieves all non-trash spreadsheets, sorted by updatedAt descending.
   */
  async getAll(): Promise<Spreadsheet[]> {
    try {
      if (!db.spreadsheets) return [];
      const all = await db.spreadsheets.toArray();
      return all
        .filter((s) => !s.isTrash)
        .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch (err) {
      console.warn('Error reading spreadsheets from db:', err);
      return [];
    }
  },

  /**
   * Retrieves a single spreadsheet by ID.
   */
  async getById(id: string): Promise<Spreadsheet | undefined> {
    try {
      if (!db.spreadsheets) return undefined;
      return await db.spreadsheets.get(id);
    } catch (err) {
      console.warn(`Error reading spreadsheet ${id}:`, err);
      return undefined;
    }
  },

  /**
   * Creates a spreadsheet document from raw CSV/TSV text.
   */
  async createFromCsv(
    title: string,
    csvText: string,
    collection = 'Data Science',
    noteId: string | null = null,
    sourceFileName?: string
  ): Promise<Spreadsheet> {
    const parsed = parseCsv(csvText);
    const now = Date.now();

    const sheet: SpreadsheetSheet = {
      id: `sheet-${now}-0`,
      name: 'Sheet 1',
      headers: parsed.headers,
      rows: parsed.rows,
    };

    const newSpreadsheet: Spreadsheet = {
      id: `sheet-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim() || 'Untitled Spreadsheet',
      sheets: [sheet],
      activeSheetIndex: 0,
      tags: [],
      collection,
      noteId,
      sourceFileName,
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isTrash: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.spreadsheets.add(newSpreadsheet);
    return newSpreadsheet;
  },

  /**
   * Creates a spreadsheet document from an XLSX file ArrayBuffer.
   */
  async createFromXlsx(
    title: string,
    buffer: ArrayBuffer,
    collection = 'Data Science',
    noteId: string | null = null,
    sourceFileName?: string
  ): Promise<Spreadsheet> {
    const parsedSheets = await parseXlsxWorkbook(buffer);
    const now = Date.now();

    const sheets: SpreadsheetSheet[] = parsedSheets.map((ps, idx) => ({
      id: `sheet-${now}-${idx}`,
      name: ps.name,
      headers: ps.headers,
      rows: ps.rows,
    }));

    const newSpreadsheet: Spreadsheet = {
      id: `sheet-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: title.trim() || 'Untitled Workbook',
      sheets,
      activeSheetIndex: 0,
      tags: [],
      collection,
      noteId,
      sourceFileName,
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isTrash: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.spreadsheets.add(newSpreadsheet);
    return newSpreadsheet;
  },

  /**
   * Creates a blank new spreadsheet.
   */
  async createBlank(
    title = 'New Spreadsheet',
    collection = 'Data Science',
    noteId: string | null = null
  ): Promise<Spreadsheet> {
    const now = Date.now();
    const sheet: SpreadsheetSheet = {
      id: `sheet-${now}-0`,
      name: 'Sheet 1',
      headers: ['A', 'B', 'C', 'D', 'E'],
      rows: Array(10).fill(null).map(() => ['', '', '', '', '']),
    };

    const newSpreadsheet: Spreadsheet = {
      id: `sheet-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      sheets: [sheet],
      activeSheetIndex: 0,
      tags: [],
      collection,
      noteId,
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isTrash: false,
      createdAt: now,
      updatedAt: now,
    };

    await db.spreadsheets.add(newSpreadsheet);
    return newSpreadsheet;
  },

  /**
   * Updates partial spreadsheet fields.
   */
  async update(id: string, updates: Partial<Spreadsheet>): Promise<void> {
    try {
      await db.spreadsheets.update(id, {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn(`Error updating spreadsheet ${id}:`, err);
    }
  },

  /**
   * Updates a specific cell value in real-time.
   */
  async updateCell(
    spreadsheetId: string,
    sheetIndex: number,
    rowIdx: number,
    colIdx: number,
    value: string
  ): Promise<void> {
    const s = await this.getById(spreadsheetId);
    if (!s || !s.sheets[sheetIndex]) return;

    const sheet = s.sheets[sheetIndex];
    if (rowIdx < sheet.rows.length && colIdx < sheet.headers.length) {
      sheet.rows[rowIdx][colIdx] = value;
      await this.update(spreadsheetId, { sheets: s.sheets });
    }
  },

  /**
   * Appends or inserts a row.
   */
  async addRow(spreadsheetId: string, sheetIndex: number, atIndex?: number): Promise<void> {
    const s = await this.getById(spreadsheetId);
    if (!s || !s.sheets[sheetIndex]) return;

    const sheet = s.sheets[sheetIndex];
    const newRow = Array(sheet.headers.length).fill('');
    if (atIndex !== undefined && atIndex >= 0 && atIndex <= sheet.rows.length) {
      sheet.rows.splice(atIndex, 0, newRow);
    } else {
      sheet.rows.push(newRow);
    }
    await this.update(spreadsheetId, { sheets: s.sheets });
  },

  /**
   * Deletes a row.
   */
  async deleteRow(spreadsheetId: string, sheetIndex: number, rowIdx: number): Promise<void> {
    const s = await this.getById(spreadsheetId);
    if (!s || !s.sheets[sheetIndex]) return;

    const sheet = s.sheets[sheetIndex];
    if (sheet.rows.length > 1 && rowIdx >= 0 && rowIdx < sheet.rows.length) {
      sheet.rows.splice(rowIdx, 1);
      await this.update(spreadsheetId, { sheets: s.sheets });
    }
  },

  /**
   * Appends a column with header name.
   */
  async addColumn(spreadsheetId: string, sheetIndex: number, headerName?: string): Promise<void> {
    const s = await this.getById(spreadsheetId);
    if (!s || !s.sheets[sheetIndex]) return;

    const sheet = s.sheets[sheetIndex];
    const newHeader = headerName?.trim() || `Col ${sheet.headers.length + 1}`;
    sheet.headers.push(newHeader);
    for (const r of sheet.rows) {
      r.push('');
    }
    await this.update(spreadsheetId, { sheets: s.sheets });
  },

  /**
   * Deletes a column.
   */
  async deleteColumn(spreadsheetId: string, sheetIndex: number, colIdx: number): Promise<void> {
    const s = await this.getById(spreadsheetId);
    if (!s || !s.sheets[sheetIndex]) return;

    const sheet = s.sheets[sheetIndex];
    if (sheet.headers.length > 1 && colIdx >= 0 && colIdx < sheet.headers.length) {
      sheet.headers.splice(colIdx, 1);
      for (const r of sheet.rows) {
        r.splice(colIdx, 1);
      }
      await this.update(spreadsheetId, { sheets: s.sheets });
    }
  },

  /**
   * Adds a new worksheet tab.
   */
  async addSheet(spreadsheetId: string, sheetName?: string): Promise<void> {
    const s = await this.getById(spreadsheetId);
    if (!s) return;

    const name = sheetName?.trim() || `Sheet ${s.sheets.length + 1}`;
    const newSheet: SpreadsheetSheet = {
      id: `sheet-${Date.now()}-${s.sheets.length}`,
      name,
      headers: ['A', 'B', 'C', 'D'],
      rows: Array(5).fill(null).map(() => ['', '', '', '']),
    };
    s.sheets.push(newSheet);
    await this.update(spreadsheetId, { sheets: s.sheets, activeSheetIndex: s.sheets.length - 1 });
  },

  /**
   * Moves a spreadsheet to trash.
   */
  async delete(id: string): Promise<void> {
    try {
      await db.spreadsheets.update(id, { isTrash: true, updatedAt: Date.now() });
    } catch (err) {
      console.warn(`Error moving spreadsheet ${id} to trash:`, err);
    }
  },

  /**
   * Exports the active sheet to CSV format.
   */
  exportCsv(spreadsheet: Spreadsheet, sheetIndex = 0): string {
    const sheet = spreadsheet.sheets[sheetIndex] || spreadsheet.sheets[0];
    if (!sheet) return '';
    return exportToCsv(sheet.headers, sheet.rows);
  },

  /**
   * Downloads CSV file.
   */
  download(spreadsheet: Spreadsheet, sheetIndex = 0): void {
    const csv = this.exportCsv(spreadsheet, sheetIndex);
    const sheet = spreadsheet.sheets[sheetIndex] || spreadsheet.sheets[0];
    const name = `${spreadsheet.title}${spreadsheet.sheets.length > 1 ? `_${sheet.name}` : ''}.csv`;
    downloadCsvFile(name, csv);
  },
};

