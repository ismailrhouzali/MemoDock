import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React from 'react';
import { FileText, ArrowUpRight, Trash2 } from 'lucide-react';

const SubPageBlockComponent: React.FC<NodeViewProps> = ({ node, deleteNode }) => {
  const { noteId = '', title = 'Untitled Sub-page', icon = '' } = node.attrs;

  const openSubPage = () => {
    if (!noteId) return;
    window.dispatchEvent(new CustomEvent('memodock-open-note', { detail: { noteId } }));
  };

  return (
    <NodeViewWrapper className="my-2 select-none">
      <div className="group flex items-center justify-between px-3 py-2 rounded-lg border border-stone-200/80 dark:border-zinc-800 bg-stone-50/70 dark:bg-zinc-900/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-800 transition">
        <button
          type="button"
          onClick={openSubPage}
          className="flex items-center gap-2 text-left flex-1 min-w-0"
        >
          <span className="flex-shrink-0 text-sm">
            {icon ? icon : <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          </span>
          <span className="font-medium text-xs text-stone-800 dark:text-stone-200 underline underline-offset-2 decoration-stone-300 dark:decoration-zinc-700 truncate">
            {title || 'Untitled Sub-page'}
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-blue-600 flex-shrink-0" />
        </button>
        <button
          type="button"
          onClick={deleteNode}
          className="no-print opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-red-500 transition"
          title="Remove sub-page link"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </NodeViewWrapper>
  );
};

export const SubPageBlock = Node.create({
  name: 'subPageBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      noteId: { default: '' },
      title: { default: 'Untitled Sub-page' },
      icon: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="sub-page-block"]',
        getAttrs: (el) => {
          if (typeof el === 'string') return {};
          return {
            noteId: el.getAttribute('data-note-id') || '',
            title: el.getAttribute('data-title') || 'Untitled Sub-page',
            icon: el.getAttribute('data-icon') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'sub-page-block',
        'data-note-id': HTMLAttributes.noteId,
        'data-title': HTMLAttributes.title,
        'data-icon': HTMLAttributes.icon,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SubPageBlockComponent);
  },
});
