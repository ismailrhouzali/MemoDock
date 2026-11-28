import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Pilcrow,
} from 'lucide-react';

interface BlockHandleMenuProps {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement>;
}

interface HoveredBlock {
  pos: number;
  index: number;
  top: number;
  left: number;
}

export const BlockHandleMenu: React.FC<BlockHandleMenuProps> = ({ editor, containerRef }) => {
  const [hovered, setHovered] = useState<HoveredBlock | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !editor) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (menuOpen) return;
      const pm = container.querySelector('.ProseMirror');
      if (!pm) return;

      const target = e.target as HTMLElement | null;
      if (!target || !pm.contains(target)) {
        return;
      }

      // Walk up to direct child of .ProseMirror
      let blockEl: HTMLElement | null = target;
      while (blockEl && blockEl.parentElement !== pm) {
        blockEl = blockEl.parentElement;
      }
      if (!blockEl || blockEl.parentElement !== pm) return;

      const children = Array.from(pm.children);
      const index = children.indexOf(blockEl);
      if (index === -1) return;

      let pos = 0;
      const doc = editor.state.doc;
      if (index < doc.childCount) {
        for (let i = 0; i < index; i++) {
          pos += doc.child(i).nodeSize;
        }
      } else {
        return;
      }

      const rect = blockEl.getBoundingClientRect();
      setHovered({
        pos,
        index,
        top: rect.top + 2,
        left: Math.max(8, rect.left - 28),
      });
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (menuOpen) return;
      const related = e.relatedTarget as HTMLElement | null;
      if (related && related.closest('[data-block-handle]')) return;
      setHovered(null);
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [editor, containerRef, menuOpen]);

  if (!hovered || !editor.isEditable) return null;

  const doc = editor.state.doc;
  const targetNode = hovered.index < doc.childCount ? doc.child(hovered.index) : null;
  if (!targetNode) return null;

  const selectBlock = () => {
    editor.chain().focus().setTextSelection(hovered.pos + 1).run();
  };

  const handleMove = (dir: -1 | 1) => {
    const targetIdx = hovered.index + dir;
    if (targetIdx < 0 || targetIdx >= doc.childCount) return;

    const jsonDoc = editor.getJSON();
    if (!jsonDoc.content) return;
    const items = [...jsonDoc.content];
    const [moved] = items.splice(hovered.index, 1);
    items.splice(targetIdx, 0, moved);
    editor.commands.setContent({ ...jsonDoc, content: items }, true);
    setMenuOpen(false);
    setHovered(null);
  };

  const handleDuplicate = () => {
    const json = targetNode.toJSON();
    const insertPos = hovered.pos + targetNode.nodeSize;
    editor.chain().focus().insertContentAt(insertPos, json).run();
    setMenuOpen(false);
  };

  const handleDelete = () => {
    editor
      .chain()
      .focus()
      .deleteRange({ from: hovered.pos, to: hovered.pos + targetNode.nodeSize })
      .run();
    setMenuOpen(false);
    setHovered(null);
  };

  const turnIntoActions = [
    { label: 'Text', Icon: Pilcrow, run: () => { selectBlock(); editor.chain().focus().setParagraph().run(); } },
    { label: 'Heading 1', Icon: Heading1, run: () => { selectBlock(); editor.chain().focus().setHeading({ level: 1 }).run(); } },
    { label: 'Heading 2', Icon: Heading2, run: () => { selectBlock(); editor.chain().focus().setHeading({ level: 2 }).run(); } },
    { label: 'Heading 3', Icon: Heading3, run: () => { selectBlock(); editor.chain().focus().setHeading({ level: 3 }).run(); } },
    { label: 'Bullet List', Icon: List, run: () => { selectBlock(); editor.chain().focus().toggleBulletList().run(); } },
    { label: 'Ordered List', Icon: ListOrdered, run: () => { selectBlock(); editor.chain().focus().toggleOrderedList().run(); } },
    { label: 'To-Do List', Icon: CheckSquare, run: () => { selectBlock(); editor.chain().focus().toggleTaskList().run(); } },
    { label: 'Blockquote', Icon: Quote, run: () => { selectBlock(); editor.chain().focus().toggleBlockquote().run(); } },
  ];

  return (
    <div
      data-block-handle="true"
      style={{ top: hovered.top, left: hovered.left }}
      className="no-print fixed z-30"
    >
      <button
        type="button"
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-6 h-6 rounded-md flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-200/70 dark:hover:bg-zinc-800 transition"
        title="Block actions"
      >
        <GripVertical className="w-3.5 h-3.5" />
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-7 z-40 w-48 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float p-1.5 text-xs space-y-0.5">
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Block Actions
            </div>
            <button
              type="button"
              onClick={() => handleMove(-1)}
              disabled={hovered.index === 0}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-800 disabled:opacity-35 text-left"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>Move Up</span>
            </button>
            <button
              type="button"
              onClick={() => handleMove(1)}
              disabled={hovered.index >= doc.childCount - 1}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-800 disabled:opacity-35 text-left"
            >
              <ArrowDown className="w-3.5 h-3.5" />
              <span>Move Down</span>
            </button>
            <button
              type="button"
              onClick={handleDuplicate}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-800 text-left"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Duplicate</span>
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <div className="border-t border-stone-200 dark:border-zinc-800 my-1" />
            <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Turn Into
            </div>
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {turnIntoActions.map((act) => {
                const Icon = act.Icon;
                return (
                  <button
                    key={act.label}
                    type="button"
                    onClick={() => {
                      act.run();
                      setMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-zinc-800 text-left"
                  >
                    <Icon className="w-3.5 h-3.5 text-stone-500" />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
