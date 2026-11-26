/**
 * logique Alpine de la comparaison de deux séances.
 * Toutes les fonctions de calcul sont pures ; l'URL est injectée.
 */

import type { Dictionary } from '../../i18n/types';
import { getSessions } from '../../lib/storage/sessions';
import { calculate1RM } from '../../lib/storage/store';
import type { Session, SessionExercise, SessionStatus, SetType } from '../../lib/storage/types';
import { statusLabel, type StatusLabels } from '../../lib/session-utils';
import { typeLabel } from '../../lib/workout-helpers';
import {
  formatDateCompact,
  formatDurationShort,
  formatVolume,
  formatWeight,
} from '../../lib/format';

type Direction = 'up' | 'down' | 'equal';
export interface Delta {
  direction: Direction;
  label: string;
  diff: number;
}

export interface UnionRow {
  exerciseId: string;
  name: string;
  muscle: string;
  session1Ex: SessionExercise | undefined;
  session2Ex: SessionExercise | undefined;
}

export function delta(
  a: number,
  b: number,
  upLabel: string,
  downLabel: string,
  equalLabel: string,
  fmt: (n: number) => string
): Delta {
  if (a === b) return { direction: 'equal', label: equalLabel, diff: 0 };
  if (b > a) {
    return { direction: 'up', label: upLabel + ' (+' + fmt(b - a) + ')', diff: b - a };
  }
  return { direction: 'down', label: downLabel + ' (-' + fmt(a - b) + ')', diff: a - b };
}

export function exerciseVolume(ex: SessionExercise | undefined): number {
  if (!ex) return 0;
  return ex.sets.reduce((s, set) => s + (set.completed ? set.weight * set.reps : 0), 0);
}

export function totalSets(session: Session | null): number {
  if (!session) return 0;
  return session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}

export function bestSet(session: Session | null): number {
  if (!session) return 0;
  let best = 0;
  for (const ex of session.exercises) {
    for (const set of ex.sets) {
      if (!set.completed) continue;
      const estimate = calculate1RM(set.weight, set.reps);
      if (estimate > best) best = estimate;
    }
  }
  return best;
}

export function buildUnionRows(session1: Session | null, session2: Session | null): UnionRow[] {
  if (!session1 && !session2) return [];
  const map = new Map<string, UnionRow>();
  if (session1) {
    for (const ex of session1.exercises) {
      map.set(ex.exerciseId, {
        exerciseId: ex.exerciseId,
        name: ex.name,
        muscle: ex.muscle,
        session1Ex: ex,
        session2Ex: undefined,
      });
    }
  }
  if (session2) {
    for (const ex of session2.exercises) {
      const existing = map.get(ex.exerciseId);
      if (existing) existing.session2Ex = ex;
      else {
        map.set(ex.exerciseId, {
          exerciseId: ex.exerciseId,
          name: ex.name,
          muscle: ex.muscle,
          session1Ex: undefined,
          session2Ex: ex,
        });
      }
    }
  }
  return Array.from(map.values());
}

export interface ComparisonAppDeps {
  search: string;
  pathname: string;
  labels: {
    comparer: Dictionary['comparer'];
    rapide: Dictionary['rapide'];
    status: StatusLabels;
  };
  ui: {
    replaceUrl(url: string): void;
  };
}

export interface ComparisonApp {
  allSessions: Session[];
  session1Id: string;
  session2Id: string;
  session1: Session | null;
  session2: Session | null;
  init(): void;
  unionExercises: UnionRow[];
  volumeDelta: Delta;
  exercisesDelta: Delta;
  setsDelta: Delta;
  bestSetDelta: Delta;
  formatOption(s: Session): string;
  statusLabel(s: SessionStatus): string;
  typeLabel(t: SetType): string;
  formatDate(iso: string): string;
  formatDuration(seconds?: number): string;
  formatVolume(v: number): string;
  formatWeight(w: number): string;
  totalVolume(session: Session | null): number;
  exerciseVolume(ex: SessionExercise | undefined): number;
  totalSets(session: Session | null): number;
  bestSet(session: Session | null): number;
  onSession1Change(id: string): void;
  onSession2Change(id: string): void;
  syncUrl(): void;
}

