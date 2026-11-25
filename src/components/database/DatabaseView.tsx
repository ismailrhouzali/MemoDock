import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import {
  NoteDatabase,
  DatabaseColumn,
  DatabaseColumnType,
  DatabaseRow,
  DatabaseViewType,
} from '../../db/types';
import { parseXlsxWorkbook } from '../../services/spreadsheet/xlsxEngine';
import { parseCsv, exportToCsv } from '../../services/spreadsheet/csvEngine';
import {
  Database,
  Plus,
  Trash2,
  Table as TableIcon,
  Kanban,
  LayoutGrid,
  Upload,
  Download,
  Search,
  CheckSquare,
  Square,
  ArrowUpDown,
  X,
} from 'lucide-react';

interface DatabaseViewProps {
  onInsertDatabaseInNote?: (database: NoteDatabase) => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ onInsertDatabaseInNote }) => {
  const databases = useLiveQuery(() => db.databases.orderBy('updatedAt').reverse().toArray(), []) || [];
  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);
  const [viewType, setViewType] = useState<DatabaseViewType>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColId, setSortColId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [isAddingCol, setIsAddingCol] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColType, setNewColType] = useState<DatabaseColumnType>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDb = databases.find((d) => d.id === selectedDbId) || databases[0] || null;

  const createEmptyDatabase = async (title?: string) => {
    const now = Date.now();
    const statusColId = `col-status-${now}`;
    const titleColId = `col-title-${now}`;
    const dateColId = `col-date-${now}`;
    const newDb: NoteDatabase = {
      id: `db-${now}-${Math.random().toString(36).substring(2, 6)}`,
      title: title || 'Untitled Database',
      columns: [
        { id: titleColId, name: 'Name', type: 'text' },
        { id: statusColId, name: 'Status', type: 'select', options: ['To Do', 'In Progress', 'Done'] },
        { id: dateColId, name: 'Date', type: 'date' },
      ],
      rows: [
        {
          id: `row-${now}-1`,
          cells: { [titleColId]: 'Sample Item 1', [statusColId]: 'To Do', [dateColId]: new Date().toISOString().slice(0, 10) },
          createdAt: now,
          updatedAt: now,
        },
      ],
      defaultView: 'table',
      createdAt: now,
      updatedAt: now,
    };
    await db.databases.add(newDb);
    setSelectedDbId(newDb.id);
    setViewType('table');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const now = Date.now();
    const baseName = file.name.replace(/\.(xlsx|xls|csv|tsv)$/i, '');

    try {
      let headers: string[] = [];
      let rawRows: string[][] = [];

      if (file.name.toLowerCase().endsWith('.xlsx')) {
        const buffer = await file.arrayBuffer();
        const sheets = await parseXlsxWorkbook(buffer);
        if (sheets.length > 0) {
          headers = sheets[0].headers;
          rawRows = sheets[0].rows;
        }
      } else {
        const text = await file.text();
        const parsed = parseCsv(text);
        headers = parsed.headers;
        rawRows = parsed.rows;
      }

      if (headers.length === 0) return;

      const columns: DatabaseColumn[] = headers.map((h, idx) => {
        const sampleVals = rawRows.slice(0, 15).map((r) => (r[idx] || '').trim()).filter(Boolean);
        const isNumeric = sampleVals.length > 0 && sampleVals.every((v) => !isNaN(Number(v)));
        const isBool = sampleVals.length > 0 && sampleVals.every((v) => ['true', 'false', 'yes', 'no', '0', '1'].includes(v.toLowerCase()));
        return {
          id: `col-${now}-${idx}`,
          name: h || `Column ${idx + 1}`,
          type: isBool ? 'checkbox' : isNumeric ? 'number' : 'text',
        };
      });

      const rows: DatabaseRow[] = rawRows.map((r, rIdx) => {
        const cells: Record<string, string | number | boolean> = {};
        columns.forEach((col, cIdx) => {
          const val = r[cIdx] ?? '';
          if (col.type === 'checkbox') {
            cells[col.id] = ['true', 'yes', '1'].includes(String(val).toLowerCase());
          } else if (col.type === 'number') {
            cells[col.id] = val === '' ? '' : Number(val);
          } else {
            cells[col.id] = val;
          }
        });
        return {
          id: `row-${now}-${rIdx}`,
          cells,
          createdAt: now,
          updatedAt: now,
        };
      });

      const importedDb: NoteDatabase = {
        id: `db-${now}-${Math.random().toString(36).substring(2, 6)}`,
        title: baseName || 'Imported Database',
        columns,
        rows,
        defaultView: 'table',
        createdAt: now,
        updatedAt: now,
      };

      await db.databases.add(importedDb);
      setSelectedDbId(importedDb.id);
      setViewType('table');
    } catch (err) {
      console.error('Database import failed:', err);
      alert('Failed to import file. Please ensure it is a valid .xlsx or .csv file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportCsv = () => {
    if (!activeDb) return;
    const headers = activeDb.columns.map((c) => c.name);
    const rows = activeDb.rows.map((r) =>
      activeDb.columns.map((c) => String(r.cells[c.id] ?? ''))
    );
    const csv = exportToCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeDb.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateDb = async (updates: Partial<NoteDatabase>) => {
    if (!activeDb) return;
    await db.databases.update(activeDb.id, { ...updates, updatedAt: Date.now() });
  };

  const handleAddRow = async (presetCells?: Record<string, string | number | boolean>) => {
    if (!activeDb) return;
    const now = Date.now();
    const newRow: DatabaseRow = {
      id: `row-${now}-${Math.random().toString(36).substring(2, 5)}`,
      cells: presetCells || {},
      createdAt: now,
      updatedAt: now,
    };
    await updateDb({ rows: [...activeDb.rows, newRow] });
  };

  const handleUpdateCell = async (rowId: string, colId: string, value: string | number | boolean) => {
    if (!activeDb) return;
    const updatedRows = activeDb.rows.map((r) =>
      r.id === rowId
        ? { ...r, cells: { ...r.cells, [colId]: value }, updatedAt: Date.now() }
        : r
    );
    await updateDb({ rows: updatedRows });
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!activeDb) return;
    await updateDb({ rows: activeDb.rows.filter((r) => r.id !== rowId) });
  };

  const handleAddColumn = async () => {
    if (!activeDb || !newColName.trim()) return;
    const col: DatabaseColumn = {
      id: `col-${Date.now()}`,
      name: newColName.trim(),
      type: newColType,
      ...(newColType === 'select' ? { options: ['To Do', 'In Progress', 'Done'] } : {}),
    };
    await updateDb({ columns: [...activeDb.columns, col] });
    setNewColName('');
    setIsAddingCol(false);
  };

  const handleDeleteDatabase = async (id: string) => {
    if (!confirm('Delete this database permanently?')) return;
    await db.databases.delete(id);
    if (selectedDbId === id) setSelectedDbId(null);
  };

  const currentView = activeDb ? viewType || activeDb.defaultView : 'table';

  const filteredRows = activeDb
    ? activeDb.rows
        .filter((row) => {
          if (!searchTerm.trim()) return true;
          const q = searchTerm.toLowerCase();
          return Object.values(row.cells).some((v) => String(v).toLowerCase().includes(q));
        })
        .sort((a, b) => {
          if (!sortColId) return 0;
          const va = String(a.cells[sortColId] ?? '');
          const vb = String(b.cells[sortColId] ?? '');
          return sortAsc ? va.localeCompare(vb, undefined, { numeric: true }) : vb.localeCompare(va, undefined, { numeric: true });
        })
    : [];

  const selectCol = activeDb?.columns.find((c) => c.type === 'select');

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white dark:bg-obsidian-950 text-stone-800 dark:text-stone-200">
      {/* Left Databases List */}
      <aside className="w-60 border-r border-stone-200/80 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-950 flex flex-col">
        <div className="p-3 border-b border-stone-200/60 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-semibold text-xs">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Databases</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-800 text-stone-600 dark:text-zinc-300"
              title="Import from XLSX or CSV"
            >
              <Upload className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => createEmptyDatabase()}
              className="p-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white"
              title="New Database"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv,.tsv"
            onChange={handleImportFile}
            className="hidden"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {databases.length === 0 ? (
            <div className="text-center py-8 px-3 text-xs text-stone-400">
              <p className="mb-3">No databases yet.</p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-1.5 px-2 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-900 text-stone-600 dark:text-zinc-300 font-medium mb-1.5"
              >
                Import XLSX / CSV
              </button>
            </div>
          ) : (
            databases.map((d) => (
              <div
                key={d.id}
                onClick={() => {
                  setSelectedDbId(d.id);
                  setViewType(d.defaultView || 'table');
                }}
                className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition ${
                  activeDb?.id === d.id
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                    : 'hover:bg-stone-100 dark:hover:bg-zinc-900 text-stone-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Database className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                  <span className="truncate">{d.title}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDatabase(d.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 rounded"
                  title="Delete database"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main Database Canvas */}
      {!activeDb ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Database className="w-12 h-12 text-stone-300 dark:text-zinc-700 mb-3" />
          <h2 className="text-base font-semibold mb-1">Structured Databases</h2>
          <p className="text-xs text-stone-500 max-w-md mb-4">
            Create Notion-style databases with Table, Kanban Board, and Gallery views, or import directly from Excel (.xlsx) and CSV files.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => createEmptyDatabase()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Database</span>
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-2 border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import from XLSX / CSV</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Database Header & View Switcher */}
          <div className="p-4 border-b border-stone-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={activeDb.title}
                onChange={(e) => updateDb({ title: e.target.value })}
                className="text-lg font-bold bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1 -ml-1"
              />
              <span className="text-[11px] text-stone-400 font-mono">
                {activeDb.rows.length} rows × {activeDb.columns.length} cols
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* View Switcher */}
              <div className="flex items-center p-0.5 bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg text-xs">
                {[
                  { id: 'table' as DatabaseViewType, label: 'Table', icon: TableIcon },
                  { id: 'board' as DatabaseViewType, label: 'Board', icon: Kanban },
                  { id: 'gallery' as DatabaseViewType, label: 'Gallery', icon: LayoutGrid },
                ].map((v) => {
                  const Icon = v.icon;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setViewType(v.id);
                        updateDb({ defaultView: v.id });
                      }}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition ${
                        currentView === v.id
                          ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                          : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{v.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Filter rows..."
                  className="pl-7 pr-2.5 py-1 text-xs bg-stone-100 dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
                />
              </div>

              <button
                type="button"
                onClick={() => handleExportCsv()}
                className="px-2.5 py-1 text-xs border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-900 rounded-lg flex items-center gap-1"
                title="Export as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              {onInsertDatabaseInNote && (
                <button
                  type="button"
                  onClick={() => onInsertDatabaseInNote(activeDb)}
                  className="px-2.5 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Embed in Note
                </button>
              )}
            </div>
          </div>

          {/* Active View Body */}
          <div className="flex-1 overflow-auto p-4">
            {currentView === 'table' && (
              <div className="border border-stone-200 dark:border-zinc-800 rounded-xl overflow-x-auto">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-stone-50 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800">
                      {activeDb.columns.map((col) => (
                        <th
                          key={col.id}
                          className="text-left px-3 py-2 font-semibold text-stone-700 dark:text-zinc-300 border-r border-stone-200 dark:border-zinc-800 min-w-[140px]"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="truncate">{col.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                if (sortColId === col.id) setSortAsc(!sortAsc);
                                else {
                                  setSortColId(col.id);
                                  setSortAsc(true);
                                }
                              }}
                              className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200"
                              title="Sort column"
                            >
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </div>
                        </th>
                      ))}
                      <th className="px-2 py-2 w-24">
                        {isAddingCol ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newColName}
                              onChange={(e) => setNewColName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                              placeholder="Col name"
                              className="w-20 px-1.5 py-0.5 border border-blue-400 rounded text-[11px] bg-white dark:bg-zinc-800"
                              autoFocus
                            />
                            <select
                              value={newColType}
                              onChange={(e) => setNewColType(e.target.value as DatabaseColumnType)}
                              className="text-[10px] bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded py-0.5"
                            >
                              <option value="text">Text</option>
                              <option value="number">Num</option>
                              <option value="select">Select</option>
                              <option value="checkbox">Check</option>
                              <option value="date">Date</option>
                              <option value="url">URL</option>
                            </select>
                            <button type="button" onClick={handleAddColumn} className="text-blue-600 font-bold">+</button>
                            <button type="button" onClick={() => setIsAddingCol(false)} className="text-stone-400">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setIsAddingCol(true)}
                            className="flex items-center gap-1 text-stone-400 hover:text-blue-600 font-normal"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Column</span>
                          </button>
                        )}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-stone-100 dark:border-zinc-800/70 hover:bg-stone-50/60 dark:hover:bg-zinc-900/40 group"
                      >
                        {activeDb.columns.map((col) => {
                          const val = row.cells[col.id];
                          return (
                            <td
                              key={col.id}
                              className="px-3 py-1.5 border-r border-stone-100 dark:border-zinc-800/70"
                            >
                              {col.type === 'checkbox' ? (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCell(row.id, col.id, !val)}
                                  className="text-blue-600"
                                >
                                  {val ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-stone-400" />}
                                </button>
                              ) : col.type === 'select' ? (
                                <select
                                  value={String(val ?? '')}
                                  onChange={(e) => handleUpdateCell(row.id, col.id, e.target.value)}
                                  className="bg-stone-100 dark:bg-zinc-800 rounded px-2 py-0.5 text-[11px] font-medium focus:outline-none"
                                >
                                  <option value="">—</option>
                                  {(col.options || ['To Do', 'In Progress', 'Done']).map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                                  value={String(val ?? '')}
                                  onChange={(e) => handleUpdateCell(row.id, col.id, e.target.value)}
                                  className="w-full bg-transparent focus:outline-none focus:bg-white dark:focus:bg-zinc-800 px-1 py-0.5 rounded"
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className="px-2 py-1 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(row.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() => handleAddRow()}
                  className="w-full py-2 px-3 text-left text-xs text-stone-500 hover:text-blue-600 hover:bg-stone-50 dark:hover:bg-zinc-900 flex items-center gap-1.5 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Row</span>
                </button>
              </div>
            )}

            {currentView === 'board' && (
              <div className="flex gap-4 overflow-x-auto pb-4 items-start">
                {(selectCol?.options || ['To Do', 'In Progress', 'Done']).map((group) => {
                  const groupRows = filteredRows.filter(
                    (r) => selectCol && String(r.cells[selectCol.id] || '') === group
                  );
                  return (
                    <div
                      key={group}
                      className="w-64 flex-shrink-0 bg-stone-50 dark:bg-zinc-900/70 border border-stone-200 dark:border-zinc-800 rounded-xl p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{group}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-200 dark:bg-zinc-800">
                          {groupRows.length}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {groupRows.map((row) => (
                          <div
                            key={row.id}
                            className="p-2.5 bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-lg shadow-2xs text-xs space-y-1"
                          >
                            <div className="font-semibold text-stone-800 dark:text-zinc-100">
                              {String(row.cells[activeDb.columns[0]?.id] || 'Untitled')}
                            </div>
                            {activeDb.columns.slice(1, 3).map((col) => (
                              <div key={col.id} className="text-[11px] text-stone-500 flex justify-between">
                                <span>{col.name}:</span>
                                <span className="font-medium">{String(row.cells[col.id] ?? '—')}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddRow(selectCol ? { [selectCol.id]: group } : undefined)}
                        className="w-full py-1.5 text-[11px] text-stone-500 hover:text-blue-600 flex items-center justify-center gap-1 rounded-lg hover:bg-stone-200/50 dark:hover:bg-zinc-800"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add card</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {currentView === 'gallery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredRows.map((row) => (
                  <div
                    key={row.id}
                    className="p-4 bg-stone-50/70 dark:bg-zinc-900/60 border border-stone-200 dark:border-zinc-800 rounded-xl space-y-2 text-xs"
                  >
                    <div className="font-bold text-sm text-stone-900 dark:text-zinc-100">
                      {String(row.cells[activeDb.columns[0]?.id] || 'Untitled')}
                    </div>
                    <div className="space-y-1">
                      {activeDb.columns.slice(1).map((col) => (
                        <div key={col.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-stone-400">{col.name}</span>
                          <span className="text-stone-700 dark:text-zinc-300 font-medium">
                            {String(row.cells[col.id] ?? '—')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
