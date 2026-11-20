import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROUTES = [
  '/',
  '/sessions',
  '/exercises',
  '/calendar',
  '/progression/stats',
  '/progression/records',
  '/progression/poids',
  '/settings',
  '/calculator',
  '/timer',
  '/login',
];

test.describe('accessibilité (axe-core)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('muscu-auth', JSON.stringify({ email: 'a11y@test.fr', name: 'A11y' }));
    });
  });

  for (const route of ROUTES) {
    test(`${route} — aucune violation serious/critical`, async ({ page }) => {
      await page.goto(route);
      await page.waitForTimeout(400);

      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

      const violations = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical'
      );
      expect(
        violations.map((v) => `${v.id}: ${v.nodes.length} nœud(s)`),
        `violations a11y sur ${route}`
      ).toEqual([]);
    });
  }
});
