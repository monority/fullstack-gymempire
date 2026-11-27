import { localDateKey } from '../../lib/date';
/**
 * logique Alpine de la page Exercices.
 *
 * Le template reste dans `src/pages/exercises/index.astro` (convention
 * AGENTS.md). Ce module contient uniquement l'état et les transformations.
 */

import type { Dictionary } from '../../i18n/types';
import {
  getExercises,
  saveExercise,
  updateExercise,
  deleteExercise,
  toggleExerciseFavorite,
} from '../../lib/storage/exercises';
import { getSessions, saveSession, updateSession } from '../../lib/storage/sessions';
import type { Exercise, Session, SessionExercise, SessionSet } from '../../lib/storage/types';
import { currentUnit, formatWeightValue, weightFromInput } from '../../lib/format';
import { getExerciseTip } from '../../lib/exercise-tips';
import {
  resolveForm,
  computeSetCounts,
  filterExercises,
  computeMuscleGroups,
  muscleOptionsForSelect,
  buildTrendUrl,
  hasWorkingWeight as hasSetWorkingWeight,
  generateWarmupRows,
  formatCountLabel,
  CUSTOM_MUSCLE,
  type FormState,
  type AddSetRow,
} from '../../lib/exercises-stats';

export interface ExercisesLabels {
  editTitle: string;
  addTitle: string;
  save: string;
  add: string;
  deleteSet: string;
  weightAria: string;
  repsAria: string;
  warmupTitle: string;
  warmupHint: string;
  showTipAria: string;
  videoAria: string;
  onYoutube: string;
  sets: string;
  favorite: string;
  unfavorite: string;
  favoriteAria: string;
  unfavoriteAria: string;
  trendAria: string;
  trendTitle: string;
  formRequired: string;
  formError: string;
  toastAdded: string;
  autre: string;
  seanceSingular: string;
  exoSingular: string;
  exoPlural: string;
}

export function buildExercisesLabels(L: Dictionary): ExercisesLabels {
  return {
    editTitle: L.exercices.editTitle,
    addTitle: L.exercices.addTitle,
    save: L.common.save,
    add: L.common.add,
    deleteSet: L.builder.deleteSet,
    weightAria: L.builder.weightForSet,
    repsAria: L.builder.repsForSet,
    warmupTitle: L.builder.warmupTitle,
    warmupHint: L.builder.warmupHint,
    showTipAria: L.exercices.showTipAria,
    videoAria: L.exercices.videoAria,
    onYoutube: L.exercices.onYoutube,
    sets: L.exercices.sets,
    favorite: L.exercices.favorite,
    unfavorite: L.exercices.unfavorite,
    favoriteAria: L.exercices.favoriteAria,
    unfavoriteAria: L.exercices.unfavoriteAria,
    trendAria: L.tendance.trendAria,
    trendTitle: L.tendance.title,
    formRequired: L.exercices.formRequired,
    formError: L.exercices.formError,
    toastAdded: L.exercices.toastAdded,
    autre: L.exercices.categories.autre,
    seanceSingular: L.sessions.seanceSingular,
    exoSingular: L.sessions.exoSingular,
    exoPlural: L.sessions.exoPlural,
  };
}

export interface ExercisesDeps {
  labels: ExercisesLabels;
  localizedPath(path: string): string;
  clock: {
    now(): Date;
    locale(): string;
  };
  ui: {
    notify(message: string, kind?: string): void;
    openDialog(id: string): void;
    closeDialog(id: string): void;
  };
}

