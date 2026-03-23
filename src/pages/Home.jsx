import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import IdeaToProduct from '../components/IdeaToProduct';

const T = {
  ar: {
    tag: 'مَعبر · المنصة الوحيدة التي تحمي التاجر السعودي في كل خطوة',
    title: 'لا تبحث\nدع المورد\nيأتيك',
    mainSub: 'استورد بثقة — بدون وسطاء، بدون مخاطر',
    sub: 'ارفع طلبك، وموردون صينيون معتمدون يتنافسون على أفضل سعر لك، وأموالك محجوزة حتى تستلم بضاعتك.',
    cta: 'ابتكر منتجك الخاص',
    reqCta: 'ارفع طلبك الآن',

    // نقاط القوة
    strengthLabel: 'ما يميّز معبر',
    strengthTitle: 'ثلاثة أسباب تجعل معبر الخيار الأول',
    strengths: [
      {
        num: '01',
        title: 'أول منصة تجمع التاجر السعودي والمورد الصيني مباشرة',
        desc: 'سوق واحد، ثلاث لغات، وعروض حقيقية تصلك دون أن تبحث.',
      },
      {
        num: '02',
        title: 'مساعد ذكي يمشي معك خطوة بخطوة',
        desc: 'من فكرة المنتج حتى وصوله — ومتخصصو معبر حاضرون في كل صفقة.',
      },
      {
        num: '03',
        title: 'أفضل سعر يأتيك بضغطة زر',
        desc: 'ارفع طلبك، والموردون يتنافسون — أنت تختار، لا تبحث.',
      },
    ],

    // كيف يعمل
    howLabel: 'كيف يعمل مَعبر',
    howTitle: 'بسيط. مباشر. موثوق.',
    steps: [
      {
        t: 'ارفع طلبك في دقيقة',
        d: 'صف المنتج الذي تريده، والمساعد الذكي يحوّله لطلب احترافي يصل للموردين المناسبين فوراً.',
      },
      {
        t: 'قارن واختر بثقة',
        d: 'موردون معتمدون يتنافسون على طلبك — قارن الأسعار والمواصفات واختر الأفضل لتجارتك.',
      },
      {
        t: 'ادفع بأمان واستلم',
        d: 'أموالك محجوزة في معبر ولا تُحوَّل للمورد إلا بعد تأكيدك استلام البضاعة.',
      },
    ],

    // المنتجات
    catalogLabel: 'الكتالوج',
    catalogTitle: 'منتجات المعتمدين',
    viewAll: 'عرض الكل ←',
    noProducts: 'لا توجد منتجات بعد',

    // الثقة
    trustLabel: 'ركائز معبر',
    trustTitle: 'مبنيٌّ على الثقة',
    trusts: [
      {
        num: '01',
        t: 'موردون معتمدون',
        d: 'كل مورد يمر بتحقق دقيق — الذكاء الاصطناعي يحلل، ومتخصصو معبر يعتمدون.',
      },
      {
        num: '02',
        t: 'أمان مالي كامل',
        d: 'أموالك لا تتحرك حتى تصل بضاعتك — ضمان كامل في كل صفقة.',
      },
      {
        num: '03',
        t: 'تحدّث بلغتك',
        d: 'تواصل بالعربية ومعبر يتولى التواصل مع المورد الصيني نيابةً عنك.',
      },
      {
        num: '04',
        t: 'شفافية تامة',
        d: 'تكلفتك واضحة قبل أي قرار — لا مفاجآت في الجمارك ولا في الشحن.',
      },
    ],

    // أرقام
    statsLabel: 'معبر بالأرقام',
    stats: [
      { num: '٣', label: 'لغات مدعومة' },
      { num: '٧', label: 'أدوات ذكاء اصطناعي' },
      { num: '٦٪', label: 'عمولة فقط على كل صفقة' },
    ],

    copyright: 'مَعبر © 2026',
  },
  en: {
    tag: 'Maabar · The Only Platform That Protects Saudi Traders at Every Step',
    title: "Don't Search\nLet the Supplier\nCome to You",
    mainSub: 'Import with confidence — no middlemen, no risks',
    sub: 'Post your request and verified Chinese suppliers compete to give you the best price, with your funds secured until delivery.',
    cta: 'Create Your Own Product',
    reqCta: 'Post Your Request',

    strengthLabel: "What Sets Maabar Apart",
    strengthTitle: 'Three Reasons Maabar Comes First',
    strengths: [
      {
        num: '01',
        title: 'The first platform connecting Saudi buyers directly with Chinese suppliers',
        desc: 'One marketplace, three languages, real offers delivered without searching.',
      },
      {
        num: '02',
        title: 'A smart assistant that guides you every step of the way',
        desc: 'From product idea to delivery — with Maabar specialists present at every deal.',
      },
      {
        num: '03',
        title: 'The best price comes to you with one click',
        desc: 'Post your request and suppliers compete — you choose, you don\'t search.',
      },
    ],

    howLabel: 'How Maabar Works',
    howTitle: 'Simple. Direct. Trusted.',
    steps: [
      {
        t: 'Post Your Request in Minutes',
        d: 'Describe what you need and the smart assistant turns it into a professional request sent to the right suppliers instantly.',
      },
      {
        t: 'Compare and Choose with Confidence',
        d: 'Verified suppliers compete on your request — compare prices and specs, then choose the best for your business.',
      },
      {
        t: 'Pay Safely and Receive',
        d: 'Your funds are held by Maabar and only released to the supplier after you confirm receipt.',
      },
    ],

    catalogLabel: 'Catalog',
    catalogTitle: 'Featured Products',
    viewAll: 'View All →',
    noProducts: 'No products yet',

    trustLabel: 'Our Pillars',
    trustTitle: 'Built on Trust',
    trusts: [
      {
        num: '01',
        t: 'Verified Suppliers',
        d: 'Every supplier undergoes rigorous verification — AI analyzes, Maabar specialists approve.',
      },
      {
        num: '02',
        t: 'Full Financial Security',
        d: 'Your funds don\'t move until your order arrives — complete protection on every deal.',
      },
      {
        num: '03',
        t: 'Communicate in Your Language',
        d: 'Speak Arabic and Maabar handles all communication with Chinese suppliers on your behalf.',
      },
      {
        num: '04',
        t: 'Complete Transparency',
        d: 'Your full cost is clear before any decision — no surprises in customs or shipping.',
      },
    ],

    statsLabel: 'Maabar in Numbers',
    stats: [
      { num: '3', label: 'Supported Languages' },
      { num: '7', label: 'AI Tools' },
      { num: '6%', label: 'Commission Per Deal' },
    ],

    copyright: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 唯一在每一步保护沙特贸易商的平台',
    title: '无需搜索\n让供应商\n主动找您',
    mainSub: '放心进口 — 无中间商，无风险',
    sub: '发布需求，认证中国供应商竞相报价，您的资金安全托管直至收货确认。',
    cta: '创造您自己的产品',
    reqCta: '发布需求',

    strengthLabel: 'Maabar的优势',
    strengthTitle: '选择Maabar的三个理由',
    strengths: [
      {
        num: '01',
        title: '首个直接连接沙特买家与中国供应商的平台',
        desc: '一个市场，三种语言，真实报价无需搜索即可获得。',
      },
      {
        num: '02',
        title: '智能助手全程陪伴',
        desc: '从产品创意到交货 — Maabar专家在每笔交易中全程陪伴。',
      },
      {
        num: '03',
        title: '一键获得最优价格',
        desc: '发布需求，供应商竞价 — 您只需选择，无需搜索。',
      },
    ],

    howLabel: 'Maabar如何运作',
    howTitle: '简单. 直接. 可信.',
    steps: [
      {
        t: '几分钟内发布需求',
        d: '描述您的需求，智能助手将其转化为专业询价单，立即发送给合适的供应商。',
      },
      {
        t: '放心比较和选择',
        d: '认证供应商竞相报价 — 比较价格和规格，选择最适合您业务的方案。',
      },
      {
        t: '安全付款并收货',
        d: '您的资金由Maabar托管，仅在您确认收货后才释放给供应商。',
      },
    ],

    catalogLabel: '目录',
    catalogTitle: '精选产品',
    viewAll: '查看全部 →',
    noProducts: '暂无产品',

    trustLabel: '我们的支柱',
    trustTitle: '建立在信任之上',
    trusts: [
      {
        num: '01',
        t: '认证供应商',
        d: '每位供应商经过严格审核 — AI分析，Maabar专家批准。',
      },
      {
        num: '02',
        t: '完全财务安全',
        d: '您的资金在订单到达前不会移动 — 每笔交易完全保障。',
      },
      {
        num: '03',
        t: '用您的语言沟通',
        d: '用阿拉伯语交流，Maabar代您与中国供应商处理所有沟通。',
      },
      {
        num: '04',
        t: '完全透明',
        d: '做出任何决定前，您的完整成本清晰可见 — 关税和运费无惊喜。',
      },
    ],

    statsLabel: 'Maabar数据',
    stats: [
      { num: '3', label: '支持语言' },
      { num: '7', label: 'AI工具' },
      { num: '6%', label: '每笔交易佣金' },
    ],

    copyright: 'Maabar © 2026',
  },
};

