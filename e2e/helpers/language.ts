/**
 * Language / i18n helpers for e2e tests.
 *
 * The app stores the active language in React state (App.js) and renders
 * language-switcher buttons in the Navbar with class `lang-btn` and labels
 * "AR", "EN", "中".  These helpers drive those buttons and assert locale
 * side-effects (RTL, copy, currency symbols).
 */

import { Page, expect } from '@playwright/test';

export type AppLang = 'ar' | 'en' | 'zh';

const LANG_BUTTON_LABELS: Record<AppLang, string> = {
  ar: 'AR',
  en: 'EN',
  zh: '中',
};

/**
 * Click the navbar language button for `lang` and wait for the DOM direction
 * attribute to settle.
 */
export async function switchLang(page: Page, lang: AppLang): Promise<void> {
  const label = LANG_BUTTON_LABELS[lang];
  // The Navbar renders two sets of lang-buttons (mobile + desktop) — click the
  // first visible one.
  const btn = page.locator('.lang-btn', { hasText: label }).first();
  await btn.click();

  // For Arabic, the app root should become dir="rtl"
  if (lang === 'ar') {
    await expect(page.locator('.app-shell')).toHaveAttribute('dir', 'rtl', { timeout: 5_000 });
  } else {
    await expect(page.locator('.app-shell')).toHaveAttribute('dir', 'ltr', { timeout: 5_000 });
  }
}

/**
 * Assert the page layout direction matches `lang`.
 */
export async function assertDirection(page: Page, lang: AppLang): Promise<void> {
  const expected = lang === 'ar' ? 'rtl' : 'ltr';
  await expect(page.locator('.app-shell')).toHaveAttribute('dir', expected);
}

/**
 * Assert visible text on the page contains `copy`.
 * Useful for language-specific UI copy assertions.
 */
export async function assertCopy(page: Page, copy: string): Promise<void> {
  await expect(page.getByText(copy, { exact: false })).toBeVisible();
}

/**
 * Assert the correct currency symbol is shown for `lang`.
 *   ar → SAR / ﷼
 *   zh → CNY / ¥
 *   en → USD / $
 */
export async function assertCurrencySymbol(page: Page, lang: AppLang): Promise<void> {
  const symbols: Record<AppLang, RegExp> = {
    ar: /SAR|﷼/,
    zh: /CNY|¥/,
    en: /USD|\$/,
  };
  const text = await page.innerText('body');
  expect(text).toMatch(symbols[lang]);
}

/**
 * Return the expected placeholder text for a given field key and language,
 * mirroring the L object in Login.jsx.
 */
export function loginLabel(field: keyof typeof LOGIN_LABELS, lang: AppLang): string {
  return LOGIN_LABELS[field][lang];
}

const LOGIN_LABELS = {
  email: { ar: 'البريد الإلكتروني', en: 'Email', zh: '电子邮件' },
  password: { ar: 'كلمة المرور', en: 'Password', zh: '密码' },
  companyName: { ar: 'اسم الشركة', en: 'Company Name', zh: '公司名称' },
  country: { ar: 'الدولة', en: 'Country', zh: '国家' },
  city: { ar: 'المدينة', en: 'City', zh: '城市' },
  tradeLink: { ar: 'روابط الصفحات التجارية', en: 'Trade Page Links', zh: '贸易页面链接' },
  signin: { ar: 'تسجيل الدخول', en: 'Sign In', zh: '登录' },
  signup: { ar: 'إنشاء حساب', en: 'Create Account', zh: '创建账户' },
} as const;

/**
 * Dashboard tab labels by language — mirrors the T object in
 * supplierDashboardConstants.js (spot-check key tabs only).
 */
export const DASHBOARD_TABS: Record<string, Record<AppLang, string>> = {
  overview:      { ar: 'نظرة عامة',     en: 'Overview',      zh: '概览'     },
  verification:  { ar: 'التحقق',        en: 'Verification',  zh: '认证'     },
  payout:        { ar: 'المدفوعات',     en: 'Payout',        zh: '收款'     },
  'my-products': { ar: 'منتجاتي',      en: 'My Products',   zh: '我的产品' },
  'add-product': { ar: 'إضافة منتج',   en: 'Add Product',   zh: '添加产品' },
  offers:        { ar: 'العروض',        en: 'Offers',        zh: '报价'     },
  requests:      { ar: 'الطلبات المفتوحة', en: 'Open requests', zh: '开放需求' },
  settings:      { ar: 'الإعدادات',    en: 'Settings',      zh: '设置'     },
};
