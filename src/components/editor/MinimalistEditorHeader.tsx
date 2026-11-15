import React, { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  Highlighter,
  Heading,
  CheckSquare,
  List,
  ListOrdered,
  Type,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  ChevronRight,
  Calendar,
  Minus,
  Code,
  Sigma,
  Workflow,
  FileText,
  Printer,
  Download,
  Trash2,
  Moon,
  Sun,
  Settings as SettingsIcon,
  HelpCircle,
  MessageSquareHeart,
  ExternalLink,
  Laptop,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';
import { Note, ThemeMode } from '../../db/types';
import { exportService } from '../../services/exportService';

export const FEEDBACK_FORM_URL = 'https://forms.gle/notebook-feedback-placeholder';

interface MinimalistEditorHeaderProps {
  editor: Editor | null;
  note: Note;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onDeleteNote?: () => void;
  theme?: ThemeMode;
  onCycleTheme?: () => void;
  onOpenSettings?: () => void;
  focusMode: boolean;
  onToggleFocusMode?: () => void;
}

export const MinimalistEditorHeader: React.FC<MinimalistEditorHeaderProps> = ({
  editor,
  note,
  isSidebarOpen,
  onToggleSidebar,
  onDeleteNote,
  theme = 'light',
  onCycleTheme,
  onOpenSettings,
  focusMode,
  onToggleFocusMode,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isHeadingsOpen, setIsHeadingsOpen] = useState(false);
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setActiveSubmenu(null);
        setIsHeadingsOpen(false);
        setIsFontSizeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!editor) return null;

  // Insert date at cursor
  const insertDate = () => {
    const formatted = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    editor.chain().focus().insertContent(` ${formatted} `).run();
    setIsMenuOpen(false);
  };

  // Set Link
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter URL:', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    const cleanUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href: cleanUrl }).run();
    setIsMenuOpen(false);
  };

  // Zoom control
  const applyZoom = (level: number) => {
    const clamped = Math.max(50, Math.min(200, level));
    setZoomLevel(clamped);
    const canvas = document.querySelector('.tiptap.ProseMirror') as HTMLElement;
    if (canvas) {
      // Native zoom in Blink engines (Chrome/Edge extensions) scales text, tables, and images crisply
      (canvas.style as any).zoom = clamped === 100 ? '1' : `${clamped / 100}`;
      canvas.style.transform = 'none';
    }
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    applyZoom(zoomLevel + 10);
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    applyZoom(zoomLevel - 10);
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    applyZoom(100);
  };

  // Downloads
  const handleDownload = (format: 'md' | 'html' | 'txt' | 'json') => {
    if (format === 'md') exportService.downloadMarkdown(note);
    else if (format === 'html') exportService.downloadHtml(note);
    else if (format === 'txt') exportService.downloadTxt(note);
    else if (format === 'json') {
      const blob = new Blob([JSON.stringify(note, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${note.title || 'untitled'}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="relative flex items-center justify-between px-4 py-2 border-b border-stone-200/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md z-20 select-none">
      {/* Left: Sidebar Toggle Button [|>] */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
        title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        {isSidebarOpen ? (
          <PanelLeftClose className="w-4 h-4" />
        ) : (
          <PanelLeftOpen className="w-4 h-4" />
        )}
      </button>

      {/* Center: Sleek Minimal Floating Formatting Pill */}
      <div className="flex items-center gap-0.5 px-2 py-1 bg-stone-100/80 dark:bg-zinc-900/80 border border-stone-200/70 dark:border-zinc-800/80 rounded-xl shadow-xs text-stone-700 dark:text-zinc-300">
        {/* Undo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-zinc-800 rounded-md transition disabled:opacity-30 disabled:hover:bg-transparent"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 hover:bg-stone-200/70 dark:hover:bg-zinc-800 rounded-md transition disabled:opacity-30 disabled:hover:bg-transparent"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-stone-300 dark:bg-zinc-700 mx-1" />

        {/* Bold */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-md transition ${
            editor.isActive('bold')
              ? 'bg-stone-300 dark:bg-zinc-700 text-stone-900 dark:text-white font-bold'
              : 'hover:bg-stone-200/70 dark:hover:bg-zinc-800'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* Italic */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-md transition ${
            editor.isActive('italic')
              ? 'bg-stone-300 dark:bg-zinc-700 text-stone-900 dark:text-white'
              : 'hover:bg-stone-200/70 dark:hover:bg-zinc-800'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* Underline */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-md transition ${
            editor.isActive('underline')
              ? 'bg-stone-300 dark:bg-zinc-700 text-stone-900 dark:text-white'
              : 'hover:bg-stone-200/70 dark:hover:bg-zinc-800'
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-3.5 h-3.5" />
        </button>

        {/* Link / Strikethrough */}
        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded-md transition ${
            editor.isActive('link')
              ? 'bg-stone-300 dark:bg-zinc-700 text-stone-900 dark:text-white'
              : 'hover:bg-stone-200/70 dark:hover:bg-zinc-800'
          }`}
          title="Insert Link (Ctrl+K)"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        {/* Highlight */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          className={`p-1.5 rounded-md transition ${
            editor.isActive('highlight')
              ? 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
              : 'hover:bg-stone-200/70 dark:hover:bg-zinc-800'
          }`}
          title="Highlight Text"
        >
          <Highlighter className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-stone-300 dark:bg-zinc-700 mx-1" />

        {/* Headings Dropdown: ABC 123 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsHeadingsOpen(!isHeadingsOpen)}
            className="flex items-center gap-0.5 px-2 py-1 text-xs font-semibold hover:bg-stone-200/70 dark:hover:bg-zinc-800 rounded-md transition tracking-tighter"
            title="Headings & Paragraph"
          >
            <span className="text-[11px]">ABC 123</span>
          </button>

          {isHeadingsOpen && (
            <div className="absolute left-0 mt-1.5 w-40 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-40 text-xs">
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setIsHeadingsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 ${
                  editor.isActive('paragraph') ? 'font-bold text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                Normal Text
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setIsHeadingsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-bold text-sm ${
                  editor.isActive('heading', { level: 1 }) ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                Heading 1
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setIsHeadingsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-semibold text-xs ${
                  editor.isActive('heading', { level: 2 }) ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                Heading 2
              </button>
              <button
                type="button"
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setIsHeadingsOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-medium text-xs ${
                  editor.isActive('heading', { level: 3 }) ? 'text-blue-600 dark:text-blue-400' : ''
                }`}
              >
                Heading 3
              </button>
            </div>
          )}
        </div>

        {/* Task List (Checkbox) */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1.5 rounded-md transition ${
            editor.isActive('taskList')
              ? 'bg-stone-300 dark:bg-zinc-700 text-stone-900 dark:text-white'
              : 'hover:bg-stone-200/70 dark:hover:bg-zinc-800'
          }`}
          title="Task Checklist"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>

        {/* Bullet List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-md transition ${
            editor.isActive('bulletList')
              ? 'bg-stone-300 dark:bg-zinc-700 text-stone-900 dark:text-white'
              : 'hover:bg-stone-200/70 dark:hover:bg-zinc-800'
          }`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-md transition ${
            editor.isActive('orderedList')
              ? 'bg-stone-300 dark:bg-zinc-700 text-stone-900 dark:text-white'
              : 'hover:bg-stone-200/70 dark:hover:bg-zinc-800'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-stone-300 dark:bg-zinc-700 mx-1" />

        {/* Font Size (Aa) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsFontSizeOpen(!isFontSizeOpen)}
            className="flex items-center gap-0.5 px-1.5 py-1 text-xs hover:bg-stone-200/70 dark:hover:bg-zinc-800 rounded-md transition"
            title="Font Size"
          >
            <Type className="w-3.5 h-3.5" />
          </button>

          {isFontSizeOpen && (
            <div className="absolute right-0 mt-1.5 w-32 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-40 text-xs">
              <button
                type="button"
                onClick={() => {
                  applyZoom(90);
                  setIsFontSizeOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                Small (90%)
              </button>
              <button
                type="button"
                onClick={() => {
                  applyZoom(100);
                  setIsFontSizeOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-semibold"
              >
                Medium (100%)
              </button>
              <button
                type="button"
                onClick={() => {
                  applyZoom(115);
                  setIsFontSizeOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
              >
                Large (115%)
              </button>
            </div>
          )}
        </div>

        {/* Fullscreen / Focus Mode Toggle */}
        {onToggleFocusMode && (
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`p-1.5 rounded-md transition ${
              focusMode
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
                : 'hover:bg-stone-200/70 dark:hover:bg-zinc-800'
            }`}
            title="Toggle Distraction-Free Fullscreen (F11)"
          >
            {focusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* Right: Circular (...) Action Button */}
      <div className="relative" ref={menuRef}>
        <button
          type="button"
          onClick={() => {
            setIsMenuOpen(!isMenuOpen);
            setActiveSubmenu(null);
          }}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition border ${
            isMenuOpen
              ? 'bg-blue-50 border-blue-400 text-blue-600 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-400'
              : 'border-stone-200 dark:border-zinc-800 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900'
          }`}
          title="More Actions & Note Options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {/* Complete (...) Action Dropdown Menu matching screenshot media_1794476572201_959d8bbd.png */}
        {isMenuOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-50 text-xs text-stone-800 dark:text-stone-200 animate-in fade-in duration-100">
            {/* Headings and lists > */}
            <div
              className="relative group"
              onMouseEnter={() => setActiveSubmenu('headings')}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold opacity-60">ABC 123</span>
                  <span>Headings and lists</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {activeSubmenu === 'headings' && (
                <div className="absolute right-full top-0 mr-1 w-48 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHeading({ level: 1 }).run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-bold"
                  >
                    Heading 1
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHeading({ level: 2 }).run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-semibold"
                  >
                    Heading 2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHeading({ level: 3 }).run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-medium"
                  >
                    Heading 3
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setParagraph().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Paragraph
                  </button>
                  <div className="h-[1px] bg-stone-200/80 dark:bg-zinc-800 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleTaskList().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>Task checklist</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleBulletList().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Bullet list</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleOrderedList().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>Numbered list</span>
                  </button>
                </div>
              )}
            </div>

            {/* Color and formatting > */}
            <div
              className="relative group"
              onMouseEnter={() => setActiveSubmenu('formatting')}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-xs">A</span>
                  <span>Color and formatting</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {activeSubmenu === 'formatting' && (
                <div className="absolute right-full top-0 mr-1 w-44 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-50">
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleBold().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-bold"
                  >
                    Bold (Ctrl+B)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleItalic().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 italic"
                  >
                    Italic (Ctrl+I)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleUnderline().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 underline"
                  >
                    Underline (Ctrl+U)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleStrike().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 line-through"
                  >
                    Strikethrough
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleHighlight().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-amber-600 font-medium"
                  >
                    Highlight
                  </button>
                </div>
              )}
            </div>

            {/* Insert > (matching exact screenshot sub-items!) */}
            <div
              className="relative group"
              onMouseEnter={() => setActiveSubmenu('insert')}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                  <span>Insert</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {activeSubmenu === 'insert' && (
                <div className="absolute right-full top-0 mr-1 w-52 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-50">
                  <button
                    type="button"
                    onClick={setLink}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <LinkIcon className="w-3.5 h-3.5" />
                      <span>Link</span>
                    </span>
                    <kbd className="text-[10px] text-stone-400">Ctrl+K</kbd>
                  </button>

                  <button
                    type="button"
                    onClick={insertDate}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Date</span>
                    </span>
                    <kbd className="text-[10px] text-stone-400">Alt+Shift+D</kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().setHorizontalRule().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Minus className="w-3.5 h-3.5" />
                    <span>Horizontal rule</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().toggleCodeBlock().run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Code className="w-3.5 h-3.5" />
                      <span>Code block</span>
                    </span>
                    <kbd className="text-[10px] text-stone-400">Ctrl+`</kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().insertContent('<div data-type="math-block" data-latex="E = mc^2"></div>').run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Sigma className="w-3.5 h-3.5 text-purple-500" />
                    <span>Math formula</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      editor.chain().focus().insertContent('<div data-type="mermaid-block" data-code="graph TD\\n  A[Start] --> B[End]"></div>').run();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2"
                  >
                    <Workflow className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Mermaid diagram</span>
                  </button>
                </div>
              )}
            </div>

            {/* Zoom In & Zoom Out Quick Controls */}
            <div
              className="relative group px-3 py-1.5 flex items-center justify-between hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              onMouseEnter={() => setActiveSubmenu('zoom')}
            >
              <div className="flex items-center gap-2">
                <ZoomIn className="w-3.5 h-3.5 text-stone-500" />
                <span className="font-medium">Zoom</span>
                <span className="font-mono text-[10px] bg-stone-200/60 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-stone-700 dark:text-zinc-300 font-semibold">
                  {zoomLevel}%
                </span>
              </div>

              <div className="flex items-center gap-1">
                {/* Direct Zoom Out */}
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 transition"
                  title="Zoom Out (-10%)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                {/* Reset to 100% */}
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 transition"
                  title="Reset to 100%"
                >
                  100%
                </button>

                {/* Direct Zoom In */}
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 rounded hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 transition"
                  title="Zoom In (+10%)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-stone-400 ml-0.5" />
              </div>

              {activeSubmenu === 'zoom' && (
                <div className="absolute right-full top-0 mr-1 w-36 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-50">
                  <div className="px-3 py-1 text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
                    Presets
                  </div>
                  {[75, 90, 100, 110, 125, 150].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => {
                        applyZoom(lvl);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center justify-between ${
                        zoomLevel === lvl ? 'font-bold text-blue-600 dark:text-blue-400' : ''
                      }`}
                    >
                      <span>{lvl}%</span>
                      {zoomLevel === lvl && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Print & PDF Export Ctrl+P */}
            <button
              type="button"
              onClick={() => {
                exportService.printNoteToPdf();
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
            >
              <div className="flex items-center gap-2">
                <Printer className="w-3.5 h-3.5 text-stone-500" />
                <span>Print & PDF Export</span>
              </div>
              <kbd className="text-[10px] text-stone-400">Ctrl+P</kbd>
            </button>

            {/* Download as > */}
            <div
              className="relative group"
              onMouseEnter={() => setActiveSubmenu('download')}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-2">
                  <Download className="w-3.5 h-3.5 text-stone-500" />
                  <span>Download as</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {activeSubmenu === 'download' && (
                <div className="absolute right-full top-0 mr-1 w-44 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-50">
                  <button
                    type="button"
                    onClick={() => handleDownload('md')}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Markdown (.md)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload('html')}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    HTML (.html)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload('txt')}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Plain Text (.txt)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload('json')}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Note JSON (.json)
                  </button>
                </div>
              )}
            </div>

            <div className="h-[1px] bg-stone-200/80 dark:bg-zinc-800 my-1" />

            {/* Delete note */}
            {onDeleteNote && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Move this note to Trash?')) {
                    onDeleteNote();
                    setIsMenuOpen(false);
                  }
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 transition"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
                <span>Delete</span>
              </button>
            )}

            <div className="h-[1px] bg-stone-200/80 dark:bg-zinc-800 my-1" />

            {/* Dark mode */}
            {onCycleTheme && (
              <button
                type="button"
                onClick={onCycleTheme}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-2">
                  {theme === 'dark' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  ) : (
                    <Moon className="w-3.5 h-3.5 text-blue-500" />
                  )}
                  <span>Dark mode</span>
                </div>
                <span className="text-[10px] text-stone-400 capitalize">{theme}</span>
              </button>
            )}

            {/* Settings */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onOpenSettings();
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              >
                <SettingsIcon className="w-3.5 h-3.5 text-stone-500" />
                <span>Settings</span>
              </button>
            )}

            {/* Help */}
            <div
              className="relative group"
              onMouseEnter={() => setActiveSubmenu('help')}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
              >
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
                  <span>Help</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {activeSubmenu === 'help' && (
                <div className="absolute right-full top-0 mr-1 w-44 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-50">
                  <a
                    href="https://github.com/ismailrhouzali/MemoDock"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Documentation
                  </a>
                  <a
                    href="https://github.com/ismailrhouzali/MemoDock/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full block px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800"
                  >
                    Report an Issue
                  </a>
                </div>
              )}
            </div>

            <div className="h-[1px] bg-stone-200/80 dark:bg-zinc-800 my-1" />

            {/* Support and Give Feedback */}
            <a
              href={FEEDBACK_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 transition"
            >
              <MessageSquareHeart className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
              <span>Support and Give Feedback</span>
            </a>

            {/* Our extensions ... */}
            <a
              href="https://github.com/ismailrhouzali/MemoDock"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-500 hover:text-stone-900 transition"
            >
              <span>Our extensions ...</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

