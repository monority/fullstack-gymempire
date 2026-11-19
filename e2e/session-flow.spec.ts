import { expect, test } from '@playwright/test';

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
