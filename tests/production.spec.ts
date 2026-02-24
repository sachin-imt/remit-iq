import { test, expect } from '@playwright/test';

test.describe('Production E2E Tests', () => {

    test('Homepage loads comparison table and Wise API works', async ({ page }) => {
        // Navigate to homepage
        await page.goto('/');

        // Explicitly wait for the intelligence data to fetch/render
        await expect(page.locator('text=Sending AUD 2,000 to India')).toBeVisible({ timeout: 10000 });

        // Verify Wise is present in the table (meaning live API or DB fallback is working)
        await expect(page.locator('text=Wise').first()).toBeVisible();

        // Verify "You Receive" column for Wise has a computed value
        // Target the specific row that contains Wise, then check its you-receive cell
        const wiseRow = page.locator('tr:has-text("Wise")').first();
        await expect(wiseRow).toContainText('₹');
    });

    test('Calculator updates dynamically', async ({ page }) => {
        await page.goto('/');

        // Wait for the amount input
        const input = page.locator('input[placeholder="2,000"]');
        await expect(input).toBeVisible();

        // Clear and type new amount
        await input.fill('1000');

        // Wait for debounce and recalculation (table header updates)
        await expect(page.locator('text=Sending AUD 1,000 to India')).toBeVisible();
    });

    test('Rate Alerts page form submission works', async ({ page }) => {
        await page.goto('/alerts');

        // Fill out form
        await page.fill('input[type="email"]', 'automated-test@remitiq.co');
        await page.fill('input[type="number"]', '65.00');

        // Click submit
        await page.click('button:has-text("Set My Free Alert")');

        // Verify success message
        await expect(page.locator('text=Alert Set')).toBeVisible();
    });

    test('Chatbot widget opens', async ({ page }) => {
        await page.goto('/');

        // Dismiss cookie consent banner if present (it overlaps the chatbot FAB)
        const rejectBtn = page.locator('button:has-text("Reject")');
        if (await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await rejectBtn.click();
        }

        // Click floating action button
        await page.click('button.bg-\\[\\#F0B429\\]');

        // Verify chat header is visible
        await expect(page.locator('text=RemitIQ Assistant')).toBeVisible();
    });

    test('Static pages load correctly', async ({ page }) => {
        await page.goto('/rates');
        await expect(page.locator('text=Exchange Rate Today')).toBeVisible();

        await page.goto('/about');
        await expect(page.locator('text=Our Mission')).toBeVisible();
    });
});
