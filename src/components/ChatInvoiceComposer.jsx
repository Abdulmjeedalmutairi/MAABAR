import React, { useEffect, useState } from 'react';
import { fetchMyProductsForInvoice, issueChatInvoice } from '../lib/orderInvoice';

// Supplier composes a chat invoice. Two modes:
//  • standalone (header "🧾 Invoice"): pick a product + qty + agreed unit price.
//  • from a purchase request: the product is locked, the buyer's variants are pre-
//    filled (supplier enters a USD unit price per variant), and the request's
//    details flow into the invoice's specs panel. On issue the parent sends an
//    [invoice:ID] message and the request flips to "quoted".
const T = {
  ar: {
    title: 'إصدار فاتورة', product: 'المنتج', qty: 'الكمية', price: 'سعر الوحدة (المتفق)',
    variant: 'المواصفة', unit: 'سعر الوحدة', currency: 'العملة',
    material: 'المادة', lead: 'مدة التجهيز', incoterms: 'Incoterms', port: 'ميناء الشحن', notes: 'ملاحظات',
    fee: 'رسوم مَعبر (5%)', total: 'الإجمالي', issue: 'إصدار وإرسال', cancel: 'إلغاء',
    none: 'لا توجد منتجات نشطة.', issuing: 'جارٍ الإصدار…', priceNote: 'أسعارك بالدولار — يشوفها التاجر بالريال تلقائياً.',
  },
  en: {
    title: 'Issue invoice', product: 'Product', qty: 'Quantity', price: 'Unit price (agreed)',
    variant: 'Spec', unit: 'Unit price', currency: 'Currency',
    material: 'Material', lead: 'Lead time', incoterms: 'Incoterms', port: 'Port of loading', notes: 'Notes',
    fee: 'Maabar fee (5%)', total: 'Total', issue: 'Issue & send', cancel: 'Cancel',
    none: 'No active products.', issuing: 'Issuing…', priceNote: 'Your prices are in USD — the buyer sees SAR automatically.',
  },
};
const money = (n, c) => `${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c || 'USD'}`;

