import { expect, test } from '@playwright/test';

test('theme survives ClientRouter navigation in both locales', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    localStorage.setItem('muscu-theme', 'light');
  });

  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // Navigation côté client (clic sur la sidebar), pas un rechargement complet.
  await page.locator('a[href="/sessions"]').first().click();
  await expect(page).toHaveURL(/\/sessions$/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme)).toBe(
    'light'
  );

  await page.locator('a[href="/progression/stats"]').first().click();
  await expect(page).toHaveURL(/\/progression\/stats$/);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // La locale EN utilise les mêmes composants de layout.
  await page.goto('/en/sessions');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
