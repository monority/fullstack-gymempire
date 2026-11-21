/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { singleton as uiStore } from '../../lib/ui-store';
import { registerAlpine } from '../../lib/alpine';
import { createSessionDetailApp, buildSessionDetailLabels } from './sessionDetailApp';
import { t, localizedPath, trExercise } from '../../i18n';

export function registerSessionDetail(): void {
  const LABELS = t();
  const labels = buildSessionDetailLabels(LABELS);
  labels.printHref = localizedPath('/sessions/print');
  registerAlpine('sessionDetailApp', () =>
    createSessionDetailApp({
      labels,
      search: window.location.search,
      localizedPath,
      ui: {
        notify: (message, kind) => uiStore.notify(message, kind),
        openDialog: (id) => uiStore.openDialog(id),
        closeDialog: (id) => uiStore.closeDialog(id),
        navigate: (href) => {
          window.location.href = href;
        },
        translateExercise: (name) => trExercise(name),
      },
    })
  );
}
