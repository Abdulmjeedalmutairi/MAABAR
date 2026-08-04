import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import { fetchMyTraderThreads } from '../lib/factoryThreads';

// Trader inbox (/messages): the buyer's factory conversations, newest first.
const T = {
  ar: { title: 'محادثات المصانع', sub: 'محادثاتك المباشرة مع المصانع.', empty: 'لا توجد محادثات بعد. راسل مصنعاً من صفحته.', signin: 'سجّل الدخول لعرض محادثاتك.', login: 'تسجيل الدخول' },
  en: { title: 'Factory messages', sub: 'Your direct conversations with factories.', empty: 'No conversations yet. Message a factory from its page.', signin: 'Sign in to see your messages.', login: 'Sign in' },
  zh: { title: '工厂消息', sub: '您与工厂的直接对话。', empty: '暂无对话。从工厂页面给工厂发消息。', signin: '登录以查看您的消息。', login: '登录' },
};

const fmtWhen = (d) => {
  if (!d) return '';
  const diff = Math.floor((Date.now() - new Date(d)) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
};

const CSS = `
  .mm-wrap { max-width: 720px; margin: 0 auto; padding: 40px 20px 60px; min-height: 60vh; }
  .mm-title { font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: 'Cormorant Garamond', Georgia, serif; margin: 0 0 4px; }
  .mm-sub { font-size: 13px; color: rgba(0,0,0,0.45); font-family: var(--font-sans); margin: 0 0 22px; }
  .mm-list { display: flex; flex-direction: column; gap: 8px; }
  .mm-item { display: flex; align-items: center; gap: 13px; padding: 14px 16px; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; cursor: pointer; transition: border-color 0.12s; text-align: start; }
  .mm-item:hover { border-color: rgba(0,0,0,0.2); }
  .mm-ava { width: 44px; height: 44px; border-radius: 11px; object-fit: cover; background: #efe9df; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: 600; color: #8B7355; font-family: var(--font-sans); }
  .mm-main { flex: 1; min-width: 0; }
  .mm-name { font-size: 15px; font-weight: 600; color: rgba(0,0,0,0.85); margin: 0 0 2px; font-family: var(--font-sans); }
  .mm-prev { font-size: 13px; color: rgba(0,0,0,0.5); margin: 0; font-family: var(--font-sans); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .mm-side { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
  .mm-time { font-size: 11px; color: rgba(0,0,0,0.35); font-family: var(--font-sans); }
  .mm-badge { min-width: 20px; height: 20px; padding: 0 6px; border-radius: 999px; background: #1a1814; color: #fff; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; font-family: var(--font-sans); }
  .mm-empty { text-align: center; padding: 50px 20px; color: rgba(0,0,0,0.35); font-family: var(--font-sans); font-size: 14px; }
`;

export default function MyMessages({ user, lang = 'ar' }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const t = T[lang] || T.ar;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return undefined; }
    let alive = true;
    (async () => {
      try { const r = await fetchMyTraderThreads(); if (alive) setRows(r); }
      catch { /* keep empty */ }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [user]);

  const facName = (f) => f ? ((f.company_name_latin || '').trim() || f.company_name || (isAr ? 'مصنع' : 'Factory')) : (isAr ? 'مصنع' : 'Factory');

  if (!user) return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="mm-wrap" style={{ textAlign: 'center' }}>
        <p className="mm-sub">{t.signin}</p>
        <button onClick={() => nav('/login')} style={{ background: '#1a1814', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer' }}>{t.login}</button>
      </div>
      <Footer lang={lang} />
    </div>
  );

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <style>{CSS}</style>
      <div className="mm-wrap">
        <h1 className="mm-title">{t.title}</h1>
        <p className="mm-sub">{t.sub}</p>
        {loading ? <p className="mm-empty">…</p>
          : rows.length === 0 ? <p className="mm-empty">{t.empty}</p>
            : (
              <div className="mm-list">
                {rows.map((r) => {
                  const name = facName(r.factory);
                  return (
                    <button className="mm-item" key={r.id} onClick={() => nav(`/messages/factory/${r.id}`)}>
                      {r.factory?.profile_image
                        ? <img className="mm-ava" src={r.factory.profile_image} alt="" />
                        : <div className="mm-ava">{(name || '?')[0]}</div>}
                      <div className="mm-main">
                        <p className="mm-name">{name}</p>
                        <p className="mm-prev">{r.last_preview || (isAr ? 'ابدأ المحادثة' : 'Start the conversation')}</p>
                      </div>
                      <div className="mm-side">
                        <span className="mm-time">{fmtWhen(r.last_message_at)}</span>
                        {r.unread > 0 && <span className="mm-badge">{r.unread}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
      </div>
      <Footer lang={lang} />
    </div>
  );
}
