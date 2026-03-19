import { defineConfig, devices } from '@playwright/test';

/**
 * Local development playwright config.
 * Targets localhost:3000 (the running Next.js dev server).
 * Chromium only for speed — use playwright.config.ts for cross-browser prod testing.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run sequentially so dev server isn't overwhelmed
  forbidOnly: !!process.env.CI,
  retries: 1, // One retry on local for transient API timeouts
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report-local' }], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Generous timeouts — dev server + external API calls can be slow
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
