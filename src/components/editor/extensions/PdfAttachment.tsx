import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  Trash2,
  Maximize2,
  Minimize2,
  Eye,
  FileCheck,
} from 'lucide-react';
import { pdfStorageService } from '../../../services/pdfStorageService';

const PdfAttachmentComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const { attachmentId, name, size, dataUrl, displayMode = 'compact' } = node.attrs;
  const [isEmbedded, setIsEmbedded] = useState<boolean>(displayMode === 'embedded');
  const [resolvedUrl, setResolvedUrl] = useState<string>(dataUrl || '');

  useEffect(() => {
    let activeUrl = '';
    if (!resolvedUrl && attachmentId) {
      pdfStorageService.getViewerUrlById(attachmentId).then((url) => {
        if (url) {
          activeUrl = url;
          setResolvedUrl(url);
        }
      });
    }
    return () => {
      if (activeUrl && activeUrl.startsWith('blob:')) {
        pdfStorageService.revokeViewerUrl(activeUrl);
      }
    };
  }, [attachmentId, dataUrl]);

  const toggleDisplayMode = () => {
    const next = !isEmbedded;
    setIsEmbedded(next);
    updateAttributes({ displayMode: next ? 'embedded' : 'compact' });
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleDownload = async () => {
    let url = resolvedUrl;
    if (!url && attachmentId) {
      url = await pdfStorageService.getViewerUrlById(attachmentId);
    }
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = name || 'document.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenNewTab = async () => {
    let url = resolvedUrl;
    if (!url && attachmentId) {
      url = await pdfStorageService.getViewerUrlById(attachmentId);
    }
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <NodeViewWrapper className="my-3 select-none">
      <div className="border border-stone-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 shadow-sm transition hover:border-stone-300 dark:hover:border-zinc-700">
        
        {/* Compact Bar / Header */}
        <div className="flex items-center justify-between p-3 gap-3 bg-stone-50/60 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                {name || 'Attached Document.pdf'}
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-zinc-500">
                <span>{formatFileSize(size)}</span>
                <span>•</span>
                <span className="text-red-600 dark:text-red-400 font-medium uppercase tracking-wider text-[9px]">PDF Document</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={toggleDisplayMode}
              className="px-2 py-1 rounded bg-stone-200/50 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-stone-700 dark:text-zinc-300 text-[11px] font-medium transition flex items-center gap-1"
              title={isEmbedded ? 'Collapse to compact' : 'Embed in note'}
            >
              <Eye className="w-3 h-3" />
              <span>{isEmbedded ? 'Compact' : 'Preview'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition"
              title="Download PDF"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleOpenNewTab}
              className="p-1.5 text-stone-500 hover:text-stone-900 dark:text-zinc-400 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-zinc-800 rounded transition"
              title="Open in new window"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={deleteNode}
              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition"
              title="Remove attachment"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Embedded Iframe Preview when expanded */}
        {isEmbedded && resolvedUrl && (
          <div className="border-t border-stone-200/60 dark:border-zinc-800/60 p-2 bg-stone-100/40 dark:bg-zinc-950/80">
            <iframe
              src={`${resolvedUrl}#toolbar=1`}
              title={name || 'PDF Preview'}
              className="w-full h-[450px] rounded-lg border border-stone-200 dark:border-zinc-800 bg-white"
            />
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const PdfAttachmentNode = Node.create({
  name: 'pdfAttachment',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      attachmentId: {
        default: null,
      },
      name: {
        default: 'Document.pdf',
      },
      size: {
        default: 0,
      },
      pageCount: {
        default: 1,
      },
      displayMode: {
        default: 'compact',
      },
      dataUrl: {
        default: '',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="pdf-attachment"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          return {
            attachmentId: element.getAttribute('data-attachment-id'),
            name: element.getAttribute('data-name') || 'Document.pdf',
            size: Number(element.getAttribute('data-size')) || 0,
            pageCount: Number(element.getAttribute('data-pages')) || 1,
            displayMode: element.getAttribute('data-display-mode') || 'compact',
            dataUrl: element.getAttribute('data-url') || '',
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'pdf-attachment',
        'data-attachment-id': HTMLAttributes.attachmentId,
        'data-name': HTMLAttributes.name,
        'data-size': HTMLAttributes.size,
        'data-pages': HTMLAttributes.pageCount,
        'data-display-mode': HTMLAttributes.displayMode,
        'data-url': HTMLAttributes.dataUrl,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PdfAttachmentComponent);
  },
});
