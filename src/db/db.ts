import Dexie, { type Table } from 'dexie';
import {
  Note,
  Folder,
  Tag,
  Attachment,
  NoteVersion,
  NoteTemplate,
  ConflictRecord,
  AppSettings,
  Resource,
  ResourceCollection,
} from './types';

export class NotebookDB extends Dexie {
  notes!: Table<Note, string>;
  folders!: Table<Folder, string>;
  tags!: Table<Tag, string>;
  attachments!: Table<Attachment, string>;
  noteVersions!: Table<NoteVersion, string>;
  templates!: Table<NoteTemplate, string>;
  conflicts!: Table<ConflictRecord, string>;
  resources!: Table<Resource, string>;
  collections!: Table<ResourceCollection, string>;

  constructor() {
    super('NotebookDB');
    this.version(1).stores({
      notes: 'id, title, createdAt, updatedAt, folderId, *tags, isPinned, isFavorite, isArchived, isTrash',
      folders: 'id, name, createdAt, updatedAt',
      tags: 'id, &name',
    });

    // Version 2: Add attachments, version history, templates, conflicts
    this.version(2).stores({
      notes: 'id, title, createdAt, updatedAt, folderId, *tags, isPinned, isFavorite, isArchived, isTrash, *internalLinks, *backlinks',
      folders: 'id, name, createdAt, updatedAt',
      tags: 'id, &name',
      attachments: 'id, noteId, name, type, createdAt',
      noteVersions: 'id, noteId, createdAt',
      templates: 'id, title, category, isBuiltin',
      conflicts: 'id, noteId, detectedAt, resolved',
    });

    // Version 3: Resource Library & Smart Bookmarks
    this.version(3).stores({
      notes: 'id, title, createdAt, updatedAt, folderId, *tags, isPinned, isFavorite, isArchived, isTrash, *internalLinks, *backlinks',
      folders: 'id, name, createdAt, updatedAt',
      tags: 'id, &name',
      attachments: 'id, noteId, name, type, createdAt',
      noteVersions: 'id, noteId, createdAt',
      templates: 'id, title, category, isBuiltin',
      conflicts: 'id, noteId, detectedAt, resolved',
      resources: 'id, url, title, domain, type, collection, *tags, isPinned, isFavorite, isArchived, isTrash, createdAt, lastOpenedAt',
      collections: 'id, name, createdAt',
    });
  }
}

export const db = new NotebookDB();

// Default settings for NoteBook V2
export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  editorWidth: 'normal',
  fontFamily: 'sans',
  fontSize: 'md',
  autoSaveDelay: 600,
  showWordCount: true,
  showLineNumbers: false,
  spellCheck: true,
  aiProvider: 'gemini',
  aiApiKey: '',
  aiModel: 'gemini-1.5-flash',

  // Note List Display Settings
  noteListMode: 'detailed',

  // Sidebar Visibility Settings
  sidebarVisibility: {
    showAll: true,
    showFavorites: true,
    showRecents: true,
    showArchived: true,
    showTrash: true,
    showFolders: true,
    showTags: true,
    foldersExpanded: true,
    tagsExpanded: true,
    mode: 'full',
  },

  // Editor Minimal & Focus Settings
  editorLayout: {
    mode: 'standard',
    showToolbar: true,
    showWordCount: true,
    showCharCount: true,
    showReadingTime: true,
    showModifiedDate: true,
    showBreadcrumbs: true,
    showTableOfContents: true,
    tocCollapsed: false,
    tocLevel: 'h3',
  },

  // Storage Mode
  storageMode: 'browser',

  // Google Drive Settings
  googleDrive: {
    isConnected: false,
    userEmail: null,
    folderName: 'NoteBook Data',
    folderId: null,
    autoSync: true,
    syncIntervalMinutes: 5,
    lastSyncTimestamp: null,
    syncStatus: 'idle',
    lastError: null,
  },

  // Local Storage Folder Settings
  localStorageFolder: {
    folderName: null,
    permissionStatus: 'prompt',
    lastSyncTimestamp: null,
    syncStatus: 'idle',
  },
};

