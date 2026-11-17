/**
 * quick session Alpine factory.
 *
 * State + navigation + completion + rest wiring, extracted from
 * pages/sessions/quick.astro. Storage, settings and navigation are
 * injected so the pure parts are testable without jsdom.
 * The rest countdown itself lives in quickRest.ts.
 */

import type { Dictionary } from '../../i18n';
import type { Session, SessionSet, SetType } from '../../lib/storage/types';
import { RPE_OPTIONS } from '../../lib/storage/types';
import { undoLastCompletedSet } from '../../lib/session-utils';
import { createRestTimer, type RestTimer } from './quickRest';
import {
  formatWeightValue,
  formatDuration,
  formatRestTime,
  typeLabel,
  todayISO,
  computeAvailableSessions,
  computeSessionStats,
  computeProgressPercent,
  canGoPrev as canGoPrevFn,
  canGoNext as canGoNextFn,
  restNextLabel as restNextLabelFn,
  completionTitle as completionTitleFn,
  completionMessage as completionMessageFn,
} from '../../lib/quick-session-stats';

export interface QuickSessionStorage {
  getSessions: () => Session[];
  saveSession: (session: Omit<Session, 'id'>) => Session;
  updateSession: (id: string, updates: Partial<Session>) => void;
}

export interface QuickSessionDeps {
  labels: Dictionary['rapide'];
  storage: QuickSessionStorage;
  /** Default rest duration (seconds) — Settings.defaultRestTime. */
  defaultRestSeconds: () => number;
  /** Suggested rest override per exercise (rest-times B2) — returns seconds. */
  restSecondsFor: (exerciseName: string, fallback: number) => number;
  unit: () => 'kg' | 'lbs';
  confirm: (message: string) => boolean;
  navigate: (href: string) => void;
  sessionsHref: string;
  detailHref: (id: string) => string;
}

