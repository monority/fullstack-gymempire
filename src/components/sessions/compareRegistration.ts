/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { registerAlpine } from '../../lib/alpine';
import { createComparisonApp } from './compareApp';
import { t, getLocale } from '../../i18n';

export function registerCompare(): void {
  const LABELS = t(getLocale());

  registerAlpine('comparisonApp', () =>
    createComparisonApp({
      search: window.location.search,
      pathname: window.location.pathname,
      labels: {
        comparer: LABELS.comparer,
        rapide: LABELS.rapide,
        status: {
          completed: LABELS.comparer.completed,
          inProgress: LABELS.comparer.inProgress,
          planned: LABELS.comparer.planned,
        },
      },
      ui: {
        replaceUrl: (url) => window.history.replaceState({}, '', url),
      },
    })
  );
}
