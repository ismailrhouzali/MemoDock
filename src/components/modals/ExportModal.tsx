import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileCode,
  FileText,
  Printer,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Archive,
} from 'lucide-react';
import { Note } from '../../db/types';
import { exportService } from '../../services/exportService';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeNote: Note;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  activeNote,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'backup'>('export');
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsRestoring(true);
    setRestoreStatus(null);
    setRestoreError(null);

    try {
      const text = await file.text();
      const res = await exportService.restoreFromJsonBackup(text);
      setRestoreStatus(
        `Successfully restored: ${res.notesRestored} notes, ${res.foldersRestored} folders, and ${res.tagsRestored} tags!`
      );
    } catch (err: any) {
      setRestoreError(err?.message || 'Failed to restore backup file. Please ensure it is a valid NoteBook JSON file.');
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden flex flex-col z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-stone-100">
            <Download className="w-4 h-4 text-stone-700 dark:text-stone-300" />
            <span>Export & Data Backup</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-stone-200/60 dark:border-zinc-800/60 px-5 gap-4 bg-stone-50/50 dark:bg-zinc-950/50">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-2.5 font-medium border-b-2 transition ${
              activeTab === 'export'
                ? 'border-amber-600 text-stone-900 dark:text-stone-100'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Export Active Note
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 font-medium border-b-2 transition ${
              activeTab === 'backup'
                ? 'border-amber-600 text-stone-900 dark:text-stone-100'
                : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
          >
            Complete Backup & Restore
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {activeTab === 'export' && (
            <div className="space-y-3">
              <div className="p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200/60 dark:border-zinc-800/60 rounded-lg">
                <span className="text-[11px] text-stone-400 block mb-0.5">Active note to export:</span>
                <span className="font-semibold text-stone-800 dark:text-stone-200 truncate block">
                  {activeNote.title || 'Untitled Note'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => exportService.downloadMarkdown(activeNote)}
                  className="p-3 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/60 flex items-center gap-2.5 text-left transition"
                >
                  <FileCode className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-stone-800 dark:text-stone-200">Markdown (.md)</div>
                    <div className="text-[10px] text-stone-400">Headings, math, tables</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => exportService.printNoteToPdf()}
                  className="p-3 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/60 flex items-center gap-2.5 text-left transition"
                >
                  <Printer className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="font-medium text-stone-800 dark:text-stone-200">PDF Document</div>
                    <div className="text-[10px] text-stone-400">Save to PDF / Print</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => exportService.downloadHtml(activeNote)}
                  className="p-3 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/60 flex items-center gap-2.5 text-left transition"
                >
                  <FileText className="w-5 h-5 text-amber-500" />
                  <div>
                    <div className="font-medium text-stone-800 dark:text-stone-200">HTML Document (.html)</div>
                    <div className="text-[10px] text-stone-400">Styled standalone page</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => exportService.downloadTxt(activeNote)}
                  className="p-3 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/60 flex items-center gap-2.5 text-left transition"
                >
                  <FileText className="w-5 h-5 text-stone-400" />
                  <div>
                    <div className="font-medium text-stone-800 dark:text-stone-200">Plain Text (.txt)</div>
                    <div className="text-[10px] text-stone-400">Unformatted raw text</div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200/60 dark:border-zinc-800/60 rounded-lg">
                <div className="font-medium text-stone-800 dark:text-stone-200 mb-1">
                  Full Local Backup (JSON)
                </div>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed mb-3">
                  Export all your notes, folder structures, tags, and timestamps into a portable JSON backup file. No data is lost.
                </p>
                <button
                  type="button"
                  onClick={() => exportService.downloadJsonBackup()}
                  className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium rounded-lg transition flex items-center gap-2"
                >
                  <FileJson className="w-3.5 h-3.5" />
                  <span>Download Full Backup</span>
                </button>
              </div>

              {/* Restore Section */}
              <div className="p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200/60 dark:border-zinc-800/60 rounded-lg">
                <div className="font-medium text-stone-800 dark:text-stone-200 mb-1">
                  Restore from Backup
                </div>
                <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed mb-3">
                  Select a previous `.json` backup file to restore. Existing notes will not be overwritten unless the backup contains newer updates.
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleRestoreFile}
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRestoring}
                  className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-800 dark:text-zinc-200 font-medium rounded-lg transition flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isRestoring ? 'Restoring...' : 'Upload & Restore Backup'}</span>
                </button>

                {restoreStatus && (
                  <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{restoreStatus}</span>
                  </div>
                )}

                {restoreError && (
                  <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded flex items-center gap-2 text-red-600 dark:text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{restoreError}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

