import { Note } from '../db/types';
import { db } from '../db/db';

/**
 * Extracts note IDs or titles referenced inside note HTML or markdown content
 * Matches: href="notebook://note/{id}" or [[Note Title]]
 */
export function extractInternalLinks(content: string, allNotes: Note[]): string[] {
  const referencedIds = new Set<string>();

  // 1. Match notebook://note/{id}
  const urlRegex = /href=["']notebook:\/\/note\/([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = urlRegex.exec(content)) !== null) {
    referencedIds.add(match[1]);
  }

  // 2. Match [[Note Title]] syntax
  const wikiRegex = /\[\[(.*?)\]\]/g;
  while ((match = wikiRegex.exec(content)) !== null) {
    const titleOrId = match[1].trim().toLowerCase();
    const target = (allNotes || []).find(
      (n) => n && n.id && (n.id === match![1] || (n.title || '').toLowerCase() === titleOrId)
    );
    if (target) {
      referencedIds.add(target.id);
    }
  }

  return Array.from(referencedIds);
}

/**
 * Updates bidirectional backlinks across all active notes.
 */
export async function syncBacklinks(currentNoteId: string, referencedNoteIds: string[]) {
  try {
    const allNotes = (await db.notes.toArray()).filter((n): n is Note => Boolean(n && typeof n === 'object' && n.id));
    for (const note of allNotes) {
      const currentBacklinks = note.backlinks || [];
      const shouldHaveBacklink = referencedNoteIds.includes(note.id);

      if (shouldHaveBacklink && !currentBacklinks.includes(currentNoteId)) {
        await db.notes.update(note.id, {
          backlinks: [...currentBacklinks, currentNoteId],
        });
      } else if (!shouldHaveBacklink && currentBacklinks.includes(currentNoteId)) {
        await db.notes.update(note.id, {
          backlinks: currentBacklinks.filter((id) => id !== currentNoteId),
        });
      }
    }
  } catch (err) {
    console.warn('Failed to sync backlinks:', err);
  }
}
