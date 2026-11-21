/** Enregistrement Alpine extrait d'une page (ratchet script). */
import { registerAlpine } from '../../lib/alpine';
import { createTrendsApp } from './trendsApp';
import { t, trExercise } from '../../i18n';

export function registerTrends(): void {
  const LABELS = t();

  registerAlpine('exerciseTrendApp', () =>
    createTrendsApp({
      search: window.location.search,
      labels: {
        historiqueSessions: LABELS.historique.sessions,
        historiqueSessionSingular: LABELS.historique.sessionSingular,
        chartVolumeTitle: LABELS.tendance.chartVolumeTitle,
        chart1RMTitle: LABELS.tendance.chart1RMTitle,
        noSessions: LABELS.tendance.noSessions,
        minPoints: LABELS.tendance.minPoints,
        kg: LABELS.common.kg,
      },
      translateExercise: trExercise,
    })
  );
}
