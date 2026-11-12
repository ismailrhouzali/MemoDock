import { Note, Folder, Tag, Attachment, ConflictRecord, AppSettings } from '../../db/types';
import { db, settingsStorage } from '../../db/db';

export interface StorageSyncResult {
  success: boolean;
  notesWritten: number;
  attachmentsWritten: number;
  error?: string;
}

// Stores the active directory handle in memory during the browser session
let activeDirectoryHandle: any = null;

export const storageManager = {
  // Check if File System Access API is supported
  isFileSystemSupported: (): boolean => {
    return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
  },

  // Pick a custom local folder on the user's computer
  pickCustomLocalFolder: async (): Promise<{ folderName: string; handle: any }> => {
    if (!storageManager.isFileSystemSupported()) {
      throw new Error('File System Access API is not supported in this browser environment.');
    }

    const handle = await (window as any).showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents',
    });

    activeDirectoryHandle = handle;
    const folderName = handle.name;

    // Update settings
    await settingsStorage.set({
      storageMode: 'local_folder',
      localStorageFolder: {
        folderName,
        permissionStatus: 'granted',
        lastSyncTimestamp: Date.now(),
        syncStatus: 'idle',
      },
    });

    return { folderName, handle };
  },

  // Get or re-authorize active directory handle
  getDirectoryHandle: async (): Promise<any> => {
    if (activeDirectoryHandle) {
      return activeDirectoryHandle;
    }
    return null;
  },

  // Synchronize all notes & attachments to the selected local folder
  syncToLocalFolder: async (): Promise<StorageSyncResult> => {
    const handle = await storageManager.getDirectoryHandle();
    if (!handle) {
      return { success: false, notesWritten: 0, attachmentsWritten: 0, error: 'No directory authorized. Please pick a folder.' };
    }

    try {
      // 1. Create subfolders: notes/, attachments/, metadata/
      const notesDir = await handle.getDirectoryHandle('notes', { create: true });
      const attachmentsDir = await handle.getDirectoryHandle('attachments', { create: true });
      const metadataDir = await handle.getDirectoryHandle('metadata', { create: true });

      const allNotes = await db.notes.toArray();
      const allFolders = await db.folders.toArray();
      const allTags = await db.tags.toArray();
      const allAttachments = await db.attachments.toArray();

      let notesWritten = 0;
      let attachmentsWritten = 0;

      // 2. Write each note as a clean Markdown (.md) or JSON file
      for (const note of allNotes) {
        const safeTitle = (note.title || 'Untitled')
          .replace(/[^\w\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-');
        const filename = `${safeTitle || 'note'}-${note.id.slice(-6)}.md`;

        const fileHandle = await notesDir.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();

        const frontmatter = `---
id: "${note.id}"
title: "${note.title.replace(/"/g, '\\"')}"
created: ${note.createdAt}
updated: ${note.updatedAt}
folderId: ${note.folderId ? `"${note.folderId}"` : 'null'}
tags: [${note.tags.map((t) => `"${t}"`).join(', ')}]
isPinned: ${note.isPinned}
isFavorite: ${note.isFavorite}
isArchived: ${note.isArchived}
isTrash: ${note.isTrash}
---

`;
        const contentToWrite = `${frontmatter}# ${note.title}\n\n${note.plainText || ''}`;
        await writable.write(contentToWrite);
        await writable.close();
        notesWritten++;
      }

      // 3. Write metadata snapshot
      const metaHandle = await metadataDir.getFileHandle('notebook-metadata.json', { create: true });
      const metaWritable = await metaHandle.createWritable();
      const metaContent = JSON.stringify(
        {
          folders: allFolders,
          tags: allTags,
          lastSync: Date.now(),
        },
        null,
        2
      );
      await metaWritable.write(metaContent);
      await metaWritable.close();

      // 4. Update settings status
      const current = await settingsStorage.get();
      await settingsStorage.set({
        localStorageFolder: {
          ...current.localStorageFolder,
          lastSyncTimestamp: Date.now(),
          syncStatus: 'success',
        },
      });

      return { success: true, notesWritten, attachmentsWritten };
    } catch (err: any) {
      console.error('Failed to sync to local folder:', err);
      const current = await settingsStorage.get();
      await settingsStorage.set({
        localStorageFolder: {
          ...current.localStorageFolder,
          syncStatus: 'error',
        },
      });
      return { success: false, notesWritten: 0, attachmentsWritten: 0, error: err?.message || 'Sync failed' };
    }
  },
};
