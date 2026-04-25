/**
 * Admin login helper for production E2E tests.
 * Uses the Supabase Admin API to generate a magic link (bypasses password).
 */

import { Page, BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const PROD = 'https://maabar.io';
const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co';

/**
 * Log in as admin using a magic link generated server-side (no password needed).
 * Sets maabar_preview bypass and navigates to /admin/suppliers.
 */
export async function loginAdmin(page: Page): Promise<void> {
  const email = process.env.MAABAR_ADMIN_EMAIL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!email) {
    throw new Error('MAABAR_ADMIN_EMAIL must be set in .env.test');
  }
  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY must be set in .env.test');
  }

  // Generate a magic link server-side — no email sent, no password required
  const sbAdmin = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await sbAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: `${PROD}/auth/callback` },
  });

  if (error) throw new Error(`Admin magic link failed: ${error.message}`);

  const magicLink = (data as { properties: { action_link: string } }).properties.action_link;

  // Set preview bypass before navigating the magic link
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  await page.goto(PROD);
  await page.evaluate(() => localStorage.setItem('maabar_preview', '1'));

  // Follow the magic link → Supabase redirects to /auth/callback → /dashboard or /admin
  await page.goto(magicLink);
  await page.waitForURL(/(\/auth\/callback|\/dashboard|\/admin)/, { timeout: 30_000 });

  if (page.url().includes('/auth/callback')) {
    await page.waitForURL(/(\/dashboard|\/admin)/, { timeout: 20_000 });
  }

  // Set preview bypass again (it may have been cleared by the redirect)
  await page.evaluate(() => localStorage.setItem('maabar_preview', '1'));

  // Navigate to admin suppliers panel
  await page.goto(`${PROD}/admin/suppliers`);
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
}

/**
 * Create a fresh admin browser context with auth injected.
 * Returns the page — caller is responsible for closing the context.
 */
export async function createAdminContext(
  browser: import('@playwright/test').Browser,
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginAdmin(page);
  return { context, page };
}
