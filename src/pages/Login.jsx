import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { sb } from '../supabase';
import BrandLogo from '../components/BrandLogo';
import { sendMaabarEmail } from '../lib/maabarEmail';
import {
  getSupplierOnboardingState,
  getSupplierPrimaryRoute,
} from '../lib/supplierOnboarding';
import { getIdeaFlowResumePath, hasIdeaFlowDraft } from '../lib/ideaToProductFlow';
import { buildAuthCallbackUrl } from '../lib/authRedirects';
import { CATEGORIES } from '../lib/supplierDashboardConstants';

const L = {
  ar: {
    buyerTitle: 'أهلاً بك في مَعبر',
    buyerSub: 'تسوّق من موردين صينيين موثوقين',
    supplierTitle: 'طلب انضمام المورد',
    supplierSub: 'هذه هي صفحة الدخول والتقديم الموحدة للموردين. إذا كان حسابك معتمداً بالفعل فسجّل الدخول مباشرة. وإذا كنت تتقدّم لأول مرة فأدخل بيانات الشركة الأساسية، أضف روابط صفحاتك التجارية، أكّد بريدك الإلكتروني، ثم سننقلك إلى لوحة المورد لإكمال التحقق.',
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
    tradeLink: 'روابط الصفحات التجارية',
    country: 'الدولة',
    supCity: 'المدينة',
    speciality: 'التخصص',
    supplierRequiredHint: 'الحقول المعلَّمة بنجمة حمراء مطلوبة لإرسال الطلب الأساسي.',
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
    pendingMsg: 'تم استلام طلب المورد. أرسلنا رسالة تأكيد إلى بريدك — بعد التفعيل سجّل دخولك وسنحوّلك مباشرة إلى لوحة المورد لإكمال التحقق. لن تُفتح الإجراءات الأساسية إلا بعد اكتمال التحقق ومراجعته.',
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
    supplierSub: 'This is the shared supplier access page for both sign-in and first-time applications. If your supplier account is already approved, sign in directly. If you are applying for the first time, submit the basic company details, add your trade page links, confirm your email, and we will take you into the supplier dashboard to complete verification.',
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
    tradeLink: 'Trade Page Links',
    country: 'Country',
    supCity: 'City',
    speciality: 'Specialty',
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
    pendingMsg: 'Your supplier application was received. We sent a confirmation email — after activation, sign in and we will take you straight into the supplier dashboard to complete verification. Core supplier actions unlock only after verification is submitted and approved.',
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
    supplierSub: '这是供应商统一入口页，同时支持已批准账户登录和首次申请。若您的账户已经获批，请直接登录；若您是首次申请，请填写基础公司资料、补充贸易页面链接并完成邮箱确认，系统会带您进入供应商控制台继续认证。',
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
    tradeLink: '贸易页面链接',
    country: '国家',
    supCity: '城市',
    speciality: '专业领域',
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
    pendingMsg: '我们已收到您的供应商申请。确认邮件已发送；激活后登录，系统会直接带您进入供应商控制台继续完成认证。只有在认证提交并审核通过后，核心供应商功能才会解锁。',
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

const SUPPLIER_SIGNUP_CONTENT = {
  ar: {
    introTag: 'للموردين الصينيين',
    introTitle: 'قدّم البيانات الأساسية الآن — ثم أكمل التحقق من لوحة المورد',
    introBody: 'هذا التسجيل الأول ليس تحققاً كاملاً. الفكرة هنا أن ترسل هوية الشركة الأساسية ورابطاً تجارياً موثوقاً، وبعد تأكيد البريد تدخل مباشرة إلى لوحة المورد لإكمال التحقق.',
    steps: ['بيانات شركة أساسية', 'تأكيد البريد الإلكتروني', 'الدخول إلى لوحة المورد ثم بدء التحقق'],
    checklist: [
      'استخدم اسم الشركة الرسمي أو الاسم الذي يعرفك به المشترون',
      'أضف رابط صفحة تجارية حقيقية أو موقعاً رسمياً يمكن للفريق مراجعته بسرعة',
      'WeChat مفيد جداً إذا كان هذا هو أسلوب التواصل الأساسي لديك',
    ],
    companyHint: 'الأفضل كتابة اسم الشركة القانوني أو اسم المتجر المعروف لدى المشترين.',
    countryHint: 'إذا كانت شركتك مسجلة في الصين فاكتب الصين / China / 中国 حسب ما تفضّل.',
    cityHint: 'أدخل المدينة التي يعمل منها فريقك التجاري أو المصنع.',
    tradeLinkHint: 'أضف رابط صفحة المنتج أو صفحة الشركة أو المتجر أو الموقع الرسمي. يمكنك إدخال أكثر من رابط وفصلها بسطر جديد.',
    specialityHint: 'مثال: أدوات مطبخ، تعبئة وتغليف، إلكترونيات استهلاكية.',
    contactTitle: 'قنوات التواصل المفضلة',
    contactBody: 'WeChat اختياري لكنه يبني الثقة أكثر مع المورد الصيني لأنه القناة الأكثر توقعاً في هذه المرحلة.',
    laterTitle: 'ما سنؤجله لمرحلة لاحقة',
    laterItems: ['الرخصة التجارية الكاملة', 'صور المصنع', 'رقم التسجيل', 'بيانات استلام الأرباح'],
    citySuggestions: ['广州', '深圳', '义乌', '宁波', '佛山', '东莞', '厦门', '杭州', '苏州', '青岛'],
  },
  en: {
    introTag: 'For Chinese suppliers',
    introTitle: 'Submit the basics now — then complete verification inside the supplier dashboard',
    introBody: 'This first signup is intentionally lighter than full verification. The goal is to capture a credible company identity and trade page first, then move you into the supplier dashboard after real email confirmation so you can complete verification there.',
    steps: ['Basic company profile', 'Email confirmation', 'Open the supplier dashboard and start verification'],
    checklist: [
      'Use the legal company name or the name buyers already know',
      'Add a real trade page or company website that can be reviewed quickly',
      'WeChat is optional, but it helps if that is your normal business channel',
    ],
    companyHint: 'Best if this matches your legal company name or the storefront name buyers already know.',
    countryHint: 'If the company is registered in mainland China, enter China / 中国 if that is how you present it publicly.',
    cityHint: 'Enter the city your sales team or factory operates from.',
    tradeLinkHint: 'Add a product page, company profile, storefront, or company website. You can include more than one link by placing each one on a new line.',
    specialityHint: 'Optional — e.g. kitchenware, packaging, consumer electronics.',
    contactTitle: 'Preferred contact channels',
    contactBody: 'WeChat is optional, but for many Chinese suppliers it is the fastest trust-building contact method during review.',
    laterTitle: 'These stay for a later stage',
    laterItems: ['Full business license upload', 'Factory photo package', 'Registration number', 'Payout details'],
    citySuggestions: ['Guangzhou', 'Shenzhen', 'Yiwu', 'Ningbo', 'Foshan', 'Dongguan', 'Xiamen', 'Hangzhou', 'Suzhou', 'Qingdao'],
  },
  zh: {
    introTag: '面向中国供应商',
    introTitle: '先提交基础资料，然后在供应商控制台完成认证',
    introBody: '首次申请故意保持轻量，不是一次性做完整认证。先提交可信的公司身份和贸易资料链接，完成邮箱确认后，系统会直接带您进入供应商控制台继续认证。',
    steps: ['基础公司资料', '邮箱确认', '进入供应商控制台并开始认证'],
    checklist: [
      '请填写营业主体名称，或买家已经熟悉的公司/店铺名称',
      '请提供真实可访问的贸易页面或官网，方便快速审核',
      'WeChat 虽然不是必填，但如果这是您的常用商务渠道，建议填写',
    ],
    companyHint: '建议填写营业执照主体名称，或买家已经熟悉的店铺名称。',
    countryHint: '如果公司注册在中国大陆，可填写 China / 中国。',
    cityHint: '填写销售团队或工厂所在城市即可。',
    tradeLinkHint: '可填写产品页、公司主页、店铺页或官网。若有多个链接，可按换行逐条填写。',
    specialityHint: '可选，例如：厨房用品、包装材料、消费电子。',
    contactTitle: '优先联系渠道',
    contactBody: 'WeChat 不是必填，但对中国供应商来说，它通常是审核阶段最自然、最容易建立信任的联系方式。',
    laterTitle: '后续阶段再补充',
    laterItems: ['完整营业执照上传', '工厂照片资料', '注册号', '收款信息'],
    citySuggestions: ['广州', '深圳', '义乌', '宁波', '佛山', '东莞', '厦门', '杭州', '苏州', '青岛'],
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
    if (!trimValue(values.speciality)) errors.speciality = langPack.requiredField;
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
  const urlLang = searchParams.get('lang');
  const effectiveLang = (urlLang === 'en' || urlLang === 'zh') ? urlLang : lang;
  const role = roleParam === 'supplier' ? 'supplier' : 'buyer';
  const isSupplier = role === 'supplier';
  const isAr = effectiveLang === 'ar';
  const l = L[effectiveLang] || L.ar;
  const supplierSignupContent = SUPPLIER_SIGNUP_CONTENT[effectiveLang] || SUPPLIER_SIGNUP_CONTENT.en;

  const getInitialMode = () => (isSupplier ? 'signin' : (searchParams.get('mode') === 'signup' ? 'signup' : 'signin'));
  const [mode, setMode] = useState(getInitialMode);
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [msg, setMsg] = useState('');
  const [msgType, setMsgType] = useState('');
  const [loading, setLoading] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [resendingConfirmation, setResendingConfirmation] = useState(false);
  const [resendMsg, setResendMsg] = useState('');
  const [resendMsgType, setResendMsgType] = useState('');
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
  const [country, setCountry] = useState('');
  const [supCity, setSupCity] = useState('');
  const [speciality, setSpeciality] = useState('');

  useEffect(() => {
    setMode(getInitialMode());
  }, [isSupplier, searchParams]);

  useEffect(() => {
    if (!user || !profile || !isSupplier || profile.role !== 'supplier') return;
    nav(getSupplierPrimaryRoute(profile, user), { replace: true });
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
      speciality,
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
    speciality,
    agreedTerms,
    l,
  ]);

  const requiredAsterisk = <span style={{ color: '#d66b6b' }}> *</span>;

  const getEmailConfirmationRedirect = (nextPath = '/dashboard') => buildAuthCallbackUrl(nextPath, isSupplier ? 'supplier' : 'buyer');

  const resendConfirmationEmail = async (targetEmail) => {
    const normalizedEmail = trimValue(targetEmail || email);
    if (!normalizedEmail) {
      setResendMsg(l.fillRequired);
      setResendMsgType('error');
      return;
    }

    setResendingConfirmation(true);
    setResendMsg('');
    setResendMsgType('');

    const { error } = await sb.auth.resend({
      type: 'signup',
      email: normalizedEmail,
      options: {
        emailRedirectTo: getEmailConfirmationRedirect('/dashboard'),
      },
    });

    setResendingConfirmation(false);

    if (error) {
      setResendMsg(error.message);
      setResendMsgType('error');
      return;
    }

    setResendMsg(
      lang === 'ar'
        ? `أعدنا إرسال رسالة التفعيل إلى ${normalizedEmail}`
        : lang === 'zh'
          ? `确认邮件已重新发送至 ${normalizedEmail}`
          : `We resent the confirmation email to ${normalizedEmail}`
    );
    setResendMsgType('success');
  };

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
        setSubmittedEmail(trimValue(email));
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
      setSubmittedEmail(trimValue(email));
      setMsg(l.emailNotConfirmed);
      setMsgType('error');
      return;
    }

    setUser(data.user);
    const { data: profile } = await sb
      .from('profiles')
      .select('id,role,status,full_name,company_name,phone,city,country,speciality,wechat,whatsapp,trade_link,trade_links,reg_number,years_experience,license_photo,factory_photo')
      .eq('id', data.user.id)
      .single();

    const nextProfile = profile;

    if (nextProfile) setProfile(nextProfile);

    if (nextProfile?.role === 'supplier') {
      const supplierState = getSupplierOnboardingState(nextProfile, data.user);
      if (!supplierState.canAccessOperationalFeatures) {
        nav(getSupplierPrimaryRoute(nextProfile, data.user));
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
        speciality,
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
      status: isSupplier ? 'registered' : 'active',
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
        speciality: trimValue(speciality),
        country: trimValue(country),
        city: trimValue(supCity),
        lang: effectiveLang === 'zh' ? 'zh' : 'en',
      }),
    };

    const emailRedirectTo = getEmailConfirmationRedirect(
      hasPendingAiReview() ? getIdeaFlowResumePath() : '/dashboard'
    );

    const { data, error } = await sb.auth.signUp({
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
        // Profiles insert fallback — only if webhook hasn't already created it
        if (data?.user?.id) {
          const { error: profileError } = await sb.from('profiles').insert({
            id: data.user.id,
            email: trimValue(email),
            role: 'supplier',
            status: 'registered',
            company_name: trimValue(supCompany),
            country: trimValue(country),
            city: trimValue(supCity),
            whatsapp: trimValue(whatsapp),
            wechat: trimValue(wechat),
            speciality: trimValue(speciality),
            lang: effectiveLang === 'zh' ? 'zh' : 'en',
          }).select().single();

          if (profileError && profileError.code !== '23505') {
            // 23505 = unique violation = webhook already inserted it = OK
            console.error('[doSignUp] profile insert failed:', profileError);
            setMsg(isAr ? 'حدث خطأ أثناء إنشاء الحساب. حاول مرة أخرى.' : 'Account creation failed. Please try again.');
            setMsgType('error');
            return;
          }
        }

      } catch (emailError) {
        console.error('supplier signup email error:', emailError);
      }

      setSubmittedEmail(trimValue(email));
      setResendMsg('');
      setResendMsgType('');
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
    const redirectTo = buildAuthCallbackUrl(resumePath, 'buyer');

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

  const helperTextStyle = {
    marginTop: 7,
    marginBottom: 0,
    fontSize: 12,
    color: 'var(--text-disabled)',
    lineHeight: 1.7,
    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
  };

  const TERMS = {
    ar: [
      { title: '١. تعريف المنصة', body: 'مَعبر هي منصة وساطة تجارية إلكترونية تربط التجار السعوديين بالموردين الصينيين. تعمل مَعبر بوصفها وسيطاً تجارياً فقط، وليست طرفاً في أي صفقة.' },
      { title: '٢. شروط التسجيل', body: 'للتاجر: يجب أن يكون مقيماً أو يمارس نشاطاً تجارياً في المملكة العربية السعودية.\nللمورد: يجب أن يكون لديه سجل تجاري ساري، ويخضع لمراجعة وموافقة مَعبر قبل التفعيل.' },
      { title: '٣. آلية إبرام العقود', body: 'تُبرم الصفقات عبر آلية العرض والقبول: يرفع التاجر طلبًا، يُقدّم الموردون عروضهم، يختار التاجر العرض الأنسب ويؤكده. يُعدّ هذا التأكيد عقدًا ملزمًا.' },
      { title: '٤. نظام الدفع المرحلي', body: 'تتيح مَعبر ثلاثة خيارات: ٣٠٪ مقدماً، أو ٥٠٪، أو ١٠٠٪. الدفعة الأولى تُمثّل التزام التاجر. الدفعة الثانية تُسدَّد بعد إشعار "الشحنة جاهزة".' },
      { title: '٥. العمولة', body: 'تأخذ مَعبر 0% عمولة على الصفقة.' },
      { title: '٦. سياسة المشاكل والإرجاع', body: 'إذا وصلت البضاعة تالفة أو مختلفة عن الوصف، يُفتح نزاع خلال ٤٨ ساعة. مَعبر تبتّ خلال ٧ أيام عمل.' },
      { title: '٧. الخصوصية وحماية البيانات', body: 'تلتزم مَعبر بنظام حماية البيانات الشخصية السعودي (PDPL). نحن نجمع البيانات الضرورية فقط لتشغيل المنصة ولا نشاركها إلا في الحالات المحددة في سياسة الخصوصية الكاملة. يحق لك الاطلاع على بياناتك وتصحيحها وحذفها.' },
      { title: '٨. الاختصاص القضائي', body: 'تخضع هذه الشروط لأنظمة المملكة العربية السعودية.' },
    ],
    en: [
      { title: '1. Platform Definition', body: 'Maabar is an electronic trade intermediary platform connecting Saudi traders with Chinese suppliers. Maabar acts only as an intermediary and is not a party to any transaction between users.' },
      { title: '2. Registration Terms', body: 'For traders: the user must be resident in, or operating a business in, Saudi Arabia.\nFor suppliers: the user must hold a valid commercial registration or business license and is subject to Maabar review before activation.' },
      { title: '3. Contract Formation', body: 'Transactions are formed through an offer-and-acceptance model: the trader posts a request, suppliers submit offers, and the trader confirms the selected offer. That confirmation becomes binding.' },
      { title: '4. Staged Payment System', body: 'Maabar supports three payment options: 30% upfront, 50% upfront, or 100% upfront. The first installment represents commitment, and the second installment is paid after the supplier marks the shipment as ready.' },
      { title: '5. Commission', body: 'Maabar charges 0% commission on the transaction.' },
      { title: '6. Issues and Returns', body: 'If goods arrive damaged or materially different from the description, a dispute may be opened within 48 hours. Maabar reviews the case within 7 business days.' },
      { title: '7. Privacy and Data Protection', body: 'Maabar complies with the Saudi Personal Data Protection Law (PDPL). We collect only the data necessary to operate the platform and share it only in cases specified in the full privacy policy. You have the right to access, correct, and delete your data.' },
      { title: '8. Governing Law', body: 'These terms are governed by the laws of the Kingdom of Saudi Arabia.' },
    ],
    zh: [
      { title: '1. 平台定义', body: 'Maabar 是连接沙特贸易商与中国供应商的电子贸易中介平台。Maabar 仅作为中介存在，并非用户之间交易的合同方。' },
      { title: '2. 注册条款', body: '贸易商：用户须在沙特阿拉伯居住或经营业务。\n供应商：用户须持有有效商业登记或营业执照，并在账户激活前接受 Maabar 审核。' },
      { title: '3. 合同成立方式', body: '交易通过"报价—接受"的方式成立：贸易商发布需求，供应商提交报价，贸易商确认所选报价后，该确认即构成具有约束力的协议。' },
      { title: '4. 分阶段付款制度', body: 'Maabar 支持 30% 预付、50% 预付或 100% 一次性付款。首付款代表交易承诺，第二笔款项在供应商发出"货物已准备好"通知后支付。' },
      { title: '5. 平台佣金', body: 'Maabar 对交易收取 0% 佣金。' },
      { title: '6. 问题与退货', body: '如货物损坏或与描述存在重大差异，可在 48 小时内发起争议。Maabar 会在 7 个工作日内完成审查。' },
      { title: '7. 隐私与数据保护', body: 'Maabar 遵守沙特个人数据保护法（PDPL）。我们仅收集运营平台所需的数据，并仅在完整隐私政策规定的情况下共享数据。您有权访问、更正和删除您的数据。' },
      { title: '8. 适用法律', body: '本条款受沙特阿拉伯王国法律管辖。' },
    ],
  };

  const termsSections = TERMS[lang] || TERMS.ar;
  const termsDir = isAr ? 'rtl' : 'ltr';
  const termsFont = isAr ? 'var(--font-ar)' : 'var(--font-sans)';

  return (
    <>
      <div style={{
        minHeight: 'var(--app-dvh)',
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
          backgroundImage: 'none',
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

          {isSupplier && submittedEmail && (msgType === 'success' || msg === l.emailNotConfirmed) ? (
            <div style={{
              marginBottom: 22,
              padding: '16px 18px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              background: 'var(--bg-subtle)',
            }}>
              <p style={{
                margin: '0 0 6px',
                fontSize: 11,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                color: 'var(--text-disabled)',
              }}>
                {isAr ? 'بريد التفعيل' : lang === 'zh' ? '确认邮箱' : 'Confirmation email'}
              </p>
              <p style={{
                margin: 0,
                fontSize: 14,
                color: 'var(--text-primary)',
                lineHeight: 1.8,
                fontFamily: 'var(--font-sans)',
                wordBreak: 'break-word',
              }}>
                {submittedEmail}
              </p>
              <p style={{
                margin: '10px 0 0',
                fontSize: 12,
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {isAr
                  ? 'لن يدخل طلبك مراجعة الفريق إلا بعد تأكيد هذا البريد. إذا كان العنوان خطأ، عدّل الإيميل أولاً أو اطلب إعادة الإرسال.'
                  : lang === 'zh'
                    ? '只有在此邮箱完成确认后，团队审核才会开始。如果邮箱填错，请先修改邮箱或重新发送确认邮件。'
                    : 'Your application will not enter team review until this email is confirmed. If the address is wrong, correct it first or resend the confirmation email.'}
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
                <button
                  onClick={() => resendConfirmationEmail(submittedEmail)}
                  disabled={resendingConfirmation}
                  style={{
                    background: '#1a1a1a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    minHeight: 42,
                    padding: '10px 16px',
                    cursor: resendingConfirmation ? 'not-allowed' : 'pointer',
                    opacity: resendingConfirmation ? 0.5 : 1,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {resendingConfirmation
                    ? '...'
                    : (isAr ? 'إعادة إرسال التفعيل' : lang === 'zh' ? '重新发送确认邮件' : 'Resend confirmation')}
                </button>

                <button
                  onClick={() => {
                    setMsg('');
                    setMsgType('');
                    setSubmittedEmail('');
                    setResendMsg('');
                    setResendMsgType('');
                    setEmail('');
                    setPass('');
                    setMode('signup');
                  }}
                  style={{
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-md)',
                    minHeight: 42,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  {isAr ? 'استخدام بريد مختلف' : lang === 'zh' ? '使用其他邮箱' : 'Use a different email'}
                </button>
              </div>

              {resendMsg ? (
                <p style={{
                  margin: '12px 0 0',
                  fontSize: 12,
                  lineHeight: 1.7,
                  color: resendMsgType === 'error' ? '#d66b6b' : '#7bc091',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                }}>
                  {resendMsg}
                </p>
              ) : null}
            </div>
          ) : null}

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
                      <input style={getFieldInputStyle('firstName')} value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={isAr ? 'محمد' : lang === 'zh' ? '伟' : 'John'} />
                      {getErrorText('firstName')}
                    </div>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.lastName}{requiredAsterisk}</label>
                      <input style={getFieldInputStyle('lastName')} value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={isAr ? 'العمري' : lang === 'zh' ? '张' : 'Smith'} />
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
                    <p style={helperTextStyle}>{supplierSignupContent.companyHint}</p>
                  </div>

                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.country}{requiredAsterisk}</label>
                      <input style={getFieldInputStyle('country')} value={country} onChange={(e) => setCountry(e.target.value)} placeholder={isAr ? 'الصين' : lang === 'zh' ? '中国 / China' : 'China'} />
                      {getErrorText('country')}
                      <p style={helperTextStyle}>{supplierSignupContent.countryHint}</p>
                    </div>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.supCity}{requiredAsterisk}</label>
                      <input style={getFieldInputStyle('supCity')} value={supCity} onChange={(e) => setSupCity(e.target.value)} placeholder={isAr ? 'قوانغتشو' : lang === 'zh' ? '广州' : 'Guangzhou'} list="supplier-city-suggestions" />
                      {getErrorText('supCity')}
                      <p style={helperTextStyle}>{supplierSignupContent.cityHint}</p>
                    </div>
                  </div>
                  <datalist id="supplier-city-suggestions">
                    {supplierSignupContent.citySuggestions.map((cityOption) => (
                      <option key={cityOption} value={cityOption} />
                    ))}
                  </datalist>

                  <div style={fieldStyle}>
                    <label style={labelStyle}>{l.speciality}{requiredAsterisk}</label>
                    <select style={getFieldInputStyle('speciality', { cursor: 'pointer' })} value={speciality} onChange={(e) => setSpeciality(e.target.value)}>
                      <option value="">{effectiveLang === 'ar' ? 'اختر تخصصاً' : effectiveLang === 'zh' ? '请选择专业领域' : 'Select category'}</option>
                      {(CATEGORIES[effectiveLang] || CATEGORIES.en).filter(c => c.val !== 'all').map(c => (
                        <option key={c.val} value={c.val}>{c.label}</option>
                      ))}
                    </select>
                    {getErrorText('speciality')}
                  </div>

                  <div style={{
                    marginBottom: 18,
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-subtle)',
                  }}>
                    <p style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: isAr ? 0 : 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {supplierSignupContent.contactTitle}
                    </p>
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
                    <p style={{ ...helperTextStyle, marginTop: 8 }}>{l.contactHint}</p>
                  </div>
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
                  background: '#1a1a1a',
                  color: '#ffffff',
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
                      {isAr ? 'أو' : lang === 'zh' ? '或' : 'OR'}
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
                    setSubmittedEmail('');
                    setResendMsg('');
                    setResendMsgType('');
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
            background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, maxWidth: 600, width: '100%', maxHeight: '80vh',
            overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: isAr || lang === 'zh' ? 0 : 1, color: 'rgba(0,0,0,0.88)', fontFamily: termsFont, margin: 0 }}>
                {isAr ? 'الشروط والأحكام' : lang === 'zh' ? '条款与条件' : 'Terms & Conditions'}
              </p>
              <button onClick={() => setShowTerms(false)} style={{ background: 'none', border: 'none', color: 'rgba(0,0,0,0.45)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '24px 28px' }} dir={termsDir}>
              {termsSections.map((section, index) => (
                <div key={index} style={{ marginBottom: 24 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.88)', fontFamily: termsFont, marginBottom: 8 }}>{section.title}</p>
                  <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.55)', fontFamily: termsFont, lineHeight: 1.9, whiteSpace: 'pre-line', margin: 0 }}>{section.body}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '16px 28px', borderTop: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button onClick={() => setShowTerms(false)} style={{ background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.10)', color: 'rgba(0,0,0,0.60)', padding: '9px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontFamily: termsFont }}>
                {isAr ? 'إغلاق' : lang === 'zh' ? '关闭' : 'Close'}
              </button>
              <button onClick={() => { setAgreedTerms(true); setShowTerms(false); }} style={{ background: '#1a1a1a', border: 'none', color: '#ffffff', padding: '9px 20px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: termsFont }}>
                {isAr ? 'أوافق' : lang === 'zh' ? '我同意' : 'I Agree'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}