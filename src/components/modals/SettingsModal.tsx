import React, { useState, useRef } from 'react';
import {
  X,
  Sliders,
  Palette,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Folder,
  Cloud,
  HardDrive,
  Layout,
  Type,
  RefreshCw,
  FolderOpen,
  FileText,
  ExternalLink,
  Feather,
  Key,
  Command,
  BookOpen,
  Code,
  Compass,
  PenTool,
  CheckCircle2,
  Download,
  Upload,
  Monitor,
  Sun,
  Moon,
  Columns,
  Trash2,
  Tag as TagIcon,
  HelpCircle,
} from 'lucide-react';
import {
  AppSettings,
  ThemeMode,
  ThemePreset,
  EditorWidth,
  EditorFont,
  EditorFontSize,
  NoteListDisplayMode,
  StorageMode,
  WorkspaceLayoutPreset,
  WorkspaceProfile,
  KeyboardShortcut,
} from '../../db/types';
import { db, DEFAULT_PROFILES, DEFAULT_KEYBOARD_SHORTCUTS } from '../../db/db';
import { storageManager } from '../../services/storage/storageManager';
import { googleDriveService } from '../../services/googleDriveService';
import { exportService } from '../../services/exportService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  currentTheme: ThemeMode;
  onSetTheme: (theme: ThemeMode, preset?: ThemePreset, accent?: string) => void;
  onEmptyTrash?: () => Promise<void>;
}

type TabKey =
  | 'general'
  | 'profiles'
  | 'workspace'
  | 'editor'
  | 'shortcuts'
  | 'storage'
  | 'gdrive'
  | 'ai';

