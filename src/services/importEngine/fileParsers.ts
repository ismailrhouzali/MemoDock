/**
 * Universal File Parsers for NoteBook
 * Handles importing Markdown, HTML, TXT, DOCX, and PDF text extraction.
 */

import mammoth from 'mammoth';
import { cleanRichHtml } from './htmlCleaner';
import { db } from '../../db/db';
import { Attachment } from '../../db/types';

/**
 * Reads a text file (MD, HTML, TXT) as a string.
 */
export async function readTextFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));
    reader.readAsText(file, 'utf-8');
  });
}

/**
 * Extracts formatted HTML from a Microsoft Word (.docx) document.
 */
export async function parseDocxFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const rawHtml = result.value;
  return cleanRichHtml(rawHtml);
}

/**
 * Extracts plain text from a PDF file using binary stream scanning or standard PDF headers.
 */
export async function extractPdfText(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const textDecoder = new TextDecoder('utf-8');
  const raw = textDecoder.decode(new Uint8Array(arrayBuffer));

  // Extract text within PDF text streams BT ... ET
  const textMatches: string[] = [];
  const streamRegex = /BT[\s\S]*?ET/g;
  let match;

  while ((match = streamRegex.exec(raw)) !== null) {
    const block = match[0];
    // Extract Tj and TJ strings
    const tjRegex = /\((.*?)\)\s*Tj/g;
    let tjMatch;
    while ((tjMatch = tjRegex.exec(block)) !== null) {
      if (tjMatch[1]) textMatches.push(tjMatch[1]);
    }

    const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
    let tjArrMatch;
    while ((tjArrMatch = tjArrayRegex.exec(block)) !== null) {
      const inner = tjArrMatch[1];
      const innerStrings = inner.match(/\((.*?)\)/g);
      if (innerStrings) {
        innerStrings.forEach((s) => {
          const clean = s.slice(1, -1);
          if (clean) textMatches.push(clean);
        });
      }
    }
  }

  if (textMatches.length > 0) {
    return textMatches
      .join(' ')
      .replace(/\\([()\\])/g, '$1')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Fallback: clean ASCII sequences from PDF binary
  const printable = raw.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  const cleanedLines = printable
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 25 && !l.startsWith('/') && !l.includes('obj') && !l.includes('endobj'));

  return cleanedLines.slice(0, 50).join('\n\n') || `[PDF document: ${file.name}]`;
}

/**
 * Saves a PDF file to Dexie IndexedDB as an Attachment record and returns the Attachment.
 */
export async function createPdfAttachment(file: File, noteId: string): Promise<Attachment> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);

  const attachment: Attachment = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    noteId,
    name: file.name,
    type: file.type || 'application/pdf',
    size: file.size,
    dataUrl: `data:${file.type || 'application/pdf'};base64,${base64Data}`,
    createdAt: Date.now(),
  };

  await db.attachments.add(attachment);
  return attachment;
}
