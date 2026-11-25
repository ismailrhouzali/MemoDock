import React from 'react';
import { X } from 'lucide-react';

const CURATED_ICONS = [
  '📄', '📝', '📚', '📖', '📓', '🗂️', '📁', '📂',
  '💡', '🎯', '🚀', '⚡', '🔥', '⭐', '🔖', '📌',
  '💻', '⚙️', '🛠️', '🧪', '🔬', '📊', '📈', '🗄️',
  '🎨', '🎬', '🎵', '📷', '🧠', '🌐', '🔒', '🔑',
  '✅', '📅', '🕒', '🎓', '💼', '🏠', '❤️', '✨',
];

interface IconPickerProps {
  currentIcon?: string;
  onSelect: (icon: string | undefined) => void;
  onClose: () => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  currentIcon,
  onSelect,
  onClose,
}) => {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); onClose(); }} />
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute left-0 top-full mt-1 z-50 w-60 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-xl shadow-float p-2.5 text-xs animate-in fade-in duration-100"
      >
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
            Choose Icon
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
        <div className="grid grid-cols-8 gap-1">
          {CURATED_ICONS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                onClose();
              }}
              className={`w-6 h-6 flex items-center justify-center rounded hover:bg-stone-100 dark:hover:bg-zinc-800 text-sm transition ${
                currentIcon === emoji ? 'bg-blue-50 dark:bg-blue-950/50 ring-1 ring-blue-500' : ''
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
