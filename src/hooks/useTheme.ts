import { useCallback, useEffect } from 'react';
import { parseTheme } from '../lib/parse';
import type { Theme } from '../types';
import { useLocalStorage } from './useLocalStorage';

/**
 * Тема оформления. Пока пользователь не выбрал вручную (theme === null),
 * действует системная настройка (prefers-color-scheme) — это делает CSS.
 */
export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme | null>('theme', parseTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme) root.dataset.theme = theme;
    else delete root.dataset.theme;
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const effective = current ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      return effective === 'dark' ? 'light' : 'dark';
    });
  }, [setTheme]);

  return { theme, toggleTheme };
}
