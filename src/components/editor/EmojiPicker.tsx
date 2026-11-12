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
          <div className="absolute left-0 mt-1 z-50 p-2 bg-white dark:bg-zinc-900 border border-stone-200 dark:border-zinc-800 rounded-lg shadow-float w-56 grid grid-cols-8 gap-1">
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
        </>
      )}
    </div>
  );
};

