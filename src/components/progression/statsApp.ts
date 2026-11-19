/** Logique Alpine de la page Statistiques — extraite de stats.astro (P3). */
import type { Dictionary } from '../../i18n/types';
import { trExercise, trMuscle } from '../../i18n';
import { formatDateShort, formatNumber } from '../../lib/format';
import { cssVar, cssVarAlpha } from '../../lib/css-var';
import { getSessions } from '../../lib/storage/sessions';
import { getSettings, updateSettings } from '../../lib/storage/settings';
import { buildBenchmarkRows, type PercentileBand } from '../../lib/benchmarks';
import { REFERENCE_DATA } from '../../lib/benchmarks-data';
import { volumeByMuscle, type MuscleVolumeSlice, type VolumePeriod } from '../../lib/volume-stats';
import {
  buildWeeks,
  aggregateByWeek,
  topExercisesByVolume,
  type WeekBucket,
  type TopExercise,
} from '../../lib/week-aggregation';
import {
  renderVolumeChart as renderVolumeChartSvg,
  renderMuscleChart as renderMuscleChartSvg,
  renderFrequencyChart as renderFrequencyChartSvg,
  renderTopExercises as renderTopExercisesSvg,
  renderBenchmarksTable as renderBenchmarksTableSvg,
  type StatsChartDeps,
  type StatsChartLabels,
} from '../../lib/charts/statsCharts';

export interface StatsAppDeps {
  labels: {
    sessionSingular: string;
    completed: string;
    on: string;
    noTimed: string;
    activeWeek: string;
    activeWeeks: string;
    volumeLast7d: string;
    volumeLast30d: string;
  };
  chartLabels: StatsChartLabels;
  chartDeps: StatsChartDeps;
}

/** Construit les dépendances à partir du dictionnaire i18n (convention buildXLabels). */
export function buildStatsDeps(L: Dictionary): StatsAppDeps {
  return {
    labels: {
      sessionSingular: L.stats.sessionSingular,
      completed: L.stats.completed,
      on: L.records.on,
      noTimed: L.stats.noTimed,
      activeWeek: L.stats.activeWeek,
      activeWeeks: L.stats.activeWeeks,
      volumeLast7d: L.stats.volumeLast7d,
      volumeLast30d: L.stats.volumeLast30d,
    },
    chartLabels: {
      kg: L.common.kg,
      noData: L.common.noData,
      volumeChart: L.stats.volumeChart,
      freqChart: L.stats.freqChart,
      volumeByMuscle: L.stats.volumeByMuscle,
      total: L.stats.total,
      sessionSingular: L.stats.sessionSingular,
      volumeEmpty: L.stats.volumeEmpty,
      benchmarksEmpty: L.stats.benchmarksEmpty,
      benchmarksColExercise: L.stats.benchmarksColExercise,
      benchmarksColYour1RM: L.stats.benchmarksColYour1RM,
      benchmarksPctl50: L.stats.benchmarksPctl50,
      benchmarksPctl75: L.stats.benchmarksPctl75,
      benchmarksPctl90: L.stats.benchmarksPctl90,
      benchmarksTitle: L.stats.benchmarksTitle,
      benchmarksNoBands: L.stats.benchmarksNoBands,
    },
    chartDeps: {
      cssVar,
      cssVarAlpha,
      formatNumber,
      formatDate: formatDateShort,
      trExercise,
      trMuscle,
    },
  };
}

export interface BenchmarkRow {
  exercise: string;
  userValue: number | null;
  band: PercentileBand | null;
  p50: number;
  p75: number;
  p90: number;
}

