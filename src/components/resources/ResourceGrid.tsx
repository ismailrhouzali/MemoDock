import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Bookmark,
  LayoutGrid,
  List,
  Columns,
  Laptop,
  Sparkles,
  ExternalLink,
  Filter,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import { Resource, ResourceCollection, ResourceType } from '../../db/types';
import { resourceService, getCurrentActiveTab } from '../../services/resourceService';
import { ResourceCard } from './ResourceCard';
import { AddResourceModal } from './AddResourceModal';
import { ResourceDetailsModal } from './ResourceDetailsModal';

export const ResourceGrid: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [collections, setCollections] = useState<ResourceCollection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'visual' | 'compact' | 'list'>('visual');
  const [sortField, setSortField] = useState<'createdAt' | 'title' | 'lastOpenedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const loadData = async () => {
    const res = await resourceService.getAll();
    const cols = await resourceService.getCollections();
    setResources(res);
    setCollections(cols);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveCurrentTab = async () => {
    const tab = await getCurrentActiveTab();
    if (tab) {
      await resourceService.add({
        url: tab.url,
        title: tab.title,
        collection: 'Documentation',
      });
      loadData();
    } else {
      setIsAddModalOpen(true);
    }
  };

  const handleOpenLink = (resource: Resource) => {
    resourceService.markOpened(resource.id);
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleToggleFavorite = async (id: string, current: boolean) => {
    await resourceService.toggleFavorite(id, current);
    loadData();
  };

  const handleTogglePin = async (id: string, current: boolean) => {
    await resourceService.togglePin(id, current);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Move resource to trash?')) {
      await resourceService.moveToTrash(id);
      loadData();
    }
  };

  // Drag and drop link capture
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const droppedUrl =
      e.dataTransfer.getData('text/uri-list') ||
      e.dataTransfer.getData('text/plain') ||
      '';
    const cleanUrl = droppedUrl.trim();
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      const meta = await resourceService.add({
        url: cleanUrl,
        collection: selectedCollection !== 'all' ? selectedCollection : 'Documentation',
      });
      loadData();
    }
  };

  // Filtered and sorted resources
  const filteredResources = useMemo(() => {
    return resources
      .filter((r) => {
        if (selectedCollection !== 'all' && r.collection !== selectedCollection) {
          return false;
        }
        if (selectedType !== 'all' && r.type !== selectedType) {
          return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = (r.title || '').toLowerCase().includes(q);
          const matchUrl = (r.url || '').toLowerCase().includes(q);
          const matchDesc = (r.description || '').toLowerCase().includes(q);
          const matchTags = r.tags && Array.isArray(r.tags) ? r.tags.some((t) => (t || '').toLowerCase().includes(q)) : false;
          if (!matchTitle && !matchUrl && !matchDesc && !matchTags) return false;
        }
        return true;
      })
      .sort((a, b) => {
        // Pinned always on top
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        if (sortField === 'title') {
          return sortOrder === 'asc'
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title);
        }
        if (sortField === 'lastOpenedAt') {
          const aTime = a.lastOpenedAt || 0;
          const bTime = b.lastOpenedAt || 0;
          return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
        }
        return sortOrder === 'asc' ? a.createdAt - b.createdAt : b.createdAt - a.createdAt;
      });
  }, [resources, selectedCollection, selectedType, searchQuery, sortField, sortOrder]);

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="flex-1 flex flex-col h-full overflow-hidden bg-stone-50/50 dark:bg-obsidian-950 text-stone-800 dark:text-stone-200"
    >

      {/* Top Header Bar */}
      <div className="p-4 border-b border-stone-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md flex flex-col md:flex-row md:items-center justify-between gap-3 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm">
            <Bookmark className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span>Resource Library</span>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-xs font-medium text-stone-500 dark:text-zinc-400">
                {resources.length} saved
              </span>
            </h2>
            <p className="text-[11px] text-stone-400 dark:text-zinc-500">
              Personal bookmark & knowledge reference repository
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSaveCurrentTab}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-stone-50 dark:hover:bg-zinc-800 text-xs font-medium text-stone-700 dark:text-zinc-300 shadow-sm transition active:scale-95"
            title="Save current active browser tab"
          >
            <Laptop className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Save Active Tab</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold shadow-sm transition active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Resource</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Ribbon */}
      <div className="px-4 py-2.5 border-b border-stone-200/60 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 text-xs flex-shrink-0">

        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources by title, domain or tag..."
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 placeholder-stone-400 text-xs focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {/* View Switcher & Type Filter */}
        <div className="flex items-center gap-2">
          {/* Type dropdown */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-2.5 py-1 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md text-[11px] text-stone-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="github">GitHub</option>
            <option value="youtube">YouTube</option>
            <option value="research">Research / Papers</option>
            <option value="doc">Documentation</option>
            <option value="article">Articles</option>
            <option value="website">Websites</option>
          </select>

          {/* Sort dropdown */}
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="px-2.5 py-1 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-md text-[11px] text-stone-700 dark:text-zinc-300 focus:outline-none"
          >
            <option value="createdAt">Newest First</option>
            <option value="title">Title A-Z</option>
            <option value="lastOpenedAt">Recently Opened</option>
          </select>

          {/* View mode toggle */}
          <div className="flex items-center border border-stone-200 dark:border-zinc-800 rounded-md p-0.5 bg-stone-50 dark:bg-zinc-950">
            <button
              type="button"
              onClick={() => setViewMode('visual')}
              className={`p-1 rounded ${viewMode === 'visual' ? 'bg-white dark:bg-zinc-800 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-400'}`}
              title="Visual Cards"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('compact')}
              className={`p-1 rounded ${viewMode === 'compact' ? 'bg-white dark:bg-zinc-800 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-400'}`}
              title="Compact Cards"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded ${viewMode === 'list' ? 'bg-white dark:bg-zinc-800 shadow-sm text-stone-900 dark:text-stone-100' : 'text-stone-400'}`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Collection Pills Bar */}
      <div className="px-4 py-2 border-b border-stone-200/50 dark:border-zinc-800/60 bg-stone-100/50 dark:bg-zinc-900/40 flex items-center gap-1.5 overflow-x-auto select-none text-xs flex-shrink-0">
        <button
          type="button"
          onClick={() => setSelectedCollection('all')}
          className={`px-3 py-1 rounded-full text-[11px] font-medium transition ${selectedCollection === 'all'
              ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-sm'
              : 'bg-white dark:bg-zinc-800/80 text-stone-600 dark:text-zinc-400 hover:bg-stone-200/60'
            }`}
        >
          All Collections ({resources.length})
        </button>
        {collections.map((col) => {
          const count = resources.filter((r) => r.collection === col.name).length;
          return (
            <button
              key={col.id}
              type="button"
              onClick={() => setSelectedCollection(col.name)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition whitespace-nowrap ${selectedCollection === col.name
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-white dark:bg-zinc-800/80 text-stone-600 dark:text-zinc-400 hover:bg-stone-200/60'
                }`}
            >
              {col.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Main Grid Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {filteredResources.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-stone-400 dark:text-zinc-500">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-zinc-900 flex items-center justify-center mb-3">
              <Bookmark className="w-6 h-6 text-stone-400" />
            </div>
            <h3 className="font-semibold text-stone-700 dark:text-zinc-300 text-sm mb-1">
              {searchQuery ? 'No matching resources found' : 'No resources in this collection yet'}
            </h3>
            <p className="text-xs max-w-sm mb-4">
              {searchQuery
                ? 'Try adjusting your search terms or filters.'
                : 'Bookmark valuable documentation, GitHub repos, articles, and research with 1 click.'}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveCurrentTab}
                className="px-3.5 py-1.5 rounded-lg border border-stone-300 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 text-xs font-medium text-stone-700 dark:text-zinc-300 transition"
              >
                Save Current Browser Tab
              </button>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 text-xs font-semibold transition"
              >
                Add Custom Resource
              </button>
            </div>
          </div>
        ) : (
          <div
            className={
              viewMode === 'visual'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                : viewMode === 'compact'
                  ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
                  : 'flex flex-col space-y-2'
            }
          >
            {filteredResources.map((res) => (
              <ResourceCard
                key={res.id}
                resource={res}
                viewMode={viewMode}
                onOpen={handleOpenLink}
                onSelect={(r) => setSelectedResource(r)}
                onToggleFavorite={handleToggleFavorite}
                onTogglePin={handleTogglePin}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddResourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        collections={collections}
        onAdded={loadData}
      />

      <ResourceDetailsModal
        resource={selectedResource}
        collections={collections}
        onClose={() => setSelectedResource(null)}
        onUpdated={loadData}
        onDeleted={loadData}
      />
    </div>
  );
};

