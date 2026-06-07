import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import IdeaToProduct from '../components/IdeaToProduct';
import Footer from '../components/Footer';
import RoleIntroTour from '../components/RoleIntroTour';

const T = {
  ar: {
    tag: 'الحل لجميع مشاكل استيرادك من الصين',
    title: 'لا تبحث\nمعبر\nيبحث لك',
    mainSub: 'استورد بثقة — بدون وسطاء، بدون مخاطر',
    sub: 'ارفع طلبك فقط، ومعبر يتولى فهمه وترتيبه، ثم يراجعه داخلياً ويطابقه مع الموردين المناسبين ويعيد لك أفضل 3 عروض بشكل واضح داخل نفس صفحة الطلب.',
    cta: 'دع معبر يتولى الطلب',
    reqCta: 'ارفع طلبك بنفسك',
    whyLabel: 'لماذا معبر؟',
    whyTitle: 'لماذا معبر مختلف؟',
    whyIntro: 'معبر لا يضيف طبقة تسويق جديدة فوق الاستيراد. هو ينظّم الطريق بين التاجر السعودي والمورد الصيني المناسب بشكل أوضح وأسرع.',
    strengths: [
      {
        num: '01',
        title: 'أول منصة سعودية تربط التاجر السعودي مباشرة بالمورد الصيني',
        desc: 'الوصول للموردين يتم من خلال منصة سعودية مصممة لاحتياج السوق المحلي، بدون الدوران بين مواقع وأطراف كثيرة.',
      },
      {
        num: '02',
        title: 'موردون معتمدون',
        desc: 'الموردون الذين يستقبلون الطلبات في معبر يمرّون بعملية تحقق قبل الدخول للمنصة.',
        badge: '✓ تحقق ميداني من المصنع',
      },
      {
        num: '03',
        title: 'طلبك يذهب للموردين المناسبين والمنافسة تبدأ عليه',
        desc: 'بدلاً من أن تبحث بنفسك، معبر يوجّه الطلب للجهات المناسبة لتستقبل عروضاً قابلة للمقارنة.',
      },
    ],
    howLabel: 'كيف يعمل',
    howTitle: 'كيف يعمل الطلب المُدار من معبر',
    howIntro: 'الفلو هنا واضح ومقصود: معبر لا يرسل طلبك عشوائياً، بل يمرره عبر AI ثم مراجعة داخلية ثم مطابقة دقيقة قبل أن يعرض لك أفضل 3 خيارات.',
    steps: [
      {
        t: 'ارفع الطلب',
        d: 'أضف المنتج أو التصنيع المطلوب والكمية والمواصفات والأولوية بشكل واضح.',
      },
      {
        t: 'معبر يرتبه ويراجعه',
        d: 'نجهّز طلبك بشكل واضح ونراجعه داخلياً قبل إرساله.',
      },
      {
        t: 'يصل للمورد المناسب فقط',
        d: 'نختار الموردين المطابقين لطلبك ونجمع عروضهم — كل مورد تحقق منه ميدانياً قبل دخوله المنصة.',
      },
      {
        t: 'تستلم العروض المختارة لك',
        d: 'أفضل 3 عروض تظهر لك داخل نفس صفحة الطلب بشكل مرتب وواضح لتختار أو تطلب تفاوضاً إضافياً.',
      },
    ],
    trustLabel: 'مبني على الثقة',
    trustTitle: 'لماذا يمكن الوثوق في معبر؟',
    trustIntro: 'الثقة هنا ليست شعاراً عاماً. هذه هي العناصر التي تحمي الصفقة عملياً.',
    trusts: [
      {
        num: '01',
        t: 'موردون معتمدون',
        d: 'كل مورد داخل المنصة يمر بتحقق قبل أن يبدأ باستقبال الطلبات.',
      },
      {
        num: '02',
        t: 'دفع محمي ومرن',
        d: 'خيارات الدفع مصممة لتمنحك مرونة أكبر وتحكماً أوضح بحسب مستوى راحتك في الصفقة.',
      },
      {
        num: '03',
        t: 'تواصل بدون حاجز اللغة',
        d: 'تستطيع إدارة التواصل بوضوح بدون أن تصبح اللغة عائقاً بينك وبين المورد.',
      },
      {
        num: '04',
        t: 'شفافية أوضح قبل القرار',
        d: 'تفاصيل العرض والتكلفة والخطوات تكون أوضح قبل أن تمضي في الصفقة.',
      },
    ],
    finalCtaLabel: 'ابدأ الآن',
    finalCtaTitle: 'جاهز تبدأ طلباً مُداراً بشكل أوضح؟',
    finalCtaText: 'ابدأ بالمسار المُدار إذا كنت تريد أن يتولى معبر المراجعة والمطابقة والتفاوض، أو افتح المسار المباشر إذا كنت تريد إدارة الطلب بنفسك.',
    finalPrimary: 'دع معبر يتولى الطلب',
    finalSecondary: 'ارفع طلبك بنفسك',
  },
  en: {
    tag: 'Maabar · The Only Platform That Protects Saudi Traders at Every Step',
    title: "Don't Search\nLet the Supplier\nCome to You",
    mainSub: 'Import with confidence — no middlemen, no risks',
    sub: 'Submit the request once and let Maabar structure it, review it internally, match the right suppliers, and return the top 3 offers clearly inside the same request page.',
    cta: 'Let Maabar Handle the Request',
    reqCta: 'Post Your Request Yourself',
    whyLabel: 'Why Maabar?',
    whyTitle: 'Why is Maabar different?',
    whyIntro: 'Maabar is not another marketplace layer. It creates a clearer path between Saudi traders and the right Chinese suppliers.',
    strengths: [
      {
        num: '01',
        title: 'The first Saudi platform connecting Saudi traders directly with Chinese suppliers',
        desc: 'It is built around the Saudi import journey, so traders can source through one local platform instead of bouncing between disconnected channels.',
      },
      {
        num: '02',
        title: 'Verified suppliers',
        desc: 'Suppliers receiving requests on Maabar go through a verification process before joining the platform.',
        badge: '✓ Factory-verified',
      },
      {
        num: '03',
        title: 'Your request goes to relevant suppliers and suppliers compete on it',
        desc: 'Instead of searching one by one, you send one request and receive comparable offers from matching suppliers.',
      },
    ],
    howLabel: 'How it works',
    howTitle: 'How managed sourcing works on Maabar',
    howIntro: 'The managed path is deliberate: AI prepares the request, Maabar reviews it internally, matching suppliers are selected, and the top 3 offers come back in one clear place.',
    steps: [
      {
        t: 'Submit the request',
        d: 'Share the product, quantity, specs, and priority in one clear request.',
      },
      {
        t: 'Maabar prepares and reviews it',
        d: 'We structure your request clearly and review it internally before sending it.',
      },
      {
        t: 'It reaches only the right supplier',
        d: 'We select the suppliers that match your request and gather their offers — every supplier is field-verified before joining the platform.',
      },
      {
        t: 'Receive the selected offers',
        d: 'The best 3 offers are returned inside the same request page so the decision stays clear and structured.',
      },
    ],
    trustLabel: 'Built on trust',
    trustTitle: 'Why should you trust Maabar?',
    trustIntro: 'Trust should be practical, not vague. These are the parts designed to protect the deal.',
    trusts: [
      {
        num: '01',
        t: 'Verified suppliers',
        d: 'Every supplier on the platform is reviewed before they start receiving buyer requests.',
      },
      {
        num: '02',
        t: 'Protected and flexible payment',
        d: 'Payment options are structured to give you more control and more flexibility based on your comfort level.',
      },
      {
        num: '03',
        t: 'Communication without a language barrier',
        d: 'You can move the deal forward clearly without language becoming a blocker between you and the supplier.',
      },
      {
        num: '04',
        t: 'Clearer transparency before you commit',
        d: 'Offer details, costs, and next steps are clearer before you move ahead with a deal.',
      },
    ],
    finalCtaLabel: 'Start now',
    finalCtaTitle: 'Ready to start with managed sourcing?',
    finalCtaText: 'Choose the managed path if you want Maabar to review, match, and negotiate for you, or use the direct path if you want to manage the RFQ yourself.',
    finalPrimary: 'Let Maabar Handle the Request',
    finalSecondary: 'Post Your Request Yourself',
  },
  zh: {
    tag: 'Maabar · 唯一在每一步保护沙特贸易商的平台',
    title: '无需搜索\n让供应商\n主动找您',
    mainSub: '放心进口 — 无中间商，无风险',
    sub: '发布您的需求，认证中国供应商竞相报价 — 按您的信任程度付款，随着每次成功交易增加信任。',
    cta: '将您的想法变成产品',
    reqCta: '发布需求',
    whyLabel: '为什么选择 Maabar？',
    whyTitle: 'Maabar 有什么不同？',
    whyIntro: 'Maabar 不是又一个泛泛的市场平台，它为沙特贸易商和合适的中国供应商之间建立了更清晰的连接路径。',
    strengths: [
      {
        num: '01',
        title: '首个直接连接沙特贸易商与中国供应商的沙特平台',
        desc: '平台围绕沙特进口流程而设计，让贸易商不必在多个零散渠道之间来回寻找。',
      },
      {
        num: '02',
        title: '认证供应商',
        desc: '在 Maabar 接收需求的供应商进入平台前都要经过审核。',
        badge: '✓ 工厂实地核查',
      },
      {
        num: '03',
        title: '您的需求会发送给合适的供应商，并由他们参与报价竞争',
        desc: '您无需逐个寻找，只需提交一次需求，即可收到来自匹配供应商的可比较报价。',
      },
    ],
    howLabel: '如何运作',
    howTitle: 'Maabar 如何运作',
    howIntro: '流程清晰且有条理：我们整理您的需求、进行内部审核、精准匹配供应商，最后把最佳 3 个报价集中呈现。',
    steps: [
      {
        t: '发布您的需求',
        d: '清晰填写所需产品或定制、数量、规格与优先级。',
      },
      {
        t: 'Maabar 整理并审核',
        d: '我们把您的需求整理清晰，并在发送前进行内部审核。',
      },
      {
        t: '仅送达匹配的供应商',
        d: '我们筛选与您需求匹配的供应商并收集其报价——每位供应商在进入平台前都经过工厂实地核查。',
      },
      {
        t: '接收为您筛选的报价',
        d: '最佳 3 个报价会清晰呈现在同一需求页，供您选择或要求进一步谈判。',
      },
    ],
    trustLabel: '建立在信任之上',
    trustTitle: '为什么可以信任 Maabar？',
    trustIntro: '信任不该只是口号，而应体现在真正保护交易的环节里。',
    trusts: [
      {
        num: '01',
        t: '认证供应商',
        d: '平台上的每位供应商在接收买家需求前都会经过审核。',
      },
      {
        num: '02',
        t: '受保护且灵活的付款方式',
        d: '付款安排提供更清晰的控制感和更高的灵活性，方便您按自己的接受程度推进交易。',
      },
      {
        num: '03',
        t: '沟通没有语言障碍',
        d: '您可以更顺畅地推进交易，而不必让语言成为与供应商合作的阻碍。',
      },
      {
        num: '04',
        t: '在决定前获得更清晰的透明度',
        d: '在继续交易之前，报价细节、成本和下一步信息会更清楚。',
      },
    ],
    finalCtaLabel: '立即开始',
    finalCtaTitle: '准备好从托管采购开始了吗？',
    finalCtaText: '如果您希望 Maabar 负责审核、匹配与谈判，请使用托管路径；如果您想自己管理需求，则使用直接发布路径。',
    finalPrimary: '让 Maabar 代您处理需求',
    finalSecondary: '自己发布需求',
  },
};

