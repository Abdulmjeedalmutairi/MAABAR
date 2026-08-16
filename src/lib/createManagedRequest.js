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

  // Insert IMMEDIATELY with the source text — translation and the AI brief are
  // enrichment, not conditions for a valid row. Every language column is
  // source-filled here, so two slow AI round-trips no longer sit between the
  // trader's tap and the success screen. Both enrichments run in the background.
  const payload = {
    buyer_id: user.id,
    title_ar: titleAr || fallbackTitle,
    title_en: titleEn || fallbackTitle,
    title_zh: titleEn || titleAr || fallbackTitle,
    quantity: Number.isFinite(qtyNum) ? qtyNum : null,
    unit: form.unit || null,
    description,
    description_ar: description || null,
    description_en: description || null,
    description_zh: description || null,
    category: form.category || 'other',
    status: 'open',
    budget_per_unit: form.budget_per_unit ? parseFloat(form.budget_per_unit) : null,
    budget_currency: form.budget_per_unit ? normalizeDisplayCurrency(form.budget_currency || viewerCurrency) : null,
    payment_plan: form.payment_plan ? parseInt(form.payment_plan, 10) : null,
    sample_requirement: form.sample_requirement || null,
    contact_phone: String(form.phone || '').trim() || null,
    reference_image: form.reference_image || form.image_url || null,
    sourcing_mode: 'managed',
    request_kind: form.request_kind || 'managed',
    managed_status: 'submitted',
    managed_review_state: 'pending',
    response_deadline: form.response_deadline || null,
  };

  // request_kind exists in prod; keep it optional so it's dropped gracefully in
  // any environment that hasn't got the column yet (same as description_*).
  const { data: request, error } = await runWithOptionalColumns({
    table: 'requests',
    payload,
    optionalKeys: ['description_ar', 'description_en', 'description_zh', 'request_kind', 'unit', 'contact_phone'],
    execute: (nextPayload) => sb.from('requests').insert(nextPayload).select('*').single(),
  });

  if (error || !request?.id) {
    return { request: null, error: error || new Error('request insert failed') };
  }

  // (1) Background trilingual translation → update the row (best-effort).
  (async () => {
    try {
      const translated = await buildTranslatedRequestFields({ titleAr, titleEn, description, lang });
      const patch = {};
      for (const k of ['title_ar', 'title_en', 'title_zh', 'description_ar', 'description_en', 'description_zh']) {
        if (translated[k]) patch[k] = translated[k];
      }
      if (Object.keys(patch).length) {
        await runWithOptionalColumns({
          table: 'requests', payload: patch,
          optionalKeys: ['description_ar', 'description_en', 'description_zh'],
          execute: (p) => sb.from('requests').update(p).eq('id', request.id),
        });
      }
    } catch (err) {
      console.error('[createManagedRequest] background translation failed:', err?.message || err);
    }
  })();

  // (2) Background AI brief → advance to admin_review. maabar-ai self-persists
  // server-side when given requestId (so a closed tab can't lose the brief); we
  // also upsert here as a fallback for environments where that edge upgrade isn't
  // deployed yet. Both writes are idempotent (upsert on request_id).
  (async () => {
    try {
      const brief = await generateManagedBriefWithAI({ request: payload, lang, requestId: request.id, buyerId: user.id });
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
      console.error('[createManagedRequest] background brief setup error:', briefErr?.message || briefErr);
    }
  })();

  return { request, error: null };
}
