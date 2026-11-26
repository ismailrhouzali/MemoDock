/**
 * PowerPoint (.pptx) Parser & OCR Extractor
 * Extracts slide titles, text, bullet lists, tables, speaker notes, and embedded images,
 * runs optional Tesseract.js OCR on slide images, and converts everything to structured Markdown & HTML.
 */

import JSZip from 'jszip';
import { marked } from 'marked';

export interface PptxExtractionResult {
  markdown: string;
  html: string;
  slideCount: number;
  imageCount: number;
  ocrCount: number;
}

const MIME_BY_EXT: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
};

function getElementsByLocalName(root: Document | Element, localName: string): Element[] {
  const results: Element[] = [];
  const all = root.getElementsByTagName('*');
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) {
      results.push(all[i]);
    }
  }
  return results;
}

function getDirectTextFromParagraph(p: Element): string {
  const runs = getElementsByLocalName(p, 't');
  return runs.map((t) => t.textContent || '').join('').trim();
}

function extractTableMarkdown(tbl: Element): string {
  const rows = getElementsByLocalName(tbl, 'tr');
  if (rows.length === 0) return '';

  const matrix: string[][] = rows.map((tr) => {
    const cells = getElementsByLocalName(tr, 'tc');
    return cells.map((tc) => {
      const paras = getElementsByLocalName(tc, 'p');
      return paras
        .map(getDirectTextFromParagraph)
        .filter(Boolean)
        .join(' ')
        .replace(/\|/g, '\\|')
        .trim();
    });
  });

  const colCount = Math.max(...matrix.map((r) => r.length), 1);
  const normalizeRow = (r: string[]) =>
    `| ${Array.from({ length: colCount }, (_, idx) => r[idx] || '').join(' | ')} |`;

  const header = normalizeRow(matrix[0]);
  const separator = `| ${Array.from({ length: colCount }, () => '---').join(' | ')} |`;
  const body = matrix.slice(1).map(normalizeRow);
  return [header, separator, ...body].join('\n');
}

async function runImageOcr(dataUrl: string): Promise<string> {
  try {
    const Tesseract = await import('tesseract.js');
    const result = await Tesseract.recognize(dataUrl, 'eng+fra');
    return (result?.data?.text || '').replace(/\s+\n/g, '\n').trim();
  } catch (err) {
    console.warn('[PPTX OCR] Skipping OCR for image:', err);
    return '';
  }
}

