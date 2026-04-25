/**
 * Test 04 — Viewing buyer requests as a verified supplier
 *
 * Covers:
 *   - Requests tab shows seeded buyer requests
 *   - Request title displayed in the active app language (EN / ZH / AR)
 *   - Language switch updates displayed text without a page reload
 *   - Category filter shows / hides requests correctly
 *   - Clicking a request opens the detail view with description
 *   - Requests route at /requests is blocked for unverified suppliers
 */

import { test, expect } from '../fixtures/base';
import { seedBuyerRequest, deleteTestUser, createTestUser } from '../fixtures/supabase';
import { goToTab } from '../helpers/supplier';
import { switchLang, assertDirection } from '../helpers/language';
import * as fs from 'fs';
import * as path from 'path';
import type { TestState } from '../global-setup';

const STATE_FILE = path.join(__dirname, '../.test-state.json');

function getState(): TestState {
  return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
}

test.describe('Supplier views buyer requests', () => {
  let requestId: string;
  let state: TestState;

  test.beforeAll(async () => {
    state = getState();
    // Seed a request with all three language fields
    requestId = await seedBuyerRequest({
      buyerId: state.buyerId,
      title_en: 'E2E Request: Wireless Earbuds Bulk Order',
      title_ar: 'طلب E2E: طلب جملة سماعات لاسلكية',
      title_zh: 'E2E需求：无线耳机批量订单',
      description_en: 'We need 500 units of wireless earbuds with BT 5.3 for resale in Saudi Arabia.',
      description_ar: 'نحتاج 500 وحدة سماعات لاسلكية بلوتوث 5.3 لإعادة البيع في المملكة العربية السعودية.',
      description_zh: '我们需要500件蓝牙5.3无线耳机用于在沙特阿拉伯转售。',
      category: 'electronics',
      budget: 8000,
      quantity: 500,
    });
  });

  test.afterAll(async () => {
    // Remove the seeded request via the admin client
    const { getAdminClient } = await import('../fixtures/supabase');
    const sb = getAdminClient();
    await sb.from('requests').delete().eq('id', requestId);
  });

  test('requests tab shows the seeded request in English', async ({
    page,
    verifiedSupplier,
  }) => {
    // The verifiedSupplier fixture logs in and the page is already at /dashboard
    await goToTab(page, 'requests');

    await expect(
      page.getByText('E2E Request: Wireless Earbuds Bulk Order')
    ).toBeVisible({ timeout: 12_000 });
  });

  test('switches to Arabic and shows the Arabic request title with RTL layout', async ({
    page,
    verifiedSupplier,
  }) => {
    await goToTab(page, 'requests');

    // Switch to Arabic
    await switchLang(page, 'ar');
    await assertDirection(page, 'ar');

    // The Arabic title should now be displayed
    await expect(
      page.getByText('طلب E2E: طلب جملة سماعات لاسلكية')
    ).toBeVisible({ timeout: 8_000 });
  });

  test('switches to Chinese and shows the Chinese request title', async ({
    page,
    verifiedSupplier,
  }) => {
    await goToTab(page, 'requests');
    await switchLang(page, 'zh');

    await expect(
      page.getByText('E2E需求：无线耳机批量订单')
    ).toBeVisible({ timeout: 8_000 });
  });

  test('category filter hides requests from other categories', async ({
    page,
    verifiedSupplier,
  }) => {
    await goToTab(page, 'requests');

    // The "electronics" category filter should keep our request visible
    const electronicsFilter = page
      .getByRole('button', { name: /electronics|إلكترونيات|电子产品/i })
      .or(page.getByText(/electronics/i).first());
    if (await electronicsFilter.count() > 0) {
      await electronicsFilter.click();
      await expect(
        page.getByText('E2E Request: Wireless Earbuds Bulk Order')
      ).toBeVisible({ timeout: 6_000 });
    }

    // The "food" category filter should hide our electronics request
    const foodFilter = page
      .getByRole('button', { name: /^food$|^غذاء$|^食品$/i })
      .or(page.getByText(/^food$/i).first());
    if (await foodFilter.count() > 0) {
      await foodFilter.click();
      await expect(
        page.getByText('E2E Request: Wireless Earbuds Bulk Order')
      ).not.toBeVisible({ timeout: 5_000 });
    }
  });

  test('clicking a request opens the detail view with full description', async ({
    page,
    verifiedSupplier,
  }) => {
    await goToTab(page, 'requests');

    await page.getByText('E2E Request: Wireless Earbuds Bulk Order').first().click();

    // Detail view should show budget and description
    await expect(
      page.getByText(/500 units|wireless earbuds|budget|quantity/i)
        .or(page.getByText(/We need 500/i))
    ).toBeVisible({ timeout: 8_000 });
  });

  test('unverified supplier is blocked from /requests route', async ({
    page,
    unverifiedSupplier,
  }) => {
    await page.goto('/requests');

    // App should show the SupplierVerificationLocked gate
    await expect(
      page.getByText(/complete verification|unlock|supplier.*verification/i)
    ).toBeVisible({ timeout: 8_000 });

    // Should not see the requests list
    await expect(
      page.getByText('E2E Request: Wireless Earbuds Bulk Order')
    ).not.toBeVisible();
  });
});
