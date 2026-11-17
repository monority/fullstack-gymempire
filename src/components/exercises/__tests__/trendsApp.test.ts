import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getExercises: vi.fn(),
  getExerciseById: vi.fn(),
  getSessions: vi.fn(),
}));
vi.mock('../../../lib/storage/exercises', () => ({
  getExercises: mocks.getExercises,
  getExerciseById: mocks.getExerciseById,
}));
vi.mock('../../../lib/storage/sessions', () => ({ getSessions: mocks.getSessions }));

import { createTrendsApp } from '../trendsApp';
import type { Exercise, Session } from '../../../lib/storage/types';

const labels = {
  historiqueSessions: 'séances',
  historiqueSessionSingular: 'séance',
  chartVolumeTitle: 'Volume',
  chart1RMTitle: '1RM',
  noSessions: 'Aucune séance',
  minPoints: 'Pas assez de points',
  kg: 'kg',
};

function exercise(): Exercise {
  return { id: 'e1', name: 'Squat', muscle: 'Cuisses', category: 'Barre' } as Exercise;
}

function create(search = '') {
  return createTrendsApp({
    search,
    labels,
    translateExercise: (name) => 'TR:' + name,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getExercises.mockReturnValue([exercise(), { ...exercise(), id: 'e2', name: 'Bench' }]);
  mocks.getExerciseById.mockImplementation((id: string) => (id === 'e1' ? exercise() : undefined));
  mocks.getSessions.mockReturnValue([]);
});

describe('createTrendsApp', () => {
  it('selects the first exercise by default', () => {
    const app = create();
    app.init();
    expect(app.notFound).toBe(false);
    expect(app.selectedId).toBe('e1');
    expect(app.exercise?.name).toBe('Squat');
  });

  it('accepts an exercise id or name from the URL', () => {
    const byId = create('?ex=e1');
    byId.init();
    expect(byId.selectedId).toBe('e1');
    const byName = create('?ex=Bench');
    byName.init();
    expect(byName.selectedId).toBe('e2');
    const missing = create('?ex=inconnu');
    missing.init();
    expect(missing.notFound).toBe(true);
  });

  it('marks not found with an empty catalog', () => {
    mocks.getExercises.mockReturnValue([]);
    const app = create();
    app.init();
    expect(app.notFound).toBe(true);
  });

  it('switches exercises without reloading', () => {
    const app = create();
    app.init();
    app.onExerciseChange('e2');
    expect(app.exercise?.name).toBe('Bench');
    expect(app.selectedId).toBe('e2');
  });

  it('builds chart metadata and titles from injected labels', () => {
    const app = create();
    app.init();
    expect(app.chartTitle).toBe('TR:Squat - Volume');
    app.metric = 'rm';
    expect(app.chartTitle).toBe('TR:Squat - 1RM');
    expect(app.chartMeta).toBe('0 séance');
    expect(app.emptyMessage).toBe(labels.noSessions);
    expect(app.chartLinePoints).toBe('');
    expect(app.chartAreaPoints).toBe('');
  });

  it('keeps chart geometry deterministic', () => {
    mocks.getSessions.mockReturnValue([
      {
        id: 's1',
        name: 'Séance',
        date: '2026-11-17T10:00:00Z',
        status: 'completed',
        exercises: [
          {
            exerciseId: 'e1',
            name: 'Squat',
            muscle: 'Cuisses',
            sets: [
              {
                exerciseId: 'e1',
                setNumber: 1,
                type: 'work',
                weight: 100,
                reps: 5,
                completed: true,
              },
            ],
          },
        ],
      } as Session,
    ]);
    const app = create();
    app.init();
    expect(app.points.length).toBeGreaterThan(0);
    expect(app.chartGridMarkup).toContain('<line');
    expect(app.chartDotsMarkup).toContain('<circle');
    expect(app.chartAreaPoints).toContain('300');
  });
});
