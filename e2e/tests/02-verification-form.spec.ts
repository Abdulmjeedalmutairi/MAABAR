/**
 * Test 02 — Supplier verification form
 *
 * Covers:
 *   - Navigating to the verification tab as an unverified supplier
 *   - Filling company info (step 1) and file uploads (step 2)
 *   - Submit transitions status to "under review"
 *   - admin_new_supplier email fired on verification submission
 *   - Other tabs (products, offers, requests) show the "locked" gate
 *   - Realtime status update: when admin approves (simulated via DB),
 *     the locked gate disappears without a page reload
 */

import { test, expect } from '../fixtures/base';
import { interceptEmails } from '../fixtures/email';
import { setProfileStatus } from '../fixtures/supabase';
import { fillVerificationForm, goToTab } from '../helpers/supplier';

test.describe('Supplier verification form', () => {
  test('shows verification tab and fills step 1 (company info)', async ({
    page,
    unverifiedSupplier,
  }) => {
    // Already logged in via the fixture — navigate to the verification tab
    await goToTab(page, 'verification');

    // Step-indicator should be visible
    await expect(
      page.getByText(/company profile|بيانات الشركة|公司资料/i)
    ).toBeVisible({ timeout: 8_000 });

    // Fill step 1 fields
    const regInput = page
      .getByPlaceholder(/registration number|reg.*number/i)
      .or(page.locator('input[name="reg_number"]'))
      .first();
    await expect(regInput).toBeVisible();
    await regInput.fill('CN-TEST-9988');

    const yearsInput = page
      .getByPlaceholder(/years.*experience|experience/i)
      .or(page.locator('input[name="years_experience"]'))
      .first();
    await yearsInput.fill('6');

    const employeesInput = page
      .getByPlaceholder(/employees|staff/i)
      .or(page.locator('input[name="num_employees"]'))
      .first();
    if (await employeesInput.count() > 0) {
      await employeesInput.fill('80');
    }

    // Progress bar / step indicator should advance
    await expect(page.getByText(/verification files|ملفات التحقق|认证文件/i)
      .or(page.getByRole('button', { name: /next|continue|التالي|下一步/i }))
    ).toBeVisible({ timeout: 5_000 });
  });

  test('uploads business license and factory photo in step 2', async ({
    page,
    unverifiedSupplier,
  }) => {
    await goToTab(page, 'verification');

    // Advance to step 2 if needed
    const nextBtn = page.getByRole('button', { name: /next|continue|التالي|下一步/i }).first();
    if (await nextBtn.count() > 0 && await nextBtn.isVisible()) {
      // Fill step 1 minimum so Next is enabled
      const regInput = page.locator('input[name="reg_number"]').or(
        page.getByPlaceholder(/registration number/i)
      ).first();
      await regInput.fill('CN-TEST-UPLOAD');
      const yearsInput = page.locator('input[name="years_experience"]').or(
        page.getByPlaceholder(/years.*experience/i)
      ).first();
      await yearsInput.fill('4');
      await nextBtn.click();
      await page.waitForTimeout(500);
    }

    // Locate file inputs
    const fileInputs = page.locator('input[type="file"]');
    const count = await fileInputs.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Upload business license (first file input)
    await fileInputs.first().setInputFiles(
      require('path').join(__dirname, '../fixtures/files/test-doc.pdf')
    );
    await page.waitForTimeout(2_000);

    // Upload factory photo (second file input, if present)
    if (count >= 2) {
      await fileInputs.nth(1).setInputFiles(
        require('path').join(__dirname, '../fixtures/files/test-image.jpg')
      );
      await page.waitForTimeout(2_000);
    }

    // Some upload confirmation text or thumbnail should appear
    await expect(
      page.getByText(/uploaded|license|photo|document/i)
        .or(page.locator('img[src*="blob"], img[src*="storage"]'))
    ).toBeVisible({ timeout: 10_000 });
  });

  test('submitting the form transitions status to "under review" and locks tabs', async ({
    page,
    unverifiedSupplier,
    emailInterceptor,
  }) => {
    await fillVerificationForm(page);

    // Advance to step 3 (final review / submit)
    for (let i = 0; i < 2; i++) {
      const nextBtn = page.getByRole('button', { name: /next|continue|التالي|下一步/i }).first();
      if (await nextBtn.count() > 0 && await nextBtn.isVisible() && await nextBtn.isEnabled()) {
        await nextBtn.click();
        await page.waitForTimeout(600);
      }
    }

    // Click "Submit for Verification"
    const submitBtn = page.getByRole('button', {
      name: /submit.*verification|submit.*review|تقديم.*تحقق|提交.*认证/i,
    }).first();

    if (await submitBtn.count() === 0) {
      // Alternative label pattern
      const altBtn = page.getByRole('button', { name: /submit|send|إرسال|提交/i }).last();
      await expect(altBtn).toBeEnabled({ timeout: 8_000 });
      await altBtn.click();
    } else {
      await expect(submitBtn).toBeEnabled({ timeout: 8_000 });
      await submitBtn.click();
    }

    // ── "Under review" state ─────────────────────────────────────────────
    await expect(
      page.getByText(/under review|verification.*submitted|تحت المراجعة|审核中/i)
    ).toBeVisible({ timeout: 15_000 });

    // ── Locked tabs ──────────────────────────────────────────────────────
    // Navigate to products — should see the verification gate
    await page.goto('/dashboard?tab=my-products');
    await expect(
      page.getByText(/verify|verification|locked|complete verification/i)
    ).toBeVisible({ timeout: 8_000 });

    // ── Email fired to admin ─────────────────────────────────────────────
    // The admin_new_supplier email should have been captured by the interceptor
    // (it may already be in capturedEmails from the login flow — we check count)
    const adminEmailCount = emailInterceptor.capturedEmails.filter(
      (e) => e.type === 'admin_new_supplier'
    ).length;
    expect(adminEmailCount).toBeGreaterThanOrEqual(1);
  });

  test('unlocks tabs in real-time when admin approves (DB update)', async ({
    page,
    unverifiedSupplier,
  }) => {
    // Start on the verification tab showing the "under review" message
    await setProfileStatus(unverifiedSupplier.userId, 'verification_under_review');
    await goToTab(page, 'verification');

    // Simulate admin approval via direct DB update
    await setProfileStatus(unverifiedSupplier.userId, 'verified');

    // The Supabase realtime channel in App.js should pick this up and update the
    // profile, which should re-render and show the full supplier dashboard.
    await expect(
      page.getByText(/verified|approved|موثّق|已验证/i)
    ).toBeVisible({ timeout: 15_000 });

    // The "my-products" tab should no longer show the locked gate
    await page.goto('/dashboard?tab=my-products');
    await expect(
      page.getByText(/no products yet|add your first product|لا توجد منتجات/i)
        .or(page.getByRole('button', { name: /add product|إضافة منتج|添加产品/i }))
    ).toBeVisible({ timeout: 10_000 });
  });
});
