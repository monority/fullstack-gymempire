/**
 * Sessions CRUD plus date/month/week queries.
 */

import { parseLocalDate } from '../date';
import { STORAGE_KEYS } from './defaults';
import { isSession, normalizeSession } from './guards';
import { generateId, getStore, setStore } from './store';
import type { Session } from './types';
import { startOfWeek as sundayOfWeek } from '../week-aggregation';

export function getSessions(): Session[] {
  const raw = getStore<Session[]>(STORAGE_KEYS.sessions, []);
  return Array.isArray(raw) ? raw.filter(isSession).map(normalizeSession) : [];
}

export function saveSession(session: Omit<Session, 'id'>): Session {
  const all = getSessions();
  const created: Session = {
    ...session,
    id: generateId(),
  };
  all.push(created);
  setStore(STORAGE_KEYS.sessions, all);
  return created;
}

export function updateSession(id: string, updates: Partial<Session>): void {
  const all = getSessions();
  const index = all.findIndex((s) => s.id === id);
  if (index === -1) return;
  all[index] = { ...all[index], ...updates, id: all[index].id };
  setStore(STORAGE_KEYS.sessions, all);
}

export function deleteSession(id: string): void {
  const all = getSessions().filter((s) => s.id !== id);
  setStore(STORAGE_KEYS.sessions, all);
}

export function getSessionById(id: string): Session | undefined {
  return getSessions().find((s) => s.id === id);
}

/**
 * Returns all sessions whose `date` field exactly matches the given
 * YYYY-MM-DD string. Comparison is strict (no prefix matching) — the
 * app consistently stores session dates as `YYYY-MM-DD` via
 * `new Date().toISOString().split('T')[0]`, so this works for every
 * session produced by the rest of the codebase. Used by the
 * /calendar page to list the sessions for a clicked day.
 */
export function getSessionsByDate(date: string): Session[] {
  return getSessions().filter((s) => s.date === date);
}

/**
 * Returns all sessions whose local-time year/month match the provided
 * values. `month` is zero-indexed (0 = January) to match `Date#getMonth`.
 * Used by the /calendar page to build the monthly summary stats.
 */
export function getSessionsByMonth(year: number, month: number): Session[] {
  return getSessions().filter((s) => {
    const d = parseLocalDate(s.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

/**
 * Returns the completed sessions whose date falls in the current week.
 * "Week" is anchored to Sunday (getDay() === 0) at 00:00 local time,
 * matching the dashboard's weekly-goal cadence.
 */
export function getSessionsThisWeek(): Session[] {
  const startOfWeek = sundayOfWeek(new Date());

  return getSessions().filter((s) => {
    if (s.status !== 'completed') return false;
    const d = parseLocalDate(s.date);
    return d >= startOfWeek;
  });
}
