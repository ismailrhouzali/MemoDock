import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { Info, AlertTriangle, Lightbulb, AlertCircle, Trash2 } from 'lucide-react';

type CalloutVariant = 'info' | 'tip' | 'warning' | 'danger';

const VARIANT_STYLES: Record<
  CalloutVariant,
  { bg: string; border: string; iconColor: string; label: string; Icon: React.FC<{ className?: string }> }
> = {
  info: {
    bg: 'bg-blue-50/70 dark:bg-blue-950/30',
    border: 'border-blue-200 dark:border-blue-800/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
    label: 'Info',
    Icon: Info,
  },
  tip: {
    bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
    border: 'border-emerald-200 dark:border-emerald-800/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    label: 'Tip',
    Icon: Lightbulb,
  },
  warning: {
    bg: 'bg-amber-50/70 dark:bg-amber-950/30',
    border: 'border-amber-200 dark:border-amber-800/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
    label: 'Warning',
    Icon: AlertTriangle,
  },
  danger: {
    bg: 'bg-red-50/70 dark:bg-red-950/30',
    border: 'border-red-200 dark:border-red-800/60',
    iconColor: 'text-red-600 dark:text-red-400',
    label: 'Alert',
    Icon: AlertCircle,
  },
};

const CalloutComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const variant = (node.attrs.variant as CalloutVariant) || 'info';
  const [text, setText] = useState<string>(node.attrs.text || '');
  const style = VARIANT_STYLES[variant] || VARIANT_STYLES.info;
  const Icon = style.Icon;

  return (
    <NodeViewWrapper className="my-3 select-none">
      <div className={`group relative flex items-start gap-3 p-3.5 rounded-xl border ${style.bg} ${style.border}`}>
        <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${style.iconColor}`} />
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            updateAttributes({ text: e.target.value });
          }}
          placeholder="Write a callout note..."
          rows={Math.max(1, text.split('\n').length)}
          className="flex-1 bg-transparent text-xs md:text-sm text-stone-800 dark:text-zinc-200 focus:outline-none resize-none leading-relaxed"
        />
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 flex-shrink-0">
          {(Object.keys(VARIANT_STYLES) as CalloutVariant[]).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => updateAttributes({ variant: v })}
              className={`px-1.5 py-0.5 text-[10px] rounded capitalize ${
                variant === v
                  ? 'bg-white dark:bg-zinc-800 font-semibold shadow-2xs'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              {v}
            </button>
          ))}
          <button
            type="button"
            onClick={deleteNode}
            className="p-1 text-stone-400 hover:text-red-500 rounded"
            title="Remove callout"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const CalloutBlock = Node.create({
  name: 'calloutBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      variant: { default: 'info' },
      text: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="callout-block"]',
        getAttrs: (el) => {
          if (typeof el === 'string') return {};
          return {
            variant: el.getAttribute('data-variant') || 'info',
            text: el.getAttribute('data-text') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'callout-block',
        'data-variant': HTMLAttributes.variant,
        'data-text': HTMLAttributes.text,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutComponent);
  },
});
