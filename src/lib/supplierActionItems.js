// Unified supplier "action items" — normalizes the four request sources (RFQ /
// direct orders / samples / product inquiries) into ONE status-classified feed.
// A supplier thinks "what needs my response", not "which object type" — so we
// bucket by STATUS and keep the object type as a `kind` label + a kind-specific
// action. Used by both the Home "needs your response" block and the Requests tab.
//
// Item shape: { key, kind, bucket, sourceId, requestId, buyerId, status,
//   createdAt, waitingSince, title, qty, unit, action }
//   kind    ∈ rfq | direct | sample | inquiry
//   bucket  ∈ needs_response | my_offers | accepted | finished
//   action  ∈ submit_offer | confirm_order | approve_sample | reply_inquiry
//             | view_offer | view_order | view_sample | view_inquiry
//
// SCALE NOTE: this merges 4-5 PostgREST queries client-side. At marketplace scale
// (the open-RFQ pool can be large) a security_invoker VIEW `supplier_action_items`
// (UNION ALL, server ORDER BY + range pagination) should replace
// fetchSupplierActionItems with the SAME output shape — the UI won't change.

export const ACTION_BUCKETS = ['needs_response', 'my_offers', 'accepted', 'finished'];

// Prefer the viewer's language, then fall back — so an English/Chinese supplier
// doesn't see Arabic titles for buyer requests that carry all three.
const reqTitle = (r, lang) => (r && (r[`title_${lang}`] || r.title_en || r.title_ar || r.title_zh)) || '';
const prodTitle = (p, lang) => (p && (p[`name_${lang}`] || p.name_en || p.name_ar || p.name_zh)) || '';
const emptyCounts = () => ({ needs_response: 0, my_offers: 0, accepted: 0, finished: 0 });

const DIRECT_STATUSES = ['pending_supplier_confirmation', 'supplier_confirmed', 'paid', 'ready_to_ship', 'shipping', 'arrived', 'delivered'];

