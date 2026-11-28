import { expect, test } from '@playwright/test';

function seed() {
  localStorage.clear();
  localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
  localStorage.setItem(
    'muscu:exercises',
    JSON.stringify([
      {
        id: 'e1',
        name: 'Développé couché barre',
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
        date: '2026-11-17T10:00:00.000Z',
        status: 'completed',
        duration: 3600,
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
                weight: 80,
                reps: 8,
                completed: true,
              },
            ],
          },
        ],
      },
    ])
  );
}

for (const [locale, base, expected] of [
  ['fr', '/', '/sessions/detail?id=s1'],
  ['en', '/en/', '/en/sessions/detail?id=s1'],
] as const) {
  test(`dashboard ${locale}: a recent session opens its detail page`, async ({ page }) => {
    await page.addInitScript(seed);
    await page.goto(base);

    const link = page.locator('.dash__session').first();
    await expect(link).toHaveAttribute('href', expected);
    await link.click();
    await expect(page).toHaveURL(expected);
  });
}

test('dashboard: today session shows counters and a start action', async ({ page }) => {
  const today = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  const key = `${today.getFullYear()}-${p(today.getMonth() + 1)}-${p(today.getDate())}`;

  await page.addInitScript((date) => {
    localStorage.clear();
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    localStorage.setItem(
      'muscu:sessions',
      JSON.stringify([
        {
          id: 'today-1',
          name: 'Séance du jour',
          date,
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
  }, key);

  await page.goto('/');
  await expect(page.locator('.dash__next-eyebrow')).toHaveText('Séance du jour');
  await expect(page.locator('.dash__next-name')).toHaveText('Séance du jour');
  await expect(page.locator('.dash__today-stat').nth(0)).toContainText('1');
  await expect(page.locator('.dash__today-stat').nth(1)).toContainText('1');
  await expect(page.locator('.dash__next-action')).toContainText('Démarrer maintenant');
  await expect(page.locator('.dash__next-action')).toHaveAttribute(
    'href',
    /\/sessions\/quick\?session=today-1/
  );
});

test('dashboard: volumes follow the lbs setting', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    localStorage.setItem('muscu-settings', JSON.stringify({ unit: 'lbs' }));
    localStorage.setItem(
      'muscu:sessions',
      JSON.stringify([
        {
          id: 'lbs-1',
          name: 'Historique',
          date: '2026-11-26',
          status: 'completed',
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
                  weight: 100,
                  reps: 10,
                  completed: true,
                },
              ],
            },
          ],
        },
      ])
    );
  });

  await page.goto('/');
  await expect(page.locator('.dash__today-stat').nth(2)).toContainText('lbs');
  await expect(page.locator('.week-metric__value').first()).toContainText('lbs');
});

test('dashboard hero surfaces the current streak and a dominant title', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    const ex = [
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
    ];
    localStorage.setItem(
      'muscu:sessions',
      JSON.stringify(
        ['2026-11-28', '2026-11-27', '2026-11-26'].map((date, i) => ({
          id: `s${i}`,
          name: 'Séance',
          date,
          status: 'completed',
          exercises: ex,
        }))
      )
    );
  });

  await page.goto('/');
  await expect(page.locator('.dash__streak')).toBeVisible();
  await expect(page.locator('.dash__streak')).toContainText('3 jours');
  const size = await page
    .locator('.dash__next-name')
    .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThan(40);
});

test('progression: an exercise card opens its history', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
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
          name: 'Push',
          date: '2026-11-27',
          status: 'completed',
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
      ])
    );
  });

  await page.goto('/progression');
  const card = page.locator('.prog__item').first();
  await expect(card).toHaveAttribute('href', '/exercises/history?id=e1');
  await card.click();
  await expect(page).toHaveURL(/\/exercises\/history\?id=e1$/);
});
