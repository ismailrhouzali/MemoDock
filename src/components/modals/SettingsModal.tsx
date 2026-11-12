import React, { useState } from 'react';
import {
  X,
  Sliders,
  Palette,
  Sparkles,
  ShieldCheck,
  Eye,
  EyeOff,
  Check,
  Folder,
  Cloud,
  HardDrive,
  Layout,
  List,
  Type,
  RefreshCw,
  FolderOpen,
  FileText,
  AlertCircle,
  ExternalLink,
  Feather,
  Key,
} from 'lucide-react';
import {
  AppSettings,
  ThemeMode,
  EditorWidth,
  EditorFont,
  EditorFontSize,
  NoteListDisplayMode,
  SidebarMode,
  StorageMode,
} from '../../db/types';
import { storageManager } from '../../services/storage/storageManager';
import { googleDriveService } from '../../services/googleDriveService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  currentTheme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
}

type TabKey = 'general' | 'notelist' | 'sidebar' | 'editor' | 'storage' | 'gdrive' | 'ai';

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentTheme,
  onSetTheme,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('general');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showApiKey, setShowApiKey] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);
  const [isSyncingLocal, setIsSyncingLocal] = useState(false);
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [customDriveToken, setCustomDriveToken] = useState('');
  const [showCustomTokenInput, setShowCustomTokenInput] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSave = async (updated?: Partial<AppSettings>) => {
    const toSave = updated ? { ...localSettings, ...updated } : localSettings;
    await onSaveSettings(toSave);
    if (toSave.theme !== currentTheme) {
      onSetTheme(toSave.theme);
    }
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 600);
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handlePickLocalFolder = async () => {
    try {
      setSyncStatusMsg('Selecting local folder...');
      const { folderName } = await storageManager.pickCustomLocalFolder();
      setLocalSettings((prev) => ({
        ...prev,
        storageMode: 'local_folder',
        localStorageFolder: {
          ...prev.localStorageFolder,
          folderName,
          permissionStatus: 'granted',
          lastSyncTimestamp: Date.now(),
        },
      }));
      setSyncStatusMsg(`Folder "${folderName}" connected successfully.`);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setSyncStatusMsg(`Error selecting folder: ${err.message || 'Cancelled'}`);
      }
    }
  };

  const handleSyncToLocalFolder = async () => {
    setIsSyncingLocal(true);
    setSyncStatusMsg('Writing markdown notes and metadata to local folder...');
    const result = await storageManager.syncToLocalFolder();
    setIsSyncingLocal(false);
    if (result.success) {
      setSyncStatusMsg(`Synced ${result.notesWritten} notes to folder!`);
      setLocalSettings((prev) => ({
        ...prev,
        localStorageFolder: {
          ...prev.localStorageFolder,
          lastSyncTimestamp: Date.now(),
          syncStatus: 'success',
        },
      }));
    } else {
      setSyncStatusMsg(`Sync error: ${result.error || 'Failed'}`);
    }
  };

  const handleConnectDrive = async () => {
    try {
      setIsSyncingDrive(true);
      setSyncStatusMsg('Connecting to Google Drive...');
      const { email } = await googleDriveService.connectAccount(true, customDriveToken);
      setIsSyncingDrive(false);
      setLocalSettings((prev) => ({
        ...prev,
        googleDrive: {
          ...prev.googleDrive,
          isConnected: true,
          userEmail: email || 'connected@gmail.com',
          syncStatus: 'idle',
        },
      }));
      setSyncStatusMsg(`Google Drive connected (${email || 'Google User'})`);
    } catch (err: any) {
      setIsSyncingDrive(false);
      setSyncStatusMsg(`Drive connection: ${err.message || 'Cancelled'}`);
    }
  };

  const handleDisconnectDrive = async () => {
    await googleDriveService.disconnectAccount();
    setLocalSettings((prev) => ({
      ...prev,
      googleDrive: {
        ...prev.googleDrive,
        isConnected: false,
        userEmail: null,
      },
    }));
    setSyncStatusMsg('Google Drive disconnected.');
  };

  const handleSyncDriveNow = async () => {
    setIsSyncingDrive(true);
    setSyncStatusMsg('Syncing notes with Google Drive...');
    const res = await googleDriveService.syncWithDrive();
    setIsSyncingDrive(false);
    if (res.success) {
      setSyncStatusMsg(`Successfully synced ${res.uploadedCount} notes to Google Drive.`);
      setLocalSettings((prev) => ({
        ...prev,
        googleDrive: {
          ...prev.googleDrive,
          lastSyncTimestamp: Date.now(),
          syncStatus: 'success',
        },
      }));
    } else {
      setSyncStatusMsg(`Google Drive error: ${res.error || 'Sync failed'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden flex flex-col z-10 text-xs max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-stone-100">
            <Sliders className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span>Preferences & Settings</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200/60 dark:border-zinc-800/60 px-5 gap-1 bg-stone-50/30 dark:bg-zinc-950/30 overflow-x-auto select-none">
          {[
            { id: 'general', label: 'General', icon: Sliders },
            { id: 'notelist', label: 'Note List', icon: List },
            { id: 'sidebar', label: 'Sidebar', icon: Layout },
            { id: 'editor', label: 'Editor & TOC', icon: Type },
            { id: 'storage', label: 'Local Storage', icon: HardDrive },
            { id: 'gdrive', label: 'Google Drive', icon: Cloud },
            { id: 'ai', label: 'AI Assistant', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`py-2.5 px-2.5 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isActive
                    ? 'border-amber-600 text-stone-900 dark:text-stone-100 font-semibold'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Notification Banner */}
        {syncStatusMsg && (
          <div className="px-5 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-b border-amber-200 dark:border-amber-800/60 text-[11px] flex items-center justify-between">
            <span className="truncate">{syncStatusMsg}</span>
            <button
              type="button"
              onClick={() => setSyncStatusMsg(null)}
              className="text-amber-600 dark:text-amber-400 font-bold ml-2 hover:underline"
            >
              ×
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 max-h-[60vh]">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Appearance Theme
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => updateSetting('theme', mode)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium capitalize transition flex items-center justify-center gap-2 ${
                        localSettings.theme === mode
                          ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 shadow-sm'
                          : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/50 text-stone-600 dark:text-zinc-400'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4">
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Auto-Save Delay
                </label>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mb-2">
                  Time to wait after typing stops before automatically saving notes to IndexedDB.
                </p>
                <select
                  value={localSettings.autoSaveDelay}
                  onChange={(e) => updateSetting('autoSaveDelay', Number(e.target.value))}
                  className="w-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value={300}>Instant (300 ms)</option>
                  <option value={600}>Balanced (600 ms) — Recommended</option>
                  <option value={1200}>Relaxed (1.2 seconds)</option>
                  <option value={3000}>Periodic (3 seconds)</option>
                </select>
              </div>

              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.spellCheck}
                    onChange={(e) => updateSetting('spellCheck', e.target.checked)}
                    className="accent-amber-600 rounded"
                  />
                  <span className="text-stone-700 dark:text-stone-300 font-medium">
                    Enable browser spellcheck in editor
                  </span>
                </label>
              </div>

              {/* Feedback and Community */}
              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4">
                <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 rounded-xl flex items-center justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-xs text-amber-900 dark:text-amber-200">
                      Feedback & Feature Suggestions
                    </h4>
                    <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                      Help us improve MemoDock. Report bugs or suggest new features via Google Forms.
                    </p>
                  </div>
                  <a
                    href="https://forms.gle/notebook-feedback-placeholder"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition flex-shrink-0"
                  >
                    <span>Send Feedback</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: NOTE LIST DISPLAY */}
          {activeTab === 'notelist' && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Note List Display Mode
                </label>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mb-3">
                  Customize the density and minimalist feel of the notes list in the sidebar.
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'detailed' as NoteListDisplayMode,
                      title: 'Detailed',
                      desc: 'Title, timestamp, text snippet, and tags',
                    },
                    {
                      id: 'compact' as NoteListDisplayMode,
                      title: 'Compact',
                      desc: 'Title, relative date, and folder badge',
                    },
                    {
                      id: 'minimal' as NoteListDisplayMode,
                      title: 'Minimalist',
                      desc: 'Clean title only with subtle active indicator',
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateSetting('noteListMode', mode.id)}
                      className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                        localSettings.noteListMode === mode.id
                          ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-1 ring-amber-600'
                          : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/40 text-stone-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1 flex items-center justify-between">
                        <span>{mode.title}</span>
                        {localSettings.noteListMode === mode.id && (
                          <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500 leading-tight">
                        {mode.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIDEBAR VISIBILITY */}
          {activeTab === 'sidebar' && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Sidebar Layout Mode
                </label>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mb-3">
                  Choose how the left sidebar appears when expanded.
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'full' as SidebarMode, label: 'Full Sidebar' },
                    { id: 'compact' as SidebarMode, label: 'Compact Width' },
                    { id: 'icons' as SidebarMode, label: 'Icons Only' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          sidebarVisibility: { ...prev.sidebarVisibility, mode: mode.id },
                        }))
                      }
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition ${
                        localSettings.sidebarVisibility.mode === mode.id
                          ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                          : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/50 text-stone-600 dark:text-zinc-400'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4">
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-2">
                  Visible Sidebar Sections
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'showAll', label: 'All Notes' },
                    { key: 'showFavorites', label: 'Favorites' },
                    { key: 'showRecents', label: 'Recent Notes' },
                    { key: 'showArchived', label: 'Archived Notes' },
                    { key: 'showTrash', label: 'Trash' },
                    { key: 'showFolders', label: 'Folders Section' },
                    { key: 'showTags', label: 'Tags Section' },
                  ].map((section) => (
                    <label
                      key={section.key}
                      className="flex items-center gap-2 p-2 rounded border border-stone-100 dark:border-zinc-800/60 hover:bg-stone-50 dark:hover:bg-zinc-800/30 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={
                          (localSettings.sidebarVisibility as any)[section.key] !== false
                        }
                        onChange={(e) => {
                          const val = e.target.checked;
                          setLocalSettings((prev) => ({
                            ...prev,
                            sidebarVisibility: {
                              ...prev.sidebarVisibility,
                              [section.key]: val,
                            },
                          }));
                        }}
                        className="accent-amber-600 rounded"
                      />
                      <span className="text-stone-700 dark:text-zinc-300">{section.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EDITOR LAYOUT & TABLE OF CONTENTS */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              {/* Workspace Experience Mode Preset */}
              <div className="p-3.5 bg-stone-50 dark:bg-zinc-950/60 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-2">
                <label className="block font-bold text-xs text-stone-900 dark:text-stone-100">
                  Workspace Experience Mode
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings((prev) => ({
                        ...prev,
                        editorLayout: {
                          ...prev.editorLayout,
                          mode: 'minimal',
                          showToolbar: false,
                          showBreadcrumbs: false,
                          showModifiedDate: false,
                          showTableOfContents: false,
                        },
                      }));
                    }}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                      localSettings.editorLayout.mode === 'minimal'
                        ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                        : 'border-stone-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800/60 text-stone-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5 mb-1">
                      <Feather className="w-3.5 h-3.5 text-amber-600" />
                      <span>Minimalist (Distraction-Free)</span>
                    </div>
                    <p className="text-[10px] leading-tight opacity-80">
                      Pure digital paper. Hides formatting bars, headers and distractions. Maximize writing focus.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings((prev) => ({
                        ...prev,
                        editorLayout: {
                          ...prev.editorLayout,
                          mode: 'standard',
                          showToolbar: true,
                          showBreadcrumbs: true,
                          showModifiedDate: true,
                          showTableOfContents: true,
                        },
                      }));
                    }}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                      localSettings.editorLayout.mode === 'standard'
                        ? 'border-amber-600 bg-amber-50/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-sm'
                        : 'border-stone-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800/60 text-stone-600 dark:text-zinc-400'
                    }`}
                  >
                    <div className="font-semibold text-xs flex items-center gap-1.5 mb-1">
                      <Layout className="w-3.5 h-3.5 text-amber-600" />
                      <span>Complete Workspace</span>
                    </div>
                    <p className="text-[10px] leading-tight opacity-80">
                      Full productivity suite with rich toolbar, outline TOC, metadata headers, and quick tools.
                    </p>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Typography & Reading Experience
                </label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div>
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400 block mb-1">
                      Font Family
                    </span>
                    <select
                      value={localSettings.fontFamily}
                      onChange={(e) => updateSetting('fontFamily', e.target.value as EditorFont)}
                      className="w-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 dark:text-zinc-200"
                    >
                      <option value="sans">Clean Sans-Serif (Inter)</option>
                      <option value="serif">Bookish Serif (Merriweather)</option>
                      <option value="mono">Technical Monospace (JetBrains)</option>
                    </select>
                  </div>
                  <div>
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400 block mb-1">
                      Font Size
                    </span>
                    <select
                      value={localSettings.fontSize}
                      onChange={(e) => updateSetting('fontSize', e.target.value as EditorFontSize)}
                      className="w-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 dark:text-zinc-200"
                    >
                      <option value="sm">Compact (14px)</option>
                      <option value="md">Normal (16px)</option>
                      <option value="lg">Spacious (18px)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4">
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Editor Width & Margins
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['narrow', 'normal', 'wide', 'full'] as EditorWidth[]).map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => updateSetting('editorWidth', w)}
                      className={`py-1.5 px-2 rounded-lg border text-xs font-medium capitalize transition ${
                        localSettings.editorWidth === w
                          ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-semibold'
                          : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table of Contents Section */}
              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4 space-y-3">
                <label className="block font-medium text-stone-700 dark:text-stone-300">
                  Right-Hand Table of Contents (Outline)
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.editorLayout.showTableOfContents}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        editorLayout: {
                          ...prev.editorLayout,
                          showTableOfContents: e.target.checked,
                        },
                      }))
                    }
                    className="accent-amber-600 rounded"
                  />
                  <span className="text-stone-700 dark:text-stone-300">
                    Show Table of Contents panel for long notes with headings
                  </span>
                </label>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-stone-500 dark:text-zinc-400">Outline Depth:</span>
                  {(['h2', 'h3', 'h4'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          editorLayout: {
                            ...prev.editorLayout,
                            tocLevel: lvl,
                          },
                        }))
                      }
                      className={`px-2 py-0.5 rounded border text-[11px] uppercase ${
                        localSettings.editorLayout.tocLevel === lvl
                          ? 'border-amber-600 bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300 font-bold'
                          : 'border-stone-200 dark:border-zinc-800 text-stone-500'
                      }`}
                    >
                      {lvl.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minimalist Editor Elements */}
              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4 space-y-2">
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Minimalist Chrome Controls
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'showToolbar', label: 'Formatting Toolbar' },
                    { key: 'showBreadcrumbs', label: 'Breadcrumb Navigation' },
                    { key: 'showWordCount', label: 'Word Counter' },
                    { key: 'showReadingTime', label: 'Reading Time Estimate' },
                    { key: 'showModifiedDate', label: 'Last Modified Date' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={(localSettings.editorLayout as any)[item.key] !== false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setLocalSettings((prev) => ({
                            ...prev,
                            editorLayout: {
                              ...prev.editorLayout,
                              [item.key]: checked,
                            },
                          }));
                        }}
                        className="accent-amber-600 rounded"
                      />
                      <span className="text-stone-700 dark:text-zinc-300">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LOCAL STORAGE FOLDER */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Storage & Data Location
                </label>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mb-3">
                  Choose where your notes and attachments are stored on your device.
                </p>

                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {[
                    {
                      id: 'browser' as StorageMode,
                      title: 'Browser IndexedDB',
                      desc: 'Fast, secure, local-first storage inside Chrome.',
                    },
                    {
                      id: 'local_folder' as StorageMode,
                      title: 'Custom Local Folder',
                      desc: 'Write notes as .md files to a physical disk directory.',
                    },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => updateSetting('storageMode', mode.id)}
                      className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                        localSettings.storageMode === mode.id
                          ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 ring-1 ring-amber-600'
                          : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/40 text-stone-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1 flex items-center justify-between">
                        <span>{mode.title}</span>
                        {localSettings.storageMode === mode.id && (
                          <Check className="w-3.5 h-3.5 text-amber-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500 leading-tight">
                        {mode.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Local Folder Directory Picker */}
              <div className="p-3.5 bg-stone-50 dark:bg-zinc-950/60 rounded-lg border border-stone-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-amber-600" />
                    <span className="font-semibold text-xs text-stone-800 dark:text-zinc-200">
                      Physical Folder Path
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-stone-200/80 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400">
                    {localSettings.localStorageFolder?.folderName
                      ? `Selected: ${localSettings.localStorageFolder.folderName}`
                      : 'No folder chosen'}
                  </span>
                </div>

                <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed">
                  When a folder is selected, MemoDock can synchronize your notes as human-readable Markdown files (<code className="text-amber-700 dark:text-amber-400">notes/*.md</code>) and attachments (<code className="text-amber-700 dark:text-amber-400">attachments/</code>) directly into that directory.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePickLocalFolder}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium rounded-md text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Choose Local Folder...</span>
                  </button>

                  {localSettings.localStorageFolder?.folderName && (
                    <button
                      type="button"
                      disabled={isSyncingLocal}
                      onClick={handleSyncToLocalFolder}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-md text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLocal ? 'animate-spin' : ''}`} />
                      <span>{isSyncingLocal ? 'Writing...' : 'Sync Now to Folder'}</span>
                    </button>
                  )}
                </div>

                {localSettings.localStorageFolder?.lastSyncTimestamp && (
                  <div className="text-[10px] text-stone-400 dark:text-zinc-500">
                    Last local sync: {new Date(localSettings.localStorageFolder.lastSyncTimestamp).toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: GOOGLE DRIVE SYNC */}
          {activeTab === 'gdrive' && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Google Drive Cloud Sync
                </label>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mb-3">
                  Backup your encrypted notes library to your Google Drive to sync across multiple computers.
                </p>

                <div className="p-4 bg-stone-50 dark:bg-zinc-950/60 rounded-lg border border-stone-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold text-xs text-stone-800 dark:text-zinc-200">
                        {localSettings.googleDrive.isConnected
                          ? `Connected: ${localSettings.googleDrive.userEmail || 'Google Drive'}`
                          : 'Google Drive is Disconnected'}
                      </span>
                    </div>

                    {localSettings.googleDrive.isConnected ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/60">
                          <Check className="w-3 h-3" />
                          <span>Connected</span>
                        </span>
                        <button
                          type="button"
                          onClick={handleDisconnectDrive}
                          className="px-2.5 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40 rounded hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                        >
                          Disconnect
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowCustomTokenInput(!showCustomTokenInput)}
                          className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 border border-stone-200 dark:border-zinc-800 rounded transition"
                          title="Enter custom OAuth token"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={isSyncingDrive}
                          onClick={handleConnectDrive}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Cloud className="w-3.5 h-3.5" />
                          <span>Connect Google Drive</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Optional Custom OAuth Token input */}
                  {showCustomTokenInput && !localSettings.googleDrive.isConnected && (
                    <div className="pt-2 border-t border-stone-200/60 dark:border-zinc-800/60 flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Paste Google Drive OAuth Token (optional)"
                        value={customDriveToken}
                        onChange={(e) => setCustomDriveToken(e.target.value)}
                        className="flex-1 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded px-2.5 py-1 text-xs text-stone-800 dark:text-zinc-200 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleConnectDrive}
                        className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded text-xs font-medium"
                      >
                        Apply
                      </button>
                    </div>
                  )}

                  {localSettings.googleDrive.isConnected && (
                    <div className="pt-2 space-y-3 border-t border-stone-200/60 dark:border-zinc-800/60">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-600 dark:text-zinc-400">Sync Folder Name</span>
                        <input
                          type="text"
                          value={localSettings.googleDrive.folderName}
                          onChange={(e) =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              googleDrive: { ...prev.googleDrive, folderName: e.target.value },
                            }))
                          }
                          className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-stone-800 dark:text-zinc-200 w-44"
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={localSettings.googleDrive.autoSync}
                            onChange={(e) =>
                              setLocalSettings((prev) => ({
                                ...prev,
                                googleDrive: { ...prev.googleDrive, autoSync: e.target.checked },
                              }))
                            }
                            className="accent-blue-600 rounded"
                          />
                          <span className="text-stone-700 dark:text-zinc-300">
                            Automatic background synchronization
                          </span>
                        </label>

                        <button
                          type="button"
                          disabled={isSyncingDrive}
                          onClick={handleSyncDriveNow}
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium rounded-md text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                          <span>{isSyncingDrive ? 'Syncing...' : 'Sync Now'}</span>
                        </button>
                      </div>

                      {localSettings.googleDrive.lastSyncTimestamp && (
                        <div className="text-[10px] text-stone-400 dark:text-zinc-500">
                          Last cloud sync: {new Date(localSettings.googleDrive.lastSyncTimestamp).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AI ASSISTANT */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  AI Model Provider
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {[
                    { id: 'gemini', label: 'Google Gemini' },
                    { id: 'openai', label: 'OpenAI (GPT-4o)' },
                    { id: 'custom', label: 'Ollama / Custom' },
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => updateSetting('aiProvider', p.id as any)}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition ${
                        localSettings.aiProvider === p.id
                          ? 'border-amber-600 bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 font-semibold'
                          : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={localSettings.aiApiKey}
                    onChange={(e) => updateSetting('aiApiKey', e.target.value)}
                    placeholder={
                      localSettings.aiProvider === 'gemini'
                        ? 'AIzaSy...'
                        : localSettings.aiProvider === 'openai'
                        ? 'sk-proj-...'
                        : 'Custom API Key or token'
                    }
                    className="w-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 pr-8 text-xs font-mono text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 p-0.5"
                  >
                    {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                  Model Identifier
                </label>
                <input
                  type="text"
                  value={localSettings.aiModel}
                  onChange={(e) => updateSetting('aiModel', e.target.value)}
                  placeholder="e.g. gemini-1.5-flash, gpt-4o-mini, llama3:8b"
                  className="w-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-stone-800 dark:text-zinc-200"
                />
              </div>

              {localSettings.aiProvider === 'custom' && (
                <div>
                  <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1">
                    Custom Base URL (e.g. Local Ollama)
                  </label>
                  <input
                    type="text"
                    value={localSettings.aiBaseUrl || ''}
                    onChange={(e) => updateSetting('aiBaseUrl', e.target.value)}
                    placeholder="http://localhost:11434/v1"
                    className="w-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono text-stone-800 dark:text-zinc-200"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-950/50">
          <div className="text-[11px] text-stone-400 dark:text-zinc-500">
            {savedFeedback ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Settings saved successfully
              </span>
            ) : (
              'Changes are saved locally to your browser.'
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-md transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-4 py-1.5 text-xs font-medium bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-md shadow-sm transition"
            >
              Save Preferences
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
