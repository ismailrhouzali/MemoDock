import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { Zap, Settings2, Trash2, Check } from 'lucide-react';
import { resolveTemplateVariables } from '../../../utils/templateVariables';

const ActionButtonComponent: React.FC<NodeViewProps> = ({
  node,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}) => {
  const {
    label = 'Add Daily Check-in',
    actionType = 'insert_snippet',
    snippet = '<p><strong>{{date}}</strong> — </p><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Next action</p></li></ul>',
  } = node.attrs;

  const [isEditing, setIsEditing] = useState(false);
  const [ran, setRan] = useState(false);

  const handleRun = () => {
    if (!editor) return;
    const resolved = resolveTemplateVariables(snippet, label);
    const pos = typeof getPos === 'function' ? getPos() + node.nodeSize : editor.state.selection.to;
    if (actionType === 'insert_snippet') {
      editor.chain().focus().insertContentAt(pos, resolved).run();
    }
    setRan(true);
    setTimeout(() => setRan(false), 1200);
  };

  return (
    <NodeViewWrapper className="my-2.5 select-none">
      <div className="inline-flex flex-col gap-2">
        <div className="group inline-flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRun}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
          >
            {ran ? <Check className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            <span>{ran ? 'Done!' : label}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="no-print opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-stone-200 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-700 transition"
            title="Configure button"
          >
            <Settings2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={deleteNode}
            className="no-print opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-red-500 transition"
            title="Delete button"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {isEditing && (
          <div className="no-print p-3 rounded-xl border border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900/80 text-xs space-y-2 w-80">
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">Button Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => updateAttributes({ label: e.target.value })}
                className="w-full px-2 py-1 rounded border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-stone-400 uppercase mb-1">
                HTML / Text Snippet (supports {'{{date}}'}, {'{{time}}'})
              </label>
              <textarea
                value={snippet}
                onChange={(e) => updateAttributes({ snippet: e.target.value })}
                rows={3}
                className="w-full px-2 py-1 rounded border border-stone-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-[11px] font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ActionButtonBlock = Node.create({
  name: 'actionButtonBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      label: { default: 'Add Daily Check-in' },
      actionType: { default: 'insert_snippet' },
      snippet: {
        default:
          '<p><strong>{{date}}</strong> — </p><ul data-type="taskList"><li data-type="taskItem" data-checked="false"><p>Next action</p></li></ul>',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="action-button-block"]',
        getAttrs: (el) => {
          if (typeof el === 'string') return {};
          return {
            label: el.getAttribute('data-label') || 'Add Daily Check-in',
            actionType: el.getAttribute('data-action-type') || 'insert_snippet',
            snippet: el.getAttribute('data-snippet') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'action-button-block',
        'data-label': HTMLAttributes.label,
        'data-action-type': HTMLAttributes.actionType,
        'data-snippet': HTMLAttributes.snippet,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ActionButtonComponent);
  },
});
