import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Trash2,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Attachment } from '../../db/types';
import { pdfStorageService } from '../../services/pdfStorageService';

interface PdfViewerModalProps {
  attachment: Attachment | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({
  attachment,
  onClose,
  onDelete,
}) => {
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Generate lightweight Blob URL on demand
  const viewerUrl = useMemo(() => {
    if (!attachment) return '';
    return pdfStorageService.getViewerUrl(attachment);
  }, [attachment]);

  // Clean up object URL on close to prevent memory leaks
  useEffect(() => {
    return () => {
      if (viewerUrl) {
        pdfStorageService.revokeViewerUrl(viewerUrl);
      }
    };
  }, [viewerUrl]);

  if (!attachment) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = viewerUrl || attachment.dataUrl || '';
    link.download = attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${attachment.name}" permanently?`)) {
      if (onDelete) onDelete(attachment.id);
      onClose();
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className={`bg-stone-900 border border-stone-800 rounded-2xl shadow-float flex flex-col overflow-hidden text-stone-200 transition-all ${isFullscreen ? 'w-full h-full rounded-none' : 'max-w-5xl w-full h-[88vh]'
          }`}
      >
        {/* Header Toolbar */}
        <div className="px-4 py-2.5 bg-stone-950 border-b border-stone-800 flex items-center justify-between text-xs select-none">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-red-950/60 text-red-400 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-stone-100 truncate max-w-sm">
                {attachment.name}
              </h3>
              <p className="text-[10px] text-stone-400">
                {formatSize(attachment.size)} · Added {new Date(attachment.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Controls: Zoom, Download, Delete, Fullscreen, Close */}
          <div className="flex items-center gap-1.5">
            {/* Zoom Controls */}
            <div className="flex items-center bg-stone-900 border border-stone-800 rounded-md p-0.5 mr-2">
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.max(50, prev - 15))}
                className="p-1 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 font-mono text-[11px] text-stone-300 min-w-[45px] text-center">
                {zoom}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((prev) => Math.min(200, prev + 15))}
                className="p-1 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setZoom(100)}
                className="p-1 text-stone-400 hover:text-stone-100 rounded hover:bg-stone-800 transition ml-0.5"
                title="Reset Zoom (100%)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            {/* Download */}
            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-stone-300 hover:text-white hover:bg-stone-800 rounded-md transition"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Delete */}
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1.5 text-stone-400 hover:text-red-400 hover:bg-stone-800 rounded-md transition"
                title="Delete attachment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-md transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <div className="h-4 w-px bg-stone-800 mx-1" />

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-md transition"
              title="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Viewer Canvas */}
        <div className="flex-1 bg-stone-950 p-2 overflow-auto flex items-center justify-center">
          <div
            style={{ width: `${zoom}%`, height: '100%', transition: 'width 0.15s ease-out' }}
            className="flex items-center justify-center mx-auto"
          >
            <iframe
              src={viewerUrl}
              title={attachment.name}
              className="w-full h-full border-0 rounded-lg shadow-2xl bg-white"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

