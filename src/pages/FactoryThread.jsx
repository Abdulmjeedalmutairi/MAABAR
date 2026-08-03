import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  fetchTraderThread, fetchTraderMessages, markTraderRead, sendTraderMessage,
} from '../lib/factoryThreads';

// Trader-side conversation with a factory (/messages/factory/:threadId). The trader
// sees the factory's public identity; the factory never sees the trader's (masked
// on the other side). Polls for new messages (realtime is a later optimization).
const T = {
  ar: { back: 'رجوع', factory: 'المصنع', empty: 'ابدأ المحادثة مع المصنع.', ph: 'اكتب رسالتك…', send: 'إرسال',
    loading: 'جارٍ التحميل…', notFound: 'المحادثة غير موجودة.', you: 'أنت', them: 'المصنع', admin: 'فريق معبر',
    signin: 'سجّل الدخول للمراسلة.' },
  en: { back: 'Back', factory: 'Factory', empty: 'Start the conversation with this factory.', ph: 'Type your message…', send: 'Send',
    loading: 'Loading…', notFound: 'Conversation not found.', you: 'You', them: 'Factory', admin: 'Maabar team',
    signin: 'Sign in to send messages.' },
  zh: { back: '返回', factory: '工厂', empty: '开始与该工厂的对话。', ph: '输入您的消息…', send: '发送',
    loading: '加载中…', notFound: '未找到对话。', you: '您', them: '工厂', admin: 'Maabar 团队',
    signin: '登录后发送消息。' },
};

const CSS = `
  .ftc-page { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; height: var(--app-dvh); }
  .ftc-head { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.08); background: #fff; position: sticky; top: 0; z-index: 5; }
  .ftc-back { background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.5); font-size: 13px; font-family: var(--font-sans); padding: 4px; }
  .ftc-ava { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; background: #efe9df; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #8B7355; font-family: var(--font-sans); }
  .ftc-name { font-size: 15px; font-weight: 600; color: rgba(0,0,0,0.86); margin: 0; line-height: 1.3; }
  .ftc-meta { font-size: 12px; color: rgba(0,0,0,0.45); margin: 0; }
  .ftc-scroll { flex: 1; overflow-y: auto; padding: 20px 18px; display: flex; flex-direction: column; gap: 10px; background: var(--bg-base, #faf8f4); }
  .ftc-empty { margin: auto; color: rgba(0,0,0,0.4); font-size: 14px; }
  .ftc-row { display: flex; flex-direction: column; max-width: 78%; }
  .ftc-row.me { align-self: flex-end; align-items: flex-end; }
  .ftc-row.them { align-self: flex-start; align-items: flex-start; }
  .ftc-row.sys { align-self: center; align-items: center; max-width: 90%; }
  .ftc-bubble { padding: 9px 13px; border-radius: 14px; font-size: 14px; line-height: 1.55; white-space: pre-wrap; word-break: break-word; font-family: var(--font-sans); }
  .ftc-row.me .ftc-bubble { background: #1a1814; color: #fff; border-bottom-right-radius: 5px; }
  .ftc-row.them .ftc-bubble { background: #fff; color: rgba(0,0,0,0.85); border: 1px solid rgba(0,0,0,0.08); border-bottom-left-radius: 5px; }
  .ftc-row.sys .ftc-bubble { background: #f2ede3; color: #8a7a5f; font-size: 12.5px; border-radius: 10px; }
  .ftc-time { font-size: 10.5px; color: rgba(0,0,0,0.35); margin: 3px 4px 0; font-family: var(--font-sans); }
  .ftc-composer { display: flex; gap: 10px; padding: 12px 16px; border-top: 1px solid rgba(0,0,0,0.08); background: #fff; align-items: flex-end; }
  .ftc-input { flex: 1; resize: none; border: 1px solid rgba(0,0,0,0.16); border-radius: 12px; padding: 10px 14px; font-size: 14px; font-family: inherit; max-height: 120px; outline: none; line-height: 1.5; }
  .ftc-input:focus { border-color: rgba(0,0,0,0.4); }
  .ftc-send { background: #1a1814; color: #fff; border: none; border-radius: 12px; padding: 0 20px; height: 42px; font-size: 14px; font-weight: 600; cursor: pointer; font-family: var(--font-sans); flex-shrink: 0; }
  .ftc-send:disabled { opacity: 0.5; cursor: default; }
`;

