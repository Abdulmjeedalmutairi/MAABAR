import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import * as dotenv from 'dotenv';

// Load .env.test so SUPABASE_SERVICE_ROLE_KEY and other secrets are available
// to globalSetup/globalTeardown without polluting the browser environment.
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  testDir: './e2e/tests',

  // Run tests serially — all specs share the same live Supabase project, so
  // parallel workers would step on each other's test data.
  fullyParallel: false,
  workers: 1,

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'e2e/report', open: 'never' }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    locale: 'en-US',
    // Prevent Vercel WAF (Code 10) from blocking the headless browser
    launchOptions: {
      args: ['--disable-blink-features=AutomationControlled'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use installed Chrome for real fingerprints (falls back to Chromium if absent)
        channel: 'chrome',
      },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    // Mobile Chrome 375px
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    // WebKit / Safari — run only @smoke-tagged tests to keep CI fast
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      grep: /@smoke/,
    },
  ],

  // Only start local dev server when NOT pointing at production
  ...(!(process.env.PLAYWRIGHT_BASE_URL ?? '').startsWith('https://') && {
    webServer: {
      command: 'npm start',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        DISABLE_ESLINT_PLUGIN: 'true',
        CI: 'false',
      },
    },
  }),

  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
});
