import React, { useEffect, useState } from 'react';
import { fetchOrderInvoice, saveOrderInvoice, issueOrderInvoice, fetchInvoicePayments, defaultLineItem } from '../lib/orderInvoice';
import { toSAR } from '../lib/currency';

// Direct-order / chat-agreement invoice — the official document Maabar generates on
// behalf of the supplier. The supplier fills line items + trade details (draft) and
// issues it; the buyer views + prints it once issued/paid. Role-aware money: the
// buyer sees goods + a visible 5% Maabar fee + total; the supplier sees only THEIR
// receivable (the goods) — the fee is on the buyer, never framed as the supplier's.

const LOGO = `${(typeof window !== 'undefined' ? window.location.origin : '')}/email-logo.png`;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const money = (n, c) => `${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c || 'SAR'}`;
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

const T = {
  ar: {
    title: 'فاتورة', sub: 'Commercial Invoice', draft: 'مسودة', issued: 'صادرة', paid: 'مدفوعة', depositPaid: 'عربون مدفوع',
    to: 'إلى · Billed to', from: 'من · From', behalf: 'صادرة عبر مَعبر نيابةً عن المورّد',
    item: 'الصنف · Item', qty: 'الكمية', unit: 'سعر الوحدة', amount: 'الإجمالي',
    subtotal: 'إجمالي البضاعة', fee: 'رسوم منصّة مَعبر', feeSub: 'عمولة الخدمة 5%', grand: 'الإجمالي المستحق',
    receivable: 'مستحقّك · قيمة البضاعة', supplierNote: 'يُحصّلها المشتري عبر مَعبر — رسوم المنصّة 5% على المشتري.',
    specsHead: 'تفاصيل الطلب · Order specifications', schedHead: 'جدول الدفع · Payment schedule',
    deposit: 'العربون · 30%', balance: 'الرصيد · 70%', paidChip: '✓ مدفوع', holdChip: 'قيد الاحتجاز', pending: 'مستحق',
    depNoteBuyer: 'يُحوَّل للمورّد لبدء الإنتاج فور الدفع.', balNoteBuyer: 'يُدفع قبل الشحن ويُحتجَز لدى مَعبر حتى تؤكّد الاستلام، ثم يُحوَّل للمورّد.',
    depNoteSup: 'يصلك لبدء الإنتاج فور دفع المشتري.', balNoteSup: 'يُحتجَز لدى مَعبر ويصلك بعد تأكيد المشتري الاستلام.',
    recvSched: 'ما تستلمه · You receive',
    footNote: 'صادرة عبر منصّة مَعبر نيابةً عن المورّد كوثيقة رسمية للبضاعة والدفع. الشحن والتخليص الجمركي مسؤولية الطرفين مباشرةً. نسخة رسمية غير قابلة للتعديل بعد الإصدار.',
    official: 'وثيقة رسمية · Official document',
    incoterms: 'شروط التسليم (Incoterms)', port: 'ميناء الشحن', hs: 'HS code', notes: 'ملاحظات',
    addRow: '+ سطر', save: 'حفظ المسودة', issue: 'إصدار للتاجر', print: 'طباعة / حفظ PDF',
    close: 'إغلاق', notIssued: 'لم تُصدر الفاتورة بعد.', saving: 'جارٍ الحفظ…', issuedOk: 'صدرت الفاتورة ووصلت التاجر.',
  },
  en: {
    title: 'Invoice', sub: 'Commercial Invoice', draft: 'Draft', issued: 'Issued', paid: 'Paid', depositPaid: 'Deposit paid',
    to: 'Billed to', from: 'From', behalf: 'Issued via Maabar on behalf of the supplier',
    item: 'Item', qty: 'Qty', unit: 'Unit price', amount: 'Amount',
    subtotal: 'Goods subtotal', fee: 'Maabar platform fee', feeSub: 'service commission 5%', grand: 'Total due',
    receivable: 'Your receivable · goods value', supplierNote: 'Collected from the buyer via Maabar — the 5% platform fee is on the buyer.',
    specsHead: 'Order specifications', schedHead: 'Payment schedule',
    deposit: 'Deposit · 30%', balance: 'Balance · 70%', paidChip: '✓ Paid', holdChip: 'On hold', pending: 'Due',
    depNoteBuyer: 'Forwarded to the supplier to start production once paid.', balNoteBuyer: 'Paid before shipment and held by Maabar until you confirm receipt, then released to the supplier.',
    depNoteSup: 'Reaches you to start production once the buyer pays.', balNoteSup: 'Held by Maabar and released to you after the buyer confirms receipt.',
    recvSched: 'You receive',
    footNote: 'Issued via Maabar on behalf of the supplier as an official goods & payment document. Shipping & customs are directly between the two parties. Official copy — not editable once issued.',
    official: 'Official document',
    incoterms: 'Incoterms', port: 'Port of loading', hs: 'HS code', notes: 'Notes',
    addRow: '+ Row', save: 'Save draft', issue: 'Issue to buyer', print: 'Print / Save PDF',
    close: 'Close', notIssued: 'The invoice has not been issued yet.', saving: 'Saving…', issuedOk: 'Invoice issued and delivered to the buyer.',
  },
};

