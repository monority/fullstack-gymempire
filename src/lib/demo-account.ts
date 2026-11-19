/**
 * Compte de démonstration : mêmes données que le générateur de /debug,
 * mais connecté comme un vrai compte et verrouillé en lecture seule.
 *
 * Les données réelles sont sauvegardées avant de charger le jeu fictif,
 * puis restaurées à la déconnexion du compte démo.
 */

import { clearAuth, isDemoAccount, setAuth } from './auth';
import { generateDemoData } from './seed';
import { exportAllData, importAllData, type AppDataSnapshot } from './storage/backup';
import { withUnlockedWrites } from './storage/store';

export const DEMO_EMAIL = 'alex@demo.fr';
export const DEMO_NAME = 'Alex';

export const DEMO_BACKUP_KEY = 'muscu:demo-backup';

/** Snapshot des données réelles, conservé le temps de la session démo. */
function backupRealData(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  // Déjà en démo : on ne remplace pas la sauvegarde d'origine.
  if (isDemoAccount()) return;
  try {
    const snapshot = exportAllData();
    if (snapshot) window.localStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify(snapshot));
  } catch {
    // stockage indisponible — la démo reste utilisable sans sauvegarde
  }
}

/** Remplit l'historique puis connecte le compte démo (plus aucune écriture). */
export function loginWithDemoAccount(): void {
  backupRealData();
  withUnlockedWrites(() => generateDemoData());
  setAuth(DEMO_EMAIL, DEMO_NAME, true);
}

/**
 * Déconnecte le compte démo et restaure les données sauvegardées.
 * Retourne `true` si une session démo a été traitée.
 */
export function logoutFromDemoAccount(): boolean {
  if (!isDemoAccount()) return false;

  try {
    const raw = window.localStorage.getItem(DEMO_BACKUP_KEY);
    if (raw) {
      const snapshot = JSON.parse(raw) as AppDataSnapshot;
      withUnlockedWrites(() => importAllData(snapshot));
    }
  } catch {
    // snapshot corrompu ou import invalide : on ne restaure pas,
    // mais la déconnexion doit tout de même avoir lieu.
  } finally {
    try {
      window.localStorage.removeItem(DEMO_BACKUP_KEY);
    } catch {
      // ignore — meilleur effort
    }
    clearAuth();
  }
  return true;
}
