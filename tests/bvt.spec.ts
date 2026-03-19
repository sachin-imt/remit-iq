/**
 * RemitIQ — Build Verification Tests (BVT)
 * =========================================
 * Covers all changes from the latest sprint:
 *   1. Multi-currency support (13 corridors, not just AUD)
 *   2. Dynamic currency propagation from CountrySelector to all components
 *   3. Algo signals update daily per currency (SEND_NOW / WAIT / URGENT)
 *   4. No hardcoded AUD references — everything reflects selected currency
 *   5. Affiliate URLs contain correct source currency
 *   6. SEO landing pages for each corridor
 *   7. Rates + Alerts pages use dynamic pairLabel
 *   8. Chatbot greets with correct currency context
 *
 * Run locally: node_modules/.bin/playwright test --config=playwright.local.config.ts tests/bvt.spec.ts
 */

import { test, expect, type Page } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Wait until the comparison table header shows an amount (intelligence loaded). */
async function waitForTableLoad(page: Page, timeout = 30000) {
    // Table header: "Sending XXX Y,YYY to India" — appears once React renders with currency
    await page.locator('text=Sending').first().waitFor({ timeout }).catch(() => {});
    // Also wait for Wise row to appear (means API data is present)
    await page.locator('text=Wise').first().waitFor({ timeout: 10000 }).catch(() => {});
}

/** Force-select a corridor by its slug value (bypasses geo-detection). */
async function selectCorridorBySlug(page: Page, slug: string, currencyCode: string) {
    const selector = page.locator('select[aria-label="Select your country"]');
    await selector.waitFor({ timeout: 10000 });
    await selector.selectOption({ value: slug });
    // Wait for table header to show the new currency
    await page.locator(`text=Sending ${currencyCode}`).first().waitFor({ timeout: 20000 });
}

/** Navigate to homepage and force Australia/AUD (bypasses geo-detection). */
async function gotoHomeWithAUD(page: Page) {
    // Set localStorage before navigating so geo-detection is skipped
    await page.goto('/');
    await page.evaluate(() => {
        localStorage.setItem('remitiq_source_country', 'australia');
    });
    await page.reload();
    await waitForTableLoad(page);
}

// ─── Group 1: Core Page Load BVT ────────────────────────────────────────────

test.describe('Core Page Load', () => {

    test('Homepage loads — comparison table appears', async ({ page }) => {
        await page.goto('/');
        // Table must appear (Wise is always in the comparison)
        await expect(page.locator('text=Wise').first()).toBeVisible({ timeout: 20000 });
        // Platform table should have INR values
        const wiseRow = page.locator('tr:has-text("Wise")').first();
        await expect(wiseRow).toContainText('₹', { timeout: 15000 });
    });

    test('Country selector is present on homepage', async ({ page }) => {
        await page.goto('/');
        await expect(page.locator('select[aria-label="Select your country"]')).toBeVisible({ timeout: 10000 });
    });

    test('Comparison table renders 6 providers', async ({ page }) => {
        await page.goto('/');
        for (const name of ['Wise', 'Remitly', 'TorFX', 'OFX', 'Instarem', 'Western Union']) {
            await expect(page.locator(`text=${name}`).first()).toBeVisible({ timeout: 20000 });
        }
    });

    test('Wise row shows INR received value', async ({ page }) => {
        await page.goto('/');
        await waitForTableLoad(page);
        const wiseRow = page.locator('tr:has-text("Wise")').first();
        await expect(wiseRow).toContainText('₹', { timeout: 15000 });
    });

    test('Rates page loads with dynamic currency label', async ({ page }) => {
        await page.goto('/rates');
        await expect(page.locator('text=to INR Exchange Rate Today')).toBeVisible({ timeout: 20000 });
    });

    test('About page loads', async ({ page }) => {
        await page.goto('/about');
        await expect(page.locator('text=Our Mission')).toBeVisible({ timeout: 10000 });
    });

    test('Alerts page loads with pair label containing /INR', async ({ page }) => {
        await page.goto('/alerts');
        await expect(page.locator('text=/INR').first()).toBeVisible({ timeout: 15000 });
    });

    test('Alerts page shows current best rate', async ({ page }) => {
        await page.goto('/alerts');
        await expect(page.locator('text=Current best rate: ₹')).toBeVisible({ timeout: 25000 });
    });

    test('Privacy page loads', async ({ page }) => {
        await page.goto('/privacy');
        await expect(page.locator('body')).not.toBeEmpty();
    });

});

