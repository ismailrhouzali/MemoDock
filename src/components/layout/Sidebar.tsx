import React, { useState } from 'react';
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
  MessageSquareHeart,
  PanelLeftClose,
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
} from '../../db/types';

interface SidebarProps {
  isOpen: boolean;
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
  sortField: SortField;
  sortOrder: SortOrder;
  onChangeSort: (field: SortField, order: SortOrder) => void;
  noteListMode?: NoteListDisplayMode;
  sidebarVisibility?: SidebarVisibility;
  onToggleSection?: (section: 'folders' | 'tags') => void;
  isMinimalistMode?: boolean;
  onToggleSidebar?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
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
  onToggleSection,
  isMinimalistMode = false,
  onToggleSidebar,
}) => {
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [activeMenuNoteId, setActiveMenuNoteId] = useState<string | null>(null);

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
        ? 'bg-stone-200/90 dark:bg-zinc-800 text-stone-900 dark:text-stone-100 font-medium'
        : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-900 hover:text-stone-900 dark:hover:text-stone-200'
    }`;

  // Width depending on sidebar mode
  const widthClass =
    sidebarVisibility.mode === 'icons'
      ? 'w-14 items-center'
      : sidebarVisibility.mode === 'compact'
      ? 'w-52 sm:w-60'
      : 'w-64 sm:w-72';

  // Minimalist Mode Sidebar matching reference screenshot media_1794476572201_959d8bbd.png
  if (isMinimalistMode || noteListMode === 'minimal') {
    return (
      <aside className="w-56 sm:w-64 flex-shrink-0 border-r border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col h-full select-none text-xs">
        {/* Minimalist Top Header: [+ New note] and [<|] collapse icon */}
        <div className="p-3 border-b border-stone-200/60 dark:border-zinc-800/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onCreateNote}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 rounded-lg transition"
            title="Create New Note"
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

        {/* Minimalist Notes List: Pure Titles with Blue Left Border for Active Note */}
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
                  {/* Subtle menu trigger on hover */}
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

                  {/* Context Menu Dropdown */}
                  {activeMenuNoteId === note.id && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuNoteId(null);
                        }}
                      />
                      <div className="absolute right-3 top-7 z-40 w-36 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg shadow-float py-1 text-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateNote(note);
                            setActiveMenuNoteId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Duplicate</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePin(note.id, note.isPinned);
                            setActiveMenuNoteId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2"
                        >
                          <Pin className="w-3.5 h-3.5" />
                          <span>{note.isPinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNote(note.id);
                            setActiveMenuNoteId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </aside>
    );
  }

  // If in Icons-only mode: render clean rail
  if (sidebarVisibility.mode === 'icons') {
    return (
      <aside className="w-14 flex-shrink-0 border-r border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col items-center py-3 space-y-3 select-none text-xs">
        <button
          type="button"
          onClick={() => onSelectFilter({ type: 'all' })}
          className={`p-2 rounded-lg transition ${isFilterActive({ type: 'all' }) ? 'bg-stone-200 dark:bg-zinc-800 text-stone-900 dark:text-stone-100' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-900'}`}
          title="All Notes"
        >
          <FileText className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter({ type: 'favorites' })}
          className={`p-2 rounded-lg transition ${isFilterActive({ type: 'favorites' }) ? 'bg-stone-200 dark:bg-zinc-800 text-amber-500' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-900'}`}
          title="Favorites"
        >
          <Star className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter({ type: 'recents' })}
          className={`p-2 rounded-lg transition ${isFilterActive({ type: 'recents' }) ? 'bg-stone-200 dark:bg-zinc-800 text-blue-500' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-900'}`}
          title="Recent"
        >
          <Clock className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter({ type: 'archived' })}
          className={`p-2 rounded-lg transition ${isFilterActive({ type: 'archived' }) ? 'bg-stone-200 dark:bg-zinc-800 text-purple-500' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-900'}`}
          title="Archived"
        >
          <Archive className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onSelectFilter({ type: 'trash' })}
          className={`p-2 rounded-lg transition ${isFilterActive({ type: 'trash' }) ? 'bg-stone-200 dark:bg-zinc-800 text-red-500' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-zinc-900'}`}
          title="Trash"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className={`${widthClass} flex-shrink-0 border-r border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col h-full select-none text-xs`}>
      {/* Top Filter Views Header */}
      <div className="p-3 border-b border-stone-200/60 dark:border-zinc-800/60 space-y-1">
        {sidebarVisibility.showAll && (
          <button
            type="button"
            onClick={() => onSelectFilter({ type: 'all' })}
            className={filterBtnClass(isFilterActive({ type: 'all' }))}
          >
            <span className="flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-stone-500" />
              <span>All Notes</span>
            </span>
            <span className="text-[11px] text-stone-400">{counts.all}</span>
          </button>
        )}

        {sidebarVisibility.showFavorites && (
          <button
            type="button"
            onClick={() => onSelectFilter({ type: 'favorites' })}
            className={filterBtnClass(isFilterActive({ type: 'favorites' }))}
          >
            <span className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-amber-500" />
              <span>Favorites</span>
            </span>
            <span className="text-[11px] text-stone-400">{counts.favorites}</span>
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
            <span className="text-[11px] text-stone-400">{counts.recents}</span>
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
            <span className="text-[11px] text-stone-400">{counts.archived}</span>
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
            <span className="text-[11px] text-stone-400">{counts.trash}</span>
          </button>
        )}
      </div>

      {/* Folders & Tags collapsible sections */}
      <div className="p-3 border-b border-stone-200/60 dark:border-zinc-800/60 space-y-3 max-h-48 overflow-y-auto">
        
        {/* Folders Section */}
        {sidebarVisibility.showFolders && (
          <div>
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
                  className="w-full px-2 py-0.5 bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded text-xs text-stone-900 dark:text-stone-100"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddFolder}
                  className="p-1 text-green-600 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingFolder(false)}
                  className="p-1 text-red-500 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {foldersOpen && (
              <div className="space-y-0.5">
                {folders.map((folder) => {
                  const active = isFilterActive({ type: 'folder', folderId: folder.id });
                  return (
                    <div
                      key={folder.id}
                      className={`group flex items-center justify-between px-2 py-1 rounded text-xs transition ${
                        active
                          ? 'bg-stone-200/90 dark:bg-zinc-800 text-stone-900 dark:text-stone-100 font-medium'
                          : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-900'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectFilter({ type: 'folder', folderId: folder.id })}
                        className="flex items-center gap-1.5 flex-1 truncate text-left"
                      >
                        <FolderIcon
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: folder.color || '#d97706' }}
                        />
                        <span className="truncate">{folder.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteFolder(folder.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-red-500 transition"
                        title="Delete Folder"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tags Section */}
        {sidebarVisibility.showTags && (
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-wider mb-1">
              <button
                type="button"
                onClick={() => {
                  setTagsOpen(!tagsOpen);
                  if (onToggleSection) onToggleSection('tags');
                }}
                className="flex items-center gap-1 hover:text-stone-700 dark:hover:text-zinc-300"
              >
                {tagsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <span>Tags</span>
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingTag(true)}
                className="p-0.5 hover:text-stone-700 dark:hover:text-zinc-300 rounded"
                title="Create Tag"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {isCreatingTag && (
              <div className="flex items-center gap-1 my-1">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') setIsCreatingTag(false);
                  }}
                  placeholder="Tag name..."
                  className="w-full px-2 py-0.5 bg-white dark:bg-zinc-900 border border-stone-300 dark:border-zinc-700 rounded text-xs text-stone-900 dark:text-stone-100"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="p-1 text-green-600 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreatingTag(false)}
                  className="p-1 text-red-500 hover:bg-stone-200 dark:hover:bg-zinc-800 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {tagsOpen && (
              <div className="flex items-center flex-wrap gap-1">
                {tags.map((tag) => {
                  const active = isFilterActive({ type: 'tag', tag: tag.name });
                  return (
                    <span
                      key={tag.id}
                      className={`group inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] transition ${
                        active
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 font-medium'
                          : 'bg-stone-200/60 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-200 dark:hover:bg-zinc-700'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => onSelectFilter({ type: 'tag', tag: tag.name })}
                        className="flex items-center gap-1"
                      >
                        <Hash className="w-2.5 h-2.5 opacity-60" />
                        <span>{tag.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteTag(tag.id, tag.name)}
                        className="opacity-0 group-hover:opacity-100 hover:text-red-500 transition"
                        title="Delete Tag"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sort & Notes List Controls Header */}
      <div className="px-3 py-2 border-b border-stone-200/50 dark:border-zinc-800/50 flex items-center justify-between text-xs text-stone-500 dark:text-zinc-400">
        <span className="font-medium text-[11px] uppercase tracking-wider text-stone-400">
          Notes ({notes.length})
        </span>

        {/* Empty Trash Button if viewing trash */}
        {currentFilter.type === 'trash' && notes.length > 0 && (
          <button
            type="button"
            onClick={onEmptyTrash}
            className="px-2 py-0.5 rounded text-[11px] bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 transition"
          >
            Empty Trash
          </button>
        )}

        {/* Sort dropdown */}
        <div className="flex items-center gap-1">
          <select
            value={`${sortField}-${sortOrder}`}
            onChange={(e) => {
              const [f, o] = e.target.value.split('-') as [SortField, SortOrder];
              onChangeSort(f, o);
            }}
            className="bg-transparent text-[11px] text-stone-500 dark:text-zinc-400 focus:outline-none cursor-pointer"
          >
            <option value="updatedAt-desc">Latest</option>
            <option value="createdAt-desc">Newest</option>
            <option value="title-asc">Title</option>
          </select>
        </div>
      </div>

      {/* Note Cards List (Detailed, Compact, or Minimalist Mode) */}
      <div className="flex-1 overflow-y-auto divide-y divide-stone-200/40 dark:divide-zinc-800/40">
        {notes.length === 0 ? (
          <div className="p-6 text-center text-stone-400 dark:text-zinc-600 text-xs space-y-2">
            <p>No notes found in this view.</p>
            {currentFilter.type !== 'trash' && (
              <button
                type="button"
                onClick={onCreateNote}
                className="px-3 py-1 bg-stone-200/70 hover:bg-stone-300/70 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded text-stone-800 dark:text-zinc-200 text-xs transition"
              >
                Create note
              </button>
            )}
          </div>
        ) : (
          notes.map((note) => {
            const isActive = note.id === activeNoteId;
            const snippet = note.plainText
              ? note.plainText.slice(0, 80).replace(/\s+/g, ' ')
              : 'Empty note...';

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note)}
                className={`relative group cursor-pointer transition ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 shadow-sm border-l-2 border-stone-800 dark:border-stone-100'
                    : 'hover:bg-stone-100/70 dark:hover:bg-zinc-900/60'
                } ${noteListMode === 'compact' ? 'p-2.5' : 'p-3'}`}
              >
                {/* Note title line */}
                <div className="flex items-center justify-between gap-1">
                  <h4
                    className={`font-medium text-xs truncate flex-1 ${
                      isActive
                        ? 'text-stone-900 dark:text-stone-100 font-semibold'
                        : 'text-stone-700 dark:text-zinc-300'
                    }`}
                  >
                    {note.title || 'Untitled Note'}
                  </h4>

                  {/* Indicators / Badges */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {note.isPinned && (
                      <Pin className="w-3 h-3 text-amber-600 dark:text-amber-500" />
                    )}
                    {note.isFavorite && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    )}

                    {/* Context menu trigger */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuNoteId(
                          activeMenuNoteId === note.id ? null : note.id
                        );
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded transition"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Detailed Mode: Snippet & Metadata */}
                {noteListMode === 'detailed' && (
                  <>
                    <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2 leading-relaxed my-1">
                      {snippet}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-stone-400 dark:text-zinc-500">
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      {note.tags && note.tags.length > 0 && (
                        <div className="flex items-center gap-1 truncate max-w-[120px]">
                          {note.tags.slice(0, 2).map((t) => (
                            <span
                              key={t}
                              className="px-1.5 py-0.2 rounded bg-stone-200/50 dark:bg-zinc-800 text-[9px]"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Compact Mode: Date Only */}
                {noteListMode === 'compact' && (
                  <div className="text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
                    <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                  </div>
                )}

                {/* Minimalist Mode: No preview, no date, pure title only! */}

                {/* Context Menu Dropdown */}
                {activeMenuNoteId === note.id && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuNoteId(null);
                      }}
                    />
                    <div className="absolute right-3 top-8 z-40 w-36 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg shadow-float py-1 text-xs">
                      {currentFilter.type === 'trash' ? (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRestoreNote(note.id);
                              setActiveMenuNoteId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore Note</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onPermanentlyDeleteNote(note.id);
                              setActiveMenuNoteId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Forever</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(note.id, note.isPinned);
                              setActiveMenuNoteId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2"
                          >
                            <Pin className="w-3.5 h-3.5" />
                            <span>{note.isPinned ? 'Unpin' : 'Pin to top'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleFavorite(note.id, note.isFavorite);
                              setActiveMenuNoteId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2"
                          >
                            <Star className="w-3.5 h-3.5" />
                            <span>{note.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDuplicateNote(note);
                              setActiveMenuNoteId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-200 flex items-center gap-2"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicate</span>
                          </button>
                          <div className="h-px bg-stone-200 dark:bg-zinc-800 my-1" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteNote(note.id);
                              setActiveMenuNoteId(null);
                            }}
                            className="w-full text-left px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 flex items-center gap-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Move to Trash</span>
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer with Feedback */}
      <div className="p-2 border-t border-stone-200/60 dark:border-zinc-800/60 flex items-center justify-between text-[11px] text-stone-400 dark:text-zinc-500 bg-stone-100/40 dark:bg-zinc-950/40 flex-shrink-0">
        <span>MemoDock V2</span>
        <a
          href="https://forms.gle/notebook-feedback-placeholder"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition"
          title="Share Feedback & Suggestions"
        >
          <MessageSquareHeart className="w-3 h-3 text-amber-500" />
          <span>Feedback</span>
        </a>
      </div>
    </aside>
  );
};
