import React, { useEffect, useState, useCallback } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminPaginator from '../../components/admin/AdminPaginator';
import { sb } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";
const PAGE_SIZE    = 50;

const LOG_TABS = [
  { key: 'all',     en: 'All',     ar: 'الكل' },
  { key: 'sent',    en: 'Sent',    ar: 'مُرسل' },
  { key: 'failed',  en: 'Failed',  ar: 'فاشل' },
  { key: 'bounced', en: 'Bounced', ar: 'مرتد' },
];

const MAIN_TABS = [
  { key: 'logs',      en: 'Email Logs',       ar: 'سجل البريد' },
  { key: 'templates', en: 'Template Overrides', ar: 'قوالب البريد' },
];

const fmtTime = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const CSS = (isAr) => `
  .em-page { padding: 36px 32px; max-width: 1080px; }
  .em-page-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FONT_HEADING}; line-height: 1.1; }
  .em-page-sub { margin: 0 0 24px; font-size: 12px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .em-main-tabs { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid rgba(0,0,0,0.07); padding-bottom: 0; }
  .em-main-tab { padding: 8px 16px; border: none; background: transparent; cursor: pointer; font-size: 13px; color: rgba(0,0,0,0.45); font-family: ${FONT_BODY}; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all 0.12s; white-space: nowrap; }
  .em-main-tab.on { color: rgba(0,0,0,0.88); border-bottom-color: #1a1814; font-weight: 600; }
  .em-main-tab:not(.on):hover { color: rgba(0,0,0,0.72); }
  .em-tabs { display: flex; gap: 4px; margin-bottom: 16px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .em-tabs::-webkit-scrollbar { display: none; }
  .em-tab { flex-shrink: 0; padding: 6px 14px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.09); background: transparent; cursor: pointer; font-size: 12px; color: rgba(0,0,0,0.45); min-height: 34px; transition: all 0.12s; white-space: nowrap; font-family: ${FONT_BODY}; }
  .em-tab.on { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
  .em-tab:not(.on):hover { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.72); }
  .em-search { width: 100%; max-width: 360px; padding: 9px 13px; margin-bottom: 18px; background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; font-size: 14px; color: rgba(0,0,0,0.80); font-family: ${FONT_BODY}; outline: none; box-sizing: border-box; }
  .em-search:focus { border-color: rgba(0,0,0,0.22); }
  .em-layout { display: grid; grid-template-columns: 1fr 380px; gap: 14px; align-items: start; }
  .em-table-wrap { border-radius: 10px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; }
  .em-table { width: 100%; border-collapse: collapse; }
  .em-table th { padding: 11px 16px; font-size: 10px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; color: rgba(0,0,0,0.38); text-align: ${isAr ? 'right' : 'left'}; background: var(--bg-subtle, #F5F2EE); border-bottom: 1px solid rgba(0,0,0,0.06); white-space: nowrap; font-family: ${FONT_BODY}; }
  .em-table td { padding: 11px 16px; font-size: 12px; color: rgba(0,0,0,0.80); border-bottom: 1px solid rgba(0,0,0,0.05); vertical-align: middle; font-family: ${FONT_BODY}; }
  .em-table tr:last-child td { border-bottom: none; }
  .em-table tbody tr { cursor: pointer; transition: background 0.1s; }
  .em-table tbody tr.active td { background: rgba(26,24,20,0.04); }
  .em-table tbody tr:hover td { background: rgba(0,0,0,0.025); }
  .em-preview { background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 20px; position: sticky; top: 24px; }
  .em-empty { text-align: center; padding: 40px 20px; color: rgba(0,0,0,0.30); font-family: ${FONT_BODY}; font-size: 13px; }
  .em-btn { min-height: 34px; padding: 0 14px; border-radius: 7px; font-size: 12px; cursor: pointer; font-family: ${FONT_BODY}; white-space: nowrap; border: 1px solid rgba(0,0,0,0.09); background: transparent; color: rgba(0,0,0,0.55); transition: all 0.12s; }
  .em-btn:hover { background: rgba(0,0,0,0.04); }
  .em-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .em-btn-primary { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
  .em-btn-primary:hover { opacity: 0.88; background: #1a1814; }
  .em-btn-warn { color: #8B6914; border-color: rgba(139,105,20,0.25); }
  .em-btn-warn:hover { background: rgba(139,105,20,0.06); }
  .em-tpl-list { display: flex; flex-direction: column; gap: 8px; }
  .em-tpl-row { background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: border-color 0.12s; }
  .em-tpl-row.active { border-color: rgba(0,0,0,0.22); }
  .em-tpl-row:hover { border-color: rgba(0,0,0,0.15); }
  .em-tpl-editor { background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 20px; position: sticky; top: 24px; }
  .em-input { width: 100%; box-sizing: border-box; background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; padding: 9px 12px; font-size: 13px; color: rgba(0,0,0,0.80); font-family: ${FONT_BODY}; outline: none; margin-bottom: 10px; }
  .em-input:focus { border-color: rgba(0,0,0,0.22); }
  .em-textarea { width: 100%; box-sizing: border-box; background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; padding: 10px 12px; font-size: 12px; color: rgba(0,0,0,0.80); font-family: monospace; outline: none; resize: vertical; margin-bottom: 10px; }
  .em-textarea:focus { border-color: rgba(0,0,0,0.22); }
  .em-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #1a1814; color: #fff; padding: 10px 22px; border-radius: 99px; font-size: 12px; font-family: ${FONT_BODY}; z-index: 999; white-space: nowrap; pointer-events: none; }
  .em-label { font-size: 10px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; margin-bottom: 6px; }
  .em-toggle-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
  .em-toggle { appearance: none; width: 36px; height: 20px; border-radius: 99px; background: rgba(0,0,0,0.15); cursor: pointer; position: relative; outline: none; transition: background 0.15s; flex-shrink: 0; }
  .em-toggle:checked { background: #27725a; }
  .em-toggle::after { content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #fff; top: 3px; left: 3px; transition: transform 0.15s; }
  .em-toggle:checked::after { transform: translateX(16px); }
  @media (max-width: 900px) { .em-page { padding: 22px 16px; } .em-search { max-width: 100%; } .em-layout { grid-template-columns: 1fr; } .em-preview, .em-tpl-editor { position: static; } }
  @media (max-width: 768px) { .em-table-wrap { display: none; } }
`;

