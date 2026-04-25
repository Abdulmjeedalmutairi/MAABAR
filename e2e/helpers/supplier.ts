/**
 * Reusable supplier flow helpers.
 *
 * Each function drives a discrete section of the supplier UI — verification
 * form, product composer, offer submission — so individual test specs stay
 * readable and DRY.
 */

import { Page, expect } from '@playwright/test';
import path from 'path';

const FILES_DIR = path.join(__dirname, '../fixtures/files');

// ─── Navigation helpers ──────────────────────────────────────────────────────

/** Navigate to a dashboard tab using the URL param. */
export async function goToTab(page: Page, tab: string): Promise<void> {
  await page.goto(`/dashboard?tab=${tab}`);
  // Wait for the app to finish loading (BrandedLoading disappears)
  await page.waitForLoadState('networkidle', { timeout: 20_000 });
}

/** Click a tab button in the dashboard sidebar / top-nav. */
export async function clickTab(page: Page, tabText: string): Promise<void> {
  await page.getByRole('button', { name: new RegExp(tabText, 'i') }).first().click();
  await page.waitForLoadState('networkidle', { timeout: 10_000 });
}

// ─── Verification form ───────────────────────────────────────────────────────

export interface VerificationFormValues {
  regNumber?: string;
  yearsExperience?: string;
  numEmployees?: string;
  licenseFile?: string;   // path to file — defaults to test-doc.pdf
  factoryPhotoFile?: string; // path to file — defaults to test-image.jpg
}

/**
 * Fill the supplier verification form (Steps 1 & 2).
 * Does NOT click the final submit button — callers decide when to submit.
 */
export async function fillVerificationForm(
  page: Page,
  values: VerificationFormValues = {}
): Promise<void> {
  await goToTab(page, 'verification');

  // ── Step 1: Company profile ──────────────────────────────────────────────
  const regInput = page.getByPlaceholder(/registration number|reg.*number|company.*reg/i)
    .or(page.locator('input[name="reg_number"]'))
    .first();
  await regInput.fill(values.regNumber ?? 'TEST-REG-12345');

  const yearsInput = page.getByPlaceholder(/years.*experience|years in business|experience/i)
    .or(page.locator('input[name="years_experience"]'))
    .first();
  await yearsInput.fill(values.yearsExperience ?? '5');

  const employeesInput = page.getByPlaceholder(/employees|staff|team size/i)
    .or(page.locator('input[name="num_employees"]'))
    .first();
  if (await employeesInput.count() > 0) {
    await employeesInput.fill(values.numEmployees ?? '50');
  }

  // Advance to step 2 if there's a "Next" button
  const nextBtn = page.getByRole('button', { name: /next|continue|التالي|下一步/i }).first();
  if (await nextBtn.count() > 0 && await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(500);
  }

  // ── Step 2: Verification files ───────────────────────────────────────────
  const licenseFile = values.licenseFile ?? path.join(FILES_DIR, 'test-doc.pdf');
  const factoryFile = values.factoryPhotoFile ?? path.join(FILES_DIR, 'test-image.jpg');

  // Business license upload
  const licenseInput = page.locator('input[type="file"]').first();
  if (await licenseInput.count() > 0) {
    await licenseInput.setInputFiles(licenseFile);
    // Wait for upload to complete (spinner disappears or filename appears)
    await page.waitForTimeout(2_000);
  }

  // Factory photo upload — second file input or labeled input
  const factoryInput = page.locator('input[type="file"]').nth(1);
  if (await factoryInput.count() > 0) {
    await factoryInput.setInputFiles(factoryFile);
    await page.waitForTimeout(2_000);
  }
}

/**
 * Fill AND submit the verification form, then wait for the "under review" state.
 */
