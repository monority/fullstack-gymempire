import { expect, test } from '@playwright/test';

test('demo account: advanced-mode toggle is not persisted', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('muscu-settings', JSON.stringify({ advancedMode: true }));
  });
  await page.goto('/login');
  await page.getByRole('button', { name: /Demo account|Compte démo/i }).click();
  await page.waitForURL('**/');

  await expect(page.locator('html')).toHaveAttribute('data-advanced', 'true');
  await page.goto('/settings');
  const toggle = page.getByRole('switch', { name: /Mode avancé|Advanced mode/i });
  await expect(toggle).toBeChecked();
  await toggle.dispatchEvent('click');

  // Le compte démo neutralise l'écriture : ni le réglage ni l'attribut HTML
  // ne doivent survivre au rechargement.
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-advanced', 'true');
  await expect(page.getByRole('switch', { name: /Mode avancé|Advanced mode/i })).toBeChecked();
});

test('demo account: seeded data, banner, read-only and real data restored on logout', async ({
  page,
}) => {
  // Données « réelles » avant d'entrer en démo.
  await page.addInitScript(() => {
    try {
      if (sessionStorage.getItem('__e2e_seeded')) return;
      sessionStorage.setItem('__e2e_seeded', '1');
      localStorage.setItem(
        'muscu:sessions',
        JSON.stringify([
          { id: 'SEANCE_REELLE', date: '2026-01-15', name: 'Ma vraie séance', exercises: [] },
        ])
      );
      localStorage.setItem(
        'muscu-settings',
        JSON.stringify({ pseudo: 'Moi Réel', email: 'moi@reel.fr' })
      );
    } catch {
      // ignore
    }
  });

  await page.goto('/login');
  await page.getByRole('button', { name: /Demo account|Compte démo/i }).click();
  await page.waitForURL('**/');
  await page.waitForLoadState('load');

  await expect(page.locator('[data-demo-banner]')).toBeVisible();
  const sessionCount = await page.evaluate(
    () => JSON.parse(localStorage.getItem('muscu:sessions') || '[]').length
  );
  expect(sessionCount).toBeGreaterThan(20);
  await expect(page.locator('[data-user-name]').first()).toHaveText('Alex');

  // Lecture seule : une modification de réglages ne persiste pas.
  await page.goto('/settings');
  await page.locator('#set-pseudo').fill('DONotSave');
  await page.locator('#set-pseudo').dispatchEvent('click');
  await page.reload();
  await expect(page.locator('#set-pseudo')).toHaveValue('Alex');

  // Sortie : données réelles restaurées.
  await page.locator('[data-logout]').first().click();
  await page.waitForURL('**/login');
  const restored = await page.evaluate(() => ({
    auth: localStorage.getItem('muscu-auth'),
    sessions: JSON.parse(localStorage.getItem('muscu:sessions') || '[]'),
    backup: localStorage.getItem('muscu:demo-backup'),
  }));
  expect(restored.auth).toBeNull();
  expect(restored.backup).toBeNull();
  expect(restored.sessions).toHaveLength(1);
  expect(restored.sessions[0].id).toBe('SEANCE_REELLE');
});
