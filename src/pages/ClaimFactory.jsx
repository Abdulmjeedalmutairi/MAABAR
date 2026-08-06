import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';
import { getFactoryClaimPreview, claimFactoryBySlug } from '../lib/factoryClaim';

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');

const T = {
  en: {
    tagline: 'China → Saudi Arabia sourcing platform',
    welcome: 'Welcome — your factory page is ready on MAABAR',
    verified: 'Verified', preparedBy: 'Prepared for you by the MAABAR team',
    products: 'Products', catalogs: 'Catalogs', categories: 'Categories', export: 'Export',
    activityTitle: 'You have new activity waiting',
    newMsgs: (n) => `${n} new ${n === 1 ? 'message' : 'messages'} from Saudi traders`,
    quoteReq: 'New quote request', qty: 'Qty',
    noActivity: 'Start receiving quote requests from Saudi buyers.',
    ctaTitle: 'Sign in to reply to buyers and manage your page',
    ctaSub: 'Your page is already prepared for you — just verify it’s you. Under a minute.',
    google: 'Continue with Google', email: 'Continue with Email',
    claim: 'Confirm ownership & start', enter: 'Enter your dashboard',
    haveAccount: 'Already have an account? Sign in', skip: 'Skip — view public page',
    claimedOther: 'This factory has already been claimed by another account. Contact support if this is you.',
    emailPh: 'Email', passPh: 'Password (min 6 chars)', create: 'Create account & claim',
    checkEmail: 'Check your email to confirm, then reopen this link.', working: 'Working…', loading: 'Loading…',
    notfound: 'This claim link is not valid.',
  },
  zh: {
    tagline: '中国 → 沙特采购平台',
    welcome: '欢迎 — 您的工厂主页已在 MAABAR 准备就绪',
    verified: '已认证', preparedBy: '由 MAABAR 团队为您准备',
    products: '产品', catalogs: '目录', categories: '类别', export: '出口',
    activityTitle: '有新的动态等待您',
    newMsgs: (n) => `${n} 条来自沙特贸易商的新消息`,
    quoteReq: '新报价请求', qty: '数量',
    noActivity: '开始接收来自沙特买家的报价请求。',
    ctaTitle: '登录即可回复买家并管理您的主页',
    ctaSub: '您的主页已为您准备好 — 只需验证身份，不到一分钟。',
    google: '使用 Google 继续', email: '使用邮箱继续',
    claim: '确认所有权并开始', enter: '进入您的后台',
    haveAccount: '已有账户？登录', skip: '跳过 — 查看公开页面',
    claimedOther: '该工厂已被其他账户认领。如果这是您，请联系客服。',
    emailPh: '邮箱', passPh: '密码（至少 6 位）', create: '创建账户并认领',
    checkEmail: '请查收邮件确认，然后重新打开此链接。', working: '处理中…', loading: '加载中…',
    notfound: '此认领链接无效。',
  },
};

