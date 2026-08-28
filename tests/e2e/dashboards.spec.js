import { test, expect } from '@playwright/test';

async function enterDemo(page, role) {
  await page.goto('/login');
  await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
  await page.getByRole('button', { name: new RegExp(`^${role}$`, 'i') }).click();
  await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
}

test.describe('Role dashboards', () => {
  test('private account dashboard is functional and only exposes live surfaces', async ({ page }) => {
    await enterDemo(page, 'private');

    await expect(page.getByText('My FlightSales')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    for (const tab of ['My aircraft', 'Saved', 'Messages', 'Profile']) {
      await page.getByRole('button', { name: new RegExp(`^${tab}`, 'i') }).click();
      await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
    }

    await expect(page.getByText(/13 of 20 listings used/i)).toHaveCount(0);
    await expect(page.getByText(/3x more enquiries/i)).toHaveCount(0);
    await expect(page.getByText(/Coming soon/i)).toHaveCount(0);
  });

  test('dealer dashboard supports inventory and lead operations', async ({ page }) => {
    await enterDemo(page, 'dealer');

    await expect(page.getByText('Inventory and lead operations')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dealer overview' })).toBeVisible();

    await page.getByRole('button', { name: /^Inventory/i }).click();
    await expect(page.getByRole('heading', { name: 'Inventory' })).toBeVisible();

    await page.getByRole('button', { name: /^Lead pipeline/i }).click();
    await expect(page.getByRole('heading', { name: 'Lead pipeline' })).toBeVisible();

    await page.getByRole('button', { name: /^Bulk import/i }).click();
    await expect(page.getByRole('heading', { name: 'Bulk import' })).toBeVisible();

    await page.getByRole('button', { name: /^Business profile/i }).click();
    await expect(page.getByRole('heading', { name: 'Business profile' })).toBeVisible();

    await expect(page.getByText(/Stripe coming soon/i)).toHaveCount(0);
    await expect(page.getByText(/Coming soon/i)).toHaveCount(0);
    await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
  });

  test('admin dashboard exposes operational queues and specialist tools', async ({ page }) => {
    await enterDemo(page, 'admin');

    await expect(page.getByRole('heading', { name: 'Admin control centre' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Operations overview' })).toBeVisible();

    for (const tab of ['Listings', 'Users', 'Dealer applications', 'Enquiries', 'Lead management', 'Audit']) {
      await page.getByRole('tab', { name: new RegExp(`^${tab}`, 'i') }).click();
      await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
    }
  });

  test('private dashboard remains usable at phone width without horizontal page overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await enterDemo(page, 'private');

    await expect(page.getByText('My FlightSales')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(2);

    await page.getByRole('button', { name: /^Messages/i }).click();
    await expect(page.getByRole('heading', { name: 'Messages' })).toBeVisible();
    await expect(page.getByText(/Something went wrong/i)).toHaveCount(0);
  });
});
