import { expect, test } from '@playwright/test';
import { seed } from './helpers';

test('service worker allows navigating a cached route offline', async ({ page, context }) => {
  await seed(page);
  await page.goto('/');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Laisse le cache précache les routes de l'app shell.
  await page.waitForTimeout(600);

  await context.setOffline(true);
  await page.goto('/sessions');
  await expect(page.getByRole('heading', { name: /séances/i }).first()).toBeVisible();
  await context.setOffline(false);
});

test('dashboard loads within the perf budget and stays visually stable', async ({ page }) => {
  await seed(page);
  await page.goto('/');
  await expect(page.locator('main').first()).toBeVisible();

  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return { domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime };
  });
  // Mesure effectuée contre le serveur de dev (HMR) : seuil large, garde-fou de régression.
  expect(metrics.domContentLoaded, 'DOMContentLoaded < 6s en dev').toBeLessThan(6000);

  const cls = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        let total = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
              total += (entry as PerformanceEntry & { value: number }).value;
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(total), 500);
      })
  );
  expect(cls, 'CLS < 0.1').toBeLessThan(0.1);
});
