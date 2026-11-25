import { expect, test } from '@playwright/test';

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
