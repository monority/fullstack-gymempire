/**
 * logique Alpine de la page détail séance.
 *
 * Module pur : aucune lecture de `window` ni de localStorage ici. Les données
 * et les effets de bord sont injectés par la page `.astro`.
 */

import type { Dictionary } from '../../i18n/types';
import { statusLabel, type StatusLabels } from '../../lib/session-utils';
import {
  typeLabel as formatTypeLabel,
  formatSetRpe as formatSetRpeValue,
  exerciseVolume as computeExerciseVolume,
} from '../../lib/workout-helpers';
import { moodSvg, moodLabel, type MoodLabels } from '../../lib/mood';
import {
  computeRpeStats,
  computeRpeSuggestion,
  computeSessionTotalVolume,
  computeTotalSets,
  hasNotes,
  rpeTone,
  rpeLabel,
  fatigueLabel,
} from '../../lib/session-detail-stats';
import { generateSessionShareCard, downloadDataUrl } from '../../lib/share-card';
import { downloadBlob, slugify } from '../../lib/csv-export';
import { getSessionById, updateSession, deleteSession } from '../../lib/storage/sessions';
import { calculate1RM } from '../../lib/storage/store';
import { exportSessionAsCsv } from '../../lib/storage/csv';
import { formatDateTime, formatVolume, formatDuration } from '../../lib/format';
import type {
  Session,
  SessionExercise,
  SessionMood,
  SessionStatus,
  RpeType,
  SetType,
} from '../../lib/storage/types';

export interface SessionDetailLabels {
  detail: Dictionary['detail'];
  volume: string;
  printHref: string;
  csvDownloaded: string;
  csvDownloadFailed: string;
  mood: MoodLabels;
}

export function buildSessionDetailLabels(L: Dictionary): SessionDetailLabels {
  return {
    detail: L.detail,
    volume: L.sessions.volume,
    printHref: '',
    csvDownloaded: L.detail.csvDownloaded,
    csvDownloadFailed: L.detail.csvDownloadFailed,
    mood: {
      great: L.detail.moodGreat,
      good: L.detail.moodGood,
      ok: L.detail.moodOk,
      tired: L.detail.moodTired,
      bad: L.detail.moodBad,
    },
  };
}

export interface SessionDetailDeps {
  labels: SessionDetailLabels;
  search: string;
  localizedPath(path: string): string;
  ui: {
    notify(message: string, kind?: string): void;
    openDialog(id: string): void;
    closeDialog(id: string): void;
    navigate(href: string): void;
    translateExercise(name: string): string;
  };
}

export interface SessionDetailApp {
  labels: Record<string, unknown>;
  session: Session | null;
  sessionId: string;
  notFound: boolean;
  init(): void;
  sessionTotalVolume: number;
  totalSets: number;
  hasNotes: boolean;
  rpeStats: { count: number; avg: number; max: number; allTen: boolean };
  rpeSuggestion: {
    headline: string;
    detail: string;
    tone: 'up' | 'maintain' | 'down';
  } | null;
  exerciseVolume(ex: SessionExercise): number;
  best1RM(ex: SessionExercise): number;
  trName(ex: SessionExercise): string;
  supersetGroup(ex: SessionExercise): { n: number; color: number } | null;
  supersetTint(ex: SessionExercise): string;
  supersetLabelFor(ex: SessionExercise): string;
  supersetMembers(ex: SessionExercise): string;
  statusLabel(s: SessionStatus): string;
  typeLabel(t: SetType): string;
  formatDateTime(iso: string): string;
  compareHref(): string;
  formatDuration(seconds?: number): string;
  formatVolume(v: number): string;
  formatWeight(w: number): string;
  formatRpe(rpe: number): string;
  formatSetRpe(set: { rpe?: number | null; rpeType?: RpeType }): string;
  formatShareDate(iso?: string): string;
  rpeTone(rpe: number | undefined | null): string;
  rpeLabel(rpe: number | undefined | null): string;
  fatigueLabel(level: number | undefined | null): string;
  moodIcon(mood: SessionMood | undefined | null): string;
  moodLabel(mood: SessionMood | undefined | null): string;
  quickSessionHref(): string;
  editHref(): string;
  updateStatus(status: SessionStatus): void;
  openDeleteDialog(): void;
  confirmDelete(): void;
  printHref(): string;
  downloadSessionCsv(): void;
  generateShareCard(): Promise<void>;
}

