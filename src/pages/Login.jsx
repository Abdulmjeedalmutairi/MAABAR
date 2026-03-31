import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { sb } from '../supabase';
import BrandLogo from '../components/BrandLogo';
import { getSupplierOnboardingState, getSupplierPrimaryRoute } from '../lib/supplierOnboarding';
import { getIdeaFlowResumePath, hasIdeaFlowDraft } from '../lib/ideaToProductFlow';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3V0emFsbXN6ZnFmY29meXdmZXR2LnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJyZWYiOiJ1dHphbG1zenFmcWNvZnl3ZmV0diIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzczNjYxODQwLCJleHAiOjIwODkyMzc4NDB9.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const L = {
  ar: {
    buyerTitle: 'أهلاً بك في مَعبر',
    buyerSub: 'تسوّق من موردين صينيين موثوقين',
    supplierTitle: 'طلب انضمام المورد',
    supplierSub: 'هذه هي صفحة التسجيل الموحدة للموردين. أدخل بيانات الشركة الأساسية مرة واحدة، أكّد بريدك الإلكتروني، ثم سننقلك إلى صفحة حالة الطلب تحت المراجعة.',
    email: 'البريد الإلكتروني',
    pass: 'كلمة المرور',
    firstName: 'الاسم الأول',
    lastName: 'الاسم الأخير',
    phone: 'رقم الجوال',
    city: 'المدينة',
    companyName: 'اسم الشركة / النشاط (اختياري)',
    supCompany: 'اسم الشركة',
    whatsapp: 'واتساب',
    wechat: 'WeChat',
    tradeLink: 'رابط موقع الشركة أو متجر Alibaba',
    country: 'الدولة',
    supCity: 'المدينة',
    speciality: 'التخصص (اختياري)',
    supplierRequiredHint: 'الحقول المعلَّمة بنجمة حمراء مطلوبة لإرسال الطلب الأساسي.',
    contactHint: 'وسائل التواصل اختيارية الآن. إذا أضفت WeChat أو WhatsApp سيسهّل ذلك على الفريق التواصل معك.',
    verificationLater: 'لن نطلب الآن السجل التجاري أو الرخصة أو صور المصنع أو بيانات استلام الأرباح. إذا احتجناها، ستكون في خطوة التحقق اللاحقة داخل حالة الحساب.',
    signin: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    toSignup: 'ما عندك حساب؟',
    toSignupLink: 'سجل الآن',
    toSignin: 'عندك حساب؟',
    toSigninLink: 'سجل دخولك',
    back: 'رجوع',
    buyerInfo: 'بياناتك',
    supInfo: 'بيانات الطلب',
    fillRequired: 'يرجى تعبئة الحقول الإجبارية.',
    termsLabel: 'أوافق على ',
    termsLink: 'الشروط والأحكام',
    mustAgreeTerms: 'يجب الموافقة على الشروط والأحكام.',
    pendingMsg: 'تم استلام طلب المورد. أرسلنا رسالة تأكيد إلى بريدك — بعد التفعيل سجّل دخولك وسنحوّلك مباشرة إلى صفحة حالة الطلب تحت المراجعة.',
    googleLogin: 'دخول بـ Google',
    emailNotConfirmed: 'يرجى تأكيد بريدك الإلكتروني أولاً ثم متابعة طلب المورد.',
    wrongCredentials: 'إيميل أو كلمة مرور غير صحيحة.',
    requiredField: 'هذا الحقل مطلوب.',
    requiredContact: '',
    requiredTerms: 'يجب الموافقة على الشروط والأحكام.',
    formErrorSummary: 'فيه حقول مطلوبة ناقصة ومعلّمة باللون الأحمر.',
    cities: ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'القصيم', 'حائل', 'جازان', 'نجران'],
  },
  en: {
    buyerTitle: 'Welcome to Maabar',
    buyerSub: 'Shop from verified Chinese suppliers',
    supplierTitle: 'Supplier application',
    supplierSub: 'This is the single shared supplier signup page. Submit your basic company details once, confirm your email, and we will take you straight into your pending-review status page.',
    email: 'Email',
    pass: 'Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    phone: 'Phone',
    city: 'City',
    companyName: 'Company / Business (optional)',
    supCompany: 'Company Name',
    whatsapp: 'WhatsApp',
    wechat: 'WeChat',
    tradeLink: 'Company Website or Alibaba Store URL',
    country: 'Country',
    supCity: 'City',
    speciality: 'Specialty (optional)',
    supplierRequiredHint: 'Fields marked with a red asterisk are required for the basic supplier signup.',
    contactHint: 'Contact methods are optional at signup. Adding WeChat or WhatsApp simply helps the team reach you faster.',
    verificationLater: 'Registration number, business license, factory photos, and payout details all stay out of initial signup. If needed, they will be requested later in verification.',
    signin: 'Sign In',
    signup: 'Create Account',
    toSignup: "Don't have an account?",
    toSignupLink: 'Sign up',
    toSignin: 'Already have an account?',
    toSigninLink: 'Sign in',
    back: 'Back',
    buyerInfo: 'Your Details',
    supInfo: 'Application Details',
    fillRequired: 'Please fill the required fields.',
    termsLabel: 'I agree to ',
    termsLink: 'Terms & Conditions',
    mustAgreeTerms: 'You must agree to the Terms & Conditions.',
    pendingMsg: 'Your supplier application was received. We sent a confirmation email — after activation, sign in and we will take you straight into your pending-review status page.',
    googleLogin: 'Continue with Google',
    emailNotConfirmed: 'Please confirm your email first, then continue your supplier application.',
    wrongCredentials: 'Invalid email or password.',
    requiredField: 'This field is required.',
    requiredContact: '',
    requiredTerms: 'You must agree to the Terms & Conditions.',
    formErrorSummary: 'Some required fields are missing and highlighted in red.',
    cities: ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Qassim', 'Hail', 'Jazan', 'Najran'],
  },
  zh: {
    buyerTitle: '欢迎来到 Maabar',
    buyerSub: '从认证中国供应商采购',
    supplierTitle: '供应商申请',
    supplierSub: '这是统一的供应商注册申请页。一次填写基础公司资料、确认邮箱后，系统会直接带您进入待审核状态页。',
    email: '电子邮件',
    pass: '密码',
    firstName: '名',
    lastName: '姓',
    phone: '电话',
    city: '城市',
    companyName: '公司/商业名称（可选）',
    supCompany: '公司名称',
    whatsapp: 'WhatsApp',
    wechat: 'WeChat',
    tradeLink: '公司官网或阿里巴巴店铺链接',
    country: '国家',
    supCity: '城市',
    speciality: '专业领域（可选）',
    supplierRequiredHint: '带红色星号的字段为基础供应商注册所必填。',
    contactHint: '注册时联系方式为可选项。若填写 WeChat 或 WhatsApp，团队联系您会更快。',
    verificationLater: '公司注册号、营业执照、工厂照片以及收款资料都不属于首次注册内容。如有需要，会在后续认证阶段再补充。',
    signin: '登录',
    signup: '创建账户',
    toSignup: '没有账户？',
    toSignupLink: '立即注册',
    toSignin: '已有账户？',
    toSigninLink: '登录',
    back: '返回',
    buyerInfo: '您的信息',
    supInfo: '申请资料',
    fillRequired: '请填写必填项。',
    termsLabel: '我同意',
    termsLink: '条款与条件',
    mustAgreeTerms: '您必须同意条款与条件。',
    pendingMsg: '我们已收到您的供应商申请。确认邮件已发送；激活后登录，系统会直接带您进入待审核状态页。',
    googleLogin: '使用 Google 登录',
    emailNotConfirmed: '请先确认邮箱，然后继续供应商申请。',
    wrongCredentials: '邮箱或密码错误。',
    requiredField: '此项为必填。',
    requiredContact: '',
    requiredTerms: '您必须同意条款与条件。',
    formErrorSummary: '有必填项未完成，已用红色高亮显示。',
    cities: ['利雅得', '吉达', '麦加', '麦地那', '达曼', '霍拜尔', '塔布克', '艾卜哈', '盖西姆', '哈伊勒', '吉赞', '纳季兰'],
  },
};

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function buildFieldErrorMap({
  isSupplier,
  mode,
  values,
  agreedTerms,
  langPack,
}) {
  const errors = {};

  if (!trimValue(values.email)) errors.email = langPack.requiredField;
  if (!trimValue(values.pass)) errors.pass = langPack.requiredField;

  if (mode !== 'signup') return errors;

  if (isSupplier) {
    if (!trimValue(values.supCompany)) errors.supCompany = langPack.requiredField;
    if (!trimValue(values.country)) errors.country = langPack.requiredField;
    if (!trimValue(values.supCity)) errors.supCity = langPack.requiredField;
    if (!trimValue(values.tradeLink)) errors.tradeLink = langPack.requiredField;
  } else {
    if (!trimValue(values.firstName)) errors.firstName = langPack.requiredField;
    if (!trimValue(values.lastName)) errors.lastName = langPack.requiredField;
    if (!trimValue(values.phone)) errors.phone = langPack.requiredField;
    if (!trimValue(values.city)) errors.city = langPack.requiredField;
  }

  if (!agreedTerms) errors.terms = langPack.requiredTerms;

  return errors;
}

