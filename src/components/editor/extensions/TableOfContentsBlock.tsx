import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useEffect, useState } from 'react';
import { ListTree, Trash2 } from 'lucide-react';

interface TocHeading {
  id: string;
  level: number;
  text: string;
  pos: number;
}

const TableOfContentsBlockComponent: React.FC<NodeViewProps> = ({ editor, deleteNode }) => {
  const [headings, setHeadings] = useState<TocHeading[]>([]);

  useEffect(() => {
    if (!editor) return;

    const collectHeadings = () => {
      const found: TocHeading[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const text = node.textContent.trim();
          if (text) {
            found.push({
              id: `toc-${pos}`,
              level: node.attrs.level || 1,
              text,
              pos,
            });
          }
        }
      });
      setHeadings(found);
    };

    collectHeadings();
    editor.on('update', collectHeadings);
    return () => {
      editor.off('update', collectHeadings);
    };
  }, [editor]);

  const scrollToHeading = (pos: number) => {
    if (!editor) return;
    try {
      const domAtPos = editor.view.domAtPos(pos + 1);
      const el = (domAtPos.node instanceof HTMLElement ? domAtPos.node : domAtPos.node.parentElement) as HTMLElement | null;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      // Fallback: focus selection at heading
      editor.chain().focus().setTextSelection(pos + 1).run();
    }
  };

  return (
    <NodeViewWrapper className="my-3 select-none">
      <div className="rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-900/50 p-3.5 text-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 font-semibold text-stone-600 dark:text-zinc-300 uppercase tracking-wider text-[10px]">
            <ListTree className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Table of Contents</span>
          </div>
          <button
            type="button"
            onClick={deleteNode}
            className="no-print p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-red-500 transition"
            title="Remove Table of Contents"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>

        {headings.length === 0 ? (
          <div className="text-stone-400 dark:text-zinc-500 italic text-[11px] py-1">
            Add headings (H1–H4) to populate this table of contents.
          </div>
        ) : (
          <ul className="space-y-1">
            {headings.map((h) => (
              <li
                key={h.id}
                style={{ paddingLeft: `${Math.max(0, h.level - 1) * 14}px` }}
              >
                <button
                  type="button"
                  onClick={() => scrollToHeading(h.pos)}
                  className="text-left text-stone-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition truncate max-w-full"
                >
                  {h.text}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const TableOfContentsBlock = Node.create({
  name: 'tableOfContentsBlock',
  group: 'block',
  atom: true,

  parseHTML() {
    return [{ tag: 'div[data-type="toc-block"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'toc-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TableOfContentsBlockComponent);
  },
});
