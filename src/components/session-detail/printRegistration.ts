/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { registerAlpine } from '../../lib/alpine';
import { createPrintSheetApp } from './printSheetApp';
import { getAuth } from '../../lib/auth';
import { t, getLocale, localizedPath, trExercise } from '../../i18n';

export function registerPrintSheet(): void {
  const LABELS = t(getLocale());

  // Helper de traduction identique aux autres pages (celle-ci est autonome).
  (window as Window & { trExercise?: typeof trExercise }).trExercise = trExercise;

  if (!getAuth()) {
    window.location.replace(localizedPath('/login'));
  }

  const sheet = window as Window & { __SHEET_PRINTED__?: boolean };
  registerAlpine('printSheetApp', () =>
    createPrintSheetApp({
      search: window.location.search,
      labels: {
        common: LABELS.common,
        detail: LABELS.detail,
        locale: getLocale,
        backHref: localizedPath('/sessions'),
      },
      ui: {
        alreadyPrinted: () => Boolean(sheet.__SHEET_PRINTED__),
        markPrinted: () => {
          sheet.__SHEET_PRINTED__ = true;
        },
        print: () => window.print(),
        schedule: (fn, ms) => window.setTimeout(fn, ms),
      },
    })
  );
}
