import { expect, test } from '@playwright/test';
import { makeSession, seed } from './helpers';

test.beforeEach(async ({ page }) => {
  await seed(page, { 'muscu:sessions': [makeSession({ status: 'in-progress' })] });
});

test('quick session marks every set and reaches the completion screen', async ({ page }) => {
  await page.goto('/sessions/quick');
  await expect(page.locator('#qs-session')).toBeVisible();
  await page.locator('#qs-session').selectOption('s1');

  const start = page.getByRole('button', { name: /commencer|start/i }).first();
  await start.click();

  const validate = page.getByRole('button', {
    name: /marquer la série comme terminée|mark set as complete/i,
  });
  const skipRest = page.getByRole('button', { name: /passer le repos|skip rest/i });

  await expect(validate).toBeVisible();
  await validate.click();
  if (await skipRest.isVisible()) await skipRest.click();

  await expect(validate).toBeVisible();
  await validate.click();
  if (await skipRest.isVisible()) await skipRest.click();

  await expect(page.locator('.quick__done-title')).toBeVisible();
  await expect(page.locator('.quick__done-message')).toContainText(
    /toutes les séries|all sets|2 \/ 2/i
  );
});

test('timer starts, pauses and resets with a visible clock', async ({ page }) => {
  await seed(page);
  await page.goto('/timer');

  const clock = page.locator('.timer__hero-clock');
  await expect(clock).toHaveText('01:30');

  await page
    .getByRole('button', { name: /^démarrer$/i })
    .first()
    .click();
  await expect(page.getByRole('button', { name: /pause/i }).first()).toBeVisible();

  await page.getByRole('button', { name: /pause/i }).first().click();
  await page
    .getByRole('button', { name: /réinitialiser/i })
    .first()
    .click();
  await expect(clock).toHaveText('01:30');
});

test('timer accepts a custom duration', async ({ page }) => {
  await seed(page);
  await page.goto('/timer');
  const input = page.locator('#custom-seconds');
  await input.fill('120');
  await input.press('Enter');
  await expect(page.locator('.timer__hero-clock')).toHaveText('02:00');
});
