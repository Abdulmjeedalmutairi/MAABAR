import React, { useEffect, useState } from 'react';
import { fetchInvoiceById } from '../lib/orderInvoice';
import { startTelrPayment } from '../lib/telrPay';
import { toSAR } from '../lib/currency';

// Compact invoice card inside the chat (the [invoice:ID] message), in Maabar's
// identity (dark header + wordmark). Role-aware money: the buyer sees the total
// they pay (incl. the visible 5% fee) + Pay buttons; the supplier sees only THEIR
// receivable (the goods value) — the fee is on the buyer, never shown as theirs.
const LOGO = `${(typeof window !== 'undefined' ? window.location.origin : '')}/email-logo.png`;
const money = (n, c) => `${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c || 'SAR'}`;

export default function ChatInvoiceCard({ invoiceId, myId, lang = 'ar' }) {
  const isAr = lang === 'ar';
  const [inv, setInv] = useState(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => { const d = await fetchInvoiceById(invoiceId); if (!cancelled) setInv(d); })();
    return () => { cancelled = true; };
  }, [invoiceId]);

  const t = {
    invoice: isAr ? 'فاتورة' : 'Invoice',
    feeBuyer: isAr ? 'شامل رسوم مَعبر 5%' : 'incl. 5% Maabar fee',
    receivable: isAr ? 'مستحقّك · قيمة البضاعة' : 'Your receivable · goods',
    deposit: isAr ? 'ادفع العربون (30%)' : 'Pay deposit (30%)',
    full: isAr ? 'ادفع كامل' : 'Pay in full',
    paid: isAr ? '✓ مدفوعة' : '✓ Paid',
    awaiting: isAr ? 'بانتظار دفع المشتري' : 'Awaiting buyer payment',
  };

  if (!inv) return <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>…</div>;
  const line = Array.isArray(inv.line_items) && inv.line_items[0];
  const extra = Array.isArray(inv.line_items) ? inv.line_items.length - 1 : 0;
  const isPaid = inv.status === 'paid';
  const isBuyer = inv.buyer_id === myId;
  const invCur = String(inv.currency || 'SAR').toUpperCase();
  const isUSD = invCur === 'USD';
  const goods = inv.goods_subtotal != null ? Number(inv.goods_subtotal) : Number(inv.total) / 1.05;
  // buyer sees SAR (peg 3.75) with the USD original beneath; supplier sees their USD receivable
  const primaryCur = isBuyer ? (isUSD ? 'SAR' : invCur) : invCur;
  const shown = isBuyer ? toSAR(inv.total, invCur) : goods;
  const usdRef = isBuyer && isUSD ? `≈ ${money(Number(inv.total), invCur)}` : '';

  return (
    <div style={{ border: '1px solid rgba(154,123,79,0.35)', borderRadius: 12, overflow: 'hidden', maxWidth: 300, background: '#F7F4EE', boxShadow: '0 6px 20px -8px rgba(20,18,16,0.4)' }}>
      <div style={{ background: '#0E0D0C', color: '#F3EFE7', padding: '9px 13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #9A7B4F' }}>
        <img src={LOGO} alt="MAABAR" style={{ height: 16, filter: 'brightness(0) invert(1)' }} />
        <span style={{ fontSize: 10.5, letterSpacing: '0.04em', color: 'rgba(243,239,231,0.75)', fontVariantNumeric: 'tabular-nums' }}>{inv.invoice_number}</span>
      </div>
      <div style={{ padding: '11px 13px', color: '#141210' }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#9A7B4F' }}>{t.invoice}</div>
        {line && (
          <div style={{ fontSize: 13, fontWeight: 600, color: '#141210', margin: '5px 0 2px' }}>
            {line.desc} × {Number(line.qty).toLocaleString('en-US')}
            {extra > 0 && <span style={{ fontSize: 11, color: '#6B655B', fontWeight: 400 }}> {isAr ? `+${extra} صنف` : `+${extra} more`}</span>}
          </div>
        )}
        <div style={{ fontSize: 17, fontWeight: 700, color: '#141210', fontFamily: "'Palatino Linotype',Georgia,serif", fontVariantNumeric: 'tabular-nums' }}>{money(shown, primaryCur)}</div>
        {usdRef && <div style={{ fontSize: 11, color: '#8F887C', fontVariantNumeric: 'tabular-nums' }}>{usdRef}</div>}
        <div style={{ fontSize: 10.5, color: '#6B655B', marginBottom: isBuyer && !isPaid ? 11 : 0 }}>{isBuyer ? t.feeBuyer : t.receivable}</div>
        {isPaid ? (
          <div style={{ fontSize: 12, color: '#2F5D3A', fontWeight: 700, marginTop: 7 }}>{t.paid}</div>
        ) : isBuyer ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button disabled={paying} onClick={() => { setPaying(true); startTelrPayment(invoiceId, 'deposit', 'invoice').catch((e) => { alert(e.message); setPaying(false); }); }}
              style={{ padding: '7px 11px', fontSize: 11.5, fontWeight: 600, border: '1px solid #141210', borderRadius: 8, background: 'none', color: '#141210', cursor: 'pointer' }}>{t.deposit}</button>
            <button disabled={paying} onClick={() => { setPaying(true); startTelrPayment(invoiceId, 'full', 'invoice').catch((e) => { alert(e.message); setPaying(false); }); }}
              style={{ padding: '7px 13px', fontSize: 11.5, fontWeight: 600, border: 'none', borderRadius: 8, background: '#141210', color: '#F7F4EE', cursor: 'pointer' }}>{t.full}</button>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: '#6B655B', marginTop: 7 }}>{t.awaiting}</div>
        )}
      </div>
    </div>
  );
}
