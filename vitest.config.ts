import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    exclude: ['.opencode/**', 'e2e/**', 'node_modules/**', 'dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**/*.ts', 'src/components/**/*.ts'],
      exclude: ['**/__tests__/**', '**/*.test.ts'],
      reportsDirectory: 'coverage',
      // H1 — seuils planchers, relevés à mesure que la couverture progresse.
      thresholds: { lines: 63, statements: 61, functions: 60, branches: 55 },
    },
  },
});
