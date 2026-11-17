import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dictionary } from '../../../i18n/types';

const mocks = vi.hoisted(() => ({
  getSessionById: vi.fn(),
  updateSession: vi.fn(),
  deleteSession: vi.fn(),
  exportSessionAsCsv: vi.fn(),
  showToast: vi.fn(),
  openDialog: vi.fn(),
  closeDialog: vi.fn(),
  navigate: vi.fn(),
  translateExercise: vi.fn(),
}));

vi.mock('../../../lib/storage/sessions', () => ({
  getSessionById: mocks.getSessionById,
  updateSession: mocks.updateSession,
  deleteSession: mocks.deleteSession,
}));
vi.mock('../../../lib/storage/csv', () => ({ exportSessionAsCsv: mocks.exportSessionAsCsv }));

import { buildSessionDetailLabels, createSessionDetailApp } from '../sessionDetailApp';
import type { Session } from '../../../lib/storage/types';

const LABELS = {
  detail: {
    completed: 'Terminée',
    inProgress: 'En cours',
    planned: 'Prévue',
    moodLabel: 'Humeur',
    moodGreat: 'Super',
    moodGood: 'Bien',
    moodOk: 'Moyen',
    moodTired: 'Fatigué',
    moodBad: 'Épuisé',
    suggestionAllTenHeadline: 'Max',
    suggestionAllTenDetail: 'Tout à 10',
    suggestionIncreaseHeadline: 'Monte',
    suggestionIncreaseDetail: 'Augmente',
    suggestionMaintainHeadline: 'Garde',
    suggestionMaintainDetail: 'Maintien',
    suggestionContinueHeadline: 'Continue',
    suggestionContinueDetail: 'Continue',
    typeWarmup: 'Échauffement',
    typeWork: 'Travail',
    typeTop: 'Top set',
    typeDrop: 'Drop set',
    typeFailure: 'Échec',
    supersetLabel: 'Superset',
    rpeEasy: 'Facile',
    rpeModerate: 'Modéré',
    rpeHard: 'Difficile',
    rpeMaxTone: 'Max',
    fatigueVeryFresh: 'Très frais',
    fatigueFresh: 'Frais',
    fatigueNormal: 'Normal',
    fatigueTired: 'Fatigué',
    fatigueExhausted: 'Épuisé',
    csvDownloaded: 'CSV téléchargé',
    csvDownloadFailed: 'Échec export CSV',
    exercises: 'Exercices',
    shareSetsLabel: 'séries',
    setSingular: 'série',
    setPlural: 'séries',
    moreSingular: 'de plus',
    morePlural: 'de plus',
    shareFooter: 'GYM EMPIRE',
  },
  sessions: { volume: 'Volume' },
} as unknown as Dictionary;

function makeSession(overrides: Partial<Session> = {}): Session {
  return {
    id: 's1',
    name: 'Séance A',
    date: '2026-11-17T10:00:00Z',
    status: 'completed',
    exercises: [],
    supersets: [],
    ...overrides,
  } as Session;
}

function create(search = '?id=s1') {
  const labels = buildSessionDetailLabels(LABELS);
  labels.printHref = '/sessions/print';
  const app = createSessionDetailApp({
    labels,
    search,
    localizedPath: (p) => p,
    ui: {
      notify: mocks.showToast,
      openDialog: mocks.openDialog,
      closeDialog: mocks.closeDialog,
      navigate: mocks.navigate,
      translateExercise: mocks.translateExercise,
    },
  });
  return { app, labels };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.translateExercise.mockImplementation((name: string) => name);
});

describe('createSessionDetailApp (D5)', () => {
  it('marks not found when no id is present', () => {
    const { app } = create('');
    app.init();
    expect(app.notFound).toBe(true);
    expect(app.session).toBeNull();
  });

  it('marks not found when storage has no session', () => {
    mocks.getSessionById.mockReturnValue(undefined);
    const { app } = create('?id=inconnu');
    app.init();
    expect(app.sessionId).toBe('inconnu');
    expect(app.notFound).toBe(true);
  });

  it('loads the session and localizes its mood', () => {
    mocks.getSessionById.mockReturnValue(makeSession({ mood: 'tired' }));
    const { app } = create();
    app.init();
    expect(app.session?.id).toBe('s1');
    expect(app.moodLabel('tired')).toBe('Fatigué');
    expect(app.moodIcon('tired')).toContain('<svg');
    expect(app.moodLabel(null)).toBe('');
  });

  it('computes superset ordinal and tint from persisted data', () => {
    const ex = {
      exerciseId: 'e1',
      name: 'Squat',
      muscle: 'Cuisses',
      sets: [],
    };
    mocks.getSessionById.mockReturnValue(
      makeSession({
        exercises: [ex],
        supersets: [{ exercises: ['e1'] }],
      })
    );
    const { app } = create();
    app.init();
    expect(app.supersetGroup(ex)).toEqual({ n: 1, color: 1 });
    expect(app.supersetTint(ex)).toBe('exo-row--g1');
    expect(app.supersetLabelFor(ex)).toBe('Superset 1');
    expect(app.supersetMembers(ex)).toBe('Squat');
  });

  it('delegates persistence, dialogs and navigation', () => {
    mocks.getSessionById.mockReturnValue(makeSession());
    const { app } = create();
    app.init();
    app.updateStatus('planned');
    expect(mocks.updateSession).toHaveBeenCalledWith('s1', { status: 'planned' });

    app.openDeleteDialog();
    expect(mocks.openDialog).toHaveBeenCalledWith('delete-session-dialog');

    app.confirmDelete();
    expect(mocks.deleteSession).toHaveBeenCalledWith('s1');
    expect(mocks.closeDialog).toHaveBeenCalledWith('delete-session-dialog');
    expect(mocks.navigate).toHaveBeenCalledWith('/sessions');
  });

  it('builds hrefs from the injected path helper', () => {
    mocks.getSessionById.mockReturnValue(makeSession());
    const { app } = create();
    app.init();
    expect(app.compareHref()).toContain('id1=s1');
    expect(app.quickSessionHref()).toContain('session=s1');
    expect(app.editHref()).toContain('edit=s1');
    expect(app.printHref()).toBe('/sessions/print?id=s1');
  });
});
