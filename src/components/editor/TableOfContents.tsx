import React, { useEffect, useState, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { ListTree, ChevronRight, ChevronLeft, Eye, Hash } from 'lucide-react';

export interface HeadingItem {
  id: string;
  level: number;
  text: string;
  pos: number;
}

interface TableOfContentsProps {
  editor: Editor | null;
  isOpen: boolean;
  onToggle: () => void;
  maxLevel?: number; // 1-4, defaults to 4
  position?: 'left' | 'right';
  width?: number; // in pixels, defaults to 256
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  editor,
  isOpen,
  onToggle,
  maxLevel = 4,
  position = 'right',
  width = 256,
}) => {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);
  const [activePos, setActivePos] = useState<number | null>(null);
  const activeItemRef = useRef<HTMLButtonElement | null>(null);

  // 1. Extract Headings from ProseMirror Document
  useEffect(() => {
    if (!editor) return;

    const extractHeadings = () => {
      const items: HeadingItem[] = [];
      const slugCounts: Record<string, number> = {};

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const level = (node.attrs.level as number) || 1;
          if (level <= maxLevel) {
            const rawText = node.textContent.trim();
            const text = rawText || '(Untitled heading)';
            const baseSlug = text
              .toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-');
            const count = (slugCounts[baseSlug] || 0) + 1;
            slugCounts[baseSlug] = count;
            const uniqueId = `h-${level}-${pos}-${baseSlug || 'heading'}`;

            items.push({
              id: uniqueId,
              level,
              text,
              pos,
            });
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

  // 2. Real-Time Scroll Container Synchronization
  useEffect(() => {
    if (!editor || !isOpen || headings.length === 0) return;

    const scrollContainer = editor.view.dom.closest('.overflow-y-auto') as HTMLElement | null;
    if (!scrollContainer) return;

    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const containerRect = scrollContainer.getBoundingClientRect();
        const headingDoms = Array.from(
          editor.view.dom.querySelectorAll('h1, h2, h3, h4')
        ) as HTMLElement[];

        if (headingDoms.length === 0) return;

        let closestIdx = 0;
        for (let i = 0; i < headingDoms.length; i++) {
          const el = headingDoms[i];
          const rect = el.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;

          // If heading is at or above the reading line (approx 90px from top)
          if (relativeTop <= 90) {
            closestIdx = i;
          } else {
            break;
          }
        }

        const activeHeading = headings[closestIdx];
        if (activeHeading) {
          setActivePos(activeHeading.pos);
        }
      });
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, [editor, isOpen, headings]);

  // 3. Selection update listener fallback
  useEffect(() => {
    if (!editor) return;

    const updateFromSelection = () => {
      const currentPos = editor.state.selection.from;
      let closest: HeadingItem | null = null;
      for (const h of headings) {
        if (h.pos <= currentPos) {
          closest = h;
        } else {
          break;
        }
      }
      if (closest) {
        setActivePos(closest.pos);
      }
    };

    editor.on('selectionUpdate', updateFromSelection);
    return () => {
      editor.off('selectionUpdate', updateFromSelection);
    };
  }, [editor, headings]);

  // 4. Smooth Scroll to Heading
  const scrollToHeading = (item: HeadingItem, index: number) => {
    if (!editor || !editor.view) return;

    setActivePos(item.pos);

    // 1. Locate the heading DOM element
    let targetEl: HTMLElement | null = null;

    try {
      const nodeDom = editor.view.nodeDOM(item.pos);
      if (nodeDom instanceof HTMLElement) {
        targetEl = nodeDom;
      }
    } catch {}

    // Fallback: match by index or text in document heading elements
    if (!targetEl) {
      const allHeadings = Array.from(
        editor.view.dom.querySelectorAll('h1, h2, h3, h4')
      ) as HTMLElement[];
      if (allHeadings[index]) {
        targetEl = allHeadings[index];
      } else {
        targetEl = allHeadings.find((h) => h.textContent?.trim() === item.text) || null;
      }
    }

    // 2. Perform smooth scroll
    const scrollContainer = editor.view.dom.closest('.overflow-y-auto') as HTMLElement | null;
    if (targetEl && scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      const targetScrollTop = scrollContainer.scrollTop + (targetRect.top - containerRect.top) - 24;
      scrollContainer.scrollTo({ top: Math.max(0, targetScrollTop), behavior: 'smooth' });
    } else if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // 3. Highlight target element briefly to give clear feedback
    if (targetEl) {
      const prevBg = targetEl.style.backgroundColor;
      const prevOutline = targetEl.style.outline;
      targetEl.style.transition = 'background-color 0.3s ease, outline 0.3s ease';
      targetEl.style.backgroundColor = 'rgba(37, 99, 235, 0.15)';
      targetEl.style.outline = '2px solid rgba(37, 99, 235, 0.4)';
      targetEl.style.borderRadius = '4px';
      setTimeout(() => {
        if (targetEl) {
          targetEl.style.backgroundColor = prevBg;
          targetEl.style.outline = prevOutline;
        }
      }, 1200);
    }

    // 4. Safely set cursor selection inside the heading text
    try {
      editor.chain().focus().setTextSelection(item.pos + 1).run();
    } catch {
      try {
        editor.commands.focus();
      } catch {}
    }
  };

  // Scroll active item into view in outline pane
  useEffect(() => {
    if (activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activePos]);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={onToggle}
        className={`fixed ${position === 'left' ? 'left-3' : 'right-3'} bottom-12 z-30 p-2 rounded-full bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-float text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 transition`}
        title="Open Table of Contents (Outline)"
      >
        <ListTree className="w-4 h-4" />
      </button>
    );
  }

  const borderClass = position === 'left' ? 'border-r' : 'border-l';

  return (
    <aside
      style={{ width: `${width}px` }}
      className={`${borderClass} border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col h-full select-none text-xs flex-shrink-0 animate-in ${
        position === 'left' ? 'slide-in-from-left-2' : 'slide-in-from-right-2'
      } duration-150`}
    >
      {/* Header */}
      <div className="p-3 border-b border-stone-200/60 dark:border-zinc-800/60 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-semibold text-[11px] uppercase tracking-wider text-stone-500 dark:text-zinc-400">
          <ListTree className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
          <span>Outline</span>
        </span>
        <button
          type="button"
          onClick={onToggle}
          className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          title="Collapse Table of Contents"
        >
          {position === 'left' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Headings Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {headings.length === 0 ? (
          <div className="p-5 text-center text-stone-400 dark:text-zinc-600 text-xs space-y-1.5">
            <ListTree className="w-6 h-6 mx-auto stroke-1 opacity-40 mb-1" />
            <p className="font-medium text-stone-600 dark:text-zinc-400">No headings yet</p>
            <p className="text-[10px] leading-relaxed">
              Type <code className="bg-stone-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono"># H1</code> or <code className="bg-stone-200/60 dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">## H2</code> in the editor to structure your document outline.
            </p>
          </div>
        ) : (
          headings.map((item, idx) => {
            const isActive = activePos === item.pos;
            const indentClass =
              item.level === 1
                ? 'pl-2.5 font-semibold'
                : item.level === 2
                ? 'pl-4 font-medium text-[11px]'
                : item.level === 3
                ? 'pl-6 text-[11px]'
                : 'pl-8 text-[10px] opacity-80';

            return (
              <button
                key={item.id}
                ref={isActive ? activeItemRef : null}
                type="button"
                onClick={() => scrollToHeading(item, idx)}
                className={`w-full text-left py-1 pr-2 rounded transition flex items-center gap-1.5 truncate ${indentClass} ${
                  isActive
                    ? 'bg-blue-100/70 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 font-semibold shadow-2xs border-l-2 border-blue-600'
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
      <div className="p-2 border-t border-stone-200/60 dark:border-zinc-800/60 text-[10px] text-stone-400 text-center">
        {headings.length} section{headings.length === 1 ? '' : 's'} in document
      </div>
    </aside>
  );
};
