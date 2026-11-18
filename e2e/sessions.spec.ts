import { expect, test } from '@playwright/test';
import { makeSession, seed, waitForAlpine } from './helpers';

test.beforeEach(async ({ page }) => {
  await seed(page, {
    'muscu:sessions': [makeSession({ status: 'completed', mood: 'great', notes: 'Bonne séance' })],
  });
});

test('session list filters by search and clears the filter', async ({ page }) => {
  await page.goto('/sessions');
  await waitForAlpine(page);
  await expect(page.locator('.sess__card').first()).toBeVisible();

  const search = page.locator('.sess-list__search input, input[type=search]').first();
  await search.fill('inexistant');
  await expect(page.locator('.empty-filter__title')).toContainText(/aucun résultat/i);

  await search.fill('');
  await expect(page.locator('.sess__card').first()).toBeVisible();
});

test('session list duplicates a session then deletes it after confirmation', async ({ page }) => {
  page.on('dialog', (dialog) => dialog.accept());
  await page.goto('/sessions');
  await waitForAlpine(page);
  const cards = page.locator('.sess__card');
  await expect(cards).toHaveCount(1);

  const more = cards.first().getByRole('button', { name: /plus d'actions|more actions/i });
  await expect(more).toBeVisible();
  await more.click();

  const duplicate = page.getByRole('button', { name: /dupliquer|duplicate/i });
  await expect(duplicate).toBeVisible();
  await duplicate.click();
  await expect(cards).toHaveCount(2);

  const remove = cards.first().getByRole('button', { name: /supprimer|delete/i });
  await expect(remove).toBeVisible();
  await remove.click();
  await expect(cards).toHaveCount(1);
});

test('session detail shows the localized mood label', async ({ page }) => {
  await page.goto('/sessions/detail?id=s1');
  await expect(page.locator('.notes__mood-label')).toHaveText(/très bonne|super/i);

  await page.goto('/en/sessions/detail?id=s1');
  await expect(page.locator('.notes__mood-label')).toHaveText('Great');
});