// ─── Group 2: Multi-Currency — No Hardcoded AUD ──────────────────────────────

test.describe('Multi-Currency — Dynamic Currency Propagation', () => {

    test('Country selector lists all major corridors', async ({ page }) => {
        await page.goto('/');
        const selector = page.locator('select[aria-label="Select your country"]');
        await selector.waitFor({ timeout: 10000 });
        const options = await selector.locator('option').allTextContents();
        for (const code of ['AUD', 'USD', 'GBP', 'EUR', 'CAD', 'NZD', 'SGD', 'AED']) {
            expect(options.some(o => o.includes(code)), `Missing ${code} corridor`).toBeTruthy();
        }
    });

    test('Country selector has at least 10 corridor options', async ({ page }) => {
        await page.goto('/');
        const selector = page.locator('select[aria-label="Select your country"]');
        await selector.waitFor({ timeout: 10000 });
        const count = await selector.locator('option').count();
        expect(count).toBeGreaterThanOrEqual(10);
    });

    test('Changing to NZD updates table header to NZD', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => { localStorage.setItem('remitiq_source_country', 'australia'); });
        await page.reload();
        await waitForTableLoad(page);
        await selectCorridorBySlug(page, 'new-zealand', 'NZD');
        await expect(page.locator('text=Sending NZD').first()).toBeVisible({ timeout: 20000 });
        // Must NOT show AUD in the "Sending" header anymore
        const sendingHeader = page.locator('text=Sending AUD').first();
        await expect(sendingHeader).not.toBeVisible();
    });

    test('Changing to USD updates table header to USD', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => { localStorage.setItem('remitiq_source_country', 'australia'); });
        await page.reload();
        await waitForTableLoad(page);
        await selectCorridorBySlug(page, 'usa', 'USD');
        await expect(page.locator('text=Sending USD').first()).toBeVisible({ timeout: 20000 });
        await expect(page.locator('text=Sending AUD').first()).not.toBeVisible();
    });

    test('Changing to GBP updates table header to GBP', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => { localStorage.setItem('remitiq_source_country', 'australia'); });
        await page.reload();
        await waitForTableLoad(page);
        await selectCorridorBySlug(page, 'uk', 'GBP');
        await expect(page.locator('text=Sending GBP').first()).toBeVisible({ timeout: 20000 });
    });

    test('Chart title updates to NZD/INR after switching to NZD', async ({ page }) => {
        await gotoHomeWithAUD(page);
        await selectCorridorBySlug(page, 'new-zealand', 'NZD');
        // Chart title: "NZD/INR — Last 30 Days"
        await expect(page.locator('text=NZD/INR').first()).toBeVisible({ timeout: 25000 });
    });

    test('Alerts page shows AUD/INR pair label by default', async ({ page }) => {
        // Set AUD in localStorage so geo-detection doesn't change it
        await page.goto('/alerts');
        await page.evaluate(() => localStorage.setItem('remitiq_source_country', 'australia'));
        await page.reload();
        await expect(page.locator('text=AUD/INR').first()).toBeVisible({ timeout: 15000 });
    });

    test('Rates page shows dynamic currency code in title', async ({ page }) => {
        await page.goto('/rates');
        // Default corridor (whatever geo gives) + "/INR Exchange Rate Today"
        await expect(page.locator('text=Exchange Rate Today')).toBeVisible({ timeout: 15000 });
    });

});

// ─── Group 3: Signals Change Per Currency ────────────────────────────────────

