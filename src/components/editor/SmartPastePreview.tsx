import React, { useEffect } from 'react';
import { Sparkles, Table, Sigma, Code2, Heading, X, RotateCcw } from 'lucide-react';
import { ImportStats } from '../../services/importEngine/smartImportEngine';

interface SmartPastePreviewProps {
  detectedSource: string;
  stats: ImportStats;
  onPastePlainText: () => void;
  onUndo: () => void;
  onDismiss: () => void;
}

export const SmartPastePreview: React.FC<SmartPastePreviewProps> = ({
  detectedSource,
  stats,
  onPastePlainText,
  onUndo,
  onDismiss,
}) => {
  // Auto-dismiss after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-12 right-6 z-40 max-w-md bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float p-3 text-xs animate-in slide-in-from-bottom-3 duration-200 select-none">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-1.5 font-semibold text-stone-900 dark:text-stone-100">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
          <span>Smart Paste: {detectedSource}</span>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 p-0.5 rounded"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Structural Stats Chips */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-[11px] text-stone-600 dark:text-zinc-300">
        {stats.headingsCount > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800">
            <Heading className="w-3 h-3 text-amber-600" />
            <span>{stats.headingsCount} Headings</span>
          </span>
        )}
        {stats.mathCount > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800">
            <Sigma className="w-3 h-3 text-purple-600" />
            <span>{stats.mathCount} Formulas</span>
          </span>
        )}
        {stats.tablesCount > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800">
            <Table className="w-3 h-3 text-blue-600" />
            <span>{stats.tablesCount} Table</span>
          </span>
        )}
        {stats.codeCount > 0 && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800">
            <Code2 className="w-3 h-3 text-emerald-600" />
            <span>{stats.codeCount} Code Block</span>
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-zinc-800/80 text-[11px]">
        <button
          type="button"
          onClick={onPastePlainText}
          className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:underline"
        >
          Paste as Plain Text
        </button>

        <button
          type="button"
          onClick={onUndo}
          className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-medium hover:underline"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Undo paste</span>
        </button>
      </div>
    </div>
  );
};

