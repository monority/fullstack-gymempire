import { expect, test } from '@playwright/test';

function seed() {
  localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
  localStorage.setItem(
    'muscu:sessions',
    JSON.stringify([
      {
        id: 'quick-e2e',
        name: 'Séance rapide E2E',
        date: '2026-11-25',
        status: 'planned',
        exercises: [
          {
            exerciseId: 'bench',
            name: 'Développé couché',
            muscle: 'Pectoraux',
            sets: [
              {
                exerciseId: 'bench',
                setNumber: 1,
                type: 'work',
                weight: 80,
                reps: 8,
                completed: false,
              },
              {
                exerciseId: 'bench',
                setNumber: 2,
                type: 'work',
                weight: 80,
                reps: 8,
                completed: false,
              },
            ],
          },
        ],
      },
      {
        id: 'historique-e2e',
        name: 'Historique',
        date: '2026-11-20',
        status: 'completed',
        exercises: [
          {
            exerciseId: 'bench',
            name: 'Développé couché',
            muscle: 'Pectoraux',
            sets: [
              {
                exerciseId: 'bench',
                setNumber: 1,
                type: 'work',
                weight: 75,
                reps: 10,
                completed: true,
              },
            ],
          },
        ],
      },
    ])
  );
}

test('quick session: previous values are prefilled and one tap completes a set', async ({
  page,
}) => {
  await page.addInitScript(seed);
  await page.goto('/sessions/quick');

  await expect(page.locator('#qs-session')).toBeVisible();
  await page.locator('#qs-session').selectOption('quick-e2e');
  await page.getByRole('button', { name: /Commencer|Start/i }).click();

  await expect(page.locator('.quick__previous')).toContainText('75 × 10');
  await expect(page.locator('.quick__check')).toBeVisible();

  await page.locator('.quick__check').click();
  await expect
    .poll(() =>
      page.evaluate(() => {
        type StoredSet = { completed: boolean };
        type StoredSession = {
          id: string;
          status: string;
          exercises: Array<{ sets: StoredSet[] }>;
        };
        const sessions = JSON.parse(
          localStorage.getItem('muscu:sessions') || '[]'
        ) as StoredSession[];
        const s = sessions.find((x) => x.id === 'quick-e2e' && x.status === 'in-progress');
        return s ? s.exercises[0].sets.filter((set) => set.completed).length : -1;
      })
    )
    .toBe(1);

  // La séance planifiée est exécutée en place : aucun doublon dans l'historique.
  const ids = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('muscu:sessions') || '[]')
      .filter((s: { id: string }) => s.id === 'quick-e2e')
      .map((s: { id: string }) => s.id)
  );
  expect(ids).toEqual(['quick-e2e']);
});

test('quick session: RPE control is hidden in simple mode', async ({ page }) => {
  await page.addInitScript(seed);
  await page.goto('/sessions/quick');
  await page.locator('#qs-session').selectOption('quick-e2e');
  await page.getByRole('button', { name: /Commencer|Start/i }).click();

  await expect(page.locator('.quick__rpe-control')).toBeHidden();
});

test('quick session: shell navigation is hidden during the set', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    localStorage.setItem(
      'muscu:sessions',
      JSON.stringify([
        {
          id: 'immersive-1',
          name: 'Séance',
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

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/sessions/quick');
  await expect(page.locator('.mobile-nav')).toBeVisible();
  await page.locator('#qs-session').selectOption('immersive-1');
  await page.getByRole('button', { name: /Commencer|Start/i }).click();

  await expect(page.locator('.quick__working')).toBeVisible();
  await expect(page.locator('.mobile-nav')).toBeHidden();
  await expect(page.locator('.topbar')).toBeHidden();
  const size = await page
    .locator('input[aria-label="Charge"]')
    .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThan(50);

  // Dernière série terminée : on revient à l'état « completed » et le shell réapparaît.
  await page.locator('.quick__check').click();
  await expect(page.locator('.quick__completed')).toBeVisible();
  await expect(page.locator('.mobile-nav')).toBeVisible();
});
