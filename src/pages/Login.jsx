import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

const CATEGORIES = {
  ar: [
    { val: 'electronics', label: 'إلكترونيات' },
    { val: 'furniture', label: 'أثاث' },
    { val: 'clothing', label: 'ملابس' },
    { val: 'building', label: 'مواد بناء' },
    { val: 'food', label: 'غذاء' },
    { val: 'other', label: 'أخرى' },
  ],
  en: [
    { val: 'electronics', label: 'Electronics' },
    { val: 'furniture', label: 'Furniture' },
    { val: 'clothing', label: 'Clothing' },
    { val: 'building', label: 'Building Materials' },
    { val: 'food', label: 'Food' },
    { val: 'other', label: 'Other' },
  ],
  zh: [
    { val: 'electronics', label: '电子产品' },
    { val: 'furniture', label: '家具' },
    { val: 'clothing', label: '服装' },
    { val: 'building', label: '建材' },
    { val: 'food', label: '食品' },
    { val: 'other', label: '其他' },
  ],
};

const L = {
  ar: {
    buyerTitle: 'أهلاً بك في مَعبر', buyerSub: 'تسوّق من موردين صينيين موثوقين',
    supplierTitle: 'انضم كمورد', supplierSub: 'ابدأ البيع للسوق السعودي',
    email: 'البريد الإلكتروني', pass: 'كلمة المرور',
    firstName: 'الاسم الأول', lastName: 'الاسم الأخير',
    phone: 'رقم الجوال', city: 'المدينة',
    companyName: 'اسم الشركة / النشاط (اختياري)',
    supCompany: 'اسم الشركة', whatsapp: 'واتساب', wechat: 'WeChat (اختياري)',
    payMethod: 'طريقة استلام المدفوعات', alipay: 'Alipay', swift: 'تحويل بنكي (SWIFT)',
    tradeLink: 'رابط صفحتك التجارية (اختياري)', regNum: 'رقم تسجيل الشركة (اختياري)',
    country: 'الدولة', supCity: 'المدينة',
    speciality: 'التخصص',
    signin: 'تسجيل الدخول', signup: 'إنشاء حساب',
    toSignup: 'ما عندك حساب؟', toSignupLink: 'سجل الآن',
    toSignin: 'عندك حساب؟', toSigninLink: 'سجل دخولك',
    back: 'رجوع', buyerInfo: 'بياناتك', supInfo: 'بيانات الشركة',
    fillRequired: 'يرجى تعبئة الحقول الإجبارية',
    termsLabel: 'أوافق على ',
    termsLink: 'الشروط والأحكام',
    mustAgreeTerms: 'يجب الموافقة على الشروط والأحكام',
    pendingMsg: 'طلبك قيد المراجعة — نتواصل معك خلال 3-5 أيام عمل',
    googleLogin: 'دخول بـ Google',
    cities: ['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','القصيم','حائل','جازان','نجران'],
  },
  en: {
    buyerTitle: 'Welcome to Maabar', buyerSub: 'Shop from verified Chinese suppliers',
    supplierTitle: 'Join as Supplier', supplierSub: 'Start selling to the Saudi market',
    email: 'Email', pass: 'Password',
    firstName: 'First Name', lastName: 'Last Name',
    phone: 'Phone', city: 'City',
    companyName: 'Company / Business (optional)',
    supCompany: 'Company Name', whatsapp: 'WhatsApp', wechat: 'WeChat (optional)',
    payMethod: 'Payment Method', alipay: 'Alipay', swift: 'Bank Transfer (SWIFT)',
    tradeLink: 'Business Profile Link (optional)', regNum: 'Company Reg. No. (optional)',
    country: 'Country', supCity: 'City',
    speciality: 'Specialty',
    signin: 'Sign In', signup: 'Create Account',
    toSignup: "Don't have an account?", toSignupLink: 'Sign up',
    toSignin: 'Already have an account?', toSigninLink: 'Sign in',
    back: 'Back', buyerInfo: 'Your Details', supInfo: 'Company Details',
    fillRequired: 'Please fill required fields',
    termsLabel: 'I agree to ',
    termsLink: 'Terms & Conditions',
    mustAgreeTerms: 'You must agree to the Terms & Conditions',
    pendingMsg: 'Your request is under review — we will contact you within 3-5 business days',
    googleLogin: 'Continue with Google',
    cities: ['Riyadh','Jeddah','Mecca','Medina','Dammam','Khobar','Tabuk','Abha','Qassim','Hail','Jazan','Najran'],
  },
  zh: {
    buyerTitle: '欢迎来到Maabar', buyerSub: '从认证中国供应商采购',
    supplierTitle: '加入成为供应商', supplierSub: '开始向沙特市场销售',
    email: '电子邮件', pass: '密码',
    firstName: '名', lastName: '姓',
    phone: '电话', city: '城市',
    companyName: '公司/商业名称（可选）',
    supCompany: '公司名称', whatsapp: 'WhatsApp', wechat: 'WeChat（可选）',
    payMethod: '收款方式', alipay: 'Alipay', swift: '银行转账 (SWIFT)',
    tradeLink: '商业主页链接（可选）', regNum: '公司注册号（可选）',
    country: '国家', supCity: '城市',
    speciality: '专业领域',
    signin: '登录', signup: '创建账户',
    toSignup: '没有账户？', toSignupLink: '立即注册',
    toSignin: '已有账户？', toSigninLink: '登录',
    back: '返回', buyerInfo: '您的信息', supInfo: '公司信息',
    fillRequired: '请填写必填项',
    termsLabel: '我同意',
    termsLink: '条款与条件',
    mustAgreeTerms: '您必须同意条款与条件',
    pendingMsg: '您的申请正在审核中 — 我们将在3-5个工作日内与您联系',
    googleLogin: '使用Google登录',
    cities: ['利雅得','吉达','麦加','麦地那','达曼','霍拜尔','塔布克','艾卜哈','盖西姆','哈伊勒','吉赞','纳季兰'],
  },
};