// Shared premium stylesheet for the invoice document (screen + print).
const INVOICE_CSS = `
  .iv-sheet{ --paper:#F7F4EE; --ink:#141210; --ink-soft:#3A342C; --muted:#6B655B; --faint:#8F887C;
    --hair:#DcD4C4; --hair-strong:#C8BEA8; --header:#0E0D0C; --bronze:#9A7B4F; --paid:#2F5D3A;
    --serif:"Iowan Old Style","Palatino Linotype",Palatino,"Book Antiqua",Georgia,serif;
    --sans:"Segoe UI",-apple-system,"Helvetica Neue",Arial,"Noto Sans Arabic",sans-serif;
    --num:"Palatino Linotype",Georgia,serif;
    background:var(--paper); color:var(--ink); font-family:var(--sans); line-height:1.6; }
  .iv-sheet *{ box-sizing:border-box; }
  .iv-head{ position:relative; background:var(--header); color:#F3EFE7; padding:26px 34px 24px; overflow:hidden; border-bottom:2px solid var(--bronze); }
  .iv-head::before{ content:""; position:absolute; inset:0; background:radial-gradient(120% 150% at 50% -40%, rgba(255,255,255,0.14), transparent 60%); }
  .iv-head-row{ position:relative; display:flex; justify-content:space-between; align-items:flex-start; gap:20px; flex-wrap:wrap; }
  .iv-logo{ height:42px; width:auto; filter:brightness(0) invert(1); display:block; }
  .iv-doc{ text-align:end; }
  .iv-doc-title{ font-family:var(--serif); font-size:24px; line-height:1; }
  .iv-doc-title small{ display:block; font-family:var(--sans); font-size:9px; letter-spacing:0.4em; color:rgba(255,255,255,0.55); margin-top:7px; text-transform:uppercase; }
  .iv-doc-meta{ margin-top:12px; font-size:12px; color:rgba(255,255,255,0.7); }
  .iv-doc-meta b{ color:#F3EFE7; font-family:var(--num); font-variant-numeric:tabular-nums; letter-spacing:0.04em; }
  .iv-badge{ display:inline-flex; align-items:center; gap:6px; margin-top:11px; font-size:11px; font-weight:700; letter-spacing:0.05em; padding:5px 11px; border-radius:999px; background:rgba(47,93,58,0.10); color:#BFE6C8; border:1px solid rgba(191,230,200,0.35); }
  .iv-badge.na{ background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.75); border-color:rgba(255,255,255,0.2); }
  .iv-badge .dot{ width:6px; height:6px; border-radius:50%; background:#7FC98C; }
  .iv-body{ padding:30px 34px 8px; }
  .iv-label{ font-size:10px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--bronze); }
  .iv-parties{ display:flex; gap:30px; flex-wrap:wrap; padding-bottom:22px; border-bottom:1px solid var(--hair); }
  .iv-party{ flex:1; min-width:190px; }
  .iv-party .nm{ font-family:var(--serif); font-size:17px; margin-top:8px; line-height:1.35; }
  .iv-party .sb{ font-size:12.5px; color:var(--muted); margin-top:3px; }
  .iv-behalf{ display:inline-block; margin-top:8px; font-size:11px; color:var(--ink-soft); background:rgba(154,123,79,0.10); border:1px solid rgba(154,123,79,0.28); padding:3px 9px; border-radius:5px; }
  .iv-tbl{ width:100%; border-collapse:collapse; margin-top:22px; }
  .iv-tbl thead th{ font-size:10px; font-weight:700; letter-spacing:0.14em; text-transform:uppercase; color:var(--faint); text-align:start; padding:0 4px 9px; border-bottom:1.5px solid var(--hair-strong); }
  .iv-tbl thead th.num{ text-align:end; }
  .iv-tbl tbody td{ padding:14px 4px; border-bottom:1px solid var(--hair); vertical-align:top; font-size:14px; }
  .iv-tbl tbody td.num{ text-align:end; font-family:var(--num); font-variant-numeric:tabular-nums; }
  .iv-itname{ font-weight:600; }
  .iv-itdesc{ font-size:12px; color:var(--muted); margin-top:3px; }
  .iv-attrs{ display:flex; gap:6px; flex-wrap:wrap; margin-top:8px; }
  .iv-attrs span{ font-size:11px; color:var(--ink-soft); background:rgba(20,18,16,0.04); border:1px solid var(--hair); border-radius:5px; padding:2px 8px; }
  .iv-attrs span b{ color:var(--faint); font-weight:600; }
  .iv-sw{ display:inline-block; width:9px; height:9px; border-radius:2px; margin-inline-end:5px; vertical-align:middle; border:1px solid rgba(0,0,0,0.15); }
  .iv-foot{ display:flex; justify-content:flex-end; margin-top:20px; }
  .iv-totals{ width:min(320px,100%); }
  .iv-trow{ display:flex; justify-content:space-between; align-items:baseline; padding:8px 2px; font-size:13.5px; color:var(--ink-soft); }
  .iv-trow .v{ font-family:var(--num); font-variant-numeric:tabular-nums; }
  .iv-trow.fee{ color:var(--bronze); }
  .iv-trow.fee small{ display:block; font-family:var(--sans); font-size:10.5px; color:var(--faint); }
  .iv-grand{ display:flex; justify-content:space-between; align-items:center; gap:16px; margin-top:9px; padding:14px 18px; border-radius:8px; background:var(--ink); color:var(--paper); }
  .iv-grand .k{ font-size:12px; letter-spacing:0.05em; }
  .iv-grand .v{ font-family:var(--num); font-variant-numeric:tabular-nums; font-size:20px; font-weight:600; }
  .iv-grand .v small{ font-size:11px; font-weight:400; color:rgba(247,244,238,0.6); margin-inline-start:5px; }
  .iv-supnote{ font-size:11px; color:var(--muted); text-align:end; margin-top:6px; }
  .iv-panel{ margin-top:26px; border:1px solid var(--hair); border-radius:10px; overflow:hidden; }
  .iv-panel-head{ padding:11px 16px; font-size:11px; font-weight:700; letter-spacing:0.13em; text-transform:uppercase; color:var(--bronze); background:rgba(154,123,79,0.06); border-bottom:1px solid var(--hair); }
  .iv-specs{ display:grid; grid-template-columns:repeat(3,1fr); }
  .iv-spec{ padding:12px 16px; border-bottom:1px solid var(--hair); border-inline-start:1px solid var(--hair); }
  .iv-spec:nth-child(3n+1){ border-inline-start:none; }
  .iv-spec .k{ font-size:10px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--faint); }
  .iv-spec .v{ font-size:13px; margin-top:4px; line-height:1.5; }
  .iv-spec.wide{ grid-column:1 / -1; border-inline-start:none; }
  .iv-sched{ display:flex; flex-wrap:wrap; }
  .iv-cell{ flex:1; min-width:200px; padding:15px 18px; }
  .iv-cell + .iv-cell{ border-inline-start:1px solid var(--hair); }
  .iv-cell-top{ display:flex; justify-content:space-between; align-items:baseline; gap:10px; }
  .iv-pct{ font-size:12px; color:var(--muted); }
  .iv-amt{ font-family:var(--num); font-variant-numeric:tabular-nums; font-size:18px; font-weight:600; margin-top:2px; }
  .iv-note{ font-size:11.5px; color:var(--muted); margin-top:6px; line-height:1.5; }
  .iv-chip{ display:inline-flex; align-items:center; gap:5px; font-size:10.5px; font-weight:700; padding:2px 8px; border-radius:999px; }
  .iv-chip.paid{ color:var(--paid); background:rgba(47,93,58,0.08); border:1px solid rgba(47,93,58,0.3); }
  .iv-chip.hold{ color:var(--ink-soft); background:rgba(20,18,16,0.05); border:1px solid var(--hair-strong); }
  .iv-meta{ display:flex; gap:22px; flex-wrap:wrap; margin-top:22px; }
  .iv-meta .m{ font-size:11.5px; color:var(--ink-soft); }
  .iv-meta .m span{ color:var(--faint); letter-spacing:0.07em; text-transform:uppercase; font-size:10px; display:block; margin-bottom:2px; }
  .iv-legal{ margin-top:24px; padding-top:18px; border-top:1px solid var(--hair); font-size:11.5px; color:var(--muted); line-height:1.7; }
  .iv-colo{ display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap; padding:18px 34px 26px; }
  .iv-colo .official{ font-size:10.5px; letter-spacing:0.13em; text-transform:uppercase; color:var(--bronze); }
  .iv-colo .contact{ font-size:12px; color:var(--muted); }
  .iv-colo img{ height:24px; opacity:0.9; }
  @media (max-width:560px){ .iv-specs{ grid-template-columns:1fr 1fr; } .iv-spec:nth-child(3n+1){ border-inline-start:1px solid var(--hair); } .iv-spec:nth-child(2n+1){ border-inline-start:none; } }
`;

