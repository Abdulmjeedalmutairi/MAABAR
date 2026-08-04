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
  },
};
const isValidPhone = (v) => /^\+[1-9]\d{6,14}$/.test(String(v || '').trim());

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

  const wrap = { minHeight: 'var(--app-dvh,100vh)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, background: 'var(--bg-page,#FAF9F7)' };
  const card = { width: '100%', maxWidth: 420, background: '#fff', border: '1px solid #E8E3DA', borderRadius: 16, padding: '28px 26px', boxShadow: '0 10px 40px rgba(26,24,20,0.08)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const inp = { width: '100%', boxSizing: 'border-box', padding: '11px 13px', border: '1px solid #DAD3C7', borderRadius: 9, fontSize: 14, marginBottom: 10, fontFamily: 'inherit' };
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
    </div>
  );
}
