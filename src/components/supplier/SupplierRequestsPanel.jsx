import React, { useEffect, useState } from 'react';
import { fetchSupplierActionItems, sortByUrgency, waitingLabel, ACTION_BUCKETS } from '../../lib/supplierActionItems';

// Unified supplier Requests tab (decision #1): everything that needs the supplier's
// response in ONE place, classified by STATUS (chips) — not by object type. Each
// card carries a small KIND label and a kind-specific action. Presentation lives
// here; the action routes back to the owner via onAction(item).

const T = {
  ar: {
    title: 'الطلبات', sub: 'كل ما يحتاج تصرّفاً منك، بمكان واحد',
    buckets: { needs_response: 'يحتاج ردّك', my_offers: 'عروضي', accepted: 'مقبولة', finished: 'منتهية' },
    kinds: { rfq: 'طلب عرض سعر', direct: 'شراء مباشر', sample: 'طلب عيّنة', inquiry: 'استفسار على منتج', message: 'رسالة' },
    actions: { submit_offer: 'قدّم عرضك ←', confirm_order: 'أكّد الطلب ←', approve_sample: 'وافق أو اعتذر ←', reply_inquiry: 'ردّ على الاستفسار ←', view_offer: 'عرض العرض ←', view_order: 'عرض الطلب ←', view_sample: 'عرض العيّنة ←', view_inquiry: 'عرض الاستفسار ←', reply_message: 'ردّ على الرسالة ←', view_message: 'عرض المحادثة ←' },
    trader: 'تاجر', qty: 'الكمية', empty: 'لا شيء هنا الآن.', loading: 'جارٍ التحميل…', browseOpen: 'تصفّح طلبات التجار المفتوحة ←',
  },
  en: {
    title: 'Requests', sub: 'Everything that needs your response, in one place',
    buckets: { needs_response: 'Needs your response', my_offers: 'My offers', accepted: 'Accepted', finished: 'Finished' },
    kinds: { rfq: 'Quote request', direct: 'Direct purchase', sample: 'Sample request', inquiry: 'Product inquiry', message: 'Message' },
    actions: { submit_offer: 'Submit your offer →', confirm_order: 'Confirm order →', approve_sample: 'Approve or decline →', reply_inquiry: 'Reply to inquiry →', view_offer: 'View offer →', view_order: 'View order →', view_sample: 'View sample →', view_inquiry: 'View inquiry →', reply_message: 'Reply →', view_message: 'View chat →' },
    trader: 'Trader', qty: 'Qty', empty: 'Nothing here right now.', loading: 'Loading…', browseOpen: 'Browse open trader requests →',
  },
  zh: {
    title: '需求', sub: '所有需要您回应的事项，集中一处',
    buckets: { needs_response: '待您回应', my_offers: '我的报价', accepted: '已接受', finished: '已完成' },
    kinds: { rfq: '询价', direct: '直接采购', sample: '样品申请', inquiry: '产品咨询', message: '消息' },
    actions: { submit_offer: '提交报价 →', confirm_order: '确认订单 →', approve_sample: '批准或拒绝 →', reply_inquiry: '回复咨询 →', view_offer: '查看报价 →', view_order: '查看订单 →', view_sample: '查看样品 →', view_inquiry: '查看咨询 →', reply_message: '回复 →', view_message: '查看对话 →' },
    trader: '采购商', qty: '数量', empty: '暂无内容。', loading: '加载中…', browseOpen: '浏览公开采购需求 →',
  },
};

export default function SupplierRequestsPanel({ sb, supplierId, lang = 'ar', onAction, onBrowseOpen }) {
  const c = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const arFont = isAr ? { fontFamily: 'var(--font-ar)' } : {};
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [bucket, setBucket] = useState('needs_response');
  const [names, setNames] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { items: it, counts: ct } = await fetchSupplierActionItems(sb, supplierId);
      if (!alive) return;
      setItems(it); setCounts(ct); setLoading(false);
      // Resolve counterparty names (supplier can read buyer profiles via the join
      // used elsewhere in the dashboard).
      const ids = [...new Set(it.map((x) => x.buyerId).filter(Boolean))];
      if (ids.length) {
        const { data } = await sb.from('profiles').select('id, full_name, company_name').in('id', ids);
        if (alive && data) setNames(data.reduce((a, p) => ({ ...a, [p.id]: p.company_name || p.full_name }), {}));
      }
    })();
    return () => { alive = false; };
  }, [sb, supplierId]);

  const inBucket = items.filter((x) => x.bucket === bucket);
  const shown = bucket === 'needs_response' ? sortByUrgency(inBucket) : inBucket;

  return (
    <div style={{ maxWidth: 640 }}>
      <h2 style={{ fontSize: isAr ? 24 : 30, fontWeight: 300, marginBottom: 4, color: 'var(--text-primary)', ...arFont }}>{c.title}</h2>
      <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 12, ...arFont }}>{c.sub}</p>
      {onBrowseOpen && (
        <button onClick={onBrowseOpen} style={{ display: 'block', marginBottom: 16, background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 600, color: 'var(--bronze, #8B7355)', cursor: 'pointer', textAlign: isAr ? 'right' : 'left', ...(isAr ? { fontFamily: 'var(--font-ar)' } : {}) }}>{c.browseOpen}</button>
      )}

      {/* status chips */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 18, paddingBottom: 2 }}>
        {ACTION_BUCKETS.map((b) => (
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
        const urgent = it.bucket === 'needs_response';
        return (
          <button key={it.key} type="button" onClick={() => onAction?.(it)}
            style={{ display: 'block', width: '100%', textAlign: isAr ? 'right' : 'left', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
              [isAr ? 'borderRight' : 'borderLeft']: urgent ? '3px solid var(--bronze, #8B7355)' : undefined,
              borderRadius: 'var(--radius-lg)', padding: '15px 16px', marginBottom: 10, cursor: 'pointer' }}>
            <span style={{ fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--bronze, #8B7355)', fontWeight: 600, display: 'block', marginBottom: 5, ...arFont }}>{c.kinds[it.kind]}</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45, ...arFont }}>{it.title || (names[it.buyerId] || c.trader)}</h3>
              <span style={{ fontSize: 11.5, color: urgent ? 'var(--bronze, #8B7355)' : 'var(--text-disabled)', whiteSpace: 'nowrap', fontWeight: urgent ? 600 : 400, ...arFont }}>
                {urgent ? waitingLabel(it.waitingSince, lang) : ''}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-disabled)', marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap', ...arFont }}>
              {names[it.buyerId] && <span>{names[it.buyerId]}</span>}
              {it.qty ? <span>{c.qty} {it.qty}{it.unit ? ` ${it.unit}` : ''}</span> : null}
            </div>
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: '1px solid var(--border-subtle)', fontSize: 13, fontWeight: 600, color: 'var(--bronze, #8B7355)', ...arFont }}>
              {c.actions[it.action] || ''}
            </div>
          </button>
        );
      })}
    </div>
  );
}
