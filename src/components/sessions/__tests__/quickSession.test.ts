import { describe, it, expect, beforeEach } from 'vitest';
import { createQuickSession, type QuickSessionDeps } from '../quickSession';
import type { Session } from '../../../lib/storage/types';

const LABELS = {
  allDone: 'Tout est fait',
  endedEarly: 'Terminé plus tôt',
  completionFull: 'Séance complète',
  completionPartial: 'Séance partielle',
  setsShort: 'séries',
  exitConfirm: 'Quitter ?',
  partialFinishConfirm: 'Finir quand même ?',
  nextUp: 'Prochain',
  typeWarmup: 'Échauffement',
  typeWork: 'Travail',
  typeTop: 'Top',
  typeDrop: 'Drop',
  typeFailure: 'Échec',
} as unknown as QuickSessionDeps['labels'];

function makeSession(): Session {
  return {
    id: 'tpl-1',
    name: 'Push',
    date: '2026-11-16',
    status: 'planned',
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Développé couché barre',
        muscle: 'Pectoraux',
        sets: [
          { exerciseId: 'e1', setNumber: 1, weight: 80, reps: 8, type: 'work', completed: false },
          { exerciseId: 'e1', setNumber: 2, weight: 80, reps: 8, type: 'work', completed: false },
        ],
      },
      {
        exerciseId: 'e2',
        name: 'Curl haltères',
        muscle: 'Biceps',
        sets: [
          { exerciseId: 'e2', setNumber: 1, weight: 14, reps: 10, type: 'work', completed: false },
        ],
      },
    ],
  };
}

function makeDeps(overrides: Partial<QuickSessionDeps> = {}): QuickSessionDeps & {
  sessions: Session[];
  updates: Array<Partial<Session>>;
  navigated: string[];
  confirmed: boolean;
} {
  const sessions: Session[] = [makeSession()];
  const updates: Array<Partial<Session>> = [];
  const navigated: string[] = [];
  const state = { sessions, updates, navigated, confirmed: true };
  return {
    labels: LABELS,
    storage: {
      getSessions: () => state.sessions,
      saveSession: (s) => {
        const created = { ...s, id: 'live-1' } as Session;
        state.sessions.push(created);
        return created;
      },
      updateSession: (_id, u) => {
        state.updates.push(u);
        const last = state.sessions[state.sessions.length - 1];
        state.sessions[state.sessions.length - 1] = { ...last, ...u };
      },
    },
    defaultRestSeconds: () => 90,
    restSecondsFor: (_name, fallback) => fallback,
    unit: () => 'kg',
    confirm: () => state.confirmed,
    navigate: (href) => state.navigated.push(href),
    sessionsHref: '/sessions',
    detailHref: (id) => '/sessions/detail?id=' + id,
    ...overrides,
    // expose for assertions
    ...state,
  } as QuickSessionDeps & typeof state;
}

describe('createQuickSession', () => {
  let deps: ReturnType<typeof makeDeps>;

  beforeEach(() => {
    deps = makeDeps();
  });

  it('starts a session: clones template, resets sets, points at first pending set', () => {
    const app = createQuickSession(deps);
    app.selectedSessionId = 'tpl-1';
    app.startSession();
    expect(app.state).toBe('working');
    expect(app.session?.sourceSessionId).toBe('tpl-1');
    expect(app.currentExerciseIndex).toBe(0);
    expect(app.currentSetIndex).toBe(0);
    expect(app.totalSets).toBe(3);
    expect(app.currentSet?.completed).toBe(false);
  });

  it('navigates forward through sets and exercises', () => {
    const app = createQuickSession(deps);
    app.selectedSessionId = 'tpl-1';
    app.startSession();
    app.nextSet();
    expect(app.currentSetIndex).toBe(1);
    app.nextSet();
    expect(app.currentExerciseIndex).toBe(1);
    expect(app.currentSetIndex).toBe(0);
    expect(app.canGoNext()).toBe(false);
  });

  it('navigates backward across the exercise boundary', () => {
    const app = createQuickSession(deps);
    app.selectedSessionId = 'tpl-1';
    app.startSession();
    app.nextSet();
    app.nextSet();
    app.prevSet();
    expect(app.currentExerciseIndex).toBe(0);
    expect(app.currentSetIndex).toBe(1);
    expect(app.canGoPrev()).toBe(true);
    app.prevSet();
    expect(app.currentSetIndex).toBe(0);
    expect(app.canGoPrev()).toBe(false);
  });

  it('completing all sets finishes the session as completed', () => {
    const app = createQuickSession(deps);
    app.selectedSessionId = 'tpl-1';
    app.startSession();
    app.completeSet();
    expect(app.state).toBe('resting');
    app.skipRest();
    app.completeSet();
    app.skipRest();
    app.completeSet();
    expect(app.state).toBe('completed');
    expect(app.session?.status).toBe('completed');
    expect(app.recordedSets).toBe(3);
  });

  it('undo restores the previous set and reverts a completed status', () => {
    const app = createQuickSession(deps);
    app.selectedSessionId = 'tpl-1';
    app.startSession();
    app.completeSet();
    app.skipRest();
    app.completeSet();
    app.skipRest();
    app.completeSet();
    expect(app.state).toBe('completed');
    app.undoLastSet();
    expect(app.state).toBe('working');
    expect(app.session?.status).toBe('in-progress');
    expect(app.recordedSets).toBe(2);
    expect(app.currentExerciseIndex).toBe(1);
    expect(app.currentSetIndex).toBe(0);
    expect(app.canUndo).toBe(true);
  });

  it('stopSession persists and navigates away after confirmation', () => {
    const app = createQuickSession(deps);
    app.selectedSessionId = 'tpl-1';
    app.startSession();
    app.stopSession();
    expect(deps.navigated).toEqual(['/sessions']);
    expect(deps.updates.length).toBeGreaterThan(0);
  });

  it('completion labels reflect partial vs full progress', () => {
    const app = createQuickSession(deps);
    expect(app.completionTitle).toBe('Tout est fait');
    app.selectedSessionId = 'tpl-1';
    app.startSession();
    expect(app.completionMessage).toContain('0');
  });
});
