import { describe, it, expect } from 'vitest';
import { createRestTimer, type RestTimerClock } from '../quickRest';

/** Manual clock: interval callbacks fired explicitly. */
function manualClock(): RestTimerClock & { fire(): void; scheduled(): boolean } {
  let fn: (() => void) | null = null;
  return {
    setInterval(f: () => void) {
      fn = f;
      return 1 as unknown as number;
    },
    clearInterval() {
      fn = null;
    },
    fire() {
      fn?.();
    },
    scheduled: () => fn !== null,
  };
}

function setup(duration = 90) {
  let remaining = 0;

  let ended = 0;
  const clock = manualClock();
  const timer = createRestTimer(
    {
      getDuration: () => duration,
      getRemaining: () => remaining,
      setRemaining: (s) => (remaining = s),
      setPaused: () => {},
      onEnd: () => ended++,
    },
    clock
  );
  return {
    timer,
    clock,
    get remaining() {
      return remaining;
    },
    get ended() {
      return ended;
    },
  };
}

describe('createRestTimer', () => {
  it('starts from the injected duration and schedules a tick', () => {
    const s = setup(60);
    s.timer.start();
    expect(s.remaining).toBe(60);
    expect(s.clock.scheduled()).toBe(true);
  });

  it('decrements on each tick and ends at zero exactly once', () => {
    const s = setup(2);
    s.timer.start();
    s.clock.fire();
    expect(s.remaining).toBe(1);
    s.clock.fire();
    expect(s.remaining).toBe(0);
    expect(s.ended).toBe(1);
    expect(s.clock.scheduled()).toBe(false);
  });

  it('stop() clears the interval and resets to zero', () => {
    const s = setup();
    s.timer.start();
    s.timer.stop();
    expect(s.remaining).toBe(0);
    expect(s.clock.scheduled()).toBe(false);
  });

  it('adjust() clamps at zero', () => {
    const s = setup();
    s.timer.start();
    s.timer.adjust(-500);
    expect(s.remaining).toBe(0);
    s.timer.adjust(30);
    expect(s.remaining).toBe(30);
  });

  it('halt() clears the interval without touching remaining', () => {
    const s = setup(45);
    s.timer.start();
    s.timer.halt();
    expect(s.remaining).toBe(45);
    expect(s.clock.scheduled()).toBe(false);
    expect(s.ended).toBe(0);
  });

  it('clamps negative durations at start', () => {
    const s = setup(-5);
    s.timer.start();
    expect(s.remaining).toBe(0);
  });
});
