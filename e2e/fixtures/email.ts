/**
 * Email capture fixture.
 *
 * Intercepts every POST to the Supabase `send-email` edge function and records
 * the request body. Tests can then assert that the right email type was sent
 * with the correct payload — without touching a real inbox or Resend API.
 *
 * Usage:
 *   const { capturedEmails, waitForEmail } = await interceptEmails(page);
 *   // … trigger an action that sends an email …
 *   const email = await waitForEmail('admin_new_supplier');
 *   expect(email.data.companyName).toBe('Acme Ltd');
 */

import { Page, Route } from '@playwright/test';
import { SEND_EMAIL_URL } from './supabase';

export interface CapturedEmail {
  type: string;
  to?: string;
  record?: Record<string, unknown>;
  data?: Record<string, unknown>;
  /** Raw body as-received */
  raw: Record<string, unknown>;
  /** Wall-clock timestamp when the request was intercepted */
  capturedAt: number;
}

export interface EmailInterceptor {
  capturedEmails: CapturedEmail[];
  /** Wait until an email of `type` is captured (polls every 200ms). */
  waitForEmail(type: string, timeoutMs?: number): Promise<CapturedEmail>;
  /** Assert a specific email type was sent exactly once. */
  assertEmailSent(type: string): CapturedEmail;
  /** Assert no email of `type` was sent. */
  assertEmailNotSent(type: string): void;
  /** Reset the captured list (useful between actions in the same test). */
  reset(): void;
}

/**
 * Register a route handler that intercepts ALL calls to the `send-email`
 * function, records the body, and returns a mock 200 response so the app
 * does not error out.
 */
export async function interceptEmails(page: Page): Promise<EmailInterceptor> {
  const capturedEmails: CapturedEmail[] = [];

  // Match both the exact URL and any path variant (e.g. with trailing slash)
  await page.route(`**/${SEND_EMAIL_URL.split('/').slice(-3).join('/')}`, async (route: Route) => {
    let body: Record<string, unknown> = {};
    try {
      const raw = route.request().postData();
      if (raw) body = JSON.parse(raw);
    } catch { /* ignore */ }

    capturedEmails.push({
      type: (body.type as string) || 'unknown',
      to: body.to as string | undefined,
      record: body.record as Record<string, unknown> | undefined,
      data: body.data as Record<string, unknown> | undefined,
      raw: body,
      capturedAt: Date.now(),
    });

    // Return a fake success so the app doesn't show an error
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ id: 'test-intercepted', success: true }),
    });
  });

  return {
    capturedEmails,

    async waitForEmail(type: string, timeoutMs = 10_000): Promise<CapturedEmail> {
      const deadline = Date.now() + timeoutMs;
      while (Date.now() < deadline) {
        const found = capturedEmails.find((e) => e.type === type);
        if (found) return found;
        await new Promise((r) => setTimeout(r, 200));
      }
      const types = capturedEmails.map((e) => e.type).join(', ') || '(none)';
      throw new Error(
        `waitForEmail: email type "${type}" not captured within ${timeoutMs}ms.\n` +
        `Emails received so far: ${types}`
      );
    },

    assertEmailSent(type: string): CapturedEmail {
      const found = capturedEmails.filter((e) => e.type === type);
      if (found.length === 0) {
        const types = capturedEmails.map((e) => e.type).join(', ') || '(none)';
        throw new Error(
          `Expected email type "${type}" to have been sent, but it was not.\n` +
          `Emails sent: ${types}`
        );
      }
      if (found.length > 1) {
        throw new Error(
          `Expected email type "${type}" to be sent exactly once, but it was sent ${found.length} times.`
        );
      }
      return found[0];
    },

    assertEmailNotSent(type: string): void {
      const found = capturedEmails.find((e) => e.type === type);
      if (found) {
        throw new Error(`Expected email type "${type}" NOT to be sent, but it was.`);
      }
    },

    reset(): void {
      capturedEmails.splice(0, capturedEmails.length);
    },
  };
}

// ─── Language content assertions ────────────────────────────────────────────

/**
 * Known language markers embedded in each email's HTML template.
 * Used by 07-email-language.spec.ts to assert the correct language.
 */
export const EMAIL_LANGUAGE_MARKERS: Record<string, Record<string, string>> = {
  trader_welcome: {
    // traderWelcomeHtml is currently hardcoded Arabic
    ar: 'أهلاً بك',
    en: 'Welcome',    // not yet implemented — will fail until templates are i18n-aware
    zh: '欢迎',       // not yet implemented
  },
  supplier_welcome: {
    // supplierWelcomeHtml is currently hardcoded English
    en: "Application Received",
    ar: 'تم استلام الطلب', // not yet implemented
    zh: '已收到申请',       // not yet implemented
  },
  offer_accepted: {
    // offerAcceptedHtml is hardcoded English
    en: 'accepted your offer',
    ar: 'وافق على عرضك',  // not yet implemented
    zh: '已接受您的报价',   // not yet implemented
  },
  new_offer: {
    // newOfferHtml is hardcoded Arabic
    ar: 'عرض سعر',
    en: 'submitted an offer',  // not yet implemented
    zh: '已提交报价',           // not yet implemented
  },
};
