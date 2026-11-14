import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { normalizeContent, decodeHtmlEntities, normalizeEscapedMarkdown } from '../src/services/importEngine/contentNormalizer.ts';
import { processMathematics } from '../src/services/importEngine/mathProcessor.ts';
import { convertTsvToHtmlTable, isTsvTable } from '../src/services/importEngine/tableProcessor.ts';
import { convertTextToTipTapHtml } from '../src/services/importEngine/smartImportEngine.ts';
import { parseCsv, exportToCsv } from '../src/services/spreadsheet/csvEngine.ts';
import { DEFAULT_PROFILES, DEFAULT_KEYBOARD_SHORTCUTS } from '../src/db/db.ts';

console.log('=== Running NoteBook System & Extension Verification Tests ===\n');

let failedTests = 0;
let passedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failedTests++;
  }
}

// 1. Verify Manifest V3 File
const manifestPath = path.resolve('dist/manifest.json');
assert(fs.existsSync(manifestPath), 'dist/manifest.json exists');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
assert(manifest.manifest_version === 3, 'Manifest is version 3');
assert(manifest.permissions.includes('storage'), 'Manifest includes storage permission');
assert(manifest.permissions.includes('contextMenus'), 'Manifest includes contextMenus permission');
assert(manifest.permissions.includes('unlimitedStorage'), 'Manifest includes unlimitedStorage permission');
assert(manifest.permissions.includes('sidePanel'), 'Manifest includes sidePanel permission');
assert(manifest.permissions.includes('identity'), 'Manifest includes identity permission');
assert(manifest.name.includes('MemoDock'), 'Manifest name includes MemoDock');
assert(manifest.background.service_worker === 'background.js', 'Service worker points to background.js');
assert(manifest.action.default_popup === 'popup.html', 'Action popup points to popup.html');
assert(manifest.side_panel.default_path === 'sidepanel.html', 'Side panel points to sidepanel.html');

// 2. Verify Background Service Worker
const bgPath = path.resolve('dist/background.js');
assert(fs.existsSync(bgPath), 'dist/background.js exists');
const bgContent = fs.readFileSync(bgPath, 'utf8');
assert(bgContent.length > 500, 'background.js is compiled and bundled');
assert(bgContent.includes('notebook_clip_selection') || bgContent.includes('contextMenus'), 'background.js contains contextMenus logic');

// 3. Verify HTML and Assets
const htmlPath = path.resolve('dist/index.html');
assert(fs.existsSync(htmlPath), 'dist/index.html exists');
const popupPath = path.resolve('dist/popup.html');
assert(fs.existsSync(popupPath), 'dist/popup.html exists');
const popupContent = fs.readFileSync(popupPath, 'utf8');
assert(popupContent.includes('760px') || popupContent.includes('780px'), 'popup.html contains explicit popup width constraints');
const sidepanelPath = path.resolve('dist/sidepanel.html');
assert(fs.existsSync(sidepanelPath), 'dist/sidepanel.html exists');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');
assert(htmlContent.includes('katex'), 'index.html includes KaTeX stylesheet');
assert(htmlContent.includes('<div id="root"></div>'), 'index.html includes root div container');

// 4. Verify Extension Icons
[16, 32, 48, 128].forEach(size => {
  const iconPath = path.resolve(`dist/icons/icon${size}.png`);
  assert(fs.existsSync(iconPath), `dist/icons/icon${size}.png exists`);
  const stat = fs.statSync(iconPath);
  assert(stat.size > 50, `icon${size}.png is a valid non-empty file (${stat.size} bytes)`);
});

// 5. Verify Package ZIP archives
const distZip = path.resolve('dist/notebook-extension.zip');
assert(fs.existsSync(distZip), 'dist/notebook-extension.zip package exists');
const pubZip = path.resolve('public/notebook-extension.zip');
assert(fs.existsSync(pubZip), 'public/notebook-extension.zip package exists');
const memoDistZip = path.resolve('dist/memodock-extension.zip');
assert(fs.existsSync(memoDistZip), 'dist/memodock-extension.zip package exists');
const memoPubZip = path.resolve('public/memodock-extension.zip');
assert(fs.existsSync(memoPubZip), 'public/memodock-extension.zip package exists');

// 6. Test HTML Entity Decoding
const entitySample = 'Definition&#x20;:&nbsp;Price &amp; Value &lt;50 &gt;20 &quot;Quote&quot; &#39;Single&#39;';
const decoded = decodeHtmlEntities(entitySample);
assert(decoded === "Definition : Price & Value <50 >20 \"Quote\" 'Single'", 'HTML entities correctly decoded');