// Settings storage helper
export const settingsStorage = {
  get: async (): Promise<AppSettings> => {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        const result = await chrome.storage.local.get('notebook_settings');
        return {
          ...DEFAULT_SETTINGS,
          ...(result.notebook_settings || {}),
          sidebarVisibility: {
            ...DEFAULT_SETTINGS.sidebarVisibility,
            ...((result.notebook_settings && result.notebook_settings.sidebarVisibility) || {}),
          },
          editorLayout: {
            ...DEFAULT_SETTINGS.editorLayout,
            ...((result.notebook_settings && result.notebook_settings.editorLayout) || {}),
          },
          googleDrive: {
            ...DEFAULT_SETTINGS.googleDrive,
            ...((result.notebook_settings && result.notebook_settings.googleDrive) || {}),
          },
          localStorageFolder: {
            ...DEFAULT_SETTINGS.localStorageFolder,
            ...((result.notebook_settings && result.notebook_settings.localStorageFolder) || {}),
          },
        };
      }
    } catch {
      // Chrome storage not available
    }
    try {
      const local = localStorage.getItem('notebook_settings');
      if (local) {
        const parsed = JSON.parse(local);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          sidebarVisibility: {
            ...DEFAULT_SETTINGS.sidebarVisibility,
            ...(parsed.sidebarVisibility || {}),
          },
          editorLayout: {
            ...DEFAULT_SETTINGS.editorLayout,
            ...(parsed.editorLayout || {}),
          },
          googleDrive: {
            ...DEFAULT_SETTINGS.googleDrive,
            ...(parsed.googleDrive || {}),
          },
          localStorageFolder: {
            ...DEFAULT_SETTINGS.localStorageFolder,
            ...(parsed.localStorageFolder || {}),
          },
        };
      }
    } catch {
      // LocalStorage error fallback
    }
    return DEFAULT_SETTINGS;
  },

  set: async (newSettings: Partial<AppSettings>): Promise<AppSettings> => {
    const current = await settingsStorage.get();
    const merged: AppSettings = {
      ...current,
      ...newSettings,
      sidebarVisibility: {
        ...current.sidebarVisibility,
        ...(newSettings.sidebarVisibility || {}),
      },
      editorLayout: {
        ...current.editorLayout,
        ...(newSettings.editorLayout || {}),
      },
      googleDrive: {
        ...current.googleDrive,
        ...(newSettings.googleDrive || {}),
      },
      localStorageFolder: {
        ...current.localStorageFolder,
        ...(newSettings.localStorageFolder || {}),
      },
    };
    try {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.set({ notebook_settings: merged });
      }
    } catch {
      // ignore
    }
    try {
      localStorage.setItem('notebook_settings', JSON.stringify(merged));
    } catch {
      // ignore
    }
    return merged;
  },
};

// Built-in Templates
export const BUILTIN_TEMPLATES: NoteTemplate[] = [
  {
    id: 'template-meeting',
    title: 'Meeting Notes',
    description: 'Structured agenda, attendees, discussion points and action items.',
    category: 'Work',
    isBuiltin: true,
    createdAt: Date.now(),
    content: `
      <h2>Meeting: [Subject / Project]</h2>
      <p><strong>Date & Time:</strong> [e.g. Nov 12, 2026 - 10:00 AM]</p>
      <p><strong>Attendees:</strong> [Name 1, Name 2, Name 3]</p>

      <h3>1. Objectives & Agenda</h3>
      <ul>
        <li>Review sprint deliverables</li>
        <li>Discuss architectural blockers</li>
        <li>Align on next milestones</li>
      </ul>

      <h3>2. Key Discussion Points</h3>
      <p>Summarize major decisions and points raised during the discussion.</p>

      <h3>3. Action Items</h3>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Complete backend migration test suite (@Alice)</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Update documentation and share slides (@Bob)</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Schedule follow-up review for Friday</p></div></li>
      </ul>
    `,
  },
  {
    id: 'template-daily',
    title: 'Daily Journal & Standup',
    description: 'Focus on today\'s top priorities, progress, and reflections.',
    category: 'General',
    isBuiltin: true,
    createdAt: Date.now(),
    content: `
      <h2>Daily Log — [Date]</h2>
      <blockquote><p><em>"Small daily improvements over time lead to stunning results."</em></p></blockquote>

      <h3>🎯 Top 3 Priorities for Today</h3>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Priority 1: Deep work session on core feature</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Priority 2: Review pending pull requests</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Priority 3: 30 minutes reading / research</p></div></li>
      </ul>

      <h3>Notes & Discoveries</h3>
      <p>Capture thoughts, learnings, and links throughout the day.</p>

      <h3>Evening Reflection</h3>
      <p>What went well today? What could be improved tomorrow?</p>
    `,
  },
  {
    id: 'template-project',
    title: 'Project Technical Specification',
    description: 'Architecture diagram, functional scope, tech stack and rollout plan.',
    category: 'Engineering',
    isBuiltin: true,
    createdAt: Date.now(),
    content: `
      <h2>Project: [System Name]</h2>
      <p><strong>Status:</strong> In Progress | <strong>Owner:</strong> [Your Name]</p>

      <h3>1. Executive Summary</h3>
      <p>Provide a 2-3 sentence overview of the problem being solved and the desired outcome.</p>

      <h3>2. Architecture Flow</h3>
      <div data-type="mermaid-block" data-code="graph TD\n  Client[Web Client] --> Gateway[API Gateway]\n  Gateway --> Service[Core Service]\n  Service --> DB[(IndexedDB)]"></div>

      <h3>3. Technical Specifications</h3>
      <table>
        <tbody>
          <tr><th>Component</th><th>Technology</th><th>Rationale</th></tr>
          <tr><td>Frontend</td><td>React + TypeScript</td><td>Type safety and performance</td></tr>
          <tr><td>Storage</td><td>IndexedDB / Dexie</td><td>Local-first privacy and speed</td></tr>
          <tr><td>Math Engine</td><td>KaTeX</td><td>Zero-dependency math rendering</td></tr>
        </tbody>
      </table>

      <h3>4. Milestones</h3>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Prototype verification</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Integration testing</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Production release</p></div></li>
      </ul>
    `,
  },
  {
    id: 'template-research',
    title: 'Research & Study Notes',
    description: 'Literature review, formulas, mathematical derivations, and citations.',
    category: 'Study',
    isBuiltin: true,
    createdAt: Date.now(),
    content: `
      <h2>Study Topic: [Title]</h2>
      <p><strong>Source / Paper:</strong> [Author, Year, DOI or URL]</p>

      <h3>1. Core Hypotheses & Theorems</h3>
      <p>Explain the fundamental theorems or principles examined in this paper.</p>
      <div data-type="math-block" data-latex="\\mathcal{L}(\\theta) = - \\sum_{i=1}^{N} \\log P(y_i \\mid x_i; \\theta)"></div>

      <h3>2. Key Takeaways</h3>
      <ul>
        <li>Takeaway 1</li>
        <li>Takeaway 2</li>
        <li>Takeaway 3</li>
      </ul>

      <h3>3. Personal Insights & Questions</h3>
      <p>What questions remain open? How does this connect to our existing projects?</p>
    `,
  },
  {
    id: 'template-blank',
    title: 'Blank Document',
    description: 'Clean slate for distraction-free writing.',
    category: 'General',
    isBuiltin: true,
    createdAt: Date.now(),
    content: `<p></p>`,
  },
];

