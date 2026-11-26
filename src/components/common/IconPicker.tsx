import React, { useState, useMemo } from 'react';
import { X, Search } from 'lucide-react';

interface EmojiCategory {
  id: string;
  label: string;
  emojis: { char: string; tags: string }[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'docs',
    label: 'Notes & Dossiers',
    emojis: [
      { char: '📄', tags: 'page doc note file' },
      { char: '📝', tags: 'memo write note edit' },
      { char: '📚', tags: 'books study library' },
      { char: '📖', tags: 'book read open' },
      { char: '📓', tags: 'notebook journal' },
      { char: '📔', tags: 'notebook cover' },
      { char: '📒', tags: 'ledger yellow' },
      { char: '📑', tags: 'bookmark tabs' },
      { char: '🗂️', tags: 'dividers folder index' },
      { char: '📁', tags: 'folder closed' },
      { char: '📂', tags: 'folder open' },
      { char: '🗄️', tags: 'cabinet database archive' },
      { char: '📋', tags: 'clipboard list' },
      { char: '📌', tags: 'pin pushpin' },
      { char: '📍', tags: 'pin location' },
      { char: '🔖', tags: 'bookmark tag' },
    ],
  },
  {
    id: 'work',
    label: 'Travail & Tech',
    emojis: [
      { char: '💻', tags: 'laptop code computer dev' },
      { char: '🖥️', tags: 'desktop screen' },
      { char: '⚙️', tags: 'gear settings config' },
      { char: '🛠️', tags: 'tools build fix' },
      { char: '🧪', tags: 'test lab science' },
      { char: '🔬', tags: 'research microscope' },
      { char: '📊', tags: 'chart bar stats data' },
      { char: '📈', tags: 'growth chart up' },
      { char: '📉', tags: 'chart down' },
      { char: '💼', tags: 'briefcase work job' },
      { char: '🎓', tags: 'graduation study school' },
      { char: '📐', tags: 'ruler math geometry' },
      { char: '🧮', tags: 'abacus calc math' },
      { char: '🔗', tags: 'link url chain' },
      { char: '🌐', tags: 'web globe internet' },
      { char: '🔌', tags: 'plugin api connect' },
    ],
  },
  {
    id: 'status',
    label: 'Statuts & Symboles',
    emojis: [
      { char: '✅', tags: 'done check ok green' },
      { char: '☑️', tags: 'checkbox done' },
      { char: '⏳', tags: 'wait pending hourglass' },
      { char: '🔄', tags: 'sync refresh progress' },
      { char: '🚀', tags: 'launch rocket fast' },
      { char: '🎯', tags: 'target goal aim' },
      { char: '💡', tags: 'idea light tip' },
      { char: '🔥', tags: 'fire hot urgent' },
      { char: '⚡', tags: 'zap fast power' },
      { char: '⭐', tags: 'star favorite' },
      { char: '🌟', tags: 'sparkle star' },
      { char: '✨', tags: 'sparkles magic' },
      { char: '⚠️', tags: 'warning alert' },
      { char: '🚨', tags: 'alarm urgent red' },
      { char: '🔒', tags: 'lock private security' },
      { char: '🔑', tags: 'key access password' },
    ],
  },
  {
    id: 'life',
    label: 'Créativité & Vie',
    emojis: [
      { char: '🧠', tags: 'brain think ai mind' },
      { char: '🎨', tags: 'art design color' },
      { char: '🎬', tags: 'video movie film' },
      { char: '🎵', tags: 'music audio' },
      { char: '📷', tags: 'camera photo image' },
      { char: '📅', tags: 'calendar date schedule' },
      { char: '🕒', tags: 'clock time' },
      { char: '🏠', tags: 'home house' },
      { char: '🌿', tags: 'plant nature green' },
      { char: '☕', tags: 'coffee break' },
      { char: '❤️', tags: 'heart love' },
      { char: '👍', tags: 'thumbs up like' },
      { char: '🎉', tags: 'party celebrate' },
      { char: '🏆', tags: 'trophy win' },
      { char: '💬', tags: 'chat comment' },
      { char: '🔔', tags: 'bell notify' },
    ],
  },
];

