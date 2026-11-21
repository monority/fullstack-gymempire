import fr from './fr';
import en from './en';
import type { Dictionary } from './types';
import { defaultLocale, getLocale, resolveLocale, dateLocale, type Locale } from './locale';

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

/**
 * Dictionary pour une locale explicite.
 * Le paramètre reste optionnel le temps que les scripts clients soient migrés
 * (Phase 3) : côté serveur, tous les appels passent désormais la locale.
 */
export function t(locale: Locale = getLocale()): Dictionary {
  return dictionaries[locale];
}

/** Construit le contexte i18n d'une page à partir de son URL. */
export function useI18n(pathname: string): {
  locale: Locale;
  dict: Dictionary;
  dateLocale: string;
} {
  const locale = resolveLocale(pathname);
  return { locale, dict: dictionaries[locale], dateLocale: dateLocale(locale) };
}

export function localizedPath(path: string, locale: Locale = getLocale()): string {
  if (locale === defaultLocale) return path;
  if (path === '/') return `/${locale}`;
  return `/${locale}${path}`;
}

export {
  trExercise,
  trMuscle,
  trCategory,
  trTemplateName,
  trTemplateDesc,
} from './exercise-translations';

export default { t, getLocale, localizedPath, useI18n, resolveLocale };
