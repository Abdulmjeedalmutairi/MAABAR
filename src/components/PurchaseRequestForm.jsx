import React, { useState } from 'react';
import { createPurchaseRequest, sendRequestToSupplierChat } from '../lib/purchaseRequest';

// Buyer's structured purchase request on a product. On submit it creates the
// request, drops a [request:ID] card into the chat with the supplier, and calls
// onSubmitted(request) so the parent can open that conversation.
const T = {
  ar: {
    title: 'طلب شراء', req: 'مطلوب', opt: 'اختياري',
    qty: 'الكمية الإجمالية', dest: 'الوجهة (المدينة / الميناء)',
    variants: 'المتغيّرات (لون / مقاس)', variantsHint: 'أضف صفًّا لكل لون أو مقاس مع كميته — اختياري',
    vlabel: 'المواصفة (مثال: أسود · L)', vqty: 'الكمية', addV: '+ متغيّر',
    target: 'السعر المستهدف', cur: 'العملة', incoterms: 'شروط التسليم (Incoterms)',
    deadline: 'الموعد المطلوب', custom: 'التخصيص / العلامة الخاصة', packaging: 'التغليف', notes: 'ملاحظات',
    send: 'إرسال الطلب للمورّد', sending: 'جارٍ الإرسال…', cancel: 'إلغاء',
    needQty: 'أدخل الكمية.', needDest: 'أدخل الوجهة.',
    intro: 'عبّئ تفاصيل طلبك ويصل المورّد في المحادثة ليصدر لك فاتورة بالسعر المتّفق.',
  },
  en: {
    title: 'Purchase request', req: 'required', opt: 'optional',
    qty: 'Total quantity', dest: 'Destination (city / port)',
    variants: 'Variants (colour / size)', variantsHint: 'Add a row per colour or size with its quantity — optional',
    vlabel: 'Spec (e.g. Black · L)', vqty: 'Qty', addV: '+ Variant',
    target: 'Target price', cur: 'Currency', incoterms: 'Incoterms',
    deadline: 'Needed by', custom: 'Customization / private label', packaging: 'Packaging', notes: 'Notes',
    send: 'Send request to supplier', sending: 'Sending…', cancel: 'Cancel',
    needQty: 'Enter the quantity.', needDest: 'Enter the destination.',
    intro: 'Fill in your order details; the supplier receives it in chat and issues an invoice at the agreed price.',
  },
};