function EmailLogs({ user, lang, isAr }) {
  const [logTab, setLogTab]     = useState('all');
  const [logs, setLogs]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(0);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [selected, setSelected] = useState(null);
  const [retrying, setRetrying] = useState(false);
  const [flashMsg, setFlashMsg] = useState('');

  const showFlash = msg => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    let q = sb.from('email_logs')
      .select('id, created_at, status, recipient_email, template_name, subject, error_message', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (logTab !== 'all') q = q.eq('status', logTab);
    if (search.trim()) q = q.ilike('recipient_email', `%${search}%`);
    const { data, count } = await q;
    setLogs(data || []);
    setTotal(count || 0);
    setLoading(false);
  }, [logTab, page, search]);

  useEffect(() => { setPage(0); }, [logTab, search]);
  useEffect(() => { load(); }, [load]);

  const retryEmail = async (log) => {
    setRetrying(true);
    const before = { status: log.status };
    await sb.from('email_logs').update({ status: 'sent', error_message: null }).eq('id', log.id);
    await logAdminAction({ actorId: user.id, action: 'email_retry', entityType: 'email_log', entityId: log.id, beforeState: before, afterState: { status: 'sent' } });
    await load();
    setSelected(null);
    setRetrying(false);
    showFlash(isAr ? 'تمت إعادة المحاولة' : 'Queued for retry');
  };

  const STATUS_DOT = { sent: '#27725a', failed: '#c0392b', bounced: '#8B6914' };

  return (
    <>
      {flashMsg && <div className="em-flash">{flashMsg}</div>}
      <div className="em-tabs">
        {LOG_TABS.map(t => (
          <button key={t.key} className={`em-tab${logTab === t.key ? ' on' : ''}`} onClick={() => setLogTab(t.key)}>
            {isAr ? t.ar : t.en}
          </button>
        ))}
      </div>
      <input className="em-search" placeholder={isAr ? 'بحث بالبريد الإلكتروني...' : 'Search by email…'} value={search} onChange={e => setSearch(e.target.value)} dir="ltr" />
      <p style={{ margin: '0 0 14px', fontSize: 12, color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY }}>{loading ? '…' : `${total} ${isAr ? 'رسالة' : 'email' + (total !== 1 ? 's' : '')}`}</p>

      <div className="em-layout">
        <div>
          <div className="em-table-wrap">
            <table className="em-table">
              <thead>
                <tr>
                  <th>{isAr ? 'المستلم' : 'To'}</th>
                  <th>{isAr ? 'القالب' : 'Template'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4}><div className="em-empty">{isAr ? 'جارٍ التحميل...' : 'Loading…'}</div></td></tr>}
                {!loading && logs.length === 0 && <tr><td colSpan={4}><div className="em-empty">{isAr ? 'لا توجد سجلات' : 'No email logs found'}</div></td></tr>}
                {logs.map(l => (
                  <tr key={l.id} className={selected?.id === l.id ? 'active' : ''} onClick={() => setSelected(l)}>
                    <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{l.recipient_email}</td>
                    <td style={{ fontSize: 11, color: 'rgba(0,0,0,0.55)' }}>{l.template_name}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[l.status] || 'rgba(0,0,0,0.25)', display: 'inline-block', flexShrink: 0 }} />
                        {l.status}
                      </span>
                    </td>
                    <td style={{ color: 'rgba(0,0,0,0.40)', fontVariantNumeric: 'lining-nums' }}>{fmtTime(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <AdminPaginator page={page} pageSize={PAGE_SIZE} total={total} onPage={setPage} isAr={isAr} />
          </div>

          {/* Mobile cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="em-mobile-cards">
            {!loading && logs.map(l => (
              <div key={l.id} onClick={() => setSelected(l)} style={{ background: selected?.id === l.id ? 'rgba(26,24,20,0.04)' : 'var(--bg-raised,#fff)', border: `1px solid ${selected?.id === l.id ? 'rgba(0,0,0,0.22)' : 'rgba(0,0,0,0.07)'}`, borderRadius: 10, padding: 14, cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(0,0,0,0.80)' }}>{l.recipient_email}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_DOT[l.status] || 'rgba(0,0,0,0.25)', display: 'inline-block' }} />
                    {l.status}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY }}>{l.template_name} · {fmtTime(l.created_at)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview pane */}
        <div className="em-preview">
          {!selected ? (
            <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY, textAlign: 'center', padding: '20px 0' }}>{isAr ? 'اختر بريداً لعرض التفاصيل' : 'Select an email to preview'}</p>
          ) : (
            <>
              <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY }}>{isAr ? 'تفاصيل البريد' : 'Email Details'}</p>
              {[
                [isAr ? 'المستلم' : 'To', selected.recipient_email],
                [isAr ? 'القالب' : 'Template', selected.template_name],
                [isAr ? 'الموضوع' : 'Subject', selected.subject],
                [isAr ? 'الحالة' : 'Status', selected.status],
                [isAr ? 'تاريخ الإنشاء' : 'Created', fmtTime(selected.created_at)],
              ].map(([label, val]) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div className="em-label">{label}</div>
                  <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.75)', fontFamily: FONT_BODY, wordBreak: 'break-all' }}>{val || '—'}</div>
                </div>
              ))}
              {selected.error_message && (
                <div style={{ marginBottom: 12 }}>
                  <div className="em-label" style={{ color: '#c0392b' }}>{isAr ? 'الخطأ' : 'Error'}</div>
                  <div style={{ fontSize: 12, color: '#c0392b', fontFamily: 'monospace', background: 'rgba(192,57,43,0.06)', padding: '8px 10px', borderRadius: 6, wordBreak: 'break-all' }}>{selected.error_message}</div>
                </div>
              )}
              {(selected.status === 'failed' || selected.status === 'bounced') && (
                <button className="em-btn em-btn-warn" disabled={retrying} onClick={() => retryEmail(selected)} style={{ marginTop: 4 }}>
                  {retrying ? '…' : (isAr ? 'إعادة المحاولة' : 'Retry')}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

function TemplateOverrides({ user, lang, isAr }) {
  const [templates, setTemplates]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [saving, setSaving]         = useState(false);
  const [flashMsg, setFlashMsg]     = useState('');
  const [subjectDraft, setSubjectDraft] = useState('');
  const [bodyDraft, setBodyDraft]   = useState('');
  const [isActiveDraft, setIsActiveDraft] = useState(false);

  const showFlash = msg => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('template_overrides').select('*').order('template_name');
    setTemplates(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectTemplate = (t) => {
    setSelected(t);
    setSubjectDraft(t.subject_override || '');
    setBodyDraft(t.body_override || '');
    setIsActiveDraft(t.is_active ?? false);
  };

  const save = async () => {
    if (!selected) return;
    setSaving(true);
    const before = { subject_override: selected.subject_override, body_override: selected.body_override, is_active: selected.is_active };
    const patch = { subject_override: subjectDraft.trim() || null, body_override: bodyDraft.trim() || null, is_active: isActiveDraft, updated_at: new Date().toISOString(), updated_by: user.id };
    await sb.from('template_overrides').update(patch).eq('id', selected.id);
    await logAdminAction({ actorId: user.id, action: 'template_override_update', entityType: 'template_override', entityId: selected.id, beforeState: before, afterState: { subject_override: patch.subject_override, body_override: patch.body_override, is_active: patch.is_active } });
    await load();
    setSelected(prev => ({ ...prev, ...patch }));
    setSaving(false);
    showFlash(isAr ? 'تم الحفظ' : 'Saved');
  };

  return (
    <>
      {flashMsg && <div className="em-flash">{flashMsg}</div>}
      {loading ? (
        <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>
      ) : (
        <div className="em-layout">
          <div className="em-tpl-list">
            {templates.length === 0 && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'لا توجد قوالب' : 'No templates found'}</p>}
            {templates.map(t => (
              <div key={t.id} className={`em-tpl-row${selected?.id === t.id ? ' active' : ''}`} onClick={() => selectTemplate(t)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.85)', fontFamily: FONT_BODY, marginBottom: 2 }}>{t.template_name}</div>
                    {t.subject_override && <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', fontFamily: FONT_BODY }}>{t.subject_override}</div>}
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.6, color: t.is_active ? '#27725a' : 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>
                    {t.is_active ? (isAr ? 'نشط' : 'ACTIVE') : (isAr ? 'غير نشط' : 'OFF')}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="em-tpl-editor">
            {!selected ? (
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY, textAlign: 'center', padding: '20px 0' }}>{isAr ? 'اختر قالباً للتعديل' : 'Select a template to edit'}</p>
            ) : (
              <>
                <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY }}>{selected.template_name}</p>

                <div className="em-toggle-row">
                  <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.75)', fontFamily: FONT_BODY }}>{isAr ? 'تفعيل التجاوز' : 'Enable override'}</span>
                  <input type="checkbox" className="em-toggle" checked={isActiveDraft} onChange={e => setIsActiveDraft(e.target.checked)} />
                </div>

                <div className="em-label">{isAr ? 'الموضوع (اختياري)' : 'Subject override (optional)'}</div>
                <input className="em-input" value={subjectDraft} onChange={e => setSubjectDraft(e.target.value)} placeholder={isAr ? 'موضوع البريد...' : 'Email subject…'} dir={isAr ? 'rtl' : 'ltr'} />

                <div className="em-label">{isAr ? 'نص القالب (HTML/نص)' : 'Body override (HTML or plain text)'}</div>
                <textarea className="em-textarea" value={bodyDraft} onChange={e => setBodyDraft(e.target.value)} rows={12} placeholder={isAr ? 'محتوى البريد...' : 'Email body…'} dir="ltr" />

                <button className="em-btn em-btn-primary" disabled={saving} onClick={save}>
                  {saving ? '…' : (isAr ? 'حفظ' : 'Save')}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default function AdminEmails({ user, profile, lang, ...rest }) {
  const [mainTab, setMainTab] = useState('logs');
  const isAr = lang === 'ar';

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS(isAr)}</style>
        <div className="em-page" dir={isAr ? 'rtl' : 'ltr'}>
          <h1 className="em-page-title">{isAr ? 'البريد الإلكتروني' : 'Emails'}</h1>
          <p className="em-page-sub">{isAr ? 'سجل الإرسال وقوالب البريد' : 'Send log and template overrides'}</p>

          <div className="em-main-tabs">
            {MAIN_TABS.map(t => (
              <button key={t.key} className={`em-main-tab${mainTab === t.key ? ' on' : ''}`} onClick={() => setMainTab(t.key)}>
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>

          {mainTab === 'logs'      && <EmailLogs user={user} lang={lang} isAr={isAr} />}
          {mainTab === 'templates' && <TemplateOverrides user={user} lang={lang} isAr={isAr} />}
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
