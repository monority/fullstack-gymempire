// @vitest-environment node
/**
 * Garde-fous i18n (plan de refonte §Phase 0).
 * Aucun test n'existait auparavant : ces assertions empêchent la dérive FR/EN.
 */
import { describe, expect, it } from 'vitest';
import en from '../en';
import fr from '../fr';
import { resolveLocale, dateLocale, defaultLocale } from '../locale';
import { dictionaries, localizedPath } from '..';
import { DEFAULT_EXERCISES } from '../../lib/storage/defaults';
import {
  EXERCISE_NAMES_EN,
  MUSCLES_EN,
  CATEGORIES_EN,
  TEMPLATE_NAMES_EN,
  TEMPLATE_DESCS_EN,
} from '../exercise-translations';

function leaves(value: unknown, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  if (typeof value === 'string') {
    out[prefix] = value;
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      Object.assign(out, leaves(child, prefix ? `${prefix}.${key}` : key));
    }
  }
  return out;
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]).sort();
}

describe('symétrie des dictionnaires', () => {
  const frLeaves = leaves(fr);
  const enLeaves = leaves(en);

  it('a le même nombre de feuilles dans les deux langues', () => {
    expect(Object.keys(frLeaves)).toHaveLength(Object.keys(enLeaves).length);
    expect(Object.keys(frLeaves).length).toBeGreaterThan(1000);
  });

  it('n’a aucune clé manquante ni surnuméraire', () => {
    expect(Object.keys(enLeaves).sort()).toEqual(Object.keys(frLeaves).sort());
  });

  it('utilise les mêmes placeholders de part et d’autre', () => {
    for (const key of Object.keys(frLeaves)) {
      expect(placeholders(enLeaves[key]), `placeholders pour ${key}`).toEqual(
        placeholders(frLeaves[key])
      );
    }
  });

  it('expose les deux dictionnaires sous les bonnes clés', () => {
    expect(dictionaries.fr).toBe(fr);
    expect(dictionaries.en).toBe(en);
  });
});

describe(' helpers de locale purs', () => {
  it('résout la locale depuis le chemin', () => {
    expect(resolveLocale('/')).toBe('fr');
    expect(resolveLocale('/sessions')).toBe('fr');
    expect(resolveLocale('/en')).toBe('en');
    expect(resolveLocale('/en/sessions')).toBe('en');
    expect(resolveLocale('/enfant')).toBe('fr');
  });

  it('localise les chemins', () => {
    expect(localizedPath('/sessions', 'fr')).toBe('/sessions');
    expect(localizedPath('/sessions', 'en')).toBe('/en/sessions');
    expect(localizedPath('/', 'en')).toBe('/en');
    expect(defaultLocale).toBe('fr');
  });

  it('fournit une locale Intl unique', () => {
    expect(dateLocale('en')).toBe('en-GB');
    expect(dateLocale('fr')).toBe('fr-FR');
  });
});

describe('couverture des traductions de données', () => {
  it('traduit tous les exercices par défaut', () => {
    for (const exercise of DEFAULT_EXERCISES) {
      expect(EXERCISE_NAMES_EN[exercise.name], `exercice ${exercise.name}`).toBeTruthy();
      expect(MUSCLES_EN[exercise.muscle], `muscle ${exercise.muscle}`).toBeTruthy();
      expect(CATEGORIES_EN[exercise.category], `catégorie ${exercise.category}`).toBeTruthy();
    }
  });

  it('traduit les 8 templates de la bibliothèque', () => {
    expect(Object.keys(TEMPLATE_NAMES_EN)).toHaveLength(8);
    expect(Object.keys(TEMPLATE_DESCS_EN)).toHaveLength(8);
  });
});
