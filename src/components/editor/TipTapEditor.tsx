import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import { common, createLowlight } from 'lowlight';

import { MathBlock } from './extensions/MathBlock';
import { MathInline } from './extensions/MathInline';
import { MermaidBlock } from './extensions/MermaidBlock';
import { PdfAttachmentNode } from './extensions/PdfAttachment';
import { SpreadsheetNode } from './extensions/SpreadsheetNode';
import { LinkCardNode } from './extensions/LinkCard';
import { EditorToolbar } from './EditorToolbar';
import { MinimalistEditorHeader } from './MinimalistEditorHeader';
import { FindReplaceBar } from './FindReplaceBar';
import { TableOfContents } from './TableOfContents';
import { ContextMenu, ContextMenuPosition } from '../common/ContextMenu';
import { processUniversalClipboard, processUniversalFile, IngestionResult } from '../../services/importEngine/smartImportEngine';
import { SmartPastePreview } from './SmartPastePreview';
import { ImportModal } from '../modals/ImportModal';
import { extractInternalLinks, syncBacklinks } from '../../services/linkService';
import { db } from '../../db/db';
import {
  Note,
  Folder,
  Tag,
  EditorWidth,
  EditorFont,
  EditorFontSize,
  EditorLayoutSettings,
  NoteVersion,
  ThemeMode,
} from '../../db/types';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Link as LinkIcon,
  Star,
  Pin,
  Folder as FolderIcon,
  Tag as TagIcon,
  Clock,
  ExternalLink,
  Plus,
  X,
  Code,
  ChevronRight,
  Link2,
} from 'lucide-react';

const lowlight = createLowlight(common);

export function extractTitleFromContent(html: string, plainText: string): string {
  // 1. Try first heading in html (h1, h2, h3)
  const headingMatch = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i);
  if (headingMatch && headingMatch[1]) {
    const text = headingMatch[1]
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
    if (text.length > 0) {
      return text.length > 60 ? text.slice(0, 60) + '...' : text;
    }
  }

  // 2. Try first non-empty line of plain text
  if (plainText) {
    const lines = plainText.split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine
        .replace(/^[#\s\-*+>]+/, '')
        .replace(/^\[[ xX]\]\s*/, '')
        .replace(/^\d+[\.\)]\s*/, '')
        .trim();
      if (line.length > 1) {
        return line.length > 60 ? line.slice(0, 60) + '...' : line;
      }
    }
  }

  return '';
}

