import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import IdeaToProduct from '../components/IdeaToProduct';
import Footer from '../components/Footer';
import RoleIntroTour from '../components/RoleIntroTour';

// Trilingual copy — mirrors the mobile app's public home (PublicHomeScreen).
const T = {
  ar: {
    tag: 'الحل لجميع مشاكل استيرادك من الصين',
    heroTitle: 'لا تبحث — معبر يبحث لك',
    heroSub: 'استورد من الصين بثقة — بدون وسطاء، وبلا حاجز لغة.',
    heroBtn1: 'ابدأ طلب استيراد',
    heroBtn2: 'تصفح الموردين',
    services: [
      { key: 'products',    title: 'ابحث عن منتجات',    desc: 'تصفّح كتالوج المنتجات الجاهزة' },
      { key: 'suppliers',   title: 'استكشف الموردين',   desc: 'موردون صينيون معتمدون' },
      { key: 'manufacture', title: 'اطلب تصنيع منتجك',  desc: 'حوّل فكرتك إلى منتج مُصنّع' },
      { key: 'support',     title: 'دعم باللغة العربية', desc: 'فريق ودعم بالعربية دائمًا' },
    ],
    mgBadge: 'خدمة مميّزة',
    mgTitle: 'الطلب المُدار',
    mgSub: 'دع خبراء معبر يتولّون طلبك بالكامل — نبحث، نفاوض، ونعرض لك أفضل ٣ عروض مختارة.',
    mgBullets: ['فريق مختص يبحث ويفاوض بدلاً عنك', 'أفضل ٣ عروض مُنتقاة تصلك جاهزة', 'أنت فقط تختار وتستلم'],
    mgBtn: 'اطلب طلبًا مُدارًا',
    productsTitle: 'منتجات',
    viewAll: 'عرض الكل',
    ctaTitle: 'جاهز تبدأ استيرادك بثقة؟',
    ctaText: 'ابدأ طلبك الآن ودع مَعبر يتولّى المطابقة والعروض.',
    ctaBtn: 'ابدأ طلب استيراد',
    appTitle: 'التطبيق قادم قريبًا',
    appText: 'حمّل تطبيق معبر على جوالك — قريبًا على App Store و Google Play.',
    soon: 'قريباً',
  },
  en: {
    tag: 'The solution to all your China import problems',
    heroTitle: "Don't search — Maabar finds it for you",
    heroSub: 'Import from China with confidence — no middlemen, no language barrier.',
    heroBtn1: 'Start an import request',
    heroBtn2: 'Browse suppliers',
    services: [
      { key: 'products',    title: 'Find products',         desc: 'Browse the ready catalog' },
      { key: 'suppliers',   title: 'Explore suppliers',     desc: 'Verified Chinese suppliers' },
      { key: 'manufacture', title: 'Request manufacturing', desc: 'Turn your idea into a product' },
      { key: 'support',     title: 'Arabic support',        desc: 'Arabic support, always' },
    ],
    mgBadge: 'Premium',
    mgTitle: 'Managed Sourcing',
    mgSub: "Let Maabar's experts run your request end-to-end — we search, negotiate, and bring you the top 3 curated offers.",
    mgBullets: ['A dedicated team searches and negotiates for you', 'Top 3 hand-picked offers, ready to compare', 'You just choose and receive'],
    mgBtn: 'Request managed sourcing',
    productsTitle: 'Products',
    viewAll: 'View all',
    ctaTitle: 'Ready to import with confidence?',
    ctaText: 'Start your request and let Maabar handle matching and offers.',
    ctaBtn: 'Start an import request',
    appTitle: 'The app is coming soon',
    appText: 'Get the Maabar app on your phone — coming soon to the App Store and Google Play.',
    soon: 'Soon',
  },
  zh: {
    tag: '解决您从中国进口的所有难题',
    heroTitle: '无需搜索 — Maabar 为您寻找',
    heroSub: '放心从中国进口 — 没有中间商，没有语言障碍。',
    heroBtn1: '开始进口需求',
    heroBtn2: '浏览供应商',
    services: [
      { key: 'products',    title: '查找产品',   desc: '浏览现成产品目录' },
      { key: 'suppliers',   title: '探索供应商', desc: '经认证的中国供应商' },
      { key: 'manufacture', title: '定制制造',   desc: '把创意变成可制造的产品' },
      { key: 'support',     title: '阿拉伯语支持', desc: '始终提供阿拉伯语支持' },
    ],
    mgBadge: '尊享服务',
    mgTitle: '托管采购',
    mgSub: '让 Maabar 专家全程负责您的需求 — 我们搜寻、谈判，并为您呈现 3 个甄选报价。',
    mgBullets: ['专业团队为您搜寻与谈判', '3 个精选报价，随时比较', '您只需选择并收货'],
    mgBtn: '申请托管采购',
    productsTitle: '产品',
    viewAll: '查看全部',
    ctaTitle: '准备好放心进口了吗？',
    ctaText: '现在提交需求，让 Maabar 为您匹配供应商与报价。',
    ctaBtn: '开始进口需求',
    appTitle: '应用即将推出',
    appText: '在手机上使用 Maabar — 即将登陆 App Store 和 Google Play。',
    soon: '即将推出',
  },
};

