import fr from './fr';
import en from './en';
import type { Dictionary } from './types';
import { defaultLocale, getLocale, type Locale } from './locale';

export type { Dictionary } from './types';

export {
  DATE_LOCALE,
  dateLocale,
  defaultLocale,
  getLocale,
  isLocale,
  resolveLocale,
  locales,
  type Locale,
} from './locale';

export const dictionaries: Record<Locale, Dictionary> = { fr, en };

/** Dictionary pour une locale explicite — aucun défaut implicite (ADR-010). */
export function t(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export function localizedPath(path: string, locale?: Locale): string {
  // Côté serveur, l'absence de locale est une erreur : getLocale() n'a pas de
  // document et renverrait 'fr', produisant des liens FR sur les pages EN.
  if (typeof document === 'undefined' && locale === undefined) {
    throw new Error('localizedPath(): locale explicite requise côté serveur');
  }
  const resolved = locale ?? getLocale();
  if (resolved === defaultLocale) return path;
  if (path === '/') return `/${resolved}`;
  return `/${resolved}${path}`;
}

export {
  trExercise,
  trMuscle,
  trCategory,
  trTemplateName,
  trTemplateDesc,
} from './exercise-translations';
