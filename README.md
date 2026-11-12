# MemoDock — Personal Knowledge Workspace

> **Capture. Organize. Connect.**  
> *Your personal knowledge workspace, right inside your browser.*  
> *Save ideas. Organize resources. Build your knowledge.*

`(Smart Notes) (Web Clipper) (Resource Library) (PDF Manager) (Local-first)`

MemoDock is a modern, lightweight, feature-packed Chrome extension combining distraction-free, paper-like writing with an advanced personal knowledge management suite.

- **GitHub Repository**: [https://github.com/ismailrhouzali/MemoDock](https://github.com/ismailrhouzali/MemoDock)
- **Tech Stack**: Manifest V3, React 18, TypeScript, Tailwind CSS, TipTap, Dexie.js (IndexedDB), KaTeX, Mermaid, Lucide Icons.

---

## 🎯 Target Audiences & Core Use Cases

| Public | Besoin auquel répondre dans MemoDock |
| :--- | :--- |
| **Étudiants** *(Prioritaire)* | Prise de cours instantanée, stockage léger de PDF, fiches de révisions, formules mathématiques KaTeX sans latence. |
| **Développeurs** *(Prioritaire)* | Documentation technique, snippets de code avec coloration syntaxique, intégration GitHub, import propre de Markdown depuis ChatGPT / StackOverflow. |
| **Chercheurs** | Articles scientifiques (arXiv), gestion des références, figures et diagrammes Mermaid, citations structurées. |
| **Créateurs de contenu** | Idées à la volée, capture d'inspirations web par glisser-déposer, organisation par dossiers et étiquettes. |
| **Knowledge Workers** | Centralisation et organisation de l'information, zéro dispersion cognitive entre 40 onglets, synchronisation locale et cloud sécurisé. |

---

## 🚀 Installation in Google Chrome (Under 60 Seconds)

### Option 1: Load the Extension via Developer Mode (Recommended)

1. Clone or download this repository:
   ```bash
   git clone https://github.com/ismailrhouzali/MemoDock.git
   cd MemoDock
   npm install
   npm run build
   ```
2. Open Google Chrome and go to:
   ```
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **"Load unpacked"** (Charger l'extension non empaquetée) in the top-left corner.
5. Select the **`dist`** folder inside the `MemoDock` directory.
6. MemoDock is installed! Pin it to your Chrome toolbar for instant access.

### Option 2: Pre-packaged ZIP

Download `memodock-extension.zip` directly from the releases or the landing page (`landing.html`), extract it to a folder, and select that folder in `chrome://extensions` via **Load unpacked**.

---

## 💡 Key Features

### 1. Smart Notes & Distraction-Free Writing
- **Minimalist Mode vs Complete Mode**: Switch in one click between pure digital paper (zero clutter, no formatting toolbars or metadata) and a full-featured workspace with outline table of contents.
- **LaTeX Math (KaTeX)**: Real-time rendering of inline ($\bar{Y}$) and block ($E = mc^2$) mathematical formulas.
- **Mermaid Diagrams**: Flowcharts, sequence diagrams, mindmaps, and architecture diagrams rendered live.
- **Code Highlighting**: Full syntax highlighting across 40+ programming languages powered by `lowlight`.
- **Interactive Tables & Task Lists**: Checklist items and spreadsheet tables.

### 2. High-Performance PDF Manager (Zero Browser Bloat)
- **Binary Blob Storage**: PDFs are stored as native binary blobs in IndexedDB rather than heavy base64 strings in text memory, keeping your browser fast and light.
- **On-Demand Ephemeral URLs**: Generates temporary viewer URLs on demand and automatically revokes them when closing previews.
- **Embedded or Compact Cards**: View PDFs as sleek compact cards or expand into embedded interactive viewers.

### 3. Drag & Drop Link Cards
- **Matching Visual Cards**: Links are displayed inside notes with the exact same elegant card styling as PDF attachments (domain favicon, title, hostname badge, copy URL button, and embedded iframe preview).
- **Universal Drag & Drop**: Drag and drop any link from your browser into your notes or the Resource Library.

### 4. Universal Smart Content Import Engine
- Intelligent format-detection and auto-cleaning pipeline.
- Handles content copied from **ChatGPT, Claude, Gemini, Notion, VS Code, GitHub, StackOverflow, Google Docs, and web articles**.
- Automatically converts tables, code blocks, lists, and LaTeX equations into native TipTap nodes.

### 5. Personal Resource Library & Web Clipper
- Bookmark and catalog research links, articles, and snippets.
- One-click active tab capture or right-click text selection clipping.
- Filter by collections, search, and export.

### 6. 100% Local-First Privacy & Multi-Device Sync
- Data is stored strictly on your machine in IndexedDB.
- Optional Google Drive cloud backup with conflict resolution.
- Optional file system directory sync as readable Markdown (`notes/*.md`).

---

## ⌨️ Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `Alt + N` | Open MemoDock quick popup anywhere in Chrome |
| `Ctrl + Shift + K` | Open MemoDock in a dedicated full-screen tab |
| `Ctrl + K` | Open Omnibar search across notes and resources |
| `Ctrl + N` | Create a new note |
| `F11` | Toggle Focus Mode |
| `Ctrl + F` | In-editor Find & Replace bar |

---

## 🧪 Verification & Integrity Tests

MemoDock includes an extensive test suite verifying:
- Chrome Manifest V3 declarations, OAuth configuration, and permissions
- Background Service Worker registration
- HTML container dimensions (enforcing 760×580 popup constraint)
- LaTeX mathematics recognition and currency protection
- TSV spreadsheet conversion and Markdown escape normalizer
- French educational content regression parsing

Run tests anytime:
```bash
npm test
```
All 74/74 tests pass with 0 errors.

---

## 📄 License

MIT License. Designed with privacy, minimalism, and focus.
