import { localDateKey, localDateKey as isoDate } from './date';
export { isoDate };
/**
 * week-aggregation — Pure week-bucket aggregation for stats.
 *
 * Groups sessions into Sunday-started week buckets, computes volume,
 * session count, and duration. Fully testable, no DOM dependency.
 */

import type { Session } from './storage/types';

export interface WeekBucket {
  /** Sunday (start) of the week, at 00:00 local. */
  start: Date;
  /** ISO YYYY-MM-DD for the bucket's start (stable key). */
  key: string;
  /** Sum of weight * reps across completed sets. */
  volume: number;
  /** Count of completed sessions. */
  sessionCount: number;
  /** Sum of duration (seconds) across sessions with a recorded duration. */
  durationSum: number;
  durationCount: number;
}

export interface TopExercise {
  exerciseId: string;
  name: string;
  muscle: string;
  volume: number;
}

/** Returns the Sunday (00:00 local) of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const out = new Date(d);
  out.setDate(d.getDate() - d.getDay()); // getDay(): 0=Sun
  out.setHours(0, 0, 0, 0);
  return out;
}

/**
 * Build the last `n` week buckets ending with the current week, oldest
 * first. Each bucket starts on Sunday at 00:00 local time.
 */
export function buildWeeks(n: number, anchor: Date = new Date()): WeekBucket[] {
  const end = startOfWeek(anchor);
  const buckets: WeekBucket[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const start = new Date(end);
    start.setDate(end.getDate() - i * 7);
    buckets.push({
      start,
      key: isoDate(start),
      volume: 0,
      sessionCount: 0,
      durationSum: 0,
      durationCount: 0,
    });
  }
  return buckets;
}

/**
 * Aggregate sessions into a pre-built set of week buckets. Sessions
 * outside the bucket range are ignored.
 */
export function aggregateByWeek(sessions: Session[], buckets: WeekBucket[]): void {
  if (buckets.length === 0) return;
  const minKey = buckets[0].key;
  const maxKey = buckets[buckets.length - 1].key;
  const idxByKey = new Map(buckets.map((b, i) => [b.key, i] as const));

  for (const session of sessions) {
    if (session.status !== 'completed') continue;
    if (!session.date) continue;

    // `date` peut être un ISO complet ou un simple YYYY-MM-DD.
    const d = new Date(session.date.slice(0, 10) + 'T00:00:00');
    if (isNaN(d.getTime())) continue;
    // Une séance en milieu de semaine appartient au bucket du dimanche.
    const sessionKey = isoDate(startOfWeek(d));
    if (sessionKey < minKey || sessionKey > maxKey) continue;

    const idx = idxByKey.get(sessionKey);
    if (idx === undefined) continue;
    const bucket = buckets[idx];
    bucket.sessionCount += 1;

    if (typeof session.duration === 'number' && session.duration > 0) {
      bucket.durationSum += session.duration;
      bucket.durationCount += 1;
    }

    for (const ex of session.exercises) {
      for (const set of ex.sets) {
        if (!set.completed) continue;
        bucket.volume += set.weight * set.reps;
      }
    }
  }
}

/** Top N exercises by volume, descending. `now` anchors the week window (tests). */
export function topExercisesByVolume(
  sessions: Session[],
  n: number,
  weekCount: number,
  now: Date = new Date()
): TopExercise[] {
  const buckets = buildWeeks(weekCount, now);
  const minKey = buckets[0].key;
  // `key` est le dimanche de début de bucket : la borne haute doit être le
  // samedi de la dernière semaine, sinon la semaine en cours est exclue.
  const lastStart = new Date(buckets[buckets.length - 1].start);
  lastStart.setDate(lastStart.getDate() + 6);
  const maxKey = localDateKey(lastStart);
  const totals = new Map<string, TopExercise>();

  for (const session of sessions) {
    if (session.status !== 'completed') continue;
    if (!session.date) continue;
    const day = session.date.slice(0, 10);
    if (day < minKey || day > maxKey) continue;

    for (const ex of session.exercises) {
      let total = totals.get(ex.exerciseId)?.volume ?? 0;
      for (const set of ex.sets) {
        if (!set.completed) continue;
        total += set.weight * set.reps;
      }
      if (total > 0) {
        totals.set(ex.exerciseId, {
          exerciseId: ex.exerciseId,
          name: ex.name,
          muscle: ex.muscle,
          volume: total,
        });
      }
    }
  }

  return Array.from(totals.values())
    .sort((a, b) => b.volume - a.volume)
    .slice(0, n);
}
