import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Star,
  Clock,
  Archive,
  Trash2,
  Folder as FolderIcon,
  Tag as TagIcon,
  Plus,
  MoreVertical,
  Pin,
  Copy,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Hash,
  X,
  Check,
  PanelLeftClose,
  Bookmark,
  Files,
  FileSpreadsheet,
  GripVertical,
} from 'lucide-react';
import {
  Note,
  Folder,
  Tag,
  ViewFilter,
  SortField,
  SortOrder,
  NoteListDisplayMode,
  SidebarVisibility,
  WorkspaceView,
  ResourceCollection,
} from '../../db/types';

interface SidebarProps {
  isOpen: boolean;
  workspaceView: WorkspaceView;
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  counts: {
    all: number;
    favorites: number;
    archived: number;
    trash: number;
    recents: number;
  };
  activeNoteId: string | null;
  currentFilter: ViewFilter;
  onSelectFilter: (filter: ViewFilter) => void;
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  onDeleteNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onPermanentlyDeleteNote: (id: string) => void;
  onDuplicateNote: (note: Note) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onCreateFolder: (name: string, color?: string) => Promise<Folder>;
  onDeleteFolder: (id: string) => Promise<void>;
  onCreateTag: (name: string, color?: string) => Promise<Tag>;
  onDeleteTag: (id: string, name: string) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => Promise<void>;
  sortField: SortField;
  sortOrder: SortOrder;
  onChangeSort: (field: SortField, order: SortOrder) => void;
  noteListMode?: NoteListDisplayMode;
  sidebarVisibility?: SidebarVisibility;
  sidebarWidth?: number;
  onResizeSidebar?: (newWidth: number) => void;
  onToggleSection?: (section: 'folders' | 'tags') => void;
  isMinimalistMode?: boolean;
  onToggleSidebar?: () => void;

  // Contextual Collections
  resourceCollections?: string[];
  selectedResourceCollection?: string;
  onSelectResourceCollection?: (col: string) => void;

  pdfCollections?: string[];
  selectedPdfCollection?: string;
  onSelectPdfCollection?: (col: string) => void;

  spreadsheetCollections?: string[];
  selectedSpreadsheetCollection?: string;
  onSelectSpreadsheetCollection?: (col: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  workspaceView = 'notes',
  notes,
  folders,
  tags,
  counts,
  activeNoteId,
  currentFilter,
  onSelectFilter,
  onSelectNote,
  onCreateNote,
  onDeleteNote,
  onRestoreNote,
  onPermanentlyDeleteNote,
  onDuplicateNote,
  onTogglePin,
  onToggleFavorite,
  onCreateFolder,
  onDeleteFolder,
  onCreateTag,
  onDeleteTag,
  onEmptyTrash,
  onMoveNoteToFolder,
  sortField,
  sortOrder,
  onChangeSort,
  noteListMode = 'detailed',
  sidebarVisibility = {
    showAll: true,
    showFavorites: true,
    showRecents: true,
    showArchived: true,
    showTrash: true,
    showFolders: true,
    showTags: true,
    foldersExpanded: true,
    tagsExpanded: true,
    mode: 'full',
  },
  sidebarWidth = 260,
  onResizeSidebar,
  onToggleSection,
  isMinimalistMode = false,
  onToggleSidebar,
  resourceCollections = ['AI & Research', 'Documentation', 'Tools & Libs', 'Design & UI', 'Articles'],
  selectedResourceCollection = 'all',
  onSelectResourceCollection,
  pdfCollections = ['Course Materials', 'Research Papers', 'Cheatsheets', 'Documentation'],
  selectedPdfCollection = 'all',
  onSelectPdfCollection,
  spreadsheetCollections = ['Data Science', 'Financial', 'Inventories', 'Research'],
  selectedSpreadsheetCollection = 'all',
  onSelectSpreadsheetCollection,
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);

  // Drag and drop state
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

  // Resizing state
  const [currentWidth, setCurrentWidth] = useState<number>(sidebarWidth);
  const isResizingRef = useRef(false);

  useEffect(() => {
    setCurrentWidth(sidebarWidth);
  }, [sidebarWidth]);

