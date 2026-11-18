import { expect, test } from '@playwright/test';

const ROUTES = ['/', '/sessions', '/settings', '/timer', '/exercises', '/progression/stats'];
const THEMES = ['dark', 'light'] as const;

for (const theme of THEMES) {
  for (const route of ROUTES) {
    const name = route === '/' ? 'dashboard' : route.slice(1).replace(/\//g, '-');
    test(`${name} (${theme}): themed and no horizontal overflow`, async ({ page }) => {
      await page.addInitScript((mode) => {
        localStorage.clear();
        localStorage.setItem(
          'muscu-auth',
          JSON.stringify({ email: 'qa@gymempire.test', name: 'QA' })
        );
        localStorage.setItem('muscu-theme', mode);
      }, theme);

      await page.goto(route);
      await expect(page.locator('main').first()).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);

      // Captures de diagnostic (non versionnées) en cas d'échec visuel.
      await page.screenshot({ path: `test-results/visual-${name}-${theme}.png` });

      for (const width of [375, 1280]) {
        await page.setViewportSize({ width, height: 800 });
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth - document.documentElement.clientWidth
        );
        expect(overflow, `débordement horizontal à ${width}px`).toBeLessThanOrEqual(1);
      }
    });
  }
}