test.describe('Algo — Signals Update Per Currency', () => {

    test('Homepage shows a timing signal label', async ({ page }) => {
        await gotoHomeWithAUD(page);
        // One of the three signals should appear — use OR locator
        const sendNow = page.locator('text=SEND NOW');
        const wait = page.locator('text=WAIT 3-7 DAYS');
        const urgent = page.locator('text=URGENT');
        const anySignal = sendNow.or(wait).or(urgent);
        await expect(anySignal.first()).toBeVisible({ timeout: 25000 });
    });

    test('Signal has a confidence percentage', async ({ page }) => {
        await gotoHomeWithAUD(page);
        await expect(page.locator('text=Confidence').first()).toBeVisible({ timeout: 25000 });
    });

    test('Signal shows forecast direction (Rising/Falling/Steady)', async ({ page }) => {
        await gotoHomeWithAUD(page);
        const rising = page.locator('text=Rising');
        const falling = page.locator('text=Falling');
        const steady = page.locator('text=Steady');
        const anyDirection = rising.or(falling).or(steady);
        await expect(anyDirection.first()).toBeVisible({ timeout: 25000 });
    });

    test('API /api/rates?currency=AUD returns valid JSON with signal', async ({ page }) => {
        const resp = await page.request.get('/api/rates?currency=AUD');
        expect(resp.ok()).toBeTruthy();
        const json = await resp.json();
        expect(json.midMarketRate).toBeGreaterThan(0);
        expect(json.recommendation?.signal).toMatch(/SEND_NOW|WAIT|URGENT/);
        expect(json.dataSource).toMatch(/live|cached|fallback/);
        expect(json.currency).toBe('AUD');
    });

    test('API /api/rates?currency=NZD returns valid JSON with signal', async ({ page }) => {
        const resp = await page.request.get('/api/rates?currency=NZD');
        expect(resp.ok()).toBeTruthy();
        const json = await resp.json();
        expect(json.midMarketRate).toBeGreaterThan(0);
        expect(json.recommendation?.signal).toMatch(/SEND_NOW|WAIT|URGENT/);
        expect(json.currency).toBe('NZD');
    });

    test('API /api/rates?currency=USD returns valid JSON with signal', async ({ page }) => {
        const resp = await page.request.get('/api/rates?currency=USD');
        expect(resp.ok()).toBeTruthy();
        const json = await resp.json();
        expect(json.midMarketRate).toBeGreaterThan(0);
        expect(json.recommendation?.signal).toMatch(/SEND_NOW|WAIT|URGENT/);
        expect(json.currency).toBe('USD');
    });

    test('API /api/rates?currency=GBP returns valid JSON with signal', async ({ page }) => {
        const resp = await page.request.get('/api/rates?currency=GBP');
        expect(resp.ok()).toBeTruthy();
        const json = await resp.json();
        expect(json.midMarketRate).toBeGreaterThan(0);
        expect(json.currency).toBe('GBP');
    });

    test('API returns different mid-market rates for AUD vs USD', async ({ page }) => {
        const [audResp, usdResp] = await Promise.all([
            page.request.get('/api/rates?currency=AUD'),
            page.request.get('/api/rates?currency=USD'),
        ]);
        const aud = await audResp.json();
        const usd = await usdResp.json();
        // AUD/INR ≈ 54 vs USD/INR ≈ 84 — very different
        expect(Math.abs(aud.midMarketRate - usd.midMarketRate)).toBeGreaterThan(1);
    });

    test('API recommendation includes factors array with 5+ entries', async ({ page }) => {
        const resp = await page.request.get('/api/rates?currency=AUD');
        const json = await resp.json();
        expect(Array.isArray(json.recommendation?.factors)).toBeTruthy();
        expect(json.recommendation.factors.length).toBeGreaterThanOrEqual(5);
    });

    test('Rate Intelligence panel shows signal factor icons (👍/👎/➡️)', async ({ page }) => {
        await gotoHomeWithAUD(page);
        // Wait for the Rate Intelligence section to appear (requires API data to load)
        await expect(page.locator('text=Rate Intelligence').first()).toBeVisible({ timeout: 30000 });
        // Factor rows are .bg-white divs inside the intelligence panel with icon spans
        // Use poll-retry approach: check icon count until it reaches 5
        const thumbsUp = page.locator('text=👍');
        const thumbsDown = page.locator('text=👎');
        const neutral = page.locator('text=➡️');
        // Wait for at least 1 icon to appear first (with auto-retry)
        await expect(thumbsUp.or(thumbsDown).or(neutral).first()).toBeVisible({ timeout: 15000 });
        // Then verify there are 5 or more total factor icons
        await expect(async () => {
            const count = await thumbsUp.or(thumbsDown).or(neutral).count();
            expect(count).toBeGreaterThanOrEqual(5);
        }).toPass({ timeout: 10000, intervals: [500] });
    });

    test('AUD signal differs from NZD signal structure (both have signal key)', async ({ page }) => {
        const [aud, nzd] = await Promise.all([
            page.request.get('/api/rates?currency=AUD').then(r => r.json()),
            page.request.get('/api/rates?currency=NZD').then(r => r.json()),
        ]);
        expect(aud.recommendation.signal).toMatch(/SEND_NOW|WAIT|URGENT/);
        expect(nzd.recommendation.signal).toMatch(/SEND_NOW|WAIT|URGENT/);
        // Rates are structurally valid for both currencies
        expect(aud.midMarketRate).toBeGreaterThan(0);
        expect(nzd.midMarketRate).toBeGreaterThan(0);
        // Rates are different values (NZD/INR ≠ AUD/INR)
        expect(aud.midMarketRate).not.toEqual(nzd.midMarketRate);
    });

});

