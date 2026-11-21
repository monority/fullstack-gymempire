/**
 * Store Alpine i18n — injection explicite des helpers de traduction.
 * Remplace les globals `window.trExercise/trMuscle/trCategory/muscleHue`
 * (plan de refonte i18n Phase 3).
 */
import {
  trExercise,
  trMuscle,
  trCategory,
  trTemplateName,
  trTemplateDesc,
  getLocale,
  dateLocale,
  type Locale,
} from '../i18n';
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
    trExercise: (name) => trExercise(name),
    trMuscle: (muscle) => trMuscle(muscle),
    trCategory: (category) => trCategory(category),
    trTemplateName: (name) => trTemplateName(name),
    trTemplateDesc: (id) => trTemplateDesc(id),
    muscleHue,
  };
}

/** Enregistre le store dans Alpine, avec la locale du document. */
export function registerI18nStore(): void {
  registerStore('i18n', createI18nStore(getLocale()));
}

/** Accès typé pour les factories Alpine (this.$store.i18n). */
export function i18nOf(store?: { i18n?: I18nStore }): I18nStore {
  return store?.i18n ?? createI18nStore(getLocale());
}
