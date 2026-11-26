import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { Sparkles, ExternalLink, Copy, Check, Trash2, Code2, Eye } from 'lucide-react';

const HtmlLiteComponent: React.FC<NodeViewProps> = ({ node, deleteNode }) => {
  const { html = '', sourceUrl = '', sourceTitle = 'ChatGPT Response' } = node.attrs;
  const [showSource, setShowSource] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyHtml = async () => {
    await navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <NodeViewWrapper className="my-3 select-text">
      <div className="border border-stone-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/60 shadow-2xs">
        {/* Subtle Header Bar */}
        <div className="no-print flex items-center justify-between px-3 py-1.5 bg-stone-50/80 dark:bg-zinc-950/50 border-b border-stone-200/60 dark:border-zinc-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-zinc-300 font-medium truncate">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">{sourceTitle || 'Captured Rich HTML'}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setShowSource(!showSource)}
              className="px-1.5 py-0.5 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-800 text-stone-500 flex items-center gap-1"
              title={showSource ? 'Show Rendered View' : 'View HTML Lite Source'}
            >
              {showSource ? <Eye className="w-3 h-3" /> : <Code2 className="w-3 h-3" />}
              <span>{showSource ? 'View' : 'HTML'}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyHtml}
              className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-800 text-stone-500"
              title="Copy HTML Lite"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            </button>
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-800 text-stone-500"
                title="Open original chat"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/30 text-stone-400 hover:text-red-500"
              title="Remove block"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Body */}
        {showSource ? (
          <pre className="p-3 text-[11px] font-mono overflow-x-auto max-h-96 bg-stone-50 dark:bg-zinc-950 text-stone-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
            {html}
          </pre>
        ) : (
          <div
            className="p-4 md:p-5 memodock-html-lite text-sm leading-relaxed text-stone-800 dark:text-stone-200 overflow-x-auto"
            onClick={(e) => {
              const link = (e.target as HTMLElement)?.closest('a');
              if (link && link.href) {
                e.preventDefault();
                window.open(link.href, '_blank', 'noopener,noreferrer');
              }
            }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const HtmlLiteBlock = Node.create({
  name: 'htmlLiteBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      html: { default: '' },
      sourceUrl: { default: '' },
      sourceTitle: { default: 'ChatGPT Response' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="html-lite-block"]',
        getAttrs: (el) => {
          if (typeof el === 'string') return {};
          return {
            html: el.getAttribute('data-html') || el.innerHTML || '',
            sourceUrl: el.getAttribute('data-source-url') || '',
            sourceTitle: el.getAttribute('data-source-title') || 'ChatGPT Response',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'html-lite-block',
        'data-html': HTMLAttributes.html,
        'data-source-url': HTMLAttributes.sourceUrl,
        'data-source-title': HTMLAttributes.sourceTitle,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HtmlLiteComponent);
  },
});
