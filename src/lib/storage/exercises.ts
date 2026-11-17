/**
 * Exercises CRUD with lazy seeding of the default catalog.
 */

import { DEFAULT_EXERCISES, STORAGE_KEYS } from './defaults';
import { isExercise } from './guards';
import { generateId, getStore, setStore } from './store';
import type { Exercise } from './types';

export function getExercises(): Exercise[] {
  const existing = getStore<Exercise[]>(STORAGE_KEYS.exercises, []);
  const valid = Array.isArray(existing) ? existing.filter(isExercise) : [];

  // Merge: find defaults not yet in the user's list (by name+muscle match)
  const now = new Date().toISOString();
  const existingKeys = new Set(valid.map((e) => `${e.name}|||${e.muscle}`));
  const missing = DEFAULT_EXERCISES.filter((d) => !existingKeys.has(`${d.name}|||${d.muscle}`));

  if (missing.length > 0) {
    const merged = [
      ...valid,
      ...missing.map((ex) => ({
        id: generateId(),
        name: ex.name,
        muscle: ex.muscle,
        category: ex.category,
        createdAt: now,
      })),
    ];
    setStore(STORAGE_KEYS.exercises, merged);
    return merged;
  }

  if (valid.length > 0) return valid;

  // First run: seed everything
  const seeded: Exercise[] = DEFAULT_EXERCISES.map((ex) => ({
    id: generateId(),
    name: ex.name,
    muscle: ex.muscle,
    category: ex.category,
    createdAt: now,
  }));
  setStore(STORAGE_KEYS.exercises, seeded);
  return seeded;
}

export function saveExercise(exercise: Omit<Exercise, 'id' | 'createdAt'>): Exercise {
  const all = getExercises();
  const created: Exercise = {
    ...exercise,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  all.push(created);
  setStore(STORAGE_KEYS.exercises, all);
  return created;
}

export function updateExercise(id: string, updates: Partial<Exercise>): void {
  const all = getExercises();
  const index = all.findIndex((ex) => ex.id === id);
  if (index === -1) return;
  all[index] = { ...all[index], ...updates, id: all[index].id };
  setStore(STORAGE_KEYS.exercises, all);
}

export function deleteExercise(id: string): void {
  const all = getExercises().filter((ex) => ex.id !== id);
  setStore(STORAGE_KEYS.exercises, all);
}

export function getExerciseById(id: string): Exercise | undefined {
  return getExercises().find((ex) => ex.id === id);
}

/** Toggles the `favorite` flag and returns the new state. */
export function toggleExerciseFavorite(id: string): boolean {
  const all = getExercises();
  const index = all.findIndex((ex) => ex.id === id);
  if (index === -1) return false;
  const next = !all[index].favorite;
  all[index] = { ...all[index], favorite: next };
  setStore(STORAGE_KEYS.exercises, all);
  return next;
}
