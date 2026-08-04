import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import { adminFetchThread, adminFetchThreadMessages } from '../../lib/factoryThreads';

const FH = "'Cormorant Garamond', Georgia, serif";
const FB = "'Tajawal', sans-serif";

const fmtTime = (iso) => { try { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return ''; } };

const CSS = (isAr) => `
  .cd-page { padding: 28px 30px; max-width: 860px; }
  .cd-back { background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.45); font-size: 12px; font-family: ${FB}; padding: 0; margin-bottom: 14px; }
  .cd-card { background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 18px 20px; margin-bottom: 16px; }
  .cd-h1 { margin: 0 0 2px; font-size: 22px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FH}; }
  .cd-row { display: flex; flex-wrap: wrap; gap: 18px 28px; margin-top: 10px; }
  .cd-k { font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: rgba(0,0,0,0.4); font-family: ${FB}; margin: 0 0 2px; }
  .cd-v { font-size: 13.5px; color: rgba(0,0,0,0.82); font-family: ${FB}; margin: 0; }
  .cd-share { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; margin-top: 14px; }
  .cd-link { flex: 1; min-width: 220px; padding: 9px 12px; border: 1px solid rgba(0,0,0,0.14); border-radius: 8px; font-size: 13px; font-family: ${FB}; background: #faf8f4; color: rgba(0,0,0,0.7); }
  .cd-btn { background: #1a1814; color: #fff; border: none; border-radius: 8px; padding: 10px 18px; font-size: 13px; cursor: pointer; font-family: ${FB}; white-space: nowrap; }
  .cd-note { font-size: 11.5px; color: rgba(0,0,0,0.4); font-family: ${FB}; margin: 8px 0 0; }
  .cd-thread { display: flex; flex-direction: column; gap: 10px; }
  .cd-msg { max-width: 82%; }
  .cd-msg.trader { align-self: ${isAr ? 'flex-start' : 'flex-end'}; }
  .cd-msg.factory { align-self: ${isAr ? 'flex-end' : 'flex-start'}; }
  .cd-msg.admin { align-self: center; max-width: 90%; }
  .cd-who { font-size: 10px; letter-spacing: 0.5px; text-transform: uppercase; color: rgba(0,0,0,0.4); font-family: ${FB}; margin: 0 4px 2px; }
  .cd-bubble { padding: 9px 13px; border-radius: 12px; font-size: 14px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; font-family: ${FB}; }
  .cd-msg.trader .cd-bubble { background: #1a1814; color: #fff; }
  .cd-msg.factory .cd-bubble { background: #f2ede3; color: rgba(0,0,0,0.85); }
  .cd-msg.admin .cd-bubble { background: #eef1f4; color: #55606c; font-size: 12.5px; }
  .cd-time { font-size: 10px; color: rgba(0,0,0,0.35); margin: 3px 4px 0; font-family: ${FB}; }
  .cd-empty { text-align: center; padding: 30px; color: rgba(0,0,0,0.3); font-family: ${FB}; font-size: 13px; }
  @media (max-width: 900px) { .cd-page { padding: 20px 14px; } }
`;

export default function AdminConversationDetail({ user, profile, lang }) {
  const { threadId } = useParams();
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const th = await adminFetchThread(threadId);
      if (!th) { setNotFound(true); setLoading(false); return; }
      setThread(th);
      setMessages(await adminFetchThreadMessages(threadId));
    } catch { setNotFound(true); }
    setLoading(false);
  }, [threadId]);
  useEffect(() => { load(); }, [load]);

  const fac = thread?.factory;
  const facName = fac ? ((fac.company_name_latin || '').trim() || fac.company_name || '—') : '—';
  const shareUrl = thread ? `${window.location.origin}/factory-chat/${thread.share_slug}` : '';
  const traderName = thread?.trader ? (thread.trader.full_name || thread.trader.company_name || (isAr ? 'تاجر' : 'Trader')) : (isAr ? 'تاجر' : 'Trader');
  const senderLabel = (role) => role === 'trader' ? (isAr ? 'التاجر' : 'Trader') : role === 'factory' ? (isAr ? 'المصنع' : 'Factory') : (isAr ? 'الإدارة' : 'Admin');

  function copy() {
    navigator.clipboard?.writeText(shareUrl);
    setCopied(true); setTimeout(() => setCopied(false), 1600);
  }

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS(isAr)}</style>
        <div className="cd-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="cd-back" onClick={() => nav('/admin/conversations')}>{isAr ? '→ رجوع للمحادثات' : '← Back to conversations'}</button>

          {loading ? <p className="cd-empty">{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p>
            : notFound ? <div className="cd-card">{isAr ? 'المحادثة غير موجودة.' : 'Conversation not found.'}</div>
              : (
                <>
                  <div className="cd-card">
                    <h1 className="cd-h1">{facName}</h1>
                    <div className="cd-row">
                      <div>
                        <p className="cd-k">{isAr ? 'التاجر' : 'Trader'}</p>
                        <p className="cd-v">{traderName}</p>
                      </div>
                      {thread.trader?.company_name && <div><p className="cd-k">{isAr ? 'الشركة' : 'Company'}</p><p className="cd-v">{thread.trader.company_name}</p></div>}
                      {thread.trader?.phone && <div><p className="cd-k">{isAr ? 'الجوال' : 'Phone'}</p><p className="cd-v" dir="ltr">{thread.trader.phone}</p></div>}
                      {thread.trader?.email && <div><p className="cd-k">{isAr ? 'البريد' : 'Email'}</p><p className="cd-v" dir="ltr">{thread.trader.email}</p></div>}
                      <div>
                        <p className="cd-k">{isAr ? 'حالة المصنع' : 'Factory account'}</p>
                        <p className="cd-v">{fac?.linked_supplier_id ? (isAr ? 'مُطالَب به ✓' : 'Claimed ✓') : (isAr ? 'لم يُطالَب به بعد' : 'Not claimed yet')}</p>
                      </div>
                    </div>

                    <div className="cd-share">
                      <input className="cd-link" readOnly value={shareUrl} onFocus={(e) => e.target.select()} dir="ltr" />
                      <button className="cd-btn" onClick={copy}>{copied ? (isAr ? 'تم النسخ ✓' : 'Copied ✓') : (isAr ? 'نسخ رابط المصنع' : 'Copy factory link')}</button>
                    </div>
                    <p className="cd-note">{isAr ? 'أرسل هذا الرابط للمصنع (واتساب/بريد) ليسجّل ويرد على التاجر. لا يظهر هذا الرابط للتاجر.' : 'Send this link to the factory (WhatsApp/email) to sign up and reply. The trader never sees this link.'}</p>
                  </div>

                  <div className="cd-card">
                    {messages.length === 0 ? <p className="cd-empty">{isAr ? 'لا توجد رسائل بعد.' : 'No messages yet.'}</p> : (
                      <div className="cd-thread">
                        {messages.map((m) => (
                          <div className={`cd-msg ${m.sender_role}`} key={m.id}>
                            <p className="cd-who">{senderLabel(m.sender_role)}</p>
                            <div className="cd-bubble">{m.content}</div>
                            <span className="cd-time">{fmtTime(m.created_at)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
