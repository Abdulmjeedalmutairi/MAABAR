import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import Footer from '../components/Footer';
import useReveal from '../hooks/useReveal';
import ProductChips from '../components/ProductChips';
import NegotiablePill from '../components/NegotiablePill';
import MoreOptionsBadge from '../components/MoreOptionsBadge';
import { startFactoryThread, buildProductRef } from '../lib/factoryThreads';
import { sb } from '../supabase';
import {
  displayCategoriesForLang, getFactoryDisplayCategory, codesForDisplayCategory,
} from '../lib/factoryCategories';

const PAGE = 12;

const T = {
  ar: { title: 'المنتجات', sub: 'تصفّح منتجات المصانع من كتالوجاتها الرسمية واطلب عرض سعر مباشرة.',
        search: 'ابحث عن منتج أو مصنع…', moq: 'الحد الأدنى', quote: 'عرض سعر', chat: 'راسل', onReq: 'عند الطلب',
        more: 'تحميل المزيد', empty: 'لا توجد منتجات في هذه الفئة بعد.', loading: 'جارٍ التحميل…' },
  en: { title: 'Products', sub: 'Browse products from factory catalogs and request a quote directly.',
        search: 'Search a product or factory…', moq: 'MOQ', quote: 'Quote', chat: 'Chat', onReq: 'On request',
        more: 'Load more', empty: 'No products in this category yet.', loading: 'Loading…' },
  zh: { title: '产品', sub: '浏览工厂目录中的产品并直接请求报价。',
        search: '搜索产品或工厂…', moq: '起订量', quote: '报价', chat: '联系', onReq: '面议',
        more: '加载更多', empty: '该类别暂无产品。', loading: '加载中…' },
};

const isUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
const nf = (v) => (v && v !== 'not_found' ? v : '');

