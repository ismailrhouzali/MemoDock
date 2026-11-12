import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Trash2,
  Eye,
  Upload,
  Search,
  HardDrive,
  FilePlus,
  ArrowUpDown,
} from 'lucide-react';
import { db } from '../../db/db';
import { Attachment, Note } from '../../db/types';
import { PdfViewerModal } from './PdfViewerModal';
import { pdfStorageService } from '../../services/pdfStorageService';

interface DocumentHubProps {
  onNavigateToNote?: (noteId: string) => void;
}

export const DocumentHub: React.FC<DocumentHubProps> = ({ onNavigateToNote }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPdf, setSelectedPdf] = useState<Attachment | null>(null);
  const [sortOrder, setSortOrder] = useState<'newest' | 'name' | 'size'>('newest');

  const loadAttachments = async () => {
    const list = await db.attachments.toArray();
    setAttachments(list);

    // Map note titles
    const allNotes = await db.notes.toArray();
    const map: Record<string, string> = {};
    allNotes.forEach((n) => {
      map[n.id] = n.title;
    });
    setNotes(map);
  };

  useEffect(() => {
    loadAttachments();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await pdfStorageService.savePdfFile(file, 'general');
      loadAttachments();
    } catch (err) {
      console.error('Failed to store PDF blob:', err);
    }
    e.target.value = '';
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this document?')) {
      await db.attachments.delete(id);
      loadAttachments();
    }
  };

  const handleDownload = (att: Attachment) => {
    const url = pdfStorageService.getViewerUrl(att);
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => pdfStorageService.revokeViewerUrl(url), 1000);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalBytes = attachments.reduce((acc, curr) => acc + (curr.size || 0), 0);

  const filteredAttachments = attachments
    .filter((a) => {
      if (!searchQuery.trim()) return true;
      return a.name.toLowerCase().includes(searchQuery.toLowerCase());
    })
    .sort((a, b) => {
      if (sortOrder === 'name') return a.name.localeCompare(b.name);
      if (sortOrder === 'size') return b.size - a.size;
      return b.createdAt - a.createdAt;
    });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50/50 dark:bg-obsidian-950 text-stone-800 dark:text-stone-200">

      {/* Top Header Bar */}
      <div className="p-4 border-b border-stone-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center font-bold shadow-sm">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>PDF & Documents</span>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-xs font-medium text-stone-500 dark:text-zinc-400">
                {attachments.length} files
              </span>
            </h2>
            <p className="text-[11px] text-stone-400 dark:text-zinc-500 flex items-center gap-2">
              <span>IndexedDB Local Storage:</span>
              <span className="font-semibold text-stone-600 dark:text-zinc-300">
                {formatSize(totalBytes)} used
              </span>
            </p>
          </div>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold shadow-sm transition active:scale-95 cursor-pointer">
          <Upload className="w-3.5 h-3.5" />
          <span>Upload PDF</span>
          <input
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Search & Sort Bar */}
      <div className="px-4 py-2.5 border-b border-stone-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 flex items-center justify-between gap-3 text-xs flex-shrink-0">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by filename..."
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="px-2.5 py-1 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md text-[11px] text-stone-700 dark:text-zinc-300 focus:outline-none"
        >
          <option value="newest">Newest First</option>
          <option value="name">Name A-Z</option>
          <option value="size">Largest Size</option>
        </select>
      </div>

      {/* Document List / Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredAttachments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400 dark:text-zinc-500">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
              <FilePlus className="w-6 h-6 text-stone-400" />
            </div>
            <h3 className="font-semibold text-stone-700 dark:text-zinc-300 text-sm mb-1">
              {searchQuery ? 'No matching documents found' : 'No documents uploaded yet'}
            </h3>
            <p className="text-xs max-w-sm mb-4">
              Store research papers, contracts, documentation, and reference PDFs with 100% offline local privacy.
            </p>
            <label className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold shadow-sm transition cursor-pointer">
              <span>Select PDF to Upload</span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAttachments.map((att) => (
              <div
                key={att.id}
                className="group flex flex-col bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-xl p-3.5 hover:border-amber-400 dark:hover:border-amber-600/50 hover:shadow-subtle transition text-xs"
              >
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className="w-9 h-9 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-600 transition" title={att.name}>
                      {att.name}
                    </h4>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {formatSize(att.size)}
                    </span>
                  </div>
                </div>

                {/* Associated Note */}
                <div className="mt-auto pt-2 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between text-[11px]">
                  {att.noteId && notes[att.noteId] ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToNote && onNavigateToNote(att.noteId)}
                      className="text-amber-700 dark:text-amber-400 hover:underline truncate max-w-[150px]"
                    >
                      Note: {notes[att.noteId]}
                    </button>
                  ) : (
                    <span className="text-stone-400">
                      {new Date(att.createdAt).toLocaleDateString()}
                    </span>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedPdf(att)}
                      className="p-1 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded"
                      title="View PDF"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownload(att)}
                      className="p-1 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id)}
                      className="p-1 text-stone-400 hover:text-red-500 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        attachment={selectedPdf}
        onClose={() => setSelectedPdf(null)}
        onDelete={handleDelete}
      />
    </div>
  );
};

