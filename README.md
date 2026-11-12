# NoteBook: Minimalist Advanced Note-Taking Chrome Extension

> **A distraction-free, paper-like digital notebook combining TabNotebook's minimalist writing aesthetic with Hypnoter's advanced knowledge-management capabilities.**

Built with **Manifest V3**, **React 18**, **TypeScript**, **Tailwind CSS**, **TipTap**, **Dexie.js (IndexedDB)**, **KaTeX**, and **Mermaid**.

---

## 🌟 Key Highlights & Philosophy

- **Local-First & 100% Private**: All notes, folders, and tags are stored strictly in your browser's local IndexedDB. No accounts, no sign-ups, no tracking, and fully functional offline.
- **Distraction-Free UI/UX**: Inspired by [TabNotebook](https://tabnotebook.com/), featuring warm paper tones in light mode, deep obsidian in dark mode, comfortable reading column widths, and zero visual clutter.
- **Advanced Rich Content**: Inspired by [Hypnoter](https://hypnoter.app/), featuring interactive checklists, tables with row/col manipulation, LaTeX mathematical formulas via KaTeX, flowchart and sequence diagram generation via Mermaid, code syntax highlighting, and drag-and-drop image uploads.
- **Web Research & Clipping**: Capture selected text or page bookmarks directly from any webpage using the right-click context menu into NoteBook with source links and timestamps.
- **Flexible Workspaces**: Operates seamlessly as a Chrome Extension Toolbar Popup, Chrome Side Panel, or dedicated Full-Page Tab.
- **Optional AI Writing Assistant**: Summarize notes, correct grammar, rewrite & polish, convert into bullet points, explain concepts, brainstorm ideas, or translate using your own Google Gemini or OpenAI API key.

---

## 🚀 Quick Start & Installation in Google Chrome

To install and run the production-ready extension in Chrome:

### 1. Build the Extension
```bash
npm install
npm run build
```
This compiles the application and background service worker into the production `dist/` directory.

### 2. Load the Unpacked Extension in Chrome
1. Open Google Chrome and navigate to:
   ```
   chrome://extensions
   ```
2. Enable **Developer mode** using the toggle in the top-right corner.
3. Click the **"Load unpacked"** button in the top-left corner.
4. Select the `dist` folder inside this project directory (`c:\Users\ISMAIL\Desktop\notebook\dist`).
5. The extension **"NoteBook - Minimalist Advanced Notes"** will now appear in your Chrome toolbar.

### 3. Usage Modes
- **Toolbar Popup**: Click the NoteBook extension icon or press `Alt + N` anywhere in Chrome.
- **Side Panel**: Right-click the extension icon and select "Open Side Panel" to keep notes open alongside your browsing.
- **Dedicated Full Tab**: Click the "Open in Dedicated Tab" icon in the top toolbar or press `Ctrl + Shift + K` to enjoy a full-screen writing sanctuary.

---

## 🛠️ Features Breakdown

### 1. Rich Text & Content Editing
- **Headings & Hierarchy**: H1 (`# `), H2 (`## `), H3 (`### `), and standard paragraphs.
- **Formatting**: Bold (`Ctrl+B`), Italic (`Ctrl+I`), Underline (`Ctrl+U`), Strikethrough, Multicolor Highlight, Inline Code.
- **Checklists & Task Lists**: Interactive checkboxes (`[] ` or `[ ] `) with strike-through completion.
- **Lists**: Bullet lists (`- `) and Ordered lists (`1. `).
- **Interactive Tables**: Add/delete rows above or below, add/delete columns left or right, toggle header rows, and delete tables.
- **LaTeX Math Equations**: Inline and block mathematical formulas rendered instantly with KaTeX (e.g. $E = mc^2$, $\int_0^\infty e^{-x^2} dx = \frac{\sqrt{\pi}}{2}$).
- **Mermaid Diagrams**: Live rendering of flowcharts, sequence diagrams, mindmaps, and architecture diagrams with preset templates.
- **Code Syntax Highlighting**: Auto-styled code blocks powered by `lowlight` with syntax highlighting for JavaScript, TypeScript, Python, HTML, CSS, JSON, SQL, etc.
- **Drag-and-Drop Image Upload**: Drop or paste any image from clipboard; stored locally as base64 Data URLs.
- **Emoji Inserter**: Quick emoji insertion popover.
- **Find & Replace**: Built-in search and replace bar with match counters (`Ctrl + F`).
- **Floating Bubble Menu**: Appears on text selection for formatting without breaking your writing flow.

### 2. Note Organization & Management
- **Folders**: Organize notes into colored folders (create, rename, delete).
- **Tags**: Multi-tag assignment (`#tag`) with tag filtering and colored badges.
- **Favorites & Pinning**: Pin crucial notes to the top of your list; star favorites.
- **Archiving & Trash**: Soft-delete notes into the Trash with instant restoration or permanent purge; archive completed projects.
- **Multi-Criteria Sorting**: Sort by Latest Modified, Newest Created, or Title (A-Z).
- **Omnibar Search (`Ctrl + K`)**: Instant modal search across all note titles, contents, and tags with keyboard navigation (`↑`/`↓`/`Enter`).
- **Word & Read Time Counters**: Real-time word count, character count, and estimated reading time.
- **Rock-Solid Auto-Save**: Debounced non-blocking background save with clear status indicators (`Saved locally`, `Saving...`, `Unsaved`).

### 3. Web Research & Context Menu Clipping
- **Save Selection**: Highlight any text on any webpage $\to$ right-click $\to$ select **"Save selection to NoteBook"**. The extension automatically captures the snippet, tab title, URL, and timestamp.
- **Save Bookmark**: Right-click on any webpage $\to$ select **"Save page link to NoteBook"**.
- Real-time notification badge (`✓`) indicates successful capture.

### 4. Data Export & Complete Backup
- **Markdown (.md)**: Clean markdown export of headings, lists, tables, and code.
- **PDF Document**: One-click print / save to PDF with custom distraction-free print styling.
- **HTML Document (.html)**: Self-contained styled HTML file.
- **Plain Text (.txt)**: Clean unformatted text export.
- **Full JSON Backup & Restore**: One-click download of all notes, folders, and tags in JSON format. Easily restore previous backups with duplicate detection.

### 5. Optional AI Writing Copilot
- **Available Actions**:
  - Summarize note into clear takeaways.
  - Correct grammar, spelling, and punctuation.
  - Rewrite & polish for improved articulation.
  - Extract structured bullet points.
  - Explain complex technical concepts simply.
  - Brainstorm creative ideas and next steps.
  - Translate accurately into foreign languages.
- **Multi-Provider Support**: Google Gemini (`gemini-1.5-flash`), OpenAI (`gpt-4o-mini`), or custom local OpenAI-compatible endpoints (Ollama, Groq, OpenRouter).
- **100% Optional & Private**: Your API key never leaves your browser; core note-taking is completely offline.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` | Open Omnibar Quick Switcher & Full-Text Search |
| `Ctrl + N` | Create a New Note |
| `Ctrl + F` | Toggle Find and Replace Bar |
| `F11` | Toggle Distraction-Free Focus Mode |
| `Ctrl + B` | Bold |
| `Ctrl + I` | Italic |
| `Ctrl + U` | Underline |
| `Ctrl + Z` / `Ctrl + Y` | Undo / Redo |
| `Alt + N` | Open Quick Note Popup (Chrome Extension global) |
| `Ctrl + Shift + K` | Open NoteBook in Full Tab (Chrome Extension global) |

### Markdown Shortcuts (Type inside editor)
- `# ` followed by text: Heading 1
- `## ` followed by text: Heading 2
- `### ` followed by text: Heading 3
- `- ` or `* `: Bullet list
- `1. `: Numbered list
- `[] ` or `[ ] `: Interactive checklist
- `> `: Blockquote
- ` ``` `: Code block
- `---`: Horizontal rule

---

## 📁 Project Architecture

```
notebook/
├── public/
│   ├── manifest.json              # Chrome Manifest V3 configuration
│   └── icons/                     # Extension icons (16px, 32px, 48px, 128px)
├── src/
│   ├── background/
│   │   └── index.ts               # Background service worker (context menus, shortcuts)
│   ├── components/
│   │   ├── editor/
│   │   │   ├── TipTapEditor.tsx   # Core TipTap rich-text editor instance
│   │   │   ├── EditorToolbar.tsx  # Distraction-free formatting toolbar
│   │   │   ├── TableControls.tsx  # Dynamic table manipulator
│   │   │   ├── FindReplaceBar.tsx # In-editor search and replace
│   │   │   ├── EmojiPicker.tsx    # Native emoji insert popup
│   │   │   └── extensions/
│   │   │       ├── MathBlock.tsx  # KaTeX LaTeX node view
│   │   │       └── MermaidBlock.tsx # Mermaid diagram node view
│   │   ├── layout/
│   │   │   ├── TopToolbar.tsx     # Application header, theme switch, view toggles
│   │   │   ├── Sidebar.tsx        # Folders, tags, note list, and trash views
│   │   │   └── StatusBar.tsx      # Real-time word count & save indicator
│   │   └── modals/
│   │       ├── SettingsModal.tsx  # Layout, theme, font, and AI key configuration
│   │       ├── AIAssistantModal.tsx # AI copilot actions & results
│   │       ├── ExportModal.tsx    # Markdown, PDF, HTML, TXT, and JSON backup/restore
│   │       ├── SearchModal.tsx    # Omnibar search dialog
│   │       └── ShortcutsModal.tsx # Shortcuts & Markdown cheatsheet
│   ├── db/
│   │   ├── db.ts                  # Dexie.js database schema & initial seed data
│   │   └── types.ts               # TypeScript data models
│   ├── hooks/
│   │   ├── useNotes.ts            # Reactive note collection & CRUD operations
│   │   ├── useAutoSave.ts         # Rock-solid debounced autosave
│   │   └── useTheme.ts            # Light / Dark / System theme switcher
│   ├── services/
│   │   ├── aiService.ts           # Multi-provider client (Gemini, OpenAI, Ollama)
│   │   ├── exportService.ts       # Converters for MD, PDF, HTML, TXT, JSON
│   │   └── webClipperService.ts   # Context menu research synchronization
│   ├── styles/
│   │   └── index.css              # Typography, dark mode, and print stylesheets
│   ├── App.tsx                    # Main container
│   └── main.tsx                   # React root entry
├── vite.config.ts                 # Multi-entry build configuration
├── tailwind.config.js             # Minimalist typography & warm paper theme
└── package.json
```

---

## 🔒 Privacy & Security

- **Zero Telemetry**: No external analytics, trackers, or cookies.
- **Local-First Storage**: Notes live in your browser's IndexedDB and do not touch external servers.
- **API Key Security**: If you choose to configure an AI API key, it is saved exclusively in your browser's local storage and used directly for API calls without any intermediary proxy.

---

## 📄 License

MIT License. Designed and crafted for modern, distraction-free productivity.

