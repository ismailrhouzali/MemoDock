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
  FolderPlus,
  Edit2,
  FolderInput,
} from 'lucide-react';
import { IconPicker } from '../common/IconPicker';
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
    folders?: Record<string, number>;
  };
  activeNoteId: string | null;
  currentFilter: ViewFilter;
  onSelectFilter: (filter: ViewFilter) => void;
  onSelectNote: (note: Note) => void;
  onCreateNote: (initialProps?: Partial<Note>) => void | Promise<void>;
  onDeleteNote: (id: string) => void;
  onRestoreNote: (id: string) => void;
  onPermanentlyDeleteNote: (id: string) => void;
  onDuplicateNote: (note: Note) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onCreateFolder: (name: string, color?: string) => Promise<Folder>;
  onUpdateFolder?: (id: string, name: string, color?: string, icon?: string | null) => Promise<void>;
  onDeleteFolder: (id: string) => Promise<void>;
  onCreateTag: (name: string, color?: string) => Promise<Tag>;
  onDeleteTag: (id: string, name: string) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
  onMoveNoteToFolder?: (noteId: string, folderId: string | null) => Promise<void>;
  onUpdateNote?: (id: string, updates: Partial<Note>) => Promise<void>;
  onReorderNotes?: (draggedId: string, targetId: string) => Promise<void>;
  onReorderFolders?: (draggedId: string, targetId: string) => Promise<void>;
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
  onUpdateFolder,
  onDeleteFolder,
  onCreateTag,
  onDeleteTag,
  onEmptyTrash,
  onMoveNoteToFolder,
  onUpdateNote,
  onReorderNotes,
  onReorderFolders,
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

  // Minimalist & Full CRUD states
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteTitle, setEditingNoteTitle] = useState('');
  const [movingNoteId, setMovingNoteId] = useState<string | null>(null);
  const [iconPickerTarget, setIconPickerTarget] = useState<{
    type: 'folder' | 'note';
    id: string;
    rect: { top: number; left: number; bottom: number };
  } | null>(null);
  // Folders are closed (collapsed) by default
  const [expandedFolderIds, setExpandedFolderIds] = useState<Set<string>>(new Set());

  // Auto-expand folder when active note is inside it
  useEffect(() => {
    if (activeNoteId) {
      const active = notes.find((n) => n.id === activeNoteId);
      if (active?.folderId && !expandedFolderIds.has(active.folderId)) {
        setExpandedFolderIds((prev) => new Set(prev).add(active.folderId!));
      }
    }
  }, [activeNoteId]);

  // In minimalist mode, ensure all notes are available so the unified tree displays all folders and notes together
  useEffect(() => {
    if ((isMinimalistMode || noteListMode === 'minimal') && currentFilter.type === 'folder') {
      onSelectFilter({ type: 'all' });
    }
  }, [isMinimalistMode, noteListMode, currentFilter.type]);

  // Drag and drop state
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverReorderFolderId, setDragOverReorderFolderId] = useState<string | null>(null);
  const [dragOverNoteId, setDragOverNoteId] = useState<string | null>(null);
  const [dragOverNavTarget, setDragOverNavTarget] = useState<'all' | 'favorites' | 'trash' | null>(null);

  // Close open dropdown menus on click outside or escape
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-menu-container]')) return;
      setActiveMenuNoteId(null);
      setMovingNoteId(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenuNoteId(null);
        setMovingNoteId(null);
        setEditingFolderId(null);
        setEditingNoteId(null);
        setIsCreatingFolder(false);
      }
    };

    window.addEventListener('mousedown', handleDocumentClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleDocumentClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  const handleRenameFolder = async (folderId: string) => {
    if (editingFolderName.trim() && onUpdateFolder) {
      await onUpdateFolder(folderId, editingFolderName.trim());
    }
    setEditingFolderId(null);
    setEditingFolderName('');
  };

  const handleDeleteFolder = async (folderId: string, folderName: string) => {
    if (window.confirm(`Supprimer le dossier "${folderName}" ? Les notes contenues ne seront pas supprimées.`)) {
      await onDeleteFolder(folderId);
      if (currentFilter.type === 'folder' && currentFilter.folderId === folderId) {
        onSelectFilter({ type: 'all' });
      }
    }
  };

  const handleRenameNote = async (noteId: string) => {
    if (editingNoteTitle.trim() && onUpdateNote) {
      await onUpdateNote(noteId, { title: editingNoteTitle.trim() });
    }
    setEditingNoteId(null);
    setEditingNoteTitle('');
  };

  const handleMoveNote = async (noteId: string, folderId: string | null) => {
    if (onMoveNoteToFolder) {
      await onMoveNoteToFolder(noteId, folderId);
    }
    setActiveMenuNoteId(null);
    setMovingNoteId(null);
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

  // Minimalist Mode Sidebar (Unified Tree: Folders + Notes with bidirectional Drag & Drop reordering)
  if (isMinimalistMode || noteListMode === 'minimal') {
    // Partition notes by folder
    const existingFolderIds = new Set(folders.map((f) => f.id));
    const notesByFolder: Record<string, Note[]> = {};
    for (const f of folders) {
      notesByFolder[f.id] = [];
    }
    const rootNotes: Note[] = [];

    for (const n of notes) {
      if (n.folderId && existingFolderIds.has(n.folderId)) {
        notesByFolder[n.folderId].push(n);
      } else {
        rootNotes.push(n);
      }
    }

    const toggleFolderCollapse = (folderId: string) => {
      setExpandedFolderIds((prev) => {
        const next = new Set(prev);
        if (next.has(folderId)) {
          next.delete(folderId);
        } else {
          next.add(folderId);
        }
        return next;
      });
    };

    const handleCreateNoteInFolder = async (folderId: string) => {
      setExpandedFolderIds((prev) => new Set(prev).add(folderId));
      await onCreateNote({ folderId });
    };

    // Shared note item renderer for unified styling
    const renderNoteItem = (note: Note, isInsideFolder = false) => {
      const isActive = note.id === activeNoteId;
      const isDragOver = dragOverNoteId === note.id;
      const isMenuOpen = activeMenuNoteId === note.id;
      const isEditing = editingNoteId === note.id;

      if (isEditing) {
        return (
          <div
            key={note.id}
            className={`flex items-center gap-1 py-1.5 bg-white dark:bg-zinc-900 border-y border-stone-200 dark:border-zinc-800 ${
              isInsideFolder ? 'pl-7 pr-3 border-l-2 border-l-blue-500' : 'px-3 border-l-[3px] border-blue-600'
            }`}
          >
            <input
              type="text"
              value={editingNoteTitle}
              onChange={(e) => setEditingNoteTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameNote(note.id);
                if (e.key === 'Escape') setEditingNoteId(null);
              }}
              className="w-full bg-transparent text-xs text-stone-900 dark:text-zinc-100 font-semibold focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={() => handleRenameNote(note.id)}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              title="Enregistrer"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setEditingNoteId(null)}
              className="p-1 text-stone-400 hover:text-red-500 rounded"
              title="Annuler"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        );
      }

      return (
        <div
          key={note.id}
          draggable={!editingNoteId}
          onDragStart={(e) => {
            e.stopPropagation();
            setDraggedNoteId(note.id);
            setDraggedFolderId(null);
            e.dataTransfer.setData('text/note-id', note.id);
            e.dataTransfer.setData('text/plain', note.id);
            e.dataTransfer.effectAllowed = 'move';
          }}
          onDragEnd={() => {
            setDraggedNoteId(null);
            setDragOverNoteId(null);
            setDragOverFolderId(null);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.dropEffect = 'move';
            if (draggedNoteId && draggedNoteId !== note.id) {
              setDragOverNoteId(note.id);
            }
          }}
          onDragLeave={(e) => {
            const related = e.relatedTarget as Node | null;
            if (!e.currentTarget.contains(related)) {
              if (dragOverNoteId === note.id) setDragOverNoteId(null);
            }
          }}
          onDrop={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const srcId = e.dataTransfer.getData('text/note-id') || draggedNoteId;
            setDragOverNoteId(null);
            setDraggedNoteId(null);
            if (srcId && srcId !== note.id) {
              // 1. Move to this note's folder (or root)
              if (onMoveNoteToFolder) {
                await onMoveNoteToFolder(srcId, note.folderId || null);
              }
              // 2. Reorder notes
              if (onReorderNotes) {
                await onReorderNotes(srcId, note.id);
                onChangeSort('order', 'asc');
              }
              // 3. If target note is in a folder, expand it
              if (note.folderId) {
                setExpandedFolderIds((prev) => new Set(prev).add(note.folderId!));
              }
            }
          }}
          onClick={() => onSelectNote(note)}
          className={`group relative flex items-center justify-between py-1.5 cursor-pointer transition text-xs select-none ${
            isInsideFolder ? 'pl-7 pr-3' : 'px-4'
          } ${
            isDragOver
              ? 'border-t-2 border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-400/50'
              : isActive
              ? 'border-l-[3px] border-blue-600 bg-stone-200/80 dark:bg-zinc-800/90 text-stone-900 dark:text-stone-100 font-semibold'
              : 'border-l-[3px] border-transparent text-stone-700 dark:text-zinc-300 hover:bg-stone-100/70 dark:hover:bg-zinc-900/60 font-normal'
          }`}
        >
          <div className="flex items-center gap-1 truncate flex-1 relative">
            <GripVertical className="w-3 h-3 text-stone-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition flex-shrink-0 cursor-grab active:cursor-grabbing mr-0.5" />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                setIconPickerTarget(
                  iconPickerTarget?.type === 'note' && iconPickerTarget.id === note.id
                    ? null
                    : { type: 'note', id: note.id, rect: { top: r.top, left: r.left, bottom: r.bottom } }
                );
              }}
              className="p-0.5 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-700/70 flex-shrink-0 transition"
              title="Change note icon"
            >
              {note.icon ? (
                <span className="text-xs leading-none">{note.icon}</span>
              ) : (
                <FileText className="w-3 h-3 text-stone-400" />
              )}
            </button>
            {iconPickerTarget?.type === 'note' && iconPickerTarget.id === note.id && onUpdateNote && (
              <IconPicker
                currentIcon={note.icon}
                anchorRect={iconPickerTarget.rect}
                onSelect={(icon) => onUpdateNote(note.id, { icon })}
                onClose={() => setIconPickerTarget(null)}
              />
            )}
            {note.isPinned && <Pin className="w-3 h-3 text-amber-500 fill-amber-500/20 flex-shrink-0" />}
            <span className="truncate block flex-1">{note.title || 'Untitled Note'}</span>
          </div>

          <div className="relative flex items-center">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenuNoteId(isMenuOpen ? null : note.id);
                setMovingNoteId(null);
              }}
              className={`p-1 rounded text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 transition ${
                isMenuOpen ? 'opacity-100 bg-stone-200 dark:bg-zinc-800' : 'opacity-0 group-hover:opacity-100'
              }`}
              title="Options de la note"
            >
              <MoreVertical className="w-3 h-3" />
            </button>

            {/* Note Action Dropdown Menu */}
            {isMenuOpen && (
              <div
                data-menu-container
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-full mt-1 z-50 w-48 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-xs text-stone-700 dark:text-zinc-200 animate-in fade-in zoom-in-95 duration-100"
              >
                {movingNoteId === note.id ? (
                  /* Folder Picker View */
                  <div className="py-1">
                    <div className="px-3 py-1 font-semibold text-[10px] text-stone-400 uppercase tracking-wider flex items-center justify-between">
                      <span>Déplacer vers</span>
                      <button
                        type="button"
                        onClick={() => setMovingNoteId(null)}
                        className="text-blue-500 hover:underline text-[10px]"
                      >
                        Retour
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMoveNote(note.id, null)}
                      className={`w-full px-3 py-1.5 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition ${
                        !note.folderId ? 'font-semibold text-blue-600' : ''
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 opacity-60" />
                      <span className="truncate">Racine (sans dossier)</span>
                    </button>
                    {folders.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => handleMoveNote(note.id, f.id)}
                        className={`w-full px-3 py-1.5 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition ${
                          note.folderId === f.id ? 'font-semibold text-blue-600' : ''
                        }`}
                      >
                        <FolderIcon className="w-3.5 h-3.5 text-amber-500" />
                        <span className="truncate">{f.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  /* Standard Actions */
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingNoteId(note.id);
                        setEditingNoteTitle(note.title);
                        setActiveMenuNoteId(null);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-stone-400" />
                      <span>Renommer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMovingNoteId(note.id)}
                      className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition"
                    >
                      <span className="flex items-center gap-2">
                        <FolderInput className="w-3.5 h-3.5 text-stone-400" />
                        <span>Déplacer vers...</span>
                      </span>
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onDuplicateNote(note);
                        setActiveMenuNoteId(null);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition"
                    >
                      <Copy className="w-3.5 h-3.5 text-stone-400" />
                      <span>Dupliquer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onTogglePin(note.id, note.isPinned);
                        setActiveMenuNoteId(null);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition"
                    >
                      <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} />
                      <span>{note.isPinned ? 'Désépingler' : 'Épingler en haut'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleFavorite(note.id, note.isFavorite);
                        setActiveMenuNoteId(null);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-stone-100 dark:hover:bg-zinc-800 text-left transition"
                    >
                      <Star className={`w-3.5 h-3.5 ${note.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-stone-400'}`} />
                      <span>{note.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}</span>
                    </button>

                    <div className="border-t border-stone-200/60 dark:border-zinc-800 my-1" />

                    <button
                      type="button"
                      onClick={() => {
                        if (note.isTrash) {
                          onPermanentlyDeleteNote(note.id);
                        } else {
                          onDeleteNote(note.id);
                        }
                        setActiveMenuNoteId(null);
                      }}
                      className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 text-left transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{note.isTrash ? 'Supprimer définitivement' : 'Mettre à la corbeille'}</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <aside
        style={{ width: `${currentWidth}px` }}
        className="relative flex-shrink-0 border-r border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/70 dark:bg-zinc-950/70 backdrop-blur-md flex flex-col h-full select-none text-xs"
      >
        {/* Minimalist Top Header */}
        <div className="p-3 border-b border-stone-200/60 dark:border-zinc-800/60 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => onCreateNote()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50/80 dark:hover:bg-blue-950/40 rounded-lg transition"
            title="Nouvelle note (Ctrl+N)"
          >
            <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>New note</span>
          </button>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCreatingFolder(true)}
              className="p-1.5 text-stone-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-md transition"
              title="Nouveau dossier"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded-md transition"
                title="Masquer la barre latérale"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Inline Folder Creation Form (at top of tree) */}
        {isCreatingFolder && (
          <div className="mx-2.5 my-2 p-1.5 bg-white dark:bg-zinc-900 border border-blue-400/80 dark:border-blue-500/80 rounded-md shadow-xs flex items-center gap-1.5 animate-in fade-in duration-100 flex-shrink-0">
            <FolderIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddFolder();
                if (e.key === 'Escape') {
                  setIsCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              placeholder="Nom du dossier..."
              className="w-full bg-transparent text-xs text-stone-800 dark:text-zinc-100 placeholder-stone-400 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddFolder}
              className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded transition"
              title="Valider"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreatingFolder(false);
                setNewFolderName('');
              }}
              className="p-1 text-stone-400 hover:text-red-500 rounded transition"
              title="Annuler"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Unified Tree: Folders + Notes together in the same continuous scrollable list */}
        <div
          className="flex-1 overflow-y-auto py-1"
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
          }}
          onDrop={async (e) => {
            e.preventDefault();
            const srcNoteId = e.dataTransfer.getData('text/note-id') || draggedNoteId;
            setDragOverFolderId(null);
            setDragOverNoteId(null);
            setDragOverReorderFolderId(null);
            setDraggedNoteId(null);
            setDraggedFolderId(null);
            if (srcNoteId && onMoveNoteToFolder) {
              await onMoveNoteToFolder(srcNoteId, null);
            }
          }}
        >
          {folders.length === 0 && notes.length === 0 ? (
            <div className="p-6 text-center text-stone-400 dark:text-zinc-600 text-xs">
              Aucune note ni dossier. Cliquez sur "New note" pour commencer.
            </div>
          ) : (
            <>
              {/* Folders and their nested notes */}
              {folders.map((folder) => {
                const isCollapsed = !expandedFolderIds.has(folder.id);
                const isDragOverAsContainer = dragOverFolderId === folder.id;
                const isDragOverReorder = dragOverReorderFolderId === folder.id;
                const isEditing = editingFolderId === folder.id;
                const folderNotes = notesByFolder[folder.id] || [];

                return (
                  <div key={folder.id} className="mb-0.5">
                    {/* Folder Row */}
                    {isEditing ? (
                      <div className="flex items-center gap-1 mx-2 my-1 px-2 py-1 bg-white dark:bg-zinc-900 border border-blue-400 rounded-md">
                        <FolderIcon className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <input
                          type="text"
                          value={editingFolderName}
                          onChange={(e) => setEditingFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameFolder(folder.id);
                            if (e.key === 'Escape') setEditingFolderId(null);
                          }}
                          className="w-full bg-transparent text-xs text-stone-800 dark:text-zinc-100 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleRenameFolder(folder.id)}
                          className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="Enregistrer"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFolderId(null)}
                          className="p-0.5 text-stone-400 hover:text-red-500 rounded"
                          title="Annuler"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        draggable={!editingFolderId}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setDraggedFolderId(folder.id);
                          setDraggedNoteId(null);
                          e.dataTransfer.setData('text/folder-id', folder.id);
                          e.dataTransfer.setData('text/plain', folder.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragEnd={() => {
                          setDraggedFolderId(null);
                          setDragOverReorderFolderId(null);
                          setDragOverFolderId(null);
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          e.dataTransfer.dropEffect = 'move';
                          if (draggedFolderId && draggedFolderId !== folder.id) {
                            setDragOverReorderFolderId(folder.id);
                            setDragOverFolderId(null);
                          } else if (draggedNoteId || !draggedFolderId) {
                            setDragOverFolderId(folder.id);
                            setDragOverReorderFolderId(null);
                          }
                        }}
                        onDragLeave={(e) => {
                          const related = e.relatedTarget as Node | null;
                          if (!e.currentTarget.contains(related)) {
                            if (dragOverFolderId === folder.id) setDragOverFolderId(null);
                            if (dragOverReorderFolderId === folder.id) setDragOverReorderFolderId(null);
                          }
                        }}
                        onDrop={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const srcFolderId = e.dataTransfer.getData('text/folder-id') || draggedFolderId;
                          const srcNoteId = e.dataTransfer.getData('text/note-id') || draggedNoteId;
                          setDragOverFolderId(null);
                          setDragOverReorderFolderId(null);
                          setDraggedFolderId(null);
                          setDraggedNoteId(null);

                          if (srcFolderId && srcFolderId !== folder.id && onReorderFolders) {
                            await onReorderFolders(srcFolderId, folder.id);
                          } else if (srcNoteId && onMoveNoteToFolder) {
                            await onMoveNoteToFolder(srcNoteId, folder.id);
                            // Auto-expand folder so user immediately sees the dropped note inside
                            setExpandedFolderIds((prev) => new Set(prev).add(folder.id));
                          }
                        }}
                        onClick={() => toggleFolderCollapse(folder.id)}
                        className={`group flex items-center justify-between px-3 py-1.5 cursor-pointer text-xs rounded-md mx-1 transition ${
                          isDragOverAsContainer
                            ? 'ring-2 ring-blue-500 bg-blue-100/80 dark:bg-blue-950/60 font-semibold'
                            : isDragOverReorder
                            ? 'border-t-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                            : 'text-stone-700 dark:text-zinc-300 hover:bg-stone-100/80 dark:hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 truncate flex-1 relative">
                          <GripVertical className="w-3 h-3 text-stone-300 dark:text-zinc-600 opacity-0 group-hover:opacity-100 transition flex-shrink-0 cursor-grab active:cursor-grabbing -mr-0.5" />
                          <span className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200">
                            {isCollapsed ? (
                              <ChevronRight className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const r = e.currentTarget.getBoundingClientRect();
                              setIconPickerTarget(
                                iconPickerTarget?.type === 'folder' && iconPickerTarget.id === folder.id
                                  ? null
                                  : { type: 'folder', id: folder.id, rect: { top: r.top, left: r.left, bottom: r.bottom } }
                              );
                            }}
                            className="p-0.5 rounded hover:bg-stone-200/70 dark:hover:bg-zinc-700/70 flex-shrink-0 transition"
                            title="Change folder icon"
                          >
                            {folder.icon ? (
                              <span className="text-xs leading-none">{folder.icon}</span>
                            ) : (
                              <FolderIcon
                                className="w-3.5 h-3.5 flex-shrink-0"
                                style={{ color: folder.color || '#d97706' }}
                              />
                            )}
                          </button>
                          {iconPickerTarget?.type === 'folder' && iconPickerTarget.id === folder.id && onUpdateFolder && (
                            <IconPicker
                              currentIcon={folder.icon}
                              anchorRect={iconPickerTarget.rect}
                              onSelect={(icon) => onUpdateFolder(folder.id, folder.name, folder.color, icon ?? null)}
                              onClose={() => setIconPickerTarget(null)}
                            />
                          )}
                          <span className="truncate font-semibold text-stone-800 dark:text-zinc-200">
                            {folder.name}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-60 font-mono group-hover:hidden">
                            {folderNotes.length}
                          </span>
                          <div className="hidden group-hover:flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCreateNoteInFolder(folder.id);
                              }}
                              className="p-0.5 text-stone-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
                              title="Nouvelle note dans ce dossier"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolderId(folder.id);
                                setEditingFolderName(folder.name);
                              }}
                              className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
                              title="Renommer le dossier"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id, folder.name);
                              }}
                              className="p-0.5 text-stone-400 hover:text-red-500 rounded"
                              title="Supprimer le dossier"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Child notes nested directly underneath */}
                    {!isCollapsed && (
                      <div className="space-y-0.5">
                        {folderNotes.length === 0 ? (
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              e.dataTransfer.dropEffect = 'move';
                              setDragOverFolderId(folder.id);
                            }}
                            onDragLeave={(e) => {
                              const related = e.relatedTarget as Node | null;
                              if (!e.currentTarget.contains(related)) {
                                if (dragOverFolderId === folder.id) setDragOverFolderId(null);
                              }
                            }}
                            onDrop={async (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const srcNoteId = e.dataTransfer.getData('text/note-id') || draggedNoteId;
                              setDragOverFolderId(null);
                              setDraggedNoteId(null);
                              if (srcNoteId && onMoveNoteToFolder) {
                                await onMoveNoteToFolder(srcNoteId, folder.id);
                              }
                            }}
                            onClick={() => handleCreateNoteInFolder(folder.id)}
                            className={`pl-8 pr-3 py-1.5 text-[11px] italic cursor-pointer transition flex items-center gap-1 rounded mx-1 ${
                              isDragOverAsContainer
                                ? 'ring-2 ring-blue-500 bg-blue-100/70 dark:bg-blue-950/50 text-blue-600 font-medium'
                                : 'text-stone-400 hover:text-blue-600'
                            }`}
                          >
                            <Plus className="w-3 h-3" />
                            <span>Déposer une note ici ou cliquer pour créer...</span>
                          </div>
                        ) : (
                          folderNotes.map((note) => renderNoteItem(note, true))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Root Notes (Notes without a folder in the same continuous stream) */}
              {rootNotes.map((note) => renderNoteItem(note, false))}
            </>
          )}
        </div>

        {/* Bottom Bar: Access to Trash if any trashed notes exist */}
        {counts.trash > 0 && (
          <div className="p-2 border-t border-stone-200/50 dark:border-zinc-800/50 flex-shrink-0">
            <button
              type="button"
              onClick={() => onSelectFilter(currentFilter.type === 'trash' ? { type: 'all' } : { type: 'trash' })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition ${
                currentFilter.type === 'trash'
                  ? 'bg-red-100 dark:bg-red-950/60 text-red-900 dark:text-red-200 font-medium'
                  : 'text-stone-500 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-900'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                <span>Corbeille</span>
              </span>
              <span className="text-[10px] opacity-70 font-mono">{counts.trash}</span>
            </button>
          </div>
        )}

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
          {workspaceView === 'databases' && <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
          {workspaceView === 'documents' && <Files className="w-3.5 h-3.5 text-red-500" />}
          {workspaceView === 'dashboard' && <Bookmark className="w-3.5 h-3.5 text-purple-600" />}
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
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverNavTarget('all');
                }}
                onDragLeave={() => setDragOverNavTarget(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverNavTarget(null);
                  const noteId = e.dataTransfer.getData('text/note-id') || draggedNoteId;
                  if (noteId && onMoveNoteToFolder) {
                    await onMoveNoteToFolder(noteId, null);
                  }
                }}
                className={`${filterBtnClass(isFilterActive({ type: 'all' }))} ${
                  dragOverNavTarget === 'all' ? 'ring-2 ring-blue-500 bg-blue-50/70 dark:bg-blue-950/40' : ''
                }`}
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
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverNavTarget('favorites');
                }}
                onDragLeave={() => setDragOverNavTarget(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverNavTarget(null);
                  const noteId = e.dataTransfer.getData('text/note-id') || draggedNoteId;
                  if (noteId) {
                    onToggleFavorite(noteId, false);
                  }
                }}
                className={`${filterBtnClass(isFilterActive({ type: 'favorites' }))} ${
                  dragOverNavTarget === 'favorites' ? 'ring-2 ring-amber-500 bg-amber-50/70 dark:bg-amber-950/40' : ''
                }`}
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
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                  setDragOverNavTarget('trash');
                }}
                onDragLeave={() => setDragOverNavTarget(null)}
                onDrop={async (e) => {
                  e.preventDefault();
                  setDragOverNavTarget(null);
                  const noteId = e.dataTransfer.getData('text/note-id') || draggedNoteId;
                  if (noteId) {
                    onDeleteNote(noteId);
                  }
                }}
                className={`${filterBtnClass(isFilterActive({ type: 'trash' }))} ${
                  dragOverNavTarget === 'trash' ? 'ring-2 ring-red-500 bg-red-50/70 dark:bg-red-950/40' : ''
                }`}
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
                    const folderCount = counts.folders?.[folder.id] ?? 0;
                    const isEditing = editingFolderId === folder.id;

                    if (isEditing) {
                      return (
                        <div
                          key={folder.id}
                          className="flex items-center gap-1 px-2 py-0.5 bg-white dark:bg-zinc-900 border border-blue-400 rounded-md"
                        >
                          <FolderIcon className="w-3 h-3 text-amber-500 flex-shrink-0" />
                          <input
                            type="text"
                            value={editingFolderName}
                            onChange={(e) => setEditingFolderName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleRenameFolder(folder.id);
                              if (e.key === 'Escape') setEditingFolderId(null);
                            }}
                            className="w-full bg-transparent text-xs text-stone-800 dark:text-zinc-100 focus:outline-none"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleRenameFolder(folder.id)}
                            className="p-0.5 text-emerald-600 hover:bg-emerald-50 rounded"
                            title="Enregistrer"
                          >
                            <Check className="w-2.5 h-2.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingFolderId(null)}
                            className="p-0.5 text-stone-400 hover:text-red-500 rounded"
                            title="Annuler"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      );
                    }

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
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] opacity-60 font-mono group-hover:hidden">
                            {folderCount}
                          </span>
                          <div className="hidden group-hover:flex items-center gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingFolderId(folder.id);
                                setEditingFolderName(folder.name);
                              }}
                              className="p-0.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
                              title="Renommer le dossier"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id, folder.name);
                              }}
                              className="p-0.5 hover:text-red-500 transition"
                              title="Supprimer le dossier"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
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
                <option value="order-asc">Custom Drag & Drop</option>
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
              const isDragOver = dragOverNoteId === note.id;
              return (
                <div
                  key={note.id}
                  draggable
                  onDragStart={(e) => {
                    setDraggedNoteId(note.id);
                    e.dataTransfer.setData('text/note-id', note.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => {
                    setDraggedNoteId(null);
                    setDragOverNoteId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                    if (draggedNoteId && draggedNoteId !== note.id) {
                      setDragOverNoteId(note.id);
                    }
                  }}
                  onDragLeave={() => {
                    if (dragOverNoteId === note.id) setDragOverNoteId(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    const srcId = e.dataTransfer.getData('text/note-id') || draggedNoteId;
                    setDragOverNoteId(null);
                    setDraggedNoteId(null);
                    if (srcId && srcId !== note.id && onReorderNotes) {
                      await onReorderNotes(srcId, note.id);
                      onChangeSort('order', 'asc');
                    }
                  }}
                  onClick={() => onSelectNote(note)}
                  className={`group relative p-2.5 cursor-pointer transition select-none ${
                    isDragOver
                      ? 'ring-2 ring-blue-500 bg-blue-50/70 dark:bg-blue-950/40 border-t-2 border-t-blue-500'
                      : isActive
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
      ) : workspaceView === 'databases' ? (
        /* DATABASES CONTEXTUAL SIDEBAR */
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