// Seed initial database
export async function seedInitialDataIfNeeded(): Promise<void> {
  const now = Date.now();

  // Seed default collections if needed
  const colCount = await db.collections.count();
  if (colCount === 0) {
    const defaultCollections: ResourceCollection[] = [
      { id: 'col-doc', name: 'Documentation', icon: 'BookOpen', color: '#2563eb', createdAt: now },
      { id: 'col-dev', name: 'Development', icon: 'Code', color: '#16a34a', createdAt: now },
      { id: 'col-ai', name: 'AI & Research', icon: 'Sparkles', color: '#9333ea', createdAt: now },
      { id: 'col-tutorials', name: 'Tutorials', icon: 'GraduationCap', color: '#d97706', createdAt: now },
      { id: 'col-tools', name: 'Tools', icon: 'Wrench', color: '#059669', createdAt: now },
      { id: 'col-articles', name: 'Articles', icon: 'FileText', color: '#64748b', createdAt: now },
    ];
    await db.collections.bulkAdd(defaultCollections);
  }

  // Seed default resources if needed
  const resCount = await db.resources.count();
  if (resCount === 0) {
    const defaultResources: Resource[] = [
      {
        id: 'res-starter-github',
        url: 'https://github.com/ismailrhouzali/MemoDock',
        title: 'MemoDock GitHub Repository',
        description: 'Official open-source repository for MemoDock personal knowledge workspace.',
        domain: 'github.com',
        favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64',
        type: 'github',
        collection: 'Development',
        tags: ['OpenSource', 'Extension'],
        notes: 'Official project repository with release packages and documentation.',
        isFavorite: true,
        isPinned: true,
        isArchived: false,
        isTrash: false,
        createdAt: now,
        updatedAt: now,
        lastOpenedAt: null,
      },
      {
        id: 'res-starter-doc',
        url: 'https://developer.mozilla.org/en-US/docs/Web',
        title: 'MDN Web Docs',
        description: 'Comprehensive documentation and technical references for developers.',
        domain: 'developer.mozilla.org',
        favicon: 'https://www.google.com/s2/favicons?domain=developer.mozilla.org&sz=64',
        type: 'doc',
        collection: 'Documentation',
        tags: ['WebDev', 'Reference'],
        notes: 'Primary reference for JavaScript, HTML and Web APIs.',
        isFavorite: false,
        isPinned: false,
        isArchived: false,
        isTrash: false,
        createdAt: now - 3600000,
        updatedAt: now - 3600000,
        lastOpenedAt: null,
      },
      {
        id: 'res-starter-arxiv',
        url: 'https://arxiv.org',
        title: 'arXiv.org e-Print Archive',
        description: 'Open-access scholarly repository for academic papers in computer science, physics and mathematics.',
        domain: 'arxiv.org',
        favicon: 'https://www.google.com/s2/favicons?domain=arxiv.org&sz=64',
        type: 'research',
        collection: 'AI & Research',
        tags: ['Papers', 'Research'],
        notes: 'Find preprints and breakthrough academic research.',
        isFavorite: false,
        isPinned: false,
        isArchived: false,
        isTrash: false,
        createdAt: now - 7200000,
        updatedAt: now - 7200000,
        lastOpenedAt: null,
      },
    ];
    await db.resources.bulkAdd(defaultResources);
  }

  // Seed templates if needed
  const templateCount = await db.templates.count();
  if (templateCount === 0) {
    await db.templates.bulkAdd(BUILTIN_TEMPLATES);
  }

  const count = await db.notes.count();
  if (count > 0) return;

  // Create sample folder
  const sampleFolder: Folder = {
    id: 'folder-welcome',
    name: 'Getting Started',
    color: '#d97706',
    createdAt: now,
    updatedAt: now,
  };
  await db.folders.add(sampleFolder);

  // Create initial tags
  const initialTags: Tag[] = [
    { id: 'tag-1', name: 'Guide', color: '#2563eb' },
    { id: 'tag-2', name: 'Features', color: '#16a34a' },
    { id: 'tag-3', name: 'Ideas', color: '#9333ea' },
  ];
  await db.tags.bulkAdd(initialTags);

  // Create rich welcome note
  const welcomeNote: Note = {
    id: 'welcome-to-notebook',
    title: 'Welcome to NoteBook ✨',
    folderId: sampleFolder.id,
    tags: ['Guide', 'Features'],
    isPinned: true,
    isFavorite: true,
    isArchived: false,
    isTrash: false,
    createdAt: now,
    updatedAt: now,
    plainText: `Welcome to NoteBook V2! A minimalist, distraction-free writing environment combining simplicity with powerful features. All your notes are saved locally in your browser storage with zero tracking.`,
    content: `
      <h2>Welcome to NoteBook V2</h2>
      <p>NoteBook blends the <strong>distraction-free, paper-like minimalism</strong> of modern text editors with <strong>advanced note-taking capabilities</strong>. All your notes are stored 100% locally on your machine using IndexedDB for maximum privacy, lightning speed, and offline capability.</p>
      
      <h3>Key Highlights</h3>
      <ul data-type="taskList">
        <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Local-first privacy: no account required, completely offline</p></div></li>
        <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Smart Markdown copy & paste from ChatGPT, GitHub & VS Code</p></div></li>
        <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>LaTeX mathematical equations and Mermaid diagrams</p></div></li>
        <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>PDF attachments & embedded document viewer</p></div></li>
        <li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Right-hand Table of Contents with active heading tracking</p></div></li>
        <li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Configure Custom Local Folder or Google Drive Sync in Settings</p></div></li>
      </ul>

      <h3>Mathematics & LaTeX Equations</h3>
      <p>Render inline formulas like $E = mc^2$ or full equations effortlessly:</p>
      <div data-type="math-block" data-latex="\\int_{0}^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}"></div>

      <h3>Interactive Tables</h3>
      <table>
        <tbody>
          <tr>
            <th>Feature</th>
            <th>Description</th>
            <th>Status</th>
          </tr>
          <tr>
            <td>Rich Text & Markdown</td>
            <td>Full TipTap formatting, headings, lists & code</td>
            <td>Active</td>
          </tr>
          <tr>
            <td>PDF Attachments</td>
            <td>Upload and preview PDF documents inside notes</td>
            <td>Active</td>
          </tr>
          <tr>
            <td>Storage & Sync</td>
            <td>IndexedDB, Custom Folder, Google Drive</td>
            <td>Configurable</td>
          </tr>
        </tbody>
      </table>

      <h3>Mermaid Diagram Support</h3>
      <p>Create visual flowcharts and architecture diagrams with Mermaid code blocks:</p>
      <div data-type="mermaid-block" data-code="graph LR\n  A[Capture Idea] --> B(Organize with Tags)\n  B --> C{Review}\n  C -->|Export| D[Markdown / PDF]\n  C -->|Archive| E[Vault]"></div>

      <h3>Code Syntax Highlighting</h3>
      <pre><code>// Safe, local-first storage with Dexie
const notes = await db.notes
  .where('isTrash')
  .equals(0)
  .sortBy('updatedAt');</code></pre>

      <blockquote>
        <p><em>"Simplicity is about subtracting the obvious and adding the meaningful."</em></p>
      </blockquote>
    `
  };

  await db.notes.add(welcomeNote);
}
