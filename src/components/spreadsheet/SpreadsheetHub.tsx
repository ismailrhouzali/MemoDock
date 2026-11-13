import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Table as TableIcon,
  Plus,
  Upload,
  Download,
  Trash2,
  Search,
  Maximize2,
  Minimize2,
  ArrowUpDown,
  FileSpreadsheet,
  PlusCircle,
  X,
  Check,
  ChevronLeft,
  Folder as FolderIcon,
  Star,
  Copy,
  Filter,
} from 'lucide-react';
import { Spreadsheet, SpreadsheetSheet } from '../../db/types';
import { spreadsheetService } from '../../services/spreadsheet/spreadsheetService';

interface SpreadsheetHubProps {
  onNavigateToNote?: (noteId: string) => void;
  selectedSpreadsheetId?: string | null;
}

export const SpreadsheetHub: React.FC<SpreadsheetHubProps> = ({
  onNavigateToNote,
  selectedSpreadsheetId: initialSelectedId = null,
}) => {
  const [spreadsheets, setSpreadsheets] = useState<Spreadsheet[]>([]);
  const [activeSpreadsheet, setActiveSpreadsheet] = useState<Spreadsheet | null>(null);
  const [activeSheetIdx, setActiveSheetIdx] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCollection, setFilterCollection] = useState<string>('all');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingCell, setEditingCell] = useState<{ r: number; c: number } | null>(null);
  const [cellInputValue, setCellInputValue] = useState('');
  const [gridSearch, setGridSearch] = useState('');
  const [editingHeaderIdx, setEditingHeaderIdx] = useState<number | null>(null);
  const [headerInputValue, setHeaderInputValue] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cellInputRef = useRef<HTMLInputElement>(null);

  // Load spreadsheets from DB
  const loadSpreadsheets = async () => {
    const list = await spreadsheetService.getAll();
    setSpreadsheets(list);
    if (initialSelectedId) {
      const match = list.find((s) => s.id === initialSelectedId);
      if (match) {
        setActiveSpreadsheet(match);
        setActiveSheetIdx(match.activeSheetIndex || 0);
      }
    }
  };

  useEffect(() => {
    loadSpreadsheets();
  }, [initialSelectedId]);

  // Focus cell input when editing begins
  useEffect(() => {
    if (editingCell && cellInputRef.current) {
      cellInputRef.current.focus();
      cellInputRef.current.select();
    }
  }, [editingCell]);

  // Handle File Upload (.csv or .xlsx)
  const handleFileUpload = async (file: File) => {
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv');
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx') || file.type.includes('spreadsheetml');

    if (isCsv) {
      const text = await file.text();
      const created = await spreadsheetService.createFromCsv(
        nameWithoutExt,
        text,
        'Data Science',
        null,
        file.name
      );
      await loadSpreadsheets();
      setActiveSpreadsheet(created);
      setActiveSheetIdx(0);
    } else if (isXlsx) {
      const buffer = await file.arrayBuffer();
      const created = await spreadsheetService.createFromXlsx(
        nameWithoutExt,
        buffer,
        'Data Science',
        null,
        file.name
      );
      await loadSpreadsheets();
      setActiveSpreadsheet(created);
      setActiveSheetIdx(0);
    }
  };

  // Drag and drop file handling
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  // Create new blank sheet
  const handleCreateBlank = async () => {
    const created = await spreadsheetService.createBlank('New Spreadsheet');
    await loadSpreadsheets();
    setActiveSpreadsheet(created);
    setActiveSheetIdx(0);
  };

  // Active Sheet accessor
  const currentSheet: SpreadsheetSheet | undefined = activeSpreadsheet?.sheets[activeSheetIdx];

  // Cell editing commit
  const commitCellEdit = async () => {
    if (!activeSpreadsheet || !currentSheet || !editingCell) return;
    const { r, c } = editingCell;
    const currentVal = currentSheet.rows[r]?.[c];
    if (currentVal !== cellInputValue) {
      await spreadsheetService.updateCell(
        activeSpreadsheet.id,
        activeSheetIdx,
        r,
        c,
        cellInputValue
      );
      const updated = await spreadsheetService.getById(activeSpreadsheet.id);
      if (updated) setActiveSpreadsheet(updated);
    }
    setEditingCell(null);
  };

  // Cell key navigation
  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (!currentSheet || !editingCell) return;
    const { r, c } = editingCell;

    if (e.key === 'Enter') {
      e.preventDefault();
      commitCellEdit();
      // Move to next row
      if (r + 1 < currentSheet.rows.length) {
        setEditingCell({ r: r + 1, c });
        setCellInputValue(currentSheet.rows[r + 1][c] || '');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      commitCellEdit();
      // Move to next column
      if (c + 1 < currentSheet.headers.length) {
        setEditingCell({ r, c: c + 1 });
        setCellInputValue(currentSheet.rows[r][c + 1] || '');
      } else if (r + 1 < currentSheet.rows.length) {
        setEditingCell({ r: r + 1, c: 0 });
        setCellInputValue(currentSheet.rows[r + 1][0] || '');
      }
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };

  // Header rename commit
  const commitHeaderEdit = async () => {
    if (!activeSpreadsheet || !currentSheet || editingHeaderIdx === null) return;
    const trimmed = headerInputValue.trim() || `Col ${editingHeaderIdx + 1}`;
    currentSheet.headers[editingHeaderIdx] = trimmed;
    await spreadsheetService.update(activeSpreadsheet.id, { sheets: activeSpreadsheet.sheets });
    setEditingHeaderIdx(null);
  };

  // Add row
  const handleAddRow = async () => {
    if (!activeSpreadsheet) return;
    await spreadsheetService.addRow(activeSpreadsheet.id, activeSheetIdx);
    const updated = await spreadsheetService.getById(activeSpreadsheet.id);
    if (updated) setActiveSpreadsheet(updated);
  };

  // Delete row
  const handleDeleteRow = async (rowIdx: number) => {
    if (!activeSpreadsheet) return;
    await spreadsheetService.deleteRow(activeSpreadsheet.id, activeSheetIdx, rowIdx);
    const updated = await spreadsheetService.getById(activeSpreadsheet.id);
    if (updated) setActiveSpreadsheet(updated);
  };

  // Add column
  const handleAddCol = async () => {
    if (!activeSpreadsheet) return;
    await spreadsheetService.addColumn(activeSpreadsheet.id, activeSheetIdx);
    const updated = await spreadsheetService.getById(activeSpreadsheet.id);
    if (updated) setActiveSpreadsheet(updated);
  };

  // Delete column
  const handleDeleteCol = async (colIdx: number) => {
    if (!activeSpreadsheet) return;
    await spreadsheetService.deleteColumn(activeSpreadsheet.id, activeSheetIdx, colIdx);
    const updated = await spreadsheetService.getById(activeSpreadsheet.id);
    if (updated) setActiveSpreadsheet(updated);
  };

  // Sort rows by column
  const [sortCol, setSortCol] = useState<{ idx: number; asc: boolean } | null>(null);

  const handleSortCol = (colIdx: number) => {
    if (!currentSheet) return;
    const isAsc = sortCol?.idx === colIdx ? !sortCol.asc : true;
    setSortCol({ idx: colIdx, asc: isAsc });

    currentSheet.rows.sort((a, b) => {
      const valA = a[colIdx] || '';
      const valB = b[colIdx] || '';
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (!isNaN(numA) && !isNaN(numB)) {
        return isAsc ? numA - numB : numB - numA;
      }
      return isAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    if (activeSpreadsheet) {
      spreadsheetService.update(activeSpreadsheet.id, { sheets: activeSpreadsheet.sheets });
    }
  };

  // Filtered spreadsheets list
  const filteredSpreadsheets = useMemo(() => {
    return spreadsheets.filter((s) => {
      if (filterCollection !== 'all' && s.collection !== filterCollection) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = s.title.toLowerCase().includes(q);
        const matchTags = s.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchTitle && !matchTags) return false;
      }
      return true;
    });
  }, [spreadsheets, filterCollection, searchQuery]);

  // Collections list
  const collections = useMemo(() => {
    const set = new Set<string>();
    spreadsheets.forEach((s) => {
      if (s.collection) set.add(s.collection);
    });
    return Array.from(set);
  }, [spreadsheets]);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full overflow-hidden bg-stone-50/50 dark:bg-obsidian-950 text-stone-800 dark:text-stone-200 ${
        isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-zinc-950' : ''
      }`}
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv, .xlsx, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />

      {/* VIEW 1: ACTIVE SPREADSHEET EDITOR */}
      {activeSpreadsheet && currentSheet ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Editor Header Bar */}
          <div className="p-3 border-b border-stone-200/80 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md flex items-center justify-between gap-3 flex-shrink-0 z-10">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => {
                  setActiveSpreadsheet(null);
                  loadSpreadsheets();
                }}
                className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
                title="Back to Spreadsheets"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </div>

              {/* Editable Title */}
              <input
                type="text"
                value={activeSpreadsheet.title}
                onChange={(e) => {
                  const newTitle = e.target.value;
                  setActiveSpreadsheet({ ...activeSpreadsheet, title: newTitle });
                  spreadsheetService.update(activeSpreadsheet.id, { title: newTitle });
                }}
                className="font-bold text-sm bg-transparent border-b border-transparent hover:border-stone-300 dark:hover:border-zinc-700 focus:border-emerald-500 focus:outline-none px-1 text-stone-900 dark:text-stone-100 truncate max-w-sm"
              />

              <span className="text-[11px] text-stone-400 dark:text-zinc-500 hidden sm:inline">
                {currentSheet.rows.length} rows × {currentSheet.headers.length} cols
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Add Row Button */}
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center gap-1 px-2 py-1 text-xs text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-md border border-stone-200/60 dark:border-zinc-800 transition"
                title="Add New Row"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Row</span>
              </button>

              {/* Add Column Button */}
              <button
                type="button"
                onClick={handleAddCol}
                className="flex items-center gap-1 px-2 py-1 text-xs text-stone-700 dark:text-zinc-300 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-md border border-stone-200/60 dark:border-zinc-800 transition"
                title="Add New Column"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden md:inline">Column</span>
              </button>

              {/* Export to CSV */}
              <button
                type="button"
                onClick={() => spreadsheetService.download(activeSpreadsheet, activeSheetIdx)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md shadow-xs transition font-medium"
                title="Export as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-md transition"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Table Grid View Container */}
          <div className="flex-1 overflow-auto bg-white dark:bg-zinc-950 p-2">
            <div className="inline-block min-w-full align-middle border border-stone-200 dark:border-zinc-800 rounded-lg shadow-2xs overflow-hidden">
              <table className="min-w-full divide-y divide-stone-200 dark:divide-zinc-800 border-collapse text-xs">
                {/* Table Header Row */}
                <thead className="bg-stone-100/90 dark:bg-zinc-900/90 sticky top-0 z-10 select-none">
                  <tr>
                    {/* Index header */}
                    <th className="w-12 px-2 py-2 text-center font-mono text-[10px] text-stone-400 dark:text-zinc-500 border-r border-stone-200/80 dark:border-zinc-800">
                      #
                    </th>

                    {/* Column Headers */}
                    {currentSheet.headers.map((h, colIdx) => (
                      <th
                        key={colIdx}
                        className="group relative px-3 py-2 text-left font-semibold text-stone-700 dark:text-zinc-200 border-r border-stone-200/80 dark:border-zinc-800 min-w-[120px]"
                      >
                        {editingHeaderIdx === colIdx ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={headerInputValue}
                              onChange={(e) => setHeaderInputValue(e.target.value)}
                              onBlur={commitHeaderEdit}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitHeaderEdit();
                                if (e.key === 'Escape') setEditingHeaderIdx(null);
                              }}
                              className="w-full px-1 py-0.5 bg-white dark:bg-zinc-950 border border-emerald-500 rounded text-xs focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={commitHeaderEdit}
                              className="text-emerald-600 hover:text-emerald-700"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between gap-1">
                            <span
                              onDoubleClick={() => {
                                setEditingHeaderIdx(colIdx);
                                setHeaderInputValue(h);
                              }}
                              className="truncate cursor-pointer hover:underline"
                              title="Double click to rename column"
                            >
                              {h}
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                              <button
                                type="button"
                                onClick={() => handleSortCol(colIdx)}
                                className="p-0.5 hover:text-emerald-600 rounded"
                                title="Sort Column"
                              >
                                <ArrowUpDown className="w-3 h-3" />
                              </button>
                              {currentSheet.headers.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCol(colIdx)}
                                  className="p-0.5 hover:text-red-600 rounded"
                                  title="Delete Column"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Table Body Rows */}
                <tbody className="divide-y divide-stone-200/60 dark:divide-zinc-800/60 bg-white dark:bg-zinc-950">
                  {currentSheet.rows.map((row, rowIdx) => (
                    <tr
                      key={rowIdx}
                      className="group hover:bg-stone-50/70 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      {/* Row Index & Delete Trigger */}
                      <td className="w-12 px-2 py-1.5 text-center font-mono text-[10px] text-stone-400 dark:text-zinc-600 border-r border-stone-200/80 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-900/30">
                        <div className="flex items-center justify-center relative">
                          <span className="group-hover:hidden">{rowIdx + 1}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(rowIdx)}
                            className="hidden group-hover:inline-block text-red-500 hover:text-red-700"
                            title="Delete Row"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Cells */}
                      {row.map((cellVal, colIdx) => {
                        const isEditing = editingCell?.r === rowIdx && editingCell?.c === colIdx;
                        return (
                          <td
                            key={colIdx}
                            onClick={() => {
                              if (!isEditing) {
                                setEditingCell({ r: rowIdx, c: colIdx });
                                setCellInputValue(cellVal);
                              }
                            }}
                            className={`px-3 py-1.5 border-r border-stone-200/50 dark:border-zinc-800/50 text-stone-800 dark:text-stone-200 cursor-text select-text ${
                              isEditing
                                ? 'p-0 ring-2 ring-emerald-500 bg-white dark:bg-zinc-900 z-20'
                                : ''
                            }`}
                          >
                            {isEditing ? (
                              <input
                                ref={cellInputRef}
                                type="text"
                                value={cellInputValue}
                                onChange={(e) => setCellInputValue(e.target.value)}
                                onBlur={commitCellEdit}
                                onKeyDown={handleCellKeyDown}
                                className="w-full h-full px-3 py-1.5 bg-transparent text-stone-900 dark:text-stone-100 text-xs focus:outline-none"
                              />
                            ) : (
                              <div className="truncate min-h-[18px]">
                                {cellVal || <span className="opacity-0">.</span>}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Worksheet Tabs Footer */}
          <div className="p-2 border-t border-stone-200/80 dark:border-zinc-800 bg-stone-100/70 dark:bg-zinc-950/70 flex items-center justify-between text-xs flex-shrink-0">
            <div className="flex items-center gap-1 overflow-x-auto">
              {activeSpreadsheet.sheets.map((sh, idx) => (
                <button
                  key={sh.id || idx}
                  type="button"
                  onClick={() => setActiveSheetIdx(idx)}
                  className={`px-3 py-1 rounded-md transition font-medium text-xs flex items-center gap-1.5 ${
                    activeSheetIdx === idx
                      ? 'bg-white dark:bg-zinc-800 text-emerald-700 dark:text-emerald-400 shadow-2xs font-semibold border border-stone-200/80 dark:border-zinc-700'
                      : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                  }`}
                >
                  <TableIcon className="w-3 h-3" />
                  <span>{sh.name}</span>
                </button>
              ))}

              <button
                type="button"
                onClick={async () => {
                  await spreadsheetService.addSheet(activeSpreadsheet.id);
                  const updated = await spreadsheetService.getById(activeSpreadsheet.id);
                  if (updated) {
                    setActiveSpreadsheet(updated);
                    setActiveSheetIdx(updated.sheets.length - 1);
                  }
                }}
                className="p-1 text-stone-400 hover:text-emerald-600 rounded"
                title="Add New Sheet Tab"
              >
                <PlusCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="text-[11px] text-stone-400">
              <span>Press Tab / Enter to navigate cells</span>
            </div>
          </div>
        </div>
      ) : (
        /* VIEW 2: SPREADSHEETS REPOSITORY LIST */
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header Bar */}
          <div className="p-4 border-b border-stone-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  <span>Spreadsheets & Datasets</span>
                  <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-xs font-medium text-stone-500">
                    {spreadsheets.length} files
                  </span>
                </h2>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                  Inspect, edit, and organize CSV and XLSX tables locally
                </p>
              </div>
            </div>

            {/* Actions: Import CSV / XLSX + Blank */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-lg border border-stone-200/80 dark:border-zinc-800 transition"
                title="Import CSV or XLSX file"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Import File</span>
              </button>

              <button
                type="button"
                onClick={handleCreateBlank}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-xs transition"
                title="Create Blank Spreadsheet"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Spreadsheet</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="px-4 py-2 border-b border-stone-200/60 dark:border-zinc-800/60 bg-stone-50/50 dark:bg-zinc-950/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search spreadsheet title or tags..."
                  className="w-full pl-8 pr-3 py-1 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Collection Filter */}
            {collections.length > 0 && (
              <div className="flex items-center gap-1 text-[11px]">
                <Filter className="w-3 h-3 text-stone-400" />
                <select
                  value={filterCollection}
                  onChange={(e) => setFilterCollection(e.target.value)}
                  className="bg-transparent text-stone-600 dark:text-zinc-400 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Collections</option>
                  {collections.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Spreadsheets Cards Grid */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {filteredSpreadsheets.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-stone-200 dark:border-zinc-800 rounded-xl space-y-3">
                <FileSpreadsheet className="w-10 h-10 text-stone-300 dark:text-zinc-700 stroke-1" />
                <div>
                  <h4 className="font-semibold text-stone-700 dark:text-zinc-300 text-sm">
                    No spreadsheets found
                  </h4>
                  <p className="text-xs text-stone-400 dark:text-zinc-500 max-w-sm mt-1">
                    Drag and drop any .csv or .xlsx file here, or create a new blank spreadsheet.
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-md text-xs font-medium text-stone-700 dark:text-zinc-300 transition"
                  >
                    Select File
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateBlank}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition"
                  >
                    Create Blank
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSpreadsheets.map((s) => {
                  const firstSheet = s.sheets[0];
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setActiveSpreadsheet(s);
                        setActiveSheetIdx(s.activeSheetIndex || 0);
                      }}
                      className="group cursor-pointer p-4 bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 hover:border-emerald-500/80 dark:hover:border-emerald-500/80 rounded-xl shadow-2xs hover:shadow-sm transition flex flex-col justify-between"
                    >
                      <div>
                        {/* Title line & type */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              <FileSpreadsheet className="w-3.5 h-3.5" />
                            </div>
                            <h3 className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                              {s.title}
                            </h3>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-stone-500">
                            {s.sheets.length} sheet{s.sheets.length > 1 ? 's' : ''}
                          </span>
                        </div>

                        {/* Preview mini table representation */}
                        {firstSheet && (
                          <div className="my-2.5 p-2 bg-stone-50 dark:bg-zinc-950 rounded-lg border border-stone-200/50 dark:border-zinc-800/50 overflow-hidden text-[10px]">
                            <div className="flex items-center gap-2 font-mono font-semibold text-stone-500 pb-1 border-b border-stone-200/40 dark:border-zinc-800/40 truncate">
                              {firstSheet.headers.slice(0, 3).map((h, i) => (
                                <span key={i} className="truncate flex-1">
                                  {h}
                                </span>
                              ))}
                            </div>
                            <div className="pt-1 space-y-0.5 opacity-75">
                              {firstSheet.rows.slice(0, 2).map((r, i) => (
                                <div key={i} className="flex items-center gap-2 truncate font-mono">
                                  {r.slice(0, 3).map((cell, j) => (
                                    <span key={j} className="truncate flex-1">
                                      {cell || '-'}
                                    </span>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer: Date & Delete */}
                      <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-zinc-500 pt-2 border-t border-stone-100 dark:border-zinc-800/60 mt-2">
                        <span>{new Date(s.updatedAt).toLocaleDateString()}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              spreadsheetService.download(s, 0);
                            }}
                            className="hover:text-emerald-600 transition"
                            title="Export CSV"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm('Delete this spreadsheet?')) {
                                await spreadsheetService.delete(s.id);
                                loadSpreadsheets();
                              }
                            }}
                            className="hover:text-red-600 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

