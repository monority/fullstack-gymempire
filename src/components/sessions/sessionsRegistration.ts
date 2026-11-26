/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { singleton as uiStore } from '../../lib/ui-store';
import { registerAlpine } from '../../lib/alpine';
import { createSessionsApp, buildSessionsLabels } from './sessionsApp';
import { t, localizedPath, trMuscle } from '../../i18n';

export function registerSessions(): void {
  const LABELS = t();
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
        translateMuscle: (name) => trMuscle(name),
        openDialog: (id) => uiStore.openDialog(id),
        closeDialog: (id) => uiStore.closeDialog(id),
      },
    })
  );
}
