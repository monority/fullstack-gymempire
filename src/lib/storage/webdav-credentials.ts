/**
 * Identifiants WebDAV — le mot de passe ne doit pas être persisté dans
 * localStorage : il reste dans sessionStorage (durée de vie de l'onglet).
 * Il n'est donc ni sauvegardé dans une export, ni restauré, ni conservé
 * après la fermeture du navigateur. Recharger la page dans le même onglet
 * le garde disponible, ce qui préserve l'usage courant.
 */

const PASSWORD_KEY = 'muscu:webdav-password';

/** Repli quand sessionStorage est indisponible (SSR, mode privé, quota). */
let memoryPassword = '';

function store(): Storage | null {
  try {
    return typeof sessionStorage === 'undefined' ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function getWebdavPassword(): string {
  const s = store();
  if (!s) return memoryPassword;
  try {
    return s.getItem(PASSWORD_KEY) ?? memoryPassword;
  } catch {
    return memoryPassword;
  }
}

export function setWebdavPassword(password: string): void {
  memoryPassword = password;
  const s = store();
  if (!s) return;
  try {
    if (password) s.setItem(PASSWORD_KEY, password);
    else s.removeItem(PASSWORD_KEY);
  } catch {
    // Stockage saturé ou interdit : le mot de passe reste en mémoire
    // pour la session en cours seulement.
  }
}

export function clearWebdavPassword(): void {
  setWebdavPassword('');
}

/**
 * Migration unique depuis l'ancienne version qui stockait le mot de passe
 * en clair dans `muscu-settings`. Appelée lors de la lecture des réglages.
 */
export function migrateLegacyWebdavPassword(legacy: unknown): void {
  if (typeof legacy !== 'string' || !legacy || getWebdavPassword()) return;
  setWebdavPassword(legacy);
}
