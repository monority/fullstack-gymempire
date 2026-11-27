import { singleton as uiStore } from '../../lib/ui-store';
import { getAlpine } from '../../lib/alpine';
import type { I18nStore } from '../../lib/i18n-store';

function builderLabels(): I18nStore['builderLabels'] {
  return (getAlpine()?.store('i18n') as I18nStore | undefined)?.builderLabels;
}
/**
 * exerciseCard — Alpine component for a single exercise in session builder.
 *
 * Manages: expand/collapse, set CRUD, MRV suggestions,
 * warmup generation, exercise removal.
 *
 * Receives exercise by reference — mutations reflect in parent immediately.
 * Labels, trExercise, trMuscle, muscleHue accessed via parent Alpine scope.
 */

import { suggestLoadSuggestion } from '../../lib/mrv';
import { currentUnit, formatWeightValue, weightFromInput } from '../../lib/format';
import { getLocale, t } from '../../i18n';
import {
  formatExerciseSummary,
  generateWarmupSets,
  hasWorkingWeight,
  createNextSet,
  type BuilderExercise,
} from '../../lib/session-builder-stats';
import type { SessionSet } from '../../lib/storage/types';

export function exerciseCard(exercise: BuilderExercise, exerciseIndex: number) {
  return {
    exercise,
    exerciseIndex,
    expanded: false,
    _mrvCache: new Map<string, ReturnType<typeof suggestLoadSuggestion>>(),

    _listeners: null as null | { expand: () => void; collapse: () => void },

    init() {
      this.expanded = true;
      const expand = () => (this.expanded = true);
      const collapse = () => (this.expanded = false);
      this._listeners = { expand, collapse };
      window.addEventListener('builder:expand-all', expand);
      window.addEventListener('builder:collapse-all', collapse);
    },

    destroy() {
      if (!this._listeners) return;
      window.removeEventListener('builder:expand-all', this._listeners.expand);
      window.removeEventListener('builder:collapse-all', this._listeners.collapse);
      this._listeners = null;
    },

    toggle() {
      this.expanded = !this.expanded;
      window.dispatchEvent(
        new CustomEvent('builder:exercise-toggled', {
          detail: { exerciseId: this.exercise.exerciseId, expanded: this.expanded },
        })
      );
    },

    get summary(): string {
      return formatExerciseSummary(
        this.exercise,
        (builderLabels() ?? {}) as Parameters<typeof formatExerciseSummary>[1]
      );
    },

    /** Poids affiché dans l'unité choisie ; le stockage reste en kg. */
    displayWeight(kg: number): string {
      return formatWeightValue(kg, currentUnit());
    },

    /** Convertit la saisie en kg puis réaffiche la valeur normalisée. */
    storeWeight(input: HTMLInputElement, set: SessionSet): void {
      set.weight = weightFromInput(Number(input.value), currentUnit());
      input.value = this.displayWeight(set.weight);
    },

    addSet() {
      const sets = this.exercise.sets;
      const last = sets[sets.length - 1];
      sets.push(createNextSet(this.exercise.exerciseId, sets.length + 1, last));
    },

    removeSet(setIndex: number) {
      if (this.exercise.sets.length <= 1) return;
      this.exercise.sets.splice(setIndex, 1);
      this.exercise.sets.forEach((s: SessionSet, i: number) => {
        s.setNumber = i + 1;
      });
    },

    generateWarmup() {
      const result = generateWarmupSets(this.exercise.exerciseId, this.exercise.sets);
      if (result.length > 0) this.exercise.sets = result;
    },

    get canWarmup(): boolean {
      return hasWorkingWeight(this.exercise);
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    remove(this: any) {
      this.$dispatch('builder:remove-exercise', {
        index: this.exerciseIndex,
      });
    },

    mrvSuggestion(setIndex: number) {
      const set = this.exercise.sets[setIndex];
      if (!set) return null;
      const key = `${this.exercise.exerciseId}:${setIndex}:${set.reps}:${set.weight}`;
      if (this._mrvCache.has(key)) return this._mrvCache.get(key)!;
      const allSessions = window.__builderSessions ?? [];
      const result = suggestLoadSuggestion(this.exercise.exerciseId, allSessions, {
        targetReps: set.reps > 0 ? set.reps : undefined,
        lastLoad: set.weight > 0 ? set.weight : undefined,
      });
      this._mrvCache.set(key, result);
      return result;
    },

    mrvEnabled(setIndex: number): boolean {
      const s = this.mrvSuggestion(setIndex);
      return Boolean(s && s.weight != null);
    },

    mrvTitle(setIndex: number): string {
      const labels = builderLabels() ?? t(getLocale()).builder;
      const s = this.mrvSuggestion(setIndex);
      if (!s || s.reason === 'none') return labels.mrvNoHistory ?? '';
      if (s.reason === 'epley-cap') return labels.mrvCapped ?? '';
      return labels.mrvFromHistory ?? '';
    },

    applyMrv(setIndex: number) {
      const labels = builderLabels() ?? {};
      const set = this.exercise.sets[setIndex];
      const s = this.mrvSuggestion(setIndex);
      if (!set || !s) return;
      if (s.weight == null) {
        this.showToast(labels.mrvNoHistory ?? '', 'warning');
        return;
      }
      set.weight = s.weight;
      const weightLabel = formatWeightValue(s.weight, currentUnit());
      this.showToast((labels.mrvToast ?? '').replace('{weight}', weightLabel), 'success');
    },

    showToast(message: string, variant = 'info') {
      uiStore.notify(message, variant);
    },
  };
}
