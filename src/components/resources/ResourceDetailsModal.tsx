import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Copy,
  Star,
  Pin,
  Trash2,
  Bookmark,
  Calendar,
  Globe,
  Tag as TagIcon,
  Check,
  Edit2,
  Save,
} from 'lucide-react';
import { Resource, ResourceCollection } from '../../db/types';
import { resourceService } from '../../services/resourceService';

interface ResourceDetailsModalProps {
  resource: Resource | null;
  collections: ResourceCollection[];
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export const ResourceDetailsModal: React.FC<ResourceDetailsModalProps> = ({
  resource,
  collections,
  onClose,
  onUpdated,
  onDeleted,
}) => {
  if (!resource) return null;

  const [title, setTitle] = useState(resource.title);
  const [description, setDescription] = useState(resource.description);
  const [collection, setCollection] = useState(resource.collection);
  const [notes, setNotes] = useState(resource.notes || '');
  const [isEditing, setIsEditing] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(resource.url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleOpen = () => {
    resourceService.markOpened(resource.id);
    window.open(resource.url, '_blank', 'noopener,noreferrer');
  };

  const handleSave = async () => {
    await resourceService.update(resource.id, {
      title: title.trim() || resource.title,
      description: description.trim(),
      collection,
      notes: notes.trim(),
    });
    setIsEditing(false);
    onUpdated();
  };

  const handleDelete = async () => {
    if (window.confirm('Delete this resource?')) {
      await resourceService.deletePermanently(resource.id);
      onDeleted();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-2xl shadow-float max-w-xl w-full overflow-hidden flex flex-col text-xs text-stone-800 dark:text-stone-200">
        
        {/* Header */}
        <div className="p-4 border-b border-stone-200/80 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={resource.favicon}
              alt=""
              className="w-4 h-4 rounded-sm flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="font-mono text-[11px] text-stone-400 dark:text-zinc-500 uppercase">
              {resource.domain}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded-md transition"
              title="Copy link"
            >
              {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={handleOpen}
              className="p-1.5 text-stone-400 hover:text-amber-600 rounded-md transition"
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="p-1.5 text-stone-400 hover:text-red-500 rounded-md transition"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <div className="h-4 w-px bg-stone-200 dark:bg-zinc-800 mx-1" />
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded-md transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Collection
                </label>
                <select
                  value={collection}
                  onChange={(e) => setCollection(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 text-xs"
                >
                  {collections.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 text-xs"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 dark:text-zinc-300 block mb-1">
                  Personal Notes & Takeaways
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-stone-50 dark:bg-zinc-950 border border-stone-200 dark:border-zinc-800 rounded-lg text-stone-900 dark:text-stone-100 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 rounded-md border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center gap-1"
                >
                  <Save className="w-3 h-3" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {resource.title}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded transition flex-shrink-0"
                    title="Edit details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline break-all block mt-1"
                >
                  {resource.url}
                </a>
              </div>

              {resource.description && (
                <div className="p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200/60 dark:border-zinc-800/80 rounded-lg text-stone-600 dark:text-zinc-300 leading-relaxed">
                  {resource.description}
                </div>
              )}

              {/* Tags & Collection */}
              <div className="flex items-center flex-wrap gap-2 text-[11px]">
                <span className="px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 font-semibold text-stone-700 dark:text-zinc-300">
                  {resource.collection}
                </span>
                {resource.tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-full bg-amber-100/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300"
                  >
                    #{t}
                  </span>
                ))}
              </div>

              {/* Personal Notes */}
              <div>
                <h4 className="font-semibold text-stone-500 dark:text-zinc-400 uppercase tracking-wider text-[10px] mb-1.5">
                  Personal Notes & Key Takeaways
                </h4>
                {resource.notes ? (
                  <div className="p-3 bg-stone-50 dark:bg-zinc-950 border border-stone-200/60 dark:border-zinc-800/80 rounded-lg text-stone-800 dark:text-stone-200 font-mono text-[11px] whitespace-pre-wrap">
                    {resource.notes}
                  </div>
                ) : (
                  <p className="text-stone-400 italic text-[11px]">
                    No personal notes added yet. Click edit to add insights or code.
                  </p>
                )}
              </div>

              {/* Meta information */}
              <div className="pt-2 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between text-[10px] text-stone-400 dark:text-zinc-500">
                <span>Created {new Date(resource.createdAt).toLocaleDateString()}</span>
                {resource.lastOpenedAt && (
                  <span>Last opened {new Date(resource.lastOpenedAt).toLocaleDateString()}</span>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stone-200/80 dark:border-zinc-800 flex items-center justify-between bg-stone-50/50 dark:bg-zinc-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-900"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleOpen}
            className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 font-medium flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open Website</span>
          </button>
        </div>
      </div>
    </div>
  );
};