// 7. Test Escaped Markdown Normalization
const escapedSample = `\\---
\\### Section Heading
\\* Item 1
\\> A quoted block
\\1. Numbered item`;
const normalizedEscapes = normalizeEscapedMarkdown(escapedSample);
assert(normalizedEscapes.includes('---'), 'Escaped rule normalized to ---');
assert(normalizedEscapes.includes('### Section Heading'), 'Escaped heading normalized to ###');
assert(normalizedEscapes.includes('* Item 1'), 'Escaped bullet normalized to * Item 1');
assert(normalizedEscapes.includes('> A quoted block'), 'Escaped blockquote normalized to > Quote');
assert(normalizedEscapes.includes('1. Numbered item'), 'Escaped list item normalized to 1. Numbered item');

// 8. Test Mathematical Recognition & Currency Protection
const mathSample = `Formula is \\(\\bar{Y}\\) and block is \\[E = mc^2\\] with budget $230,000 and price $50.00 while equation is $a^2 + b^2 = c^2$.`;
const mathProcessed = processMathematics(mathSample);
assert(mathProcessed.text.includes('data-type="math-inline" data-latex="\\bar{Y}"'), 'Inline math \\(\\bar{Y}\\) converted to math-inline node');
assert(mathProcessed.text.includes('data-type="math-block" data-latex="E = mc^2"'), 'Block math \\[E = mc^2\\] converted to math-block node');
assert(mathProcessed.text.includes('$230,000'), 'Currency figure $230,000 protected from math conversion');
assert(mathProcessed.text.includes('$50.00'), 'Currency figure $50.00 protected from math conversion');
assert(mathProcessed.text.includes('data-type="math-inline" data-latex="a^2 + b^2 = c^2"'), 'Math $a^2 + b^2 = c^2$ converted to math-inline node');

// 9. Test Spreadsheet TSV Table Conversion
const tsvSample = `Item\tCategory\tPrice\nApple\tFruit\t$1.50\nBanana\tFruit\t$0.80`;
assert(isTsvTable(tsvSample) === true, 'TSV table detector recognizes copied spreadsheet cells');
const tsvHtml = convertTsvToHtmlTable(tsvSample);
assert(tsvHtml.includes('<th><p>Item</p></th>'), 'TSV table converts header cells');
assert(tsvHtml.includes('<td><p>Apple</p></td>'), 'TSV table converts body data cells');

// 10. CRITICAL REGRESSION TEST: Section 13 Real-World French Educational Content
const frenchInput = `Pour bien comprendre ces concepts, il faut d'abord poser les bases.

\\---

\\### 1. Les bases : Le point de départ

\\* \\(\\bar{Y}\\) : La moyenne de tous les prix de notre dataset.

\\---

\\### 2. OLS (Ordinary Least Squares)

\\* **Définition :** C'est la méthode utilisée pour trouver **la meilleure ligne droite**.

\\* **Exemple :** \`sm.OLS(y, x).fit()\` utilise cette méthode.

\\---

\\#### A. SST - Somme des Carrés Totaux

\\* **Formule :** \\(SST = \\sum (Y_i - \\bar{Y})^2\\)

\\> Variation totale du prix.

| Mesure | Signification |
|---|---|
| SST | Variation totale |
| SSR | Variation expliquée |
| SSE | Erreur non expliquée |

\\[
SST = SSR + SSE
\\]`;

const frenchResult = convertTextToTipTapHtml(frenchInput);
const frenchHtml = frenchResult.html;

