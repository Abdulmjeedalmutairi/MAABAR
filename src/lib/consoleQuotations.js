import { sb } from '../supabase';

// Unified quotation board: BOTH factory-targeted RFQs and managed/concierge
// requests are `requests` rows (request_kind 'factory' | 'managed'). This joins
// the split signals — offers, request_factory_invites, request_customization,
// trader profile, target factory — and derives ONE status vocabulary
// (waiting supplier / supplier replied / closed) the founder asked for.

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const CLOSED = ['closed', 'completed', 'cancelled', 'canceled', 'fulfilled', 'delivered', 'rejected'];
const safe = (p) => p.then((r) => r, () => ({ data: [] }));

export async function fetchQuotations() {
  const { data: reqs, error } = await sb.from('requests')
    .select('id, title_ar, title_en, quantity, unit, budget_per_unit, budget_currency, request_kind, sourcing_mode, status, managed_status, response_deadline, reference_image, buyer_id, created_at')
    .or('request_kind.in.(factory,managed),sourcing_mode.eq.managed')
    .order('created_at', { ascending: false }).limit(300);
  if (error) throw error;
  if (!reqs || !reqs.length) return [];

  const ids = reqs.map((r) => r.id);
  const buyerIds = [...new Set(reqs.map((r) => r.buyer_id).filter(Boolean))];

  const [{ data: offers }, { data: invites }, { data: cust }, { data: buyers }] = await Promise.all([
    safe(sb.from('offers').select('request_id').in('request_id', ids)),
    safe(sb.from('request_factory_invites').select('request_id, factory_id, status, slug').in('request_id', ids)),
    safe(sb.from('request_customization').select('request_id, attachment_paths, ship_country, ship_city').in('request_id', ids)),
    buyerIds.length ? safe(sb.from('profiles').select('id, full_name, company_name, country').in('id', buyerIds)) : Promise.resolve({ data: [] }),
  ]);

  const offerSet = new Set((offers || []).map((o) => o.request_id));
  const inviteBy = {}; (invites || []).forEach((i) => { if (!inviteBy[i.request_id]) inviteBy[i.request_id] = i; });
  const custBy = {}; (cust || []).forEach((c) => { custBy[c.request_id] = c; });
  const buyerBy = {}; (buyers || []).forEach((b) => { buyerBy[b.id] = b; });

  const facIds = [...new Set((invites || []).map((i) => i.factory_id).filter(Boolean))];
  let facBy = {};
  if (facIds.length) {
    const { data: facs } = await safe(sb.from('factory_directory').select('id, company_name, company_name_latin, phone').in('id', facIds));
    (facs || []).forEach((f) => { facBy[f.id] = f; });
  }

  return reqs.map((r) => {
    const inv = inviteBy[r.id];
    const fac = inv ? facBy[inv.factory_id] : null;
    const c = custBy[r.id];
    const closed = CLOSED.includes(r.status) || CLOSED.includes(r.managed_status);
    const replied = offerSet.has(r.id) || inv?.status === 'offer_submitted';
    return {
      id: r.id,
      kind: r.request_kind === 'factory' ? 'factory' : 'managed',
      title_ar: r.title_ar, title_en: r.title_en,
      quantity: r.quantity, unit: r.unit,
      target_price: r.budget_per_unit, currency: r.budget_currency,
      image: r.reference_image, deadline: r.response_deadline, created_at: r.created_at,
      trader: buyerBy[r.buyer_id] || null,
      factory: fac ? { id: fac.id, name: nf(fac.company_name) || nf(fac.company_name_latin), phone: fac.phone } : null,
      invite_slug: inv?.slug || null,
      attachments: Array.isArray(c?.attachment_paths) ? c.attachment_paths.length : 0,
      ship_to: [nf(c?.ship_city), nf(c?.ship_country)].filter(Boolean).join('، ') || null,
      status: closed ? 'closed' : replied ? 'replied' : 'waiting',
    };
  });
}
