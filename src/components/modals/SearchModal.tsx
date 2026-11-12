import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  FileText,
  Star,
  Pin,
  X,
  Tag as TagIcon,
  Folder as FolderIcon,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Note, Folder } from '../../db/types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  folders?: Folder[];
  onSelectNote: (note: Note) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  notes,
  folders = [],
  onSelectNote,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Process filter commands
  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();

  const filteredNotes = notes.filter((n) => {
    if (lower.startsWith('/pinned')) {
      const rest = lower.replace('/pinned', '').trim();
      return n.isPinned && (!rest || n.title.toLowerCase().includes(rest) || n.plainText.toLowerCase().includes(rest));
    }
    if (lower.startsWith('/favorite') || lower.startsWith('/fav')) {
      const rest = lower.replace(/\/favorite|\/fav/, '').trim();
      return n.isFavorite && (!rest || n.title.toLowerCase().includes(rest) || n.plainText.toLowerCase().includes(rest));
    }
    if (lower.startsWith('/recent')) {
      const rest = lower.replace('/recent', '').trim();
      return !n.isTrash && (!rest || n.title.toLowerCase().includes(rest) || n.plainText.toLowerCase().includes(rest));
    }
    if (lower.startsWith('/tag')) {
      const targetTag = lower.replace('/tag', '').trim();
      if (!targetTag) return (n.tags && n.tags.length > 0);
      return n.tags && n.tags.some((t) => t.toLowerCase().includes(targetTag));
    }
    if (lower.startsWith('/folder')) {
      const targetFolder = lower.replace('/folder', '').trim();
      if (!targetFolder) return !!n.folderId;
      const matchingFolder = folders.find((f) => f.name.toLowerCase().includes(targetFolder));
      return matchingFolder ? n.folderId === matchingFolder.id : false;
    }

    if (!trimmed) return !n.isTrash;

    return (
      !n.isTrash &&
      (n.title.toLowerCase().includes(lower) ||
        n.plainText.toLowerCase().includes(lower) ||
        (n.tags && n.tags.some((t) => t.toLowerCase().includes(lower))))
    );
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredNotes.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev <= 0 ? filteredNotes.length - 1 : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredNotes[selectedIndex]) {
        onSelectNote(filteredNotes[selectedIndex]);
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const insertCommand = (cmd: string) => {
    setQuery(cmd);
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden flex flex-col z-10">
        
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200/80 dark:border-zinc-800/80">
          <Search className="w-4 h-4 text-stone-400 dark:text-zinc-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type to search or use /tag, /folder, /favorite, /recent, /pinned..."
            className="w-full bg-transparent text-sm text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Command Filter Chips */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-50/70 dark:bg-zinc-950/50 border-b border-stone-100 dark:border-zinc-800 text-[11px] overflow-x-auto select-none">
          <span className="text-stone-400 dark:text-zinc-500 mr-1">Filters:</span>
          {[
            { label: '/tag ', icon: TagIcon },
            { label: '/folder ', icon: FolderIcon },
            { label: '/favorite', icon: Star },
            { label: '/pinned', icon: Pin },
            { label: '/recent', icon: Clock },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => insertCommand(item.label)}
                className="px-2 py-0.5 rounded bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:border-amber-500 text-stone-600 dark:text-zinc-300 font-mono transition flex items-center gap-1"
              >
                <Icon className="w-3 h-3 text-amber-600" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto divide-y divide-stone-100 dark:divide-zinc-800/40 p-1">
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400 dark:text-zinc-500">
              No matching notes found for "{query}"
            </div>
          ) : (
            filteredNotes.map((note, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={note.id}
                  onClick={() => {
                    onSelectNote(note);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`p-3 rounded-lg cursor-pointer transition flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-50/70 dark:bg-zinc-800/80 text-stone-900 dark:text-stone-100'
                      : 'hover:bg-stone-50 dark:hover:bg-zinc-800/40 text-stone-700 dark:text-zinc-300'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 font-medium text-xs mb-1">
                      <FileText className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{note.title || 'Untitled Note'}</span>
                      {note.isPinned && (
                        <Pin className="w-3 h-3 text-amber-600 fill-amber-600 shrink-0" />
                      )}
                      {note.isFavorite && (
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                    {note.plainText && (
                      <p className="text-[11px] text-stone-400 dark:text-zinc-500 truncate line-clamp-1">
                        {note.plainText}
                      </p>
                    )}
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {note.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] px-1.5 py-0.2 bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 rounded"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-stone-400 dark:text-zinc-500 whitespace-nowrap mt-0.5">
                    {new Date(note.updatedAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-stone-200/60 dark:border-zinc-800/60 bg-stone-50/50 dark:bg-zinc-950/50 flex items-center justify-between text-[10px] text-stone-400 dark:text-zinc-500">
          <span>Navigate with ↑ / ↓, select with Enter</span>
          <span>{filteredNotes.length} notes found</span>
        </div>
      </div>
    </div>
  );
};
