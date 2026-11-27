import { expect, test } from '@playwright/test';

/** Les mécaniques opaques (1RM, MRV, RPE) doivent avoir une explication visible sur mobile. */
test('key mechanics have visible short explanations', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    localStorage.setItem('muscu-settings', JSON.stringify({ advancedMode: true }));
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
                  weight: 80,
                  reps: 8,
                  completed: true,
                },
              ],
            },
          ],
        },
      ])
    );
  });

  await page.goto('/progression');
  await expect(page.locator('.prog__hint')).toContainText('Epley');
  await page.goto('/progression/records');
  await expect(page.locator('.rec__hint')).toContainText('Epley');

  await page.goto('/sessions/create');
  await page.locator('.create__empty-add-btn, .create__add-btn').first().click();
  await page.locator('.create__picker-item-btn').first().click();
  await expect(page.locator('.create__mrv-hint')).toBeVisible();
  await expect(page.locator('.create__mrv-hint')).toContainText('1RM');
});
