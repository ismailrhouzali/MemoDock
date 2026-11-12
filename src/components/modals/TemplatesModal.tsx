import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import { NoteTemplate, Note } from '../../db/types';
import {
  LayoutTemplate,
  X,
  Plus,
  Trash2,
  Check,
  Briefcase,
  BookOpen,
  Code2,
  FileText,
  Sparkles,
} from 'lucide-react';

interface TemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: NoteTemplate) => void;
  activeNote?: Note | null;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  activeNote,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const templates = useLiveQuery(() => db.templates.toArray(), []) || [];

  if (!isOpen) return null;

  const categories = ['All', 'General', 'Work', 'Study', 'Engineering', 'Writing'];

  const filteredTemplates = templates.filter((t) => {
    if (selectedCategory === 'All') return true;
    return t.category === selectedCategory;
  });

  const handleSaveCurrentAsTemplate = async () => {
    if (!activeNote || !customTitle.trim()) return;

    const newTemplate: NoteTemplate = {
      id: `tmpl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: customTitle.trim(),
      description: customDesc.trim() || 'Custom user template',
      category: 'General',
      content: activeNote.content || '',
      isBuiltin: false,
      createdAt: Date.now(),
    };

    await db.templates.add(newTemplate);
    setCustomTitle('');
    setCustomDesc('');
    setIsSavingCustom(false);
  };

  const handleDeleteCustomTemplate = async (id: string) => {
    await db.templates.delete(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden flex flex-col z-10 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-stone-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-stone-100">
            <LayoutTemplate className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <span>Note Templates Library</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Categories Bar & Save Custom button */}
        <div className="px-5 py-2.5 border-b border-stone-200/60 dark:border-zinc-800/60 flex items-center justify-between bg-stone-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] transition ${
                  selectedCategory === cat
                    ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-semibold'
                    : 'text-stone-600 dark:text-zinc-400 hover:bg-stone-200/50 dark:hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {activeNote && (
            <button
              type="button"
              onClick={() => setIsSavingCustom(!isSavingCustom)}
              className="px-2.5 py-1 text-[11px] font-medium border border-stone-200 dark:border-zinc-800 rounded-md text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Save Note as Template</span>
            </button>
          )}
        </div>

        {/* Custom Template Save Form */}
        {isSavingCustom && (
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-200/50 dark:border-amber-900/30 space-y-2">
            <h4 className="font-semibold text-xs text-amber-900 dark:text-amber-200">
              Save current note "{activeNote?.title}" as a reusable template
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Template Title (e.g. Weekly Review)"
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <input
                type="text"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Brief description..."
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSavingCustom(false)}
                className="px-2.5 py-1 text-stone-500 hover:bg-stone-200/50 rounded text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCurrentAsTemplate}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium transition"
              >
                Save Template
              </button>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="p-3.5 rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-stone-50/40 dark:bg-zinc-950/40 hover:border-amber-400 dark:hover:border-amber-600/50 hover:shadow-sm transition flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-stone-200/60 dark:bg-zinc-800 flex items-center justify-center text-stone-600 dark:text-zinc-300">
                      {template.category === 'Work' ? (
                        <Briefcase className="w-3.5 h-3.5" />
                      ) : template.category === 'Study' ? (
                        <BookOpen className="w-3.5 h-3.5" />
                      ) : template.category === 'Engineering' ? (
                        <Code2 className="w-3.5 h-3.5" />
                      ) : (
                        <FileText className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <h4 className="font-semibold text-xs text-stone-900 dark:text-stone-100">
                      {template.title}
                    </h4>
                  </div>

                  {!template.isBuiltin && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomTemplate(template.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-stone-400 hover:text-red-500 transition"
                      title="Delete Template"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                  {template.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-stone-200/40 dark:border-zinc-800/40">
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-200/50 dark:bg-zinc-800 text-stone-500">
                  {template.category}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    onSelectTemplate(template);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-white text-white dark:text-stone-900 rounded font-medium text-[11px] transition flex items-center gap-1 active:scale-95"
                >
                  <Check className="w-3 h-3" />
                  <span>Use Template</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-stone-200/80 dark:border-zinc-800/80 bg-stone-50/50 dark:bg-zinc-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-800 text-stone-600 dark:text-zinc-400 hover:bg-stone-100 dark:hover:bg-zinc-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
