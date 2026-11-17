/**
 * D0 (plan-execution.md) — reference pattern for extracted Alpine state.
 *
 * Pure factory: no DOM, no Alpine dependency. The page (.astro) registers
 * it via `Alpine.data('plateCalculator', () => createPlateCalculator({ labels }))`.
 * All computations are testable without jsdom.
 */

import {
  computePlatesPerSide,
  computeDumbbells,
  groupPlates,
  groupDumbbellPlates,
  formatKg,
  formatTemplate,
  plateHeight,
  plateClass,
  dumbbellHeight,
  dumbbellWidth,
} from '../../lib/calculator';
import type { PlateCount } from '../../lib/calculator';

export interface CalculatorLabels {
  invalidTarget: string;
  targetBelowBar: string;
  targetBelowDumbbellBar: string;
  invalidBarWeight: string;
  formulaBar: string;
  formulaPlates: string;
  perSideTitle: string;
  dumbbellsToUse: string;
  barbellAriaPrefix: string;
  platesPerSide: string;
  dumbbellsToTake: string;
}

export interface PlateCalculatorDeps {
  labels: CalculatorLabels;
}

/** Map error keys from computePlatesPerSide/computeDumbbells to localised strings. */
function resolveError(
  labels: CalculatorLabels,
  key: string | null,
  vars?: Record<string, string | number>
): string | null {
  if (!key) return null;
  if (key === 'targetBelowBar' && vars) {
    return formatTemplate(labels.targetBelowBar, vars);
  }
  if (key === 'targetBelowDumbbellBar' && vars) {
    return formatTemplate(labels.targetBelowDumbbellBar, vars);
  }
  if (key === 'invalidBarWeight') return labels.invalidBarWeight;
  if (key === 'invalidTarget') return labels.invalidTarget;
  return null;
}

export function createPlateCalculator(deps: PlateCalculatorDeps) {
  const labels = deps.labels;
  return {
    // ── State ──
    mode: 'bar' as 'bar' | 'dumbbell',
    target: 80,
    barWeight: 20,
    dumbbellBarWeight: 2,

    // ── Mode-aware error ──
    get errorMessage(): string | null {
      if (!Number.isFinite(this.target) || this.target < 0) {
        return labels.invalidTarget;
      }
      if (this.target === 0) return null;
      if (this.mode === 'dumbbell') {
        const r = computeDumbbells(this.target, this.dumbbellBarWeight);
        return resolveError(labels, r.error, { target: this.target, bar: this.dumbbellBarWeight });
      }
      if (this.target < this.barWeight) {
        return resolveError(labels, 'targetBelowBar', { target: this.target, bar: this.barWeight });
      }
      return null;
    },

    // ── Computed (bar mode) ──
    get perSide(): number {
      if (!Number.isFinite(this.target)) return 0;
      return Math.max(0, (this.target - this.barWeight) / 2);
    },

    get computedResult(): { plates: number[]; remainder: number } {
      return computePlatesPerSide(this.target, this.barWeight);
    },

    get platesPerSide(): number[] {
      if (this.errorMessage) return [];
      return this.computedResult.plates;
    },

    get remainder(): number {
      if (this.errorMessage) return 0;
      return this.computedResult.remainder;
    },

    get plateBreakdown(): PlateCount[] {
      return groupPlates(this.platesPerSide);
    },

    // ── Computed (dumbbell mode) ──
    get computedDumbbells() {
      return computeDumbbells(this.target, this.dumbbellBarWeight);
    },

    get dumbbellWeight(): number {
      if (this.errorMessage) return 0;
      return this.computedDumbbells.dumbbellWeight;
    },

    get dumbbellPlateWeight(): number {
      if (this.errorMessage) return 0;
      return this.computedDumbbells.plateWeight;
    },

    get dumbbellsToShow(): number[] {
      if (this.errorMessage) return [];
      const w = this.computedDumbbells.dumbbellWeight;
      if (w === 0) return [];
      return [w, w];
    },

    get dumbbellRemainder(): number {
      if (this.errorMessage) return 0;
      return this.computedDumbbells.remainder;
    },

    get dumbbellBreakdown(): PlateCount[] {
      return groupDumbbellPlates(this.computedDumbbells.plates);
    },

    get dumbbellSummary(): string {
      if (this.errorMessage) return '—';
      const w = this.computedDumbbells.dumbbellWeight;
      if (w === 0) return '—';
      return `${labels.formulaBar} ${formatKg(this.dumbbellBarWeight)} + ${labels.formulaPlates} ${formatKg(this.computedDumbbells.plateWeight)} = ${formatKg(w)}`;
    },

    // ── Display helpers ──
    get resultTitle(): string {
      return this.mode === 'bar' ? labels.perSideTitle : labels.dumbbellsToUse;
    },

    get barbellAria(): string {
      return `${labels.barbellAriaPrefix} ${this.platesPerSide.length} ${labels.platesPerSide}`;
    },

    get dumbbellsAria(): string {
      return `${this.dumbbellsToShow.length} ${labels.dumbbellsToTake}`;
    },

    formatKg,
    plateHeight,
    plateClass,
    dumbbellHeight,
    dumbbellWidth,
  };
}
