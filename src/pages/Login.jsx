import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

export default function Login({ setUser, setProfile, lang }) {
  const nav = useNavigate();
  const { role: roleParam } = useParams();
  const role = roleParam === 'supplier' ? 'supplier' : 'buyer';
  const isSupplier = role === 'supplier';

  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [loading, setLoading] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [supCompany, setSupCompany] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [wechat, setWechat] = useState('');
  const [payMethod, setPayMethod] = useState('');
  const [alibaba, setAlibaba] = useState('');
  const [regNum, setRegNum] = useState('');

  const isAr = lang === 'ar';

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
    }
  };

  const l = L[lang] || L.ar;

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
      ...(isSupplier && { company_name: supCompany, whatsapp, wechat, pay_method: payMethod, alibaba_url: alibaba, reg_number: regNum })
    };
    await sb.from('profiles').insert(profileData);
    setUser(data.user);
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    if (profile) setProfile(profile);
    nav('/dashboard');
  };

  return (
    <div style={s.wrap}>
      {/* خلفية الصورة */}
      <div style={s.bg} />
      <div style={s.overlay} />

      {/* زر رجوع */}
      <button style={s.backBtn} onClick={() => nav(-1)}>
        {isAr ? `→ ${l.back}` : `← ${l.back}`}
      </button>

      {/* الفورم — بدون بوكس، يجلس مباشرة على الصفحة */}
      <div style={s.form}>

        {/* اللوقو */}
        <div style={s.logo}>MAABAR <span style={s.logoAr}>| مَعبر</span></div>

        {/* العنوان الكبير — Faire style */}
        <h1 style={s.title}>{isSupplier ? l.supplierTitle : l.buyerTitle}</h1>
        <p style={s.sub}>{isSupplier ? l.supplierSub : l.buyerSub}</p>

        {msg && <div style={{ ...s.msg, ...(msgType === 'error' ? s.msgErr : s.msgOk) }}>{msg}</div>}

        {/* حقل الإيميل */}
        <div style={s.field}>
          <label style={s.label}>{l.email}</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" autoComplete="email" />
        </div>

        {/* حقل الباسوورد */}
        <div style={s.field}>
          <label style={s.label}>{l.pass}</label>
          <input style={s.input} type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
        </div>

        {/* حقول التاجر */}
        {!isSupplier && mode === 'signup' && (
          <>
            <div style={s.sectionLabel}>{l.buyerInfo}</div>
            <div style={s.row}>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>{l.firstName} *</label>
                <input style={s.input} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder={isAr ? 'محمد' : 'John'} />
              </div>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>{l.lastName} *</label>
                <input style={s.input} value={lastName} onChange={e => setLastName(e.target.value)} placeholder={isAr ? 'العمري' : 'Smith'} />
              </div>
            </div>
            <div style={s.row}>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>{l.phone} *</label>
                <input style={s.input} value={phone} onChange={e => setPhone(e.target.value)} placeholder="+966 5x xxx xxxx" />
              </div>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>{l.city} *</label>
                <select style={s.input} value={city} onChange={e => setCity(e.target.value)}>
                  <option value="">{isAr ? 'اختر مدينة' : 'Select city'}</option>
                  {l.cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>{l.companyName}</label>
              <input style={s.input} value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder={isAr ? 'اختياري' : 'Optional'} />
            </div>
          </>
        )}

        {/* حقول المورد */}
        {isSupplier && mode === 'signup' && (
          <>
            <div style={s.sectionLabel}>{l.supInfo}</div>
            <div style={s.field}>
              <label style={s.label}>{l.supCompany} *</label>
              <input style={s.input} value={supCompany} onChange={e => setSupCompany(e.target.value)} />
            </div>
            <div style={s.row}>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>{l.whatsapp} *</label>
                <input style={s.input} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+966..." />
              </div>
              <div style={{ ...s.field, flex: 1 }}>
                <label style={s.label}>{l.wechat}</label>
                <input style={s.input} value={wechat} onChange={e => setWechat(e.target.value)} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>{l.payMethod} *</label>
              <div style={s.payRow}>
                {['alipay', 'swift'].map(m => (
                  <button key={m} style={{ ...s.payBtn, ...(payMethod === m ? s.payBtnActive : {}) }} onClick={() => setPayMethod(m)}>
                    {m === 'alipay' ? l.alipay : l.swift}
                  </button>
                ))}
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>{l.alibaba}</label>
              <input style={s.input} value={alibaba} onChange={e => setAlibaba(e.target.value)} placeholder="https://..." />
            </div>
            <div style={s.field}>
              <label style={s.label}>{l.regNum}</label>
              <input style={s.input} value={regNum} onChange={e => setRegNum(e.target.value)} />
            </div>
          </>
        )}

        <button style={s.btn} onClick={mode === 'signin' ? doSignIn : doSignUp} disabled={loading}>
          {loading ? '...' : mode === 'signin' ? l.signin : l.signup}
        </button>

        <p style={s.switch}>
          {mode === 'signin' ? l.toSignup : l.toSignin}{' '}
          <button style={s.switchLink} onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}>
            {mode === 'signin' ? l.toSignupLink : l.toSigninLink}
          </button>
        </p>
      </div>
    </div>
  );
}

