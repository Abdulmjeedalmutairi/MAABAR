import { sb } from '../supabase';
import { runWithOptionalColumns } from './supabaseColumnFallback';
import { buildManagedBriefRow, generateManagedBriefWithAI } from './managedSourcing';
import { buildTranslatedRequestFields } from './requestTranslation';
import { normalizeDisplayCurrency } from './displayCurrency';

/**
 * Create a MANAGED sourcing request from a wizard/form state object.
 *
 * Every wizard-originated request is managed — sourcing_mode='managed',
 * request_kind='managed' (decision #1). `direct` is never emitted here; it stays
 * reserved for the targeted "Post Request" + checkout flows.
 *
 * Mirrors the managed path of Requests.jsx submitNewRequest so the wizard and the
 * legacy form share one behavior: translate → insert → AI brief → admin_review.
 * quantity is stored as an integer (decision #5); both title_ar + title_en are
 * kept as source material for the trilingual brief.
 *
 * @returns {Promise<{ request: object|null, error: any }>}
 */
export async function createManagedRequest({ user, form, lang = 'ar', viewerCurrency = 'SAR' }) {
  const titleAr = String(form.title_ar || '').trim();
  const titleEn = String(form.title_en || '').trim();
  const fallbackTitle = titleAr || titleEn;
  const description = String(form.description || '').trim();
  const qtyNum = parseInt(form.quantity, 10);

  let translated = {};
  try {
    translated = await buildTranslatedRequestFields({ titleAr, titleEn, description, lang });
  } catch (err) {
    console.error('[createManagedRequest] translation failed, using source text:', err?.message || err);
    translated = {
      title_ar: titleAr || fallbackTitle,
      title_en: titleEn || fallbackTitle,
      title_zh: titleEn || titleAr || fallbackTitle,
      description_ar: description,
      description_en: description,
      description_zh: description,
    };
  }

  const payload = {
    buyer_id: user.id,
    title_ar: translated.title_ar || titleAr || fallbackTitle,
    title_en: translated.title_en || titleEn || fallbackTitle,
    title_zh: translated.title_zh || titleEn || titleAr || fallbackTitle,
    quantity: Number.isFinite(qtyNum) ? qtyNum : null,
    description,
    description_ar: translated.description_ar || null,
    description_en: translated.description_en || null,
    description_zh: translated.description_zh || null,
    category: form.category || 'other',
    status: 'open',
    budget_per_unit: form.budget_per_unit ? parseFloat(form.budget_per_unit) : null,
    budget_currency: form.budget_per_unit ? normalizeDisplayCurrency(form.budget_currency || viewerCurrency) : null,
    payment_plan: form.payment_plan ? parseInt(form.payment_plan, 10) : null,
    sample_requirement: form.sample_requirement || null,
    reference_image: form.reference_image || form.image_url || null,
    sourcing_mode: 'managed',
    request_kind: 'managed',
    managed_status: 'submitted',
    managed_review_state: 'pending',
    response_deadline: form.response_deadline || null,
  };

  // request_kind exists in prod; keep it optional so it's dropped gracefully in
  // any environment that hasn't got the column yet (same as description_*).
  const { data: request, error } = await runWithOptionalColumns({
    table: 'requests',
    payload,
    optionalKeys: ['description_ar', 'description_en', 'description_zh', 'request_kind'],
    execute: (nextPayload) => sb.from('requests').insert(nextPayload).select('*').single(),
  });

  if (error || !request?.id) {
    return { request: null, error: error || new Error('request insert failed') };
  }

  // AI brief → managed_request_briefs → advance to admin_review. Best-effort:
  // a brief failure never loses the request (it just waits in 'submitted').
  try {
    const brief = await generateManagedBriefWithAI({ request: payload, lang });
    await sb.from('managed_request_briefs').upsert(
      buildManagedBriefRow({ requestId: request.id, buyerId: user.id, brief }),
      { onConflict: 'request_id' },
    );
    await sb.from('requests').update({
      managed_status: 'admin_review',
      managed_priority: brief.priority || 'normal',
      managed_ai_ready_at: new Date().toISOString(),
    }).eq('id', request.id);
  } catch (briefErr) {
    console.error('[createManagedRequest] managed brief setup error:', briefErr?.message || briefErr);
  }

  return { request, error: null };
}
