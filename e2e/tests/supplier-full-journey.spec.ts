/**
 * supplier-full-journey.spec.ts
 *
 * Complete end-to-end validation of the Maabar supplier journey on PRODUCTION.
 * Runs against https://maabar.io — no mocking, no stubbing.
 *
 * Prerequisites:
 *   - .env.test contains SUPABASE_SERVICE_ROLE_KEY, MAABAR_ADMIN_EMAIL, MAABAR_ADMIN_PASSWORD
 *   - Playwright installed: npx playwright install chromium
 *
 * Scenarios (run serially, each is an isolated test()):
 *   1. Chinese supplier signup at /supplier-access
 *   2. Email confirmation + dashboard access
 *   3. Fill Step 1 — company profile
 *   4. Upload Step 2 — verification files + submit
 *   5. Post-submission emails
 *   6. Admin approval flow
 *   7. Post-approval email to supplier
 */

import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';
import {
  createMailTmInbox,
  pollForEmail,
  getMessages,
  getMessageDetail,
} from '../helpers/mail-tm';
import type { MailTmAccount } from '../helpers/mail-tm';
import { createAdminContext } from '../helpers/admin-login';
import { cleanupTestSupplier, verifyAuditLogEntry, queryEmailLogs } from '../helpers/cleanup';

dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

// ─── Constants ────────────────────────────────────────────────────────────────

const PROD            = 'https://maabar.io';
const SUPABASE_URL    = 'https://utzalmszfqfcofywfetv.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.' +
  'SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const PASSWORD = 'Test12345!';
const FIXTURES = path.join(__dirname, '../fixtures/files');

// ─── Shared state between serial tests ───────────────────────────────────────

let mailInbox: MailTmAccount;
let supplierEmail: string;
let activationLink: string;
let supplierUserId: string;
let lastEmailTimestamp: string;   // ISO timestamp — used to detect NEW emails in later scenarios

// ─── Auth helpers ─────────────────────────────────────────────────────────────

/**
 * Inject a Supabase session directly into localStorage + set preview bypass.
 * Avoids driving the login UI for scenarios that don't need to test it.
 */
