import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getSessionById: vi.fn() }));
vi.mock('../../../lib/storage/sessions', () => ({ getSessionById: mocks.getSessionById }));

import { createPrintSheetApp } from '../printSheetApp';
import type { Session } from '../../../lib/storage/types';

const labels = {
  common: { date: 'Date' },
  detail: {
    completed: 'Terminée',
    inProgress: 'En cours',
    planned: 'Prévue',
    typeWarmup: 'Échauffement',
    typeWork: 'Travail',
    typeTop: 'Top',
    typeDrop: 'Drop',
    typeFailure: 'Échec',
    at: 'à',
    duration: 'Durée',
    totalVolume: 'Volume total',
    exercises: 'Exercices',
    sets: 'Séries',
    notes: 'Notes',
    statusLabel: 'Statut',
    colWeight: 'Poids',
    colReps: 'Reps',
    colType: 'Type',
    printFooter: 'GYM EMPIRE',
    printNotFoundTitle: 'Introuvable',
    printNotFoundDesc: 'Séance absente',
    printNotFoundBack: 'Retour',
    supersetLabel: 'Superset',
  },
  locale: () => 'fr',
  backHref: '/sessions',
};

function session(): Session {
  return {
    id: 's1',
    name: 'Séance A',
    date: '2026-11-17T10:30:00Z',
    status: 'completed',
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Squat',
        muscle: 'Cuisses',
        sets: [
          { exerciseId: 'e1', setNumber: 1, type: 'work', weight: 100, reps: 5, completed: true },
          { exerciseId: 'e1', setNumber: 2, type: 'work', weight: 100, reps: 5, completed: false },
        ],
      },
    ],
    supersets: [{ exercises: ['e1'] }],
  } as Session;
}

function create(search = '?id=s1', printed = false) {
  const scheduled: Array<{ fn: () => void; ms: number }> = [];
  let flag = printed;
  const printedCalls: number[] = [];
  const app = createPrintSheetApp({
    search,
    labels,
    ui: {
      alreadyPrinted: () => flag,
      markPrinted: () => {
        flag = true;
      },
      print: () => printedCalls.push(Date.now()),
      schedule: (fn, ms) => scheduled.push({ fn, ms }),
    },
  });
  return { app, scheduled, printedCalls, isPrinted: () => flag };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSessionById.mockReturnValue(session());
});

describe('createPrintSheetApp (D8)', () => {
  it('marks not found without an id', () => {
    const { app } = create('');
    app.init();
    expect(app.notFound).toBe(true);
    expect(app.session).toBeNull();
  });

  it('loads the session and schedules a single print', () => {
    const { app, scheduled, printedCalls, isPrinted } = create();
    app.init();
    expect(app.session?.id).toBe('s1');
    expect(isPrinted()).toBe(true);
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].ms).toBe(400);
    scheduled[0].fn();
    expect(printedCalls).toHaveLength(1);
    app.schedulePrint();
    expect(scheduled).toHaveLength(1);
  });

  it('does not reprint when the page flag is already set', () => {
    const { app, scheduled } = create('?id=s1', true);
    app.init();
    expect(scheduled).toHaveLength(0);
  });

  it('computes volume, sets and superset labels', () => {
    const { app } = create();
    app.init();
    expect(app.totalVolume).toBe(500);
    expect(app.totalSets).toBe(2);
    const ex = app.session!.exercises[0];
    expect(app.groupFor(ex)).toEqual({ n: 1 });
    expect(app.supersetLabelFor(ex)).toBe('Superset 1');
  });

  it('formats set RPE with the uRPE prefix', () => {
    const { app } = create();
    expect(app.formatSetRpe({ rpe: 7.5, rpeType: 'rpe' })).toBe('RPE 7.5');
    expect(app.formatSetRpe({ rpe: 7, rpeType: 'urpe' })).toBe('uRPE 7');
    expect(app.formatSetRpe({ rpe: null })).toBe('-');
  });
});
