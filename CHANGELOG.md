# Changelog

All notable changes to MemoDock are documented in this file.

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
