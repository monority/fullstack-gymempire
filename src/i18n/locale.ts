/**
 * Locale — module pur, sans état mutable.
 *
 * Côté serveur, la locale est TOUJOURS explicite (dérivée du chemin de la page).
 * Côté client, `getLocale()` lit l'attribut `lang` du document, qui est fixé
 * par le HTML rendu : aucune mutation globale, aucun `window.__LOCALE__`.
 */

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

export function isLocale(value: string | undefined | null): value is Locale {
  return value === 'fr' || value === 'en';
}

/** Résolution pure depuis un chemin — remplace l'ancien setLocale() global. */
export function resolveLocale(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : defaultLocale;
}

/**
 * Locale courante côté client uniquement.
 * Le serveur n'appelle jamais cette fonction (t(locale) est explicite).
 */
export function getLocale(): Locale {
  if (typeof document !== 'undefined') {
    const lang = document.documentElement.getAttribute('lang');
    if (isLocale(lang)) return lang;
  }
  return defaultLocale;
}

/** Locale Intl unique (remplace l'ancien DATE_LOCALE() dépendant du global). */
export function dateLocale(locale: Locale): string {
  return locale === 'en' ? 'en-GB' : 'fr-FR';
}

/** Conservé pour compatibilité des imports existants ; déprécié. */
export const DATE_LOCALE = (): string => dateLocale(getLocale());
