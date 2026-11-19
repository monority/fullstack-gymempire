import { expect, test } from '@playwright/test';
import { seedNoAuth, waitForAlpine } from './helpers';

test('demo account signs in with a filled history and never persists changes', async ({ page }) => {
  await seedNoAuth(page);
  await page.goto('/login');
  await waitForAlpine(page);

  await page.getByRole('button', { name: /compte démo|demo account/i }).click();
  await expect(page.getByRole('heading', { name: /bonjour, alex|hey, alex/i })).toBeVisible();
  await expect(page.getByText(/compte démo.*lecture seule|demo account.*read only/i)).toBeVisible();

  const sessionCount = await page.evaluate(
    () => JSON.parse(localStorage.getItem('muscu:sessions') || '[]').length
  );
  expect(sessionCount, 'historique pré-rempli').toBeGreaterThan(10);

  // Lecture seule : une modification d'interface n'est pas enregistrée.
  await page.goto('/settings');
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('muscu-settings') || '{}').weeklyGoal
  );
  await page
    .getByRole('button', { name: /augmenter|increase/i })
    .first()
    .click();
  await page.reload();
  const after = await page.evaluate(
    () => JSON.parse(localStorage.getItem('muscu-settings') || '{}').weeklyGoal
  );
  expect(after, 'réglage non persisté en compte démo').toBe(before);
});
