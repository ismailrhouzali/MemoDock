# MemoDock — Personal Knowledge Workspace

> **Capture. Organize. Connect.**  
> *Your personal knowledge workspace, right inside your browser.*  
> *Save ideas. Organize resources. Build your knowledge.*

`(Smart Notes) • (PDF & PPTX + OCR) • (Inline Databases) • (Spreadsheets) • (Web Clipper) • (Local-First)`

MemoDock is a modern, local-first Chrome Extension (Manifest V3) combining distraction-free, paper-like writing with an advanced personal knowledge management suite — including PowerPoint-to-Markdown extraction with OCR, inline databases, KaTeX math, Mermaid diagrams, and Google Drive sync.

- **GitHub Repository**: [https://github.com/ismailrhouzali/MemoDock](https://github.com/ismailrhouzali/MemoDock)
- **Tech Stack**: Manifest V3, React 18, TypeScript, Vite 5, Tailwind CSS, TipTap 2, Dexie.js 4 (IndexedDB), KaTeX, Mermaid, Mammoth, Marked, JSZip, Tesseract.js, Lucide Icons.

---

## 🎯 Target Audiences & Core Use Cases

| Audience | How MemoDock Helps |
| :--- | :--- |
| **Students** *(Primary)* | Fast lecture note-taking, lightweight PDF storage, PowerPoint (`.pptx`) slide + OCR import to Markdown, revision sheets, instant KaTeX math formulas. |
| **Developers** *(Primary)* | Technical docs, syntax-highlighted code blocks (40+ languages via `lowlight`), Mermaid architecture diagrams, clean Markdown paste from AI chats & docs. |
| **Researchers** | Paper organization, PDF viewer with ephemeral URLs, structured citations, inline databases, and interactive tables. |
| **Content Creators** | Quick idea capture, drag-and-drop web link cards, folder & tag organization, custom icons/emojis. |
| **Knowledge Workers** | Unified local-first workspace in a full tab or Chrome Side Panel, zero tab overload, optional Google Drive backup. |

---

## 🚀 Installation in Google Chrome (Under 60 Seconds)

### Option 1: Load the Extension via Developer Mode (Recommended)

1. Clone and build the repository:
   ```bash
   git clone https://github.com/ismailrhouzali/MemoDock.git
   cd MemoDock
   npm install
   npm run build
   ```
2. Open Google Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** (top-left) and select the **`dist`** folder inside `MemoDock`.
5. Pin **MemoDock** to your Chrome toolbar — clicking the icon opens MemoDock directly in a dedicated full tab (or use the Chrome Side Panel).

### Option 2: Pre-packaged ZIP

Download `memodock-extension.zip` (generated in `dist/` and `public/`), extract it to a folder, and load that folder via **Load unpacked** in `chrome://extensions`.

---

## 🎨 Design & Workspace Architecture

- **Minimalist Mode & Complete Mode**: Runs in a clean, distraction-free Minimalist Mode by default (with Complete Mode available in Settings), plus **Focus Mode (`F11`)**.
- **6 Calibrated Visual Themes**: Clean White, Warm Sepia, Cool Frost, Soft Gray, Midnight Navy, and Deep AMOLED, paired with a custom hex accent palette.
- **5 Curated Workspace Profiles**:
  - **Study & Courses** · **Engineering & Code** · **Academic Research** · **Distraction-Free Writing** · **Balanced Daily**
- **Unified Sidebar Tree**:
  - Folders and notes live together in one unified hierarchy (folders collapsed by default).
  - Manual **drag-and-drop** reordering for both folders and notes, plus drag-and-drop notes into folders.
  - Inline CRUD for folders and notes, and **any custom emoji/icon** support (curated categories, search, or paste/type any emoji via `Win + .`).
- **Typography, Zoom & Polished Titles**:
  - Placeholder note titles rendered in subtle gray.
  - Built-in **Zoom In / Zoom Out** controls in the top-right `...` menu, resizable sidebar (`200px–450px`), and scroll-synchronized Table of Contents.
- **Dashboard Views**:
  - Toggleable **Workspace Dashboard** (`DashboardView`) for quick access to pinned and recent notes.
  - **Note Dashboard Mode**: Transform any note into an interactive dashboard summarizing tasks, tables, and sub-pages.
- **Built-in Onboarding & Help**: Interactive getting-started & customization guide (`HelpModal`).

---

## 💡 Key Features

### 1. Rich TipTap Editor & Custom Blocks
- **Slash Commands (`/`)**, floating formatting toolbar, context menu, and in-editor **Find & Replace (`Ctrl+F`)**.
- **LaTeX Math (KaTeX)**: Real-time inline (`\(...\)` / `$...$`) and block (`\[...\]` / `$$...$$`) equations with currency-safe detection.
- **Mermaid Diagrams**: Live rendering of flowcharts, sequence diagrams, mindmaps, ER diagrams, and more.
- **Interactive Blocks**: Callouts (`CalloutBlock`), collapsible toggles (`ToggleBlock`), task checklists, syntax-highlighted code blocks, and **any-emoji insertion** directly from the toolbar.
- **Enhanced Images (`EnhancedImage`)**: Paste images directly from clipboard, upload files, resize, preview, and download.

### 2. PowerPoint (`.pptx`) to Markdown + OCR
- Import `.pptx` presentations directly from the editor toolbar or the **Universal Smart Import** modal (`ImportModal`).
- Extracts **slide titles, body text, nested bullet lists, tables, speaker notes, and embedded images** using `jszip` + `marked`.
- Runs client-side **OCR (`tesseract.js`, `eng+fra`)** on extracted slide images and appends recognized text cleanly into the generated Markdown note.

### 3. Inline Databases & Spreadsheets
- **Inline Databases (`DatabaseBlock`)**: Notion-style editable tables inside notes supporting `Text`, `Select`, `Multi-select`, `Status`, `Date`, `Person`, `Image`, and formula fields (`databaseFormula.ts`) with Excel-like editing.
- **CSV & Excel Spreadsheets (`SpreadsheetNode`)**: Native RFC 4180 CSV parser (`csvEngine.ts`) and multi-sheet `.xlsx` parser (`xlsxEngine.ts`) embeddable directly inside notes.

### 4. High-Performance PDF Manager & Link Cards
- **Binary Blob PDF Storage**: PDFs are stored as binary blobs in IndexedDB (`pdfStorageService.ts`) with ephemeral object URLs and compact or embedded viewer modes (`DocumentHub`, `PdfViewerModal`).
- **Link Cards (`LinkCard`)**: Pasted or imported URLs render as clean cards (compact, mention, or embedded) matching PDF/CSV attachments and open safely in a new tab (`_blank`).

### 5. Universal Smart Import & Export
- **Smart Clipboard Engine**: Automatically cleans and converts content copied from ChatGPT, Claude, Gemini, Notion, VS Code, GitHub, StackOverflow, Google Docs, and spreadsheet TSVs.
- **Multi-Format File Import**: `.pptx` (+ OCR), `.docx` (via `mammoth`), `.pdf` (text extraction or attachment), `.md`, `.html`, `.txt`, `.csv`, and `.xlsx`.
- **Export & Share**: Print-ready PDF export, Markdown, HTML, JSON backup, `ExportModal`, and `ShareModal`.
- **Extras**: Built-in **AI Assistant** (`AIAssistantModal`), **Templates** (`TemplatesModal`), and **Version History** (`VersionHistoryModal`).

### 6. 100% Local-First Privacy & Sync
- All notes, folders, tags, attachments, and databases are stored locally in **IndexedDB** via Dexie.js (`src/db/db.ts`).
- Optional **Google Drive Cloud Sync** (`googleDriveService.ts`) with conflict resolution and an in-app setup guide for local unpacked Chrome extensions.
- Optional local file-system sync.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Alt + N` | Open MemoDock quick popup anywhere in Chrome |
| `Ctrl + Shift + K` | Open MemoDock in a dedicated full-screen tab |
| `Ctrl + K` | Open Omnibar search across notes |
| `Ctrl + N` | Create a new note |
| `Delete` | Move the active note to Trash (when not typing in an input/editor) |
| `F11` | Toggle Focus Mode |
| `Ctrl + F` | Open in-editor Find & Replace bar |
| `Esc` | Close active modal or focus overlay |

---

## 📁 Project Structure

```text
src/
├── App.tsx                         # Main workspace shell, shortcuts, theme & modal orchestration
├── background/index.ts             # MV3 Service Worker (context menus & keyboard commands)
├── db/                             # Dexie IndexedDB schema & TypeScript types
├── hooks/                          # useNotes, useAutoSave, useTheme
├── components/
│   ├── common/                     # ContextMenu, IconPicker (custom & categorized emojis)
│   ├── dashboard/                  # DashboardView
│   ├── editor/                     # TipTapEditor, EditorToolbar, SlashCommandMenu, TableOfContents, extensions/
│   ├── layout/                     # Sidebar, TopToolbar, StatusBar
│   ├── modals/                     # ImportModal, ExportModal, SettingsModal, ShareModal, HelpModal, SearchModal, ...
│   └── pdf/                        # DocumentHub, PdfViewerModal
└── services/
    ├── importEngine/               # smartImportEngine, pptxParser (+ OCR), fileParsers, mathProcessor, ...
    ├── spreadsheet/                # csvEngine, xlsxEngine, spreadsheetService
    ├── storage/                    # storageManager
    └── ...                         # exportService, googleDriveService, pdfStorageService, linkService, aiService
```

---

## 🧪 Verification & Integrity Tests

MemoDock includes an automated verification suite covering:
- Chrome Manifest V3 declarations, OAuth configuration, and permissions
- Background Service Worker & popup/sidepanel HTML constraints
- LaTeX math conversion and currency protection (`$230,000`, `$50.00`)
- TSV / CSV RFC 4180 parsing and round-trip export
- French educational content normalization & ASCII code block handling
- Table of Contents extraction (H1–H4) & internal `[[link]]` extraction
- Backup JSON v2.0 schema, Workspace Profiles, and Keyboard Shortcuts

Run tests anytime:
```bash
npm test
```
All **93/93** tests pass with 0 errors.

---

## 📄 License

MIT License. Designed with privacy, minimalism, and focus.
