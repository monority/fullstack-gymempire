/**
 * Rappels d'entraînement — factory Alpine extraite du template (ratchet script).
 * Toutes les dépendances sont injectées pour rendre la logique testable.
 */
import type { Settings } from '../../lib/storage/types';

export interface ReminderLabels {
  reminderDayMon: string;
  reminderDayTue: string;
  reminderDayWed: string;
  reminderDayThu: string;
  reminderDayFri: string;
  reminderDaySat: string;
  reminderDaySun: string;
  reminderGranted: string;
  reminderDenied: string;
  reminderDeniedDesc: string;
  reminderUnsupported: string;
  reminderTitle: string;
  reminderBody: string;
}

export interface NotificationApi {
  supported: boolean;
  permission: NotificationPermission | 'unsupported';
  requestPermission(): unknown;
  notify(title: string, options: { body: string; tag: string }): void;
}

export interface ReminderDeps {
  labels: ReminderLabels;
  getSettings(): Settings;
  updateSettings(updates: Partial<Settings>): Settings;
  getSessions(): Array<{ status: string; date: string }>;
  getNotified(): string;
  setNotified(value: string): void;
  now(): Date;
  interval(fn: () => void, ms: number): number;
  clearInterval(id: number): void;
  notifications: NotificationApi;
  notify(message: string, variant: 'info' | 'success' | 'warning' | 'error'): void;
  /** Le watcher global tourne sur toutes les pages ; la carte réglages ne fait que configurer. */
  watch?: boolean;
}

const DAY_LABELS = [
  ['reminderDayMon', 1],
  ['reminderDayTue', 2],
  ['reminderDayWed', 3],
  ['reminderDayThu', 4],
  ['reminderDayFri', 5],
  ['reminderDaySat', 6],
  ['reminderDaySun', 0],
] as const;

export function createReminderSettings(deps: ReminderDeps) {
  let lastNotifiedSlot = '';
  const days = DAY_LABELS.map(([key, v]) => ({ v, label: deps.labels[key] }));

  return {
    settings: deps.getSettings(),
    days,
    supported: deps.notifications.supported,
    permission: deps.notifications.permission,
    labels: {
      granted: deps.labels.reminderGranted,
      denied: deps.labels.reminderDenied,
      deniedDesc: deps.labels.reminderDeniedDesc,
      unsupported: deps.labels.reminderUnsupported,
      notifTitle: deps.labels.reminderTitle,
      notifBody: deps.labels.reminderBody,
    },
    _timer: 0,

    init() {
      this.settings = deps.getSettings();
      this.syncPermission();
      if (deps.watch === false) return;
      this.check();
      this._timer = deps.interval(() => this.check(), 30000);
    },

    syncPermission() {
      this.supported = deps.notifications.supported;
      this.permission = deps.notifications.permission;
    },

    requestPermission() {
      if (!this.supported) return;
      try {
        const result = deps.notifications.requestPermission();
        if (result && typeof (result as Promise<NotificationPermission>).then === 'function') {
          (result as Promise<NotificationPermission>).then((p) => {
            this.permission = p;
          });
        } else {
          this.permission = deps.notifications.permission;
        }
      } catch {
        this.syncPermission();
      }
    },

    setEnabled(checked: boolean) {
      this.settings = deps.updateSettings({
        reminders: { ...this.settings.reminders, enabled: checked },
      });
      // La bascule est un geste utilisateur : c'est le bon moment pour
      // demander la permission, sinon le rappel resterait silencieux.
      if (checked && deps.notifications.permission === 'default') {
        void this.requestPermission();
      }
    },

    toggleDay(v: number) {
      const current = new Set(this.settings.reminders.days);
      if (current.has(v)) current.delete(v);
      else current.add(v);
      this.settings = deps.updateSettings({
        reminders: { ...this.settings.reminders, days: [...current] },
      });
    },

    setTime(value: string) {
      const match = /^(\d{2}):(\d{2})$/.exec(value ?? '');
      if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return;
      this.settings = deps.updateSettings({
        reminders: { ...this.settings.reminders, time: value },
      });
    },

    check() {
      // Lecture fraîche : le watcher global doit voir les changements faits
      // depuis la page réglages sans partager son état Alpine.
      const r = deps.getSettings()?.reminders;
      if (!r || !r.enabled) return;

      const now = deps.now();
      if (!r.days.includes(now.getDay())) return;

      const match = /^(\d{1,2}):(\d{2})$/.exec(r.time || '');
      if (!match) return;
      const slotMin = Number(match[1]) * 60 + Number(match[2]);
      const curMin = now.getHours() * 60 + now.getMinutes();
      if (slotMin !== curMin) return;

      const key = this.slotKey(now);
      if (lastNotifiedSlot === key) return;
      if (deps.getNotified() === key) return;
      if (this.hasCompletedSessionToday(now)) return;

      lastNotifiedSlot = key;
      deps.setNotified(key);
      this.fire();
    },

    slotKey(d: Date): string {
      const p = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    },

    hasCompletedSessionToday(d: Date): boolean {
      const p = (n: number) => String(n).padStart(2, '0');
      const today = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      return deps.getSessions().some((s) => s.status === 'completed' && s.date === today);
    },

    destroy() {
      if (this._timer) {
        deps.clearInterval(this._timer);
        this._timer = 0;
      }
    },

    fire() {
      // La permission est relue à l'instant T : elle peut avoir été accordée
      // depuis la page réglages alors que ce watcher tourne ailleurs.
      if (deps.notifications.supported && deps.notifications.permission === 'granted') {
        try {
          deps.notifications.notify(this.labels.notifTitle, {
            body: this.labels.notifBody,
            tag: 'muscu-reminder',
          });
          return;
        } catch {
          // repli visible ci-dessous
        }
      }
      // Permission refusée ou notifications indisponibles : on ne reste
      // jamais muet, un toast signale l'heure du rappel dans l'application.
      deps.notify(this.labels.notifTitle, this.permission === 'granted' ? 'warning' : 'info');
    },
  };
}
