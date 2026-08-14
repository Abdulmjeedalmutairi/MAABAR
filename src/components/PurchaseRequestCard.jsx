import React, { useEffect, useState } from 'react';
import { fetchPurchaseRequest, declinePurchaseRequest } from '../lib/purchaseRequest';

// Renders a purchase request inside the chat (the [request:ID] message). The buyer
// sees the status ("awaiting supplier"); the supplier gets Issue-invoice / Decline.
// onIssue(request) asks the parent Chat to open the invoice composer pre-filled.
const T = {
  ar: {
    title: 'طلب شراء', qty: 'الكمية', dest: 'الوجهة', target: 'السعر المستهدف',
    incoterms: 'Incoterms', deadline: 'الموعد', custom: 'التخصيص', packaging: 'التغليف', notes: 'ملاحظات',
    awaiting: '🕓 بانتظار رد المورّد', quoted: '✓ صدرت الفاتورة', declined: 'رفض المورّد الطلب',
    issue: 'أصدر فاتورة', decline: 'رفض', declining: '…',
  },
  en: {
    title: 'Purchase request', qty: 'Qty', dest: 'Destination', target: 'Target price',
    incoterms: 'Incoterms', deadline: 'Needed by', custom: 'Customization', packaging: 'Packaging', notes: 'Notes',
    awaiting: '🕓 Awaiting supplier', quoted: '✓ Invoice issued', declined: 'Supplier declined',
    issue: 'Issue invoice', decline: 'Decline', declining: '…',
  },
};

export default function PurchaseRequestCard({ requestId, myId, lang = 'ar', onIssue, onChanged }) {
  const isAr = lang === 'ar';
  const t = T[lang] || T.ar;
  const [req, setReq] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let off = false;
    (async () => { const d = await fetchPurchaseRequest(requestId); if (!off) setReq(d); })();
    return () => { off = true; };
  }, [requestId]);

  if (!req) return <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>…</div>;
  const isSupplier = req.supplier_id === myId;
  const pname = (isAr ? req.product?.name_ar : req.product?.name_en) || req.product?.name_ar || req.product?.name_en || '';
  const d = req.details || {};
  const variants = Array.isArray(req.variants) ? req.variants.filter((v) => v.label || v.qty) : [];

  const rows = [
    req.quantity && [t.qty, String(req.quantity)],
    d.destination && [t.dest, d.destination],
    d.target_price && [t.target, `${d.target_price} ${d.target_currency || 'USD'}`],
    d.incoterms && [t.incoterms, d.incoterms],
    d.deadline && [t.deadline, d.deadline],
    d.customization && [t.custom, d.customization],
    d.packaging && [t.packaging, d.packaging],
    d.notes && [t.notes, d.notes],
  ].filter(Boolean);

  const doDecline = async () => {
    setBusy(true);
    try { await declinePurchaseRequest(req.id); setReq((r) => ({ ...r, status: 'declined' })); onChanged?.(); }
    catch (e) { alert(e.message); } setBusy(false);
  };

  const chip = req.status === 'quoted'
    ? { text: t.quoted, c: '#2F5D3A', bg: 'rgba(47,93,58,0.1)' }
    : req.status === 'declined'
      ? { text: t.declined, c: '#a23628', bg: 'rgba(162,54,40,0.1)' }
      : { text: t.awaiting, c: '#9A7B4F', bg: 'rgba(154,123,79,0.12)' };

  return (
    <div style={{ border: '1px solid rgba(154,123,79,0.35)', borderRadius: 12, overflow: 'hidden', maxWidth: 300, background: '#F7F4EE', boxShadow: '0 6px 20px -8px rgba(20,18,16,0.4)' }}>
      <div style={{ background: '#0E0D0C', color: '#F3EFE7', padding: '9px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #9A7B4F' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700 }}>📝 {t.title}</span>
      </div>
      <div style={{ padding: '11px 13px', color: '#141210' }}>
        {pname && <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>{pname}</div>}
        {variants.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
            {variants.map((v, i) => (
              <span key={i} style={{ fontSize: 11, background: 'rgba(20,18,16,0.05)', border: '1px solid #DcD4C4', borderRadius: 5, padding: '2px 7px' }}>
                {v.label}{v.qty ? ` × ${v.qty}` : ''}
              </span>
            ))}
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '3px 10px', fontSize: 11.5 }}>
          {rows.map(([k, v], i) => (
            <React.Fragment key={i}>
              <span style={{ color: '#8F887C' }}>{k}</span>
              <span style={{ color: '#3A342C' }}>{v}</span>
            </React.Fragment>
          ))}
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: chip.c, background: chip.bg, padding: '3px 9px', borderRadius: 999 }}>{chip.text}</span>
          {isSupplier && req.status === 'pending' && (
            <>
              <button onClick={() => onIssue?.(req)} style={{ padding: '6px 12px', fontSize: 11.5, fontWeight: 600, border: 'none', borderRadius: 8, background: '#141210', color: '#F7F4EE', cursor: 'pointer' }}>{t.issue}</button>
              <button onClick={doDecline} disabled={busy} style={{ padding: '6px 10px', fontSize: 11.5, border: '1px solid #c0503f', borderRadius: 8, background: 'none', color: '#c0503f', cursor: 'pointer' }}>{busy ? t.declining : t.decline}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
