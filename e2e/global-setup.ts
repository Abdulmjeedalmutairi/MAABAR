/**
 * Playwright global setup — runs once before the entire test suite.
 *
 * Creates long-lived test accounts shared across specs.
 * Writes IDs to e2e/.test-state.json so globalTeardown and specs can reuse them.
 *
 * NOTE: if shared-user creation fails (e.g. profile RLS policy blocks upsert),
 * setup logs a warning and proceeds — the supplier-full-journey spec creates
 * its own users independently and does not depend on these.
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createTestUser, cleanupAllTestUsers } from './fixtures/supabase';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

export interface TestState {
  verifiedSupplierId: string;
  verifiedSupplierEmail: string;
  verifiedSupplierPassword: string;
  unverifiedSupplierId: string;
  unverifiedSupplierEmail: string;
  unverifiedSupplierPassword: string;
  buyerId: string;
  buyerEmail: string;
  buyerPassword: string;
}

const STATE_FILE = path.join(__dirname, '.test-state.json');
const PASSWORD = 'E2eTestPass@9871!';

export default async function globalSetup(): Promise<void> {
  console.log('\n[global-setup] Cleaning up any leftover e2e-global- test users...');
  await cleanupAllTestUsers('e2e-global-').catch((e: Error) =>
    console.warn('[global-setup] Cleanup warning:', e.message)
  );

  console.log('[global-setup] Creating shared test users...');
  const ts = Date.now();

  const verifiedSupplierEmail   = `e2e-global-sup-verified-${ts}@maabar-test.io`;
  const unverifiedSupplierEmail = `e2e-global-sup-unverified-${ts}@maabar-test.io`;
  const buyerEmail              = `e2e-global-buyer-${ts}@maabar-test.io`;

  try {
    const [verifiedSupplierId, unverifiedSupplierId, buyerId] = await Promise.all([
      createTestUser({
        email: verifiedSupplierEmail,
        password: PASSWORD,
        role: 'supplier',
        status: 'verified',
        profile: {
          company_name: 'E2E Global Verified Supplier',
          country: 'China',
          city: 'Guangzhou',
          trade_link: 'https://1688.com/e2e-test',
          trade_links: ['https://1688.com/e2e-test'],
          lang: 'en',
          reg_number: 'E2E-REG-001',
          years_experience: 8,
          num_employees: 120,
          license_photo: 'test/license-placeholder.jpg',
          factory_photo: 'test/factory-placeholder.jpg',
          wechat: 'e2e_wechat_test',
          whatsapp: '+861234567890',
        },
      }),
      createTestUser({
        email: unverifiedSupplierEmail,
        password: PASSWORD,
        role: 'supplier',
        status: 'verification_required',
        profile: {
          company_name: 'E2E Global Unverified Supplier',
          country: 'China',
          city: 'Shenzhen',
          trade_link: 'https://alibaba.com/e2e-test',
          trade_links: ['https://alibaba.com/e2e-test'],
          lang: 'en',
        },
      }),
      createTestUser({
        email: buyerEmail,
        password: PASSWORD,
        role: 'buyer',
        status: 'active',
        profile: {
          full_name: 'E2E Test Buyer',
          city: 'Riyadh',
          phone: '+966500000001',
          lang: 'en',
        },
      }),
    ]);

    const state: TestState = {
      verifiedSupplierId,
      verifiedSupplierEmail,
      verifiedSupplierPassword: PASSWORD,
      unverifiedSupplierId,
      unverifiedSupplierEmail,
      unverifiedSupplierPassword: PASSWORD,
      buyerId,
      buyerEmail,
      buyerPassword: PASSWORD,
    };

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log('[global-setup] Test state written to', STATE_FILE);
  } catch (err: unknown) {
    console.warn(
      '[global-setup] WARNING: Could not create shared test users:',
      (err as Error).message,
      '\nThis is OK if only running supplier-full-journey.spec.ts.',
    );
  }

  console.log('[global-setup] Done.');
}