async function signInAsSupplier(page: Page): Promise<void> {
  if (!supplierEmail) throw new Error('supplierEmail not set — Scenario 1 must run first');

  await page.goto(PROD);

  const session = await page.evaluate(
    async ({ url, key, email, password }) => {
      const res = await fetch(`${url}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      return res.json();
    },
    { url: SUPABASE_URL, key: SUPABASE_ANON_KEY, email: supplierEmail, password: PASSWORD },
  );

  if (!session?.access_token) {
    throw new Error(`signInAsSupplier: Supabase auth failed — ${JSON.stringify(session)}`);
  }

  await page.evaluate(
    (sess) => {
      localStorage.setItem('sb-utzalmszfqfcofywfetv-auth-token', JSON.stringify(sess));
      localStorage.setItem('maabar_preview', '1');
    },
    session,
  );
}

async function goToDashboard(page: Page): Promise<void> {
  await signInAsSupplier(page);
  await page.goto(`${PROD}/dashboard`);
  // Wait for React to load the supplier dashboard (not ComingSoon or BrandedLoading)
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
  await expect(page).not.toHaveURL(/login|auth\/callback/, { timeout: 10_000 });
}

// ─── Locator helpers ──────────────────────────────────────────────────────────

/** Find an input/select inside the same container as a label with given text. */
function fieldByLabel(page: Page, labelText: string) {
  return page
    .locator(`div:has(label:text("${labelText}")) input, div:has(label:text("${labelText}")) select, div:has(label:text("${labelText}")) textarea`)
    .first();
}

// ─── Test suite ───────────────────────────────────────────────────────────────

test.describe.serial('Supplier full journey — production', () => {
  test.use({ baseURL: PROD });

  // Set countdown bypass before every test — harmless for supplier-access (it doesn't gate)
  test.beforeEach(async ({ page }) => {
    await page.goto(PROD);
    await page.evaluate(() => localStorage.setItem('maabar_preview', '1'));
  });

  test.beforeAll(async () => {
    // Create mail.tm inbox BEFORE signup so no emails are missed
    mailInbox = await createMailTmInbox();
    supplierEmail = mailInbox.address;
    console.log(`[journey] Supplier email: ${supplierEmail}`);
  });

  test.afterAll(async () => {
    if (supplierEmail) {
      await cleanupTestSupplier(supplierEmail);
    }
  });

  // ── Scenario 1 ─────────────────────────────────────────────────────────────

  test('Scenario 1 — Chinese supplier signup at /supplier-access', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Navigate directly — /supplier-access is always open, no bypass needed
    await page.goto(`${PROD}/supplier-access`);
    await expect(page).toHaveURL(/supplier-access/, { timeout: 15_000 });

    // ── Assert Chinese is the default language ─────────────────────────────
    await expect(page.getByText('创始供应商计划')).toBeVisible({ timeout: 10_000 });

    // ── Assert Maabar trilingual logo ──────────────────────────────────────
    // BrandLogo renders MAABAR, مَعبر, and 迈巴尔 in the Navbar
    await expect(page.getByText('MAABAR', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('迈巴尔', { exact: true }).first()).toBeVisible();

    // ── Click APPLY NOW CTA ────────────────────────────────────────────────
    await page.getByRole('button', { name: '立即申请 →' }).click();

    // ── Now on the signup form ─────────────────────────────────────────────
    await page.waitForURL(/login\/supplier/, { timeout: 12_000 });
    await expect(page.getByRole('button', { name: /提交供应商申请|Submit supplier application/i })).toBeVisible({ timeout: 8_000 });

    // ── Fill email + password ──────────────────────────────────────────────
    await page.getByPlaceholder(/电子邮件|Email/i).first().fill(supplierEmail);
    await page.locator('input[type="password"]').first().fill(PASSWORD);

    // ── Fill company name ─────────────────────────────────────────────────
    await page.locator('input[autocomplete="organization"]').fill('深圳华兴电子有限公司');

    // ── Fill city ─────────────────────────────────────────────────────────
    await page.locator('input[placeholder="广州"], input[placeholder="Guangzhou"]').fill('深圳');

    // ── Fill country ───────────────────────────────────────────────────────
    await page.locator('input[placeholder="中国 / China"], input[placeholder="China"]').fill('China');

    // ── Fill speciality (select) ───────────────────────────────────────────
    await page.locator('select').filter({
      has: page.locator('option[value="electronics"]'),
    }).selectOption('electronics');

    // ── Fill trade link ────────────────────────────────────────────────────
    await page.locator('textarea').first().fill('https://huaxing.en.alibaba.com');

    // ── Fill WeChat ────────────────────────────────────────────────────────
    await page.locator('input[placeholder="WeChat ID"]').fill('huaxing_test');

    // ── Fill WhatsApp ─────────────────────────────────────────────────────
    await page.locator('input[placeholder="+..."]').fill('+8613800000000');

    // ── Accept terms checkbox ──────────────────────────────────────────────
    const checkbox = page.getByRole('checkbox');
    if (await checkbox.count() > 0) {
      await checkbox.first().check();
    } else {
      // Styled label click fallback
      const termsLabel = page.locator('label').filter({ hasText: /agree|الشروط|同意/i }).first();
      if (await termsLabel.count() > 0) await termsLabel.click();
    }

    // ── Submit ─────────────────────────────────────────────────────────────
    await page.getByRole('button', { name: /提交供应商申请|Submit supplier application/i }).click();
    // Wait for the network request to settle before asserting success state
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});
    // Log any visible error messages to help diagnose failures
    const errText = await page.locator('[style*="color: rgb(192, 57, 43)"], [style*="color:#c0392b"], [style*="error"]').first().textContent().catch(() => '');
    if (errText) console.log('[Scenario 1] Form error visible:', errText);
    console.log('[Scenario 1] Page URL after submit:', page.url());
    console.log('[Scenario 1] Console errors so far:', consoleErrors.join(' | '));

    // ── Assert confirmation message ────────────────────────────────────────
    await expect(
      page.getByText(/我们已收到您的供应商申请|Your supplier application was received|تم استلام طلب المورد/),
    ).toBeVisible({ timeout: 20_000 });

    // ── Assert no critical console errors (allow 409 duplicate-profile conflicts) ──
    const critical = consoleErrors.filter(
      (e) =>
        !e.includes('ResizeObserver') &&
        !e.includes('favicon') &&
        !e.includes('_next') &&
        !e.includes('409') &&    // profile INSERT conflict when trigger already created row
        !e.includes('23505'),    // duplicate key from same trigger race
    );
    expect(critical, `Console errors:\n${critical.join('\n')}`).toHaveLength(0);

    // ── Poll mail.tm for confirmation email (max 60s) ──────────────────────
    const confirmMsg = await pollForEmail(mailInbox.token, {
      maxWaitMs: 60_000,
      intervalMs: 4_000,
      filter: (m) =>
        m.from.address.includes('maabar.io') ||
        m.from.address.includes('supabase') ||
        m.subject.toLowerCase().includes('confirm') ||
        /[\u4e00-\u9fff]/.test(m.subject),
    });

    // ── Assert exactly ONE email ───────────────────────────────────────────
    const allInbox = await getMessages(mailInbox.token);
    expect(allInbox.length, 'Expected exactly 1 confirmation email, not 2+').toBe(1);

    // ── Assert sender ──────────────────────────────────────────────────────
    expect(confirmMsg.from.address, 'Sender should be hello@maabar.io').toBe('hello@maabar.io');

    // ── Fetch full HTML body ───────────────────────────────────────────────
    const fullMsg = await getMessageDetail(mailInbox.token, confirmMsg.id);
    const htmlBody = (fullMsg.html?.[0] ?? fullMsg.text) || '';

    // ── Assert Maabar logo from Supabase storage ──────────────────────────
    expect(
      htmlBody,
      'Email body should contain a Supabase storage logo URL',
    ).toContain('supabase.co/storage');

    // ── Assert Chinese CTA button text ─────────────────────────────────────
    expect(
      htmlBody,
      'Email CTA should say "激活账户"',
    ).toContain('激活账户');

    // ── Assert Chinese content ─────────────────────────────────────────────
    expect(htmlBody, 'Email should be in Chinese').toMatch(/[\u4e00-\u9fff]/);

    // ── Extract activation link ────────────────────────────────────────────
    // Supabase auth link: https://{ref}.supabase.co/auth/v1/verify?...
    // OR custom redirect:  https://maabar.io/auth/callback?...
    const linkPatterns = [
      /href="(https:\/\/utzalmszfqfcofywfetv\.supabase\.co\/auth\/v1\/verify[^"]+)"/,
      /href="(https:\/\/maabar\.io\/auth\/callback[^"]+)"/,
      /(https:\/\/utzalmszfqfcofywfetv\.supabase\.co\/auth\/v1\/verify[^\s"<>]+)/,
      /(https:\/\/maabar\.io\/auth\/callback[^\s"<>]+)/,
    ];

    for (const pattern of linkPatterns) {
      const match = htmlBody.match(pattern);
      if (match) {
        activationLink = match[1].replace(/&amp;/g, '&');
        break;
      }
    }

    expect(activationLink, 'No activation link found in email body').toBeTruthy();
    console.log(`[Scenario 1] Activation link found: ${activationLink.slice(0, 80)}…`);

    // Save timestamp for "new emails" detection in Scenario 5
    lastEmailTimestamp = confirmMsg.createdAt;
  });

  // ── Scenario 2 ─────────────────────────────────────────────────────────────

  test('Scenario 2 — Email confirmation + dashboard access', async ({ page }) => {
    expect(activationLink, 'activationLink must be set from Scenario 1').toBeTruthy();

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      const txt = msg.text();
      consoleErrors.push(txt);
    });

    // Set preview bypass FIRST, then navigate to the activation link
    await page.goto(PROD);
    await page.evaluate(() => localStorage.setItem('maabar_preview', '1'));

    // ── Navigate to activation link ────────────────────────────────────────
    await page.goto(activationLink);

    // Supabase may redirect through /auth/callback → /dashboard
    await page.waitForURL(/(\/auth\/callback|\/dashboard)/, { timeout: 30_000 });

    if (page.url().includes('/auth/callback')) {
      await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
    }

    // ── Assert we're on /dashboard ─────────────────────────────────────────
    expect(page.url()).toContain('/dashboard');

    // ── Assert dashboard loads (not loading spinner, not ComingSoon) ───────
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    await expect(page.locator('body')).not.toContainText('Opening soon', { timeout: 5_000 });

    // ── Assert Chinese language ────────────────────────────────────────────
    // The supplier signed up with lang=zh, so dashboard should be Chinese
    await expect(
      page.getByText(/公司资料|认证|供应商/),
    ).toBeVisible({ timeout: 10_000 });

    // ── Assert Step 1 is shown (NOT Step 2) ───────────────────────────────
    // A freshly confirmed supplier should land on company profile (step 1)
    await expect(page.getByText('公司资料')).toBeVisible({ timeout: 8_000 });
    // Step 2 heading should NOT be visible
    const step2Heading = page.getByText('认证文件', { exact: true });
    await expect(step2Heading).not.toBeVisible();

    // ── Assert no "sendMaabarEmail is not defined" errors ─────────────────
    const criticalErrors = consoleErrors.filter(
      (e) =>
        e.includes('sendMaabarEmail is not defined') ||
        e.includes('sendMaabarEmail') ||
        (e.includes('ReferenceError') && e.includes('defined')),
    );
    expect(criticalErrors, 'sendMaabarEmail must not be undefined').toHaveLength(0);

    // ── Assert no console.trace spam ──────────────────────────────────────
    const traceLogs = consoleErrors.filter((e) => e.startsWith('Trace:'));
    expect(traceLogs, 'No console.trace output expected').toHaveLength(0);

    // ── Capture supplier user ID for cleanup ──────────────────────────────
    supplierUserId = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((k) =>
        k.startsWith('sb-') && k.endsWith('-auth-token'),
      );
      if (!key) return '';
      try {
        const sess = JSON.parse(localStorage.getItem(key) ?? '{}');
        return sess.user?.id ?? '';
      } catch {
        return '';
      }
    });
    console.log(`[Scenario 2] Supplier user ID: ${supplierUserId}`);
  });

  // ── Scenario 3 ─────────────────────────────────────────────────────────────

  test('Scenario 3 — Fill Step 1 (company profile)', async ({ page }) => {
    const networkErrors: Array<{ url: string; status: number }> = [];
    page.on('response', (res) => {
      if (res.status() >= 400 && res.url().includes('supabase.co')) {
        networkErrors.push({ url: res.url(), status: res.status() });
      }
    });

    await goToDashboard(page);

    // ── Fill Company Name ──────────────────────────────────────────────────
    await expect(page.getByText('公司资料')).toBeVisible({ timeout: 10_000 });

    const companyInput = page.locator('input.vf-input').first();
    await companyInput.clear();
    await companyInput.fill('深圳华兴电子有限公司');

    // ── Fill City ─────────────────────────────────────────────────────────
    await fieldByLabel(page, '城市 *').fill('深圳');

    // ── Fill Country ──────────────────────────────────────────────────────
    await fieldByLabel(page, '国家 *').fill('China');

    // ── Fill Specialty (select) ────────────────────────────────────────────
    await page.locator('select.vf-select').first().selectOption('electronics');

    // ── Fill WeChat ────────────────────────────────────────────────────────
    await fieldByLabel(page, 'WeChat *').fill('huaxing_e2e');

    // ── Fill Trade link ────────────────────────────────────────────────────
    await fieldByLabel(page, '店铺链接 *').fill('https://huaxing.en.alibaba.com');

    // ── Fill WhatsApp (optional) ───────────────────────────────────────────
    const whatsappInput = fieldByLabel(page, 'WhatsApp');
    if (await whatsappInput.count() > 0) {
      await whatsappInput.fill('+8613800000000');
    }

    // ── Click "Save and continue to Step 2" ───────────────────────────────
    await page.getByRole('button', { name: /保存并进入第 2 步|Save and continue to step 2/i }).click();

    // ── Assert success banner ─────────────────────────────────────────────
    await expect(
      page.getByText(/公司资料|已保存|保存成功/i).or(page.locator('.vf-fi').filter({ hasText: /保存|成功/ })),
    ).toBeVisible({ timeout: 10_000 });

    // ── Assert UI advances to Step 2 within 3 seconds ────────────────────
    await expect(page.getByText('认证文件')).toBeVisible({ timeout: 5_000 });

    // ── Assert no 400 errors on the PATCH /profiles call ─────────────────
    const patchErrors = networkErrors.filter((e) => e.url.includes('/profiles') && e.status === 400);
    expect(patchErrors, `400 error on profiles PATCH: ${JSON.stringify(patchErrors)}`).toHaveLength(0);

    // ── Refresh and assert data persisted on Step 2 ───────────────────────
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    // After reload, the saved draft should restore to step 2
    await expect(page.getByText('认证文件')).toBeVisible({ timeout: 10_000 });
    // Company name should be persisted
    await expect(page.getByText('深圳华兴电子有限公司')).toBeVisible({ timeout: 8_000 });
  });

  // ── Scenario 4 ─────────────────────────────────────────────────────────────

  test('Scenario 4 — Upload Step 2 (verification files + submit)', async ({ page }) => {
    await goToDashboard(page);

    // ── Ensure we're on Step 2 ─────────────────────────────────────────────
    // After Scenario 3, dashboard should restore to Step 2
    await expect(page.getByText('认证文件')).toBeVisible({ timeout: 15_000 });

    // ── Fill reg number ────────────────────────────────────────────────────
    const regInput = page.locator('input.vf-input[dir="ltr"]').first();
    await expect(regInput).toBeVisible({ timeout: 8_000 });
    await regInput.fill('CN-91440300-TEST');

    // ── Fill years of experience ───────────────────────────────────────────
    await page.locator('input[type="number"].vf-input').first().fill('8');

    // ── Upload license file (PDF) ──────────────────────────────────────────
    const licenseInput = page.locator('input[type="file"][accept*="pdf"], input[type="file"][accept*="image/*,.pdf"]').first();
    await expect(licenseInput).toBeAttached({ timeout: 8_000 });
    await licenseInput.setInputFiles(path.join(FIXTURES, 'supplier-license.pdf'));

    // Wait for upload to complete (spinner disappears, success row appears)
    await expect(
      page.getByText(/营业执照 — 已上传|License — uploaded/i),
    ).toBeVisible({ timeout: 30_000 });

    // ── Assert no auto-submission after license upload ────────────────────
    await expect(page.getByText(/认证资料正在审核中|Under Review/i)).not.toBeVisible();

    // ── Upload factory photos (3 JPGs) ─────────────────────────────────────
    const factoryImageInput = page.locator('input[type="file"][accept*="image/*"]').last();
    await expect(factoryImageInput).toBeAttached({ timeout: 5_000 });
    await factoryImageInput.setInputFiles([
      path.join(FIXTURES, 'factory-1.jpg'),
      path.join(FIXTURES, 'factory-2.jpg'),
      path.join(FIXTURES, 'factory-3.jpg'),
    ]);

    await expect(page.getByText(/图片 1|Image 1/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/图片 2|Image 2/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/图片 3|Image 3/i)).toBeVisible({ timeout: 10_000 });

    // ── Assert no auto-submission after images ────────────────────────────
    await expect(page.getByText(/认证资料正在审核中|Under Review/i)).not.toBeVisible();

    // ── Upload factory video ───────────────────────────────────────────────
    const videoInput = page.locator('input[type="file"][accept*="video"]').first();
    await expect(videoInput).toBeAttached({ timeout: 5_000 });
    await videoInput.setInputFiles(path.join(FIXTURES, 'factory-video.mp4'));

    await expect(
      page.getByText(/工厂视频 — 已上传|Factory video — uploaded/i),
    ).toBeVisible({ timeout: 30_000 });

    // ── Assert still NOT auto-submitted ───────────────────────────────────
    await expect(page.getByText(/认证资料正在审核中|Under Review/i)).not.toBeVisible();

    // ── Click "Next: Final Review" ─────────────────────────────────────────
    await page.getByRole('button', { name: /下一步：最终确认|Next: Final review/i }).click();
    await expect(page.getByText(/最终确认|Final Review/i)).toBeVisible({ timeout: 8_000 });

    // ── Click "Submit Verification Request" ───────────────────────────────
    await page.getByRole('button', { name: /提交认证申请|Submit verification request/i }).click();

    // ── Assert "Under Review" screen appears in Chinese ────────────────────
    await expect(
      page.getByText(/认证资料正在审核中|审核中/i),
    ).toBeVisible({ timeout: 20_000 });

    // ── Assert 4-step badges: first 3 show green ✓, 4th shows review dot ──
    // VfStepBadges renders with currentState="review"
    // Steps 01-03 are in 'done' state (green), step 04 is in 'review' (amber)
    await expect(page.getByText('账户')).toBeVisible();
    await expect(page.getByText('资料')).toBeVisible();
    await expect(page.getByText('认证')).toBeVisible();
    await expect(page.getByText('审核')).toBeVisible();

    // Steps 01, 02, 03 should have the done styling (green VfChk checkmark)
    const doneBadges = page.locator('.vf-step-badge').filter({
      has: page.locator('[style*="3D6B4F"]'),    // green color = done
    });
    await expect(doneBadges).toHaveCount(3, { timeout: 5_000 });
  });

  // ── Scenario 5 ─────────────────────────────────────────────────────────────

  test('Scenario 5 — Post-submission emails', async () => {
    // ── Poll mail.tm for supplier_application_received email ───────────────
    const appReceivedMsg = await pollForEmail(mailInbox.token, {
      maxWaitMs: 60_000,
      intervalMs: 4_000,
      newerThan: lastEmailTimestamp,
      filter: (m) =>
        m.from.address.includes('maabar.io') &&
        (m.subject.includes('收到') ||
          m.subject.toLowerCase().includes('received') ||
          m.subject.toLowerCase().includes('review') ||
          /[\u4e00-\u9fff]/.test(m.subject)),
    });

    // ── Assert exactly ONE new email (not duplicate) ───────────────────────
    const allMsgs = await getMessages(mailInbox.token);
    const newMsgs = allMsgs.filter(
      (m) => new Date(m.createdAt) > new Date(lastEmailTimestamp),
    );
    expect(
      newMsgs.length,
      `Expected exactly 1 post-submission email, got ${newMsgs.length}. Subjects: ${newMsgs.map((m) => m.subject).join(', ')}`,
    ).toBe(1);

    // ── Fetch full body ────────────────────────────────────────────────────
    const fullMsg = await getMessageDetail(mailInbox.token, appReceivedMsg.id);
    const htmlBody = (fullMsg.html?.[0] ?? fullMsg.text) || '';

    // ── Assert Maabar design template (not default Supabase template) ──────
    expect(htmlBody, 'Email should contain Maabar logo from Supabase storage')
      .toContain('supabase.co/storage');

    // ── Assert Chinese content ─────────────────────────────────────────────
    expect(htmlBody, 'Application received email should be in Chinese')
      .toMatch(/[\u4e00-\u9fff]/);

    // Update timestamp for Scenario 7
    lastEmailTimestamp = appReceivedMsg.createdAt;

    // ── Check admin email_logs entry via Supabase ─────────────────────────
    const adminEmailLogs = await queryEmailLogs({
      templateName: 'admin_new_supplier',
      limitToLast: 5,
    });

    // We should find at least one admin notification log entry
    const hasAdminEntry = adminEmailLogs.some(
      (log) =>
        log.template_name === 'admin_new_supplier' ||
        (typeof log.recipient_email === 'string' &&
          log.recipient_email.includes('maabar.io')),
    );

    if (!hasAdminEntry) {
      console.warn(
        '[Scenario 5] No admin_new_supplier log found in email_logs. ' +
        'This may mean admin email is not logged or uses a different template_name.',
      );
    }

    console.log('[Scenario 5] Post-submission email verified. Body length:', htmlBody.length);
  });

  // ── Scenario 6 ─────────────────────────────────────────────────────────────

  test('Scenario 6 — Admin approval flow', async ({ browser }) => {
    expect(supplierUserId, 'supplierUserId must be set from Scenario 2').toBeTruthy();

    // ── Open admin context in a separate browser context ──────────────────
    const { context: adminCtx, page: adminPage } = await createAdminContext(browser);

    try {
      // ── Navigate to admin suppliers ──────────────────────────────────────
      await expect(adminPage).toHaveURL(/\/admin\/suppliers/, { timeout: 20_000 });
      await adminPage.waitForLoadState('networkidle', { timeout: 20_000 });

      // ── Click "Pending Review" tab ────────────────────────────────────────
      await adminPage.getByRole('button', { name: /Pending Review|قيد المراجعة/i }).click();
      await adminPage.waitForLoadState('networkidle', { timeout: 10_000 });

      // ── Assert the new supplier appears ───────────────────────────────────
      await expect(
        adminPage.getByText('深圳华兴电子有限公司'),
      ).toBeVisible({ timeout: 15_000 });

      // ── Click into supplier detail ─────────────────────────────────────────
      await adminPage.getByText('深圳华兴电子有限公司').first().click();
      await adminPage.waitForURL(/\/admin\/suppliers\/.+/, { timeout: 10_000 });
      await adminPage.waitForLoadState('networkidle', { timeout: 15_000 });

      // ── Assert fields display correctly ───────────────────────────────────
      await expect(adminPage.getByText('深圳华兴电子有限公司')).toBeVisible();
      await expect(adminPage.getByText('深圳')).toBeVisible();
      await expect(adminPage.getByText('huaxing_e2e')).toBeVisible();

      // ── Assert license doc link loads (signed URL, not 404) ───────────────
      const licenseLink = adminPage.getByRole('link', { name: /View|查看|License/i }).first()
        .or(adminPage.locator('a[href*="supabase.co/storage"]').first());

      if (await licenseLink.count() > 0) {
        const href = await licenseLink.getAttribute('href') ?? '';
        if (href) {
          const res = await adminPage.request.get(href).catch(() => null);
          if (res) {
            expect(res.status(), `License URL should not be 404: ${href}`).not.toBe(404);
          }
        }
      }

      // ── Click "Approve" button ────────────────────────────────────────────
      await adminPage.getByRole('button', { name: /^Approve$|^اعتماد$|^قبول المورد$/i }).click();

      // ── Assert status updated to verified/active ──────────────────────────
      // AdminSupplierDetail calls load() after updateStatus, re-rendering the page
      await adminPage.waitForLoadState('networkidle', { timeout: 15_000 });

      // The approve button should be gone (or replaced with deactivate)
      await expect(
        adminPage.getByRole('button', { name: /^Approve$|^اعتماد$/i }),
      ).not.toBeVisible({ timeout: 10_000 });

      // Flash message
      await expect(
        adminPage.getByText(/Status updated|تم التحديث بنجاح/i),
      ).toBeVisible({ timeout: 8_000 });

      // ── Verify audit_log entry via Supabase ────────────────────────────────
      const auditEntry = await verifyAuditLogEntry({
        action: 'supplier_active',
        entityType: 'supplier',
        entityId: supplierUserId,
      });

      expect(
        auditEntry,
        'No audit_log entry found for supplier_active action. ' +
        'logAdminAction() must be called on approval.',
      ).toBeTruthy();

      console.log('[Scenario 6] Admin approval complete. Audit log entry:', auditEntry?.id);
    } finally {
      await adminCtx.close();
    }
  });

  // ── Scenario 7 ─────────────────────────────────────────────────────────────

  test('Scenario 7 — Post-approval email to supplier', async () => {
    // ── Poll mail.tm for supplier_approved email ───────────────────────────
    const approvedMsg = await pollForEmail(mailInbox.token, {
      maxWaitMs: 60_000,
      intervalMs: 4_000,
      newerThan: lastEmailTimestamp,
      filter: (m) =>
        m.from.address.includes('maabar.io') &&
        (m.subject.toLowerCase().includes('approved') ||
          m.subject.includes('通过') ||
          m.subject.includes('批准') ||
          m.subject.includes('审核') ||
          /[\u4e00-\u9fff]/.test(m.subject)),
    });

    // ── Fetch full body ────────────────────────────────────────────────────
    const fullMsg = await getMessageDetail(mailInbox.token, approvedMsg.id);
    const htmlBody = (fullMsg.html?.[0] ?? fullMsg.text) || '';

    // ── Assert Chinese content ─────────────────────────────────────────────
    expect(htmlBody, 'Approval email should be in Chinese').toMatch(/[\u4e00-\u9fff]/);

    // ── Assert Maabar design (logo in email) ──────────────────────────────
    expect(
      htmlBody,
      'Approval email should contain Maabar logo from Supabase storage',
    ).toContain('supabase.co/storage');

    console.log(
      `[Scenario 7] Approval email: "${approvedMsg.subject}" from ${approvedMsg.from.address}`,
    );
  });
});
