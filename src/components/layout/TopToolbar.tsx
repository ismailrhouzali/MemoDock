import React from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Sparkles,
  Download,
  Settings as SettingsIcon,
  Sun,
  Moon,
  Laptop,
  Maximize2,
  Minimize2,
  ExternalLink,
  BookOpen,
  LayoutTemplate,
  Upload,
  Bookmark,
  FileText,
  Files,
  MessageSquareHeart,
} from 'lucide-react';
import { ThemeMode, WorkspaceView } from '../../db/types';

export const FEEDBACK_FORM_URL = 'https://forms.gle/notebook-feedback-placeholder';

interface TopToolbarProps {
  workspaceView: WorkspaceView;
  onSelectWorkspaceView: (view: WorkspaceView) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewNote: () => void;
  onOpenSearch: () => void;
  onOpenAI: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenTemplates?: () => void;
  onOpenImport?: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  theme: ThemeMode;
  onCycleTheme: () => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  workspaceView,
  onSelectWorkspaceView,
  isSidebarOpen,
  onToggleSidebar,
  onNewNote,
  onOpenSearch,
  onOpenAI,
  onOpenExport,
  onOpenSettings,
  onOpenTemplates,
  onOpenImport,
  focusMode,
  onToggleFocusMode,
  theme,
  onCycleTheme,
}) => {
  const openInFullTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  return (
    <header className="h-12 flex-shrink-0 border-b border-stone-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md px-3 flex items-center justify-between z-30 select-none">
      {/* Left section: Sidebar toggle, Logo, New Note, Templates */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        {/* Brand / Logo */}
        <div className="flex items-center gap-2 mr-1">
          <div className="w-6 h-6 rounded bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-white dark:text-stone-900 font-bold text-xs shadow-sm">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-stone-900 dark:text-stone-100 hidden sm:inline">
            MemoDock
          </span>
        </div>

        {/* Workspace Switcher Segment */}
        <div className="flex items-center p-0.5 bg-stone-100 dark:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800 rounded-lg text-xs mx-1">
          <button
            type="button"
            onClick={() => onSelectWorkspaceView('notes')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium ${
              workspaceView === 'notes'
                ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-stone-100 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Notes Workspace"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Notes</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectWorkspaceView('resources')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium ${
              workspaceView === 'resources'
                ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Resource & Bookmark Library"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Resources</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectWorkspaceView('documents')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium ${
              workspaceView === 'documents'
                ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-sm'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="PDF & Document Hub"
          >
            <Files className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDFs</span>
          </button>
        </div>

        {/* New Note Button (only when notes view active) */}
        {workspaceView === 'notes' && (
          <button
            type="button"
            onClick={onNewNote}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-md shadow-sm transition active:scale-95"
            title="Create New Note (Ctrl+N)"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Note</span>
          </button>
        )}

        {/* Templates Button */}
        {onOpenTemplates && (
          <button
            type="button"
            onClick={onOpenTemplates}
            className="flex items-center gap-1 px-2 py-1 text-xs text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
            title="Choose from Document Templates"
          >
            <LayoutTemplate className="w-3.5 h-3.5 text-amber-600 dark:text-amber-500" />
            <span className="hidden lg:inline text-[11px]">Templates</span>
          </button>
        )}

        {/* Smart Import Button */}
        {onOpenImport && (
          <button
            type="button"
            onClick={onOpenImport}
            className="flex items-center gap-1 px-2 py-1 text-xs text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-md transition font-medium"
            title="Smart Import (.md, .docx, .pdf, .html, .txt)"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden lg:inline text-[11px]">Import</span>
          </button>
        )}
      </div>

      {/* Center section: Omnibar search button */}
      <div className="flex-1 max-w-sm mx-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-2.5 py-1 text-xs bg-stone-100/70 hover:bg-stone-200/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-800 text-stone-500 dark:text-zinc-400 rounded-md border border-stone-200/50 dark:border-zinc-800 transition text-left"
          title="Search notes (Ctrl+K)"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Search className="w-3.5 h-3.5" />
            <span className="truncate">Search notes, tags, contents...</span>
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded text-stone-400">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Right section: AI, Export, Theme, Fullscreen, Settings */}
      <div className="flex items-center gap-1">
        {/* AI Assistant */}
        <button
          type="button"
          onClick={onOpenAI}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title="AI Assistant (Summarize, rewrite, ideate)"
        >
          <Sparkles className="w-4 h-4" />
        </button>

        {/* Export / Backup */}
        <button
          type="button"
          onClick={onOpenExport}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title="Export notes & backups (PDF, Markdown, HTML, JSON)"
        >
          <Download className="w-4 h-4" />
        </button>

        {/* Focus Mode */}
        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`p-1.5 rounded-md transition ${
            focusMode
              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 font-semibold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900'
          }`}
          title={focusMode ? 'Exit Focus Mode (F11)' : 'Enter Distraction-Free Focus Mode (F11)'}
        >
          {focusMode ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={onCycleTheme}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title={`Current Theme: ${theme.toUpperCase()} (Click to toggle)`}
        >
          {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
          {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
          {theme === 'system' && <Laptop className="w-4 h-4" />}
        </button>

        {/* Open in full tab if in extension popup / sidepanel */}
        <button
          type="button"
          onClick={openInFullTab}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title="Open in Full Tab (Ctrl+Shift+K)"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Feedback & Suggestions */}
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title="Share Feedback & Suggestions (Google Form)"
        >
          <MessageSquareHeart className="w-4 h-4 text-amber-600 dark:text-amber-500" />
        </a>

        {/* Settings */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title="Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