// Build the invoice document markup once (used for the on-screen view AND print).
function invoiceHTML({ t, isAr, isSupplier, invoiceNo, dateStr, statusBadge, badgeNa, buyerName, buyerSub, supplierName, supplierSub,
  items, cur, conv, grandRef, currency, subtotal, fee, total, specEntries, sched, meta }) {
  const rows = items.map((it) => {
    const attrs = Array.isArray(it.attrs) ? it.attrs : [];
    const attrHtml = attrs.length ? `<div class="iv-attrs">${attrs.map((a) => {
      const sw = a.hex ? `<i class="iv-sw" style="background:${esc(a.hex)}"></i>` : '';
      return `<span><b>${esc(a.k)}</b> ${sw}${esc(a.v)}</span>`;
    }).join('')}</div>` : (it.variant ? `<div class="iv-attrs"><span>${esc(it.variant)}</span></div>` : '');
    const qty = Number(it.qty) || 0; const unit = Number(it.unit_price) || 0;
    return `<tr><td><div class="iv-itname">${esc(it.desc || '')}</div>${it.desc2 ? `<div class="iv-itdesc">${esc(it.desc2)}</div>` : ''}${attrHtml}</td>
      <td class="num">${qty.toLocaleString('en-US')}</td><td class="num">${money(conv(unit), cur)}</td><td class="num">${money(conv(qty * unit), cur)}</td></tr>`;
  }).join('');

  const grandRefHtml = grandRef ? `<div class="iv-supnote">${esc(grandRef)}</div>` : '';
  const totalsHtml = isSupplier
    ? `<div class="iv-grand"><span class="k">${esc(t.receivable)}</span><span class="v">${money(conv(subtotal), cur)}</span></div>
       ${grandRefHtml}<div class="iv-supnote">${esc(t.supplierNote)}</div>`
    : `<div class="iv-trow"><span class="k">${esc(t.subtotal)}</span><span class="v">${money(conv(subtotal), cur)}</span></div>
       <div class="iv-trow fee"><span class="k">${esc(t.fee)}<small>${esc(t.feeSub)}</small></span><span class="v">${money(conv(fee), cur)}</span></div>
       <div class="iv-grand"><span class="k">${esc(t.grand)}</span><span class="v">${money(conv(total), cur)}<small>${esc(cur)}</small></span></div>${grandRefHtml}`;

  const specsHtml = specEntries.length ? `<div class="iv-panel"><div class="iv-panel-head">${esc(t.specsHead)}</div><div class="iv-specs">${
    specEntries.map((s) => `<div class="iv-spec${s.wide ? ' wide' : ''}"><div class="k">${esc(s.k)}</div><div class="v">${esc(s.v)}</div></div>`).join('')
  }</div></div>` : '';

  const schedHtml = sched ? `<div class="iv-panel"><div class="iv-panel-head">${esc(isSupplier ? t.recvSched : t.schedHead)}</div><div class="iv-sched">
      <div class="iv-cell"><div class="iv-cell-top"><span class="iv-pct">${esc(t.deposit)}</span><span class="iv-chip ${sched.depPaid ? 'paid' : 'hold'}">${sched.depPaid ? t.paidChip : t.pending}</span></div>
        <div class="iv-amt">${money(conv(sched.dep), cur)}</div><div class="iv-note">${esc(isSupplier ? t.depNoteSup : t.depNoteBuyer)}</div></div>
      <div class="iv-cell"><div class="iv-cell-top"><span class="iv-pct">${esc(t.balance)}</span><span class="iv-chip ${sched.balPaid ? 'paid' : 'hold'}">${sched.balPaid ? t.paidChip : t.holdChip}</span></div>
        <div class="iv-amt">${money(conv(sched.bal), cur)}</div><div class="iv-note">${esc(isSupplier ? t.balNoteSup : t.balNoteBuyer)}</div></div>
    </div></div>` : '';

  const metaHtml = meta.length ? `<div class="iv-meta">${meta.map((m) => `<div class="m"><span>${esc(m.k)}</span>${esc(m.v)}</div>`).join('')}</div>` : '';

  return `<div class="iv-sheet" dir="${isAr ? 'rtl' : 'ltr'}" lang="${isAr ? 'ar' : 'en'}">
    <div class="iv-head"><div class="iv-head-row">
      <img class="iv-logo" alt="MAABAR" src="${LOGO}">
      <div class="iv-doc"><div class="iv-doc-title">${esc(t.title)}<small>${esc(t.sub)}</small></div>
        <div class="iv-doc-meta">${isAr ? 'رقم' : 'No.'} <b>${esc(invoiceNo)}</b> · <b>${esc(dateStr)}</b></div>
        <div class="iv-badge ${badgeNa ? 'na' : ''}"><span class="dot"></span> ${esc(statusBadge)}</div></div>
    </div></div>
    <div class="iv-body">
      <div class="iv-parties">
        <div class="iv-party"><div class="iv-label">${esc(t.to)}</div><div class="nm">${esc(buyerName)}</div>${buyerSub ? `<div class="sb">${esc(buyerSub)}</div>` : ''}</div>
        <div class="iv-party"><div class="iv-label">${esc(t.from)}</div><div class="nm">${esc(supplierName)}</div>${supplierSub ? `<div class="sb">${esc(supplierSub)}</div>` : ''}<span class="iv-behalf">${esc(t.behalf)}</span></div>
      </div>
      <table class="iv-tbl"><thead><tr><th>${esc(t.item)}</th><th class="num">${esc(t.qty)}</th><th class="num">${esc(t.unit)}</th><th class="num">${esc(t.amount)}</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="iv-foot"><div class="iv-totals">${totalsHtml}</div></div>
      ${specsHtml}${schedHtml}${metaHtml}
      <div class="iv-legal">${esc(t.footNote)}</div>
    </div>
    <div class="iv-colo"><img alt="MAABAR" src="${LOGO}"><div class="official">${esc(t.official)}</div><div class="contact">maabar.io · support@maabar.io</div></div>
  </div>`;
}

