import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import usePageTitle from '../hooks/usePageTitle';
import { getSupplierOnboardingState, getSupplierPrimaryRoute } from '../lib/supplierOnboarding';

const ACCESS_DEADLINE = '2026-04-14T23:59:59Z';

const T = {
  en: {
    journey: ['Founding access', 'Why join early', 'How it works', 'What builds trust', 'Apply before launch'],
    skip: 'Skip to application',
    next: 'Next',
    back: 'Back',
    restart: 'Restart journey',
    currentlyOpen: 'Currently open',
    heroEyebrow: 'Maabar for suppliers',
    heroTitle: 'A clearer path for Chinese suppliers reaching Saudi buyers',
    heroBody: 'Maabar is a Saudi B2B platform connecting Chinese suppliers with Saudi buyers. This page explains the supplier journey clearly: apply once, confirm the email, wait in a visible review-status page, and sign in directly once approved.',
    heroCardTitle: 'Built around a supplier-first onboarding flow',
    heroCardBody: 'The first step stays light: basic company profile now, deeper verification later, and no duplicate registration loop.',
    heroPills: ['One signup only', 'Alibaba / 1688 / Made-in-China links accepted', 'No payout details at first signup'],
    marketplacesLabel: 'Accepted trade profile examples',
    marketplaces: ['Alibaba store', '1688 page', 'Made-in-China profile', 'Company website'],
    benefitsEyebrow: 'Why suppliers use Maabar',
    benefitsTitle: 'Why this feels clearer than open-listing marketplaces',
    benefitsBody: 'Chinese suppliers want visibility, but they also want clarity. The goal here is clearer Saudi demand, less low-intent noise, and a review flow that is easy to understand.',
    benefits: [
      { title: 'Earlier Saudi positioning', description: 'Approved suppliers prepare their presence before wider supplier onboarding becomes crowded.' },
      { title: 'Cleaner demand signal', description: 'The goal is not mass listing volume. It is curated access around real buyer demand.' },
      { title: 'Arabic–Chinese coordination support', description: 'The product direction is built around cross-language communication and Saudi buyer access.' },
      { title: 'Selective intake builds trust', description: 'A reviewed supplier pool feels safer than a marketplace full of anonymous low-quality listings.' },
    ],
    flowEyebrow: 'How it works',
    flowTitle: 'What the supplier journey looks like, step by step',
    flowBody: 'No second application and no hidden extra signup page. Complete the basic supplier application once, confirm the email, then your account moves into a visible review state while Maabar checks the application. If your account is already approved, you should sign in instead of applying again.',
    steps: [
      { step: '01', title: 'Submit the basic company profile', description: 'Company name, city, country, trade profile link, and optional WeChat / WhatsApp.' },
      { step: '02', title: 'Confirm the email address', description: 'Review does not really start until the submitted email is confirmed.' },
      { step: '03', title: 'Wait in a visible review stage', description: 'After confirmation, the supplier lands on an application-status page instead of a confusing locked dashboard.' },
      { step: '04', title: 'Direct team contact before unlock', description: 'If approved, the team unlocks the full supplier dashboard and buyer-facing access.' },
    ],
    trustEyebrow: 'What builds trust',
    trustTitle: 'The main questions a Chinese supplier wants answered upfront',
    trustBody: 'Suppliers used to Alibaba-style onboarding usually want to know what is required now, what is not required yet, and how the review queue actually works.',
    trustNowTitle: 'Prepare these now',
    trustNowItems: ['Company name that buyers can recognize', 'A real trade profile link or company website', 'City and country of the company', 'Preferred contact method such as WeChat'],
    trustLaterTitle: 'Not required in the first signup',
    trustLaterItems: ['Payout details', 'Full business-license upload', 'Factory photo package', 'Long verification forms'],
    reviewTitle: 'Review expectations',
    reviewItems: ['Manual supplier screening, not instant auto-approval', 'Application status stays visible while you wait', 'Team contact usually happens by email first, then direct follow-up if needed'],
    finalEyebrow: 'Ready to continue?',
    finalTitle: 'Apply if you are new — sign in if your supplier account is already approved',
    finalBody: 'New supplier applications move into review only after real email confirmation. Approved suppliers should return here to sign in directly and open their supplier dashboard.',
    deadlineLabel: 'Time left in current intake',
    days: 'Days',
    hours: 'Hours',
    minutes: 'Minutes',
    finalChecklist: ['Shared signup only', 'No payout setup at first signup', 'Pending review after email confirmation'],
    applyNow: 'Apply now',
    applyEarly: 'Apply for early supplier access',
    applyStandard: 'Apply as a supplier',
    continueApplication: 'Continue supplier application',
    viewStatus: 'View application status',
    openDashboard: 'Open supplier dashboard',
    approvedSignIn: 'Approved supplier? Sign in',
  },
  zh: {
    journey: ['首批通道', '为什么要尽早加入', '流程说明', '哪些信息最能建立信任', '在窗口关闭前申请'],
    skip: '直接进入申请',
    next: '下一步',
    back: '返回',
    restart: '重新查看',
    currentlyOpen: '当前开放中',
    heroEyebrow: 'Maabar 供应商入口',
    heroTitle: '给中国供应商一个更清晰的沙特市场入驻路径',
    heroBody: 'Maabar 是一家沙特 B2B 平台，连接中国供应商与沙特买家。这个页面会把供应商路径讲清楚：只申请一次、完成邮箱确认、进入明确的审核状态页，审核通过后直接登录后台。',
    heroCardTitle: '围绕供应商真实流程设计',
    heroCardBody: '第一步保持轻量：先提交基础公司资料，深度认证放到后面，不做重复注册和来回跳转。',
    heroPills: ['只需注册一次', '支持 Alibaba / 1688 / Made-in-China 店铺链接', '首次申请不需要收款资料'],
    marketplacesLabel: '可接受的贸易资料链接示例',
    marketplaces: ['Alibaba 店铺', '1688 页面', 'Made-in-China 主页', '公司官网'],
    benefitsEyebrow: '为什么供应商会用 Maabar',
    benefitsTitle: '为什么这比开放式平台更清楚',
    benefitsBody: '中国供应商会关注曝光，但更看重规则是否清楚。这里强调的是更明确的沙特买家需求、更少低质量噪音，以及容易理解的审核流程。',
    benefits: [
      { title: '更早占位沙特买家需求', description: '审核通过的供应商可以在更大规模开放前先建立展示位置。' },
      { title: '需求信号更干净', description: '目标不是堆积供应商数量，而是围绕真实买家需求做精选引入。' },
      { title: '支持阿拉伯语与中文协同', description: '产品方向本身就考虑了跨语言沟通与沙特买家协作。' },
      { title: '精选审核更容易建立信任', description: '相比匿名、质量参差的平台，经过筛选的供应商池更可信。' },
    ],
    flowEyebrow: '流程说明',
    flowTitle: '供应商实际会经历的步骤',
    flowBody: '不会有第二套注册，也不会让您重复填表。基础供应商申请只提交一次，确认邮箱后，账户会进入明确可见的审核状态，等待 Maabar 团队审核。如果您的账户已经获批，就应直接登录，而不是重新申请。',
    steps: [
      { step: '01', title: '提交基础公司资料', description: '公司名称、所在国家和城市、贸易资料链接，以及可选的 WeChat / WhatsApp。' },
      { step: '02', title: '先完成邮箱确认', description: '只有邮箱确认完成后，团队审核才会真正开始。' },
      { step: '03', title: '进入清晰可见的待审核页面', description: '确认后会进入申请状态页，而不是看到一个莫名其妙被锁住的后台。' },
      { step: '04', title: '团队联系后再解锁完整权限', description: '审核通过后，完整供应商后台和买家侧可见权限才会开放。' },
    ],
    trustEyebrow: '哪些信息最能建立信任',
    trustTitle: '中国供应商通常最想先确认的几点',
    trustBody: '熟悉 Alibaba 式入驻的供应商，通常最关心：现在到底要提交什么、哪些资料暂时不用交、审核过程是否透明。',
    trustNowTitle: '现在建议准备',
    trustNowItems: ['买家能识别的公司名称', '真实可打开的店铺链接或公司官网', '公司所在城市和国家', '优先联系渠道，例如 WeChat'],
    trustLaterTitle: '首次申请暂时不需要',
    trustLaterItems: ['收款资料', '完整营业执照上传', '整套工厂照片', '很长的认证表单'],
    reviewTitle: '审核预期',
    reviewItems: ['不是即时自动通过，而是人工筛选', '等待期间会有明确的状态页', '通常会先通过邮箱联系，需要时再进一步跟进'],
    finalEyebrow: '准备继续？',
    finalTitle: '新供应商请申请，已批准账户请直接登录',
    finalBody: '新申请只有在邮箱真实确认后才会进入审核。已经批准的供应商应从这里直接登录并打开供应商后台。',
    deadlineLabel: '当前入驻窗口剩余时间',
    days: '天',
    hours: '小时',
    minutes: '分钟',
    finalChecklist: ['统一申请页，只填一次', '首次申请不需要收款设置', '邮箱确认后进入待审核状态'],
    applyNow: '立即申请',
    applyEarly: '申请早期供应商通道',
    applyStandard: '申请成为供应商',
    continueApplication: '继续完成申请',
    viewStatus: '查看审核状态',
    openDashboard: '打开供应商后台',
    approvedSignIn: '已批准供应商？直接登录',
  },
  ar: {
    journey: ['وصول تأسيسي', 'لماذا الانضمام المبكر', 'كيف تعمل الرحلة', 'ما الذي يبني الثقة', 'قدّم قبل الإطلاق'],
    skip: 'انتقل إلى الطلب',
    next: 'التالي',
    back: 'رجوع',
    restart: 'ابدأ من جديد',
    currentlyOpen: 'مفتوح حالياً',
    heroEyebrow: 'مَعبر للموردين',
    heroTitle: 'مسار أوضح للمورد الصيني للوصول إلى المشتري السعودي',
    heroBody: 'مَعبر منصة سعودية B2B تربط الموردين الصينيين بالمشترين السعوديين. هذه الصفحة تشرح الرحلة بوضوح: تقديم واحد فقط، ثم تأكيد البريد، ثم صفحة حالة طلب واضحة، وبعد الموافقة يكون الدخول المباشر إلى لوحة المورد.',
    heroCardTitle: 'الرحلة مبنية بما يناسب المورد أولاً',
    heroCardBody: 'الخطوة الأولى خفيفة: بيانات شركة أساسية الآن، والتحقق الأعمق لاحقاً، بدون تسجيل مكرر أو دوّامة صفحات.',
    heroPills: ['تسجيل واحد فقط', 'روابط Alibaba / 1688 / Made-in-China مقبولة', 'لا توجد بيانات استلام أرباح في التسجيل الأول'],
    marketplacesLabel: 'أمثلة الروابط المقبولة',
    marketplaces: ['متجر Alibaba', 'صفحة 1688', 'حساب Made-in-China', 'الموقع الرسمي للشركة'],
    benefitsEyebrow: 'لماذا يستخدم المورد مَعبر',
    benefitsTitle: 'ما الذي يجعل هذه الرحلة أوضح من المنصات المفتوحة',
    benefitsBody: 'المورد الصيني يهتم بالظهور، لكنه يهتم أكثر بوضوح القواعد. هنا التركيز على طلب سعودي أوضح، وضوضاء أقل، ومسار مراجعة مفهوم من البداية.',
    benefits: [
      { title: 'تموضع أبكر أمام الطلب السعودي', description: 'الموردون الموافق عليهم يجهزون حضورهم قبل التوسع الأوسع للموردين.' },
      { title: 'إشارة طلب أنظف', description: 'الهدف ليس حشد أكبر عدد من الحسابات، بل وصول منتقى حول طلبات فعلية.' },
      { title: 'دعم للتنسيق العربي–الصيني', description: 'اتجاه المنتج مبني من الأصل على دعم التواصل بين المشترين السعوديين والموردين الصينيين.' },
      { title: 'الانتقائية ترفع الثقة', description: 'مجمّع موردين مراجَع بعناية يبدو أكثر مصداقية من سوق مفتوح مليء بالحسابات المجهولة.' },
    ],
    flowEyebrow: 'كيف تعمل الرحلة',
    flowTitle: 'ماذا سيرى المورد خطوة بخطوة',
    flowBody: 'لا يوجد تسجيل ثانٍ ولا نماذج مكررة. ترسل طلب المورد الأساسي مرة واحدة، تؤكد البريد الإلكتروني، ثم ينتقل الحساب إلى حالة مراجعة واضحة حتى يراجع الفريق الطلب. وإذا كان حسابك معتمداً بالفعل فيفترض أن تسجّل الدخول مباشرة بدلاً من إعادة التقديم.',
    steps: [
      { step: '01', title: 'أرسل بيانات الشركة الأساسية', description: 'اسم الشركة، الدولة والمدينة، رابط المتجر أو الموقع، ووسائل تواصل اختيارية مثل WeChat وWhatsApp.' },
      { step: '02', title: 'أكّد البريد الإلكتروني أولاً', description: 'المراجعة لا تبدأ فعلياً قبل تأكيد البريد المرسل في الطلب.' },
      { step: '03', title: 'ادخل إلى صفحة حالة واضحة', description: 'بعد التأكيد، ينتقل المورد إلى صفحة حالة الطلب بدلاً من لوحة مقفلة ومربكة.' },
      { step: '04', title: 'يتواصل الفريق قبل فتح الوصول الكامل', description: 'بعد الموافقة، تُفتح لوحة المورد الكاملة والوصول المرتبط بالمشترين.' },
    ],
    trustEyebrow: 'ما الذي يبني الثقة',
    trustTitle: 'أهم ما يريد المورد الصيني فهمه من البداية',
    trustBody: 'المورد المعتاد على نمط Alibaba يريد أن يعرف بسرعة: ماذا أرسل الآن، ماذا لا أحتاجه بعد، وكيف تتم المراجعة فعلياً.',
    trustNowTitle: 'حضّر هذه المعلومات الآن',
    trustNowItems: ['اسم شركة واضح يمكن للمشتري التعرّف عليه', 'رابط متجر حقيقي أو موقع رسمي', 'مدينة ودولة الشركة', 'وسيلة تواصل مفضلة مثل WeChat'],
    trustLaterTitle: 'غير مطلوب في التسجيل الأول',
    trustLaterItems: ['بيانات استلام الأرباح', 'رفع الرخصة التجارية كاملة', 'باقة صور المصنع', 'نماذج تحقق طويلة'],
    reviewTitle: 'توقعات المراجعة',
    reviewItems: ['مراجعة يدوية وليست قبولاً آلياً فورياً', 'حالة الطلب تبقى ظاهرة أثناء الانتظار', 'التواصل يبدأ غالباً عبر البريد ثم متابعة مباشرة عند الحاجة'],
    finalEyebrow: 'جاهز تكمّل؟',
    finalTitle: 'إذا كنت جديداً فابدأ الطلب — وإذا كان حسابك معتمداً فسجّل الدخول',
    finalBody: 'طلبات الموردين الجديدة لا تدخل المراجعة إلا بعد تأكيد البريد فعلياً. أما الموردون الموافق عليهم فيفترض أن يعودوا من هنا إلى تسجيل الدخول المباشر وفتح لوحة المورد.',
    deadlineLabel: 'الوقت المتبقي في نافذة القبول الحالية',
    days: 'أيام',
    hours: 'ساعات',
    minutes: 'دقائق',
    finalChecklist: ['تسجيل موحّد مرة واحدة', 'لا توجد بيانات payout في التسجيل الأول', 'الحساب يدخل المراجعة بعد تأكيد البريد'],
    applyNow: 'قدّم الآن',
    applyEarly: 'قدّم للوصول المبكر',
    applyStandard: 'قدّم كمورد',
    continueApplication: 'أكمل طلب المورد',
    viewStatus: 'عرض حالة الطلب',
    openDashboard: 'افتح لوحة المورد',
    approvedSignIn: 'حسابك معتمد؟ سجّل الدخول',
  },
};

