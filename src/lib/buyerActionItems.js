// Unified buyer "action items" — normalizes the trader's sources (managed requests,
// standard RFQs + their offers, direct purchase orders, samples, product inquiries)
// plus inbound messages into ONE status-classified feed. A trader thinks "what needs
// my response", not "which object type" — so we bucket by STATUS and keep the object
// type as a `kind` label + a kind-specific action. Mirror of the supplier lib
// supplierActionItems.js — same output shape, same prod Supabase.
//
// Grounding: the needs_action rules match the dashboard's existing loadPendingActions
// (managed offer_ready, pending offers, supplier_confirmed → pay, arrived → confirm,
// unread messages) so the redesign doesn't change WHAT counts as action, only how
// it's presented.
//
// Item shape: { key, kind, bucket, sourceId, requestId, partyId, status, createdAt,
//   waitingSince, title, qty, unit, action, extra }
//   kind    ∈ managed | rfq | direct | sample | inquiry | message
//   bucket  ∈ needs_action | in_progress | completed
//   action  ∈ review_managed_offer | track_managed | review_offers | view_request
//             | pay_order | confirm_receipt | track_order | view_sample
//             | view_inquiry | reply_message

import { sortByUrgency, waitingLabel } from './supplierActionItems';

export { sortByUrgency, waitingLabel };

export const BUYER_BUCKETS = ['needs_action', 'in_progress', 'completed'];

const reqTitle = (r, lang) => (r && (r[`title_${lang}`] || r.title_en || r.title_ar || r.title_zh)) || '';
const prodTitle = (p, lang) => (p && (p[`name_${lang}`] || p.name_en || p.name_ar || p.name_zh)) || '';
const emptyCounts = () => ({ needs_action: 0, in_progress: 0, completed: 0 });

// requests.status lifecycle (STATUS_STEPS): open → offers_received → closed(accepted)
// → supplier_confirmed → paid → ready_to_ship → shipping → arrived → delivered.
const ACTIVE_ORDER = ['closed', 'supplier_confirmed', 'paid', 'ready_to_ship', 'shipping', 'arrived'];

