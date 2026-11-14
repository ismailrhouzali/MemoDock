export interface Note {
  id: string;
  title: string;
  content: string; // TipTap HTML or serialized state
  plainText: string; // For instant full-text search & snippet display
  createdAt: number;
  updatedAt: number;
  folderId: string | null;
  tags: string[];
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isTrash: boolean;
  trashedAt?: number | null;
  sourceUrl?: string;
  sourceTitle?: string;
  internalLinks?: string[]; // Note IDs or titles referenced via [[title]]
  backlinks?: string[]; // Note IDs that link to this note
  isAutoTitle?: boolean; // Whether note title was automatically extracted from content
  order?: number; // Custom drag-and-drop sort order position
}

export interface Attachment {
  id: string;
  noteId: string;
  name: string;
  type: string; // e.g. 'application/pdf', 'image/png'
  size: number; // in bytes
  dataUrl?: string; // base64 or blob URL (optional for backwards compatibility)
  blob?: Blob; // native IndexedDB Blob for high-performance zero-copy storage
  pageCount?: number;
  createdAt: number;
}

export type ResourceType = 'github' | 'youtube' | 'pdf' | 'research' | 'doc' | 'article' | 'website';

export interface Resource {
  id: string;
  url: string;
  title: string;
  description: string;
  domain: string;
  favicon?: string;
  ogImage?: string;
  type: ResourceType;
  collection: string;
  tags: string[];
  notes?: string;
  noteId?: string | null;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isTrash: boolean;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt?: number | null;
}

export interface ResourceCollection {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  createdAt: number;
}

export type WorkspaceView = 'notes' | 'resources' | 'documents' | 'spreadsheets';

export interface SpreadsheetSheet {
  id: string;
  name: string;
  headers: string[];
  rows: string[][];
}

export interface Spreadsheet {
  id: string;
  title: string;
  sheets: SpreadsheetSheet[];
  activeSheetIndex: number;
  tags: string[];
  collection?: string;
  noteId?: string | null;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
  isPinned: boolean;
  isArchived: boolean;
  isTrash: boolean;
  sourceFileName?: string;
}

export interface NoteVersion {
  id: string;
  noteId: string;
  title: string;
  content: string;
  plainText: string;
  createdAt: number;
  summary?: string;
}

export interface NoteTemplate {
  id: string;
  title: string;
  description: string;
  category: 'General' | 'Work' | 'Study' | 'Engineering' | 'Writing';
  content: string;
  isBuiltin: boolean;
  createdAt: number;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  order?: number;
  createdAt: number;
  updatedAt: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type EditorWidth = 'narrow' | 'normal' | 'wide' | 'full';
export type EditorFont = 'sans' | 'serif' | 'mono';
export type EditorFontSize = 'sm' | 'md' | 'lg';
export type NoteListDisplayMode = 'detailed' | 'compact' | 'minimal';
export type SidebarMode = 'full' | 'compact' | 'icons' | 'hidden';
export type StorageMode = 'browser' | 'local_folder' | 'gdrive' | 'local_gdrive_sync';

export interface SidebarVisibility {
  showAll: boolean;
  showFavorites: boolean;
  showRecents: boolean;
  showArchived: boolean;
  showTrash: boolean;
  showFolders: boolean;
  showTags: boolean;
  foldersExpanded: boolean;
  tagsExpanded: boolean;
  mode: SidebarMode;
}

export type ThemePreset =
  | 'default-light'
  | 'warm-light'
  | 'cool-light'
  | 'soft-gray'
  | 'midnight-dark'
  | 'deep-dark';

export type WorkspaceLayoutPreset = 'minimal' | 'balanced' | 'complete' | 'focus';

export interface EditorLayoutSettings {
  mode: WorkspaceLayoutPreset | 'standard'; // 'standard' mapped to 'balanced' for backward compatibility
  showToolbar: boolean;
  showWordCount: boolean;
  showCharCount: boolean;
  showReadingTime: boolean;
  showModifiedDate: boolean;
  showBreadcrumbs: boolean;
  showTableOfContents: boolean;
  tocCollapsed: boolean;
  tocLevel: 'h2' | 'h3' | 'h4';
  lineHeight?: 'tight' | 'normal' | 'relaxed';
  paragraphSpacing?: 'compact' | 'normal' | 'spacious';
}

export type WorkspaceProfileType = 'study' | 'development' | 'research' | 'writing' | 'custom';

export interface WorkspaceProfile {
  id: string;
  name: string;
  type: WorkspaceProfileType;
  description: string;
  theme: ThemeMode;
  themePreset: ThemePreset;
  accentColor?: string;
  layoutMode: WorkspaceLayoutPreset;
  sidebarVisible: boolean;
  sidebarMode: SidebarMode;
  sidebarWidth?: number;
  outlineVisible: boolean;
  outlinePosition?: 'left' | 'right';
  editorWidth: EditorWidth;
  fontFamily: EditorFont;
  fontSize: EditorFontSize;
  defaultFolders?: string[];
  defaultTags?: string[];
  recommendedTemplates?: string[];
}

export interface KeyboardShortcut {
  id: string;
  label: string;
  key: string;
  description: string;
  category: 'navigation' | 'editor' | 'workspace';
}

export interface GoogleDriveSettings {
  isConnected: boolean;
  userEmail: string | null;
  folderName: string;
  folderId: string | null;
  autoSync: boolean;
  syncIntervalMinutes: number;
  lastSyncTimestamp: number | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastError: string | null;
}

export interface LocalStorageFolderSettings {
  folderName: string | null;
  permissionStatus: 'granted' | 'prompt' | 'denied' | 'unsupported';
  lastSyncTimestamp: number | null;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
}

export interface ConflictRecord {
  id: string;
  noteId: string;
  localNote: Note;
  remoteNote: Note;
  detectedAt: number;
  resolved: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  themePreset?: ThemePreset;
  accentColor?: string; // hex color e.g. '#2563eb'
  editorWidth: EditorWidth;
  fontFamily: EditorFont;
  fontSize: EditorFontSize;
  autoSaveDelay: number;
  showWordCount: boolean;
  showLineNumbers: boolean;
  spellCheck: boolean;
  aiProvider: 'gemini' | 'openai' | 'custom';
  aiApiKey: string;
  aiModel: string;
  aiBaseUrl?: string;

  // Workspace & Sidebar Settings
  noteListMode: NoteListDisplayMode;
  sidebarVisibility: SidebarVisibility;
  sidebarWidth?: number; // 200 to 450 px
  editorLayout: EditorLayoutSettings;
  outlinePosition?: 'left' | 'right';
  outlineWidth?: number;
  storageMode: StorageMode;
  googleDrive: GoogleDriveSettings;
  localStorageFolder: LocalStorageFolderSettings;

  // Workspace Profiles & Shortcuts (MemoDock V3)
  activeProfileId?: string;
  workspaceProfiles?: WorkspaceProfile[];
  customShortcuts?: Record<string, string>;

  // Distraction-Free & Split Workspace
  autoHideNavbar?: boolean;
  splitWorkspace?: boolean;
  splitRightView?: WorkspaceView | 'markdown';
}

export type ViewFilter = 
  | { type: 'all' }
  | { type: 'favorites' }
  | { type: 'recents' }
  | { type: 'archived' }
  | { type: 'trash' }
  | { type: 'folder'; folderId: string }
  | { type: 'tag'; tag: string };

export type SortField = 'updatedAt' | 'createdAt' | 'title' | 'order';
export type SortOrder = 'asc' | 'desc';