export default function ChatInvoiceComposer({ buyerId, lang = 'ar', onIssued, onClose, request = null }) {
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const fromReq = !!request;
  const [products, setProducts] = useState([]);
  const [productRef, setProductRef] = useState(request?.product_ref || '');
  const [qty, setQty] = useState(String(request?.quantity || '1'));
  const [price, setPrice] = useState('');
  // variant rows (from-request mode): [{label, qty, unit_price}]
  const [rows, setRows] = useState(
    fromReq
      ? (Array.isArray(request.variants) && request.variants.length
          ? request.variants.map((v) => ({ label: v.label || '', qty: v.qty || 0, unit_price: '' }))
          : [{ label: '', qty: Number(request.quantity) || 1, unit_price: '' }])
      : [],
  );
  const [currency, setCurrency] = useState(fromReq ? 'USD' : 'SAR');
  const [material, setMaterial] = useState('');
  const [lead, setLead] = useState('');
  const [incoterms, setIncoterms] = useState(request?.details?.incoterms || '');
  const [port, setPort] = useState('');
  const [notes, setNotes] = useState(request?.details?.notes || '');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await fetchMyProductsForInvoice();
      setProducts(list);
      if (!fromReq && list[0]) setProductRef(list[0].id);
    })();
  }, [fromReq]);

  const prod = products.find((p) => p.id === productRef);
  const pname = (isAr ? prod?.name_ar : prod?.name_en) || prod?.name_ar || prod?.name_en || '';
  if (!fromReq) { const c = prod?.currency; if (c && c !== currency) { /* keep supplier currency */ } }

  const setRow = (i, k, v) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));

  const subtotal = fromReq
    ? rows.reduce((s, r) => s + (Number(r.qty) || 0) * (Number(r.unit_price) || 0), 0)
    : (Number(qty) || 0) * (Number(price) || 0);
  const fee = Math.round(subtotal * 5) / 100;
  const total = subtotal + fee;
  const cur = fromReq ? currency : (prod?.currency || 'SAR');

  const buildSpecs = () => {
    const d = request?.details || {};
    return [
      rowdef('المادة · Material', material),
      rowdef('التخصيص · Customization', d.customization),
      rowdef('التغليف · Packaging', d.packaging),
      rowdef('مدة التجهيز · Lead time', lead),
      rowdef('الوجهة · Destination', d.destination),
      rowdef('الموعد · Needed by', d.deadline),
      d.target_price ? { k: 'السعر المستهدف · Target', v: `${d.target_price} ${d.target_currency || 'USD'}` } : null,
      d.notes ? { k: 'ملاحظات · Notes', v: String(d.notes), wide: true } : null,
    ].filter(Boolean);
  };
  const rowdef = (k, v) => (v && String(v).trim() ? { k, v: String(v).trim() } : null);

  const doIssue = async () => {
    if (!productRef || !buyerId) return;
    setBusy(true);
    try {
      let payload = { buyerId, productRef, currency: cur, incoterms: incoterms || null, port: port || null, notes: notes || null };
      if (fromReq) {
        const lineItems = rows
          .filter((r) => (Number(r.qty) || 0) > 0)
          .map((r) => ({
            desc: pname || (isAr ? 'منتج' : 'Product'),
            variant: r.label || undefined,
            qty: Number(r.qty) || 0,
            unit_price: Number(r.unit_price) || 0,
            amount: (Number(r.qty) || 0) * (Number(r.unit_price) || 0),
            attrs: r.label ? [{ k: t.variant, v: r.label }] : undefined,
          }));
        payload = { ...payload, lineItems, specs: buildSpecs(), requestId: request.id };
      } else {
        payload = { ...payload, quantity: qty, unitPrice: price };
      }
      const inv = await issueChatInvoice(payload);
      onIssued?.(inv);
    } catch (e) { alert(e.message || 'Error'); setBusy(false); }
  };

  const input = { width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, boxSizing: 'border-box', marginTop: 5 };
  const lbl = { fontSize: 12, color: 'var(--text-secondary)' };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'} style={{ background: 'var(--bg-overlay)', borderRadius: 14, maxWidth: 480, width: '100%', overflow: 'hidden' }}>
        <div style={{ background: '#0E0D0C', color: '#F3EFE7', padding: '15px 22px', fontSize: 16, fontWeight: 600, borderBottom: '2px solid #9A7B4F' }}>{t.title}</div>
        <div style={{ padding: '18px 22px', maxHeight: '68vh', overflowY: 'auto' }}>
          {(!fromReq && products.length === 0) ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>{t.none}</p>
          ) : (
            <>
              {fromReq ? (
                <>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{pname}</div>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: '0 0 12px' }}>{t.priceNote}</p>
                  <label style={{ ...lbl, display: 'block', marginBottom: 6 }}>{t.currency}
                    <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ ...input, maxWidth: 120 }}>
                      <option>USD</option><option>SAR</option><option>CNY</option>
                    </select>
                  </label>
                  {rows.map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                      <input value={r.label} onChange={(e) => setRow(i, 'label', e.target.value)} style={{ ...input, flex: 2, marginTop: 0 }} placeholder={t.variant} />
                      <input type="number" value={r.qty} onChange={(e) => setRow(i, 'qty', e.target.value)} style={{ ...input, flex: 1, marginTop: 0 }} placeholder={t.qty} />
                      <input type="number" value={r.unit_price} onChange={(e) => setRow(i, 'unit_price', e.target.value)} style={{ ...input, flex: 1, marginTop: 0 }} placeholder={t.unit} />
                    </div>
                  ))}
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <label style={{ ...lbl, flex: 1 }}>{t.material}<input value={material} onChange={(e) => setMaterial(e.target.value)} style={input} /></label>
                    <label style={{ ...lbl, flex: 1 }}>{t.lead}<input value={lead} onChange={(e) => setLead(e.target.value)} style={input} /></label>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                    <label style={{ ...lbl, flex: 1 }}>{t.incoterms}<input value={incoterms} onChange={(e) => setIncoterms(e.target.value)} style={input} placeholder="FOB…" /></label>
                    <label style={{ ...lbl, flex: 1 }}>{t.port}<input value={port} onChange={(e) => setPort(e.target.value)} style={input} /></label>
                  </div>
                </>
              ) : (
                <>
                  <label style={{ ...lbl, display: 'block' }}>{t.product}
                    <select value={productRef} onChange={(e) => setProductRef(e.target.value)} style={input}>
                      {products.map((p) => <option key={p.id} value={p.id}>{(isAr ? p.name_ar : p.name_en) || p.name_ar || p.name_en || p.id}</option>)}
                    </select>
                  </label>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <label style={{ ...lbl, flex: 1 }}>{t.qty}<input type="number" value={qty} onChange={(e) => setQty(e.target.value)} style={input} /></label>
                    <label style={{ ...lbl, flex: 1 }}>{t.price}<input type="number" value={price} onChange={(e) => setPrice(e.target.value)} style={input} /></label>
                  </div>
                  <label style={{ ...lbl, display: 'block', marginTop: 12 }}>{t.notes}<input value={notes} onChange={(e) => setNotes(e.target.value)} style={input} /></label>
                </>
              )}
              <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#9A7B4F', fontWeight: 600 }}><span>{t.fee}</span><span>{money(fee, cur)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}><span>{t.total}</span><span>{money(total, cur)}</span></div>
              </div>
            </>
          )}
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border-muted)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>{t.cancel}</button>
          {(fromReq || products.length > 0) && (
            <button onClick={doIssue} disabled={busy || !productRef} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#141210', color: '#F7F4EE', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{busy ? t.issuing : t.issue}</button>
          )}
        </div>
      </div>
    </div>
  );
}
