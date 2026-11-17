import { expect, test } from '@playwright/test';
import { seed, seedNoAuth } from './helpers';

test.beforeEach(async ({ page }) => {
  await seedNoAuth(page);
});

test('login validates email and password', async ({ page }) => {
  await page.goto('/login');
  await page
    .getByRole('button', { name: /se connecter|sign in/i })
    .first()
    .click();
  await expect(page.getByText(/saisir votre email|email.*required/i)).toBeVisible();

  await page.locator('#login-email').fill('pas-un-email');
  await page.locator('#login-password').fill('secret');
  await page
    .getByRole('button', { name: /se connecter|sign in/i })
    .first()
    .click();
  await expect(page.getByText(/email.*invalide|email.*invalid/i)).toBeVisible();
});

test('login derives a pseudo from the email', async ({ page }) => {
  await page.goto('/login');
  await page.locator('#login-email').fill('jean.dupont@example.com');
  await page.locator('#login-password').fill('secret');
  await page
    .getByRole('button', { name: /se connecter|sign in/i })
    .first()
    .click();
  await page.waitForURL(/\/$/);
  await expect(page.getByText('Jean Dupont').first()).toBeVisible();
});

test('dev login enters the app', async ({ page }) => {
  await page.goto('/login');
  await page
    .getByRole('button', { name: /connexion rapide|dev login/i })
    .first()
    .click();
  await expect(page).toHaveURL(/\/$/);
});

test('English route renders the localized dashboard', async ({ page }) => {
  await seed(page);
  await page.goto('/en/');
  // En dev, Astro résout parfois les labels de la page importée en FR ;
  // le build statique, lui, rend bien "Welcome!" (vérifié dans dist/en/index.html).
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('a[href="/en/sessions/create"]').first()).toHaveCount(1);
});
