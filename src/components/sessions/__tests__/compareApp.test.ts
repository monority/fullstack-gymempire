import { describe, expect, it } from 'vitest';
import {
  bestSet,
  buildUnionRows,
  createComparisonApp,
  delta,
  exerciseVolume,
  totalSets,
} from '../compareApp';
import type { Session } from '../../../lib/storage/types';

const labels = {
  comparer: {
    completed: 'Terminée',
    inProgress: 'En cours',
    planned: 'Prévue',
    volumeMore: 'Plus de volume',
    volumeLess: 'Moins de volume',
    volumeEqual: 'Volume égal',
    exercisesMore: 'Plus d’exercices',
    exercisesLess: 'Moins d’exercices',
    exercisesEqual: 'Autant d’exercices',
    setsMore: 'Plus de séries',
    setsLess: 'Moins de séries',
    setsEqual: 'Autant de séries',
    best1RM: 'Meilleur 1RM',
    best1RMLower: '1RM inférieur',
    best1RMSame: '1RM identique',
  },
  rapide: {
    typeWarmup: 'Échauffement',
    typeWork: 'Travail',
    typeTop: 'Top',
    typeDrop: 'Drop',
    typeFailure: 'Échec',
  },
  status: { completed: 'Terminée', inProgress: 'En cours', planned: 'Prévue' },
} as never;

function session(id: string, weight: number): Session {
  return {
    id,
    name: 'Séance ' + id,
    date: '2026-11-1' + id.slice(-1) + 'T10:00:00Z',
    status: 'completed',
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Squat',
        muscle: 'Cuisses',
        sets: [
          { exerciseId: 'e1', setNumber: 1, type: 'work', weight, reps: 5, completed: true },
          { exerciseId: 'e1', setNumber: 2, type: 'work', weight, reps: 5, completed: false },
        ],
      },
    ],
  } as Session;
}

describe('comparison pure helpers', () => {
  it('computes deltas in both directions', () => {
    expect(delta(10, 10, 'up', 'down', 'equal', String)).toEqual({
      direction: 'equal',
      label: 'equal',
      diff: 0,
    });
    expect(delta(10, 12, 'up', 'down', 'equal', String)).toEqual({
      direction: 'up',
      label: 'up (+2)',
      diff: 2,
    });
    expect(delta(10, 8, 'up', 'down', 'equal', String)).toEqual({
      direction: 'down',
      label: 'down (-2)',
      diff: 2,
    });
  });

  it('counts only completed sets for volume, all sets for count', () => {
    const s = session('s1', 100);
    expect(exerciseVolume(s.exercises[0])).toBe(500);
    expect(totalSets(s)).toBe(2);
    expect(bestSet(s)).toBeGreaterThan(0);
  });

  it('unions exercises from both sessions', () => {
    const s1 = session('s1', 100);
    const s2 = {
      ...session('s2', 120),
      exercises: [],
    } as Session;
    const rows = buildUnionRows(s1, s2);
    expect(rows).toHaveLength(1);
    expect(rows[0].session1Ex).toBeDefined();
    expect(rows[0].session2Ex).toBeUndefined();
    expect(buildUnionRows(null, null)).toEqual([]);
  });
});

describe('createComparisonApp', () => {
  it('syncs the URL from the selected ids', () => {
    const replaced: string[] = [];
    const app = createComparisonApp({
      search: '',
      pathname: '/sessions/compare',
      labels,
      ui: { replaceUrl: (url) => replaced.push(url) },
    });
    app.session1Id = 's1';
    app.onSession1Change('s1');
    expect(replaced[0]).toBe('/sessions/compare?id1=s1');
    app.session2Id = 's2';
    app.onSession2Change('s2');
    expect(replaced[1]).toBe('/sessions/compare?id1=s1&id2=s2');
  });

  it('formats session options with a compact date', () => {
    const app = createComparisonApp({
      search: '',
      pathname: '/sessions/compare',
      labels,
      ui: { replaceUrl: () => {} },
    });
    expect(app.formatOption(session('s1', 100))).toContain('Séance s1');
    expect(app.statusLabel('completed')).toBe('Terminée');
    expect(app.typeLabel('work')).toBe('Travail');
  });
});
