import React, { useState } from 'react';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const COMMON_EMOJIS = [
  '💡', '✨', '📝', '📌', '🚀', '🎯', '🔥', '⭐',
  '✅', '⏳', '🔍', '📊', '🎨', '⚙️', '📂', '🔒',
  '❤️', '👍', '🎉', '🧠', '🌿', '☕', '💻', '📚',
  '💬', '🔔', '🏷️', '📎', '⚡', '🌟', '🛠️', '📈',
];

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customEmoji, setCustomEmoji] = useState('');

  const handleAddCustom = () => {
    const val = customEmoji.trim();
    if (!val) return;
    onSelect(val);
    setCustomEmoji('');
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-stone-600 dark:text-zinc-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-zinc-800 rounded transition"
        title="Insert Emoji"
      >
        <Smile className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 mt-1 z-50 p-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg shadow-float w-60 space-y-2">
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={customEmoji}
                onChange={(e) => setCustomEmoji(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                placeholder="Any emoji (paste or Win + .)"
                className="flex-1 px-2 py-1 bg-stone-50 dark:bg-zinc-800 border border-stone-200 dark:border-zinc-700 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                disabled={!customEmoji.trim()}
                className="px-2 py-1 rounded bg-blue-600 text-white text-[10px] font-semibold disabled:opacity-40"
              >
                Add
              </button>
            </div>
            <div className="grid grid-cols-8 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSelect(emoji);
                    setIsOpen(false);
                  }}
                  className="w-6 h-6 flex items-center justify-center text-sm hover:bg-stone-100 dark:hover:bg-zinc-800 rounded transition"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

