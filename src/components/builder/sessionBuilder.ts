/**
 * état du builder de séance.
 *
 * Toute la logique déjà extraite (exerciseCard, exercisePicker, sessionMeta,
 * sessionSave, superset, builderState) est réutilisée ici. Ce factory ne fait
 * qu'assembler l'état Alpine ; la page garde le template et le câblage DOM.
 */

import { currentUnit } from '../../lib/format';
import { saveBuilderDraft, loadBuilderDraft, clearBuilderDraft } from './builderDraft';
import { getExercises } from '../../lib/storage/exercises';
import { getSessions } from '../../lib/storage/sessions';
import type { Exercise, Session, SessionMood } from '../../lib/storage/types';
import { rpeTone, type BuilderExercise } from '../../lib/session-builder-stats';
import {
  filterExercises,
  buildNewExercise,
  loadTemplate as loadPickerTemplate,
  hasExerciseTip,
  getExerciseTipText,
  getExerciseTipVideoUrl,
} from './exercisePicker';
import { rpeLabel, toggleFatigue, toggleMood, type SessionMetaLabels } from './sessionMeta';
import {
  availableSupersetIds as getAvailableSupersetIds,
  nextSupersetId as getNextSupersetIdFn,
  normalizeSupersetId,
  buildSupersetChain,
  trName,
} from './superset';
import { saveSessionBuilder, shouldConfirmDiscard } from './sessionSave';
import { toggleId, addId, removeId, isIdIn, allExpanded as checkAllExpanded } from './builderState';
import { loadEditSession } from './editSessionLoader';
import type { BuilderLabels } from './builderLabels';

export interface SessionBuilderDeps {
  labels: BuilderLabels;
  rpeLabels: SessionMetaLabels;
  search: string;
  today(): string;
  locale: string;
  host: {
    /** Expose les données au picker via window.__builderSessions / __builderLabels. */
    expose(sessions: Session[], labels: BuilderLabels): void;
    onToggle(listener: (exerciseId: string, expanded: boolean) => void): void;
    openDialog(id: string): void;
    closeDialog(id: string): void;
    dispatch(name: 'builder:expand-all' | 'builder:collapse-all'): void;
    confirm(message: string): boolean;
    navigate(href: string): void;
    focusPickerSearch(): void;
  };
  localizedPath(path: string): string;
}

export interface SessionBuilderApp {
  sessionName: string;
  sessionDate: string;
  exercises: BuilderExercise[];
  availableExercises: Exercise[];
  allSessions: Session[];
  exerciseSearch: string;
  exerciseMuscleFilter: string;
  sessionRpe: number | null;
  unit: ReturnType<typeof currentUnit>;
  sessionFatigue: number;
  sessionMood: SessionMood | '';
  sessionNotes: string;
  expandedExercises: string[];
  openTips: string[];
  labels: BuilderLabels;
  editSessionId: string | null;
  init(): void;
  filteredExercises: Exercise[];
  muscleFilters: string[];
  canSave: boolean;
  rpeTone: 'easy' | 'moderate' | 'hard' | 'max';
  rpeLabel: string;
  isExpanded(exerciseIndex: number): boolean;
  toggleExpand(exerciseIndex: number): void;
  expandAll(): void;
  collapseAll(): void;
  allExpanded: boolean;
  openPicker(): void;
  addExercise(exercise: Exercise): void;
  loadTemplate(templateId: string): void;
  findExerciseByName(name: string): Exercise | undefined;
  hasTip(name: string): boolean;
  getTip(name: string): string;
  getVideoUrl(name: string): string;
  isTipOpen(exId: string): boolean;
  toggleTip(exId: string): void;
  availableSupersetIds(): number[];
  nextSupersetId(): number;
  onSupersetChange(exIdx: number): void;
  removeFromSuperset(exIdx: number): void;
  supersetChainFor(gid: number | null): string[];
  removeExercise(exerciseIndex: number): void;
  setFatigue(level: number): void;
  setMood(mood: SessionMood): void;
  discard(): void;
  save(): void;
  openDialogById(id: string): void;
  closeDialogById(id: string): void;
}

