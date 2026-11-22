/**
 * Settings read/write with defaults merging.
 *
 * Le mot de passe WebDAV n'est pas une donnée de réglage persistée : il vit
 * dans sessionStorage (voir webdav-credentials.ts). Les couches de lecture
 * et d'écriture le retirent donc systématiquement de `muscu-settings`, et
 * migrent les anciennes valeurs laissées en clair par les versions précédentes.
 */

import { DEFAULT_SETTINGS, DEFAULT_WEBDAV, STORAGE_KEYS } from './defaults';
import { getStore, setStore } from './store';
import { migrateLegacyWebdavPassword } from './webdav-credentials';
import type { Settings } from './types';

/** WebDAV sans mot de passe : seule source de vérité pour la persistance. */
function persistedWebdav(settings: Settings): Settings['webdav'] {
  return { ...settings.webdav, password: '' };
}

/**
 * Returns the persisted settings, merged with defaults so newly-added keys
 * always have a safe value when an older payload is in localStorage.
 */
export function getSettings(): Settings {
  const stored = getStore<Partial<Settings>>(STORAGE_KEYS.settings, {});
  const legacy = stored.webdav?.password;
  const webdav = { ...DEFAULT_WEBDAV, ...stored.webdav, password: '' };
  const settings = { ...DEFAULT_SETTINGS, ...stored, webdav };
  if (typeof legacy === 'string' && legacy) {
    migrateLegacyWebdavPassword(legacy);
    // Réécriture immédiate : le mot de passe ne doit pas rester en clair
    // dans localStorage, même avant le prochain changement de réglage.
    setStore(STORAGE_KEYS.settings, settings);
  }
  return settings;
}

export function saveSettings(settings: Settings): void {
  setStore(STORAGE_KEYS.settings, { ...settings, webdav: persistedWebdav(settings) });
}

export function updateSettings(updates: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...updates };
  if (updates.webdav) next.webdav = persistedWebdav(next);
  setStore(STORAGE_KEYS.settings, next);
  return next;
}
