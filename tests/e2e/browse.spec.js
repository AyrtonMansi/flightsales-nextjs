// Smoke: anonymous browse path.
//
// Catches the regression class where a route mounts but the client throws
// (uncaught import, undefined component, Rules-of-Hooks violation) and the
// ErrorBoundary renders "Something went wrong". We assert the boundary's
// fallback heading is NOT present on each route.

import { test, expect } from '@playwright/test';

const ERROR_BOUNDARY_TEXT = /Something went wrong/i;

test.describe('Anonymous browse', () => {
  test('home renders hero + does not trip ErrorBoundary', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole('heading', { name: /Find your next aircraft/i })).toBeVisible();
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
  });

  test('/buy renders without ErrorBoundary', async ({ page }) => {
    const response = await page.goto('/buy');
    expect(response?.status()).toBeLessThan(400);
    // Buy page chrome — sort dropdown is structural and present even with 0
    // results, so it works whether Supabase is seeded or not.
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
    // The page has a search input (AI bar), assert one exists.
    await expect(page.locator('input[type="text"], input:not([type])').first()).toBeVisible();
  });

  test('/listings/<unknown-id> degrades gracefully', async ({ page }) => {
    // We pass a deliberately-nonexistent UUID. The route should render
    // (either a NotFound state or the detail shell with empty data) without
    // tripping the ErrorBoundary.
    const response = await page.goto('/listings/00000000-0000-0000-0000-000000000000');
    // Either 200 (graceful empty) or 404 (notFound() called) is acceptable;
    // a 5xx means the server crashed.
    expect(response?.status()).toBeLessThan(500);
    await expect(page.getByText(ERROR_BOUNDARY_TEXT)).toHaveCount(0);
  });
});
