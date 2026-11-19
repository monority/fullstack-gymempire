// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  generateDemoData: vi.fn(() => ({
    exercises: 10,
    sessions: 3,
    progressRecords: 2,
    bodyRecords: 1,
    completed: 2,
    inProgress: 1,
    planned: 0,
    demoSessionId: 's1',
    compareId1: 'a',
    compareId2: 'b',
  })),
  resetAllData: vi.fn(),
  currentCounts: vi.fn(() => ({ sessions: 0, progress: 0, body: 0, exercises: 0 })),
}));

vi.mock('../../../lib/seed', () => mocks);

import { createDebugApp } from '../debugApp';

describe('createDebugApp', () => {
  beforeEach(() => vi.clearAllMocks());

  it('génère les données avec un résumé et rafraîchit les compteurs', async () => {
    vi.useFakeTimers();
    const app = createDebugApp();
    app.init();
    app.generate();
    await vi.advanceTimersByTimeAsync(40);

    expect(mocks.generateDemoData).toHaveBeenCalledOnce();
    expect(app.summary).toContain('Séances     : 3');
    expect(app.busy).toBe(false);
    vi.useRealTimers();
  });

  it('efface les données après confirmation', () => {
    const spy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const app = createDebugApp();
    app.wipe();
    expect(mocks.resetAllData).toHaveBeenCalledOnce();
    spy.mockRestore();
  });
});
