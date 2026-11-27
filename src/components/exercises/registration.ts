/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { singleton as uiStore } from '../../lib/ui-store';
import { registerAlpine } from '../../lib/alpine';
import { createExercisesApp, buildExercisesLabels } from './exercisesApp';
import { t, getLocale, localizedPath, DATE_LOCALE } from '../../i18n';
import { icons } from '../../lib/icons';

export function registerExercises(): void {
  const LABELS = t(getLocale());
  (window as Window & { icons?: typeof icons }).icons = icons;
  registerAlpine('exercisesApp', () =>
    createExercisesApp({
      labels: buildExercisesLabels(LABELS),
      localizedPath,
      clock: {
        now: () => new Date(),
        locale: () => DATE_LOCALE(),
      },
      ui: {
        notify: (message, kind) => uiStore.notify(message, kind),
        openDialog: (id) => uiStore.openDialog(id),
        closeDialog: (id) => uiStore.closeDialog(id),
      },
    })
  );
}