interface TipTapEditorProps {
  note: Note;
  allNotes?: Note[];
  folders: Folder[];
  availableTags: Tag[];
  onUpdateNote: (updated: Partial<Note>) => void;
  onDeleteNote?: (id: string) => void;
  onNavigateToNote?: (noteId: string) => void;
  editorWidth: EditorWidth;
  editorFont: EditorFont;
  editorFontSize: EditorFontSize;
  editorLayout: EditorLayoutSettings;
  focusMode: boolean;
  onToggleFocusMode?: () => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  theme?: ThemeMode;
  onCycleTheme?: () => void;
  onOpenSettings?: () => void;
  onStatsChange?: (stats: { words: number; chars: number; readingTime: number }) => void;
  onOpenTemplates?: () => void;
  onOpenHistory?: () => void;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({
  note,
  allNotes = [],
  folders,
  availableTags,
  onUpdateNote,
  onDeleteNote,
  onNavigateToNote,
  editorWidth,
  editorFont,
  editorFontSize,
  editorLayout,
  focusMode,
  onToggleFocusMode,
  isSidebarOpen = true,
  onToggleSidebar,
  theme = 'light',
  onCycleTheme,
  onOpenSettings,
  onStatsChange,
  onOpenTemplates,
  onOpenHistory,
}) => {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showToc, setShowToc] = useState(editorLayout.showTableOfContents);
  const [title, setTitle] = useState(note.title);
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [lastIngestion, setLastIngestion] = useState<IngestionResult | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<ContextMenuPosition | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Sync title when active note changes
  useEffect(() => {
    setTitle(note.title);
  }, [note.id, note.title]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-amber-700 dark:text-amber-400 underline underline-offset-2 hover:opacity-80 cursor-pointer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: 'Write your thoughts here... (Markdown supported, paste from ChatGPT/GitHub, type "/" or "#")',
      }),
      MathBlock,
      MathInline,
      MermaidBlock,
      PdfAttachmentNode,
      SpreadsheetNode,
      LinkCardNode,
    ],
    content: note.content || '',
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[500px] leading-relaxed',
      },
      // Universal Drag & Drop handler (Links, .md, .txt, .html, .docx, .pdf, images)
      handleDrop: (view, event, _slice, moved) => {
        if (moved) return false;

        // 1. Check for dropped URLs (text/uri-list or plain text link)
        if (event.dataTransfer) {
          const rawUri = event.dataTransfer.getData('text/uri-list') || event.dataTransfer.getData('text/plain');
          const cleanUri = rawUri ? rawUri.trim() : '';
          if (cleanUri.startsWith('http://') || cleanUri.startsWith('https://')) {
            event.preventDefault();
            try {
              const parsed = new URL(cleanUri);
              const hostname = parsed.hostname;
              const title = `${hostname}${parsed.pathname.length > 1 ? parsed.pathname : ''}`;
              const node = view.state.schema.nodes.linkCard.create({
                url: cleanUri,
                title: title,
                hostname: hostname,
                displayMode: 'compact',
              });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
              return true;
            } catch {
              // fallback
            }
          }
        }

        // 2. Check for dropped files (images, pdfs, docs)
        if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          
          // Image file
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (readerEvent) => {
              const node = view.state.schema.nodes.image.create({
                src: readerEvent.target?.result,
              });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            };
            reader.readAsDataURL(file);
            return true;
          }

          // Universal document file (.docx, .pdf, .md, .txt, .html)
          event.preventDefault();
          processUniversalFile(file, note.id).then((res) => {
            if (res.action === 'insert_html' && res.html) {
              editor?.commands.insertContent(res.html);
            } else if (res.action === 'create_attachment' && res.attachment) {
              const node = view.state.schema.nodes.pdfAttachment.create({
                attachmentId: res.attachment.id,
                name: res.attachment.name,
                size: res.attachment.size,
                displayMode: 'compact',
              });
              const transaction = view.state.tr.replaceSelectionWith(node);
              view.dispatch(transaction);
            }
          });
          return true;
        }
        return false;
      },
      // Universal Smart Clipboard Ingestion
      handlePaste: (view, event) => {
        // Plain text paste shortcut: Ctrl+Shift+V
        const isPlainPasteShortcut = (event as any).shiftKey;
        if (isPlainPasteShortcut) {
          return false;
        }

        // Process clipboard via Universal Smart Ingestion Pipeline
        const result = processUniversalClipboard(event);
        if (result.type === 'image') {
          return false; // let image handler or file reader proceed
        }

        if (result.html && result.html.trim().length > 0) {
          event.preventDefault();
          editor?.commands.insertContent(result.html);
          if (result.isComplex) {
            setLastIngestion(result);
          }
          return true;
        }

        return false;
      },
      // Internal Link click navigation: notebook://note/{id}
      handleClick: (_view, _pos, event) => {
        const target = event.target as HTMLElement;
        const link = target.closest('a');
        if (link) {
          const href = link.getAttribute('href') || '';
          if (href.startsWith('notebook://note/')) {
            event.preventDefault();
            const targetNoteId = href.replace('notebook://note/', '');
            if (onNavigateToNote) {
              onNavigateToNote(targetNoteId);
            }
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      const text = ed.getText();

      // Calculate stats
      const trimmed = text.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      const chars = text.length;
      const readingTime = Math.ceil(words / 200);

      if (onStatsChange) {
        onStatsChange({ words, chars, readingTime });
      }

      // Extract internal links and update note
      const internalLinks = extractInternalLinks(html, allNotes);
      syncBacklinks(note.id, internalLinks);

      // Real-time automatic note title generation from content
      let activeTitle = title;
      const isAutoTitleEligible =
        !note.title ||
        note.title === 'Untitled Note' ||
        note.title === 'Sans titre' ||
        note.isAutoTitle === true ||
        (note.isAutoTitle !== false && (!title || title === 'Untitled Note'));

      if (isAutoTitleEligible && trimmed.length > 0) {
        const auto = extractTitleFromContent(html, trimmed);
        if (auto && auto !== title) {
          activeTitle = auto;
          setTitle(auto);
        }
      }

      onUpdateNote({
        title: activeTitle,
        content: html,
        plainText: text,
        internalLinks,
        updatedAt: Date.now(),
        ...(isAutoTitleEligible ? { isAutoTitle: true } : {}),
      });
    },
  });

  // Re-sync editor content when switching notes & record snapshot
  useEffect(() => {
    if (editor && note) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== note.content) {
        editor.commands.setContent(note.content || '', false);
      }

      const text = editor.getText();
      const trimmed = text.trim();
      const words = trimmed ? trimmed.split(/\s+/).length : 0;
      const chars = text.length;
      const readingTime = Math.ceil(words / 200);
      if (onStatsChange) {
        onStatsChange({ words, chars, readingTime });
      }
    }
  }, [note.id, editor]);

  // Periodic Version Snapshot creation (saves snapshot if content significantly changed)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (note && note.content && note.content.length > 20) {
        const latest = await db.noteVersions
          .where('noteId')
          .equals(note.id)
          .reverse()
          .first();

        if (!latest || latest.content !== note.content) {
          const version: NoteVersion = {
            id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            noteId: note.id,
            title: note.title,
            content: note.content,
            plainText: note.plainText || '',
            createdAt: Date.now(),
          };
          await db.noteVersions.add(version);
        }
      }
    }, 15000); // 15-second debounce for version history snapshot

    return () => clearTimeout(timer);
  }, [note.id, note.content, note.title]);

  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (trimmed !== note.title) {
      const isEmpty = trimmed.length === 0;
      onUpdateNote({
        title: trimmed || 'Untitled Note',
        isAutoTitle: isEmpty,
        updatedAt: Date.now(),
      });
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      editor?.commands.focus('start');
    }
  };

  const toggleFavorite = () => {
    onUpdateNote({
      isFavorite: !note.isFavorite,
      updatedAt: Date.now(),
    });
  };

  const togglePin = () => {
    onUpdateNote({
      isPinned: !note.isPinned,
      updatedAt: Date.now(),
    });
  };

  const handleFolderChange = (folderId: string | null) => {
    onUpdateNote({
      folderId,
      updatedAt: Date.now(),
    });
  };

  const addTag = (tagName: string) => {
    const clean = tagName.trim();
    if (!clean || note.tags.includes(clean)) return;
    onUpdateNote({
      tags: [...note.tags, clean],
      updatedAt: Date.now(),
    });
    setNewTagInput('');
  };

  const removeTag = (tagName: string) => {
    onUpdateNote({
      tags: note.tags.filter((t) => t !== tagName),
      updatedAt: Date.now(),
    });
  };

  // Insert internal note link
  const insertInternalLink = (targetNote: Note) => {
    editor
      ?.chain()
      .focus()
      .insertContent(
        `<a href="notebook://note/${targetNote.id}" class="text-amber-700 dark:text-amber-400 font-medium underline underline-offset-2">[[${targetNote.title}]]</a> `
      )
      .run();
  };

  // Find active folder name for breadcrumbs
  const currentFolder = folders.find((f) => f.id === note.folderId);

  // Find notes linking to this note (backlinks)
  const backlinksNotes = allNotes.filter(
    (n) => n.id !== note.id && n.internalLinks && n.internalLinks.includes(note.id)
  );

  // Width container class
  const widthClasses = {
    narrow: 'max-w-2xl',
    normal: 'max-w-3xl',
    wide: 'max-w-5xl',
    full: 'max-w-full px-6',
  }[editorWidth];

  const fontClasses = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  }[editorFont];

  const fontSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  }[editorFontSize];

  // Minimal layout flags
  const isMinimal = editorLayout.mode === 'minimal';
  const showToolbar = !focusMode && editorLayout.mode !== 'focus' && editorLayout.showToolbar;
  const showMetadata = !focusMode && !isMinimal && editorLayout.mode === 'standard';
  const showBreadcrumbs = !focusMode && !isMinimal && editorLayout.showBreadcrumbs;

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-white dark:bg-obsidian-950 text-stone-800 dark:text-stone-200">
      
      {/* Editor Center Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header: Minimalist floating header vs Sticky standard toolbar */}
        {isMinimal && !focusMode ? (
          <MinimalistEditorHeader
            editor={editor}
            note={note}
            isSidebarOpen={isSidebarOpen ?? true}
            onToggleSidebar={onToggleSidebar || (() => {})}
            onDeleteNote={onDeleteNote ? () => onDeleteNote(note.id) : undefined}
            theme={theme}
            onCycleTheme={onCycleTheme}
            onOpenSettings={onOpenSettings}
            focusMode={focusMode}
            onToggleFocusMode={onToggleFocusMode}
          />
        ) : showToolbar && (
          <div className="sticky top-0 z-20 backdrop-blur-md bg-white/95 dark:bg-zinc-950/95 border-b border-stone-200/80 dark:border-zinc-800">
            <EditorToolbar
              editor={editor}
              onToggleFindReplace={() => setShowFindReplace(!showFindReplace)}
              showFindReplace={showFindReplace}
              onOpenTemplates={onOpenTemplates}
              onOpenHistory={onOpenHistory}
              onOpenImport={() => setIsImportOpen(true)}
              onToggleToc={() => setShowToc(!showToc)}
              showToc={showToc}
            />
            {showFindReplace && (
              <FindReplaceBar
                editor={editor}
                onClose={() => setShowFindReplace(false)}
              />
            )}
          </div>
        )}

        {/* Editor Main Canvas Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
          <div className={`mx-auto ${widthClasses} ${fontClasses} transition-all duration-200`}>
            
            {/* Breadcrumb Navigation */}
            {showBreadcrumbs && (
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-zinc-500 mb-2 select-none">
                <span className="hover:text-stone-700 dark:hover:text-zinc-300">
                  {currentFolder ? currentFolder.name : 'All Notes'}
                </span>
                <ChevronRight className="w-3 h-3 opacity-60" />
                <span className="text-stone-700 dark:text-zinc-300 font-medium truncate max-w-xs">
                  {note.title || 'Untitled'}
                </span>
              </div>
            )}

            {/* Note Metadata Header (Hidden in focus/minimal mode) */}
            {showMetadata && (
              <div className="mb-4 pb-3 border-b border-stone-200/50 dark:border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 dark:text-zinc-400">
                <div className="flex items-center flex-wrap gap-2">
                  {/* Folder Selector */}
                  <div className="flex items-center gap-1 bg-stone-100 dark:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800 rounded px-2 py-1">
                    <FolderIcon className="w-3.5 h-3.5 text-stone-400 dark:text-zinc-500" />
                    <select
                      value={note.folderId || ''}
                      onChange={(e) => handleFolderChange(e.target.value || null)}
                      className="bg-transparent text-xs text-stone-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                    >
                      <option value="">No Folder (Inbox)</option>
                      {folders.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Tags */}
                  <div className="flex items-center flex-wrap gap-1">
                    {note.tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-200/60 dark:bg-zinc-800 text-[11px] text-stone-700 dark:text-zinc-300"
                      >
                        <span>#{t}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="hover:text-red-500 text-stone-400"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                        className="p-1 hover:bg-stone-200/60 dark:hover:bg-zinc-800 rounded text-stone-400 hover:text-stone-700 dark:hover:text-zinc-300 transition"
                        title="Add Tag"
                      >
                        <Plus className="w-3 h-3" />
                      </button>

                      {isTagDropdownOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setIsTagDropdownOpen(false)}
                          />
                          <div className="absolute left-0 mt-1 z-40 w-48 p-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg shadow-float text-xs">
                            <input
                              type="text"
                              value={newTagInput}
                              onChange={(e) => setNewTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  addTag(newTagInput);
                                  setIsTagDropdownOpen(false);
                                }
                              }}
                              placeholder="Tag name + Enter"
                              className="w-full px-2 py-1 mb-1.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded text-stone-900 dark:text-stone-100 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
                              autoFocus
                            />
                            <div className="max-h-28 overflow-y-auto space-y-0.5">
                              {availableTags
                                .filter((at) => !note.tags.includes(at.name))
                                .map((at) => (
                                  <button
                                    key={at.id}
                                    type="button"
                                    onClick={() => {
                                      addTag(at.name);
                                      setIsTagDropdownOpen(false);
                                    }}
                                    className="w-full text-left px-1.5 py-1 rounded hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 flex items-center gap-1.5"
                                  >
                                    <TagIcon className="w-3 h-3 text-stone-400" />
                                    <span>{at.name}</span>
                                  </button>
                                ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Side: Pin, Favorite, Timestamp */}
                <div className="flex items-center gap-2">
                  {note.sourceUrl && (
                    <a
                      href={note.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-500 hover:underline"
                      title={note.sourceTitle || note.sourceUrl}
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Source</span>
                    </a>
                  )}

                  {editorLayout.showModifiedDate && (
                    <div className="flex items-center gap-1 text-[11px] text-stone-400 dark:text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={togglePin}
                    className={`p-1 rounded transition ${
                      note.isPinned
                        ? 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                        : 'text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200'
                    }`}
                    title={note.isPinned ? 'Unpin Note' : 'Pin to Top'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={toggleFavorite}
                    className={`p-1 rounded transition ${
                      note.isFavorite
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200'
                    }`}
                    title={note.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            )}

            {/* Editable Note Title */}
            <input
              ref={titleInputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={handleTitleKeyDown}
              placeholder="Note Title"
              className="w-full bg-transparent font-bold text-2xl md:text-3xl text-stone-900 dark:text-stone-100 placeholder-stone-300 dark:placeholder-zinc-700 focus:outline-none mb-4 pb-1 transition-all"
            />

            {/* Floating Bubble Menu on text selection */}
            {editor && (
              <BubbleMenu
                editor={editor}
                tippyOptions={{ duration: 150 }}
                className="flex items-center gap-0.5 p-1 bg-stone-900/90 dark:bg-zinc-800/95 text-white rounded-lg shadow-float backdrop-blur-md text-xs border border-stone-700/50"
              >
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1 hover:bg-stone-700 rounded ${editor.isActive('bold') ? 'text-amber-400 font-bold' : ''}`}
                  title="Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1 hover:bg-stone-700 rounded ${editor.isActive('italic') ? 'text-amber-400 italic' : ''}`}
                  title="Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={`p-1 hover:bg-stone-700 rounded ${editor.isActive('underline') ? 'text-amber-400' : ''}`}
                  title="Underline"
                >
                  <UnderlineIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-1 hover:bg-stone-700 rounded ${editor.isActive('strike') ? 'text-amber-400' : ''}`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight().run()}
                  className={`p-1 hover:bg-stone-700 rounded ${editor.isActive('highlight') ? 'text-amber-400' : ''}`}
                  title="Highlight"
                >
                  <Highlighter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className={`p-1 hover:bg-stone-700 rounded ${editor.isActive('code') ? 'text-amber-400' : ''}`}
                  title="Inline Code"
                >
                  <Code className="w-3.5 h-3.5" />
                </button>
              </BubbleMenu>
            )}

            {/* Rich Text Editor Content */}
            <div
              className={`prose dark:prose-invert max-w-none ${fontSizeClasses} tiptap-content-container`}
              onContextMenu={(e) => {
                e.preventDefault();
                setContextMenuPos({ x: e.clientX, y: e.clientY });
              }}
            >
              <EditorContent editor={editor} />
            </div>

            {/* Backlinks & Referencing Notes Section */}
            {backlinksNotes.length > 0 && (
              <div className="mt-12 pt-6 border-t border-stone-200/60 dark:border-zinc-800/60 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-stone-500 dark:text-zinc-400 mb-3">
                  <Link2 className="w-3.5 h-3.5 text-amber-600" />
                  <span>Referenced by ({backlinksNotes.length} note{backlinksNotes.length === 1 ? '' : 's'}):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {backlinksNotes.map((bn) => (
                    <button
                      key={bn.id}
                      type="button"
                      onClick={() => onNavigateToNote && onNavigateToNote(bn.id)}
                      className="p-2.5 rounded-lg border border-stone-200/70 dark:border-zinc-800 hover:bg-stone-100/60 dark:hover:bg-zinc-900 text-left transition"
                    >
                      <h5 className="font-semibold text-stone-800 dark:text-stone-200 truncate">{bn.title}</h5>
                      <p className="text-[10px] text-stone-400 truncate mt-0.5">{bn.plainText || 'No preview'}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right-Hand Table of Contents */}
      {showToc && !focusMode && (
        <TableOfContents
          editor={editor}
          isOpen={showToc}
          onToggle={() => setShowToc(!showToc)}
          maxLevel={editorLayout.tocLevel === 'h2' ? 2 : editorLayout.tocLevel === 'h4' ? 4 : 3}
        />
      )}

      {/* Smart Paste Preview Floating Badge */}
      {lastIngestion && (
        <SmartPastePreview
          detectedSource={lastIngestion.detectedSource}
          stats={lastIngestion.stats}
          onPastePlainText={() => {
            editor?.commands.undo();
            editor?.commands.insertContent(lastIngestion.plainText);
            setLastIngestion(null);
          }}
          onUndo={() => {
            editor?.commands.undo();
            setLastIngestion(null);
          }}
          onDismiss={() => setLastIngestion(null)}
        />
      )}

      {/* Universal Smart Import Modal */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        noteId={note.id}
        onInsertHtml={(html) => {
          editor?.commands.insertContent(html);
        }}
      />

      {/* Editor & Table Right-Click Context Menu */}
      <ContextMenu
        position={contextMenuPos}
        editor={editor}
        onClose={() => setContextMenuPos(null)}
      />
    </div>
  );
};
