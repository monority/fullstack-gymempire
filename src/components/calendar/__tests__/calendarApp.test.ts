import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dictionary } from '../../../i18n/types';

const mocks = vi.hoisted(() => ({ getSessions: vi.fn() }));
vi.mock('../../../lib/storage/sessions', () => ({ getSessions: mocks.getSessions }));

import { createCalendarApp } from '../calendarApp';
import type { Session } from '../../../lib/storage/types';

const LABELS = {
  weekdays: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  monthNames: [
    'Janvier',
    'Février',
    'Mars',
    'Avril',
    'Mai',
    'Juin',
    'Juillet',
    'Août',
    'Septembre',
    'Octobre',
    'Novembre',
    'Décembre',
  ],
  status: { completed: 'Terminée', inProgress: 'En cours', planned: 'Prévue' },
  seanceSingular: 'séance',
  seancePlural: 'séances',
} as unknown as Dictionary['calendrier'] & {
  status: { completed: string; inProgress: string; planned: string };
  seanceSingular: string;
  seancePlural: string;
};

function session(date: string): Session {
  return { id: date, name: 'Séance', date, status: 'completed', exercises: [] } as Session;
}

function create(today = new Date('2026-11-17T12:00:00Z')) {
  return createCalendarApp({
    labels: LABELS,
    today: () => today,
    localizedPath: (p) => p,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getSessions.mockReturnValue([]);
});

describe('createCalendarApp (D7)', () => {
  it('starts on the injected month', () => {
    const app = create();
    expect(app.currentYear).toBe(2026);
    expect(app.currentMonth).toBe(10);
    expect(app.monthName()).toBe('Novembre 2026');
  });

  it('navigates across year boundaries', () => {
    const app = create(new Date('2026-01-15T12:00:00Z'));
    app.prevMonth();
    expect(app.currentYear).toBe(2025);
    expect(app.currentMonth).toBe(11);
    app.nextMonth();
    expect(app.currentYear).toBe(2026);
    expect(app.currentMonth).toBe(0);
    app.goToday();
    expect(app.currentMonth).toBe(0);
  });

  it('loads and assigns sessions to days', () => {
    mocks.getSessions.mockReturnValue([session('2026-11-17T10:00:00Z')]);
    const app = create();
    app.init();
    expect(app.allSessions).toHaveLength(1);
    expect(app.days.length).toBeGreaterThan(27);
    expect(app.monthSessionCount).toBe(1);
  });

  it('ignores selection of padding days', () => {
    const app = create();
    app.init();
    const padding = app.days.find((d) => !d.isCurrentMonth);
    if (padding) {
      app.selectDate(padding);
      expect(app.selectedDate).toBe('');
    }
  });

  it('computes current and longest streaks without Date.now()', () => {
    mocks.getSessions.mockReturnValue([
      session('2026-11-17T10:00:00Z'),
      session('2026-11-16T10:00:00Z'),
      session('2026-11-15T10:00:00Z'),
    ]);
    const app = create();
    app.init();
    expect(app.currentStreak).toBe(3);
    expect(app.longestStreak).toBe(3);
  });

  it('allows a streak to start yesterday after a rest day', () => {
    mocks.getSessions.mockReturnValue([session('2026-11-16T10:00:00Z')]);
    const app = create();
    app.init();
    expect(app.currentStreak).toBe(1);
  });

  it('sums volume from completed sets in the current month only', () => {
    mocks.getSessions.mockReturnValue([
      {
        ...session('2026-11-17T10:00:00Z'),
        exercises: [
          {
            exerciseId: 'e1',
            name: 'Squat',
            muscle: 'Cuisses',
            sets: [
              { setNumber: 1, completed: true, weight: 100, reps: 5 },
              { setNumber: 2, completed: false, weight: 100, reps: 5 },
            ],
          },
        ],
      } as unknown as Session,
      {
        ...session('2026-10-17T10:00:00Z'),
        exercises: [],
      } as Session,
    ]);
    const app = create();
    app.init();
    expect(app.monthVolume).toBe(500);
  });

  it('builds an aria label with status counts', () => {
    const app = create();
    app.init();
    const day = {
      date: '2026-11-17',
      isCurrentMonth: true,
      sessions: [session('2026-11-17T10:00:00Z')],
    };
    expect(app.dayAriaLabel(day as never)).toContain('1 séance');
  });
});
