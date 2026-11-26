/** Enregistrement Alpine extrait de ReminderSettings.astro (ratchet script). */
import { registerAlpine } from '../../lib/alpine';
import { getSettings, updateSettings } from '../../lib/storage/settings';
import { getSessions } from '../../lib/storage/sessions';
import { getStore, setStore } from '../../lib/storage/store';
import { STORAGE_KEYS } from '../../lib/storage/defaults';
import { t, getLocale } from '../../i18n';
import { createReminderSettings } from './reminderSettings';

export function registerReminderSettings(): void {
  const L = t(getLocale()).settings;

  registerAlpine('reminderSettings', () =>
    createReminderSettings({
      labels: {
        reminderDayMon: L.reminderDayMon,
        reminderDayTue: L.reminderDayTue,
        reminderDayWed: L.reminderDayWed,
        reminderDayThu: L.reminderDayThu,
        reminderDayFri: L.reminderDayFri,
        reminderDaySat: L.reminderDaySat,
        reminderDaySun: L.reminderDaySun,
        reminderGranted: L.reminderGranted,
        reminderDenied: L.reminderDenied,
        reminderDeniedDesc: L.reminderDeniedDesc,
        reminderUnsupported: L.reminderUnsupported,
        reminderTitle: L.reminderTitle,
        reminderBody: L.reminderBody,
      },
      getSettings,
      updateSettings,
      getSessions,
      getNotified: () => getStore<string>(STORAGE_KEYS.reminderNotified, ''),
      setNotified: (value) => setStore(STORAGE_KEYS.reminderNotified, value),
      now: () => new Date(),
      interval: (fn, ms) => window.setInterval(fn, ms),
      clearInterval: (id) => window.clearInterval(id),
      notifications: {
        get supported() {
          return typeof Notification !== 'undefined';
        },
        get permission() {
          return typeof Notification !== 'undefined'
            ? Notification.permission
            : ('unsupported' as const);
        },
        requestPermission: () => Notification.requestPermission(),
        notify: (title, options) => {
          void new Notification(title, options);
        },
      },
    })
  );
}
