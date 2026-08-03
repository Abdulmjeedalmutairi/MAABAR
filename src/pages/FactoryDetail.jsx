import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import { sb } from '../supabase';
import RequestQuoteModal from '../components/factory/RequestQuoteModal';
import { displayCategoryForCode, factoryTaglineForCode } from '../lib/factoryCategories';

const T = {
  ar: {
    home: 'الرئيسية', factories: 'المصانع',
    verifiedT: 'تم التحقق من المصنع', verifiedB: 'بيانات المصنع تم التحقق منها',
    listedT: 'مصنع مُدرج', listedB: 'بياناته من كتالوجاته الرسمية',
    catalogsB: 'متاحة للعرض', photosT: 'صور حقيقية', photosB: 'من كتالوجات المصنع',
    featured: 'موصى به', ctaHero: 'اطلب عرض سعر من هذا المصنع',
    trust1: 'تواصل آمن عبر منصة معبر', trust2: 'رد سريع من المصنع', trust3: 'بدون رسوم خفية',
    catsAll: 'عرض كل الكتالوجات', catView: 'استعراض الكتالوج', catProducts: 'منتج', catPages: 'صفحة',
    prodsTitle: 'أمثلة من منتجات المصنع', prodsMore: 'عرض المزيد من المنتجات',
    clearFilter: 'إلغاء التصفية', filterOn: 'كتالوج',
    viewAll: 'عرض كل الصور', srcSection: 'مصادر المعلومات',
    src1T: 'الكتالوجات الرسمية للمصنع', src1B: 'تم استخراج المعلومات من الكتالوجات الرسمية للمصنع.',
    src2T: 'صور المنتجات الأصلية', src2B: 'جميع الصور المعروضة مأخوذة من كتالوجات المصنع.',
    src3T: 'يتم تحديث البيانات بشكل مستمر', src3B: 'نعمل على تحديث بيانات المصنع والكتالوجات بشكل دوري.',
    bandT: 'هل ترغب بالحصول على عرض سعر من هذا المصنع؟',
    bandS: 'راسل المصنع مباشرة واحصل على أفضل عرض سعر يناسب احتياجك.',
    bandBtn: 'اطلب عرض سعر الآن',
    srcline: 'المعلومات والصور مصدرها كتالوجات المصنع الرسمية، وتُحدَّث دوريًا.',
    catalogsTitle: 'الكتالوجات المتاحة', notFound: 'المصنع غير موجود', loading: '…',
  },
  en: {
    home: 'Home', factories: 'Factories',
    verifiedT: 'Verified factory', verifiedB: 'Factory data has been verified',
    listedT: 'Listed factory', listedB: 'Data from its official catalogs',
    catalogsB: 'available to view', photosT: 'Real photos', photosB: 'From the factory catalogs',
    featured: 'Recommended', ctaHero: 'Request a quote from this factory',
    trust1: 'Secure via Maabar', trust2: 'Fast factory response', trust3: 'No hidden fees',
    catsAll: 'View all catalogs', catView: 'Browse catalog', catProducts: 'products', catPages: 'pages',
    prodsTitle: 'Sample factory products', prodsMore: 'Show more products',
    clearFilter: 'Clear filter', filterOn: 'Catalog',
    viewAll: 'View all photos', srcSection: 'Information sources',
    src1T: 'Official factory catalogs', src1B: 'Information is extracted from the official factory catalogs.',
    src2T: 'Original product photos', src2B: 'All shown images are taken from the factory catalogs.',
    src3T: 'Continuously updated', src3B: 'We update factory data and catalogs periodically.',
    bandT: 'Want a quote from this factory?',
    bandS: 'Message the factory directly and get the best quote for your needs.',
    bandBtn: 'Request a quote now',
    srcline: "Information and images are sourced from the factory's official catalogs and updated periodically.",
    catalogsTitle: 'Available catalogs', notFound: 'Factory not found', loading: '…',
  },
  zh: {
    home: '首页', factories: '工厂',
    verifiedT: '已核实工厂', verifiedB: '工厂数据已核实',
    listedT: '已收录工厂', listedB: '数据来自其官方目录',
    catalogsB: '可查看', photosT: '真实图片', photosB: '来自工厂目录',
    featured: '推荐', ctaHero: '向该工厂请求报价',
    trust1: '经 Maabar 安全沟通', trust2: '工厂快速回复', trust3: '无隐藏费用',
    catsAll: '查看全部目录', catView: '浏览目录', catProducts: '产品', catPages: '页',
    prodsTitle: '工厂产品示例', prodsMore: '查看更多产品',
    clearFilter: '清除筛选', filterOn: '目录',
    viewAll: '查看全部图片', srcSection: '信息来源',
    src1T: '官方工厂目录', src1B: '信息提取自工厂官方目录。',
    src2T: '原始产品图片', src2B: '所有图片均取自工厂目录。',
    src3T: '持续更新', src3B: '我们会定期更新工厂数据与目录。',
    bandT: '想从该工厂获取报价吗？',
    bandS: '直接联系工厂，获得最适合您需求的报价。',
    bandBtn: '立即请求报价',
    srcline: '信息与图片来自工厂官方目录，并定期更新。',
    catalogsTitle: '可用目录', notFound: '未找到工厂', loading: '…',
  },
};

