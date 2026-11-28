# MemoDock Codebase Audit (Phase 1)

> Audited on 2026-11-28 against `main` (`4af09df`). No feature code was modified during this audit.

## 1. Platform & Runtime Constraints
- **Chrome Extension (Manifest V3)**: `public/manifest.json` (`version: 2.0.0`)
  - Permissions: `storage`, `contextMenus`, `unlimitedStorage`, `activeTab`, `sidePanel`, `identity`.
  - Entry points (`vite.config.ts`): `index.html` (full tab), `popup.html` (redirects via `public/popup-redirect.js`), `sidepanel.html` (Side Panel), `landing.html`, `src/background/index.ts` (MV3 service worker).
  - Strict MV3 CSP (`script-src 'self'`): no inline scripts, no remote code execution, no `eval`.

---

## 2. Data Model (Dexie.js / IndexedDB)
**File**: `src/db/db.ts` (`NotebookDB`, currently **v5**), `src/db/types.ts`

| Table | Primary & Indexed Fields | Notes |
| :--- | :--- | :--- |
| `notes` | `id, title, createdAt, updatedAt, folderId, parentNoteId, *tags, isPinned, isFavorite, isArchived, isTrash, *internalLinks, *backlinks` | Supports `icon`, `isDashboard`, `order`, `trashedAt`, `sourceUrl`, `isAutoTitle`. Missing: `coverImage`, `properties`, `isLocked`, `fullWidth`, `smallText`, `fontStyle`, `lastViewedAt`. |
| `folders` | `id, name, createdAt, updatedAt` | Supports `icon`, `color`, `order`. Flat folder list (no `parentFolderId`). |
| `tags` | `id, &name` | `color`. |
| `attachments` | `id, noteId, name, type, createdAt` | Native binary `Blob` storage for PDFs/images (`blob`, `size`, `pageCount`, optional `dataUrl`). |
| `noteVersions` | `id, noteId, createdAt` | Local version snapshots. |
| `templates` | `id, title, category, isBuiltin` | Built-in + user-saved templates (`NoteTemplate`). |
| `conflicts` | `id, noteId, detectedAt, resolved` | Google Drive sync conflict records. |
| `resources` | `id, url, title, domain, type, collection, *tags, isPinned, isFavorite, isArchived, isTrash, createdAt, lastOpenedAt` | Web bookmarks & research links. |
| `collections` | `id, name, createdAt` | Resource collections. |
| `spreadsheets` | `id, title, collection, *tags, noteId, isPinned, isFavorite, isArchived, isTrash, createdAt, updatedAt` | Multi-sheet CSV/XLSX workbooks (`SpreadsheetSheet[]`). |
| `databases` | `id, title, noteId, createdAt, updatedAt` | Inline databases (`NoteDatabase`: `columns`, `rows`, `defaultView`, `icon`). |

---

## 3. Editor Architecture (TipTap 2)
**Files**: `src/components/editor/TipTapEditor.tsx`, `src/components/editor/EditorToolbar.tsx`, `src/components/editor/SlashCommandMenu.tsx`, `src/components/editor/TableControls.tsx`, `src/components/common/ContextMenu.tsx`

### Installed TipTap Extensions (`TipTapEditor.tsx`)
- **Core & Formatting**: `StarterKit` (Headings `H1–H4`, Bullet/Ordered Lists, Blockquote, HorizontalRule, Bold/Italic/Strike/Code), `CodeBlockLowlight` (40+ languages), `TaskList` + `TaskItem` (`nested: true`), `Table` (`resizable: true`) + `TableRow` + `TableHeader` + `TableCell`, `Underline`, `Highlight` (`multicolor: true`), `Link` (`openOnClick`, `linkOnPaste`, `autolink`, `_blank`), `Placeholder`.
- **Custom Node Extensions (`src/components/editor/extensions/`)**:
  - `EnhancedImage.tsx` — upload, paste, resize, download.
  - `MathBlock.tsx` & `MathInline.tsx` — KaTeX real-time rendering.
  - `MermaidBlock.tsx` — live Mermaid diagram rendering.
  - `PdfAttachment.tsx` — compact/embedded PDF card backed by `attachments` Blob store.
  - `SpreadsheetNode.tsx` — compact/embedded CSV/XLSX viewer.
  - `LinkCard.tsx` — `compact`, `embedded` (iframe), `mention`, and `url` formats.
  - `CalloutBlock.tsx` — info/tip/warning callout box.
  - `ToggleBlock.tsx` — collapsible toggle section (`data-title`, `data-body`, `data-open`).
  - `DatabaseBlock.tsx` — inline database supporting 11 column types (`text`, `number`, `formula`, `select`, `multi-select`, `status`, `date`, `person`, `image`, `checkbox`, `url`), column aggregations (`count`, `sum`, `avg`, `min`, `max`, `checked`), CSV/XLSX import/export, and `linkedNoteId` row-as-page creation.

---

## 4. Services & State Flow
- **Hooks (`src/hooks/`)**:
  - `useNotes.ts`: Dexie `useLiveQuery` for `notes`, `folders`, `tags`, sidebar badge counts, CRUD (`createNote`, `updateNote`, `deleteNote`, `permanentlyDeleteNote`, `emptyTrash`, `duplicateNote`), folder/tag CRUD, and null-row guards.
  - `useAutoSave.ts`: debounced persistence to `db.notes`.
  - `useTheme.ts`: 6 theme presets + custom hex accent color.
- **Services (`src/services/`)**:
  - `importEngine/`: `smartImportEngine.ts`, `pptxParser.ts` (`jszip` + `tesseract.js` OCR), `fileParsers.ts` (`.docx`, `.pdf`, `.md`, `.html`, `.txt`), `htmlCleaner.ts`, `mathProcessor.ts`, `codeDetector.ts`, `tableProcessor.ts`, `contentNormalizer.ts`.
  - `spreadsheet/`: `csvEngine.ts`, `xlsxEngine.ts`, `spreadsheetService.ts`.
  - `databaseFormula.ts`: cell formula evaluation & column aggregations.
  - `exportService.ts`: Markdown, HTML, and Backup JSON v2.0 export/import.
  - `linkService.ts`: `[[internal links]]` extraction and `backlinks` sync.
  - `pdfStorageService.ts`, `resourceService.ts`, `clipboardService.ts`, `googleDriveService.ts`, `webClipperService.ts`, `aiService.ts`, `storage/storageManager.ts`.
- **UI & Modals**:
  - `App.tsx`: global state, keyboard shortcuts (`Ctrl+K`, `Ctrl+N`, `Delete`, `F11`, `Esc`), workspace modes, modal orchestration.
  - `Sidebar.tsx`: unified folder + note tree, manual drag-and-drop reordering, note/folder CRUD, `IconPicker` (with custom/any emoji input).
  - `DashboardView.tsx`, `DocumentHub.tsx`, `PdfViewerModal.tsx`, `SearchModal.tsx`, `SettingsModal.tsx`, `ImportModal.tsx`, `ExportModal.tsx`, `ShareModal.tsx`, `TemplatesModal.tsx`, `VersionHistoryModal.tsx`, `ShortcutsModal.tsx`, `HelpModal.tsx`, `AIAssistantModal.tsx`.
