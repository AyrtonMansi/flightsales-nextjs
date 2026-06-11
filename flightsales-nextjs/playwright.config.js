// Playwright config for FlightSales smoke tests.
//
// These are deliberately structural — they catch the "I shipped this and forgot
// to import it" class of bug that has hit production multiple times (a
// component referenced but not imported, an early-return that violates Rules
// of Hooks, etc.). They do NOT depend on Supabase being seeded — they assert
// on layout chrome and form mechanics that render with or without data.
//
// Run locally:    npx playwright install chromium && npm run test:e2e
// Run on CI:      npm ci && npx playwright install --with-deps chromium && npm run test:e2e

import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.PLAYWRIGHT_PORT || 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// Allow tests to run against a pre-installed Chromium (e.g. /opt/pw-browsers
// in sandboxed environments where `playwright install` cannot reach the CDN).
// In CI/local dev this is unset and Playwright uses its bundled binary.
const CHROMIUM_PATH = process.env.PLAYWRIGHT_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...(CHROMIUM_PATH ? { launchOptions: { executablePath: CHROMIUM_PATH } } : {}),
      },
    },
  ],
  webServer: {
    // `next dev` keeps the loop tight — build-time issues are already caught
    // by `npm run build` in the deploy pipeline. Smoke tests are about
    // catching runtime regressions (broken imports, hooks-rules violations,
    // ErrorBoundary trips). PORT lets us run alongside a live dev server.
    command: `PORT=${PORT} npm run dev`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