export function createQuickSession(deps: QuickSessionDeps) {
  const labels = deps.labels;
  return {
    state: 'selecting' as 'selecting' | 'working' | 'resting' | 'completed',

    availableSessions: [] as Array<{
      id: string;
      label: string;
      totalSets: number;
      totalVolume: number;
      status: Session['status'];
    }>,
    selectedSessionId: '',
    session: null as Session | null,

    currentExerciseIndex: 0,
    currentSetIndex: 0,
    completedSets: 0,
    startTime: 0,
    endTime: 0,

    restRemaining: 0,
    restPaused: false,

    wakeLock: null as any,

    _touchStartX: 0,
    _touchStartY: 0,

    _keyHandler: null as ((e: KeyboardEvent) => void) | null,

    rpeValues: RPE_OPTIONS,

    _rest: null as RestTimer | null,

    init() {
      this._rest = createRestTimer({
        getDuration: () =>
          Math.max(
            0,
            deps.restSecondsFor(this.currentExercise?.name ?? '', deps.defaultRestSeconds())
          ),
        getRemaining: () => this.restRemaining,
        setRemaining: (s) => (this.restRemaining = s),
        setPaused: (p) => (this.restPaused = p),
        onEnd: () => (this.state = 'working'),
      });
      this.loadSessions();
      const requestedSessionId = new URLSearchParams(window.location.search).get('session');
      if (requestedSessionId && this.availableSessions.some((s) => s.id === requestedSessionId)) {
        this.selectedSessionId = requestedSessionId;
      }
      this._installKeyboard();
      this._requestWakeLock();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && this.state === 'working') {
          this._requestWakeLock();
        }
      });
    },

    destroy() {
      this._rest?.stop();
      if (this._keyHandler) {
        window.removeEventListener('keydown', this._keyHandler);
        this._keyHandler = null;
      }
      this._releaseWakeLock();
    },

    loadSessions() {
      this.availableSessions = computeAvailableSessions(deps.storage.getSessions());
    },

    startSession() {
      if (!this.selectedSessionId) return;
      const found = deps.storage.getSessions().find((s) => s.id === this.selectedSessionId);
      if (!found) return;
      if (found.status === 'in-progress' && found.sourceSessionId) {
        this.session = found;
      } else {
        this.session = deps.storage.saveSession({
          ...found,
          sourceSessionId: found.id,
          date: todayISO(),
          status: 'in-progress',
          duration: undefined,
          exercises: found.exercises.map((exercise) => ({
            ...exercise,
            sets: exercise.sets.map((set) => ({
              ...set,
              completed: false,
              rpe: null,
              rpeType: 'rpe' as const,
            })),
          })),
        });
      }
      const firstPending = this.session.exercises.findIndex((exercise) =>
        exercise.sets.some((set) => !set.completed)
      );
      this.currentExerciseIndex = firstPending >= 0 ? firstPending : 0;
      const current = this.session.exercises[this.currentExerciseIndex];
      this.currentSetIndex = current?.sets.findIndex((set) => !set.completed) ?? 0;
      if (this.currentSetIndex < 0) this.currentSetIndex = 0;
      this.completedSets = this.session.exercises.reduce(
        (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
        0
      );
      this.startTime = Date.now();
      this.endTime = 0;
      this.session.status = 'in-progress';
      deps.storage.updateSession(this.session.id, { status: 'in-progress' });
      this.state = 'working';
    },

    get currentExercise() {
      return this.session?.exercises[this.currentExerciseIndex] ?? null;
    },

    get currentSet(): SessionSet | null {
      const ex = this.currentExercise;
      if (!ex) return null;
      return ex.sets[this.currentSetIndex] ?? null;
    },

    get currentRpe(): number | null {
      return this.currentSet?.rpe ?? null;
    },
    set currentRpe(value: number | string | null) {
      if (this.currentSet) {
        this.currentSet.rpe = value === '' || value == null ? null : Number(value);
      }
    },
    get currentRpeType(): 'rpe' | 'urpe' {
      return this.currentSet?.rpeType === 'urpe' ? 'urpe' : 'rpe';
    },
    set currentRpeType(value: 'rpe' | 'urpe') {
      if (this.currentSet) this.currentSet.rpeType = value;
    },

    get totalExercises(): number {
      return this.session?.exercises.length ?? 0;
    },

    get totalSets(): number {
      if (!this.session) return 0;
      return computeSessionStats(this.session).totalSets;
    },

    get recordedSets(): number {
      if (!this.session) return 0;
      return computeSessionStats(this.session).recordedSets;
    },

    get progressPercent(): number {
      if (!this.session) return 0;
      return computeProgressPercent(this.session, this.currentExerciseIndex, this.currentSetIndex);
    },

    get sessionTotalVolume(): number {
      if (!this.session) return 0;
      return computeSessionStats(this.session).totalVolume;
    },

    get sessionDuration(): number {
      if (!this.startTime) return 0;
      const end = this.endTime || Date.now();
      return Math.floor((end - this.startTime) / 1000);
    },

    get completedExercises(): number {
      if (!this.session) return 0;
      return computeSessionStats(this.session).completedExercises;
    },

    get completionTitle(): string {
      return completionTitleFn(
        this.recordedSets,
        this.totalSets,
        labels.allDone,
        labels.endedEarly
      );
    },

    get completionMessage(): string {
      return completionMessageFn(
        this.recordedSets,
        this.totalSets,
        labels.completionFull,
        labels.completionPartial,
        labels.setsShort
      );
    },

    canGoPrev(): boolean {
      return canGoPrevFn(this.currentExerciseIndex, this.currentSetIndex);
    },

    canGoNext(): boolean {
      if (!this.session) return false;
      return canGoNextFn(this.session, this.currentExerciseIndex, this.currentSetIndex);
    },

    prevSet() {
      if (!this.canGoPrev()) return;
      if (this.currentSetIndex > 0) {
        this.currentSetIndex -= 1;
        return;
      }
      if (this.currentExerciseIndex > 0) {
        this.currentExerciseIndex -= 1;
        const ex = this.currentExercise;
        this.currentSetIndex = ex ? ex.sets.length - 1 : 0;
      }
    },

    nextSet() {
      if (!this.canGoNext()) return;
      const ex = this.currentExercise;
      if (!ex) return;
      if (this.currentSetIndex < ex.sets.length - 1) {
        this.currentSetIndex += 1;
        return;
      }
      if (this.currentExerciseIndex < this.session!.exercises.length - 1) {
        this.currentExerciseIndex += 1;
        this.currentSetIndex = 0;
      }
    },

    completeSet() {
      if (!this.session || !this.currentSet) return;
      const ex = this.currentExercise;
      if (!ex) return;
      const set = ex.sets[this.currentSetIndex];
      if (!set) return;
      if (set.completed) return;
      set.completed = true;
      this.completedSets += 1;
      deps.storage.updateSession(this.session.id, { exercises: this.session.exercises });

      const isLastExercise = this.currentExerciseIndex === this.session.exercises.length - 1;
      const isLastSet = this.currentSetIndex === ex.sets.length - 1;
      if (isLastExercise && isLastSet) {
        this._finishSession();
      } else {
        this.nextSet();
        this._startRest();
      }
    },

    get canUndo(): boolean {
      return this.completedSets > 0;
    },

    undoLastSet() {
      if (!this.session || !this.canUndo) return;
      const res = undoLastCompletedSet(this.session);
      if (!res) return;
      this.session.exercises = res.session.exercises;
      this.completedSets = Math.max(0, this.completedSets - 1);
      this._rest?.halt();
      this.restRemaining = 0;
      this.state = 'working';
      this.currentExerciseIndex = res.exerciseIndex;
      this.currentSetIndex = res.setIndex;
      if (this.session.status === 'completed') {
        this.session.status = 'in-progress';
        deps.storage.updateSession(this.session.id, {
          status: 'in-progress',
          exercises: this.session.exercises,
        });
      } else {
        deps.storage.updateSession(this.session.id, { exercises: this.session.exercises });
      }
      this._requestWakeLock();
    },

    _startRest() {
      this._rest?.start();
      this.state = 'resting';
    },

    skipRest() {
      this._rest?.stop();
      this.state = 'working';
    },

    addRestTime(delta: number) {
      this._rest?.adjust(delta);
    },

    stopSession() {
      if (!deps.confirm(labels.exitConfirm)) return;
      this._rest?.stop();
      if (this.session) {
        deps.storage.updateSession(this.session.id, this.session);
      }
      this._releaseWakeLock();
      deps.navigate(deps.sessionsHref);
    },

    confirmStop() {
      if (this.recordedSets < this.totalSets && !deps.confirm(labels.partialFinishConfirm)) return;
      this._finishSession();
    },

    _finishSession() {
      if (!this.session) return;
      this.endTime = Date.now();
      this.session.status = 'completed';
      this.session.duration = this.sessionDuration;
      deps.storage.updateSession(this.session.id, {
        status: 'completed',
        duration: this.sessionDuration,
        exercises: this.session.exercises,
      });
      this._rest?.stop();
      this._releaseWakeLock();
      this.state = 'completed';
    },

    reset() {
      this._rest?.stop();
      this._releaseWakeLock();
      this.session = null;
      this.selectedSessionId = '';
      this.currentExerciseIndex = 0;
      this.currentSetIndex = 0;
      this.completedSets = 0;
      this.startTime = 0;
      this.endTime = 0;
      this.restRemaining = 0;
      this.loadSessions();
      this.state = 'selecting';
    },

    onTouchStart(e: TouchEvent) {
      const t = e.touches[0];
      if (!t) return;
      this._touchStartX = t.clientX;
      this._touchStartY = t.clientY;
    },

    onTouchEnd(e: TouchEvent) {
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - this._touchStartX;
      const dy = t.clientY - this._touchStartY;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) {
        this.nextSet();
      } else {
        this.prevSet();
      }
    },

    _installKeyboard() {
      this._keyHandler = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT')
        ) {
          return;
        }
        if (this.state === 'working') {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.completeSet();
          } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.nextSet();
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            this.prevSet();
          }
        } else if (this.state === 'resting') {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            this.skipRest();
          }
        } else if (this.state === 'selecting' || this.state === 'completed') {
          if (e.key === 'Escape') {
            if (this.state === 'completed') this.reset();
            else deps.navigate(deps.sessionsHref);
          }
        }
      };
      window.addEventListener('keydown', this._keyHandler);
    },

    async _requestWakeLock(): Promise<void> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nav = navigator as any;
      if (!nav.wakeLock || typeof nav.wakeLock.request !== 'function') {
        return;
      }
      try {
        this.wakeLock = await nav.wakeLock.request('screen');
      } catch {
        // Permission denied, no user activation, or insecure context.
      }
    },

    _releaseWakeLock() {
      try {
        if (this.wakeLock && typeof this.wakeLock.release === 'function') {
          this.wakeLock.release();
        }
      } catch {
        // ignore
      }
      this.wakeLock = null;
    },

    setsShortLabel: labels.setsShort,
    typeLabel(t: SetType): string {
      return typeLabel(t, labels);
    },
    formatWeightValue(w: number): string {
      return formatWeightValue(w);
    },
    formatDuration(s?: number): string {
      return formatDuration(s, labels);
    },
    detailHref(id?: string): string {
      return deps.detailHref(id || '');
    },
    weightUnit() {
      return deps.unit();
    },
    formatRestTime(): string {
      return formatRestTime(this.restRemaining);
    },
    restNextLabel(): string {
      if (!this.session) return '';
      return restNextLabelFn(
        this.session,
        this.currentExerciseIndex,
        this.currentSetIndex,
        formatWeightValue,
        this.weightUnit(),
        labels.nextUp
      );
    },
  };
}
