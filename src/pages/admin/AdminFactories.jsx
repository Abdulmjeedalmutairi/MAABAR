import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import { fetchFactories, archiveFactory, deleteFactory } from '../../lib/catalogImport';
import { UI_CATEGORIES } from '../../lib/supplierDashboardConstants';

const FH = "'Cormorant Garamond', Georgia, serif";
const FB = "'Tajawal', sans-serif";

const CSS = (isAr) => `
  .af-page { padding: 34px 30px; max-width: 1040px; }
  .af-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FH}; }
  .af-sub { margin: 0 0 20px; font-size: 12px; color: rgba(0,0,0,0.42); font-family: ${FB}; }
  .af-search { width: 100%; max-width: 320px; padding: 9px 13px; border: 1px solid rgba(0,0,0,0.14); border-radius: 8px; font-size: 13px; font-family: ${FB}; margin-bottom: 16px; box-sizing: border-box; outline: none; }
  .af-search:focus { border-color: rgba(0,0,0,0.35); }
  .af-error { margin: 0 0 14px; padding: 10px 14px; border-radius: 8px; background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.18); color: #c0392b; font-size: 12.5px; font-family: ${FB}; }
  .af-wrap { border: 1px solid rgba(0,0,0,0.08); border-radius: 10px; overflow: hidden; }
  .af-row { display: grid; grid-template-columns: 1fr 150px 120px auto; gap: 12px; align-items: center; padding: 13px 16px; border-bottom: 1px solid rgba(0,0,0,0.05); }
  .af-row:last-child { border-bottom: none; }
  .af-row:hover { background: rgba(0,0,0,0.02); }
  .af-name { font-family: ${FB}; font-size: 14px; font-weight: 500; color: rgba(0,0,0,0.85); }
  .af-sub2 { font-family: ${FB}; font-size: 11.5px; color: rgba(0,0,0,0.4); margin-top: 1px; }
  .af-cell { font-family: ${FB}; font-size: 12.5px; color: rgba(0,0,0,0.6); }
  .af-pill { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; font-family: ${FB}; }
  .af-pill.live { background: rgba(63,157,90,0.14); color: #3f9d5a; }
  .af-pill.hidden { background: rgba(0,0,0,0.06); color: rgba(0,0,0,0.5); }
  .af-actions { display: flex; gap: 6px; justify-content: ${isAr ? 'flex-start' : 'flex-end'}; flex-wrap: wrap; }
  .af-btn { border: 1px solid rgba(0,0,0,0.15); background: #fff; border-radius: 7px; padding: 6px 11px; font-size: 12px; cursor: pointer; font-family: ${FB}; color: rgba(0,0,0,0.7); }
  .af-btn:hover { background: rgba(0,0,0,0.03); }
  .af-btn.danger { border-color: #c0503f; color: #c0503f; }
  .af-btn.danger.solid { background: #c0503f; color: #fff; border-color: #c0503f; }
  .af-btn:disabled { opacity: 0.5; cursor: default; }
  .af-empty { text-align: center; padding: 40px; color: rgba(0,0,0,0.3); font-family: ${FB}; font-size: 13px; }
  @media (max-width: 760px) {
    .af-row { grid-template-columns: 1fr auto; }
    .af-hide-sm { display: none; }
    .af-actions { grid-column: 1 / -1; justify-content: flex-start; }
  }
`;

