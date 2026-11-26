import { formatTime, formatShort, formatStopwatch } from './timer-format';
import type { Dictionary } from '../i18n/types';
import { playBeep } from './sound';
import WIDGET_CSS from '../styles/components/timer-widget.css?inline';

/**
 * Timer pop-out widget.
 *
 * Self-contained remote view + controller for the timer page. It is mounted
 * either inside a Document Picture-in-Picture window (Chrome/Edge) or on the
 * standalone /timer/pop page (fallback for browsers without the API). The
 * main timer page stays the source of truth; the widget keeps in sync over a
 * BroadcastChannel:
 *
 *   main → widget : { type: 'state', owner, state: TimerSnapshot }
 *   widget → main : { type: 'cmd',  target: owner, cmd, value? }
 *   widget → main : { type: 'hello', target: '*' }   (handshake from /timer/pop)
 */

export const TIMER_CHANNEL = 'muscu-timer-sync';

export type TimerMode = 'countdown' | 'stopwatch';

export interface TimerSnapshot {
  mode: TimerMode;
  totalTime: number;
  remaining: number;
  running: boolean;
  endAt: number;
  swRunning: boolean;
  swStartAt: number;
  swElapsed: number;
  laps: { lapTime: number; totalTime: number }[];
  soundEnabled: boolean;
  now: number;
}

export interface TimerWidgetLabels {
  title: string;
  countdown: string;
  stopwatch: string;
  start: string;
  resume: string;
  pause: string;
  reset: string;
  lap: string;
  lapTime: string;
  total: string;
  custom: string;
  running: string;
  paused: string;
  ready: string;
  done: string;
  connected: string;
  disconnected: string;
}

export interface TimerWidgetHandle {
  sendHello(): void;
  setSnapshot(s: TimerSnapshot, ownerId?: string): void;
  destroy(): void;
}

/** Map a localized dictionary onto the widget labels. */
export function widgetLabelsFrom(d: Dictionary): TimerWidgetLabels {
  const t = d.timer;
  return {
    title: t.title,
    countdown: t.countdown,
    stopwatch: t.stopwatch,
    start: t.start,
    resume: t.resume,
    pause: t.pause,
    reset: t.reset,
    lap: t.lap,
    lapTime: t.lapTime,
    total: t.total,
    custom: t.custom,
    running: t.running,
    paused: t.paused,
    ready: t.ready,
    done: t.done,
    connected: t.connected,
    disconnected: t.disconnected,
  };
}

const PRESETS = [60, 90, 120, 180];

function beep(): void {
  playBeep();
}

const RING_RADIUS = 88;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

type RemoteMsg = { type: string; [k: string]: unknown };

