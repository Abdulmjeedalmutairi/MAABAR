import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { sb } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

const STATUSES   = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];
const PRIO_COLOR = { urgent: '#c0392b', high: '#8B6914', normal: 'rgba(0,0,0,0.55)', low: 'rgba(0,0,0,0.35)' };

const fmtTime = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function SectionCard({ title, children, style }) {
  return (
    <div style={{ background: 'var(--bg-raised, #fff)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: '20px', marginBottom: 12, ...style }}>
      {title && <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY }}>{title}</p>}
      {children}
    </div>
  );
}

export default function AdminTicketDetail({ user, profile, lang, ...rest }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [flashMsg, setFlashMsg] = useState('');
  const [confirm, setConfirm] = useState(null);
  const isAr = lang === 'ar';

  const showFlash = msg => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: t }, { data: msgs }] = await Promise.all([
      sb.from('support_tickets').select('*, user:user_id(full_name, email, role), assignee:assigned_to(full_name, email)').eq('id', id).single(),
      sb.from('ticket_messages').select('*, author:author_id(full_name, email, role)').eq('ticket_id', id).order('created_at', { ascending: true }),
    ]);
    setTicket(t);
    setMessages(msgs || []);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateField = async (patch) => {
    if (!ticket) return;
    const before = Object.fromEntries(Object.keys(patch).map(k => [k, ticket[k]]));
    const fullPatch = { ...patch, updated_at: new Date().toISOString() };
    if (patch.status === 'resolved') fullPatch.resolved_at = new Date().toISOString();
    await sb.from('support_tickets').update(fullPatch).eq('id', id);
    await logAdminAction({ actorId: user.id, action: 'ticket_update', entityType: 'ticket', entityId: id, beforeState: before, afterState: patch });
    await load();
    showFlash(isAr ? 'تم التحديث' : 'Updated');
  };

  const sendReply = async () => {
    if (!replyBody.trim()) return;
    setSaving(true);
    await sb.from('ticket_messages').insert({ ticket_id: id, author_id: user.id, body: replyBody.trim(), is_admin_reply: true });
    await logAdminAction({ actorId: user.id, action: 'ticket_admin_reply', entityType: 'ticket', entityId: id, beforeState: null, afterState: { body: replyBody.trim() } });
    setReplyBody('');
    await load();
    setSaving(false);
  };

  const closeTicket = async () => {
    await updateField({ status: 'closed' });
    showFlash(isAr ? 'تم إغلاق التذكرة' : 'Ticket closed');
  };

  const CSS = `
    .tk-page { padding: 32px 32px; max-width: 880px; }
    .tk-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.38); font-size: 12px; padding: 0 0 22px; font-family: ${FONT_BODY}; min-height: 44px; transition: color 0.12s; }
    .tk-back:hover { color: rgba(0,0,0,0.65); }
    .tk-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #1a1814; color: #fff; padding: 10px 22px; border-radius: 99px; font-size: 12px; font-family: ${FONT_BODY}; z-index: 999; white-space: nowrap; pointer-events: none; }
    .tk-btn { min-height: 36px; padding: 0 14px; border-radius: 7px; font-size: 12px; cursor: pointer; transition: all 0.12s; font-family: ${FONT_BODY}; white-space: nowrap; border: 1px solid rgba(0,0,0,0.09); background: transparent; color: rgba(0,0,0,0.55); }
    .tk-btn:hover { background: rgba(0,0,0,0.04); }
    .tk-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .tk-btn-primary { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
    .tk-btn-primary:hover { opacity: 0.88; background: #1a1814; }
    .tk-btn-danger { color: #c0392b; border-color: rgba(192,57,43,0.20); }
    .tk-btn-danger:hover { background: rgba(192,57,43,0.06); }
    .tk-msg { padding: 12px 14px; border-radius: 8px; margin-bottom: 8px; max-width: 88%; }
    .tk-msg.admin { background: #1a1814; color: #fff; margin-left: auto; }
    .tk-msg.user { background: var(--bg-subtle, #F5F2EE); color: rgba(0,0,0,0.80); }
    .tk-mini-select { padding: 6px 10px; background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.09); border-radius: 7px; font-size: 12px; color: rgba(0,0,0,0.75); outline: none; min-height: 34px; font-family: ${FONT_BODY}; cursor: pointer; }
    @media (max-width: 900px) { .tk-page { padding: 22px 16px; } }
  `;

  if (loading) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="tk-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  if (!ticket) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="tk-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Ticket not found.</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        {flashMsg && <div className="tk-flash">{flashMsg}</div>}

        <AdminConfirmDialog
          isOpen={!!confirm}
          title={isAr ? 'إغلاق التذكرة' : 'Close Ticket'}
          description={isAr ? 'هل تريد إغلاق هذه التذكرة نهائياً؟' : 'Are you sure you want to close this ticket?'}
          confirmWord="CLOSE"
          onConfirm={() => { closeTicket(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
          isAr={isAr}
          danger
        />

        <div className="tk-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="tk-back" onClick={() => nav('/admin/support')}>
            {isAr ? '‹ الدعم' : '‹ Support'}
          </button>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 400, color: 'rgba(0,0,0,0.88)', fontFamily: FONT_HEADING, lineHeight: 1.2 }}>
                {ticket.subject}
              </h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <AdminStatusBadge status={ticket.status} lang={lang} />
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, color: PRIO_COLOR[ticket.priority], fontFamily: FONT_BODY }}>{ticket.priority}</span>
                {ticket.user && <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY }}>{ticket.user.full_name || ticket.user.email}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {ticket.status !== 'closed' && (
                <button className="tk-btn tk-btn-danger" onClick={() => setConfirm(true)}>
                  {isAr ? 'إغلاق التذكرة' : 'Close Ticket'}
                </button>
              )}
            </div>
          </div>

          {/* Controls */}
          <SectionCard title={isAr ? 'إدارة التذكرة' : 'Ticket Controls'}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 4 }}>{isAr ? 'الحالة' : 'Status'}</div>
                <select className="tk-mini-select" value={ticket.status} onChange={e => updateField({ status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, marginBottom: 4 }}>{isAr ? 'الأولوية' : 'Priority'}</div>
                <select className="tk-mini-select" value={ticket.priority} onChange={e => updateField({ priority: e.target.value })}>
                  {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </SectionCard>

          {/* Original body */}
          {ticket.body && (
            <SectionCard title={isAr ? 'نص التذكرة' : 'Original Message'}>
              <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.70)', fontFamily: FONT_BODY, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{ticket.body}</p>
            </SectionCard>
          )}

          {/* Thread */}
          <SectionCard title={isAr ? `المحادثة (${messages.length})` : `Thread (${messages.length})`}>
            {messages.length === 0 && (
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY }}>{isAr ? 'لا توجد رسائل بعد.' : 'No messages yet.'}</p>
            )}
            {messages.map(m => (
              <div key={m.id} className={`tk-msg ${m.is_admin_reply ? 'admin' : 'user'}`} style={{ direction: isAr ? 'rtl' : 'ltr' }}>
                <div style={{ fontSize: 10, marginBottom: 4, opacity: 0.7, fontFamily: FONT_BODY, letterSpacing: 0.3 }}>
                  {m.author?.full_name || m.author?.email || 'Unknown'} · {fmtTime(m.created_at)}
                </div>
                <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, fontFamily: FONT_BODY, whiteSpace: 'pre-wrap' }}>{m.body}</p>
              </div>
            ))}

            {/* Reply */}
            {ticket.status !== 'closed' && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <textarea
                  value={replyBody}
                  onChange={e => setReplyBody(e.target.value)}
                  placeholder={isAr ? 'اكتب ردك...' : 'Write a reply…'}
                  dir={isAr ? 'rtl' : 'ltr'}
                  rows={3}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-subtle, #F5F2EE)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, resize: 'vertical', outline: 'none', marginBottom: 8 }}
                />
                <button
                  className="tk-btn tk-btn-primary"
                  disabled={saving || !replyBody.trim()}
                  onClick={sendReply}
                >
                  {saving ? '…' : (isAr ? 'إرسال الرد' : 'Send Reply')}
                </button>
              </div>
            )}
          </SectionCard>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