function Icon({ name, size = 20 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  switch (name) {
    case 'shield': return <svg {...p}><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" /><path d="M9 12l2 2 4-4" /></svg>;
    case 'folder': return <svg {...p}><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>;
    case 'images': return <svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>;
    case 'book': return <svg {...p}><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z" /><path d="M4 19a2 2 0 012-2h13" /></svg>;
    case 'refresh': return <svg {...p}><path d="M21 12a9 9 0 01-15 6.7L3 16" /><path d="M3 12a9 9 0 0115-6.7L21 8" /><path d="M21 4v4h-4M3 20v-4h4" /></svg>;
    case 'lock': return <svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></svg>;
    case 'headset': return <svg {...p}><path d="M4 13a8 8 0 0116 0" /><path d="M4 13v3a2 2 0 002 2h1v-5H6a2 2 0 00-2 2z" /><path d="M20 13v3a2 2 0 01-2 2h-1v-5h1a2 2 0 012 2z" /></svg>;
    case 'clock': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case 'check': return <svg {...p}><path d="M20 6L9 17l-5-5" /></svg>;
    case 'send': return <svg {...p}><path d="M22 2L11 13" /><path d="M22 2l-7 20-4-9-9-4 20-7z" /></svg>;
    case 'star': return <svg {...p} fill="currentColor" stroke="none"><path d="M12 2l3 6.5 7 .7-5.2 4.7 1.5 6.9L12 17l-6.3 3.8 1.5-6.9L2 9.2l7-.7L12 2z" /></svg>;
    case 'globe': return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3a15 15 0 010 18a15 15 0 010-18z" /></svg>;
    case 'box': return <svg {...p}><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5M12 13v8" /></svg>;
    case 'tag': return <svg {...p}><path d="M20 12l-8 8-9-9V3h8l9 9z" /><circle cx="7.5" cy="7.5" r="1.4" /></svg>;
    case 'pin': return <svg {...p}><path d="M12 21s-6-5.3-6-10a6 6 0 0112 0c0 4.7-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></svg>;
    default: return null;
  }
}

const flagFor = (country) => (/(china|中国)/i.test(country || '') ? '🇨🇳' : '');

// Rich factory profile page — catalog-cover hero, trust badges, Available
// Catalogs, product examples, information sources, and a request CTA.
export default function FactoryDetail({ lang = 'ar', user, displayCurrency }) {
  const { id } = useParams();
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const ar = isAr ? ' ar' : '';
  const c = T[lang] || T.ar;
  usePageTitle('suppliers', lang);

  const [factory, setFactory] = useState(null);
  const [products, setProducts] = useState([]);
  const [catalogs, setCatalogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reqOpen, setReqOpen] = useState(false);
  const [searchParams] = useSearchParams();
  // Opened from the "Request a quote" button on the factories list (/factory/:id?request=1).
  useEffect(() => { if (searchParams.get('request') === '1') setReqOpen(true); }, [searchParams]);
  const [activeCatalog, setActiveCatalog] = useState(null); // import_id filter
  const [visible, setVisible] = useState(20);
  const [viewerReqProduct, setViewerReqProduct] = useState(null); // request a quote for a specific product

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  useEffect(() => { setVisible(20); }, [activeCatalog]);

  async function load() {
    setLoading(true);
    const [{ data: f }, prods, { data: cats }] = await Promise.all([
      sb.from('factory_directory_public').select('*').eq('id', id).maybeSingle(),
      fetchAllFactoryProducts(id),
      sb.from('factory_catalogs_public').select('*').eq('factory_id', id).order('product_count', { ascending: false }),
    ]);
    setFactory(f || null);
    setProducts(prods);
    setCatalogs(cats || []);
    setLoading(false);
  }

  async function fetchAllFactoryProducts(factoryId) {
    const pageSize = 1000;
    const all = [];
    for (let from = 0; ; from += pageSize) {
      const { data, error } = await sb.from('factory_products').select('*').eq('factory_id', factoryId)
        .order('sort_order', { ascending: true }).range(from, from + pageSize - 1);
      if (error || !data || data.length === 0) break;
      all.push(...data);
      if (data.length < pageSize) break;
    }
    return all;
  }


  if (loading) return <div className="full-page"><div className="fx-wrap"><p style={{ color: 'var(--text-secondary)' }}>{c.loading}</p></div></div>;
  if (!factory) return <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}><div className="fx-wrap"><p style={{ color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{c.notFound}</p></div></div>;

  const name = (factory.company_name_latin || '').trim() || factory.company_name || '';
  const desc = (isAr ? factory.description_ar : lang === 'zh' ? factory.description_zh : factory.description_en)
    || factory.description_en || factory.description_ar || factory.description_zh
    || factoryTaglineForCode(factory.category, lang);
  const backCat = displayCategoryForCode(factory.category);
  const categoryLabel = backCat ? (backCat.label[lang] || backCat.label.en) : null;
  const location = [factory.city, factory.country].filter(Boolean).join(isAr ? '، ' : ', ');

  // Only products with a usable image are showcased.
  const catalog = products.filter((p) => p.image);
  const productImages = catalog.map((p) => p.image).filter(Boolean);
  const heroImages = Array.from(new Set([factory.profile_image, ...productImages].filter(Boolean)));
  const productName = (p) => (isAr ? p.name_ar : lang === 'zh' ? p.name_zh : p.name_en) || p.name_en || p.name_ar || p.name_zh || '';
  const catalogCover = (cat) => {
    const p = catalog.find((pp) => pp.import_id === cat.id && pp.image);
    return (p && p.image) || heroImages[0] || null;
  };
  const showCatalogs = catalogs.length >= 2;
  // Count distinct catalogs from products (public, works without the catalogs view).
  const catalogCount = new Set(catalog.map((p) => p.import_id).filter(Boolean)).size || 1;
  const catWord = isAr ? (catalogCount === 1 ? 'كتالوج' : 'كتالوجات') : lang === 'zh' ? '目录' : (catalogCount === 1 ? 'catalog' : 'catalogs');

  const filtered = activeCatalog ? catalog.filter((p) => p.import_id === activeCatalog) : catalog;
  const shown = filtered.slice(0, visible);
  const activeCat = catalogs.find((x) => x.id === activeCatalog);

  // Data-driven trust stats (real numbers, not generic filler).
  const stats = [
    { icon: 'folder', value: `${catalog.length}`, label: isAr ? 'منتج' : lang === 'zh' ? '产品' : 'products' },
    { icon: 'book', value: `${catalogCount}`, label: catWord },
  ];
  if (factory.is_verified) stats.push({ icon: 'shield', value: isAr ? 'موثّق' : lang === 'zh' ? '已核实' : 'Verified', label: isAr ? 'تم التحقق' : lang === 'zh' ? '工厂' : 'factory' });
  else if (factory.founded_year) stats.push({ icon: 'clock', value: `${factory.founded_year}`, label: isAr ? 'سنة التأسيس' : lang === 'zh' ? '成立' : 'Established' });
  else stats.push({ icon: 'images', value: `${heroImages.length}`, label: isAr ? 'صورة' : lang === 'zh' ? '图片' : 'photos' });

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fx-wrap">
        {/* Breadcrumb */}
        <div className={`fp-crumb${ar}`}>
          <button type="button" onClick={() => nav('/')}>{c.home}</button><span className="sep">›</span>
          <button type="button" onClick={() => nav(backCat ? `/factories/${backCat.key}` : '/factories')}>{categoryLabel || c.factories}</button>
          <span className="sep">›</span><span className="cur">{name}</span>
        </div>

        {/* ── Hero ── */}
        <div className="fp-hero">
          <div className="fp-cover">
            {factory.profile_image ? (
              <div className="fp-cover-single"><img src={factory.profile_image} alt={name} /></div>
            ) : (
              <div className="fp-cover-initial">{(name || '?')[0]}</div>
            )}
          </div>

          <div className="fp-info">
            <div className="fp-name-row">
              <h1 className={`fp-name${ar}`}>{name}</h1>
              {factory.is_featured && <span className={`fp-badge feat${ar}`}><Icon name="star" size={12} />{c.featured}</span>}
            </div>
            {(categoryLabel || location) && (
              <p className={`fp-cat-line${ar}`}>
                {categoryLabel && <span>{categoryLabel}</span>}
                {location && <span className="loc">{flagFor(factory.country)} {location}</span>}
              </p>
            )}
            {factory.address && (
              <p className={`fp-addr${ar}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, margin: '2px 0 0',
                fontSize: 13, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                <span style={{ color: '#8B7355', flexShrink: 0, marginTop: 2 }}><Icon name="pin" size={13} /></span>
                <span>{factory.address}</span>
              </p>
            )}
            <p className={`fp-desc${ar}`}>{desc}</p>

            <div className="fp-stats">
              {stats.map((s, i) => (
                <div className="fp-stat" key={i}>
                  <Icon name={s.icon} size={22} />
                  <p className={`fp-stat-t${ar}`}>{s.value}</p>
                  <p className={`fp-stat-b${ar}`}>{s.label}</p>
                </div>
              ))}
            </div>

            <button className={`fp-cta${ar}`} onClick={() => setReqOpen(true)}><Icon name="send" size={18} />{c.ctaHero}</button>
            <p className={`fp-trust${ar}`}>
              <Icon name="lock" size={13} />{c.trust1}<span className="dot">·</span>{c.trust2}<span className="dot">·</span>{c.trust3}
            </p>
          </div>
        </div>

        {/* ── About the factory — real highlights (facts, not marketing filler) ── */}
        {(() => {
          const cards = [];
          if (factory.founded_year) cards.push({ icon: 'clock', t: isAr ? 'سنة التأسيس' : lang === 'zh' ? '成立年份' : 'Established', v: `${factory.founded_year}` });
          if (factory.export_markets) cards.push({ icon: 'globe', t: isAr ? 'أسواق التصدير' : lang === 'zh' ? '出口市场' : 'Export markets', v: factory.export_markets });
          if (factory.private_label) cards.push({ icon: 'tag', t: isAr ? 'العلامة الخاصة' : lang === 'zh' ? '贴牌代工' : 'Private label', v: 'OEM / ODM' });
          if (factory.moq_note) cards.push({ icon: 'box', t: isAr ? 'الحد الأدنى للطلب' : lang === 'zh' ? '起订量' : 'MOQ', v: factory.moq_note });
          if (!cards.length && !desc) return null;
          return (
            <div className="fp-sec">
              <div className="fp-sec-head">
                <h2 className={`fp-sec-title${ar}`}>{isAr ? 'نبذة عن المصنع' : lang === 'zh' ? '工厂简介' : 'About the factory'}</h2>
              </div>
              <div className="fp-about">
                {desc && <p className={`fp-about-desc${ar}`}>{desc}</p>}
                {cards.length > 0 && (
                  <div className="fp-about-grid">
                    {cards.map((cd, i) => (
                      <div className="fp-about-card" key={i}>
                        <Icon name={cd.icon} size={20} />
                        <div>
                          <p className={`fp-about-t${ar}`}>{cd.t}</p>
                          <p className={`fp-about-v${ar}`}>{cd.v}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── Available catalogs (only when there's more than one) ── */}
        {showCatalogs && (
          <div className="fp-sec">
            <div className="fp-sec-head">
              <h2 className={`fp-sec-title${ar}`}>{c.catalogsTitle} ({catalogs.length})</h2>
            </div>
            <div className="fp-cats">
              {catalogs.map((cat) => {
                const cover = catalogCover(cat);
                const on = activeCatalog === cat.id;
                return (
                  <div className="fp-cat-card" key={cat.id}>
                    <div className="fp-cat-cover">
                      {cover && <img src={cover} alt="" loading="lazy" />}
                      <div className="fp-cat-cover-overlay">
                        <span className="fp-cat-cover-t">{cat.title}</span>
                      </div>
                    </div>
                    <div className="fp-cat-body">
                      <p className={`fp-cat-title${ar}`}>{cat.title}</p>
                      <p className={`fp-cat-meta${ar}`}>
                        <Icon name="folder" size={13} />{cat.product_count} {c.catProducts}
                        {cat.page_count ? <>· <Icon name="book" size={13} />{cat.page_count} {c.catPages}</> : null}
                      </p>
                      <button className={`fp-cat-btn${on ? ' on' : ''}${ar}`}
                        onClick={() => { setActiveCatalog(on ? null : cat.id); document.getElementById('fp-prods')?.scrollIntoView({ behavior: 'smooth' }); }}>
                        <Icon name="book" size={15} />{c.catView}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Product examples ── */}
        {catalog.length > 0 && (
          <div className="fp-sec" id="fp-prods">
            <div className="fp-sec-head">
              <h2 className={`fp-sec-title${ar}`}>{c.prodsTitle} ({filtered.length})</h2>
            </div>
            {activeCat && (
              <div className={`fp-filter${ar}`}>
                {c.filterOn}: {activeCat.title}
                <button onClick={() => setActiveCatalog(null)} aria-label={c.clearFilter}>×</button>
              </div>
            )}
            <div className="fp-pgrid">
              {shown.map((p) => {
                const pn = productName(p) || '—';
                return (
                  <div className="fp-pcard" key={p.id}>
                    <button type="button" className="fp-pcard-media" onClick={() => nav(`/factory/${factory.id}/product/${p.id}`)} title={pn}>
                      <img src={p.image} alt={pn} loading="lazy" />
                    </button>
                    <div className="fp-pcard-body">
                      <p className={`fp-pcard-name${ar}`} onClick={() => nav(`/factory/${factory.id}/product/${p.id}`)}>{pn}</p>
                      {p.moq && <p className={`fp-pcard-moq${ar}`}>{isAr ? `الحد الأدنى: ${p.moq}` : lang === 'zh' ? `起订量 ${p.moq}` : `MOQ ${p.moq}`}</p>}
                      <button className={`fp-pcard-btn${ar}`} onClick={() => setViewerReqProduct(p)}>
                        <Icon name="send" size={14} />{isAr ? 'اطلب عرض سعر' : lang === 'zh' ? '请求报价' : 'Request a quote'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {filtered.length > visible && (
              <button className={`fx-btn-ghost fp-more${ar}`} onClick={() => setVisible(filtered.length)}>
                {isAr ? `عرض جميع المنتجات (${filtered.length})` : lang === 'zh' ? `查看全部产品 (${filtered.length})` : `View all products (${filtered.length})`}
              </button>
            )}
          </div>
        )}

        {/* ── Bottom CTA band ── */}
        <div className="fp-band">
          <div className="fp-band-main">
            <h3 className={`fp-band-t${ar}`}>{c.bandT}</h3>
            <p className={`fp-band-s${ar}`}>{c.bandS}</p>
          </div>
          <button className={`fp-band-btn${ar}`} onClick={() => setReqOpen(true)}>{c.bandBtn}<Icon name="send" size={17} /></button>
        </div>

        {/* Small source note (replaces the heavy "information sources" panel) */}
        <p className={`fp-srcline${ar}`}>{c.srcline}</p>
      </div>


      {viewerReqProduct && (
        <RequestQuoteModal lang={lang} user={user} factory={factory} product={viewerReqProduct} displayCurrency={displayCurrency} onClose={() => setViewerReqProduct(null)} />
      )}

      {reqOpen && (
        <RequestQuoteModal lang={lang} user={user} factory={factory} product={null} displayCurrency={displayCurrency} onClose={() => setReqOpen(false)} />
      )}

      <Footer lang={lang} />
    </div>
  );
}