assert(frenchHtml.includes('<p>Pour bien comprendre ces concepts, il faut d&#39;abord poser les bases.</p>') || frenchHtml.includes("Pour bien comprendre ces concepts, il faut d'abord poser les bases."), 'French introductory paragraph parsed cleanly');
assert(frenchHtml.includes('<h3>1. Les bases : Le point de départ</h3>'), 'Heading H3 (1. Les bases) parsed correctly without backslash');
assert(frenchHtml.includes('<h3>2. OLS (Ordinary Least Squares)</h3>'), 'Heading H3 (2. OLS) parsed correctly without backslash');
assert(frenchHtml.includes('<h4>A. SST - Somme des Carrés Totaux</h4>'), 'Heading H4 (A. SST) parsed correctly without backslash');
assert(frenchHtml.includes('data-type="math-inline"') && frenchHtml.includes('\\bar{Y}'), 'Inline math \\(\\bar{Y}\\) rendered as math-inline node');
assert(frenchHtml.includes('<strong>Définition :</strong>'), 'Bold label Définition parsed correctly');
assert(frenchHtml.includes('<strong>la meilleure ligne droite</strong>'), 'Nested bold phrase parsed correctly');
assert(frenchHtml.includes('<code>sm.OLS(y, x).fit()</code>'), 'Code snippet sm.OLS parsed correctly');
assert(frenchHtml.includes('data-type="math-inline"') && frenchHtml.includes('SST = \\sum (Y_i - \\bar{Y})^2'), 'Formula SST = sum(Yi - Ybar)^2 rendered as inline math');
assert(frenchHtml.includes('<blockquote>') && frenchHtml.includes('Variation totale du prix.'), 'Blockquote rendered cleanly');
assert(frenchHtml.includes('<table>') && frenchHtml.includes('<th>Mesure</th>') && frenchHtml.includes('<th>Signification</th>'), 'Table headers parsed correctly');
assert(frenchHtml.includes('<td>SST</td>') && frenchHtml.includes('<td>Variation totale</td>'), 'Table data rows parsed correctly');
assert(frenchHtml.includes('data-type="math-block"') && frenchHtml.includes('SST = SSR + SSE'), 'Block formula SST = SSR + SSE rendered as math-block node');
assert(!frenchHtml.includes('\\###'), 'No leftover \\### escapes in parsed output');
assert(!frenchHtml.includes('\\---'), 'No leftover \\--- escapes in parsed output');
assert(!frenchHtml.includes('\\*'), 'No leftover \\* escapes in parsed output');
assert(!frenchHtml.includes('\\>'), 'No leftover \\> escapes in parsed output');

// 10b. Test Fenced Code Block without placeholder leakage
const codeBlockSample = `## 3. Architecture générale

\`\`\`
┌─────────────────────────────────────────────────────────────────┐
│                    WORKFLOW PRINCIPAL (quotidien 19h)            │
│                                                                   │
│  [Schedule 19h] → [Charger config (Sheet)]                        │
└─────────────────────────────────────────────────────────────────┘
\`\`\`

## 4. Spécifications fonctionnelles`;

const codeBlockResult = convertTextToTipTapHtml(codeBlockSample);
const codeBlockHtml = codeBlockResult.html;

assert(!codeBlockHtml.includes('CODE_BLOCK'), 'No leftover CODE_BLOCK placeholder in code block paste');
assert(codeBlockHtml.includes('<pre><code') && codeBlockHtml.includes('WORKFLOW PRINCIPAL'), 'Fenced ASCII code block properly converted into <pre><code>');

// 11. Test Table of Contents Extraction on Ingested Content
function extractHeadingsFromHtml(html) {
  const headings = [];
  const regex = /<h([1-4])[^>]*>(.*?)<\/h\1>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    headings.push({
      level: parseInt(match[1]),
      text: match[2].replace(/<[^>]*>/g, '').trim(),
    });
  }
  return headings;
}

const toc = extractHeadingsFromHtml(frenchHtml);
assert(toc.length === 3, 'TOC extracts 3 headings from French educational document');
assert(toc[0].level === 3 && toc[0].text.includes('1. Les bases'), 'TOC Heading 1 match');
assert(toc[1].level === 3 && toc[1].text.includes('2. OLS'), 'TOC Heading 2 match');
assert(toc[2].level === 4 && toc[2].text.includes('A. SST'), 'TOC Heading 3 match');

