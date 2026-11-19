/**
 * Locale state — leaf module, no imports (avoids the index ↔ exercise-translations cycle).
 */

export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

let currentLocale: Locale = defaultLocale;

export function setLocale(locale: string) {
  if (locale === 'fr' || locale === 'en') {
    currentLocale = locale;
  }
}

export function getLocale(): Locale {
  if (typeof window !== 'undefined') {
    const l = (window as { __LOCALE__?: string }).__LOCALE__;
    if (l === 'fr' || l === 'en') return l;
  }
  return currentLocale;
}

/** Locale string for Intl formatting (fr-FR or en-GB). */
export const DATE_LOCALE = () => (getLocale() === 'en' ? 'en-GB' : 'fr-FR');
