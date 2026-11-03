import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { clearCache } from '../lib/api';

// В jsdom нет matchMedia и scrollIntoView — подставляем простые заглушки.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: true, // «тёмная системная тема»
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }),
});
Element.prototype.scrollIntoView = () => {};

afterEach(() => {
  cleanup();
  localStorage.clear();
  clearCache();
  vi.unstubAllGlobals();
  document.documentElement.removeAttribute('data-theme');
  document.body.removeAttribute('data-weather');
});
