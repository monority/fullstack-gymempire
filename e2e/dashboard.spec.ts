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
