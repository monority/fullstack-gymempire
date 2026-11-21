import { expect, test } from '@playwright/test';

test.describe('i18n bout en bout', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('muscu-auth', JSON.stringify({ email: 'e2e@test.fr', name: 'E2E' }));
      localStorage.setItem(
        'muscu:exercises',
        JSON.stringify([{ id: 'e1', name: 'Squat barre', muscle: 'Quadriceps', category: 'Barre' }])
      );
    });
  });

  test('les pages FR et EN sont dans la bonne langue', async ({ page }) => {
    await page.goto('/calculator');
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Calculateur');

    await page.goto('/en/calculator');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Plate calculator');

    await page.goto('/exercises/history?id=e1');
    await expect(page.locator('.page-header__title')).toContainText('Historique');

    await page.goto('/en/exercises/history?id=e1');
    await expect(page.locator('.page-header__title')).toContainText('Exercise history');
  });

  test('le store i18n traduit les données stockées en EN', async ({ page }) => {
    await page.goto('/en/exercises');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    const translated = await page.evaluate(() => {
      const store = window.Alpine?.store('i18n') as
        { trExercise(name: string): string; trMuscle(name: string): string } | undefined;
      return store ? [store.trExercise('Squat barre'), store.trMuscle('Quadriceps')] : null;
    });
    expect(translated).toEqual(['Barbell Squat', 'Quadriceps']);
  });

  test('le sélecteur de langue conserve la route courante', async ({ page }) => {
    await page.goto('/sessions');
    const switcher = page.getByRole('button', { name: /Changer de langue/i }).first();
    await switcher.click();
    await expect(page).toHaveURL(/\/en\/sessions/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('le timer pop-out EN est accessible et en anglais', async ({ page }) => {
    await page.goto('/en/timer/pop');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.locator('#tw-mount')).toHaveAttribute('data-locale', 'en');
  });
});
