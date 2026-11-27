import { warmupValues, isWorkingSet } from './warmup';
/**
 * session-builder-stats — Pure computation functions for session builder.
 *
 * Extracted from pages/sessions/create/index.astro for testability and reuse.
 * All functions are pure: they take data in, return results out.
 * No DOM, no localStorage, no Alpine dependency.
 */

import type { Session, SessionExercise, SessionSet, SetType } from './storage/types';

/** Dernière série de travail terminée d'un exercice, pour pré-remplir une saisie. */
export function lastWorkSetFor(
  exerciseId: string,
  sessions: Session[]
): { weight: number; reps: number } | null {
  let best: { weight: number; reps: number; date: string } | null = null;
  for (const s of sessions) {
    if (best && s.date < best.date) continue;
    for (const ex of s.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const set of ex.sets) {
        if (!set.completed || set.type !== 'work' || !(set.weight > 0)) continue;
        if (!best || s.date >= best.date) {
          best = { weight: set.weight, reps: set.reps, date: s.date };
        }
      }
    }
  }
  return best ? { weight: best.weight, reps: best.reps } : null;
}
import type { TemplateExercise } from './templates';

export type RpeLevel = 'easy' | 'moderate' | 'hard' | 'max';

export interface ExerciseSummaryParts {
  setCount: number;
  totalReps: number;
  totalVolume: number;
  topWeight: number;
  topReps: number;
}

export interface BuilderExercise extends SessionExercise {
  supersetId: number | null;
}

/** Classify RPE value into tone category. */
export function rpeTone(rpe: number): RpeLevel {
  if (rpe <= 3) return 'easy';
  if (rpe <= 6) return 'moderate';
  if (rpe <= 8) return 'hard';
  return 'max';
}

/** Compute raw summary data for a single exercise. */
export function computeExerciseSummary(exercise: SessionExercise): ExerciseSummaryParts {
  const setCount = exercise.sets.length;
  const totalReps = exercise.sets.reduce((sum, s) => sum + (s.reps || 0), 0);
  const totalVolume = exercise.sets.reduce((sum, s) => sum + (s.weight || 0) * (s.reps || 0), 0);
  const top = exercise.sets.reduce(
    (best, s) => (s.weight > (best?.weight || 0) ? s : best),
    exercise.sets[0]
  );
  return {
    setCount,
    totalReps,
    totalVolume,
    topWeight: top?.weight ?? 0,
    topReps: top?.reps ?? 0,
  };
}

/** Format exercise summary string. */
export function formatExerciseSummary(
  exercise: SessionExercise,
  labels: { noSets: string; setsSingular: string; setsPlural: string; top: string }
): string {
  if (exercise.sets.length === 0) return labels.noSets;
  const { setCount, totalReps, totalVolume, topWeight, topReps } = computeExerciseSummary(exercise);
  const setLabel = setCount > 1 ? labels.setsPlural : labels.setsSingular;
  const volume = Math.round(totalVolume);
  const topLine = topWeight > 0 ? ` \u2014 ${labels.top} ${topWeight} kg \u2014 ${topReps}` : '';
  return `${setCount} ${setLabel} \u2014 ${totalReps} reps \u2014 ${volume} kg${topLine}`;
}

/** Generate warmup sets from working sets. Returns empty array if no working weight. */
export function generateWarmupSets(exerciseId: string, sets: SessionSet[]): SessionSet[] {
  const workingSets = sets.filter(isWorkingSet);
  if (workingSets.length === 0) return [];

  const maxWeight = Math.max(...workingSets.map((s) => s.weight));
  const warmups: SessionSet[] = warmupValues(maxWeight).map((v, i) => ({
    exerciseId,
    setNumber: i + 1,
    type: 'warmup' as SetType,
    ...v,
    completed: false,
  }));

  return [
    ...warmups,
    ...sets.map((s, i) => ({
      ...s,
      setNumber: i + warmups.length + 1,
    })),
  ];
}

/** Create a BuilderExercise from a template exercise definition. */
export function buildExerciseFromTemplate(
  exercise: { id: string; name: string; muscle: string },
  template: TemplateExercise,
  defaultSetType: SetType = 'work'
): BuilderExercise {
  const sets: SessionSet[] = [];
  const count = Math.max(1, template.defaultSets);
  for (let i = 0; i < count; i++) {
    sets.push({
      exerciseId: exercise.id,
      setNumber: i + 1,
      weight: 0,
      reps: template.defaultReps,
      type: defaultSetType,
      completed: false,
    });
  }
  return {
    exerciseId: exercise.id,
    name: exercise.name,
    muscle: exercise.muscle,
    sets,
    supersetId: null,
  };
}

/** Check if exercise has at least one work/top set with weight > 0. */
export function hasWorkingWeight(exercise: SessionExercise): boolean {
  return exercise.sets.some(isWorkingSet);
}

/** Create a new set with values inherited from the last set. */
export function createNextSet(
  exerciseId: string,
  setNumber: number,
  lastSet: SessionSet | undefined,
  defaultType: SetType = 'work'
): SessionSet {
  return {
    exerciseId,
    setNumber,
    weight: lastSet ? lastSet.weight : 0,
    reps: lastSet ? lastSet.reps : 0,
    type: defaultType,
    completed: false,
  };
}

/** Get unique superset IDs from exercises. */
export function getSupersetIds(exercises: BuilderExercise[]): number[] {
  const ids = new Set<number>();
  for (const ex of exercises) {
    if (ex.supersetId != null) ids.add(ex.supersetId);
  }
  return Array.from(ids).sort((a, b) => a - b);
}

/** Compute next superset ID (max + 1). */
export function getNextSupersetId(exercises: BuilderExercise[]): number {
  const used = getSupersetIds(exercises);
  if (used.length === 0) return 1;
  return Math.max(...used) + 1;
}

/** Get exercise names in a superset chain. */
export function supersetChain(
  exercises: BuilderExercise[],
  groupId: number | null,
  translate?: (name: string) => string
): string[] {
  if (groupId == null) return [];
  return exercises
    .filter((e) => e.supersetId === groupId)
    .map((e) => (translate ? translate(e.name) : e.name));
}
