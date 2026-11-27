import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createReminderSettings, type NotificationApi } from '../reminderSettings';
import type { Settings } from '../../../lib/storage/types';

const labels = {
  reminderDayMon: 'Lun',
  reminderDayTue: 'Mar',
  reminderDayWed: 'Mer',
  reminderDayThu: 'Jeu',
  reminderDayFri: 'Ven',
  reminderDaySat: 'Sam',
  reminderDaySun: 'Dim',
  reminderGranted: 'Autorisé',
  reminderDenied: 'Refusé',
  reminderDeniedDesc: 'Desc',
  reminderUnsupported: 'Non supporté',
  reminderTitle: 'Rappel',
  reminderBody: 'Entraînement',
};

function baseSettings(): Settings {
  return {
    unit: 'kg',
    repsFormat: 'simple',
    pseudo: '',
    email: '',
    defaultRestTime: 90,
    soundAlerts: true,
    weeklyGoal: 3,
    bodyWeight: 0,
    benchmarksOptIn: false,
    advancedMode: false,
    reminders: { enabled: true, days: [1], time: '08:30' },
    webdav: { url: '', username: '', password: '' },
    lastSyncAt: null,
  } as unknown as Settings;
}

function create(
  opts: {
    now?: Date;
    notified?: string;
    completed?: string[];
    permission?: NotificationPermission | 'unsupported';
    enabled?: boolean;
  } = {}
) {
  let settings = baseSettings();
  if (opts.enabled === false)
    settings = { ...settings, reminders: { ...settings.reminders, enabled: false } };
  let notified = opts.notified ?? '';
  const fired: unknown[][] = [];
  const toasts: string[] = [];
  const requested: string[] = [];
  const intervals: Array<() => void> = [];
  const cleared: number[] = [];
  const notifications: NotificationApi = {
    supported: true,
    permission: opts.permission ?? 'granted',
    requestPermission: () => {
      requested.push('called');
      return Promise.resolve('granted');
    },
    notify: (title, options) => fired.push([title, options]),
  };
  const app = createReminderSettings({
    labels,
    getSettings: () => settings,
    updateSettings: (u) => (settings = { ...settings, ...u }),
    getSessions: () => (opts.completed ?? []).map((date) => ({ status: 'completed', date })),
    getNotified: () => notified,
    setNotified: (v) => (notified = v),
    now: () => opts.now ?? new Date(2026, 10, 23, 8, 30),
    interval: (fn) => {
      intervals.push(fn);
      return 7;
    },
    clearInterval: (id) => cleared.push(id),
    notifications,
    notify: (message) => toasts.push(message),
  });
  return {
    app,
    fired,
    toasts,
    requested,
    intervals,
    cleared,
    notified: () => notified,
    settings: () => settings,
  };
}

describe('createReminderSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('planifie un check toutes les 30 s et l’arrête à la destruction', () => {
    const { app, intervals, cleared } = create();
    app.init();
    expect(intervals).toHaveLength(1);
    app.destroy();
    expect(cleared).toEqual([7]);
    expect(app._timer).toBe(0);
  });

  it('ne notifie pas quand aucune séance n’est prévue ce jour', () => {
    const { app, fired } = create({ now: new Date(2026, 10, 26, 8, 30) }); // mercredi
    app.check();
    expect(fired).toHaveLength(0);
  });

  it('notifie une seule fois pour un créneau donné', () => {
    const { app, fired, notified } = create();
    app.check();
    app.check();
    expect(fired).toHaveLength(1);
    expect(notified()).toMatch(/^2026-11-23 08:30$/);
  });

  it('ne notifie pas si une séance est déjà terminée aujourd’hui', () => {
    const { app, fired } = create({ completed: ['2026-11-23'] });
    app.check();
    expect(fired).toHaveLength(0);
  });

  it('ne notifie pas si le créneau a déjà été traité', () => {
    const { app, fired } = create({ notified: '2026-11-23 08:30' });
    app.check();
    expect(fired).toHaveLength(0);
  });

  it('bascule un jour sans duplication', () => {
    const { app, settings } = create();
    app.toggleDay(3);
    expect(settings().reminders.days).toEqual([1, 3]);
    app.toggleDay(1);
    expect(settings().reminders.days).toEqual([3]);
  });

  it('ignore une heure invalide', () => {
    const { app, settings } = create();
    app.setTime('99:99');
    expect(settings().reminders.time).toBe('08:30');
    app.setTime('09:15');
    expect(settings().reminders.time).toBe('09:15');
  });
  it('affiche un toast visible quand la permission n’est pas accordée', () => {
    const { app, fired, toasts } = create({ permission: 'denied' });
    app.check();
    expect(fired).toHaveLength(0);
    expect(toasts).toEqual(['Rappel']);
  });

  it('ne démarre aucun minuteur dans la carte réglages', () => {
    const { app, intervals } = create();
    const noWatch = createReminderSettings({
      labels,
      getSettings: () => baseSettings(),
      updateSettings: (u) => ({ ...baseSettings(), ...u }),
      getSessions: () => [],
      getNotified: () => '',
      setNotified: () => {},
      now: () => new Date(2026, 10, 23, 8, 30),
      interval: (fn) => {
        intervals.push(fn);
        return 9;
      },
      clearInterval: () => {},
      notifications: {
        supported: true,
        permission: 'granted',
        requestPermission: () => Promise.resolve('granted'),
        notify: () => {},
      },
      notify: () => {},
      watch: false,
    });
    noWatch.init();
    expect(intervals).toHaveLength(0);
    expect(app._timer).toBe(0);
  });
  it('demande la permission des que le rappel est active', () => {
    const { app, requested, settings } = create({ permission: 'default' });
    app.setEnabled(true);
    expect(requested).toEqual(['called']);
    expect(settings().reminders.enabled).toBe(true);
  });
});
