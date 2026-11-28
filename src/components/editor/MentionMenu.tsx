import React, { useEffect, useMemo, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Note } from '../../db/types';
import { FileText, Calendar } from 'lucide-react';

interface MentionMenuProps {
  editor: Editor;
  isOpen: boolean;
  trigger: '[[' | '@';
  position: { top: number; left: number };
  query: string;
  notes: Note[];
  currentNoteId: string;
  onClose: () => void;
}

interface MentionOption {
  id: string;
  label: string;
  sublabel: string;
  kind: 'note' | 'date';
  icon?: string;
  insertHtml?: string;
  insertText?: string;
}

export const MentionMenu: React.FC<MentionMenuProps> = ({
  editor,
  isOpen,
  trigger,
  position,
  query,
  notes,
  currentNoteId,
  onClose,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const options = useMemo<MentionOption[]>(() => {
    const q = query.trim().toLowerCase();
    const list: MentionOption[] = [];

    if (trigger === '@') {
      const today = new Date();
      const tomorrow = new Date(Date.now() + 86400000);
      const fmt = (d: Date) => d.toISOString().slice(0, 10);

      const dateChips: MentionOption[] = [
        {
          id: 'date-today',
          label: `Today (${fmt(today)})`,
          sublabel: 'Insert today’s date',
          kind: 'date',
          insertText: `${fmt(today)} `,
        },
        {
          id: 'date-tomorrow',
          label: `Tomorrow (${fmt(tomorrow)})`,
          sublabel: 'Insert tomorrow’s date',
          kind: 'date',
          insertText: `${fmt(tomorrow)} `,
        },
        {
          id: 'date-now',
          label: `Now (${today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          sublabel: 'Insert current time',
          kind: 'date',
          insertText: `${today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} `,
        },
      ];

      dateChips.forEach((chip) => {
        if (!q || chip.label.toLowerCase().includes(q)) {
          list.push(chip);
        }
      });
    }

    const matchingNotes = (notes || [])
      .filter((n) => n && !n.isTrash && n.id !== currentNoteId)
      .filter((n) => !q || (n.title || 'Untitled').toLowerCase().includes(q))
      .slice(0, 8);

    matchingNotes.forEach((n) => {
      const title = n.title || 'Untitled Note';
      const safeTitle = title
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      list.push({
        id: n.id,
        label: title,
        sublabel: 'Link to note',
        kind: 'note',
        icon: n.icon,
        insertHtml: `<a href="notebook://note/${n.id}">${safeTitle}</a> `,
      });
    });

    return list;
  }, [notes, currentNoteId, query, trigger]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen, trigger]);

  const applyOption = (opt: MentionOption) => {
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 40), from, '\n');
    const idx = textBefore.lastIndexOf(trigger);
    if (idx !== -1) {
      const deleteFrom = from - (textBefore.length - idx);
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
    }
    if (opt.insertHtml) {
      editor.chain().focus().insertContent(opt.insertHtml).run();
    } else if (opt.insertText) {
      editor.chain().focus().insertContent(opt.insertText).run();
    }
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, options.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + Math.max(1, options.length)) % Math.max(1, options.length));
      } else if (e.key === 'Enter' && options[selectedIndex]) {
        e.preventDefault();
        applyOption(options[selectedIndex]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isOpen, options, selectedIndex]);

  if (!isOpen || options.length === 0) return null;

  return (
    <div
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 w-68 max-h-64 overflow-y-auto bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float p-1.5 text-xs animate-in fade-in duration-100"
    >
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        {trigger === '[[' ? 'Link Note' : 'Mention Page or Date'}
      </div>
      {options.map((opt, idx) => (
        <button
          key={opt.id}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyOption(opt);
          }}
          className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition ${
            idx === selectedIndex
              ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
              : 'hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200'
          }`}
        >
          <div className="w-6 h-6 rounded bg-stone-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0 text-sm">
            {opt.icon ? (
              <span>{opt.icon}</span>
            ) : opt.kind === 'date' ? (
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-blue-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{opt.label}</div>
            <div className="text-[10px] text-stone-400 truncate">{opt.sublabel}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