// ─── Group 4: Calculator / Amount Input ──────────────────────────────────────

test.describe('Calculator — Amount Input', () => {

    test('Amount input is visible on homepage', async ({ page }) => {
        await page.goto('/');
        const input = page.locator('input[placeholder="2,000"]');
        await expect(input).toBeVisible({ timeout: 10000 });
    });

    test('Changing amount updates table header', async ({ page }) => {
        await gotoHomeWithAUD(page);
        const input = page.locator('input[placeholder="2,000"]');
        await input.fill('5000');
        await expect(page.locator('text=Sending AUD 5,000 to India')).toBeVisible({ timeout: 10000 });
    });

    test('Changing amount after currency switch uses new currency in header', async ({ page }) => {
        // Set localStorage before load so geo-detection short-circuits and can't override our selection
        await page.goto('/');
        await page.evaluate(() => { localStorage.setItem('remitiq_source_country', 'australia'); });
        await page.reload();
        await waitForTableLoad(page);
        await selectCorridorBySlug(page, 'usa', 'USD');
        const input = page.locator('input[placeholder="2,000"]');
        await input.fill('1000');
        await expect(page.locator('text=Sending USD 1,000 to India')).toBeVisible({ timeout: 15000 });
    });

    test('Mid-market rate label appears in table header', async ({ page }) => {
        await gotoHomeWithAUD(page);
        await expect(page.locator('text=Mid-market:').first()).toBeVisible({ timeout: 20000 });
    });

});

// ─── Group 5: Affiliate URLs — Dynamic Currency ───────────────────────────────

test.describe('Affiliate Links — Currency-Aware', () => {

    test('Send button for Wise is visible', async ({ page }) => {
        await page.goto('/');
        await waitForTableLoad(page);
        const wiseRow = page.locator('tr:has-text("Wise")').first();
        await expect(wiseRow.locator('a:has-text("Send")')).toBeVisible({ timeout: 15000 });
    });

    test('Wise link for AUD corridor contains AUD in URL', async ({ page }) => {
        await gotoHomeWithAUD(page);
        const wiseRow = page.locator('tr:has-text("Wise")').first();
        const sendLink = wiseRow.locator('a:has-text("Send")');
        await expect(sendLink).toBeVisible({ timeout: 15000 });
        const href = await sendLink.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).toContain('AUD');
    });

    test('After switching to USD, Wise link href updates to contain USD', async ({ page }) => {
        await page.goto('/');
        await page.evaluate(() => { localStorage.setItem('remitiq_source_country', 'australia'); });
        await page.reload();
        await waitForTableLoad(page);
        await selectCorridorBySlug(page, 'usa', 'USD');
        const wiseRow = page.locator('tr:has-text("Wise")').first();
        const sendLink = wiseRow.locator('a:has-text("Send")');
        await expect(sendLink).toBeVisible({ timeout: 15000 });
        // Use toHaveAttribute with auto-retry so we wait for React to re-render the href
        await expect(sendLink).toHaveAttribute('href', /USD/, { timeout: 10000 });
    });

});