export default function Login({ setUser, setProfile, lang }) {
  const nav = useNavigate();
  const { role: roleParam } = useParams();
  const role       = roleParam === 'supplier' ? 'supplier' : 'buyer';
  const isSupplier = role === 'supplier';
  const isAr       = lang === 'ar';
  const l          = L[lang] || L.ar;
  const cats       = CATEGORIES[lang] || CATEGORIES.ar;

  const [mode, setMode]           = useState('signin');
  const [email, setEmail]         = useState('');
  const [pass, setPass]           = useState('');
  const [msg, setMsg]             = useState('');
  const [msgType, setMsgType]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Buyer fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [city, setCity]           = useState('');
  const [companyName, setCompanyName] = useState('');

  // Supplier fields
  const [supCompany, setSupCompany] = useState('');
  const [whatsapp, setWhatsapp]     = useState('');
  const [wechat, setWechat]         = useState('');
  const [payMethod, setPayMethod]   = useState('');
  const [tradeLink, setTradeLink]   = useState('');
  const [regNum, setRegNum]         = useState('');
  const [country, setCountry]       = useState('');
  const [supCity, setSupCity]       = useState('');
  const [speciality, setSpeciality] = useState('');

  const doSignIn = async () => {
    if (!email || !pass) { setMsg(l.fillRequired); setMsgType('error'); return; }
    setLoading(true);
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) { setMsg(error.message); setMsgType('error'); return; }
    setUser(data.user);
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    if (profile) setProfile(profile);
    nav('/dashboard');
  };

  const doSignUp = async () => {
    if (!email || !pass) { setMsg(l.fillRequired); setMsgType('error'); return; }
    if (mode === 'signup' && !agreedTerms) { setMsg(l.mustAgreeTerms); setMsgType('error'); return; }
    if (!isSupplier && (!firstName || !lastName || !phone || !city)) { setMsg(l.fillRequired); setMsgType('error'); return; }
    if (isSupplier && (!supCompany || (!whatsapp && !wechat) || !payMethod)) { setMsg(l.fillRequired); setMsgType('error'); return; }
    setLoading(true);
    const { data, error } = await sb.auth.signUp({ email, password: pass });
    setLoading(false);
    if (error) { setMsg(error.message); setMsgType('error'); return; }
    const profileData = {
      id: data.user.id, role,
      status: isSupplier ? 'pending' : 'active',
      ...(!isSupplier && { full_name: `${firstName} ${lastName}`, phone, city, company_name: companyName }),
      ...(isSupplier && { company_name: supCompany, whatsapp, wechat, pay_method: payMethod, trade_link: tradeLink, reg_number: regNum, country, city: supCity, speciality }),
    };
    await sb.from('profiles').insert(profileData);
    if (isSupplier) {
      setMsg(l.pendingMsg);
      setMsgType('success');
      return;
    }
    setUser(data.user);
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    if (profile) setProfile(profile);
    nav('/dashboard');
  };

  const doGoogleLogin = async () => {
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/dashboard' }
    });
  };

  /* ─── Shared input style ─── */
  const inputStyle = {
    width: '100%',
    padding: '10px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border-default)',
    fontSize: 14,
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
  };

  const labelStyle = {
    display: 'block',
    fontSize: 11,
    letterSpacing: 1,
    color: 'var(--text-disabled)',
    marginBottom: 6,
    fontWeight: 500,
    textTransform: 'uppercase',
    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
  };

  const fieldStyle = { marginBottom: 20 };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '80px 24px 60px',
      background: 'var(--bg-base)',
      position: 'relative',
    }}>

      {/* Subtle grid */}
      <div style={{
        position: 'fixed', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        pointerEvents: 'none', zIndex: 0,
      }} />

      {/* Back button */}
      <button onClick={() => nav(-1)} style={{
        position: 'fixed', top: 72, right: 24, zIndex: 10,
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-subtle)',
        color: 'var(--text-tertiary)',
        padding: '7px 16px', borderRadius: 'var(--radius-md)',
        fontSize: 12, cursor: 'pointer',
        transition: 'all 0.15s', letterSpacing: 0.5,
      }}
        onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-muted)'; }}
        onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
        {isAr ? `→ ${l.back}` : `← ${l.back}`}
      </button>

      {/* Form */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
          letterSpacing: 2.5, color: 'var(--text-disabled)', marginBottom: 40,
        }}>
          MAABAR <span style={{ fontFamily: 'var(--font-ar)', fontSize: 12, fontWeight: 400, opacity: 0.7 }}>| مَعبر</span>
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: isAr ? 28 : 32,
          fontWeight: 300,
          color: 'var(--text-primary)',
          marginBottom: 8, lineHeight: 1.2,
          letterSpacing: isAr ? 0 : -0.5,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {isSupplier ? l.supplierTitle : l.buyerTitle}
        </h1>
        <p style={{
          fontSize: 14, color: 'var(--text-disabled)',
          marginBottom: 40, fontWeight: 300, lineHeight: 1.6,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {isSupplier ? l.supplierSub : l.buyerSub}
        </p>

        {/* Message */}
        {msg && (
          <div style={{
            fontSize: 13, marginBottom: 20,
            padding: '10px 14px', borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            ...(msgType === 'error'
              ? { background: 'rgba(138,58,58,0.12)', color: '#a07070', border: '1px solid rgba(138,58,58,0.2)' }
              : { background: 'rgba(58,122,82,0.12)', color: '#5a9a72', border: '1px solid rgba(58,122,82,0.2)' }),
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          }}>
            {msg}
          </div>
        )}

        {/* If supplier pending — stop here */}
        {isSupplier && msg && msgType === 'success' ? null : (
          <>
            {/* Email */}
            <div style={fieldStyle}>
              <label style={labelStyle}>{l.email}</label>
              <input style={inputStyle} type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                autoComplete="email" dir="ltr"
              />
            </div>

            {/* Password */}
            <div style={fieldStyle}>
              <label style={labelStyle}>{l.pass}</label>
              <input style={inputStyle} type="password" value={pass}
                onChange={e => setPass(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password" dir="ltr"
              />
            </div>

            {/* ── Buyer signup fields ── */}
            {!isSupplier && mode === 'signup' && (
              <>
                <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16, marginTop: 8, fontWeight: 500 }}>
                  {l.buyerInfo}
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.firstName} *</label>
                    <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={isAr ? 'محمد' : 'John'} />
                  </div>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.lastName} *</label>
                    <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder={isAr ? 'العمري' : 'Smith'} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.phone} *</label>
                    <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966 5x xxx xxxx" dir="ltr" />
                  </div>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.city} *</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }} value={city} onChange={e => setCity(e.target.value)}>
                      <option value="">{isAr ? 'اختر مدينة' : 'Select city'}</option>
                      {l.cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.companyName}</label>
                  <input style={inputStyle} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={isAr ? 'اختياري' : 'Optional'} />
                </div>
              </>
            )}

            {/* ── Supplier signup fields ── */}
            {isSupplier && mode === 'signup' && (
              <>
                <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16, marginTop: 8, fontWeight: 500 }}>
                  {l.supInfo}
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.supCompany} *</label>
                  <input style={inputStyle} value={supCompany} onChange={e => setSupCompany(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.country}</label>
                    <input style={inputStyle} value={country} onChange={e => setCountry(e.target.value)} placeholder={isAr ? 'الصين' : 'China'} />
                  </div>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.supCity}</label>
                    <input style={inputStyle} value={supCity} onChange={e => setSupCity(e.target.value)} placeholder={isAr ? 'قوانغتشو' : 'Guangzhou'} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.whatsapp} *</label>
                    <input style={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+..." dir="ltr" />
                  </div>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.wechat}</label>
                    <input style={inputStyle} value={wechat} onChange={e => setWechat(e.target.value)} dir="ltr" />
                  </div>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.speciality} *</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={speciality} onChange={e => setSpeciality(e.target.value)}>
                    <option value="">{isAr ? 'اختر تخصصك' : lang === 'zh' ? '选择专业' : 'Select specialty'}</option>
                    {cats.map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.payMethod} *</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {['alipay', 'swift'].map(m => (
                      <button key={m} onClick={() => setPayMethod(m)} style={{
                        flex: 1, padding: '10px',
                        background: payMethod === m ? 'var(--bg-raised)' : 'transparent',
                        border: '1px solid',
                        borderColor: payMethod === m ? 'var(--border-strong)' : 'var(--border-subtle)',
                        color: payMethod === m ? 'var(--text-primary)' : 'var(--text-disabled)',
                        fontSize: 12, cursor: 'pointer',
                        borderRadius: 'var(--radius-md)', transition: 'all 0.15s',
                        minHeight: 40,
                        fontFamily: 'var(--font-sans)',
                      }}>
                        {m === 'alipay' ? l.alipay : l.swift}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.tradeLink}</label>
                  <input style={inputStyle} value={tradeLink} onChange={e => setTradeLink(e.target.value)} placeholder="https://..." dir="ltr" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.regNum}</label>
                  <input style={inputStyle} value={regNum} onChange={e => setRegNum(e.target.value)} dir="ltr" />
                </div>
              </>
            )}

            {/* Terms checkbox — both roles on signup */}
            {mode === 'signup' && (
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <input
                  type="checkbox"
                  id="terms-cb"
                  checked={agreedTerms}
                  onChange={e => setAgreedTerms(e.target.checked)}
                  style={{ marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0 }}
                />
                <label htmlFor="terms-cb" style={{
                  fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  lineHeight: 1.5,
                }}>
                  {l.termsLabel}
                  <a href="/terms" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>
                    {l.termsLink}
                  </a>
                </label>
              </div>
            )}

            {/* Submit */}
            <button onClick={mode === 'signin' ? doSignIn : doSignUp} disabled={loading} style={{
              width: '100%',
              background: 'rgba(255,255,255,0.88)',
              color: '#0a0a0b',
              border: 'none',
              padding: '14px',
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: 8,
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.2s',
              opacity: loading ? 0.5 : 1,
              letterSpacing: 0.3,
              minHeight: 48,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {loading ? '...' : mode === 'signin' ? l.signin : l.signup}
            </button>

            {/* Google Login — buyer only */}
            {!isSupplier && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                  <span style={{ fontSize: 11, color: 'var(--text-disabled)', letterSpacing: 1 }}>
                    {isAr ? 'أو' : 'OR'}
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                </div>
                <button onClick={doGoogleLogin} style={{
                  width: '100%',
                  background: 'var(--bg-raised)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-default)',
                  padding: '12px',
                  fontSize: 13,
                  cursor: 'pointer',
                  borderRadius: 'var(--radius-md)',
                  transition: 'all 0.2s',
                  minHeight: 44,
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  {l.googleLogin}
                </button>
              </>
            )}

            {/* Switch mode */}
            <p style={{
              textAlign: 'center', marginTop: 24,
              fontSize: 13, color: 'var(--text-disabled)',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {mode === 'signin' ? l.toSignup : l.toSignin}{' '}
              <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMsg(''); }} style={{
                color: 'var(--text-secondary)',
                fontWeight: 500,
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                textDecoration: 'underline',
                fontSize: 13,
                transition: 'color 0.15s',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                {mode === 'signin' ? l.toSignupLink : l.toSigninLink}
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
