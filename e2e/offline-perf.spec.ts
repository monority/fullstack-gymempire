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

test('self-hosted fonts load offline without any external request', async ({ page, context }) => {
  const external: string[] = [];
  page.on('request', (request) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) external.push(request.url());
  });

  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForTimeout(600);
  expect(external, 'aucune requête Google Fonts').toEqual([]);

  const fontsReady = () =>
    page.evaluate(
      () => document.fonts.check('700 40px Archivo') && document.fonts.check('400 14px Inter')
    );
  expect(await fontsReady(), 'polices chargées en ligne').toBe(true);

  await context.setOffline(true);
  // En dev, les CSS Vite ne sont pas précachées : on vérifie directement que
  // les fichiers de police sont servis par le SW (en prod ils sont dans /_astro/).
  const offline = await page.evaluate(async () => {
    const results = await Promise.all(
      ['/fonts/archivo-latin.woff2', '/fonts/inter-latin.woff2'].map(async (url) => {
        const response = await fetch(url);
        return { url, status: response.status, type: response.headers.get('content-type') };
      })
    );
    return results;
  });
  expect(offline, 'woff2 servis hors ligne').toEqual([
    { url: '/fonts/archivo-latin.woff2', status: 200, type: 'font/woff2' },
    { url: '/fonts/inter-latin.woff2', status: 200, type: 'font/woff2' },
  ]);
  expect(external, 'aucune requête Google Fonts hors ligne').toEqual([]);
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
