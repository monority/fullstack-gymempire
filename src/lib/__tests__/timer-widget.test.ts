// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  beep: vi.fn(),
  posted: vi.fn(),
  closed: vi.fn(),
}));

vi.mock('../sound', () => ({ playBeep: mocks.beep }));

interface FakeChannel {
  name: string;
  onmessage: ((ev: { data: unknown }) => void) | null;
  postMessage: (msg: unknown) => void;
  close: () => void;
}
const channels: FakeChannel[] = [];

import {
  mountTimerWidget,
  TIMER_CHANNEL,
  widgetLabelsFrom,
  type TimerSnapshot,
  type TimerWidgetLabels,
} from '../timer-widget';

function labels(): TimerWidgetLabels {
  return {
    title: 'Timer',
    countdown: 'Countdown',
    stopwatch: 'Stopwatch',
    start: 'Start',
    resume: 'Resume',
    pause: 'Pause',
    reset: 'Reset',
    lap: 'Lap',
    lapTime: 'Lap time',
    total: 'Total',
    custom: 'Custom',
    running: 'Running',
    paused: 'Paused',
    ready: 'Ready',
    done: 'Done',
    connected: 'Connected',
    disconnected: 'Disconnected',
  };
}

function snapshot(overrides: Partial<TimerSnapshot> = {}): TimerSnapshot {
  return {
    mode: 'countdown',
    totalTime: 90,
    remaining: 90,
    running: false,
    endAt: 0,
    swRunning: false,
    swStartAt: 0,
    swElapsed: 0,
    laps: [],
    soundEnabled: true,
    now: Date.now(),
    ...overrides,
  };
}

function mount() {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const widget = mountTimerWidget(root, labels());
  const $ = <T extends Element>(sel: string) => root.querySelector(sel) as T;
  return {
    root,
    widget,
    clock: () => $<HTMLElement>('[data-ref="clock"]'),
    conn: () => $<HTMLElement>('[data-ref="conn"]'),
    toggle: () => $<HTMLButtonElement>('[data-ref="toggle"]'),
    lap: () => $<HTMLButtonElement>('[data-ref="lap"]'),
    custom: () => $<HTMLInputElement>('[data-ref="customInput"]'),
  };
}

describe('timer widget', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    channels.length = 0;
    vi.clearAllMocks();
    vi.stubGlobal(
      'BroadcastChannel',
      class {
        onmessage: ((ev: { data: unknown }) => void) | null = null;
        name: string;
        postMessage = (msg: unknown) => mocks.posted(msg);
        close = () => mocks.closed();
        constructor(name: string) {
          this.name = name;
          channels.push(this as unknown as FakeChannel);
        }
      }
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('monte déconnecté et annonce le canal partagé', () => {
    const { root, widget, clock, conn } = mount();
    expect(clock().textContent).toBe('--:--');
    expect(conn().textContent).toBe('Disconnected');
    expect(channels).toHaveLength(1);
    expect(channels[0].name).toBe(TIMER_CHANNEL);
    expect(root.querySelector('style')).not.toBeNull();
    widget.destroy();
    expect(mocks.closed).toHaveBeenCalledOnce();
    expect(document.body.querySelector('.tw')).toBeNull();
  });

  it('affiche un snapshot et envoie les commandes au bon propriétaire', () => {
    const { widget, clock, conn, toggle } = mount();
    widget.setSnapshot(snapshot(), 'owner-1');

    expect(conn().textContent).toBe('Connected');
    expect(clock().textContent).toBe('01:30');
    toggle().click();
    expect(mocks.posted).toHaveBeenCalledWith({
      type: 'cmd',
      target: 'owner-1',
      cmd: 'start',
      value: undefined,
    });
    widget.destroy();
  });

  it('envoie les commandes d onglet, preset, custom, reset et lap', () => {
    const { root, widget, lap, custom } = mount();
    widget.setSnapshot(snapshot(), 'o');

    (root.querySelector('[data-tab="stopwatch"]') as HTMLButtonElement).click();
    (root.querySelector('[data-preset="120"]') as HTMLButtonElement).click();
    custom().value = '45';
    (root.querySelector('[data-ref="customOk"]') as HTMLButtonElement).click();
    (root.querySelector('[data-ref="reset"]') as HTMLButtonElement).click();
    lap().click();

    const cmds = mocks.posted.mock.calls.map(([m]) => m as { cmd: string; value?: number });
    expect(cmds.map((c) => c.cmd)).toEqual(['setMode', 'setTime', 'setTime', 'reset', 'lap']);
    expect(cmds[0].value).toBe(1);
    expect(cmds[1].value).toBe(120);
    expect(cmds[2].value).toBe(45);
    widget.destroy();
  });

  it('reçoit les états du canal et bascule en chronomètre', () => {
    const { root, widget, clock, lap } = mount();
    widget.setSnapshot(snapshot(), 'o');
    channels[0].onmessage?.({
      data: { type: 'state', owner: 'o', state: snapshot({ mode: 'stopwatch', swElapsed: 1234 }) },
    });
    expect(clock().textContent).toBe('00:01.23');
    expect(lap().hidden).toBe(false);
    expect((root.querySelector('[data-ref="laps"]') as HTMLElement).hidden).toBe(true);
    widget.destroy();
  });

  it('gère les états running, warning, done et le bip unique', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    const start = Date.now();
    const { widget, clock } = mount();
    widget.setSnapshot(snapshot({ running: true, endAt: start + 5000, remaining: 5 }), 'o');
    expect(clock().textContent).toContain('00:05');
    expect(clock().className).toContain('is-warning');

    widget.setSnapshot(snapshot({ running: true, endAt: start, remaining: 0 }), 'o');
    expect(clock().className).toContain('is-done');
    expect(mocks.beep).toHaveBeenCalledOnce();

    vi.advanceTimersByTime(200);
    expect(mocks.beep).toHaveBeenCalledOnce();
    widget.destroy();
  });

  it('mappe un dictionnaire sur les libellés du widget', () => {
    const mapped = widgetLabelsFrom({ timer: labels() } as never);
    expect(mapped.title).toBe('Timer');
    expect(mapped.pause).toBe('Pause');
  });
});
