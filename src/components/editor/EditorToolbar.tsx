import React, { useRef, useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Heading,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Table as TableIcon,
  Rows,
  Columns,
  Trash2,
  Plus,
  Sigma,
  Workflow,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Undo2,
  Redo2,
  Search,
  FileText,
  LayoutTemplate,
  History,
  ListTree,
  Upload,
  ChevronDown,
  FileSpreadsheet,
  MoreHorizontal,
} from 'lucide-react';
import { pdfStorageService } from '../../services/pdfStorageService';
import { spreadsheetService } from '../../services/spreadsheet/spreadsheetService';

interface EditorToolbarProps {
  editor: Editor | null;
  onToggleFindReplace: () => void;
  showFindReplace: boolean;
  onOpenTemplates?: () => void;
  onOpenHistory?: () => void;
  onOpenImport?: () => void;
  onToggleToc?: () => void;
  showToc?: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  onToggleFindReplace,
  showFindReplace,
  onOpenTemplates,
  onOpenHistory,
  onOpenImport,
  onToggleToc,
  showToc = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const sheetInputRef = useRef<HTMLInputElement>(null);

  const [isHeadingsOpen, setIsHeadingsOpen] = useState(false);
  const [isTableMenuOpen, setIsTableMenuOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isHighlightOpen, setIsHighlightOpen] = useState(false);
  const [activeHighlightColor, setActiveHighlightColor] = useState('#fef08a');

