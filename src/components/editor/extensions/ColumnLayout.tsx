import { Node, mergeAttributes } from '@tiptap/core';

export const ColumnItem = Node.create({
  name: 'columnItem',
  content: 'block+',
  isolating: true,

  parseHTML() {
    return [{ tag: 'div[data-type="column-item"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'column-item',
        class:
          'min-w-0 rounded-lg border border-dashed border-stone-200/80 dark:border-zinc-800/80 p-3 bg-stone-50/30 dark:bg-zinc-900/20',
      }),
      0,
    ];
  },
});

export const ColumnLayout = Node.create({
  name: 'columnLayout',
  group: 'block',
  content: 'columnItem+',
  defining: true,

  addAttributes() {
    return {
      columns: { default: 2 },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="column-layout"]',
        getAttrs: (el) => {
          if (typeof el === 'string') return {};
          return { columns: Number(el.getAttribute('data-columns') || 2) };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const cols = Number(HTMLAttributes.columns || 2);
    const gridCls =
      cols === 3
        ? 'grid grid-cols-1 md:grid-cols-3 gap-3 my-3'
        : 'grid grid-cols-1 md:grid-cols-2 gap-3 my-3';
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'column-layout',
        'data-columns': String(cols),
        class: gridCls,
      }),
      0,
    ];
  },
});
