import React from 'react';
import { X, Command, Keyboard, Hash, Sparkles } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden flex flex-col z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-stone-100">
            <Keyboard className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span>Keyboard Shortcuts & Markdown Reference</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto">
          {/* Extension & App Shortcuts */}
          <div>
            <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-2 flex items-center gap-1.5">
              <Command className="w-3.5 h-3.5 text-stone-400" />
              <span>Application Shortcuts</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Search Omnibar</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-zinc-900 border rounded text-[10px]">Ctrl + K</kbd>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">New Note</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-zinc-900 border rounded text-[10px]">Ctrl + N</kbd>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Find & Replace</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-zinc-900 border rounded text-[10px]">Ctrl + F</kbd>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Focus Mode</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-zinc-900 border rounded text-[10px]">F11</kbd>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Open Popup</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-zinc-900 border rounded text-[10px]">Alt + N</kbd>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Open Full Tab</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-zinc-900 border rounded text-[10px]">Ctrl+Shift+K</kbd>
              </div>
            </div>
          </div>

          {/* Text Formatting Shortcuts */}
          <div>
            <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-2 flex items-center gap-1.5">
              <span>Text Formatting</span>
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Bold</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-zinc-900 border rounded text-[10px]">Ctrl + B</kbd>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Italic</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-zinc-900 border rounded text-[10px]">Ctrl + I</kbd>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Underline</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-zinc-900 border rounded text-[10px]">Ctrl + U</kbd>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Undo / Redo</span>
                <kbd className="px-1.5 py-0.5 font-mono bg-white dark:bg-zinc-900 border rounded text-[10px]">Ctrl + Z / Y</kbd>
              </div>
            </div>
          </div>

          {/* Markdown Input Triggers */}
          <div>
            <h4 className="font-semibold text-stone-800 dark:text-stone-200 mb-2 flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-stone-400" />
              <span>Markdown Shortcuts (Type in Editor)</span>
            </h4>
            <div className="space-y-1.5">
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Headings (H1, H2, H3)</span>
                <code className="text-amber-700 dark:text-amber-400 font-mono text-[11px]"># , ## , ### </code>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Checklist / Task List</span>
                <code className="text-amber-700 dark:text-amber-400 font-mono text-[11px]">[]  or  [ ] </code>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Bullet & Numbered Lists</span>
                <code className="text-amber-700 dark:text-amber-400 font-mono text-[11px]">-  or  1. </code>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Blockquote</span>
                <code className="text-amber-700 dark:text-amber-400 font-mono text-[11px]">&gt; </code>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Code Block</span>
                <code className="text-amber-700 dark:text-amber-400 font-mono text-[11px]">```</code>
              </div>
              <div className="p-2 rounded bg-stone-50 dark:bg-zinc-950 border border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between">
                <span className="text-stone-600 dark:text-zinc-400">Horizontal Divider</span>
                <code className="text-amber-700 dark:text-amber-400 font-mono text-[11px]">---</code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