export function createSessionBuilderApp(deps: SessionBuilderDeps): SessionBuilderApp {
  const persistDraft = (app: SessionBuilderApp) =>
    saveBuilderDraft({
      name: app.sessionName,
      date: app.sessionDate,
      exercises: app.exercises,
      rpe: app.sessionRpe,
      fatigue: app.sessionFatigue,
      mood: app.sessionMood,
      notes: app.sessionNotes,
    });
  const { labels, rpeLabels, search, locale, host, localizedPath: path } = deps;

  return {
    sessionName: '',
    sessionDate: deps.today(),
    exercises: [],
    availableExercises: [],
    allSessions: [],
    exerciseSearch: '',
    exerciseMuscleFilter: '',
    sessionRpe: null,
    unit: currentUnit(),
    sessionFatigue: 0,
    sessionMood: '',
    sessionNotes: '',
    expandedExercises: [],
    openTips: [],
    labels,
    editSessionId: null,

    init() {
      this.availableExercises = getExercises();
      this.allSessions = getSessions();
      host.expose(this.allSessions, labels);

      host.onToggle((exerciseId, expanded) => {
        this.expandedExercises = expanded
          ? addId(this.expandedExercises, exerciseId)
          : removeId(this.expandedExercises, exerciseId);
      });

      const requestedId = new URLSearchParams(search).get('edit');
      if (requestedId) {
        const data = loadEditSession(requestedId);
        if (!data) return;
        this.editSessionId = data.sessionId;
        this.sessionName = data.name;
        this.sessionDate = data.date;
        this.sessionRpe = data.rpe ?? null;
        this.sessionFatigue = data.fatigue;
        this.sessionMood = data.mood as SessionMood | '';
        this.sessionNotes = data.notes;
        this.exercises = data.exercises;
        this.expandAll();
        return;
      }

      // Pas d'édition : on restaure un éventuel brouillon local.
      const draft = loadBuilderDraft();
      if (!draft) return;
      this.sessionName = draft.name;
      this.sessionDate = draft.date;
      this.exercises = draft.exercises;
      this.sessionRpe = draft.rpe ?? null;
      this.sessionFatigue = draft.fatigue;
      this.sessionMood = draft.mood;
      this.sessionNotes = draft.notes;
      this.expandedExercises = draft.exercises.map((ex) => ex.exerciseId);
    },

    get filteredExercises() {
      const addedIds = new Set(this.exercises.map((se) => se.exerciseId));
      return filterExercises(
        this.availableExercises,
        addedIds,
        this.exerciseSearch,
        this.exerciseMuscleFilter
      );
    },
    get muscleFilters() {
      return [...new Set(this.availableExercises.map((exercise) => exercise.muscle))]
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, locale));
    },
    get canSave() {
      return (
        Boolean(this.sessionName.trim()) &&
        this.exercises.length > 0 &&
        this.exercises.every((exercise) => exercise.sets.length > 0)
      );
    },
    get rpeTone() {
      return rpeTone(this.sessionRpe ?? 0);
    },
    get rpeLabel() {
      return rpeLabel(this.sessionRpe, rpeLabels);
    },

    isExpanded(exerciseIndex) {
      const ex = this.exercises[exerciseIndex];
      return ex ? isIdIn(this.expandedExercises, ex.exerciseId) : false;
    },
    toggleExpand(exerciseIndex) {
      const ex = this.exercises[exerciseIndex];
      if (!ex) return;
      this.expandedExercises = toggleId(this.expandedExercises, ex.exerciseId);
    },
    expandAll() {
      this.expandedExercises = this.exercises.map((ex) => ex.exerciseId);
      host.dispatch('builder:expand-all');
    },
    collapseAll() {
      this.expandedExercises = [];
      host.dispatch('builder:collapse-all');
    },
    get allExpanded() {
      return checkAllExpanded(this.exercises.length, this.expandedExercises.length);
    },

    openPicker() {
      // Recherche et filtre sont conservés d'une ouverture à l'autre.
      host.openDialog('ses-picker-dialog');
      host.focusPickerSearch();
    },
    addExercise(exercise) {
      const newEx = buildNewExercise(exercise);
      this.exercises.push(newEx);
      this.expandedExercises = [...this.expandedExercises, newEx.exerciseId];
      persistDraft(this);
      // Le dialogue reste ouvert : on peut enchaîner les ajouts.
    },
    loadTemplate(templateId) {
      const result = loadPickerTemplate(templateId, this.availableExercises);
      if (!result) return;
      this.availableExercises = result.newAvailable;
      const added: string[] = [];
      for (const ex of result.exercises) {
        this.exercises.push(ex);
        added.push(ex.exerciseId);
      }
      if (added.length > 0) {
        this.expandedExercises = [...this.expandedExercises, ...added];
      }
      // Un template ajoute toute une séance : on referme pour passer à la suite.
      host.closeDialog('ses-picker-dialog');
    },
    findExerciseByName(name) {
      return this.availableExercises.find((e) => e.name === name);
    },
    hasTip(name) {
      return hasExerciseTip(name);
    },
    getTip(name) {
      return getExerciseTipText(name);
    },
    getVideoUrl(name) {
      return getExerciseTipVideoUrl(name);
    },
    isTipOpen(exId) {
      return isIdIn(this.openTips, exId);
    },
    toggleTip(exId) {
      this.openTips = toggleId(this.openTips, exId);
    },

    availableSupersetIds() {
      return getAvailableSupersetIds(this.exercises);
    },
    nextSupersetId() {
      return getNextSupersetIdFn(this.exercises);
    },
    onSupersetChange(exIdx) {
      const ex = this.exercises[exIdx];
      if (!ex) return;
      ex.supersetId = normalizeSupersetId(ex.supersetId);
    },
    removeFromSuperset(exIdx) {
      const ex = this.exercises[exIdx];
      if (!ex) return;
      ex.supersetId = null;
    },
    supersetChainFor(gid) {
      return buildSupersetChain(this.exercises, gid, (name) => trName({ name } as BuilderExercise));
    },
    removeExercise(exerciseIndex) {
      const ex = this.exercises[exerciseIndex];
      if (ex) {
        this.expandedExercises = this.expandedExercises.filter((id) => id !== ex.exerciseId);
      }
      this.exercises.splice(exerciseIndex, 1);
      persistDraft(this);
    },
    setFatigue(level) {
      this.sessionFatigue = toggleFatigue(this.sessionFatigue, level);
      persistDraft(this);
    },
    setMood(mood) {
      this.sessionMood = toggleMood(this.sessionMood, mood);
      persistDraft(this);
    },
    discard() {
      if (shouldConfirmDiscard(this.exercises.length, this.sessionName)) {
        if (!host.confirm(labels.discardConfirm)) return;
      }
      clearBuilderDraft();
      host.navigate(path('/sessions'));
    },
    save() {
      if (!this.canSave) return;
      saveSessionBuilder({
        name: this.sessionName,
        date: this.sessionDate,
        exercises: this.exercises,
        rpe: this.sessionRpe,
        fatigue: this.sessionFatigue,
        mood: this.sessionMood,
        notes: this.sessionNotes,
        editSessionId: this.editSessionId,
      });
      clearBuilderDraft();
      host.navigate(path('/sessions'));
    },
    openDialogById(id) {
      host.openDialog(id);
    },
    closeDialogById(id) {
      host.closeDialog(id);
    },
  };
}
