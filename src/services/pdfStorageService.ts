import { db } from '../db/db';
import { Attachment } from '../db/types';

// In-memory cache of generated object URLs to prevent leaks
const activeObjectUrls = new Set<string>();

export const pdfStorageService = {
  /**
   * Save an uploaded PDF file as a native IndexedDB binary Blob.
   * Does NOT convert large files into bloated base64 strings in V8 memory.
   */
  async savePdfFile(file: File, noteId: string = 'general'): Promise<Attachment> {
    const id = `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Store raw Blob directly in IndexedDB for zero-copy binary storage
    const attachment: Attachment = {
      id,
      noteId,
      name: file.name,
      type: file.type || 'application/pdf',
      size: file.size,
      dataUrl: '', // Omit heavy base64
      blob: file,  // File is a native Blob
      createdAt: Date.now(),
    };

    await db.attachments.add(attachment);
    return attachment;
  },

  /**
   * Get a performant ephemeral Blob URL for viewing a PDF.
   * Releases memory when no longer needed.
   */
  getViewerUrl(attachment: Attachment): string {
    if (attachment.blob) {
      const url = URL.createObjectURL(attachment.blob);
      activeObjectUrls.add(url);
      return url;
    }
    if (attachment.dataUrl && attachment.dataUrl.length > 0) {
      return attachment.dataUrl;
    }
    return '';
  },

  /**
   * Revoke an active Blob URL to free browser memory
   */
  revokeViewerUrl(url: string | null | undefined): void {
    if (url && url.startsWith('blob:') && activeObjectUrls.has(url)) {
      URL.revokeObjectURL(url);
      activeObjectUrls.delete(url);
    }
  },

  /**
   * Retrieve an attachment by ID from IndexedDB
   */
  async getById(id: string): Promise<Attachment | undefined> {
    return await db.attachments.get(id);
  },

  /**
   * Get an ephemeral Blob URL by attachment ID
   */
  async getViewerUrlById(id: string): Promise<string> {
    if (!id) return '';
    const att = await db.attachments.get(id);
    if (!att) return '';
    return this.getViewerUrl(att);
  },

  /**
   * Delete attachment and clean up
   */
  async deleteAttachment(id: string): Promise<void> {
    await db.attachments.delete(id);
  },
};