interface IconPickerProps {
  currentIcon?: string;
  anchorRect?: { top: number; left: number; bottom: number } | null;
  onSelect: (icon: string | undefined) => void;
  onClose: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  currentIcon,
  anchorRect,
  onSelect,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [customEmoji, setCustomEmoji] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleApplyCustom = () => {
    const val = customEmoji.trim();
    if (!val) return;
    onSelect(val);
    onClose();
  };

  const filteredEmojis = useMemo(() => {
    const q = search.trim().toLowerCase();
    const cats = activeCategory === 'all' ? EMOJI_CATEGORIES : EMOJI_CATEGORIES.filter((c) => c.id === activeCategory);
    return cats.map((cat) => ({
      ...cat,
      emojis: q
        ? cat.emojis.filter((e) => e.tags.includes(q) || e.char === q)
        : cat.emojis,
    })).filter((c) => c.emojis.length > 0);
  }, [search, activeCategory]);

  // Compute safe fixed position so it never clips inside overflow-hidden/truncate containers
  const fixedStyle: React.CSSProperties = anchorRect
    ? {
        position: 'fixed',
        top: Math.min(window.innerHeight - 310, anchorRect.bottom + 4),
        left: Math.min(window.innerWidth - 290, Math.max(8, anchorRect.left)),
        zIndex: 9999,
      }
    : {
        position: 'absolute',
        left: 0,
        top: '100%',
        marginTop: 4,
        zIndex: 9999,
      };

  return (
    <>
      <div
        className="fixed inset-0 z-[9998]"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        style={fixedStyle}
        onClick={(e) => e.stopPropagation()}
        className="w-72 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float p-2.5 text-xs animate-in fade-in duration-100"
      >
        {/* Header & Remove */}
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Select Icon / Emoji
          </span>
          {currentIcon && (
            <button
              type="button"
              onClick={() => {
                onSelect(undefined);
                onClose();
              }}
              className="text-[10px] text-red-500 hover:underline flex items-center gap-0.5"
            >
              <X className="w-3 h-3" />
              <span>Remove</span>
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search className="w-3 h-3 text-stone-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search emoji (folder, doc, star...)"
            autoFocus
            className="w-full pl-6 pr-2 py-1 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Custom / Any Emoji Input (paste or Win + .) */}
        <div className="flex items-center gap-1 mb-2">
          <input
            type="text"
            value={customEmoji}
            onChange={(e) => setCustomEmoji(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyCustom();
              }
            }}
            placeholder="Any emoji (paste or Win + .)"
            className="flex-1 px-2 py-1 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded-md text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleApplyCustom}
            disabled={!customEmoji.trim()}
            className="px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-semibold disabled:opacity-40 hover:bg-blue-700 transition"
          >
            Add
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-0.5">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
              activeCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400'
            }`}
          >
            All
          </button>
          {EMOJI_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ${
                activeCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-stone-100 dark:bg-zinc-800 text-stone-600 dark:text-zinc-400'
              }`}
            >
              {cat.label.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Emoji Grid */}
        <div className="max-h-48 overflow-y-auto space-y-2 pr-0.5">
          {filteredEmojis.length === 0 ? (
            <div className="text-center py-4 text-[11px] text-stone-400">No emoji found</div>
          ) : (
            filteredEmojis.map((cat) => (
              <div key={cat.id}>
                <div className="text-[10px] font-semibold text-stone-400 mb-1 px-0.5">
                  {cat.label}
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {cat.emojis.map((item) => (
                    <button
                      key={item.char}
                      type="button"
                      onClick={() => {
                        onSelect(item.char);
                        onClose();
                      }}
                      className={`w-7 h-7 flex items-center justify-center rounded-md hover:bg-stone-100 dark:hover:bg-zinc-800 text-base transition ${
                        currentIcon === item.char
                          ? 'bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-500'
                          : ''
                      }`}
                    >
                      {item.char}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};
