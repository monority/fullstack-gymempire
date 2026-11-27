import { expect, test } from '@playwright/test';

/** Seed injecté dans le navigateur : la locale n'est pas capturée par la closure. */
function seed() {
  return (time: string) => {
    localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
    localStorage.setItem(
      'muscu-settings',
      JSON.stringify({ reminders: { enabled: true, days: [0, 1, 2, 3, 4, 5, 6], time } })
    );
    localStorage.removeItem('muscu:reminder-notified');
    // Permission refusée : le repli visible doit prendre le relais.
    Object.defineProperty(window, 'Notification', {
      value: { permission: 'denied', requestPermission: () => Promise.resolve('denied') },
      configurable: true,
    });
  };
}

test('the reminder watcher runs on every route, not only settings', async ({ page }) => {
  await page.addInitScript(seed(), '23:59');
  await page.goto('/');
  await expect(page.locator('.reminder-watcher')).toHaveCount(1);
  const timer = await page.evaluate(() => {
    const el = document.querySelector('.reminder-watcher');
    const alpine = (window as unknown as { Alpine?: { $data(el: Element): { _timer?: number } } })
      .Alpine;
    return el && alpine ? (alpine.$data(el)._timer ?? null) : null;
  });
  expect(timer).not.toBeNull();

  await page.goto('/sessions');
  await expect(page.locator('.reminder-watcher')).toHaveCount(1);
  await expect(page.locator('#set-reminder')).toHaveCount(0);
});

test('reminder falls back to a visible toast when permission is denied', async ({ page }) => {
  await page.addInitScript(seed(), '18:00');
  await page.clock.install({ time: new Date('2026-11-27T18:00:30') });
  await page.goto('/');

  await expect(page.locator('.toast')).toContainText('C’est l’heure de s’entraîner !');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('muscu:reminder-notified') || 'null'))
  ).toBe('2026-11-27 18:00');
});
