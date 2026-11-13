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
  Columns,
  MoreHorizontal,
  EyeOff,
  Eye,
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
  isSplitWorkspace?: boolean;
  onToggleSplitWorkspace?: () => void;
  autoHideNavbar?: boolean;
  onToggleAutoHideNavbar?: () => void;
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
  isSplitWorkspace = false,
  onToggleSplitWorkspace,
  autoHideNavbar = false,
  onToggleAutoHideNavbar,
}) => {
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const newMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setIsNewMenuOpen(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
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

  const headerClass = autoHideNavbar
    ? `fixed top-0 left-0 right-0 z-40 transition-transform duration-200 ${
        isHovered ? 'translate-y-0 shadow-float' : '-translate-y-full'
      }`
    : 'h-12 flex-shrink-0 z-30';

  return (
    <>
      {/* Invisible Hover Zone when autoHideNavbar is enabled */}
      {autoHideNavbar && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          className="fixed top-0 left-0 right-0 h-3 z-50 cursor-pointer"
          title="Hover to show navigation bar"
        />
      )}

      <header
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`${headerClass} border-b border-stone-200/80 dark:border-zinc-800/80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md px-3 flex items-center justify-between select-none h-12`}
      >
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
          <div
            className="flex items-center gap-1.5 mr-1 cursor-pointer"
            onClick={() => onSelectWorkspaceView('notes')}
          >
            <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm tracking-tight text-stone-900 dark:text-stone-100 hidden md:inline">
              MemoDock
            </span>
          </div>

          {/* Module Navigation Tabs */}
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
              title="Resource Library"
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
              title="PDF Hub"
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
              title="Spreadsheets (CSV/XLSX)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sheets</span>
            </button>
          </div>

          {/* Primary Action Button */}
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
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95"
                title={workspaceView === 'notes' ? 'Create New Note (Ctrl+N)' : 'Create New Item'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {workspaceView === 'notes'
                    ? 'New Note'
                    : workspaceView === 'resources'
                    ? 'Resource'
                    : workspaceView === 'documents'
                    ? 'PDF'
                    : 'Sheet'}
                </span>
              </button>

              {workspaceView === 'notes' && onOpenTemplates && (
                <button
                  type="button"
                  onClick={() => setIsNewMenuOpen(!isNewMenuOpen)}
                  className="px-1 py-1 bg-blue-700 hover:bg-blue-800 text-white transition border-l border-blue-500/50"
                  title="Choose Template"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              )}
            </div>

            {isNewMenuOpen && (
              <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
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

        {/* CENTER: SEARCH OMNIBAR */}
        <div className="flex-1 max-w-xs mx-2">
          <button
            type="button"
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-2.5 py-1 text-xs bg-stone-100/70 hover:bg-stone-200/50 dark:bg-zinc-900/70 dark:hover:bg-zinc-800 text-stone-500 dark:text-zinc-400 rounded-lg border border-stone-200/50 dark:border-zinc-800 transition text-left"
            title="Search notes and resources (Ctrl+K)"
          >
            <span className="flex items-center gap-1.5 truncate">
              <Search className="w-3.5 h-3.5 text-stone-400" />
              <span className="truncate">Search notes, sheets...</span>
            </span>
            <kbd className="hidden sm:inline-block px-1 py-0.5 text-[9px] font-mono bg-white dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded text-stone-400">
              Ctrl+K
            </kbd>
          </button>
        </div>

        {/* RIGHT: STREAMLINED ACTIONS */}
        <div className="flex items-center gap-1">
          {/* Split Workspace Toggle */}
          {onToggleSplitWorkspace && (
            <button
              type="button"
              onClick={onToggleSplitWorkspace}
              className={`p-1.5 rounded-md transition ${
                isSplitWorkspace
                  ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900'
              }`}
              title={isSplitWorkspace ? 'Close Split Workspace' : 'Open Split Workspace (Side-by-Side)'}
            >
              <Columns className="w-4 h-4" />
            </button>
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

          {/* Focus Mode (F11) */}
          <button
            type="button"
            onClick={onToggleFocusMode}
            className={`p-1.5 rounded-md transition ${
              focusMode
                ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold'
                : 'text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900'
            }`}
            title={focusMode ? 'Exit Focus Mode (F11)' : 'Focus Mode (F11)'}
          >
            {focusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Settings Modal */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
            title="Settings & Preferences"
          >
            <SettingsIcon className="w-4 h-4" />
          </button>

          {/* MORE UTILITIES DROPDOWN MENU */}
          <div className="relative" ref={moreMenuRef}>
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
              title="More Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                {/* Presets */}
                {onSelectLayoutPreset && (
                  <div className="px-2 py-1.5 border-b border-stone-100 dark:border-zinc-800">
                    <span className="text-[10px] uppercase font-semibold text-stone-400 px-1 mb-1 block">
                      Workspace Preset
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {(['minimal', 'balanced', 'complete'] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            onSelectLayoutPreset(p);
                            setIsMoreMenuOpen(false);
                          }}
                          className={`py-1 rounded text-[10px] capitalize text-center font-medium ${
                            normalizedPreset === p
                              ? 'bg-blue-600 text-white font-bold'
                              : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-300'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Auto-Hide Navbar Toggle */}
                {onToggleAutoHideNavbar && (
                  <button
                    type="button"
                    onClick={() => {
                      onToggleAutoHideNavbar();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-stone-700 dark:text-zinc-300"
                  >
                    {autoHideNavbar ? (
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                    )}
                    <span>{autoHideNavbar ? 'Pin Navbar' : 'Auto-Hide Navbar'}</span>
                  </button>
                )}

                {/* Theme Cycle */}
                <button
                  type="button"
                  onClick={() => {
                    onCycleTheme();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-stone-700 dark:text-zinc-300"
                >
                  {theme === 'light' ? (
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                  ) : theme === 'dark' ? (
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <Laptop className="w-3.5 h-3.5" />
                  )}
                  <span>Theme: {theme.toUpperCase()}</span>
                </button>

                {/* Export */}
                <button
                  type="button"
                  onClick={() => {
                    onOpenExport();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-stone-700 dark:text-zinc-300"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export & Backup</span>
                </button>

                {/* Open in full tab */}
                <button
                  type="button"
                  onClick={() => {
                    openInFullTab();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-stone-700 dark:text-zinc-300"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Dedicated Tab</span>
                </button>

                {/* Feedback */}
                <a
                  href={FEEDBACK_FORM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 flex items-center gap-2 text-amber-600 dark:text-amber-400"
                >
                  <MessageSquareHeart className="w-3.5 h-3.5" />
                  <span>Send Feedback</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