export interface ExercisesApp {
  unit: ReturnType<typeof currentUnit>;
  displayWeight(kg: number): string;
  storeWeight(input: HTMLInputElement, row: AddSetRow): void;
  exercises: Exercise[];
  sessions: Session[];
  setCounts: Record<string, number>;
  search: string;
  muscleFilter: string;
  favFilter: boolean;
  form: FormState;
  formError: string;
  editingId: string;
  deletingExercise: Exercise | null;
  deletingName: string;
  addingExercise: Exercise | null;
  addToSessionId: string;
  newSessionName: string;
  addSets: AddSetRow[];
  labels: ExercisesLabels;
  openTips: string[];
  init(): void;
  refresh(): void;
  getSetCount(exerciseId: string): number;
  trendUrl(ex: Exercise): string;
  muscleGroups: string[];
  muscleOptionsForSelect: { value: string; label: string }[];
  filtered: Exercise[];
  countLabel: string;
  hasFilters: boolean;
  openAdd(): void;
  edit(exercise: Exercise): void;
  toggleFav(ex: Exercise): void;
  save(): void;
  closeForm(): void;
  askDelete(exercise: Exercise): void;
  confirmDelete(): void;
  openAddToSession(exercise: Exercise): void;
  closeAddToSession(): void;
  hasTip(name: string): boolean;
  getTip(name: string): string;
  getVideoUrl(name: string): string;
  isTipOpen(exId: string): boolean;
  toggleTip(exId: string): void;
  addSetToConfig(): void;
  removeSetFromConfig(index: number): void;
  hasWorkingWeight(): boolean;
  generateWarmup(): void;
  submitAddToSession(): void;
  openDialogById(id: string): void;
  closeDialogById(id: string): void;
}

const emptyForm = (): FormState => ({
  name: '',
  muscle: '',
  customMuscle: '',
  category: '',
});

/** Une seule série, pré-remplie depuis la dernière séance de l'exercice. */
const defaultAddSetsFor = (exerciseId: string, sessions: Session[]): AddSetRow[] => {
  let last: { weight: number; reps: number } | undefined;
  let lastDate = '';
  for (const session of sessions) {
    if (session.date < lastDate) continue;
    for (const ex of session.exercises) {
      if (ex.exerciseId !== exerciseId) continue;
      for (const set of ex.sets) {
        if (!set.completed || set.type !== 'work' || set.weight <= 0) continue;
        if (session.date >= lastDate) {
          lastDate = session.date;
          last = { weight: set.weight, reps: set.reps };
        }
      }
    }
  }
  return [{ type: 'work', weight: last?.weight ?? 0, reps: last?.reps ?? 0 }];
};

