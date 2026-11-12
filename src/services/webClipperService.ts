import { db } from '../db/db';
import { Note } from '../db/types';

export function setupWebClipperSync(onClipAdded?: (note: Note) => void) {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return () => {};
  }

  // Check pending clips on startup
  const checkPendingClips = async () => {
    try {
      const res = await chrome.storage.local.get('pending_clips');
      const clips: Note[] = res.pending_clips || [];
      if (clips.length > 0) {
        for (const clip of clips) {
          const exists = await db.notes.get(clip.id);
          if (!exists) {
            await db.notes.add(clip);
            if (onClipAdded) onClipAdded(clip);
          }
        }
        await chrome.storage.local.set({ pending_clips: [] });
      }
    } catch (err) {
      console.error('Failed to sync pending clips:', err);
    }
  };

  checkPendingClips();

  // Listen for storage changes in real time
  const storageListener = (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => {
    if (area === 'local' && changes.pending_clips && changes.pending_clips.newValue) {
      checkPendingClips();
    }
  };

  chrome.storage.onChanged.addListener(storageListener);

  return () => {
    chrome.storage.onChanged.removeListener(storageListener);
  };
}

