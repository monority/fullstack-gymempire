/**
 * logique Alpine de la liste des séances.
 * Le markup `x-for` reste dans `src/pages/sessions/index.astro`.
 */

import type { Dictionary } from '../../i18n/types';
import {
  getSessions,
  getSessionById,
  saveSession,
  updateSession,
  deleteSession as removeSession,
} from '../../lib/storage/sessions';
import type { Session, SessionMood, SessionStatus } from '../../lib/storage/types';
import { formatDateTime, formatVolume } from '../../lib/format';
import { statusLabel, type StatusLabels } from '../../lib/session-utils';
import { moodSvg, moodLabel, type MoodLabels } from '../../lib/mood';
import {
  primaryMuscle,
  filterSessions,
  sortByDateDesc,
  countLabel,
  computeSessionStats,
} from '../../lib/session-list-stats';

export function buildSessionsLabels(L: Dictionary) {
  return {
    exoPlural: L.sessions.exoPlural,
    exoSingular: L.sessions.exoSingular,
    moodLabel: L.sessions.moodLabel,
    noResult: L.sessions.noResult,
    noMatchPrefix: L.sessions.noMatchPrefix,
    resetSearch: L.sessions.resetSearch,
    noSession: L.sessions.noSession,
    noMatch: L.sessions.noMatch,
    seanceSingular: L.sessions.seanceSingular,
    seancePlural: L.sessions.seancePlural,
    pluralS: L.sessions.pluralS,
    deleteConfirm: L.sessions.deleteConfirm,
    seenAriaPrefix: L.sessions.seenAriaPrefix,
    moreActions: L.sessions.moreActions,
    resume: L.sessions.resume,
    markComplete: L.sessions.markComplete,
    duplicate: L.sessions.duplicate,
    moveDate: L.sessions.moveDate,
    copySuffix: L.sessions.copySuffix,
    status: {
      completed: L.sessions.completed,
      inProgress: L.sessions.inProgress,
      planned: L.sessions.planned,
    },
    mood: {
      great: L.sessions.moodGreat,
      good: L.sessions.moodGood,
      ok: L.sessions.moodOk,
      tired: L.sessions.moodTired,
      bad: L.sessions.moodBad,
    },
  };
}

export type SessionsLabels = ReturnType<typeof buildSessionsLabels>;

export interface SessionsAppDeps {
  labels: SessionsLabels;
  today(): Date;
  localizedPath(path: string): string;
  ui: {
    confirm(message: string): boolean;
    navigate(href: string): void;
    translateMuscle(name: string): string;
    openDialog(id: string): void;
    closeDialog(id: string): void;
  };
}

export interface SessionsApp {
  sessions: Session[];
  search: string;
  menuId: string;
  moveSessionId: string;
  moveDate: string;
  labels: SessionsLabels;
  todayIso: string;
  init(): void;
  refresh(): void;
  filtered: Session[];
  countLabel: string;
  hasSessions: boolean;
  totalVolume(session: Session): number;
  statusLabel(status: SessionStatus): string;
  formatDate(iso: string): string;
  formatVolume(volume: number): string;
  moodIcon(mood: SessionMood | undefined | null): string;
  moodLabel(mood: SessionMood | undefined | null): string;
  primaryMuscle(session: Session): string;
  muscleLabel(name: string): string;
  navigateTo(id: string): void;
  deleteSession(id: string): void;
  setStatus(id: string, status: SessionStatus): void;
  duplicateSession(id: string): void;
  openMove(id: string): void;
  confirmMove(): void;
}

export function createSessionsApp(deps: SessionsAppDeps): SessionsApp {
  const { labels, localizedPath: path, ui } = deps;
  const statusLabels: StatusLabels = labels.status;
  const moodLabels: MoodLabels = labels.mood;

  return {
    sessions: [],
    search: '',
    menuId: '',
    moveSessionId: '',
    moveDate: '',
    labels,

    get todayIso() {
      return deps.today().toISOString().slice(0, 10);
    },

    init() {
      this.refresh();
    },

    refresh() {
      this.sessions = sortByDateDesc(getSessions());
    },

    get filtered() {
      return filterSessions(this.sessions, this.search);
    },
    get countLabel() {
      return countLabel(this.filtered.length, this.sessions.length, labels);
    },
    get hasSessions() {
      return this.sessions.length > 0;
    },

    totalVolume(session) {
      return computeSessionStats(session).totalVolume;
    },
    statusLabel(status) {
      return statusLabel(status, statusLabels);
    },
    formatDate(iso) {
      return formatDateTime(iso);
    },
    formatVolume(volume) {
      return formatVolume(volume);
    },
    moodIcon(mood) {
      return moodSvg(mood);
    },
    moodLabel(mood) {
      return moodLabel(mood, moodLabels);
    },
    primaryMuscle(session) {
      return primaryMuscle(session);
    },
    muscleLabel(name) {
      return ui.translateMuscle(name);
    },

    navigateTo(id) {
      ui.navigate(path('/sessions/detail?id=' + encodeURIComponent(id)));
    },
    deleteSession(id) {
      if (!ui.confirm(labels.deleteConfirm)) return;
      removeSession(id);
      this.sessions = this.sessions.filter((s) => s.id !== id);
    },
    setStatus(id, status) {
      updateSession(id, { status });
      this.refresh();
    },
    duplicateSession(id) {
      const src = getSessionById(id);
      if (!src) return;
      const copy: Omit<Session, 'id'> = {
        name: src.name + ' ' + labels.copySuffix,
        date: deps.today().toISOString(),
        status: 'planned',
        exercises: src.exercises.map((ex) => ({
          ...ex,
          sets: ex.sets.map((set) => ({ ...set, completed: false })),
        })),
      };
      if (src.supersets) copy.supersets = src.supersets.map((g) => ({ ...g }));
      saveSession(copy);
      this.refresh();
    },
    openMove(id) {
      const src = getSessionById(id);
      if (!src) return;
      this.moveSessionId = id;
      this.moveDate = (src.date || '').slice(0, 10);
      ui.openDialog('sess-move-dialog');
    },
    confirmMove() {
      if (!this.moveSessionId || !this.moveDate) return;
      const date = new Date(this.moveDate + 'T12:00:00').toISOString();
      updateSession(this.moveSessionId, { date, status: 'planned' });
      this.moveSessionId = '';
      this.moveDate = '';
      ui.closeDialog('sess-move-dialog');
      this.refresh();
    },
  };
}
