import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import { X, Replace, ChevronDown, ChevronUp } from 'lucide-react';

interface FindReplaceBarProps {
  editor: Editor | null;
  onClose: () => void;
}

export const FindReplaceBar: React.FC<FindReplaceBarProps> = ({ editor, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [matchCount, setMatchCount] = useState<number | null>(null);

  if (!editor) return null;

  const handleFind = () => {
    if (!searchTerm.trim()) {
      setMatchCount(0);
      return;
    }
    const html = editor.getHTML();
    const regex = new RegExp(escapeRegex(searchTerm), 'gi');
    const matches = html.match(regex);
    setMatchCount(matches ? matches.length : 0);
  };

  const handleReplace = () => {
    if (!searchTerm.trim()) return;
    const currentHtml = editor.getHTML();
    const regex = new RegExp(escapeRegex(searchTerm), 'i');
    if (regex.test(currentHtml)) {
      const updated = currentHtml.replace(regex, replaceTerm);
      editor.commands.setContent(updated, false);
      handleFind();
    }
  };

  const handleReplaceAll = () => {
    if (!searchTerm.trim()) return;
    const currentHtml = editor.getHTML();
    const regex = new RegExp(escapeRegex(searchTerm), 'gi');
    const updated = currentHtml.replace(regex, replaceTerm);
    editor.commands.setContent(updated, false);
    setMatchCount(0);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-stone-100/90 dark:bg-zinc-900 border-b border-stone-200 dark:border-zinc-800 text-xs animate-in slide-in-from-top-1">
      <div className="flex items-center gap-1.5 flex-1 max-w-sm">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFind();
            if (e.key === 'Escape') onClose();
          }}
          placeholder="Find in note..."
          className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          autoFocus
        />
        {matchCount !== null && (
          <span className="text-[11px] text-stone-400 dark:text-zinc-500 whitespace-nowrap">
            {matchCount} match{matchCount === 1 ? '' : 'es'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-1 max-w-sm">
        <input
          type="text"
          value={replaceTerm}
          onChange={(e) => setReplaceTerm(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleReplace();
            if (e.key === 'Escape') onClose();
          }}
          placeholder="Replace with..."
          className="w-full px-2 py-1 bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={handleReplace}
          className="px-2 py-1 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-700 rounded text-[11px] font-medium text-stone-700 dark:text-zinc-200 transition"
        >
          Replace
        </button>
        <button
          type="button"
          onClick={handleReplaceAll}
          className="px-2 py-1 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-700 rounded text-[11px] font-medium text-stone-700 dark:text-zinc-200 transition"
        >
          All
        </button>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          title="Close (Esc)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

function escapeRegex(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

