import { useState, useEffect } from 'react';
import { ThemeMode } from '../db/types';
import { settingsStorage } from '../db/db';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system');

  useEffect(() => {
    // Initial fetch from storage
    settingsStorage.get().then((settings) => {
      if (settings?.theme) {
        setThemeState(settings.theme);
      }
      if (settings?.accentColor) {
        document.documentElement.style.setProperty('--primary-accent', settings.accentColor);
      }
    });
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let isDark = false;
      if (theme === 'dark') {
        isDark = true;
      } else if (theme === 'light') {
        isDark = false;
      } else {
        isDark = mediaQuery.matches;
      }

      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const listener = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = async (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    await settingsStorage.set({ theme: newTheme });
  };

  return { theme, setTheme };
}

