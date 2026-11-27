import { describe, expect, it } from 'vitest';
import { filterExercises } from '../exercisePicker';
import type { Exercise } from '../../../lib/storage/types';

const exercise = (overrides: Partial<Exercise>): Exercise => ({
  id: overrides.id ?? 'exercise',
  name: overrides.name ?? 'Exercise',
  muscle: overrides.muscle ?? 'Pectoraux',
  category: overrides.category ?? 'Force',
  favorite: overrides.favorite ?? false,
  createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
});

describe('filterExercises', () => {
  it('filters by search and excludes exercises already in the session', () => {
    const result = filterExercises(
      [
        exercise({ id: 'bench', name: 'Développé couché', favorite: true }),
        exercise({ id: 'row', name: 'Rowing barre', muscle: 'Dos' }),
      ],
      new Set(['bench']),
      'développé'
    );

    expect(result).toEqual([]);
  });

  it('filters by muscle while keeping favorite exercises first', () => {
    const result = filterExercises(
      [
        exercise({ id: 'row', name: 'Rowing barre', muscle: 'Dos' }),
        exercise({ id: 'pull', name: 'Tractions', muscle: 'Dos', favorite: true }),
        exercise({ id: 'squat', name: 'Squat', muscle: 'Jambes' }),
      ],
      new Set(),
      '',
      'Dos'
    );

    expect(result.map((item) => item.id)).toEqual(['pull', 'row']);
  });

  it('matches search case-insensitively and sorts alphabetically', () => {
    const result = filterExercises(
      [exercise({ id: 'z', name: 'Z-Press' }), exercise({ id: 'a', name: 'Arnold press' })],
      new Set(),
      'PRESS'
    );

    expect(result.map((item) => item.id)).toEqual(['a', 'z']);
  });
});

describe('buildNewExercise', () => {
  it('pré-remplit la série depuis la séance la plus récente', async () => {
    const { buildNewExercise } = await import('../exercisePicker');
    const sessions = [
      {
        id: 'old',
        date: '2026-11-01',
        name: 'Ancienne',
        status: 'completed' as const,
        exercises: [
          {
            exerciseId: 'bench',
            name: 'Développé',
            muscle: 'Pectoraux',
            sets: [
              {
                exerciseId: 'bench',
                setNumber: 1,
                type: 'work' as const,
                weight: 60,
                reps: 10,
                completed: true,
              },
            ],
          },
        ],
      },
      {
        id: 'recent',
        date: '2026-11-20',
        name: 'Récente',
        status: 'completed' as const,
        exercises: [
          {
            exerciseId: 'bench',
            name: 'Développé',
            muscle: 'Pectoraux',
            sets: [
              {
                exerciseId: 'bench',
                setNumber: 1,
                type: 'work' as const,
                weight: 80,
                reps: 8,
                completed: true,
              },
            ],
          },
        ],
      },
    ];

    const built = buildNewExercise(exercise({ id: 'bench' }), sessions as never);
    expect(built.sets).toHaveLength(1);
    expect(built.sets[0]).toMatchObject({ weight: 80, reps: 8, type: 'work', completed: false });
  });

  it('laisse zéro quand aucun historique exploitable', async () => {
    const { buildNewExercise } = await import('../exercisePicker');
    const built = buildNewExercise(exercise({ id: 'bench' }));
    expect(built.sets[0]).toMatchObject({ weight: 0, reps: 0 });
  });
});
