import { test, expect } from '@playwright/test';

test.describe('super admin smoke', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('CMS Super Admin')).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel(/email/i)).toBeVisible();
  });
});
