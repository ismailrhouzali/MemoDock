---
name: notion-feature-parity
description: Extend the existing MemoDock Chrome extension (MV3, React 18, TypeScript, Vite, TipTap 2, Dexie) with Notion-style features that are still missing. Use when asked to add, compare or verify Notion-like features in MemoDock. Never rebuild existing features.
---

# Notion Feature Parity for MemoDock

## Mission
MemoDock already exists and works. Do NOT create a new app and do NOT rewrite existing modules. Find which Notion-style features are missing or only partial, then add them one at a time, safely, using the existing stack, components and design system.

## Hard rules
1. Reuse before you build: check `src/components`, `src/services`, `src/db` and the TipTap `extensions/` folder first. Extend existing blocks and services instead of duplicating them.
2. Data safety: every schema change needs a Dexie version bump with an upgrade migration. Keep the Backup JSON v2.0 import/export working (add new fields as optional, bump the version only if needed). Old notes must open unchanged.
3. Manifest V3 limits: no remote code, no eval, strict CSP, minimal new permissions (justify each one). Large data goes in IndexedDB.
4. Keep local-first. Cloud features stay optional and go through the existing Google Drive sync.
5. UI consistency: respect the 6 themes, the accent color, Minimalist/Complete modes, Focus Mode, existing shortcuts and the existing icon system. New UI must work in all themes.
6. Clean-room: replicate Notion behavior only from public behavior and help docs. Use original names, icons and text. Do not copy Notion code or branding.
7. Quality gate: `npm test` (currently 93/93 passing) and `npm run build` must pass before any feature is called done. Add tests for each new feature.
8. Ask me before building anything ambiguous. Do not add features outside this skill without approval.

## Already in MemoDock (do NOT rebuild, only improve if a gap is proven)
- TipTap editor, slash commands, floating toolbar, context menu, find & replace
- KaTeX math, Mermaid, callouts, toggles, task lists, code blocks, enhanced images
- Inline databases (Text, Select, Multi-select, Status, Date, Person, Image, formulas), CSV/XLSX spreadsheets
- PDF manager and viewer, link cards, PPTX/DOCX/PDF/MD/HTML import, OCR, smart clipboard
- Unified sidebar tree (folders + notes), drag and drop, custom emoji icons
- Omnibar search (Ctrl+K), templates, version history, trash, favorites/pinned/recent, dashboard
- Table of contents, `[[internal links]]`, tags, export (PDF/MD/HTML/JSON), share, AI assistant
- Google Drive sync, 6 themes, 5 workspace profiles, zoom, Focus Mode

## Workflow (follow in order)

### Phase 1 - STUDY (no feature code yet)
1. Audit the codebase and write `docs/notion-parity/AUDIT.md`: data model (Dexie tables), editor extensions, services, state flow.
2. For each candidate feature in the backlog below, verify in the code whether it is: `exists`, `partial` or `missing`. Cite the file that proves it.
3. Write `docs/notion-parity/GAPS.md`: feature, status, evidence file, effort (S/M/L), risk, dependencies.
4. Write `docs/notion-parity/PLAN.md`: implementation order, DB migrations needed, test plan.
5. STOP and wait for my approval of PLAN.md.

### Phase 2 - BUILD (one feature per branch/commit)
- Implement the smallest working version first, then extend it.
- Add or update unit tests and a `CHANGELOG.md` entry.
- Add the feature to `HelpModal` and the shortcuts table if it adds a shortcut or command.

### Phase 3 - CHECK (per feature)
- `npm test` and `npm run build` pass.
- Load `dist` as an unpacked extension and manually test the feature in the full tab and in the Side Panel.
- Regression: open old notes, a note with a database, a PDF, math and Mermaid, and confirm they still render and save.
- Migration: import a backup made before the change and confirm nothing is lost.
- Performance: a note with 1000+ blocks and a database with 1000+ rows must stay responsive.
- Accessibility: keyboard-only use of new menus, visible focus.
- Report: what works, what fails, what is unknown.

### Phase 4 - REFINE
- Fix failures and re-run the checks, up to 3 rounds per feature.
- Final status per feature: `done`, `done with known issues` (list them) or `blocked` (say why). Never report `done` if a check fails.

## Candidate backlog (verify each against the code first)

### P0 - Editor parity
- Block drag handle (grip beside each block) and block action menu: turn into, duplicate, delete, move, copy link to block, text and background color
- Toggle headings (H1-H3 that collapse their content)
- Column layout (2-4 columns, drag blocks between columns)
- Markdown shortcuts completeness ("# ", "- ", "[] ", "> ", "---", "```", "1. ")
- Mentions with "@" (pages, dates) and "[[" autocomplete with suggestions
- Table of contents block, divider, breadcrumb, bookmark/embed blocks (video, maps, web page preview) within CSP limits
- Simple table improvements (column resize, header row/column, cell background)

### P1 - Organization
- Sub-pages inside a note (a page block that creates a child note) and full nesting in the sidebar tree
- Backlinks panel for each note
- Page cover image, page properties (text, select, date, checkbox, tags) shown at the top
- Per-page settings: full width, small text, font style, lock page
- Synced blocks (one block reused in several notes) if feasible
- Duplicate page, move to, copy link, recently viewed list

### P2 - Databases (largest gap area)
- Database as a full page (not only inline), each row openable as a page
- Views: table, board (kanban by Status/Select), list, gallery, calendar, timeline
- Filter, sort, group-by and saved views per database
- Linked database view (show the same database elsewhere with different filters)
- Properties: checkbox, number, URL, email, phone, created time, last edited time, relation, rollup
- Database templates (default row templates) and row-level formulas
- Drag rows between board columns

### P3 - Productivity extras
- Template variables (date, title, cursor placement) and "template button" blocks
- Button block that runs a simple action (insert block, add row)
- Reminders on date properties using `chrome.alarms` and notifications (justify permissions)
- Comments on blocks (local only)
- Web clipper: save the current tab or selection as a new note via context menu (verify it exists first)
- Public/shared read-only export link only if it can be done without a server; otherwise skip and tell me

## Output format for every report
Use this order: Summary, Files changed, Migrations, Tests added, Check results, Known issues, Next step.

## Start now
Run Phase 1 only. Produce `AUDIT.md`, `GAPS.md` and `PLAN.md`, then wait for my approval. Do not write feature code before that.