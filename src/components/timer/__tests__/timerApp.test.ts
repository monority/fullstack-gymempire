import { describe, expect, it } from 'vitest';
import { createTimerApp } from '../timerApp';
import type { Dictionary } from '../../../i18n/types';

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
  shortcutsReset: 'Réinitialiser',
  spaceKey: 'Espace',
} as unknown as Dictionary['timer'] & {
  shortcutsToggle: string;
  shortcutsReset: string;
  spaceKey: string;
};

function create(now = 1_000_000) {
  const app = createTimerApp({
    labels,
    labelSource: {} as Dictionary,
    now: () => now,
    randomId: () => 'abcdef12',
    localizedPath: (p) => p,
  });
  return { app };
}

describe('createTimerApp (D8)', () => {
  it('exposes a deterministic snapshot with the injected clock and id', () => {
    const { app } = create(1_234_000);
    app.running = true;
    app.endTime = 1_240_000;
    const snapshot = app.snapshot();
    expect(snapshot.now).toBe(1_234_000);
    expect(snapshot.endAt).toBe(1_240_000);
    expect(snapshot.mode).toBe('countdown');
    expect(snapshot.totalTime).toBe(90);
    expect(snapshot.soundEnabled).toBe(true);
  });

  it('computes hero display from mode and state', () => {
    const { app } = create();
    expect(app.clockText).toBe('01:30');
    expect(app.clockClasses).toBe('timer__hero-clock');
    expect(app.modeStatusLabel).toBe(labels.ready);
    expect(app.toggleLabel).toBe(labels.start);

    app.remaining = 0;
    app.display = 0;
    expect(app.clockClasses).toContain('--done');
    expect(app.modeStatusLabel).toBe(labels.done);
    expect(app.toggleLabel).toBe(labels.restart);

    app.mode = 'stopwatch';
    app.sw.elapsed = 9000;
    expect(app.clockText).toBe('00:09.00');
    expect(app.swLapsReversed).toEqual([]);
  });

  it('derives the ring from the pure engine helper', () => {
    const { app } = create();
    expect(app.ringCircumference).toBeCloseTo(2 * Math.PI * 108);
    expect(app.ringOffset).toBe(0);
    app.mode = 'stopwatch';
    expect(app.ringOffset).toBe(0);
    expect(app.ringClasses).toContain('--paused');
  });

  it('clamps custom times through the injected bounds', () => {
    const { app } = create();
    app.customTime = 9999;
    app.setCustom();
    expect(app.customTime).toBe(600);
    app.adjustCustom(-1000);
    expect(app.customTime).toBe(5);
    app.setPreset(120);
    expect(app.customTime).toBe(120);
  });

  it('keeps the bridge out of the reactive store', () => {
    const { app } = create();
    expect(app).not.toHaveProperty('channel');
    expect(app).not.toHaveProperty('pipWindow');
    expect(app.popupOpen).toBe(false);
  });
});
