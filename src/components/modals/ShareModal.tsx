import React, { useState } from 'react';
import { Note } from '../../db/types';
import { db } from '../../db/db';
import { exportService } from '../../services/exportService';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  FileCode2,
  FileText,
  Sparkles,
  Printer,
  Database,
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, note }) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen || !note) return null;

  const markCopied = (key: string) => {
    setCopiedType(key);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const handleNativeShare = async () => {
    const md = `# ${note.title || 'Untitled Note'}\n\n${exportService.htmlToMarkdown(note.content)}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: note.title || 'MemoDock Note',
          text: md,
        });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(md);
      markCopied('native');
    }
  };

  const handleCopyMarkdown = async () => {
    const md = `# ${note.title || 'Untitled Note'}\n\n${exportService.htmlToMarkdown(note.content)}`;
    await navigator.clipboard.writeText(md);
    markCopied('md');
  };

  const handleCopyMcpContext = async () => {
    const mcpPayload = {
      schema: 'memodock.mcp.context.v1',
      noteId: note.id,
      title: note.title || 'Untitled Note',
      tags: note.tags,
      updatedAt: new Date(note.updatedAt).toISOString(),
      markdown: exportService.htmlToMarkdown(note.content),
    };
    await navigator.clipboard.writeText(JSON.stringify(mcpPayload, null, 2));
    markCopied('mcp');
  };

  const handleExportPortableBundle = async () => {
    const [notes, folders, tags, databases] = await Promise.all([
      db.notes.toArray(),
      db.folders.toArray(),
      db.tags.toArray(),
      db.databases.toArray(),
    ]);
    const bundle = {
      format: 'memodock-portable-sqlite-json-v1',
      exportedAt: new Date().toISOString(),
      tables: { notes, folders, tags, databases },
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memodock-portable-bundle-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden z-10 text-xs">
        <div className="px-4 py-3 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-zinc-100">
            <Share2 className="w-4 h-4 text-blue-600" />
            <span>Share & Export Note</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5">
          <div className="p-2.5 rounded-lg bg-stone-50 dark:bg-zinc-950/60 border border-stone-200/70 dark:border-zinc-800">
            <div className="font-semibold text-stone-800 dark:text-zinc-100 truncate">
              {note.title || 'Untitled Note'}
            </div>
            <div className="text-[11px] text-stone-400 mt-0.5">
              Share via system sheet, copy Markdown, save as PDF, or export AI/MCP context.
            </div>
          </div>

          <button
            type="button"
            onClick={handleNativeShare}
            className="w-full px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              <span>Share Note (System Share / Clipboard)</span>
            </span>
            {copiedType === 'native' && <Check className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={handleCopyMarkdown}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800 flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-stone-500" />
              <span>Copy as Markdown</span>
            </span>
            {copiedType === 'md' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              setTimeout(() => exportService.printNoteToPdf(), 120);
            }}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800 flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-red-500" />
              <span>Save as PDF (Clean Print Layout)</span>
            </span>
            <Download className="w-3.5 h-3.5 text-stone-400" />
          </button>

          <button
            type="button"
            onClick={() => exportService.downloadHtml(note)}
            className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800 flex items-center justify-between transition"
          >
            <span className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-amber-500" />
              <span>Download Standalone Shareable HTML</span>
            </span>
            <Download className="w-3.5 h-3.5 text-stone-400" />
          </button>

          <div className="pt-2 border-t border-stone-100 dark:border-zinc-800 space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              AI / MCP & Portable Data
            </div>
            <button
              type="button"
              onClick={handleCopyMcpContext}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span>Copy AI / MCP Context Payload (JSON)</span>
              </span>
              {copiedType === 'mcp' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
            </button>

            <button
              type="button"
              onClick={handleExportPortableBundle}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800 flex items-center justify-between transition"
            >
              <span className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-600" />
                <span>Export Portable Bundle (All Notes & Databases)</span>
              </span>
              <Download className="w-3.5 h-3.5 text-stone-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
