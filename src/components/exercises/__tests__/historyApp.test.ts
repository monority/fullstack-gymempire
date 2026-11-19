import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dictionary } from '../../../i18n/types';

const mocks = vi.hoisted(() => ({
  getExerciseById: vi.fn(),
  getSessions: vi.fn(),
}));

vi.mock('../../../lib/storage/exercises', () => ({ getExerciseById: mocks.getExerciseById }));
vi.mock('../../../lib/storage/sessions', () => ({ getSessions: mocks.getSessions }));

import { createHistoryApp } from '../historyApp';
import type { Exercise, Session } from '../../../lib/storage/types';

const LABELS = {
  typeWarmup: 'Échauffement',
  typeWork: 'Travail',
  typeTop: 'Top',
  typeDrop: 'Drop',
  typeFailure: 'Échec',
  sessions: 'séances',
  sessionSingular: 'séance',
  sets: 'séries',
  best1RM: 'Meilleur 1RM',
  kg: 'kg',
} as unknown as Dictionary['historique'] & { kg: string };

function exercise(): Exercise {
  return { id: 'e1', name: 'Squat', muscle: 'Cuisses', category: 'Barre' } as Exercise;
}

function session(date: string, weight = 100, reps = 5, completed = true): Session {
  return {
    id: date,
    name: 'Séance A',
    date,
    status: 'completed',
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Squat',
        muscle: 'Cuisses',
        sets: [{ exerciseId: 'e1', setNumber: 1, type: 'work', weight, reps, completed }],
      },
    ],
  } as Session;
}

function create(search = '?id=e1') {
  return createHistoryApp({ search, labels: LABELS });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getExerciseById.mockReturnValue(exercise());
  mocks.getSessions.mockReturnValue([]);
});

describe('createHistoryApp', () => {
  it('marks not found without an id', () => {
    const app = create('');
    app.init();
    expect(app.notFound).toBe(true);
  });

  it('marks not found for an unknown exercise', () => {
    mocks.getExerciseById.mockReturnValue(undefined);
    const app = create('?id=inconnu');
    app.init();
    expect(app.notFound).toBe(true);
  });

  it('computes history, chart points and stats from completed sets', () => {
    mocks.getSessions.mockReturnValue([
      session('2026-11-01T10:00:00Z', 80, 8),
      session('2026-11-16T10:00:00Z', 100, 5),
      session('2026-11-16T11:00:00Z', 120, 3, false),
    ]);
    const app = create();
    app.init();

    expect(app.history).toHaveLength(2);
    expect(app.chartData.map((p) => p.date)).toEqual([
      '2026-11-01T10:00:00Z',
      '2026-11-16T10:00:00Z',
    ]);
    expect(app.bestWeight).toBe(100);
    expect(app.maxReps).toBe(8);
    expect(app.totalVolume).toBe(80 * 8 + 100 * 5);
    expect(app.sessionCount).toBe(2);
    expect(app.historyDesc[0].date).toBe('2026-11-16T10:00:00Z');
  });

  it('keeps the chart geometry deterministic', () => {
    mocks.getSessions.mockReturnValue([session('2026-11-16T10:00:00Z')]);
    const app = create();
    app.init();
    expect(app.chartX(0)).toBe(400);
    expect(app.chartY(0)).toBe(300);
    expect(app.chartMax).toBeGreaterThan(0);
    expect(app.chartAreaPoints).toContain('400,300');
    expect(app.chartGridMarkup).toContain('<line');
    expect(app.chartDotsMarkup).toContain('<circle');
  });

  it('formats RPE with the injected labels', () => {
    const app = create();
    expect(app.typeLabel('work')).toBe('Travail');
    expect(app.formatRpe({ rpe: 7.5, rpeType: 'rpe' } as never)).toBe('RPE 7.5');
    expect(app.formatRpe({ rpe: 7, rpeType: 'urpe' } as never)).toBe('uRPE 7');
    expect(app.formatRpe({ rpe: null } as never)).toBe('-');
  });
});
