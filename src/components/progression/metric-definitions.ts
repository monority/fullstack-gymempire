/**
 * Registres de métriques pour MetricGrid (ADR-009).
 * Une seule source de vérité pour les 3 pages de synthèse.
 */
import type { Dictionary } from '../../i18n/types';
import type { MetricDefinition } from '../../lib/metric-types';
import { icons } from '../../lib/icons';

export function buildHistoryMetrics(L: Dictionary): MetricDefinition[] {
  return [
    {
      key: 'best1RM',
      label: L.historique.best1RM,
      icon: icons.trendingUp(16, 16),
      value: 'formatWeight(best1RM)',
      unitExpr: 'unit',
      foot: "best1RMDate ? formatDate(best1RMDate) : '—'",
      hero: true,
    },
    {
      key: 'bestWeight',
      label: L.historique.bestWeight,
      icon: icons.volumeBox(16, 16),
      value: 'formatWeight(bestWeight)',
      unitExpr: 'unit',
      foot: "bestWeightDate ? formatDate(bestWeightDate) : '—'",
    },
    {
      key: 'maxReps',
      label: L.historique.maxReps,
      icon: icons.arrowUpDown(16, 16),
      value: 'maxReps',
      unit: 'reps',
      foot: "maxRepsDate ? formatDate(maxRepsDate) : '—'",
    },
    {
      key: 'totalVolume',
      label: L.historique.totalVolume,
      icon: icons.trendingUpLine(16, 16),
      value: 'formatWeight(totalVolume)',
      unitExpr: 'unit',
      foot: 'sessionCountLabel',
    },
  ];
}

export function buildStatsMetrics(L: Dictionary): MetricDefinition[] {
  return [
    {
      key: 'volumeTotal',
      label: L.stats.volumeTotal,
      value: 'formatWeight(totalVolume12w)',
      unitExpr: 'unit',
      foot: `sessions12w + ' ' + labels.sessionSingular + (sessions12w > 1 ? 's' : '') + ' ' + labels.completed`,
    },
    {
      key: 'sessions12w',
      label: L.stats.sessions12w,
      value: 'sessions12w',
      foot: 'labels.completed',
    },
    {
      key: 'avgDuration',
      label: L.stats.avgDuration,
      value: 'formatDuration(avgDuration)',
      foot: `durationSessionCount > 0 ? labels.on + durationSessionCount + ' ' + labels.sessionSingular + (durationSessionCount > 1 ? 's' : '') : labels.noTimed`,
    },
    {
      key: 'regularity',
      label: L.stats.regularity,
      value: "consistencyPct + '%'",
      foot: `activeWeeks + ' ' + (activeWeeks > 1 ? labels.activeWeeks : labels.activeWeek) + ' / 12'`,
    },
  ];
}

export function buildRecordsMetrics(L: Dictionary): MetricDefinition[] {
  return [
    {
      key: 'best1RMGlobal',
      label: L.records.best1RMGlobal,
      value: 'formatWeight(bestOverall1RM)',
      unitExpr: 'unit',
      foot: `bestOverallExercise ? labels.on + bestOverallExercise : '—'`,
      hero: true,
    },
    {
      key: 'totalPRs',
      label: L.records.totalPRs,
      value: 'totalPRs',
      unit: 'PR',
      foot: `totalPRs > 1 ? labels.exercisesTracked : labels.exerciseTracked`,
    },
    {
      key: 'recentPRs',
      label: L.records.recentPRs,
      value: 'recentPRs',
      unit: 'PR',
      foot: L.records.since30Days,
      footStatic: true,
    },
  ];
}
