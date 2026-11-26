import { describe, it, expect } from 'vitest';
import {
  startOfWeek,
  isoDate,
  buildWeeks,
  aggregateByWeek,
  topExercisesByVolume,
} from '../week-aggregation';
import type { Session } from '../storage/types';

describe('startOfWeek', () => {
  it('returns the preceding Sunday at 00:00', () => {
    const d = new Date(2026, 7, 26); // Wed
    const out = startOfWeek(d);
    expect(out.getDay()).toBe(0);
    expect(out.getHours()).toBe(0);
    expect(isoDate(out)).toBe('2026-08-23');
  });

  it('keeps Sunday unchanged', () => {
    const d = new Date(2026, 7, 23); // Sun
    expect(isoDate(startOfWeek(d))).toBe('2026-08-23');
  });
});

describe('buildWeeks', () => {
  it('builds 4 oldest-first buckets', () => {
    const buckets = buildWeeks(4, new Date(2026, 7, 26));
    expect(buckets).toHaveLength(4);
    expect(buckets[0].key).toBe('2026-08-02');
    expect(buckets[1].key).toBe('2026-08-09');
    expect(buckets[2].key).toBe('2026-08-16');
    expect(buckets[3].key).toBe('2026-08-23');
  });

  it('initializes counters to zero', () => {
    const [b] = buildWeeks(1);
    expect(b.volume).toBe(0);
    expect(b.sessionCount).toBe(0);
    expect(b.durationSum).toBe(0);
    expect(b.durationCount).toBe(0);
  });
});

function completedSession(date: string, volume: number, duration?: number): Session {
  return {
    id: date,
    name: 'S',
    date,
    status: 'completed',
    ...(duration != null ? { duration } : {}),
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Bench',
        muscle: 'Pectoraux',
        sets: [
          {
            exerciseId: 'e1',
            setNumber: 1,
            weight: volume,
            reps: 1,
            type: 'work',
            completed: true,
          },
        ],
      },
    ],
  } as Session;
}

describe('aggregateByWeek', () => {
  it('aggregates volume and session count into buckets', () => {
    // Buckets are keyed by Sunday start; rollups land on the bucket whose
    // key equals the session's own (Sunday) date.
    const buckets = buildWeeks(2, new Date(2026, 7, 26)); // weeks 08-16, 08-23
    const sessions = [
      completedSession('2026-08-16', 100, 1200), // 08-16 bucket
      completedSession('2026-08-16', 50, 900), // 08-16 bucket
      completedSession('2026-08-23', 75), // 08-23 bucket
    ];
    aggregateByWeek(sessions, buckets);
    expect(buckets[0].key).toBe('2026-08-16');
    expect(buckets[0].volume).toBe(150);
    expect(buckets[0].sessionCount).toBe(2);
    expect(buckets[0].durationSum).toBe(2100);
    expect(buckets[0].durationCount).toBe(2);
    expect(buckets[1].volume).toBe(75);
    expect(buckets[1].sessionCount).toBe(1);
  });

  it('accepts full ISO dates (regression: stats page showed 0)', () => {
    const buckets = buildWeeks(1, new Date(2026, 10, 17));
    aggregateByWeek([completedSession('2026-11-17T10:00:00.000Z', 100, 1200)], buckets);
    // 17 novembre 2026 = mardi → bucket du dimanche 15 novembre.
    expect(buckets[0].key).toBe('2026-11-15');
    expect(buckets[0].volume).toBe(100);
    expect(buckets[0].sessionCount).toBe(1);
  });

  it('ignores sessions outside range and non-completed', () => {
    const buckets = buildWeeks(1, new Date(2026, 7, 26));
    aggregateByWeek([completedSession('2026-08-01', 999)], buckets);
    expect(buckets[0].volume).toBe(0);
  });
});

describe('topExercisesByVolume', () => {
  it('returns top N exercises by volume desc', () => {
    const sessions = [
      {
        ...completedSession('2026-08-23', 100),
        exercises: [
          {
            exerciseId: 'a',
            name: 'A',
            muscle: 'Pectoraux',
            sets: [
              {
                exerciseId: 'a',
                setNumber: 1,
                weight: 100,
                reps: 3,
                type: 'work',
                completed: true,
              },
            ],
          },
          {
            exerciseId: 'b',
            name: 'B',
            muscle: 'Dos',
            sets: [
              {
                exerciseId: 'b',
                setNumber: 1,
                weight: 100,
                reps: 5,
                type: 'work',
                completed: true,
              },
            ],
          },
        ],
      } as Session,
    ];
    const top = topExercisesByVolume(sessions, 1, 12, new Date(2026, 7, 24));
    expect(top).toHaveLength(1);
    expect(top[0].exerciseId).toBe('b'); // 500 > 300
  });

  it('inclut toute la semaine courante, pas seulement son dimanche', () => {
    // 24 août 2026 = lundi : la semaine commence le dimanche 23 août.
    // Une séance du lundi doit compter dans la fenêtre « semaine courante ».
    const session = {
      ...completedSession('2026-08-24', 0),
      exercises: [
        {
          exerciseId: 'monday',
          name: 'Monday',
          muscle: 'Pectoraux',
          sets: [
            {
              exerciseId: 'monday',
              setNumber: 1,
              weight: 100,
              reps: 3,
              type: 'work',
              completed: true,
            },
          ],
        },
      ],
    } as Session;
    const top = topExercisesByVolume([session], 5, 1, new Date(2026, 7, 24));
    expect(top.map((t) => t.exerciseId)).toContain('monday');
  });
});