export function createExercisesApp(deps: ExercisesDeps): ExercisesApp {
  const { labels, localizedPath: path, clock, ui } = deps;

  return {
    unit: currentUnit(),
    displayWeight(kg) {
      return formatWeightValue(kg, this.unit);
    },
    storeWeight(input, row) {
      row.weight = weightFromInput(Number(input.value), this.unit);
      input.value = this.displayWeight(row.weight);
    },
    exercises: [],
    sessions: [],
    setCounts: {},
    search: '',
    muscleFilter: '',
    favFilter: false,
    form: emptyForm(),
    formError: '',
    editingId: '',
    deletingExercise: null,
    deletingName: '',
    addingExercise: null,
    addToSessionId: '',
    newSessionName: '',
    addSets: [{ type: 'work', weight: 0, reps: 0 }],
    labels,
    openTips: [],

    init() {
      this.refresh();
    },

    refresh() {
      this.exercises = getExercises();
      this.sessions = getSessions();
      this.setCounts = computeSetCounts(this.sessions);
    },

    getSetCount(exerciseId) {
      return this.setCounts[exerciseId] ?? 0;
    },

    trendUrl(ex) {
      return buildTrendUrl(ex.name, path('/exercises/trends'));
    },

    get muscleGroups() {
      return computeMuscleGroups(this.exercises);
    },
    get muscleOptionsForSelect() {
      return muscleOptionsForSelect(this.muscleGroups, labels.autre);
    },
    get filtered() {
      return filterExercises(this.exercises, {
        search: this.search,
        muscle: this.muscleFilter,
        favorites: this.favFilter,
      });
    },
    get countLabel() {
      return formatCountLabel(this.filtered.length, labels.exoSingular, labels.exoPlural);
    },
    get hasFilters() {
      return Boolean(this.search.trim() || this.muscleFilter || this.favFilter);
    },

    openAdd() {
      this.editingId = '';
      this.form = emptyForm();
      this.formError = '';
      ui.openDialog('exo-form-dialog');
    },

    edit(exercise) {
      this.editingId = exercise.id;
      const known = this.muscleGroups.includes(exercise.muscle);
      this.form = {
        name: exercise.name,
        muscle: known ? exercise.muscle : CUSTOM_MUSCLE,
        customMuscle: known ? '' : exercise.muscle,
        category: exercise.category,
      };
      this.formError = '';
      ui.openDialog('exo-form-dialog');
    },

    toggleFav(ex) {
      toggleExerciseFavorite(ex.id);
      this.refresh();
    },

    save() {
      const resolved = resolveForm(this.form);
      if (!resolved) {
        this.formError = labels.formRequired;
        return;
      }
      try {
        if (this.editingId) updateExercise(this.editingId, resolved);
        else saveExercise(resolved);
        this.refresh();
        ui.closeDialog('exo-form-dialog');
      } catch {
        this.formError = labels.formError;
      }
    },

    closeForm() {
      ui.closeDialog('exo-form-dialog');
    },

    askDelete(exercise) {
      this.deletingExercise = exercise;
      this.deletingName = exercise.name;
      ui.openDialog('exo-delete-dialog');
    },

    confirmDelete() {
      if (!this.deletingExercise) return;
      deleteExercise(this.deletingExercise.id);
      this.deletingExercise = null;
      this.deletingName = '';
      this.refresh();
      ui.closeDialog('exo-delete-dialog');
    },

    openAddToSession(exercise) {
      this.addingExercise = exercise;
      this.addToSessionId = '';
      this.newSessionName = '';
      this.addSets = defaultAddSetsFor(exercise.id, getSessions());
      this.sessions = getSessions();
      ui.openDialog('exo-add-to-session-dialog');
    },

    closeAddToSession() {
      this.addingExercise = null;
      this.addToSessionId = '';
      this.newSessionName = '';
      ui.closeDialog('exo-add-to-session-dialog');
    },

    hasTip(name) {
      return getExerciseTip(name) != null;
    },
    getTip(name) {
      return getExerciseTip(name)?.description ?? '';
    },
    getVideoUrl(name) {
      return getExerciseTip(name)?.videoUrl ?? '';
    },
    isTipOpen(exId) {
      return this.openTips.includes(exId);
    },
    toggleTip(exId) {
      this.openTips = this.isTipOpen(exId)
        ? this.openTips.filter((id) => id !== exId)
        : [...this.openTips, exId];
    },

    addSetToConfig() {
      this.addSets.push({ type: 'work', weight: 0, reps: 0 });
    },
    removeSetFromConfig(index) {
      if (this.addSets.length <= 1) return;
      this.addSets.splice(index, 1);
    },
    hasWorkingWeight() {
      return hasSetWorkingWeight(this.addSets);
    },
    generateWarmup() {
      const warmups = generateWarmupRows(this.addSets);
      if (warmups.length === 0) {
        ui.notify(labels.warmupHint);
        return;
      }
      this.addSets = [...warmups, ...this.addSets];
    },

    submitAddToSession() {
      if (!this.addingExercise || !this.addToSessionId) return;
      let sessionId = this.addToSessionId;

      if (sessionId === 'new') {
        const name =
          this.newSessionName.trim() ||
          `${labels.seanceSingular} ${clock.now().toLocaleDateString(clock.locale())}`;
        const created = saveSession({
          name,
          date: localDateKey(clock.now()),
          exercises: [],
          status: 'planned',
        });
        sessionId = created.id;
      }

      const session = getSessions().find((s) => s.id === sessionId);
      if (!session) return;

      const exerciseId = this.addingExercise.id;
      const entry: SessionExercise = {
        exerciseId,
        name: this.addingExercise.name,
        muscle: this.addingExercise.muscle,
        sets: this.addSets.map<SessionSet>((s, i) => ({
          exerciseId,
          setNumber: i + 1,
          type: s.type,
          weight: s.weight,
          reps: s.reps,
          completed: false,
        })),
      };

      session.exercises.push(entry);
      updateSession(session.id, { exercises: session.exercises });
      this.closeAddToSession();
      this.refresh();
      ui.notify(labels.toastAdded);
    },

    openDialogById(id) {
      ui.openDialog(id);
    },
    closeDialogById(id) {
      ui.closeDialog(id);
    },
  };
}
