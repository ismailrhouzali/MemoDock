# Changelog

All notable changes to MemoDock are documented in this file.

## [2.1.0-parity-m1] - 2026-11-28
### Added
- **Inline Table of Contents Block (`/toc`)**: Live clickable heading outline (`TableOfContentsBlock.tsx`) insertable via `/` slash menu.
- **Simple Table Enhancements**: Header Column toggle (`toggleHeaderColumn`) and cell background color swatches (`CustomTableCell` + `TableControls.tsx`).
- **`@` Mentions & `[[` Page Autocomplete (`MentionMenu.tsx`)**: Live note link suggestions and quick `@today` / `@tomorrow` / `@now` date chips.
- **Per-Page Settings, Cover Banner & Copy Note Link (`TipTapEditor.tsx`, `types.ts`)**: Optional `coverImage`, `fullWidth`, `smallText`, `fontStyle`, `isLocked`, `lastViewedAt`, and one-click `notebook://note/<id>` link copy.
- **Template Variables (`templateVariables.ts`)**: Dynamic `{{date}}`, `{{time}}`, `{{datetime}}`, and `{{title}}` resolution in `App.tsx`.
