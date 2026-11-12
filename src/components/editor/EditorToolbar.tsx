import React, { useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
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
  ClipboardPaste,
  ChevronDown,
  Upload,
  Sparkles,
  Bookmark,
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { convertMarkdownToTipTapHtml } from '../../services/clipboardService';
import { normalizeContent } from '../../services/importEngine/contentNormalizer';
import { pdfStorageService } from '../../services/pdfStorageService';

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
  showToc,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [showPasteMenu, setShowPasteMenu] = useState(false);
  const [showMathMenu, setShowMathMenu] = useState(false);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL or note link (e.g. notebook://note/id):', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
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
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            dataUrl: '', // Stored as native Blob in IndexedDB, preventing note bloat
            displayMode: 'compact',
          },
        }).run();
      } catch (err) {
        console.error('Failed to attach PDF:', err);
      }
    }
    if (pdfInputRef.current) {
      pdfInputRef.current.value = '';
    }
  };

  const insertLinkCard = () => {
    const url = window.prompt('Enter Web URL to insert as Link Card:');
    if (!url) return;
    try {
      const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
      const parsed = new URL(cleanUrl);
      const hostname = parsed.hostname;
      const title = `${hostname}${parsed.pathname.length > 1 ? parsed.pathname : ''}`;
      editor.chain().focus().insertContent({
        type: 'linkCard',
        attrs: {
          url: cleanUrl,
          title,
          hostname,
          displayMode: 'compact',
        },
      }).run();
    } catch {
      alert('Please enter a valid URL.');
    }
  };

  const addMathEquation = (displayMode: 'block' | 'inline') => {
    if (displayMode === 'block') {
      editor.chain().focus().insertContent({
        type: 'mathBlock',
        attrs: { latex: 'E = mc^2' },
      }).run();
    } else {
      editor.chain().focus().insertContent({
        type: 'mathInline',
        attrs: { latex: '\\bar{Y}' },
      }).run();
    }
    setShowMathMenu(false);
  };

  const addMermaidDiagram = () => {
    editor.chain().focus().insertContent({
      type: 'mermaidBlock',
      attrs: {
        code: 'graph TD\n  Start[Start] --> Process[Step 1]\n  Process --> End[Finish]',
      },
    }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const insertEmoji = (emoji: string) => {
    editor.chain().focus().insertContent(emoji).run();
  };

  const handleExplicitPasteMarkdown = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const result = convertMarkdownToTipTapHtml(text);
        editor.chain().focus().insertContent(result.html).run();
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
    setShowPasteMenu(false);
  };

  const handleExplicitPastePlain = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        editor.chain().focus().insertContent(text).run();
      }
    } catch (err) {
      console.warn('Clipboard read error:', err);
    }
    setShowPasteMenu(false);
  };

  const handleCleanDocumentContent = () => {
    const rawHtml = editor.getHTML();
    const cleaned = normalizeContent(rawHtml);
    editor.commands.setContent(cleaned);
    setShowPasteMenu(false);
  };

  const btnClass = (active: boolean) =>
    `p-1.5 rounded transition ${
      active
        ? 'bg-stone-200/90 dark:bg-zinc-800 text-stone-900 dark:text-stone-100 font-semibold'
        : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800/60'
    }`;

  return (
    <div className="flex items-center flex-wrap gap-0.5 px-3 py-1.5 border-b border-stone-200/60 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm sticky top-0 z-20 text-xs">
      {/* Undo / Redo */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30 rounded transition"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 disabled:opacity-30 rounded transition"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3.5 w-px bg-stone-200 dark:bg-zinc-800 mx-1" />

      {/* Headings */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={btnClass(editor.isActive('heading', { level: 1 }))}
          title="Heading 1 (#)"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btnClass(editor.isActive('heading', { level: 2 }))}
          title="Heading 2 (##)"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={btnClass(editor.isActive('heading', { level: 3 }))}
          title="Heading 3 (###)"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3.5 w-px bg-stone-200 dark:bg-zinc-800 mx-1" />

      {/* Text Style */}
      <div className="flex items-center">
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
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={btnClass(editor.isActive('highlight'))}
          title="Highlight"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={btnClass(editor.isActive('code'))}
          title="Inline Code (`code`)"
        >
          <Code className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3.5 w-px bg-stone-200 dark:bg-zinc-800 mx-1" />

      {/* Lists */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btnClass(editor.isActive('bulletList'))}
          title="Bullet List (-)"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btnClass(editor.isActive('orderedList'))}
          title="Numbered List (1.)"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={btnClass(editor.isActive('taskList'))}
          title="Checklist / Task List ([ ])"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={btnClass(editor.isActive('blockquote'))}
          title="Blockquote (>)"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="h-3.5 w-px bg-stone-200 dark:bg-zinc-800 mx-1" />

      {/* Advanced Nodes: Tables, Math, Diagrams, Link, Image, PDF */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={insertTable}
          className={`p-1.5 rounded transition ${
            editor.isActive('table')
              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800'
          }`}
          title="Insert Table (3x3)"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </button>

        {/* In-toolbar Table controls when a table is active (prevents canvas jumps) */}
        {editor.isActive('table') && (
          <div className="flex items-center gap-0.5 px-1 py-0.5 mx-1 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded text-[11px]">
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowBefore().run()}
              className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 rounded transition"
              title="Add Row Above"
            >
              <span className="flex items-center text-[10px] font-medium">+Row↑</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addRowAfter().run()}
              className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 rounded transition"
              title="Add Row Below"
            >
              <span className="flex items-center text-[10px] font-medium">+Row↓</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteRow().run()}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded transition"
              title="Delete Row"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <div className="h-3 w-px bg-amber-200 dark:bg-amber-800/60 mx-0.5" />
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 rounded transition"
              title="Add Column Left"
            >
              <span className="flex items-center text-[10px] font-medium">+Col←</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              className="p-1 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 rounded transition"
              title="Add Column Right"
            >
              <span className="flex items-center text-[10px] font-medium">+Col→</span>
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteColumn().run()}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded transition"
              title="Delete Column"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <div className="h-3 w-px bg-amber-200 dark:bg-amber-800/60 mx-0.5" />
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleHeaderRow().run()}
              className="px-1 py-0.5 hover:bg-amber-200/50 dark:hover:bg-amber-900/40 text-[10px] rounded transition font-medium"
              title="Toggle Header Row"
            >
              Header
            </button>
            <button
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
              className="p-1 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded transition"
              title="Delete Table"
            >
              <span className="flex items-center text-[10px] font-medium text-red-600 dark:text-red-400">Del Table</span>
            </button>
          </div>
        )}

        {/* Math menu: Inline & Block */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowMathMenu(!showMathMenu)}
            className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition flex items-center"
            title="LaTeX Mathematics (Inline or Block)"
          >
            <Sigma className="w-3.5 h-3.5" />
            <ChevronDown className="w-2 h-2 ml-0.5 opacity-60" />
          </button>
          {showMathMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMathMenu(false)} />
              <div className="absolute left-0 mt-1 z-40 w-44 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg shadow-float py-1 text-xs">
                <button
                  type="button"
                  onClick={() => addMathEquation('inline')}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center justify-between"
                >
                  <span>Inline Formula</span>
                  <span className="text-[10px] text-stone-400 font-mono">\(x\)</span>
                </button>
                <button
                  type="button"
                  onClick={() => addMathEquation('block')}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center justify-between"
                >
                  <span>Block Equation</span>
                  <span className="text-[10px] text-stone-400 font-mono">\[E=mc^2\]</span>
                </button>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={addMermaidDiagram}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition"
          title="Insert Mermaid Diagram"
        >
          <Workflow className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={setLink}
          className={btnClass(editor.isActive('link'))}
          title="Add / Edit Hyperlink"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* Image upload */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition"
          title="Insert Image from Computer"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageFile}
        />

        {/* PDF upload */}
        <button
          type="button"
          onClick={() => pdfInputRef.current?.click()}
          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition flex items-center gap-0.5"
          title="Attach PDF Document (Lightweight Binary Blob)"
        >
          <FileText className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">PDF</span>
        </button>
        <input
          ref={pdfInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handlePdfFile}
        />

        <button
          type="button"
          onClick={insertLinkCard}
          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded transition flex items-center gap-0.5"
          title="Insert Web Link Card"
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span className="text-[10px] font-bold">Link</span>
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition"
          title="Horizontal Rule (---)"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <EmojiPicker onSelect={insertEmoji} />
      </div>

      <div className="h-3.5 w-px bg-stone-200 dark:bg-zinc-800 mx-1" />

      {/* Smart Import, Templates, Version History & Paste Options */}
      <div className="flex items-center gap-0.5">
        {onOpenImport && (
          <button
            type="button"
            onClick={onOpenImport}
            className="p-1.5 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded transition flex items-center gap-1 font-medium"
            title="Universal Smart Import (.md, .docx, .pdf, .html, .txt)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Import</span>
          </button>
        )}

        {onOpenTemplates && (
          <button
            type="button"
            onClick={onOpenTemplates}
            className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition flex items-center gap-1"
            title="Note Templates"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">Templates</span>
          </button>
        )}

        {onOpenHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition flex items-center gap-1"
            title="Version History"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">History</span>
          </button>
        )}

        {/* Smart Paste Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPasteMenu(!showPasteMenu)}
            className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition flex items-center"
            title="Paste Options"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <ChevronDown className="w-2.5 h-2.5 ml-0.5 opacity-60" />
          </button>

          {showPasteMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowPasteMenu(false)} />
              <div className="absolute left-0 mt-1 z-40 w-48 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg shadow-float py-1 text-xs">
                <button
                  type="button"
                  onClick={handleExplicitPasteMarkdown}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center justify-between"
                >
                  <span>Smart Paste (Formatted)</span>
                  <kbd className="text-[9px] bg-stone-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-stone-400">Ctrl+V</kbd>
                </button>
                <button
                  type="button"
                  onClick={handleExplicitPastePlain}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center justify-between"
                >
                  <span>Paste Plain Text</span>
                  <kbd className="text-[9px] bg-stone-100 dark:bg-zinc-800 px-1 py-0.5 rounded text-stone-400">Ctrl+Shift+V</kbd>
                </button>
                <div className="my-1 border-t border-stone-100 dark:border-zinc-800" />
                <button
                  type="button"
                  onClick={handleCleanDocumentContent}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-amber-700 dark:text-amber-400 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Clean & Normalize Content</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side: TOC toggle and Find/Replace */}
      <div className="ml-auto flex items-center gap-1">
        {onToggleToc && (
          <button
            type="button"
            onClick={onToggleToc}
            className={`p-1.5 rounded transition flex items-center gap-1 ${
              showToc
                ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800'
            }`}
            title="Toggle Outline / Table of Contents"
          >
            <ListTree className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Outline</span>
          </button>
        )}

        <button
          type="button"
          onClick={onToggleFindReplace}
          className={`p-1.5 rounded transition ${
            showFindReplace
              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800'
          }`}
          title="Find & Replace (Ctrl+F)"
        >
          <Search className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