export async function submitVerificationForm(
  page: Page,
  values: VerificationFormValues = {}
): Promise<void> {
  await fillVerificationForm(page, values);

  // Advance to step 3 (final review) if applicable
  const nextBtn = page.getByRole('button', { name: /next|continue|التالي|下一步/i }).first();
  if (await nextBtn.count() > 0 && await nextBtn.isVisible()) {
    await nextBtn.click();
    await page.waitForTimeout(500);
  }

  // Click the submit button
  const submitBtn = page.getByRole('button', {
    name: /submit.*verification|send.*verification|تقديم.*التحقق|提交.*认证/i,
  }).first();
  await expect(submitBtn).toBeEnabled({ timeout: 10_000 });
  await submitBtn.click();

  // Wait for the "under review" state to appear
  await expect(
    page.getByText(/under review|verification.*submitted|تحت المراجعة|审核中/i)
  ).toBeVisible({ timeout: 15_000 });
}

// ─── Product composer ────────────────────────────────────────────────────────

export interface ProductValues {
  nameZh?: string;
  nameEn?: string;
  nameAr?: string;
  price?: string;
  currency?: string;
  moq?: string;
  category?: string;
  descEn?: string;
  /** Array of {name, values[]} custom attributes */
  attributes?: Array<{ name: string; values: string[] }>;
  imageFile?: string;
}

/**
 * Fill the "Add Product" form including custom attributes.
 * Navigates to the add-product tab automatically.
 */
export async function fillProductForm(
  page: Page,
  values: ProductValues = {}
): Promise<void> {
  await goToTab(page, 'add-product');

  // Required: English name
  await page
    .getByPlaceholder(/english.*name|name.*en|Example:.*Earbuds/i)
    .or(page.locator('input[placeholder*="English"]'))
    .first()
    .fill(values.nameEn ?? 'TWS Bluetooth Earbuds');

  // Required: Chinese name
  await page
    .getByPlaceholder(/chinese.*name|name.*zh|中文/i)
    .or(page.locator('input[placeholder*="TWS"]'))
    .first()
    .fill(values.nameZh ?? '蓝牙耳机');

  // Optional: Arabic name
  const arInput = page.getByPlaceholder(/arabic.*name|name.*ar|سماعة/i);
  if (await arInput.count() > 0) {
    await arInput.fill(values.nameAr ?? 'سماعات بلوتوث');
  }

  // Price
  await page
    .getByPlaceholder(/price|السعر|价格|8\.50/i)
    .first()
    .fill(values.price ?? '12.50');

  // MOQ
  await page
    .getByPlaceholder(/moq|minimum.*order|500/i)
    .first()
    .fill(values.moq ?? '200');

  // English description (required)
  await page
    .getByPlaceholder(/english.*description|desc.*en|ABS charging/i)
    .or(page.locator('textarea').first())
    .fill(values.descEn ?? 'High-quality wireless earbuds with Bluetooth 5.3, suitable for OEM orders.');

  // Category selector (if visible)
  const categorySelect = page.getByRole('combobox').or(page.locator('select')).first();
  if (await categorySelect.count() > 0 && values.category) {
    await categorySelect.selectOption(values.category);
  }

  // Product image upload
  const imageFile = values.imageFile ?? path.join(FILES_DIR, 'test-image.jpg');
  const imageInput = page.locator('input[type="file"][accept*="image"]').first();
  if (await imageInput.count() > 0) {
    await imageInput.setInputFiles(imageFile);
    await page.waitForTimeout(1_500);
  }

  // ── Custom attributes ────────────────────────────────────────────────────
  const attrs = values.attributes ?? [
    { name: 'Color', values: ['Red', 'Blue', 'Green'] },
    { name: 'Size', values: ['S', 'M', 'L', 'XL'] },
  ];

  for (const attr of attrs) {
    await addProductAttribute(page, attr.name, attr.values);
  }
}

/**
 * Add a single custom attribute via the product composer's attribute UI.
 */
