// @vitest-environment jsdom
/** Vérifie que le pont timer ne laisse pas de listeners/canaux après navigation SPA. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dictionary } from '../../../i18n/types';

const mocks = vi.hoisted(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  clearInterval: vi.fn(),
  clearTimeout: vi.fn(),
  close: vi.fn(),
  constructor: vi.fn(),
}));

const labels = {
  title: 'Timer',
  countdown: 'Décompte',
  stopwatch: 'Chrono',
  custom: 'Personnalisé',
  start: 'Démarrer',
  restart: 'Recommencer',
  resume: 'Reprendre',
  pause: 'Pause',
  reset: 'Réinitialiser',
  lap: 'Tour',
  lapTime: 'Temps',
  total: 'Total',
  soundAlert: 'Son',
  running: 'En cours',
  paused: 'En pause',
  ready: 'Prêt',
  done: 'Terminé',
  popout: 'Détacher',
  popoutAria: 'Détacher la fenêtre',
  popoutOpen: 'Fenêtre ouverte',
  shortcutsToggle: 'Raccourcis',
  shortcutsReset: 'Raccourcis',
  spaceKey: 'Espace',
} as unknown as Dictionary['timer'];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    'BroadcastChannel',
    class {
      onmessage: ((ev: MessageEvent) => void) | null = null;
      constructor() {
        mocks.constructor();
      }
      postMessage() {}
      close() {
        mocks.close();
      }
    }
  );
  vi.spyOn(document, 'addEventListener').mockImplementation(mocks.addEventListener);
  vi.spyOn(document, 'removeEventListener').mockImplementation(mocks.removeEventListener);
  vi.spyOn(window, 'clearInterval').mockImplementation(mocks.clearInterval);
  vi.spyOn(window, 'clearTimeout').mockImplementation(mocks.clearTimeout);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('createTimerApp — cycle de vie', () => {
  it('retire le listener visibilitychange et ferme le canal à la destruction', async () => {
    const { createTimerApp } = await import('../timerApp');
    const app = createTimerApp({
      labels,
      labelSource: {} as Dictionary,
      now: () => 1_000_000,
      randomId: () => 'abcdef12',
      localizedPath: (p) => p,
    });

    app.init();
    expect(mocks.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
    expect(mocks.constructor).toHaveBeenCalledTimes(1);

    app.destroy();
    expect(mocks.removeEventListener).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function)
    );
    expect(mocks.close).toHaveBeenCalledTimes(1);
    expect(app._onVisibility).toBeNull();
  });

  it('est idempotent : une seconde destruction ne ferme rien de plus', async () => {
    const { createTimerApp } = await import('../timerApp');
    const app = createTimerApp({
      labels,
      labelSource: {} as Dictionary,
      now: () => 1_000_000,
      randomId: () => 'abcdef12',
      localizedPath: (p) => p,
    });

    app.init();
    app.destroy();
    app.destroy();
    expect(mocks.close).toHaveBeenCalledTimes(1);
    expect(mocks.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