const ACCENT_COLORS = [
  { name: 'Classic Blue', hex: '#2563eb' },
  { name: 'Warm Amber', hex: '#d97706' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Modern Violet', hex: '#8b5cf6' },
  { name: 'Rose Red', hex: '#f43f5e' },
  { name: 'Cyan Blue', hex: '#06b6d4' },
  { name: 'Slate Neutral', hex: '#475569' },
];

const THEME_PRESET_OPTIONS: { id: ThemePreset; name: string; desc: string; bgClass: string; dark: boolean }[] = [
  { id: 'default-light', name: 'Clean White', desc: 'Minimalist paper with crisp zinc contrast', bgClass: 'bg-white border-zinc-200 text-zinc-900', dark: false },
  { id: 'warm-light', name: 'Warm Sepia', desc: 'Comfortable amber paper tone for reading', bgClass: 'bg-[#faf8f5] border-amber-200 text-stone-900', dark: false },
  { id: 'cool-light', name: 'Cool Frost', desc: 'Crisp light slate with cool blue undertones', bgClass: 'bg-[#f8fafc] border-slate-200 text-slate-900', dark: false },
  { id: 'soft-gray', name: 'Soft Gray', desc: 'Subtle neutral low-contrast studio gray', bgClass: 'bg-[#f4f4f5] border-zinc-300 text-zinc-800', dark: false },
  { id: 'midnight-dark', name: 'Midnight Navy', desc: 'Deep high-contrast blue-dark dark mode', bgClass: 'bg-[#0f172a] border-slate-700 text-slate-100', dark: true },
  { id: 'deep-dark', name: 'Deep AMOLED', desc: 'Pure jet black for maximum OLED battery savings', bgClass: 'bg-black border-zinc-800 text-zinc-100', dark: true },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentTheme,
  onSetTheme,
  onEmptyTrash,
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
  const [shortcutFilter, setShortcutFilter] = useState<'all' | 'navigation' | 'editor' | 'workspace'>('all');
  const [isRestoringJson, setIsRestoringJson] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = async (updated?: Partial<AppSettings>) => {
    const toSave = updated ? { ...localSettings, ...updated } : localSettings;
    await onSaveSettings(toSave);
    onSetTheme(toSave.theme, toSave.themePreset, toSave.accentColor);
    setSavedFeedback(true);
    setTimeout(() => {
      setSavedFeedback(false);
      onClose();
    }, 500);
  };

  const updateSetting = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyProfile = async (profile: WorkspaceProfile) => {
    // 1. Seed recommended folders if missing
    if (profile.defaultFolders && profile.defaultFolders.length > 0) {
      for (const folderName of profile.defaultFolders) {
        const existing = await db.folders.where('name').equals(folderName).first();
        if (!existing) {
          await db.folders.add({
            id: `folder-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: folderName,
            color: profile.accentColor || '#3b82f6',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        }
      }
    }

    // 2. Seed recommended tags if missing
    if (profile.defaultTags && profile.defaultTags.length > 0) {
      for (const tagName of profile.defaultTags) {
        const existing = await db.tags.where('name').equals(tagName).first();
        if (!existing) {
          await db.tags.add({
            id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            name: tagName,
            color: profile.accentColor || '#3b82f6',
          });
        }
      }
    }

    // 3. Update settings state
    setLocalSettings((prev) => ({
      ...prev,
      activeProfileId: profile.id,
      theme: profile.theme,
      themePreset: profile.themePreset,
      accentColor: profile.accentColor || prev.accentColor,
      sidebarWidth: profile.sidebarWidth || prev.sidebarWidth,
      outlinePosition: profile.outlinePosition || prev.outlinePosition,
      editorWidth: profile.editorWidth,
      fontFamily: profile.fontFamily,
      fontSize: profile.fontSize,
      editorLayout: {
        ...prev.editorLayout,
        mode: profile.layoutMode,
        showTableOfContents: profile.outlineVisible,
      },
    }));

    onSetTheme(profile.theme, profile.themePreset, profile.accentColor);
    setSyncStatusMsg(`Profile "${profile.name}" applied! Created default folders and tags. Click Save Preferences.`);
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

  const handleExportJsonBackup = async () => {
    try {
      await exportService.downloadJsonBackup();
      setSyncStatusMsg('Full JSON backup downloaded successfully.');
    } catch (err: any) {
      setSyncStatusMsg(`Export error: ${err.message || 'Failed'}`);
    }
  };

  const handleRestoreJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsRestoringJson(true);
    setSyncStatusMsg('Restoring data from JSON backup file...');
    try {
      const text = await file.text();
      const res = await exportService.restoreFromJsonBackup(text);
      setSyncStatusMsg(`Successfully restored ${res.notesRestored} notes from backup.`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (err: any) {
      setSyncStatusMsg(`Restore failed: ${err.message || 'Invalid backup format'}`);
    } finally {
      setIsRestoringJson(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const filteredShortcuts = DEFAULT_KEYBOARD_SHORTCUTS.filter((s: KeyboardShortcut) => {
    if (shortcutFilter === 'all') return true;
    return s.category === shortcutFilter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden flex flex-col z-10 text-xs max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-stone-100">
            <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>MemoDock Preferences & Settings</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stone-200/60 dark:border-zinc-800/60 px-4 gap-1 bg-stone-50/30 dark:bg-zinc-950/30 overflow-x-auto select-none">
          {[
            { id: 'general', label: 'Appearance & Themes', icon: Palette },
            { id: 'profiles', label: 'Profiles', icon: Compass },
            { id: 'workspace', label: 'Workspace & Layout', icon: Layout },
            { id: 'editor', label: 'Typography & Outline', icon: Type },
            { id: 'shortcuts', label: 'Shortcuts', icon: Command },
            { id: 'storage', label: 'Storage & Trash', icon: HardDrive },
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
                className={`py-2.5 px-3 font-medium border-b-2 transition flex items-center gap-1.5 whitespace-nowrap text-xs ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold'
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
          <div className="px-5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-b border-blue-200 dark:border-blue-800/60 text-[11px] flex items-center justify-between">
            <span className="truncate">{syncStatusMsg}</span>
            <button
              type="button"
              onClick={() => setSyncStatusMsg(null)}
              className="text-blue-600 dark:text-blue-400 font-bold ml-2 hover:underline"
            >
              ×
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 max-h-[62vh]">

          {/* TAB 1: APPEARANCE & THEMES */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              {/* Theme Mode */}
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-2">
                  Appearance Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'system' as ThemeMode, label: 'System Automatic', icon: Monitor },
                    { id: 'light' as ThemeMode, label: 'Light Mode', icon: Sun },
                    { id: 'dark' as ThemeMode, label: 'Dark Mode', icon: Moon },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = localSettings.theme === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          updateSetting('theme', mode.id);
                          onSetTheme(mode.id, localSettings.themePreset, localSettings.accentColor);
                        }}
                        className={`py-2 px-3 rounded-lg border text-xs font-medium transition flex items-center justify-center gap-2 ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 shadow-sm'
                            : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/50 text-stone-600 dark:text-zinc-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Preset Palettes */}
              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4">
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Visual Theme Preset
                </label>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mb-3">
                  Color atmospheres calibrated for reading comfort and high legibility.
                </p>
                <div className="grid grid-cols-3 gap-2.5">
                  {THEME_PRESET_OPTIONS.map((preset) => {
                    const isSelected = localSettings.themePreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          const newTheme: ThemeMode = preset.dark ? 'dark' : 'light';
                          setLocalSettings((prev) => ({
                            ...prev,
                            themePreset: preset.id,
                            theme: newTheme,
                          }));
                          onSetTheme(newTheme, preset.id, localSettings.accentColor);
                        }}
                        className={`p-2.5 rounded-lg border text-left transition flex flex-col justify-between ${preset.bgClass} ${
                          isSelected
                            ? 'ring-2 ring-blue-600 shadow-sm'
                            : 'opacity-85 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold text-xs mb-1">
                          <span>{preset.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />}
                        </div>
                        <span className="text-[10px] opacity-75 leading-tight">{preset.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Accent Color */}
              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4">
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Primary Accent Color
                </label>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mb-3">
                  Highlights active selections, primary buttons, and link tags across MemoDock.
                </p>
                <div className="flex items-center gap-3">
                  {ACCENT_COLORS.map((c) => {
                    const isSelected = (localSettings.accentColor || '#2563eb').toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={c.hex}
                        type="button"
                        title={c.name}
                        onClick={() => {
                          updateSetting('accentColor', c.hex);
                          onSetTheme(localSettings.theme, localSettings.themePreset, c.hex);
                        }}
                        style={{ backgroundColor: c.hex }}
                        className={`w-7 h-7 rounded-full transition flex items-center justify-center shadow-sm ${
                          isSelected ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-offset-zinc-900' : 'hover:scale-110'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                      </button>
                    );
                  })}
                  <div className="flex items-center gap-1.5 ml-2 pl-3 border-l border-stone-200 dark:border-zinc-800">
                    <input
                      type="color"
                      value={localSettings.accentColor || '#2563eb'}
                      onChange={(e) => {
                        updateSetting('accentColor', e.target.value);
                        onSetTheme(localSettings.theme, localSettings.themePreset, e.target.value);
                      }}
                      className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent"
                      title="Custom hex color"
                    />
                    <span className="font-mono text-[11px] text-stone-500">{localSettings.accentColor || '#2563eb'}</span>
                  </div>
                </div>
              </div>

              {/* Auto-Save & Spellcheck */}
              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                    Auto-Save Delay
                  </label>
                  <select
                    value={localSettings.autoSaveDelay}
                    onChange={(e) => updateSetting('autoSaveDelay', Number(e.target.value))}
                    className="w-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value={300}>Instant (300 ms)</option>
                    <option value={600}>Balanced (600 ms) — Recommended</option>
                    <option value={1200}>Relaxed (1.2 seconds)</option>
                    <option value={3000}>Periodic (3 seconds)</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.spellCheck}
                      onChange={(e) => updateSetting('spellCheck', e.target.checked)}
                      className="accent-blue-600 rounded"
                    />
                    <span className="text-stone-700 dark:text-stone-300 font-medium">
                      Browser spellcheck in editor
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: WORKSPACE PROFILES (WITH DEDICATED FOLDERS & TAGS) */}
          {activeTab === 'profiles' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 mb-1">
                  Curated Disciplines & Profiles
                </h3>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                  Select a workflow profile. Applying a profile creates recommended folders, tags, and sets optimal layout, typography, and outline settings.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {DEFAULT_PROFILES.map((prof) => {
                  const isCurrent = localSettings.activeProfileId === prof.id;
                  const ProfileIcon =
                    prof.type === 'study'
                      ? BookOpen
                      : prof.type === 'development'
                      ? Code
                      : prof.type === 'research'
                      ? Compass
                      : prof.type === 'writing'
                      ? PenTool
                      : Layout;

                  return (
                    <div
                      key={prof.id}
                      className={`p-3.5 rounded-xl border transition flex flex-col gap-2.5 ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-blue-600'
                          : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50/60 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm"
                            style={{ backgroundColor: prof.accentColor || '#2563eb' }}
                          >
                            <ProfileIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                                {prof.name}
                              </span>
                              {isCurrent && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                                  Active Profile
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone-500 dark:text-zinc-400 leading-relaxed">
                              {prof.description}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyProfile(prof)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex-shrink-0 ${
                            isCurrent
                              ? 'bg-blue-600 text-white cursor-default'
                              : 'bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 shadow-sm'
                          }`}
                        >
                          {isCurrent ? 'Current' : 'Apply Profile'}
                        </button>
                      </div>

                      {/* Profile Curated Folders, Tags & Templates */}
                      <div className="pt-2 border-t border-stone-200/60 dark:border-zinc-800/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px]">
                        <div>
                          <span className="font-semibold text-stone-500 dark:text-zinc-400 flex items-center gap-1 mb-1">
                            <Folder className="w-3 h-3 text-amber-500" />
                            <span>Folders:</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {prof.defaultFolders?.map((f) => (
                              <span key={f} className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="font-semibold text-stone-500 dark:text-zinc-400 flex items-center gap-1 mb-1">
                            <TagIcon className="w-3 h-3 text-blue-500" />
                            <span>Tags:</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {prof.defaultTags?.map((t) => (
                              <span key={t} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50">
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="font-semibold text-stone-500 dark:text-zinc-400 flex items-center gap-1 mb-1">
                            <PenTool className="w-3 h-3 text-purple-500" />
                            <span>Templates:</span>
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {prof.recommendedTemplates?.map((tmpl) => (
                              <span key={tmpl} className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-900/50">
                                {tmpl}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: WORKSPACE & LAYOUT */}
          {activeTab === 'workspace' && (
            <div className="space-y-4">
              {/* Presets */}
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Workspace Layout Presets
                </label>
                <div className="grid grid-cols-3 gap-2.5 mt-2">
                  {[
                    {
                      id: 'minimal' as WorkspaceLayoutPreset,
                      title: 'Minimalist',
                      icon: Feather,
                      desc: 'TabNotebook clean digital paper, auto-title, no clutter',
                    },
                    {
                      id: 'balanced' as WorkspaceLayoutPreset,
                      title: 'Balanced',
                      icon: Layout,
                      desc: 'Contextual sidebar, compact toolbar, toggleable outline',
                    },
                    {
                      id: 'complete' as WorkspaceLayoutPreset,
                      title: 'Complete',
                      icon: Columns,
                      desc: 'Full power suite with pinned outline, code and tables',
                    },
                  ].map((p) => {
                    const Icon = p.icon;
                    const isSelected = localSettings.editorLayout.mode === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setLocalSettings((prev) => ({
                            ...prev,
                            noteListMode: p.id === 'minimal' ? 'minimal' : prev.noteListMode,
                            editorLayout: {
                              ...prev.editorLayout,
                              mode: p.id,
                              showToolbar: p.id !== 'minimal',
                              showTableOfContents: p.id === 'complete',
                            },
                          }));
                        }}
                        className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                            : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/40 text-stone-700 dark:text-zinc-300'
                        }`}
                      >
                        <div>
                          <div className="font-semibold text-xs mb-1 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-blue-600" />
                              {p.title}
                            </span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600" />}
                          </div>
                          <span className="text-[10px] text-stone-400 dark:text-zinc-500 leading-tight block">
                            {p.desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Distraction-Free Options: Auto-Hide Navbar & Split Workspace */}
              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4 space-y-3">
                <label className="block font-semibold text-stone-800 dark:text-stone-200">
                  Distraction-Free & Multitasking Features
                </label>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-start gap-2 p-3 rounded-xl border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-850 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.autoHideNavbar || false}
                      onChange={(e) => updateSetting('autoHideNavbar', e.target.checked)}
                      className="accent-blue-600 rounded mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 block">
                        Auto-Hide Top Navigation Bar
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500 leading-tight block mt-0.5">
                        Navbar slides down only on mouse hover, maximizing immersion while writing.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2 p-3 rounded-xl border border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-850 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.splitWorkspace || false}
                      onChange={(e) => updateSetting('splitWorkspace', e.target.checked)}
                      className="accent-blue-600 rounded mt-0.5"
                    />
                    <div>
                      <span className="font-semibold text-xs text-stone-900 dark:text-stone-100 block">
                        Split Workspace Mode (Side-by-Side)
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500 leading-tight block mt-0.5">
                        Keep a reference PDF, resource, or spreadsheet open side-by-side with your note.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Sidebar Width Slider */}
              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-stone-800 dark:text-stone-200">
                    Sidebar Width
                  </label>
                  <span className="font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                    {localSettings.sidebarWidth || 260}px
                  </span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={450}
                  step={5}
                  value={localSettings.sidebarWidth || 260}
                  onChange={(e) => updateSetting('sidebarWidth', Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Note List Density */}
              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4">
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-2">
                  Note List Density
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'minimal' as NoteListDisplayMode, label: 'Minimalist (Title Only)' },
                    { id: 'compact' as NoteListDisplayMode, label: 'Compact (Title + Date)' },
                    { id: 'detailed' as NoteListDisplayMode, label: 'Detailed (+ Snippet & Tags)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => updateSetting('noteListMode', m.id)}
                      className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition text-center ${
                        localSettings.noteListMode === m.id
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300'
                          : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TYPOGRAPHY & OUTLINE */}
          {activeTab === 'editor' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-2">
                  Typography & Reading Experience
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400 block mb-1">
                      Font Family
                    </span>
                    <select
                      value={localSettings.fontFamily}
                      onChange={(e) => updateSetting('fontFamily', e.target.value as EditorFont)}
                      className="w-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 dark:text-zinc-200"
                    >
                      <option value="sans">Clean Sans (Inter)</option>
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
                  <div>
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400 block mb-1">
                      Editor Width
                    </span>
                    <select
                      value={localSettings.editorWidth}
                      onChange={(e) => updateSetting('editorWidth', e.target.value as EditorWidth)}
                      className="w-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-stone-800 dark:text-zinc-200"
                    >
                      <option value="narrow">Narrow (680px)</option>
                      <option value="normal">Standard (800px)</option>
                      <option value="wide">Wide (1000px)</option>
                      <option value="full">Full Canvas (100%)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Table of Contents / Outline System */}
              <div className="border-t border-stone-100 dark:border-zinc-800 pt-4 space-y-3">
                <label className="block font-semibold text-stone-800 dark:text-stone-200">
                  Interactive Document Outline (Table of Contents)
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
                    className="accent-blue-600 rounded"
                  />
                  <span className="text-stone-700 dark:text-stone-300 font-medium">
                    Show Table of Contents outline panel for notes
                  </span>
                </label>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400 block mb-1">
                      Outline Position
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['left', 'right'] as const).map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => updateSetting('outlinePosition', pos)}
                          className={`py-1 px-2 rounded border text-xs capitalize ${
                            (localSettings.outlinePosition || 'right') === pos
                              ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-bold'
                              : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400'
                          }`}
                        >
                          {pos} Side
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-stone-500 dark:text-zinc-400 block mb-1">
                      Maximum Heading Depth
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['h2', 'h3', 'h4'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() =>
                            setLocalSettings((prev) => ({
                              ...prev,
                              editorLayout: { ...prev.editorLayout, tocLevel: lvl },
                            }))
                          }
                          className={`py-1 px-2 rounded border text-xs uppercase ${
                            localSettings.editorLayout.tocLevel === lvl
                              ? 'border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 font-bold'
                              : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SHORTCUTS MANAGER */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100 mb-0.5">
                    Keyboard Shortcuts
                  </h3>
                  <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                    Productivity hotkeys active across MemoDock.
                  </p>
                </div>
                <div className="flex items-center gap-1 bg-stone-100 dark:bg-zinc-800 p-0.5 rounded-lg text-[11px]">
                  {(['all', 'navigation', 'editor', 'workspace'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setShortcutFilter(cat)}
                      className={`px-2 py-0.5 rounded capitalize font-medium ${
                        shortcutFilter === cat
                          ? 'bg-white dark:bg-zinc-700 text-stone-900 dark:text-white shadow-xs'
                          : 'text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 divide-y divide-stone-100 dark:divide-zinc-800/80 max-h-[46vh] overflow-y-auto">
                {filteredShortcuts.map((sc: KeyboardShortcut) => (
                  <div key={sc.id} className="pt-2 first:pt-0 flex items-center justify-between py-1.5">
                    <div>
                      <div className="font-semibold text-xs text-stone-800 dark:text-stone-200">
                        {sc.label}
                      </div>
                      <div className="text-[10px] text-stone-400 dark:text-zinc-500">
                        {sc.description}
                      </div>
                    </div>
                    <kbd className="px-2 py-1 bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded text-[11px] font-mono text-stone-800 dark:text-zinc-200 shadow-xs whitespace-nowrap">
                      {sc.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: LOCAL STORAGE & EMPTY TRASH */}
          {activeTab === 'storage' && (
            <div className="space-y-4">
              {/* Storage Mode */}
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Storage & Data Location
                </label>
                <div className="grid grid-cols-2 gap-2.5 mb-4">
                  {[
                    {
                      id: 'browser' as StorageMode,
                      title: 'Browser IndexedDB',
                      desc: 'Fast, secure, local-first storage inside Chrome sandbox.',
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
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 ring-1 ring-blue-600'
                          : 'border-stone-200 dark:border-zinc-800 hover:bg-stone-50 dark:hover:bg-zinc-800/40 text-stone-700 dark:text-zinc-300'
                      }`}
                    >
                      <div className="font-semibold text-xs mb-1 flex items-center justify-between">
                        <span>{mode.title}</span>
                        {localSettings.storageMode === mode.id && (
                          <Check className="w-3.5 h-3.5 text-blue-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 dark:text-zinc-500 leading-tight">
                        {mode.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Folder Path */}
              <div className="p-3.5 bg-stone-50 dark:bg-zinc-950/60 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-xs text-stone-800 dark:text-zinc-200">
                      Physical Folder Directory
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-stone-200/80 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400">
                    {localSettings.localStorageFolder?.folderName
                      ? `Selected: ${localSettings.localStorageFolder.folderName}`
                      : 'No folder chosen'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handlePickLocalFolder}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium rounded-lg text-xs shadow-sm transition flex items-center gap-1.5"
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Choose Local Folder...</span>
                  </button>

                  {localSettings.localStorageFolder?.folderName && (
                    <button
                      type="button"
                      disabled={isSyncingLocal}
                      onClick={handleSyncToLocalFolder}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLocal ? 'animate-spin' : ''}`} />
                      <span>{isSyncingLocal ? 'Writing...' : 'Sync Now to Folder'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* EMPTY TRASH SECTION */}
              <div className="p-3.5 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-200/60 dark:border-red-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <span className="font-semibold text-xs text-red-900 dark:text-red-200">
                      Empty Trash Bin (Vider la corbeille)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (window.confirm('Permanently delete all notes in the trash? This cannot be undone.')) {
                        if (onEmptyTrash) await onEmptyTrash();
                        else {
                          const all = await db.notes.toArray();
                          const trashed = all.filter((n) => n.isTrash);
                          if (trashed.length > 0) {
                            await db.notes.bulkDelete(trashed.map((n) => n.id));
                          }
                        }
                        setSyncStatusMsg('Trash bin emptied successfully.');
                      }
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition"
                  >
                    Empty All Trash
                  </button>
                </div>
                <p className="text-[11px] text-red-700/80 dark:text-red-400/80 leading-relaxed">
                  Permanently remove all deleted notes from IndexedDB to free local storage space.
                </p>
              </div>

              {/* JSON Backup & Restore */}
              <div className="p-3.5 bg-stone-50 dark:bg-zinc-950/60 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-semibold text-xs text-stone-800 dark:text-zinc-200">
                      Full JSON Backup & Restore
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleExportJsonBackup}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export JSON Backup</span>
                  </button>
                  <label className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 hover:bg-stone-50 dark:hover:bg-zinc-700 text-stone-700 dark:text-stone-200 rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isRestoringJson ? 'Restoring...' : 'Restore from JSON...'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json,application/json"
                      onChange={handleRestoreJsonFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: GOOGLE DRIVE SYNC */}
          {activeTab === 'gdrive' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
                  Google Drive Cloud Sync
                </label>
                <p className="text-[11px] text-stone-400 dark:text-zinc-500 mb-3">
                  Backup your notes library to your private Google Drive folder to synchronize across computers.
                </p>

                <div className="p-4 bg-stone-50 dark:bg-zinc-950/60 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-3">
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
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Cloud className="w-3.5 h-3.5" />
                          <span>Connect Google Drive</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {showCustomTokenInput && !localSettings.googleDrive.isConnected && (
                    <div className="pt-2 border-t border-stone-200/60 dark:border-zinc-800/60 flex items-center gap-2">
                      <input
                        type="password"
                        placeholder="Paste Google Drive OAuth Token"
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
                          className="bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded px-2 py-1 text-xs text-stone-800 dark:text-zinc-200 w-48"
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
                          className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium rounded-lg text-xs shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                          <span>{isSyncingDrive ? 'Syncing...' : 'Sync Now'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: AI ASSISTANT & STEP-BY-STEP SETUP GUIDES */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
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
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 font-semibold'
                          : 'border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
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
                        : 'Custom API Key or token (optional for Ollama)'
                    }
                    className="w-full bg-white dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 pr-8 text-xs font-mono text-stone-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
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
                  <label className="block font-semibold text-stone-800 dark:text-stone-200 mb-1">
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

              {/* STEP-BY-STEP HELP GUIDE FOR SELECTED AI PROVIDER */}
              <div className="mt-4 p-3.5 bg-stone-50 dark:bg-zinc-950/60 rounded-xl border border-stone-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-xs text-stone-800 dark:text-zinc-200">
                  <HelpCircle className="w-4 h-4 text-amber-500" />
                  <span>How to configure {localSettings.aiProvider === 'gemini' ? 'Google Gemini (Free)' : localSettings.aiProvider === 'openai' ? 'OpenAI' : 'Local Ollama'}</span>
                </div>

                {localSettings.aiProvider === 'gemini' && (
                  <div className="text-[11px] text-stone-600 dark:text-zinc-400 space-y-2 leading-relaxed">
                    <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/30 rounded-lg border border-blue-200/60 dark:border-blue-800/40">
                      <strong className="text-blue-900 dark:text-blue-300 block mb-1">
                        Google Gemini (Free Tier — 15 requests/min)
                      </strong>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>
                          Open{' '}
                          <a
                            href="https://aistudio.google.com/app/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 underline font-semibold"
                          >
                            Google AI Studio (aistudio.google.com)
                          </a>
                        </li>
                        <li>Sign in with your Google Account and click <strong>"Create API key"</strong></li>
                        <li>Copy the generated key (starts with <code className="bg-white dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">AIzaSy...</code>) and paste it into the API Key field above</li>
                        <li>Recommended Model: <code className="bg-white dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">gemini-1.5-flash</code> for instant responses</li>
                      </ol>
                    </div>
                  </div>
                )}

                {localSettings.aiProvider === 'openai' && (
                  <div className="text-[11px] text-stone-600 dark:text-zinc-400 space-y-2 leading-relaxed">
                    <div className="p-2.5 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40">
                      <strong className="text-emerald-900 dark:text-emerald-300 block mb-1">
                        OpenAI Setup
                      </strong>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>
                          Visit{' '}
                          <a
                            href="https://platform.openai.com/api-keys"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 dark:text-emerald-400 underline font-semibold"
                          >
                            OpenAI API Keys
                          </a>
                        </li>
                        <li>Create a new secret key (starts with <code className="bg-white dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">sk-proj-...</code>)</li>
                        <li>Recommended Model: <code className="bg-white dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">gpt-4o-mini</code> (fast & cost-effective)</li>
                      </ol>
                    </div>
                  </div>
                )}

                {localSettings.aiProvider === 'custom' && (
                  <div className="text-[11px] text-stone-600 dark:text-zinc-400 space-y-2 leading-relaxed">
                    <div className="p-2.5 bg-purple-50/70 dark:bg-purple-950/30 rounded-lg border border-purple-200/60 dark:border-purple-800/40">
                      <strong className="text-purple-900 dark:text-purple-300 block mb-1">
                        Ollama (100% Free & Offline Local AI)
                      </strong>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>
                          Download Ollama from{' '}
                          <a
                            href="https://ollama.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-600 dark:text-purple-400 underline font-semibold"
                          >
                            ollama.com
                          </a>
                        </li>
                        <li>
                          Run in terminal:{' '}
                          <code className="bg-white dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono font-bold text-stone-900 dark:text-white">
                            ollama run llama3:8b
                          </code>
                        </li>
                        <li>Base URL: <code className="bg-white dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">http://localhost:11434/v1</code></li>
                        <li>Model: <code className="bg-white dark:bg-zinc-800 px-1 py-0.5 rounded font-mono">llama3:8b</code> (or <code className="font-mono">mistral</code>)</li>
                        <li>API Key: Can be left empty or set to <code className="font-mono">ollama</code></li>
                      </ol>
                    </div>
                  </div>
                )}
              </div>
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
              'Changes are saved locally to your device.'
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSave()}
              className="px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
            >
              Save Preferences
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
