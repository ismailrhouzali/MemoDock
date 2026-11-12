import React from 'react';
import {
  ExternalLink,
  Star,
  Pin,
  Trash2,
  Copy,
  Tag as TagIcon,
  Globe,
  Youtube,
  Github,
  FileText,
  GraduationCap,
  Bookmark,
  MoreVertical,
} from 'lucide-react';
import { Resource, ResourceType } from '../../db/types';

interface ResourceCardProps {
  resource: Resource;
  viewMode: 'visual' | 'compact' | 'list';
  onOpen: (resource: Resource) => void;
  onSelect: (resource: Resource) => void;
  onToggleFavorite: (id: string, current: boolean) => void;
  onTogglePin: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  viewMode,
  onOpen,
  onSelect,
  onToggleFavorite,
  onTogglePin,
  onDelete,
}) => {
  const handleCopyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(resource.url);
  };

  const getTypeIcon = (type: ResourceType) => {
    switch (type) {
      case 'github':
        return <Github className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />;
      case 'youtube':
        return <Youtube className="w-3.5 h-3.5 text-red-500" />;
      case 'pdf':
        return <FileText className="w-3.5 h-3.5 text-amber-600" />;
      case 'research':
        return <GraduationCap className="w-3.5 h-3.5 text-purple-600" />;
      default:
        return <Globe className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  // List View Mode
  if (viewMode === 'list') {
    return (
      <div
        onClick={() => onSelect(resource)}
        className="group flex items-center justify-between p-3 bg-white dark:bg-zinc-900/80 border border-stone-200/80 dark:border-zinc-800 rounded-lg hover:border-amber-400 dark:hover:border-amber-600/50 hover:shadow-subtle transition cursor-pointer text-xs"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
          <img
            src={resource.favicon}
            alt=""
            className="w-4 h-4 rounded-sm flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-stone-900 dark:text-stone-100 truncate hover:text-amber-600 transition">
                {resource.title}
              </h4>
              {resource.isPinned && (
                <Pin className="w-3 h-3 text-amber-600 fill-amber-600 flex-shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-stone-400 dark:text-zinc-500 truncate">
              {resource.domain} {resource.description ? `· ${resource.description}` : ''}
            </p>
          </div>
        </div>

        {/* Collection & Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-[10px] text-stone-600 dark:text-zinc-400 font-medium">
            {resource.collection}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(resource.id, resource.isFavorite);
            }}
            className={`p-1.5 rounded hover:bg-stone-100 dark:hover:bg-zinc-800 transition ${resource.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-stone-400'
              }`}
            title="Favorite"
          >
            <Star className={`w-3.5 h-3.5 ${resource.isFavorite ? 'fill-current' : ''}`} />
          </button>
          <button
            type="button"
            onClick={handleCopyLink}
            className="p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded transition"
            title="Copy URL"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(resource);
            }}
            className="p-1.5 text-stone-400 hover:text-amber-600 hover:bg-stone-100 dark:hover:bg-zinc-800 rounded transition"
            title="Open Link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Compact View Mode
  if (viewMode === 'compact') {
    return (
      <div
        onClick={() => onSelect(resource)}
        className="group relative flex flex-col p-3 bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-lg hover:border-amber-400 dark:hover:border-amber-600/50 hover:shadow-subtle transition cursor-pointer text-xs"
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={resource.favicon}
              alt=""
              className="w-4 h-4 rounded-sm flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <span className="text-[11px] font-medium text-stone-500 dark:text-zinc-400 truncate">
              {resource.domain}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(resource.id, resource.isFavorite);
              }}
              className={`p-1 rounded hover:bg-stone-100 dark:hover:bg-zinc-800 transition ${resource.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-stone-300 dark:text-zinc-600'
                }`}
            >
              <Star className={`w-3.5 h-3.5 ${resource.isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        <h4 className="font-semibold text-stone-900 dark:text-stone-100 line-clamp-1 group-hover:text-amber-600 transition mb-1">
          {resource.title}
        </h4>

        {resource.description && (
          <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2 mb-3">
            {resource.description}
          </p>
        )}

        <div className="mt-auto pt-2 border-t border-stone-100 dark:border-zinc-800/80 flex items-center justify-between text-[10px]">
          <span className="px-2 py-0.5 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400 font-medium">
            {resource.collection}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
              title="Copy URL"
            >
              <Copy className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(resource);
              }}
              className="p-1 text-stone-400 hover:text-amber-600 rounded"
              title="Open Link"
            >
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Visual View Mode (Card with optional preview banner)
  return (
    <div
      onClick={() => onSelect(resource)}
      className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-stone-200/80 dark:border-zinc-800 rounded-xl overflow-hidden hover:border-amber-400 dark:hover:border-amber-600/50 hover:shadow-subtle transition cursor-pointer text-xs"
    >
      {/* Visual Header / Thumbnail */}
      <div className="h-28 w-full bg-stone-100 dark:bg-zinc-800/60 flex items-center justify-center relative overflow-hidden">
        {resource.ogImage ? (
          <img
            src={resource.ogImage}
            alt=""
            className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="flex flex-col items-center gap-1.5 text-stone-400 dark:text-zinc-500">
            {getTypeIcon(resource.type)}
            <span className="text-[11px] font-mono uppercase tracking-wider">{resource.domain}</span>
          </div>
        )}

        {/* Pinned & Favorite Badges */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {resource.isPinned && (
            <span className="p-1 rounded-md bg-amber-500 text-white shadow-sm" title="Pinned">
              <Pin className="w-3 h-3 fill-current" />
            </span>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(resource.id, resource.isFavorite);
            }}
            className={`p-1 rounded-md backdrop-blur-md transition ${resource.isFavorite
                ? 'bg-white/90 dark:bg-zinc-900/90 text-amber-500'
                : 'bg-black/20 hover:bg-black/40 text-white'
              }`}
            title="Favorite"
          >
            <Star className={`w-3.5 h-3.5 ${resource.isFavorite ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Category Pill */}
        <div className="absolute bottom-2 left-2">
          <span className="px-2 py-0.5 rounded-full bg-stone-900/80 dark:bg-zinc-900/90 backdrop-blur-md text-[10px] text-white font-medium shadow-sm">
            {resource.collection}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3.5 flex-1 flex flex-col">
        <div className="flex items-center gap-1.5 mb-1.5">
          <img
            src={resource.favicon}
            alt=""
            className="w-3.5 h-3.5 rounded-sm flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
          <span className="text-[11px] text-stone-400 dark:text-zinc-500 font-mono truncate">
            {resource.domain}
          </span>
        </div>

        <h4 className="font-semibold text-stone-900 dark:text-stone-100 text-sm line-clamp-1 group-hover:text-amber-600 transition mb-1">
          {resource.title}
        </h4>

        {resource.description ? (
          <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2 mb-3">
            {resource.description}
          </p>
        ) : (
          <p className="text-[11px] text-stone-400 dark:text-zinc-600 italic mb-3">
            No description provided
          </p>
        )}

        {/* Tags */}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex items-center flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 text-[10px] text-stone-600 dark:text-zinc-400"
              >
                #{tag}
              </span>
            ))}
            {resource.tags.length > 3 && (
              <span className="text-[10px] text-stone-400">+{resource.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-auto pt-2 border-t border-stone-100 dark:border-zinc-800 flex items-center justify-between text-stone-400 dark:text-zinc-500">
          <span className="text-[10px]">
            {new Date(resource.createdAt).toLocaleDateString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleCopyLink}
              className="p-1 hover:text-stone-800 dark:hover:text-stone-200 rounded transition"
              title="Copy URL"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpen(resource);
              }}
              className="p-1 hover:text-amber-600 rounded transition"
              title="Open link in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(resource.id);
              }}
              className="p-1 hover:text-red-500 rounded transition"
              title="Delete resource"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

