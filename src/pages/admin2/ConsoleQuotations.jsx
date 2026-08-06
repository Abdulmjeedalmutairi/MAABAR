import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsoleShell from '../../components/admin2/ConsoleShell';
import { fetchQuotations } from '../../lib/consoleQuotations';
import InviteModal from './InviteModal';

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const digits = (v) => (v || '').replace(/[^\d]/g, '');
const fmtDate = (iso, isAr) => (iso ? new Date(iso).toLocaleDateString(isAr ? 'ar' : 'en', { day: 'numeric', month: 'short' }) : null);

const STATUS = {
  waiting: { ar: 'بانتظار المورّد', en: 'Waiting supplier', cls: 'warn' },
  replied: { ar: 'ردّ المورّد', en: 'Supplier replied', cls: 'ok' },
  closed: { ar: 'مغلق', en: 'Closed', cls: 'neutral' },
};

export default function ConsoleQuotations({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [toast, setToast] = useState('');
  const [q, setQ] = useState('');
  const [st, setSt] = useState('all');     // all | waiting | replied | closed
  const [kind, setKind] = useState('all'); // all | factory | managed
  const [invite, setInvite] = useState(null); // { factoryId, request }

  useEffect(() => { fetchQuotations().then(setRows).catch((e) => { setErr(e.message || 'load failed'); setRows([]); }); }, []);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 1900); };
  const title = (r) => (isAr ? (nf(r.title_ar) || nf(r.title_en)) : (nf(r.title_en) || nf(r.title_ar))) || (isAr ? 'طلب' : 'Request');
  const trader = (r) => nf(r.trader?.company_name) || nf(r.trader?.full_name) || (isAr ? 'تاجر' : 'Trader');

  const counts = useMemo(() => {
    const c = { all: 0, waiting: 0, replied: 0, closed: 0 };
    (rows || []).forEach((r) => { c.all++; c[r.status]++; });
    return c;
  }, [rows]);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (st !== 'all' && r.status !== st) return false;
      if (kind !== 'all' && r.kind !== kind) return false;
      if (s && ![title(r), trader(r), r.factory?.name].filter(Boolean).join(' ').toLowerCase().includes(s)) return false;
      return true;
    });
    // eslint-disable-next-line
  }, [rows, q, st, kind, isAr]);

  const copyShare = (r) => {
    if (r.invite_slug) { navigator.clipboard.writeText(`${window.location.origin}/f/${r.invite_slug}`); flash(isAr ? 'نُسخ رابط الطلب' : 'Request link copied'); }
    else flash(isAr ? 'لا يوجد رابط مشاركة لهذا الطلب' : 'No share link for this request');
  };
  const waSupplier = (r) => { const d = digits(r.factory?.phone); if (d) window.open(`https://wa.me/${d}`, '_blank'); else flash(isAr ? 'لا رقم واتساب للمورّد' : 'No supplier WhatsApp'); };

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="quotations">
      <div className="ac-page" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        <div className="ac-page-head">
          <div>
            <h1 className="ac-h1">{isAr ? 'طلبات التسعير' : 'Quotation Requests'}</h1>
            <p className="ac-sub">{rows == null ? '…' : isAr ? `${filtered.length} من ${counts.all}` : `${filtered.length} of ${counts.all}`}</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
          <input className="ac-input" style={{ maxWidth: 420 }} value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={isAr ? 'ابحث بالمنتج أو التاجر أو المصنع…' : 'Search product, trader, factory…'} />
          <div className="ac-chiprow">
            {['all', 'waiting', 'replied', 'closed'].map((k) => (
              <button key={k} className={`ac-chip${st === k ? ' on' : ''}`} onClick={() => setSt(k)}>
                {k === 'all' ? (isAr ? 'الكل' : 'All') : (isAr ? STATUS[k].ar : STATUS[k].en)}
                <span style={{ opacity: 0.6 }}>{counts[k]}</span>
              </button>
            ))}
            <span style={{ width: 1, background: 'var(--ac-line-2)', margin: '0 4px' }} />
            {['all', 'factory', 'managed'].map((k) => (
              <button key={k} className={`ac-chip${kind === k ? ' on' : ''}`} onClick={() => setKind(k)}>
                {k === 'all' ? (isAr ? 'كل الأنواع' : 'All types') : k === 'factory' ? (isAr ? 'مصنع محدّد' : 'Factory') : (isAr ? 'مُدار' : 'Managed')}
              </button>
            ))}
          </div>
        </div>

        {err && <p style={{ color: 'var(--ac-danger)', fontSize: 13 }}>{err}</p>}

        {rows == null ? (
          <div className="ac-skel" style={{ height: 90 }} />
        ) : filtered.length === 0 ? (
          <div className="ac-placeholder">{isAr ? 'لا طلبات مطابقة.' : 'No matching requests.'}</div>
        ) : filtered.map((r) => {
          const sc = STATUS[r.status];
          return (
            <div className="ac-card" key={r.id} style={{ display: 'flex', gap: 14, padding: 14, marginBottom: 10, alignItems: 'flex-start' }}>
              {r.image
                ? <img src={r.image} alt="" loading="lazy" style={{ width: 74, height: 74, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: 'var(--ac-sunk)' }} />
                : <div style={{ width: 74, height: 74, borderRadius: 12, flexShrink: 0, background: 'var(--ac-sunk)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ac-faint)', fontSize: 11 }}>{isAr ? 'بلا صورة' : 'No img'}</div>}

              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ac-ink)' }}>{title(r)}</span>
                  <span className={`ac-badge ${sc.cls}`}><span className="dot" />{isAr ? sc.ar : sc.en}</span>
                  <span className={`ac-badge ${r.kind === 'factory' ? 'info' : 'neutral'}`}>{r.kind === 'factory' ? (isAr ? 'مصنع محدّد' : 'Factory') : (isAr ? 'مُدار' : 'Managed')}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ac-muted)', marginTop: 5 }}>
                  {trader(r)}{nf(r.trader?.country) ? ` · ${r.trader.country}` : ''}{r.factory?.name ? `  →  ${r.factory.name}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: 'var(--ac-faint)', flexWrap: 'wrap' }}>
                  {r.quantity ? <span>{isAr ? 'الكمية' : 'Qty'}: {r.quantity}{r.unit ? ` ${r.unit}` : ''}</span> : null}
                  {r.target_price ? <span>{isAr ? 'السعر المستهدف' : 'Target'}: {r.target_price} {nf(r.currency)}</span> : null}
                  {r.attachments > 0 ? <span>📎 {r.attachments}</span> : null}
                  {r.deadline ? <span>{isAr ? 'الموعد' : 'Due'}: {fmtDate(r.deadline, isAr)}</span> : null}
                  {r.ship_to ? <span>{isAr ? 'الشحن' : 'Ship'}: {r.ship_to}</span> : null}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <button className="ac-btn ac-btn-sm" onClick={() => nav(`/admin/concierge/${r.id}`)}>{isAr ? 'فتح' : 'Open'}</button>
                  <button className="ac-btn ac-btn-sm" onClick={() => copyShare(r)} disabled={!r.invite_slug} style={{ opacity: r.invite_slug ? 1 : 0.5 }}>{isAr ? 'رابط المشاركة' : 'Share link'}</button>
                  {r.factory && <button className="ac-btn ac-btn-sm" onClick={() => waSupplier(r)} disabled={!digits(r.factory.phone)} style={{ opacity: digits(r.factory.phone) ? 1 : 0.5 }}>WhatsApp</button>}
                  {r.factory && <button className="ac-btn ac-btn-sm" onClick={() => setInvite({ factoryId: r.factory.id, request: r })}>{isAr ? 'إرسال دعوة' : 'Send invitation'}</button>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {invite && <InviteModal factoryId={invite.factoryId} request={invite.request} isAr={isAr} onClose={() => setInvite(null)} flash={flash} />}
      {toast && <div className="ac-toast" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{toast}</div>}
    </ConsoleShell>
  );
}
