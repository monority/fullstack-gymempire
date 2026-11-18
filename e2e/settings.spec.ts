import { expect, test } from '@playwright/test';
import { makeSession, seed, waitForAlpine } from './helpers';

test.beforeEach(async ({ page }) => {
  await seed(page, { 'muscu-settings': { weeklyGoal: 3 } });
});

test('settings exports a JSON backup', async ({ page }) => {
  await page.goto('/settings');
  await waitForAlpine(page);
  const tile = page
    .locator('.set__data-tile')
    .filter({ hasText: /exporter en json|export as json/i });
  const downloadPromise = page.waitForEvent('download');
  await tile.getByRole('button').click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain('muscu-backup');
  expect(download.suggestedFilename()).toMatch(/\.json$/);
});

test('settings changes the weekly goal and persists it', async ({ page }) => {
  await page.goto('/settings');
  const input = page.locator('#set-weekly-goal');
  await expect(input).toHaveValue('3');
  await input.fill('5');
  await input.press('Tab');
  await page.reload();
  await expect(page.locator('#set-weekly-goal')).toHaveValue('5');
});

test('settings exposes the unit choice', async ({ page }) => {
  await page.goto('/settings');
  await expect(page.getByText(/unité de poids|weight unit/i)).toBeVisible();
});

test('switching to lbs converts display but keeps stored kg', async ({ page }) => {
  await page.addInitScript(
    (payload) => {
      localStorage.setItem('muscu:sessions', JSON.stringify(payload));
    },
    [
      makeSession({
        exercises: [
          {
            exerciseId: 'e1',
            name: 'Squat',
            muscle: 'Cuisses',
            sets: [
              {
                exerciseId: 'e1',
                setNumber: 1,
                type: 'work',
                weight: 60,
                reps: 8,
                completed: true,
              },
            ],
          },
        ],
      }),
    ]
  );
  await page.goto('/settings');
  await page.getByRole('button', { name: 'lbs' }).click();

  await page.goto('/sessions');
  await expect(page.locator('.sess__volume-badge')).toContainText(/lbs/);

  const storedWeight = await page.evaluate(() => {
    const sessions = JSON.parse(localStorage.getItem('muscu:sessions') || '[]');
    return sessions[0].exercises[0].sets[0].weight;
  });
  expect(storedWeight).toBe(60);
});
