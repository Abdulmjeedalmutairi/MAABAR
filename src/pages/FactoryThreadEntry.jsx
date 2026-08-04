import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import ThreadChat from '../components/factory/ThreadChat';
import {
  getFactoryThreadInvite, claimAndEnterThread,
  fetchFactoryThreadMessages, sendFactoryThreadMessage,
} from '../lib/factoryThreads';

// Factory entry via a shared thread link (/factory-chat/:slug). The factory opens
// it, signs up (or signs in), and in one step claims its directory row AND lands
// inside that exact buyer conversation. The "claim" is just first-time signup
// through a thread link — no standalone claim page anymore.
const C = {
  ar: {
    tag: 'محادثة المصنع', title: 'تحدّث مع المشتري',
    desc: 'سجّل الدخول لتملك صفحة مصنعك على معبر وتردّ على المشتري مباشرة.',
    have: 'لديك حساب؟ سجّل الدخول', neu: 'مصنع جديد؟ أنشئ حساباً',
    phone: 'الجوال (دولي، مثال: +8613800138000)', password: 'كلمة المرور', company: 'اسم المصنع / الشركة',
    reg: 'إنشاء الحساب والدخول', signin: 'تسجيل الدخول والدخول', enter: 'ادخل المحادثة', working: 'لحظة…',
    buyer: 'مشتري محتمل', dash: 'صفحة مصنعي', emptyChat: 'أرسل رسالتك الأولى للمشتري.',
    claimedOther: 'تمّت المطالبة بهذا المصنع من حساب آخر. سجّل الدخول بحساب المصنع.',
    notFound: 'رابط المحادثة غير موجود.',
    errPhone: 'أدخل رقم جوال صحيح بصيغة دولية (مثال: +8613800138000).', errPw: 'كلمة المرور ٦ أحرف على الأقل.',
    errExists: 'هذا الرقم مسجّل — بدّل إلى «تسجيل الدخول».', errCreds: 'رقم الجوال أو كلمة المرور غير صحيحة.', errAuth: 'تعذّر تسجيل الدخول، حاول مجدداً.',
    alsoOn: 'معبر متوفّر أيضاً على آيفون', playSoon: 'قريباً على Google Play',
  },
  en: {
    tag: 'Factory conversation', title: 'Talk to the buyer',
    desc: 'Sign in to own your factory page on Maabar and reply to the buyer directly.',
    have: 'Have an account? Sign in', neu: 'New factory? Create an account',
    phone: 'Phone (international, e.g. +8613800138000)', password: 'Password', company: 'Factory / company name',
    reg: 'Create account & enter', signin: 'Sign in & enter', enter: 'Enter conversation', working: 'Please wait…',
    buyer: 'Potential buyer', dash: 'My factory', emptyChat: 'Send your first message to the buyer.',
    claimedOther: 'This factory was already claimed by another account. Sign in with the factory account.',
    notFound: 'Conversation link not found.',
    errPhone: 'Enter a valid international phone (e.g. +8613800138000).', errPw: 'Password must be at least 6 characters.',
    errExists: 'This number is already registered — switch to “Sign in”.', errCreds: 'Phone or password is incorrect.', errAuth: 'Could not sign you in, please try again.',
    alsoOn: 'Maabar is also on iPhone', playSoon: 'Coming soon on Google Play',
  },
  zh: {
    tag: '工厂对话', title: '与买家沟通',
    desc: '登录即可在 Maabar 上拥有您的工厂主页，并直接回复买家。',
    have: '已有账户？登录', neu: '新工厂？创建账户',
    phone: '电话（国际格式，如 +8613800138000）', password: '密码', company: '工厂／公司名称',
    reg: '创建账户并进入', signin: '登录并进入', enter: '进入对话', working: '请稍候…',
    buyer: '潜在买家', dash: '我的工厂', emptyChat: '给买家发送第一条消息。',
    claimedOther: '此工厂已被其他账户认领。请使用工厂账户登录。',
    notFound: '未找到对话链接。',
    errPhone: '请输入有效的国际电话（如 +8613800138000）。', errPw: '密码至少 6 位。',
    errExists: '该号码已注册，请切换到“登录”。', errCreds: '电话或密码不正确。', errAuth: '无法登录，请重试。',
    alsoOn: 'Maabar 也在 iPhone 上', playSoon: '即将登陆 Google Play',
  },
};
const isValidPhone = (v) => /^\+[1-9]\d{6,14}$/.test(String(v || '').trim());

