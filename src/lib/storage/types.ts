/**
 * Domain types shared across the storage layer.
 */

export interface Exercise {
  id: string;
  name: string;
  muscle: string; // e.g. "Pectoraux", "Dos", "Jambes"
  category: string; // e.g. "Barre", "Haltère", "Machine", "Poids du corps"
  createdAt: string; // ISO date
  // ── User preference ──
  favorite?: boolean;
}

export type SetType = 'warmup' | 'work' | 'top' | 'drop' | 'failure';

export type RpeType = 'rpe' | 'urpe';

/** Selectable per-set RPE values (10 → 4 by 0.5 steps). */
export const RPE_OPTIONS: number[] = [10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5.5, 5, 4.5, 4];

export interface SessionSet {
  exerciseId: string;
  setNumber: number;
  weight: number;
  reps: number;
  /**
   * Perceived effort for this set, 0-10 in 0.5 steps (e.g. 7.5).
   * Optional + nullable so sessions saved before the per-set RPE feature
   * stay parseable — callers must treat null/undefined as "not logged".
   */
  rpe?: number | null;
  /** Whether `rpe` is an RPE or uRPE value. Absent ⇒ treat as 'rpe'. */
  rpeType?: RpeType;
  type: SetType;
  completed: boolean;
}

export type SessionStatus = 'in-progress' | 'completed' | 'planned';

export type SessionMood = 'great' | 'good' | 'ok' | 'tired' | 'bad';

/**
 * A superset groups 2+ exercises that are performed back-to-back
 * without rest. Stored on the session as an array of groups; each
 * group references the `exerciseId` of the participating exercises.
 */
export interface Superset {
  exercises: string[]; // exerciseIds
}

export interface SessionExercise {
  exerciseId: string;
  name: string;
  muscle: string;
  sets: SessionSet[];
}

export interface Session {
  id: string;
  sourceSessionId?: string;
  name: string;
  date: string; // ISO date
  duration?: number; // seconds
  exercises: SessionExercise[];
  status: SessionStatus;
  // ── Optional post-session notes ──
  notes?: string;
  rpe?: number; // session-level RPE, 1-10
  fatigue?: number; // fatigue level, 1-5
  mood?: SessionMood;
  // ── Superset groups ──
  // Optional to keep older sessions clean. Each entry lists 2+ exerciseIds
  // that the user has grouped into a superset/circuit.
  supersets?: Superset[];
}

export interface ProgressRecord {
  exerciseId: string;
  date: string;
  estimated1RM: number;
  bestWeight: number;
  bestReps: number;
}

/**
 * Body composition snapshot. Stored under `muscu:body` and used by
 * the /progression/poids page to chart weight + measurements over time.
 * All measurements are optional except `date` and `weight`.
 */
export interface BodyRecord {
  date: string; // ISO date (YYYY-MM-DD)
  weight: number; // kg
  arm?: number; // cm
  chest?: number; // cm
  waist?: number; // cm
  hips?: number; // cm
}

export type WeightUnit = 'kg' | 'lbs';
export type RepsFormat = 'simple' | 'range';

/**
 * Session reminder configuration.
 * `days` uses JavaScript `Date#getDay()` indexing: 0 = Sunday …
 * 6 = Saturday. `time` is a "HH:MM" string in 24h local time.
 */
export interface ReminderSettings {
  enabled: boolean;
  days: number[];
  time: string; // "HH:MM"
}

export interface Settings {
  pseudo: string;
  email: string;
  unit: WeightUnit;
  repsFormat: RepsFormat;
  defaultRestTime: number; // seconds
  soundAlerts: boolean;
  weeklyGoal: number; // sessions per week (1-7)
  // ── Latest known body weight ──
  // Mirrored from the most recent BodyRecord so the settings
  // page can show a quick "current weight" without reading
  // the body store separately.
  bodyWeight?: number;
  // ── Session reminders ──
  // Nested object so older localStorage payloads merge safely
  // through the DEFAULT_SETTINGS fallback in `getSettings()`.
  reminders: ReminderSettings;
  // ── WebDAV sync ──
  // Credentials live in localStorage only (never sent anywhere but the
  // user-configured WebDAV host). `lastSyncAt` drives the "last sync"
  // status line on the settings page.
  webdav: WebdavSettings;
  // ── Community benchmarks opt-in ──
  // Records INTENT only: no server exists yet, so enabling this never
  // triggers a network request. It is the flag a future anonymized
  // cohort upload will read once Supabase sync ships.
  benchmarksOptIn: boolean;
  /** Mode avancé : affiche supersets, MRV, RPE, notes, WebDAV, benchmarks. */
  advancedMode: boolean;
}

/**
 * WebDAV account for the manual sync section on the settings page.
 * The password is intentionally absent from persisted settings: it lives in
 * sessionStorage (see webdav-credentials.ts) for the current tab only.
 */
export interface WebdavSettings {
  url: string;
  username: string;
  password: string;
  /** ISO timestamp of the last successful push/pull ('' when never). */
  lastSyncAt?: string;
}
