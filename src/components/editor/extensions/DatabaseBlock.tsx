import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useEffect, useRef, useState } from 'react';
import { db } from '../../../db/db';
import {
  NoteDatabase,
  DatabaseColumn,
  DatabaseColumnType,
  DatabaseRow,
} from '../../../db/types';
import {
  evaluateCellFormula,
  computeColumnAggregation,
  AggregationType,
} from '../../../services/databaseFormula';
import { parseXlsxWorkbook } from '../../../services/spreadsheet/xlsxEngine';
import { parseCsv, exportToCsv } from '../../../services/spreadsheet/csvEngine';
import {
  Table as TableIcon,
  Plus,
  Trash2,
  CheckSquare,
  Square,
  ArrowUpDown,
  AlignLeft,
  Hash,
  Calculator,
  ChevronDownCircle,
  ListChecks,
  CircleDot,
  Calendar,
  User,
  Image as ImageIcon,
  Link2,
  X,
  Upload,
  Download,
  Copy,
  ExternalLink,
  Kanban,
  List as ListIcon,
  LayoutGrid,
  CalendarDays,
  Filter,
  Maximize2,
  Minimize2,
  Mail,
  Phone,
  Clock,
  GitBranch,
} from 'lucide-react';

const PROPERTY_TYPES: {
  type: DatabaseColumnType;
  label: string;
  Icon: React.FC<{ className?: string }>;
}[] = [
  { type: 'text', label: 'Text', Icon: AlignLeft },
  { type: 'number', label: 'Number', Icon: Hash },
  { type: 'formula', label: 'Formula (=)', Icon: Calculator },
  { type: 'select', label: 'Select', Icon: ChevronDownCircle },
  { type: 'multi-select', label: 'Multi-select', Icon: ListChecks },
  { type: 'status', label: 'Status', Icon: CircleDot },
  { type: 'date', label: 'Date', Icon: Calendar },
  { type: 'person', label: 'Person', Icon: User },
  { type: 'image', label: 'Image', Icon: ImageIcon },
  { type: 'checkbox', label: 'Checkbox', Icon: CheckSquare },
  { type: 'url', label: 'URL', Icon: Link2 },
  { type: 'email', label: 'Email', Icon: Mail },
  { type: 'phone', label: 'Phone', Icon: Phone },
  { type: 'createdTime', label: 'Created Time', Icon: Clock },
  { type: 'lastEditedTime', label: 'Last Edited', Icon: Clock },
  { type: 'relation', label: 'Relation', Icon: GitBranch },
  { type: 'rollup', label: 'Rollup', Icon: Calculator },
];

const STATUS_OPTIONS = ['Not started', 'In progress', 'Done'];
const AGG_CYCLE: AggregationType[] = ['count', 'sum', 'avg', 'min', 'max', 'checked', 'none'];

const DatabaseBlockComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const { databaseId, title } = node.attrs;
  const [database, setDatabase] = useState<NoteDatabase | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [isPropMenuOpen, setIsPropMenuOpen] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newOptionInput, setNewOptionInput] = useState('');
  const [sortColId, setSortColId] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [focusedFormulaCell, setFocusedFormulaCell] = useState<string | null>(null);
  const [colAggregations, setColAggregations] = useState<Record<string, AggregationType>>({});
  const [activeView, setActiveView] = useState<NoteDatabase['defaultView']>('table');
  const [filterText, setFilterText] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [draggedRowId, setDraggedRowId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [allDatabases, setAllDatabases] = useState<NoteDatabase[]>([]);
  const [isLinkDbOpen, setIsLinkDbOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.databases.toArray().then(setAllDatabases).catch(() => {});
  }, [databaseId]);

  useEffect(() => {
    if (database?.defaultView) {
      setActiveView(database.defaultView);
    }
  }, [database?.id]);

  // Load existing database or auto-initialize a self-contained Smart Table inside the note
  useEffect(() => {
    let mounted = true;
    async function initTable() {
      if (databaseId) {
        const existing = await db.databases.get(databaseId);
        if (existing && mounted) {
          setDatabase(existing);
          return;
        }
      }
      const now = Date.now();
      const newId = databaseId || `tbl-${now}-${Math.random().toString(36).substring(2, 6)}`;
      const nameColId = `col-name-${now}`;
      const statusColId = `col-status-${now}`;
      const numColId = `col-val-${now}`;
      const created: NoteDatabase = {
        id: newId,
        title: title || 'Smart Table',
        columns: [
          { id: nameColId, name: 'Item', type: 'text' },
          { id: statusColId, name: 'Status', type: 'status', options: STATUS_OPTIONS },
          { id: numColId, name: 'Value', type: 'number' },
        ],
        rows: [
          {
            id: `row-${now}-1`,
            cells: { [nameColId]: '', [statusColId]: 'Not started', [numColId]: '' },
            createdAt: now,
            updatedAt: now,
          },
        ],
        defaultView: 'table',
        createdAt: now,
        updatedAt: now,
      };
      await db.databases.put(created);
      if (mounted) {
        setDatabase(created);
        if (!databaseId) updateAttributes({ databaseId: newId });
      }
    }
    initTable();
    return () => {
      mounted = false;
    };
  }, [databaseId]);

  const persistDb = async (updated: NoteDatabase) => {
    setDatabase(updated);
    await db.databases.put({ ...updated, updatedAt: Date.now() });
  };

  const handleAddRow = async () => {
    if (!database) return;
    const now = Date.now();
    const newRow: DatabaseRow = {
      id: `row-${now}-${Math.random().toString(36).substring(2, 5)}`,
      cells: {},
      createdAt: now,
      updatedAt: now,
    };
    await persistDb({ ...database, rows: [...database.rows, newRow] });
  };

  const handleCellChange = async (
    rowId: string,
    colId: string,
    value: string | number | boolean | string[]
  ) => {
    if (!database) return;
    const updatedRows = database.rows.map((r) =>
      r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value }, updatedAt: Date.now() } : r
    );
    await persistDb({ ...database, rows: updatedRows });
  };

  const handleDeleteRow = async (rowId: string) => {
    if (!database) return;
    await persistDb({ ...database, rows: database.rows.filter((r) => r.id !== rowId) });
  };

  const handleAddProperty = async (type: DatabaseColumnType) => {
    if (!database) return;
    const labelMap: Record<DatabaseColumnType, string> = {
      text: 'Text',
      number: 'Number',
      formula: 'Formula',
      select: 'Select',
      'multi-select': 'Tags',
      status: 'Status',
      date: 'Date',
      person: 'Person',
      image: 'Image',
      checkbox: 'Done',
      url: 'URL',
      email: 'Email',
      phone: 'Phone',
      createdTime: 'Created',
      lastEditedTime: 'Updated',
      relation: 'Relation',
      rollup: 'Rollup',
    };
    const col: DatabaseColumn = {
      id: `col-${Date.now()}`,
      name: newColName.trim() || labelMap[type],
      type,
      ...(type === 'select' ? { options: ['Option 1', 'Option 2', 'Option 3'] } : {}),
      ...(type === 'multi-select' ? { options: ['Important', 'Work', 'Study', 'Idea'] } : {}),
      ...(type === 'status' ? { options: STATUS_OPTIONS } : {}),
    };
    await persistDb({ ...database, columns: [...database.columns, col] });
    setNewColName('');
    setIsPropMenuOpen(false);
  };

  const handleUpdateColumn = async (colId: string, updates: Partial<DatabaseColumn>) => {
    if (!database) return;
    const updatedCols = database.columns.map((c) => {
      if (c.id !== colId) return c;
      const merged = { ...c, ...updates };
      if (
        (updates.type === 'select' || updates.type === 'multi-select' || updates.type === 'status') &&
        (!merged.options || merged.options.length === 0)
      ) {
        merged.options = updates.type === 'status' ? STATUS_OPTIONS : ['Option 1', 'Option 2', 'Option 3'];
      }
      return merged;
    });
    await persistDb({ ...database, columns: updatedCols });
  };

  const handleDuplicateColumn = async (col: DatabaseColumn) => {
    if (!database) return;
    const copyCol: DatabaseColumn = {
      ...col,
      id: `col-${Date.now()}`,
      name: `${col.name} (Copy)`,
      options: col.options ? [...col.options] : undefined,
    };
    const updatedRows = database.rows.map((r) => ({
      ...r,
      cells: { ...r.cells, [copyCol.id]: r.cells[col.id] },
    }));
    await persistDb({ ...database, columns: [...database.columns, copyCol], rows: updatedRows });
    setEditingColId(null);
  };

  const handleDeleteColumn = async (colId: string) => {
    if (!database || database.columns.length <= 1) return;
    await persistDb({ ...database, columns: database.columns.filter((c) => c.id !== colId) });
    setEditingColId(null);
  };

  const handleImportXlsxOrCsv = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !database) return;
    const now = Date.now();
    try {
      let headers: string[] = [];
      let rawRows: string[][] = [];
      if (file.name.toLowerCase().endsWith('.xlsx')) {
        const sheets = await parseXlsxWorkbook(await file.arrayBuffer());
        if (sheets.length > 0) {
          headers = sheets[0].headers;
          rawRows = sheets[0].rows;
        }
      } else {
        const parsed = parseCsv(await file.text());
        headers = parsed.headers;
        rawRows = parsed.rows;
      }
      if (headers.length === 0) return;

      const columns: DatabaseColumn[] = headers.map((h, idx) => {
        const sample = rawRows.slice(0, 15).map((r) => (r[idx] || '').trim()).filter(Boolean);
        const isNum = sample.length > 0 && sample.every((v) => !isNaN(Number(v)));
        const isBool = sample.length > 0 && sample.every((v) => ['true', 'false', 'yes', 'no', '0', '1'].includes(v.toLowerCase()));
        return {
          id: `col-${now}-${idx}`,
          name: h || `Column ${idx + 1}`,
          type: isBool ? 'checkbox' : isNum ? 'number' : 'text',
        };
      });

      const rows: DatabaseRow[] = rawRows.map((r, rIdx) => {
        const cells: Record<string, string | number | boolean | string[]> = {};
        columns.forEach((col, cIdx) => {
          const v = r[cIdx] ?? '';
          cells[col.id] =
            col.type === 'checkbox'
              ? ['true', 'yes', '1'].includes(String(v).toLowerCase())
              : col.type === 'number'
              ? v === '' ? '' : Number(v)
              : v;
        });
        return { id: `row-${now}-${rIdx}`, cells, createdAt: now, updatedAt: now };
      });

      const cleanTitle = file.name.replace(/\.(xlsx|xls|csv|tsv)$/i, '');
      updateAttributes({ title: cleanTitle });
      await persistDb({ ...database, title: cleanTitle, columns, rows });
    } catch (err) {
      console.error('Table import error:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportCsv = () => {
    if (!database) return;
    const headers = database.columns.map((c) => c.name);
    const rows = database.rows.map((r) =>
      database.columns.map((c) => {
        const v = r.cells[c.id];
        if (typeof v === 'string' && v.startsWith('=')) {
          return evaluateCellFormula(v, r, database.columns, database.rows);
        }
        return Array.isArray(v) ? v.join('; ') : String(v ?? '');
      })
    );
    const csv = exportToCsv(headers, rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(database.title || 'table').replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cycleColAggregation = (col: DatabaseColumn) => {
    const cur =
      colAggregations[col.id] ||
      (col.type === 'number' ? 'sum' : col.type === 'checkbox' ? 'checked' : 'count');
    const next = AGG_CYCLE[(AGG_CYCLE.indexOf(cur) + 1) % AGG_CYCLE.length];
    setColAggregations((prev) => ({ ...prev, [col.id]: next }));
  };

  const filteredRows = database
    ? database.rows.filter((r) => {
        if (!filterText.trim()) return true;
        const q = filterText.trim().toLowerCase();
        return Object.values(r.cells).some((v) => String(v ?? '').toLowerCase().includes(q));
      })
    : [];

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (!sortColId) return 0;
    const va = String(a.cells[sortColId] ?? '');
    const vb = String(b.cells[sortColId] ?? '');
    return sortAsc
      ? va.localeCompare(vb, undefined, { numeric: true })
      : vb.localeCompare(va, undefined, { numeric: true });
  });

  const handleCellKeyDown = async (
    e: React.KeyboardEvent<HTMLInputElement>,
    rowIdx: number,
    colId: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (rowIdx === sortedRows.length - 1) await handleAddRow();
      setTimeout(() => {
        const next = document.querySelector(
          `input[data-ntbl="${database?.id}-${rowIdx + 1}-${colId}"]`
        ) as HTMLInputElement | null;
        next?.focus();
      }, 40);
    }
  };

  const renderCell = (row: DatabaseRow, rowIdx: number, col: DatabaseColumn) => {
    const val = row.cells[col.id];
    const cellKey = `${row.id}-${col.id}`;

    if (col.type === 'checkbox') {
      return (
        <button type="button" onClick={() => handleCellChange(row.id, col.id, !val)} className="text-blue-600">
          {val ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-stone-400" />}
        </button>
      );
    }

    if (col.type === 'status') {
      const opts = col.options && col.options.length > 0 ? col.options : STATUS_OPTIONS;
      const cur = String(val || opts[0] || 'Not started');
      const lower = cur.toLowerCase();
      const badge =
        lower.includes('done') || lower.includes('termin') || lower.includes('complete')
          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
          : lower.includes('progress') || lower.includes('cours')
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
          : 'bg-stone-100 text-stone-600 dark:bg-zinc-800 dark:text-zinc-300';
      return (
        <select
          value={cur}
          onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
          className={`rounded-full px-2 py-0.5 text-[10px] font-medium focus:outline-none cursor-pointer ${badge}`}
        >
          {!opts.includes(cur) && <option value={cur}>{cur}</option>}
          {opts.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }

    if (col.type === 'select') {
      const opts = col.options && col.options.length > 0 ? col.options : ['Option 1', 'Option 2', 'Option 3'];
      return (
        <select
          value={String(val ?? '')}
          onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
          className="bg-stone-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 text-[10px] font-medium focus:outline-none cursor-pointer"
        >
          <option value="">—</option>
          {opts.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    }

    if (col.type === 'multi-select') {
      const selected = Array.isArray(val) ? val : val ? [String(val)] : [];
      const opts = col.options && col.options.length > 0 ? col.options : ['Important', 'Work', 'Study', 'Idea'];
      return (
        <div className="flex flex-wrap items-center gap-1">
          {selected.map((t) => (
            <span
              key={t}
              onClick={() => handleCellChange(row.id, col.id, selected.filter((x) => x !== t))}
              className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[10px] cursor-pointer hover:line-through"
            >
              {t}
            </span>
          ))}
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && !selected.includes(e.target.value)) {
                handleCellChange(row.id, col.id, [...selected, e.target.value]);
              }
            }}
            className="bg-transparent text-[10px] text-stone-400 w-10 focus:outline-none cursor-pointer"
          >
            <option value="">+</option>
            {opts.filter((o) => !selected.includes(o)).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      );
    }

    if (col.type === 'url') {
      const urlVal = String(val ?? '');
      return (
        <div className="flex items-center gap-1">
          <input
            type="text"
            data-ntbl={`${database?.id}-${rowIdx}-${col.id}`}
            value={urlVal}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            onKeyDown={(e) => handleCellKeyDown(e, rowIdx, col.id)}
            placeholder="https://..."
            className="w-full bg-transparent focus:outline-none text-blue-600 dark:text-blue-400 underline"
          />
          {urlVal && (
            <a
              href={urlVal.startsWith('http') ? urlVal : `https://${urlVal}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-stone-400 hover:text-blue-600 flex-shrink-0"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      );
    }

    if (col.type === 'createdTime' || col.type === 'lastEditedTime') {
      const ts = col.type === 'createdTime' ? row.createdAt : row.updatedAt;
      return (
        <span className="text-[10px] text-stone-400 font-mono">
          {new Date(ts).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
        </span>
      );
    }

    if (col.type === 'email' || col.type === 'phone') {
      const contactVal = String(val ?? '');
      const hrefPrefix = col.type === 'email' ? 'mailto:' : 'tel:';
      return (
        <div className="flex items-center gap-1">
          <input
            type={col.type === 'email' ? 'email' : 'tel'}
            data-ntbl={`${database?.id}-${rowIdx}-${col.id}`}
            value={contactVal}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            onKeyDown={(e) => handleCellKeyDown(e, rowIdx, col.id)}
            placeholder={col.type === 'email' ? 'name@example.com' : '+1 555...'}
            className="w-full bg-transparent focus:outline-none"
          />
          {contactVal && (
            <a href={`${hrefPrefix}${contactVal}`} className="text-stone-400 hover:text-blue-600 flex-shrink-0">
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      );
    }

    if (col.type === 'image') {
      const imgUrl = String(val ?? '');
      return (
        <div className="flex items-center gap-1">
          {imgUrl && <img src={imgUrl} alt="" className="w-5 h-5 rounded object-cover flex-shrink-0" />}
          <input
            type="text"
            data-ntbl={`${database?.id}-${rowIdx}-${col.id}`}
            value={imgUrl}
            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
            onKeyDown={(e) => handleCellKeyDown(e, rowIdx, col.id)}
            placeholder="Image URL..."
            className="w-full bg-transparent focus:outline-none"
          />
        </div>
      );
    }

    const strVal = String(val ?? '');
    const isFormula = strVal.startsWith('=');
    const displayVal =
      isFormula && focusedFormulaCell !== cellKey && database
        ? evaluateCellFormula(strVal, row, database.columns, database.rows)
        : strVal;

    return (
      <input
        type={col.type === 'number' && !isFormula ? 'number' : col.type === 'date' ? 'date' : 'text'}
        data-ntbl={`${database?.id}-${rowIdx}-${col.id}`}
        value={displayVal}
        onFocus={() => setFocusedFormulaCell(cellKey)}
        onBlur={() => setFocusedFormulaCell(null)}
        onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
        onKeyDown={(e) => handleCellKeyDown(e, rowIdx, col.id)}
        placeholder={col.type === 'formula' ? '=SUM(Col)' : ''}
        className={`w-full bg-transparent focus:outline-none focus:bg-white dark:focus:bg-zinc-800 px-1 py-0.5 rounded ${
          isFormula ? 'font-mono text-emerald-700 dark:text-emerald-400 font-medium' : ''
        }`}
      />
    );
  };

  return (
    <NodeViewWrapper className="my-3 select-none">
      <div
        className={
          isFullPage
            ? 'fixed inset-4 z-[9990] border border-stone-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-2xl overflow-y-auto'
            : 'border border-stone-200/80 dark:border-zinc-800 rounded-xl overflow-visible bg-white/90 dark:bg-zinc-900/70 shadow-2xs'
        }
      >
        {/* Table Header Bar */}
        <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-stone-50/70 dark:bg-zinc-950/40 border-b border-stone-200/60 dark:border-zinc-800 gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-zinc-200">
            <TableIcon className="w-4 h-4 text-emerald-600" />
            <input
              type="text"
              value={database?.title ?? title ?? ''}
              onChange={(e) => {
                updateAttributes({ title: e.target.value });
                if (database) persistDb({ ...database, title: e.target.value });
              }}
              placeholder="Smart Table"
              className="bg-transparent font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 rounded px-1"
            />
            {database && (
              <span className="text-[10px] font-mono text-stone-400">
                {database.rows.length} × {database.columns.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-wrap">
            {/* View Switcher */}
            <div className="flex items-center bg-stone-200/60 dark:bg-zinc-800 rounded-md p-0.5 text-[10px] mr-1">
              {[
                { id: 'table' as const, label: 'Table', Icon: TableIcon },
                { id: 'board' as const, label: 'Board', Icon: Kanban },
                { id: 'list' as const, label: 'List', Icon: ListIcon },
                { id: 'gallery' as const, label: 'Gallery', Icon: LayoutGrid },
                { id: 'calendar' as const, label: 'Calendar', Icon: CalendarDays },
              ].map((v) => {
                const VIcon = v.Icon;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setActiveView(v.id);
                      if (database) persistDb({ ...database, defaultView: v.id });
                    }}
                    className={`px-1.5 py-0.5 rounded flex items-center gap-1 transition ${
                      activeView === v.id
                        ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
                        : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                    }`}
                    title={`${v.label} view`}
                  >
                    <VIcon className="w-3 h-3" />
                    <span className="hidden sm:inline">{v.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Filter Toggle */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`px-1.5 py-0.5 text-[11px] rounded flex items-center gap-1 ${
                isFilterOpen || filterText
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  : 'bg-stone-200/60 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700'
              }`}
              title="Filter rows"
            >
              <Filter className="w-3 h-3" />
            </button>

            {/* Link Existing Database */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLinkDbOpen(!isLinkDbOpen)}
                className="px-1.5 py-0.5 text-[11px] rounded bg-stone-200/60 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center gap-1"
                title="Switch / Link Existing Database"
              >
                <GitBranch className="w-3 h-3" />
              </button>
              {isLinkDbOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsLinkDbOpen(false)} />
                  <div className="absolute right-0 mt-1 z-40 w-52 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg shadow-float p-1.5 text-xs max-h-48 overflow-y-auto">
                    <div className="px-2 py-1 text-[10px] font-semibold uppercase text-stone-400">
                      Link Existing Database
                    </div>
                    {allDatabases.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          updateAttributes({ databaseId: d.id, title: d.title });
                          setDatabase(d);
                          setIsLinkDbOpen(false);
                        }}
                        className={`w-full text-left px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-zinc-800 truncate ${
                          d.id === database?.id ? 'text-blue-600 font-semibold' : ''
                        }`}
                      >
                        {d.title || 'Untitled DB'} ({d.rows.length} rows)
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv,.tsv"
              onChange={handleImportXlsxOrCsv}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-2 py-0.5 text-[11px] rounded bg-stone-200/60 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center gap-1"
              title="Import XLSX / CSV into this table"
            >
              <Upload className="w-3 h-3" />
              <span>Import</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-2 py-0.5 text-[11px] rounded bg-stone-200/60 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center gap-1"
              title="Export CSV"
            >
              <Download className="w-3 h-3" />
              <span>CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullPage(!isFullPage)}
              className="p-1 text-stone-500 hover:text-blue-600 rounded"
              title={isFullPage ? 'Exit Full Page' : 'Open Full-Page Database'}
            >
              {isFullPage ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 text-stone-400 hover:text-red-500 rounded"
              title="Remove table"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isFilterOpen && (
          <div className="px-3 py-1.5 bg-stone-50/70 dark:bg-zinc-900/60 border-b border-stone-200/60 dark:border-zinc-800 flex items-center gap-2">
            <Filter className="w-3 h-3 text-stone-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Filter rows by any value..."
              className="flex-1 bg-transparent text-xs focus:outline-none"
              autoFocus
            />
            {filterText && (
              <button type="button" onClick={() => setFilterText('')} className="text-[10px] text-stone-400 hover:text-red-500">
                Clear
              </button>
            )}
          </div>
        )}

        {database ? (
          <div>
            {activeView === 'table' && (
              <>
                <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-stone-50/50 dark:bg-zinc-900 border-b border-stone-200/60 dark:border-zinc-800">
                    {database.columns.map((col) => {
                      const isEditing = editingColId === col.id;
                      return (
                        <th
                          key={col.id}
                          className="relative text-left px-2.5 py-1.5 font-semibold text-stone-700 dark:text-zinc-300 border-r border-stone-200/60 dark:border-zinc-800 min-w-[130px]"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingColId(isEditing ? null : col.id);
                                setNewOptionInput('');
                              }}
                              className="truncate flex items-center gap-1 hover:text-blue-600 text-left flex-1"
                              title="Edit column name, type & status options"
                            >
                              <span className="truncate">{col.name}</span>
                              <span className="text-[9px] font-normal text-stone-400 uppercase">{col.type}</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (sortColId === col.id) setSortAsc(!sortAsc);
                                else {
                                  setSortColId(col.id);
                                  setSortAsc(true);
                                }
                              }}
                              className="p-0.5 text-stone-400 hover:text-stone-700"
                            >
                              <ArrowUpDown className="w-3 h-3" />
                            </button>
                          </div>

                          {isEditing && (
                            <>
                              <div className="fixed inset-0 z-30" onClick={() => setEditingColId(null)} />
                              <div className="absolute left-0 top-full mt-1 z-40 w-56 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float p-2.5 text-xs font-normal space-y-2">
                                <div>
                                  <label className="text-[10px] font-semibold uppercase text-stone-400 block mb-0.5">
                                    Column Name
                                  </label>
                                  <input
                                    type="text"
                                    value={col.name}
                                    onChange={(e) => handleUpdateColumn(col.id, { name: e.target.value })}
                                    className="w-full px-2 py-1 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold uppercase text-stone-400 block mb-0.5">
                                    Field Type
                                  </label>
                                  <select
                                    value={col.type}
                                    onChange={(e) => handleUpdateColumn(col.id, { type: e.target.value as DatabaseColumnType })}
                                    className="w-full px-2 py-1 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded text-xs"
                                  >
                                    {PROPERTY_TYPES.map((pt) => (
                                      <option key={pt.type} value={pt.type}>{pt.label}</option>
                                    ))}
                                  </select>
                                </div>

                                {(col.type === 'select' || col.type === 'multi-select' || col.type === 'status') && (
                                  <div>
                                    <label className="text-[10px] font-semibold uppercase text-stone-400 block mb-1">
                                      Options
                                    </label>
                                    <div className="flex flex-wrap gap-1 mb-1 max-h-20 overflow-y-auto">
                                      {(col.options || []).map((opt) => (
                                        <span
                                          key={opt}
                                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-[10px]"
                                        >
                                          <span>{opt}</span>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              handleUpdateColumn(col.id, {
                                                options: (col.options || []).filter((o) => o !== opt),
                                              })
                                            }
                                            className="text-stone-400 hover:text-red-500"
                                          >
                                            <X className="w-2.5 h-2.5" />
                                          </button>
                                        </span>
                                      ))}
                                    </div>
                                    <input
                                      type="text"
                                      value={newOptionInput}
                                      onChange={(e) => setNewOptionInput(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter' && newOptionInput.trim()) {
                                          const opts = col.options || [];
                                          if (!opts.includes(newOptionInput.trim())) {
                                            handleUpdateColumn(col.id, { options: [...opts, newOptionInput.trim()] });
                                          }
                                          setNewOptionInput('');
                                        }
                                      }}
                                      placeholder="Add option + Enter"
                                      className="w-full px-2 py-1 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded text-[11px]"
                                    />
                                  </div>
                                )}

                                <div className="pt-1 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateColumn(col)}
                                    className="flex items-center gap-1 text-stone-600 dark:text-zinc-300 hover:text-blue-600"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Duplicate</span>
                                  </button>
                                  {database.columns.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteColumn(col.id)}
                                      className="flex items-center gap-1 text-red-500 hover:text-red-600"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </th>
                      );
                    })}
                    <th className="px-2 py-1.5 w-10 relative">
                      <button
                        type="button"
                        onClick={() => setIsPropMenuOpen(!isPropMenuOpen)}
                        className="p-1 text-stone-400 hover:text-blue-600 rounded"
                        title="Add Column"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      {isPropMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setIsPropMenuOpen(false)} />
                          <div className="absolute right-0 top-full mt-1 z-40 w-44 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float p-1.5 text-xs font-normal">
                            <input
                              type="text"
                              value={newColName}
                              onChange={(e) => setNewColName(e.target.value)}
                              placeholder="Column name..."
                              className="w-full px-2 py-1 mb-1 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded text-[11px]"
                              autoFocus
                            />
                            <div className="max-h-48 overflow-y-auto">
                              {PROPERTY_TYPES.map((pt) => {
                                const Icon = pt.Icon;
                                return (
                                  <button
                                    key={pt.type}
                                    type="button"
                                    onClick={() => handleAddProperty(pt.type)}
                                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-stone-100 dark:hover:bg-zinc-800 text-left"
                                  >
                                    <Icon className="w-3 h-3 text-stone-400" />
                                    <span>{pt.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, rowIdx) => (
                    <tr key={row.id} className="border-b border-stone-100 dark:border-zinc-800/60 group hover:bg-stone-50/60 dark:hover:bg-zinc-900/40">
                      {database.columns.map((col) => (
                        <td key={col.id} className="px-2.5 py-1 border-r border-stone-100 dark:border-zinc-800/60">
                          {renderCell(row, rowIdx, col)}
                        </td>
                      ))}
                      <td className="px-1 py-1 text-center flex items-center justify-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setActiveRowId(row.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-blue-600 rounded"
                          title="Open row as page"
                        >
                          <Maximize2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-50/40 dark:bg-zinc-950/30 border-b border-stone-200/60 dark:border-zinc-800 text-[10px] text-stone-500">
                    {database.columns.map((col) => {
                      const agg =
                        colAggregations[col.id] ||
                        (col.type === 'number' ? 'sum' : col.type === 'checkbox' ? 'checked' : 'count');
                      return (
                        <td
                          key={col.id}
                          onClick={() => cycleColAggregation(col)}
                          className="px-2.5 py-1 border-r border-stone-100 dark:border-zinc-800/60 cursor-pointer hover:bg-stone-100 dark:hover:bg-zinc-900 font-mono"
                          title="Click to cycle calculation (Count / Sum / Avg / Min / Max)"
                        >
                          {computeColumnAggregation(col, sortedRows, agg) || 'Calc'}
                        </td>
                      );
                    })}
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
            <button
              type="button"
              onClick={handleAddRow}
              className="w-full py-1.5 px-3 text-left text-[11px] text-stone-500 hover:text-blue-600 hover:bg-stone-50 dark:hover:bg-zinc-900 flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" />
              <span>New Row</span>
            </button>
              </>
            )}

            {/* BOARD (KANBAN) VIEW WITH DRAG & DROP */}
            {activeView === 'board' && (() => {
              const groupCol =
                database.columns.find((c) => c.type === 'status' || c.type === 'select') ||
                database.columns[0];
              const titleCol = database.columns[0];
              const groups =
                groupCol && (groupCol.type === 'status' || groupCol.type === 'select')
                  ? groupCol.options && groupCol.options.length > 0
                    ? groupCol.options
                    : STATUS_OPTIONS
                  : ['All Items'];

              return (
                <div className="p-3 overflow-x-auto flex gap-3 items-start">
                  {groups.map((grp) => {
                    const cards = sortedRows.filter((r) => {
                      if (!groupCol || (groupCol.type !== 'status' && groupCol.type !== 'select')) return true;
                      return String(r.cells[groupCol.id] || groups[0]) === grp;
                    });
                    return (
                      <div
                        key={grp}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (draggedRowId && groupCol && (groupCol.type === 'status' || groupCol.type === 'select')) {
                            handleCellChange(draggedRowId, groupCol.id, grp);
                            setDraggedRowId(null);
                          }
                        }}
                        className="w-56 flex-shrink-0 rounded-xl bg-stone-50/80 dark:bg-zinc-900/60 border border-stone-200/70 dark:border-zinc-800 p-2 space-y-2"
                      >
                        <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-stone-700 dark:text-zinc-200">
                          <span>{grp}</span>
                          <span className="text-[10px] text-stone-400">{cards.length}</span>
                        </div>
                        <div className="space-y-1.5">
                          {cards.map((card) => (
                            <div
                              key={card.id}
                              draggable
                              onDragStart={() => setDraggedRowId(card.id)}
                              onClick={() => setActiveRowId(card.id)}
                              className="p-2 rounded-lg bg-white dark:bg-zinc-950 border border-stone-200/80 dark:border-zinc-800 shadow-2xs cursor-grab hover:border-blue-400 transition"
                            >
                              <div className="font-medium text-xs text-stone-800 dark:text-stone-100 truncate">
                                {String(card.cells[titleCol?.id] || 'Untitled')}
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {database.columns.slice(1, 4).map((c) => {
                                  const cv = card.cells[c.id];
                                  if (cv === undefined || cv === '' || c.id === groupCol?.id) return null;
                                  return (
                                    <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-stone-500">
                                      {Array.isArray(cv) ? cv.join(', ') : String(cv)}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* LIST VIEW */}
            {activeView === 'list' && (
              <div className="divide-y divide-stone-100 dark:divide-zinc-800/70">
                {sortedRows.map((row) => {
                  const titleCol = database.columns[0];
                  return (
                    <div
                      key={row.id}
                      onClick={() => setActiveRowId(row.id)}
                      className="flex items-center justify-between px-3 py-2 hover:bg-stone-50 dark:hover:bg-zinc-900/50 cursor-pointer transition"
                    >
                      <span className="font-medium text-xs text-stone-800 dark:text-stone-200 truncate">
                        {String(row.cells[titleCol?.id] || 'Untitled')}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400">
                        {database.columns.slice(1, 4).map((c) => {
                          const v = row.cells[c.id];
                          if (v === undefined || v === '') return null;
                          return (
                            <span key={c.id} className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800">
                              {Array.isArray(v) ? v.join(', ') : String(v)}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="w-full py-1.5 px-3 text-left text-[11px] text-stone-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Row</span>
                </button>
              </div>
            )}

            {/* GALLERY VIEW */}
            {activeView === 'gallery' && (() => {
              const titleCol = database.columns[0];
              const imgCol = database.columns.find((c) => c.type === 'image');
              return (
                <div className="p-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {sortedRows.map((row) => {
                    const imgUrl = imgCol ? String(row.cells[imgCol.id] || '') : '';
                    return (
                      <div
                        key={row.id}
                        onClick={() => setActiveRowId(row.id)}
                        className="rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-stone-50/40 dark:bg-zinc-950/40 overflow-hidden cursor-pointer hover:border-blue-400 transition"
                      >
                        {imgUrl ? (
                          <img src={imgUrl} alt="" className="w-full h-28 object-cover" />
                        ) : (
                          <div className="w-full h-16 bg-gradient-to-br from-stone-100 to-stone-200/60 dark:from-zinc-900 dark:to-zinc-800/50" />
                        )}
                        <div className="p-2.5 space-y-1">
                          <div className="font-semibold text-xs text-stone-800 dark:text-stone-100 truncate">
                            {String(row.cells[titleCol?.id] || 'Untitled')}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {database.columns.slice(1, 3).map((c) => {
                              const v = row.cells[c.id];
                              if (v === undefined || v === '' || c.type === 'image') return null;
                              return (
                                <span key={c.id} className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200/60 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300">
                                  {Array.isArray(v) ? v.join(', ') : String(v)}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* CALENDAR VIEW */}
            {activeView === 'calendar' && (() => {
              const dateCol = database.columns.find((c) => c.type === 'date');
              const titleCol = database.columns[0];
              const year = calendarMonth.getFullYear();
              const month = calendarMonth.getMonth();
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const firstDow = new Date(year, month, 1).getDay();
              return (
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>
                      {calendarMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                      {!dateCol && <span className="ml-2 text-[10px] text-amber-600 font-normal">(Add a Date column to place items)</span>}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCalendarMonth(new Date(year, month - 1, 1))}
                        className="px-2 py-0.5 rounded border border-stone-200 dark:border-zinc-700"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarMonth(new Date(year, month + 1, 1))}
                        className="px-2 py-0.5 rounded border border-stone-200 dark:border-zinc-700"
                      >
                        →
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                      <div key={d} className="text-center font-semibold text-stone-400 py-0.5">{d}</div>
                    ))}
                    {Array.from({ length: firstDow }).map((_, idx) => (
                      <div key={`empty-${idx}`} className="min-h-[48px] bg-stone-50/30 dark:bg-zinc-900/20 rounded" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, idx) => {
                      const day = idx + 1;
                      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const dayRows = dateCol
                        ? sortedRows.filter((r) => String(r.cells[dateCol.id] || '').startsWith(iso))
                        : [];
                      return (
                        <div key={day} className="min-h-[48px] p-1 rounded border border-stone-200/60 dark:border-zinc-800/70 bg-white dark:bg-zinc-950/50 space-y-0.5">
                          <div className="text-[9px] text-stone-400 font-mono">{day}</div>
                          {dayRows.map((r) => (
                            <div
                              key={r.id}
                              onClick={() => setActiveRowId(r.id)}
                              className="px-1 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 truncate cursor-pointer text-[9px]"
                            >
                              {String(r.cells[titleCol?.id] || 'Untitled')}
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="p-4 text-xs text-stone-400 italic">Loading table...</div>
        )}
      </div>

      {/* Row-as-Page Drawer Modal & Full-Page Overlay Wrapper */}
      {activeRowId && database && (() => {
        const rowIndex = database.rows.findIndex((r) => r.id === activeRowId);
        const row = database.rows[rowIndex];
        if (!row) return null;
        return (
          <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setActiveRowId(null)}>
            <div
              className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-float p-5 space-y-4 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-stone-200 dark:border-zinc-800 pb-2.5">
                <div className="font-bold text-sm text-stone-900 dark:text-stone-100">
                  {String(row.cells[database.columns[0]?.id] || 'Row Properties')}
                </div>
                <button type="button" onClick={() => setActiveRowId(null)} className="p-1 rounded hover:bg-stone-100 dark:hover:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                {database.columns.map((col) => (
                  <div key={col.id} className="grid grid-cols-3 gap-2 items-center text-xs">
                    <div className="text-stone-500 dark:text-zinc-400 font-medium truncate">{col.name}</div>
                    <div className="col-span-2">{renderCell(row, Math.max(0, rowIndex), col)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </NodeViewWrapper>
  );
};

export const DatabaseBlockNode = Node.create({
  name: 'databaseBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      databaseId: { default: '' },
      title: { default: 'Smart Table' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="database-block"]',
        getAttrs: (el) => {
          if (typeof el === 'string') return {};
          return {
            databaseId: el.getAttribute('data-database-id') || '',
            title: el.getAttribute('data-title') || 'Smart Table',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'database-block',
        'data-database-id': HTMLAttributes.databaseId,
        'data-title': HTMLAttributes.title,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DatabaseBlockComponent);
  },
});
