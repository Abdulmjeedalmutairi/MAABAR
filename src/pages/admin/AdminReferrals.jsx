import React, { useEffect, useState, useCallback } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import { sb } from '../../supabase';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

// Both caps live in 20260713000001_supplier_referral_program.sql and are enforced
// silently in on_supplier_verified_referral(). When the program cap is reached the
// whole program simply stops awarding, with no signal anywhere — surfacing it is a
// main reason this screen exists.
const PROGRAM_VERIFIED_CAP = 50;
const PER_REFERRER_CAP = 10;

const TABS = [
  { key: 'all',        en: 'All',            ar: 'الكل' },
  { key: 'awaiting',   en: 'Awaiting',       ar: 'بانتظار التوثيق' },
  { key: 'verified',   en: 'Verified',       ar: 'موثّقة' },
  { key: 'ineligible', en: 'Not Eligible',   ar: 'غير مستحقّة' },
];

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const money = n => `$${Number(n || 0).toLocaleString('en-US')}`;

const SHARED_CSS = (isAr) => `
  .a-page { padding: 36px 32px; max-width: 1180px; }
  .a-page-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FONT_HEADING}; line-height: 1.1; }
  .a-page-sub { margin: 0 0 20px; font-size: 12px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .a-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 10px; margin-bottom: 22px; }
  .a-stat { background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 14px 16px; }
  .a-stat-label { font-size: 10px; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; margin-bottom: 6px; }
  .a-stat-val { font-size: 22px; font-weight: 400; color: rgba(0,0,0,0.85); font-family: ${FONT_HEADING}; font-variant-numeric: lining-nums; }
  .a-stat-note { font-size: 11px; color: rgba(0,0,0,0.35); font-family: ${FONT_BODY}; margin-top: 3px; }
  .a-cap-warn { border-color: rgba(192,57,43,0.25); background: rgba(192,57,43,0.04); }
  .a-tabs { display: flex; gap: 4px; margin-bottom: 16px; overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; padding-bottom: 2px; }
  .a-tabs::-webkit-scrollbar { display: none; }
  .a-tab { flex-shrink: 0; padding: 6px 14px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.09); background: transparent; cursor: pointer; font-size: 12px; color: rgba(0,0,0,0.45); min-height: 34px; transition: all 0.12s; white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-tab.on { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
  .a-tab:not(.on):hover { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.72); }
  .a-search { width: 100%; max-width: 360px; padding: 9px 13px; margin-bottom: 18px; background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; font-size: 14px; color: rgba(0,0,0,0.80); font-family: ${FONT_BODY}; outline: none; box-sizing: border-box; }
  .a-search:focus { border-color: rgba(0,0,0,0.22); }
  .a-error { margin: 0 0 16px; padding: 11px 14px; border-radius: 8px; background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.18); color: #c0392b; font-size: 12px; font-family: ${FONT_BODY}; }
  .a-table-wrap { border-radius: 10px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; }
  .a-table { width: 100%; border-collapse: collapse; }
  .a-table th { padding: 11px 16px; font-size: 10px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; color: rgba(0,0,0,0.38); text-align: ${isAr ? 'right' : 'left'}; background: var(--bg-subtle, #F5F2EE); border-bottom: 1px solid rgba(0,0,0,0.06); white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-table td { padding: 13px 16px; font-size: 13px; color: rgba(0,0,0,0.80); border-bottom: 1px solid rgba(0,0,0,0.05); vertical-align: middle; font-family: ${FONT_BODY}; }
  .a-table tr:last-child td { border-bottom: none; }
  .a-cards { display: none; flex-direction: column; gap: 8px; }
  .a-card { background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 15px; }
  .a-card-meta { font-size: 10px; color: rgba(0,0,0,0.35); font-family: ${FONT_BODY}; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 2px; }
  .a-card-val { font-size: 13px; color: rgba(0,0,0,0.75); font-family: ${FONT_BODY}; }
  .a-empty { text-align: center; padding: 40px 20px; color: rgba(0,0,0,0.30); font-family: ${FONT_BODY}; font-size: 13px; }
  .a-pill { display: inline-block; padding: 3px 9px; border-radius: 99px; font-size: 10px; font-weight: 600; white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-pill-green { color: #27725a; background: rgba(39,114,90,0.08); border: 1px solid rgba(39,114,90,0.18); }
  .a-pill-amber { color: #8B6914; background: rgba(139,105,20,0.08); border: 1px solid rgba(139,105,20,0.18); }
  .a-pill-red   { color: #c0392b; background: rgba(192,57,43,0.08); border: 1px solid rgba(192,57,43,0.18); }
  .a-pill-grey  { color: rgba(0,0,0,0.45); background: rgba(0,0,0,0.04); border: 1px solid rgba(0,0,0,0.08); }
  @media (max-width: 900px) { .a-page { padding: 22px 16px; } .a-search { max-width: 100%; } }
  @media (max-width: 768px) { .a-table-wrap { display: none; } .a-cards { display: flex; } }
  @media (min-width: 769px) { .a-cards { display: none; } }
`;