export default function AdminFactories({ user, profile, lang }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [confirmId, setConfirmId] = useState(null);

  const catLabel = useMemo(() => {
    const m = {};
    (UI_CATEGORIES[lang] || UI_CATEGORIES.ar).forEach((c) => { m[c.val] = c.label; });
    return m;
  }, [lang]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRows(await fetchFactories()); setError(''); }
    catch (e) { setError(e.message || 'Query failed'); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const shown = rows.filter((f) => {
    if (!q.trim()) return true;
    const s = q.trim().toLowerCase();
    return [f.company_name, f.company_name_latin, f.city].filter(Boolean).some((v) => v.toLowerCase().includes(s));
  });

  async function toggleActive(f) {
    setBusyId(f.id); setError('');
    try { await archiveFactory(f.id, !f.is_active); setRows((rs) => rs.map((x) => (x.id === f.id ? { ...x, is_active: !f.is_active } : x))); }
    catch (e) { setError(e.message || 'Failed'); }
    setBusyId(null);
  }

  async function remove(f) {
    setBusyId(f.id); setError('');
    try {
      await deleteFactory(f.id);
      setRows((rs) => rs.filter((x) => x.id !== f.id));
      setConfirmId(null);
    } catch (e) {
      setError(e.code === 'HAS_REQUESTS'
        ? (isAr ? `لا يمكن حذف «${f.company_name}» — يوجد طلب تاجر مرتبط به. استخدم «إخفاء» بدلاً من ذلك.`
                : `Can't delete "${f.company_name}" — a buyer request is linked to it. Use "Hide" instead.`)
        : (e.message || 'Delete failed'));
    }
    setBusyId(null);
  }

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS(isAr)}</style>
        <div className="af-page" dir={isAr ? 'rtl' : 'ltr'}>
          <h1 className="af-title">{isAr ? 'المصانع' : 'Factories'}</h1>
          <p className="af-sub">{loading ? '…' : `${shown.length} ${isAr ? 'مصنع' : 'factories'}`}</p>

          <input className="af-search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={isAr ? 'بحث بالاسم أو المدينة…' : 'Search by name or city…'} dir={isAr ? 'rtl' : 'ltr'} />

          {error && <div className="af-error">{error}</div>}

          {loading ? (
            <p className="af-empty">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
          ) : shown.length === 0 ? (
            <p className="af-empty">{isAr ? 'لا توجد مصانع.' : 'No factories.'}</p>
          ) : (
            <div className="af-wrap">
              {shown.map((f) => (
                <div className="af-row" key={f.id}>
                  <div>
                    <button className="af-name" onClick={() => nav(`/admin/factories/${f.id}`)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'start' }}>
                      {f.company_name}
                    </button>
                    {f.company_name_latin && f.company_name_latin !== f.company_name && (
                      <div className="af-sub2">{f.company_name_latin}</div>
                    )}
                  </div>
                  <div className="af-cell af-hide-sm">{catLabel[f.category] || f.category || '—'}{f.city ? ` · ${f.city}` : ''}</div>
                  <div className="af-hide-sm">
                    <span className={`af-pill ${f.is_active ? 'live' : 'hidden'}`}>
                      {f.is_active ? (isAr ? 'ظاهر' : 'Live') : (isAr ? 'مخفي' : 'Hidden')}
                    </span>
                  </div>
                  <div className="af-actions">
                    <button className="af-btn" onClick={() => nav(`/admin/factories/${f.id}`)}>{isAr ? 'إدارة' : 'Manage'}</button>
                    <a className="af-btn" href={`/factory/${f.id}`} target="_blank" rel="noreferrer">{isAr ? 'عرض' : 'View'}</a>
                    <button className="af-btn" disabled={busyId === f.id} onClick={() => toggleActive(f)}>
                      {f.is_active ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                    </button>
                    {confirmId === f.id ? (
                      <>
                        <button className="af-btn danger solid" disabled={busyId === f.id} onClick={() => remove(f)}>
                          {busyId === f.id ? (isAr ? 'جارٍ…' : '…') : (isAr ? 'تأكيد الحذف' : 'Confirm delete')}
                        </button>
                        <button className="af-btn" disabled={busyId === f.id} onClick={() => setConfirmId(null)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                      </>
                    ) : (
                      <button className="af-btn danger" disabled={busyId != null} onClick={() => { setConfirmId(f.id); setError(''); }}>{isAr ? 'حذف' : 'Delete'}</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