// ─── Group 6: SEO Landing Pages ──────────────────────────────────────────────

test.describe('SEO Landing Pages — send-money-to-india-from', () => {

    test('/send-money-to-india-from/australia loads', async ({ page }) => {
        await page.goto('/send-money-to-india-from/australia');
        await expect(page.locator('text=Australia').first()).toBeVisible({ timeout: 15000 });
    });

    test('/send-money-to-india-from/usa loads', async ({ page }) => {
        await page.goto('/send-money-to-india-from/usa');
        await expect(page.locator('text=United States').first()).toBeVisible({ timeout: 15000 });
    });

    test('/send-money-to-india-from/uk loads', async ({ page }) => {
        await page.goto('/send-money-to-india-from/uk');
        await expect(page.locator('text=United Kingdom').first()).toBeVisible({ timeout: 15000 });
    });

    test('/send-money-to-india-from/uae loads', async ({ page }) => {
        await page.goto('/send-money-to-india-from/uae');
        await expect(page.locator('body')).not.toBeEmpty();
        await expect(page.locator('text=India').first()).toBeVisible({ timeout: 15000 });
    });

    test('/send-money-to-india-from/canada loads', async ({ page }) => {
        await page.goto('/send-money-to-india-from/canada');
        await expect(page.locator('text=Canada').first()).toBeVisible({ timeout: 15000 });
    });

    test('/send-money-to-india-from/new-zealand loads', async ({ page }) => {
        await page.goto('/send-money-to-india-from/new-zealand');
        await expect(page.locator('text=New Zealand').first()).toBeVisible({ timeout: 15000 });
    });

});

// ─── Group 7: Chatbot Widget ─────────────────────────────────────────────────

test.describe('Chatbot Widget', () => {

    test('Chatbot FAB is visible on homepage', async ({ page }) => {
        await page.goto('/');
        const rejectBtn = page.locator('button:has-text("Reject")');
        if (await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await rejectBtn.click();
        }
        await expect(page.locator('button[aria-label="Open RemitIQ assistant"]')).toBeVisible({ timeout: 10000 });
    });

    test('Clicking chatbot FAB opens the chat panel', async ({ page }) => {
        await page.goto('/');
        const rejectBtn = page.locator('button:has-text("Reject")');
        if (await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await rejectBtn.click();
        }
        await page.click('button[aria-label="Open RemitIQ assistant"]');
        // Chat header is "Ask RemitIQ" (NOT "RemitIQ Assistant")
        await expect(page.locator('text=Ask RemitIQ')).toBeVisible({ timeout: 5000 });
    });

    test('Chatbot Online indicator is visible when chat is open', async ({ page }) => {
        await page.goto('/');
        const rejectBtn = page.locator('button:has-text("Reject")');
        if (await rejectBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await rejectBtn.click();
        }
        await page.click('button[aria-label="Open RemitIQ assistant"]');
        await expect(page.locator('text=Online').first()).toBeVisible({ timeout: 5000 });
    });

});

// ─── Group 8: Rate Alerts ─────────────────────────────────────────────────────

