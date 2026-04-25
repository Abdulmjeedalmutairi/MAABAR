/**
 * Authentication helpers for e2e tests.
 *
 * Two paths:
 *  1. programmaticLogin()  — sets a Supabase session cookie directly via the
 *     admin API, bypassing the login form. Used for tests that don't cover the
 *     login UI itself and just need to be authenticated quickly.
 *
 *  2. uiLogin()            — fills the login form and submits it. Used for
 *     Test 01 and any test that exercises the login UI.
 */

import { Page, BrowserContext } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';

// ─── UI login ────────────────────────────────────────────────────────────────

export async function uiLoginSupplier(
  page: Page,
  email: string,
  password: string,
  lang: 'ar' | 'en' | 'zh' = 'en'
): Promise<void> {
  await page.goto(`/login/supplier?lang=${lang}`);

  // Switch to sign-in mode if the form starts in sign-up mode
  // The supplier login page defaults to 'signin' mode, but verify
  const signinButton = page.getByRole('button', { name: /Sign In|تسجيل الدخول|登录/ });
  const hasSigninTab = await signinButton.count() > 0;
  // If we're already in signin mode the label appears as the submit button
  // If we're in signup mode there's a "Already have an account?" toggle
  const toSigninLink = page.getByText(/Already have an account|عندك حساب|已有账户/);
  if (await toSigninLink.count() > 0) {
    await toSigninLink.click();
  }

  await page.getByPlaceholder(/Email|البريد الإلكتروني|电子邮件/i).fill(email);
  await page.getByPlaceholder(/Password|كلمة المرور|密码/i).fill(password);
  await page.getByRole('button', { name: /Sign In|تسجيل الدخول|登录/i }).click();

  // Wait for either dashboard redirect or error message
  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

export async function uiLoginBuyer(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login?lang=en');

  const toSigninLink = page.getByText(/Already have an account/);
  if (await toSigninLink.count() > 0) {
    await toSigninLink.click();
  }

  await page.getByPlaceholder(/Email/i).fill(email);
  await page.getByPlaceholder(/Password/i).fill(password);
  await page.getByRole('button', { name: /Sign In/i }).click();

  await page.waitForURL(/\/dashboard/, { timeout: 20_000 });
}

// ─── Storage state (fast re-use) ────────────────────────────────────────────

/**
 * Sign in using Supabase's JS client in a page evaluate context, then
 * capture the resulting auth tokens into Playwright's storage state.
 * This avoids driving the login UI for every test, making setup ~5× faster.
 */
export async function programmaticLogin(
  context: BrowserContext,
  email: string,
  password: string
): Promise<void> {
  const page = await context.newPage();

  // Navigate to the app first so evaluate() runs in the correct origin
  await page.goto('/');

  const result = await page.evaluate(
    async ({ supabaseUrl, supabaseAnonKey, email, password }) => {
      // @ts-ignore — supabase-js is available on the page via the React app bundle
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: true },
      });
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      return { userId: data?.user?.id, error: error?.message };
    },
    { supabaseUrl: SUPABASE_URL, supabaseAnonKey: SUPABASE_ANON_KEY, email, password }
  );

  if (result.error) throw new Error(`programmaticLogin failed: ${result.error}`);

  await page.close();
}

// ─── Email confirmation link extraction ──────────────────────────────────────

/**
 * Returns the confirmation URL in the same format as the real confirmation email
 * (app-first: /auth/callback?token_hash=...&type=signup).  The app's AuthCallback
 * calls verifyOtp({ token_hash, type }) to complete the flow — this is the code
 * path real users exercise when clicking the email link on mobile.
 *
 * Previously this returned the Supabase direct-verify URL, which bypassed the
 * app's callback entirely and therefore couldn't catch email-link format bugs.
 */
export async function getConfirmationUrl(
  email: string,
  role: 'supplier' | 'buyer' = 'supplier',
): Promise<string> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');

  const appBaseUrl = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';

  const adminClient = createClient(SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await adminClient.auth.admin.generateLink({
    type: 'signup',
    email,
    options: { redirectTo: `${appBaseUrl}/auth/callback` },
  });

  if (error) throw new Error(`generateLink failed: ${error.message}`);

  const props = (data as any).properties;
  const tokenHash: string | undefined = props?.token_hash;
  if (!tokenHash) throw new Error('generateLink did not return token_hash — cannot build app-first confirmation URL');

  // Mirror the URL format built by the send-email edge function hook
  const callbackUrl = new URL('/auth/callback', appBaseUrl);
  callbackUrl.searchParams.set('token_hash', tokenHash);
  callbackUrl.searchParams.set('type', 'signup');
  if (role === 'supplier') callbackUrl.searchParams.set('role', 'supplier');
  callbackUrl.searchParams.set('next', '/dashboard');
  return callbackUrl.toString();
}

// ─── Sign out ────────────────────────────────────────────────────────────────

export async function uiSignOut(page: Page): Promise<void> {
  // Try the navbar sign-out button first
  const signOutBtn = page.getByRole('button', { name: /sign out|تسجيل الخروج|退出/i });
  if (await signOutBtn.count() > 0) {
    await signOutBtn.click();
    await page.waitForURL(/\/(login|$)/, { timeout: 10_000 });
    return;
  }

  // Fallback: navigate to root and clear session via evaluate
  await page.evaluate(() => {
    // Supabase stores session in localStorage under sb-*-auth-token
    Object.keys(localStorage)
      .filter((k) => k.startsWith('sb-'))
      .forEach((k) => localStorage.removeItem(k));
  });
  await page.goto('/');
}
