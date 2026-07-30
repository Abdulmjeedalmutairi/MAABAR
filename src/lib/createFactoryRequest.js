import { sb } from '../supabase';
import { createManagedRequest } from './createManagedRequest';

/**
 * Product-bound factory request.
 *
 * Builds a MANAGED request from a clicked catalog product (NO budget — the factory
 * responds with pricing, decision), then creates the request_factory_invites row
 * and emails the factory SERVER-SIDE via the factory-request-email edge function
 * (which resolves the factory address itself — the trader never supplies it).
 *
 * @returns {Promise<{ request: object|null, error: any, emailError?: any }>}
 */
export async function createFactoryRequest({ user, factory, product, subject, quantity, notes, lang = 'ar', viewerCurrency = 'SAR' }) {
  const isAr = lang === 'ar';
  const productName = product
    ? ((isAr ? product.name_ar : lang === 'zh' ? product.name_zh : product.name_en) || product.name_en || product.name_ar || product.name_zh || '')
    : '';
  // Product-bound → the catalog product name is the title. General inquiry
  // (no product) → the buyer's free-text subject drives the title; the factory
  // name is the last-resort fallback.
  const subjectText = (subject || '').trim();
  const title = productName || subjectText.slice(0, 80) || factory?.company_name || '';
  // Three brief-body modes, all fed into managed_request_briefs:
  //   product only             → straight RFQ (notes only)
  //   product + subject         → custom design ON this product; frame it so the
  //                               factory sees it's a modification, not the catalog
  //                               item as-is (factory_product_id is still set)
  //   subject only (no product) → factory-level generic inquiry
  const isProductCustom = !!(product && subjectText);
  const customLead = isProductCustom
    ? (isAr
        ? `طلب تصميم مخصص بناءً على: ${productName}${product?.ref_code ? ` [${product.ref_code}]` : ''}`
        : lang === 'zh'
          ? `基于以下产品的定制设计需求：${productName}${product?.ref_code ? ` [${product.ref_code}]` : ''}`
          : `Custom design request based on: ${productName}${product?.ref_code ? ` [${product.ref_code}]` : ''}`)
    : '';
  const description = [customLead, subjectText, notes].filter(Boolean).join('\n\n');

  const form = {
    title_ar: isAr ? title : '',
    title_en: !isAr ? title : '',
    quantity: String(quantity || ''),
    description,
    category: factory?.category || 'other',
    budget_per_unit: '',      // no budget — factory quotes
    budget_currency: viewerCurrency,
    payment_plan: '',
    sample_requirement: '',
  };

  const { request, error } = await createManagedRequest({ user, form, lang, viewerCurrency });
  if (error || !request?.id) return { request: null, error: error || new Error('request insert failed') };

  // Create the invite + email the factory, server-side. Best-effort: the request
  // already exists; an email failure is surfaced but doesn't lose the request.
  let emailError = null;
  try {
    const { error: fnErr } = await sb.functions.invoke('factory-request-email', {
      body: { requestId: request.id, factoryId: factory.id, factoryProductId: product?.id || null },
    });
    emailError = fnErr || null;
  } catch (e) {
    emailError = e;
  }

  return { request, error: null, emailError };
}
