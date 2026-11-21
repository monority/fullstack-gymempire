/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { registerAlpine } from '../../lib/alpine';
import { createCalendarApp } from './calendarApp';
import { t, localizedPath } from '../../i18n';

export function registerCalendar(): void {
  const LABELS = t();

  registerAlpine('calendarApp', () =>
    createCalendarApp({
      labels: {
        ...LABELS.calendrier,
        status: {
          completed: LABELS.sessions.completed,
          inProgress: LABELS.sessions.inProgress,
          planned: LABELS.sessions.planned,
        },
        seanceSingular: LABELS.sessions.seanceSingular,
        seancePlural: LABELS.sessions.seancePlural,
      },
      today: () => new Date(),
      localizedPath,
    })
  );
}