  // Handle Drag to Resize Sidebar
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.min(Math.max(moveEvent.clientX, 200), 450);
      setCurrentWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        if (onResizeSidebar) {
          onResizeSidebar(currentWidth);
        }
      }
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Local collapsible state if not controlled
  const [foldersOpen, setFoldersOpen] = useState(sidebarVisibility.foldersExpanded ?? true);
  const [tagsOpen, setTagsOpen] = useState(sidebarVisibility.tagsExpanded ?? true);

  if (!isOpen || sidebarVisibility.mode === 'hidden') return null;

  const handleAddFolder = async () => {
    if (newFolderName.trim()) {
      await onCreateFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const handleAddTag = async () => {
    if (newTagName.trim()) {
      await onCreateTag(newTagName.trim());
      setNewTagName('');
      setIsCreatingTag(false);
    }
  };

  const isFilterActive = (filter: ViewFilter) => {
    if (filter.type !== currentFilter.type) return false;
    if (filter.type === 'folder' && currentFilter.type === 'folder') {
      return filter.folderId === currentFilter.folderId;
    }
    if (filter.type === 'tag' && currentFilter.type === 'tag') {
      return filter.tag === currentFilter.tag;
    }
    return true;
  };

  const filterBtnClass = (active: boolean) =>
    `w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
      active
        ? 'bg-blue-100/70 dark:bg-zinc-800 text-blue-900 dark:text-stone-100 font-semibold shadow-2xs'
        : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-900 hover:text-stone-900 dark:hover:text-stone-200'
    }`;

  // Minimalist Mode Sidebar (TabNotebook Style)
  if (isMinimalistMode || noteListMode === 'minimal') {
    return (
      <aside
        style={{ width: `${currentWidth}px` }}
        className="relative flex-shrink-0 border-r border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col h-full select-none text-xs"
      >
        {/* Minimalist Top Header */}
        <div className="p-3 border-b border-stone-200/60 dark:border-zinc-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onCreateNote}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 rounded-lg transition"
            title="Create New Note (Ctrl+N)"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>New note</span>
          </button>
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded-md transition"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Minimalist Notes List */}
        <div className="flex-1 overflow-y-auto py-1">
          {notes.length === 0 ? (
            <div className="p-6 text-center text-stone-400 dark:text-zinc-600 text-xs">
              No notes yet. Click New note to begin.
            </div>
          ) : (
            notes.map((note) => {
              const isActive = note.id === activeNoteId;
              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className={`group relative flex items-center justify-between px-4 py-2 cursor-pointer transition text-xs select-none ${
                    isActive
                      ? 'border-l-[3px] border-blue-600 bg-stone-200/80 dark:bg-zinc-800/90 text-stone-900 dark:text-stone-100 font-semibold'
                      : 'border-l-[3px] border-transparent text-stone-700 dark:text-zinc-300 hover:bg-stone-100/70 dark:hover:bg-zinc-900/60 font-normal'
                  }`}
                >
                  <span className="truncate block flex-1">{note.title || 'Untitled Note'}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuNoteId(activeMenuNoteId === note.id ? null : note.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded transition"
                  >
                    <MoreVertical className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Right Resizer Handle */}
        <div
          onMouseDown={startResizing}
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition z-20 group"
        >
          <div className="w-[1px] h-full bg-stone-200 dark:bg-zinc-800 mx-auto group-hover:bg-blue-500" />
        </div>
      </aside>
    );
  }

  return (
    <aside
      style={{ width: `${currentWidth}px` }}
      className="relative flex-shrink-0 border-r border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col h-full select-none text-xs"
    >
      {/* MODULE HEADER BAR */}
      <div className="p-3 border-b border-stone-200/60 dark:border-zinc-800/60 flex items-center justify-between">
        <span className="font-bold text-xs uppercase tracking-wider text-stone-500 dark:text-zinc-400 flex items-center gap-1.5">
          {workspaceView === 'notes' && <FileText className="w-3.5 h-3.5 text-blue-600" />}
          {workspaceView === 'resources' && <Bookmark className="w-3.5 h-3.5 text-amber-600" />}
          {workspaceView === 'documents' && <Files className="w-3.5 h-3.5 text-red-500" />}
          {workspaceView === 'spreadsheets' && <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          <span className="capitalize">{workspaceView}</span>
        </span>

        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded-md transition"
            title="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* CONTEXTUAL MODULE CONTENT */}
      {workspaceView === 'notes' ? (
        /* NOTES MODULE NAVIGATION */
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quick Filters */}
          <div className="p-2 space-y-0.5 border-b border-stone-200/50 dark:border-zinc-800/50 flex-shrink-0">
            {sidebarVisibility.showAll && (
              <button
                type="button"
                onClick={() => onSelectFilter({ type: 'all' })}
                className={filterBtnClass(isFilterActive({ type: 'all' }))}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 opacity-70" />
                  <span>All Notes</span>
                </span>
                <span className="text-[10px] opacity-60 font-mono">{counts.all}</span>
              </button>
            )}

            {sidebarVisibility.showFavorites && (
              <button
                type="button"
                onClick={() => onSelectFilter({ type: 'favorites' })}
                className={filterBtnClass(isFilterActive({ type: 'favorites' }))}
              >
                <span className="flex items-center gap-2">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500/20" />
                  <span>Favorites</span>
                </span>
                <span className="text-[10px] opacity-60 font-mono">{counts.favorites}</span>
              </button>
            )}

            {sidebarVisibility.showRecents && (
              <button
                type="button"
                onClick={() => onSelectFilter({ type: 'recents' })}
                className={filterBtnClass(isFilterActive({ type: 'recents' }))}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                  <span>Recent</span>
                </span>
                <span className="text-[10px] opacity-60 font-mono">{counts.recents}</span>
              </button>
            )}

            {sidebarVisibility.showArchived && (
              <button
                type="button"
                onClick={() => onSelectFilter({ type: 'archived' })}
                className={filterBtnClass(isFilterActive({ type: 'archived' }))}
              >
                <span className="flex items-center gap-2">
                  <Archive className="w-3.5 h-3.5 text-purple-500" />
                  <span>Archived</span>
                </span>
                <span className="text-[10px] opacity-60 font-mono">{counts.archived}</span>
              </button>
            )}

            {sidebarVisibility.showTrash && (
              <button
                type="button"
                onClick={() => onSelectFilter({ type: 'trash' })}
                className={filterBtnClass(isFilterActive({ type: 'trash' }))}
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  <span>Trash</span>
                </span>
                <span className="text-[10px] opacity-60 font-mono">{counts.trash}</span>
              </button>
            )}
          </div>

          {/* Folders Section (Drop Target for Notes) */}
          {sidebarVisibility.showFolders && (
            <div className="p-2 border-b border-stone-200/50 dark:border-zinc-800/50 flex-shrink-0">
              <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setFoldersOpen(!foldersOpen);
                    if (onToggleSection) onToggleSection('folders');
                  }}
                  className="flex items-center gap-1 hover:text-stone-700 dark:hover:text-zinc-300"
                >
                  {foldersOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  <span>Folders</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(true)}
                  className="p-0.5 hover:text-stone-700 dark:hover:text-zinc-300 rounded"
                  title="Create Folder"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {isCreatingFolder && (
                <div className="flex items-center gap-1 my-1">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddFolder();
                      if (e.key === 'Escape') setIsCreatingFolder(false);
                    }}
                    placeholder="Folder name..."
                    className="w-full px-2 py-0.5 bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded text-xs"
                    autoFocus
                  />
                  <button type="button" onClick={handleAddFolder} className="p-1 text-emerald-600 rounded">
                    <Check className="w-3 h-3" />
                  </button>
                  <button type="button" onClick={() => setIsCreatingFolder(false)} className="p-1 text-red-500 rounded">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {foldersOpen && (
                <div className="space-y-0.5 max-h-36 overflow-y-auto">
                  {folders.map((folder) => {
                    const active = isFilterActive({ type: 'folder', folderId: folder.id });
                    const isDragOver = dragOverFolderId === folder.id;
                    return (
                      <div
                        key={folder.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverFolderId(folder.id);
                        }}
                        onDragLeave={() => setDragOverFolderId(null)}
                        onDrop={async (e) => {
                          e.preventDefault();
                          setDragOverFolderId(null);
                          const noteId = e.dataTransfer.getData('text/note-id');
                          if (noteId && onMoveNoteToFolder) {
                            await onMoveNoteToFolder(noteId, folder.id);
                          }
                        }}
                        className={`group flex items-center justify-between px-2.5 py-1 rounded-md text-xs transition ${
                          isDragOver
                            ? 'ring-2 ring-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                            : active
                            ? 'bg-stone-200 dark:bg-zinc-800 text-stone-900 font-medium'
                            : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-900'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectFilter({ type: 'folder', folderId: folder.id })}
                          className="flex items-center gap-2 truncate flex-1 text-left"
                        >
                          <FolderIcon className="w-3 h-3 text-amber-500" />
                          <span className="truncate">{folder.name}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteFolder(folder.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-red-500 transition"
                          title="Delete folder"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Empty Trash Banner if in Trash view */}
          {currentFilter.type === 'trash' && counts.trash > 0 && (
            <div className="px-3 py-2 bg-red-50 dark:bg-red-950/40 border-b border-red-200/60 dark:border-red-900/40 flex items-center justify-between text-xs animate-in fade-in">
              <span className="text-[11px] text-red-700 dark:text-red-300 font-medium truncate">
                {counts.trash} deleted note{counts.trash > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Permanently delete all notes in the trash? This action cannot be undone.')) {
                    onEmptyTrash();
                  }
                }}
                className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold flex items-center gap-1 shadow-2xs transition flex-shrink-0"
              >
                <Trash2 className="w-3 h-3" />
                <span>Empty Trash</span>
              </button>
            </div>
          )}

          {/* Notes List with Drag & Drop & Multi-Sort */}
          <div className="px-3 py-1.5 border-b border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between text-xs text-stone-400">
            <span className="font-semibold text-[10px] uppercase tracking-wider">
              Notes ({notes.length})
            </span>
            <div className="flex items-center gap-1">
              <select
                value={`${sortField}-${sortOrder}`}
                onChange={(e) => {
                  const [f, o] = e.target.value.split('-') as [SortField, SortOrder];
                  onChangeSort(f, o);
                }}
                className="bg-transparent text-[10px] text-stone-500 dark:text-zinc-400 focus:outline-none cursor-pointer"
                title="Sort notes list"
              >
                <option value="updatedAt-desc">Modified (Newest)</option>
                <option value="updatedAt-asc">Modified (Oldest)</option>
                <option value="createdAt-desc">Created (Newest)</option>
                <option value="createdAt-asc">Created (Oldest)</option>
                <option value="title-asc">Title (A-Z)</option>
                <option value="title-desc">Title (Z-A)</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-200/40 dark:divide-zinc-800/40">
            {notes.map((note) => {
              const isActive = note.id === activeNoteId;
              return (
                <div
                  key={note.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedNoteId(note.id);
                    e.dataTransfer.setData('text/note-id', note.id);
                  }}
                  onDragEnd={() => setDraggedNoteId(null)}
                  onClick={() => onSelectNote(note)}
                  className={`group relative p-2.5 cursor-pointer transition select-none ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900 border-l-[3px] border-blue-600 shadow-2xs font-semibold'
                      : 'hover:bg-stone-100/70 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-medium text-xs truncate flex-1 text-stone-900 dark:text-stone-100">
                      {note.title || 'Untitled Note'}
                    </h4>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {note.isPinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500/20" />}
                      <div className="hidden group-hover:flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(note.id, note.isPinned);
                          }}
                          className={`p-0.5 rounded hover:bg-stone-200 dark:hover:bg-zinc-850 ${
                            note.isPinned ? 'text-amber-500' : 'text-stone-400'
                          }`}
                          title={note.isPinned ? 'Unpin' : 'Pin to top'}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(note.id, note.isFavorite);
                          }}
                          className={`p-0.5 rounded hover:bg-stone-200 dark:hover:bg-zinc-850 ${
                            note.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-stone-400'
                          }`}
                          title={note.isFavorite ? 'Favorited' : 'Favorite'}
                        >
                          <Star className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (note.isTrash) onPermanentlyDeleteNote(note.id);
                            else onDeleteNote(note.id);
                          }}
                          className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950/40 text-stone-400 hover:text-red-500"
                          title={note.isTrash ? 'Delete permanently' : 'Move to trash'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                  {noteListMode === 'detailed' && note.plainText && (
                    <p className="text-[11px] text-stone-400 dark:text-zinc-500 line-clamp-1 mt-0.5">
                      {note.plainText}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : workspaceView === 'resources' ? (
        /* RESOURCES CONTEXTUAL SIDEBAR */
        <div className="p-3 space-y-4 flex-1 overflow-y-auto">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Collections
            </span>
            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => onSelectResourceCollection && onSelectResourceCollection('all')}
                className={filterBtnClass(selectedResourceCollection === 'all')}
              >
                <span>All Resources</span>
              </button>
              {resourceCollections.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => onSelectResourceCollection && onSelectResourceCollection(col)}
                  className={filterBtnClass(selectedResourceCollection === col)}
                >
                  <span>{col}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : workspaceView === 'documents' ? (
        /* PDF DOCUMENTS CONTEXTUAL SIDEBAR */
        <div className="p-3 space-y-4 flex-1 overflow-y-auto">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              PDF Categories
            </span>
            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => onSelectPdfCollection && onSelectPdfCollection('all')}
                className={filterBtnClass(selectedPdfCollection === 'all')}
              >
                <span>All Documents</span>
              </button>
              {pdfCollections.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => onSelectPdfCollection && onSelectPdfCollection(col)}
                  className={filterBtnClass(selectedPdfCollection === col)}
                >
                  <span>{col}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* SPREADSHEETS CONTEXTUAL SIDEBAR */
        <div className="p-3 space-y-4 flex-1 overflow-y-auto">
          <div>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
              Spreadsheet Categories
            </span>
            <div className="mt-2 space-y-1">
              <button
                type="button"
                onClick={() => onSelectSpreadsheetCollection && onSelectSpreadsheetCollection('all')}
                className={filterBtnClass(selectedSpreadsheetCollection === 'all')}
              >
                <span>All Spreadsheets</span>
              </button>
              {spreadsheetCollections.map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => onSelectSpreadsheetCollection && onSelectSpreadsheetCollection(col)}
                  className={filterBtnClass(selectedSpreadsheetCollection === col)}
                >
                  <span>{col}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* RIGHT RESIZER HANDLE */}
      <div
        onMouseDown={startResizing}
        className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-600 transition z-20 group"
      >
        <div className="w-[1px] h-full bg-stone-200 dark:bg-zinc-800 mx-auto group-hover:bg-blue-500" />
      </div>
    </aside>
  );
};
