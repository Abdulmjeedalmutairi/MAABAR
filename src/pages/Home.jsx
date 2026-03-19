import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import IdeaToProduct from '../components/IdeaToProduct';

const T = {
  ar: {
    tag: 'مَعبر · التجارة بين السعودية والصين',
    title: 'الأسواق الصينية\nبين يديك',
    mainSub: 'لا تدور.. خلّ المورد يجيك',
    sub: 'اكتب طلبك، وموردون صينيون معتمدون يتنافسون على أفضل سعر لك.',
    cta: 'ابتكر منتجك الخاص',
    reqCta: 'ارفع طلبك الآن',
    howLabel: 'كيف يشتغل مَعبر', howTitle: 'بسيط. مباشر. موثوق.',
    steps: [
      { t: 'تصفح المنتجات', d: 'استعرض مئات المنتجات من موردين صينيين موثوقين.' },
      { t: 'ارفع طلبك', d: 'حدد المنتج اللي تبيه وارفع طلب مباشرة.' },
      { t: 'استلم بالسعودية', d: 'ادفع بأمان واستلم طلبك في جميع مدن المملكة.' }
    ],
    catalogLabel: 'الكتالوج', catalogTitle: 'المنتجات', viewAll: 'عرض الكل ←',
    trustLabel: 'لماذا مَعبر', trustTitle: 'مبني على الثقة',
    trusts: [
      { icon: '✓', t: 'موردون موثوقون', d: 'كل مورد يتم مراجعته قبل الانضمام.' },
      { icon: '⚡', t: 'دفع آمن', d: 'الأموال محجوزة حتى تستلم طلبك.' },
      { icon: '→', t: 'شحن للسعودية', d: 'شحن سريع لجميع مدن المملكة.' }
    ],
    noProducts: 'لا توجد منتجات بعد', copyright: 'مَعبر © 2026'
  },
  en: {
    tag: 'Maabar · Saudi — China Trade',
    title: 'The Chinese\nMarkets In\nYour Hands',
    mainSub: "Don't search.. let the supplier come to you",
    sub: 'Post your request and verified Chinese suppliers compete to give you the best price.',
    cta: 'Create Your Own Product',
    reqCta: 'Post Your Request',
    howLabel: 'How It Works', howTitle: 'Simple. Direct. Trusted.',
    steps: [
      { t: 'Browse Products', d: 'Explore hundreds of products from verified Chinese suppliers.' },
      { t: 'Post a Request', d: 'Define what you need and post a sourcing request.' },
      { t: 'Receive in Saudi', d: 'Pay securely and receive your order across Saudi Arabia.' }
    ],
    catalogLabel: 'Catalog', catalogTitle: 'Products', viewAll: 'View All →',
    trustLabel: 'Why Maabar', trustTitle: 'Built for Trust',
    trusts: [
      { icon: '✓', t: 'Verified Suppliers', d: 'Every supplier is reviewed before listing.' },
      { icon: '⚡', t: 'Secure Payment', d: 'Funds held until you confirm receipt.' },
      { icon: '→', t: 'Direct to Saudi', d: 'Fast shipping to all Saudi cities.' }
    ],
    noProducts: 'No products yet', copyright: 'Maabar © 2026'
  },
  zh: {
    tag: 'Maabar · 沙中贸易',
    title: '中国市场\n触手可及',
    mainSub: '无需寻找，让供应商主动找您',
    sub: '发布您的需求，认证中国供应商竞相为您报最优价。',
    cta: '创造您自己的产品',
    reqCta: '发布需求',
    howLabel: '如何运作', howTitle: '简单. 直接. 可信.',
    steps: [
      { t: '浏览产品', d: '探索来自认证中国供应商的数百种产品。' },
      { t: '发布需求', d: '定义您的需求并发布采购请求。' },
      { t: '沙特收货', d: '安全付款，在沙特各城市收货。' }
    ],
    catalogLabel: '目录', catalogTitle: '产品', viewAll: '查看全部 →',
    trustLabel: '为什么选择Maabar', trustTitle: '建立在信任之上',
    trusts: [
      { icon: '✓', t: '认证供应商', d: '每位供应商入驻前经过审核。' },
      { icon: '⚡', t: '安全付款', d: '资金安全持有直至确认收货。' },
      { icon: '→', t: '直达沙特', d: '快速运送至沙特各城市。' }
    ],
    noProducts: '暂无产品', copyright: 'Maabar © 2026'
  }
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
      {/* HERO */}
      <section id="hero">
        <div className="hero-bg"></div>
        <div className="hero-overlay"></div>
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
            {/* ← مباشرة لصفحة الطلبات بدون أي شرط */}
            <button className="btn-hero-secondary" onClick={() => nav('/requests')}>
              {t.reqCta}
            </button>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how">
        <p className="section-label">{t.howLabel}</p>
        <h2 className={`sec-title${isAr ? ' ar' : ''}`}>{t.howTitle}</h2>
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

      {/* PRODUCTS PREVIEW */}
      <section id="products-preview">
        <div className="section-header">
          <div>
            <p className="section-label">{t.catalogLabel}</p>
            <h2 className={`sec-title${isAr ? ' ar' : ''}`}>{t.catalogTitle}</h2>
          </div>
          <button className="btn-outline" onClick={() => nav('/products')}>{t.viewAll}</button>
        </div>
        {products.length === 0 ? (
          <p style={{ color: '#6b6b6b' }}>{t.noProducts}</p>
        ) : (
          products.map(p => (
            <div key={p.id} className="product-list-item" onClick={() => nav(`/products/${p.id}`)}>
              <div className="product-img">
                {p.image_url ? <img src={p.image_url} alt="" /> : '📦'}
              </div>
              <div className="product-info">
                <h3 className={`product-name${isAr ? ' ar' : ''}`}>{p.name_ar || p.name_en}</h3>
                <p className="product-price">{p.price_from ? `${p.price_from} SAR` : '—'}</p>
                <p className="product-meta">MOQ: {p.moq || '—'} · {p.profiles?.company_name || ''}</p>
              </div>
              <div className="product-btns">
                <button className="btn-dark-sm">{isAr ? 'التفاصيل' : 'Details'}</button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* TRUST */}
      <section id="trust">
        <div style={{ textAlign: 'center', maxWidth: 600, margin: '0 auto' }}>
          <p className="section-label">{t.trustLabel}</p>
          <h2 className={`sec-title${isAr ? ' ar' : ''}`}>{t.trustTitle}</h2>
        </div>
        <div className="trust-grid">
          {t.trusts.map((tr, i) => (
            <div key={i} className="trust-item">
              <div className="trust-icon">{tr.icon}</div>
              <h3 className={`trust-t${isAr ? ' ar' : ''}`}>{tr.t}</h3>
              <p className={`trust-d${isAr ? ' ar' : ''}`}>{tr.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">MAABAR <span>| مَعبر</span></div>
        <p className="footer-copy">{t.copyright}</p>
      </footer>

      {ideaOpen && <IdeaToProduct lang={lang} user={user} onClose={() => setIdeaOpen(false)} />}
    </div>
  );
}