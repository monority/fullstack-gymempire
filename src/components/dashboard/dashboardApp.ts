/**
 * Logique Alpine du dashboard.
 * L'horloge et la locale sont injectées : aucun `new Date()` dans la factory.
 */

import { getAuth } from '../../lib/auth';
import type { Dictionary } from '../../i18n/types';
import { getSessions, getSessionsThisWeek } from '../../lib/storage/sessions';
import { getExercises } from '../../lib/storage/exercises';
import { getSettings } from '../../lib/storage/settings';
import type { Session, Settings } from '../../lib/storage/types';
import { statusLabel, type StatusLabels } from '../../lib/session-utils';
import { localDateKey } from '../../lib/date';
import {
  computeSessionVolume,
  computeTodayVolume,
  computeTodaySessions,
  computeTodayExercises,
  computeTotalVolume,
  computeBestPRs,
  computeTop1RM,
  computeStreak,
  computeWeeklyVolumeByDay,
  computeWeeklyActivityByDay,
  computeSessionPrimaryMuscle,
} from '../../lib/dashboard-stats';
import {
  formatDateShort,
  formatWeightValue,
  formatVolume as formatVolumeLib,
} from '../../lib/format';

export interface DashboardAppDeps {
  locale(): 'fr' | 'en';
  today(): Date;
  onError(error: unknown): void;
  translateMuscle(name: string): string;
}

export interface DashboardApp {
  sessions: Session[];
  settings: Settings;
  weeklyDone: number;
  labels: Dictionary['dashboard'] & { kg: string; status: StatusLabels };
  localizedPath: (path: string) => string;
  formatWeightValue(kg: number): string;
  isLoading: boolean;
  loadError: boolean;
  init(): void;
  retry(): void;
  loadDashboard(): void;
  hasSessions: boolean;
  recentSessions: Session[];
  nextSession: Session | null;
  todaySession: Session | null;
  weeklyProgress: number;
  todayVolume: number;
  todaySessions: number;
  todayExercises: number;
  weeklyVolumeByDay: number[];
  weeklySessionsByDay: number[];
  weeklySetsByDay: number[];
  weeklySetsTotal: number;
  todayIdx: number;
  weeklyVolumeTotal: number;
  maxVol: number;
  dayLabels: string[];
  kpis: {
    totalSessions: number;
    totalVolume: number;
    bestPRs: number;
    top1RM: number;
    streak: number;
  };
  greeting(): string;
  nextDurationLabel(): string;
  remainingHintText(): string;
  sessionVolume(s: Session): number;
  sessionExercisesCount(s: Session): number;
  sessionSetsCount(s: Session): number;
  sessionPrimaryMuscle(s: Session): string;
  statusLabel(s: Session['status']): string;
  muscleLabel(name: string): string;
  formatDate(iso: string): string;
  formatVolume(volume: number): string;
}

const DAY_LABELS = {
  fr: ['D', 'L', 'M', 'M', 'J', 'V', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
};

export function createDashboardApp(
  labels: Dictionary['dashboard'] & { kg: string; status: StatusLabels },
  localizedPath: (path: string) => string,
  deps: DashboardAppDeps
): DashboardApp {
  return {
    sessions: [],
    settings: getSettings(),
    weeklyDone: 0,
    labels,
    localizedPath,
    isLoading: true,
    loadError: false,

    init() {
      this.loadDashboard();
    },
    retry() {
      this.loadDashboard();
    },
    loadDashboard() {
      this.isLoading = true;
      this.loadError = false;
      try {
        getExercises(); // seed au premier chargement
        this.sessions = getSessions().sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        this.settings = getSettings();
        this.weeklyDone = getSessionsThisWeek().length;
      } catch (error) {
        deps.onError(error);
        this.loadError = true;
      } finally {
        this.isLoading = false;
      }
    },

    get hasSessions() {
      return this.sessions.length > 0;
    },
    get recentSessions() {
      return this.sessions.slice(0, 5);
    },
    get nextSession() {
      return (
        this.sessions.find((s) => s.status === 'in-progress' || s.status === 'planned') ?? null
      );
    },
    /** Séance à exécuter aujourd'hui (en cours prioritaire sur planifiée). */
    get todaySession() {
      const key = localDateKey(deps.today());
      const due = (s: Session) => s.date.slice(0, 10) === key;
      return (
        this.sessions.find((s) => s.status === 'in-progress' && due(s)) ??
        this.sessions.find((s) => s.status === 'planned' && due(s)) ??
        null
      );
    },
    get weeklyProgress() {
      const target = this.settings.weeklyGoal;
      if (!Number.isFinite(target) || target <= 0) return 0;
      return Math.min(1, Math.max(0, this.weeklyDone / target));
    },

    get todayVolume() {
      return computeTodayVolume(this.sessions);
    },
    get todaySessions() {
      return computeTodaySessions(this.sessions);
    },
    get todayExercises() {
      return computeTodayExercises(this.sessions);
    },

    get weeklyVolumeByDay() {
      return computeWeeklyVolumeByDay(this.sessions);
    },
    get weeklySessionsByDay() {
      return computeWeeklyActivityByDay(this.sessions, deps.today()).sessions;
    },
    get weeklySetsByDay() {
      return computeWeeklyActivityByDay(this.sessions, deps.today()).sets;
    },
    get weeklySetsTotal() {
      return this.weeklySetsByDay.reduce((sum, count) => sum + count, 0);
    },
    get todayIdx() {
      return deps.today().getDay();
    },
    get weeklyVolumeTotal() {
      return this.weeklyVolumeByDay.reduce((sum, volume) => sum + volume, 0);
    },
    get maxVol() {
      return Math.max(...this.weeklyVolumeByDay, 1);
    },
    get dayLabels() {
      return DAY_LABELS[deps.locale()];
    },

    get kpis() {
      return {
        totalSessions: this.sessions.length,
        totalVolume: computeTotalVolume(this.sessions),
        bestPRs: computeBestPRs(this.sessions),
        top1RM: computeTop1RM(this.sessions),
        streak: computeStreak(this.sessions),
      };
    },

    formatWeightValue(kg: number): string {
      return formatWeightValue(kg, this.settings.unit);
    },

    formatVolume(kg: number): string {
      return formatVolumeLib(kg, this.settings.unit);
    },

    greeting() {
      const name = getAuth()?.name?.trim();
      return name ? labels.greeting.replace('{name}', name) : labels.greetingFallback;
    },

    nextDurationLabel() {
      if (!this.nextSession) return '';
      const minutes = Math.max(15, Math.round(this.sessionSetsCount(this.nextSession) * 3));
      return labels.estimatedDuration.replace('{count}', String(minutes));
    },

    remainingHintText() {
      const remaining = Math.max(0, this.settings.weeklyGoal - this.weeklyDone);
      const unit = remaining === 1 ? labels.weeklyMoreSingular : labels.sessionsUnit;
      return labels.remainingHint.replace('{count}', String(remaining)).replace('{unit}', unit);
    },

    sessionVolume(s) {
      return computeSessionVolume(s);
    },
    sessionExercisesCount(s) {
      return s.exercises.length;
    },
    sessionSetsCount(s) {
      return s.exercises.reduce((total, exercise) => total + (exercise.sets?.length ?? 0), 0);
    },
    statusLabel(s) {
      return statusLabel(s, labels.status);
    },
    sessionPrimaryMuscle(s) {
      return computeSessionPrimaryMuscle(s);
    },
    muscleLabel(name) {
      return deps.translateMuscle(name);
    },
    formatDate: formatDateShort,
  };
}
