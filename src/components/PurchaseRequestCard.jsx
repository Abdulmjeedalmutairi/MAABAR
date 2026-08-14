import React, { useEffect, useState } from 'react';
import { fetchPurchaseRequest, declinePurchaseRequest } from '../lib/purchaseRequest';

// Renders a purchase request inside the chat (the [request:ID] message): a card
// with the product image + name + a short summary, a "Details" button that opens
// the full request, and — for the supplier — Issue-invoice / Decline.
// onIssue(request) asks the parent Chat to open the invoice composer pre-filled.
const T = {
  ar: {
    heading: 'لديك طلب شراء', headingBuyer: 'طلب شراء', details: 'التفاصيل',
    qty: 'الكمية', dest: 'الوجهة', target: 'السعر المستهدف', incoterms: 'Incoterms',
    deadline: 'الموعد', custom: 'التخصيص', packaging: 'التغليف', notes: 'ملاحظات', variants: 'المتغيّرات',
    awaiting: '🕓 بانتظار ردّك', awaitingBuyer: '🕓 بانتظار رد المورّد', quoted: '✓ صدرت الفاتورة', declined: 'مرفوض',
    issue: 'أصدر فاتورة', decline: 'رفض', close: 'إغلاق',
  },
  en: {
    heading: 'You have a purchase request', headingBuyer: 'Purchase request', details: 'Details',
    qty: 'Quantity', dest: 'Destination', target: 'Target price', incoterms: 'Incoterms',
    deadline: 'Needed by', custom: 'Customization', packaging: 'Packaging', notes: 'Notes', variants: 'Variants',
    awaiting: '🕓 Awaiting your reply', awaitingBuyer: '🕓 Awaiting supplier', quoted: '✓ Invoice issued', declined: 'Declined',
    issue: 'Issue invoice', decline: 'Decline', close: 'Close',
  },
};

