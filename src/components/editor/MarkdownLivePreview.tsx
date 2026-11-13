import React, { useState, useMemo } from 'react';
import { Note, EditorFont, EditorFontSize } from '../../db/types';
import { exportService } from '../../services/exportService';
import { Eye, Code, Copy, Check, X, FileText, Sparkles } from 'lucide-react';

interface MarkdownLivePreviewProps {
  note: Note;
  onClose: () => void;
  editorFont?: EditorFont;
  editorFontSize?: EditorFontSize;
}

export const MarkdownLivePreview: React.FC<MarkdownLivePreviewProps> = ({
  note,
  onClose,
  editorFont = 'sans',
  editorFontSize = 'md',
}) => {
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const [copied, setCopied] = useState(false);

  // Compute live raw markdown from note HTML content
  const rawMarkdown = useMemo(() => {
    const titleHeader = note.title ? `# ${note.title}\n\n` : '';
    return titleHeader + exportService.htmlToMarkdown(note.content || '');
  }, [note.title, note.content]);

  // Handle Copy Markdown to clipboard
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(rawMarkdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy markdown:', err);
    }
  };

  // Font family class
  const fontClass = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
  }[editorFont];

  // Font size class
  const fontSizeClass = {
    sm: 'text-xs leading-relaxed',
    md: 'text-sm leading-relaxed',
    lg: 'text-base leading-relaxed',
  }[editorFontSize];

  // Word count & Char count for preview
  const words = useMemo(() => {
    const text = note.plainText || rawMarkdown;
    return text.trim() ? text.trim().split(/\s+/).length : 0;
  }, [note.plainText, rawMarkdown]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50 dark:bg-zinc-950 border-l border-stone-200 dark:border-zinc-800 select-text">
      {/* Split Preview Header */}
      <div className="h-10 border-b border-stone-200 dark:border-zinc-800 px-3 flex items-center justify-between bg-white dark:bg-zinc-900 select-none shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-stone-600 dark:text-zinc-300 font-semibold text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Split Preview</span>
          </div>

          <div className="h-3.5 w-px bg-stone-200 dark:bg-zinc-800 mx-1" />

          {/* Mode Switcher */}
          <div className="flex items-center bg-stone-100 dark:bg-zinc-800 rounded-md p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('rendered')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${viewMode === 'rendered'
                  ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 font-semibold shadow-2xs'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                }`}
            >
              <Eye className="w-3 h-3" />
              <span>Rendu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${viewMode === 'raw'
                  ? 'bg-white dark:bg-zinc-900 text-stone-900 dark:text-zinc-100 font-semibold shadow-2xs'
                  : 'text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-200'
                }`}
            >
              <Code className="w-3 h-3" />
              <span>Markdown</span>
            </button>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] text-stone-400 dark:text-zinc-500 hidden sm:inline">
            {words} mots · {rawMarkdown.length} car.
          </span>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 transition"
            title="Copier le Markdown brut"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copier</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Fermer le mode Double Volet"
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Split Preview Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        {viewMode === 'rendered' ? (
          <div className={`max-w-2xl mx-auto ${fontClass} ${fontSizeClass}`}>
            {/* Note Title */}
            {note.title && (
              <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100 mb-6 pb-3 border-b border-stone-200 dark:border-zinc-800">
                {note.title}
              </h1>
            )}

            {/* Note Content Rendered */}
            <div
              className="prose prose-stone dark:prose-invert max-w-none tiptap-content-container"
              dangerouslySetInnerHTML={{ __html: note.content || '<p class="text-stone-400 dark:text-zinc-600 italic">Note vide...</p>' }}
            />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <div className="rounded-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 shadow-2xs overflow-hidden">
              <div className="px-3 py-1.5 border-b border-stone-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-950/60 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span>markdown</span>
                <span>{rawMarkdown.split('\n').length} lignes</span>
              </div>
              <pre className="p-4 font-mono text-xs text-stone-800 dark:text-zinc-200 whitespace-pre-wrap break-words leading-relaxed overflow-x-auto select-all">
                {rawMarkdown || '# ' + (note.title || 'Untitled Note')}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