export default function FactoryProducts({ lang = 'ar', user }) {
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [msgBusy, setMsgBusy] = useState(false);

  // Direct chat with a factory about a product (carries the product reference).
  async function handleMessage(product) {
    if (!user) { nav('/login'); return; }
    if (msgBusy) return;
    setMsgBusy(true);
    try {
      const threadId = await startFactoryThread(product.factory_id);
      nav(`/messages/factory/${threadId}`, { state: { product: buildProductRef(product) } });
    } catch (e) { setMsgBusy(false); alert(e.message || 'Could not open the conversation.'); }
  }
  const activeKey = searchParams.get('cat') || 'all';
  const isAr = lang === 'ar';
  const arc = isAr ? ' ar' : '';
  const c = T[lang] || T.ar;
  usePageTitle('suppliers', lang);

  const chips = useMemo(() => displayCategoriesForLang(lang), [lang]);
  const [items, setItems] = useState([]);   // products joined with their factory
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const [{ data: facs }, { data: prods }] = await Promise.all([
        sb.from('factory_directory_public').select('id, company_name, company_name_latin, category, certifications, private_label'),
        sb.from('factory_products').select('id, factory_id, name_ar, name_en, name_zh, image, moq, price, currency, customization_options, also_count, sort_order'),
      ]);
      if (!alive) return;
      const facMap = {};
      (facs || []).forEach((f) => { facMap[f.id] = f; });   // only ACTIVE factories (public view) → respects the draft gate
      const joined = (prods || [])
        .map((p) => ({ ...p, factory: facMap[p.factory_id] }))
        .filter((p) => p.factory && isUrl(p.image))
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
      setItems(joined);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => { setVisible(PAGE); }, [activeKey, q]);

  const activeCat = getFactoryDisplayCategory(activeKey);
  const filtered = useMemo(() => {
    let list = items;
    if (activeCat && !activeCat.all) {
      const codes = codesForDisplayCategory(activeKey);
      list = list.filter((p) => codes.includes(p.factory.category));
    }
    const s = q.trim().toLowerCase();
    if (s) {
      list = list.filter((p) => [
        p.name_ar, p.name_en, p.factory.company_name, p.factory.company_name_latin,
      ].filter(Boolean).some((v) => v.toLowerCase().includes(s)));
    }
    return list;
  }, [items, activeCat, activeKey, q]);

  const shown = filtered.slice(0, visible);
  // Open a product's detail, passing the FULL filtered list so its prev/next
  // arrows walk exactly what the user was browsing (cross-factory here).
  const openProduct = (p) => nav(`/factory/${p.factory_id}/product/${p.id}`,
    { state: { siblings: filtered.map((x) => ({ id: x.id, fid: x.factory_id })) } });
  const revealRef = useReveal([lang, activeKey, q, shown.length]);
  const pName = (p) => (isAr ? (nf(p.name_ar) || nf(p.name_en)) : lang === 'zh' ? (nf(p.name_zh) || nf(p.name_en)) : (nf(p.name_en) || nf(p.name_ar))) || '—';
  const fName = (p) => nf(p.factory.company_name_latin) || nf(p.factory.company_name) || '';
  // Catalog price (verbatim + currency unless already shown). null → "On request".
  const priceText = (p) => {
    const v = (nf(p.price) || '').trim();
    if (!v) return null;
    const cur = (nf(p.currency) || '').trim();
    return cur && !v.toLowerCase().includes(cur.toLowerCase()) ? `${v} ${cur}` : v;
  };

  return (
    <div className="full-page" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="fx-wrap">
        <h1 className={`fx-h1${arc}`}>{c.title}</h1>
        <p className={`fx-sub${arc}`}>{c.sub}</p>

        <input className="fp-psearch" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={c.search} dir={isAr ? 'rtl' : 'ltr'} />

        <div className="fx-filterbar">
          {chips.map((ch) => (
            <button key={ch.key} type="button"
              className={`fx-chip${activeKey === ch.key ? ' on' : ''}${arc}`}
              onClick={() => setSearchParams(ch.key === 'all' ? {} : { cat: ch.key })}>
              {ch.label}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={`fx-sub${arc}`}>{c.loading}</p>
        ) : shown.length === 0 ? (
          <p className={`fx-sub${arc}`}>{c.empty}</p>
        ) : (
          <div className="fp-pgrid" ref={revealRef}>
            {shown.map((p) => (
              <div className="fp-pcard reveal" key={p.id}>
                <button type="button" className="fp-pcard-media" onClick={() => openProduct(p)} title={pName(p)}>
                  <img src={p.image} alt={pName(p)} loading="lazy" />
                </button>
                <div className="fp-pcard-body">
                  <p className={`fp-pcard-name${arc}`} onClick={() => openProduct(p)}>{pName(p)}</p>
                  <ProductChips product={p} factory={p.factory} lang={lang} max={3} style={{ margin: '1px 0 2px' }} />
                  <button type="button" className={`fp-pcard-fac${arc}`} onClick={() => nav(`/factory/${p.factory_id}`)}>{fName(p)}</button>
                  <p className={`fp-pcard-moq${arc}`} style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: priceText(p) ? 3 : 0 }}>{priceText(p) || c.onReq}</p>
                  {priceText(p) && <NegotiablePill lang={lang} style={{ marginBottom: 3 }} />}
                  {nf(p.moq) && <p className={`fp-pcard-moq${arc}`}>{c.moq}: {p.moq}</p>}
                  {p.also_count > 0 && <MoreOptionsBadge count={p.also_count} lang={lang} style={{ marginTop: 4 }} />}
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <button className={`fp-pcard-btn${arc}`} style={{ flex: 1, marginTop: 0 }} onClick={() => nav(`/factory/${p.factory_id}?request=1`)}>{c.quote}</button>
                    <button type="button" onClick={() => handleMessage(p)} disabled={msgBusy}
                      style={{ flex: 1, marginTop: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        padding: '9px', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-strong)', background: 'transparent',
                        color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', fontSize: 12.5, cursor: msgBusy ? 'default' : 'pointer' }}>
                      {c.chat}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && filtered.length > visible && (
          <button className={`fx-loadmore${arc}`} onClick={() => setVisible((v) => v + PAGE)}>{c.more}</button>
        )}
      </div>
      <Footer lang={lang} />
    </div>
  );
}
