import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

const UNIFONIC_APP_SID   = '';
const SUPABASE_ANON_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
const SEND_EMAILS_URL    = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';

const SPECIALITIES = [
  { val: 'electronics',   ar: 'إلكترونيات',              en: 'Electronics',               zh: '电子产品' },
  { val: 'appliances',    ar: 'أجهزة منزلية',             en: 'Home Appliances',            zh: '家用电器' },
  { val: 'furniture',     ar: 'أثاث',                     en: 'Furniture',                  zh: '家具' },
  { val: 'clothing',      ar: 'ملابس وأزياء',             en: 'Clothing & Fashion',         zh: '服装与时尚' },
  { val: 'building',      ar: 'مواد بناء',                en: 'Construction Materials',     zh: '建材' },
  { val: 'food',          ar: 'مواد غذائية',              en: 'Food & Beverages',           zh: '食品饮料' },
  { val: 'medical',       ar: 'مستلزمات طبية',            en: 'Medical Supplies',           zh: '医疗用品' },
  { val: 'cosmetics',     ar: 'مستحضرات التجميل',         en: 'Cosmetics & Beauty',         zh: '美妆护肤' },
  { val: 'toys',          ar: 'ألعاب وأطفال',             en: "Toys & Children's Products", zh: '玩具儿童用品' },
  { val: 'automotive',    ar: 'قطع غيار سيارات',          en: 'Automotive Parts',           zh: '汽车配件' },
  { val: 'sports',        ar: 'رياضة ولياقة',             en: 'Sports & Fitness',           zh: '运动健身' },
  { val: 'lighting',      ar: 'إضاءة',                    en: 'Lighting',                   zh: '照明' },
  { val: 'tools',         ar: 'أدوات صناعية',             en: 'Industrial Tools',           zh: '工业工具' },
  { val: 'gifts',         ar: 'هدايا وتذكارات',           en: 'Gifts & Souvenirs',          zh: '礼品纪念品' },
  { val: 'other',         ar: 'أخرى',                     en: 'Other',                      zh: '其他' },
];

