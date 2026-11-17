// @vitest-environment jsdom
/**
 * C4 + C5 (plan-execution.md) — snapshot versioning, migrations and
 * boundary filtering for exportAllData / importAllData.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { exportAllData, importAllData, SNAPSHOT_VERSION } from '../storage/backup';
import { STORAGE_KEYS } from '../storage/defaults';
import { getSessions } from '../storage/sessions';
import { getSettings } from '../storage/settings';

function clearLocalStorage(): void {
  try {
    window.localStorage.clear();
  } catch {
    // ignore
  }
}

beforeEach(clearLocalStorage);
afterEach(clearLocalStorage);

describe('importAllData — C4', () => {
  it('imports a valid v1 snapshot and normalizes the data', () => {
    const snapshot = {
      version: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      exercises: [
        {
          id: 'e1',
          name: 'Squat barre',
          muscle: 'Quadriceps',
          category: 'Barre',
          createdAt: '2026-01-01',
        },
      ],
      sessions: [
        {
          id: 's1',
          name: 'Test',
          date: '2026-01-02',
          status: 'completed',
          exercises: [
            {
              exerciseId: 'e1',
              name: 'Squat barre',
              muscle: 'Quadriceps',
              sets: [
                {
                  exerciseId: 'e1',
                  setNumber: '1',
                  weight: '80',
                  reps: '5',
                  type: 'work',
                  completed: true,
                },
              ],
            },
          ],
        },
      ],
      progress: [],
      body: [],
      settings: { unit: 'kg' },
    };
    importAllData(snapshot);
    const sessions = getSessions();
    expect(sessions).toHaveLength(1);
    // Numeric fields normalized at the boundary (string inputs → numbers).
    expect(sessions[0].exercises[0].sets[0].weight).toBe(80);
    expect(sessions[0].exercises[0].sets[0].reps).toBe(5);
    // Settings merged with defaults (partial payload).
    expect(getSettings().weeklyGoal).toBe(3);
    expect(getSettings().reminders.days).toEqual([1, 3, 5]);
  });

  it('rejects a future version with an explicit message', () => {
    expect(() => importAllData({ version: SNAPSHOT_VERSION + 1, exercises: [] })).toThrow(
      /trop récente/
    );
  });

  it('rejects a missing version', () => {
    expect(() => importAllData({ exercises: [] })).toThrow(/Version de sauvegarde manquante/);
  });

  it('rejects a non-object payload', () => {
    expect(() => importAllData('garbage')).toThrow(/invalide/);
    expect(() => importAllData(null)).toThrow(/invalide/);
  });

  it('applies defaults for a partial payload (no settings key)', () => {
    importAllData({ version: 1 });
    expect(getSettings().unit).toBe('kg');
    expect(getSettings().defaultRestTime).toBe(90);
  });

  it('applies registered migrations to older snapshots (C4 table)', () => {
    // The migration table is empty at v1; a v1 snapshot must import untouched.
    const snapshot = { version: 1, sessions: [], exercises: [], progress: [], body: [] };
    expect(() => importAllData(snapshot)).not.toThrow();
  });
});

describe('importAllData — C5 boundary filtering', () => {
  it('filters corrupted progress records instead of storing them silently', () => {
    const snapshot = {
      version: 1,
      exercises: [],
      sessions: [],
      body: [],
      progress: [
        { exerciseId: 'e1', date: '2026-01-01', estimated1RM: 100, bestWeight: 80, bestReps: 5 },
        { exerciseId: 'e2', date: '2026-01-01' }, // incomplet → filtré
        'garbage', // non-objet → filtré
        null, // filtré
      ],
    };
    importAllData(snapshot);
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.progress) || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].exerciseId).toBe('e1');
  });

  it('filters corrupted exercises, sessions and body records', () => {
    const snapshot = {
      version: 1,
      exercises: [{ id: 'e1', name: 'Valide' }, { id: 'x' }, 42],
      sessions: [
        { id: 's1', date: '2026-01-01', name: 'S', status: 'completed', exercises: [] },
        { id: 's2' },
      ],
      body: [{ date: '2026-01-01', weight: 75 }, { date: '2026-01-02' }],
      progress: [],
    };
    importAllData(snapshot);
    const exercises = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.exercises) || '[]');
    const sessions = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.sessions) || '[]');
    const body = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.body) || '[]');
    expect(exercises).toHaveLength(1);
    expect(sessions).toHaveLength(1);
    expect(body).toHaveLength(1);
  });
});

describe('exportAllData', () => {
  it('returns null when localStorage is unavailable', () => {
    // In jsdom localStorage exists; simulate unavailability by stubbing getter.
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage');
    Object.defineProperty(window, 'localStorage', { get: () => undefined, configurable: true });
    expect(exportAllData()).toBeNull();
    Object.defineProperty(window, 'localStorage', original!);
  });
});
