/**
 * logique Alpine de l'historique d'un exercice.
 * Aucune dépendance DOM : `search`, `getSessions` et `getExerciseById`
 * sont injectés. Les helpers de graphique sont purs.
 */

import type { Dictionary } from '../../i18n/types';
import { getExerciseById } from '../../lib/storage/exercises';
import { getSessions } from '../../lib/storage/sessions';
import { calculate1RM } from '../../lib/storage/store';
import type { Exercise, RpeType, SetType } from '../../lib/storage/types';
import { typeLabel } from '../../lib/workout-helpers';
import { formatDateMedium, formatDateDayMonth, formatNumber } from '../../lib/format';

export interface HistoryRow {
  date: string;
  weight: number;
  reps: number;
  rpe: number | null;
  rpeType?: RpeType;
  type: SetType;
  estimated1RM: number;
  sessionName: string;
}

export interface ChartPoint {
  date: string;
  rm: number;
}

/** Séries d'une même séance, regroupées pour l'affichage du tableau. */
export interface HistoryGroup {
  key: string;
  date: string;
  sessionName: string;
  rows: HistoryRow[];
}

export const CHART_W = 800;
export const CHART_H = 300;

export interface HistoryAppDeps {
  search: string;
  labels: Dictionary['historique'] & { kg: string };
}

export interface HistoryApp {
  exercise: Exercise | null;
  notFound: boolean;
  history: HistoryRow[];
  chartData: ChartPoint[];
  best1RM: number;
  best1RMDate: string;
  bestWeight: number;
  bestWeightDate: string;
  maxReps: number;
  maxRepsDate: string;
  totalVolume: number;
  sessionCount: number;
  init(): void;
  computeHistory(): void;
  computeStats(): void;
  chartMeta: string;
  tableMeta: string;
  sessionCountLabel: string;
  historyDesc: HistoryRow[];
  historyGroups: HistoryGroup[];
  chartMax: number;
  chartX(i: number): number;
  chartY(rm: number): number;
  chartLinePoints: string;
  chartAreaPoints: string;
  chartGridMarkup: string;
  chartDotsMarkup: string;
  formatNumber(n: number): string;
  formatDate(iso: string): string;
  formatDateShort(iso: string): string;
  typeLabel(t: SetType): string;
  formatRpe(row: HistoryRow): string;
}