export function createComparisonApp(deps: ComparisonAppDeps): ComparisonApp {
  const { labels, ui } = deps;
  const C = labels.comparer;
  const R = labels.rapide;

  const status = (s: SessionStatus) => statusLabel(s, labels.status);
  const type = (t: SetType) =>
    typeLabel(t, {
      warmup: R.typeWarmup,
      work: R.typeWork,
      top: R.typeTop,
      drop: R.typeDrop,
      failure: R.typeFailure,
    });
  const fmtVolume = (v: number) => formatVolume(v);
  const fmtInt = (n: number) => Math.round(n).toString();
  const empty: Delta = { direction: 'equal', label: '-', diff: 0 };

  return {
    allSessions: [],
    session1Id: '',
    session2Id: '',
    session1: null,
    session2: null,

    init() {
      this.allSessions = getSessions().sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const params = new URLSearchParams(deps.search);
      const id1 = params.get('id1');
      const id2 = params.get('id2');
      if (id1) {
        const found = this.allSessions.find((s) => s.id === id1);
        if (found) {
          this.session1Id = found.id;
          this.session1 = found;
        }
      }
      if (id2) {
        const found = this.allSessions.find((s) => s.id === id2);
        if (found) {
          this.session2Id = found.id;
          this.session2 = found;
        }
      }
    },

    get unionExercises() {
      return buildUnionRows(this.session1, this.session2);
    },
    get volumeDelta() {
      if (!this.session1 || !this.session2) return empty;
      return delta(
        this.totalVolume(this.session1),
        this.totalVolume(this.session2),
        C.volumeMore,
        C.volumeLess,
        C.volumeEqual,
        fmtVolume
      );
    },
    get exercisesDelta() {
      if (!this.session1 || !this.session2) return empty;
      return delta(
        this.session1.exercises.length,
        this.session2.exercises.length,
        C.exercisesMore,
        C.exercisesLess,
        C.exercisesEqual,
        fmtInt
      );
    },
    get setsDelta() {
      if (!this.session1 || !this.session2) return empty;
      return delta(
        totalSets(this.session1),
        totalSets(this.session2),
        C.setsMore,
        C.setsLess,
        C.setsEqual,
        fmtInt
      );
    },
    get bestSetDelta() {
      if (!this.session1 || !this.session2) return empty;
      return delta(
        bestSet(this.session1),
        bestSet(this.session2),
        C.best1RM,
        C.best1RMLower,
        C.best1RMSame,
        fmtVolume
      );
    },

    formatOption(s) {
      return s.name + ' - ' + formatDateCompact(s.date);
    },
    statusLabel: status,
    typeLabel: type,
    formatDate: formatDateCompact,
    formatDuration: formatDurationShort,
    formatVolume,
    formatWeight,
    totalVolume(session) {
      if (!session) return 0;
      return session.exercises.reduce((sum, ex) => sum + exerciseVolume(ex), 0);
    },
    exerciseVolume,
    totalSets,
    bestSet,

    onSession1Change(id) {
      this.session1 = id ? (this.allSessions.find((s) => s.id === id) ?? null) : null;
      this.syncUrl();
    },
    onSession2Change(id) {
      this.session2 = id ? (this.allSessions.find((s) => s.id === id) ?? null) : null;
      this.syncUrl();
    },
    syncUrl() {
      const params = new URLSearchParams();
      if (this.session1Id) params.set('id1', this.session1Id);
      else if (this.session1?.id) params.set('id1', this.session1.id);
      if (this.session2Id) params.set('id2', this.session2Id);
      else if (this.session2?.id) params.set('id2', this.session2.id);
      const qs = params.toString();
      ui.replaceUrl(qs ? deps.pathname + '?' + qs : deps.pathname);
    },
  };
}
