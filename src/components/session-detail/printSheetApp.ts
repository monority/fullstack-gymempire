/**
 * D8 — logique Alpine de la feuille d'impression (page autonome).
 * `window`, le dialogue d'impression et la locale sont injectés.
 */

import { getSessionById } from '../../lib/storage/sessions';
import type {
  Session,
  SessionExercise,
  SessionStatus,
  SetType,
  RpeType,
} from '../../lib/storage/types';
import { statusLabel, type StatusLabels } from '../../lib/session-utils';
import { typeLabel } from '../../lib/workout-helpers';
import { formatDateLong, formatDurationShort, formatVolume, formatWeight } from '../../lib/format';

export interface PrintSheetLabels {
  common: { date: string };
  detail: {
    completed: string;
    inProgress: string;
    planned: string;
    typeWarmup: string;
    typeWork: string;
    typeTop: string;
    typeDrop: string;
    typeFailure: string;
    at: string;
    duration: string;
    totalVolume: string;
    exercises: string;
    sets: string;
    notes: string;
    statusLabel: string;
    colWeight: string;
    colReps: string;
    colType: string;
    printFooter: string;
    printNotFoundTitle: string;
    printNotFoundDesc: string;
    printNotFoundBack: string;
    supersetLabel: string;
  };
  locale(): string;
  backHref: string;
}

export interface PrintSheetDeps {
  search: string;
  labels: PrintSheetLabels;
  ui: {
    alreadyPrinted(): boolean;
    markPrinted(): void;
    print(): void;
    schedule(fn: () => void, ms: number): void;
  };
}

export interface PrintSheetApp {
  labels: Record<string, string>;
  session: Session | null;
  notFound: boolean;
  init(): void;
  schedulePrint(): void;
  totalVolume: number;
  totalSets: number;
  groupFor(ex: SessionExercise): { n: number } | null;
  supersetLabelFor(ex: SessionExercise): string;
  statusLabel(s: SessionStatus): string;
  typeLabel(t: SetType): string;
  formatDateTime(iso: string): string;
  formatDuration(seconds?: number): string;
  formatVolume(v: number): string;
  formatWeight(w: number): string;
  formatSetRpe(set: { rpe?: number | null; rpeType?: RpeType }): string;
  exerciseVolume(ex: SessionExercise): number;
}

export function createPrintSheetApp(deps: PrintSheetDeps): PrintSheetApp {
  const { labels: L, ui } = deps;
  const D = L.detail;

  const statusLabels: StatusLabels = {
    completed: D.completed,
    inProgress: D.inProgress,
    planned: D.planned,
  };
  const setTypeLabels = {
    warmup: D.typeWarmup,
    work: D.typeWork,
    top: D.typeTop,
    drop: D.typeDrop,
    failure: D.typeFailure,
  };

  function exerciseVolume(ex: SessionExercise): number {
    return ex.sets.reduce((s, set) => s + (set.completed ? set.weight * set.reps : 0), 0);
  }

  function formatDateTime(iso: string): string {
    const base = formatDateLong(iso);
    if (!/\d{2}:\d{2}/.test(iso)) return base;
    const loc = L.locale() === 'en' ? 'en-GB' : 'fr-FR';
    const time = new Date(iso).toLocaleTimeString(loc, {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${base} ${D.at} ${time}`;
  }

  function formatSetRpe(rpe: number | string | null | undefined, rpeType?: RpeType): string {
    const value = typeof rpe === 'string' ? Number(rpe) : rpe;
    if (value == null || !Number.isFinite(value)) return '-';
    return (rpeType === 'urpe' ? 'uRPE ' : 'RPE ') + value.toString();
  }

  return {
    labels: {
      date: L.common.date,
      duration: D.duration,
      volume: D.totalVolume,
      totalVolume: D.totalVolume,
      exercises: D.exercises,
      sets: D.sets,
      notes: D.notes,
      statusLabel: D.statusLabel,
      colWeight: D.colWeight,
      colReps: D.colReps,
      colType: D.colType,
      footer: D.printFooter,
      notFoundTitle: D.printNotFoundTitle,
      notFoundDesc: D.printNotFoundDesc,
      notFoundBack: D.printNotFoundBack,
      backHref: L.backHref,
    },
    session: null,
    notFound: false,

    init() {
      const id = new URLSearchParams(deps.search).get('id') || '';
      const session = id ? getSessionById(id) : undefined;
      if (!session) {
        this.notFound = true;
        return;
      }
      this.session = session;
      this.schedulePrint();
    },

    schedulePrint() {
      if (ui.alreadyPrinted()) return;
      ui.markPrinted();
      ui.schedule(() => ui.print(), 400);
    },

    get totalVolume() {
      if (!this.session) return 0;
      return this.session.exercises.reduce((sum, ex) => sum + exerciseVolume(ex), 0);
    },
    get totalSets() {
      if (!this.session) return 0;
      return this.session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    },

    groupFor(ex) {
      if (!this.session?.supersets) return null;
      const idx = this.session.supersets.findIndex((g) => g.exercises.includes(ex.exerciseId));
      return idx === -1 ? null : { n: idx + 1 };
    },
    supersetLabelFor(ex) {
      const group = this.groupFor(ex);
      return group ? `${D.supersetLabel} ${group.n}` : '';
    },

    statusLabel: (s) => statusLabel(s, statusLabels),
    typeLabel: (t) => typeLabel(t, setTypeLabels),
    formatDateTime,
    formatDuration: formatDurationShort,
    formatVolume,
    formatWeight,
    formatSetRpe: (set) => formatSetRpe(set.rpe, set.rpeType),
    exerciseVolume,
  };
}