export default function Login({ user, profile, setUser, setProfile, lang }) {
  const nav = useNavigate();
  const { role: roleParam } = useParams();
  const [searchParams] = useSearchParams();
  const role = roleParam === 'supplier' ? 'supplier' : 'buyer';
  const isSupplier = role === 'supplier';
  const isAr = lang === 'ar';
  const l = L[lang] || L.ar;

  const [mode, setMode] = useState(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [supCompany, setSupCompany] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [wechat, setWechat] = useState('');
  const [tradeLink, setTradeLink] = useState('');
  const [country, setCountry] = useState('');
  const [supCity, setSupCity] = useState('');
  const [speciality, setSpeciality] = useState('');

  useEffect(() => {
    setMode(searchParams.get('mode') === 'signup' ? 'signup' : 'signin');
  }, [searchParams]);

  useEffect(() => {
    if (!user || !profile || !isSupplier || profile.role !== 'supplier') return;
    nav(getSupplierPrimaryRoute(profile), { replace: true });
  }, [user, profile, isSupplier, nav]);

  const hasPendingAiReview = () => {
    if (isSupplier) return false;
    return hasIdeaFlowDraft();
  };

  const validationErrors = useMemo(() => buildFieldErrorMap({
    isSupplier,
    mode,
    values: {
      email,
      pass,
      firstName,
      lastName,
      phone,
      city,
      supCompany,
      country,
      supCity,
      tradeLink,
    },
    agreedTerms,
    langPack: l,
  }), [
    isSupplier,
    mode,
    email,
    pass,
    firstName,
    lastName,
    phone,
    city,
    supCompany,
    country,
    supCity,
    tradeLink,
    agreedTerms,
    l,
  ]);

  const requiredAsterisk = <span style={{ color: '#d66b6b' }}> *</span>;

  const doSignIn = async () => {
    if (!trimValue(email) || !trimValue(pass)) {
      setShowValidation(true);
      setMsg(l.fillRequired);
      setMsgType('error');
      return;
    }

    setLoading(true);
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    setLoading(false);

    if (error) {
      const lowerMessage = error.message.toLowerCase();
      if (lowerMessage.includes('email not confirmed')) {
        setMsg(l.emailNotConfirmed);
      } else if (lowerMessage.includes('invalid login credentials') || lowerMessage.includes('invalid email or password')) {
        setMsg(l.wrongCredentials);
      } else {
        setMsg(error.message);
      }
      setMsgType('error');
      return;
    }

    if (isSupplier && !data.user?.email_confirmed_at) {
      await sb.auth.signOut();
      setMsg(l.emailNotConfirmed);
      setMsgType('error');
      return;
    }

    setUser(data.user);
    const { data: profile } = await sb
      .from('profiles')
      .select('id,role,status,full_name,company_name,phone,city,country,speciality,wechat,whatsapp,trade_link,reg_number,years_experience,license_photo,factory_photo')
      .eq('id', data.user.id)
      .single();

    if (profile) setProfile(profile);

    if (profile?.role === 'supplier') {
      const supplierState = getSupplierOnboardingState(profile);
      if (!supplierState.canAccessOperationalFeatures) {
        nav(getSupplierPrimaryRoute(profile));
        return;
      }
    }

    if (hasPendingAiReview()) {
      nav(getIdeaFlowResumePath());
      return;
    }

    const draft = sessionStorage.getItem('maabar_request_draft');
    const hasDraft = draft && (() => {
      try {
        const parsed = JSON.parse(draft);
        return parsed.title_ar || parsed.title_en;
      } catch {
        return false;
      }
    })();

    nav(hasDraft ? '/requests' : '/dashboard');
  };

  const doSignUp = async () => {
    const errors = buildFieldErrorMap({
      isSupplier,
      mode,
      values: {
        email,
        pass,
        firstName,
        lastName,
        phone,
        city,
        supCompany,
        country,
        supCity,
        tradeLink,
      },
      agreedTerms,
      langPack: l,
    });

    if (Object.keys(errors).length > 0) {
      setShowValidation(true);
      setMsg(l.formErrorSummary);
      setMsgType('error');
      return;
    }

    setLoading(true);

    const metaData = {
      role,
      status: isSupplier ? 'pending' : 'active',
      ...(!isSupplier && {
        full_name: `${trimValue(firstName)} ${trimValue(lastName)}`.trim(),
        phone: trimValue(phone),
        city: trimValue(city),
        company_name: trimValue(companyName),
      }),
      ...(isSupplier && {
        company_name: trimValue(supCompany),
        whatsapp: trimValue(whatsapp),
        wechat: trimValue(wechat),
        trade_link: trimValue(tradeLink),
        speciality: trimValue(speciality),
        country: trimValue(country),
        city: trimValue(supCity),
      }),
    };

    const emailRedirectTo = hasPendingAiReview()
      ? `https://maabar.io${getIdeaFlowResumePath()}`
      : 'https://maabar.io/dashboard';

    const { error } = await sb.auth.signUp({
      email: trimValue(email),
      password: pass,
      options: { emailRedirectTo, data: metaData },
    });

    setLoading(false);

    if (error) {
      setMsg(error.message);
      setMsgType('error');
      return;
    }

    if (isSupplier) {
      try {
        await fetch(SEND_EMAILS_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            type: 'supplier_signup_bundle',
            data: {
              name: trimValue(supCompany),
              companyName: trimValue(supCompany),
              email: trimValue(email),
              whatsapp: trimValue(whatsapp),
              wechat: trimValue(wechat),
              tradeLink: trimValue(tradeLink),
              country: trimValue(country),
              city: trimValue(supCity),
              speciality: trimValue(speciality),
              lang,
            },
          }),
        });
      } catch (emailError) {
        console.error('supplier signup email error:', emailError);
      }

      setMsg(l.pendingMsg);
      setMsgType('success');
      return;
    }

    setMsg(
      lang === 'ar'
        ? 'أرسلنا رسالة تأكيد لبريدك الإلكتروني. افتحها واضغط على الرابط للمتابعة.'
        : lang === 'zh'
          ? '确认邮件已发送至您的邮箱，请点击邮件中的链接继续。'
          : 'We sent a confirmation email. Please click the link to continue.'
    );
    setMsgType('ok');
  };

  const doGoogleLogin = async () => {
    const resumePath = hasPendingAiReview() ? getIdeaFlowResumePath() : '/dashboard';
    const redirectTo = process.env.NODE_ENV === 'development'
      ? `${window.location.origin}${resumePath}`
      : `https://maabar.io${resumePath}`;

    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border-default)',
    fontSize: 14,
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, background 0.2s',
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

  const getFieldInputStyle = (fieldKey, extraStyle = {}) => ({
    ...inputStyle,
    ...(showValidation && validationErrors[fieldKey]
      ? {
          borderBottomColor: '#d66b6b',
          boxShadow: 'inset 0 -1px 0 #d66b6b',
          background: 'rgba(214,107,107,0.04)',
        }
      : {}),
    ...extraStyle,
  });

  const getErrorText = (fieldKey) => (
    showValidation && validationErrors[fieldKey]
      ? <p style={{ marginTop: 7, fontSize: 12, color: '#d66b6b', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{validationErrors[fieldKey]}</p>
      : null
  );

  const TERMS_AR = [
    { title: '١. تعريف المنصة', body: 'مَعبر هي منصة وساطة تجارية إلكترونية تربط التجار السعوديين بالموردين الصينيين. تعمل مَعبر بوصفها وسيطاً تجارياً فقط، وليست طرفاً في أي صفقة.' },
    { title: '٢. شروط التسجيل', body: 'للتاجر: يجب أن يكون مقيماً أو يمارس نشاطاً تجارياً في المملكة العربية السعودية.\nللمورد: يجب أن يكون لديه سجل تجاري ساري، ويخضع لمراجعة وموافقة مَعبر قبل التفعيل.' },
    { title: '٣. آلية إبرام العقود', body: 'تُبرم الصفقات عبر آلية العرض والقبول: يرفع التاجر طلبًا، يُقدّم الموردون عروضهم، يختار التاجر العرض الأنسب ويؤكده. يُعدّ هذا التأكيد عقدًا ملزمًا.' },
    { title: '٤. نظام الدفع المرحلي', body: 'تتيح مَعبر ثلاثة خيارات: ٣٠٪ مقدماً، أو ٥٠٪، أو ١٠٠٪. الدفعة الأولى تُمثّل التزام التاجر. الدفعة الثانية تُسدَّد بعد إشعار "الشحنة جاهزة".' },
    { title: '٥. العمولة', body: 'تأخذ مَعبر عمولة ٦٪ من كل صفقة مكتملة: ٤٪ من المورد، و٢٪ من التاجر.' },
    { title: '٦. سياسة المشاكل والإرجاع', body: 'إذا وصلت البضاعة تالفة أو مختلفة عن الوصف، يُفتح نزاع خلال ٤٨ ساعة. مَعبر تبتّ خلال ٧ أيام عمل.' },
    { title: '٧. الخصوصية وحماية البيانات', body: 'تلتزم مَعبر بنظام حماية البيانات الشخصية السعودي (PDPL). لا نبيع بيانات المستخدمين لأي طرف ثالث.' },
    { title: '٨. الاختصاص القضائي', body: 'تخضع هذه الشروط لأنظمة المملكة العربية السعودية.' },
  ];

  return (
    <>
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px 60px',
        background: 'var(--bg-base)',
        position: 'relative',
      }}>
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          pointerEvents: 'none',
          zIndex: 0,
        }} />

        <button
          onClick={() => nav(-1)}
          style={{
            position: 'fixed',
            top: 72,
            right: 24,
            zIndex: 10,
            background: 'var(--bg-raised)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-tertiary)',
            padding: '7px 16px',
            borderRadius: 'var(--radius-md)',
            fontSize: 12,
            cursor: 'pointer',
            transition: 'all 0.15s',
            letterSpacing: 0.5,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-muted)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--text-tertiary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          {isAr ? `→ ${l.back}` : `← ${l.back}`}
        </button>

        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: isSupplier && mode === 'signup' ? 460 : 400 }}>
          <div style={{ marginBottom: 40 }}>
            <BrandLogo size="sm" align={isAr ? 'flex-end' : 'flex-start'} muted />
          </div>

          <h1 style={{
            fontSize: isAr ? 28 : 32,
            fontWeight: 300,
            color: 'var(--text-primary)',
            marginBottom: 8,
            lineHeight: 1.2,
            letterSpacing: isAr ? 0 : -0.5,
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          }}>
            {isSupplier ? l.supplierTitle : l.buyerTitle}
          </h1>
          <p style={{
            fontSize: 14,
            color: 'var(--text-disabled)',
            marginBottom: 40,
            fontWeight: 300,
            lineHeight: 1.7,
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          }}>
            {isSupplier ? l.supplierSub : l.buyerSub}
          </p>

          {msg && (
            <div style={{
              fontSize: 13,
              marginBottom: 20,
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              textAlign: 'center',
              ...(msgType === 'error'
                ? { background: 'rgba(138,58,58,0.12)', color: '#c98a8a', border: '1px solid rgba(214,107,107,0.24)' }
                : { background: 'rgba(58,122,82,0.12)', color: '#7bc091', border: '1px solid rgba(58,122,82,0.2)' }),
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              lineHeight: 1.7,
            }}>
              {msg}
            </div>
          )}

          {!isSupplier || msgType !== 'success' ? (
            <>
              <div style={fieldStyle}>
                <label style={labelStyle}>{l.email}{requiredAsterisk}</label>
                <input
                  style={getFieldInputStyle('email')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  autoComplete="email"
                  dir="ltr"
                />
                {getErrorText('email')}
              </div>

              <div style={fieldStyle}>
                <label style={labelStyle}>{l.pass}{requiredAsterisk}</label>
                <input
                  style={getFieldInputStyle('pass')}
                  type="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  dir="ltr"
                />
                {getErrorText('pass')}
              </div>

              {!isSupplier && mode === 'signup' && (
                <>
                  <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16, marginTop: 8, fontWeight: 500 }}>
                    {l.buyerInfo}
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.firstName}{requiredAsterisk}</label>
                      <input style={getFieldInputStyle('firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={isAr ? 'محمد' : 'John'} />
                      {getErrorText('firstName')}
                    </div>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.lastName}{requiredAsterisk}</label>
                      <input style={getFieldInputStyle('lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={isAr ? 'العمري' : 'Smith'} />
                      {getErrorText('lastName')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.phone}{requiredAsterisk}</label>
                      <input style={getFieldInputStyle('phone')} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+966 5x xxx xxxx" dir="ltr" />
                      {getErrorText('phone')}
                    </div>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.city}{requiredAsterisk}</label>
                      <select style={{ ...getFieldInputStyle('city'), cursor: 'pointer' }} value={city} onChange={(e) => setCity(e.target.value)}>
                        <option value="">{isAr ? 'اختر مدينة' : lang === 'zh' ? '选择城市' : 'Select city'}</option>
                        {l.cities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {getErrorText('city')}
                    </div>
                  </div>
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{l.companyName}</label>
                    <input style={inputStyle} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder={isAr ? 'اختياري' : lang === 'zh' ? '可选' : 'Optional'} />
                  </div>
                </>
              )}

              {isSupplier && mode === 'signup' && (
                <>
                  <div style={{ fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10, marginTop: 8, fontWeight: 500 }}>
                    {l.supInfo}
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 0, marginBottom: 18, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {l.supplierRequiredHint}
                  </p>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>{l.supCompany}{requiredAsterisk}</label>
                    <input style={getFieldInputStyle('supCompany')} value={supCompany} onChange={(e) => setSupCompany(e.target.value)} />
                    {getErrorText('supCompany')}
                  </div>

                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.country}{requiredAsterisk}</label>
                      <input style={getFieldInputStyle('country')} value={country} onChange={(e) => setCountry(e.target.value)} placeholder={isAr ? 'الصين' : 'China'} />
                      {getErrorText('country')}
                    </div>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.supCity}{requiredAsterisk}</label>
                      <input style={getFieldInputStyle('supCity')} value={supCity} onChange={(e) => setSupCity(e.target.value)} placeholder={isAr ? 'قوانغتشو' : 'Guangzhou'} />
                      {getErrorText('supCity')}
                    </div>
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>{l.tradeLink}{requiredAsterisk}</label>
                    <input style={getFieldInputStyle('tradeLink')} value={tradeLink} onChange={(e) => setTradeLink(e.target.value)} placeholder="https://..." dir="ltr" />
                    {getErrorText('tradeLink')}
                  </div>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>{l.speciality}</label>
                    <input style={inputStyle} value={speciality} onChange={(e) => setSpeciality(e.target.value)} placeholder={isAr ? 'مثال: إلكترونيات منزلية' : lang === 'zh' ? '例如：家居电子' : 'Optional — e.g. home electronics'} />
                  </div>

                  <div style={{
                    marginBottom: 18,
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-subtle)',
                  }}>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>{l.wechat}</label>
                        <input style={inputStyle} value={wechat} onChange={(e) => setWechat(e.target.value)} dir="ltr" placeholder="WeChat ID" />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={labelStyle}>{l.whatsapp}</label>
                        <input style={inputStyle} value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+..." dir="ltr" />
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 10, marginBottom: 0, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {l.contactHint}
                    </p>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: -4, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {l.verificationLater}
                  </p>
                </>
              )}

              {mode === 'signup' && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${showValidation && validationErrors.terms ? 'rgba(214,107,107,0.35)' : 'var(--border-subtle)'}`,
                    background: showValidation && validationErrors.terms ? 'rgba(214,107,107,0.04)' : 'var(--bg-subtle)',
                  }}>
                    <input
                      type="checkbox"
                      id="terms-cb"
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      style={{ marginTop: 2, accentColor: 'var(--accent)', flexShrink: 0 }}
                    />
                    <label htmlFor="terms-cb" style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                      lineHeight: 1.6,
                    }}>
                      {l.termsLabel}
                      <button
                        onClick={() => setShowTerms(true)}
                        style={{ color: 'var(--accent)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit', padding: 0 }}
                      >
                        {l.termsLink}
                      </button>
                    </label>
                  </div>
                  {getErrorText('terms')}
                </div>
              )}

              <button
                onClick={mode === 'signin' ? doSignIn : doSignUp}
                disabled={loading}
                style={{
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
                }}
              >
                {loading ? '...' : mode === 'signin'
                  ? l.signin
                  : (isSupplier ? (isAr ? 'إرسال طلب المورد' : lang === 'zh' ? '提交供应商申请' : 'Submit supplier application') : l.signup)}
              </button>

              {!isSupplier && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-disabled)', letterSpacing: 1 }}>
                      {isAr ? 'أو' : 'OR'}
                    </span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
                  </div>
                  <button
                    onClick={doGoogleLogin}
                    style={{
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-strong)';
                      e.currentTarget.style.background = 'var(--bg-hover)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)';
                      e.currentTarget.style.background = 'var(--bg-raised)';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    {l.googleLogin}
                  </button>
                </>
              )}

              <p style={{
                textAlign: 'center',
                marginTop: 24,
                fontSize: 13,
                color: 'var(--text-disabled)',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {isSupplier
                  ? (mode === 'signin'
                    ? (isAr ? 'ما عندك طلب بعد؟' : lang === 'zh' ? '还没有申请？' : 'No application yet?')
                    : (isAr ? 'عندك طلب قائم؟' : lang === 'zh' ? '已经提交过申请？' : 'Already applied?'))
                  : (mode === 'signin' ? l.toSignup : l.toSignin)}{' '}
                <button
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setMsg('');
                    setMsgType('');
                    setShowValidation(false);
                  }}
                  style={{
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
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; }}
                >
                  {isSupplier
                    ? (mode === 'signin'
                      ? (isAr ? 'ابدأ الطلب' : lang === 'zh' ? '开始申请' : 'Start application')
                      : (isAr ? 'سجّل الدخول' : lang === 'zh' ? '登录查看状态' : 'Sign in'))
                    : (mode === 'signin' ? l.toSignupLink : l.toSigninLink)}
                </button>
              </p>
            </>
          ) : null}
        </div>
      </div>

      {showTerms && (
        <div onClick={() => setShowTerms(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
          zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#0f0f11', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12, maxWidth: 600, width: '100%', maxHeight: '80vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1, color: '#fff', fontFamily: 'var(--font-ar)', margin: 0 }}>
                {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
              </p>
              <button onClick={() => setShowTerms(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '24px 28px' }} dir="rtl">
              {TERMS_AR.map((section, index) => (
                <div key={index} style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-ar)', marginBottom: 8 }}>{section.title}</p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-ar)', lineHeight: 1.9, whiteSpace: 'pre-line', margin: 0 }}>{section.body}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowTerms(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '9px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-ar)' }}>
                {isAr ? 'إغلاق' : 'Close'}
              </button>
              <button onClick={() => { setAgreedTerms(true); setShowTerms(false); }} style={{ background: '#fff', border: 'none', color: '#0f0f11', padding: '9px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-ar)' }}>
                {isAr ? 'أوافق' : 'I Agree'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
