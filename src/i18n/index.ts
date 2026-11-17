import fr from './fr';
import en from './en';
import type { Dictionary } from './types';
import { defaultLocale, getLocale, setLocale, type Locale } from './locale';

export type { Dictionary } from './types';

export { DATE_LOCALE, defaultLocale, getLocale, setLocale, locales, type Locale } from './locale';

export const dictionaries: Record<Locale, Dictionary> = { fr, en };

export function t(): Dictionary {
  return dictionaries[getLocale()];
}

export function localizedPath(path: string): string {
  const locale = getLocale();
  if (locale === defaultLocale) return path;
  return `/${locale}${path}`;
}

export {
  trExercise,
  trMuscle,
  trCategory,
  trTemplateName,
  trTemplateDesc,
} from './exercise-translations';

export default { t, setLocale, getLocale, localizedPath };
