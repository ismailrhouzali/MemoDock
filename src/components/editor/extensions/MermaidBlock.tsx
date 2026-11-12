import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState, useEffect, useRef } from 'react';
import mermaid from 'mermaid';
import { Edit3, Check, Trash2, Workflow, Code, Eye } from 'lucide-react';

// Initialize mermaid once with clean modern theme
mermaid.initialize({
  startOnLoad: false,
  theme: 'neutral',
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
});

const SAMPLE_TEMPLATES: { label: string; code: string }[] = [
  {
    label: 'Flowchart',
    code: 'graph TD\n  Start([Start]) --> Process[Analyze Problem]\n  Process --> Decision{Resolved?}\n  Decision -->|Yes| Finish([Done])\n  Decision -->|No| Iterate[Refine Approach]\n  Iterate --> Process',
  },
  {
    label: 'Sequence',
    code: 'sequenceDiagram\n  autonumber\n  Client->>Server: HTTP GET /notes\n  Server->>Database: Query IndexedDB\n  Database-->>Server: Return notes array\n  Server-->>Client: 200 OK (Local-first)',
  },
  {
    label: 'Mindmap',
    code: 'graph LR\n  Core[Minimalist NoteBook] --> Simplicity[Clean UI & Typography]\n  Core --> Privacy[Local-first IndexedDB]\n  Core --> Power[LaTeX, Mermaid, Tables]\n  Core --> Export[PDF, MD, HTML, JSON]',
  },
];

const MermaidComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const [isEditing, setIsEditing] = useState(!node.attrs.code);
  const [code, setCode] = useState<string>(
    node.attrs.code ||
      'graph TD\n  A[Idea] --> B(Write)\n  B --> C{Review}\n  C -->|Done| D[Save Note]'
  );
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const uniqueId = useRef(`mermaid-${Math.random().toString(36).substring(2, 9)}`);

  useEffect(() => {
    let isCancelled = false;

    async function renderDiagram() {
      if (!code.trim()) {
        setSvgContent('');
        setError('Diagram code cannot be empty');
        return;
      }
      try {
        const renderId = `${uniqueId.current}-${Date.now()}`;
        const { svg } = await mermaid.render(renderId, code.trim());
        if (!isCancelled) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          setError(err?.message || 'Mermaid syntax error');
        }
      }
    }

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [code]);

  const handleSave = () => {
    updateAttributes({ code });
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper className="my-4 select-none">
      <div className="relative group border border-stone-200/80 dark:border-zinc-800 rounded-lg p-3 bg-stone-50/60 dark:bg-zinc-900/50 transition-all hover:border-stone-300 dark:hover:border-zinc-700">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-stone-200/50 dark:border-zinc-800 text-xs text-stone-400 dark:text-zinc-500 font-mono">
          <span className="flex items-center gap-1.5">
            <Workflow className="w-3.5 h-3.5 text-blue-600 dark:text-blue-500" />
            Mermaid Diagram
          </span>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => setIsEditing(!isEditing)}
              className="p-1 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded flex items-center gap-1 text-xs"
              title={isEditing ? 'Preview Diagram' : 'Edit Diagram Code'}
            >
              {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
              <span>{isEditing ? 'Preview' : 'Code'}</span>
            </button>
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded"
              title="Delete Diagram"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-stone-400 dark:text-zinc-500">Presets:</span>
              {SAMPLE_TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.label}
                  type="button"
                  onClick={() => setCode(tmpl.code)}
                  className="px-2 py-0.5 rounded bg-stone-200/60 dark:bg-zinc-800 text-stone-700 dark:text-zinc-300 hover:bg-stone-300 dark:hover:bg-zinc-700 transition"
                >
                  {tmpl.label}
                </button>
              ))}
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={6}
              className="w-full p-2.5 font-mono text-xs bg-white dark:bg-zinc-950 border border-stone-300 dark:border-zinc-700 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-stone-900 dark:text-stone-100"
              placeholder="graph TD\n  A --> B"
            />

            {error && (
              <p className="text-xs text-red-500 font-mono bg-red-50 dark:bg-red-950/20 p-1.5 rounded">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Done
              </button>
            </div>
          </div>
        ) : (
          <div
            ref={containerRef}
            onClick={() => setIsEditing(true)}
            className="cursor-pointer py-3 px-2 flex justify-center items-center overflow-x-auto hover:opacity-90 min-h-[100px]"
            title="Click to edit diagram"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const MermaidBlock = Node.create({
  name: 'mermaidBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      code: {
        default: 'graph TD\n  A[Idea] --> B(Write)\n  B --> C[Done]',
        parseHTML: (element) => element.getAttribute('data-code') || '',
        renderHTML: (attributes) => ({
          'data-type': 'mermaid-block',
          'data-code': attributes.code,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="mermaid-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MermaidComponent);
  },
});
