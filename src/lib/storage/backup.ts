/**
 * Data export / import / reset.
 * Snapshot versioning with a migration table: any future schema change
 * (e.g. new `unit` semantics) must ship a tested migration here.
 */

import { STORAGE_KEYS } from './defaults';
import { isBodyRecord, isExercise, isProgressRecord, isSession, normalizeSession } from './guards';
import { getStore, setStore } from './store';
import { getExercises } from './exercises';
import { getSessions } from './sessions';
import { getSettings } from './settings';
import type { BodyRecord, Exercise, ProgressRecord, Session, Settings } from './types';

export interface AppDataSnapshot {
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  sessions: Session[];
  progress: ProgressRecord[];
  body: BodyRecord[];
  settings: Settings;
}

export const SNAPSHOT_VERSION = 1;

/**
 * Sequential migrations applied to older snapshots before filtering.
 * Each entry upgrades snapshot data from `version` to `version + 1`.
 * New migrations must be pure, idempotent, and covered by tests.
 */
const MIGRATIONS: ReadonlyArray<{ to: number; migrate: (data: Record<string, unknown>) => void }> =
  [
    // Example (future): { to: 2, migrate: (data) => { … } }
  ];

const APP_DATA_KEYS: ReadonlyArray<{ key: string; match: RegExp }> = [
  { key: STORAGE_KEYS.exercises, match: /^muscu:exercises$/ },
  { key: STORAGE_KEYS.sessions, match: /^muscu:sessions$/ },
  { key: STORAGE_KEYS.progress, match: /^muscu:progress$/ },
  { key: STORAGE_KEYS.settings, match: /^muscu-settings$/ },
  { key: STORAGE_KEYS.body, match: /^muscu:body$/ },
  { key: STORAGE_KEYS.reminderNotified, match: /^muscu:reminder-notified$/ },
];

/**
 * Builds a JSON snapshot of all app data (exercises, sessions, progress,
 * settings) for export. Returns `null` when localStorage is unavailable.
 */
export function exportAllData(): AppDataSnapshot | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    exercises: getExercises(),
    sessions: getSessions(),
    progress: getStore<ProgressRecord[]>(STORAGE_KEYS.progress, []),
    body: getStore<BodyRecord[]>(STORAGE_KEYS.body, []),
    settings: getSettings(),
  };
}

/**
 * Restores a snapshot previously produced by `exportAllData`. Throws on
 * invalid payload so the caller can show a user-facing error.
 */
export function importAllData(snapshot: unknown): void {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new Error('Stockage local indisponible.');
  }
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Fichier de sauvegarde invalide.');
  }
  const data = snapshot as Partial<AppDataSnapshot> & Record<string, unknown>;
  if (typeof data.version !== 'number') {
    throw new Error('Version de sauvegarde manquante.');
  }
  if (data.version > SNAPSHOT_VERSION) {
    throw new Error(`Sauvegarde trop récente (v${data.version}). Mettez l'application à jour.`);
  }
  if (data.exercises && !Array.isArray(data.exercises)) {
    throw new Error('Liste d\u2019exercices invalide.');
  }
  if (data.sessions && !Array.isArray(data.sessions)) {
    throw new Error('Liste de séances invalide.');
  }
  if (data.progress && !Array.isArray(data.progress)) {
    throw new Error('Historique de progression invalide.');
  }
  if (data.body && !Array.isArray(data.body)) {
    throw new Error('Historique de mesures corporelles invalide.');
  }
  if (data.settings && typeof data.settings !== 'object') {
    throw new Error('Réglages invalides.');
  }

  // C4 — run sequential migrations for older snapshot versions.
  for (const migration of MIGRATIONS) {
    if (data.version < migration.to) {
      migration.migrate(data as Record<string, unknown>);
    }
  }

  if (data.exercises) setStore(STORAGE_KEYS.exercises, data.exercises.filter(isExercise));
  if (data.sessions)
    setStore(STORAGE_KEYS.sessions, data.sessions.filter(isSession).map(normalizeSession));
  // progress is filtered like exercises/sessions/body:
  // corrupted records are dropped instead of persisted silently.
  if (data.progress) setStore(STORAGE_KEYS.progress, data.progress.filter(isProgressRecord));
  if (data.body) setStore(STORAGE_KEYS.body, data.body.filter(isBodyRecord));
  if (data.settings) {
    setStore(STORAGE_KEYS.settings, { ...getSettings(), ...data.settings });
  }
}

/**
 * Wipes every muscu app key from localStorage. Settings fall back to
 * defaults; exercises/sessions/progress are emptied (a re-seed happens
 * lazily on the next `getExercises()` call).
 */
export function resetAllData(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    for (const { key } of APP_DATA_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore — best-effort wipe
  }
}
