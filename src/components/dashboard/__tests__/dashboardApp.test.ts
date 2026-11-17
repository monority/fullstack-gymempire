import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSessions: vi.fn(),
  getSessionsThisWeek: vi.fn(),
  getExercises: vi.fn(),
  getSettings: vi.fn(),
}));
vi.mock('../../../lib/storage/sessions', () => ({
  getSessions: mocks.getSessions,
  getSessionsThisWeek: mocks.getSessionsThisWeek,
}));
vi.mock('../../../lib/storage/exercises', () => ({ getExercises: mocks.getExercises }));
vi.mock('../../../lib/storage/settings', () => ({ getSettings: mocks.getSettings }));

import { createDashboardApp } from '../dashboardApp';
import type { Session } from '../../../lib/storage/types';

const labels = {
  weeklyMoreSingular: 'séance restante',
  sessionsUnit: 'séances',
  remainingHint: 'Encore {count} {unit}',
  noRecent: 'Aucune séance',
  viewAll: 'Tout voir',
  recentSessions: 'Séances récentes',
  nextSession: 'Prochaine séance',
  continueWorkout: 'Continuer',
  startWorkout: 'Commencer',
  plannedWorkoutHint: 'Prévue',
  loading: 'Chargement',
  loadError: 'Erreur',
  retry: 'Réessayer',
  title: 'Dashboard',
  description: 'Bienvenue',
  totalSessions: 'Séances',
  totalVolume: 'Volume',
  bestPRs: 'Records',
  streak: 'Série',
  createFirst: 'Créer',
  weeklyGoalEyebrow: 'Objectif',
  weeklyGoalDone: 'Objectif atteint',
  exercisesUnit: 'exercices',
  daysUnit: 'jours',
  exoPlural: 'exercices',
  exoSingular: 'exercice',
  daysSingular: 'jour',
  kg: 'kg',
  todayVolume: 'Volume du jour',
  weeklyVolumeTrend: 'Tendance',
  noWeeklyVolume: 'Aucun volume',
  noWeeklyVolumeHint: 'Aucune donnée',
  sessionCount: 'séances',
  exerciseCount: 'exercices',
  top1RM: 'Meilleur 1RM',
  status: { completed: 'Terminée', inProgress: 'En cours', planned: 'Prévue' },
} as never;

function session(id: string, date: string, status = 'completed'): Session {
  return {
    id,
    name: 'Séance ' + id,
    date,
    status,
    exercises: [
      {
        exerciseId: 'e1',
        name: 'Squat',
        muscle: 'Cuisses',
        sets: [
          { exerciseId: 'e1', setNumber: 1, type: 'work', weight: 100, reps: 5, completed: true },
        ],
      },
    ],
  } as Session;
}

function create() {
  const errors: unknown[] = [];
  const app = createDashboardApp(labels, (p) => p, {
    locale: () => 'fr',
    today: () => new Date('2026-11-17T12:00:00Z'),
    onError: (error) => errors.push(error),
    translateMuscle: (name) => 'TR:' + name,
  });
  return { app, errors };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getExercises.mockReturnValue([]);
  mocks.getSessions.mockReturnValue([]);
  mocks.getSessionsThisWeek.mockReturnValue([]);
  mocks.getSettings.mockReturnValue({ weeklyGoal: 3 });
});

describe('createDashboardApp (D8)', () => {
  it('loads sessions newest first and clears the loading state', () => {
    mocks.getSessions.mockReturnValue([
      session('s1', '2026-11-01T10:00:00Z'),
      session('s2', '2026-11-16T10:00:00Z'),
    ]);
    const { app } = create();
    app.init();
    expect(app.sessions.map((s) => s.id)).toEqual(['s2', 's1']);
    expect(app.isLoading).toBe(false);
    expect(app.loadError).toBe(false);
    expect(app.hasSessions).toBe(true);
    expect(app.recentSessions).toHaveLength(2);
  });

  it('reports load errors and can retry', () => {
    mocks.getSessions.mockImplementation(() => {
      throw new Error('boom');
    });
    const { app, errors } = create();
    app.init();
    expect(app.loadError).toBe(true);
    expect(errors).toHaveLength(1);
    mocks.getSessions.mockReturnValue([]);
    app.retry();
    expect(app.loadError).toBe(false);
  });

  it('finds the next in-progress or planned session', () => {
    mocks.getSessions.mockReturnValue([
      session('s1', '2026-11-16T10:00:00Z', 'completed'),
      session('s2', '2026-11-17T10:00:00Z', 'planned'),
    ]);
    const { app } = create();
    app.init();
    expect(app.nextSession?.id).toBe('s2');
  });

  it('computes weekly progress and the remaining hint from injected settings', () => {
    mocks.getSessionsThisWeek.mockReturnValue([session('s1', '2026-11-17')]);
    const { app } = create();
    app.init();
    expect(app.weeklyProgress).toBeCloseTo(1 / 3);
    expect(app.remainingHintText()).toBe('Encore 2 séances');
  });

  it('uses injected clock and locale for week literals', () => {
    const { app } = create();
    expect(app.todayIdx).toBe(2); // mardi 17 novembre 2026 (dimanche = 0)
    expect(app.dayLabels).toEqual(['D', 'L', 'M', 'M', 'J', 'V', 'S']);
    expect(app.muscleLabel('Cuisses')).toBe('TR:Cuisses');
  });

  it('exposes computed KPIs', () => {
    mocks.getSessions.mockReturnValue([session('s1', '2026-11-17T10:00:00Z')]);
    const { app } = create();
    app.init();
    expect(app.kpis.totalSessions).toBe(1);
    expect(app.kpis.totalVolume).toBe(500);
    expect(app.sessionVolume(app.sessions[0])).toBe(500);
  });
});
