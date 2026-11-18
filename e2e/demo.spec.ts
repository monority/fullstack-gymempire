import { expect, test } from '@playwright/test';

test('demo profile shows a populated fictional history without writing data', async ({ page }) => {
  await page.goto('/demo');

  await expect(page.getByRole('heading', { name: /Alex Martin/i })).toBeVisible();
  await expect(page.getByText(/données fictives.*lecture seule/i)).toBeVisible();
  await expect(page.getByRole('heading', { name: /Dernières séances/i })).toBeVisible();

  // Aucun contrôle d'action dans la page : tout est rendu côté serveur.
  await expect(page.locator('main button')).toHaveCount(0);

  // Aucune donnée utilisateur n'est écrite. `muscu:exercises` est semé par le
  // shell partagé (QuickSearch), pas par la page de démonstration.
  const keys = await page.evaluate(() =>
    Object.keys(localStorage).filter((key) => key.startsWith('muscu:') && key !== 'muscu:exercises')
  );
  expect(keys).toEqual([]);
});
