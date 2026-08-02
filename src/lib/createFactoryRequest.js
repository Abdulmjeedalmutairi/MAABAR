import { sb } from '../supabase';
import { createManagedRequest } from './createManagedRequest';
import { CUSTOMIZATION_CHIPS, labelFor } from './requestFormOptions';

/**
 * Factory request from the RequestQuoteModal — product-bound (product set) or a
 * factory-level inquiry (product null). Builds a MANAGED request (NO budget — the
 * factory quotes), then persists the structured customization row and emails the
 * factory SERVER-SIDE via the factory-request-email edge function (it resolves the
 * factory address itself — the trader never supplies it).
 *
 * Free-text (requestDetails / customizationDetails / additionalNotes) is folded
 * into the request description so the AI supplier_brief covers it AFTER stripping
 * buyer identity; those raw fields are never exposed by get_factory_invite. The
 * structured fields (unit, customization_types, delivery_timeframe, ship_*,
 * attachments) go to request_customization and are shown to the factory as-is.
 *
 * @returns {Promise<{ request: object|null, error: any, emailError?: any }>}
 */
export async function createFactoryRequest({
  user, factory, product,
  quantity, unit,
  customizationTypes = [], customizationDetails = '',
  requestDetails = '',
  deliveryTimeframe = '', shipCountry = '', shipCity = '',
  additionalNotes = '', attachmentPaths = [],
  lang = 'ar', viewerCurrency = 'SAR',
}) {
  const isAr = lang === 'ar';
  const productName = product
    ? ((isAr ? product.name_ar : lang === 'zh' ? product.name_zh : product.name_en) || product.name_en || product.name_ar || product.name_zh || '')
    : '';

  const body = (requestDetails || '').trim();
  const hasCustom = (customizationTypes && customizationTypes.length) || (customizationDetails || '').trim();

  // Product-bound with customization → frame it as a modification of the catalog
  // item (factory_product_id is still set); plain product-bound → straight RFQ.
  const lead = product
    ? (hasCustom
        ? (isAr ? `طلب مخصص بناءً على: ${productName}${product.ref_code ? ` [${product.ref_code}]` : ''}`
          : lang === 'zh' ? `基于以下产品的定制需求：${productName}${product.ref_code ? ` [${product.ref_code}]` : ''}`
            : `Custom request based on: ${productName}${product.ref_code ? ` [${product.ref_code}]` : ''}`)
        : (isAr ? `طلب عرض سعر للمنتج: ${productName}${product.ref_code ? ` [${product.ref_code}]` : ''}`
          : lang === 'zh' ? `产品报价需求：${productName}${product.ref_code ? ` [${product.ref_code}]` : ''}`
            : `Quote request for: ${productName}${product.ref_code ? ` [${product.ref_code}]` : ''}`))
    : '';

  const typeLabels = (customizationTypes || [])
    .map((k) => { const c = CUSTOMIZATION_CHIPS.find((x) => x.key === k); return c ? labelFor(c, lang) : null; })
    .filter(Boolean);

  const lbl = {
    types: isAr ? 'التخصيص المطلوب' : lang === 'zh' ? '所需定制' : 'Customization requested',
    details: isAr ? 'تفاصيل التخصيص' : lang === 'zh' ? '定制详情' : 'Customization details',
    notes: isAr ? 'ملاحظات إضافية' : lang === 'zh' ? '补充说明' : 'Additional notes',
  };
  const description = [
    lead,
    body,
    typeLabels.length ? `${lbl.types}: ${typeLabels.join(isAr ? '، ' : ', ')}` : '',
    (customizationDetails || '').trim() ? `${lbl.details}: ${customizationDetails.trim()}` : '',
    (additionalNotes || '').trim() ? `${lbl.notes}: ${additionalNotes.trim()}` : '',
  ].filter(Boolean).join('\n\n');

  const title = productName || body.slice(0, 80) || factory?.company_name || '';

  const form = {
    title_ar: isAr ? title : '',
    title_en: !isAr ? title : '',
    quantity: String(quantity || ''),
    unit: unit || '',
    description,
    request_kind: 'factory',   // distinguishes factory quotes from generic managed
    category: factory?.category || 'other',
    budget_per_unit: '',      // no budget — factory quotes
    budget_currency: viewerCurrency,
    payment_plan: '',
    sample_requirement: '',
  };

  const { request, error } = await createManagedRequest({ user, form, lang, viewerCurrency });
  if (error || !request?.id) return { request: null, error: error || new Error('request insert failed') };

  // Structured customization row (buyer RLS). Best-effort: the request already
  // exists. Written BEFORE the email so the factory sees it on first open.
  try {
    await sb.from('request_customization').insert({
      request_id: request.id,
      buyer_id: user.id,
      customization_types: customizationTypes || [],
      customization_details: (customizationDetails || '').trim() || null,
      delivery_timeframe: deliveryTimeframe || null,
      ship_country: (shipCountry || '').trim() || null,
      ship_city: (shipCity || '').trim() || null,
      additional_notes: (additionalNotes || '').trim() || null,
      attachment_paths: attachmentPaths || [],
    });
  } catch (e) {
    console.error('[createFactoryRequest] request_customization insert failed:', e?.message || e);
  }

  // Create the invite + email the factory, server-side. Best-effort.
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