export function mountTimerWidget(root: HTMLElement, labels: TimerWidgetLabels): TimerWidgetHandle {
  const host = document.createElement('div');
  host.className = 'tw';
  host.innerHTML = `
    <header class="tw__head">
      <span class="tw__title">${labels.title}</span>
      <span class="tw__conn"><i class="tw__dot" aria-hidden="true"></i><span data-ref="conn">${labels.disconnected}</span></span>
    </header>

    <div class="tw__tabs" role="tablist" aria-label="${labels.title}">
      <button type="button" class="tw__tab is-active" data-tab="countdown" role="tab" aria-selected="true">${labels.countdown}</button>
      <button type="button" class="tw__tab" data-tab="stopwatch" role="tab" aria-selected="false">${labels.stopwatch}</button>
    </div>

    <div class="tw__stage" data-ref="stage">
      <svg class="tw__ring" data-ref="ring" viewBox="0 0 200 200" aria-hidden="true">
        <circle class="tw__ring-track" cx="100" cy="100" r="${RING_RADIUS}" />
        <circle class="tw__ring-progress" data-ref="ringProgress" cx="100" cy="100" r="${RING_RADIUS}"
          stroke-dasharray="${RING_CIRCUMFERENCE}" stroke-dashoffset="0" />
      </svg>
      <div class="tw__readout">
        <div class="tw__clock" data-ref="clock" aria-live="polite">--:--</div>
        <div class="tw__status" data-ref="status"></div>
      </div>
    </div>

    <div class="tw__presets" data-ref="presets" role="group" aria-label="${labels.custom}">
      ${PRESETS.map((p) => `<button type="button" class="tw__preset" data-preset="${p}">${formatShort(p)}</button>`).join('')}
    </div>

    <div class="tw__custom" data-ref="custom">
      <input class="tw__custom-input" data-ref="customInput" type="number" min="5" max="600" step="5" inputmode="numeric"
        aria-label="${labels.custom}">
      <button type="button" class="tw__custom-ok" data-ref="customOk">OK</button>
    </div>

    <div class="tw__controls">
      <button type="button" class="tw__btn tw__btn--primary" data-ref="toggle">${labels.start}</button>
      <button type="button" class="tw__btn tw__btn--secondary" data-ref="reset">${labels.reset}</button>
      <button type="button" class="tw__btn tw__btn--ghost" data-ref="lap" hidden>${labels.lap}</button>
    </div>

    <div class="tw__laps" data-ref="laps" hidden>
      <div class="tw__laps-head">
        <span>${labels.lap}</span><span>${labels.lapTime}</span><span>${labels.total}</span>
      </div>
      <div class="tw__laps-body" data-ref="lapsBody"></div>
    </div>
  `;

  const style = document.createElement('style');
  style.textContent = WIDGET_CSS;
  root.appendChild(style);
  root.appendChild(host);

  const $ = <T extends Element>(sel: string): T => host.querySelector(sel) as T;
  const stage = $<HTMLDivElement>('[data-ref="stage"]');
  const ring = $<SVGSVGElement>('[data-ref="ring"]');
  const ringProgress = $<SVGCircleElement>('[data-ref="ringProgress"]');
  const clock = $<HTMLDivElement>('[data-ref="clock"]');
  const status = $<HTMLDivElement>('[data-ref="status"]');
  const conn = $<HTMLDivElement>('[data-ref="conn"]');
  const toggle = $<HTMLButtonElement>('[data-ref="toggle"]');
  const resetBtn = $<HTMLButtonElement>('[data-ref="reset"]');
  const lapBtn = $<HTMLButtonElement>('[data-ref="lap"]');
  const lapsWrap = $<HTMLDivElement>('[data-ref="laps"]');
  const lapsBody = $<HTMLDivElement>('[data-ref="lapsBody"]');
  const customInput = $<HTMLInputElement>('[data-ref="customInput"]');
  const customOk = $<HTMLButtonElement>('[data-ref="customOk"]');
  const presetsWrap = $<HTMLDivElement>('[data-ref="presets"]');
  const customWrap = $<HTMLDivElement>('[data-ref="custom"]');
  const tabs = Array.from(host.querySelectorAll<HTMLButtonElement>('.tw__tab'));
  const presets = Array.from(host.querySelectorAll<HTMLButtonElement>('.tw__preset'));

  let state: TimerSnapshot | null = null;
  let owner: string | null = null;
  let beeped = false;

  const channel = new BroadcastChannel(TIMER_CHANNEL);

  channel.onmessage = (ev: MessageEvent) => {
    const msg = ev.data as RemoteMsg | undefined;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'state' && msg.state) {
      applySnapshot(msg.state as TimerSnapshot, (msg.owner as string) || undefined);
    }
  };

  function applySnapshot(s: TimerSnapshot, ownerId?: string): void {
    state = s;
    // The widget must know which main page it is talking to before it can
    // send commands. The BroadcastChannel path sets it from the message;
    // setSnapshot() (used when attaching a PiP window directly) has to pass
    // it explicitly — otherwise every button would be a silent no-op.
    if (ownerId) owner = ownerId;
    beeped = false;
    host.classList.add('is-connected');
    conn.textContent = labels.connected;
    if (document.activeElement !== customInput) customInput.value = String(s.totalTime);
    render();
  }

  function sendCmd(cmd: string, value?: number): void {
    if (!owner) return;
    channel.postMessage({ type: 'cmd', target: owner, cmd, value });
  }

  function render(): void {
    if (!state) {
      clock.textContent = '--:--';
      clock.className = 'tw__clock';
      status.textContent = '';
      ring.setAttribute('hidden', '');
      return;
    }
    const s = state;
    const now = Date.now();
    const isCountdown = s.mode === 'countdown';

    // Tabs
    tabs.forEach((tb) => {
      const active = tb.dataset.tab === s.mode;
      tb.classList.toggle('is-active', active);
      tb.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    // Presets + custom input are countdown-only controls — hide them in
    // stopwatch mode (the main page keeps them inside the countdown panel).
    presetsWrap.hidden = !isCountdown;
    customWrap.hidden = !isCountdown;
    if (isCountdown) ring.removeAttribute('hidden');
    else ring.setAttribute('hidden', '');
    stage.classList.toggle('tw__stage--no-ring', !isCountdown);
    // Presets
    presets.forEach((p) =>
      p.classList.toggle('is-active', Number(p.dataset.preset) === s.totalTime)
    );
    lapBtn.hidden = isCountdown;
    lapsWrap.hidden = isCountdown || s.laps.length === 0;

    let text: string;
    let cls = 'tw__clock';
    let statusText: string;
    let rem = s.remaining;

    if (isCountdown) {
      rem = s.running ? Math.max(0, Math.ceil((s.endAt - now) / 1000)) : s.remaining;
      text = formatTime(rem);
      if (rem === 0) cls += ' is-done';
      else if (s.running && rem <= 10) cls += ' is-warning';
      else if (s.running) cls += ' is-running';
      statusText = s.running
        ? labels.running
        : rem === 0
          ? labels.done
          : rem < s.totalTime
            ? labels.paused
            : labels.ready;
      if (s.running && rem === 0 && !beeped && s.soundEnabled) {
        beeped = true;
        beep();
      }
      // Ring fill: empty when reset (rem === totalTime), full at done.
      const progress = s.totalTime > 0 ? Math.max(0, Math.min(1, rem / s.totalTime)) : 0;
      ringProgress.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - progress));
      ringProgress.classList.toggle('is-warning', s.running && rem <= 10 && rem > 0);
      ringProgress.classList.toggle('is-done', rem === 0);
    } else {
      const elapsed = s.swRunning ? now - s.swStartAt : s.swElapsed;
      text = formatStopwatch(elapsed);
      if (s.swRunning) cls += ' is-running';
      statusText = s.swRunning ? labels.running : elapsed > 0 ? labels.paused : labels.ready;
    }

    clock.textContent = text;
    clock.className = cls;
    status.textContent = statusText;

    // Toggle button
    const runningNow = isCountdown ? s.running : s.swRunning;
    const hasProgress = isCountdown
      ? s.remaining < s.totalTime || s.remaining === 0
      : s.swElapsed > 0 || s.swRunning;
    toggle.textContent = runningNow
      ? labels.pause
      : isCountdown && s.remaining === 0
        ? labels.start
        : hasProgress
          ? labels.resume
          : labels.start;

    // Laps (newest first)
    if (!isCountdown) {
      const rows = s.laps
        .slice()
        .reverse()
        .map(
          (lap, i) => `<div class="tw__laps-row${i === 0 ? ' is-latest' : ''}">
            <span class="tw__laps-num">${s.laps.length - i}</span>
            <span>${formatStopwatch(lap.lapTime)}</span>
            <span class="tw__laps-total">${formatStopwatch(lap.totalTime)}</span>
          </div>`
        )
        .join('');
      lapsBody.innerHTML = rows;
    }
  }

  toggle.addEventListener('click', () => {
    if (!state) return;
    const runningNow = state.mode === 'countdown' ? state.running : state.swRunning;
    sendCmd(runningNow ? 'pause' : 'start');
    render();
  });
  resetBtn.addEventListener('click', () => {
    sendCmd('reset');
    render();
  });
  lapBtn.addEventListener('click', () => {
    sendCmd('lap');
    render();
  });
  tabs.forEach((tb) => {
    tb.addEventListener('click', () => {
      sendCmd('setMode', tb.dataset.tab === 'stopwatch' ? 1 : 0);
      render();
    });
  });
  presets.forEach((p) => {
    p.addEventListener('click', () => {
      sendCmd('setTime', Number(p.dataset.preset));
      render();
    });
  });
  const applyCustom = () => {
    const v = Math.max(5, Math.min(600, Number(customInput.value) || 0));
    if (v > 0) sendCmd('setTime', v);
  };
  customOk.addEventListener('click', applyCustom);
  customInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyCustom();
    }
  });

  const interval = window.setInterval(render, 100);

  return {
    sendHello(): void {
      channel.postMessage({ type: 'hello', target: '*' });
    },
    setSnapshot(s: TimerSnapshot, ownerId?: string): void {
      applySnapshot(s, ownerId);
    },
    destroy(): void {
      window.clearInterval(interval);
      channel.close();
      host.remove();
      style.remove();
    },
  };
}
