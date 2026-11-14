import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Note, Folder, Tag, ViewFilter, SortField, SortOrder } from '../db/types';

export function useNotes(
  currentFilter: ViewFilter,
  searchQuery: string,
  sortField: SortField = 'updatedAt',
  sortOrder: SortOrder = 'desc'
) {
  const notes = useLiveQuery(async () => {
    let collection = db.notes.toCollection();

    // Base query depending on view
    let allNotes = await collection.toArray();

    // Filter by view
    if (currentFilter.type === 'trash') {
      allNotes = allNotes.filter((n) => n.isTrash);
    } else {
      // In all other views, exclude trashed notes
      allNotes = allNotes.filter((n) => !n.isTrash);

      if (currentFilter.type === 'favorites') {
        allNotes = allNotes.filter((n) => n.isFavorite && !n.isArchived);
      } else if (currentFilter.type === 'archived') {
        allNotes = allNotes.filter((n) => n.isArchived);
      } else if (currentFilter.type === 'recents') {
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        allNotes = allNotes.filter((n) => n.updatedAt >= sevenDaysAgo && !n.isArchived);
      } else if (currentFilter.type === 'folder') {
        allNotes = allNotes.filter(
          (n) => n.folderId === currentFilter.folderId && !n.isArchived
        );
      } else if (currentFilter.type === 'tag') {
        allNotes = allNotes.filter(
          (n) => n.tags && n.tags.includes(currentFilter.tag) && !n.isArchived
        );
      } else if (currentFilter.type === 'all') {
        allNotes = allNotes.filter((n) => !n.isArchived);
      }
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      allNotes = allNotes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.plainText.toLowerCase().includes(q) ||
          (n.tags && n.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // Sort notes: pinned notes always on top (unless viewing trash)
    allNotes.sort((a, b) => {
      if (currentFilter.type !== 'trash') {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
      }

      let comparison = 0;
      if (sortField === 'order') {
        const orderA = a.order !== undefined ? a.order : a.updatedAt;
        const orderB = b.order !== undefined ? b.order : b.updatedAt;
        comparison = orderA - orderB;
      } else if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'createdAt') {
        comparison = a.createdAt - b.createdAt;
      } else {
        comparison = a.updatedAt - b.updatedAt;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return allNotes;
  }, [currentFilter, searchQuery, sortField, sortOrder]);

  const folders = useLiveQuery(() => db.folders.toArray(), []);
  const tags = useLiveQuery(() => db.tags.toArray(), []);

  // Counts for sidebar badges
  const counts = useLiveQuery(async () => {
    const all = await db.notes.toArray();
    const active = all.filter((n) => !n.isTrash && !n.isArchived);
    const favorites = all.filter((n) => !n.isTrash && n.isFavorite && !n.isArchived);
    const archived = all.filter((n) => !n.isTrash && n.isArchived);
    const trash = all.filter((n) => n.isTrash);
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recents = all.filter((n) => !n.isTrash && !n.isArchived && n.updatedAt >= sevenDaysAgo);

    const folderCounts: Record<string, number> = {};
    for (const n of active) {
      if (n.folderId) {
        folderCounts[n.folderId] = (folderCounts[n.folderId] || 0) + 1;
      }
    }

    return {
      all: active.length,
      favorites: favorites.length,
      archived: archived.length,
      trash: trash.length,
      recents: recents.length,
      folders: folderCounts,
    };
  }, []);

  // Operations
  const createNote = async (initialProps?: Partial<Note>): Promise<Note> => {
    const now = Date.now();
    const newNote: Note = {
      id: `note-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: initialProps?.title || 'Untitled Note',
      content: initialProps?.content || '',
      plainText: initialProps?.plainText || '',
      createdAt: now,
      updatedAt: now,
      folderId:
        initialProps?.folderId !== undefined
          ? initialProps.folderId
          : currentFilter.type === 'folder'
          ? currentFilter.folderId
          : null,
      tags:
        initialProps?.tags ||
        (currentFilter.type === 'tag' ? [currentFilter.tag] : []),
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      isTrash: false,
      ...initialProps,
    };

    await db.notes.add(newNote);
    return newNote;
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    await db.notes.update(id, {
      ...updates,
      updatedAt: updates.updatedAt || Date.now(),
    });
  };

  const deleteNote = async (id: string) => {
    // Soft delete to trash
    await db.notes.update(id, {
      isTrash: true,
      trashedAt: Date.now(),
      isPinned: false,
    });
  };

  const restoreNote = async (id: string) => {
    await db.notes.update(id, {
      isTrash: false,
      trashedAt: null,
      updatedAt: Date.now(),
    });
  };

  const permanentlyDeleteNote = async (id: string) => {
    await db.notes.delete(id);
  };

  const emptyTrash = async () => {
    const all = await db.notes.toArray();
    const trashed = all.filter((n) => n.isTrash);
    if (trashed.length > 0) {
      await db.notes.bulkDelete(trashed.map((n) => n.id));
    }
  };

  const duplicateNote = async (note: Note): Promise<Note> => {
    const now = Date.now();
    const duplicated: Note = {
      ...note,
      id: `note-${now}-${Math.random().toString(36).substring(2, 7)}`,
      title: `${note.title} (Copy)`,
      createdAt: now,
      updatedAt: now,
      isPinned: false,
    };
    await db.notes.add(duplicated);
    return duplicated;
  };

  const createFolder = async (name: string, color?: string): Promise<Folder> => {
    const now = Date.now();
    const folder: Folder = {
      id: `folder-${now}-${Math.random().toString(36).substring(2, 7)}`,
      name: name.trim(),
      color: color || '#d97706',
      createdAt: now,
      updatedAt: now,
    };
    await db.folders.add(folder);
    return folder;
  };

  const updateFolder = async (id: string, name: string, color?: string) => {
    await db.folders.update(id, {
      name: name.trim(),
      ...(color ? { color } : {}),
      updatedAt: Date.now(),
    });
  };

  const deleteFolder = async (id: string) => {
    // Remove folder and unassign notes that were inside it
    await db.folders.delete(id);
    const affectedNotes = await db.notes.where('folderId').equals(id).toArray();
    await Promise.all(
      affectedNotes.map((n) => db.notes.update(n.id, { folderId: null }))
    );
  };

  const createTag = async (name: string, color?: string): Promise<Tag> => {
    const clean = name.trim();
    const existing = await db.tags.where('name').equals(clean).first();
    if (existing) return existing;

    const tag: Tag = {
      id: `tag-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: clean,
      color: color || '#3b82f6',
    };
    await db.tags.add(tag);
    return tag;
  };

  const deleteTag = async (id: string, tagName: string) => {
    await db.tags.delete(id);
    const allNotes = await db.notes.toArray();
    for (const n of allNotes) {
      if (n.tags && n.tags.includes(tagName)) {
        await db.notes.update(n.id, {
          tags: n.tags.filter((t) => t !== tagName),
        });
      }
    }
  };

  const reorderNotes = async (draggedId: string, targetId: string) => {
    const list = [...(notes || [])];
    const draggedIdx = list.findIndex((n) => n.id === draggedId);
    const targetIdx = list.findIndex((n) => n.id === targetId);
    if (draggedIdx === -1 || targetIdx === -1 || draggedIdx === targetIdx) return;

    const [dragged] = list.splice(draggedIdx, 1);
    list.splice(targetIdx, 0, dragged);

    await db.transaction('rw', db.notes, async () => {
      for (let i = 0; i < list.length; i++) {
        await db.notes.update(list[i].id, { order: i });
      }
    });
  };

  return {
    notes: notes || [],
    folders: folders || [],
    tags: tags || [],
    counts: counts || { all: 0, favorites: 0, archived: 0, trash: 0, recents: 0, folders: {} },
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
    createTag,
    deleteTag,
  };
}

