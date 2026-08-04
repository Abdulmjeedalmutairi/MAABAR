import React, { useCallback, useEffect, useRef, useState } from 'react';

// Shared conversation UI for factory threads, used by both sides:
//  • trader view (selfRole="trader") — loads/sends via the base tables
//  • factory view (selfRole="factory") — loads/sends via the masked RPCs
// It owns all chat behaviour (load, 5s poll, optimistic send, autoscroll); the
// parent supplies the data-source functions and header. Purely counterpart-masked:
// bubbles carry no sender names, only the header identifies the other party.
const S = {
  ar: { ph: 'اكتب رسالتك…', send: 'إرسال', loading: 'جارٍ التحميل…', back: 'رجوع' },
  en: { ph: 'Type your message…', send: 'Send', loading: 'Loading…', back: 'Back' },
  zh: { ph: '输入您的消息…', send: '发送', loading: '加载中…', back: '返回' },
};

const CSS = `
  .ftc-page { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; height: var(--app-dvh); }
  .ftc-head { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid rgba(0,0,0,0.08); background: #fff; position: sticky; top: 0; z-index: 5; }
  .ftc-back { background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.5); font-size: 13px; font-family: var(--font-sans); padding: 4px; flex-shrink: 0; }
  .ftc-ava { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; background: #efe9df; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #8B7355; font-family: var(--font-sans); }
  .ftc-name { font-size: 15px; font-weight: 600; color: rgba(0,0,0,0.86); margin: 0; line-height: 1.3; }
  .ftc-meta { font-size: 12px; color: rgba(0,0,0,0.45); margin: 0; }
  .ftc-hx { margin-inline-start: auto; flex-shrink: 0; }
  .ftc-scroll { flex: 1; overflow-y: auto; padding: 20px 18px; display: flex; flex-direction: column; gap: 10px; background: var(--bg-base, #faf8f4); }
  .ftc-empty { margin: auto; color: rgba(0,0,0,0.4); font-size: 14px; text-align: center; max-width: 320px; line-height: 1.6; }
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

export default function ThreadChat({
  lang = 'ar', selfRole, header = {}, emptyText = '', onBack, headerExtra = null,
  loadMessages, sendMessage, pollMs = 5000,
}) {
  const isAr = lang === 'ar';
  const s = S[lang] || S.ar;
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const refresh = useCallback(async () => {
    try { const m = await loadMessages(); setMessages(m); }
    catch { /* transient poll error — keep last state */ }
  }, [loadMessages]);

  useEffect(() => {
    let alive = true;
    (async () => { await refresh(); if (alive) setLoading(false); })();
    return () => { alive = false; };
  }, [refresh]);

  useEffect(() => {
    const iv = setInterval(refresh, pollMs);
    return () => clearInterval(iv);
  }, [refresh, pollMs]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    const optimistic = { id: `tmp-${Date.now()}`, sender_role: selfRole, content: body, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setText('');
    try { await sendMessage(body); await refresh(); }
    catch { setMessages((m) => m.filter((x) => x.id !== optimistic.id)); setText(body); }
    setSending(false);
  }

  function onKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
      <style>{CSS}</style>
      <div className="ftc-page">
        <div className="ftc-head">
          {onBack && <button className="ftc-back" onClick={onBack}>{isAr ? '→' : '←'} {s.back}</button>}
          {header.avatar
            ? <img className="ftc-ava" src={header.avatar} alt="" />
            : <div className="ftc-ava">{(header.name || '?')[0]}</div>}
          <div>
            <p className="ftc-name">{header.name}</p>
            {header.meta && <p className="ftc-meta">{header.meta}</p>}
          </div>
          {headerExtra && <div className="ftc-hx">{headerExtra}</div>}
        </div>

        <div className="ftc-scroll">
          {loading ? <p className="ftc-empty">{s.loading}</p>
            : messages.length === 0 ? <p className="ftc-empty">{emptyText}</p>
              : messages.map((m) => {
                const role = m.sender_role === selfRole ? 'me' : m.sender_role === 'admin' ? 'sys' : 'them';
                return (
                  <div className={`ftc-row ${role}`} key={m.id}>
                    <div className="ftc-bubble">{m.content}</div>
                    <span className="ftc-time">{fmtTime(m.created_at, lang)}</span>
                  </div>
                );
              })}
          <div ref={bottomRef} />
        </div>

        <div className="ftc-composer">
          <textarea className="ftc-input" rows={1} value={text} placeholder={s.ph}
            onChange={(e) => setText(e.target.value)} onKeyDown={onKey} dir={isAr ? 'rtl' : 'ltr'} />
          <button className="ftc-send" onClick={send} disabled={sending || !text.trim()}>{s.send}</button>
        </div>
      </div>
    </div>
  );
}
