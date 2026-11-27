/** Watcher global des rappels — monté dans le shell, actif sur toutes les pages. */
import { registerAlpine } from '../../lib/alpine';
import { createReminderSettings } from './reminderSettings';
import { reminderDeps, reminderLabels } from './reminderRegistration';

export function registerReminderWatcher(): void {
  registerAlpine('reminderWatcher', () =>
    createReminderSettings({ ...reminderDeps(reminderLabels()), watch: true })
  );
}