export default function Home({ lang, user }) {
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  usePageTitle('home', lang);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => () => setIdeaOpen(false), []);

  // Scroll-reveal: fade-in + slide-up once on enter (no libraries).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const els = root.querySelectorAll('.reveal');
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [lang]);

  const arFont = isAr ? { fontFamily: 'var(--font-ar)' } : {};
  const startOptions = [
    {
      key: 'managed',
      eyebrow: isAr ? 'الخيار الموصى به' : lang === 'zh' ? '推荐方式' : 'Recommended path',
      title: isAr ? 'دع معبر يتولى الطلب' : lang === 'zh' ? '让 Maabar 代您处理需求' : 'Let Maabar handle the request',
      text: isAr
        ? 'ارفع الطلب، ومعبر ينظّفه ويطابق الموردين الأنسب ويتفاوض ثم يعرض لك أفضل 3 خيارات داخل نفس صفحة الطلب.'
        : lang === 'zh'
          ? '提交需求后，Maabar 会整理内容、筛选合适供应商、谈判，并把最佳 3 个方案直接放回同一需求页。'
          : 'Submit the need once and Maabar will clean it up, match the right suppliers, negotiate, and return the top 3 inside the same request page.',
      action: isAr ? 'ابدأ الطلب المُدار' : lang === 'zh' ? '开始托管需求' : 'Start managed sourcing',
      onClick: () => nav('/requests?mode=managed'),
      featured: true,
    },
    {
      key: 'direct',
      eyebrow: isAr ? 'للطلبات الواضحة والسريعة' : lang === 'zh' ? '适合明确需求' : 'For clear and fast RFQs',
      title: isAr ? 'ارفع طلبك بنفسك' : lang === 'zh' ? '自己发布需求' : 'Post your request yourself',
      text: isAr
        ? 'إذا كان المنتج واضحاً عندك وتريد عروضاً مباشرة من الموردين، ارفع الطلب القياسي المعتاد.'
        : lang === 'zh'
          ? '如果产品和规格已经清楚，您可以像平常一样直接发布标准需求。'
          : 'If the product is already clear and you want direct supplier quotes, use the standard RFQ path.',
      action: isAr ? 'ارفع طلبك الآن' : lang === 'zh' ? '立即发布需求' : 'Post your request',
      onClick: () => nav('/requests'),
    },
    {
      key: 'idea',
      eyebrow: isAr ? 'للـ OEM / Private Label' : lang === 'zh' ? '适合 OEM / 自有品牌' : 'For OEM / private label',
      title: isAr ? 'حوّل فكرتك إلى منتج' : lang === 'zh' ? '将您的想法变成产品' : 'Turn your idea into a product',
      text: isAr
        ? 'إذا كانت البداية مجرد فكرة أو علامة خاصة، افتح مسار التصنيع حتى يرتب معبر brief أوضح قبل التوريد.'
        : lang === 'zh'
          ? '如果现在只是一个想法或自有品牌方向，请进入制造路径，让 Maabar 先帮您整理更清晰的 brief。'
          : 'If you are starting from an idea or private-label concept, open the manufacturing path so Maabar can structure a clearer brief first.',
      action: isAr ? 'ابدأ مسار المنتج' : lang === 'zh' ? '开始产品路径' : 'Start product path',
      onClick: () => setIdeaOpen(true),
    },
  ];

  return (
    <div ref={rootRef}>
      <RoleIntroTour lang={lang} user={user} />

      <section id="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content reveal">
          <p className="hero-tag">{t.tag}</p>
          {isAr ? (
            <h1 className="hero-title-ar">لا تبحث — معبر يبحث لك</h1>
          ) : (
            <h1 className={`hero-title-${lang === 'zh' ? 'zh' : 'en'}`}>
              {t.title.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  <br />
                </span>
              ))}
            </h1>
          )}
          <p className={`hero-main-sub${isAr ? ' ar' : ''}`}>{t.mainSub}</p>
          <p className={`hero-sub${isAr ? ' ar' : ''}`}>{t.sub}</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => nav('/requests?mode=managed')}>
              {t.cta}
            </button>
            <button className="btn-hero-secondary" onClick={() => nav('/requests')}>
              {t.reqCta}
            </button>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: '-34px auto 0', padding: '0 24px 12px', position: 'relative', zIndex: 2 }}>
        <div style={{
          borderRadius: 'var(--radius-card)',
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          padding: '28px clamp(20px, 4vw, 34px)',
        }}>
          <div className="reveal" style={{ marginBottom: 18 }}>
            <p className="section-label">{isAr ? 'اختر كيف تريد أن تبدأ' : lang === 'zh' ? '选择您希望如何开始' : 'Choose how you want to start'}</p>
            <h2 className="sec-title" style={{ ...arFont, marginBottom: 10 }}>{isAr ? '3 مسارات واضحة حسب نوع طلبك' : lang === 'zh' ? '按需求类型开始的 3 条清晰路径' : '3 clear starting paths depending on your request'}</h2>
            <p className={`section-intro${isAr ? ' ar' : ''}`} style={{ marginBottom: 0 }}>
              {isAr
                ? 'إذا كنت تريد أن يتولى معبر البحث والمطابقة والتفاوض، ابدأ بالمسار المُدار. وإذا كان منتجك واضحاً أو كنت تبني علامة خاصة، لديك المسار المناسب من البداية.'
                : lang === 'zh'
                  ? '如果您希望 Maabar 负责筛选、匹配与谈判，请从托管路径开始。如果产品已经明确，或您要做自有品牌，也有对应的开始方式。'
                  : 'If you want Maabar to take care of sourcing, matching, and negotiation, start with the managed path. If your product is already clear or you are building a private label, the right entry point is ready.'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14 }}>
            {startOptions.map((option, i) => (
              <div key={option.key} className="reveal" style={{
                transitionDelay: `${i * 80}ms`,
                borderRadius: 'var(--radius-card)',
                border: option.featured ? '1px solid var(--border-strong)' : '1px solid var(--border)',
                background: option.featured ? 'var(--bg-hero)' : 'var(--surface)',
                padding: '20px 20px 18px',
                display: 'grid',
                gap: 12,
              }}>
                <div>
                  <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: option.featured ? 'var(--text-primary)' : 'var(--text-disabled)' }}>
                    {option.eyebrow}
                  </p>
                  <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', ...arFont }}>{option.title}</h3>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', ...arFont }}>{option.text}</p>
                </div>
                <button className={option.featured ? 'btn-primary' : 'btn-outline'} onClick={option.onClick} style={{ minHeight: 40 }}>
                  {option.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="strengths">
        <div className="reveal">
          <p className="section-label">{t.whyLabel}</p>
          <h2 className="sec-title" style={arFont}>{t.whyTitle}</h2>
          <p className={`section-intro${isAr ? ' ar' : ''}`}>{t.whyIntro}</p>
        </div>

        <div className="strengths-grid">
          {t.strengths.map((s, i) => (
            <div key={i} className={`strength-item reveal${i === 0 ? ' strength-item-featured' : ''}`} style={{ transitionDelay: `${i * 80}ms` }}>
              <p className="strength-num">{s.num}</p>
              <h3 className="strength-title" style={arFont}>{s.title}</h3>
              <p className="strength-desc" style={arFont}>{s.desc}</p>
              {s.badge && <span className={`strength-badge${isAr ? ' ar' : ''}`}>{s.badge}</span>}
            </div>
          ))}
        </div>
      </section>

      <section id="how">
        <div className="reveal">
          <p className="section-label">{t.howLabel}</p>
          <h2 className="sec-title" style={arFont}>{t.howTitle}</h2>
          <p className={`section-intro${isAr ? ' ar' : ''}`}>{t.howIntro}</p>
        </div>
        <div className="steps">
          {t.steps.map((s, i) => (
            <div key={i} className="step reveal" style={{ transitionDelay: `${i * 80}ms` }}>
              <div className="step-num">0{i + 1}</div>
              <h3 className={`step-t${isAr ? ' ar' : ''}`}>{s.t}</h3>
              <p className={`step-d${isAr ? ' ar' : ''}`}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="trust">
        <div className="section-heading-centered reveal">
          <p className="section-label">{t.trustLabel}</p>
          <h2 className="sec-title" style={arFont}>{t.trustTitle}</h2>
          <p className={`section-intro centered${isAr ? ' ar' : ''}`}>{t.trustIntro}</p>
        </div>
        <div className="trust-grid">
          {t.trusts.map((tr, i) => (
            <div key={i} className="trust-item reveal" style={{ transitionDelay: `${i * 80}ms` }}>
              <p className="trust-num">{tr.num}</p>
              <h3 className={`trust-t${isAr ? ' ar' : ''}`}>{tr.t}</h3>
              <p className={`trust-d${isAr ? ' ar' : ''}`}>{tr.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="home-cta" className="home-cta-section">
        <div className="home-cta-card reveal">
          <p className="section-label">{t.finalCtaLabel}</p>
          <h2 className="sec-title" style={arFont}>{t.finalCtaTitle}</h2>
          <p className={`section-intro centered${isAr ? ' ar' : ''}`}>{t.finalCtaText}</p>
          <div className="home-cta-actions">
            <button className="btn-primary" onClick={() => nav('/requests?mode=managed')}>
              {t.finalPrimary}
            </button>
            <button className="btn-hero-secondary" onClick={() => nav('/requests')}>
              {t.finalSecondary}
            </button>
          </div>
        </div>
      </section>

      <Footer lang={lang} />

      {ideaOpen && (
        <IdeaToProduct lang={lang} user={user} onClose={() => setIdeaOpen(false)} />
      )}
    </div>
  );
}
