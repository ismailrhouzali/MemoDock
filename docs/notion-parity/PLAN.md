# MemoDock Notion Feature Parity — Implementation Plan (Phase 1)

> **Status**: Awaiting user approval before writing any feature code (Phase 2).

## Guiding Principles
1. **Incremental, one-feature-per-commit**: Each item below ships in a small, testable increment with `npm test` + `npm run build` passing.
2. **Data Safety & Backwards Compatibility**:
   - All new `Note` / `NoteDatabase` fields are **optional**, so existing notes and Backup JSON v2.0 imports continue working unchanged.
   - Only bump Dexie to **Version 6** when introducing new tables/indexes (`syncedBlocks` or `comments`), with a safe `.upgrade()` hook.
3. **UI Consistency**: All new controls respect the 6 themes, custom accent color, Minimalist/Complete modes, and Side Panel layout.

---

## Phased Implementation Order

### Milestone 1 — Quick P0 & P1 Polish (Low Risk, High Daily Value)
1. **Inline Table of Contents Block & Simple Table Enhancements** (`S`)
   - Add `/toc` (`TableOfContentsBlock`) in `SlashCommandMenu.tsx` + `TipTapEditor.tsx`.
   - Extend `TableControls.tsx` + `TableCell` with header row/column toggles and cell background color picker.
2. **`@` Mentions & `[[` Page Autocomplete** (`M`)
   - Typing `[[` or `@` opens a lightweight floating suggestion popover listing existing notes (and quick date chips like `@today`, `@tomorrow`).
   - Selecting a note inserts an internal `[[Title]]` link (auto-synced by `linkService.ts`).
3. **Per-Page Settings, Cover Image & Copy Note Link** (`M`)
   - Extend `Note` (optional fields, no Dexie version bump needed): `coverImage?`, `fullWidth?`, `smallText?`, `fontStyle?`, `isLocked?`, `lastViewedAt?`.
   - Add a sleek Page Options popover in `TipTapEditor.tsx` (cover image picker/URL, full width, small text, font override, lock editing) + **Copy link** & **Recently Viewed** sorting.
4. **Template Variables (`{{date}}`, `{{time}}`, `{{title}}`)** (`S`)
   - Resolve dynamic placeholders when applying templates in `TemplatesModal.tsx`.

### Milestone 2 — Core Notion Editor Blocks (P0 & P1)
5. **Block Drag Handle & Block Action Menu** (`M`)
   - Add a hover grip (`⋮⋮`) beside top-level blocks in `TipTapEditor.tsx` with actions: *Turn into* (H1–H3, Bullet, Todo, Quote, Callout, Toggle), *Duplicate*, *Delete*, *Move up/down*, *Text/Background color*, and *Copy block anchor*.
6. **Toggle Headings (`H1–H3`)** (`M`)
   - Extend `ToggleBlock` or add `ToggleHeading` node so collapsible H1/H2/H3 headings work in editor, outline (`TableOfContents.tsx`), and Markdown export.
7. **Sub-Page Inline Block & Nested Sidebar Tree** (`M`)
   - Add `/page` (`SubPageBlock`) in `SlashCommandMenu.tsx` that creates a child note (`parentNoteId`) and renders a clickable page row inline.
   - Render recursive `parentNoteId` nesting with expand/collapse carets in `Sidebar.tsx` (with cycle guard).
8. **Multi-Column Layout (`2–4 Columns`)** (`L`)
   - Add `ColumnLayout` + `Column` TipTap nodes (`/2col`, `/3col`) with drag-and-drop between columns and clean mobile/Side Panel stacking.

### Milestone 3 — Database Power-Up (P2)
9. **Database Views (`Table`, `Board / Kanban`, `List`, `Gallery`) & Saved Views** (`L`)
   - Extend `NoteDatabase` with optional `views?: DatabaseViewConfig[]` (filters, multi-sort, `groupByColumnId`).
   - Implement **Board (Kanban)** view grouped by `status` or `select` with drag-and-drop cards between columns, plus **List** and **Gallery** views inside `DatabaseBlock.tsx`.
10. **Full-Page Database Mode & Row-as-Page Drawer** (`M`)
    - Allow opening any `NoteDatabase` as a full workspace view and clicking any row to edit all properties + body in a clean side/page view.
11. **Additional Property Types & Database Templates** (`M`)
    - Add `email`, `phone`, `createdTime`, `lastEditedTime`, `relation`, and `rollup` column types to `DatabaseBlock.tsx` + `databaseFormula.ts`, plus default row templates.
12. **Calendar & Timeline Views + Linked Database Views** (`L`)
    - Add `calendar` and `timeline` views keyed on `date` columns, and allow `DatabaseBlock` instances to reference an existing `databaseId` with independent view/filter state.

### Milestone 4 — Productivity Extras (P3, Optional / Upon Confirmation)
13. **Action Button Block** (`M`): `/button` block to insert a template snippet or append a new row to a selected database.
14. **Date Reminders (`chrome.alarms`)** (`M`): *Requires explicit approval to add `alarms` and `notifications` permissions to `public/manifest.json`.*
15. **Local Block Comments & Synced Blocks** (`L`): Requires **Dexie v6** migration (`comments` and `syncedBlocks` tables) with Backup JSON v2.0 compatibility.

---

## Database Migration Plan
- **Milestones 1–3 (Items 1–12)**: **No breaking schema change** — all new fields (`coverImage`, `fullWidth`, `smallText`, `fontStyle`, `isLocked`, `lastViewedAt`, `views`, `templates`) are optional properties on existing `Note` and `NoteDatabase` objects.
- **Milestone 4 (Item 15)**: **Dexie Version 6** upgrade adding `comments` (`id, noteId, blockId, createdAt`) and `syncedBlocks` (`id, updatedAt`) tables with a no-loss `.upgrade()` migration.
- **Backup JSON v2.0 (`exportService.ts`)**: Preserve `version: "2.0"` compatibility; optionally include `comments` and `syncedBlocks` when present without breaking older backup imports.

---

## Test Plan
For every milestone / feature implemented in Phase 2:
1. **Automated Integrity Suite (`scripts/test-integrity.js`)**:
   - Add unit/regression assertions for each new feature (e.g., template variable substitution, `[[` link extraction, database filter/sort/group-by helpers, rollup/relation evaluation, backup v2.0 round-trip with new optional fields).
   - Gate: `npm test` (currently 93/93) and `npm run build` must pass with 0 errors.
2. **Extension Runtime Verification (Phase 3)**:
   - Load `dist/` unpacked in `chrome://extensions`; verify in both full-tab (`index.html`) and Side Panel (`sidepanel.html`) across Light & Dark themes.
   - Regression check: existing notes with `DatabaseBlock`, `PdfAttachment`, `MathBlock`, `MermaidBlock`, and Backup JSON v2.0 import.
   - Performance & accessibility check: 1000+ blocks/rows responsiveness and keyboard-only menu navigation.
