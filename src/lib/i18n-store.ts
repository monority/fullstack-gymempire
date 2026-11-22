/**
 * Store Alpine i18n — injection explicite des helpers de traduction.
 * Remplace les globals `window.trExercise/trMuscle/trCategory/muscleHue`.
 */
import { getLocale, dateLocale, type Locale } from '../i18n';
import {
  EXERCISE_NAMES_EN,
  MUSCLES_EN,
  CATEGORIES_EN,
  TEMPLATE_NAMES_EN,
  TEMPLATE_DESCS_EN,
} from '../i18n/exercise-translations';
import { muscleHue, type MuscleTone } from './colors';
import { registerStore } from './alpine';

export interface I18nStore {
  locale: Locale;
  dateLocale: string;
  trExercise(name: string): string;
  trMuscle(muscle: string): string;
  trCategory(category: string): string;
  trTemplateName(name: string): string;
  trTemplateDesc(id: string): string;
  muscleHue(muscle: string): MuscleTone;
  /** Libellés du builder, injectés par sa registration. */
  builderLabels?: Record<string, string>;
}

export function createI18nStore(locale: Locale): I18nStore {
  return {
    locale,
    dateLocale: dateLocale(locale),
    // Les maps ne contiennent que l'anglais : la locale du store est la
    // source de vérité, pas getLocale() (qui dépend du document).
    trExercise: (name) => (locale === 'en' ? (EXERCISE_NAMES_EN[name] ?? name) : name),
    trMuscle: (muscle) => (locale === 'en' ? (MUSCLES_EN[muscle] ?? muscle) : muscle),
    trCategory: (category) => (locale === 'en' ? (CATEGORIES_EN[category] ?? category) : category),
    trTemplateName: (name) => (locale === 'en' ? (TEMPLATE_NAMES_EN[name] ?? name) : name),
    trTemplateDesc: (id) => (locale === 'en' ? (TEMPLATE_DESCS_EN[id] ?? id) : id),
    muscleHue,
  };
}

/** Enregistre le store dans Alpine, avec la locale du document. */
export function registerI18nStore(): void {
  registerStore('i18n', createI18nStore(getLocale()));
}