async function addProductAttribute(
  page: Page,
  attrName: string,
  attrValues: string[]
): Promise<void> {
  // Click "Add Attribute" button
  const addAttrBtn = page.getByRole('button', { name: /add attribute|إضافة خاصية|添加属性/i });
  if (await addAttrBtn.count() === 0) return; // feature not available

  await addAttrBtn.click();
  await page.waitForTimeout(300);

  // Fill the attribute name in the last attribute row
  const attrNameInputs = page.locator('input[placeholder*="attribute" i], input[placeholder*="خاصية"], input[placeholder*="属性"]');
  const lastNameInput = attrNameInputs.last();
  await lastNameInput.fill(attrName);

  // Add each value
  for (const val of attrValues) {
    const addValueBtn = page.getByRole('button', { name: /add value|إضافة قيمة|添加值/i }).last();
    if (await addValueBtn.count() > 0) {
      await addValueBtn.click();
      await page.waitForTimeout(200);
    }
    // Fill the last value input in this attribute's row
    const valueInputs = page.locator('input[placeholder*="value" i], input[placeholder*="قيمة"], input[placeholder*="值"]');
    await valueInputs.last().fill(val);
  }
}

/**
 * Submit the product form and wait for the product to appear in "My Products".
 */
export async function submitProductForm(page: Page): Promise<void> {
  const saveBtn = page.getByRole('button', {
    name: /save product|publish|add product|حفظ|保存/i,
  }).first();
  await expect(saveBtn).toBeEnabled({ timeout: 8_000 });
  await saveBtn.click();

  // Wait for success feedback
  await expect(
    page.getByText(/product saved|product published|تم حفظ|产品已保存/i)
      .or(page.getByText(/added to your products|منتج جديد|新产品/i))
  ).toBeVisible({ timeout: 15_000 });
}

// ─── Offer submission ────────────────────────────────────────────────────────

export interface OfferFormValues {
  shippingCost?: string;
  shippingMethod?: string;
  notes?: string;
}

/**
 * From the requests list, open a request by matching title and submit an offer.
 */
export async function submitOfferOnRequest(
  page: Page,
  requestTitlePattern: string | RegExp,
  offer: OfferFormValues = {}
): Promise<void> {
  // Navigate to requests as supplier (within dashboard)
  await goToTab(page, 'requests');

  // Find and click the request
  const requestRow = page.getByText(requestTitlePattern).first();
  await expect(requestRow).toBeVisible({ timeout: 10_000 });
  await requestRow.click();

  // Find "Submit Offer" button
  const submitOfferBtn = page.getByRole('button', {
    name: /submit offer|send offer|تقديم عرض|提交报价/i,
  }).first();
  await expect(submitOfferBtn).toBeVisible({ timeout: 8_000 });
  await submitOfferBtn.click();

  // Fill the offer form
  const shippingCostInput = page.getByPlaceholder(/shipping cost|تكلفة الشحن|运费/i).first();
  if (await shippingCostInput.count() > 0) {
    await shippingCostInput.fill(offer.shippingCost ?? '150');
  }

  const methodSelect = page.getByRole('combobox').or(page.locator('select[name*="method" i]')).first();
  if (await methodSelect.count() > 0 && offer.shippingMethod) {
    await methodSelect.selectOption(offer.shippingMethod);
  }

  const notesInput = page
    .getByPlaceholder(/notes|ملاحظات|备注/i)
    .or(page.locator('textarea').last());
  if (await notesInput.count() > 0) {
    await notesInput.fill(offer.notes ?? 'Competitive pricing with guaranteed quality.');
  }

  // Submit
  const confirmBtn = page.getByRole('button', { name: /confirm|submit|send|إرسال|提交/i }).last();
  await expect(confirmBtn).toBeEnabled({ timeout: 5_000 });
  await confirmBtn.click();

  // Wait for success
  await expect(
    page.getByText(/offer submitted|عرض مقدّم|报价已提交/i)
      .or(page.getByText(/your offer|عرضك|您的报价/i))
  ).toBeVisible({ timeout: 10_000 });
}
