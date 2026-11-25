import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

const ToggleComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const [isOpen, setIsOpen] = useState<boolean>(node.attrs.open !== false);
  const [title, setTitle] = useState<string>(node.attrs.title || '');
  const [body, setBody] = useState<string>(node.attrs.body || '');

  const toggleOpen = () => {
    const next = !isOpen;
    setIsOpen(next);
    updateAttributes({ open: next });
  };

  return (
    <NodeViewWrapper className="my-2.5 select-none">
      <div className="group border border-stone-200/80 dark:border-zinc-800 rounded-xl bg-stone-50/40 dark:bg-zinc-900/40 overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            type="button"
            onClick={toggleOpen}
            className="p-0.5 text-stone-500 hover:text-stone-900 dark:hover:text-zinc-100 rounded transition"
          >
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              updateAttributes({ title: e.target.value });
            }}
            placeholder="Toggle heading..."
            className="flex-1 bg-transparent text-xs md:text-sm font-semibold text-stone-800 dark:text-zinc-100 focus:outline-none"
          />
          <button
            type="button"
            onClick={deleteNode}
            className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 rounded transition"
            title="Remove toggle block"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
        {isOpen && (
          <div className="px-9 pb-3 pt-0.5 border-t border-stone-200/50 dark:border-zinc-800/60">
            <textarea
              value={body}
              onChange={(e) => {
                setBody(e.target.value);
                updateAttributes({ body: e.target.value });
              }}
              placeholder="Write hidden details inside this toggle..."
              rows={Math.max(2, body.split('\n').length)}
              className="w-full bg-transparent text-xs text-stone-700 dark:text-zinc-300 focus:outline-none resize-none leading-relaxed pt-2"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ToggleBlock = Node.create({
  name: 'toggleBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: { default: '' },
      body: { default: '' },
      open: { default: true },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toggle-block"]',
        getAttrs: (el) => {
          if (typeof el === 'string') return {};
          return {
            title: el.getAttribute('data-title') || '',
            body: el.getAttribute('data-body') || '',
            open: el.getAttribute('data-open') !== 'false',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'toggle-block',
        'data-title': HTMLAttributes.title,
        'data-body': HTMLAttributes.body,
        'data-open': String(HTMLAttributes.open),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleComponent);
  },
});
