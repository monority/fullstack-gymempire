/**
 * rest timer state machine for the quick session.
 *
 * Pure state transitions with an injectable clock: no DOM, no Alpine.
 * The Alpine component owns the reactive fields (`restRemaining`,
 * `restPaused`) and wires them through the callbacks.
 */

export interface RestTimerClock {
  /** ms interval handle type */
  setInterval(fn: () => void, ms: number): number;
  clearInterval(handle: number): void;
}

export interface RestTimerCallbacks {
  /** Duration for the next rest (seconds). */
  getDuration(): number;
  getRemaining(): number;
  setRemaining(seconds: number): void;
  setPaused(paused: boolean): void;
  /** Fired when the countdown reaches zero. */
  onEnd(): void;
}

const defaultClock: RestTimerClock = {
  setInterval: (fn, ms) => window.setInterval(fn, ms),
  clearInterval: (handle) => window.clearInterval(handle),
};

export interface RestTimer {
  /** Start a new countdown from `getDuration()`. */
  start(): void;
  /** Stop the countdown and reset remaining to 0. */
  stop(): void;
  /** Clear the interval only (no state change) — used by undo. */
  halt(): void;
  /** True while an interval is scheduled. */
  isRunning(): boolean;
  /** Add (or remove, when negative) seconds to the remaining time. */
  adjust(delta: number): void;
}

export function createRestTimer(
  cb: RestTimerCallbacks,
  clock: RestTimerClock = defaultClock
): RestTimer {
  let interval: number | null = null;

  const clear = () => {
    if (interval !== null) {
      clock.clearInterval(interval);
      interval = null;
    }
  };

  const end = () => {
    clear();
    cb.setRemaining(0);
    cb.onEnd();
  };

  const tick = () => {
    const r = cb.getRemaining();
    if (r <= 0) {
      end();
      return;
    }
    cb.setRemaining(r - 1);
    if (cb.getRemaining() <= 0) {
      end();
    }
  };

  return {
    start() {
      cb.setRemaining(Math.max(0, cb.getDuration()));
      cb.setPaused(false);
      clear();
      interval = clock.setInterval(tick, 1000);
    },
    stop() {
      clear();
      cb.setRemaining(0);
    },
    halt() {
      clear();
    },
    isRunning() {
      return interval !== null;
    },
    adjust(delta: number) {
      cb.setRemaining(Math.max(0, cb.getRemaining() + delta));
    },
  };
}
