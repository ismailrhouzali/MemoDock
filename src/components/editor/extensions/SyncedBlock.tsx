import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react';
import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { RefreshCw, Copy, Check, Trash2 } from 'lucide-react';
import { db } from '../../../db/db';

const SyncedBlockComponent: React.FC<NodeViewProps> = ({ node, updateAttributes, deleteNode }) => {
  const { syncedBlockId = '' } = node.attrs;
  const [copiedId, setCopiedId] = useState(false);

  const syncedRecord = useLiveQuery(
    () => (syncedBlockId ? db.syncedBlocks.get(syncedBlockId) : undefined),
    [syncedBlockId]
  );

  const handleContentChange = async (text: string) => {
    if (!syncedBlockId) return;
    const now = Date.now();
    const existing = await db.syncedBlocks.get(syncedBlockId);
    if (existing) {
      await db.syncedBlocks.update(syncedBlockId, { content: text, updatedAt: now });
    } else {
      await db.syncedBlocks.put({
        id: syncedBlockId,
        title: 'Synced Block',
        content: text,
        updatedAt: now,
      });
    }
  };

  const handleLinkExisting = async () => {
    const id = window.prompt('Paste Synced Block ID to link:', syncedBlockId);
    if (id && id.trim()) {
      updateAttributes({ syncedBlockId: id.trim() });
    }
  };

  return (
    <NodeViewWrapper className="my-3 select-text">
      <div className="rounded-xl border-2 border-red-400/50 dark:border-red-500/40 bg-red-50/20 dark:bg-red-950/10 p-3 text-xs">
        <div className="no-print flex items-center justify-between mb-2 pb-1.5 border-b border-red-200/50 dark:border-red-900/40">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-red-600 dark:text-red-400">
            <RefreshCw className="w-3 h-3" />
            <span>Synced Block</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(syncedBlockId);
                setCopiedId(true);
                setTimeout(() => setCopiedId(false), 1500);
              }}
              className="px-1.5 py-0.5 rounded hover:bg-red-100/60 dark:hover:bg-red-900/30 text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1"
              title="Copy Synced Block ID to reuse in another note"
            >
              {copiedId ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              <span>{copiedId ? 'Copied ID' : 'Copy ID'}</span>
            </button>
            <button
              type="button"
              onClick={handleLinkExisting}
              className="px-1.5 py-0.5 rounded hover:bg-red-100/60 dark:hover:bg-red-900/30 text-[10px] text-stone-500"
              title="Link to another Synced Block ID"
            >
              Link ID
            </button>
            <button
              type="button"
              onClick={deleteNode}
              className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-stone-400 hover:text-red-600"
              title="Remove synced block"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        </div>
        <textarea
          value={syncedRecord?.content ?? ''}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Write synced content here — edits update across every note sharing this Synced Block ID..."
          rows={Math.max(2, (syncedRecord?.content || '').split('\n').length)}
          className="w-full bg-transparent text-xs leading-relaxed text-stone-800 dark:text-stone-200 placeholder-stone-400 focus:outline-none resize-none"
        />
      </div>
    </NodeViewWrapper>
  );
};

export const SyncedBlock = Node.create({
  name: 'syncedBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      syncedBlockId: { default: '' },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="synced-block"]',
        getAttrs: (el) => {
          if (typeof el === 'string') return {};
          return { syncedBlockId: el.getAttribute('data-synced-id') || '' };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-type': 'synced-block',
        'data-synced-id': HTMLAttributes.syncedBlockId,
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SyncedBlockComponent);
  },
});
