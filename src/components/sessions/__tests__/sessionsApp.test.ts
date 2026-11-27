import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dictionary } from '../../../i18n/types';

const mocks = vi.hoisted(() => ({
  getSessions: vi.fn(),
  getSessionById: vi.fn(),
  saveSession: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
}));

vi.mock('../../../lib/storage/sessions', () => ({
  getSessions: mocks.getSessions,
  getSessionById: mocks.getSessionById,
  saveSession: mocks.saveSession,
  updateSession: mocks.updateSession,
  deleteSession: mocks.deleteSession,
}));

import { buildSessionsLabels, createSessionsApp } from '../sessionsApp';
import type { Session } from '../../../lib/storage/types';

const LABELS = {
  sessions: {
    exoPlural: 'exercices',
    exoSingular: 'exercice',
    moodLabel: 'Humeur',
    noResult: 'Aucun résultat',
    noMatchPrefix: 'Aucun résultat pour',
    resetSearch: 'Réinitialiser',
    noSession: 'Aucune séance',
    noMatch: 'Aucune séance trouvée',
    seanceSingular: 'séance',
    seancePlural: 'séances',
    pluralS: 's',
    deleteConfirm: 'Supprimer ?',
    seenAriaPrefix: 'Vu le',
    moreActions: 'Plus',
    resume: 'Reprendre',
    markComplete: 'Terminer',
    duplicate: 'Dupliquer',
    moveDate: 'Déplacer',
    copySuffix: '(copie)',
    completed: 'Terminée',
    inProgress: 'En cours',
    planned: 'Prévue',
    moodGreat: 'Super',
    moodGood: 'Bien',
    moodOk: 'Moyen',
    moodTired: 'Fatigué',
    moodBad: 'Épuisé',
  },
} as unknown as Dictionary;

function session(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    name: 'Séance A',
    date: '2026-11-16T10:00:00Z',
    status: 'planned',
    exercises: [],
    ...overrides,
  } as Session;
}

function create(confirm = true) {
  const app = createSessionsApp({
    labels: buildSessionsLabels(LABELS),
    today: () => new Date('2026-11-17T12:00:00Z'),
    localizedPath: (p) => p,
    ui: {
      confirm: () => confirm,
      navigate: vi.fn(),
      translateMuscle: (n) => n,
      openDialog: vi.fn(),
      closeDialog: vi.fn(),
    },
  });
  return { app };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSessions.mockReturnValue([
    session(),
    session({ id: 's2', name: 'Séance B', date: '2026-11-15' }),
  ]);
});

describe('createSessionsApp', () => {
  it('sorts sessions by date descending', () => {
    const { app } = create();
    app.init();
    expect(app.sessions.map((s) => s.id)).toEqual(['s1', 's2']);
    expect(app.todayIso).toBe('2026-11-17');
  });

  it('filters by search and builds the count label', () => {
    const { app } = create();
    app.init();
    app.search = 'Séance B';
    expect(app.filtered.map((s) => s.id)).toEqual(['s2']);
    expect(app.countLabel).toContain('1');
  });

  it('uses the injected labels for mood and status', () => {
    const { app } = create();
    expect(app.moodLabel('great')).toBe('Super');
    expect(app.moodIcon('great')).toContain('<svg');
    expect(app.statusLabel('completed')).toBe('Terminée');
  });

  it('deletes only after confirmation', () => {
    const declined = create(false);
    declined.app.init();
    declined.app.deleteSession('s1');
    expect(mocks.deleteSession).not.toHaveBeenCalled();

    const accepted = create(true);
    accepted.app.init();
    accepted.app.deleteSession('s1');
    expect(mocks.deleteSession).toHaveBeenCalledWith('s1');
    expect(accepted.app.sessions.map((s) => s.id)).toEqual(['s2']);
  });

  it('duplicates a session with fresh sets and an injected date', () => {
    mocks.getSessionById.mockReturnValue(
      session({
        exercises: [
          {
            exerciseId: 'e1',
            name: 'Squat',
            muscle: 'Cuisses',
            sets: [
              {
                exerciseId: 'e1',
                setNumber: 1,
                type: 'work',
                weight: 100,
                reps: 5,
                completed: true,
              },
            ],
          },
        ],
      })
    );
    const { app } = create();
    app.duplicateSession('s1');
    const saved = mocks.saveSession.mock.calls[0][0];
    expect(saved.name).toBe('Séance A (copie)');
    expect(saved.date).toBe('2026-11-17');
    expect(saved.exercises[0].sets[0].completed).toBe(false);
  });

  it('moves a session to the selected date', () => {
    mocks.getSessionById.mockReturnValue(session());
    const { app } = create();
    app.openMove('s1');
    expect(app.moveDate).toBe('2026-11-16');
    app.confirmMove();
    expect(mocks.updateSession).toHaveBeenCalledWith(
      's1',
      expect.objectContaining({ date: expect.any(String), status: 'planned' })
    );
    expect(app.moveSessionId).toBe('');
  });
});
