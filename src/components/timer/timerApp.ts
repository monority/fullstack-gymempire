/**
 * D8 — logique Alpine de la page Timer.
 *
 * Le pont pop-out (BroadcastChannel / Picture-in-Picture) vit hors du store
 * réactif Alpine, exactement comme dans l'implémentation d'origine. Seule
 * l'horloge est injectée pour rendre `snapshot()` testable.
 */

import type { Dictionary } from '../../i18n/types';
import {
  mountTimerWidget,
  widgetLabelsFrom,
  TIMER_CHANNEL,
  type TimerSnapshot,
} from '../../lib/timer-widget';
import { playBeep } from '../../lib/sound';
import { formatTime, formatShort, formatStopwatch } from '../../lib/timer-format';
import { installTimerKeyboard } from '../../lib/timer-input';
import {
  createCountdown,
  createStopwatch,
  ringOffsetFor,
  type CountdownEngine,
  type StopwatchEngine,
} from './timerEngine';

export type TimerMode = 'countdown' | 'stopwatch';

const RING_RADIUS = 108;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

interface TimerBridge {
  channel: BroadcastChannel | null;
  pipWindow: Window | null;
  popWatcher: number;
  remoteConnected: boolean;
  connWatchdog: number;
  instanceId: string;
}

export interface TimerAppDeps {
  labels: Dictionary['timer'] & {
    shortcutsToggle: string;
    shortcutsReset: string;
    spaceKey: string;
  };
  labelSource: Dictionary;
  now(): number;
  randomId(): string;
  localizedPath(path: string): string;
}

export interface TimerApp {
  mode: TimerMode;
  popupOpen: boolean;
  sw: {
    running: boolean;
    elapsed: number;
    laps: { lapTime: number; totalTime: number }[];
    startTimestamp: number;
    intervalId: number | null;
  };
  presets: number[];
  totalTime: number;
  remaining: number;
  display: number;
  running: boolean;
  customTime: number;
  soundEnabled: boolean;
  intervalId: number | null;
  endTime: number;
  _cd: CountdownEngine | null;
  _sw: StopwatchEngine | null;
  ringCircumference: number;
  labels: TimerAppDeps['labels'];
  _cleanupKeyboard: (() => void) | null;
  init(): void;
  snapshot(): TimerSnapshot;
  broadcast(): void;
  pushState(): void;
  handleRemote(msg: unknown): void;
  openPopup(): Promise<void>;
  openFallback(): void;
  attachPip(pip: Window): void;
  setMode(m: TimerMode): void;
  toggle(): void;
  toggleLabel: string;
  clockText: string;
  clockClasses: string;
  modeStatusLabel: string;
  ringOffset: number;
  ringClasses: string;
  setPreset(seconds: number): void;
  setCustom(): void;
  adjustCustom(delta: number): void;
  start(): void;
  pause(): void;
  reset(): void;
  swLapsReversed: { lapTime: number; totalTime: number }[];
  swStart(): void;
  swPause(): void;
  swReset(): void;
  swRecordLap(): void;
  resetCurrent(): void;
  formatTime: typeof formatTime;
  formatShort: typeof formatShort;
  formatStopwatch: typeof formatStopwatch;
  beep(): void;
  destroy(): void;
}