const APP_STORE_URL = 'https://apps.apple.com/sa/app/id6780046671';

// Self-contained "Download on the App Store" badge (no external asset / hotlink).
function AppStoreBadge() {
  return (
    <svg width="132" height="44" viewBox="0 0 120 40" role="img" aria-label="Download on the App Store" style={{ display: 'block' }}>
      <rect x="0.5" y="0.5" width="119" height="39" rx="8" fill="#000" stroke="rgba(255,255,255,0.2)" />
      <path fill="#fff" transform="translate(11 9) scale(0.92)"
        d="M16.05 11.28c-.02-1.9 1.55-2.81 1.62-2.86-.88-1.29-2.26-1.47-2.75-1.49-1.17-.12-2.28.69-2.87.69-.59 0-1.5-.67-2.47-.65-1.27.02-2.44.74-3.09 1.87-1.32 2.29-.34 5.67.94 7.53.63.91 1.38 1.93 2.35 1.89.94-.04 1.3-.61 2.44-.61 1.14 0 1.46.61 2.46.59 1.02-.02 1.66-.93 2.28-1.84.72-1.05 1.02-2.07 1.03-2.12-.02-.01-1.97-.76-1.99-3-.02-1.87 1.53-2.77 1.6-2.82zM14.13 5.03c.52-.63.87-1.51.77-2.38-.75.03-1.65.5-2.19 1.13-.48.55-.9 1.44-.79 2.29.84.06 1.69-.42 2.21-1.04z" />
      <text x="35" y="16" fill="#fff" fontFamily="-apple-system, Helvetica, Arial, sans-serif" fontSize="6.5" letterSpacing="0.2">Download on the</text>
      <text x="35" y="30" fill="#fff" fontFamily="-apple-system, Helvetica, Arial, sans-serif" fontSize="15" fontWeight="600">App Store</text>
    </svg>
  );
}

