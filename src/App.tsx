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
import { ResourceGrid } from './components/resources/ResourceGrid';
import { DocumentHub } from './components/pdf/DocumentHub';

import { SettingsModal } from './components/modals/SettingsModal';
import { AIAssistantModal } from './components/modals/AIAssistantModal';
import { ExportModal } from './components/modals/ExportModal';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { SearchModal } from './components/modals/SearchModal';
import { TemplatesModal } from './components/modals/TemplatesModal';
import { VersionHistoryModal } from './components/modals/VersionHistoryModal';
import { ImportModal } from './components/modals/ImportModal';
import { FileText, Plus } from 'lucide-react';

export const App: React.FC = () => {
  const [currentFilter, setCurrentFilter] = useState<ViewFilter>({ type: 'all' });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('notes');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [stats, setStats] = useState({ words: 0, chars: 0, readingTime: 1 });
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGlobalImportOpen, setIsGlobalImportOpen] = useState(false);

  // Theme hook
  const { theme, setTheme } = useTheme();

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
    createFolder,
    deleteFolder,
    createTag,
    deleteTag,
  } = useNotes(currentFilter, searchQuery, sortField, sortOrder);

  // Initial seed and settings fetch
  useEffect(() => {
    async function init() {
      await seedInitialDataIfNeeded();
      const loadedSettings = await settingsStorage.get();
      setSettings(loadedSettings);
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

  const handleCreateNote = async () => {
    const newNote = await createNote();
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

  const handleSaveSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = await settingsStorage.set(newSettings);
    setSettings(updated);
  };

  const handleTogglePin = async (id: string, current: boolean) => {
    await updateNote(id, { isPinned: !current });
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    await updateNote(id, { isFavorite: !current });
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
        onNewNote={handleCreateNote}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAI={() => setIsAIOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenTemplates={() => setIsTemplatesOpen(true)}
        onOpenImport={() => setIsGlobalImportOpen(true)}
        focusMode={focusMode}
        onToggleFocusMode={() => setFocusMode(!focusMode)}
        theme={theme}
        onCycleTheme={cycleTheme}
      />

      {/* Main Workspace Body */}
      {workspaceView === 'resources' ? (
        <ResourceGrid />
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
          onDeleteFolder={deleteFolder}
          onCreateTag={createTag}
          onDeleteTag={deleteTag}
          onEmptyTrash={emptyTrash}
          sortField={sortField}
          sortOrder={sortOrder}
          onChangeSort={(f, o) => {
            setSortField(f);
            setSortOrder(o);
          }}
          noteListMode={settings.noteListMode}
          sidebarVisibility={settings.sidebarVisibility}
        />

        {/* Center Main Editor View */}
        <main className="flex-1 flex flex-col h-full overflow-hidden">
          {activeNote ? (
            <TipTapEditor
              key={activeNote.id}
              note={activeNote}
              allNotes={notes}
              folders={folders}
              availableTags={tags}
              onUpdateNote={handleUpdateActiveNote}
              onNavigateToNote={(id) => setActiveNoteId(id)}
              editorWidth={settings.editorWidth}
              editorFont={settings.fontFamily}
              editorFontSize={settings.fontSize}
              editorLayout={settings.editorLayout}
              focusMode={focusMode}
              onStatsChange={setStats}
              onOpenTemplates={() => setIsTemplatesOpen(true)}
              onOpenHistory={() => setIsHistoryOpen(true)}
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
                onClick={handleCreateNote}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium rounded-lg text-xs shadow-sm transition flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Note</span>
              </button>
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
        onSetTheme={setTheme}
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
