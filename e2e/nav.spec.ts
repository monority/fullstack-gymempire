import { expect, test } from '@playwright/test';

function seed() {
  localStorage.clear();
  localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
}

const navState = (page: import('@playwright/test').Page) =>
  page.evaluate(() => ({
    path: location.pathname,
    active: [...document.querySelectorAll('.sidebar .is-active')].map((e) => e.textContent.trim()),
    parent: [...document.querySelectorAll('.sidebar .nav-item--parent-active')].map((e) =>
      e.textContent.trim()
    ),
  }));

test('sidebar active state follows the route inside dropdown menus', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/progression/records');

  await expect
    .poll(() => navState(page))
    .toEqual({
      path: '/progression/records',
      active: ['Records'],
      parent: ['Progression'],
    });

  // Navigation SPA entre deux enfants du même menu déroulant.
  await page.locator('.sidebar a[href="/progression/stats"]').first().click();
  await expect
    .poll(() => navState(page))
    .toEqual({
      path: '/progression/stats',
      active: ['Statistiques'],
      parent: ['Progression'],
    });

  // Puis vers un autre groupe : l'ancien surlignage doit disparaître.
  await page.locator('.sidebar a[href="/exercises"]').first().click();
  await expect
    .poll(() => navState(page))
    .toEqual({
      path: '/exercises',
      active: ['Exercices'],
      parent: [],
    });
});

test('accordion state survives route changes without a persisted sidebar', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/');

  const firstGroup = page.locator('.nav-children').first();
  await expect(firstGroup).toHaveClass(/is-open/);
  await page.locator('.nav-item--toggle').first().click();
  await expect(firstGroup).not.toHaveClass(/is-open/);

  await page.locator('.sidebar a[href="/exercises"]').first().click();
  await expect(page).toHaveURL(/\/exercises$/);
  await expect(page.locator('.nav-children').first()).not.toHaveClass(/is-open/);
  await expect(page.locator('.sidebar')).toBeVisible();
});
