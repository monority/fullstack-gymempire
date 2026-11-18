/**
 * logique Alpine de la page Poids.
 * Le calendrier et les notifications sont injectés (tests deterministes).
 */

import type { Dictionary } from '../../i18n/types';
import { getBodyRecords, addBodyRecord, deleteBodyRecord } from '../../lib/storage/body';
import { getSessions } from '../../lib/storage/sessions';
import type { BodyRecord, Session } from '../../lib/storage/types';
import { cssVar } from '../../lib/css-var';
import { countCompletedSessionsBetween, completedVolumeBetween } from '../../lib/session-utils';
import {
  currentUnit,
  formatDateShort,
  formatNumber,
  formatWeightValue,
  weightFromInput,
} from '../../lib/format';
import { renderWeightChart } from '../../lib/body-chart';

export interface BodyForm {
  date: string;
  weight: number | null;
  arm: number | null;
  chest: number | null;
  waist: number | null;
  hips: number | null;
}

export interface PoidsAppDeps {
  labels: Dictionary['poids'] & { kg: string };
  today(): string;
  ui: {
    confirm(message: string): boolean;
    schedule(fn: () => void, ms: number): void;
  };
}

export interface PoidsApp {
  unit: ReturnType<typeof currentUnit>;
  records: BodyRecord[];
  sessions: Session[];
  form: BodyForm;
  formError: string;
  success: string;
  init(): void;
  refresh(): void;
  sessionsSinceDate(date: string): number;
  volumeSinceDate(date: string): number;
  formatVolume(volume: number): string;
  displayWeight(kg: number): string;
  storeWeight(input: HTMLInputElement): void;
  formatSessionsSince(date?: string): string;
  latest: BodyRecord | null;
  previous: BodyRecord | null;
  weightDelta: number | null;
  armDelta: number | null;
  chestDelta: number | null;
  waistDelta: number | null;
  hipsDelta: number | null;
  resetForm(): void;
  addEntry(): void;
  removeEntry(date: string): void;
  formatNumber(n: number | null | undefined): string;
  formatDate(iso: string): string;
  deleteLabel(iso: string): string;
  formatDelta(delta: number | null, unit: string): string;
  renderChart(): string;
}

const emptyForm = (today: string): BodyForm => ({
  date: today,
  weight: null,
  arm: null,
  chest: null,
  waist: null,
  hips: null,
});

export function createPoidsApp(deps: PoidsAppDeps): PoidsApp {
  const { labels, ui } = deps;
  const L = labels;

  const fmtNum = (n: number | null | undefined): string => {
    if (n == null || !Number.isFinite(n)) return '-';
    return Math.round(n * 10) / 10 + '';
  };
  const fmtDelta = (delta: number | null, unit: string): string => {
    if (delta == null || !Number.isFinite(delta) || delta === 0) return '-';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${Math.round(delta * 10) / 10} ${unit} ${L.vsPrev}`;
  };

  return {
    unit: currentUnit(),
    records: [],
    sessions: [],
    form: emptyForm(deps.today()),
    formError: '',
    success: '',

    init() {
      this.refresh();
    },
    refresh() {
      this.records = getBodyRecords();
      this.sessions = getSessions();
    },

    sessionsSinceDate(date) {
      const index = this.records.findIndex((record) => record.date === date);
      const nextDate = index >= 0 ? this.records[index + 1]?.date : undefined;
      return countCompletedSessionsBetween(this.sessions, date, nextDate);
    },
    volumeSinceDate(date) {
      const index = this.records.findIndex((record) => record.date === date);
      const nextDate = index >= 0 ? this.records[index + 1]?.date : undefined;
      return completedVolumeBetween(this.sessions, date, nextDate);
    },

    displayWeight(kg) {
      return formatWeightValue(kg, this.unit);
    },
    storeWeight(input) {
      const kg = weightFromInput(Number(input.value), this.unit);
      this.form.weight = Math.round(kg * 10) / 10;
      input.value = this.displayWeight(this.form.weight);
    },
    formatVolume(volume) {
      return `${L.volume} ${formatNumber(volume)} kg`;
    },
    formatSessionsSince(date) {
      const count = date ? this.sessionsSinceDate(date) : 0;
      const label = count === 1 ? L.sessionSince : L.sessionsSince;
      return `${count} ${label}`;
    },

    get latest() {
      return this.records.length > 0 ? this.records[this.records.length - 1] : null;
    },
    get previous() {
      return this.records.length > 1 ? this.records[this.records.length - 2] : null;
    },
    get weightDelta() {
      if (!this.latest || !this.previous) return null;
      return this.latest.weight - this.previous.weight;
    },
    get armDelta() {
      if (!this.latest?.arm || !this.previous?.arm) return null;
      return this.latest.arm - this.previous.arm;
    },
    get chestDelta() {
      if (!this.latest?.chest || !this.previous?.chest) return null;
      return this.latest.chest - this.previous.chest;
    },
    get waistDelta() {
      if (!this.latest?.waist || !this.previous?.waist) return null;
      return this.latest.waist - this.previous.waist;
    },
    get hipsDelta() {
      if (!this.latest?.hips || !this.previous?.hips) return null;
      return this.latest.hips - this.previous.hips;
    },

    resetForm() {
      this.form = emptyForm(deps.today());
      this.formError = '';
      this.success = '';
    },

    addEntry() {
      this.formError = '';
      this.success = '';

      if (!this.form.date) {
        this.formError = L.dateRequired;
        return;
      }
      if (
        this.form.weight == null ||
        !Number.isFinite(this.form.weight) ||
        this.form.weight <= 0 ||
        this.form.weight < 20 ||
        this.form.weight > 300
      ) {
        this.formError = L.weightInvalid;
        return;
      }

      const record: BodyRecord = {
        date: this.form.date,
        weight: this.form.weight,
      };
      for (const key of ['arm', 'chest', 'waist', 'hips'] as const) {
        const value = this.form[key];
        if (value != null && Number.isFinite(value) && value > 0) record[key] = value;
      }

      addBodyRecord(record);
      this.refresh();
      this.success = L.saved;
      for (const key of ['weight', 'arm', 'chest', 'waist', 'hips'] as const) {
        this.form[key] = null;
      }
      ui.schedule(() => {
        if (this.success === L.saved) this.success = '';
      }, 3000);
    },

    removeEntry(date) {
      if (!ui.confirm(L.deleteConfirm)) return;
      deleteBodyRecord(date);
      this.refresh();
    },

    formatNumber: fmtNum,
    formatDate: formatDateShort,
    deleteLabel(iso) {
      return L.deleteAriaPrefix + formatDateShort(iso);
    },
    formatDelta: fmtDelta,
    renderChart() {
      return renderWeightChart(this.records, {
        cssVar,
        formatDate: formatDateShort,
        chartTitle: L.chartTitle,
      });
    },
  };
}