export default function FactoryThreadEntry({ user, lang = 'en' }) {
  const { slug } = useParams();
  const nav = useNavigate();
  const t = C[lang] || C.en;
  const isAr = lang === 'ar';

  const [invite, setInvite] = useState(null);
  const [phase, setPhase] = useState('loading'); // loading | fatal | gate | chat
  const [fatal, setFatal] = useState('');
  const [threadId, setThreadId] = useState(null);

  const [mode, setMode] = useState('register');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Bind (if needed) and open the conversation.
  const enterThread = useCallback(async () => {
    try {
      const tid = await claimAndEnterThread(slug);
      setThreadId(tid); setPhase('chat');
    } catch (e) {
      const m = String(e.message || '').toLowerCase();
      setBusy(false);
      if (m.includes('already claimed')) { setFatal(t.claimedOther); setPhase('fatal'); }
      else { setError(t.errAuth); setPhase('gate'); }
    }
  }, [slug, t]);

  useEffect(() => {
    let alive = true;
    (async () => {
      let iv = null;
      try { iv = await getFactoryThreadInvite(slug); } catch { /* handled below */ }
      if (!alive) return;
      if (!iv) { setFatal(t.notFound); setPhase('fatal'); return; }
      setInvite(iv); setCompany(iv.factory_name || '');
      if (user) {
        if (iv.is_owner) { await enterThread(); return; }        // already theirs → straight in
        if (iv.already_claimed) { setFatal(t.claimedOther); setPhase('fatal'); return; }
        setPhase('gate');                                        // authed, unclaimed → explicit claim button
      } else {
        setPhase('gate');                                        // needs signup / sign-in
      }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, user]);

  async function submit() {
    const ph = phone.trim();
    if (!isValidPhone(ph)) { setError(t.errPhone); return; }
    if (!password || password.length < 6) { setError(t.errPw); return; }
    setBusy(true); setError('');
    try {
      const res = mode === 'signin'
        ? await sb.auth.signInWithPassword({ phone: ph, password })
        : await sb.auth.signUp({ phone: ph, password, options: { data: { role: 'supplier', status: 'registered', company_name: company.trim() || invite?.factory_name || '', phone: ph, lang } } });
      if (res.error || !res.data?.user) {
        setBusy(false);
        const em = String(res.error?.message || '').toLowerCase();
        if (mode === 'register' && /already|registered|exists/.test(em)) setError(t.errExists);
        else if (mode === 'signin') setError(t.errCreds);
        else setError(t.errAuth);
        return;
      }
      await enterThread();
    } catch { setBusy(false); setError(t.errAuth); }
  }

  const wrap = { minHeight: 'var(--app-dvh,100vh)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '20px 20px calc(20px + env(safe-area-inset-bottom))', background: 'var(--bg-page,#FAF9F7)' };
  const card = { width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #E8E3DA', borderRadius: 16, padding: '28px 26px', boxShadow: '0 10px 40px rgba(26,24,20,0.08)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const inp = { width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: '1px solid #DAD3C7', borderRadius: 9, fontSize: 16, marginBottom: 10, fontFamily: 'inherit' };
  const primary = { width: '100%', padding: '12px', border: 'none', borderRadius: 9, background: '#1A1814', color: '#fff', fontSize: 14, fontWeight: 600, cursor: busy ? 'default' : 'pointer', fontFamily: 'inherit', opacity: busy ? 0.6 : 1 };

  if (phase === 'chat' && threadId) {
    return (
      <ThreadChat
        lang={lang}
        selfRole="factory"
        header={{ name: t.buyer, avatar: null, meta: invite?.factory_name || '' }}
        emptyText={t.emptyChat}
        headerExtra={
          <button onClick={() => nav('/dashboard')}
            style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.16)', borderRadius: 8, padding: '7px 12px', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', color: 'rgba(0,0,0,0.7)' }}>
            {t.dash}
          </button>
        }
        loadMessages={() => fetchFactoryThreadMessages(threadId)}
        sendMessage={(body) => sendFactoryThreadMessage(threadId, body)}
      />
    );
  }

  if (phase === 'loading') return <div style={wrap} dir={isAr ? 'rtl' : 'ltr'}><div style={card}>{t.working}</div></div>;
  if (phase === 'fatal') return <div style={wrap} dir={isAr ? 'rtl' : 'ltr'}><div style={{ ...card, textAlign: 'center', color: '#c0392b' }}>{fatal}</div></div>;

  // gate — authed & unclaimed → single claim button; otherwise the phone form.
  const authedUnclaimed = !!user;

  return (
    <div style={wrap} dir={isAr ? 'rtl' : 'ltr'}>
      <div style={card}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#8B7355', margin: '0 0 6px' }}>{t.tag}</p>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 4px', color: '#1A1814' }}>{t.title}</h1>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#6f5c43', margin: '0 0 4px' }}>{invite?.factory_name}</p>
        <p style={{ fontSize: 13, color: '#3D3A35', lineHeight: 1.7, margin: '0 0 18px' }}>{t.desc}</p>

        {authedUnclaimed ? (
          <>
            {error && <p style={{ color: '#c0392b', fontSize: 12.5, margin: '2px 0 10px' }}>{error}</p>}
            <button onClick={() => { setBusy(true); setError(''); enterThread(); }} disabled={busy} style={primary}>
              {busy ? t.working : t.enter}
            </button>
          </>
        ) : (
          <>
            {mode === 'register' && (
              <input style={inp} value={company} onChange={(e) => setCompany(e.target.value)} placeholder={t.company} dir={isAr ? 'rtl' : 'ltr'} />
            )}
            <input style={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phone} dir="ltr" inputMode="tel" />
            <input style={inp} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.password} dir="ltr" />
            {error && <p style={{ color: '#c0392b', fontSize: 12.5, margin: '2px 0 10px' }}>{error}</p>}
            <button onClick={submit} disabled={busy} style={primary}>
              {busy ? t.working : mode === 'signin' ? t.signin : t.reg}
            </button>
            <button onClick={() => { setMode(mode === 'signin' ? 'register' : 'signin'); setError(''); }}
              style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: '#8B7355', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
              {mode === 'signin' ? t.neu : t.have}
            </button>
          </>
        )}
      </div>

      {/* App availability — awareness only (no factory-side flow in the app yet) */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, width: '100%', maxWidth: 420 }}>
        <p style={{ fontSize: 12, color: '#8a7f70', margin: 0, textAlign: 'center', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.alsoOn}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <a href={APP_STORE_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', borderRadius: 8 }}>
            <AppStoreBadge />
          </a>
          <span style={{ display: 'inline-flex', alignItems: 'center', height: 44, boxSizing: 'border-box', padding: '0 14px', border: '1px solid #DAD3C7', borderRadius: 8, fontSize: 11.5, color: '#8a7f70', background: '#fff', textAlign: 'center', lineHeight: 1.3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {t.playSoon}
          </span>
        </div>
      </div>
    </div>
  );
}
