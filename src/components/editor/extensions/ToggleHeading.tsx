import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React from 'react';
import { ChevronRight, ChevronDown, Trash2 } from 'lucide-react';

const ToggleHeadingComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const { level = 2, title = '', body = '', open = true } = node.attrs;

  const headingSize =
    level === 1
      ? 'text-2xl font-bold'
      : level === 2
        ? 'text-xl font-semibold'
        : 'text-base font-semibold';

  return (
    <NodeViewWrapper className="my-2.5 select-text">
      <div className="group rounded-lg border border-transparent hover:border-stone-200/70 dark:hover:border-zinc-800/80 transition px-1 py-0.5">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => updateAttributes({ open: !open })}
            className="no-print p-1 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-800 text-stone-500 transition flex-shrink-0"
            title={open ? 'Collapse heading' : 'Expand heading'}
          >
            {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            placeholder={`Toggle Heading ${level}`}
            className={`w-full bg-transparent ${headingSize} text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none`}
          />
          <button
            type="button"
            onClick={deleteNode}
            className="no-print opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-red-500 transition flex-shrink-0"
            title="Delete toggle heading"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {open && (
          <div className="pl-7 pt-1 pb-1">
            <textarea
              value={body}
              onChange={(e) => updateAttributes({ body: e.target.value })}
              placeholder="Write collapsible content inside this heading..."
              rows={Math.max(2, (body || '').split('\n').length)}
              className="w-full bg-transparent text-sm leading-relaxed text-stone-700 dark:text-stone-300 placeholder-stone-400 focus:outline-none resize-none"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ToggleHeading = Node.create({
  name: 'toggleHeading',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      level: { default: 2 },
      title: { default: '' },
      body: { default: '' },
      open: { default: true },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="toggle-heading"]',
        getAttrs: (el) => {
          if (typeof el === 'string') return {};
          return {
            level: Number(el.getAttribute('data-level') || 2),
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
        'data-type': 'toggle-heading',
        'data-level': HTMLAttributes.level,
        'data-title': HTMLAttributes.title,
        'data-body': HTMLAttributes.body,
        'data-open': String(HTMLAttributes.open),
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ToggleHeadingComponent);
  },
});
