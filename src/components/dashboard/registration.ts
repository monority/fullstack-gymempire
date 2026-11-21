/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { registerAlpine } from '../../lib/alpine';
import { createDashboardApp } from './dashboardApp';
import { t, getLocale, localizedPath } from '../../i18n';

export function registerDashboard(): void {
  const LABELS = t();

  registerAlpine('dashboardApp', () =>
    createDashboardApp(
      {
        ...LABELS.dashboard,
        kg: LABELS.common.kg,
        status: {
          completed: LABELS.sessions.completed,
          inProgress: LABELS.sessions.inProgress,
          planned: LABELS.sessions.planned,
        },
      },
      localizedPath,
      {
        locale: () => (getLocale() === 'en' ? 'en' : 'fr'),
        today: () => new Date(),
        onError: (error) => console.error('[dashboard] failed to load', error),
        translateMuscle: (name) =>
          (window as { trMuscle?: (m: string) => string }).trMuscle?.(name) ?? name,
      }
    )
  );
}
