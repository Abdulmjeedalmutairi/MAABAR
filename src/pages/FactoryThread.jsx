import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ThreadChat from '../components/factory/ThreadChat';
import {
  fetchTraderThread, fetchTraderMessages, markTraderRead, sendTraderMessage,
} from '../lib/factoryThreads';

// Trader-side conversation with a factory (/messages/factory/:threadId). Shows the
// factory's public identity; the factory never sees the trader's (masked on the
// other side). Chat behaviour lives in the shared ThreadChat component.
const T = {
  ar: { factory: 'المصنع', empty: 'ابدأ المحادثة مع المصنع.', loading: 'جارٍ التحميل…',
    notFound: 'المحادثة غير موجودة.', signin: 'سجّل الدخول للمراسلة.', login: 'تسجيل الدخول' },
  en: { factory: 'Factory', empty: 'Start the conversation with this factory.', loading: 'Loading…',
    notFound: 'Conversation not found.', signin: 'Sign in to send messages.', login: 'Sign in' },
  zh: { factory: '工厂', empty: '开始与该工厂的对话。', loading: '加载中…',
    notFound: '未找到对话。', signin: '登录后发送消息。', login: '登录' },
};

const centered = { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'var(--app-dvh)', gap: 14, flexDirection: 'column', padding: 24, textAlign: 'center' };

export default function FactoryThread({ user, lang = 'ar' }) {
  const { threadId } = useParams();
  const nav = useNavigate();
  const loc = useLocation();
  const pendingProduct = loc.state?.product || null;   // attached when the chat was opened from a product
  const isAr = lang === 'ar';
  const t = T[lang] || T.ar;

  const [thread, setThread] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ok | notfound

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    (async () => {
      try {
        const th = await fetchTraderThread(threadId);
        if (!alive) return;
        if (!th) { setStatus('notfound'); return; }
        setThread(th); setStatus('ok');
      } catch { if (alive) setStatus('notfound'); }
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
        {status === 'loading' ? t.loading : t.notFound}
      </p>
    </div>
  );

  const fac = thread.factory;
  const facName = fac ? ((fac.company_name_latin || '').trim() || fac.company_name || t.factory) : t.factory;
  const location = fac ? [fac.city, fac.country].filter(Boolean).join(isAr ? '، ' : ', ') : '';

  return (
    <ThreadChat
      lang={lang}
      selfRole="trader"
      header={{ name: facName, avatar: fac?.profile_image || null, meta: location }}
      showChinaTime={!fac?.country || /china|中国|الصين/i.test(fac.country)}
      emptyText={t.empty}
      onBack={() => nav(-1)}
      loadMessages={async () => { const m = await fetchTraderMessages(threadId); markTraderRead(threadId); return m; }}
      sendMessage={(body, productRef) => sendTraderMessage(threadId, body, productRef)}
      pendingProduct={pendingProduct}
    />
  );
}
