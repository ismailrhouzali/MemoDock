import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  ExternalLink,
  Trash2,
  Eye,
  EyeOff,
  Table as TableIcon,
} from 'lucide-react';
import { spreadsheetService } from '../../../services/spreadsheet/spreadsheetService';
import { Spreadsheet } from '../../../db/types';

const SpreadsheetNodeComponent: React.FC<NodeViewProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const { spreadsheetId, title, displayMode = 'compact' } = node.attrs;
  const [spreadsheet, setSpreadsheet] = useState<Spreadsheet | null>(null);
  const [mode, setMode] = useState<'compact' | 'preview'>(displayMode);

  useEffect(() => {
    if (spreadsheetId) {
      spreadsheetService.getById(spreadsheetId).then((res) => {
        if (res) setSpreadsheet(res);
      });
    }
  }, [spreadsheetId]);

  const toggleMode = () => {
    const next = mode === 'compact' ? 'preview' : 'compact';
    setMode(next);
    updateAttributes({ displayMode: next });
  };

  const currentSheet = spreadsheet?.sheets[0];
  const rowsCount = currentSheet?.rows?.length || 0;
  const colsCount = currentSheet?.headers?.length || 0;
  const sheetsCount = spreadsheet?.sheets?.length || 1;

  const handleDownload = () => {
    if (spreadsheet) {
      spreadsheetService.download(spreadsheet, 0);
    }
  };

  return (
    <NodeViewWrapper className="my-3 select-none">
      <div className="border border-stone-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-white/70 dark:bg-zinc-900/60 shadow-2xs transition hover:border-emerald-500/50">
        {/* Compact Header Bar */}
        <div className="flex items-center justify-between p-3 gap-3 bg-stone-50/60 dark:bg-zinc-950/40">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100 truncate">
                {title || spreadsheet?.title || 'Spreadsheet'}
              </h4>
              <div className="flex items-center gap-2 text-[10px] text-stone-400 dark:text-zinc-500">
                <span>
                  {rowsCount} rows × {colsCount} cols
                </span>
                <span>•</span>
                <span>{sheetsCount} sheet{sheetsCount > 1 ? 's' : ''}</span>
                <span>•</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider text-[9px]">
                  Spreadsheet
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={toggleMode}
              className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-zinc-800 rounded-md transition"
              title={mode === 'compact' ? 'Show Table Preview' : 'Collapse to Compact Card'}
            >
              {mode === 'compact' ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="p-1.5 text-stone-500 hover:text-emerald-600 hover:bg-stone-200/60 dark:hover:bg-zinc-800 rounded-md transition"
              title="Download CSV"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={deleteNode}
              className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-stone-200/60 dark:hover:bg-zinc-800 rounded-md transition"
              title="Remove Attachment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Table Preview Mode */}
        {mode === 'preview' && currentSheet && (
          <div className="p-3 bg-white dark:bg-zinc-950 border-t border-stone-200/60 dark:border-zinc-800/60 overflow-x-auto max-h-56">
            <table className="min-w-full divide-y divide-stone-200 dark:divide-zinc-800 text-xs border border-stone-200/60 dark:border-zinc-800 rounded">
              <thead className="bg-stone-100 dark:bg-zinc-900">
                <tr>
                  {currentSheet.headers.slice(0, 6).map((h, i) => (
                    <th key={i} className="px-2.5 py-1.5 text-left font-semibold text-stone-700 dark:text-zinc-300 border-r border-stone-200 dark:border-zinc-800 truncate">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200/40 dark:divide-zinc-800/40 font-mono text-[11px]">
                {currentSheet.rows.slice(0, 5).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-stone-50 dark:hover:bg-zinc-900">
                    {row.slice(0, 6).map((cell, cIdx) => (
                      <td key={cIdx} className="px-2.5 py-1 border-r border-stone-200/40 dark:border-zinc-800/40 truncate">
                        {cell || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {currentSheet.rows.length > 5 && (
              <p className="text-[10px] text-stone-400 mt-1.5 text-center">
                Showing first 5 of {currentSheet.rows.length} rows
              </p>
            )}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const SpreadsheetNode = Node.create({
  name: 'spreadsheetNode',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      spreadsheetId: { default: '' },
      title: { default: 'Spreadsheet' },
      displayMode: { default: 'compact' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="spreadsheet-attachment"]',
        getAttrs: (element) => {
          if (typeof element === 'string') return {};
          return {
            spreadsheetId: element.getAttribute('data-spreadsheet-id'),
            title: element.getAttribute('data-title'),
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
        'data-type': 'spreadsheet-attachment',
        'data-spreadsheet-id': HTMLAttributes.spreadsheetId,
        'data-title': HTMLAttributes.title,
        'data-display-mode': HTMLAttributes.displayMode,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SpreadsheetNodeComponent);
  },
});

