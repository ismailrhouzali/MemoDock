import React, { useState, useEffect, useCallback } from 'react';
import { db, seedInitialDataIfNeeded, settingsStorage, DEFAULT_SETTINGS } from './db/db';
import {
  Note,
  Folder,
  Tag,
  ViewFilter,
  SortField,
  SortOrder,
  AppSettings,
  ThemeMode,
  ThemePreset,
  NoteTemplate,
  NoteVersion,
  WorkspaceView,
} from './db/types';
import { useNotes } from './hooks/useNotes';
import { useAutoSave } from './hooks/useAutoSave';
import { useTheme } from './hooks/useTheme';
import { setupWebClipperSync } from './services/webClipperService';

import { TopToolbar } from './components/layout/TopToolbar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { TipTapEditor } from './components/editor/TipTapEditor';
import { DocumentHub } from './components/pdf/DocumentHub';
import { DashboardView } from './components/dashboard/DashboardView';
import { useLiveQuery } from 'dexie-react-hooks';

import { SettingsModal } from './components/modals/SettingsModal';
import { AIAssistantModal } from './components/modals/AIAssistantModal';
import { ExportModal } from './components/modals/ExportModal';
import { ShareModal } from './components/modals/ShareModal';
import { HelpModal } from './components/modals/HelpModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { SearchModal } from './components/modals/SearchModal';
import { TemplatesModal } from './components/modals/TemplatesModal';
import { VersionHistoryModal } from './components/modals/VersionHistoryModal';
import { ImportModal } from './components/modals/ImportModal';
import { MarkdownLivePreview } from './components/editor/MarkdownLivePreview';
import { FileText, Plus, Columns, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentFilter, setCurrentFilter] = useState<ViewFilter>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('notes');
  const [splitWorkspace, setSplitWorkspace] = useState(false);
  const [splitRightView, setSplitRightView] = useState<'markdown' | WorkspaceView>('markdown');
  const [autoHideNavbar, setAutoHideNavbar] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, readingTime: 1 });
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGlobalImportOpen, setIsGlobalImportOpen] = useState(false);

  // Theme hook
  const { theme, setTheme } = useTheme();
  const databases = useLiveQuery(() => db.databases.toArray(), []) || [];

  // Notes data layer hook
  const {
    notes,
    folders,
    tags,
    counts,
    createNote,
    updateNote,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    emptyTrash,
    duplicateNote,
    reorderNotes,
    createFolder,
    updateFolder,
    deleteFolder,
    reorderFolders,
    createTag,
    deleteTag,
  } = useNotes(currentFilter, searchQuery, sortField, sortOrder);

  // Initial seed and settings fetch
  useEffect(() => {
    async function init() {
      await seedInitialDataIfNeeded();
      const loadedSettings = await settingsStorage.get();
      setSettings(loadedSettings);
      if (loadedSettings.splitWorkspace !== undefined) setSplitWorkspace(loadedSettings.splitWorkspace);
      if (loadedSettings.splitRightView !== undefined) setSplitRightView(loadedSettings.splitRightView);
      if (loadedSettings.autoHideNavbar !== undefined) setAutoHideNavbar(loadedSettings.autoHideNavbar);
    }
    init();

    // Web clipper synchronization
    const cleanupClipper = setupWebClipperSync((newClip) => {
      setActiveNoteId(newClip.id);
    });

    return () => {
      cleanupClipper();
    };
  }, []);

  // Set default active note if none selected
  useEffect(() => {
    if (!activeNoteId && notes.length > 0) {
      setActiveNoteId(notes[0].id);
    } else if (activeNoteId && notes.length > 0) {
      const exists = notes.some((n) => n.id === activeNoteId);
      if (!exists && currentFilter.type !== 'trash') {
        setActiveNoteId(notes[0].id);
      }
    }
  }, [notes, activeNoteId, currentFilter.type]);

  const activeNote = notes.find((n) => n.id === activeNoteId) || null;

  // Debounced auto-save hook
  const handleAutoSave = useCallback(
    async (payload: { id: string; updates: Partial<Note> }) => {
      await updateNote(payload.id, payload.updates);
    },
    [updateNote]
  );

  const { saveStatus, queueSave } = useAutoSave<{ id: string; updates: Partial<Note> }>(
    handleAutoSave,
    settings.autoSaveDelay || 600
  );

  const handleUpdateActiveNote = useCallback(
    (updates: Partial<Note>) => {
      if (!activeNoteId) return;
      queueSave({ id: activeNoteId, updates });
    },
    [activeNoteId, queueSave]
  );

  // Keyboard shortcuts listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K -> Search Omnibar
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      // Ctrl+N -> New Note
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateNote();
      }
      // F11 -> Toggle focus mode
      if (e.key === 'F11') {
        e.preventDefault();
        setFocusMode((prev) => !prev);
      }
      // Escape -> close focus mode or modals
      if (e.key === 'Escape') {
        if (isSearchOpen) setIsSearchOpen(false);
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isAIOpen) setIsAIOpen(false);
        if (isExportOpen) setIsExportOpen(false);
        if (isShortcutsOpen) setIsShortcutsOpen(false);
        if (isTemplatesOpen) setIsTemplatesOpen(false);
        if (isHistoryOpen) setIsHistoryOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isSearchOpen,
    isSettingsOpen,
    isAIOpen,
    isExportOpen,
    isShortcutsOpen,
    isTemplatesOpen,
    isHistoryOpen,
  ]);

  const handleCreateNote = async (initialProps?: Partial<Note>) => {
    const props = initialProps && !('nativeEvent' in (initialProps as unknown as Record<string, unknown>)) ? initialProps : undefined;
    const newNote = await createNote(props);
    setActiveNoteId(newNote.id);
  };

  const handleSelectTemplate = async (template: NoteTemplate) => {
    // If current note is blank/new, populate it; otherwise create a new note
    if (activeNote && (!activeNote.plainText || activeNote.plainText.trim() === '')) {
      await updateNote(activeNote.id, {
        title: template.title,
        content: template.content,
        plainText: template.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
        updatedAt: Date.now(),
      });
    } else {
      const newNote = await createNote({
        title: template.title,
        content: template.content,
      });
      setActiveNoteId(newNote.id);
    }
  };

  const handleRestoreVersion = async (version: NoteVersion) => {
    if (!activeNote) return;
    await updateNote(activeNote.id, {
      title: version.title,
      content: version.content,
      plainText: version.plainText,
      updatedAt: Date.now(),
    });
  };

  const cycleTheme = () => {
    const next: ThemeMode = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system';
    setTheme(next);
  };

  const handleSetTheme = async (newTheme: ThemeMode, newPreset?: ThemePreset, newAccent?: string) => {
    await setTheme(newTheme, newPreset, newAccent);
    setSettings((prev) => ({
      ...prev,
      theme: newTheme,
      ...(newPreset ? { themePreset: newPreset } : {}),
      ...(newAccent ? { accentColor: newAccent } : {}),
    }));
  };

  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await settingsStorage.set(newSettings);
    setSettings(updated);
    if (newSettings.theme || newSettings.themePreset || newSettings.accentColor) {
      await setTheme(newSettings.theme || theme, newSettings.themePreset, newSettings.accentColor);
    }
  };

  const handleSelectLayoutPreset = async (preset: 'minimal' | 'balanced' | 'complete') => {
    const isMin = preset === 'minimal';
    const isComp = preset === 'complete';
    const updated = await settingsStorage.set({
      editorLayout: {
        ...settings.editorLayout,
        mode: preset,
        showToolbar: !isMin,
        showBreadcrumbs: !isMin,
        showTableOfContents: isComp || preset === 'balanced',
        showModifiedDate: isComp,
      },
      noteListMode: isMin ? 'minimal' : 'detailed',
    });
    setSettings(updated);
  };

  const handleTogglePin = async (id: string, current: boolean) => {
    await updateNote(id, { isPinned: !current });
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    await updateNote(id, { isFavorite: !current });
  };

  const handleMoveNoteToFolder = async (noteId: string, folderId: string | null) => {
    await updateNote(noteId, { folderId });
  };

  const handleResizeSidebar = async (newWidth: number) => {
    const updated = await settingsStorage.set({ sidebarWidth: newWidth });
    setSettings(updated);
  };

  const isPopup = typeof window !== 'undefined' && (
    window.location.pathname.includes('popup.html') ||
    document.documentElement.classList.contains('is-popup') ||
    document.body.classList.contains('is-popup')
  );

  return (
    <div className={`flex flex-col h-full w-full overflow-hidden bg-white dark:bg-obsidian-950 text-stone-800 dark:text-stone-200 antialiased font-sans transition-colors duration-150 ${isPopup ? 'min-w-[760px] w-[760px] h-[580px]' : ''}`}>
      {/* Top Minimal Toolbar */}
      <TopToolbar
        workspaceView={workspaceView}
        onSelectWorkspaceView={setWorkspaceView}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        onNewNote={() => handleCreateNote()}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShare={() => setIsShareOpen(true)}
        onOpenHelp={() => setIsHelpOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode(!focusMode)}
        theme={theme}
        onCycleTheme={cycleTheme}
        layoutPreset={settings.editorLayout?.mode || 'minimal'}
        onSelectLayoutPreset={handleSelectLayoutPreset}
        isSplitWorkspace={splitWorkspace}
        onToggleSplitWorkspace={() => {
          const next = !splitWorkspace;
          setSplitWorkspace(next);
          settingsStorage.set({ splitWorkspace: next });
        }}
        autoHideNavbar={autoHideNavbar}
        onToggleAutoHideNavbar={() => {
          const next = !autoHideNavbar;
          setAutoHideNavbar(next);
          settingsStorage.set({ autoHideNavbar: next });
        }}
        showDashboard={!!settings.showDashboard}
      />

      {/* Main Workspace Body */}
      {workspaceView === 'dashboard' && settings.showDashboard ? (
        <DashboardView
          notes={notes}
          folders={folders}
          databases={databases}
          onSelectNote={(n) => setActiveNoteId(n.id)}
          onCreateNote={() => handleCreateNote()}
          onNavigateView={setWorkspaceView}
          onDisableDashboard={async () => {
            await handleSaveSettings({ showDashboard: false });
            setWorkspaceView('notes');
          }}
        />
      ) : workspaceView === 'documents' ? (
        <DocumentHub
          onNavigateToNote={(targetId) => {
            setActiveNoteId(targetId);
            setWorkspaceView('notes');
          }}
        />
      ) : (
        <>
          {/* Main Workspace: Left Sidebar + Center Editor Canvas */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar
          isOpen={isSidebarOpen && !focusMode}
          workspaceView={workspaceView}
          notes={notes}
          folders={folders}
          tags={tags}
          counts={counts}
          activeNoteId={activeNoteId}
          currentFilter={currentFilter}
          onSelectFilter={setCurrentFilter}
          onSelectNote={(n) => setActiveNoteId(n.id)}
          onCreateNote={handleCreateNote}
          onDeleteNote={deleteNote}
          onRestoreNote={restoreNote}
          onPermanentlyDeleteNote={permanentlyDeleteNote}
          onDuplicateNote={async (n) => {
            const copy = await duplicateNote(n);
            setActiveNoteId(copy.id);
          }}
          onTogglePin={handleTogglePin}
          onToggleFavorite={handleToggleFavorite}
          onCreateFolder={createFolder}
          onUpdateFolder={updateFolder}
          onDeleteFolder={deleteFolder}
          onCreateTag={createTag}
          onDeleteTag={deleteTag}
          onEmptyTrash={emptyTrash}
          onMoveNoteToFolder={handleMoveNoteToFolder}
          onUpdateNote={updateNote}
          onReorderNotes={reorderNotes}
          onReorderFolders={reorderFolders}
          sortField={sortField}
          sortOrder={sortOrder}
          onChangeSort={(f, o) => {
            setSortField(f);
            setSortOrder(o);
          }}
          noteListMode={settings.noteListMode}
          sidebarVisibility={settings.sidebarVisibility}
          sidebarWidth={settings.sidebarWidth || 260}
          onResizeSidebar={handleResizeSidebar}
          isMinimalistMode={settings.editorLayout?.mode === 'minimal' || settings.noteListMode === 'minimal'}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Center Main Editor View */}
        <main className={`flex-1 flex ${splitWorkspace && !focusMode ? 'flex-row' : 'flex-col'} h-full overflow-hidden`}>
          {/* Note Editor Pane */}
          <div className={`${splitWorkspace && !focusMode ? 'w-1/2 border-r border-stone-200 dark:border-stone-800' : 'w-full'} flex flex-col h-full overflow-hidden`}>
            {activeNote ? (
              <TipTapEditor
                key={activeNote.id}
                note={activeNote}
                allNotes={notes}
                folders={folders}
                availableTags={tags}
                onUpdateNote={handleUpdateActiveNote}
                onDeleteNote={deleteNote}
                onNavigateToNote={(id) => setActiveNoteId(id)}
                editorWidth={settings.editorWidth}
                editorFont={settings.fontFamily}
                editorFontSize={settings.fontSize}
                editorLayout={settings.editorLayout}
                focusMode={focusMode}
                onToggleFocusMode={() => setFocusMode(!focusMode)}
                isSidebarOpen={isSidebarOpen}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                theme={theme}
                onCycleTheme={cycleTheme}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onStatsChange={setStats}
                onOpenTemplates={() => setIsTemplatesOpen(true)}
                onOpenHistory={() => setIsHistoryOpen(true)}
                onCreateSubPage={async (parentId) => {
                  const sub = await createNote({
                    title: 'Untitled Sub-page',
                    parentNoteId: parentId,
                    folderId: activeNote.folderId,
                  });
                  setActiveNoteId(sub.id);
                }}
                onOpenShare={() => setIsShareOpen(true)}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 dark:text-zinc-600 select-none">
                <FileText className="w-12 h-12 mb-3 stroke-1 opacity-50" />
                <h3 className="text-base font-medium text-stone-700 dark:text-zinc-400 mb-1">
                  No note selected
                </h3>
                <p className="text-xs text-stone-400 dark:text-zinc-500 max-w-sm mb-4 leading-relaxed">
                  Choose a note from the sidebar or start writing a new note.
                </p>
                <button
                  type="button"
                  onClick={() => handleCreateNote()}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium rounded-lg text-xs shadow-sm transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Split Right Reference Pane */}
          {splitWorkspace && !focusMode && (
            <div className="w-1/2 flex flex-col h-full overflow-hidden bg-stone-50 dark:bg-obsidian-900/60 border-l border-stone-200 dark:border-stone-800">
              {/* Header with selector */}
              <div className="h-10 border-b border-stone-200 dark:border-stone-800 px-3 flex items-center justify-between bg-white dark:bg-obsidian-900 select-none shrink-0">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 dark:text-stone-500 mr-2">
                    Volet
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitRightView('markdown');
                      settingsStorage.set({ splitRightView: 'markdown' });
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                      splitRightView === 'markdown'
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    Aperçu Markdown
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSplitRightView('documents');
                      settingsStorage.set({ splitRightView: 'documents' });
                    }}
                    className={`px-2.5 py-1 text-xs rounded-md font-medium transition ${
                      splitRightView === 'documents'
                        ? 'bg-blue-600 text-white font-semibold shadow-xs'
                        : 'text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                    }`}
                  >
                    PDF & Docs
                  </button>
                </div>
                <button
                  type="button"
                  title="Fermer le mode Double Volet"
                  onClick={() => {
                    setSplitWorkspace(false);
                    settingsStorage.set({ splitWorkspace: false });
                  }}
                  className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded hover:bg-stone-100 dark:hover:bg-stone-800 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-hidden">
                {splitRightView === 'markdown' ? (
                  activeNote ? (
                    <MarkdownLivePreview
                      note={activeNote}
                      onClose={() => {
                        setSplitWorkspace(false);
                        settingsStorage.set({ splitWorkspace: false });
                      }}
                      editorFont={settings.fontFamily}
                      editorFontSize={settings.fontSize}
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 dark:text-zinc-600 select-none h-full">
                      <FileText className="w-10 h-10 mb-2 opacity-40" />
                      <p className="text-xs">Sélectionnez une note pour afficher l'aperçu Markdown.</p>
                    </div>
                  )
                ) : (
                  <DocumentHub
                    onNavigateToNote={(targetId) => {
                      setActiveNoteId(targetId);
                    }}
                  />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        words={stats.words}
        chars={stats.chars}
        readingTime={stats.readingTime}
        saveStatus={saveStatus}
        focusMode={focusMode}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />
    </>
  )}

      {/* Omnibar Search Modal (Ctrl+K) */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        notes={notes}
        folders={folders}
        onSelectNote={(n) => setActiveNoteId(n.id)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        currentTheme={theme}
        onSetTheme={handleSetTheme}
        onEmptyTrash={emptyTrash}
      />

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onSelectTemplate={handleSelectTemplate}
        activeNote={activeNote}
      />

      {/* Version History Modal */}
      {activeNote && (
        <VersionHistoryModal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          activeNote={activeNote}
          onRestoreVersion={handleRestoreVersion}
        />
      )}

      {/* AI Assistant Modal */}
      {activeNote && (
        <AIAssistantModal
          isOpen={isAIOpen}
          onClose={() => setIsAIOpen(false)}
          activeNote={activeNote}
          settings={settings}
          onInsertContent={(content) => {
            const currentContent = activeNote.content || '';
            handleUpdateActiveNote({
              content: currentContent + content,
              updatedAt: Date.now(),
            });
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* Export & Backup Modal */}
      {activeNote && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          activeNote={activeNote}
        />
      )}

      {/* Share Note Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        note={activeNote}
      />

      {/* Getting Started & Personalization Help Guide */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Shortcuts Modal */}
      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Global Import Modal */}
      <ImportModal
        isOpen={isGlobalImportOpen}
        onClose={() => setIsGlobalImportOpen(false)}
        noteId={activeNote?.id || 'new-import'}
        onInsertHtml={async (html) => {
          if (activeNote) {
            handleUpdateActiveNote({
              content: (activeNote.content || '') + '\n\n' + html,
              updatedAt: Date.now(),
            });
          } else {
            const newNote = await createNote({
              title: 'Imported Document',
              content: html,
            });
            setActiveNoteId(newNote.id);
          }
        }}
      />
    </div>
  );
};