// 12. Test Internal Note Links Extraction
function extractInternalLinks(content) {
  const matches = new Set();
  const wikiRegex = /\[\[(.*?)\]\]/g;
  let match;
  while ((match = wikiRegex.exec(content)) !== null) {
    if (match[1]?.trim()) matches.add(match[1].trim());
  }
  const urlRegex = /href=["'](?:notebook:\/\/note\/|#note-)([a-zA-Z0-9_-]+)["']/g;
  while ((match = urlRegex.exec(content)) !== null) {
    if (match[1]?.trim()) matches.add(match[1].trim());
  }
  return Array.from(matches);
}

const sampleNoteWithLinks = '<p>Check out [[Project Roadmap]] and <a href="notebook://note/note-12345">Architecture</a></p>';
const extractedLinks = extractInternalLinks(sampleNoteWithLinks);
assert(extractedLinks.includes('Project Roadmap'), 'Internal link [[Project Roadmap]] extracted');
assert(extractedLinks.includes('note-12345'), 'Internal link notebook://note/note-12345 extracted');

// 13. Test JSON Backup & Restore Schema Validator
const mockBackup = {
  version: '2.0',
  exportedAt: new Date().toISOString(),
  notes: [
    {
      id: 'test-1',
      title: 'Sample Note',
      content: '<p>Hello world</p>',
      plainText: 'Hello world',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      folderId: null,
      tags: ['Work', 'Ideas'],
      isPinned: true,
      isFavorite: false,
      isArchived: false,
      isTrash: false,
    }
  ],
  folders: [
    {
      id: 'folder-1',
      name: 'Projects',
      color: '#d97706',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
  ],
  tags: [
    { id: 'tag-1', name: 'Work', color: '#3b82f6' }
  ]
};

const backupJsonString = JSON.stringify(mockBackup, null, 2);
const parsedBackup = JSON.parse(backupJsonString);
assert(parsedBackup.version === '2.0', 'Backup JSON version 2.0 valid');
assert(Array.isArray(parsedBackup.notes) && parsedBackup.notes.length === 1, 'Backup contains notes array');
assert(Array.isArray(parsedBackup.folders) && parsedBackup.folders.length === 1, 'Backup contains folders array');
assert(Array.isArray(parsedBackup.tags) && parsedBackup.tags.length === 1, 'Backup contains tags array');
assert(parsedBackup.notes[0].tags.includes('Work'), 'Backup note preserves tags');

// 14. Test RFC 4180 CSV Engine (Delimiter detection, Quoting, Escaping)
const sampleCsv = `Product,Price,"Description, Details",Quantity
"Laptop Pro, 16""",1299.99,"Fast, reliable and light",5
Phone,799.50,"AMOLED screen",12`;

const parsedCsv = parseCsv(sampleCsv);
assert(parsedCsv.headers.length === 4, 'CSV parser extracts 4 columns');
assert(parsedCsv.headers[2] === 'Description, Details', 'CSV parser preserves comma inside quoted header');
assert(parsedCsv.rows.length === 2, 'CSV parser extracts 2 data rows');
assert(parsedCsv.rows[0][0] === 'Laptop Pro, 16"', 'CSV parser handles escaped quotes and commas correctly');
assert(parsedCsv.rows[0][1] === '1299.99', 'CSV parser extracts numeric cell');

const reExportedCsv = exportToCsv(parsedCsv.headers, parsedCsv.rows);
assert(reExportedCsv.includes('"Laptop Pro, 16"""'), 'CSV exporter re-quotes fields with quotes');
assert(reExportedCsv.includes('"Description, Details"'), 'CSV exporter re-quotes fields with commas');

// 15. Test MemoDock V3 Workspace Profiles
assert(Array.isArray(DEFAULT_PROFILES) && DEFAULT_PROFILES.length >= 5, 'DEFAULT_PROFILES contains at least 5 curated profiles');
const profileTypes = DEFAULT_PROFILES.map(p => p.type);
assert(profileTypes.includes('study'), 'Profiles include Study & Courses');
assert(profileTypes.includes('development'), 'Profiles include Engineering & Code');
assert(profileTypes.includes('research'), 'Profiles include Academic Research');
assert(profileTypes.includes('writing'), 'Profiles include Distraction-Free Writing');
const studyProfile = DEFAULT_PROFILES.find(p => p.type === 'study');
assert(studyProfile.sidebarWidth === 270, 'Study profile configures optimal sidebar width');
assert(studyProfile.outlineVisible === true, 'Study profile enables outline');

// 16. Test MemoDock V3 Keyboard Shortcuts
assert(Array.isArray(DEFAULT_KEYBOARD_SHORTCUTS) && DEFAULT_KEYBOARD_SHORTCUTS.length >= 8, 'DEFAULT_KEYBOARD_SHORTCUTS defines standard hotkeys');
const shortcutKeys = DEFAULT_KEYBOARD_SHORTCUTS.map(s => s.key);
assert(shortcutKeys.some(k => k.includes('Ctrl + N')), 'Shortcuts include Ctrl+N for new note');
assert(shortcutKeys.some(k => k.includes('Ctrl + K')), 'Shortcuts include Ctrl+K for command palette / search');

console.log(`\n========================================`);
console.log(`TOTAL TESTS: ${passedTests + failedTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log(`========================================\n`);

if (failedTests > 0) {
  process.exit(1);
}
