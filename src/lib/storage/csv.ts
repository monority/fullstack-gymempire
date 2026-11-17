/**
 * Pure CSV serialization for sessions (C2, plan-execution.md).
 * No DOM, no window — safe to unit-test without jsdom.
 */

import { calculate1RM } from './store';
import { getSessions } from './sessions';
import type { Session, SessionSet } from './types';

/**
 * RFC 4180 field escaping: wraps the value in double quotes when it contains
 * a comma, quote, CR, or LF, and doubles any internal quotes. Numbers are
 * coerced through `String()` for symmetry with the string branch.
 */
function csvEscape(value: string | number): string {
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * CSV cell for a set's RPE: "RPE 7.5" or "uRPE 7", or '' when absent.
 * uRPE sets are prefixed so the exported spreadsheet stays self-explanatory.
 */
function formatSetRpeCsv(set: SessionSet): string {
  const v = typeof set.rpe === 'string' ? Number(set.rpe) : set.rpe;
  if (v == null || !Number.isFinite(v)) return '';
  return (set.rpeType === 'urpe' ? 'uRPE ' : 'RPE ') + v;
}

/**
 * 1-based ordinal of the superset group the given exercise belongs to
 * (per the persisted `session.supersets` array), or 0 when the exercise
 * is not part of any superset. Sessions saved before the superset feature
 * simply have no `supersets` field → 0 → empty CSV cell.
 */
function supersetGroupOrdinal(session: Session, exerciseId: string): number {
  if (!session.supersets) return 0;
  const idx = session.supersets.findIndex((g) => g.exercises.includes(exerciseId));
  return idx >= 0 ? idx + 1 : 0;
}

/**
 * Builds a CSV string from the given sessions with one row per set, suitable
 * for import into a spreadsheet. Columns:
 *   Date, Nom, Exercice, Série, Type, Charge (kg), Répétitions, 1RM estimé, RPE, Superset.
 * The estimated 1RM uses the Epley formula via `calculate1RM`. The RPE column
 * carries a prefixed label ("RPE 7.5" / "uRPE 7") and is empty when a set has
 * no RPE logged (e.g. sessions saved before the feature existed). The Superset
 * column holds the 1-based group number of the exercise and is empty when the
 * exercise is not grouped (added 2026-08-09).
 */
export function sessionsToCsv(sessions: Session[]): string {
  const header = 'Date,Nom,Exercice,Série,Type,Charge (kg),Répétitions,1RM estimé,RPE,Superset';
  const rows = sessions.flatMap((session) =>
    session.exercises.flatMap((exercise) =>
      exercise.sets.map((set, i) =>
        [
          csvEscape(session.date),
          csvEscape(session.name),
          csvEscape(exercise.name),
          i + 1,
          set.type,
          set.weight,
          set.reps,
          Math.round(calculate1RM(set.weight, set.reps)),
          csvEscape(formatSetRpeCsv(set)),
          supersetGroupOrdinal(session, exercise.exerciseId) || '',
        ].join(',')
      )
    )
  );
  return [header, ...rows].join('\n');
}

/**
 * Bulk export: CSV of every session in localStorage. Delegates to the pure
 * `sessionsToCsv` so per-session sheets can reuse the exact same pipeline.
 */
export function exportSessionsAsCSV(): string {
  return sessionsToCsv(getSessions());
}

/**
 * Per-session export: CSV of a single session, using the same columns and
 * formulas as the bulk export (used by the « Fiche » action on the detail
 * page). One row per set.
 */
export function exportSessionAsCsv(session: Session): string {
  return sessionsToCsv([session]);
}
