/**
 * Settings read/write with defaults merging.
 */

import { DEFAULT_SETTINGS, STORAGE_KEYS } from './defaults';
import { getStore, setStore } from './store';
import type { Settings } from './types';

/**
 * Returns the persisted settings, merged with defaults so newly-added keys
 * always have a safe value when an older payload is in localStorage.
 */
export function getSettings(): Settings {
  const stored = getStore<Partial<Settings>>(STORAGE_KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: Settings): void {
  setStore(STORAGE_KEYS.settings, settings);
}

export function updateSettings(updates: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...updates };
  setStore(STORAGE_KEYS.settings, next);
  return next;
}
