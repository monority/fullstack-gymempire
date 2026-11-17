import { describe, it, expect } from 'vitest';
import {
  createCountdown,
  createStopwatch,
  ringOffsetFor,
  computeLap,
  type TimerClock,
} from '../timerEngine';

/** Fake clock with virtual time and manual scheduling. */
function fakeClock() {
  let t = 1_000_000;
  const tasks = new Map<number, { fn: () => void; at: number }>();
  let nextId = 1;
  const clock: TimerClock = {
    now: () => t,
    schedule(fn, ms) {
      const id = nextId++;
      tasks.set(id, { fn, at: t + ms });
      return id;
    },
    cancel(handle) {
      tasks.delete(handle);
    },
  };
  return {
    clock,
    advance(ms: number) {
      t += ms;
      for (const [id, task] of Array.from(tasks.entries())) {
        if (task.at <= t) {
          tasks.delete(id);
          task.fn();
        }
      }
    },
    pending: () => tasks.size,
  };
}

function makeCountdown(duration = 90) {
  const clock = fakeClock();
  let doneCount = 0;
  let changes = 0;
  const state = {
    totalTime: duration,
    remaining: duration,
    display: duration,
    running: false,
    endTime: 0,
    intervalId: null as number | null,
  };
  const engine = createCountdown(
    state,
    {
      onDone: () => doneCount++,
      onChange: () => changes++,
    },
    clock.clock
  );
  return {
    engine,
    clock,
    state,
    get doneCount() {
      return doneCount;
    },
  };
}

describe('createCountdown', () => {
  it('start sets endTime, flips running and schedules ticks', () => {
    const c = makeCountdown(90);
    c.engine.start();
    expect(c.state.running).toBe(true);
    expect(c.state.endTime).toBe(1_000_000 + 90_000);
    expect(c.clock.pending()).toBeGreaterThan(0);
  });

  it('pause freezes the remaining seconds and cancels the loop', () => {
    const c = makeCountdown(90);
    c.engine.start();
    c.clock.advance(5000);
    c.engine.pause();
    expect(c.state.running).toBe(false);
    expect(c.state.remaining).toBe(85);
    expect(c.clock.pending()).toBe(0);
  });

  it('resume continues from the paused value', () => {
    const c = makeCountdown(90);
    c.engine.start();
    c.clock.advance(5000);
    c.engine.pause();
    c.engine.start();
    c.clock.advance(10_000);
    expect(c.state.remaining).toBe(75);
  });

  it('reset restores the full duration', () => {
    const c = makeCountdown(90);
    c.engine.start();
    c.clock.advance(20_000);
    c.engine.reset();
    expect(c.state.remaining).toBe(90);
    expect(c.state.display).toBe(90);
    expect(c.state.running).toBe(false);
  });

  it('reaching zero fires onDone exactly once and stops', () => {
    const c = makeCountdown(2);
    c.engine.start();
    c.clock.advance(2500);
    expect(c.state.remaining).toBe(0);
    expect(c.state.display).toBe(0);
    expect(c.state.running).toBe(false);
    expect(c.doneCount).toBe(1);
    expect(c.clock.pending()).toBe(0);
  });

  it('start after completion restarts from the full duration', () => {
    const c = makeCountdown(2);
    c.engine.start();
    c.clock.advance(2500);
    c.engine.start();
    expect(c.state.remaining).toBe(2);
    expect(c.state.running).toBe(true);
  });

  it('setDuration resets display and cancels a running countdown', () => {
    const c = makeCountdown(90);
    c.engine.start();
    c.clock.advance(10_000);
    c.engine.setDuration(120);
    expect(c.state.totalTime).toBe(120);
    expect(c.state.remaining).toBe(120);
    expect(c.state.running).toBe(false);
  });
});

describe('createStopwatch', () => {
  it('start/stop accumulate elapsed ms', () => {
    const clock = fakeClock();
    const state = {
      running: false,
      elapsed: 0,
      laps: [],
      startTimestamp: 0,
      intervalId: null as number | null,
    };
    const sw = createStopwatch(state, { onChange: () => {} }, clock.clock);
    sw.start();
    clock.advance(1500);
    sw.pause();
    expect(state.elapsed).toBe(1500);
  });

  it('resume continues from elapsed', () => {
    const clock = fakeClock();
    const state = {
      running: false,
      elapsed: 0,
      laps: [],
      startTimestamp: 0,
      intervalId: null as number | null,
    };
    const sw = createStopwatch(state, { onChange: () => {} }, clock.clock);
    sw.start();
    clock.advance(1000);
    sw.pause();
    sw.start();
    clock.advance(500);
    sw.pause();
    expect(state.elapsed).toBe(1500);
  });

  it('recordLap computes incremental lap times', () => {
    const clock = fakeClock();
    const state = {
      running: false,
      elapsed: 0,
      laps: [],
      startTimestamp: 0,
      intervalId: null as number | null,
    };
    const sw = createStopwatch(state, { onChange: () => {} }, clock.clock);
    sw.start();
    clock.advance(1000);
    sw.recordLap();
    clock.advance(500);
    sw.recordLap();
    expect(state.laps).toEqual([
      { lapTime: 1000, totalTime: 1000 },
      { lapTime: 500, totalTime: 1500 },
    ]);
  });

  it('reset clears laps and elapsed', () => {
    const clock = fakeClock();
    const state = {
      running: false,
      elapsed: 0,
      laps: [],
      startTimestamp: 0,
      intervalId: null as number | null,
    };
    const sw = createStopwatch(state, { onChange: () => {} }, clock.clock);
    sw.start();
    clock.advance(1000);
    sw.recordLap();
    sw.reset();
    expect(state.elapsed).toBe(0);
    expect(state.laps).toEqual([]);
    expect(state.running).toBe(false);
  });
});

describe('helpers', () => {
  it('ringOffsetFor maps display/total to circumference', () => {
    const full = 2 * Math.PI * 108;
    expect(ringOffsetFor(90, 90)).toBeCloseTo(0);
    expect(ringOffsetFor(90, 45)).toBeCloseTo(full / 2);
    expect(ringOffsetFor(90, 0)).toBeCloseTo(full);
    expect(ringOffsetFor(0, 0)).toBeCloseTo(full);
  });

  it('computeLap derives the incremental lap from previous totals', () => {
    expect(computeLap([], 1000)).toEqual({ lapTime: 1000, totalTime: 1000 });
    expect(computeLap([{ lapTime: 1000, totalTime: 1000 }], 1500)).toEqual({
      lapTime: 500,
      totalTime: 1500,
    });
  });
});
