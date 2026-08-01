import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { sb } from '../supabase';
import { DISPLAY_CURRENCIES } from '../lib/displayCurrency';
import { CUSTOMIZATION_CHIPS, DELIVERY_TIMEFRAMES, REQUEST_UNITS, labelFor } from '../lib/requestFormOptions';

// Factory-facing request page (public, opened from the emailed link).
// Shows the buyer-stripped brief, lets the factory register phone-only, then
// submit ONE offer via the SECURITY DEFINER RPCs. Factory audience → en/zh only
// (not the buyer's app language). Placeholder styling (combined design pass later).
const C = {
  en: {
    heading: 'Quote request', from: 'via Maabar', details: 'Request details', factory: 'Factory', product: 'Product',
    specs: 'Specifications', qty: 'Quantity', customization: 'Customization', timeframe: 'Delivery timeframe', destination: 'Ship to', attachments: 'Attachments',
    respond: 'Respond to this request', haveAccount: 'Already registered? Sign in', newAccount: 'New factory? Register',
    phone: 'Phone (international, e.g. +8613800138000)', password: 'Password', company: 'Factory / company name',
    register: 'Register & continue', signin: 'Sign in & continue', working: 'Please wait…',
    offerTitle: 'Submit your offer', price: 'Unit price *', currency: 'Currency', delivery: 'Delivery (days)',
    moq: 'MOQ (min. order)', note: 'Note to Maabar (optional)', submit: 'Submit offer', submitting: 'Submitting…',
    doneT: 'Offer submitted', doneB: 'Thank you. The Maabar team will review your offer and get back to you.',
    expired: 'This link has expired.', already: 'An offer has already been submitted for this request.',
    notFound: 'Request not found.', privacy: 'Buyer contact details are shared only after the deal proceeds through Maabar.',
    errPrice: 'Please enter a valid unit price.',
    errPhone: 'Please enter a valid phone number in international format (e.g. +8613800138000).',
    errPassword: 'Please enter a password of at least 6 characters.',
    errExists: 'This phone number is already registered — switch to “Sign in”.',
    errCreds: 'Phone number or password is incorrect.',
    errNeedRegister: 'Please register before submitting an offer.',
    errExpired: 'This link has expired.',
    errClaimed: 'This request was already claimed by another account.',
    errAlreadyOffer: 'An offer has already been submitted for this request.',
    errAuth: 'Could not sign you in. Please check your details and try again.',
    errLoad: 'Could not load this request. Please try again.',
    errGeneric: 'Something went wrong. Please try again.',
  },
  zh: {
    heading: '报价请求', from: '来自 Maabar', details: '需求详情', factory: '工厂', product: '产品',
    specs: '规格', qty: '数量', customization: '定制', timeframe: '交付时间', destination: '收货地', attachments: '附件',
    respond: '回复此需求', haveAccount: '已注册？登录', newAccount: '新工厂？注册',
    phone: '电话（国际格式，如 +8613800138000）', password: '密码', company: '工厂／公司名称',
    register: '注册并继续', signin: '登录并继续', working: '请稍候…',
    offerTitle: '提交您的报价', price: '单价 *', currency: '货币', delivery: '交货（天）',
    moq: '起订量 (MOQ)', note: '给 Maabar 的备注（可选）', submit: '提交报价', submitting: '提交中…',
    doneT: '报价已提交', doneB: '谢谢。Maabar 团队将审核您的报价并与您联系。',
    expired: '此链接已过期。', already: '此需求已提交过报价。',
    notFound: '未找到需求。', privacy: '买家联系方式仅在交易通过 Maabar 推进后共享。',
    errPrice: '请输入有效的单价。',
    errPhone: '请输入有效的电话号码（国际格式，如 +8613800138000）。',
    errPassword: '请输入至少 6 位的密码。',
    errExists: '该电话号码已注册，请切换到“登录”。',
    errCreds: '电话号码或密码不正确。',
    errNeedRegister: '提交报价前请先注册。',
    errExpired: '此链接已过期。',
    errClaimed: '此需求已被其他账户认领。',
    errAlreadyOffer: '此需求已提交过报价。',
    errAuth: '无法登录，请检查信息后重试。',
    errLoad: '无法加载此需求，请重试。',
    errGeneric: '出错了，请重试。',
  },
};

