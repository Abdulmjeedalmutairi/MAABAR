/**
 * Extended Playwright test fixture.
 *
 * Imports all custom fixtures and wires them together into a single
 * `test` export that specs should import instead of `@playwright/test`.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/base';
 */

import { test as base, expect } from '@playwright/test';
import { interceptEmails, EmailInterceptor } from './email';
import { getAdminClient, createTestUser, setProfileStatus, deleteTestUser } from './supabase';
import { uiLoginSupplier, uiLoginBuyer } from './auth';

// ─── Fixture types ────────────────────────────────────────────────────────

interface EmailFixture {
  emailInterceptor: EmailInterceptor;
}

interface SupplierFixture {
  /** A pre-confirmed, unverified (status=verification_required) supplier */
  unverifiedSupplier: { userId: string; email: string; password: string };
  /** A pre-confirmed, verified (status=verified) supplier, already logged in */
  verifiedSupplier: { userId: string; email: string; password: string };
}

interface BuyerFixture {
  /** A pre-confirmed active buyer, already logged in */
  activeBuyer: { userId: string; email: string; password: string };
}

type AllFixtures = EmailFixture & SupplierFixture & BuyerFixture;

// ─── Extended test ────────────────────────────────────────────────────────

export const test = base.extend<AllFixtures>({
  // ── Email interceptor ──────────────────────────────────────────────────
  emailInterceptor: async ({ page }, use) => {
    const interceptor = await interceptEmails(page);
    await use(interceptor);
  },

  // ── Unverified supplier ────────────────────────────────────────────────
  // Created fresh for each test, cleaned up in teardown.
  unverifiedSupplier: async ({ page }, use) => {
    const ts = Date.now();
    const email = `e2e-sup-unverified-${ts}@maabar-test.io`;
    const password = 'TestPass@1234!';

    const userId = await createTestUser({
      email,
      password,
      role: 'supplier',
      status: 'verification_required',
      profile: {
        company_name: `E2E Supplier ${ts}`,
        country: 'China',
        city: 'Shenzhen',
        trade_link: 'https://example.com/shop',
        trade_links: ['https://example.com/shop'],
        lang: 'en',
      },
    });

    await uiLoginSupplier(page, email, password);

    await use({ userId, email, password });

    // Teardown
    await deleteTestUser(userId).catch(() => {/* best-effort */});
  },

  // ── Verified supplier ──────────────────────────────────────────────────
  verifiedSupplier: async ({ page }, use) => {
    const ts = Date.now();
    const email = `e2e-sup-verified-${ts}@maabar-test.io`;
    const password = 'TestPass@1234!';

    const userId = await createTestUser({
      email,
      password,
      role: 'supplier',
      status: 'verified',
      profile: {
        company_name: `E2E Verified Supplier ${ts}`,
        country: 'China',
        city: 'Guangzhou',
        trade_link: 'https://example.com/verified-shop',
        trade_links: ['https://example.com/verified-shop'],
        lang: 'en',
        reg_number: 'TEST-REG-001',
        years_experience: 5,
        num_employees: 50,
        license_photo: 'test/license-placeholder.jpg',
        factory_photo: 'test/factory-placeholder.jpg',
      },
    });

    await uiLoginSupplier(page, email, password);

    await use({ userId, email, password });

    await deleteTestUser(userId).catch(() => {/* best-effort */});
  },

  // ── Active buyer ───────────────────────────────────────────────────────
  activeBuyer: async ({ page }, use) => {
    const ts = Date.now();
    const email = `e2e-buyer-${ts}@maabar-test.io`;
    const password = 'TestPass@1234!';

    const userId = await createTestUser({
      email,
      password,
      role: 'buyer',
      status: 'active',
      profile: {
        full_name: `E2E Buyer ${ts}`,
        city: 'Riyadh',
        phone: '+966500000000',
        lang: 'en',
      },
    });

    await uiLoginBuyer(page, email, password);

    await use({ userId, email, password });

    await deleteTestUser(userId).catch(() => {/* best-effort */});
  },
});

export { expect };
