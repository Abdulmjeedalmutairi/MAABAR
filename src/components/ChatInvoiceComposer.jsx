import React, { useEffect, useState } from 'react';
import { fetchMyProductsForInvoice, issueChatInvoice } from '../lib/orderInvoice';

// Supplier composes a chat invoice: pick a product, quantity, agreed unit price.
// On issue, the parent sends an [invoice:ID] message into the conversation.
const T = {
  ar: { title: 'إصدار فاتورة', product: 'المنتج', qty: 'الكمية', price: 'سعر الوحدة (المتفق)', notes: 'ملاحظات (اختياري)', fee: 'رسوم مَعبر (5%)', total: 'الإجمالي', issue: 'إصدار وإرسال', cancel: 'إلغاء', none: 'لا توجد منتجات نشطة.', issuing: 'جارٍ الإصدار…' },
  en: { title: 'Issue invoice', product: 'Product', qty: 'Quantity', price: 'Unit price (agreed)', notes: 'Notes (optional)', fee: 'Maabar fee (5%)', total: 'Total', issue: 'Issue & send', cancel: 'Cancel', none: 'No active products.', issuing: 'Issuing…' },
};
const money = (n, c) => `${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c || 'SAR'}`;

export default function ChatInvoiceComposer({ buyerId, lang = 'ar', onIssued, onClose }) {
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const [products, setProducts] = useState([]);
  const [productRef, setProductRef] = useState('');
  const [qty, setQty] = useState('1');
  const [price, setPrice] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const currency = products.find(p => p.id === productRef)?.currency || 'SAR';

  useEffect(() => {
    (async () => {
      const list = await fetchMyProductsForInvoice();
      setProducts(list);
      if (list[0]) setProductRef(list[0].id);
    })();
  }, []);

  const onPick = (id) => setProductRef(id);

  const subtotal = (Number(qty) || 0) * (Number(price) || 0);
  const fee = Math.round(subtotal * 5) / 100;
  const total = subtotal + fee;

  const doIssue = async () => {
    if (!productRef || !buyerId) return;
    setBusy(true);
    try {
      const inv = await issueChatInvoice({ buyerId, productRef, quantity: qty, unitPrice: price, notes, currency });
      onIssued?.(inv);
    } catch (e) { alert(e.message || 'Error'); setBusy(false); }
  };

  const input = { width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13, marginTop: 5 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'} style={{ background: 'var(--bg-overlay)', borderRadius: 16, maxWidth: 440, width: '100%', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#0C6B5A,#0a5849)', color: '#fff', padding: '16px 22px', fontSize: 16, fontWeight: 600 }}>{t.title}</div>
        <div style={{ padding: '18px 22px' }}>
          {products.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, padding: '20px 0', textAlign: 'center' }}>{t.none}</p>
          ) : (
            <>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.product}
                <select value={productRef} onChange={e => onPick(e.target.value)} style={input}>
                  {products.map(p => <option key={p.id} value={p.id}>{(isAr ? p.name_ar : p.name_en) || p.name_ar || p.name_en || p.id}</option>)}
                </select>
              </label>
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{t.qty}
                  <input type="number" value={qty} onChange={e => setQty(e.target.value)} style={input} />
                </label>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1 }}>{t.price}
                  <input type="number" value={price} onChange={e => setPrice(e.target.value)} style={input} />
                </label>
              </div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginTop: 12 }}>{t.notes}
                <input value={notes} onChange={e => setNotes(e.target.value)} style={input} />
              </label>
              <div style={{ marginTop: 16, padding: '12px 14px', background: 'var(--bg-subtle)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: '#0a5849', fontWeight: 600 }}><span>{t.fee}</span><span>{money(fee, currency)}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginTop: 6 }}><span>{t.total}</span><span>{money(total, currency)}</span></div>
              </div>
            </>
          )}
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border-muted)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>{t.cancel}</button>
          {products.length > 0 && (
            <button onClick={doIssue} disabled={busy || !productRef} style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: '#0C6B5A', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{busy ? t.issuing : t.issue}</button>
          )}
        </div>
      </div>
    </div>
  );
}
