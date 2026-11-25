import React from 'react';
import { Note, Folder, NoteDatabase, WorkspaceView } from '../../db/types';
import {
  FileText,
  Folder as FolderIcon,
  Database,
  Star,
  Pin,
  Plus,
  Clock,
  ArrowRight,
  LayoutDashboard,
} from 'lucide-react';

interface DashboardViewProps {
  notes: Note[];
  folders: Folder[];
  databases: NoteDatabase[];
  onSelectNote: (note: Note) => void;
  onCreateNote: () => void;
  onNavigateView: (view: WorkspaceView) => void;
  onDisableDashboard: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  notes,
  folders,
  databases,
  onSelectNote,
  onCreateNote,
  onNavigateView,
  onDisableDashboard,
}) => {
  const activeNotes = notes.filter((n) => !n.isTrash && !n.isArchived);
  const pinnedNotes = activeNotes.filter((n) => n.isPinned).slice(0, 4);
  const recentNotes = [...activeNotes]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6);

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-obsidian-950 text-stone-800 dark:text-stone-200 p-6 md:p-10">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200/70 dark:border-zinc-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Workspace Overview</span>
            </div>
            <h1 className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
              MemoDock Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onDisableDashboard}
              className="px-3 py-1.5 text-xs border border-stone-200 dark:border-zinc-800 hover:bg-stone-100 dark:hover:bg-zinc-900 rounded-lg text-stone-600 dark:text-zinc-400 transition"
            >
              Hide Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                onCreateNote();
                onNavigateView('notes');
              }}
              className="px-3.5 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Active Notes', value: activeNotes.length, icon: FileText, color: 'text-blue-600', view: 'notes' as WorkspaceView },
            { label: 'Folders', value: folders.length, icon: FolderIcon, color: 'text-amber-600', view: 'notes' as WorkspaceView },
            { label: 'Databases', value: databases.length, icon: Database, color: 'text-emerald-600', view: 'databases' as WorkspaceView },
            { label: 'Favorites', value: activeNotes.filter((n) => n.isFavorite).length, icon: Star, color: 'text-purple-600', view: 'notes' as WorkspaceView },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.label}
                type="button"
                onClick={() => onNavigateView(stat.view)}
                className="p-4 rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-stone-50/50 dark:bg-zinc-900/40 hover:border-blue-400/60 transition text-left"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                  <ArrowRight className="w-3.5 h-3.5 text-stone-300" />
                </div>
                <div className="text-2xl font-bold text-stone-900 dark:text-zinc-100">
                  {stat.value}
                </div>
                <div className="text-[11px] text-stone-500 dark:text-zinc-400">
                  {stat.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Pinned Notes */}
        {pinnedNotes.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Pin className="w-3.5 h-3.5 text-amber-500" />
              <span>Pinned Notes</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pinnedNotes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    onSelectNote(n);
                    onNavigateView('notes');
                  }}
                  className="p-3.5 rounded-xl border border-stone-200/80 dark:border-zinc-800 hover:border-blue-500/50 bg-white dark:bg-zinc-900/60 text-left transition"
                >
                  <div className="font-semibold text-xs text-stone-900 dark:text-zinc-100 truncate mb-1">
                    {n.title || 'Untitled Note'}
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-zinc-400 line-clamp-2">
                    {n.plainText || 'Empty note...'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Notes */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            <span>Recent Activity</span>
          </h2>
          <div className="divide-y divide-stone-100 dark:divide-zinc-800/80 border border-stone-200/80 dark:border-zinc-800 rounded-xl overflow-hidden">
            {recentNotes.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  onSelectNote(n);
                  onNavigateView('notes');
                }}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-zinc-900/50 transition text-left"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="font-medium text-xs text-stone-900 dark:text-zinc-100 truncate">
                    {n.title || 'Untitled Note'}
                  </div>
                  <div className="text-[11px] text-stone-400 truncate mt-0.5">
                    {n.plainText?.slice(0, 90) || 'No content yet'}
                  </div>
                </div>
                <span className="text-[10px] text-stone-400 font-mono flex-shrink-0">
                  {new Date(n.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
