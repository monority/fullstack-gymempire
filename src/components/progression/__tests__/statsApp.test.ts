// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { dictionaries } from '../../../i18n';
import { STORAGE_KEYS } from '../../../lib/storage/defaults';
import { buildStatsDeps, createStatsApp } from '../statsApp';

const deps = () => buildStatsDeps(dictionaries.fr);

describe('createStatsApp', () => {
  beforeEach(() => window.localStorage.clear());

  it('agrège les séances et calcule la régularité', () => {
    window.localStorage.setItem(
      STORAGE_KEYS.sessions,
      JSON.stringify([
        {
          id: 's1',
          name: 'Push',
          date: '2026-11-17',
          status: 'completed',
          duration: 3600,
          exercises: [
            {
              exerciseId: 'e1',
              name: 'Développé couché barre',
              muscle: 'Pectoraux',
              sets: [
                {
                  exerciseId: 'e1',
                  setNumber: 1,
                  type: 'work',
                  weight: 80,
                  reps: 8,
                  completed: true,
                },
              ],
            },
          ],
        },
      ])
    );

    const app = createStatsApp(deps());
    app.init();

    expect(app.weeks12).toHaveLength(12);
    expect(app.sessions12w).toBe(1);
    expect(app.hasCompletedSessions).toBe(true);
    expect(app.consistencyPct).toBeGreaterThanOrEqual(0);
  });

  it('expose les helpers de formatage et les SVG', () => {
    const app = createStatsApp(deps());
    app.init();

    expect(app.period).toBe('week');
    expect(app.periodMeta).toBe(deps().labels.volumeLast7d);
    expect(typeof app.renderVolumeChart()).toBe('string');
    expect(typeof app.renderBenchmarksTable()).toBe('string');
    expect(app.formatDuration(65)).toBe('1:05');
    expect(app.formatDuration(3600)).toBe('1:00:00');
    expect(app.formatDuration(5700)).toBe('1:35:00');
  });
});