export function createHistoryApp(deps: HistoryAppDeps): HistoryApp {
  const { labels } = deps;

  const typeLabels = {
    warmup: labels.typeWarmup,
    work: labels.typeWork,
    top: labels.typeTop,
    drop: labels.typeDrop,
    failure: labels.typeFailure,
  };

  function formatRpeValue(rpe: number | string | null | undefined, rpeType?: RpeType): string {
    const value = typeof rpe === 'string' ? Number(rpe) : rpe;
    if (value == null || !Number.isFinite(value)) return '-';
    return (rpeType === 'urpe' ? 'uRPE ' : 'RPE ') + value.toString();
  }

  return {
    exercise: null,
    notFound: false,
    history: [],
    chartData: [],
    best1RM: 0,
    best1RMDate: '',
    bestWeight: 0,
    bestWeightDate: '',
    maxReps: 0,
    maxRepsDate: '',
    totalVolume: 0,
    sessionCount: 0,

    init() {
      const exerciseId = new URLSearchParams(deps.search).get('id');
      if (!exerciseId) {
        this.notFound = true;
        return;
      }
      const found = getExerciseById(exerciseId);
      if (!found) {
        this.notFound = true;
        return;
      }
      this.exercise = found;
      this.computeHistory();
    },

    computeHistory() {
      if (!this.exercise) return;
      const exerciseId = this.exercise.id;
      const rows: HistoryRow[] = [];

      for (const session of getSessions()) {
        for (const ex of session.exercises) {
          if (ex.exerciseId !== exerciseId) continue;
          for (const set of ex.sets) {
            if (!set.completed) continue;
            rows.push({
              date: session.date,
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe ?? null,
              rpeType: set.rpeType,
              type: set.type,
              estimated1RM: calculate1RM(set.weight, set.reps),
              sessionName: session.name,
            });
          }
        }
      }

      this.history = rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const byDate = new Map<string, number>();
      for (const row of this.history) {
        const current = byDate.get(row.date) ?? 0;
        if (row.estimated1RM > current) byDate.set(row.date, row.estimated1RM);
      }
      this.chartData = Array.from(byDate.entries())
        .map(([date, rm]) => ({ date, rm }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      this.computeStats();
    },

    computeStats() {
      if (this.history.length === 0) {
        Object.assign(this, {
          best1RM: 0,
          best1RMDate: '',
          bestWeight: 0,
          bestWeightDate: '',
          maxReps: 0,
          maxRepsDate: '',
          totalVolume: 0,
          sessionCount: 0,
        });
        return;
      }

      let bestRm = 0;
      let bestRmDate = '';
      let bestW = 0;
      let bestWDate = '';
      let maxR = 0;
      let maxRDate = '';
      let volume = 0;
      const uniqueSessions = new Set<string>();

      for (const row of this.history) {
        if (row.estimated1RM > bestRm) {
          bestRm = row.estimated1RM;
          bestRmDate = row.date;
        }
        if (row.weight > bestW) {
          bestW = row.weight;
          bestWDate = row.date;
        }
        if (row.reps > maxR) {
          maxR = row.reps;
          maxRDate = row.date;
        }
        volume += row.weight * row.reps;
        uniqueSessions.add(row.date + '|' + row.sessionName);
      }

      this.best1RM = bestRm;
      this.best1RMDate = bestRmDate;
      this.bestWeight = bestW;
      this.bestWeightDate = bestWDate;
      this.maxReps = maxR;
      this.maxRepsDate = maxRDate;
      this.totalVolume = volume;
      this.sessionCount = uniqueSessions.size;
    },

    get chartMeta() {
      return (
        this.chartData.length +
        ' ' +
        labels.sessions +
        ' - ' +
        labels.best1RM +
        ' : ' +
        formatNumber(this.best1RM) +
        ' ' +
        labels.kg
      );
    },
    get tableMeta() {
      return this.history.length + ' ' + labels.sets;
    },
    get sessionCountLabel() {
      return (
        this.sessionCount + ' ' + (this.sessionCount > 1 ? labels.sessions : labels.sessionSingular)
      );
    },
    get historyDesc() {
      return this.history.slice().reverse();
    },
    get historyGroups(): HistoryGroup[] {
      const groups: HistoryGroup[] = [];
      for (const row of this.historyDesc) {
        const key = row.date + '|' + row.sessionName;
        let group = groups[groups.length - 1];
        if (!group || group.key !== key) {
          group = { key, date: row.date, sessionName: row.sessionName, rows: [] };
          groups.push(group);
        }
        group.rows.push(row);
      }
      return groups;
    },
    get chartMax() {
      const peak = this.chartData.reduce((m, d) => (d.rm > m ? d.rm : m), 0);
      return Math.max(peak * 1.1, 10);
    },

    chartX(i) {
      const n = this.chartData.length;
      if (n <= 1) return CHART_W / 2;
      return (i / (n - 1)) * CHART_W;
    },
    chartY(rm) {
      const max = this.chartMax;
      if (max <= 0) return CHART_H;
      return CHART_H - (rm / max) * CHART_H;
    },
    get chartLinePoints() {
      return this.chartData.map((d, i) => `${this.chartX(i)},${this.chartY(d.rm)}`).join(' ');
    },
    get chartAreaPoints() {
      if (this.chartData.length === 0) return '';
      const top = this.chartData.map((d, i) => `${this.chartX(i)},${this.chartY(d.rm)}`).join(' ');
      const last = this.chartData.length - 1;
      return `${top} ${this.chartX(last)},${CHART_H} ${this.chartX(0)},${CHART_H}`;
    },
    get chartGridMarkup() {
      let s = '';
      for (let i = 1; i <= 5; i++) {
        const y = (i - 1) * 75;
        s += `<line x1="0" y1="${y}" x2="${CHART_W}" y2="${y}" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="2 4"></line>`;
        s += `<text x="6" y="${y - 4}" fill="var(--color-muted)" font-size="11" font-family="var(--font-body)">${formatNumber(this.chartMax * (1 - (i - 1) / 5))} kg</text>`;
      }
      return s;
    },
    get chartDotsMarkup() {
      return this.chartData
        .map(
          (d, i) =>
            `<g><circle cx="${this.chartX(i)}" cy="${this.chartY(d.rm)}" r="6" fill="var(--color-bg)" stroke="var(--color-accent)" stroke-width="2.5"></circle><title>${formatDateMedium(d.date)} - ${formatNumber(d.rm)} kg</title></g>`
        )
        .join('');
    },

    formatNumber(n) {
      return formatNumber(n);
    },
    formatDate(iso) {
      return formatDateMedium(iso);
    },
    formatDateShort(iso) {
      return formatDateDayMonth(iso);
    },
    typeLabel(t) {
      return typeLabel(t, typeLabels);
    },
    formatRpe(row) {
      return formatRpeValue(row.rpe, row.rpeType);
    },
  };
}