export default function Home({ lang, user, profile }) {
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const [products, setProducts] = useState([]);
  const [ideaOpen, setIdeaOpen] = useState(false);

  useEffect(() => {
    return () => setIdeaOpen(false);
  }, []);

  useEffect(() => {
    sb.from('products').select('*,profiles(company_name)').eq('is_active', true).limit(4).then(({ data }) => {
      if (data) setProducts(data);
    });
  }, []);

  return (
    <div>

      {/* ═══════════════════════════════════════
          HERO
      ═══════════════════════════════════════ */}
      <section id="hero">
        <div className="hero-bg" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <p className="hero-tag">{t.tag}</p>
          <h1 className={`hero-title-${isAr ? 'ar' : lang === 'zh' ? 'zh' : 'en'}`}>
            {t.title.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)}
          </h1>
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

      {/* ═══════════════════════════════════════
          نقاط القوة
      ═══════════════════════════════════════ */}
      <section id="strengths" style={{
        padding: '100px 60px',
        background: 'rgba(247,245,242,0.88)',
        backdropFilter: 'blur(8px)',
      }}>
        <p className="section-label">{t.strengthLabel}</p>
        <h2 style={{
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
          fontSize: isAr ? 36 : 44, fontWeight: 300,
          color: '#2C2C2C', marginBottom: 56,
          letterSpacing: isAr ? 0 : -0.5, lineHeight: 1.2,
        }}>
          {t.strengthTitle}
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1, background: '#E5E0D8',
        }}>
          {t.strengths.map((s, i) => (
            <div key={i} style={{
              background: i === 0 ? '#2C2C2C' : '#F7F5F2',
              padding: '40px 32px',
              transition: 'all 0.25s',
              cursor: 'default',
            }}
              onMouseEnter={e => e.currentTarget.style.background = i === 0 ? '#3a3a3a' : '#EFECE7'}
              onMouseLeave={e => e.currentTarget.style.background = i === 0 ? '#2C2C2C' : '#F7F5F2'}>
              <p style={{
                fontFamily: 'var(--font-en)', fontSize: 48, fontWeight: 300,
                color: i === 0 ? 'rgba(247,245,242,0.15)' : '#E5E0D8',
                lineHeight: 1, marginBottom: 24,
              }}>
                {s.num}
              </p>
              <h3 style={{
                fontSize: 16, fontWeight: 600,
                color: i === 0 ? '#F7F5F2' : '#2C2C2C',
                marginBottom: 14, lineHeight: 1.5,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
              }}>
                {s.title}
              </h3>
              <p style={{
                fontSize: 14, lineHeight: 1.8,
                color: i === 0 ? 'rgba(247,245,242,0.55)' : '#7a7a7a',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
              }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          HOW IT WORKS
      ═══════════════════════════════════════ */}
      <section id="how" style={{ padding: '100px 60px', background: 'rgba(247,245,242,0.75)', backdropFilter: 'blur(8px)' }}>
        <p className="section-label">{t.howLabel}</p>
        <h2 style={{
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
          fontSize: isAr ? 36 : 44, fontWeight: 300,
          color: '#2C2C2C', marginBottom: 64,
          letterSpacing: isAr ? 0 : -0.5,
        }}>
          {t.howTitle}
        </h2>
        <div className="steps">
          {t.steps.map((s, i) => (
            <div key={i} className="step">
              <div className="step-num">0{i + 1}</div>
              <h3 style={{
                fontSize: 17, fontWeight: 600, marginBottom: 14,
                color: '#2C2C2C', lineHeight: 1.4,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
              }}>
                {s.t}
              </h3>
              <p style={{
                fontSize: 14, color: '#7a7a7a', lineHeight: 1.9,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
              }}>
                {s.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          PRODUCTS PREVIEW
      ═══════════════════════════════════════ */}
      <section id="products-preview" style={{ padding: '100px 60px', background: 'rgba(247,245,242,0.82)' }}>
        <div className="section-header">
          <div>
            <p className="section-label">{t.catalogLabel}</p>
            <h2 style={{
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
              fontSize: isAr ? 36 : 44, fontWeight: 300, color: '#2C2C2C',
              letterSpacing: isAr ? 0 : -0.5,
            }}>
              {t.catalogTitle}
            </h2>
          </div>
          <button className="btn-outline" onClick={() => nav('/products')}>{t.viewAll}</button>
        </div>
        {products.length === 0 ? (
          <p style={{ color: '#7a7a7a', fontSize: 14 }}>{t.noProducts}</p>
        ) : (
          products.map(p => (
            <div key={p.id} className="product-list-item" onClick={() => nav(`/products/${p.id}`)}>
              <div className="product-img">
                {p.image_url ? <img src={p.image_url} alt="" /> : '📦'}
              </div>
              <div className="product-info">
                <h3 className={`product-name${isAr ? ' ar' : ''}`} style={{ fontSize: 16 }}>
                  {p.name_ar || p.name_en}
                </h3>
                <p className="product-price" style={{ fontSize: 18 }}>
                  {p.price_from ? `${p.price_from} SAR` : '—'}
                </p>
                <p className="product-meta" style={{ fontSize: 13 }}>
                  MOQ: {p.moq || '—'} · {p.profiles?.company_name || ''}
                </p>
              </div>
              <div className="product-btns">
                <button className="btn-dark-sm">{isAr ? 'التفاصيل' : 'Details'}</button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ═══════════════════════════════════════
          TRUST
      ═══════════════════════════════════════ */}
      <section id="trust" style={{ padding: '100px 60px', background: 'rgba(247,245,242,0.75)' }}>
        <p className="section-label" style={{ textAlign: 'center' }}>{t.trustLabel}</p>
        <h2 style={{
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
          fontSize: isAr ? 36 : 44, fontWeight: 300,
          color: '#2C2C2C', marginBottom: 56,
          letterSpacing: isAr ? 0 : -0.5, textAlign: 'center',
        }}>
          {t.trustTitle}
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 1, background: '#E5E0D8',
          maxWidth: 960, margin: '0 auto',
        }}>
          {t.trusts.map((tr, i) => (
            <div key={i} style={{
              background: '#F7F5F2', padding: '36px 28px',
              transition: 'all 0.25s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2C2C2C'; e.currentTarget.querySelector('.trust-title').style.color = '#F7F5F2'; e.currentTarget.querySelector('.trust-desc').style.color = 'rgba(247,245,242,0.5)'; e.currentTarget.querySelector('.trust-num').style.color = 'rgba(247,245,242,0.1)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#F7F5F2'; e.currentTarget.querySelector('.trust-title').style.color = '#2C2C2C'; e.currentTarget.querySelector('.trust-desc').style.color = '#7a7a7a'; e.currentTarget.querySelector('.trust-num').style.color = '#E5E0D8'; }}>
              <p className="trust-num" style={{
                fontFamily: 'var(--font-en)', fontSize: 36, fontWeight: 300,
                color: '#E5E0D8', lineHeight: 1, marginBottom: 20,
                transition: 'color 0.25s',
              }}>
                {tr.num}
              </p>
              <h3 className="trust-title" style={{
                fontSize: 14, fontWeight: 600, marginBottom: 12,
                color: '#2C2C2C', lineHeight: 1.5,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                transition: 'color 0.25s',
              }}>
                {tr.t}
              </h3>
              <p className="trust-desc" style={{
                fontSize: 13, color: '#7a7a7a', lineHeight: 1.8,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                transition: 'color 0.25s',
              }}>
                {tr.d}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          STATS
      ═══════════════════════════════════════ */}
      <section id="stats" style={{
        padding: '80px 60px',
        background: '#2C2C2C',
      }}>
        <p style={{
          fontSize: 11, letterSpacing: 4, textTransform: 'uppercase',
          color: 'rgba(247,245,242,0.35)', marginBottom: 48,
          textAlign: 'center', fontFamily: 'var(--font-body)',
        }}>
          {t.statsLabel}
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1, background: 'rgba(247,245,242,0.08)',
          maxWidth: 720, margin: '0 auto',
        }}>
          {t.stats.map((s, i) => (
            <div key={i} style={{
              background: '#2C2C2C', padding: '40px 32px', textAlign: 'center',
            }}>
              <p style={{
                fontFamily: 'var(--font-en)', fontSize: 56, fontWeight: 300,
                color: '#F7F5F2', lineHeight: 1, marginBottom: 12,
              }}>
                {s.num}
              </p>
              <p style={{
                fontSize: 13, color: 'rgba(247,245,242,0.4)',
                letterSpacing: 1, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
              }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer>
        <div className="footer-logo">MAABAR <span>| مَعبر</span></div>
        <p className="footer-copy">{t.copyright}</p>
      </footer>

      {ideaOpen && <IdeaToProduct lang={lang} user={user} onClose={() => setIdeaOpen(false)} />}

      {/* MOBILE */}
      <style>{`
        @media (max-width: 768px) {
          #strengths, #how, #trust, #stats, #products-preview { padding: 60px 20px !important; }
          #strengths > div, #trust > div { grid-template-columns: 1fr !important; }
          #stats > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}