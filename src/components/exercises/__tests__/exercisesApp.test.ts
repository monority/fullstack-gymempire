import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dictionary } from '../../../i18n/types';

const mocks = vi.hoisted(() => ({
  getExercises: vi.fn(),
  saveExercise: vi.fn(),
  updateExercise: vi.fn(),
  deleteExercise: vi.fn(),
  toggleExerciseFavorite: vi.fn(),
  getSessions: vi.fn(),
  saveSession: vi.fn(),
  updateSession: vi.fn(),
  openDialog: vi.fn(),
  closeDialog: vi.fn(),
  notify: vi.fn(),
}));

vi.mock('../../../lib/storage/exercises', () => ({
  getExercises: mocks.getExercises,
  saveExercise: mocks.saveExercise,
  updateExercise: mocks.updateExercise,
  deleteExercise: mocks.deleteExercise,
  toggleExerciseFavorite: mocks.toggleExerciseFavorite,
}));
vi.mock('../../../lib/storage/sessions', () => ({
  getSessions: mocks.getSessions,
  saveSession: mocks.saveSession,
  updateSession: mocks.updateSession,
}));

import { buildExercisesLabels, createExercisesApp } from '../exercisesApp';
import type { Exercise, Session } from '../../../lib/storage/types';
import { CUSTOM_MUSCLE } from '../../../lib/exercises-stats';

const LABELS = {
  exercices: {
    editTitle: 'Modifier',
    addTitle: 'Ajouter',
    showTipAria: 'Voir le conseil',
    videoAria: 'Vidéo',
    onYoutube: 'Sur YouTube',
    sets: 'séries',
    favorite: 'Favori',
    unfavorite: 'Retirer des favoris',
    favoriteAria: 'Ajouter aux favoris',
    unfavoriteAria: 'Retirer des favoris',
    formRequired: 'Champs requis',
    formError: 'Erreur',
    toastAdded: 'Exercice ajouté',
    categories: { autre: 'Autre' },
  },
  common: { save: 'Enregistrer', add: 'Ajouter' },
  builder: {
    deleteSet: 'Supprimer',
    warmupTitle: 'Échauffement',
    warmupHint: 'Aucun échauffement',
  },
  tendance: { trendAria: 'Tendance', title: 'Tendances' },
  sessions: { seanceSingular: 'Séance', exoSingular: 'exercice', exoPlural: 'exercices' },
} as unknown as Dictionary;

function exercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'e1',
    name: 'Squat',
    muscle: 'Cuisses',
    category: 'Barre',
    createdAt: '2026-01-01',
    favorite: false,
    ...overrides,
  } as Exercise;
}

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    name: 'Séance A',
    date: '2026-11-17',
    status: 'planned',
    exercises: [],
    ...overrides,
  } as Session;
}

function create() {
  const app = createExercisesApp({
    labels: buildExercisesLabels(LABELS),
    localizedPath: (p) => p,
    clock: {
      now: () => new Date('2026-11-17T12:00:00Z'),
      locale: () => 'fr-FR',
    },
    ui: {
      notify: mocks.notify,
      openDialog: mocks.openDialog,
      closeDialog: mocks.closeDialog,
    },
  });
  return { app };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getExercises.mockReturnValue([
    exercise(),
    exercise({ id: 'e2', name: 'Bench', muscle: 'Pectoraux', favorite: true }),
  ]);
  mocks.getSessions.mockReturnValue([
    session({
      exercises: [
        {
          exerciseId: 'e1',
          name: 'Squat',
          muscle: 'Cuisses',
          sets: [{ setNumber: 1 }, { setNumber: 2 }],
        },
      ],
    } as unknown as Session),
  ]);
  mocks.saveSession.mockImplementation((data: Partial<Session>) =>
    session({ ...data, id: 'new-id' })
  );
});

describe('createExercisesApp (D6)', () => {
  it('loads exercises, sessions and set counts on init', () => {
    const { app } = create();
    app.init();
    expect(app.exercises).toHaveLength(2);
    expect(app.getSetCount('e1')).toBe(2);
    expect(app.getSetCount('unknown')).toBe(0);
  });

  it('filters by search, muscle and favorites', () => {
    const { app } = create();
    app.init();
    expect(app.filtered).toHaveLength(2);
    app.search = 'bench';
    expect(app.filtered.map((e) => e.id)).toEqual(['e2']);
    app.search = '';
    app.muscleFilter = 'Cuisses';
    expect(app.filtered.map((e) => e.id)).toEqual(['e1']);
    app.muscleFilter = '';
    app.favFilter = true;
    expect(app.filtered.map((e) => e.id)).toEqual(['e2']);
    expect(app.hasFilters).toBe(true);
  });

  it('validates the form before saving', () => {
    const { app } = create();
    app.save();
    expect(app.formError).toBe('Champs requis');
    expect(mocks.saveExercise).not.toHaveBeenCalled();

    app.form = { name: 'Dip', muscle: 'Pectoraux', customMuscle: '', category: 'Barre' };
    app.save();
    expect(mocks.saveExercise).toHaveBeenCalledWith({
      name: 'Dip',
      muscle: 'Pectoraux',
      category: 'Barre',
    });
    expect(mocks.closeDialog).toHaveBeenCalledWith('exo-form-dialog');
  });

  it('edits an exercise with a custom muscle group', () => {
    const { app } = create();
    app.init();
    app.edit(exercise({ muscle: 'Trapèze' }));
    expect(app.form.muscle).toBe(CUSTOM_MUSCLE);
    expect(app.form.customMuscle).toBe('Trapèze');
  });

  it('toggles tips open/closed', () => {
    const { app } = create();
    app.toggleTip('e1');
    expect(app.isTipOpen('e1')).toBe(true);
    app.toggleTip('e1');
    expect(app.isTipOpen('e1')).toBe(false);
  });

  it('generates warmups only with a working weight', () => {
    const { app } = create();
    expect(app.hasWorkingWeight()).toBe(false);
    app.generateWarmup();
    expect(mocks.notify).toHaveBeenCalledWith('Aucun échauffement');

    app.addSets[0].weight = 100;
    expect(app.hasWorkingWeight()).toBe(true);
    app.generateWarmup();
    expect(app.addSets.some((s) => s.type === 'warmup')).toBe(true);
  });

  it('adds an exercise to a new session using the injected clock', () => {
    const { app } = create();
    app.init();
    app.openAddToSession(exercise());
    app.addToSessionId = 'new';
    app.newSessionName = 'Ma séance';
    app.addSets = [{ type: 'work', weight: 60, reps: 8 }];
    mocks.getSessions.mockImplementation(() => [session({ id: 'new-id', exercises: [] })]);
    app.submitAddToSession();

    expect(mocks.saveSession).toHaveBeenCalledWith({
      name: 'Ma séance',
      date: '2026-11-17',
      exercises: [],
      status: 'planned',
    });
    expect(mocks.updateSession).toHaveBeenCalledWith(
      'new-id',
      expect.objectContaining({
        exercises: expect.arrayContaining([
          expect.objectContaining({ exerciseId: 'e1', name: 'Squat' }),
        ]),
      })
    );
    expect(mocks.notify).toHaveBeenCalledWith('Exercice ajouté');
  });
});