const L = {
  ar: {
    buyerTitle: 'أهلاً بك في مَعبر', buyerSub: 'تسوّق من موردين صينيين موثوقين',
    supplierTitle: 'انضم كمورد', supplierSub: 'ابدأ البيع للسوق السعودي',
    email: 'البريد الإلكتروني', pass: 'كلمة المرور',
    firstName: 'الاسم الأول', lastName: 'الاسم الأخير',
    phone: 'رقم الجوال', city: 'المدينة',
    companyName: 'اسم الشركة / النشاط (اختياري)',
    supCompany: 'اسم الشركة', whatsapp: 'واتساب (اختياري)', wechat: 'WeChat *',
    payMethod: 'طريقة استلام المدفوعات *', alipay: 'Alipay', swift: 'تحويل بنكي (SWIFT)',
    alipayAccount: 'رقم حساب Alipay *', swiftCode: 'رمز SWIFT *', bankName: 'اسم البنك *',
    tradeLink: 'رابط متجر Alibaba أو الموقع (اختياري)', regNum: 'رقم تسجيل الشركة *',
    country: 'الدولة', supCity: 'المدينة',
    speciality: 'التخصص',
    yearsExp: 'سنوات الخبرة *', employees: 'عدد الموظفين (اختياري)',
    businessLicense: 'صورة رخصة الأعمال / الهوية *', factoryPhoto: 'صورة المصنع / المستودع *',
    uploading: 'جاري الرفع...', uploaded: 'تم الرفع ✓',
    signin: 'تسجيل الدخول', signup: 'إنشاء حساب',
    toSignup: 'ما عندك حساب؟', toSignupLink: 'سجل الآن',
    toSignin: 'عندك حساب؟', toSigninLink: 'سجل دخولك',
    back: 'رجوع', buyerInfo: 'بياناتك', supInfo: 'بيانات الشركة',
    fillRequired: 'يرجى تعبئة الحقول الإجبارية',
    termsLabel: 'أوافق على ',
    termsLink: 'الشروط والأحكام',
    mustAgreeTerms: 'يجب الموافقة على الشروط والأحكام',
    pendingMsg: 'تم استلام طلبك. يرجى تأكيد بريدك الإلكتروني لتفعيل الحساب.',
    googleLogin: 'دخول بـ Google',
    otpTitle: 'تأكيد رقم الجوال',
    otpSub: 'أرسلنا رمز التحقق إلى رقمك',
    otpPlaceholder: 'أدخل الرمز المكوّن من 6 أرقام',
    otpVerify: 'تحقق',
    otpResend: 'إعادة الإرسال',
    otpResendIn: 'إعادة الإرسال بعد',
    otpWrong: 'الرمز غير صحيح، حاول مجدداً',
    otpSending: 'جاري الإرسال...',
    emailNotConfirmed: 'يرجى تأكيد إيميلك أولاً',
    wrongCredentials: 'إيميل أو كلمة مرور غير صحيحة',
    cities: ['الرياض','جدة','مكة المكرمة','المدينة المنورة','الدمام','الخبر','تبوك','أبها','القصيم','حائل','جازان','نجران'],
  },
  en: {
    buyerTitle: 'Welcome to Maabar', buyerSub: 'Shop from verified Chinese suppliers',
    supplierTitle: 'Join as Supplier', supplierSub: 'Start selling to the Saudi market',
    email: 'Email', pass: 'Password',
    firstName: 'First Name', lastName: 'Last Name',
    phone: 'Phone', city: 'City',
    companyName: 'Company / Business (optional)',
    supCompany: 'Company Name', whatsapp: 'WhatsApp (optional)', wechat: 'WeChat *',
    payMethod: 'Payment Method *', alipay: 'Alipay', swift: 'Bank Transfer (SWIFT)',
    alipayAccount: 'Alipay Account Number *', swiftCode: 'SWIFT Code *', bankName: 'Bank Name *',
    tradeLink: 'Alibaba Store or Website URL (optional)', regNum: 'Company Registration Number *',
    country: 'Country', supCity: 'City',
    speciality: 'Specialty',
    yearsExp: 'Years of Experience *', employees: 'Number of Employees (optional)',
    businessLicense: 'Business License or ID Photo *', factoryPhoto: 'Factory or Warehouse Photo *',
    uploading: 'Uploading...', uploaded: 'Uploaded ✓',
    signin: 'Sign In', signup: 'Create Account',
    toSignup: "Don't have an account?", toSignupLink: 'Sign up',
    toSignin: 'Already have an account?', toSigninLink: 'Sign in',
    back: 'Back', buyerInfo: 'Your Details', supInfo: 'Company Details',
    fillRequired: 'Please fill required fields',
    termsLabel: 'I agree to ',
    termsLink: 'Terms & Conditions',
    mustAgreeTerms: 'You must agree to the Terms & Conditions',
    pendingMsg: "We've received your application. Please check your email to activate your account.",
    googleLogin: 'Continue with Google',
    otpTitle: 'Verify your phone',
    otpSub: 'We sent a verification code to your number',
    otpPlaceholder: 'Enter 6-digit code',
    otpVerify: 'Verify',
    otpResend: 'Resend',
    otpResendIn: 'Resend in',
    otpWrong: 'Incorrect code, please try again',
    otpSending: 'Sending...',
    emailNotConfirmed: 'Please confirm your email first',
    wrongCredentials: 'Invalid email or password',
    cities: ['Riyadh','Jeddah','Mecca','Medina','Dammam','Khobar','Tabuk','Abha','Qassim','Hail','Jazan','Najran'],
  },
  zh: {
    buyerTitle: '欢迎来到Maabar', buyerSub: '从认证中国供应商采购',
    supplierTitle: '加入成为供应商', supplierSub: '开始向沙特市场销售',
    email: '电子邮件', pass: '密码',
    firstName: '名', lastName: '姓',
    phone: '电话', city: '城市',
    companyName: '公司/商业名称（可选）',
    supCompany: '公司名称', whatsapp: 'WhatsApp（可选）', wechat: 'WeChat *',
    payMethod: '收款方式 *', alipay: 'Alipay', swift: '银行转账 (SWIFT)',
    alipayAccount: 'Alipay账号 *', swiftCode: 'SWIFT代码 *', bankName: '银行名称 *',
    tradeLink: '阿里巴巴店铺或网站链接（可选）', regNum: '公司注册号 *',
    country: '国家', supCity: '城市',
    speciality: '专业领域',
    yearsExp: '从业年限 *', employees: '员工人数（可选）',
    businessLicense: '营业执照或身份证照片 *', factoryPhoto: '工厂或仓库照片 *',
    uploading: '上传中...', uploaded: '已上传 ✓',
    signin: '登录', signup: '创建账户',
    toSignup: '没有账户？', toSignupLink: '立即注册',
    toSignin: '已有账户？', toSigninLink: '登录',
    back: '返回', buyerInfo: '您的信息', supInfo: '公司信息',
    fillRequired: '请填写必填项',
    termsLabel: '我同意',
    termsLink: '条款与条件',
    mustAgreeTerms: '您必须同意条款与条件',
    pendingMsg: '我们已收到您的申请。请检查您的电子邮件以激活账户。',
    googleLogin: '使用Google登录',
    otpTitle: '验证手机号',
    otpSub: '我们已向您的号码发送验证码',
    otpPlaceholder: '输入6位验证码',
    otpVerify: '验证',
    otpResend: '重新发送',
    otpResendIn: '重新发送（',
    otpWrong: '验证码错误，请重试',
    otpSending: '发送中...',
    emailNotConfirmed: '请先确认您的电子邮件',
    wrongCredentials: '电子邮件或密码错误',
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
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // OTP state (buyer signup only)
  const [otpScreen, setOtpScreen]       = useState(false);
  const [otpInput, setOtpInput]         = useState('');
  const [otpCode, setOtpCode]           = useState('');
  const [otpTimer, setOtpTimer]         = useState(0);
  const [otpError, setOtpError]         = useState('');
  const [pendingSignup, setPendingSignup] = useState(null); // stores {data, profileData} for after OTP
  const timerRef = useRef(null);

  // Buyer fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [phone, setPhone]         = useState('');
  const [city, setCity]           = useState('');
  const [companyName, setCompanyName] = useState('');

  // Supplier fields
  const [supCompany, setSupCompany]   = useState('');
  const [whatsapp, setWhatsapp]       = useState('');
  const [wechat, setWechat]           = useState('');
  const [payMethod, setPayMethod]     = useState('');
  const [alipayAccount, setAlipayAccount] = useState('');
  const [swiftCode, setSwiftCode]     = useState('');
  const [bankName, setBankName]       = useState('');
  const [tradeLink, setTradeLink]     = useState('');
  const [regNum, setRegNum]           = useState('');
  const [country, setCountry]         = useState('');
  const [supCity, setSupCity]         = useState('');
  const [speciality, setSpeciality]   = useState('');
  const [yearsExp, setYearsExp]       = useState('');
  const [employees, setEmployees]     = useState('');
  const [licenseUrl, setLicenseUrl]   = useState('');
  const [factoryUrl, setFactoryUrl]   = useState('');
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingFactory, setUploadingFactory] = useState(false);

  const doSignIn = async () => {
    if (!email || !pass) { setMsg(l.fillRequired); setMsgType('error'); return; }
    setLoading(true);
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    setLoading(false);
    if (error) {
      const m = error.message.toLowerCase();
      if (m.includes('email not confirmed')) {
        setMsg(l.emailNotConfirmed);
      } else if (m.includes('invalid login credentials') || m.includes('invalid email or password')) {
        setMsg(l.wrongCredentials);
      } else {
        setMsg(error.message);
      }
      setMsgType('error');
      return;
    }
    setUser(data.user);
    const { data: profile } = await sb.from('profiles').select('*').eq('id', data.user.id).single();
    if (profile) setProfile(profile);
    const draft = sessionStorage.getItem('maabar_request_draft');
    const hasDraft = draft && (() => { try { const d = JSON.parse(draft); return d.title_ar || d.title_en; } catch { return false; } })();
    nav(hasDraft ? '/requests' : '/dashboard');
  };

  // OTP helpers
  const startTimer = () => {
    setOtpTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setOtpTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const sendOtp = async (phoneNumber) => {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    setOtpCode(code);
    try {
      const formData = new URLSearchParams();
      formData.append('AppSid', UNIFONIC_APP_SID || '');
      formData.append('SenderID', 'Maabar');
      formData.append('Body', `رمز التحقق من مَعبر: ${code}`);
      formData.append('Recipient', phoneNumber.replace(/^0/, '966'));
      await fetch('https://el.cloud.unifonic.com/rest/SMS/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });
    } catch (e) {
      console.error('Unifonic error:', e);
    }
    startTimer();
  };

  const verifyOtp = async () => {
    if (otpInput.trim() !== otpCode) {
      setOtpError(l.otpWrong);
      return;
    }
    setOtpError('');
    if (!pendingSignup) return;
    const { authData, profileData } = pendingSignup;
    await sb.from('profiles').upsert(profileData, { onConflict: 'id' });
    // Send welcome email
    try {
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ type: 'trader_welcome', record: { id: authData.user.id, email: authData.user.email } }),
      });
    } catch (e) { console.error('email error:', e); }
    setUser(authData.user);
    const { data: profile } = await sb.from('profiles').select('*').eq('id', authData.user.id).single();
    if (profile) setProfile(profile);
    const draft = sessionStorage.getItem('maabar_request_draft');
    const hasDraft = draft && (() => { try { const d = JSON.parse(draft); return d.title_ar || d.title_en; } catch { return false; } })();
    nav(hasDraft ? '/requests' : '/dashboard');
  };

  const uploadSupplierDoc = async (file, type) => {
    if (!file) return null;
    const setter = type === 'license' ? setUploadingLicense : setUploadingFactory;
    setter(true);
    const path = `${Date.now()}_${type}.${file.name.split('.').pop()}`;
    const { error } = await sb.storage.from('supplier-docs').upload(path, file, { upsert: true });
    setter(false);
    if (error) { console.error('upload error:', error); return null; }
    const { data: { publicUrl } } = sb.storage.from('supplier-docs').getPublicUrl(path);
    return publicUrl;
  };

  const doSignUp = async () => {
    if (!email || !pass) { setMsg(l.fillRequired); setMsgType('error'); return; }
    if (mode === 'signup' && !agreedTerms) { setMsg(l.mustAgreeTerms); setMsgType('error'); return; }
    if (!isSupplier && (!firstName || !lastName || !phone || !city)) { setMsg(l.fillRequired); setMsgType('error'); return; }
    if (isSupplier && (!supCompany || !wechat || !payMethod || !yearsExp || !regNum || !licenseUrl || !factoryUrl)) {
      setMsg(l.fillRequired); setMsgType('error'); return;
    }
    if (isSupplier && payMethod === 'alipay' && !alipayAccount) { setMsg(l.fillRequired); setMsgType('error'); return; }
    if (isSupplier && payMethod === 'swift' && (!swiftCode || !bankName)) { setMsg(l.fillRequired); setMsgType('error'); return; }
    setLoading(true);
    const metaData = {
      role, status: isSupplier ? 'pending' : 'active',
      ...(!isSupplier && { full_name: `${firstName} ${lastName}`, phone, city, company_name: companyName }),
      ...(isSupplier && { company_name: supCompany, whatsapp, wechat, pay_method: payMethod, reg_number: regNum, trade_link: tradeLink, speciality, license_photo: licenseUrl, factory_photo: factoryUrl, alipay_account: payMethod === 'alipay' ? alipayAccount : null, swift_code: payMethod === 'swift' ? swiftCode : null, bank_name: payMethod === 'swift' ? bankName : null }),
    };
    const { data, error } = await sb.auth.signUp({ email, password: pass, options: { emailRedirectTo: 'https://maabar.io/dashboard', data: metaData } });
    setLoading(false);
    if (error) { setMsg(error.message); setMsgType('error'); return; }
    const profileData = {
      id: data.user.id, role,
      status: isSupplier ? 'pending' : 'active',
      ...(!isSupplier && { full_name: `${firstName} ${lastName}`, phone, city, company_name: companyName }),
      ...(isSupplier && {
        company_name: supCompany, whatsapp, wechat,
        pay_method: payMethod,
        alipay_account: payMethod === 'alipay' ? alipayAccount : null,
        swift_code: payMethod === 'swift' ? swiftCode : null,
        bank_name: payMethod === 'swift' ? bankName : null,
        trade_link: tradeLink, reg_number: regNum,
        country, city: supCity, speciality,
        years_experience: yearsExp ? parseInt(yearsExp) : null,
        employees_count: employees ? parseInt(employees) : null,
        license_photo: licenseUrl,
        factory_photo: factoryUrl,
      }),
    };
    if (isSupplier) {
      await sb.from('profiles').upsert(profileData, { onConflict: 'id' });
      // Send supplier welcome + admin alert emails
      try {
        await Promise.all([
          fetch(SEND_EMAILS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ type: 'supplier_welcome', record: { id: data.user.id, email: data.user.email } }),
          }),
          fetch(SEND_EMAILS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ type: 'admin_new_supplier', to: 'info@maabar.io', data: { companyName: supCompany, email: data.user.email, whatsapp, wechat, payMethod } }),
          }),
        ]);
      } catch (e) { console.error('email error:', e); }
      setMsg(l.pendingMsg);
      setMsgType('success');
      return;
    }
    // Buyer: email confirmation required
    setMsg(
      lang === 'ar' ? 'أرسلنا رسالة تأكيد لبريدك الإلكتروني. افتحها واضغط على الرابط للمتابعة.' :
      lang === 'zh' ? '确认邮件已发送至您的邮箱，请点击邮件中的链接继续。' :
      'We sent a confirmation email. Please click the link to continue.'
    );
    setMsgType('ok');
  };

  const doGoogleLogin = async () => {
    const redirectTo = process.env.NODE_ENV === 'development'
      ? window.location.origin + '/dashboard'
      : 'https://maabar.io/dashboard';
    await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo }
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

        {/* OTP Screen */}
        {otpScreen ? (
          <div>
            <h2 style={{ fontSize: isAr ? 22 : 24, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {l.otpTitle}
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {l.otpSub}
            </p>
            {otpError && (
              <div style={{ fontSize: 13, marginBottom: 16, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'rgba(138,58,58,0.12)', color: '#a07070', border: '1px solid rgba(138,58,58,0.2)', textAlign: 'center', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {otpError}
              </div>
            )}
            <div style={{ marginBottom: 20 }}>
              <input
                style={{ ...inputStyle, fontSize: 22, letterSpacing: 8, textAlign: 'center' }}
                type="text" maxLength={6} dir="ltr"
                placeholder="______"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </div>
            <button onClick={verifyOtp} disabled={otpInput.length < 6} style={{
              width: '100%', background: 'rgba(255,255,255,0.88)', color: '#0a0a0b',
              border: 'none', padding: '14px', fontSize: 14, fontWeight: 500,
              cursor: otpInput.length < 6 ? 'not-allowed' : 'pointer',
              opacity: otpInput.length < 6 ? 0.5 : 1,
              borderRadius: 'var(--radius-md)', transition: 'all 0.2s', minHeight: 48,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {l.otpVerify}
            </button>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              {otpTimer > 0 ? (
                <p style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {l.otpResendIn} {otpTimer}s
                </p>
              ) : (
                <button onClick={async () => { setOtpInput(''); setOtpError(''); await sendOtp(phone); }} style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)',
                  fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                }}>
                  {l.otpResend}
                </button>
              )}
            </div>
          </div>
        ) : null}

        {/* If supplier pending — stop here */}
        {!otpScreen && isSupplier && msg && msgType === 'success' ? null : !otpScreen && (
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
                    <label style={labelStyle}>{l.wechat}</label>
                    <input style={inputStyle} value={wechat} onChange={e => setWechat(e.target.value)} dir="ltr" placeholder="WeChat ID" />
                  </div>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.whatsapp}</label>
                    <input style={inputStyle} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+..." dir="ltr" />
                  </div>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.speciality} *</label>
                  <select style={{ ...inputStyle, cursor: 'pointer' }} value={speciality} onChange={e => setSpeciality(e.target.value)}>
                    <option value="">{isAr ? 'اختر تخصصك' : lang === 'zh' ? '选择专业' : 'Select specialty'}</option>
                    {SPECIALITIES.map(s => (
                      <option key={s.val} value={s.val}>
                        {lang === 'zh' ? s.zh : lang === 'en' ? s.en : s.ar}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.payMethod}</label>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    {['alipay', 'swift'].map(m => (
                      <button key={m} type="button" onClick={() => setPayMethod(m)} style={{
                        flex: 1, padding: '10px',
                        background: payMethod === m ? 'var(--bg-raised)' : 'transparent',
                        border: '1px solid',
                        borderColor: payMethod === m ? 'var(--border-strong)' : 'var(--border-subtle)',
                        color: payMethod === m ? 'var(--text-primary)' : 'var(--text-disabled)',
                        fontSize: 12, cursor: 'pointer',
                        borderRadius: 'var(--radius-md)', transition: 'all 0.15s',
                        minHeight: 40, fontFamily: 'var(--font-sans)',
                      }}>
                        {m === 'alipay' ? l.alipay : l.swift}
                      </button>
                    ))}
                  </div>
                </div>
                {payMethod === 'alipay' && (
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{l.alipayAccount}</label>
                    <input style={inputStyle} value={alipayAccount} onChange={e => setAlipayAccount(e.target.value)} dir="ltr" />
                  </div>
                )}
                {payMethod === 'swift' && (
                  <div style={{ display: 'flex', gap: 14 }}>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.swiftCode}</label>
                      <input style={inputStyle} value={swiftCode} onChange={e => setSwiftCode(e.target.value)} dir="ltr" />
                    </div>
                    <div style={{ ...fieldStyle, flex: 1 }}>
                      <label style={labelStyle}>{l.bankName}</label>
                      <input style={inputStyle} value={bankName} onChange={e => setBankName(e.target.value)} />
                    </div>
                  </div>
                )}
                <div style={{ display: 'flex', gap: 14 }}>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.yearsExp}</label>
                    <input style={inputStyle} type="number" min="0" value={yearsExp} onChange={e => setYearsExp(e.target.value)} dir="ltr" />
                  </div>
                  <div style={{ ...fieldStyle, flex: 1 }}>
                    <label style={labelStyle}>{l.employees}</label>
                    <input style={inputStyle} type="number" min="0" value={employees} onChange={e => setEmployees(e.target.value)} dir="ltr" />
                  </div>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.regNum}</label>
                  <input style={inputStyle} value={regNum} onChange={e => setRegNum(e.target.value)} dir="ltr" />
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.businessLicense}</label>
                  {licenseUrl
                    ? <p style={{ fontSize: 12, color: '#5a9a72', marginTop: 4 }}>{l.uploaded}</p>
                    : (
                      <label style={{
                        display: 'inline-block', marginTop: 6,
                        padding: '8px 16px', fontSize: 12,
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        {uploadingLicense ? l.uploading : (isAr ? 'اختر ملف' : 'Choose File')}
                        <input type="file" accept="image/*,.pdf" style={{ display: 'none' }}
                          onChange={async e => {
                            const url = await uploadSupplierDoc(e.target.files[0], 'license');
                            if (url) setLicenseUrl(url);
                          }} />
                      </label>
                    )}
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.factoryPhoto}</label>
                  {factoryUrl
                    ? <p style={{ fontSize: 12, color: '#5a9a72', marginTop: 4 }}>{l.uploaded}</p>
                    : (
                      <label style={{
                        display: 'inline-block', marginTop: 6,
                        padding: '8px 16px', fontSize: 12,
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        {uploadingFactory ? l.uploading : (isAr ? 'اختر صورة' : 'Choose Image')}
                        <input type="file" accept="image/*" style={{ display: 'none' }}
                          onChange={async e => {
                            const url = await uploadSupplierDoc(e.target.files[0], 'factory');
                            if (url) setFactoryUrl(url);
                          }} />
                      </label>
                    )}
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{l.tradeLink}</label>
                  <input style={inputStyle} value={tradeLink} onChange={e => setTradeLink(e.target.value)} placeholder="https://..." dir="ltr" />
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
                  <button onClick={() => setShowTerms(true)} style={{ color: 'var(--accent)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit', padding: 0 }}>
                    {l.termsLink}
                  </button>
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

    {/* Terms Popup */}
    {showTerms && (
      <div onClick={() => setShowTerms(false)} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}>
        <div onClick={e => e.stopPropagation()} style={{
          background: '#0f0f11', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12, maxWidth: 600, width: '100%', maxHeight: '80vh',
          overflow: 'hidden', display: 'flex', flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: 1, color: '#fff', fontFamily: 'var(--font-ar)', margin: 0 }}>
              {isAr ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </p>
            <button onClick={() => setShowTerms(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
          </div>
          {/* Content */}
          <div style={{ overflowY: 'auto', padding: '24px 28px' }} dir="rtl">
            {TERMS_AR.map((s, i) => (
              <div key={i} style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', fontFamily: 'var(--font-ar)', marginBottom: 8 }}>{s.title}</p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--font-ar)', lineHeight: 1.9, whiteSpace: 'pre-line', margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
          {/* Footer */}
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
