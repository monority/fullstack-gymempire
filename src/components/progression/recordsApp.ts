/**
 * logique Alpine des records (meilleurs 1RM par exercice).
 * L'horloge est injectée pour la fenêtre « 30 derniers jours ».
 */

import { parseLocalDate } from '../../lib/date';
import { getSessions } from '../../lib/storage/sessions';
import { calculate1RM } from '../../lib/storage/store';
import type { ProgressRecord, SessionExercise } from '../../lib/storage/types';
import { formatDateShort, formatNumber } from '../../lib/format';

export interface ExerciseRecord {
  exerciseId: string;
  name: string;
  muscle: string;
  estimated1RM: number;
  bestWeight: number;
  bestReps: number;
  date: string;
  lastSessionDate: string;
  sessionCount: number;
}

export type SortMode = 'rm' | 'name' | 'recent';

export interface RecordsAppDeps {
  labels: {
    on: string;
    exercisesTracked: string;
    exerciseTracked: string;
    kg: string;
    viewHistoryAriaPrefix: string;
  };
  today(): Date;
  locale: string;
  localizedPath(path: string): string;
}

export interface RecordsApp {
  labels: RecordsAppDeps['labels'];
  allRecords: ExerciseRecord[];
  search: string;
  sortBy: SortMode;
  hasData: boolean;
  init(): void;
  totalPRs: number;
  bestOverall1RM: number;
  bestOverallExercise: string;
  recentPRs: number;
  filteredRecords: ExerciseRecord[];
  recompute(): void;
  accumulate(map: Map<string, ExerciseRecord>, ex: SessionExercise, sessionDate: string): void;
  formatNumber(n: number): string;
  formatDate(iso: string): string;
  historyHref(id: string): string;
}

export function createRecordsApp(deps: RecordsAppDeps): RecordsApp {
  const { labels, locale } = deps;

  return {
    labels,
    allRecords: [],
    search: '',
    sortBy: 'rm',
    hasData: false,

    init() {
      this.recompute();
    },

    get totalPRs() {
      return this.allRecords.length;
    },
    get bestOverall1RM() {
      let max = 0;
      for (const r of this.allRecords) {
        if (r.estimated1RM > max) max = r.estimated1RM;
      }
      return max;
    },
    get bestOverallExercise() {
      for (const r of this.allRecords) {
        if (r.estimated1RM === this.bestOverall1RM) return r.name;
      }
      return '';
    },
    get recentPRs() {
      const cutoff = deps.today();
      cutoff.setDate(cutoff.getDate() - 30);
      cutoff.setHours(0, 0, 0, 0);
      let count = 0;
      for (const r of this.allRecords) {
        if (!r.date) continue;
        const d = parseLocalDate(r.date);
        if (!Number.isNaN(d.getTime()) && d >= cutoff) count += 1;
      }
      return count;
    },
    get filteredRecords() {
      const term = this.search.trim().toLowerCase();
      const list = term
        ? this.allRecords.filter(
            (r) => r.name.toLowerCase().includes(term) || r.muscle.toLowerCase().includes(term)
          )
        : this.allRecords.slice();

      switch (this.sortBy) {
        case 'name':
          return list.sort((a, b) => a.name.localeCompare(b.name, locale, { sensitivity: 'base' }));
        case 'recent':
          return list.sort(
            (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
          );
        case 'rm':
        default:
          return list.sort((a, b) => b.estimated1RM - a.estimated1RM);
      }
    },

    recompute() {
      const sessions = getSessions();
      this.hasData = sessions.some((session) =>
        session.exercises.some((ex) => ex.sets.some((set) => set.completed))
      );
      if (!this.hasData) {
        this.allRecords = [];
        return;
      }

      const map = new Map<string, ExerciseRecord>();
      for (const session of sessions) {
        for (const ex of session.exercises) {
          this.accumulate(map, ex, session.date);
        }
      }
      this.allRecords = Array.from(map.values()).filter((r) => r.estimated1RM > 0);
      this.hasData = this.allRecords.length > 0;
    },

    accumulate(map, ex, sessionDate) {
      let rec = map.get(ex.exerciseId);
      if (!rec) {
        rec = {
          exerciseId: ex.exerciseId,
          name: ex.name,
          muscle: ex.muscle,
          estimated1RM: 0,
          bestWeight: 0,
          bestReps: 0,
          date: '',
          lastSessionDate: '',
          sessionCount: 0,
        };
        map.set(ex.exerciseId, rec);
      }
      let trackedInSession = false;
      for (const set of ex.sets) {
        if (!set.completed) continue;
        trackedInSession = true;
        const value: ProgressRecord = {
          exerciseId: ex.exerciseId,
          date: sessionDate,
          estimated1RM: calculate1RM(set.weight, set.reps),
          bestWeight: set.weight,
          bestReps: set.reps,
        };
        if (value.estimated1RM > rec.estimated1RM) {
          rec.estimated1RM = value.estimated1RM;
          rec.bestWeight = value.bestWeight;
          rec.bestReps = value.bestReps;
          rec.date = value.date;
        }
      }
      if (trackedInSession) {
        rec.sessionCount += 1;
        if (!rec.lastSessionDate || sessionDate > rec.lastSessionDate) {
          rec.lastSessionDate = sessionDate;
        }
      }
    },

    formatNumber,
    formatDate: formatDateShort,
    historyHref(id) {
      return deps.localizedPath('/exercises/history?id=' + encodeURIComponent(id));
    },
  };
}
