import { useState, useEffect } from 'react';
import { ThemeMode, ThemePreset } from '../db/types';
import { settingsStorage } from '../db/db';

const ALL_PRESET_CLASSES = [
  'theme-preset-default-light',
  'theme-preset-warm',
  'theme-preset-cool',
  'theme-preset-soft-gray',
  'theme-preset-midnight-dark',
  'theme-preset-deep-dark',
];

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [themePreset, setThemePresetState] = useState<ThemePreset>('default-light');
  const [accentColor, setAccentColorState] = useState<string>('#2563eb');

  useEffect(() => {
    // Initial fetch from storage
    settingsStorage.get().then((settings) => {
      if (settings?.theme) {
        setThemeState(settings.theme);
      }
      if (settings?.themePreset) {
        setThemePresetState(settings.themePreset);
      }
      if (settings?.accentColor) {
        setAccentColorState(settings.accentColor);
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

      // Apply preset classes
      ALL_PRESET_CLASSES.forEach((c) => root.classList.remove(c));
      if (themePreset === 'warm-light') root.classList.add('theme-preset-warm');
      else if (themePreset === 'cool-light') root.classList.add('theme-preset-cool');
      else if (themePreset === 'soft-gray') root.classList.add('theme-preset-soft-gray');
      else if (themePreset === 'midnight-dark') root.classList.add('theme-preset-midnight-dark');
      else if (themePreset === 'deep-dark') root.classList.add('theme-preset-deep-dark');

      root.setAttribute('data-theme-preset', themePreset);
      if (accentColor) {
        root.style.setProperty('--primary-accent', accentColor);
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
  }, [theme, themePreset, accentColor]);

  const setTheme = async (newTheme: ThemeMode, newPreset?: ThemePreset, newAccent?: string) => {
    setThemeState(newTheme);
    const updates: any = { theme: newTheme };
    if (newPreset) {
      setThemePresetState(newPreset);
      updates.themePreset = newPreset;
    }
    if (newAccent) {
      setAccentColorState(newAccent);
      updates.accentColor = newAccent;
      document.documentElement.style.setProperty('--primary-accent', newAccent);
    }
    await settingsStorage.set(updates);
  };

  return { theme, themePreset, accentColor, setTheme };
}
