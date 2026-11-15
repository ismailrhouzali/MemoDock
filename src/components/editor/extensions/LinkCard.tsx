import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import {
  Globe,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Eye,
  ShieldCheck,
  Maximize2,
} from 'lucide-react';

const LinkCardComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const {
    url,
    title,
    description,
    hostname,
    favicon,
    displayMode = 'compact',
  } = node.attrs;

  const [isEmbedded, setIsEmbedded] = useState<boolean>(displayMode === 'embedded');
  const [copied, setCopied] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);

  const parsedHostname = hostname || (() => {
    try {
      return new URL(url).hostname;
    } catch {
      return url || 'link';
    }
  })();

  const displayTitle = title || parsedHostname;

  const toggleDisplayMode = () => {
    const next = !isEmbedded;
    setIsEmbedded(next);
    updateAttributes({ displayMode: next ? 'embedded' : 'compact' });
  };

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpen = () => {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const faviconUrl = favicon || `https://www.google.com/s2/favicons?domain=${parsedHostname}&sz=64`;

  return (
    <NodeViewWrapper className="my-3 select-none">
      <div className="border border-stone-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 shadow-sm transition hover:border-stone-300 dark:hover:border-zinc-700">
        
        {/* Compact Bar / Header */}
        <div className="flex items-center justify-between p-3 gap-3 bg-stone-50/60 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 overflow-hidden border border-blue-500/20">
              {!imgError && faviconUrl ? (
                <img
                  src={faviconUrl}
                  alt={parsedHostname}
                  onError={() => setImgError(true)}
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <Globe className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0 flex-1 cursor-pointer" onClick={handleOpen} title="Ouvrir le lien dans un nouvel onglet">
              <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <span>{displayTitle}</span>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 inline transition-opacity text-stone-400" />
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-zinc-500 mt-0.5">
                <span className="truncate max-w-[200px] text-stone-600 dark:text-zinc-400 font-mono hover:underline">
                  {parsedHostname}
                </span>
                <span>•</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider text-[9px] flex items-center gap-0.5">
                  <ShieldCheck className="w-2.5 h-2.5 inline" />
                  Web Link
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons matching PDF attachment card style */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={toggleDisplayMode}
              className="px-2 py-1 rounded bg-stone-200/50 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-[11px] font-medium transition flex items-center gap-1"
              title={isEmbedded ? 'Collapse preview' : 'Embed in note'}
            >
              <Eye className="w-3 h-3" />
              <span>{isEmbedded ? 'Compact' : 'Preview'}</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition"
              title={copied ? 'URL Copied!' : 'Copy URL'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleOpen}
              className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition"
              title="Open link in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={deleteNode}
              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
              title="Remove link card"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Description snippet if present */}
        {description && !isEmbedded && (
          <div className="px-3 pb-2.5 pt-0.5 text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2">
            {description}
          </div>
        )}

        {/* Embedded Iframe / Rich Web Preview when expanded */}
        {isEmbedded && url && (
          <div className="border-t border-stone-200/60 dark:border-zinc-800/60 p-2 bg-stone-100/40 dark:bg-zinc-950/80">
            <div className="flex items-center justify-between px-2 py-1 mb-1 text-[11px] text-stone-500 dark:text-zinc-400">
              <span className="truncate max-w-md font-mono text-[10px]">{url}</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium text-[11px]"
              >
                <span>Full screen</span>
                <Maximize2 className="w-3 h-3" />
              </a>
            </div>
            <iframe
              src={url}
              title={displayTitle}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              className="w-full h-[420px] rounded-lg border border-stone-200 dark:border-zinc-800 bg-white"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const LinkCardNode = Node.create({
  name: 'linkCard',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      url: {
        default: '',
      },
      title: {
        default: '',
      },
      description: {
        default: '',
      },
      hostname: {
        default: '',
      },
      favicon: {
        default: '',
      },
      displayMode: {
        default: 'compact',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="link-card"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          return {
            url: element.getAttribute('data-url') || '',
            title: element.getAttribute('data-title') || '',
            description: element.getAttribute('data-description') || '',
            hostname: element.getAttribute('data-hostname') || '',
            favicon: element.getAttribute('data-favicon') || '',
            displayMode: element.getAttribute('data-display-mode') || 'compact',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'link-card',
        'data-url': HTMLAttributes.url,
        'data-title': HTMLAttributes.title,
        'data-description': HTMLAttributes.description,
        'data-hostname': HTMLAttributes.hostname,
        'data-favicon': HTMLAttributes.favicon,
        'data-display-mode': HTMLAttributes.displayMode,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LinkCardComponent);
  },
});

