import { test, expect } from '@playwright/test';

/**
 * Admin Analytics E2E Tests
 * Tests the protected analytics dashboard and its AI features.
 */

const ADMIN_KEY = process.env.ADMIN_SECRET || 'remitiq-admin-2026';
const BASE_URL = 'https://remitiq.co';

test.describe('Admin Analytics Dashboard', () => {
    
    test('Redirects to home if key is missing or invalid', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/analytics`);
        await expect(page).toHaveURL(`${BASE_URL}/`);
        
        await page.goto(`${BASE_URL}/admin/analytics?key=wrong-key`);
        await expect(page).toHaveURL(`${BASE_URL}/`);
    });

    test('Loads dashboard with valid key', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/analytics?key=${ADMIN_KEY}`);
        
        // Check for key dashboard elements
        await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
        await expect(page.locator('text=KPIs')).toBeVisible();
        await expect(page.locator('text=Unique Users')).toBeVisible();
    });

    test('Analytics AI Chat works', async ({ page }) => {
        await page.goto(`${BASE_URL}/admin/analytics?key=${ADMIN_KEY}`);
        
        // Open the AI Chat
        const askAiBtn = page.locator('button:has-text("Ask AI")');
        await expect(askAiBtn).toBeVisible();
        await askAiBtn.click();
        
        // Verify chat panel is open
        await expect(page.locator('text=Analytics AI')).toBeVisible();
        
        // Type a question
        const input = page.locator('input[placeholder*="Ask about users"]');
        await input.fill('How many users do I have?');
        await page.keyboard.press('Enter');
        
        // Wait for response (look for the sparkles icon which indicates assistant message)
        // Adjusting to look for the message content not being an error
        const assistantMessage = page.locator('.bg-\\[\\#111D32\\]').last();
        await expect(assistantMessage).toBeVisible({ timeout: 20000 });
        
        const responseText = await assistantMessage.innerText();
        expect(responseText).not.toContain('AI service error');
        expect(responseText).not.toContain('timed out');
        expect(responseText.length).toBeGreaterThan(10);
    });
});
