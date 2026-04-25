/**
 * Playwright global teardown — runs once after the entire test suite.
 *
 * Deletes all test users created by globalSetup (via .test-state.json) and
 * any remaining e2e- prefixed users that individual fixture teardowns may have
 * missed (e.g. due to a test crash).
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { deleteTestUser, cleanupAllTestUsers } from './fixtures/supabase';
import { cleanupTestSupplier } from './helpers/cleanup';
import type { TestState } from './global-setup';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

const STATE_FILE = path.join(__dirname, '.test-state.json');
const JOURNEY_STATE_FILE = path.join(__dirname, '.journey-state.json');

export default async function globalTeardown(): Promise<void> {
  console.log('\n[global-teardown] Removing shared test users...');

  // Delete users created by globalSetup
  if (fs.existsSync(STATE_FILE)) {
    const state: TestState = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));

    await Promise.allSettled([
      deleteTestUser(state.verifiedSupplierId),
      deleteTestUser(state.unverifiedSupplierId),
      deleteTestUser(state.buyerId),
    ]);

    fs.unlinkSync(STATE_FILE);
    console.log('[global-teardown] Removed global test users.');
  }

  // Clean up the supplier-full-journey test user (created by beforeAll, not globalSetup)
  if (fs.existsSync(JOURNEY_STATE_FILE)) {
    const { supplierEmail } = JSON.parse(fs.readFileSync(JOURNEY_STATE_FILE, 'utf8'));
    if (supplierEmail) {
      console.log('[global-teardown] Removing journey test supplier:', supplierEmail);
      await cleanupTestSupplier(supplierEmail).catch((e: Error) =>
        console.warn('[global-teardown] Journey cleanup warning:', e.message),
      );
    }
    fs.unlinkSync(JOURNEY_STATE_FILE);
  }

  // Belt-and-suspenders: catch any per-test users whose fixture teardown was
  // skipped due to a test crash or forced termination.
  console.log('[global-teardown] Cleaning up any remaining e2e- users...');
  await cleanupAllTestUsers('e2e-');

  console.log('[global-teardown] Done.');
}
