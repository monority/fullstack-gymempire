import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const ROUTES = [
  '/',
  '/sessions',
  '/sessions/create',
  '/sessions/quick',
  '/sessions/detail?id=s1',
  '/sessions/compare',
  '/exercises',
  '/exercises/history?id=e1',
  '/calendar',
  '/progression',
  '/progression/stats',
  '/progression/records',
  '/progression/poids',
  '/settings',
  '/calculator',
  '/timer',
  '/login',
  '/en/',
  '/en/settings',
  '/en/sessions/create',
  '/en/sessions/quick',
];

test.describe('accessibilité (axe-core)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('muscu-auth', JSON.stringify({ email: 'a11y@test.fr', name: 'A11y' }));
      localStorage.setItem(
        'muscu:exercises',
        JSON.stringify([
          {
            id: 'e1',
            name: 'Développé couché',
            muscle: 'Pectoraux',
            category: 'Barre',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ])
      );
      localStorage.setItem(
        'muscu:sessions',
        JSON.stringify([
          {
            id: 's1',
            name: 'Séance Push',
            date: '2026-11-25',
            status: 'completed',
            duration: 3600,
            exercises: [
              {
                exerciseId: 'e1',
                name: 'Développé couché',
                muscle: 'Pectoraux',
                sets: [
                  {
                    exerciseId: 'e1',
                    setNumber: 1,
                    type: 'work',
                    weight: 80,
                    reps: 8,
                    completed: true,
                  },
                ],
              },
            ],
          },
          {
            id: 's2',
            name: 'Séance planifiée',
            date: '2026-11-28',
            status: 'planned',
            exercises: [
              {
                exerciseId: 'e1',
                name: 'Développé couché',
                muscle: 'Pectoraux',
                sets: [
                  {
                    exerciseId: 'e1',
                    setNumber: 1,
                    type: 'work',
                    weight: 80,
                    reps: 8,
                    completed: false,
                  },
                ],
              },
            ],
          },
        ])
      );
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
