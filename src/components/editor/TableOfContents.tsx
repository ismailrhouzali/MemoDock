import React, { useEffect, useState, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { ListTree, ChevronRight, ChevronLeft, Eye, Hash } from 'lucide-react';

interface HeadingItem {
  id: string;
  level: number;
  text: string;
  pos: number;
}

interface TableOfContentsProps {
  editor: Editor | null;
  isOpen: boolean;
  onToggle: () => void;
  maxLevel?: number; // 2 for H1-H2, 3 for H1-H3, 4 for H1-H4
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  editor,
  isOpen,
  onToggle,
  maxLevel = 3,
}) => {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activePos, setActivePos] = useState<number | null>(null);

  // Extract headings from editor document whenever content updates
  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      const items: HeadingItem[] = [];
      const slugCounts: Record<string, number> = {};

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = node.attrs.level as number;
          if (level <= maxLevel) {
            const text = node.textContent.trim();
            if (text) {
              const baseSlug = text
                .toLowerCase()
                .replace(/[^\w\s-]/g, '')
                .replace(/\s+/g, '-');
              const count = (slugCounts[baseSlug] || 0) + 1;
              slugCounts[baseSlug] = count;
              const uniqueId = count > 1 ? `${baseSlug}-${count}` : baseSlug;

              items.push({
                id: uniqueId,
                level,
                text,
                pos,
              });
            }
          }
        }
      });

      setHeadings(items);
    };

    extractHeadings();

    editor.on('update', extractHeadings);
    return () => {
      editor.off('update', extractHeadings);
    };
  }, [editor, maxLevel]);

  // Track active heading position on selection update
  useEffect(() => {
    if (!editor) return;

    const updateActiveHeading = () => {
      const currentPos = editor.state.selection.from;
      let closestHeading: HeadingItem | null = null;

      for (const h of headings) {
        if (h.pos <= currentPos) {
          closestHeading = h;
        } else {
          break;
        }
      }

      if (closestHeading) {
        setActivePos(closestHeading.pos);
      }
    };

    updateActiveHeading();

    editor.on('selectionUpdate', updateActiveHeading);
    return () => {
      editor.off('selectionUpdate', updateActiveHeading);
    };
  }, [editor, headings]);

  const scrollToHeading = (pos: number) => {
    if (!editor) return;

    editor.chain().focus().setTextSelection(pos).run();
    setActivePos(pos);

    try {
      const dom = editor.view.domAtPos(pos);
      const targetElement = dom.node instanceof HTMLElement ? dom.node : dom.node.parentElement;
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } catch {
      // Fallback
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className="fixed right-3 bottom-12 z-30 p-2 rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-float text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition"
        title="Open Table of Contents"
      >
        <ListTree className="w-4 h-4" />
      </button>
    );
  }

  return (
    <aside className="w-56 sm:w-64 border-l border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col h-full select-none text-xs flex-shrink-0 animate-in slide-in-from-right-2 duration-150">
      
      {/* Header */}
      <div className="p-3 border-b border-stone-200/60 dark:border-zinc-800/60 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-stone-500 dark:text-zinc-400">
          <ListTree className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
          <span>Outline</span>
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          title="Collapse Table of Contents"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Headings Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {headings.length === 0 ? (
          <div className="p-4 text-center text-stone-400 dark:text-zinc-600 text-xs space-y-1">
            <p>No headings yet.</p>
            <p className="text-[10px]">Type # H1, ## H2 in editor to create outline.</p>
          </div>
        ) : (
          headings.map((item) => {
            const isActive = activePos === item.pos;
            const indentClass =
              item.level === 1
                ? 'pl-2 font-medium'
                : item.level === 2
                ? 'pl-4 text-[11px]'
                : item.level === 3
                ? 'pl-6 text-[10px]'
                : 'pl-8 text-[10px]';

            return (
              <button
                key={`${item.id}-${item.pos}`}
                type="button"
                onClick={() => scrollToHeading(item.pos)}
                className={`w-full text-left py-1 pr-2 rounded transition flex items-center gap-1.5 truncate ${indentClass} ${
                  isActive
                    ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold'
                    : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-900 hover:text-stone-900 dark:hover:text-stone-200'
                }`}
                title={item.text}
              >
                <span className="opacity-40 text-[9px] font-mono flex-shrink-0">
                  {'H' + item.level}
                </span>
                <span className="truncate">{item.text}</span>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 border-t border-stone-200/60 dark:border-zinc-800/60 text-[10px] text-stone-400 text-center">
        {headings.length} section{headings.length === 1 ? '' : 's'} in document
      </div>
    </aside>
  );
};
