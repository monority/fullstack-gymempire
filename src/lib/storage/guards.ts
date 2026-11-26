import { parseLocalDate, localDateKey } from '../date';
/**
 * Runtime validators — guard against corrupted localStorage / bad imports.
 */

import type { BodyRecord, Exercise, ProgressRecord, Session, SessionSet } from './types';

export function isExercise(v: unknown): v is Exercise {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.name === 'string';
}

export function isSessionSet(v: unknown): v is SessionSet {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.exerciseId === 'string';
}

export function isSession(v: unknown): v is Session {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.id === 'string' && typeof o.date === 'string';
}

export function isBodyRecord(v: unknown): v is BodyRecord {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.date === 'string' && o.weight != null;
}

export function isProgressRecord(v: unknown): v is ProgressRecord {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.exerciseId === 'string' &&
    typeof o.date === 'string' &&
    o.estimated1RM != null &&
    o.bestWeight != null &&
    o.bestReps != null
  );
}

/**
 * Normalizes numeric fields at the read boundary. Older local-first
 * versions and JSON imports may contain input values as strings; keeping
 * that detail out of the progression screens prevents valid historical
 * sessions from disappearing when `Number.isFinite` is used in calculations.
 */
export function normalizeSession(session: Session): Session {
  return {
    ...session,
    date: localDateKey(parseLocalDate(session.date)),
    exercises: Array.isArray(session.exercises)
      ? session.exercises.map((exercise) => ({
          ...exercise,
          sets: Array.isArray(exercise.sets)
            ? exercise.sets.filter(isSessionSet).map((set) => ({
                ...set,
                setNumber: Number(set.setNumber) || 0,
                weight: Number(set.weight) || 0,
                reps: Number(set.reps) || 0,
                rpe: set.rpe == null ? set.rpe : Number(set.rpe),
              }))
            : [],
        }))
      : [],
  };
}