export default function ClaimFactory() {
  const { slug } = useParams();
  const nav = useNavigate();
  const [lang, setLang] = useState('en');
  const [pre, setPre] = useState(undefined);   // undefined=loading, null=notfound
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [emailMode, setEmailMode] = useState(false);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const t = T[lang];

  useEffect(() => {
    getFactoryClaimPreview(slug).then((d) => setPre(d)).catch(() => setPre(null));
    sb.auth.getSession().then(({ data }) => setUser(data?.session?.user || null));
  }, [slug]);

  const doGoogle = async () => {
    setErr('');
    await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
  };
  const doEmail = async () => {
    setErr(''); setMsg('');
    if (!email.trim() || pass.length < 6) { setErr(t.passPh); return; }
    setBusy(true);
    try {
      const { data, error } = await sb.auth.signUp({ email: email.trim(), password: pass, options: { emailRedirectTo: window.location.href } });
      if (error) throw error;
      if (data?.session) { setUser(data.session.user); await doClaim(); }
      else setMsg(t.checkEmail);
    } catch (e) { setErr(e.message || 'sign up failed'); }
    setBusy(false);
  };
  const doClaim = async () => {
    setErr(''); setBusy(true);
    try { await claimFactoryBySlug(slug); nav('/dashboard'); }
    catch (e) { setErr(e.message || 'claim failed'); setBusy(false); }
  };

  const shell = (children) => (
    <div className="cf-root" dir="ltr">
      <style>{CSS}</style>
      <div className="cf-top">
        <div className="cf-wordmark">MAABAR <span>مَعبر</span></div>
        <div className="cf-langs">
          <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
          <button className={lang === 'zh' ? 'on' : ''} onClick={() => setLang('zh')}>中文</button>
        </div>
      </div>
      <p className="cf-tagline">{t.tagline}</p>
      {children}
      <p className="cf-foot">MAABAR — your bridge to Saudi buyers · © 2026</p>
    </div>
  );

  if (pre === undefined) return shell(<p className="cf-center">{t.loading}</p>);
  if (pre === null) return shell(<p className="cf-center">{t.notfound}</p>);

  const name = nf(pre.company_name_latin) || nf(pre.company_name) || 'Factory';
  const secondary = nf(pre.company_name) && pre.company_name !== name ? pre.company_name : '';
  const cover = (Array.isArray(pre.factory_images) && pre.factory_images[0]) || pre.profile_image || null;
  // Supplier-facing: English (default) or Chinese only — never the Arabic description.
  const desc = lang === 'zh'
    ? (nf(pre.description_zh) || nf(pre.description_en))
    : (nf(pre.description_en) || nf(pre.description_zh));
  const claimedOther = pre.already_claimed && !pre.is_owner;

  const stats = [
    { n: pre.product_count, l: t.products },
    { n: pre.catalog_count, l: t.catalogs },
    ...(pre.section_count > 0 ? [{ n: pre.section_count, l: t.categories }] : []),
    ...(nf(pre.export_markets) ? [{ n: nf(pre.export_markets), l: t.export }] : []),
  ].slice(0, 4);

  return shell(
    <>
      <div className="cf-hero-head">
        <h1 className="cf-welcome">👋 {t.welcome}</h1>
        <h2 className="cf-name">{name}</h2>
        {secondary && <p className="cf-name2">{secondary}</p>}
        <div className="cf-pills">
          {(nf(pre.city) || nf(pre.country)) && <span className="cf-pill">📍 {[nf(pre.city), nf(pre.country)].filter(Boolean).join(', ')}</span>}
          {pre.is_verified && <span className="cf-pill ok">✔ {t.verified}</span>}
        </div>
      </div>

      <div className="cf-hero">
        <div className="cf-hero-img" style={cover ? { backgroundImage: `url(${cover})` } : {}} />
        <div className="cf-stats">
          {stats.map((s, i) => (<div className="cf-stat" key={i}><div className="cf-stat-n">{s.n}</div><div className="cf-stat-l">{s.l}</div></div>))}
        </div>
      </div>
      <p className="cf-prepared">🏭 {t.preparedBy}</p>

      {desc && <p className="cf-desc">{desc}</p>}

      {(pre.unread_message_count > 0 || pre.pending_request_count > 0) ? (
        <>
          <p className="cf-activity-title">⚡ {t.activityTitle}</p>
          <div className="cf-activity">
            {pre.unread_message_count > 0 && <div className="cf-act"><span className="cf-act-ic">📩</span><div><div className="cf-act-t">{t.newMsgs(pre.unread_message_count)}</div></div></div>}
            {pre.pending_request_count > 0 && <div className="cf-act"><span className="cf-act-ic">📄</span><div><div className="cf-act-t">{t.quoteReq}</div><div className="cf-act-s">{nf(pre.latest_request_name)}{pre.latest_request_qty ? ` · ${t.qty} ${pre.latest_request_qty}` : ''}</div></div></div>}
          </div>
        </>
      ) : null}

      <div className="cf-cta">
        {claimedOther ? (
          <p className="cf-claimed">{t.claimedOther}</p>
        ) : pre.is_owner ? (
          <button className="cf-btn cf-primary" onClick={() => nav('/dashboard')}>{t.enter}</button>
        ) : user ? (
          <>
            <div className="cf-lock">{t.ctaTitle}</div>
            <p className="cf-cta-sub">{t.ctaSub}</p>
            <button className="cf-btn cf-primary" onClick={doClaim} disabled={busy}>{busy ? t.working : t.claim}</button>
          </>
        ) : (
          <>
            <div className="cf-lock">{t.ctaTitle}</div>
            <p className="cf-cta-sub">{t.ctaSub}</p>
            {!emailMode ? (
              <>
                <button className="cf-btn" onClick={doGoogle}><span className="cf-g">G</span>{t.google}</button>
                <button className="cf-btn" onClick={() => setEmailMode(true)}>✉ {t.email}</button>
              </>
            ) : (
              <div className="cf-form">
                <input className="cf-input" type="email" placeholder={t.emailPh} value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className="cf-input" type="password" placeholder={t.passPh} value={pass} onChange={(e) => setPass(e.target.value)} />
                <button className="cf-btn cf-primary" onClick={doEmail} disabled={busy}>{busy ? t.working : t.create}</button>
                {msg && <p className="cf-msg">{msg}</p>}
              </div>
            )}
          </>
        )}
        {err && <p className="cf-err">{err}</p>}
        {!pre.is_owner && !claimedOther && <button className="cf-ghost" onClick={() => nav('/login')}>{t.haveAccount}</button>}
        <button className="cf-ghost" onClick={() => nav(`/factory/${pre.factory_id}`)}>{t.skip}</button>
      </div>
    </>
  );
}

