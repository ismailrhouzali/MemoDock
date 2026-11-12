import { db } from '../db/db';
import { Resource, ResourceCollection, ResourceType } from '../db/types';

// Infer resource type from URL and title
export function inferResourceType(url: string, title?: string): ResourceType {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = (title || '').toLowerCase();

  if (lowerUrl.includes('github.com') || lowerUrl.includes('gitlab.com')) {
    return 'github';
  }
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('vimeo.com')) {
    return 'youtube';
  }
  if (lowerUrl.endsWith('.pdf') || lowerUrl.includes('.pdf?') || lowerTitle.includes('pdf')) {
    return 'pdf';
  }
  if (
    lowerUrl.includes('arxiv.org') ||
    lowerUrl.includes('pubmed') ||
    lowerUrl.includes('biorxiv.org') ||
    lowerUrl.includes('nature.com') ||
    lowerUrl.includes('science.org') ||
    lowerUrl.includes('ieee.org') ||
    lowerUrl.includes('acm.org')
  ) {
    return 'research';
  }
  if (
    lowerUrl.includes('docs.') ||
    lowerUrl.includes('/docs') ||
    lowerUrl.includes('developer.') ||
    lowerUrl.includes('notion.site') ||
    lowerUrl.includes('gitbook') ||
    lowerUrl.includes('readme.io')
  ) {
    return 'doc';
  }
  if (
    lowerUrl.includes('medium.com') ||
    lowerUrl.includes('dev.to') ||
    lowerUrl.includes('substack.com') ||
    lowerUrl.includes('/blog')
  ) {
    return 'article';
  }
  return 'website';
}

// Extract clean domain name
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.split('/')[0] || 'link';
  }
}

// Generate favicon URL
export function getFaviconUrl(url: string): string {
  const domain = extractDomain(url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
}

// Query current active tab in Chrome
export async function getCurrentActiveTab(): Promise<{ url: string; title: string } | null> {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        return {
          url: tab.url,
          title: tab.title || tab.url,
        };
      }
    } catch (err) {
      console.warn('Could not query current tab:', err);
    }
  }
  return null;
}

// Try fetching basic metadata via fetch with graceful fallback
export async function fetchUrlMetadata(url: string): Promise<{ title?: string; description?: string; ogImage?: string }> {
  try {
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(formattedUrl, {
      method: 'GET',
      signal: controller.signal,
      mode: 'cors',
    });
    clearTimeout(timeout);

    if (response.ok) {
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const title =
        doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
        doc.querySelector('title')?.textContent ||
        undefined;

      const description =
        doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
        doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
        undefined;

      const ogImage =
        doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
        undefined;

      return {
        title: title ? title.trim() : undefined,
        description: description ? description.trim() : undefined,
        ogImage,
      };
    }
  } catch {
    // CORS or network failure is expected on arbitrary origins in browser context
  }

  return {};
}

// Service CRUD operations
export const resourceService = {
  async getAll(): Promise<Resource[]> {
    try {
      if (!db.resources) return [];
      const all = await db.resources.toArray();
      return all
        .filter((r) => !r.isTrash)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } catch (err) {
      console.warn('Error reading resources from IndexedDB:', err);
      return [];
    }
  },

  async add(params: {
    url: string;
    title?: string;
    description?: string;
    collection?: string;
    tags?: string[];
    notes?: string;
    ogImage?: string;
  }): Promise<Resource> {
    const now = Date.now();
    let formattedUrl = (params.url || '').trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const domain = extractDomain(formattedUrl);
    const title = params.title?.trim() || domain;
    const type = inferResourceType(formattedUrl, title);
    const favicon = getFaviconUrl(formattedUrl);

    const newResource: Resource = {
      id: `res-${now}-${Math.random().toString(36).substring(2, 7)}`,
      url: formattedUrl,
      title,
      description: params.description?.trim() || '',
      domain,
      favicon,
      ogImage: params.ogImage,
      type,
      collection: params.collection || 'Documentation',
      tags: params.tags || [],
      notes: params.notes || '',
      isFavorite: false,
      isPinned: false,
      isArchived: false,
      isTrash: false,
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: null,
    };

    await db.resources.add(newResource);
    return newResource;
  },

  async update(id: string, updates: Partial<Resource>): Promise<void> {
    try {
      await db.resources.update(id, {
        ...updates,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to update resource:', err);
    }
  },

  async toggleFavorite(id: string, current: boolean): Promise<void> {
    try {
      await db.resources.update(id, {
        isFavorite: !current,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to toggle favorite:', err);
    }
  },

  async togglePin(id: string, current: boolean): Promise<void> {
    try {
      await db.resources.update(id, {
        isPinned: !current,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to toggle pin:', err);
    }
  },

  async moveToTrash(id: string): Promise<void> {
    try {
      await db.resources.update(id, {
        isTrash: true,
        updatedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to trash resource:', err);
    }
  },

  async deletePermanently(id: string): Promise<void> {
    try {
      await db.resources.delete(id);
    } catch (err) {
      console.warn('Failed to delete resource permanently:', err);
    }
  },

  async markOpened(id: string): Promise<void> {
    try {
      await db.resources.update(id, {
        lastOpenedAt: Date.now(),
      });
    } catch (err) {
      console.warn('Failed to mark opened:', err);
    }
  },

  // Collections
  async getCollections(): Promise<ResourceCollection[]> {
    try {
      if (!db.collections) return [];
      const cols = await db.collections.toArray();
      if (cols.length === 0) {
        return [
          { id: 'col-doc', name: 'Documentation', icon: 'BookOpen', color: '#2563eb', createdAt: Date.now() },
          { id: 'col-dev', name: 'Development', icon: 'Code', color: '#16a34a', createdAt: Date.now() },
          { id: 'col-ai', name: 'AI & Research', icon: 'Sparkles', color: '#9333ea', createdAt: Date.now() },
          { id: 'col-tutorials', name: 'Tutorials', icon: 'GraduationCap', color: '#d97706', createdAt: Date.now() },
          { id: 'col-tools', name: 'Tools', icon: 'Wrench', color: '#059669', createdAt: Date.now() },
          { id: 'col-articles', name: 'Articles', icon: 'FileText', color: '#64748b', createdAt: Date.now() },
        ];
      }
      return cols;
    } catch (err) {
      console.warn('Failed to get collections:', err);
      return [];
    }
  },

  async createCollection(name: string, color?: string, icon?: string): Promise<ResourceCollection> {
    const col: ResourceCollection = {
      id: `col-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim(),
      color: color || '#2563eb',
      icon: icon || 'Bookmark',
      createdAt: Date.now(),
    };
    try {
      await db.collections.add(col);
    } catch (err) {
      console.warn('Failed to add collection:', err);
    }
    return col;
  },

  async deleteCollection(id: string): Promise<void> {
    try {
      await db.collections.delete(id);
    } catch (err) {
      console.warn('Failed to delete collection:', err);
    }
  },
};

