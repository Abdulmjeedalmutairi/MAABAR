import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import IdeaToProduct from '../components/IdeaToProduct';
import Footer from '../components/Footer';

/* ─────────────────────────────────────────
   Translations — بدون تغيير
───────────────────────────────────────── */
const T = {
  ar: {
    tag: 'مَعبر · المنصة الوحيدة التي تحمي التاجر السعودي في كل خطوة',
    title: 'لا تبحث\nدع المورد\nيأتيك',
    mainSub: 'استورد بثقة — بدون وسطاء، بدون مخاطر',
    sub: 'ارفع طلبك، وموردون صينيون معتمدون يتنافسون على أفضل سعر لك — ادفع بقدر ما تثق وزّد ثقتك مع كل صفقة.',
    cta: 'صنّع فكرتك',
    reqCta: 'ارفع طلبك الآن',
    strengthLabel: 'ما يميّز معبر',
    strengthTitle: 'ثلاثة أسباب تجعل معبر الخيار الأول',
    strengths: [
      { num: '01', title: 'أول منصة تجمع التاجر السعودي والمورد الصيني مباشرة', desc: 'سوق واحد، ثلاث لغات، وعروض حقيقية تصلك دون أن تبحث.' },
      { num: '02', title: 'مساعد ذكي يمشي معك خطوة بخطوة', desc: 'من فكرة المنتج حتى وصوله — ومتخصصو معبر حاضرون في كل صفقة.' },
      { num: '03', title: 'أفضل سعر يأتيك بضغطة زر', desc: 'ارفع طلبك، والموردون يتنافسون — أنت تختار، لا تبحث.' },
    ],
    howLabel: 'كيف يعمل مَعبر',
    howTitle: 'بسيط. مباشر. موثوق.',
    steps: [
      { t: 'ارفع طلبك في دقيقة', d: 'صف المنتج الذي تريده، والمساعد الذكي يحوّله لطلب احترافي يصل للموردين المناسبين فوراً.' },
      { t: 'قارن واختر بثقة', d: 'موردون معتمدون يتنافسون على طلبك — قارن الأسعار والمواصفات واختر الأفضل لتجارتك.' },
      { t: 'ادفع بقدر ما تثق', d: 'ادفع 30% أو 50% أو الكامل — أنت تقرر، وثقتك تكبر مع كل صفقة ناجحة.' },
    ],
    catalogLabel: 'الكتالوج',
    catalogTitle: 'منتجات المعتمدين',
    viewAll: 'عرض الكل',
    noProducts: 'لا توجد منتجات بعد',
    trustLabel: 'ركائز معبر',
    trustTitle: 'مبنيٌّ على الثقة',
    trusts: [
      { num: '01', t: 'موردون معتمدون', d: 'كل مورد يمر بتحقق دقيق — الذكاء الاصطناعي يحلل، ومتخصصو معبر يعتمدون.' },
      { num: '02', t: 'ادفع بقدر ما تثق', d: 'ادفع بقدر ما تثق — وزّد ثقتك مع كل صفقة ناجحة.' },
      { num: '03', t: 'تحدّث بلغتك', d: 'تواصل بالعربية ومعبر يتولى التواصل مع المورد الصيني نيابةً عنك.' },
      { num: '04', t: 'شفافية تامة', d: 'تكلفتك واضحة قبل أي قرار — لا مفاجآت في الجمارك ولا في الشحن.' },
    ],
    copyright: 'مَعبر © 2026',
  },
  en: {
    tag: 'Maabar · The Only Platform That Protects Saudi Traders at Every Step',
    title: "Don't Search\nLet the Supplier\nCome to You",
    mainSub: 'Import with confidence — no middlemen, no risks',
    sub: 'Post your request and verified Chinese suppliers compete to give you the best price — pay what you\'re comfortable with and grow your trust with every deal.',
    cta: 'Create Your Own Product',
    reqCta: 'Post Your Request',
    strengthLabel: 'What Sets Maabar Apart',
    strengthTitle: 'Three Reasons Maabar Comes First',
    strengths: [
      { num: '01', title: 'The first platform connecting Saudi buyers directly with Chinese suppliers', desc: 'One marketplace, three languages, real offers delivered without searching.' },
      { num: '02', title: 'A smart assistant that guides you every step of the way', desc: "From product idea to delivery — with Maabar specialists present at every deal." },
      { num: '03', title: 'The best price comes to you with one click', desc: "Post your request and suppliers compete — you choose, you don't search." },
    ],
    howLabel: 'How Maabar Works',
    howTitle: 'Simple. Direct. Trusted.',
    steps: [
      { t: 'Post Your Request in Minutes', d: 'Describe what you need and the smart assistant turns it into a professional request sent to the right suppliers instantly.' },
      { t: 'Compare and Choose with Confidence', d: 'Verified suppliers compete on your request — compare prices and specs, then choose the best for your business.' },
      { t: 'Pay What You\'re Comfortable With', d: 'Pay 30%, 50%, or the full amount — you decide. Your trust grows with every successful deal.' },
    ],
    catalogLabel: 'Catalog',
    catalogTitle: 'Featured Products',
    viewAll: 'View All',
    noProducts: 'No products yet',
    trustLabel: 'Our Pillars',
    trustTitle: 'Built on Trust',
    trusts: [
      { num: '01', t: 'Verified Suppliers', d: 'Every supplier undergoes rigorous verification — AI analyzes, Maabar specialists approve.' },
      { num: '02', t: 'Pay What You\'re Comfortable With', d: 'Pay what you\'re comfortable with — your money moves when you decide.' },
      { num: '03', t: 'Communicate in Your Language', d: 'Speak Arabic and Maabar handles all communication with Chinese suppliers on your behalf.' },
      { num: '04', t: 'Complete Transparency', d: 'Your full cost is clear before any decision — no surprises in customs or shipping.' },
    ],
    copyright: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 唯一在每一步保护沙特贸易商的平台',
    title: '无需搜索\n让供应商\n主动找您',
    mainSub: '放心进口 — 无中间商，无风险',
    sub: '发布您的需求，认证中国供应商竞相报价 — 按您的信任程度付款，随着每次成功交易增加信任。',
    cta: '创造您自己的产品',
    reqCta: '发布需求',
    strengthLabel: 'Maabar的优势',
    strengthTitle: '选择Maabar的三个理由',
    strengths: [
      { num: '01', title: '首个直接连接沙特买家与中国供应商的平台', desc: '一个市场，三种语言，真实报价无需搜索即可获得。' },
      { num: '02', title: '智能助手全程陪伴', desc: '从产品创意到交货 — Maabar专家在每笔交易中全程陪伴。' },
      { num: '03', title: '一键获得最优价格', desc: '发布需求，供应商竞价 — 您只需选择，无需搜索。' },
    ],
    howLabel: 'Maabar如何运作',
    howTitle: '简单. 直接. 可信.',
    steps: [
      { t: '几分钟内发布需求', d: '描述您的需求，智能助手将其转化为专业询价单，立即发送给合适的供应商。' },
      { t: '放心比较和选择', d: '认证供应商竞相报价 — 比较价格和规格，选择最适合您业务的方案。' },
      { t: '安全付款并收货', d: '您的资金由Maabar托管，仅在您确认收货后才释放给供应商。' },
    ],
    catalogLabel: '目录',
    catalogTitle: '精选产品',
    viewAll: '查看全部',
    noProducts: '暂无产品',
    trustLabel: '我们的支柱',
    trustTitle: '建立在信任之上',
    trusts: [
      { num: '01', t: '认证供应商', d: '每位供应商经过严格审核 — AI分析，Maabar专家批准。' },
      { num: '02', t: '完全财务安全', d: '您的资金在订单到达前不会移动 — 每笔交易完全保障。' },
      { num: '03', t: '用您的语言沟通', d: '用阿拉伯语交流，Maabar代您与中国供应商处理所有沟通。' },
      { num: '04', t: '完全透明', d: '做出任何决定前，您的完整成本清晰可见 — 关税和运费无惊喜。' },
    ],
    copyright: 'Maabar © 2026',
  },
};

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */
export default function Home({ lang, user, profile }) {
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  usePageTitle('home', lang);
  const [ideaOpen, setIdeaOpen] = useState(false);

  useEffect(() => { return () => setIdeaOpen(false); }, []);

  const arFont = isAr ? { fontFamily: 'var(--font-ar)' } : {};

  return (
    <div>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section id="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-tag">{t.tag}</p>
          {isAr
            ? <h1 className="hero-title-ar">لا تبحث — دع المورد يأتيك</h1>
            : <h1 className={`hero-title-${lang === 'zh' ? 'zh' : 'en'}`}>
                {t.title.split('\n').map((line, i) => <span key={i}>{line}<br /></span>)}
              </h1>
          }
          <p className={`hero-main-sub${isAr ? ' ar' : ''}`}>{t.mainSub}</p>
          <p className={`hero-sub${isAr ? ' ar' : ''}`}>{t.sub}</p>
          <div className="hero-actions">
            <button className="btn-primary" onClick={() => setIdeaOpen(true)}>
              {t.cta}
            </button>
            <button className="btn-hero-secondary" onClick={() => nav('/requests')}>
              {t.reqCta}
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          STRENGTHS
      ══════════════════════════════════════ */}
      <section id="strengths" style={{ background: 'var(--bg-subtle)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <p className="section-label">{t.strengthLabel}</p>
        <h2 className="sec-title" style={arFont}>{t.strengthTitle}</h2>

        <div className="strengths-grid">
          {t.strengths.map((s, i) => (
            <div key={i} className="strength-item"
              style={i === 0 ? { background: 'var(--bg-muted)' } : {}}>
              <p className="strength-num">{s.num}</p>
              <h3 className="strength-title" style={arFont}>{s.title}</h3>
              <p className="strength-desc" style={arFont}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section id="how">
        <p className="section-label">{t.howLabel}</p>
        <h2 className="sec-title" style={arFont}>{t.howTitle}</h2>
        <div className="steps">
          {t.steps.map((s, i) => (
            <div key={i} className="step">
              <div className="step-num">0{i + 1}</div>
              <h3 className={`step-t${isAr ? ' ar' : ''}`}>{s.t}</h3>
              <p className={`step-d${isAr ? ' ar' : ''}`}>{s.d}</p>
            </div>
          ))}
        </div>
      </section>



      {/* ══════════════════════════════════════
          TRUST
      ══════════════════════════════════════ */}
      <section id="trust" style={{ background: 'var(--bg-base)' }}>
        <div style={{ textAlign: 'center' }}>
          <p className="section-label">{t.trustLabel}</p>
          <h2 className="sec-title" style={arFont}>{t.trustTitle}</h2>
        </div>
        <div className="trust-grid">
          {t.trusts.map((tr, i) => (
            <div key={i} className="trust-item">
              <p className="trust-num">{tr.num}</p>
              <h3 className={`trust-t${isAr ? ' ar' : ''}`}>{tr.t}</h3>
              <p className={`trust-d${isAr ? ' ar' : ''}`}>{tr.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER (component)
      ══════════════════════════════════════ */}
      <Footer lang={lang} />

      {/* IdeaToProduct modal — منطق محفوظ */}
      {ideaOpen && (
        <IdeaToProduct lang={lang} user={user} onClose={() => setIdeaOpen(false)} />
      )}
    </div>
  );
}