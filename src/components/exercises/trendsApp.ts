/**
 * D8 — logique Alpine de la page tendances d'un exercice.
 * Les helpers de graphique viennent de `lib/trends-stats` (déjà purs).
 */

import { getExercises, getExerciseById } from '../../lib/storage/exercises';
import { getSessions } from '../../lib/storage/sessions';
import type { Exercise } from '../../lib/storage/types';
import { formatDateMedium, formatDateDayMonth, formatNumber } from '../../lib/format';
import {
  computeTrendPoints,
  chartMax as calcChartMax,
  chartX as calcChartX,
  chartY as calcChartY,
  CHART_H,
  type Metric,
  type Period,
  type TrendPoint,
} from '../../lib/trends-stats';

export interface TrendsAppDeps {
  search: string;
  labels: {
    historiqueSessions: string;
    historiqueSessionSingular: string;
    chartVolumeTitle: string;
    chart1RMTitle: string;
    noSessions: string;
    minPoints: string;
    kg: string;
  };
  translateExercise(name: string): string;
}

export interface TrendsApp {
  exercises: Exercise[];
  selectedId: string;
  exercise: Exercise | null;
  notFound: boolean;
  metric: Metric;
  period: Period;
  init(): void;
  onExerciseChange(value: string): void;
  points: TrendPoint[];
  chartTitle: string;
  chartMeta: string;
  emptyMessage: string;
  chartMax: number;
  chartX(i: number): number;
  chartY(v: number): number;
  chartLinePoints: string;
  chartAreaPoints: string;
  chartGridMarkup: string;
  chartDotsMarkup: string;
  formatNumber(n: number): string;
  formatDate(iso: string): string;
  formatDateShort(iso: string): string;
}

export function createTrendsApp(deps: TrendsAppDeps): TrendsApp {
  const { labels } = deps;

  return {
    exercises: [],
    selectedId: '',
    exercise: null,
    notFound: false,
    metric: 'volume',
    period: 'all',

    init() {
      this.exercises = getExercises();
      const params = new URLSearchParams(deps.search);
      const exParam = params.get('ex');
      let found: Exercise | undefined;
      if (exParam) {
        found = getExerciseById(exParam);
        if (!found) found = this.exercises.find((e) => e.name === exParam);
        if (!found) {
          this.notFound = true;
          return;
        }
      } else {
        found = this.exercises[0];
        if (!found) {
          this.notFound = true;
          return;
        }
      }
      this.selectedId = found.id;
      this.exercise = found;
    },

    onExerciseChange(value) {
      this.selectedId = value;
      this.exercise = this.exercises.find((e) => e.id === value) ?? null;
    },

    get points() {
      if (!this.exercise) return [];
      return computeTrendPoints(getSessions(), this.exercise.id, this.metric, this.period);
    },
    get chartTitle() {
      if (!this.exercise) return '';
      const name = deps.translateExercise(this.exercise.name);
      return this.metric === 'volume'
        ? `${name} - ${labels.chartVolumeTitle}`
        : `${name} - ${labels.chart1RMTitle}`;
    },
    get chartMeta() {
      const n = this.points.length;
      return `${n} ${n > 1 ? labels.historiqueSessions : labels.historiqueSessionSingular}`;
    },
    get emptyMessage() {
      return this.points.length === 0 ? labels.noSessions : labels.minPoints;
    },
    get chartMax() {
      return calcChartMax(this.points);
    },

    chartX(i) {
      return calcChartX(i, this.points.length);
    },
    chartY(v) {
      return calcChartY(v, this.chartMax);
    },
    get chartLinePoints() {
      return this.points.map((d, i) => `${this.chartX(i)},${this.chartY(d.value)}`).join(' ');
    },
    get chartAreaPoints() {
      if (this.points.length === 0) return '';
      const top = this.points.map((d, i) => `${this.chartX(i)},${this.chartY(d.value)}`).join(' ');
      const last = this.points.length - 1;
      return `${top} ${this.chartX(last)},${CHART_H} ${this.chartX(0)},${CHART_H}`;
    },
    get chartGridMarkup() {
      let s = '';
      for (let i = 1; i <= 5; i++) {
        const y = (i - 1) * 75;
        s += `<line x1="0" y1="${y}" x2="800" y2="${y}" stroke="var(--color-border)" stroke-width="1" stroke-dasharray="2 4"></line>`;
        s += `<text x="6" y="${y - 4}" fill="var(--color-muted)" font-size="11" font-family="var(--font-body)">${formatNumber(this.chartMax * (1 - (i - 1) / 5))} ${labels.kg}</text>`;
      }
      return s;
    },
    get chartDotsMarkup() {
      return this.points
        .map(
          (d, i) =>
            `<g><circle cx="${this.chartX(i)}" cy="${this.chartY(d.value)}" r="6" fill="var(--color-bg)" stroke="var(--color-accent)" stroke-width="2.5"></circle><title>${formatDateMedium(d.date)} - ${formatNumber(d.value)} ${labels.kg}</title></g>`
        )
        .join('');
    },

    formatNumber,
    formatDate: formatDateMedium,
    formatDateShort: formatDateDayMonth,
  };
}
