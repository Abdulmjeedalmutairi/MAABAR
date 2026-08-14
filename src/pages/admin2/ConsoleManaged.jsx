import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsoleShell from '../../components/admin2/ConsoleShell';
import { fetchManagedOrders } from '../../lib/managedOrder';
import { MANAGED_STAGES, stageKeyOf, isCancelled } from '../../lib/managedStages';

// The managed-order queue — Maabar's flagship flow. Each order carries its lifecycle
// stage; opening one lands in the console detail (stage / offer / video controls).
const stageLabel = (status, isAr) => {
  const k = stageKeyOf(status);
  const s = MANAGED_STAGES.find((x) => x.key === k);
  return s ? (isAr ? s.ar : s.en) : '';
};

export default function ConsoleManaged({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState('');
  const [stage, setStage] = useState('all');

  useEffect(() => { fetchManagedOrders().then(setRows).catch(() => setRows([])); }, []);

  const title = (r) => (isAr ? (r.title_ar || r.title_en) : (r.title_en || r.title_ar)) || (isAr ? 'طلب' : 'Request');
  const trader = (r) => r.requester?.company_name || r.requester?.full_name || (isAr ? 'تاجر' : 'Trader');

  const filtered = useMemo(() => {
    if (!rows) return [];
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (stage !== 'all' && stageKeyOf(r.managed_status) !== stage) return false;
      if (s && ![title(r), trader(r), r.request_ref].filter(Boolean).join(' ').toLowerCase().includes(s)) return false;
      return true;
    });
    // eslint-disable-next-line
  }, [rows, q, stage, isAr]);

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="managed">
      <div className="ac-page" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        <div className="ac-page-head">
          <div>
            <h1 className="ac-h1">{isAr ? 'الطلبات المُدارة' : 'Managed Orders'}</h1>
            <p className="ac-sub">{rows == null ? '…' : `${filtered.length}`}{isAr ? ' — خدمة مَعبر الأساسية' : ' — Maabar’s core service'}</p>
          </div>
        </div>

        <input className="ac-input" style={{ maxWidth: 420, marginBottom: 12 }} value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={isAr ? 'ابحث بالمنتج أو التاجر أو الرقم…' : 'Search product, trader, ref…'} />
        <div className="ac-chiprow" style={{ marginBottom: 16 }}>
          <button className={`ac-chip${stage === 'all' ? ' on' : ''}`} onClick={() => setStage('all')}>{isAr ? 'الكل' : 'All'}</button>
          {MANAGED_STAGES.map((s) => (
            <button key={s.key} className={`ac-chip${stage === s.key ? ' on' : ''}`} onClick={() => setStage(s.key)}>{isAr ? s.ar : s.en}</button>
          ))}
        </div>

        {rows == null ? (
          <div className="ac-skel" style={{ height: 90 }} />
        ) : filtered.length === 0 ? (
          <div className="ac-placeholder">{isAr ? 'لا طلبات مُدارة مطابقة.' : 'No matching managed orders.'}</div>
        ) : filtered.map((r) => {
          const cancelled = isCancelled(r.managed_status);
          return (
            <div className="ac-card" key={r.id} style={{ display: 'flex', gap: 14, padding: 14, marginBottom: 10, alignItems: 'flex-start' }}>
              {r.reference_image
                ? <img src={r.reference_image} alt="" loading="lazy" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', flexShrink: 0, background: 'var(--ac-sunk)' }} />
                : <div style={{ width: 64, height: 64, borderRadius: 12, flexShrink: 0, background: 'var(--ac-sunk)' }} />}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ac-ink)' }}>{title(r)}</span>
                  <span className="ac-badge neutral">{r.request_ref}</span>
                  <span className={`ac-badge ${cancelled ? 'warn' : 'info'}`}><span className="dot" />{cancelled ? (isAr ? 'ملغي' : 'Cancelled') : stageLabel(r.managed_status, isAr)}</span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ac-muted)', marginTop: 5 }}>
                  {trader(r)}{r.quantity ? ` · ${isAr ? 'الكمية' : 'Qty'} ${r.quantity}${r.unit ? ' ' + r.unit : ''}` : ''}
                  {r.budget_per_unit ? ` · ${isAr ? 'الميزانية' : 'Budget'} ${r.budget_per_unit} ${r.budget_currency || ''}` : ''}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
                  <button className="ac-btn ac-btn-sm ac-btn-primary" onClick={() => nav(`/admin2/managed/${r.id}`)}>{isAr ? 'إدارة الطلب' : 'Manage'}</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ConsoleShell>
  );
}