const s = {
  wrap: {
    minHeight: '100vh',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '100px 24px 60px',
    position: 'relative',
  },
  bg: {
    position: 'fixed', inset: 0,
    backgroundImage: 'url(https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/hero-image/hero.png)',
    backgroundSize: 'cover', backgroundPosition: 'center',
    zIndex: 0,
  },
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.62)',
    zIndex: 1,
  },
  backBtn: {
    position: 'fixed', top: 80, right: 24, zIndex: 10,
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.3)',
    color: 'rgba(255,255,255,0.75)',
    padding: '7px 18px', borderRadius: 2,
    fontSize: 13, cursor: 'pointer', letterSpacing: 0.5,
  },
  form: {
    position: 'relative', zIndex: 2,
    width: '100%', maxWidth: 420,
  },
  logo: {
    fontFamily: 'serif', fontSize: 18, fontWeight: 600,
    letterSpacing: 3, color: '#fff',
    marginBottom: 32, opacity: 0.9,
  },
  logoAr: { opacity: 0.7 },
  title: {
    fontSize: 36, fontWeight: 700,
    color: '#fff', margin: '0 0 8px',
    lineHeight: 1.2, letterSpacing: -0.5,
  },
  sub: {
    fontSize: 15, color: 'rgba(255,255,255,0.55)',
    marginBottom: 36, fontWeight: 400,
  },
  msg: { fontSize: 13, marginBottom: 16, padding: '10px 14px', borderRadius: 4, textAlign: 'center' },
  msgErr: { background: 'rgba(200,0,0,0.15)', color: '#ffaaaa', border: '1px solid rgba(200,0,0,0.25)' },
  msgOk: { background: 'rgba(0,180,80,0.15)', color: '#aaffcc', border: '1px solid rgba(0,180,80,0.25)' },
  sectionLabel: {
    fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.35)', marginBottom: 16, marginTop: 8,
  },
  field: { marginBottom: 16 },
  row: { display: 'flex', gap: 12 },
  label: {
    display: 'block', fontSize: 12, letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.6)', marginBottom: 7, fontWeight: 500,
  },
  input: {
    width: '100%', padding: '13px 0',
    background: 'transparent',
    border: 'none', borderBottom: '1px solid rgba(255,255,255,0.25)',
    fontSize: 15, color: '#fff',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },
  payRow: { display: 'flex', gap: 10 },
  payBtn: {
    flex: 1, padding: '11px',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    color: 'rgba(255,255,255,0.6)', fontSize: 13, cursor: 'pointer',
    borderRadius: 2, transition: 'all 0.2s',
  },
  payBtnActive: {
    border: '1px solid #C8A86B',
    color: '#C8A86B',
  },
  btn: {
    width: '100%', background: '#fff', color: '#1a1a1a',
    border: 'none', padding: '15px',
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
    marginTop: 24, letterSpacing: 0.3,
    transition: 'opacity 0.2s',
  },
  switch: { textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  switchLink: { color: '#fff', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none' },
};