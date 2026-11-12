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
export async function getCurrentActiveTab(): Promise<{ url: string; title: string; favIconUrl?: string } | null> {
  if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        return {
          url: tab.url,
          title: tab.title || tab.url,
          favIconUrl: tab.favIconUrl,
        };
      }
    } catch (err) {
      console.warn('Could not query current tab:', err);
    }
  }
  return null;
}

export interface ExtractedUrlInfo {
  url: string;
  title: string;
  description: string;
  domain: string;
  favicon: string;
  type: ResourceType;
  collection: string;
  tags: string[];
  ogImage?: string;
}

/**
 * Capitalize first letters of words in a slug
 */
function titleCaseFromSlug(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/**
 * AUTOMATIC METADATA EXTRACTION PIPELINE
 * Fully extracts title, description, domain, favicon, collection, and tags
 * without requiring the user to type anything manually.
 */
export async function autoExtractUrlMetadata(inputUrl: string): Promise<ExtractedUrlInfo> {
  let cleanUrl = inputUrl.trim();
  if (!cleanUrl) {
    return {
      url: '',
      title: '',
      description: '',
      domain: '',
      favicon: '',
      type: 'website',
      collection: 'Documentation',
      tags: [],
    };
  }

  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = `https://${cleanUrl}`;
  }

  let domain = 'web';
  let pathname = '';
  try {
    const parsed = new URL(cleanUrl);
    domain = parsed.hostname.replace(/^www\./, '');
    pathname = parsed.pathname;
  } catch {
    // fallback
  }

  const favicon = getFaviconUrl(cleanUrl);
  const type = inferResourceType(cleanUrl);

  // Default collection inference based on type
  let collection = 'Documentation';
  if (type === 'github') collection = 'Development';
  else if (type === 'research') collection = 'AI & Research';
  else if (type === 'article') collection = 'Articles & Blogs';
  else if (type === 'youtube') collection = 'Media & Video';
  else if (type === 'pdf') collection = 'Books & Guides';

  let title = '';
  let description = '';
  let ogImage: string | undefined;
  const tags: string[] = [domain.split('.')[0] || 'web'];

  // 1. Check Chrome open tabs if extension environment
  try {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.query) {
      const tabs = await chrome.tabs.query({});
      const matchingTab = tabs.find((t) => t.url && t.url.toLowerCase() === cleanUrl.toLowerCase());
      if (matchingTab && matchingTab.title) {
        title = matchingTab.title;
        description = `Resource bookmarked from active browser tab (${domain})`;
      }
    }
  } catch {
    // ignore
  }

  // 2. Domain-Specific Intelligent Parsers
  // GitHub: github.com/:owner/:repo
  if (domain.includes('github.com') || domain.includes('gitlab.com')) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const owner = parts[0];
      const repo = parts[1];
      title = `${owner} / ${repo}`;
      description = `GitHub open source project: ${owner}/${repo}`;
      tags.push('github', 'repository', repo.toLowerCase());
      collection = 'Development';
    }
  }

  // arXiv: arxiv.org/abs/:id
  else if (domain.includes('arxiv.org')) {
    const parts = pathname.split('/').filter(Boolean);
    const arxivId = parts[parts.length - 1] || '';
    title = `arXiv Research Paper: ${arxivId}`;
    description = `Scientific research publication on arXiv (${arxivId})`;
    tags.push('arxiv', 'research', 'paper');
    collection = 'AI & Research';
  }

  // YouTube oEmbed: 100% open CORS API without credentials
  else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
    try {
      const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(cleanUrl)}&format=json`);
      if (oembedRes.ok) {
        const oembed = await oembedRes.json();
        title = oembed.title || title;
        description = oembed.author_name ? `Video by ${oembed.author_name} on YouTube` : 'YouTube video';
        ogImage = oembed.thumbnail_url;
        if (oembed.author_name) tags.push(oembed.author_name.toLowerCase().replace(/\s+/g, '-'));
        tags.push('video');
        collection = 'Media & Video';
      }
    } catch {
      // fallback
    }
  }

  // Wikipedia: wikipedia.org/wiki/:term
  else if (domain.includes('wikipedia.org')) {
    const parts = pathname.split('/').filter(Boolean);
    const rawTerm = parts[parts.length - 1] || '';
    const decodedTerm = decodeURIComponent(rawTerm).replace(/_/g, ' ');
    if (decodedTerm) {
      title = `${decodedTerm} - Wikipedia`;
      description = `Wikipedia reference article on ${decodedTerm}`;
      tags.push('wikipedia', 'reference');
      collection = 'Documentation';
    }
  }

  // Medium / Substack / Dev.to
  else if (domain.includes('dev.to') || domain.includes('medium.com') || domain.includes('substack.com')) {
    const parts = pathname.split('/').filter(Boolean);
    const slug = parts[parts.length - 1] || '';
    if (slug) {
      const cleanSlug = slug.replace(/-\w{6,}$/, ''); // remove hash id
      title = `${titleCaseFromSlug(cleanSlug)} - ${domain.split('.')[0]}`;
      description = `Article published on ${domain}`;
      tags.push('article', 'blog');
      collection = 'Articles & Blogs';
    }
  }

  // Documentation sites
  else if (domain.includes('docs.') || pathname.includes('/docs')) {
    const parts = pathname.split('/').filter(Boolean);
    const slug = parts[parts.length - 1] || 'documentation';
    title = `${titleCaseFromSlug(slug)} | ${domain}`;
    description = `Official technical documentation and API reference on ${domain}`;
    tags.push('docs', 'reference');
    collection = 'Documentation';
  }

  // 3. If title is still missing or generic, try Microlink free CORS endpoint
  if (!title || title.length === 0) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2800);
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(cleanUrl)}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'success' && json.data) {
          title = json.data.title || title;
          description = json.data.description || description;
          ogImage = json.data.image?.url || ogImage;
          if (json.data.publisher) tags.push(json.data.publisher.toLowerCase());
        }
      }
    } catch {
      // ignore
    }
  }

  // 4. Fallback slug parser if still empty
  if (!title) {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      const last = parts[parts.length - 1].replace(/\.[^/.]+$/, ''); // strip .html
      title = `${titleCaseFromSlug(last)} • ${domain}`;
    } else {
      title = `${titleCaseFromSlug(domain.split('.')[0])} Home`;
    }
  }

  if (!description) {
    description = `Saved reference bookmark from ${domain}`;
  }

  // Deduplicate and clean tags
  const uniqueTags = Array.from(new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean)));

  return {
    url: cleanUrl,
    title: title.trim(),
    description: description.trim(),
    domain,
    favicon,
    type,
    collection,
    tags: uniqueTags,
    ogImage,
  };
}

// Try fetching basic metadata via fetch with graceful fallback (backward-compatible)
export async function fetchUrlMetadata(url: string): Promise<{ title?: string; description?: string; ogImage?: string }> {
  const result = await autoExtractUrlMetadata(url);
  return {
    title: result.title,
    description: result.description,
    ogImage: result.ogImage,
  };
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

    // Auto-extract metadata if title or description or tags are missing
    let extracted: any = null;
    if (!params.title || !params.description || !params.tags || params.tags.length === 0) {
      try {
        extracted = await autoExtractUrlMetadata(formattedUrl);
      } catch (err) {
        console.warn('Auto extraction failed in resourceService.add:', err);
      }
    }

    const domain = extractDomain(formattedUrl);
    const title = params.title?.trim() || extracted?.title || domain;
    const type = inferResourceType(formattedUrl, title);
    const favicon = extracted?.favicon || getFaviconUrl(formattedUrl);
    const description = params.description?.trim() || extracted?.description || '';
    const collection = params.collection || extracted?.collection || 'Documentation';
    const tags = (params.tags && params.tags.length > 0) ? params.tags : (extracted?.tags || []);
    const ogImage = params.ogImage || extracted?.ogImage;

    const newResource: Resource = {
      id: `res-${now}-${Math.random().toString(36).substring(2, 7)}`,
      url: formattedUrl,
      title,
      description,
      domain,
      favicon,
      ogImage,
      type,
      collection,
      tags,
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