const CSS = `
.cf-root { min-height:100dvh; background:#FAF8F5; color:#1A1814; max-width:560px; margin:0 auto; padding:22px 20px 40px; font-family:var(--font-sans),system-ui,sans-serif; }
.cf-top { display:flex; align-items:center; justify-content:space-between; }
.cf-wordmark { font-weight:600; letter-spacing:.2em; font-size:15px; }
.cf-wordmark span { font-family:var(--font-ar); letter-spacing:0; color:#8a8578; margin-inline-start:6px; }
.cf-langs { display:flex; gap:4px; }
.cf-langs button { background:#fff; border:1px solid #ECE7DF; border-radius:99px; padding:4px 11px; font-size:12px; font-weight:600; color:#6E6A62; cursor:pointer; }
.cf-langs button.on { background:#1A1814; color:#fff; border-color:#1A1814; }
.cf-tagline { text-align:center; color:#9C978D; font-size:11.5px; letter-spacing:.04em; margin:6px 0 22px; }
.cf-center { text-align:center; padding:60px 0; color:#6E6A62; }
.cf-welcome { text-align:center; font-size:15px; font-weight:600; color:#6E6A62; margin:0 0 8px; }
.cf-name { text-align:center; font-size:28px; font-weight:800; margin:0; letter-spacing:-.01em; }
.cf-name2 { text-align:center; font-size:13px; color:#9C978D; margin:3px 0 0; }
.cf-pills { display:flex; gap:7px; justify-content:center; flex-wrap:wrap; margin-top:12px; }
.cf-pill { background:#fff; border:1px solid #ECE7DF; border-radius:99px; padding:5px 12px; font-size:12px; color:#6E6A62; font-weight:600; }
.cf-pill.ok { color:#2D6A4F; border-color:rgba(45,106,79,.25); background:rgba(45,106,79,.07); }
.cf-hero { display:grid; grid-template-columns:1.3fr 1fr; gap:0; margin-top:20px; background:#fff; border:1px solid #ECE7DF; border-radius:18px; overflow:hidden; box-shadow:0 8px 28px rgba(26,24,20,.05); }
.cf-hero-img { background:#F0EBE3 center/cover no-repeat; min-height:170px; }
.cf-stats { display:grid; grid-template-columns:1fr 1fr; }
.cf-stat { padding:16px; text-align:center; border-inline-start:1px solid #ECE7DF; border-bottom:1px solid #ECE7DF; }
.cf-stat:nth-child(2n){ }
.cf-stat-n { font-size:22px; font-weight:800; }
.cf-stat-l { font-size:11px; color:#9C978D; font-weight:600; margin-top:2px; }
.cf-prepared { text-align:center; font-size:11.5px; color:#9C978D; margin:10px 0 0; }
.cf-desc { text-align:center; font-size:13.5px; color:#6E6A62; line-height:1.6; margin:18px 0 0; }
.cf-activity-title { font-size:13px; font-weight:700; margin:26px 0 10px; }
.cf-activity { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
.cf-act { display:flex; gap:10px; background:#fff; border:1px solid #ECE7DF; border-radius:14px; padding:13px; box-shadow:0 1px 2px rgba(26,24,20,.04); }
.cf-act-ic { font-size:18px; }
.cf-act-t { font-size:12.5px; font-weight:600; }
.cf-act-s { font-size:11.5px; color:#9C978D; margin-top:2px; }
.cf-cta { margin-top:26px; background:#fff; border:1px solid #ECE7DF; border-radius:18px; padding:22px; text-align:center; box-shadow:0 8px 28px rgba(26,24,20,.05); }
.cf-lock { font-size:15px; font-weight:700; }
.cf-cta-sub { font-size:12.5px; color:#9C978D; margin:6px 0 16px; }
.cf-btn { display:flex; align-items:center; justify-content:center; gap:9px; width:100%; height:46px; border-radius:12px; border:1px solid #DED8CE; background:#fff; color:#1A1814; font-size:14px; font-weight:600; cursor:pointer; margin-bottom:10px; font-family:inherit; }
.cf-btn:hover { background:#F4F1EC; }
.cf-primary { background:#1A1814; color:#fff; border-color:#1A1814; }
.cf-primary:hover { opacity:.9; background:#1A1814; }
.cf-btn:disabled { opacity:.55; cursor:default; }
.cf-g { width:20px; height:20px; border-radius:50%; background:#fff; color:#4285F4; border:1px solid #DED8CE; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:12px; }
.cf-form { display:flex; flex-direction:column; }
.cf-input { height:44px; border:1px solid #DED8CE; border-radius:11px; padding:0 14px; font-size:14px; margin-bottom:10px; outline:none; font-family:inherit; }
.cf-input:focus { border-color:#1A1814; }
.cf-ghost { background:none; border:none; color:#9C978D; font-size:12.5px; cursor:pointer; display:block; margin:8px auto 0; font-family:inherit; }
.cf-ghost:hover { color:#1A1814; text-decoration:underline; }
.cf-err { color:#A04747; font-size:12.5px; margin:8px 0 0; }
.cf-msg { color:#2D6A4F; font-size:12.5px; margin:6px 0 0; }
.cf-claimed { color:#B0740F; font-size:13.5px; line-height:1.6; }
.cf-foot { text-align:center; font-size:11px; color:#B8B3A8; margin-top:30px; }
@media (max-width:520px){ .cf-hero{ grid-template-columns:1fr; } .cf-hero-img{ min-height:150px; } .cf-activity{ grid-template-columns:1fr; } }
`;