export async function fetchBuyerActionItems(sb, buyerId, lang = 'en') {
  if (!sb || !buyerId) return { items: [], counts: emptyCounts() };

  const [reqRows, samples, inquiries, msgRows] = await Promise.all([
    // All the buyer's requests (managed + standard RFQ + direct orders) with offers
    // embedded in ONE query — no N+1 (buyers can read offers on their own requests).
    sb.from('requests').select('*, offers(id,status,supplier_id,managed_visibility)').eq('buyer_id', buyerId)
      .then((r) => r.data || []),
    sb.from('samples').select('id,status,quantity,created_at,supplier_id,products(name_ar,name_en,name_zh)')
      .eq('buyer_id', buyerId).then((r) => r.data || []),
    sb.from('product_inquiries').select('id,status,created_at,supplier_id,product_name,product_name_ar,product_name_en')
      .eq('buyer_id', buyerId).then((r) => r.data || []),
    // Inbound messages awaiting the buyer's reply (supplier → buyer, unread).
    sb.from('messages').select('id,sender_id,content,created_at')
      .eq('receiver_id', buyerId).eq('is_read', false)
      .order('created_at', { ascending: true }).then((r) => r.data || []),
  ]);

  const items = [];

  for (const r of reqRows) {
    const isManaged = String(r.sourcing_mode || 'direct').toLowerCase() === 'managed';
    const isDirect = !!r.product_ref;   // direct purchase order — points at a product
    const status = String(r.status || '').toLowerCase();
    const mstatus = String(r.managed_status || '').toLowerCase();
    const waitingSince = r.updated_at || r.created_at;

    // (a) Managed request — driven by managed_status, no marketplace suppliers.
    if (isManaged) {
      const done = ['delivered', 'completed'].includes(mstatus);
      const needs = mstatus === 'offer_ready';
      items.push({
        key: `managed:${r.id}`, kind: 'managed',
        bucket: done ? 'completed' : needs ? 'needs_action' : 'in_progress',
        sourceId: r.id, requestId: r.id, partyId: null, status: mstatus,
        createdAt: r.created_at, waitingSince, title: reqTitle(r, lang), qty: r.quantity, unit: r.unit,
        action: needs ? 'review_managed_offer' : 'track_managed',
      });
      continue;
    }

    // (b) Direct purchase order.
    if (isDirect) {
      const done = status === 'delivered';
      const needsPay = status === 'supplier_confirmed';
      const needsReceipt = status === 'arrived';
      items.push({
        key: `direct:${r.id}`, kind: 'direct',
        bucket: done ? 'completed' : (needsPay || needsReceipt) ? 'needs_action' : 'in_progress',
        sourceId: r.id, requestId: r.id, partyId: null, status,
        createdAt: r.created_at, waitingSince, title: reqTitle(r, lang), qty: r.quantity, unit: r.unit,
        action: needsPay ? 'pay_order' : needsReceipt ? 'confirm_receipt' : done ? 'track_order' : 'track_order',
      });
      continue;
    }

    // (c) Standard RFQ request (suppliers compete with offers).
    if (status === 'delivered') {
      items.push({ key: `rfq:${r.id}`, kind: 'rfq', bucket: 'completed', sourceId: r.id, requestId: r.id, partyId: null, status, createdAt: r.created_at, waitingSince, title: reqTitle(r, lang), qty: r.quantity, unit: r.unit, action: 'view_request' });
    } else if (ACTIVE_ORDER.includes(status)) {
      // An offer was accepted → this RFQ is now an active order.
      const needsPay = status === 'supplier_confirmed';
      const needsReceipt = status === 'arrived';
      items.push({ key: `rfq:${r.id}`, kind: 'rfq', bucket: (needsPay || needsReceipt) ? 'needs_action' : 'in_progress', sourceId: r.id, requestId: r.id, partyId: null, status, createdAt: r.created_at, waitingSince, title: reqTitle(r, lang), qty: r.quantity, unit: r.unit, action: needsPay ? 'pay_order' : needsReceipt ? 'confirm_receipt' : 'track_order' });
    } else {
      // Still collecting offers. Pending offers to review = needs_action.
      const pendingOffers = (r.offers || []).filter((o) => String(o.status) === 'pending'
        && (o.managed_visibility === 'buyer_visible' || o.managed_visibility == null));
      const has = pendingOffers.length > 0;
      items.push({ key: `rfq:${r.id}`, kind: 'rfq', bucket: has ? 'needs_action' : 'in_progress', sourceId: r.id, requestId: r.id, partyId: null, status, createdAt: r.created_at, waitingSince: r.created_at, title: reqTitle(r, lang), qty: r.quantity, unit: r.unit, action: has ? 'review_offers' : 'view_request', extra: has ? { offers: pendingOffers.length } : null });
    }
  }

  // (d) Sample requests — the buyer waits on the supplier's decision; tracked, not
  // action-required in v1 (avoids guessing a buyer step the flow may not have).
  for (const s of samples) {
    const st = String(s.status || '').toLowerCase();
    const done = ['rejected', 'declined', 'delivered', 'completed'].includes(st);
    items.push({ key: `sample:${s.id}`, kind: 'sample', bucket: done ? 'completed' : 'in_progress', sourceId: s.id, requestId: null, partyId: s.supplier_id, status: st, createdAt: s.created_at, waitingSince: s.created_at, title: prodTitle(s.products, lang), qty: s.quantity, action: 'view_sample' });
  }

  // (e) Product inquiries — answered = the reply is waiting for the buyer to read.
  for (const q of inquiries) {
    const st = String(q.status || '').toLowerCase();
    const answered = st === 'answered';
    items.push({ key: `inquiry:${q.id}`, kind: 'inquiry', bucket: answered ? 'needs_action' : 'in_progress', sourceId: q.id, requestId: null, partyId: q.supplier_id, status: st, createdAt: q.created_at, waitingSince: q.created_at, title: q[`product_name_${lang}`] || q.product_name || q.product_name_en || q.product_name_ar || '', action: 'view_inquiry' });
  }

  // (f) Inbound messages awaiting the buyer's reply — one item per conversation.
  const bySender = new Map();
  for (const m of msgRows) {
    if (!bySender.has(m.sender_id)) bySender.set(m.sender_id, { first: m, last: m });
    else bySender.get(m.sender_id).last = m;
  }
  for (const [sender, g] of bySender) {
    items.push({ key: `msg:${sender}`, kind: 'message', bucket: 'needs_action', sourceId: sender, requestId: null, partyId: sender, status: 'unread', createdAt: g.last.created_at, waitingSince: g.first.created_at, title: (g.last.content || '').slice(0, 60), action: 'reply_message' });
  }

  const counts = emptyCounts();
  for (const it of items) counts[it.bucket] = (counts[it.bucket] || 0) + 1;
  return { items, counts };
}
