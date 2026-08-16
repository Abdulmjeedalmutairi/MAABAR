import React, { useEffect, useState } from 'react';
import { fetchBuyerActionItems, sortByUrgency, waitingLabel, BUYER_BUCKETS } from '../../lib/buyerActionItems';
import TranslatedText from '../TranslatedText';

// Unified trader "Requests" tab (mirror of SupplierRequestsPanel): everything the
// buyer has — managed orders, standard RFQs, direct purchases, samples, inquiries —
// in ONE place, classified by STATUS (chips), not by object type. Each card carries a
// small KIND label + a kind-specific action. The action routes back via onAction(item).

const T = {
  ar: {
    title: 'طلباتي', sub: 'كل طلباتك — مُدار، عرض سعر، شراء مباشر، وعيّنات — بمكان واحد',
    buckets: { needs_action: 'يحتاج تصرّفك', in_progress: 'قيد التنفيذ', completed: 'مكتمل' },
    kinds: { managed: 'طلب مُدار', rfq: 'طلب عرض سعر', direct: 'شراء مباشر', sample: 'عيّنة', inquiry: 'استفسار', message: 'رسالة' },
    actions: { review_managed_offer: 'راجع العرض واعتمده ←', track_managed: 'متابعة الطلب المُدار ←', review_offers: 'قارن العروض ←', view_request: 'عرض الطلب ←', pay_order: 'ادفع ←', confirm_receipt: 'أكّد الاستلام ←', track_order: 'تتبّع الطلب ←', view_sample: 'عرض العيّنة ←', view_inquiry: 'عرض الاستفسار ←', reply_message: 'ردّ ←' },
    party: 'مورد', qty: 'الكمية', empty: 'لا شيء هنا الآن.', loading: 'جارٍ التحميل…',
  },
  en: {
    title: 'My Requests', sub: 'Everything you have — managed, RFQ, direct purchase, samples — in one place',
    buckets: { needs_action: 'Needs your action', in_progress: 'In progress', completed: 'Completed' },
    kinds: { managed: 'Managed order', rfq: 'Quote request', direct: 'Direct purchase', sample: 'Sample', inquiry: 'Inquiry', message: 'Message' },
    actions: { review_managed_offer: 'Review & approve offer →', track_managed: 'Track managed order →', review_offers: 'Compare offers →', view_request: 'View request →', pay_order: 'Pay →', confirm_receipt: 'Confirm receipt →', track_order: 'Track order →', view_sample: 'View sample →', view_inquiry: 'View inquiry →', reply_message: 'Reply →' },
    party: 'Supplier', qty: 'Qty', empty: 'Nothing here right now.', loading: 'Loading…',
  },
  zh: {
    title: '我的需求', sub: '所有需求——托管、询价、直接采购、样品——集中一处',
    buckets: { needs_action: '待您处理', in_progress: '进行中', completed: '已完成' },
    kinds: { managed: '托管订单', rfq: '询价', direct: '直接采购', sample: '样品', inquiry: '咨询', message: '消息' },
    actions: { review_managed_offer: '审核并批准报价 →', track_managed: '跟踪托管订单 →', review_offers: '比较报价 →', view_request: '查看需求 →', pay_order: '支付 →', confirm_receipt: '确认收货 →', track_order: '跟踪订单 →', view_sample: '查看样品 →', view_inquiry: '查看咨询 →', reply_message: '回复 →' },
    party: '供应商', qty: '数量', empty: '暂无内容。', loading: '加载中…',
  },
};

// Actions that are payment / receipt urgencies get a red accent (matches the mockup).
const RED_ACTIONS = new Set(['pay_order', 'confirm_receipt']);