export async function parsePptxFile(
  file: File,
  options?: { enableOcr?: boolean; onProgress?: (msg: string) => void }
): Promise<PptxExtractionResult> {
  const enableOcr = options?.enableOcr !== false;
  const onProgress = options?.onProgress;

  onProgress?.(`Reading ${file.name}...`);
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  // Sort slides numerically: ppt/slides/slide1.xml, slide2.xml, ...
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/i.test(p))
    .sort((a, b) => {
      const na = Number(a.match(/slide(\d+)\.xml/i)?.[1] || 0);
      const nb = Number(b.match(/slide(\d+)\.xml/i)?.[1] || 0);
      return na - nb;
    });

  if (slidePaths.length === 0) {
    throw new Error('No slides found in .pptx archive.');
  }

  const parser = new DOMParser();
  const baseTitle = file.name.replace(/\.[^/.]+$/, '');
  const mdSections: string[] = [`# ${baseTitle}`];
  let totalImages = 0;
  let totalOcr = 0;

  for (let sIdx = 0; sIdx < slidePaths.length; sIdx++) {
    const slidePath = slidePaths[sIdx];
    const slideNum = Number(slidePath.match(/slide(\d+)\.xml/i)?.[1] || sIdx + 1);
    onProgress?.(`Extracting slide ${sIdx + 1}/${slidePaths.length}...`);

    const xmlStr = await zip.files[slidePath].async('string');
    const doc = parser.parseFromString(xmlStr, 'application/xml');

    let slideTitle = '';
    const bodyLines: string[] = [];
    const tablesMd: string[] = [];

    // 1. Extract shapes (titles + body bullets)
    const shapes = getElementsByLocalName(doc, 'sp');
    for (const sp of shapes) {
      const ph = getElementsByLocalName(sp, 'ph')[0];
      const phType = ph?.getAttribute('type') || '';
      const isTitle = phType === 'title' || phType === 'ctrTitle';

      const paragraphs = getElementsByLocalName(sp, 'p');
      for (const p of paragraphs) {
        const text = getDirectTextFromParagraph(p);
        if (!text) continue;

        if (isTitle && !slideTitle) {
          slideTitle = text;
        } else {
          const pPr = getElementsByLocalName(p, 'pPr')[0];
          const lvl = Number(pPr?.getAttribute('lvl') || 0);
          const indent = '  '.repeat(Math.min(lvl, 4));
          bodyLines.push(`${indent}- ${text}`);
        }
      }
    }

    // 2. Extract tables
    const tables = getElementsByLocalName(doc, 'tbl');
    for (const tbl of tables) {
      const tMd = extractTableMarkdown(tbl);
      if (tMd) tablesMd.push(tMd);
    }

    // 3. Extract images via slide relationships
    const relsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
    const imageMdParts: string[] = [];
    if (zip.files[relsPath]) {
      const relsXml = await zip.files[relsPath].async('string');
      const relsDoc = parser.parseFromString(relsXml, 'application/xml');
      const rels = getElementsByLocalName(relsDoc, 'Relationship');

      for (const rel of rels) {
        const target = rel.getAttribute('Target') || '';
        const type = rel.getAttribute('Type') || '';
        if (!type.includes('/image') && !/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(target)) {
          continue;
        }

        const normalizedPath = target.startsWith('../')
          ? `ppt/${target.replace(/^(\.\.\/)+/, '')}`
          : target.startsWith('/')
            ? target.slice(1)
            : `ppt/slides/${target}`;

        const imgFile = zip.files[normalizedPath];
        if (!imgFile) continue;

        const ext = normalizedPath.split('.').pop()?.toLowerCase() || 'png';
        const mime = MIME_BY_EXT[ext] || 'image/png';
        const base64 = await imgFile.async('base64');
        const dataUrl = `data:${mime};base64,${base64}`;
        totalImages++;

        imageMdParts.push(`![Slide ${slideNum} Image ${totalImages}](${dataUrl})`);

        if (enableOcr && ext !== 'svg') {
          onProgress?.(`Running OCR on slide ${slideNum} image...`);
          const ocrText = await runImageOcr(dataUrl);
          if (ocrText) {
            totalOcr++;
            const quoted = ocrText
              .split('\n')
              .map((line) => `> ${line}`)
              .join('\n');
            imageMdParts.push(`> **OCR (Slide ${slideNum}):**\n${quoted}`);
          }
        }
      }
    }

    // 4. Extract speaker notes
    const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    let notesText = '';
    if (zip.files[notesPath]) {
      const notesXml = await zip.files[notesPath].async('string');
      const notesDoc = parser.parseFromString(notesXml, 'application/xml');
      const noteParas = getElementsByLocalName(notesDoc, 'p')
        .map(getDirectTextFromParagraph)
        .filter((t) => t && t !== String(slideNum));
      if (noteParas.length > 0) {
        notesText = noteParas.join('\n');
      }
    }

    const heading = slideTitle ? `## Slide ${slideNum}: ${slideTitle}` : `## Slide ${slideNum}`;
    const slideParts: string[] = [heading];
    if (bodyLines.length > 0) slideParts.push(bodyLines.join('\n'));
    if (tablesMd.length > 0) slideParts.push(tablesMd.join('\n\n'));
    if (imageMdParts.length > 0) slideParts.push(imageMdParts.join('\n\n'));
    if (notesText) {
      slideParts.push(`> **Speaker Notes:** ${notesText}`);
    }

    mdSections.push(slideParts.join('\n\n'));
  }

  const markdown = mdSections.join('\n\n---\n\n');
  const html = String(marked.parse(markdown, { async: false }));

  return {
    markdown,
    html,
    slideCount: slidePaths.length,
    imageCount: totalImages,
    ocrCount: totalOcr,
  };
}
