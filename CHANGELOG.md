# Changelog

All notable changes to MemoDock are documented in this file.

## [2.4.0-parity-m4] - 2026-11-28
### Added
- **Dexie v6 Migration (`db.ts`, `types.ts`)**: Added `comments` and `syncedBlocks` tables with non-destructive upgrade hook.
- **Action Button Block (`ActionButtonBlock.tsx`)**: `/button` block to insert configurable template snippets (`{{date}}`, `{{time}}`) in one click.
- **Synced Blocks (`SyncedBlock.tsx`)**: `/sync` reusable content block synced across notes via `db.syncedBlocks`.
- **Local Comments (`TipTapEditor.tsx`)**: Per-note comment thread popover with Resolve/Reopen/Delete backed by `db.comments`.
- **Scheduled Date Reminders (`manifest.json`, `background/index.ts`, `TipTapEditor.tsx`)**: Added `alarms` and `notifications` permissions and `Bell` reminder scheduler.

## [2.3.0-parity-m3] - 2026-11-28
### Added
- **Database Views (`DatabaseBlock.tsx`)**: Table, Board (Kanban with drag-and-drop), List, Gallery, and Calendar views with live filter bar, Row-as-Page properties drawer, Full-Page expand mode, and Linked Database switcher.
- **Additional Property Types (`types.ts`, `DatabaseBlock.tsx`)**: Added `email`, `phone`, `createdTime`, `lastEditedTime`, `relation`, and `rollup` column types.
### Fixed
- **Null-Row Crash Guard (`db.ts`, `linkService.ts`)**: Purge any null/corrupted IndexedDB rows on startup and guard `extractInternalLinks` / `syncBacklinks` against null notes.

## [2.2.0-parity-m2] - 2026-11-28
### Added
- **Block Drag Handle & Action Menu (`BlockHandleMenu.tsx`)**: Hover `⋮⋮` grip on top-level blocks with Move Up, Move Down, Duplicate, Delete, and Turn Into actions.
- **Toggle Headings (`ToggleHeading.tsx`)**: Collapsible `/th1` and `/th2` heading sections.
- **Sub-Page Inline Block & Nested Sidebar Tree (`SubPageBlock.tsx`, `Sidebar.tsx`)**: `/page` creates and embeds a child note; `Sidebar.tsx` renders recursive `parentNoteId` nesting with expand/collapse carets and cycle protection.
- **Multi-Column Layout (`ColumnLayout.tsx`)**: `/2col` and `/3col` side-by-side responsive column grids inside notes.

## [2.1.0-parity-m1] - 2026-11-28
### Added
- **Inline Table of Contents Block (`/toc`)**: Live clickable heading outline (`TableOfContentsBlock.tsx`) insertable via `/` slash menu.
- **Simple Table Enhancements**: Header Column toggle (`toggleHeaderColumn`) and cell background color swatches (`CustomTableCell` + `TableControls.tsx`).
- **`@` Mentions & `[[` Page Autocomplete (`MentionMenu.tsx`)**: Live note link suggestions and quick `@today` / `@tomorrow` / `@now` date chips.
- **Per-Page Settings, Cover Banner & Copy Note Link (`TipTapEditor.tsx`, `types.ts`)**: Optional `coverImage`, `fullWidth`, `smallText`, `fontStyle`, `isLocked`, `lastViewedAt`, and one-click `notebook://note/<id>` link copy.
- **Template Variables (`templateVariables.ts`)**: Dynamic `{{date}}`, `{{time}}`, `{{datetime}}`, and `{{title}}` resolution in `App.tsx`.
