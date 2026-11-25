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

test.describe('mobile bottom navigation', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('tracks the active route and never scrolls horizontally', async ({ page }) => {
    await page.addInitScript(seed);
    await page.goto('/');

    const nav = page.locator('.mobile-nav');
    await expect(nav).toBeVisible();
    await expect(nav.locator('.mobile-nav__item')).toHaveCount(5);
    await expect(nav.locator('.mobile-nav__item.is-active')).toHaveAttribute('href', '/');

    await nav.locator('a[href="/progression"]').click();
    await expect(page).toHaveURL(/\/progression$/);
    await expect(nav.locator('.mobile-nav__item.is-active')).toHaveAttribute(
      'href',
      '/progression'
    );

    // Le bouton central ouvre le mini-menu d'actions.
    await nav.locator('[data-quick-action]').click();
    await expect(page.locator('[data-quick-sheet]')).toBeVisible();
    await expect(page.locator('.quick-sheet__action')).toHaveCount(4);
    await page.locator('.quick-sheet__action').first().click();
    await expect(page).toHaveURL(/\/sessions\/quick$/);

    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
});

test.describe('mobile drawer', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('stays usable after a client-side navigation', async ({ page }) => {
    await page.addInitScript(seed);
    await page.goto('/');

    await page.locator('[data-mobile-toggle]').click();
    await expect(page.locator('[data-mobile-panel]')).toBeVisible();
    await page.locator('.drawer__nav a[href="/exercises"]').first().click();
    await expect(page).toHaveURL(/\/exercises$/);
    await expect(page.locator('[data-mobile-panel]')).toBeHidden();

    // Le shell a été recréé : le hamburger doit toujours répondre.
    await page.locator('[data-mobile-toggle]').click();
    await expect(page.locator('[data-mobile-panel]')).toBeVisible();
    await page.locator('.drawer__nav a[href="/timer"]').first().click();
    await expect(page).toHaveURL(/\/timer$/);
  });
});
