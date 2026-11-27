import { expect, test } from '@playwright/test';

test('settings page has no mock labels and a single reminder section', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
  });

  await page.goto('/settings');
  await expect(page.locator('#set-profile')).toBeVisible();
  await expect(page.locator('#set-units')).toBeVisible();
  await expect(page.locator('#set-goals')).toBeVisible();
  await expect(page.locator('#set-timer')).toBeVisible();
  await expect(page.locator('#set-reminder')).toHaveCount(1);
  await expect(page.locator('#set-data')).toBeVisible();
  await expect(page.locator('#set-about')).toBeVisible();

  // Résidus de maquette : numérotation "1." à "8." et libellés en dur.
  const text = await page.locator('.set').innerText();
  expect(text).not.toMatch(/^\s*[1-8]\.\s/m);
  expect(text).not.toContain("RAPPEL D'ENTRAÎNEMENT");
  expect(text).not.toContain('SYNCHRONISATION WEBDAV');

  const ids = await page.locator('.set [id]').evaluateAll((els) => els.map((e) => e.id));
  expect(new Set(ids).size).toBe(ids.length);
});

test('the WebDAV password never reaches localStorage', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    // La synchronisation WebDAV est une option avancée.
    localStorage.setItem('muscu-settings', JSON.stringify({ advancedMode: true }));
  });

  await page.goto('/settings');
  await page.locator('#set-sync-url').fill('https://dav.test/');
  await page.locator('#set-sync-username').fill('alice');
  await page.locator('#set-sync-password').fill('mon-secret');
  await page.locator('#set-sync-password').press('Tab');

  await expect
    .poll(async () =>
      page.evaluate(() => {
        const settings = JSON.parse(localStorage.getItem('muscu-settings') || '{}');
        return settings.webdav?.password ?? '';
      })
    )
    .toBe('');

  expect(
    await page.evaluate(() =>
      Object.keys(localStorage).some((k) => k.toLowerCase().includes('password'))
    )
  ).toBe(false);
  expect(await page.evaluate(() => sessionStorage.getItem('muscu:webdav-password'))).toBe(
    'mon-secret'
  );

  // Le mot de passe reste disponible dans le même onglet après rechargement.
  await page.reload();
  await expect(page.locator('#set-sync-password')).toHaveValue('mon-secret');
});
