/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { singleton as uiStore } from '../../lib/ui-store';
import { registerAlpine } from '../../lib/alpine';
import { createSessionsApp, buildSessionsLabels } from './sessionsApp';
import { t, localizedPath } from '../../i18n';

export function registerSessions(): void {
  const LABELS = t();
  const host = window as Window & { trMuscle?: (name: string) => string };
  registerAlpine('sessionsApp', () =>
    createSessionsApp({
      labels: buildSessionsLabels(LABELS),
      today: () => new Date(),
      localizedPath,
      ui: {
        confirm: (message) => window.confirm(message),
        navigate: (href) => {
          window.location.href = href;
        },
        translateMuscle: (name) => host.trMuscle?.(name) ?? name,
        openDialog: (id) => uiStore.openDialog(id),
        closeDialog: (id) => uiStore.closeDialog(id),
      },
    })
  );
}