  const headingsRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (headingsRef.current && !headingsRef.current.contains(e.target as Node)) {
        setIsHeadingsOpen(false);
      }
      if (tableRef.current && !tableRef.current.contains(e.target as Node)) {
        setIsTableMenuOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setIsMoreOpen(false);
      }
      if (highlightRef.current && !highlightRef.current.contains(e.target as Node)) {
        setIsHighlightOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL or note link:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: cleanUrl }).run();
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          editor.chain().focus().setImage({ src: reader.result }).run();
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePdfFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const att = await pdfStorageService.savePdfFile(file);
        editor.chain().focus().insertContent({
          type: 'pdfAttachment',
          attrs: {
            attachmentId: att.id,
            name: att.name,
            size: att.size,
            dataUrl: '',
            displayMode: 'compact',
          },
        }).run();
      } catch (err) {
        console.error('Failed to attach PDF:', err);
      }
    }
    if (pdfInputRef.current) pdfInputRef.current.value = '';
  };

  const handleSpreadsheetFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        let created;
        if (file.name.toLowerCase().endsWith('.csv')) {
          const text = await file.text();
          created = await spreadsheetService.createFromCsv(nameWithoutExt, text, 'Data Science');
        } else {
          const buffer = await file.arrayBuffer();
          created = await spreadsheetService.createFromXlsx(nameWithoutExt, buffer, 'Data Science');
        }
        editor.chain().focus().insertContent({
          type: 'spreadsheetNode',
          attrs: {
            spreadsheetId: created.id,
            title: created.title,
            displayMode: 'compact',
          },
        }).run();
      } catch (err) {
        console.error('Failed to attach spreadsheet:', err);
      }
    }
    if (sheetInputRef.current) sheetInputRef.current.value = '';
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded-md transition ${
      active
        ? 'bg-stone-200 dark:bg-zinc-800 text-stone-900 dark:text-stone-100 font-bold'
        : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900'
    }`;

  const getHeadingLabel = () => {
    if (editor.isActive('heading', { level: 1 })) return 'H1';
    if (editor.isActive('heading', { level: 2 })) return 'H2';
    if (editor.isActive('heading', { level: 3 })) return 'H3';
    if (editor.isActive('heading', { level: 4 })) return 'H4';
    return 'Normal';
  };

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md select-none text-xs flex-wrap gap-1">
      {/* Hidden file inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFile} />
      <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={handlePdfFile} />
      <input ref={sheetInputRef} type="file" accept=".csv,.xlsx" className="hidden" onChange={handleSpreadsheetFile} />

      {/* Main Tools Container: Single Row, Logical Groups */}
      <div className="flex items-center gap-0.5 flex-wrap">
        {/* GROUP 1: HISTORY (Undo / Redo) */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={btnClass(false) + ' disabled:opacity-30 disabled:hover:bg-transparent'}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={btnClass(false) + ' disabled:opacity-30 disabled:hover:bg-transparent'}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-stone-200 dark:bg-zinc-800 mx-1" />

        {/* GROUP 2: HEADINGS DROPDOWN */}
        <div className="relative" ref={headingsRef}>
          <button
            type="button"
            onClick={() => setIsHeadingsOpen(!isHeadingsOpen)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold hover:bg-stone-100 dark:hover:bg-zinc-850 rounded-md transition text-stone-700 dark:text-zinc-300"
            title="Heading Level"
          >
            <span>{getHeadingLabel()}</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>

          {isHeadingsOpen && (
            <div className="absolute left-0 mt-1 w-36 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1 z-40 text-xs">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setIsHeadingsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 ${editor.isActive('paragraph') ? 'font-bold text-blue-600' : ''}`}
              >
                Normal Text
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setIsHeadingsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-bold text-sm ${editor.isActive('heading', { level: 1 }) ? 'text-blue-600' : ''}`}
              >
                Heading 1
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setIsHeadingsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-semibold text-xs ${editor.isActive('heading', { level: 2 }) ? 'text-blue-600' : ''}`}
              >
                Heading 2
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setIsHeadingsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-medium text-xs ${editor.isActive('heading', { level: 3 }) ? 'text-blue-600' : ''}`}
              >
                Heading 3
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 4 }).run();
                  setIsHeadingsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-[11px] ${editor.isActive('heading', { level: 4 }) ? 'text-blue-600' : ''}`}
              >
                Heading 4
              </button>
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-stone-200 dark:bg-zinc-800 mx-1" />

        {/* GROUP 3: TEXT FORMATTING */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btnClass(editor.isActive('bold'))}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btnClass(editor.isActive('italic'))}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={btnClass(editor.isActive('underline'))}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btnClass(editor.isActive('strike'))}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={btnClass(editor.isActive('code'))}
          title="Inline Code"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
        {/* Multi-Color Highlighter */}
        <div className="relative inline-flex items-center" ref={highlightRef}>
          <button
            type="button"
            onClick={() => {
              if (editor.isActive('highlight')) {
                editor.chain().focus().unsetHighlight().run();
              } else {
                editor.chain().focus().setHighlight({ color: activeHighlightColor }).run();
              }
            }}
            className={`p-1.5 rounded-l text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-zinc-800 transition ${
              editor.isActive('highlight') ? 'bg-amber-100/70 dark:bg-amber-950/40 font-bold' : ''
            }`}
            title="Highlight Text (Toggle)"
          >
            <Highlighter className="w-3.5 h-3.5" style={{ color: activeHighlightColor }} />
          </button>
          <button
            type="button"
            onClick={() => setIsHighlightOpen(!isHighlightOpen)}
            className="p-1 rounded-r hover:bg-stone-200/60 dark:hover:bg-zinc-800 text-stone-400 hover:text-stone-700 transition"
            title="Choose Highlighter Color"
          >
            <ChevronDown className="w-2.5 h-2.5" />
          </button>

          {isHighlightOpen && (
            <div className="absolute left-0 top-full mt-1 w-44 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <span className="text-[10px] uppercase font-semibold text-stone-400 px-1 mb-1 block">
                Highlighter Colors
              </span>
              <div className="grid grid-cols-6 gap-1 mb-2">
                {[
                  { name: 'Yellow', hex: '#fef08a' },
                  { name: 'Green', hex: '#bbf7d0' },
                  { name: 'Blue', hex: '#bfdbfe' },
                  { name: 'Purple', hex: '#e9d5ff' },
                  { name: 'Pink', hex: '#fbcfe8' },
                  { name: 'Orange', hex: '#fed7aa' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => {
                      setActiveHighlightColor(c.hex);
                      editor.chain().focus().setHighlight({ color: c.hex }).run();
                      setIsHighlightOpen(false);
                    }}
                    style={{ backgroundColor: c.hex }}
                    className="w-5 h-5 rounded-full border border-stone-300 dark:border-zinc-700 hover:scale-110 transition shadow-2xs"
                    title={c.name}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().unsetHighlight().run();
                  setIsHighlightOpen(false);
                }}
                className="w-full text-center py-1 text-[11px] text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded transition font-medium"
              >
                Clear Highlight
              </button>
            </div>
          )}
        </div>

        <div className="w-[1px] h-4 bg-stone-200 dark:bg-zinc-800 mx-1" />

        {/* GROUP 4: LISTS & CHECKLIST */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={btnClass(editor.isActive('taskList'))}
          title="Task Checklist"
        >
          <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-stone-200 dark:bg-zinc-800 mx-1" />

        {/* GROUP 5: STRUCTURE (Table & Quote & Rule) */}
        <div className="relative" ref={tableRef}>
          <button
            type="button"
            onClick={() => setIsTableMenuOpen(!isTableMenuOpen)}
            className={btnClass(editor.isActive('table'))}
            title="Table Tools"
          >
            <TableIcon className="w-3.5 h-3.5" />
          </button>

          {isTableMenuOpen && (
            <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1 z-40 text-xs">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                  setIsTableMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Insert 3x3 Table</span>
              </button>
              {editor.isActive('table') && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().addRowAfter().run();
                      setIsTableMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Rows className="w-3.5 h-3.5" />
                    <span>Add Row Below</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().addColumnAfter().run();
                      setIsTableMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Columns className="w-3.5 h-3.5" />
                    <span>Add Column After</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().deleteTable().run();
                      setIsTableMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Table</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btnClass(false)}
          title="Horizontal Rule"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-stone-200 dark:bg-zinc-800 mx-1" />

        {/* GROUP 6: CODE, MATH & MERMAID */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={btnClass(editor.isActive('codeBlock'))}
          title="Code Block"
        >
          <Code className="w-3.5 h-3.5 text-stone-700 dark:text-zinc-300 font-bold" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertContent('<div data-type="math-block" data-latex="E = mc^2"></div>').run()}
          className={btnClass(false)}
          title="Insert Math Equation ($$)"
        >
          <Sigma className="w-3.5 h-3.5 text-purple-600" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().insertContent('<div data-type="mermaid-block" data-code="graph TD\\n  A[Start] --> B[Next]\\n  B --> C[End]"></div>').run()}
          className={btnClass(false)}
          title="Insert Mermaid Diagram"
        >
          <Workflow className="w-3.5 h-3.5 text-emerald-600" />
        </button>

        <div className="w-[1px] h-4 bg-stone-200 dark:bg-zinc-800 mx-1" />

        {/* GROUP 7: INSERTS (Link, Image) */}
        <button
          type="button"
          onClick={setLink}
          className={btnClass(editor.isActive('link'))}
          title="Insert Link (Ctrl+K)"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={btnClass(false)}
          title="Upload Image"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>

        {/* GROUP 8: ATTACHMENTS (PDF, Spreadsheet) */}
        <button
          type="button"
          onClick={() => pdfInputRef.current?.click()}
          className={btnClass(false)}
          title="Attach PDF Document"
        >
          <FileText className="w-3.5 h-3.5 text-red-500" />
        </button>
        <button
          type="button"
          onClick={() => sheetInputRef.current?.click()}
          className={btnClass(false)}
          title="Attach / Embed CSV or XLSX Spreadsheet"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
        </button>
      </div>

      {/* Right Side: Find/Replace, Outline Toggle & More Tools Menu */}
      <div className="flex items-center gap-1">
        {/* Find & Replace */}
        <button
          type="button"
          onClick={onToggleFindReplace}
          className={btnClass(showFindReplace)}
          title="Find and Replace (Ctrl+F)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>

        {/* Outline Toggle */}
        {onToggleToc && (
          <button
            type="button"
            onClick={onToggleToc}
            className={btnClass(showToc)}
            title="Toggle Outline / Table of Contents"
          >
            <ListTree className="w-3.5 h-3.5 text-blue-600" />
          </button>
        )}

        {/* MORE DROPDOWN MENU */}
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
            title="More Options"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>

          {isMoreOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-40 text-xs">
              {onOpenTemplates && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenTemplates();
                    setIsMoreOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-amber-500" />
                  <span>Choose Template</span>
                </button>
              )}
              {onOpenHistory && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenHistory();
                    setIsMoreOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <History className="w-3.5 h-3.5 text-blue-500" />
                  <span>Version History</span>
                </button>
              )}
              {onOpenImport && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenImport();
                    setIsMoreOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Smart Import Document</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
