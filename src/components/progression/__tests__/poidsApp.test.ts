import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Dictionary } from '../../../i18n/types';

const mocks = vi.hoisted(() => ({
  getBodyRecords: vi.fn(),
  addBodyRecord: vi.fn(),
  deleteBodyRecord: vi.fn(),
  getSessions: vi.fn(),
}));

vi.mock('../../../lib/storage/body', () => ({
  getBodyRecords: mocks.getBodyRecords,
  addBodyRecord: mocks.addBodyRecord,
  deleteBodyRecord: mocks.deleteBodyRecord,
}));
vi.mock('../../../lib/storage/sessions', () => ({ getSessions: mocks.getSessions }));

import { createPoidsApp } from '../poidsApp';

const LABELS = {
  volume: 'Volume',
  sessionSince: 'séance depuis',
  sessionsSince: 'séances depuis',
  vsPrev: 'vs précédent',
  dateRequired: 'Date requise',
  weightInvalid: 'Poids invalide',
  saved: 'Enregistré',
  deleteConfirm: 'Supprimer ?',
  deleteAriaPrefix: 'Supprimer ',
  chartTitle: 'Évolution du poids',
  kg: 'kg',
} as unknown as Dictionary['poids'] & { kg: string };

function create(confirm = true) {
  const scheduled: Array<{ fn: () => void; ms: number }> = [];
  const app = createPoidsApp({
    labels: LABELS,
    today: () => '2026-11-17',
    ui: {
      confirm: () => confirm,
      schedule: (fn, ms) => scheduled.push({ fn, ms }),
    },
  });
  return { app, scheduled };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.getBodyRecords.mockReturnValue([]);
  mocks.getSessions.mockReturnValue([]);
});

describe('createPoidsApp (D7)', () => {
  it('starts with today injected into the form', () => {
    const { app } = create();
    expect(app.form.date).toBe('2026-11-17');
  });

  it('validates the weight before saving', () => {
    const { app } = create();
    app.form.date = '';
    app.addEntry();
    expect(app.formError).toBe(LABELS.dateRequired);

    app.form.date = '2026-11-17';
    app.form.weight = 10;
    app.addEntry();
    expect(app.formError).toBe(LABELS.weightInvalid);
    expect(mocks.addBodyRecord).not.toHaveBeenCalled();

    app.form.weight = 80;
    app.form.arm = 34;
    app.addEntry();
    expect(mocks.addBodyRecord).toHaveBeenCalledWith({
      date: '2026-11-17',
      weight: 80,
      arm: 34,
    });
    expect(app.success).toBe(LABELS.saved);
    expect(app.form.weight).toBeNull();
  });

  it('schedules the success message reset through the injected timer', () => {
    const { app, scheduled } = create();
    app.form.date = '2026-11-17';
    app.form.weight = 80;
    app.addEntry();
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0].ms).toBe(3000);
    scheduled[0].fn();
    expect(app.success).toBe('');
  });

  it('deletes only after confirmation', () => {
    const declined = create(false);
    declined.app.removeEntry('2026-11-17');
    expect(mocks.deleteBodyRecord).not.toHaveBeenCalled();

    const accepted = create(true);
    accepted.app.removeEntry('2026-11-17');
    expect(mocks.deleteBodyRecord).toHaveBeenCalledWith('2026-11-17');
  });

  it('computes deltas between the last two records', () => {
    mocks.getBodyRecords.mockReturnValue([
      { date: '2026-11-01', weight: 82, arm: 34 },
      { date: '2026-11-17', weight: 80, arm: 35 },
    ]);
    const { app } = create();
    app.init();
    expect(app.latest?.weight).toBe(80);
    expect(app.previous?.weight).toBe(82);
    expect(app.weightDelta).toBe(-2);
    expect(app.armDelta).toBe(1);
    expect(app.chestDelta).toBeNull();
    expect(app.formatDelta(app.weightDelta, 'kg')).toBe('-2 kg ' + LABELS.vsPrev);
  });

  it('formats numbers and dates without locale drift', () => {
    const { app } = create();
    expect(app.formatNumber(null)).toBe('-');
    expect(app.formatNumber(80.55)).toBe('80.6');
    expect(app.deleteLabel('2026-11-17')).toContain('Supprimer ');
    expect(app.renderChart()).toBeTypeOf('string');
  });
});
