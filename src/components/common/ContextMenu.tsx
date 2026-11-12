import React, { useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Code,
  Rows,
  Columns,
  Trash2,
  Plus,
  ClipboardPaste,
  Scissors,
  Copy,
  Link as LinkIcon,
  Eraser,
} from 'lucide-react';

export interface ContextMenuPosition {
  x: number;
  y: number;
}

interface ContextMenuProps {
  position: ContextMenuPosition | null;
  editor: Editor | null;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ position, editor, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!position || !editor) return null;

  const isTable = editor.isActive('table');
  const hasSelection = !editor.state.selection.empty;

  // Keep menu within screen boundaries
  const menuWidth = 200;
  const menuHeight = isTable ? 320 : 220;
  const safeX = Math.min(position.x, window.innerWidth - menuWidth - 10);
  const safeY = Math.min(position.y, window.innerHeight - menuHeight - 10);

  return (
    <div
      ref={menuRef}
      style={{ left: `${Math.max(10, safeX)}px`, top: `${Math.max(10, safeY)}px` }}
      className="fixed z-50 w-52 bg-white dark:bg-zinc-900 border border-stone-200/90 dark:border-zinc-800 rounded-lg shadow-float py-1.5 text-xs text-stone-700 dark:text-zinc-200 select-none animate-in fade-in duration-100"
    >
      {/* Table Operations if inside a table */}
      {isTable && (
        <>
          <div className="px-3 py-1 font-semibold text-[10px] text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
            Table Controls
          </div>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().addRowBefore().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-stone-400" /> Add Row Above</span>
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().addRowAfter().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-stone-400" /> Add Row Below</span>
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().deleteRow().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete Row</span>
          </button>

          <div className="my-1 border-t border-stone-100 dark:border-zinc-800" />

          <button
            type="button"
            onClick={() => {
              editor.chain().focus().addColumnBefore().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-stone-400" /> Add Column Left</span>
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().addColumnAfter().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2"><Plus className="w-3.5 h-3.5 text-stone-400" /> Add Column Right</span>
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().deleteColumn().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete Column</span>
          </button>

          <div className="my-1 border-t border-stone-100 dark:border-zinc-800" />

          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleHeaderRow().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left transition"
          >
            <span>Toggle Header Row</span>
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().deleteTable().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-between text-left transition font-medium"
          >
            <span className="flex items-center gap-2"><Trash2 className="w-3.5 h-3.5" /> Delete Table</span>
          </button>

          <div className="my-1 border-t border-stone-100 dark:border-zinc-800" />
        </>
      )}

      {/* Text formatting if text is selected */}
      {hasSelection && (
        <>
          <div className="px-3 py-1 font-semibold text-[10px] text-stone-400 dark:text-zinc-500 uppercase tracking-wider">
            Format Selection
          </div>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleBold().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2"><Bold className="w-3.5 h-3.5 text-stone-400" /> Bold</span>
            <span className="text-[10px] text-stone-400">Ctrl+B</span>
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleItalic().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2"><Italic className="w-3.5 h-3.5 text-stone-400" /> Italic</span>
            <span className="text-[10px] text-stone-400">Ctrl+I</span>
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().toggleCode().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2"><Code className="w-3.5 h-3.5 text-stone-400" /> Inline Code</span>
          </button>
          <button
            type="button"
            onClick={() => {
              editor.chain().focus().unsetAllMarks().clearNodes().run();
              onClose();
            }}
            className="w-full px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left transition"
          >
            <span className="flex items-center gap-2"><Eraser className="w-3.5 h-3.5 text-stone-400" /> Clear Formatting</span>
          </button>

          <div className="my-1 border-t border-stone-100 dark:border-zinc-800" />
        </>
      )}

      {/* Clipboard actions */}
      <button
        type="button"
        onClick={async () => {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              editor.chain().focus().insertContent(text).run();
            }
          } catch (err) {
            console.warn('Clipboard read error:', err);
          }
          onClose();
        }}
        className="w-full px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between text-left transition"
      >
        <span className="flex items-center gap-2"><ClipboardPaste className="w-3.5 h-3.5 text-stone-400" /> Paste Clean Text</span>
      </button>
    </div>
  );
};

