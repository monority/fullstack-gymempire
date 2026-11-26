/** Enregistrement Alpine extrait du shell (ratchet script). */
import { registerAlpine } from '../../lib/alpine';
import { createThemeApp } from './themeApp';

const ACCORDION_KEY = 'muscu:nav:collapsed';

export function registerTheme(): void {
  registerAlpine('themeApp', () =>
    createThemeApp({
      readTheme: () =>
        document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark',
      setThemeAttr: (theme) => document.documentElement.setAttribute('data-theme', theme),
      storeTheme: (theme) => {
        try {
          window.localStorage.setItem('muscu-theme', theme);
        } catch {}
      },
      readCollapsed: () => {
        try {
          const raw = window.localStorage.getItem(ACCORDION_KEY);
          const saved = raw ? JSON.parse(raw) : [];
          return Array.isArray(saved) ? saved : [];
        } catch {
          return [];
        }
      },
      storeCollapsed: (ids) => {
        try {
          window.localStorage.setItem(ACCORDION_KEY, JSON.stringify(ids));
        } catch {}
      },
    })
  );
}