export default function PurchaseRequestForm({ product, lang = 'ar', onClose, onSubmitted }) {
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const [qty, setQty] = useState('');
  const [dest, setDest] = useState('');
  const [variants, setVariants] = useState([]);
  const [target, setTarget] = useState('');
  const [targetCur, setTargetCur] = useState('USD');
  const [incoterms, setIncoterms] = useState('');
  const [deadline, setDeadline] = useState('');
  const [custom, setCustom] = useState('');
  const [packaging, setPackaging] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  const addVariant = () => setVariants((v) => [...v, { label: '', qty: '' }]);
  const setVariant = (i, k, val) => setVariants((v) => v.map((row, idx) => (idx === i ? { ...row, [k]: val } : row)));
  const rmVariant = (i) => setVariants((v) => v.filter((_, idx) => idx !== i));

  const submit = async () => {
    setErr('');
    if (!qty || Number(qty) <= 0) { setErr(t.needQty); return; }
    if (!dest.trim()) { setErr(t.needDest); return; }
    setBusy(true);
    try {
      const cleanVariants = variants
        .filter((v) => (v.label || '').trim() || v.qty)
        .map((v) => ({ label: (v.label || '').trim(), qty: Number(v.qty) || 0 }));
      const details = {};
      if (dest.trim()) details.destination = dest.trim();
      if (target) { details.target_price = Number(target); details.target_currency = targetCur; }
      if (incoterms.trim()) details.incoterms = incoterms.trim();
      if (deadline) details.deadline = deadline;
      if (custom.trim()) details.customization = custom.trim();
      if (packaging.trim()) details.packaging = packaging.trim();
      if (notes.trim()) details.notes = notes.trim();
      const request = await createPurchaseRequest({ productRef: product.id, quantity: qty, variants: cleanVariants, details });
      await sendRequestToSupplierChat(request);
      onSubmitted?.(request);
    } catch (e) { setErr(e.message || 'Error'); setBusy(false); }
  };

  const label = { fontSize: 11.5, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 };
  const input = { width: '100%', padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13.5, boxSizing: 'border-box' };
  const tag = (kind) => (
    <span style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: kind === 'req' ? '#9A7B4F' : 'var(--text-tertiary)', marginInlineStart: 6 }}>
      {kind === 'req' ? t.req : t.opt}
    </span>
  );
  const pname = (isAr ? product?.name_ar : product?.name_en) || product?.name_ar || product?.name_en || '';

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '20px 12px' }}>
      <div onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'} style={{ background: 'var(--bg-overlay)', borderRadius: 14, maxWidth: 480, width: '100%', overflow: 'hidden' }}>
        <div style={{ background: '#0E0D0C', color: '#F3EFE7', padding: '16px 22px', borderBottom: '2px solid #9A7B4F' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{t.title}</div>
          {pname && <div style={{ fontSize: 12, color: 'rgba(243,239,231,0.65)', marginTop: 3 }}>{pname}</div>}
        </div>
        <div style={{ padding: '18px 22px', maxHeight: '66vh', overflowY: 'auto' }}>
          <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.6 }}>{t.intro}</p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>{t.qty}{tag('req')}</label>
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} style={input} />
            </div>
            <div style={{ flex: 1.4 }}>
              <label style={label}>{t.dest}{tag('req')}</label>
              <input value={dest} onChange={(e) => setDest(e.target.value)} style={input} placeholder={isAr ? 'جدة / ميناء' : 'Jeddah / port'} />
            </div>
          </div>

          {/* Variants */}
          <div style={{ marginBottom: 14 }}>
            <label style={label}>{t.variants}{tag('opt')}</label>
            <div style={{ fontSize: 10.5, color: 'var(--text-tertiary)', marginBottom: 8 }}>{t.variantsHint}</div>
            {variants.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                <input value={v.label} onChange={(e) => setVariant(i, 'label', e.target.value)} style={{ ...input, flex: 2 }} placeholder={t.vlabel} />
                <input type="number" value={v.qty} onChange={(e) => setVariant(i, 'qty', e.target.value)} style={{ ...input, flex: 1 }} placeholder={t.vqty} />
                <button onClick={() => rmVariant(i)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>×</button>
              </div>
            ))}
            <button onClick={addVariant} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12 }}>{t.addV}</button>
          </div>

          {/* Optional details */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>{t.target}{tag('opt')}</label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input type="number" value={target} onChange={(e) => setTarget(e.target.value)} style={{ ...input, flex: 2 }} />
                <select value={targetCur} onChange={(e) => setTargetCur(e.target.value)} style={{ ...input, flex: 1, padding: '9px 6px' }}>
                  <option>USD</option><option>SAR</option><option>CNY</option>
                </select>
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>{t.deadline}{tag('opt')}</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={input} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>{t.incoterms}{tag('opt')}</label>
              <input value={incoterms} onChange={(e) => setIncoterms(e.target.value)} style={input} placeholder="FOB / CIF…" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>{t.packaging}{tag('opt')}</label>
              <input value={packaging} onChange={(e) => setPackaging(e.target.value)} style={input} />
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>{t.custom}{tag('opt')}</label>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} style={input} />
          </div>
          <div style={{ marginBottom: 4 }}>
            <label style={label}>{t.notes}{tag('opt')}</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...input, resize: 'vertical' }} />
          </div>

          {err && <div style={{ marginTop: 12, fontSize: 12.5, color: '#c0392b' }}>{err}</div>}
        </div>
        <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border-muted)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>{t.cancel}</button>
          <button onClick={submit} disabled={busy} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#141210', color: '#F7F4EE', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{busy ? t.sending : t.send}</button>
        </div>
      </div>
    </div>
  );
}
