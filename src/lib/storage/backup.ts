/**
 * Data export / import / reset.
 * Snapshot versioning with a migration table: any future schema change
 * (e.g. new `unit` semantics) must ship a tested migration here.
 */

import { STORAGE_KEYS } from './defaults';
import { isBodyRecord, isExercise, isProgressRecord, isSession, normalizeSession } from './guards';
import { getStore, setStore } from './store';
import { isDemoAccount } from '../auth';
import { getExercises } from './exercises';
import { getSessions } from './sessions';
import { getSettings } from './settings';
import { clearWebdavPassword } from './webdav-credentials';
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

const APP_DATA_KEYS: ReadonlyArray<{ key: string }> = [
  { key: STORAGE_KEYS.exercises },
  { key: STORAGE_KEYS.sessions },
  { key: STORAGE_KEYS.progress },
  { key: STORAGE_KEYS.settings },
  { key: STORAGE_KEYS.body },
  { key: STORAGE_KEYS.reminderNotified },
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
    // Le mot de passe WebDAV n'est jamais exporté : un backup est un fichier
    // téléchargeable/partageable, ce serait une fuite de credentials.
    settings: (() => {
      const current = getSettings();
      return {
        ...current,
        webdav: current.webdav ? { ...current.webdav, password: '' } : current.webdav,
      };
    })(),
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
  if (data.version < 1 || !Number.isInteger(data.version)) {
    throw new Error('Version de sauvegarde invalide.');
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
  if (
    data.settings &&
    (typeof data.settings !== 'object' || data.settings === null || Array.isArray(data.settings))
  ) {
    throw new Error('Réglages invalides.');
  }
  // Validation structurelle des réglages : un backup hostile ou corrompu ne
  // doit pas pouvoir écraser les credentials WebDAV ni casser l'UI.
  if (data.settings) {
    const s = data.settings as unknown as Record<string, unknown>;
    const ALLOWED = new Set([
      'pseudo',
      'email',
      'unit',
      'repsFormat',
      'defaultRestTime',
      'soundAlerts',
      'weeklyGoal',
      'bodyWeight',
      'benchmarksOptIn',
      'advancedMode',
      'reminders',
      'webdav',
      'lastSyncAt',
    ]);
    for (const key of Object.keys(s)) {
      if (!ALLOWED.has(key)) throw new Error(`Réglage inconnu: ${key}`);
    }
    if (s.unit !== undefined && s.unit !== 'kg' && s.unit !== 'lbs') {
      throw new Error('Unité de poids invalide.');
    }
    if (s.pseudo !== undefined && typeof s.pseudo !== 'string') throw new Error('Pseudo invalide.');
    if (s.email !== undefined && typeof s.email !== 'string') throw new Error('Email invalide.');
    if (s.reminders !== undefined) {
      if (!s.reminders || typeof s.reminders !== 'object' || Array.isArray(s.reminders)) {
        throw new Error('Rappels invalides.');
      }
      const r = s.reminders as Record<string, unknown>;
      if (r.enabled !== undefined && typeof r.enabled !== 'boolean')
        throw new Error('Rappel invalide.');
      if (r.days !== undefined) {
        if (
          !Array.isArray(r.days) ||
          r.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6) ||
          new Set(r.days).size !== r.days.length
        ) {
          throw new Error('Jours de rappel invalides.');
        }
      }
      if (r.time !== undefined) {
        const match = typeof r.time === 'string' ? /^(\d{2}):(\d{2})$/.exec(r.time) : null;
        if (!match || Number(match[1]) > 23 || Number(match[2]) > 59)
          throw new Error('Heure de rappel invalide.');
      }
    }
    for (const key of ['defaultRestTime', 'weeklyGoal', 'bodyWeight'] as const) {
      if (
        s[key] !== undefined &&
        (typeof s[key] !== 'number' || !Number.isFinite(s[key]) || s[key] < 0)
      ) {
        throw new Error(`${key} invalide.`);
      }
    }
    for (const key of ['soundAlerts', 'benchmarksOptIn', 'advancedMode'] as const) {
      if (s[key] !== undefined && typeof s[key] !== 'boolean') throw new Error(`${key} invalide.`);
    }
    if (s.webdav !== undefined) {
      if (!s.webdav || typeof s.webdav !== 'object' || Array.isArray(s.webdav)) {
        throw new Error('WebDAV invalide.');
      }
      const w = s.webdav as Record<string, unknown>;
      for (const k of ['url', 'username', 'password', 'lastSyncAt']) {
        if (w[k] !== undefined && typeof w[k] !== 'string')
          throw new Error(`WebDAV ${k} invalide.`);
      }
    }
  }

  // run sequential migrations for older snapshot versions.
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
    const current = getSettings();
    const incoming = data.settings as Partial<Settings>;
    setStore(STORAGE_KEYS.settings, {
      ...current,
      ...incoming,
      // Le mot de passe WebDAV n'est jamais restauré depuis un backup :
      // ni fuite à l'export, ni écrasement par un fichier hostile.
      webdav: {
        ...current.webdav,
        ...incoming.webdav,
        password: current.webdav.password,
      },
    });
  }
}

/**
 * Wipes every muscu app key from localStorage. Settings fall back to
 * defaults; exercises/sessions/progress are emptied (a re-seed happens
 * lazily on the next `getExercises()` call).
 */
export function resetAllData(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  // Le compte démo est en lecture seule : ne jamais effacer les données réelles.
  if (isDemoAccount()) return;
  try {
    for (const { key } of APP_DATA_KEYS) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore — best-effort wipe
  }
  clearWebdavPassword();
}
