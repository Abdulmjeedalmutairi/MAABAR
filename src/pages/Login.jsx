import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

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
    alibaba: 'رابط Alibaba (اختياري)', regNum: 'رقم تسجيل الشركة (اختياري)',
    signin: 'تسجيل الدخول', signup: 'إنشاء حساب',
    toSignup: 'ما عندك حساب؟', toSignupLink: 'سجل الآن',
    toSignin: 'عندك حساب؟', toSigninLink: 'سجل دخولك',
    back: 'رجوع', buyerInfo: 'بياناتك', supInfo: 'بيانات الشركة',
    fillRequired: 'يرجى تعبئة الحقول الإجبارية',
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
    alibaba: 'Alibaba Link (optional)', regNum: 'Company Reg. No. (optional)',
    signin: 'Sign In', signup: 'Create Account',
    toSignup: "Don't have an account?", toSignupLink: 'Sign up',
    toSignin: 'Already have an account?', toSigninLink: 'Sign in',
    back: 'Back', buyerInfo: 'Your Details', supInfo: 'Company Details',
    fillRequired: 'Please fill required fields',
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
    alibaba: 'Alibaba链接（可选）', regNum: '公司注册号（可选）',
    signin: '登录', signup: '创建账户',
    toSignup: '没有账户？', toSignupLink: '立即注册',
    toSignin: '已有账户？', toSigninLink: '登录',
    back: '返回', buyerInfo: '您的信息', supInfo: '公司信息',
    fillRequired: '请填写必填项',
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

  const [mode, setMode]           = useState('signin');
  const [email, setEmail]         = useState('');
  const [pass, setPass]           = useState('');
  const [msg, setMsg]             = useState('');
  const [msgType, setMsgType]     = useState('');
  const [loading, setLoading]     = useState(false);

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
  const [alibaba, setAlibaba]       = useState('');
  const [regNum, setRegNum]         = useState('');

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
      ...(isSupplier && { company_name: supCompany, whatsapp, wechat, pay_method: payMethod, alibaba_url: alibaba, reg_number: regNum }),
    };
    await sb.from('profiles').insert(profileData);
    setUser(data.user);
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    if (profile) setProfile(profile);
    nav('/dashboard');
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
                <label style={labelStyle}>{l.whatsapp} *</label>
                <input style={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+966..." dir="ltr" />
              </div>
              <div style={{ ...fieldStyle, flex: 1 }}>
                <label style={labelStyle}>{l.wechat}</label>
                <input style={inputStyle} value={wechat} onChange={e => setWechat(e.target.value)} dir="ltr" />
              </div>
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
              <label style={labelStyle}>{l.alibaba}</label>
              <input style={inputStyle} value={alibaba} onChange={e => setAlibaba(e.target.value)} placeholder="https://..." dir="ltr" />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>{l.regNum}</label>
              <input style={inputStyle} value={regNum} onChange={e => setRegNum(e.target.value)} dir="ltr" />
            </div>
          </>
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
          marginTop: 28,
          borderRadius: 'var(--radius-md)',
          transition: 'all 0.2s',
          opacity: loading ? 0.5 : 1,
          letterSpacing: 0.3,
          minHeight: 48,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {loading ? '...' : mode === 'signin' ? l.signin : l.signup}
        </button>

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
      </div>
    </div>
  );
}