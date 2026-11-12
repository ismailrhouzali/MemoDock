import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { Note, NoteVersion } from '../../db/types';
import {
  History,
  X,
  RotateCcw,
  Clock,
  Eye,
  Trash2,
  FileCheck,
} from 'lucide-react';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeNote: Note;
  onRestoreVersion: (version: NoteVersion) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  onClose,
  activeNote,
  onRestoreVersion,
}) => {
  const versions =
    useLiveQuery(
      async () =>
        db.noteVersions
          .where('noteId')
          .equals(activeNote.id)
          .reverse()
          .sortBy('createdAt'),
      [activeNote.id]
    ) || [];

  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedVersion =
    versions.find((v) => v.id === selectedVersionId) || versions[0] || null;

  const handleClearHistory = async () => {
    if (window.confirm('Delete all version snapshots for this note?')) {
      const allForNote = await db.noteVersions.where('noteId').equals(activeNote.id).toArray();
      await db.noteVersions.bulkDelete(allForNote.map((v) => v.id));
      setSelectedVersionId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden flex flex-col z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-stone-100">
            <History className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span>Version History: {activeNote.title}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Split View (Timeline on left, Preview on right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[420px] max-h-[500px]">
          
          {/* Left: Versions list (5 cols) */}
          <div className="md:col-span-5 border-r border-stone-200/60 dark:border-zinc-800/60 p-3 overflow-y-auto space-y-1.5 bg-stone-50/50 dark:bg-zinc-950/50">
            <div className="flex items-center justify-between mb-2 pb-1 border-b border-stone-200/50 dark:border-zinc-800/50 text-[11px] text-stone-400">
              <span>{versions.length} snapshot{versions.length === 1 ? '' : 's'} saved</span>
              {versions.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="hover:text-red-500 transition text-[10px]"
                >
                  Clear History
                </button>
              )}
            </div>

            {versions.length === 0 ? (
              <div className="p-8 text-center text-stone-400 dark:text-zinc-500 text-xs">
                No past versions recorded yet. Versions are automatically captured as you write.
              </div>
            ) : (
              versions.map((ver, idx) => {
                const isSelected = selectedVersion?.id === ver.id;
                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className={`p-2.5 rounded-lg cursor-pointer transition ${
                      isSelected
                        ? 'bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-stone-900 dark:text-stone-100 font-medium'
                        : 'hover:bg-stone-100 dark:hover:bg-zinc-900 border border-transparent text-stone-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-semibold text-xs truncate">
                        {idx === 0 ? 'Latest Snapshot' : `Version #${versions.length - idx}`}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(ver.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span>{new Date(ver.createdAt).toLocaleDateString()}</span>
                      <span>{ver.plainText.length} chars</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right: Version Preview (7 cols) */}
          <div className="md:col-span-7 p-5 flex flex-col justify-between overflow-y-auto">
            {selectedVersion ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 dark:border-zinc-800/60">
                  <div>
                    <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100">
                      {selectedVersion.title}
                    </h3>
                    <p className="text-[10px] text-stone-400">
                      Saved on {new Date(selectedVersion.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onRestoreVersion(selectedVersion);
                      onClose();
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-xs transition flex items-center gap-1.5 active:scale-95"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Version</span>
                  </button>
                </div>

                {/* Content preview */}
                <div
                  className="prose dark:prose-invert max-w-none text-xs overflow-y-auto max-h-[340px] p-3 rounded-lg border border-stone-200/50 dark:border-zinc-800 bg-stone-50/30 dark:bg-zinc-950/30"
                  dangerouslySetInnerHTML={{ __html: selectedVersion.content }}
                />
              </div>
            ) : (
              <div className="p-12 text-center text-stone-400">
                Select a version to preview its contents.
              </div>
            )}
          </div>
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