export function createTimerApp(deps: TimerAppDeps): TimerApp {
  const { labels, now, localizedPath } = deps;

  // Hors Alpine : les proxies réactifs casseraient BroadcastChannel.
  const bridge: TimerBridge = {
    channel: null,
    pipWindow: null,
    popWatcher: 0,
    remoteConnected: false,
    connWatchdog: 0,
    instanceId: 'm' + deps.randomId(),
  };

  const app: TimerApp = {
    mode: 'countdown',
    popupOpen: false,
    sw: {
      running: false,
      elapsed: 0,
      laps: [],
      startTimestamp: 0,
      intervalId: null,
    },
    presets: [60, 90, 120, 180],
    totalTime: 90,
    remaining: 90,
    display: 90,
    running: false,
    customTime: 90,
    soundEnabled: true,
    intervalId: null,
    endTime: 0,
    _cd: null,
    _sw: null,
    ringCircumference: RING_CIRCUMFERENCE,
    labels,
    _cleanupKeyboard: null,

    init() {
      this.display = this.totalTime;
      this._cd = createCountdown(this, {
        onDone: () => {
          if (this.soundEnabled && !this.popupOpen) this.beep();
        },
        onChange: () => this.broadcast(),
      });
      this._sw = createStopwatch(this.sw, { onChange: () => this.broadcast() });
      this._cleanupKeyboard = installTimerKeyboard({
        toggle: () => this.toggle(),
        resetCurrent: () => this.resetCurrent(),
      });
      if (!bridge.channel) {
        bridge.channel = new BroadcastChannel(TIMER_CHANNEL);
        bridge.channel.onmessage = (ev: MessageEvent) => this.handleRemote(ev.data);
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && !this.popupOpen) {
          if (this.running) this.pause();
          if (this.sw.running) this.swPause();
        }
      });
    },

    snapshot() {
      return {
        mode: this.mode,
        totalTime: this.totalTime,
        remaining: this.remaining,
        running: this.running,
        endAt: this.running ? this.endTime : 0,
        swRunning: this.sw.running,
        swStartAt: this.sw.running ? this.sw.startTimestamp : 0,
        swElapsed: this.sw.elapsed,
        laps: this.sw.laps.map((lap) => ({ ...lap })),
        soundEnabled: this.soundEnabled,
        now: now(),
      };
    },

    broadcast() {
      if (!this.popupOpen && !bridge.remoteConnected) return;
      this.pushState();
    },

    pushState() {
      bridge.channel?.postMessage({
        type: 'state',
        owner: bridge.instanceId,
        state: this.snapshot(),
      });
    },

    handleRemote(msg) {
      if (!msg || typeof msg !== 'object') return;
      const message = msg as Record<string, unknown>;
      if (message.type === 'hello') {
        if (message.target && message.target !== '*' && message.target !== bridge.instanceId)
          return;
        bridge.remoteConnected = true;
        if (bridge.connWatchdog) clearTimeout(bridge.connWatchdog);
        bridge.connWatchdog = window.setTimeout(() => {
          bridge.remoteConnected = false;
          bridge.connWatchdog = 0;
        }, 6500);
        this.pushState();
        return;
      }
      if (message.type !== 'cmd') return;
      if (message.target && message.target !== bridge.instanceId) return;
      switch (message.cmd) {
        case 'start':
          if (this.mode === 'stopwatch') this.swStart();
          else this.start();
          break;
        case 'pause':
          if (this.mode === 'stopwatch') this.swPause();
          else this.pause();
          break;
        case 'reset':
          this.resetCurrent();
          break;
        case 'lap':
          this.swRecordLap();
          break;
        case 'setMode':
          this.setMode(message.value === 1 ? 'stopwatch' : 'countdown');
          break;
        case 'setTime':
          this.setPreset(Math.max(5, Math.min(600, Number(message.value) || 90)));
          break;
      }
      this.pushState();
    },

    async openPopup() {
      if (this.popupOpen) {
        bridge.pipWindow?.focus();
        return;
      }
      if (!('documentPictureInPicture' in window)) {
        this.openFallback();
        return;
      }
      try {
        const pip = await (
          window as Window & {
            documentPictureInPicture: {
              requestWindow(options: { width: number; height: number }): Promise<Window>;
            };
          }
        ).documentPictureInPicture.requestWindow({ width: 400, height: 580 });
        this.attachPip(pip);
      } catch {
        this.openFallback();
      }
    },

    openFallback() {
      const popup = window.open(
        localizedPath('/timer/pop'),
        'muscu_timer_pop',
        'popup,width=400,height=580'
      );
      if (!popup) return;
      this.popupOpen = true;
      if (bridge.popWatcher) clearInterval(bridge.popWatcher);
      bridge.popWatcher = window.setInterval(() => {
        if (popup.closed) {
          window.clearInterval(bridge.popWatcher);
          bridge.popWatcher = 0;
          this.popupOpen = false;
        }
      }, 500);
      window.setTimeout(() => this.broadcast(), 350);
    },

    attachPip(pip) {
      bridge.pipWindow = pip;
      this.popupOpen = true;
      const doc = pip.document;
      doc.title = labels.title;
      doc.documentElement.setAttribute(
        'data-theme',
        document.documentElement.getAttribute('data-theme') || 'dark'
      );
      const bodyBg =
        getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim() ||
        '#0d0d0d';
      doc.body.style.cssText = 'margin:0;background:' + bodyBg + ';overflow:hidden';
      const root = doc.createElement('div');
      root.id = 'tw-mount';
      doc.body.appendChild(root);
      const widget = mountTimerWidget(root, widgetLabelsFrom(deps.labelSource));
      widget.setSnapshot(this.snapshot(), bridge.instanceId);
      pip.addEventListener('pagehide', () => {
        bridge.pipWindow = null;
        this.popupOpen = false;
        widget.destroy();
      });
    },

    setMode(mode) {
      if (mode === this.mode) return;
      this.pause();
      this.swPause();
      this.mode = mode;
      this.broadcast();
    },

    toggle() {
      if (this.mode === 'stopwatch') {
        if (this.sw.running) this.swPause();
        else this.swStart();
      } else if (this.running) this.pause();
      else this.start();
    },

    get toggleLabel() {
      if (this.mode === 'stopwatch') {
        if (this.sw.running) return labels.pause;
        return this.sw.elapsed > 0 ? labels.resume : labels.start;
      }
      if (this.running) return labels.pause;
      if (this.remaining === 0) return labels.restart;
      if (this.remaining < this.totalTime) return labels.resume;
      return labels.start;
    },

    get clockText() {
      if (this.mode === 'stopwatch') return formatStopwatch(this.sw.elapsed);
      return formatTime(this.display);
    },

    get clockClasses() {
      const base = 'timer__hero-clock';
      if (this.mode === 'countdown') {
        if (this.remaining === 0) return `${base} timer__hero-clock--done`;
        if (this.running && this.remaining <= 10) return `${base} timer__hero-clock--warning`;
        if (this.running) return `${base} timer__hero-clock--running`;
        return base;
      }
      return this.sw.running ? `${base} timer__hero-clock--running` : base;
    },

    get modeStatusLabel() {
      if (this.mode === 'countdown') {
        if (this.running) return labels.running;
        if (this.remaining === 0) return labels.done;
        if (this.remaining < this.totalTime) return labels.paused;
        return labels.ready;
      }
      if (this.sw.running) return labels.running;
      if (this.sw.elapsed > 0) return labels.paused;
      return labels.ready;
    },

    get ringOffset() {
      if (this.mode === 'countdown') return ringOffsetFor(this.totalTime, this.display);
      return 0;
    },

    get ringClasses() {
      const base = 'timer__hero-ring-progress';
      if (this.mode === 'countdown') {
        if (this.remaining === 0) return `${base} timer__hero-ring-progress--done`;
        if (this.running && this.remaining <= 10)
          return `${base} timer__hero-ring-progress--warning`;
        if (this.running) return `${base} timer__hero-ring-progress--running`;
        return base;
      }
      return this.sw.running
        ? `${base} timer__hero-ring-progress--running`
        : `${base} timer__hero-ring-progress--paused`;
    },

    setPreset(seconds) {
      this._cd?.setDuration(seconds);
      this.customTime = seconds;
    },
    setCustom() {
      const value = Math.max(5, Math.min(600, Number(this.customTime) || 0));
      if (value === 0) return;
      this._cd?.setDuration(value);
      this.customTime = value;
    },
    adjustCustom(delta) {
      this.customTime = Math.max(5, Math.min(600, (this.customTime || 0) + delta));
    },
    start() {
      this._cd?.start();
    },
    pause() {
      this._cd?.pause();
    },
    reset() {
      this._cd?.reset();
    },

    get swLapsReversed() {
      return this.sw.laps.slice().reverse();
    },
    swStart() {
      this._sw?.start();
    },
    swPause() {
      this._sw?.pause();
    },
    swReset() {
      this._sw?.reset();
    },
    swRecordLap() {
      this._sw?.recordLap();
    },

    resetCurrent() {
      if (this.mode === 'stopwatch') this.swReset();
      else this.reset();
    },

    formatTime,
    formatShort,
    formatStopwatch,
    beep() {
      playBeep();
    },
    destroy() {
      if (this._cleanupKeyboard) {
        this._cleanupKeyboard();
        this._cleanupKeyboard = null;
      }
      if (this.intervalId) clearInterval(this.intervalId);
      if (this.sw.intervalId) clearInterval(this.sw.intervalId);
    },
  };

  return app;
}
