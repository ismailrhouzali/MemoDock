import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileCheck,
  File,
  Check,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { processUniversalFile } from '../../services/importEngine/smartImportEngine';
import { Attachment } from '../../db/types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteId: string;
  onInsertHtml: (html: string) => void;
  onAddAttachment?: (attachment: Attachment) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  noteId,
  onInsertHtml,
  onAddAttachment,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfMode, setPdfMode] = useState<'text' | 'attachment'>('text');
  const [enablePptxOcr, setEnablePptxOcr] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setStatusMessage(`Importing ${files.length} file(s)...`);

    try {
      let combinedHtml = '';

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await processUniversalFile(file, noteId, {
          extractPdfTextMode: pdfMode === 'text',
          enablePptxOcr,
          onProgress: (msg) => setStatusMessage(msg),
        });

        if (res.action === 'insert_html' && res.html) {
          combinedHtml += res.html + '\n\n';
        } else if (res.action === 'create_attachment' && res.attachment) {
          if (onAddAttachment) {
            onAddAttachment(res.attachment);
          }
          // Also insert a PDF node into the editor
          const pdfNodeHtml = `<div data-type="pdf-attachment" data-id="${res.attachment.id}" data-name="${res.attachment.name}" data-size="${res.attachment.size}" data-display="compact"></div>\n\n`;
          combinedHtml += pdfNodeHtml;
        }
      }

      if (combinedHtml) {
        onInsertHtml(combinedHtml);
      }

      setStatusMessage('Import completed successfully!');
      setTimeout(() => {
        setIsProcessing(false);
        setStatusMessage(null);
        onClose();
      }, 700);
    } catch (err: any) {
      setIsProcessing(false);
      setStatusMessage(`Import failed: ${err.message || 'Error parsing file'}`);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden flex flex-col z-10 text-xs">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-stone-100">
            <Upload className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span>Universal Smart Import</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-stone-500 dark:text-zinc-400 leading-relaxed">
            Import notes, documents, formulas, or tables from almost any format. The content will be automatically converted into editable NoteBook rich text.
          </p>

          {/* PDF Import Choice */}
          <div className="p-3 bg-stone-50 dark:bg-zinc-950/60 rounded-lg border border-stone-200 dark:border-zinc-800">
            <label className="block font-medium text-stone-700 dark:text-stone-300 mb-1.5">
              PDF Import Strategy
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded border border-stone-200 dark:border-zinc-700/80 cursor-pointer bg-white dark:bg-zinc-900">
                <input
                  type="radio"
                  name="pdfMode"
                  value="text"
                  checked={pdfMode === 'text'}
                  onChange={() => setPdfMode('text')}
                  className="accent-amber-600"
                />
                <div>
                  <div className="font-medium text-stone-800 dark:text-zinc-200">Extract Text</div>
                  <div className="text-[10px] text-stone-400">Convert text into note content</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded border border-stone-200 dark:border-zinc-700/80 cursor-pointer bg-white dark:bg-zinc-900">
                <input
                  type="radio"
                  name="pdfMode"
                  value="attachment"
                  checked={pdfMode === 'attachment'}
                  onChange={() => setPdfMode('attachment')}
                  className="accent-amber-600"
                />
                <div>
                  <div className="font-medium text-stone-800 dark:text-zinc-200">Attach Document</div>
                  <div className="text-[10px] text-stone-400">Embed with PDF previewer</div>
                </div>
              </label>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 select-none ${isDragging
                ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/20'
                : 'border-stone-300 dark:border-zinc-700 hover:border-amber-400 hover:bg-stone-50 dark:hover:bg-zinc-800/40'
              }`}
          >
            <Upload className="w-8 h-8 text-amber-600 dark:text-amber-500 stroke-1 mb-1" />
            <div className="font-medium text-stone-800 dark:text-stone-200 text-xs">
              Drag & drop files here, or <span className="text-amber-600 hover:underline">browse</span>
            </div>
            <div className="text-[11px] text-stone-400 dark:text-zinc-500">
              Supports Markdown (.md), Word (.docx), PowerPoint (.pptx), PDF (.pdf), HTML (.html), and Text (.txt)
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".md,.markdown,.txt,.html,.htm,.docx,.pdf,.pptx"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
              }}
              className="hidden"
            />
          </div>

          {/* PPTX OCR Option */}
          <label className="flex items-center justify-between p-2.5 rounded-lg bg-stone-50 dark:bg-zinc-950/60 border border-stone-200 dark:border-zinc-800 cursor-pointer">
            <div>
              <div className="font-medium text-stone-800 dark:text-zinc-200">PowerPoint (.pptx) OCR &amp; Markdown</div>
              <div className="text-[10px] text-stone-400">Extract slide text, tables, notes, images &amp; run OCR on images</div>
            </div>
            <input
              type="checkbox"
              checked={enablePptxOcr}
              onChange={(e) => setEnablePptxOcr(e.target.checked)}
              className="w-4 h-4 accent-amber-600"
            />
          </label>

          {/* Supported Format Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] text-stone-500 dark:text-zinc-400">
            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
              Markdown & LaTeX
            </span>
            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
              Word (.docx)
            </span>
            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
              PowerPoint (.pptx + OCR)
            </span>
            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
              PDF Documents
            </span>
            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
              HTML Pages
            </span>
            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700">
              Excel / Sheets TSV
            </span>
          </div>

          {/* Status Message */}
          {statusMessage && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 text-xs flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-950/50">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 rounded-md transition"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

