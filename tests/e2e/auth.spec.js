// Smoke: signup form mechanics.
//
// We don't actually submit to Supabase — the goal is to verify the
// LoginPage hooks resolve, the form switches modes, and inline validation
// runs. This catches Rules-of-Hooks regressions in LoginPage (we hit one
// earlier in the session where useState was called after an early
// `if (!user) return` block).

import { test, expect } from '@playwright/test';

test.describe('Auth form', () => {
  test('login page renders and toggles to register mode', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);

    const form = page.locator('form');
    // Form submit button starts as "Sign In" in login mode.
    await expect(form.getByRole('button', { name: /^Sign In$/ })).toBeVisible();

    // Toggle to register via the inline "Create one" toggle.
    await page.getByRole('button', { name: /^Create one$/ }).click();

    // Submit button now reads "Create Account", and the register-only
    // Full Name field is rendered.
    await expect(form.getByRole('button', { name: /^Create Account$/ })).toBeVisible();
    await expect(page.getByPlaceholder('John Smith')).toBeVisible();
  });

  test('register: short password disables the submit button', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: /^Create one$/ }).click();

    await page.getByPlaceholder('John Smith').fill('Test Pilot');
    await page.getByPlaceholder('you@email.com').fill('test@example.com');
    await page.getByPlaceholder('••••••••').fill('short');

    // The component disables the submit button until the password is >= 8
    // chars (LoginPage.jsx line 343). This is the fail-fast UX path — the
    // backend never sees a too-short password.
    const submit = page.locator('form').getByRole('button', { name: /^Create Account$/ });
    await expect(submit).toBeDisabled();
    await expect(page.getByText(/At least 8 characters required/i)).toBeVisible();

    // Bumping to 8 chars enables the button — proves the validation is
    // wired to React state, not just static markup.
    await page.getByPlaceholder('••••••••').fill('longenough');
    await expect(submit).toBeEnabled();
  });
});