export default function OrderInvoiceModal({ requestId, order, role, lang = 'ar', onClose }) {
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const isSupplier = role === 'supplier';
  const [inv, setInv] = useState(null);
  const [pays, setPays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState([]);
  const [incoterms, setIncoterms] = useState('');
  const [port, setPort] = useState('');
  const [hs, setHs] = useState('');
  const [notes, setNotes] = useState('');
  const currency = order?.currency || inv?.currency || 'SAR';

  useEffect(() => {
    (async () => {
      const [data, p] = await Promise.all([fetchOrderInvoice(requestId), fetchInvoicePayments(requestId)]);
      if (data) {
        setInv(data);
        setItems(Array.isArray(data.line_items) && data.line_items.length ? data.line_items : defaultLineItem(order));
        setIncoterms(data.incoterms || ''); setPort(data.port_of_loading || '');
        setHs(data.hs_code || ''); setNotes(data.notes || '');
      } else {
        setItems(defaultLineItem(order));
      }
      setPays(p || []);
      setLoading(false);
    })();
  }, [requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const editable = isSupplier && (!inv || inv.status === 'draft');
  const finalized = !!inv && (inv.status === 'issued' || inv.status === 'paid');
  const subtotal = items.reduce((s, it) => s + (Number(it.qty) || 0) * (Number(it.unit_price) || 0), 0);
  const fee = round2(subtotal * 0.05);
  const total = round2(subtotal + fee);
  // Supplier quotes in the invoice currency (USD); the Saudi buyer sees SAR (primary,
  // at the fixed 3.75 peg) with the USD original as a reference under the total.
  const invCur = String(currency || 'SAR').toUpperCase();
  const isUSD = invCur === 'USD';
  const primaryCur = isSupplier ? invCur : (isUSD ? 'SAR' : invCur);
  const conv = (isSupplier || !isUSD) ? (n) => Number(n) : (n) => toSAR(n, invCur);
  const grandRef = isUSD
    ? (isSupplier ? `≈ ${money(toSAR(subtotal, invCur), 'SAR')}` : `≈ ${money(total, invCur)}`)
    : '';
  const invoiceNo = inv?.invoice_number || order?.request_ref || '—';
  const specs = inv?.specs;
  const specEntries = Array.isArray(specs)
    ? specs.filter((s) => s && s.k).map((s) => ({ k: s.k, v: s.v, wide: !!s.wide }))
    : (specs && typeof specs === 'object' ? Object.entries(specs).map(([k, v]) => ({ k, v, wide: /note|ملاح/i.test(k) })) : []);

  // Payment schedule from recorded payments (role-aware base: buyer=total, supplier=goods).
  const firstPaid = pays.find((p) => p.status === 'first_paid');
  const secondPaid = pays.find((p) => p.status === 'second_paid');
  const fullPay = firstPaid && Number(firstPaid.payment_pct) >= 100;
  const base = isSupplier ? subtotal : total;
  const sched = { dep: round2(base * 0.3), bal: round2(base - round2(base * 0.3)), depPaid: !!firstPaid, balPaid: !!secondPaid || !!fullPay };

  const statusBadge = inv?.status === 'paid'
    ? (fullPay || secondPaid ? t.paid : (firstPaid ? t.depositPaid : t.paid))
    : inv?.status === 'issued' ? t.issued : t.draft;
  const badgeNa = !(inv?.status === 'paid');

  const doc = () => invoiceHTML({
    t, isAr, isSupplier, invoiceNo,
    dateStr: (inv?.issued_at || inv?.created_at || '').slice(0, 10) || '—',
    statusBadge, badgeNa,
    buyerName: order?.buyer_name || inv?.buyer_name || (isAr ? 'المشتري' : 'Buyer'),
    buyerSub: order?.buyer_city || '',
    supplierName: order?.supplier_name || (isAr ? 'المورّد' : 'Supplier'),
    supplierSub: order?.supplier_city || '',
    items, cur: primaryCur, conv, grandRef, currency, subtotal, fee, total, specEntries,
    sched: (finalized || firstPaid) ? sched : null,
    meta: [
      incoterms && { k: 'Incoterms', v: incoterms },
      port && { k: isAr ? 'ميناء الشحن' : 'Port', v: port },
      hs && { k: 'HS Code', v: hs },
      { k: isAr ? 'الدفع عبر' : 'Paid via', v: 'Telr · Al Rajhi' },
    ].filter(Boolean),
  });

  const setItem = (i, k, v) => setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [k]: v } : it)));
  const addRow = () => setItems((prev) => [...prev, { desc: '', qty: 1, unit_price: 0 }]);
  const rmRow = (i) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const buildPayload = () => ({
    lineItems: items.map((it) => ({ desc: it.desc || '', qty: Number(it.qty) || 0, unit_price: Number(it.unit_price) || 0, amount: (Number(it.qty) || 0) * (Number(it.unit_price) || 0), attrs: it.attrs || undefined })),
    incoterms, port, hsCode: hs, notes, currency,
  });
  const doSave = async () => { setBusy(true); try { const r = await saveOrderInvoice(requestId, buildPayload()); setInv(r); } catch (e) { alert(e.message || 'Error'); } setBusy(false); };
  const doIssue = async () => { setBusy(true); try { await saveOrderInvoice(requestId, buildPayload()); const r = await issueOrderInvoice(requestId); setInv(r); alert(t.issuedOk); } catch (e) { alert(e.message || 'Error'); } setBusy(false); };

  const doPrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!doctype html><html dir="${isAr ? 'rtl' : 'ltr'}" lang="${lang}"><head><meta charset="utf-8"><title>${esc(t.title)} ${esc(invoiceNo)}</title>
      <style>body{margin:0;background:#E7E2D8;padding:22px;} ${INVOICE_CSS} .iv-sheet{max-width:780px;margin:0 auto;box-shadow:0 20px 60px rgba(0,0,0,0.25);}</style></head>
      <body onload="setTimeout(function(){window.print()},250)">${doc()}</body></html>`);
    w.document.close();
  };

  const input = { width: '100%', padding: '7px 9px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 13 };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', overflowY: 'auto', padding: '22px 12px' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: 'var(--bg-overlay)', borderRadius: 14, maxWidth: 780, width: '100%', overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,0.35)' }}>
        <style>{INVOICE_CSS}</style>
        {loading ? (
          <p style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>…</p>
        ) : (!isSupplier && !finalized) ? (
          <div style={{ padding: '48px 26px', textAlign: 'center', color: 'var(--text-secondary)' }}>{t.notIssued}</div>
        ) : editable ? (
          // ── Supplier draft editor (order-based invoice) ──
          <div dir={isAr ? 'rtl' : 'ltr'} style={{ padding: '22px 26px' }}>
            <h3 style={{ margin: '0 0 4px', fontWeight: 400, fontSize: 18, color: 'var(--text-primary)' }}>{t.title} · <span style={{ color: 'var(--text-secondary)' }}>{invoiceNo}</span></h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--text-tertiary)' }}>{t.behalf}</p>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 12 }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'start', fontSize: 11, color: 'var(--text-secondary)', padding: '6px 4px' }}>{t.item}</th>
                <th style={{ textAlign: 'end', fontSize: 11, color: 'var(--text-secondary)', width: 70 }}>{t.qty}</th>
                <th style={{ textAlign: 'end', fontSize: 11, color: 'var(--text-secondary)', width: 110 }}>{t.unit}</th>
                <th style={{ width: 28 }} />
              </tr></thead>
              <tbody>
                {items.map((it, i) => (
                  <tr key={i}>
                    <td style={{ padding: '6px 4px' }}><input style={input} value={it.desc || ''} onChange={(e) => setItem(i, 'desc', e.target.value)} /></td>
                    <td style={{ padding: '6px 4px' }}><input style={{ ...input, textAlign: 'end' }} type="number" value={it.qty} onChange={(e) => setItem(i, 'qty', e.target.value)} /></td>
                    <td style={{ padding: '6px 4px' }}><input style={{ ...input, textAlign: 'end' }} type="number" value={it.unit_price} onChange={(e) => setItem(i, 'unit_price', e.target.value)} /></td>
                    <td style={{ textAlign: 'center' }}>{items.length > 1 && <button onClick={() => rmRow(i)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: 16 }}>×</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addRow} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12, marginBottom: 14 }}>{t.addRow}</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
              <div><label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.incoterms}</label><input style={input} value={incoterms} onChange={(e) => setIncoterms(e.target.value)} placeholder="FOB …" /></div>
              <div><label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.port}</label><input style={input} value={port} onChange={(e) => setPort(e.target.value)} /></div>
              <div><label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.hs}</label><input style={input} value={hs} onChange={(e) => setHs(e.target.value)} /></div>
              <div><label style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{t.notes}</label><input style={input} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
            </div>
            <div style={{ textAlign: 'end', fontSize: 13, color: 'var(--text-secondary)', marginTop: 8 }}>
              {t.subtotal}: <b style={{ color: 'var(--text-primary)' }}>{money(subtotal, currency)}</b> · {t.fee}: <b>{money(fee, currency)}</b> · {t.grand}: <b style={{ color: 'var(--text-primary)' }}>{money(total, currency)}</b>
            </div>
          </div>
        ) : (
          // ── Premium document (issued / paid, or buyer view) ──
          <div dangerouslySetInnerHTML={{ __html: doc() }} />
        )}

        {/* Actions */}
        <div style={{ padding: '14px 26px', borderTop: '1px solid var(--border-muted)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', background: 'var(--bg-overlay)' }}>
          <button onClick={onClose} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>{t.close}</button>
          {finalized && !editable && (
            <button onClick={doPrint} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: 'var(--text-primary)', color: 'var(--bg-base)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{t.print}</button>
          )}
          {editable && (
            <>
              <button onClick={doSave} disabled={busy} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #0C6B5A', background: 'none', color: '#0C6B5A', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{busy ? t.saving : t.save}</button>
              <button onClick={doIssue} disabled={busy} style={{ padding: '9px 16px', borderRadius: 8, border: 'none', background: '#0C6B5A', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>{t.issue}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