export function createSessionDetailApp(deps: SessionDetailDeps): SessionDetailApp {
  const { labels, localizedPath: path, ui } = deps;
  const D = labels.detail;

  const statusLabels: StatusLabels = {
    completed: D.completed,
    inProgress: D.inProgress,
    planned: D.planned,
  };

  return {
    labels: { ...D, printHref: labels.printHref },
    session: null,
    sessionId: '',
    notFound: false,

    init() {
      const params = new URLSearchParams(deps.search);
      this.sessionId = params.get('id') || '';
      if (!this.sessionId) {
        this.notFound = true;
        return;
      }
      const found = getSessionById(this.sessionId);
      if (!found) {
        this.notFound = true;
        return;
      }
      this.session = found;
    },

    get sessionTotalVolume() {
      return computeSessionTotalVolume(this.session);
    },
    get totalSets() {
      return computeTotalSets(this.session);
    },
    get hasNotes() {
      return hasNotes(this.session);
    },
    get rpeStats() {
      return computeRpeStats(this.session);
    },
    get rpeSuggestion() {
      return computeRpeSuggestion(this.rpeStats, {
        allTenHeadline: D.suggestionAllTenHeadline,
        allTenDetail: D.suggestionAllTenDetail,
        increaseHeadline: D.suggestionIncreaseHeadline,
        increaseDetail: D.suggestionIncreaseDetail,
        maintainHeadline: D.suggestionMaintainHeadline,
        maintainDetail: D.suggestionMaintainDetail,
        continueHeadline: D.suggestionContinueHeadline,
        continueDetail: D.suggestionContinueDetail,
      });
    },

    exerciseVolume(ex) {
      return computeExerciseVolume(ex);
    },
    best1RM(ex) {
      let best = 0;
      for (const set of ex.sets) {
        if (!set.completed) continue;
        const estimate = calculate1RM(set.weight, set.reps);
        if (estimate > best) best = estimate;
      }
      return best;
    },
    trName(ex) {
      return ui.translateExercise(ex.name);
    },
    supersetGroup(ex) {
      if (!this.session?.supersets) return null;
      const idx = this.session.supersets.findIndex((g) => g.exercises.includes(ex.exerciseId));
      if (idx === -1) return null;
      return { n: idx + 1, color: (idx % 5) + 1 };
    },
    supersetTint(ex) {
      const group = this.supersetGroup(ex);
      return group ? `exo-row--g${group.color}` : '';
    },
    supersetLabelFor(ex) {
      const group = this.supersetGroup(ex);
      return group ? `${D.supersetLabel} ${group.n}` : '';
    },
    supersetMembers(ex) {
      if (!this.session?.supersets) return '';
      const group = this.session.supersets.find((g) => g.exercises.includes(ex.exerciseId));
      if (!group) return '';
      return this.session.exercises
        .filter((e) => group.exercises.includes(e.exerciseId))
        .map((e) => this.trName(e))
        .join(' · ');
    },

    statusLabel(s) {
      return statusLabel(s, statusLabels);
    },
    typeLabel(t) {
      return formatTypeLabel(t, {
        warmup: D.typeWarmup,
        work: D.typeWork,
        top: D.typeTop,
        drop: D.typeDrop,
        failure: D.typeFailure,
      });
    },
    formatDateTime(iso) {
      return formatDateTime(iso);
    },
    compareHref() {
      return path('/sessions/compare?id1=' + encodeURIComponent(this.session?.id || ''));
    },
    formatDuration(seconds) {
      if (!seconds || seconds <= 0) return '-';
      return formatDuration(seconds);
    },
    formatVolume(v) {
      return formatVolume(v);
    },
    formatWeight(w) {
      return formatVolume(w);
    },
    formatRpe(rpe) {
      if (!Number.isFinite(rpe)) return '-';
      return rpe.toString();
    },
    formatSetRpe(set) {
      return formatSetRpeValue(set.rpe, set.rpeType);
    },
    formatShareDate(iso) {
      return iso ? formatDateTime(iso) : '';
    },
    rpeTone(rpe) {
      return rpeTone(rpe);
    },
    rpeLabel(rpe) {
      return rpeLabel(rpe, {
        easy: D.rpeEasy,
        moderate: D.rpeModerate,
        hard: D.rpeHard,
        max: D.rpeMaxTone,
      });
    },
    fatigueLabel(level) {
      return fatigueLabel(level, {
        veryFresh: D.fatigueVeryFresh,
        fresh: D.fatigueFresh,
        normal: D.fatigueNormal,
        tired: D.fatigueTired,
        exhausted: D.fatigueExhausted,
      });
    },
    moodIcon(mood) {
      return moodSvg(mood);
    },
    moodLabel(mood) {
      return moodLabel(mood, labels.mood);
    },

    quickSessionHref() {
      if (!this.session) return path('/sessions/quick');
      return `${path('/sessions/quick')}?session=${encodeURIComponent(this.session.id)}`;
    },
    editHref() {
      return `${path('/sessions/create')}?edit=${encodeURIComponent(this.session?.id || '')}`;
    },
    updateStatus(status) {
      if (!this.session) return;
      this.session.status = status;
      updateSession(this.session.id, { status });
    },
    openDeleteDialog() {
      ui.openDialog('delete-session-dialog');
    },
    confirmDelete() {
      if (!this.session) return;
      deleteSession(this.session.id);
      ui.closeDialog('delete-session-dialog');
      ui.navigate(path('/sessions'));
    },
    printHref() {
      const base = this.labels.printHref as string;
      return base + (this.session ? `?id=${encodeURIComponent(this.session.id)}` : '');
    },
    downloadSessionCsv() {
      if (!this.session) return;
      try {
        const csv = exportSessionAsCsv(this.session);
        const datePart = (this.session.date || '').split('T')[0] || 'seance';
        downloadBlob(
          `${slugify(this.session.name)}_${datePart}.csv`,
          csv,
          'text/csv;charset=utf-8'
        );
        ui.notify(D.csvDownloaded, 'success');
      } catch (err) {
        ui.notify(err instanceof Error ? err.message : D.csvDownloadFailed, 'error');
      }
    },
    async generateShareCard() {
      if (!this.session) return;
      const datePart = (this.session.date || '').split('T')[0] || 'seance';
      try {
        const dataUrl = await generateSessionShareCard(this.session, {
          labels: {
            exercises: D.exercises,
            shareSetsLabel: D.shareSetsLabel,
            volume: labels.volume,
            setSingular: D.setSingular,
            setPlural: D.setPlural,
            moreSingular: D.moreSingular,
            morePlural: D.morePlural,
            shareFooter: D.shareFooter,
            completed: D.completed,
            inProgress: D.inProgress,
            planned: D.planned,
          },
        });
        if (dataUrl) downloadDataUrl(dataUrl, `muscu-${datePart}.png`);
      } catch {
        // Canvas indisponible ou toBlob en échec : on ignore silencieusement.
      }
    },
  };
}
