# MemoDock Notion Feature Parity — Gap Analysis

> Status legend: **`exists`** (fully implemented), **`partial`** (present with clear missing pieces), **`missing`** (not implemented).  
> Effort: **S** (≤ 1 day), **M** (2–3 days), **L** (4+ days).

## P0 — Editor Parity

| Feature | Status | Evidence File(s) | Effort | Risk | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Block drag handle & block action menu** (grip beside each block: turn into, duplicate, delete, move, copy link to block, text & bg color) | `missing` | `src/components/editor/TipTapEditor.tsx`, `src/components/common/ContextMenu.tsx` | M | Medium (ProseMirror node selection & focus edge cases) | TipTap `NodeSelection` / custom ProseMirror plugin |
| **Toggle headings (H1–H3)** (headings that collapse their following content) | `missing` | `src/components/editor/extensions/ToggleBlock.tsx`, `TipTapEditor.tsx` | M | Medium (HTML serialization & TOC compatibility) | Custom `ToggleHeading` TipTap node or StarterKit heading extension |
| **Column layout** (2–4 columns, drag blocks between columns) | `missing` | `src/components/editor/TipTapEditor.tsx`, `src/components/editor/SlashCommandMenu.tsx` | L | High (nested TipTap editors/columns & Markdown export) | `ColumnList` + `Column` TipTap nodes |
| **Markdown shortcuts completeness** (`# `, `- `, `[] `, `> `, `---`, ```` ``` ````, `1. `) | `exists` | `TipTapEditor.tsx` (`StarterKit` + `TaskList`/`TaskItem` input rules) | S | Low (verify `[] ` / `[ ] ` trigger) | `StarterKit`, `TaskItem` |
| **`@` Mentions & `[[` Autocomplete** (pages, dates via `@`; `[[` live page suggestions) | `missing` | `src/services/linkService.ts`, `src/components/editor/SlashCommandMenu.tsx` | M | Low | `linkService.ts`, `allNotes` prop in `TipTapEditor` |
| **ToC block, Divider, Breadcrumb, Bookmark/Embed blocks** | `partial` | `Divider` (`Minus` in `SlashCommandMenu.tsx`), `Breadcrumb` (`TipTapEditor.tsx:664`), `LinkCard.tsx` (`compact`/`embedded`/`mention`/`url`), `TableOfContents.tsx` (sidebar panel exists, inline ToC *block* `missing`) | S | Low | `TableOfContents.tsx`, `LinkCard.tsx` (CSP-safe embeds) |
| **Simple table improvements** (column resize, header row/column, cell background) | `partial` | `TipTapEditor.tsx:198` (`resizable: true`), `TableControls.tsx` (row/col add/delete, merge/split `partial`; missing header row/col toggle & cell background color) | S | Low | `@tiptap/extension-table-cell` custom `backgroundColor` attr + `TableControls.tsx` |

---

## P1 — Organization

| Feature | Status | Evidence File(s) | Effort | Risk | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Sub-pages inside a note & full nesting in sidebar tree** | `partial` | `TipTapEditor.tsx:1011` (sub-pages grid at bottom of note + `parentNoteId` in `db.ts`); **missing**: inline sub-page TipTap block & recursive nested tree in `Sidebar.tsx` | M | Medium (cycle prevention & drag-drop tree rules) | `Note.parentNoteId`, `Sidebar.tsx`, `SlashCommandMenu.tsx` |
| **Backlinks panel for each note** | `exists` | `TipTapEditor.tsx:599,1051`, `src/services/linkService.ts` | — | — | Already implemented |
| **Page cover image & page properties** (text, select, date, checkbox, tags at top) | `partial` | Tags exist at top (`TipTapEditor.tsx`); **missing**: `coverImage` banner & custom page `properties` | M | Low (Dexie optional fields, Backup v2.0 safe) | `Note` type (`coverImage?`, `properties?`) |
| **Per-page settings** (full width, small text, font style, lock page) | `missing` | `src/db/types.ts` (settings are global only in `AppSettings`, not per-note) | S | Low | `Note` optional attrs + `TipTapEditor.tsx` (`editable: !note.isLocked`) |
| **Synced blocks** (one block reused across several notes) | `missing` | `src/db/db.ts` (no `syncedBlocks` table) | L | High (concurrent edits, Dexie sync, GDrive backup) | New `syncedBlocks` table (Dexie v6) |
| **Duplicate page, move to, copy link, recently viewed list** | `partial` | `duplicateNote` (`App.tsx:396`), `movingNoteId` (`Sidebar.tsx:213`), `recents` filter (`useNotes.ts:28` uses `updatedAt` 7d); **missing**: Copy internal note link action & `lastViewedAt` tracking | S | Low | `Sidebar.tsx`, `TipTapEditor.tsx`, `Note.lastViewedAt?` |

---

## P2 — Databases

| Feature | Status | Evidence File(s) | Effort | Risk | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Database as a full page & row openable as a page** | `partial` | `DatabaseRow.linkedNoteId` exists (`types.ts:96`, `DatabaseBlock.tsx`); **missing**: dedicated full-page database view & slide-over/page editor for row properties | M | Low | `DatabaseBlock.tsx`, `App.tsx` |
| **Views: table, board (kanban), list, gallery, calendar, timeline** | `partial` | `DatabaseViewType` defines `'table' \| 'board' \| 'gallery'` (`types.ts:84`), but `DatabaseBlock.tsx` only renders table view; `list`, `calendar`, `timeline` are `missing` | L | Medium | `DatabaseBlock.tsx` |
| **Filter, sort, group-by & saved views per database** | `partial` | Single-column `sortColId` exists (`DatabaseBlock.tsx:74`); **missing**: filter rules, group-by, multi-sort, and persisted `views[]` on `NoteDatabase` | M | Medium | `NoteDatabase` type |
| **Linked database view** (same database shown elsewhere with different filters) | `missing` | `DatabaseBlock.tsx` (creates/loads 1:1 by `databaseId`, no per-block view config/filter) | M | Medium | `DatabaseBlock` attrs (`viewId` / local filter) |
| **Additional properties** (checkbox, number, URL, email, phone, created time, last edited time, relation, rollup) | `partial` | `checkbox`, `number`, `url`, `formula`, `text`, `select`, `multi-select`, `status`, `date`, `person`, `image` **exist** (`DatabaseBlock.tsx:47-58`); **missing**: `email`, `phone`, `createdTime`, `lastEditedTime`, `relation`, `rollup` | M | Medium (`relation`/`rollup` cross-DB lookups) | `DatabaseColumnType`, `db.databases` |
| **Database templates & row-level formulas** | `partial` | Cell-level `formula` (`evaluateCellFormula` in `databaseFormula.ts`) **exists**; **missing**: default row templates & cross-column row formulas | M | Low | `databaseFormula.ts`, `NoteDatabase` |
| **Drag rows between board columns** | `missing` | Board view itself is not yet rendered in `DatabaseBlock.tsx` | M | Medium | Board view in `DatabaseBlock.tsx` |

---

## P3 — Productivity Extras

| Feature | Status | Evidence File(s) | Effort | Risk | Dependencies |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Template variables & template button blocks** | `missing` | `TemplatesModal.tsx` (static HTML templates only; no `{{date}}`, `{{title}}`, cursor, or button block) | S | Low | `TemplatesModal.tsx`, new `TemplateButtonBlock` |
| **Action Button block** (insert block, add database row) | `missing` | `src/components/editor/extensions/` | M | Low | TipTap custom Node |
| **Reminders on date properties** (`chrome.alarms` + notifications) | `missing` | `public/manifest.json` (does not have `alarms` or `notifications` permissions) | M | Medium (requires adding MV3 `alarms` + `notifications` permissions) | `manifest.json`, `background/index.ts` |
| **Local block comments** | `missing` | `src/db/db.ts` (no comments storage or inline comment marks) | M | Medium | `Note` or `comments` table + TipTap mark |
| **Web clipper** (save current tab or selection via context menu) | `exists` | `src/background/index.ts:12-125`, `src/services/webClipperService.ts` | — | — | Already implemented |
| **Public/shared read-only export link without server** | `skipped` | `src/components/modals/ShareModal.tsx` (requires a server for hosted links; MemoDock already exports standalone HTML/MD/JSON locally) | — | — | Not feasible serverless; keep local HTML/JSON export |
