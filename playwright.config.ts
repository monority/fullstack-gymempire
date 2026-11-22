import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // Le serveur de dev et le service worker sont sensibles à la concurrence :
  // 1 worker élimine les flaky (download/hydratation) pour ~60 s de suite.
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'retain-on-failure',
  },
  // Laisser du temps aux asserts sur les scénarios offline et SW.
  expect: { timeout: 10_000 },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Le script force Astro en foreground (Astro 7 se démonise sinon tout seul)
    // et garde le process parent vivant pour Playwright.
    command: 'node scripts/playwright-dev.mjs',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !process.env.CI,
  },
});
