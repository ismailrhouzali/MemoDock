import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useEffect, useState } from 'react';
import { db } from '../../../db/db';
import { NoteDatabase } from '../../../db/types';
import { evaluateCellFormula } from '../../../services/databaseFormula';
import { Database, Plus, Trash2, CheckSquare, Square } from 'lucide-react';

const DatabaseBlockComponent: React.FC<NodeViewProps> = ({ node, deleteNode }) => {
  const { databaseId, title } = node.attrs;
  const [database, setDatabase] = useState<NoteDatabase | null>(null);

  useEffect(() => {
    if (databaseId) {
      db.databases.get(databaseId).then((res) => {
        if (res) setDatabase(res);
      });
    }
  }, [databaseId]);

  const handleQuickAddRow = async () => {
    if (!database) return;
    const now = Date.now();
    const newRow = {
      id: `row-${now}`,
      cells: {},
      createdAt: now,
      updatedAt: now,
    };
    const updatedRows = [...database.rows, newRow];
    await db.databases.update(database.id, { rows: updatedRows, updatedAt: now });
    setDatabase({ ...database, rows: updatedRows });
  };

  const handleInlineCellChange = async (
    rowId: string,
    colId: string,
    value: string | number | boolean
  ) => {
    if (!database) return;
    const updatedRows = database.rows.map((r) =>
      r.id === rowId ? { ...r, cells: { ...r.cells, [colId]: value }, updatedAt: Date.now() } : r
    );
    setDatabase({ ...database, rows: updatedRows });
    await db.databases.update(database.id, { rows: updatedRows, updatedAt: Date.now() });
  };

  return (
    <NodeViewWrapper className="my-3 select-none">
      <div className="border border-stone-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white/80 dark:bg-zinc-900/60 shadow-2xs">
        <div className="flex items-center justify-between px-3 py-2 bg-stone-50/70 dark:bg-zinc-950/40 border-b border-stone-200/60 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-800 dark:text-zinc-200">
            {database?.icon ? (
              <span>{database.icon}</span>
            ) : (
              <Database className="w-4 h-4 text-emerald-600" />
            )}
            <span>{database?.title || title || 'Embedded Database'}</span>
            {database && (
              <span className="text-[10px] font-mono text-stone-400">
                ({database.rows.length} rows)
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {database && (
              <button
                type="button"
                onClick={handleQuickAddRow}
                className="px-2 py-0.5 text-[11px] rounded bg-stone-200/60 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Row</span>
              </button>
            )}
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 text-stone-400 hover:text-red-500 rounded"
              title="Remove database embed"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {database ? (
          <div className="overflow-x-auto max-h-72">
            <table className="w-full border-collapse text-[11px]">
              <thead>
                <tr className="bg-stone-50/40 dark:bg-zinc-900 border-b border-stone-200/60 dark:border-zinc-800">
                  {database.columns.map((col) => (
                    <th key={col.id} className="text-left px-3 py-1.5 font-semibold text-stone-600 dark:text-zinc-400">
                      {col.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {database.rows.slice(0, 12).map((row) => (
                  <tr key={row.id} className="border-b border-stone-100 dark:border-zinc-800/60">
                    {database.columns.map((col) => {
                      const raw = row.cells[col.id];
                      return (
                        <td key={col.id} className="px-3 py-1 text-stone-700 dark:text-zinc-300">
                          {col.type === 'checkbox' ? (
                            <button
                              type="button"
                              onClick={() => handleInlineCellChange(row.id, col.id, !raw)}
                              className="text-blue-600"
                            >
                              {raw ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-stone-400" />}
                            </button>
                          ) : col.type === 'status' || col.type === 'select' ? (
                            <select
                              value={String(raw ?? '')}
                              onChange={(e) => handleInlineCellChange(row.id, col.id, e.target.value)}
                              className="bg-stone-100 dark:bg-zinc-800 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                            >
                              <option value="">—</option>
                              {(col.options || ['Not started', 'In progress', 'Done']).map((o) => (
                                <option key={o} value={o}>{o}</option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : 'text'}
                              value={
                                typeof raw === 'string' && raw.startsWith('=')
                                  ? evaluateCellFormula(raw, row, database.columns, database.rows)
                                  : Array.isArray(raw)
                                  ? raw.join(', ')
                                  : String(raw ?? '')
                              }
                              onChange={(e) => handleInlineCellChange(row.id, col.id, e.target.value)}
                              placeholder="—"
                              className="w-full bg-transparent focus:outline-none focus:bg-white dark:focus:bg-zinc-800 px-1 py-0.5 rounded"
                            />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 text-xs text-stone-400 italic">Database not found or empty.</div>
        )}
      </div>
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
      title: { default: 'Database' },
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
            title: el.getAttribute('data-title') || 'Database',
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
