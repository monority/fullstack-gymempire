import { expect, test } from '@playwright/test';

/** Le réglage lbs doit s'appliquer aux valeurs ET aux unités affichées. */
test('metric grids use the lbs setting', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    localStorage.setItem('muscu-settings', JSON.stringify({ unit: 'lbs' }));
    localStorage.setItem(
      'muscu:exercises',
      JSON.stringify([
        {
          id: 'e1',
          name: 'Développé couché',
          muscle: 'Pectoraux',
          category: 'Barre',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
      ])
    );
    localStorage.setItem(
      'muscu:sessions',
      JSON.stringify([
        {
          id: 's1',
          name: 'Historique',
          date: '2026-11-20',
          status: 'completed',
          exercises: [
            {
              exerciseId: 'e1',
              name: 'Développé couché',
              muscle: 'Pectoraux',
              sets: [
                {
                  exerciseId: 'e1',
                  setNumber: 1,
                  type: 'work',
                  weight: 100,
                  reps: 10,
                  completed: true,
                },
              ],
            },
          ],
        },
      ])
    );
  });

  for (const route of ['/exercises/history?id=e1', '/progression/stats', '/progression/records']) {
    await page.goto(route);
    const units = await page.locator('[class$="__unit"]').allTextContents();
    expect(units.length).toBeGreaterThan(0);
    expect(units.filter((u) => u.includes('kg'))).toEqual([]);
    expect(units).toContain('lbs');
  }
});
