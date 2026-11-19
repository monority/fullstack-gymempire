/**
 * Compte de démonstration : mêmes données que le générateur de /debug,
 * mais connecté comme un vrai compte et verrouillé en lecture seule.
 */

import { setAuth } from './auth';
import { generateDemoData } from './seed';
import { withUnlockedWrites } from './storage/store';

export const DEMO_EMAIL = 'alex@demo.fr';
export const DEMO_NAME = 'Alex';

/** Remplit l'historique puis connecte le compte démo (plus aucune écriture). */
export function loginWithDemoAccount(): void {
  withUnlockedWrites(() => generateDemoData());
  setAuth(DEMO_EMAIL, DEMO_NAME, true);
}
