import React, { useEffect, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Info,
  ChevronRight,
  Code,
  Sigma,
  Workflow,
  Table as TableIcon,
  Database,
  Link2,
  Quote,
  Minus,
  ListTree,
  Columns,
  FilePlus,
} from 'lucide-react';

interface SlashCommandMenuProps {
  editor: Editor;
  isOpen: boolean;
  position: { top: number; left: number };
  query: string;
  onClose: () => void;
  onCreateDatabase?: () => void;
  onCreateSubPageInline?: () => void;
}

interface SlashItem {
  id: string;
  label: string;
  desc: string;
  keywords: string;
  Icon: React.FC<{ className?: string }>;
  action: () => void;
}

export const SlashCommandMenu: React.FC<SlashCommandMenuProps> = ({
  editor,
  isOpen,
  position,
  query,
  onClose,
  onCreateDatabase,
  onCreateSubPageInline,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const removeSlashQuery = () => {
    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(Math.max(0, from - 30), from, '\n');
    const slashIdx = textBefore.lastIndexOf('/');
    if (slashIdx !== -1) {
      const deleteFrom = from - (textBefore.length - slashIdx);
      editor.chain().focus().deleteRange({ from: deleteFrom, to: from }).run();
    }
  };

  const items: SlashItem[] = [
    {
      id: 'h1',
      label: 'Heading 1',
      desc: 'Large section heading',
      keywords: 'h1 title heading',
      Icon: Heading1,
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      id: 'h2',
      label: 'Heading 2',
      desc: 'Medium section heading',
      keywords: 'h2 subtitle heading',
      Icon: Heading2,
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      id: 'h3',
      label: 'Heading 3',
      desc: 'Small section heading',
      keywords: 'h3 heading',
      Icon: Heading3,
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    {
      id: 'callout',
      label: 'Callout Box',
      desc: 'Highlighted info, tip or warning box',
      keywords: 'callout info tip alert note',
      Icon: Info,
      action: () =>
        editor.chain().focus().insertContent('<div data-type="callout-block" data-variant="info" data-text=""></div>').run(),
    },
    {
      id: 'toggle',
      label: 'Toggle List',
      desc: 'Collapsible section for details',
      keywords: 'toggle collapse accordion',
      Icon: ChevronRight,
      action: () =>
        editor.chain().focus().insertContent('<div data-type="toggle-block" data-title="" data-body="" data-open="true"></div>').run(),
    },
    {
      id: 'todo',
      label: 'To-Do Checklist',
      desc: 'Track tasks with checkboxes',
      keywords: 'todo task checkbox',
      Icon: CheckSquare,
      action: () => editor.chain().focus().toggleTaskList().run(),
    },
    {
      id: 'bullet',
      label: 'Bullet List',
      desc: 'Simple bulleted list',
      keywords: 'ul bullet list',
      Icon: List,
      action: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      id: 'ordered',
      label: 'Numbered List',
      desc: 'Ordered list with numbers',
      keywords: 'ol numbered list',
      Icon: ListOrdered,
      action: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      id: 'table',
      label: 'Table',
      desc: 'Insert a 3x3 editable table',
      keywords: 'table grid',
      Icon: TableIcon,
      action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },
    {
      id: 'database',
      label: 'Inline Database',
      desc: 'Create & embed a structured database',
      keywords: 'database db table board',
      Icon: Database,
      action: () => onCreateDatabase && onCreateDatabase(),
    },
    {
      id: 'code',
      label: 'Code Block',
      desc: 'Syntax-highlighted code snippet',
      keywords: 'code pre snippet',
      Icon: Code,
      action: () => editor.chain().focus().toggleCodeBlock().run(),
    },
    {
      id: 'math',
      label: 'Math Equation',
      desc: 'LaTeX formula block',
      keywords: 'math latex equation katex',
      Icon: Sigma,
      action: () => editor.chain().focus().insertContent('<div data-type="math-block" data-latex="E = mc^2"></div>').run(),
    },
    {
      id: 'mermaid',
      label: 'Mermaid Diagram',
      desc: 'Flowchart or sequence diagram',
      keywords: 'mermaid diagram chart',
      Icon: Workflow,
      action: () =>
        editor.chain().focus().insertContent('<div data-type="mermaid-block" data-code="graph TD\n  A[Start] --> B[End]"></div>').run(),
    },
    {
      id: 'link',
      label: 'Link / Embed Card',
      desc: 'Insert a web link card (Card / Embed / Mention)',
      keywords: 'link url embed mention bookmark',
      Icon: Link2,
      action: () => {
        const url = window.prompt('Enter URL (https://...):');
        if (!url) return;
        const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
        try {
          const parsed = new URL(cleanUrl);
          editor.chain().focus().insertContent({
            type: 'linkCard',
            attrs: {
              url: cleanUrl,
              title: `${parsed.hostname}${parsed.pathname.length > 1 ? parsed.pathname : ''}`,
              hostname: parsed.hostname,
              displayMode: 'compact',
            },
          }).run();
        } catch {
          editor.chain().focus().setLink({ href: cleanUrl }).run();
        }
      },
    },
    {
      id: 'quote',
      label: 'Blockquote',
      desc: 'Capture a quote or excerpt',
      keywords: 'quote blockquote',
      Icon: Quote,
      action: () => editor.chain().focus().toggleBlockquote().run(),
    },
    {
      id: 'divider',
      label: 'Divider',
      desc: 'Horizontal visual separator',
      keywords: 'hr divider line',
      Icon: Minus,
      action: () => editor.chain().focus().setHorizontalRule().run(),
    },
    {
      id: 'toc',
      label: 'Table of Contents',
      desc: 'Live clickable outline of headings in this note',
      keywords: 'toc table of contents outline headings',
      Icon: ListTree,
      action: () =>
        editor.chain().focus().insertContent('<div data-type="toc-block"></div>').run(),
    },
    {
      id: 'toggle-h1',
      label: 'Toggle Heading 1',
      desc: 'Collapsible large heading section',
      keywords: 'th1 toggle heading 1 collapse',
      Icon: ChevronRight,
      action: () =>
        editor.chain().focus().insertContent('<div data-type="toggle-heading" data-level="1" data-title="" data-body="" data-open="true"></div>').run(),
    },
    {
      id: 'toggle-h2',
      label: 'Toggle Heading 2',
      desc: 'Collapsible medium heading section',
      keywords: 'th2 toggle heading 2 collapse',
      Icon: ChevronRight,
      action: () =>
        editor.chain().focus().insertContent('<div data-type="toggle-heading" data-level="2" data-title="" data-body="" data-open="true"></div>').run(),
    },
    {
      id: 'sub-page',
      label: 'Sub-Page',
      desc: 'Create and embed a nested child page',
      keywords: 'page subpage child nested',
      Icon: FilePlus,
      action: () => {
        if (onCreateSubPageInline) {
          onCreateSubPageInline();
        }
      },
    },
    {
      id: '2col',
      label: '2 Columns',
      desc: 'Side-by-side 2-column layout',
      keywords: '2col columns layout grid',
      Icon: Columns,
      action: () =>
        editor
          .chain()
          .focus()
          .insertContent(
            '<div data-type="column-layout" data-columns="2"><div data-type="column-item"><p>Column 1</p></div><div data-type="column-item"><p>Column 2</p></div></div>'
          )
          .run(),
    },
    {
      id: '3col',
      label: '3 Columns',
      desc: 'Side-by-side 3-column layout',
      keywords: '3col columns layout grid',
      Icon: Columns,
      action: () =>
        editor
          .chain()
          .focus()
          .insertContent(
            '<div data-type="column-layout" data-columns="3"><div data-type="column-item"><p>Column 1</p></div><div data-type="column-item"><p>Column 2</p></div><div data-type="column-item"><p>Column 3</p></div></div>'
          )
          .run(),
    },
  ];

  const q = query.trim().toLowerCase();
  const filtered = q
    ? items.filter(
        (i) =>
          i.label.toLowerCase().includes(q) ||
          i.keywords.toLowerCase().includes(q) ||
          i.desc.toLowerCase().includes(q)
      )
    : items;

  useEffect(() => {
    setSelectedIndex(0);
  }, [query, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + Math.max(1, filtered.length)) % Math.max(1, filtered.length));
      } else if (e.key === 'Enter' && filtered[selectedIndex]) {
        e.preventDefault();
        removeSlashQuery();
        filtered[selectedIndex].action();
        onClose();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [isOpen, filtered, selectedIndex]);

  if (!isOpen || filtered.length === 0) return null;

  return (
    <div
      style={{ top: position.top, left: position.left }}
      className="fixed z-50 w-68 max-h-72 overflow-y-auto bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float p-1.5 text-xs animate-in fade-in duration-100"
    >
      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-stone-400">
        Insert Block
      </div>
      {filtered.map((item, idx) => {
        const Icon = item.Icon;
        return (
          <button
            key={item.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              removeSlashQuery();
              item.action();
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left transition ${
              idx === selectedIndex
                ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                : 'hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200'
            }`}
          >
            <div className="w-7 h-7 rounded-md bg-stone-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{item.label}</div>
              <div className="text-[10px] text-stone-400 truncate">{item.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
};
