// Template de factory Alpine — à copier vers src/components/<domaine>/xApp.ts.
// Voir docs/componentization-rules.md §5.
import type { Dictionary } from '../../i18n/types';
import type { UiStore } from '../../lib/ui-store';

export interface XAppDeps {
  labels: Dictionary['sessions'];
  locale(): 'fr' | 'en';
  today(): Date; // jamais de new Date() dans la factory
  navigate(path: string): void;
  onError(error: unknown): void;
  ui: UiStore; // adaptation via $store.ui, jamais window.showToast
}

export interface XApp {
  items: Item[];
  isLoading: boolean;
  init(): void;
  retry(): void;
}

export function createXApp(deps: XAppDeps): XApp {
  return {
    items: [],
    isLoading: false,

    init() {
      this.retry();
    },

    retry() {
      this.isLoading = true;
      try {
        this.items = []; // charger via lib/storage/*
      } catch (error) {
        deps.onError(error);
        deps.ui.notify(deps.labels.loadError, 'error');
      } finally {
        this.isLoading = false;
      }
    },
  };
}

// Enregistrement dans la page (bloc <script> de ~5 lignes) :
//   import { registerAlpine } from '../../lib/alpine';
//   registerAlpine('xApp', () => createXApp({ labels, ui, locale, today, navigate, onError }));
// Test : src/components/<domaine>/__tests__/xApp.test.ts avec des deps mockées.
