import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import { adminListFactoryThreads } from '../../lib/factoryThreads';

const FH = "'Cormorant Garamond', Georgia, serif";
const FB = "'Tajawal', sans-serif";

const fmtWhen = (d) => {
  if (!d) return '—';
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const CSS = (isAr) => `
  .ac-page { padding: 36px 32px; max-width: 1080px; }
  .ac-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FH}; line-height: 1.1; }
  .ac-sub { margin: 0 0 22px; font-size: 12px; color: rgba(0,0,0,0.38); font-family: ${FB}; }
  .ac-search { width: 100%; max-width: 360px; padding: 9px 13px; margin-bottom: 18px; background: #fff; border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; font-size: 14px; color: rgba(0,0,0,0.8); font-family: ${FB}; outline: none; box-sizing: border-box; }
  .ac-search:focus { border-color: rgba(0,0,0,0.22); }
  .ac-wrap { border-radius: 10px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; }
  .ac-table { width: 100%; border-collapse: collapse; }
  .ac-table th { padding: 11px 16px; font-size: 10px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; color: rgba(0,0,0,0.38); text-align: ${isAr ? 'right' : 'left'}; background: #F5F2EE; border-bottom: 1px solid rgba(0,0,0,0.06); white-space: nowrap; font-family: ${FB}; }
  .ac-table td { padding: 13px 16px; font-size: 13px; color: rgba(0,0,0,0.8); border-bottom: 1px solid rgba(0,0,0,0.05); vertical-align: middle; font-family: ${FB}; }
  .ac-table tr:last-child td { border-bottom: none; }
  .ac-table tbody tr { cursor: pointer; transition: background 0.1s; }
  .ac-table tbody tr:hover td { background: rgba(0,0,0,0.025); }
  .ac-strong { font-weight: 600; color: rgba(0,0,0,0.85); }
  .ac-muted { color: rgba(0,0,0,0.45); }
  .ac-prev { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .ac-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #c0503f; color: #fff; font-size: 11px; font-weight: 700; font-family: ${FB}; }
  .ac-copy { background: transparent; border: 1px solid rgba(0,0,0,0.16); border-radius: 7px; padding: 5px 10px; font-size: 11.5px; cursor: pointer; font-family: ${FB}; color: rgba(0,0,0,0.7); white-space: nowrap; }
  .ac-copy:hover { background: rgba(0,0,0,0.04); }
  .ac-cards { display: none; flex-direction: column; gap: 8px; }
  .ac-card { background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 14px; cursor: pointer; }
  .ac-empty { text-align: center; padding: 44px 20px; color: rgba(0,0,0,0.3); font-family: ${FB}; font-size: 13px; }
  @media (max-width: 900px) { .ac-page { padding: 22px 16px; } }
  @media (max-width: 768px) { .ac-wrap { display: none; } .ac-cards { display: flex; } }
`;

export default function AdminConversations({ user, profile, lang }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [copied, setCopied] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await adminListFactoryThreads()); setError(''); }
    catch (e) { setError(e.message || 'Failed to load'); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function copyLink(e, slug, id) {
    e.stopPropagation();
    const url = `${window.location.origin}/factory-chat/${slug}`;
    navigator.clipboard?.writeText(url);
    setCopied(id); setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
  }

  const term = q.trim().toLowerCase();
  const filtered = !term ? rows : rows.filter((r) =>
    [r.factory_name, r.trader_name, r.trader_company, r.trader_phone, r.last_preview]
      .filter(Boolean).some((v) => String(v).toLowerCase().includes(term)));

  const senderLabel = (role) => role === 'trader' ? (isAr ? 'التاجر' : 'Trader')
    : role === 'factory' ? (isAr ? 'المصنع' : 'Factory') : (isAr ? 'الإدارة' : 'Admin');
  const traderName = (r) => r.trader_name || r.trader_company || (isAr ? 'تاجر' : 'Trader');

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS(isAr)}</style>
        <div className="ac-page" dir={isAr ? 'rtl' : 'ltr'}>
          <h1 className="ac-title">{isAr ? 'المحادثات' : 'Conversations'}</h1>
          <p className="ac-sub">{isAr ? 'كل محادثات التجّار مع المصانع. شارك الرابط مع المصنع عند الحاجة.' : 'Every trader↔factory conversation. Share the link with the factory when ready.'}</p>

          <input className="ac-search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={isAr ? 'ابحث بالمصنع أو التاجر…' : 'Search factory or trader…'} />

          {loading ? <p className="ac-empty">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
            : error ? <div className="ac-wrap" style={{ padding: 16, color: '#c0392b', fontFamily: FB }}>{error}</div>
              : filtered.length === 0 ? <p className="ac-empty">{isAr ? 'لا توجد محادثات.' : 'No conversations yet.'}</p>
                : (
                  <>
                    <div className="ac-wrap">
                      <table className="ac-table">
                        <thead>
                          <tr>
                            <th>{isAr ? 'المصنع' : 'Factory'}</th>
                            <th>{isAr ? 'التاجر' : 'Trader'}</th>
                            <th>{isAr ? 'آخر رسالة' : 'Last message'}</th>
                            <th>{isAr ? 'غير مقروء' : 'Unread'}</th>
                            <th>{isAr ? 'الوقت' : 'When'}</th>
                            <th>{isAr ? 'الرابط' : 'Link'}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((r) => (
                            <tr key={r.thread_id} onClick={() => nav(`/admin/conversations/${r.thread_id}`)}>
                              <td className="ac-strong">{r.factory_name}</td>
                              <td>{traderName(r)}{r.trader_phone && <span className="ac-muted"> · {r.trader_phone}</span>}</td>
                              <td className="ac-prev">
                                {r.last_preview
                                  ? <><span className="ac-muted">{senderLabel(r.last_sender_role)}:</span> {r.last_preview}</>
                                  : <span className="ac-muted">—</span>}
                              </td>
                              <td>{r.unread_by_factory > 0 ? <span className="ac-badge">{r.unread_by_factory}</span> : <span className="ac-muted">—</span>}</td>
                              <td className="ac-muted">{fmtWhen(r.last_message_at)}</td>
                              <td><button className="ac-copy" onClick={(e) => copyLink(e, r.share_slug, r.thread_id)}>{copied === r.thread_id ? (isAr ? 'تم ✓' : 'Copied ✓') : (isAr ? 'نسخ الرابط' : 'Copy link')}</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="ac-cards">
                      {filtered.map((r) => (
                        <div className="ac-card" key={r.thread_id} onClick={() => nav(`/admin/conversations/${r.thread_id}`)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <span className="ac-strong">{r.factory_name}</span>
                            {r.unread_by_factory > 0 && <span className="ac-badge">{r.unread_by_factory}</span>}
                          </div>
                          <p style={{ margin: '4px 0', fontSize: 12.5, color: 'rgba(0,0,0,0.6)', fontFamily: FB }}>{traderName(r)}{r.trader_phone ? ` · ${r.trader_phone}` : ''}</p>
                          {r.last_preview && <p className="ac-prev" style={{ margin: '2px 0 8px', fontSize: 12.5, color: 'rgba(0,0,0,0.55)', fontFamily: FB }}>{senderLabel(r.last_sender_role)}: {r.last_preview}</p>}
                          <button className="ac-copy" onClick={(e) => copyLink(e, r.share_slug, r.thread_id)}>{copied === r.thread_id ? (isAr ? 'تم ✓' : 'Copied ✓') : (isAr ? 'نسخ رابط المصنع' : 'Copy factory link')}</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
