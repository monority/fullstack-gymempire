import { expect, test } from '@playwright/test';

test('builder: supersets share a group and warmup is available', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    localStorage.setItem('muscu-settings', JSON.stringify({ advancedMode: true }));
  });

  await page.goto('/sessions/create');
  await page.locator('.create__empty-add-btn, .create__add-btn').first().click();
  await page.locator('.create__picker-tpl').first().click();

  const warmup = page.getByRole('button', { name: /Générer échauffement/i }).first();
  await expect(warmup).toBeVisible();

  const selects = page.locator('.create__superset-select');
  await selects.nth(0).selectOption('new');
  const group = await selects.nth(0).inputValue();
  expect(group).not.toBe('');
  await selects.nth(1).selectOption(group);
  await expect
    .poll(() =>
      selects.evaluateAll((els) => els.slice(0, 2).map((e) => (e as HTMLSelectElement).value))
    )
    .toEqual([group, group]);
});

test('create a session from a template and find it in the history', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
  });

  await page.goto('/sessions/create');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

  // canSave exige un nom, au moins un exercice et des séries.
  await page.locator('#ses-name').fill('Séance E2E');

  // Ouvrir le sélecteur d'exercices via le bouton dédié du builder.
  await page.locator('.create__empty-add-btn, .create__add-btn').first().click();
  await expect(page.locator('.create__picker-tpl').first()).toBeVisible();

  // Charger un template : le builder devient sauvegardable.
  await page.locator('.create__picker-tpl').first().click();
  await expect(page.locator('.create__ex-name').first()).toBeVisible();

  const save = page.getByRole('button', { name: /Enregistrer|Save/i }).first();
  await expect(save).toBeEnabled();
  await save.click();

  await page.goto('/sessions');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const count = await page.evaluate(
    () => JSON.parse(localStorage.getItem('muscu:sessions') || '[]').length
  );
  expect(count).toBeGreaterThanOrEqual(1);
});

test('builder prefills a known exercise from the last completed session', async ({ page }) => {
  await page.addInitScript(() => {
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
          id: 'history-1',
          name: 'Historique',
          date: '2026-11-20',
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

  await page.goto('/sessions/create');
  await page.locator('.create__empty-add-btn, .create__add-btn').first().click();
  await page.locator('.create__picker-input').last().fill('Développé couché barre');
  await page.locator('.create__picker-item-btn').first().click();

  const table = page.getByRole('table', { name: /Développé couché barre/ }).first();
  const weight = table.getByLabel('Charge de la série 1');
  const reps = table.getByLabel('Reps de la série 1');
  await expect(weight).toHaveValue(/80/);
  await expect(reps).toHaveValue(/8/);
});