// International phone sanity check (E.164-ish): leading +, 7–15 digits, no leading 0.
const isValidPhone = (v) => /^\+[1-9]\d{6,14}$/.test(String(v || '').trim());

export default function FactoryRequestView() {
  const { slug } = useParams();
  const [lang, setLang] = useState('en');
  const t = C[lang];

  // Map raw RPC/exception text to a friendly, localized message (never show raw).
  const mapRpc = (msg) => {
    const m = String(msg || '').toLowerCase();
    if (m.includes('expired')) return t.errExpired;
    if (m.includes('already claimed')) return t.errClaimed;
    if (m.includes('already been submitted')) return t.errAlreadyOffer;
    if (m.includes('valid price')) return t.errPrice;
    if (m.includes('register for this request')) return t.errNeedRegister;
    return t.errGeneric;
  };

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [invite, setInvite] = useState(null);      // { status, expired, factory_name, product_name, brief, + structured }
  const [attachUrls, setAttachUrls] = useState({}); // { path: signedUrl }
  const [phase, setPhase] = useState('brief');      // 'brief' | 'auth' | 'offer' | 'done'
  const [authMode, setAuthMode] = useState('register');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // auth fields
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  // offer fields
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('SAR');
  const [delivery, setDelivery] = useState('');
  const [moq, setMoq] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);
  async function load() {
    setLoading(true);
    setLoadError(false);
    const { data, error } = await sb.rpc('get_factory_invite', { p_slug: slug });
    if (error) { setLoadError(true); setLoading(false); return; }
    const row = Array.isArray(data) ? data[0] : data;
    setInvite(row || null);
    if (row) {
      setCompany(row.factory_name || '');
      if (row.status === 'registered') setPhase('offer'); // already registered → straight to offer
      if (row.status === 'offer_submitted') setPhase('done');
      // Mint short-lived signed URLs for attachments (private bucket, slug-gated).
      if (Array.isArray(row.attachment_paths) && row.attachment_paths.length) {
        sb.functions.invoke('factory-attachment-url', { body: { slug, paths: row.attachment_paths } })
          .then(({ data }) => { if (data?.urls) setAttachUrls(data.urls); })
          .catch(() => {});
      }
    }
    setLoading(false);
  }

  async function doRegister() {
    // Ensure the invite is linked to this (now authenticated) supplier.
    const { error: e } = await sb.rpc('register_factory_invite', { p_slug: slug });
    if (e) { setError(mapRpc(e.message)); return false; }
    return true;
  }

  async function handleAuth() {
    const ph = phone.trim();
    if (!isValidPhone(ph)) { setError(t.errPhone); return; }
    if (!password || password.length < 6) { setError(t.errPassword); return; }
    setBusy(true); setError('');
    try {
      let res;
      if (authMode === 'signin') {
        res = await sb.auth.signInWithPassword({ phone: ph, password });
      } else {
        res = await sb.auth.signUp({
          phone: ph, password,
          options: { data: { role: 'supplier', status: 'registered', company_name: company.trim() || (invite?.factory_name || ''), phone: ph, lang } },
        });
      }
      if (res.error || !res.data?.user) {
        setBusy(false);
        const em = String(res.error?.message || '').toLowerCase();
        if (authMode === 'register' && /already|registered|exists/.test(em)) setError(t.errExists);
        else if (authMode === 'signin') setError(t.errCreds);
        else if (em.includes('phone')) setError(t.errPhone);
        else setError(t.errAuth);
        return;
      }
      const ok = await doRegister();
      setBusy(false);
      if (ok) setPhase('offer');
    } catch {
      setBusy(false); setError(t.errAuth);
    }
  }

  // If already authenticated when they click "respond", skip the auth form.
  async function onRespond() {
    setError('');
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      setBusy(true);
      const ok = await doRegister();
      setBusy(false);
      if (ok) setPhase('offer');
    } else {
      setPhase('auth');
    }
  }

  async function handleSubmitOffer() {
    const p = parseFloat(price);
    if (!Number.isFinite(p) || p <= 0) { setError(t.errPrice); return; }
    setBusy(true); setError('');
    const { error: e } = await sb.rpc('submit_factory_offer', {
      p_slug: slug,
      p_price: p,
      p_currency: currency,
      p_delivery_days: delivery ? parseInt(delivery, 10) : null,
      p_moq: moq.trim() || null,
      p_note: note.trim() || null,
    });
    setBusy(false);
    if (e) { setError(mapRpc(e.message)); return; }
    setPhase('done');
  }

  const wrap = { maxWidth: 560, margin: '0 auto', padding: '32px 20px 60px' };
  const card = { background: 'var(--bg-subtle, #faf9f7)', border: '1px solid var(--border-muted, #e8e5de)', borderRadius: 14, padding: 24, marginBottom: 16 };
  const label = { display: 'block', fontSize: 12, color: 'var(--text-secondary, #6b6560)', marginBottom: 6 };
  const input = { width: '100%', padding: '10px 12px', border: '1px solid var(--border-muted, #e8e5de)', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', marginBottom: 12 };
  const btn = { background: '#1a1814', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 22px', fontSize: 14, cursor: 'pointer' };
  const link = { background: 'none', border: 'none', color: '#8B7355', fontSize: 12, cursor: 'pointer', textDecoration: 'underline', padding: 0 };

  // Structured specs (identity-safe fields the RPC returns) + attachments.
  const uLabel = (key) => { const u = REQUEST_UNITS.find((x) => x.key === key); return u ? labelFor(u, lang) : (key || ''); };
  const specsRows = invite ? [
    invite.quantity ? { k: t.qty, v: `${invite.quantity}${invite.unit ? ` ${uLabel(invite.unit)}` : ''}` } : null,
    (invite.customization_types && invite.customization_types.length)
      ? { k: t.customization, v: invite.customization_types.map((k) => { const c = CUSTOMIZATION_CHIPS.find((x) => x.key === k); return c ? labelFor(c, lang) : k; }).join(', ') } : null,
    invite.delivery_timeframe
      ? { k: t.timeframe, v: (() => { const d = DELIVERY_TIMEFRAMES.find((x) => x.key === invite.delivery_timeframe); return d ? labelFor(d, lang) : invite.delivery_timeframe; })() } : null,
    (invite.ship_city || invite.ship_country) ? { k: t.destination, v: [invite.ship_city, invite.ship_country].filter(Boolean).join(', ') } : null,
  ].filter(Boolean) : [];
  const attachments = invite && Array.isArray(invite.attachment_paths) ? invite.attachment_paths : [];
  const fileName = (p) => { const seg = decodeURIComponent(String(p).split('/').pop() || ''); const i = seg.indexOf('_'); return i >= 0 ? seg.slice(i + 1) : seg; };
  const isImg = (n) => /\.(jpe?g|png|webp|gif)$/i.test(n);

  return (
    <div style={{ background: '#f5f3ef', minHeight: '100dvh' }}>
      <div style={wrap}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <span style={{ fontSize: 18, fontWeight: 600, color: '#1a1814' }}>مَعبر · Maabar</span>
          <button style={link} onClick={() => setLang(lang === 'en' ? 'zh' : 'en')}>{lang === 'en' ? '中文' : 'EN'}</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>…</p>
        ) : loadError ? (
          <div style={card}><p>{t.errLoad}</p></div>
        ) : !invite ? (
          <div style={card}><p>{t.notFound}</p></div>
        ) : invite.expired ? (
          <div style={card}><p>{t.expired}</p></div>
        ) : (
          <>
            <div style={card}>
              <p style={{ fontSize: 12, color: '#b0ab9e', letterSpacing: 1, textTransform: 'uppercase', margin: '0 0 6px' }}>{t.heading} · {t.from}</p>
              <h1 style={{ fontSize: 20, color: '#1a1814', margin: '0 0 16px' }}>{invite.factory_name || 'Maabar'}</h1>
              <p style={{ ...label }}>{t.details}</p>
              {invite.product_name && <p style={{ fontSize: 14, color: '#1a1814', margin: '0 0 8px' }}><strong>{t.product}:</strong> {invite.product_name}</p>}
              <p style={{ fontSize: 14, color: '#3d3a35', lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{invite.brief || (invite.product_name || '')}</p>

              {specsRows.length > 0 && (
                <div style={{ marginTop: 16, borderTop: '1px solid #e8e5de', paddingTop: 14 }}>
                  <p style={{ ...label, marginBottom: 8 }}>{t.specs}</p>
                  {specsRows.map((r, i) => (
                    <p key={i} style={{ fontSize: 13.5, color: '#1a1814', margin: '0 0 6px' }}>
                      <span style={{ color: '#6b6560' }}>{r.k}:</span> {r.v}
                    </p>
                  ))}
                </div>
              )}

              {attachments.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <p style={{ ...label, marginBottom: 8 }}>{t.attachments} ({attachments.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {attachments.map((p, i) => {
                      const name = fileName(p); const url = attachUrls[p]; const img = isImg(name);
                      return (
                        <a key={i} href={url || undefined} target="_blank" rel="noreferrer" title={name}
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: img ? 72 : 'auto', height: 72, maxWidth: 200, padding: img ? 0 : '0 12px',
                            border: '1px solid #e8e5de', borderRadius: 8, overflow: 'hidden',
                            background: '#fff', textDecoration: 'none', color: '#3d3a35', fontSize: 12,
                            cursor: url ? 'pointer' : 'default', opacity: url ? 1 : 0.5,
                          }}>
                          {img && url
                            ? <img src={url} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              <p style={{ fontSize: 11.5, color: '#b0ab9e', marginTop: 16 }}>{t.privacy}</p>
            </div>

            {phase === 'done' || invite.status === 'offer_submitted' ? (
              <div style={card}>
                <h2 style={{ fontSize: 17, color: '#1a1814', margin: '0 0 8px' }}>{t.doneT}</h2>
                <p style={{ fontSize: 13, color: '#6b6560', lineHeight: 1.7, margin: 0 }}>{phase === 'done' ? t.doneB : t.already}</p>
              </div>
            ) : phase === 'brief' ? (
              <button style={btn} onClick={onRespond} disabled={busy}>{busy ? t.working : t.respond}</button>
            ) : phase === 'auth' ? (
              <div style={card}>
                <label style={label}>{t.company}</label>
                <input style={input} value={company} onChange={(e) => setCompany(e.target.value)} />
                <label style={label}>{t.phone}</label>
                <input style={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8613800138000" dir="ltr" />
                <label style={label}>{t.password}</label>
                <input style={input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} dir="ltr" />
                {!!error && <p style={{ color: '#a05050', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <button style={btn} onClick={handleAuth} disabled={busy}>{busy ? t.working : (authMode === 'signin' ? t.signin : t.register)}</button>
                  <button style={link} onClick={() => { setError(''); setAuthMode(authMode === 'signin' ? 'register' : 'signin'); }}>
                    {authMode === 'signin' ? t.newAccount : t.haveAccount}
                  </button>
                </div>
              </div>
            ) : phase === 'offer' ? (
              <div style={card}>
                <h2 style={{ fontSize: 17, color: '#1a1814', margin: '0 0 16px' }}>{t.offerTitle}</h2>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <label style={label}>{t.price}</label>
                    <input style={input} type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} dir="ltr" />
                  </div>
                  <div style={{ width: 100 }}>
                    <label style={label}>{t.currency}</label>
                    <select style={input} value={currency} onChange={(e) => setCurrency(e.target.value)}>
                      {DISPLAY_CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <label style={label}>{t.delivery}</label>
                <input style={input} type="number" min="0" value={delivery} onChange={(e) => setDelivery(e.target.value)} dir="ltr" />
                <label style={label}>{t.moq}</label>
                <input style={input} value={moq} onChange={(e) => setMoq(e.target.value)} />
                <label style={label}>{t.note}</label>
                <textarea style={{ ...input, minHeight: 80, resize: 'vertical' }} value={note} onChange={(e) => setNote(e.target.value)} />
                {!!error && <p style={{ color: '#a05050', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
                <button style={btn} onClick={handleSubmitOffer} disabled={busy}>{busy ? t.submitting : t.submit}</button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
