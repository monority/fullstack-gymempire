// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ store: vi.fn() }));
vi.mock('../alpine', () => ({
  registerStore: (name: string, value: unknown) => mocks.store(name, value),
  getAlpine: () => null,
  registerAlpine: () => {},
  installAlpineLifecycle: () => {},
}));

import { createI18nStore, registerI18nStore } from '../i18n-store';

describe('i18n store', () => {
  it('expose les helpers de traduction pour la locale', () => {
    const store = createI18nStore('fr');
    expect(store.locale).toBe('fr');
    expect(store.dateLocale).toBe('fr-FR');
    expect(store.trExercise('Squat barre')).toBe('Squat barre');
    expect(store.trMuscle('Quadriceps')).toBe('Quadriceps');
    expect(store.muscleHue('Pectoraux')).toBe('chest');

    const en = createI18nStore('en');
    expect(en.dateLocale).toBe('en-GB');
    expect(en.trExercise('Squat barre')).toBe('Barbell Squat');
  });

  it('enregistre le store dans Alpine', () => {
    registerI18nStore();
    expect(mocks.store).toHaveBeenCalledWith('i18n', expect.objectContaining({ locale: 'fr' }));
  });
});
