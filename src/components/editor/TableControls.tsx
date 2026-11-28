import React from 'react';
import { Editor } from '@tiptap/react';
import {
  Plus,
  Trash2,
  Columns,
  Rows,
  SplitSquareVertical,
} from 'lucide-react';

interface TableControlsProps {
  editor: Editor;
}

export const TableControls: React.FC<TableControlsProps> = ({ editor }) => {
  if (!editor.isActive('table')) {
    return null;
  }

  return (
    <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-md text-xs text-stone-700 dark:text-zinc-200 shadow-sm animate-in fade-in duration-150">
      <span className="px-1.5 font-medium text-[10px] text-stone-400 dark:text-zinc-400 uppercase tracking-wider">
        Table
      </span>
      <div className="h-3.5 w-px bg-stone-300 dark:bg-zinc-700 mx-0.5" />

      {/* Row operations */}
      <button
        type="button"
        onClick={() => editor.chain().focus().addRowBefore().run()}
        className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded transition"
        title="Add Row Above"
      >
        <span className="flex items-center gap-0.5 text-[11px]"><Plus className="w-3 h-3" /><Rows className="w-3 h-3" />↑</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().addRowAfter().run()}
        className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded transition"
        title="Add Row Below"
      >
        <span className="flex items-center gap-0.5 text-[11px]"><Plus className="w-3 h-3" /><Rows className="w-3 h-3" />↓</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteRow().run()}
        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition"
        title="Delete Row"
      >
        <span className="flex items-center gap-0.5 text-[11px]"><Trash2 className="w-3 h-3" /><Rows className="w-3 h-3" /></span>
      </button>

      <div className="h-3.5 w-px bg-stone-300 dark:bg-zinc-700 mx-0.5" />

      {/* Column operations */}
      <button
        type="button"
        onClick={() => editor.chain().focus().addColumnBefore().run()}
        className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded transition"
        title="Add Column Left"
      >
        <span className="flex items-center gap-0.5 text-[11px]"><Plus className="w-3 h-3" /><Columns className="w-3 h-3" />←</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
        className="p-1 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded transition"
        title="Add Column Right"
      >
        <span className="flex items-center gap-0.5 text-[11px]"><Plus className="w-3 h-3" /><Columns className="w-3 h-3" />→</span>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteColumn().run()}
        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition"
        title="Delete Column"
      >
        <span className="flex items-center gap-0.5 text-[11px]"><Trash2 className="w-3 h-3" /><Columns className="w-3 h-3" /></span>
      </button>

      <div className="h-3.5 w-px bg-stone-300 dark:bg-zinc-700 mx-0.5" />

      {/* Toggle header row & column */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeaderRow().run()}
        className="px-1.5 py-1 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded text-[11px] transition"
        title="Toggle Header Row"
      >
        Header Row
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeaderColumn().run()}
        className="px-1.5 py-1 hover:bg-stone-200 dark:hover:bg-zinc-700 rounded text-[11px] transition"
        title="Toggle Header Column"
      >
        Header Col
      </button>

      <div className="h-3.5 w-px bg-stone-300 dark:bg-zinc-700 mx-0.5" />

      {/* Cell background color */}
      <div className="flex items-center gap-0.5 px-0.5" title="Cell Background">
        {[
          { label: 'Default', color: null, cls: 'bg-white dark:bg-zinc-900 border-stone-300' },
          { label: 'Amber', color: 'rgba(251, 191, 36, 0.2)', cls: 'bg-amber-200 border-amber-400' },
          { label: 'Blue', color: 'rgba(59, 130, 246, 0.16)', cls: 'bg-blue-200 border-blue-400' },
          { label: 'Green', color: 'rgba(34, 197, 94, 0.18)', cls: 'bg-emerald-200 border-emerald-400' },
          { label: 'Rose', color: 'rgba(244, 63, 94, 0.16)', cls: 'bg-rose-200 border-rose-400' },
        ].map((swatch) => (
          <button
            key={swatch.label}
            type="button"
            onClick={() =>
              editor.chain().focus().setCellAttribute('backgroundColor', swatch.color).run()
            }
            className={`w-3.5 h-3.5 rounded-full border ${swatch.cls} hover:scale-110 transition`}
            title={`Cell background: ${swatch.label}`}
          />
        ))}
      </div>

      {/* Delete Table */}
      <button
        type="button"
        onClick={() => editor.chain().focus().deleteTable().run()}
        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded transition"
        title="Delete Entire Table"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

