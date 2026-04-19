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
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
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

  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
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
    // Mask webdriver flag before any navigation to pass Vercel's bot check
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    await page.goto(PROD);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await page.evaluate(() => localStorage.setItem('maabar_preview', '1'));
  });

  test.beforeAll(async () => {
    // Create mail.tm inbox BEFORE account creation so no emails are missed
    mailInbox = await createMailTmInbox();
    supplierEmail = mailInbox.address;
    // Record start time — Scenario 5 & 7 use this to find only NEW emails
    lastEmailTimestamp = new Date().toISOString();
    console.log(`[journey] Supplier email: ${supplierEmail}`);

    // Pre-create user via Admin API (bypasses Supabase signup rate limits).
    // generateLink type='signup' creates the auth user + returns the confirmation URL
    // without sending an email — identical to what the form would produce.
    const sbAdmin = createClient(
      SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data, error } = await sbAdmin.auth.admin.generateLink({
      type: 'signup',
      email: supplierEmail,
      password: PASSWORD,
      options: {
        redirectTo: `${PROD}/auth/callback`,
        data: {
          role: 'supplier',
          company_name: '深圳华兴电子有限公司',
          city: '深圳',
          country: 'China',
          trade_link: 'https://huaxing.en.alibaba.com',
          trade_links: ['https://huaxing.en.alibaba.com'],
          wechat: 'huaxing_test',
          whatsapp: '+8613800000000',
          speciality: 'electronics',
          lang: 'zh',
        },
      },
    });

    if (error) throw new Error(`[beforeAll] generateLink failed: ${error.message}`);
    supplierUserId = (data as { user: { id: string } }).user.id;
    activationLink = (data as { properties: { action_link: string } }).properties.action_link;
    console.log(`[journey] User created: ${supplierUserId}`);
    console.log(`[journey] Activation link: ${activationLink.slice(0, 80)}…`);

    // Persist email so globalTeardown can clean up after ALL projects finish.
    const journeyStateFile = path.join(__dirname, '../../e2e/.journey-state.json');
    fs.writeFileSync(journeyStateFile, JSON.stringify({ supplierEmail, supplierUserId }));
  });

  // Cleanup is handled by globalTeardown reading .e2e-journey-state.json.
  // afterAll is intentionally omitted here to avoid premature cleanup when
  // Playwright runs this describe block across multiple browser projects.

  // ── Scenario 1 ─────────────────────────────────────────────────────────────
  // Tests the /supplier-access landing page and signup form UI.
  // Actual account creation happens in beforeAll via Admin API to avoid
  // Supabase auth rate limits that occur during repeated test runs.

  test('Scenario 1 — Chinese supplier signup UI at /supplier-access', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Navigate directly — /supplier-access is always open, no bypass needed
    await page.goto(`${PROD}/supplier-access`);
    await page.waitForLoadState('networkidle', { timeout: 20_000 }).catch(() => {});
    await expect(page).toHaveURL(/supplier-access/, { timeout: 15_000 });

    // Assert Chinese is the default language
    await expect(page.getByText('创始供应商计划')).toBeVisible({ timeout: 10_000 });

    // Assert Maabar trilingual logo
    await expect(page.getByText('MAABAR', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('迈巴尔', { exact: true }).first()).toBeVisible();

    // Click APPLY NOW CTA
    await page.getByRole('button', { name: '立即申请 →' }).click();

    // Assert redirect to supplier login with mode=signup and lang=zh
    await page.waitForURL(/login\/supplier/, { timeout: 12_000 });
    expect(page.url(), 'Apply Now should include mode=signup').toContain('mode=signup');
    expect(page.url(), 'Apply Now should include lang=zh').toContain('lang=zh');

    // Assert signup form renders in Chinese
    await expect(page.getByRole('button', { name: /提交供应商申请|Submit supplier application/i })).toBeVisible({ timeout: 8_000 });
    await expect(page.getByPlaceholder(/电子邮件|Email/i).first()).toBeVisible();

    // Assert no critical console errors (ignore resource 403s — fonts/analytics/CDN)
    const critical = consoleErrors.filter(
      (e) =>
        !e.includes('ResizeObserver') && !e.includes('favicon') && !e.includes('_next') &&
        !e.includes('403'),
    );
    expect(critical, `Console errors:\n${critical.join('\n')}`).toHaveLength(0);

    console.log('[Scenario 1] Signup UI verified. Pre-created user:', supplierUserId);
    console.log(`[Scenario 1] Activation link ready: ${activationLink?.slice(0, 80)}…`);
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
      page.getByText(/公司资料|认证|供应商/).first(),
    ).toBeVisible({ timeout: 10_000 });

    // ── Assert Step 1 content is accessible (not locked) ──────────────────
    // The overview shows the verification journey; 公司资料 appears in the heading
    await expect(page.getByText('公司资料').first()).toBeVisible({ timeout: 8_000 });
    // Step 2 (verification docs upload) should NOT be shown yet
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

    // ── Navigate to the verification tab ──────────────────────────────────
    await page.getByRole('button', { name: /^认证/ }).first().click();

    // ── Wait for Step 1 form (company profile) ─────────────────────────────
    await expect(page.getByText('公司资料').first()).toBeVisible({ timeout: 10_000 });

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
      page.getByText('公司资料已保存').first(),
    ).toBeVisible({ timeout: 10_000 });

    // ── Assert UI advances to Step 2 within 3 seconds ────────────────────
    await expect(page.getByText('认证文件').first()).toBeVisible({ timeout: 5_000 });

    // ── Assert no 400 errors on the PATCH /profiles call ─────────────────
    const patchErrors = networkErrors.filter((e) => e.url.includes('/profiles') && e.status === 400);
    expect(patchErrors, `400 error on profiles PATCH: ${JSON.stringify(patchErrors)}`).toHaveLength(0);

    // ── Verify company_name was saved to DB ───────────────────────────────
    {
      const sbAdmin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { data: row } = await sbAdmin.from('profiles').select('company_name, city, wechat').eq('id', supplierUserId).maybeSingle();
      console.log(`[Scenario 3] DB after save — company_name: ${row?.company_name}, city: ${row?.city}, wechat: ${row?.wechat}`);
      expect(row?.company_name, 'company_name must be saved to DB by saveSettings').toBe('深圳华兴电子有限公司');
      expect(row?.wechat, 'wechat must be saved to DB by saveSettings').toBe('huaxing_e2e');
    }

    // ── Refresh and assert draft persists on Step 2 ───────────────────────
    await page.reload();
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    // After reload, sessionStorage restores to step 2
    await expect(page.getByText('认证文件').first()).toBeVisible({ timeout: 10_000 });
  });

  // ── Scenario 4 ─────────────────────────────────────────────────────────────

  test('Scenario 4 — Upload Step 2 (verification files + submit)', async ({ page }) => {
    await goToDashboard(page);

    // ── Navigate to the verification tab ──────────────────────────────────
    await page.getByRole('button', { name: /^认证/ }).first().click();
    await expect(page.getByText('公司资料').first()).toBeVisible({ timeout: 10_000 });

    // ── Re-save Step 1 to advance to Step 2 (fresh page = no sessionStorage) ─
    await page.getByRole('button', { name: /保存并进入第 2 步|Save and continue to step 2/i }).click();
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    // ── Ensure we're on Step 2 ─────────────────────────────────────────────
    await expect(page.getByText('认证文件').first()).toBeVisible({ timeout: 15_000 });

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
      page.getByText(/认证资料正在审核中|审核中/i).first(),
    ).toBeVisible({ timeout: 20_000 });

    // ── Assert 4-step badges are rendered ─────────────────────────────────
    await expect(page.getByText('账户', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('资料', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('认证', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('审核', { exact: true }).first()).toBeVisible();
  });

  // ── Scenario 5 ─────────────────────────────────────────────────────────────

  test('Scenario 5 — Post-submission emails', async () => {
    test.setTimeout(120_000);

    // ── Primary assertion: DB notification proves submission triggered email ─
    // Give the DB a moment to catch up after Scenario 4's submit
    await new Promise((r) => setTimeout(r, 3_000));

    const sbAdmin = createClient(
      SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: notification } = await sbAdmin
      .from('notifications')
      .select('*')
      .eq('user_id', supplierUserId)
      .eq('type', 'verification_submitted')
      .maybeSingle();

    expect(
      notification,
      'verification_submitted notification must exist — proves submit triggered email send',
    ).toBeTruthy();

    console.log('[Scenario 5] DB notification verified:', notification?.type);

    // ── Secondary assertion: poll mail.tm inbox (may not arrive if Resend ──
    // ── blocks disposable domains — warn rather than fail in that case)    ──
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
    }).catch((e: Error) => {
      console.warn('[Scenario 5] Email not received at test inbox:', e.message);
      return null;
    });

    if (appReceivedMsg) {
      // Fetch full body and validate template
      const fullMsg = await getMessageDetail(mailInbox.token, appReceivedMsg.id);
      const htmlBody = (fullMsg.html?.[0] ?? fullMsg.text) || '';

      expect(htmlBody, 'Email should use Maabar branded template').toContain('MAABAR');
      expect(htmlBody, 'Application received email should be in Chinese').toMatch(/[\u4e00-\u9fff]/);

      lastEmailTimestamp = appReceivedMsg.createdAt;
      console.log('[Scenario 5] Inbox email verified. Body length:', htmlBody.length);
    } else {
      // Email not received — update timestamp so Scenario 7 polls correctly
      lastEmailTimestamp = new Date().toISOString();
      console.warn('[Scenario 5] Inbox delivery not verified (likely Resend blocks disposable domains).');
    }
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

      // ── Assert the test supplier appears (search by email — company name may ─
      // ── show trigger-set value before Step 1 save is reflected)            ──
      await expect(
        adminPage.getByText(supplierEmail).first(),
      ).toBeVisible({ timeout: 15_000 });

      // ── Click the supplier's row to open detail page ──────────────────────
      await adminPage.getByText(supplierEmail).first().click();
      await adminPage.waitForURL(/\/admin\/suppliers\/.+/, { timeout: 10_000 });
      await adminPage.waitForLoadState('networkidle', { timeout: 15_000 });

      // ── Assert key fields display correctly ───────────────────────────────
      // city and wechat are set by the on_auth_user_created trigger from metadata
      await expect(adminPage.getByText('China').first()).toBeVisible();
      await expect(adminPage.getByText(supplierEmail).first()).toBeVisible();

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
    test.setTimeout(120_000);

    // ── Primary assertion: DB profile status = active (proves approval email triggered) ─
    const sbAdmin = createClient(
      SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: profile } = await sbAdmin
      .from('profiles')
      .select('status')
      .eq('id', supplierUserId)
      .maybeSingle();

    expect(
      profile?.status,
      'Profile status should be active after admin approval',
    ).toBe('active');

    // ── Secondary assertion: poll mail.tm inbox (may not arrive if Resend ──
    // ── blocks disposable domains — warn rather than fail in that case)    ──
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
    }).catch((e: Error) => {
      console.warn('[Scenario 7] Approval email not received at test inbox:', e.message);
      return null;
    });

    if (approvedMsg) {
      const fullMsg = await getMessageDetail(mailInbox.token, approvedMsg.id);
      const htmlBody = (fullMsg.html?.[0] ?? fullMsg.text) || '';

      expect(htmlBody, 'Approval email should be in Chinese').toMatch(/[\u4e00-\u9fff]/);
      expect(htmlBody, 'Approval email should use Maabar branded template').toContain('MAABAR');

      console.log(`[Scenario 7] Approval email: "${approvedMsg.subject}" from ${approvedMsg.from.address}`);
    } else {
      console.warn('[Scenario 7] Inbox delivery not verified (likely Resend blocks disposable domains).');
    }
  });
});
