import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { makeSession, seed } from './helpers';

const ROUTES = [
  { name: 'dashboard', path: '/', data: {} },
  {
    name: 'sessions',
    path: '/sessions',
    data: { 'muscu:sessions': [makeSession()] },
  },
  { name: 'settings', path: '/settings', data: {} },
  { name: 'timer', path: '/timer', data: {} },
  { name: 'exercises', path: '/exercises', data: {} },
  {
    name: 'stats',
    path: '/progression/stats',
    data: {
      'muscu:sessions': [
        makeSession({
          id: 'stats-1',
          status: 'completed',
          exercises: [
            {
              exerciseId: 'e1',
              name: 'Développé couché barre',
              muscle: 'Pectoraux',
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
      ],
    },
  },
  { name: 'login', path: '/login', data: {}, noAuth: true },
];

for (const route of ROUTES) {
  test(`${route.name}: no critical accessibility violation`, async ({ page }) => {
    if (route.noAuth) {
      await page.addInitScript(() => localStorage.clear());
    } else {
      await seed(page, route.data);
    }
    await page.goto(route.path);
    await expect(page.locator('main').first()).toBeVisible();

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations
      .filter((v) => v.impact === 'critical' || v.impact === 'serious')
      .map((v) => `${v.id} (${v.nodes.length} nœud(s)) : ${v.help}`);

    expect(blocking).toEqual([]);
  });
}
