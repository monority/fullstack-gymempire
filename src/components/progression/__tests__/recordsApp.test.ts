import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getSessions: vi.fn() }));
vi.mock('../../../lib/storage/sessions', () => ({ getSessions: mocks.getSessions }));

import { createRecordsApp } from '../recordsApp';
import type { Session } from '../../../lib/storage/types';

const labels = {
  on: 'le',
  exercisesTracked: 'exercices suivis',
  exerciseTracked: 'exercice suivi',
  kg: 'kg',
  viewHistoryAriaPrefix: 'Historique de ',
};

function session(date: string, weight = 100, reps = 5): Session {
  return {
    id: date,
    name: 'Séance',
    date,
    status: 'completed',
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Squat',
        muscle: 'Cuisses',
        sets: [{ exerciseId: 'e1', setNumber: 1, type: 'work', weight, reps, completed: true }],
      },
    ],
  } as Session;
}

function create() {
  return createRecordsApp({
    labels,
    today: () => new Date('2026-11-17T12:00:00Z'),
    locale: 'fr',
    localizedPath: (p) => p,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSessions.mockReturnValue([]);
});

describe('createRecordsApp (D8)', () => {
  it('reports no data when no completed set exists', () => {
    const app = create();
    app.init();
    expect(app.hasData).toBe(false);
    expect(app.allRecords).toEqual([]);
  });

  it('accumulates the best 1RM per exercise and counts sessions', () => {
    mocks.getSessions.mockReturnValue([
      session('2026-11-01T10:00:00Z', 80, 8),
      session('2026-11-16T10:00:00Z', 100, 5),
    ]);
    const app = create();
    app.init();
    expect(app.allRecords).toHaveLength(1);
    expect(app.totalPRs).toBe(1);
    expect(app.allRecords[0].sessionCount).toBe(2);
    expect(app.allRecords[0].bestWeight).toBe(100);
    expect(app.allRecords[0].date).toBe('2026-11-16T10:00:00Z');
    expect(app.bestOverall1RM).toBeGreaterThan(0);
    expect(app.bestOverallExercise).toBe('Squat');
  });

  it('counts recent PRs against the injected clock', () => {
    mocks.getSessions.mockReturnValue([
      session('2026-11-16T10:00:00Z'),
      session('2026-09-01T10:00:00Z'),
    ]);
    const app = create();
    app.init();
    expect(app.recentPRs).toBe(1);
  });

  it('filters and sorts records by name and recency', () => {
    mocks.getSessions.mockReturnValue([
      session('2026-11-01T10:00:00Z'),
      {
        ...session('2026-11-02T10:00:00Z'),
        exercises: [
          {
            exerciseId: 'e2',
            name: 'Bench',
            muscle: 'Pectoraux',
            sets: [
              {
                exerciseId: 'e2',
                setNumber: 1,
                type: 'work',
                weight: 60,
                reps: 8,
                completed: true,
              },
            ],
          },
        ],
      } as Session,
    ]);
    const app = create();
    app.init();
    app.sortBy = 'name';
    expect(app.filteredRecords.map((r) => r.name)).toEqual(['Bench', 'Squat']);
    app.search = 'bench';
    expect(app.filteredRecords).toHaveLength(1);
    app.search = '';
    app.sortBy = 'recent';
    expect(app.filteredRecords[0].name).toBe('Bench');
  });

  it('builds the history href from the injected path helper', () => {
    const app = create();
    expect(app.historyHref('e1')).toBe('/exercises/history?id=e1');
  });
});