// Minimal stroke icons for the services row (language-independent).
const svgProps = { width: 26, height: 26, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const ICONS = {
  products:    (<svg {...svgProps}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></svg>),
  suppliers:   (<svg {...svgProps}><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /></svg>),
  manufacture: (<svg {...svgProps}><path d="M14 4l-1 5 5-2v11H6V7l5 2-1-5z" /><path d="M6 21h12" /></svg>),
  support:     (<svg {...svgProps}><path d="M4 14v-2a8 8 0 0116 0v2" /><rect x="2.5" y="14" width="4" height="6" rx="1.4" /><rect x="17.5" y="14" width="4" height="6" rx="1.4" /></svg>),
};

export default function Home({ lang, user }) {
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';
  usePageTitle('home', lang);
  const [ideaOpen, setIdeaOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const rootRef = useRef(null);

  useEffect(() => () => setIdeaOpen(false), []);

  // Latest active products for the carousel teaser (drafts are is_active=false).
  useEffect(() => {
    let cancelled = false;
    sb.from('products')
      .select('id, name_ar, name_en, name_zh, price_from, currency, image_url, gallery_images')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(8)
      .then(({ data }) => { if (!cancelled) setProducts(data || []); });
    return () => { cancelled = true; };
  }, []);

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
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [lang]);

  const arFont = isAr ? { fontFamily: 'var(--font-ar)' } : {};
  const svcOnClick = {
    products:    () => nav('/products'),
    suppliers:   () => nav('/suppliers'),
    manufacture: () => setIdeaOpen(true),
    support:     () => nav('/contact'),
  };
  const productName = (p) => lang === 'zh' ? (p.name_zh || p.name_en || p.name_ar || '—')
    : lang === 'en' ? (p.name_en || p.name_ar || p.name_zh || '—')
    : (p.name_ar || p.name_en || p.name_zh || '—');
  const productImg = (p) => p.image_url || (Array.isArray(p.gallery_images) ? p.gallery_images[0] : null);

  return (
    <div ref={rootRef} className={`home2${isAr ? ' rtl' : ''}`}>
      <RoleIntroTour lang={lang} user={user} />

      {/* ── Hero ── */}
      <section className="home2-hero reveal">
        <div className="home2-hero-text">
          <p className="home2-tag" style={arFont}>{t.tag}</p>
          <h1 className="home2-title" style={arFont}>{t.heroTitle}</h1>
          <p className="home2-sub" style={arFont}>{t.heroSub}</p>
          <div className="home2-actions">
            <button className="btn-primary" onClick={() => nav('/requests')}>{t.heroBtn1}</button>
            <button className="btn-outline" onClick={() => nav('/suppliers')}>{t.heroBtn2}</button>
          </div>
        </div>
        <div className="home2-hero-img">
          <img src="/home/hero-full.png" alt="" loading="eager" />
        </div>
      </section>

      {/* ── Supplier CTA — prominent, for the supplier outreach link ── */}
      <section className="home2-supplier reveal">
        <div className="home2-supplier-text">
          <h2 className="home2-supplier-title" style={arFont}>
            {isAr ? 'هل أنت مورد؟' : lang === 'zh' ? '您是供应商吗？' : 'Are you a supplier?'}
          </h2>
          <p className="home2-supplier-sub" style={arFont}>
            {isAr ? 'انضم إلى معبر وابدأ البيع لمشترين سعوديين موثوقين.'
              : lang === 'zh' ? '加入 Maabar，开始向可信的沙特买家销售。'
              : 'Join Maabar and start selling to trusted Saudi buyers.'}
          </p>
        </div>
        <button className="btn-primary home2-supplier-btn" onClick={() => nav('/login/supplier')}>
          Register as Supplier
        </button>
      </section>

      {/* ── Services ── */}
      <section className="home2-services reveal">
        {t.services.map((sv) => (
          <button key={sv.key} className="home2-svc" onClick={svcOnClick[sv.key]}>
            <span className="home2-svc-icon">{ICONS[sv.key]}</span>
            <span className="home2-svc-title" style={arFont}>{sv.title}</span>
            <span className="home2-svc-desc" style={arFont}>{sv.desc}</span>
          </button>
        ))}
      </section>

      {/* ── Managed sourcing — premium gold band ── */}
      <section className="home2-managed reveal">
        <span className="home2-shine" aria-hidden="true" />
        <div className="home2-managed-content">
          <div className="home2-managed-head">
            <h2 className="home2-managed-title" style={arFont}>{t.mgTitle}</h2>
            <span className="home2-managed-badge" style={arFont}>★ {t.mgBadge}</span>
          </div>
          <p className="home2-managed-sub" style={arFont}>{t.mgSub}</p>
          <ul className="home2-managed-bullets">
            {t.mgBullets.map((b, i) => (
              <li key={i} style={arFont}><span className="home2-check">✓</span>{b}</li>
            ))}
          </ul>
          <button className="btn-primary home2-managed-btn" onClick={() => nav('/requests?mode=managed')}>{t.mgBtn}</button>
        </div>
      </section>

      {/* ── Products carousel ── */}
      {products.length > 0 && (
        <section className="home2-products reveal">
          <div className="home2-sec-head">
            <h2 className="home2-sec-title" style={arFont}>{t.productsTitle}</h2>
            <button className="home2-viewall" style={arFont} onClick={() => nav('/products')}>
              {t.viewAll} {isAr ? '←' : '→'}
            </button>
          </div>
          <div className="home2-products-scroll">
            {products.map((p) => {
              const img = productImg(p);
              return (
                <button key={p.id} className="home2-pcard" onClick={() => nav(`/products/${p.id}`)}>
                  <span className="home2-pimg">{img ? <img src={img} alt="" loading="lazy" /> : null}</span>
                  <span className="home2-pname" style={arFont}>{productName(p)}</span>
                  {p.price_from ? <span className="home2-pprice">{p.price_from} {p.currency || 'USD'}</span> : null}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Final CTA ── */}
      <section className="home2-cta reveal">
        <div className="home2-cta-body">
          <h2 className="home2-cta-title" style={arFont}>{t.ctaTitle}</h2>
          <p className="home2-cta-text" style={arFont}>{t.ctaText}</p>
          <button className="btn-primary" onClick={() => nav('/requests?mode=managed')}>{t.ctaBtn}</button>
        </div>
        <div className="home2-cta-img"><img src="/home/boxes-pallets.png" alt="" loading="lazy" /></div>
      </section>

      {/* ── App coming soon ── */}
      <section className="home2-app reveal">
        <h2 className="home2-app-title" style={arFont}>{t.appTitle}</h2>
        <p className="home2-app-text" style={arFont}>{t.appText}</p>
        <div className="home2-stores">
          <span className="home2-store">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12.6c0-2 1.6-3 1.7-3-.9-1.4-2.4-1.5-2.9-1.6-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7c-1.3 0-2.6.8-3.3 2-1.4 2.4-.4 6 1 8 .7 1 1.4 2 2.4 2s1.3-.6 2.5-.6 1.5.6 2.6.6 1.7-1 2.3-2c.7-1.1 1-2.2 1-2.2s-1.7-.6-1.7-2.6zM14.5 6.3c.6-.7 1-1.6.9-2.6-.8 0-1.8.6-2.4 1.3-.5.6-1 1.5-.9 2.5.9.1 1.8-.5 2.4-1.2z" /></svg>
            App Store
          </span>
          <span className="home2-store">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3.6 2.3c-.3.3-.5.8-.5 1.4v16.6c0 .6.2 1.1.5 1.4l.1.1L13 12.1v-.2L3.7 2.2l-.1.1zM16.3 15.4l-3.1-3.1v-.2l3.1-3.1.1.1 3.7 2.1c1 .6 1 1.6 0 2.2l-3.7 2.1-.1-.1zM15.7 16l-3.2-3.2L3.6 21.8c.4.4 1 .4 1.7.1l10.4-5.9zM15.7 8L5.3 2.1c-.7-.4-1.3-.3-1.7.1l8.9 8.9L15.7 8z" /></svg>
            Google Play
          </span>
          <span className="home2-soon" style={arFont}>{t.soon}</span>
        </div>
      </section>

      <Footer lang={lang} />

      {ideaOpen && (
        <IdeaToProduct lang={lang} user={user} onClose={() => setIdeaOpen(false)} />
      )}
    </div>
  );
}