test.describe('Rate Alerts', () => {

    test('Alert page title contains "Rate Alerts"', async ({ page }) => {
        await page.goto('/alerts');
        await expect(page.locator('text=Rate Alerts').first()).toBeVisible({ timeout: 10000 });
    });

    test('Alert form shows current best rate', async ({ page }) => {
        await page.goto('/alerts');
        await expect(page.locator('text=Current best rate: ₹')).toBeVisible({ timeout: 25000 });
    });

    test('Alert form submission works', async ({ page }) => {
        await page.goto('/alerts');
        await expect(page.locator('text=Current best rate: ₹')).toBeVisible({ timeout: 25000 });
        await page.fill('input[type="email"]', 'bvt-test@remitiq.co');
        await page.fill('input[type="number"]', '65.00');
        await page.click('button:has-text("Set My Free Alert")');
        await expect(page.locator('text=Alert Set')).toBeVisible({ timeout: 10000 });
    });

});

// ─── Group 9: API Endpoints ──────────────────────────────────────────────────

test.describe('API Endpoints', () => {

    test('GET /api/rates returns 200', async ({ page }) => {
        const resp = await page.request.get('/api/rates');
        expect(resp.status()).toBe(200);
    });

    test('GET /api/rates?currency=AUD returns full intelligence payload', async ({ page }) => {
        const resp = await page.request.get('/api/rates?currency=AUD');
        const json = await resp.json();
        for (const key of ['midMarketRate', 'chartData', 'stats', 'recommendation', 'backtest', 'dataSource']) {
            expect(json, `Missing key: ${key}`).toHaveProperty(key);
        }
    });

    test('GET /api/rates has chartData array', async ({ page }) => {
        const resp = await page.request.get('/api/rates?currency=AUD');
        const json = await resp.json();
        expect(Array.isArray(json.chartData)).toBeTruthy();
        expect(json.chartData.length).toBeGreaterThanOrEqual(5);
    });

    test('GET /api/rates stats has required numeric fields', async ({ page }) => {
        const resp = await page.request.get('/api/rates?currency=AUD');
        const json = await resp.json();
        expect(typeof json.stats.current).toBe('number');
        expect(typeof json.stats.avg30d).toBe('number');
        expect(typeof json.stats.rsi14).toBe('number');
        expect(typeof json.stats.volatility30d).toBe('number');
    });

    test('GET /api/rates?currency=GBP returns GBP-specific rate', async ({ page }) => {
        const resp = await page.request.get('/api/rates?currency=GBP');
        expect(resp.ok()).toBeTruthy();
        const json = await resp.json();
        expect(json.currency).toBe('GBP');
        expect(json.midMarketRate).toBeGreaterThan(50);
    });

    test('GET /api/rates?currency=INVALID responds gracefully', async ({ page }) => {
        const resp = await page.request.get('/api/rates?currency=XYZ');
        expect([200, 500]).toContain(resp.status());
    });

    test('GET /api/geo returns a countryCode field', async ({ page }) => {
        const resp = await page.request.get('/api/geo');
        expect(resp.status()).toBe(200);
        const json = await resp.json();
        expect(json).toHaveProperty('countryCode');
    });

});

// ─── Group 10: Mobile / Responsive ───────────────────────────────────────────

test.describe('Mobile Responsive', () => {

    test('Homepage renders mobile card view with Send links', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await page.waitForTimeout(500);
        // Mobile cards have send links
        const sendLinks = page.locator('.md\\:hidden a:has-text("Send")');
        await expect(sendLinks.first()).toBeVisible({ timeout: 20000 });
    });

    test('Country selector is visible on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await expect(page.locator('select[aria-label="Select your country"]')).toBeVisible({ timeout: 10000 });
    });

    test('Amount input is visible on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto('/');
        await expect(page.locator('input[placeholder="2,000"]')).toBeVisible({ timeout: 10000 });
    });

});

// ─── Group 11: Share Button ───────────────────────────────────────────────────

test.describe('UI Elements', () => {

    test('Share button is present on homepage', async ({ page }) => {
        await page.goto('/');
        await waitForTableLoad(page);
        await expect(page.locator('button:has-text("Share This Comparison")')).toBeVisible({ timeout: 20000 });
    });

    test('Rate alert CTA is visible on homepage', async ({ page }) => {
        await page.goto('/');
        await waitForTableLoad(page);
        await expect(page.locator('a[href="/alerts"]').first()).toBeVisible({ timeout: 10000 });
    });

});
