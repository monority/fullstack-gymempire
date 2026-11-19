// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { createProgressionApp } from '../progressionApp';

describe('createProgressionApp', () => {
  beforeEach(() => window.localStorage.clear());

  it('démarre avec un état vide et se recalcule', () => {
    const app = createProgressionApp();
    expect(app.exerciseStats).toEqual([]);
    expect(app.totalSessions).toBe(0);
    expect(app.max1RM).toBe(0);
    app.init();
    expect(app.exerciseStats).toEqual([]);
  });

  it('formate les deltas et les dates', () => {
    const app = createProgressionApp();
    expect(app.formatDelta(null)).toBe('');
    expect(app.formatDelta(2.5)).toMatch(/^\+3 kg$/);
    expect(app.formatDate('')).toBe('—');
  });

  it('historyDelta exige au moins deux points', () => {
    const app = createProgressionApp();
    expect(app.historyDelta({ history: [{ estimated1RM: 100 }] } as never)).toBeNull();
    expect(
      app.historyDelta({
        history: [{ estimated1RM: 100 }, { estimated1RM: 108 }],
      } as never)
    ).toBe(8);
  });
});
