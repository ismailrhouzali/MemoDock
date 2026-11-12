import React, { useState, useEffect } from 'react';
import {
  X,
  Link as LinkIcon,
  Globe,
  Sparkles,
  Bookmark,
  Tag as TagIcon,
  FileText,
  Laptop,
} from 'lucide-react';
import {
  resourceService,
  getCurrentActiveTab,
  fetchUrlMetadata,
  extractDomain,
} from '../../services/resourceService';
import { ResourceCollection } from '../../db/types';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  collections: ResourceCollection[];
  onAdded: () => void;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
  collections,
  onAdded,
}) => {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [collection, setCollection] = useState(collections[0]?.name || 'Documentation');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      setTitle('');
      setDescription('');
      setTags([]);
      setNotes('');
      if (collections.length > 0) {
        setCollection(collections[0].name);
      }
    }
  }, [isOpen, collections]);

  if (!isOpen) return null;

  const handleUseCurrentTab = async () => {
    setIsFetching(true);
    const activeTab = await getCurrentActiveTab();
    if (activeTab) {
      setUrl(activeTab.url);
      setTitle(activeTab.title);
      // Auto-extract domain
      const domain = extractDomain(activeTab.url);
      if (!description) {
        setDescription(`Bookmarked from ${domain}`);
      }
    }
    setIsFetching(false);
  };

  const handleFetchMetadata = async () => {
    if (!url.trim()) return;
    setIsFetching(true);
    const meta = await fetchUrlMetadata(url);
    if (meta.title && !title) setTitle(meta.title);
    if (meta.description && !description) setDescription(meta.description);
    setIsFetching(false);
  };

  const handleAddTag = () => {
    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsSaving(true);
    try {
      await resourceService.add({
        url: url.trim(),
        title: title.trim() || undefined,
        description: description.trim() || undefined,
        collection,
        tags,
        notes: notes.trim() || undefined,
      });
      onAdded();
      onClose();
    } catch (err) {
      console.error('Failed to save resource:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-float max-w-lg w-full overflow-hidden flex flex-col text-xs text-stone-800 dark:text-stone-200">

        {/* Modal Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center font-bold">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-stone-900 dark:text-stone-100">
                Add New Resource
              </h3>
              <p className="text-[11px] text-stone-400 dark:text-zinc-500">
                Bookmark articles, documentation, tools and research
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded-md transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* URL Input & Quick Actions */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700 dark:text-zinc-300">
                Target URL <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleUseCurrentTab}
                disabled={isFetching}
                className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
              >
                <Laptop className="w-3 h-3" />
                <span>Use Current Tab</span>
              </button>
            </div>
            <div className="relative flex items-center">
              <LinkIcon className="absolute left-3 w-4 h-4 text-stone-400" />
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={handleFetchMetadata}
                placeholder="https://github.com/... or https://arxiv.org/..."
                className="w-full pl-9 pr-20 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
              />
              <button
                type="button"
                onClick={handleFetchMetadata}
                disabled={isFetching || !url.trim()}
                className="absolute right-2 px-2 py-1 text-[10px] bg-stone-200/70 dark:bg-zinc-800 hover:bg-stone-300 rounded font-medium text-stone-700 dark:text-zinc-300 transition"
              >
                {isFetching ? 'Fetching...' : 'Fetch Info'}
              </button>
            </div>
          </div>

          {/* Title Input */}
          <div>
            <label className="font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
              Resource Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Descriptive title or page name"
              className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
            />
          </div>

          {/* Collection & Category */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                Collection
              </label>
              <select
                value={collection}
                onChange={(e) => setCollection(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
              >
                {collections.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Input */}
            <div>
              <label className="font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                Tags (Press Enter)
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="e.g. react, tutorial"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Active Tags */}
          {tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-1">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-[10px]"
                >
                  #{t}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(t)}
                    className="hover:text-red-500"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <label className="font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
              Summary / Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of why this resource is useful..."
              className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs"
            />
          </div>

          {/* Personal Notes / Annotations */}
          <div>
            <label className="font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
              Personal Notes & Key Takeaways
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add key insights, commands, citations or code snippets..."
              className="w-full px-3 py-2 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs font-mono"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-stone-200/80 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-800 text-stone-700 dark:text-zinc-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !url.trim()}
              className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-semibold shadow-sm transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

