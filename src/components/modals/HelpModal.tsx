import React from 'react';
import {
  X,
  HelpCircle,
  BookOpen,
  Palette,
  Database,
  Slash,
  Smile,
  Share2,
  FolderOpen,
  Settings,
} from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  if (!isOpen) return null;

  const sections = [
    {
      icon: BookOpen,
      color: 'text-blue-600',
      title: '1. Bien démarrer avec MemoDock',
      items: [
        'Créez une note avec Ctrl+N ou le bouton New Note.',
        'Les dossiers sont fermés par défaut : cliquez pour déplier, et glissez-déposez vos notes ou dossiers pour les réorganiser.',
        'Le titre suggéré apparaît en gris : appuyez sur Tab pour l’accepter ou tapez votre propre titre.',
      ],
    },
    {
      icon: Smile,
      color: 'text-amber-500',
      title: '2. Icônes & Sous-pages (style Notion)',
      items: [
        'Cliquez sur l’icône à gauche du titre d’une note, d’un dossier ou d’une base de données pour personnaliser son emoji/icône.',
        'Ajoutez des sous-pages en bas de chaque note (+ Add Sub-page) et reliez vos idées avec [[Nom de la note]].',
      ],
    },
    {
      icon: Slash,
      color: 'text-purple-600',
      title: '3. Commandes Slash (/) & Formats de liens',
      items: [
        'Tapez / dans l’éditeur pour insérer : Titres, Callouts, Toggles repliables, Bases de données, Code, Math LaTeX et Diagrammes Mermaid.',
        'Collez ou glissez un lien, PDF ou CSV/XLSX directement dans une note. Pour les liens, choisissez le format : Card, Embed, Mention ou URL.',
      ],
    },
    {
      icon: Database,
      color: 'text-emerald-600',
      title: '4. Bases de données & Import Excel / CSV',
      items: [
        'Ouvrez l’onglet Databases pour créer des tableaux structurés avec vues Table, Kanban Board et Gallery.',
        'Ajoutez des propriétés (+): Text, Select, Multi-select, Status, Date, Person, Image, et ouvrez chaque ligne en page (+ New page / Open).',
        'Importez directement vos fichiers .xlsx ou .csv en 1 clic.',
      ],
    },
    {
      icon: Palette,
      color: 'text-pink-600',
      title: '5. Personnaliser votre espace (Modes & Thèmes)',
      items: [
        'Le mode Minimaliste est actif par défaut. Dans Paramètres, vous pouvez passer en mode Balanced ou Complete, activer le Dashboard ou choisir parmi 6 thèmes visuels.',
        'Partagez vos notes, copiez le contexte AI/MCP JSON, ou enregistrez proprement en PDF via le bouton Share.',
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float overflow-hidden flex flex-col z-10 text-xs max-h-[88vh]">
        <div className="px-5 py-3.5 border-b border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-stone-50/50 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2 font-semibold text-sm text-stone-900 dark:text-zinc-100">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Guide de démarrage & Personnalisation MemoDock</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-zinc-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          {sections.map((sec) => {
            const Icon = sec.icon;
            return (
              <div
                key={sec.title}
                className="p-3.5 rounded-xl border border-stone-200/80 dark:border-zinc-800 bg-stone-50/40 dark:bg-zinc-950/40 space-y-2"
              >
                <div className="flex items-center gap-2 font-semibold text-xs text-stone-900 dark:text-zinc-100">
                  <Icon className={`w-4 h-4 ${sec.color}`} />
                  <span>{sec.title}</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-stone-600 dark:text-zinc-400 leading-relaxed">
                  {sec.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="px-5 py-3 border-t border-stone-200 dark:border-zinc-800 flex items-center justify-between bg-stone-50/50 dark:bg-zinc-950/50">
          <span className="text-[11px] text-stone-400 flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5" />
            <span>100% Local-first — Vos données restent sur votre navigateur.</span>
          </span>
          <div className="flex items-center gap-2">
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSettings();
                }}
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-zinc-700 hover:bg-stone-100 dark:hover:bg-zinc-800 font-medium flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Personnaliser</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              Compris
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
