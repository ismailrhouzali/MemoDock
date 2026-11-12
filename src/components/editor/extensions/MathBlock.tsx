import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { Edit3, Check, Trash2, Sigma } from 'lucide-react';

const MathComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const [isEditing, setIsEditing] = useState(!node.attrs.latex);
  const [latexInput, setLatexInput] = useState<string>(node.attrs.latex || '');
  const [renderedHtml, setRenderedHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const html = katex.renderToString(latexInput || '\\text{Click to edit formula}', {
        throwOnError: false,
        displayMode: true,
      });
      setRenderedHtml(html);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Invalid LaTeX syntax');
    }
  }, [latexInput]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    updateAttributes({ latex: latexInput });
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setLatexInput(node.attrs.latex);
    }
  };

  return (
    <NodeViewWrapper className="my-3 select-none">
      <div className="relative group border border-stone-200/80 dark:border-zinc-800 rounded-lg p-3 bg-stone-50/60 dark:bg-zinc-900/50 transition-all hover:border-stone-300 dark:hover:border-zinc-700">
        <div className="flex items-center justify-between mb-1 pb-1 border-b border-stone-200/50 dark:border-zinc-800 text-xs text-stone-400 dark:text-zinc-500 font-mono">
          <span className="flex items-center gap-1.5">
            <Sigma className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
            LaTeX Math Formula
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded"
              title={isEditing ? 'Preview' : 'Edit LaTeX'}
            >
              {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
              title="Delete Equation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={latexInput}
                onChange={(e) => setLatexInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. \\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}"
                className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 dark:text-stone-100"
              />
              <button
                type="button"
                onClick={handleSave}
                className="px-2.5 py-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white rounded transition"
              >
                Apply
              </button>
            </div>
            {error && <p className="text-xs text-red-500 font-mono">{error}</p>}
            <div className="p-2 bg-white/60 dark:bg-zinc-950/60 rounded border border-stone-200/40 dark:border-zinc-800/40 overflow-x-auto text-center">
              <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
            </div>
          </div>
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className="cursor-pointer py-2 overflow-x-auto text-center hover:opacity-90"
            title="Click to edit formula"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: 'E = mc^2',
        parseHTML: (element) => element.getAttribute('data-latex') || '',
        renderHTML: (attributes) => ({
          'data-type': 'math-block',
          'data-latex': attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="math-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathComponent);
  },
});
