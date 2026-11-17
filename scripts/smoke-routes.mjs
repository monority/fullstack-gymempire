import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist');
const criticalRoutes = [
  '/',
  '/en/',
  '/login/',
  '/en/login/',
  '/sessions/create/',
  '/en/sessions/create/',
  '/sessions/quick/',
  '/en/sessions/quick/',
  '/progression/',
  '/en/progression/',
  '/settings/',
  '/en/settings/',
];

const failures = [];

for (const route of criticalRoutes) {
  const file = join(dist, route, 'index.html');
  if (!existsSync(file)) {
    failures.push(`${route}: missing index.html`);
    continue;
  }

  const html = readFileSync(file, 'utf8');
  if (!/<html\b/i.test(html)) failures.push(`${route}: missing html root`);
  if (!/<title>[^<]+<\/title>/i.test(html)) failures.push(`${route}: missing title`);
}

const serviceWorker = join(dist, 'sw.js');
if (!existsSync(serviceWorker)) failures.push('/sw.js: missing service worker');

// B1 (plan-execution.md) — the design-system page /ui is dev-only:
// in the production build it must not contain any UI-kit content.
const uiPage = join(dist, 'ui', 'index.html');
if (existsSync(uiPage)) {
  const uiHtml = readFileSync(uiPage, 'utf8');
  if (/UI Kit|Design System|swatch|typography/i.test(uiHtml)) {
    failures.push('/ui: UI-kit content leaked into production build (expected 404)');
  }
}

if (failures.length > 0) {
  console.error('Route smoke test failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Route smoke test passed (${criticalRoutes.length} routes + service worker).`);
}
