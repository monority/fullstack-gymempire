/**
 * Body measurements CRUD (added 2026-08-04).
 */

import { STORAGE_KEYS } from './defaults';
import { isBodyRecord } from './guards';
import { getStore, setStore } from './store';
import { getSettings, saveSettings, updateSettings } from './settings';
import type { BodyRecord } from './types';

/**
 * Returns all body composition records, sorted oldest → newest by date.
 * Defensive sort: invalid dates sort to the end so they don't break the chart.
 */
export function getBodyRecords(): BodyRecord[] {
  const raw = getStore<BodyRecord[]>(STORAGE_KEYS.body, []);
  const normalized = Array.isArray(raw)
    ? raw.filter(isBodyRecord).map((record) => ({
        ...record,
        weight: Number(record.weight) || 0,
        ...(record.arm == null ? {} : { arm: Number(record.arm) || 0 }),
        ...(record.chest == null ? {} : { chest: Number(record.chest) || 0 }),
        ...(record.waist == null ? {} : { waist: Number(record.waist) || 0 }),
        ...(record.hips == null ? {} : { hips: Number(record.hips) || 0 }),
      }))
    : [];
  // Imports from older versions may contain duplicate daily snapshots.
  // Keep the last value for a date, matching addBodyRecord's upsert rule.
  const byDate = new Map<string, BodyRecord>();
  for (const record of normalized) byDate.set(record.date, record);

  return [...byDate.values()].sort((a, b) => {
    const ta = new Date(a.date).getTime();
    const tb = new Date(b.date).getTime();
    if (isNaN(ta) && isNaN(tb)) return 0;
    if (isNaN(ta)) return 1;
    if (isNaN(tb)) return -1;
    return ta - tb;
  });
}

/**
 * Appends a body record and updates the settings.bodyWeight mirror so
 * the settings page always shows the most recent weight.
 */
export function addBodyRecord(record: BodyRecord): void {
  const all = getStore<BodyRecord[]>(STORAGE_KEYS.body, []);
  const existingIndex = all.findIndex((entry) => entry.date === record.date);
  if (existingIndex >= 0) {
    // A body snapshot is daily: editing today's entry replaces it instead
    // of creating duplicate chart points and ambiguous interval boundaries.
    all[existingIndex] = record;
  } else {
    all.push(record);
  }
  setStore(STORAGE_KEYS.body, all);
  // Mirror the latest weight into settings for quick display.
  if (Number.isFinite(record.weight) && record.weight > 0) {
    updateSettings({ bodyWeight: record.weight });
  }
}

export function deleteBodyRecord(date: string): void {
  const filtered = getStore<BodyRecord[]>(STORAGE_KEYS.body, []).filter((r) => r.date !== date);
  setStore(STORAGE_KEYS.body, filtered);

  // Keep the settings mirror aligned when the latest measurement is removed.
  const bodyRecords = getBodyRecords();
  const latest = bodyRecords[bodyRecords.length - 1];
  const settings = getSettings();
  if (latest) settings.bodyWeight = latest.weight;
  else delete settings.bodyWeight;
  saveSettings(settings);
}
