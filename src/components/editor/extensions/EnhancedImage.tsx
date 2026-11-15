import Image from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  Maximize2,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  ExternalLink,
} from 'lucide-react';

const ImageNodeComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
  selected,
}) => {
  const { src, alt, title, width = '100%', alignment = 'center', caption = '' } = node.attrs;

  const [copied, setCopied] = useState<boolean>(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);
  const [lightboxZoom, setLightboxZoom] = useState<number>(100);
  const [isEditingCaption, setIsEditingCaption] = useState<boolean>(false);
  const [captionText, setCaptionText] = useState<string>(caption || '');

  // 1. Download image to user's computer
  const handleDownload = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!src) return;

    try {
      const a = document.createElement('a');
      a.href = src;
      const isJpeg = src.startsWith('data:image/jpeg') || src.includes('.jpg') || src.includes('.jpeg');
      const isWebp = src.startsWith('data:image/webp') || src.includes('.webp');
      const isGif = src.startsWith('data:image/gif') || src.includes('.gif');
      const isSvg = src.startsWith('data:image/svg') || src.includes('.svg');
      const ext = isJpeg ? 'jpg' : isWebp ? 'webp' : isGif ? 'gif' : isSvg ? 'svg' : 'png';

      const cleanTitle = (title || alt || `memodock-image-${Date.now()}`)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);

      a.download = `${cleanTitle}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download image:', err);
      window.open(src, '_blank');
    }
  };

  // 2. Copy image to clipboard
  const handleCopy = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!src) return;

    try {
      if (src.startsWith('data:image/')) {
        const response = await fetch(src);
        const blob = await response.blob();
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      } else {
        await navigator.clipboard.writeText(src);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      try {
        await navigator.clipboard.writeText(src);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy image:', err);
      }
    }
  };

  // 3. Open in new tab
  const handleOpenNewTab = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!src) return;
    window.open(src, '_blank', 'noopener,noreferrer');
  };

  // 4. Alignment class
  const justifyClass =
    alignment === 'left'
      ? 'justify-start'
      : alignment === 'right'
      ? 'justify-end'
      : 'justify-center';

  return (
    <NodeViewWrapper className={`my-4 flex ${justifyClass} select-none`}>
      <div
        className={`relative group inline-block max-w-full transition-all duration-150 ${
          selected ? 'ring-2 ring-blue-500 rounded-xl' : ''
        }`}
        style={{ width: width === '100%' ? '100%' : width }}
      >
        {/* Floating Action Bar on Hover */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-stone-900/90 dark:bg-zinc-900/95 backdrop-blur-md text-white px-2 py-1 rounded-xl shadow-xl flex items-center gap-1 z-20 border border-white/10">
          {/* Alignment */}
          <div className="flex items-center border-r border-white/20 pr-1 mr-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: 'left' })}
              className={`p-1 rounded hover:bg-white/20 transition ${
                alignment === 'left' ? 'text-blue-400 bg-white/20' : 'text-stone-300'
              }`}
              title="Align Left"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: 'center' })}
              className={`p-1 rounded hover:bg-white/20 transition ${
                alignment === 'center' ? 'text-blue-400 bg-white/20' : 'text-stone-300'
              }`}
              title="Align Center"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => updateAttributes({ alignment: 'right' })}
              className={`p-1 rounded hover:bg-white/20 transition ${
                alignment === 'right' ? 'text-blue-400 bg-white/20' : 'text-stone-300'
              }`}
              title="Align Right"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Width / Size Presets */}
          <div className="flex items-center border-r border-white/20 pr-1 mr-0.5 gap-0.5 text-[10px] font-mono">
            {['25%', '50%', '75%', '100%'].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => updateAttributes({ width: w })}
                className={`px-1.5 py-0.5 rounded hover:bg-white/20 transition ${
                  width === w ? 'text-blue-400 font-bold bg-white/20' : 'text-stone-300'
                }`}
                title={`Set width to ${w}`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Download Image */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/20 transition flex items-center gap-1"
            title="Download image to computer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
          </button>

          {/* Copy Image */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/20 transition"
            title={copied ? 'Copied!' : 'Copy image to clipboard'}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Open in new window */}
          <button
            type="button"
            onClick={handleOpenNewTab}
            className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/20 transition"
            title="Open image in new tab (_blank)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Lightbox / Zoom */}
          <button
            type="button"
            onClick={() => {
              setLightboxZoom(100);
              setIsLightboxOpen(true);
            }}
            className="p-1 rounded text-stone-300 hover:text-white hover:bg-white/20 transition"
            title="Fullscreen Lightbox"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={deleteNode}
            className="p-1 rounded text-stone-400 hover:text-red-400 hover:bg-red-500/20 transition ml-0.5"
            title="Delete Image"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* The Image Itself */}
        <img
          src={src}
          alt={alt || caption || 'Note image'}
          title={title || caption || 'Click to view'}
          onClick={() => setIsLightboxOpen(true)}
          className="rounded-xl shadow-sm border border-stone-200/80 dark:border-zinc-800 w-full object-contain cursor-zoom-in transition hover:shadow-md"
        />

        {/* Caption text below */}
        {(caption || isEditingCaption) ? (
          <div className="mt-1.5 px-1 text-center">
            {isEditingCaption ? (
              <div className="flex items-center gap-1 justify-center">
                <input
                  type="text"
                  value={captionText}
                  autoFocus
                  onChange={(e) => setCaptionText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateAttributes({ caption: captionText });
                      setIsEditingCaption(false);
                    } else if (e.key === 'Escape') {
                      setIsEditingCaption(false);
                    }
                  }}
                  onBlur={() => {
                    updateAttributes({ caption: captionText });
                    setIsEditingCaption(false);
                  }}
                  className="bg-white dark:bg-zinc-800 border border-blue-400 rounded px-2 py-0.5 text-xs text-stone-800 dark:text-zinc-200 w-full max-w-md text-center focus:outline-none"
                  placeholder="Légende de l'image..."
                />
              </div>
            ) : (
              <p
                onClick={() => setIsEditingCaption(true)}
                className="text-xs text-stone-500 dark:text-zinc-400 italic cursor-pointer hover:text-stone-800 dark:hover:text-zinc-200"
                title="Cliquer pour modifier la légende"
              >
                {caption}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditingCaption(true)}
            className="opacity-0 group-hover:opacity-60 hover:!opacity-100 text-[11px] text-stone-400 dark:text-zinc-500 italic mt-1 block w-full text-center transition"
          >
            + Ajouter une légende...
          </button>
        )}
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-between p-4 animate-in fade-in duration-150 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Lightbox Header Bar */}
          <div
            className="w-full max-w-4xl flex items-center justify-between text-white p-2 bg-stone-900/80 rounded-xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-xs truncate max-w-md">
              <span className="font-semibold text-stone-200">
                {caption || alt || 'Image Preview'}
              </span>
              <span className="text-stone-400 font-mono text-[11px]">
                ({lightboxZoom}%)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Zoom Out */}
              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.max(25, prev - 25))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
                title="Zoom Out (-25%)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              {/* Reset Zoom */}
              <button
                type="button"
                onClick={() => setLightboxZoom(100)}
                className="px-2 py-1 rounded-lg hover:bg-white/10 text-xs font-mono text-stone-300 hover:text-white transition flex items-center gap-1"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>100%</span>
              </button>

              {/* Zoom In */}
              <button
                type="button"
                onClick={() => setLightboxZoom((prev) => Math.min(300, prev + 25))}
                className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
                title="Zoom In (+25%)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-white/20 mx-1" />

              {/* Download */}
              <button
                type="button"
                onClick={handleDownload}
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition flex items-center gap-1.5"
                title="Download this image"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger</span>
              </button>

              {/* Copy */}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
                title={copied ? 'Copié !' : 'Copier l\'image'}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Open in new tab */}
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="p-1.5 rounded-lg hover:bg-white/10 text-stone-300 hover:text-white transition"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-4 h-4" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-red-500/80 text-white transition ml-1"
                title="Fermer (Échap)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Lightbox Image Container */}
          <div
            className="flex-1 flex items-center justify-center p-4 overflow-auto max-w-full max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={src}
              alt={alt || caption || 'Fullscreen image'}
              style={{
                transform: `scale(${lightboxZoom / 100})`,
                transition: 'transform 0.15s ease-out',
              }}
              className="max-h-[80vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
            />
          </div>

          {/* Bottom caption if any */}
          {caption && (
            <div
              className="text-stone-300 text-xs bg-stone-900/80 px-4 py-1.5 rounded-full border border-white/10 max-w-xl text-center truncate"
              onClick={(e) => e.stopPropagation()}
            >
              {caption}
            </div>
          )}
        </div>
      )}
    </NodeViewWrapper>
  );
};

export const EnhancedImageNode = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: (attributes) => ({
          'data-width': attributes.width,
        }),
        parseHTML: (element) => element.getAttribute('data-width') || element.style.width || '100%',
      },
      alignment: {
        default: 'center',
        renderHTML: (attributes) => ({
          'data-alignment': attributes.alignment,
        }),
        parseHTML: (element) => element.getAttribute('data-alignment') || 'center',
      },
      caption: {
        default: '',
        renderHTML: (attributes) => ({
          'data-caption': attributes.caption,
        }),
        parseHTML: (element) => element.getAttribute('data-caption') || '',
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeComponent);
  },
});
