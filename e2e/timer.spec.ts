import { expect, test } from '@playwright/test';

function seedAuth(theme = 'dark') {
  return () => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    localStorage.setItem('muscu-theme', theme);
  };
}

test('timer: no wireframe labels and a live stopwatch clock', async ({ page }) => {
  await page.addInitScript(seedAuth());
  await page.goto('/timer');

  // Les annotations de maquette ne doivent jamais atteindre le DOM.
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/HERO —|MODE \+ PRESETS|CUSTOM INPUT \+ LAPS|SHORTCUTS —|SOUND TOGGLE/);

  await page.getByRole('button', { name: 'Chronomètre' }).click();
  const clock = page.locator('.timer__hero-clock');
  await expect(clock).toHaveText('00:00.00');
  await page.locator('.timer__hero-actions button').first().click();

  // Le tick doit se reprogrammer : l'affichage avance sans attendre la pause.
  await expect
    .poll(async () => Number((await clock.textContent())?.split(':')[1] ?? 0), {
      timeout: 3000,
    })
    .toBeGreaterThan(0);
  await page.locator('.timer__hero-actions button').first().click();
});

test('timer: the pop-out window inherits the host theme', async ({ page, context }) => {
  await page.addInitScript(seedAuth('dark'));
  await page.goto('/timer');

  const pipPromise = context.waitForEvent('page', { timeout: 5000 });
  await page.getByRole('button', { name: /fenêtre externe/i }).click();
  const pip = await pipPromise;

  // Sans copie des feuilles de style, le document about:blank du PiP n'a
  // aucun token et le widget s'affiche en noir sur fond transparent.
  await expect
    .poll(() =>
      pip.evaluate(() =>
        getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
      )
    )
    .toBe('#0f172a');
  const bg = await pip.evaluate(
    () => getComputedStyle(document.querySelector('.tw') as HTMLElement).backgroundColor
  );
  expect(bg).toBe('rgb(15, 23, 42)');
  await pip.close();
});
