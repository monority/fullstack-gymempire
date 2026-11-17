/**
 * D2 (plan-execution.md) — pure countdown/stopwatch engine.
 *
 * Clock is injected so start/pause/resume/reset/negative-overflow are
 * testable without jsdom. The Alpine component owns the reactive fields
 * and passes them in as a plain object; the engine mutates that object.
 */

export interface TimerClock {
  now(): number;
  schedule(fn: () => void, ms: number): number;
  cancel(handle: number): void;
}

export const realClock: TimerClock = {
  now: () => Date.now(),
  schedule: (fn, ms) => window.setTimeout(fn, ms),
  cancel: (handle) => clearTimeout(handle),
};

export interface CountdownFields {
  /** Configured duration (seconds). */
  totalTime: number;
  /** Seconds left, integer ≥ 0. */
  remaining: number;
  /** Displayed seconds (0 at end of run). */
  display: number;
  running: boolean;
  /** Absolute end timestamp (ms) while running, else 0. */
  endTime: number;
  /** Pending tick handle. */
  intervalId: number | null;
}

export interface CountdownOptions {
  /** Fired once when the countdown reaches 0. */
  onDone: () => void;
  /** Fired after every mutation (state sync / broadcast). */
  onChange: () => void;
  clock?: TimerClock;
}

export interface CountdownEngine {
  start(): void;
  pause(): void;
  reset(): void;
  setDuration(seconds: number): void;
  /** One manual tick — used by the schedule loop. */
  tick(): void;
}

export function createCountdown(
  state: CountdownFields,
  opts: CountdownOptions,
  clock: TimerClock = realClock
): CountdownEngine {
  const scheduleTick = () => {
    state.intervalId = clock.schedule(() => {
      engine.tick();
      if (state.running) scheduleTick();
    }, 100);
  };

  const engine: CountdownEngine = {
    start() {
      if (state.remaining <= 0) {
        state.remaining = state.totalTime;
      }
      if (state.running) return;
      state.running = true;
      state.endTime = clock.now() + state.remaining * 1000;
      state.intervalId = null;
      engine.tick();
      scheduleTick();
      opts.onChange();
    },

    pause() {
      if (!state.running) return;
      state.running = false;
      if (state.endTime) {
        state.remaining = Math.max(0, Math.ceil((state.endTime - clock.now()) / 1000));
        state.display = state.remaining;
      }
      if (state.intervalId !== null) {
        clock.cancel(state.intervalId);
        state.intervalId = null;
      }
      opts.onChange();
    },

    reset() {
      engine.pause();
      state.remaining = state.totalTime;
      state.display = state.totalTime;
      opts.onChange();
    },

    setDuration(seconds: number) {
      engine.pause();
      state.totalTime = seconds;
      state.remaining = seconds;
      state.display = seconds;
      opts.onChange();
    },

    tick() {
      const now = clock.now();
      const remainingMs = Math.max(0, state.endTime - now);
      const remainingSec = Math.ceil(remainingMs / 1000);
      state.remaining = remainingSec;
      state.display = remainingSec;

      if (remainingMs <= 0) {
        engine.pause();
        state.display = 0;
        state.remaining = 0;
        opts.onDone();
      }
      opts.onChange();
    },
  };

  return engine;
}

export interface StopwatchFields {
  running: boolean;
  elapsed: number;
  laps: { lapTime: number; totalTime: number }[];
  startTimestamp: number;
  intervalId: number | null;
}

export interface StopwatchEngine {
  start(): void;
  pause(): void;
  reset(): void;
  recordLap(): void;
  tick(): void;
}

export function createStopwatch(
  state: StopwatchFields,
  opts: { onChange: () => void },
  clock: TimerClock = realClock
): StopwatchEngine {
  const engine: StopwatchEngine = {
    start() {
      if (state.running) return;
      state.running = true;
      state.startTimestamp = clock.now() - state.elapsed;
      state.intervalId = clock.schedule(() => engine.tick(), 10);
      opts.onChange();
    },

    pause() {
      if (!state.running) return;
      state.running = false;
      if (state.intervalId !== null) {
        clock.cancel(state.intervalId);
        state.intervalId = null;
      }
      state.elapsed = clock.now() - state.startTimestamp;
      opts.onChange();
    },

    reset() {
      engine.pause();
      state.elapsed = 0;
      state.laps = [];
      opts.onChange();
    },

    recordLap() {
      if (!state.running) return;
      const total = clock.now() - state.startTimestamp;
      const prevTotal = state.laps.length > 0 ? state.laps[state.laps.length - 1].totalTime : 0;
      state.laps.push({ lapTime: total - prevTotal, totalTime: total });
      opts.onChange();
    },

    tick() {
      state.elapsed = clock.now() - state.startTimestamp;
    },
  };

  return engine;
}

/** Progress ring offset for a countdown display (0 = full ring). */
export function ringOffsetFor(totalTime: number, display: number): number {
  const circumference = 2 * Math.PI * 108;
  const progress = totalTime > 0 ? Math.max(0, Math.min(1, display / totalTime)) : 0;
  return circumference * (1 - progress);
}

/** Next lap entry for a stopwatch (pure). */
export function computeLap(
  laps: { lapTime: number; totalTime: number }[],
  totalMs: number
): { lapTime: number; totalTime: number } {
  const prevTotal = laps.length > 0 ? laps[laps.length - 1].totalTime : 0;
  return { lapTime: totalMs - prevTotal, totalTime: totalMs };
}