export default function BuyerRequestsPanel({ sb, buyerId, lang = 'ar', onAction }) {
  const c = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const arFont = isAr ? { fontFamily: 'var(--font-ar)' } : {};
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [bucket, setBucket] = useState('needs_action');
  const [names, setNames] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { items: it, counts: ct } = await fetchBuyerActionItems(sb, buyerId, lang);
      if (!alive) return;
      setItems(it); setCounts(ct); setLoading(false);
      const ids = [...new Set(it.map((x) => x.partyId).filter(Boolean))];
      if (ids.length) {
        const { data } = await sb.from('profile_directory').select('id, full_name, company_name').in('id', ids);
        if (alive && data) setNames(data.reduce((a, p) => ({ ...a, [p.id]: p.company_name || p.full_name }), {}));
      }
    })();
    return () => { alive = false; };
  }, [sb, buyerId, lang]);

  const inBucket = items.filter((x) => x.bucket === bucket);
  const shown = bucket === 'needs_action' ? sortByUrgency(inBucket) : inBucket;

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: isAr ? 24 : 30, fontWeight: 300, marginBottom: 4, color: 'var(--text-primary)', ...arFont }}>{c.title}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 16, ...arFont }}>{c.sub}</p>

      {/* status chips — active = Maabar ink (matches SupplierRequestsPanel) */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 18, paddingBottom: 2 }}>
        {BUYER_BUCKETS.map((b) => (
          <button key={b} onClick={() => setBucket(b)}
            style={{ padding: '7px 15px', borderRadius: 'var(--radius-pill)', border: '1px solid', whiteSpace: 'nowrap', cursor: 'pointer', fontSize: 13, minHeight: 34, ...arFont,
              background: bucket === b ? 'var(--text-primary)' : 'var(--bg-raised)',
              color: bucket === b ? 'var(--bg-base, #fff)' : 'var(--text-disabled)',
              borderColor: bucket === b ? 'var(--text-primary)' : 'var(--border-subtle)',
              fontWeight: bucket === b ? 600 : 400 }}>
            {c.buckets[b]}{counts[b] ? ` · ${counts[b]}` : ''}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{c.loading}</p>
      ) : shown.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '54px 20px' }}><p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{c.empty}</p></div>
      ) : shown.map((it) => {
        const isRed = RED_ACTIONS.has(it.action);
        const railColor = it.bucket === 'needs_action' ? (isRed ? 'var(--red, #C0503F)' : 'var(--bronze, #8B7355)') : undefined;
        const actColor = isRed ? 'var(--red, #C0503F)' : 'var(--bronze, #8B7355)';
        return (
          <button key={it.key} type="button" onClick={() => onAction?.(it)}
            style={{ display: 'block', width: '100%', textAlign: isAr ? 'right' : 'left', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
              [isAr ? 'borderRight' : 'borderLeft']: railColor ? `3px solid ${railColor}` : undefined,
              borderRadius: 'var(--radius-lg)', padding: '15px 16px', marginBottom: 10, cursor: 'pointer' }}>
            <span style={{ fontSize: 10.5, letterSpacing: isAr ? 0 : 1.4, textTransform: isAr ? 'none' : 'uppercase', color: 'var(--bronze, #8B7355)', fontWeight: 600, display: 'block', marginBottom: 5, ...arFont }}>{c.kinds[it.kind]}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45, ...arFont }}>{it.title ? <TranslatedText text={it.title} lang={lang} /> : (names[it.partyId] || c.party)}</h3>
              <span style={{ fontSize: 11.5, color: it.bucket === 'needs_action' ? actColor : 'var(--text-disabled)', whiteSpace: 'nowrap', fontWeight: it.bucket === 'needs_action' ? 600 : 400, ...arFont }}>
                {it.bucket === 'needs_action' ? waitingLabel(it.waitingSince, lang) : ''}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-disabled)', marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap', ...arFont }}>
              {names[it.partyId] && <span>{names[it.partyId]}</span>}
              {it.qty ? <span>{c.qty} {it.qty}{it.unit ? ` ${it.unit}` : ''}</span> : null}
              {it.extra?.offers ? <span>{it.extra.offers} {isAr ? 'عروض' : 'offers'}</span> : null}
            </div>
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 600, color: actColor, ...arFont }}>
              {c.actions[it.action] || ''}
            </div>
          </button>
        );
      })}
    </div>
  );
}
