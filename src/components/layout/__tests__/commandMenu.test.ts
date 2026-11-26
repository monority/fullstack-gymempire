// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getExercises: vi.fn(),
  getSessions: vi.fn(),
}));

vi.mock('../../../lib/storage/exercises', () => ({ getExercises: mocks.getExercises }));
vi.mock('../../../lib/storage/sessions', () => ({ getSessions: mocks.getSessions }));
vi.mock('../../../i18n', () => ({
  getLocale: () => 'fr',
  t: () => ({
    nav: {
      dashboard: 'Dashboard',
      rapide: 'Séance rapide',
      creer: 'Nouvelle séance',
      exercices: 'Exercices',
      progression: 'Progression',
      poidsMesures: 'Poids',
      records: 'Records',
      statistiques: 'Statistiques',
      calculateur: 'Calculateur',
      calendrier: 'Calendrier',
      seances: 'Séances',
      timer: 'Chronomètre',
      settings: 'Réglages',
    },
    command: {
      placeholder: 'Rechercher…',
      noResults: 'Aucun résultat',
      noResultsHint: 'Essayez autre chose',
      hintOpen: 'Ouvrir',
      hintNav: 'Naviguer',
      hintSelect: 'Sélectionner',
      hintClose: 'Fermer',
      pages: 'Pages',
      exercises: 'Exercices',
      sessions: 'Séances',
    },
  }),
  localizedPath: (p: string) => p,
  trExercise: (n: string) => n,
  trMuscle: (m: string) => m,
  dateLocale: () => 'fr-FR',
}));

import { createCommandMenu } from '../quickSearchRegistration';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getExercises.mockReturnValue([
    { id: 'e1', name: 'Développé couché', muscle: 'Pectoraux' },
    { id: 'e2', name: 'Squat', muscle: 'Quadriceps' },
  ]);
  mocks.getSessions.mockReturnValue([
    { id: 's1', name: 'Push A', date: '2026-11-25' },
    { id: 's2', name: 'Legs', date: '2026-11-24' },
  ]);
});

function create() {
  const app = createCommandMenu();
  app.init();
  return app;
}

describe('createCommandMenu', () => {
  it('charge les exercices et séances une seule fois à l’init', () => {
    const app = create();
    expect(app.exercises).toHaveLength(2);
    expect(app.sessions).toHaveLength(2);
    expect(mocks.getExercises).toHaveBeenCalledTimes(1);
    expect(mocks.getSessions).toHaveBeenCalledTimes(1);
  });

  it('affiche toutes les pages quand la recherche est vide', () => {
    const app = create();
    expect(app.groups).toHaveLength(1);
    expect(app.groups[0].id).toBe('pages');
    expect(app.groups[0].items.length).toBeGreaterThan(10);
    expect(app.noResults).toBe(false);
  });

  it('filtre pages, exercices et séances et aplatit les index', () => {
    const app = create();
    app.keyword = 'push';
    const groups = app.groups;
    expect(groups.map((g) => g.id)).toEqual(['sessions']);
    expect(groups[0].items[0].label).toBe('Push A');
    expect(app.flatItems.map((i) => i.index)).toEqual(app.flatItems.map((_, i) => i));
  });

  it('trouve un exercice par son muscle', () => {
    const app = create();
    app.keyword = 'pectoraux';
    const exercises = app.groups.find((g) => g.id === 'exercises');
    expect(exercises?.title).toBe('Pectoraux');
    expect(exercises?.items.map((i) => i.key)).toEqual(['exo:e1']);
  });

  it('signale l’absence de résultats', () => {
    const app = create();
    app.keyword = 'zzzzinconnu';
    expect(app.noResults).toBe(true);
    expect(app.groups).toEqual([]);
  });

  it('fait défiler la sélection avec un modulo', () => {
    const app = create();
    const n = app.flatItems.length;
    expect(n).toBeGreaterThan(2);
    const el = { scrollIntoView: vi.fn() };
    (app as unknown as { $el: { querySelector: () => unknown } }).$el = {
      querySelector: () => el,
    };
    (app as unknown as { $nextTick: (fn: () => void) => void }).$nextTick = (fn) => fn();

    app.move(1);
    expect(app.highlight).toBe(1);
    app.move(-5);
    expect(app.highlight).toBe((1 - 5 + n) % n);
    expect(el.scrollIntoView).toHaveBeenCalled();
  });

  it('réinitialise la recherche', () => {
    const app = create();
    app.keyword = 'squat';
    app.highlight = 3;
    app.reset();
    expect(app.keyword).toBe('');
    expect(app.highlight).toBe(0);
  });
});
