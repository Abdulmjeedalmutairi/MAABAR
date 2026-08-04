import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ThreadChat from '../components/factory/ThreadChat';
import { fetchFactoryThreadMessages, sendFactoryThreadMessage } from '../lib/factoryThreads';

// Factory-side conversation opened from the dashboard inbox (/factory/thread/:threadId).
// Masked: the factory replies to a buyer without ever seeing the buyer's identity.
// Access is enforced server-side (the RPCs require factory_linked_to_me).
const T = {
  ar: { buyer: 'مشتري محتمل', empty: 'أرسل رسالتك الأولى للمشتري.', denied: 'لا تملك صلاحية هذه المحادثة.', login: 'تسجيل الدخول', signin: 'سجّل الدخول للمتابعة.' },
  en: { buyer: 'Potential buyer', empty: 'Send your first message to the buyer.', denied: 'You do not have access to this conversation.', login: 'Sign in', signin: 'Sign in to continue.' },
  zh: { buyer: '潜在买家', empty: '给买家发送第一条消息。', denied: '您无权访问此对话。', login: '登录', signin: '登录后继续。' },
};

const centered = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'var(--app-dvh)', gap: 14, flexDirection: 'column', padding: 24, textAlign: 'center' };

export default function FactoryThreadView({ user, lang = 'ar' }) {
  const { threadId } = useParams();
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const t = T[lang] || T.ar;
  const [status, setStatus] = useState('loading'); // loading | ok | denied

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    (async () => {
      try { await fetchFactoryThreadMessages(threadId); if (alive) setStatus('ok'); }
      catch { if (alive) setStatus('denied'); }
    })();
    return () => { alive = false; };
  }, [threadId, user]);

  if (!user) return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'} style={centered}>
      <p style={{ color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.signin}</p>
      <button onClick={() => nav('/login')} style={{ background: '#1a1814', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}>{t.login}</button>
    </div>
  );

  if (status !== 'ok') return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'} style={centered}>
      <p style={{ color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        {status === 'loading' ? '…' : t.denied}
      </p>
    </div>
  );

  return (
    <ThreadChat
      lang={lang}
      selfRole="factory"
      header={{ name: t.buyer, avatar: null, meta: '' }}
      emptyText={t.empty}
      onBack={() => nav('/dashboard')}
      loadMessages={() => fetchFactoryThreadMessages(threadId)}
      sendMessage={(body) => sendFactoryThreadMessage(threadId, body)}
    />
  );
}