export default function PurchaseRequestCard({ requestId, myId, lang = 'ar', onIssue, onChanged }) {
  const isAr = lang === 'ar';
  const t = T[lang] || T.ar;
  const [req, setReq] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let off = false;
    (async () => { const d = await fetchPurchaseRequest(requestId); if (!off) setReq(d); })();
    return () => { off = true; };
  }, [requestId]);

  if (!req) return <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>…</div>;
  const isSupplier = req.supplier_id === myId;
  const pname = (isAr ? req.product?.name_ar : req.product?.name_en) || req.product?.name_ar || req.product?.name_en || '';
  const img = req.product?.image || '';
  const d = req.details || {};
  const variants = Array.isArray(req.variants) ? req.variants.filter((v) => v.label || v.qty) : [];
  const isPending = req.status === 'pending';

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
    try { await declinePurchaseRequest(req.id); setReq((r) => ({ ...r, status: 'declined' })); setOpen(false); onChanged?.(); }
    catch (e) { alert(e.message); } setBusy(false);
  };

  const chip = req.status === 'quoted'
    ? { text: t.quoted, c: '#2F5D3A', bg: 'rgba(47,93,58,0.1)' }
    : req.status === 'declined'
      ? { text: t.declined, c: '#a23628', bg: 'rgba(162,54,40,0.1)' }
      : { text: isSupplier ? t.awaiting : t.awaitingBuyer, c: '#9A7B4F', bg: 'rgba(154,123,79,0.12)' };

  const actions = (big) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: big ? 16 : 10 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: chip.c, background: chip.bg, padding: '3px 9px', borderRadius: 999 }}>{chip.text}</span>
      {isSupplier && isPending && (
        <>
          <button onClick={() => { setOpen(false); onIssue?.(req); }} style={{ padding: '6px 12px', fontSize: 11.5, fontWeight: 600, border: 'none', borderRadius: 8, background: '#141210', color: '#F7F4EE', cursor: 'pointer' }}>{t.issue}</button>
          <button onClick={doDecline} disabled={busy} style={{ padding: '6px 10px', fontSize: 11.5, border: '1px solid #c0503f', borderRadius: 8, background: 'none', color: '#c0503f', cursor: 'pointer' }}>{t.decline}</button>
        </>
      )}
    </div>
  );

  return (
    <>
      <div style={{ border: '1px solid rgba(154,123,79,0.35)', borderRadius: 12, overflow: 'hidden', maxWidth: 320, background: '#F7F4EE', boxShadow: '0 6px 20px -8px rgba(20,18,16,0.4)' }}>
        <div style={{ background: '#0E0D0C', color: '#F3EFE7', padding: '9px 13px', display: 'flex', alignItems: 'center', gap: 7, borderBottom: '2px solid #9A7B4F' }}>
          <span style={{ fontSize: 11.5, fontWeight: 700 }}>📝 {isSupplier ? t.heading : t.headingBuyer}</span>
        </div>
        <div style={{ padding: 12, color: '#141210' }}>
          <div style={{ display: 'flex', gap: 11, alignItems: 'center' }}>
            {img
              ? <img src={img} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #DcD4C4' }} />
              : <div style={{ width: 52, height: 52, borderRadius: 8, background: 'rgba(20,18,16,0.06)', flexShrink: 0 }} />}
            <div style={{ minWidth: 0, flex: 1 }}>
              {pname && <div style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pname}</div>}
              <div style={{ fontSize: 11.5, color: '#6B655B', marginTop: 2 }}>
                {req.quantity ? `${t.qty}: ${req.quantity}` : ''}{variants.length ? ` · ${variants.length} ${t.variants}` : ''}
              </div>
            </div>
          </div>
          <button onClick={() => setOpen(true)} style={{ marginTop: 10, width: '100%', padding: '7px 10px', fontSize: 11.5, fontWeight: 600, border: '1px solid #C8BEA8', borderRadius: 8, background: 'rgba(154,123,79,0.06)', color: '#3A342C', cursor: 'pointer' }}>{t.details} ›</button>
          {actions(false)}
        </div>
      </div>

      {/* Full details */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px 12px' }}>
          <div onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'} style={{ background: '#F7F4EE', color: '#141210', borderRadius: 14, maxWidth: 440, width: '100%', overflow: 'hidden' }}>
            <div style={{ background: '#0E0D0C', color: '#F3EFE7', padding: '14px 20px', fontSize: 15, fontWeight: 600, borderBottom: '2px solid #9A7B4F' }}>📝 {isSupplier ? t.heading : t.headingBuyer}</div>
            <div style={{ padding: 20, maxHeight: '66vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
                {img
                  ? <img src={img} alt="" style={{ width: 84, height: 84, borderRadius: 10, objectFit: 'cover', border: '1px solid #DcD4C4' }} />
                  : <div style={{ width: 84, height: 84, borderRadius: 10, background: 'rgba(20,18,16,0.06)' }} />}
                <div style={{ fontSize: 17, fontWeight: 600, fontFamily: "'Iowan Old Style','Palatino Linotype',Georgia,serif" }}>{pname}</div>
              </div>
              {variants.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A7B4F', marginBottom: 7 }}>{t.variants}</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {variants.map((v, i) => (
                      <span key={i} style={{ fontSize: 12, background: 'rgba(20,18,16,0.04)', border: '1px solid #DcD4C4', borderRadius: 6, padding: '3px 9px' }}>{v.label}{v.qty ? ` × ${v.qty}` : ''}</span>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '9px 14px', fontSize: 13 }}>
                {rows.map(([k, v], i) => (
                  <React.Fragment key={i}>
                    <span style={{ color: '#8F887C', fontSize: 11.5 }}>{k}</span>
                    <span style={{ color: '#3A342C' }}>{v}</span>
                  </React.Fragment>
                ))}
              </div>
              {actions(true)}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid #DcD4C4', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setOpen(false)} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #C8BEA8', background: 'none', color: '#3A342C', cursor: 'pointer', fontSize: 13 }}>{t.close}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
