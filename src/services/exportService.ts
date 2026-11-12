import { Note, Folder, Tag } from '../db/types';
import { db } from '../db/db';

export const exportService = {
  // Convert HTML to simple clean Markdown
  htmlToMarkdown: (html: string): string => {
    let md = html;
    // Replace headings
    md = md.replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n');
    md = md.replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n');
    md = md.replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n');
    // Task lists
    md = md.replace(/<li data-type="taskItem" data-checked="true"[^>]*>.*?<p>(.*?)<\/p>.*?<\/li>/gi, '- [x] $1\n');
    md = md.replace(/<li data-type="taskItem" data-checked="false"[^>]*>.*?<p>(.*?)<\/p>.*?<\/li>/gi, '- [ ] $1\n');
    // Bullet & Ordered lists
    md = md.replace(/<li><p>(.*?)<\/p><\/li>/gi, '- $1\n');
    md = md.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
    md = md.replace(/<ul>/gi, '');
    md = md.replace(/<\/ul>/gi, '\n');
    md = md.replace(/<ol>/gi, '');
    md = md.replace(/<\/ol>/gi, '\n');
    // Bold, Italic, Strikethrough
    md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
    md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
    md = md.replace(/<s>(.*?)<\/s>/gi, '~~$1~~');
    // Code blocks & inline code
    md = md.replace(/<pre><code>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```\n\n');
    md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
    // Blockquote
    md = md.replace(/<blockquote><p>(.*?)<\/p><\/blockquote>/gi, '> $1\n\n');
    md = md.replace(/<blockquote>(.*?)<\/blockquote>/gi, '> $1\n\n');
    // Links & images
    md = md.replace(/<a [^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)');
    md = md.replace(/<img [^>]*src="([^"]*)"[^>]*>/gi, '![]($1)');
    // Math block & Math inline & Mermaid block
    md = md.replace(/<div data-type="math-block" data-latex="([^"]*)">[\s\S]*?<\/div>/gi, (_, latex) => `$$\n${latex}\n$$\n\n`);
    md = md.replace(/<span data-type="math-inline" data-latex="([^"]*)">[\s\S]*?<\/span>/gi, (_, latex) => `$${latex}$`);
    md = md.replace(/<div data-type="mermaid-block" data-code="([^"]*)">[\s\S]*?<\/div>/gi, (_, code) => `\`\`\`mermaid\n${code}\n\`\`\`\n\n`);
    // PDF attachment & Link card blocks
    md = md.replace(/<div data-type="pdf-attachment"[^>]*data-name="([^"]*)"[^>]*>[\s\S]*?<\/div>/gi, '📄 [$1](attachment)\n\n');
    md = md.replace(/<div data-type="link-card"[^>]*data-url="([^"]*)"[^>]*data-title="([^"]*)"[^>]*>[\s\S]*?<\/div>/gi, '🔗 [$2]($1)\n\n');
    md = md.replace(/<div data-type="link-card"[^>]*data-url="([^"]*)"[^>]*>[\s\S]*?<\/div>/gi, '🔗 [$1]($1)\n\n');
    // Paragraphs & line breaks
    md = md.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
    md = md.replace(/<br\s*\/?>/gi, '\n');
    // Strip remaining html tags
    md = md.replace(/<[^>]+>/g, '');
    // Decode basic entities
    md = md.replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'");

    return md.trim();
  },

  // Export single note as Markdown file
  downloadMarkdown: (note: Note) => {
    const md = `# ${note.title}\n\n${exportService.htmlToMarkdown(note.content)}`;
    downloadFile(`${slugify(note.title)}.md`, md, 'text/markdown;charset=utf-8;');
  },

  // Export single note as HTML document
  downloadHtml: (note: Note) => {
    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeXml(note.title)}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; color: #1c1917; }
    h1 { border-bottom: 2px solid #e7e5e4; padding-bottom: 8px; }
    code { background: #f5f5f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background: #18181b; color: #fafafa; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #d97706; padding-left: 16px; color: #78716c; margin: 16px 0; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #e7e5e4; padding: 8px 12px; }
    th { background: #f5f5f4; }
  </style>
</head>
<body>
  <h1>${escapeXml(note.title)}</h1>
  <p><small>Created: ${new Date(note.createdAt).toLocaleString()} | Updated: ${new Date(note.updatedAt).toLocaleString()}</small></p>
  ${note.content}
</body>
</html>`;
    downloadFile(`${slugify(note.title)}.html`, fullHtml, 'text/html;charset=utf-8;');
  },

  // Export single note as Plain Text
  downloadTxt: (note: Note) => {
    const txt = `${note.title}\n${'='.repeat(note.title.length)}\n\n${note.plainText}`;
    downloadFile(`${slugify(note.title)}.txt`, txt, 'text/plain;charset=utf-8;');
  },

  // Print note (browser opens native Print / Save to PDF dialog)
  printNoteToPdf: () => {
    window.print();
  },

  // Export complete JSON backup of notes, folders, and tags
  downloadJsonBackup: async () => {
    const notes = await db.notes.toArray();
    const folders = await db.folders.toArray();
    const tags = await db.tags.toArray();

    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      notes,
      folders,
      tags,
    };

    const json = JSON.stringify(backup, null, 2);
    downloadFile(`notebook-backup-${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json;charset=utf-8;');
  },

  // Restore from JSON backup file
  restoreFromJsonBackup: async (fileContent: string): Promise<{ notesRestored: number; foldersRestored: number; tagsRestored: number }> => {
    const data = JSON.parse(fileContent);

    if (!data.notes || !Array.isArray(data.notes)) {
      throw new Error('Invalid backup file format: missing notes array');
    }

    let notesRestored = 0;
    let foldersRestored = 0;
    let tagsRestored = 0;

    // Restore folders
    if (data.folders && Array.isArray(data.folders)) {
      for (const folder of data.folders) {
        const existing = await db.folders.get(folder.id);
        if (!existing) {
          await db.folders.add(folder);
          foldersRestored++;
        }
      }
    }

    // Restore tags
    if (data.tags && Array.isArray(data.tags)) {
      for (const tag of data.tags) {
        const existing = await db.tags.get(tag.id);
        if (!existing) {
          await db.tags.add(tag);
          tagsRestored++;
        }
      }
    }

    // Restore notes
    for (const note of data.notes) {
      const existing = await db.notes.get(note.id);
      if (!existing) {
        await db.notes.add(note);
        notesRestored++;
      } else {
        // Update existing if backup note has newer timestamp
        if (note.updatedAt > existing.updatedAt) {
          await db.notes.put(note);
          notesRestored++;
        }
      }
    }

    return { notesRestored, foldersRestored, tagsRestored };
  },
};

function downloadFile(filename: string, content: string, contentType: string) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-') || 'note';
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
