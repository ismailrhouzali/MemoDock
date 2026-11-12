import React from 'react';
import {
  Check,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Clock,
  FileText,
} from 'lucide-react';
import { SaveStatus } from '../../hooks/useAutoSave';

interface StatusBarProps {
  words: number;
  chars: number;
  readingTime: number;
  saveStatus: SaveStatus;
  focusMode: boolean;
  onOpenShortcuts: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  words,
  chars,
  readingTime,
  saveStatus,
  focusMode,
  onOpenShortcuts,
}) => {
  // If in focus mode, we can keep the status bar hidden or super minimal
  if (focusMode) return null;

  return (
    <footer className="h-7 flex-shrink-0 border-t border-stone-200/60 dark:border-zinc-800/60 bg-stone-50/80 dark:bg-zinc-950/80 backdrop-blur-sm px-4 flex items-center justify-between text-[11px] text-stone-500 dark:text-zinc-400 select-none z-20">
      {/* Left side: Word count, character count, read time */}
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <FileText className="w-3 h-3 text-stone-400" />
          <span>{words} words</span>
        </span>
        <span className="text-stone-300 dark:text-zinc-700">·</span>
        <span>{chars} characters</span>
        <span className="text-stone-300 dark:text-zinc-700">·</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-stone-400" />
          <span>{readingTime} min read</span>
        </span>
      </div>

      {/* Right side: Save indicator & Shortcuts */}
      <div className="flex items-center gap-3">
        {/* Save Status */}
        <div className="flex items-center gap-1 font-medium">
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-stone-400 dark:text-zinc-500">
              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-500" />
              <span>Saved locally</span>
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="flex items-center gap-1 text-stone-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved changes</span>
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertCircle className="w-3 h-3" />
              <span>Storage Error</span>
            </span>
          )}
        </div>

        <span className="text-stone-300 dark:text-zinc-700">·</span>

        {/* Shortcuts Cheat Sheet Button */}
        <button
          type="button"
          onClick={onOpenShortcuts}
          className="flex items-center gap-1 hover:text-stone-800 dark:hover:text-stone-200 transition"
          title="Keyboard Shortcuts & Markdown Reference"
        >
          <HelpCircle className="w-3 h-3" />
          <span>Shortcuts</span>
        </button>
      </div>
    </footer>
  );
};