function getTimeLeft() {
  const diff = new Date(ACCESS_DEADLINE).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, expired: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    expired: false,
  };
}

function CountUnit({ label, value }) {
  return (
    <div className="supplier-count-unit">
      <div className="supplier-count-value">{String(value).padStart(2, '0')}</div>
      <div className="supplier-count-label">{label}</div>
    </div>
  );
}

export default function SupplierAccess({ user, profile, lang = 'en' }) {
  const copy = T[lang] || T.en;
  const isAr = lang === 'ar';
  const pageDir = isAr ? 'rtl' : 'ltr';
  usePageTitle('supplier-access', lang);

  const nav = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const supplierState = profile?.role === 'supplier' ? getSupplierOnboardingState(profile, user) : null;
  const supplierPrimaryRoute = supplierState ? getSupplierPrimaryRoute(profile, user) : '/login/supplier?mode=signup';
  const hasExistingSupplierAccount = Boolean(user && profile?.role === 'supplier');
  const totalScenes = 5;
  const sceneProgress = ((activeScene + 1) / totalScenes) * 100;

  const ctaCopy = useMemo(() => {
    if (supplierState?.isApprovedStage || supplierState?.isInactiveStage) return copy.openDashboard;
    if (supplierState?.isUnderReviewStage) return copy.viewStatus;
    if (supplierState?.isApplicationStage) return copy.continueApplication;
    return timeLeft.expired ? copy.applyStandard : copy.applyEarly;
  }, [copy, supplierState, timeLeft.expired]);

  const finalApplyLabel = hasExistingSupplierAccount ? ctaCopy : copy.applyNow;
  const goToApply = () => nav(supplierPrimaryRoute);
  const goToSignIn = () => nav('/login/supplier');

  return (
    <div dir={pageDir} lang={lang} className={`supplier-access-page supplier-scene-${activeScene}`}>
      <div className="supplier-access-topbar">
        <div className="supplier-access-shell supplier-access-topbar-inner">
          <BrandLogo as="button" size="sm" align={isAr ? 'flex-end' : 'flex-start'} onClick={() => nav('/')} />
          <div className="supplier-topbar-actions">
            <button onClick={goToSignIn} className="supplier-secondary-btn">{copy.approvedSignIn}</button>
            <button onClick={goToApply} className="supplier-primary-btn">{copy.skip}</button>
          </div>
        </div>
      </div>

      <main className="supplier-access-main">
        <div className="supplier-access-shell">
          <div className="supplier-journey-progress-wrap">
            <div className="supplier-journey-progress-bar">
              <div className="supplier-journey-progress-fill" style={{ width: `${sceneProgress}%` }} />
            </div>
            <div className="supplier-journey-progress-meta">
              <span>{copy.journey[activeScene]}</span>
              <span>{activeScene + 1} / {totalScenes}</span>
            </div>
          </div>

          <div className="supplier-journey-stage">
            {activeScene === 0 && (
              <section className="supplier-scene supplier-scene-hero supplier-scene-enter">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">{copy.heroEyebrow}</div>
                  <h1 className="supplier-scene-title supplier-scene-title-hero">{copy.heroTitle}</h1>
                  <p className="supplier-scene-description supplier-scene-description-large">{copy.heroBody}</p>

                  <div className="supplier-pill-row">
                    {copy.heroPills.map((item) => <span key={item} className="supplier-pill">{item}</span>)}
                  </div>

                  <div className="supplier-marketplace-wrap">
                    <div className="supplier-mini-label">{copy.marketplacesLabel}</div>
                    <div className="supplier-marketplace-row">
                      {copy.marketplaces.map((item) => <span key={item} className="supplier-marketplace-badge">{item}</span>)}
                    </div>
                  </div>
                </div>

                <div className="supplier-side-stack">
                  <div className="supplier-scene-sidecard">
                    <div className="supplier-sidecard-label">{copy.currentlyOpen}</div>
                    <div className="supplier-sidecard-title">{copy.heroCardTitle}</div>
                    <div className="supplier-sidecard-text">{copy.heroCardBody}</div>
                  </div>

                  <div className="supplier-summary-card">
                    {copy.finalChecklist.map((item) => (
                      <div key={item} className="supplier-summary-row">
                        <span className="supplier-summary-dot" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            )}

            {activeScene === 1 && (
              <section className="supplier-scene supplier-scene-enter">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">{copy.benefitsEyebrow}</div>
                  <h2 className="supplier-scene-title">{copy.benefitsTitle}</h2>
                  <p className="supplier-scene-description">{copy.benefitsBody}</p>
                </div>

                <div className="supplier-card-grid">
                  {copy.benefits.map((item) => (
                    <div key={item.title} className="supplier-feature-card">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeScene === 2 && (
              <section className="supplier-scene supplier-scene-enter">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">{copy.flowEyebrow}</div>
                  <h2 className="supplier-scene-title">{copy.flowTitle}</h2>
                  <p className="supplier-scene-description">{copy.flowBody}</p>
                </div>

                <div className="supplier-steps-grid">
                  {copy.steps.map((item) => (
                    <div key={item.step} className="supplier-step-card">
                      <div className="supplier-step-number">{item.step}</div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeScene === 3 && (
              <section className="supplier-scene supplier-scene-enter">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">{copy.trustEyebrow}</div>
                  <h2 className="supplier-scene-title">{copy.trustTitle}</h2>
                  <p className="supplier-scene-description">{copy.trustBody}</p>
                </div>

                <div className="supplier-trust-grid">
                  <div className="supplier-trust-card">
                    <div className="supplier-trust-title">{copy.trustNowTitle}</div>
                    {copy.trustNowItems.map((item) => (
                      <div key={item} className="supplier-summary-row">
                        <span className="supplier-summary-dot" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="supplier-trust-card">
                    <div className="supplier-trust-title">{copy.trustLaterTitle}</div>
                    {copy.trustLaterItems.map((item) => (
                      <div key={item} className="supplier-summary-row">
                        <span className="supplier-summary-dot" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="supplier-trust-card supplier-trust-card-wide">
                    <div className="supplier-trust-title">{copy.reviewTitle}</div>
                    <div className="supplier-review-grid">
                      {copy.reviewItems.map((item) => (
                        <div key={item} className="supplier-review-item">{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeScene === 4 && (
              <section className="supplier-scene supplier-scene-final supplier-scene-enter">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">{copy.finalEyebrow}</div>
                  <h2 className="supplier-scene-title">{copy.finalTitle}</h2>
                  <p className="supplier-scene-description">{copy.finalBody}</p>
                </div>

                <div className="supplier-mini-label">{copy.deadlineLabel}</div>
                <div className="supplier-countdown-row">
                  <CountUnit label={copy.days} value={timeLeft.days} />
                  <CountUnit label={copy.hours} value={timeLeft.hours} />
                  <CountUnit label={copy.minutes} value={timeLeft.minutes} />
                </div>

                <div className="supplier-summary-card supplier-summary-card-center">
                  {copy.finalChecklist.map((item) => (
                    <div key={item} className="supplier-summary-row">
                      <span className="supplier-summary-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="supplier-journey-footer">
            <div className="supplier-scene-dots" aria-label="Supplier journey steps">
              {Array.from({ length: totalScenes }).map((_, index) => (
                <button
                  key={`scene-dot-${index}`}
                  onClick={() => setActiveScene(index)}
                  className={`supplier-scene-dot${index === activeScene ? ' active' : ''}`}
                  aria-label={`${copy.journey[index]} ${index + 1}`}
                />
              ))}
            </div>

            <div className="supplier-footer-actions">
              {activeScene > 0 ? (
                <button onClick={() => setActiveScene((prev) => Math.max(prev - 1, 0))} className="supplier-secondary-btn">
                  {copy.back}
                </button>
              ) : <span />}

              <div className="supplier-footer-cta-wrap">
                {activeScene === totalScenes - 1 ? (
                  <>
                    <button onClick={() => setActiveScene(0)} className="supplier-secondary-btn">{copy.restart}</button>
                    {!hasExistingSupplierAccount ? (
                      <button onClick={goToSignIn} className="supplier-secondary-btn">{copy.approvedSignIn}</button>
                    ) : null}
                    <button onClick={goToApply} className="supplier-primary-btn">{finalApplyLabel}</button>
                  </>
                ) : (
                  <button onClick={() => setActiveScene((prev) => Math.min(prev + 1, totalScenes - 1))} className="supplier-primary-btn">
                    {copy.next}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .supplier-access-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 28%),
            radial-gradient(circle at bottom right, rgba(255,255,255,0.04), transparent 24%),
            var(--bg-base);
          color: var(--text-primary);
        }
        .supplier-access-shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 20px;
        }
        .supplier-access-topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10,10,11,0.84);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--border-subtle);
        }
        .supplier-access-topbar-inner {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .supplier-topbar-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .supplier-access-main {
          min-height: calc(100vh - 72px);
          display: flex;
          align-items: center;
          padding: 30px 0 34px;
        }
        .supplier-primary-btn,
        .supplier-secondary-btn {
          border-radius: 14px;
          padding: 13px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 180ms ease, opacity 180ms ease, background 180ms ease, border-color 180ms ease;
        }
        .supplier-primary-btn:hover,
        .supplier-secondary-btn:hover {
          transform: translateY(-1px);
        }
        .supplier-primary-btn {
          background: var(--text-primary);
          color: var(--bg-base);
          border: none;
        }
        .supplier-secondary-btn {
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--border-default);
        }
        .supplier-journey-progress-wrap {
          margin-bottom: 18px;
        }
        .supplier-journey-progress-bar {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
          margin-bottom: 12px;
        }
        .supplier-journey-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,255,255,0.72), var(--text-primary));
          transition: width 280ms ease;
        }
        .supplier-journey-progress-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }
        .supplier-journey-stage {
          min-height: 64vh;
          border-radius: 30px;
          border: 1px solid var(--border-subtle);
          background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015));
          box-shadow: 0 34px 90px rgba(0,0,0,0.22);
          overflow: hidden;
        }
        .supplier-scene {
          min-height: 64vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 24px;
          padding: 46px;
        }
        .supplier-scene-enter {
          animation: supplierSceneEnter 340ms ease;
        }
        .supplier-scene-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) minmax(290px, 0.85fr);
          gap: 24px;
          align-items: center;
        }
        .supplier-side-stack {
          display: grid;
          gap: 14px;
        }
        .supplier-scene-eyebrow,
        .supplier-mini-label,
        .supplier-sidecard-label,
        .supplier-step-number {
          color: var(--text-tertiary);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
        }
        .supplier-scene-title {
          font-size: clamp(2rem, 3vw, 3.1rem);
          line-height: 1.03;
          letter-spacing: -0.05em;
          margin: 0 0 14px;
        }
        .supplier-scene-title-hero {
          font-size: clamp(2.25rem, 4vw, 3.85rem);
        }
        .supplier-scene-description {
          color: var(--text-secondary);
          font-size: 16px;
          line-height: 1.75;
          margin: 0;
          max-width: 760px;
        }
        .supplier-scene-description-large {
          font-size: 17px;
        }
        .supplier-pill-row,
        .supplier-marketplace-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .supplier-pill-row {
          margin-top: 18px;
        }
        .supplier-marketplace-wrap {
          margin-top: 18px;
        }
        .supplier-pill,
        .supplier-marketplace-badge {
          padding: 8px 12px;
          border-radius: 999px;
          border: 1px solid var(--border-subtle);
          background: rgba(255,255,255,0.04);
          font-size: 12px;
          color: var(--text-secondary);
        }
        .supplier-scene-sidecard,
        .supplier-summary-card,
        .supplier-feature-card,
        .supplier-step-card,
        .supplier-trust-card,
        .supplier-count-unit,
        .supplier-review-item {
          border-radius: 24px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-muted);
        }
        .supplier-scene-sidecard {
          padding: 24px;
          background: linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.03));
        }
        .supplier-sidecard-title {
          font-size: 23px;
          line-height: 1.15;
          margin: 12px 0;
        }
        .supplier-sidecard-text {
          color: var(--text-secondary);
          font-size: 14px;
          line-height: 1.75;
        }
        .supplier-summary-card {
          padding: 18px 20px;
          display: grid;
          gap: 10px;
        }
        .supplier-summary-card-center {
          width: min(680px, 100%);
          margin: 0 auto;
        }
        .supplier-summary-row {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          color: var(--text-primary);
          line-height: 1.65;
          font-size: 14px;
        }
        .supplier-summary-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--text-primary);
          opacity: 0.75;
          margin-top: 8px;
          flex: 0 0 auto;
        }
        .supplier-card-grid,
        .supplier-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .supplier-feature-card,
        .supplier-step-card,
        .supplier-trust-card {
          padding: 22px;
        }
        .supplier-feature-card h3,
        .supplier-step-card h3,
        .supplier-trust-title {
          margin: 0 0 10px;
          font-size: 18px;
          line-height: 1.25;
        }
        .supplier-feature-card p,
        .supplier-step-card p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.72;
          font-size: 14px;
        }
        .supplier-trust-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }
        .supplier-trust-card-wide {
          grid-column: 1 / -1;
        }
        .supplier-review-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        .supplier-review-item {
          padding: 16px 18px;
          color: var(--text-secondary);
          line-height: 1.7;
          font-size: 14px;
        }
        .supplier-scene-final {
          text-align: center;
          align-items: center;
        }
        .supplier-countdown-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 12px;
        }
        .supplier-count-unit {
          min-width: 98px;
          padding: 18px 14px;
          text-align: center;
        }
        .supplier-count-value {
          font-size: 30px;
          line-height: 1;
          font-weight: 700;
        }
        .supplier-count-label {
          margin-top: 7px;
          font-size: 11px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .supplier-journey-footer {
          display: grid;
          gap: 16px;
          margin-top: 18px;
        }
        .supplier-scene-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
        }
        .supplier-scene-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: none;
          background: rgba(255,255,255,0.18);
          cursor: pointer;
          transition: transform 160ms ease, background 160ms ease;
        }
        .supplier-scene-dot.active {
          background: var(--text-primary);
          transform: scale(1.15);
        }
        .supplier-footer-actions {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
        }
        .supplier-footer-cta-wrap {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }
        @keyframes supplierSceneEnter {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 900px) {
          .supplier-scene-hero,
          .supplier-trust-grid,
          .supplier-footer-actions {
            grid-template-columns: 1fr;
            display: grid;
          }
          .supplier-footer-actions {
            justify-content: stretch;
          }
          .supplier-footer-cta-wrap {
            justify-content: stretch;
          }
          .supplier-footer-cta-wrap .supplier-primary-btn,
          .supplier-footer-cta-wrap .supplier-secondary-btn,
          .supplier-footer-actions > .supplier-secondary-btn {
            width: 100%;
          }
        }
        @media (max-width: 768px) {
          .supplier-scene {
            padding: 28px 20px;
            min-height: auto;
          }
          .supplier-scene-title,
          .supplier-scene-title-hero {
            letter-spacing: -0.03em;
          }
          .supplier-card-grid,
          .supplier-steps-grid,
          .supplier-review-grid,
          .supplier-trust-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