export async function fetchSupplierActionItems(sb, supplierId, lang = 'en') {
  if (!sb || !supplierId) return { items: [], counts: emptyCounts() };

  // Direct orders are `requests` pointing at one of the supplier's products.
  const { data: prods } = await sb.from('products').select('id').eq('supplier_id', supplierId);
  const myProductIds = (prods || []).map((p) => p.id);

  const [targetedReqs, myOffers, directReqs, samples, inquiries, msgRows] = await Promise.all([
    // Quote requests directed at THIS supplier specifically (not the open pool —
    // "needs your response" is what came TO this supplier). The open marketplace
    // pool is a separate "browse opportunities" surface.
    sb.from('requests')
      .select('id,title_ar,title_en,title_zh,buyer_id,status,quantity,unit,created_at')
      .eq('target_supplier_id', supplierId)
      .in('status', ['open', 'offers_received'])
      .then((r) => r.data || []),
    sb.from('offers')
      .select('id,request_id,status,created_at,requests(title_ar,title_en,title_zh,buyer_id)')
      .eq('supplier_id', supplierId)
      .then((r) => r.data || []),
    myProductIds.length
      ? sb.from('requests')
          .select('id,title_ar,title_en,title_zh,buyer_id,status,quantity,unit,created_at,product_ref')
          .in('product_ref', myProductIds).in('status', DIRECT_STATUSES)
          .then((r) => r.data || [])
      : Promise.resolve([]),
    sb.from('samples')
      .select('id,status,quantity,created_at,buyer_id,products(name_ar,name_en,name_zh)')
      .eq('supplier_id', supplierId)
      .then((r) => r.data || []),
    sb.from('product_inquiries')
      .select('id,status,created_at,buyer_id,product_name,product_name_ar,product_name_en')
      .eq('supplier_id', supplierId)
      .then((r) => r.data || []),
    // Inbound messages awaiting this supplier's reply (buyer → supplier, unread).
    sb.from('messages')
      .select('id,sender_id,content,created_at')
      .eq('receiver_id', supplierId).eq('is_read', false)
      .order('created_at', { ascending: true })
      .then((r) => r.data || []),
  ]);

  // Requests I've already offered on leave the RFQ "needs_response" pool — they
  // are represented by my offer instead (my_offers / accepted / finished).
  const offeredReqIds = new Set((myOffers || []).map((o) => o.request_id));
  const items = [];

  // (a) Quote requests targeted at this supplier — needs a response unless I offered.
  for (const r of targetedReqs) {
    if (offeredReqIds.has(r.id)) continue;
    items.push({
      key: `rfq:${r.id}`, kind: 'rfq', bucket: 'needs_response',
      sourceId: r.id, requestId: r.id, buyerId: r.buyer_id, status: r.status,
      createdAt: r.created_at, waitingSince: r.created_at,
      title: reqTitle(r, lang), qty: r.quantity, unit: r.unit, action: 'submit_offer',
    });
  }

  // (a') My submitted offers.
  for (const o of myOffers) {
    const bucket = o.status === 'accepted' ? 'accepted' : o.status === 'rejected' ? 'finished' : 'my_offers';
    items.push({
      key: `offer:${o.id}`, kind: 'rfq', bucket,
      sourceId: o.id, requestId: o.request_id, buyerId: o.requests?.buyer_id, status: o.status,
      createdAt: o.created_at, waitingSince: o.created_at,
      title: reqTitle(o.requests, lang), action: bucket === 'my_offers' ? 'view_offer' : 'view_order',
    });
  }

  // (b) Direct purchase orders.
  for (const r of directReqs) {
    const bucket = r.status === 'pending_supplier_confirmation' ? 'needs_response'
      : r.status === 'delivered' ? 'finished' : 'accepted';
    items.push({
      key: `direct:${r.id}`, kind: 'direct', bucket,
      sourceId: r.id, requestId: r.id, buyerId: r.buyer_id, status: r.status,
      createdAt: r.created_at, waitingSince: r.created_at,
      title: reqTitle(r, lang), qty: r.quantity, unit: r.unit,
      action: bucket === 'needs_response' ? 'confirm_order' : 'view_order',
    });
  }

  // (c) Sample requests (status: pending / approved / rejected).
  for (const s of samples) {
    const bucket = s.status === 'pending' ? 'needs_response' : s.status === 'approved' ? 'accepted' : 'finished';
    items.push({
      key: `sample:${s.id}`, kind: 'sample', bucket,
      sourceId: s.id, requestId: null, buyerId: s.buyer_id, status: s.status,
      createdAt: s.created_at, waitingSince: s.created_at,
      title: prodTitle(s.products, lang), qty: s.quantity,
      action: bucket === 'needs_response' ? 'approve_sample' : 'view_sample',
    });
  }

  // (d) Product inquiries (status: open / answered).
  for (const q of inquiries) {
    const bucket = q.status === 'open' ? 'needs_response' : 'finished';
    items.push({
      key: `inquiry:${q.id}`, kind: 'inquiry', bucket,
      sourceId: q.id, requestId: null, buyerId: q.buyer_id, status: q.status,
      createdAt: q.created_at, waitingSince: q.created_at,
      title: q[`product_name_${lang}`] || q.product_name || q.product_name_en || q.product_name_ar || '',
      action: bucket === 'needs_response' ? 'reply_inquiry' : 'view_inquiry',
    });
  }

  // (e) Inbound messages awaiting this supplier's reply — one item per conversation.
  const bySender = new Map();
  for (const m of msgRows) {
    if (!bySender.has(m.sender_id)) bySender.set(m.sender_id, { first: m, last: m });
    else bySender.get(m.sender_id).last = m;
  }
  for (const [sender, g] of bySender) {
    items.push({
      key: `msg:${sender}`, kind: 'message', bucket: 'needs_response',
      sourceId: sender, requestId: null, buyerId: sender, status: 'unread',
      createdAt: g.last.created_at, waitingSince: g.first.created_at,
      title: (g.last.content || '').slice(0, 60), action: 'reply_message',
    });
  }

  const counts = emptyCounts();
  for (const it of items) counts[it.bucket] = (counts[it.bucket] || 0) + 1;
  return { items, counts };
}

// Oldest-waiting first (longest wait = most urgent) — the urgency ordering.
export function sortByUrgency(items) {
  return [...(items || [])].sort((a, b) => new Date(a.waitingSince || 0) - new Date(b.waitingSince || 0));
}

// "ينتظر ٣ ساعات" / "waiting 2 days" — urgency shown as wait duration, not a count.
export function waitingLabel(since, lang = 'ar') {
  const ms = Date.now() - new Date(since || Date.now()).getTime();
  const hrs = Math.max(0, Math.floor(ms / 3600000));
  const days = Math.floor(hrs / 24);
  const isAr = lang === 'ar', isZh = lang === 'zh';
  if (days >= 1) {
    if (isAr) return days === 1 ? 'ينتظر يوماً' : days === 2 ? 'ينتظر يومين' : `ينتظر ${days} أيام`;
    if (isZh) return `等待 ${days} 天`;
    return `waiting ${days} day${days > 1 ? 's' : ''}`;
  }
  const h = Math.max(1, hrs);
  if (isAr) return h === 1 ? 'ينتظر ساعة' : h === 2 ? 'ينتظر ساعتين' : `ينتظر ${h} ساعات`;
  if (isZh) return `等待 ${h} 小时`;
  return `waiting ${h} hour${h > 1 ? 's' : ''}`;
}