export interface StatsApp {
  labels: StatsAppDeps['labels'];
  weeks12: WeekBucket[];
  weeks8: WeekBucket[];
  sessions12w: number;
  totalVolume12w: number;
  activeWeeks: number;
  consistencyPct: number;
  avgDuration: number;
  durationSessionCount: number;
  period: VolumePeriod;
  muscleWeek: MuscleVolumeSlice[];
  muscleMonth: MuscleVolumeSlice[];
  top5: TopExercise[];
  settings: ReturnType<typeof getSettings>;
  hasCompletedSessions: boolean;
  benchmarkRows: BenchmarkRow[];
  init(): void;
  readonly slices: MuscleVolumeSlice[];
  readonly periodMeta: string;
  formatNumber(n: number): string;
  formatDate(iso: string): string;
  formatDuration(seconds: number): string;
  renderVolumeChart(): string;
  renderMuscleChart(): string;
  renderFrequencyChart(): string;
  renderTopExercises(): string;
  renderBenchmarksTable(): string;
  setBenchmarksOptIn(checked: boolean): void;
}

export function createStatsApp(deps: StatsAppDeps): StatsApp {
  const { chartLabels, chartDeps } = deps;
  return {
    labels: deps.labels,
    weeks12: [],
    weeks8: [],
    sessions12w: 0,
    totalVolume12w: 0,
    activeWeeks: 0,
    consistencyPct: 0,
    avgDuration: 0,
    durationSessionCount: 0,
    period: 'week' as VolumePeriod,
    muscleWeek: [],
    muscleMonth: [],
    top5: [],
    settings: getSettings(),
    hasCompletedSessions: false,
    benchmarkRows: [],

    init() {
      const sessions = getSessions();
      this.weeks12 = buildWeeks(12);
      aggregateByWeek(sessions, this.weeks12);
      this.sessions12w = this.weeks12.reduce((s, b) => s + b.sessionCount, 0);
      this.totalVolume12w = this.weeks12.reduce((s, b) => s + b.volume, 0);
      this.activeWeeks = this.weeks12.filter((b) => b.sessionCount > 0).length;
      this.consistencyPct = Math.round((this.activeWeeks / 12) * 100);

      const totalDur = this.weeks12.reduce((s, b) => s + b.durationSum, 0);
      const durCount = this.weeks12.reduce((s, b) => s + b.durationCount, 0);
      this.avgDuration = durCount > 0 ? totalDur / durCount : 0;
      this.durationSessionCount = durCount;

      this.weeks8 = buildWeeks(8);
      aggregateByWeek(sessions, this.weeks8);
      this.muscleWeek = volumeByMuscle(sessions, { period: 'week' });
      this.muscleMonth = volumeByMuscle(sessions, { period: 'month' });
      this.top5 = topExercisesByVolume(sessions, 5, 12);

      this.settings = getSettings();
      this.hasCompletedSessions = sessions.some((s) => s.status === 'completed');
      this.benchmarkRows = buildBenchmarkRows(sessions, REFERENCE_DATA);
    },

    get slices() {
      return this.period === 'week' ? this.muscleWeek : this.muscleMonth;
    },

    get periodMeta() {
      return this.period === 'week' ? deps.labels.volumeLast7d : deps.labels.volumeLast30d;
    },

    formatNumber(n) {
      return deps.chartDeps.formatNumber(n);
    },
    formatDate(iso) {
      return deps.chartDeps.formatDate(iso);
    },
    formatDuration(seconds) {
      const m = Math.floor(seconds / 60);
      const s = seconds % 60;
      return `${m}:${String(s).padStart(2, '0')}`;
    },

    renderVolumeChart() {
      return renderVolumeChartSvg(this.weeks12, chartLabels, chartDeps);
    },
    renderMuscleChart() {
      return renderMuscleChartSvg(this.slices, chartLabels, chartDeps);
    },
    renderFrequencyChart() {
      return renderFrequencyChartSvg(this.weeks8, chartLabels, chartDeps);
    },
    renderTopExercises() {
      return renderTopExercisesSvg(this.top5, chartLabels, chartDeps);
    },
    renderBenchmarksTable() {
      return renderBenchmarksTableSvg(
        this.benchmarkRows,
        this.hasCompletedSessions,
        chartLabels,
        chartDeps
      );
    },
    setBenchmarksOptIn(checked) {
      this.settings = updateSettings({ benchmarksOptIn: checked });
    },
  };
}
