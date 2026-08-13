import React, { useEffect, useState } from 'react';
import { fetchInvoiceById } from '../lib/orderInvoice';
import { startTelrPayment } from '../lib/telrPay';

// Renders an invoice inside the chat (the [invoice:ID] message). The buyer sees Pay
// buttons (deposit / full) that start the Telr payment; on success the order is
// created and appears in "My Direct Purchases".
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
    fee: isAr ? 'شامل رسوم مَعبر 5%' : 'incl. 5% Maabar fee',
    deposit: isAr ? 'ادفع العربون (30%)' : 'Pay deposit (30%)',
    full: isAr ? 'ادفع كامل' : 'Pay in full',
    paid: isAr ? '✓ مدفوعة' : '✓ Paid',
    issued: isAr ? 'بانتظار الدفع' : 'Awaiting payment',
  };

  if (!inv) return <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>…</div>;
  const line = Array.isArray(inv.line_items) && inv.line_items[0];
  const isPaid = inv.status === 'paid';
  const isBuyer = inv.buyer_id === myId;

  return (
    <div style={{ border: '1px solid #0C6B5A55', borderRadius: 12, overflow: 'hidden', maxWidth: 280, background: 'var(--bg-base)' }}>
      <div style={{ background: 'linear-gradient(135deg,#0C6B5A,#0a5849)', color: '#fff', padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700 }}>🧾 {t.invoice}</span>
        <span style={{ fontSize: 10, opacity: 0.9 }}>{inv.invoice_number}</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {line && <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{line.desc} × {line.qty}</div>}
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{money(inv.total, inv.currency)}</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-secondary)', marginBottom: isBuyer && !isPaid ? 10 : 0 }}>{t.fee}</div>
        {isPaid ? (
          <div style={{ fontSize: 12, color: '#0a5849', fontWeight: 700, marginTop: 6 }}>{t.paid}</div>
        ) : isBuyer ? (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button disabled={paying} onClick={() => { setPaying(true); startTelrPayment(invoiceId, 'deposit', 'invoice').catch(e => { alert(e.message); setPaying(false); }); }}
              style={{ padding: '7px 10px', fontSize: 11.5, fontWeight: 600, border: '1px solid #0C6B5A', borderRadius: 8, background: 'none', color: '#0C6B5A', cursor: 'pointer' }}>{t.deposit}</button>
            <button disabled={paying} onClick={() => { setPaying(true); startTelrPayment(invoiceId, 'full', 'invoice').catch(e => { alert(e.message); setPaying(false); }); }}
              style={{ padding: '7px 12px', fontSize: 11.5, fontWeight: 600, border: 'none', borderRadius: 8, background: '#0C6B5A', color: '#fff', cursor: 'pointer' }}>{t.full}</button>
          </div>
        ) : (
          <div style={{ fontSize: 11.5, color: 'var(--text-secondary)', marginTop: 6 }}>{t.issued}</div>
        )}
      </div>
    </div>
  );
}
