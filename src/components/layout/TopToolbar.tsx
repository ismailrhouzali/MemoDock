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
  Database,
  LayoutDashboard,
  FileText,
  Files,
  Share2,
  MessageSquareHeart,
  ChevronDown,
  Columns,
  MoreHorizontal,
  EyeOff,
  Eye,
  ZoomIn,
  ZoomOut,
  HelpCircle,
} from 'lucide-react';
import { ThemeMode, WorkspaceView, WorkspaceLayoutPreset } from '../../db/types';

export const FEEDBACK_FORM_URL = 'https://forms.gle/notebook-feedback-placeholder';

interface TopToolbarProps {
  workspaceView: WorkspaceView;
  onSelectWorkspaceView: (view: WorkspaceView) => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onNewNote: () => void;
  onUploadPdf?: () => void;
  onOpenSearch: () => void;
  onOpenAI: () => void;
  onOpenExport: () => void;
  onOpenShare?: () => void;
  onOpenHelp?: () => void;
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
  showDashboard?: boolean;
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  workspaceView,
  onSelectWorkspaceView,
  isSidebarOpen,
  onToggleSidebar,
  onNewNote,
  onUploadPdf,
  onOpenSearch,
  onOpenAI,
  onOpenExport,
  onOpenShare,
  onOpenHelp,
  onOpenSettings,
  onOpenTemplates,
  focusMode,
  onToggleFocusMode,
  theme,
  onCycleTheme,
  layoutPreset = 'minimal',
  onSelectLayoutPreset,
  isSplitWorkspace = false,
  onToggleSplitWorkspace,
  autoHideNavbar = false,
  onToggleAutoHideNavbar,
  showDashboard = false,
}) => {
  const [isNewMenuOpen, setIsNewMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const applyZoom = (level: number) => {
    const clamped = Math.max(50, Math.min(200, level));
    setZoomLevel(clamped);
    const canvas = document.querySelector('.tiptap.ProseMirror') as HTMLElement;
    if (canvas) {
      (canvas.style as any).zoom = clamped === 100 ? '1' : `${clamped / 100}`;
      canvas.style.transform = 'none';
    }
  };

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

          {/* Module Navigation Tabs (Resources & Sheets removed; Databases & optional Dashboard added) */}
          <div className="flex items-center p-0.5 bg-stone-100 dark:bg-zinc-900 border border-stone-200/60 dark:border-zinc-800 rounded-lg text-xs mx-1">
            {showDashboard && (
              <button
                type="button"
                onClick={() => onSelectWorkspaceView('dashboard')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition font-medium ${
                  workspaceView === 'dashboard'
                    ? 'bg-white dark:bg-zinc-800 text-purple-600 dark:text-purple-400 shadow-2xs font-semibold'
                    : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
                title="Dashboard Overview"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard</span>
              </button>
            )}

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
          </div>

          {/* Primary Action Button */}
          <div className="relative" ref={newMenuRef}>
            <div className="flex items-center shadow-xs rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  if (workspaceView === 'documents' && onUploadPdf) onUploadPdf();
                  else onNewNote();
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition active:scale-95"
                title={workspaceView === 'notes' ? 'Create New Note (Ctrl+N)' : 'Create New Item'}
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {workspaceView === 'documents' ? 'PDF' : 'New Note'}
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

          {/* Share Note */}
          {onOpenShare && workspaceView === 'notes' && (
            <button
              type="button"
              onClick={onOpenShare}
              className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
              title="Share Note"
            >
              <Share2 className="w-4 h-4" />
            </button>
          )}

          {/* Help & Getting Started Guide */}
          {onOpenHelp && (
            <button
              type="button"
              onClick={onOpenHelp}
              className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-md transition"
              title="Guide de démarrage & Personnalisation"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}

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

                {/* Zoom Quick Controls */}
                <div className="px-3 py-1.5 flex items-center justify-between text-stone-700 dark:text-zinc-300 hover:bg-stone-50 dark:hover:bg-zinc-800/60 transition">
                  <div className="flex items-center gap-1.5">
                    <ZoomIn className="w-3.5 h-3.5 text-stone-500" />
                    <span>Zoom</span>
                    <span className="font-mono text-[10px] bg-stone-200/60 dark:bg-zinc-800 px-1.5 py-0.2 rounded font-semibold text-stone-600 dark:text-zinc-400">
                      {zoomLevel}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => applyZoom(zoomLevel - 10)}
                      className="p-1 rounded hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 transition"
                      title="Zoom Out (-10%)"
                    >
                      <ZoomOut className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => applyZoom(100)}
                      className="px-1 py-0.5 text-[9px] font-mono rounded hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 transition"
                      title="Reset to 100%"
                    >
                      100%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyZoom(zoomLevel + 10)}
                      className="p-1 rounded hover:bg-stone-200 dark:hover:bg-zinc-700 text-stone-600 dark:text-zinc-300 transition"
                      title="Zoom In (+10%)"
                    >
                      <ZoomIn className="w-3 h-3" />
                    </button>
                  </div>
                </div>

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
