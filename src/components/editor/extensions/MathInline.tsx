import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState, useEffect, useRef } from 'react';
import katex from 'katex';
import { Sigma, Check, X, Edit2 } from 'lucide-react';

const MathInlineComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const [isEditing, setIsEditing] = useState(!node.attrs.latex);
  const [latexInput, setLatexInput] = useState<string>(node.attrs.latex || '');
  const [renderedHtml, setRenderedHtml] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const html = katex.renderToString(latexInput || '\\dots', {
        throwOnError: false,
        displayMode: false,
      });
      setRenderedHtml(html);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Invalid LaTeX');
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
    <NodeViewWrapper as="span" className="inline-flex items-center align-middle mx-1 select-none">
      {isEditing ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 dark:bg-zinc-800 border border-amber-300 dark:border-amber-700/60 rounded text-xs shadow-sm">
          <Sigma className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={latexInput}
            onChange={(e) => setLatexInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="LaTeX formula..."
            className="w-32 sm:w-48 px-1.5 py-0.5 text-xs font-mono bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-700 rounded text-stone-900 dark:text-stone-100 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleSave}
            className="p-0.5 text-emerald-600 hover:text-emerald-700"
            title="Save formula"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (!node.attrs.latex) deleteNode();
              else {
                setIsEditing(false);
                setLatexInput(node.attrs.latex);
              }
            }}
            className="p-0.5 text-stone-400 hover:text-stone-600"
            title="Cancel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded hover:bg-amber-100/50 dark:hover:bg-zinc-800 cursor-pointer transition border border-transparent hover:border-amber-300 dark:hover:border-zinc-700 group"
          title="Click to edit formula"
        >
          <span
            className="inline-block"
            dangerouslySetInnerHTML={{ __html: renderedHtml }}
          />
          <span className="opacity-0 group-hover:opacity-100 text-stone-400 dark:text-zinc-500 transition-opacity ml-0.5">
            <Edit2 className="w-2.5 h-2.5" />
          </span>
        </span>
      )}
    </NodeViewWrapper>
  );
};

export const MathInline = Node.create({
  name: 'mathInline',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      latex: {
        default: '',
        parseHTML: (element) => element.getAttribute('data-latex') || '',
        renderHTML: (attributes) => ({
          'data-type': 'math-inline',
          'data-latex': attributes.latex,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="math-inline"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-type': 'math-inline' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MathInlineComponent);
  },
});