export default function AdminReferrals({ user, profile, lang, ...rest }) {
  const [tab, setTab] = useState('all');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ verifiedTotal: 0, pending: 0, withdrawable: 0 });
  const isAr = lang === 'ar';

  const load = useCallback(async () => {
    setLoading(true);

    let q = sb.from('referrals').select(`
      id, referral_code, created_at, referred_verified_at, reward_eligible,
      referrer:profiles!referrals_referrer_id_fkey(id, company_name, full_name, email, maabar_supplier_id, reg_number, country),
      referred:profiles!referrals_referred_id_fkey(id, company_name, full_name, email, reg_number, country, status),
      rewards:referral_rewards(id, reward_type, amount, currency, state, earned_at)
    `).order('created_at', { ascending: false }).limit(200);

    if (tab === 'awaiting')   q = q.is('referred_verified_at', null);
    if (tab === 'verified')   q = q.not('referred_verified_at', 'is', null);
    if (tab === 'ineligible') q = q.not('referred_verified_at', 'is', null).eq('reward_eligible', false);

    const { data, error: err } = await q;
    if (err) { setError(err.message || 'Query failed'); setRows([]); setLoading(false); return; }
    setError('');
    setRows(data || []);

    // Program-wide figures — deliberately NOT derived from the page above, which is
    // filtered and capped at 200.
    const { count: verifiedTotal } = await sb.from('referrals')
      .select('id', { count: 'exact', head: true })
      .not('referred_verified_at', 'is', null);
    const { data: allRewards } = await sb.from('referral_rewards').select('amount, state');
    const sumBy = (s) => (allRewards || []).filter(r => r.state === s).reduce((a, r) => a + Number(r.amount || 0), 0);
    setStats({ verifiedTotal: verifiedTotal || 0, pending: sumBy('pending'), withdrawable: sumBy('withdrawable') });

    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  // Per-referrer counts, for the 10-sign-up cap signal.
  const referrerCounts = rows.reduce((acc, r) => {
    const k = r.referrer?.id; if (k) acc[k] = (acc[k] || 0) + 1; return acc;
  }, {});

  const q = search.trim().toLowerCase();
  const filtered = q
    ? rows.filter(r => [
        r.referrer?.company_name, r.referrer?.full_name, r.referrer?.email, r.referrer?.maabar_supplier_id,
        r.referred?.company_name, r.referred?.full_name, r.referred?.email, r.referral_code,
      ].some(f => (f || '').toLowerCase().includes(q)))
    : rows;

  const capReached = stats.verifiedTotal >= PROGRAM_VERIFIED_CAP;

  // Fraud / attention signals computable from what we already load.
  const flagsFor = (r) => {
    const out = [];
    const rr = (r.referrer?.reg_number || '').trim().toLowerCase();
    const rd = (r.referred?.reg_number || '').trim().toLowerCase();
    if (rr && rd && rr === rd) out.push({ cls: 'a-pill-red', ar: 'سجل تجاري مطابق', en: 'Same CR' });
    if ((referrerCounts[r.referrer?.id] || 0) >= PER_REFERRER_CAP) out.push({ cls: 'a-pill-amber', ar: 'بلغ حد 10', en: 'At 10 cap' });
    if (r.referred_verified_at && !r.reward_eligible) out.push({ cls: 'a-pill-grey', ar: 'غير مستحقّة', en: 'Not eligible' });
    return out;
  };

  const rewardCell = (r) => {
    const rw = r.rewards || [];
    if (!rw.length) return <span style={{ color: 'rgba(0,0,0,0.25)' }}>—</span>;
    const total = rw.reduce((a, x) => a + Number(x.amount || 0), 0);
    const anyWithdrawable = rw.some(x => x.state === 'withdrawable');
    const allWithdrawable = rw.every(x => x.state === 'withdrawable');
    const cls = allWithdrawable ? 'a-pill-green' : anyWithdrawable ? 'a-pill-amber' : 'a-pill-grey';
    const label = allWithdrawable ? (isAr ? 'قابلة للسحب' : 'Withdrawable')
                : anyWithdrawable ? (isAr ? 'جزئياً' : 'Partial')
                : (isAr ? 'قيد التفعيل' : 'Pending');
    return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontVariantNumeric: 'lining-nums' }}>{money(total)}</span>
        <span className={`a-pill ${cls}`}>{rw.length}/2 · {label}</span>
      </span>
    );
  };

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{SHARED_CSS(isAr)}</style>
        <div className="a-page" dir={isAr ? 'rtl' : 'ltr'}>
          <h1 className="a-page-title">{isAr ? 'الإحالات' : 'Referrals'}</h1>
          <p className="a-page-sub">
            {loading ? '…' : `${filtered.length} ${isAr ? 'إحالة' : 'referral' + (filtered.length !== 1 ? 's' : '')}`}
          </p>

          <div className="a-stats">
            <div className={`a-stat${capReached ? ' a-cap-warn' : ''}`}>
              <div className="a-stat-label">{isAr ? 'حد البرنامج' : 'Program cap'}</div>
              <div className="a-stat-val" style={capReached ? { color: '#c0392b' } : undefined}>
                {stats.verifiedTotal} / {PROGRAM_VERIFIED_CAP}
              </div>
              <div className="a-stat-note">
                {capReached
                  ? (isAr ? '⚠️ بلغ الحد — البرنامج توقّف عن منح المكافآت' : '⚠️ Cap reached — the program has stopped awarding')
                  : (isAr ? 'إحالات موثّقة على مستوى البرنامج' : 'Verified referrals, program-wide')}
              </div>
            </div>
            <div className="a-stat">
              <div className="a-stat-label">{isAr ? 'قيد التفعيل' : 'Pending'}</div>
              <div className="a-stat-val">{money(stats.pending)}</div>
              <div className="a-stat-note">{isAr ? 'يتحوّل مع أول عملية بيع' : 'Releases on first sale'}</div>
            </div>
            <div className="a-stat">
              <div className="a-stat-label">{isAr ? 'قابل للسحب' : 'Withdrawable'}</div>
              <div className="a-stat-val">{money(stats.withdrawable)}</div>
              <div className="a-stat-note">{isAr ? 'مستحق الدفع للموردين' : 'Owed to suppliers'}</div>
            </div>
          </div>

          <div className="a-tabs">
            {TABS.map(t => (
              <button key={t.key} className={`a-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>

          <input
            className="a-search"
            placeholder={isAr ? 'بحث بالمُحيل، المُحال، الكود…' : 'Search referrer, referred, code…'}
            value={search} onChange={e => setSearch(e.target.value)} dir={isAr ? 'rtl' : 'ltr'}
          />

          {error && <div className="a-error">{isAr ? 'تعذّر التحميل: ' : 'Failed to load: '}{error}</div>}

          {/* Desktop table */}
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>{isAr ? 'المُحيل' : 'Referrer'}</th>
                  <th>{isAr ? 'المُحال' : 'Referred'}</th>
                  <th>{isAr ? 'التسجيل' : 'Signed up'}</th>
                  <th>{isAr ? 'التوثيق' : 'Verified'}</th>
                  <th>{isAr ? 'المكافأة' : 'Reward'}</th>
                  <th>{isAr ? 'إشارات' : 'Flags'}</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'جارٍ التحميل...' : 'Loading…'}</div></td></tr>}
                {!loading && error && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'تعذّر التحميل' : 'Could not load'}</div></td></tr>}
                {!loading && !error && filtered.length === 0 && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'لا توجد إحالات' : 'No referrals yet'}</div></td></tr>}
                {filtered.map(r => (
                  <tr key={r.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>{r.referrer?.company_name || r.referrer?.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 1 }}>{r.referrer?.maabar_supplier_id || r.referrer?.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>{r.referred?.company_name || r.referred?.full_name || '—'}</div>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 1 }}>{r.referred?.status || r.referred?.email}</div>
                    </td>
                    <td style={{ fontSize: 12, color: 'rgba(0,0,0,0.40)', fontVariantNumeric: 'lining-nums' }}>{fmtDate(r.created_at)}</td>
                    <td style={{ fontSize: 12, color: 'rgba(0,0,0,0.40)', fontVariantNumeric: 'lining-nums' }}>
                      {r.referred_verified_at ? fmtDate(r.referred_verified_at) : <span className="a-pill a-pill-grey">{isAr ? 'بانتظار' : 'Awaiting'}</span>}
                    </td>
                    <td>{rewardCell(r)}</td>
                    <td>
                      <span style={{ display: 'inline-flex', gap: 4, flexWrap: 'wrap' }}>
                        {flagsFor(r).map((f, i) => <span key={i} className={`a-pill ${f.cls}`}>{isAr ? f.ar : f.en}</span>)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="a-cards">
            {loading && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>}
            {!loading && !error && filtered.length === 0 && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'لا توجد إحالات' : 'No referrals yet'}</p>}
            {filtered.map(r => (
              <div key={r.id} className="a-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, fontFamily: FONT_BODY, color: 'rgba(0,0,0,0.85)' }}>
                      {r.referrer?.company_name || r.referrer?.full_name || '—'}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginTop: 1 }}>
                      → {r.referred?.company_name || r.referred?.full_name || r.referred?.email || '—'}
                    </div>
                  </div>
                  {rewardCell(r)}
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  <div>
                    <div className="a-card-meta">{isAr ? 'التسجيل' : 'SIGNED UP'}</div>
                    <div className="a-card-val">{fmtDate(r.created_at)}</div>
                  </div>
                  <div>
                    <div className="a-card-meta">{isAr ? 'التوثيق' : 'VERIFIED'}</div>
                    <div className="a-card-val">{r.referred_verified_at ? fmtDate(r.referred_verified_at) : (isAr ? 'بانتظار' : 'Awaiting')}</div>
                  </div>
                </div>
                {flagsFor(r).length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 10 }}>
                    {flagsFor(r).map((f, i) => <span key={i} className={`a-pill ${f.cls}`}>{isAr ? f.ar : f.en}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
