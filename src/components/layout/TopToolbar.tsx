import React, { useState, useRef, useEffect } from 'react';
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
  Bookmark,
  FileText,
  Files,
  FileSpreadsheet,
  MessageSquareHeart,
  ChevronDown,
} from 'lucide-react';
import { ThemeMode, WorkspaceView, WorkspaceLayoutPreset } from '../../db/types';

export const FEEDBACK_FORM_URL = 'https://forms.gle/notebook-feedback-placeholder';

interface TopToolbarProps {
  workspaceView: WorkspaceView;
  onSelectWorkspaceView: (view: WorkspaceView) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewNote: () => void;
  onNewResource?: () => void;
  onUploadPdf?: () => void;
  onNewSpreadsheet?: () => void;
  onOpenSearch: () => void;
  onOpenAI: () => void;
  onOpenExport: () => void;
  onOpenSettings: () => void;
  onOpenTemplates?: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  theme: ThemeMode;
  onCycleTheme: () => void;
  layoutPreset?: WorkspaceLayoutPreset | 'standard';
  onSelectLayoutPreset?: (preset: 'minimal' | 'balanced' | 'complete') => void;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  workspaceView,
  onSelectWorkspaceView,
  isSidebarOpen,
  onToggleSidebar,
  onNewNote,
  onNewResource,
  onUploadPdf,
  onNewSpreadsheet,
  onOpenSearch,
  onOpenAI,
  onOpenExport,
  onOpenSettings,
  onOpenTemplates,
  focusMode,
  onToggleFocusMode,
  theme,
  onCycleTheme,
  layoutPreset = 'balanced',
  onSelectLayoutPreset,
}) => {
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const newMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openInFullTab = () => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    } else {
      window.open(window.location.href, '_blank');
    }
  };

  const normalizedPreset = layoutPreset === 'standard' ? 'balanced' : layoutPreset;

  return (
    <header className="h-12 flex-shrink-0 border-b border-stone-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md px-3 flex items-center justify-between z-30 select-none">
      {/* LEFT: Sidebar Toggle, Brand & Unified Module Switcher */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1.5 text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title={isSidebarOpen ? 'Collapse Sidebar' : 'Expand Sidebar'}
        >
          {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        {/* Brand */}
        <div className="flex items-center gap-1.5 mr-1 cursor-pointer" onClick={() => onSelectWorkspaceView('notes')}>
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="font-bold text-sm tracking-tight text-stone-900 dark:text-stone-100 hidden md:inline">
            MemoDock
          </span>
        </div>

        {/* Unified Module Navigation Tabs */}
        <div className="flex items-center p-0.5 bg-stone-100 dark:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800 rounded-lg text-xs mx-1">
          <button
            type="button"
            onClick={() => onSelectWorkspaceView('notes')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium ${
              workspaceView === 'notes'
                ? 'bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold'
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
                ? 'bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-2xs font-semibold'
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
                ? 'bg-white dark:bg-zinc-800 text-red-600 dark:text-red-400 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="PDF Document Hub"
          >
            <Files className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PDFs</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectWorkspaceView('spreadsheets')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium ${
              workspaceView === 'spreadsheets'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-2xs font-semibold'
                : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
            }`}
            title="Spreadsheets & Datasets (CSV/XLSX)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sheets</span>
          </button>
        </div>

        {/* PROMINENT PRIMARY ACTION BUTTON (+ New Note / + New Item) */}
        <div className="relative" ref={newMenuRef}>
          <div className="flex items-center shadow-xs rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => {
                if (workspaceView === 'notes') onNewNote();
                else if (workspaceView === 'resources' && onNewResource) onNewResource();
                else if (workspaceView === 'documents' && onUploadPdf) onUploadPdf();
                else if (workspaceView === 'spreadsheets' && onNewSpreadsheet) onNewSpreadsheet();
                else onNewNote();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95"
              title={workspaceView === 'notes' ? 'Create New Note (Ctrl+N)' : 'Create New Item'}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>
                {workspaceView === 'notes'
                  ? 'New Note'
                  : workspaceView === 'resources'
                  ? 'Add Resource'
                  : workspaceView === 'documents'
                  ? 'Upload PDF'
                  : 'New Sheet'}
              </span>
            </button>

            {workspaceView === 'notes' && onOpenTemplates && (
              <button
                type="button"
                onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                className="px-1.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white transition border-l border-blue-500/50"
                title="Create from Template"
              >
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
          </div>

          {isNewMenuOpen && (
            <div className="absolute left-0 mt-1 w-48 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-50 text-xs">
              <button
                type="button"
                onClick={() => {
                  onNewNote();
                  setIsNewMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 font-semibold"
              >
                Blank Note (Ctrl+N)
              </button>
              {onOpenTemplates && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenTemplates();
                    setIsNewMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-stone-700 dark:text-zinc-300"
                >
                  <LayoutTemplate className="w-3.5 h-3.5 text-amber-500" />
                  <span>From Template...</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CENTER: OMNIBAR SEARCH */}
      <div className="flex-1 max-w-sm mx-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="w-full flex items-center justify-between px-2.5 py-1 text-xs bg-stone-100/70 hover:bg-stone-200/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-800 text-stone-500 dark:text-zinc-400 rounded-lg border border-stone-200/50 dark:border-zinc-800 transition text-left"
          title="Search notes, resources, spreadsheets (Ctrl+K)"
        >
          <span className="flex items-center gap-1.5 truncate">
            <Search className="w-3.5 h-3.5 text-stone-400" />
            <span className="truncate">Search notes, bookmarks, sheets...</span>
          </span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded text-stone-400">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* RIGHT: Preset Switcher & Global Utilities */}
      <div className="flex items-center gap-1">
        {/* Workspace Mode Presets: Minimal | Balanced | Complete */}
        {onSelectLayoutPreset && (
          <div className="hidden lg:flex items-center p-0.5 bg-stone-100 dark:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800 rounded-lg text-[11px] mr-1">
            <button
              type="button"
              onClick={() => onSelectLayoutPreset('minimal')}
              className={`px-2 py-0.5 rounded-md transition font-medium ${
                normalizedPreset === 'minimal'
                  ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
              title="Minimalist mode (distraction-free)"
            >
              Minimal
            </button>
            <button
              type="button"
              onClick={() => onSelectLayoutPreset('balanced')}
              className={`px-2 py-0.5 rounded-md transition font-medium ${
                normalizedPreset === 'balanced'
                  ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
              title="Balanced mode (recommended daily workflow)"
            >
              Balanced
            </button>
            <button
              type="button"
              onClick={() => onSelectLayoutPreset('complete')}
              className={`px-2 py-0.5 rounded-md transition font-medium ${
                normalizedPreset === 'complete'
                  ? 'bg-white dark:bg-zinc-800 text-stone-900 dark:text-stone-100 shadow-2xs font-semibold'
                  : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
              title="Complete mode (power suite)"
            >
              Complete
            </button>
          </div>
        )}

        {/* AI Assistant */}
        <button
          type="button"
          onClick={onOpenAI}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title="AI Assistant (Ctrl+Shift+A)"
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

        {/* Focus Mode (F11) */}
        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`p-1.5 rounded-md transition ${
            focusMode
              ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
              : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900'
          }`}
          title={focusMode ? 'Exit Focus Mode (F11)' : 'Enter Distraction-Free Focus Mode (F11)'}
        >
          {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={onCycleTheme}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
        >
          {theme === 'light' && <Sun className="w-4 h-4 text-amber-500" />}
          {theme === 'dark' && <Moon className="w-4 h-4 text-blue-400" />}
          {theme === 'system' && <Laptop className="w-4 h-4" />}
        </button>

        {/* Open in full tab */}
        <button
          type="button"
          onClick={openInFullTab}
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title="Open in Dedicated Tab"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Feedback Form */}
        <a
          href={FEEDBACK_FORM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
          title="Send Feedback"
        >
          <MessageSquareHeart className="w-4 h-4 text-amber-600" />
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
