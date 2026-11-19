/** Logique Alpine de la page Progression — extraite de progression/index.astro (P3). */
import { getSessions } from '../../lib/storage/sessions';
import type { ProgressRecord } from '../../lib/storage/types';
import { formatNumPositive, formatDateShort } from '../../lib/format';
import {
  computeExerciseProgression,
  computeMax1RM,
  historyBarHeight as calcHistoryBarHeight,
  type ExerciseProgression,
} from '../../lib/progression-stats';

export interface ProgressionApp {
  exerciseStats: ExerciseProgression[];
  init(): void;
  readonly totalSessions: number;
  readonly max1RM: number;
  recompute(): void;
  formatNumber(n: number): string;
  formatDate(iso: string): string;
  historyDelta(stat: ExerciseProgression): number | null;
  formatDelta(delta: number | null): string;
  historyBarHeight(history: ProgressRecord[], value: number): number;
  historyTooltip(history: ProgressRecord[]): string;
}

export function createProgressionApp(): ProgressionApp {
  return {
    exerciseStats: [],

    init() {
      this.recompute();
    },

    get totalSessions() {
      return getSessions().length;
    },

    get max1RM() {
      return computeMax1RM(this.exerciseStats);
    },

    recompute() {
      this.exerciseStats = computeExerciseProgression(getSessions());
    },

    formatNumber(n) {
      return formatNumPositive(n);
    },

    formatDate(iso) {
      return iso ? formatDateShort(iso) : '—';
    },

    historyDelta(stat) {
      if (stat.history.length < 2) return null;
      const current = stat.history[stat.history.length - 1]?.estimated1RM;
      const previous = stat.history[stat.history.length - 2]?.estimated1RM;
      if (typeof current !== 'number' || typeof previous !== 'number') return null;
      return current - previous;
    },

    formatDelta(delta) {
      if (delta === null) return '';
      return `${delta > 0 ? '+' : ''}${formatNumPositive(delta)} kg`;
    },

    historyBarHeight(history, value) {
      return calcHistoryBarHeight(history, value);
    },

    historyTooltip(history) {
      return history
        .map((r) => `${formatNumPositive(r.estimated1RM)} kg · ${formatDateShort(r.date)}`)
        .join('\n');
    },
  };
}