function fmtTime(iso, lang) {
  try {
    return new Date(iso).toLocaleString(lang === 'ar' ? 'ar' : lang === 'zh' ? 'zh' : 'en', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch { return ''; }
}

export default function FactoryThread({ user, lang = 'ar' }) {
  const { threadId } = useParams();
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const t = T[lang] || T.ar;

  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const loadMessages = useCallback(async () => {
    try {
      const msgs = await fetchTraderMessages(threadId);
      setMessages(msgs);
      markTraderRead(threadId);
    } catch { /* transient poll error — keep last state */ }
  }, [threadId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const th = await fetchTraderThread(threadId);
        if (!alive) return;
        if (!th) { setNotFound(true); setLoading(false); return; }
        setThread(th);
        await loadMessages();
      } catch { if (alive) setNotFound(true); }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [threadId, loadMessages]);

  // Poll for new messages while the conversation is open.
  useEffect(() => {
    if (notFound) return undefined;
    const iv = setInterval(loadMessages, 5000);
    return () => clearInterval(iv);
  }, [loadMessages, notFound]);

  // Keep pinned to the latest message.
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    // Optimistic append.
    const optimistic = { id: `tmp-${messages.length}`, sender_role: 'trader', content: body, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setText('');
    try { await sendTraderMessage(threadId, body); await loadMessages(); }
    catch { setMessages((m) => m.filter((x) => x.id !== optimistic.id)); setText(body); }
    setSending(false);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  if (!user) {
    return (
      <div className="full-page" dir={isAr ? 'rtl' : 'ltr'} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'var(--app-dvh)', gap: 14, flexDirection: 'column' }}>
        <p style={{ color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.signin}</p>
        <button onClick={() => nav('/login')} style={{ background: '#1a1814', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}>{t.send}</button>
      </div>
    );
  }

  const fac = thread?.factory;
  const facName = fac ? ((fac.company_name_latin || '').trim() || fac.company_name || t.factory) : t.factory;
  const location = fac ? [fac.city, fac.country].filter(Boolean).join(isAr ? '، ' : ', ') : '';

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
      <style>{CSS}</style>
      <div className="ftc-page">
        <div className="ftc-head">
          <button className="ftc-back" onClick={() => nav(-1)}>{isAr ? '→' : '←'} {t.back}</button>
          {fac?.profile_image
            ? <img className="ftc-ava" src={fac.profile_image} alt="" />
            : <div className="ftc-ava">{(facName || '?')[0]}</div>}
          <div>
            <p className="ftc-name">{facName}</p>
            {location && <p className="ftc-meta">{location}</p>}
          </div>
        </div>

        <div className="ftc-scroll" ref={scrollRef}>
          {loading ? <p className="ftc-empty">{t.loading}</p>
            : notFound ? <p className="ftc-empty">{t.notFound}</p>
              : messages.length === 0 ? <p className="ftc-empty">{t.empty}</p>
                : messages.map((m) => {
                  const role = m.sender_role === 'trader' ? 'me' : m.sender_role === 'admin' ? 'sys' : 'them';
                  return (
                    <div className={`ftc-row ${role}`} key={m.id}>
                      <div className="ftc-bubble">{m.content}</div>
                      <span className="ftc-time">{fmtTime(m.created_at, lang)}</span>
                    </div>
                  );
                })}
          <div ref={bottomRef} />
        </div>

        {!notFound && (
          <div className="ftc-composer">
            <textarea className="ftc-input" rows={1} value={text} placeholder={t.ph}
              onChange={(e) => setText(e.target.value)} onKeyDown={onKey} dir={isAr ? 'rtl' : 'ltr'} />
            <button className="ftc-send" onClick={send} disabled={sending || !text.trim()}>{t.send}</button>
          </div>
        )}
      </div>
    </div>
  );
}
