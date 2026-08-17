import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Persistent trader bottom nav — an app shell. Rendered globally (from App.js) so it
// stays FIXED across the trader's pages (home, products, factories, managed order),
// not just inside the dashboard. Mobile-only: the `db-bottom-nav` CSS hides it on
// desktop, where the dashboard's top tabs take over.
//
// The center "+" opens a request-type sheet (standard / managed / idea) — the trader
// picks the type first, then lands in the right NEW flow (never the old combined form).

const T = {
  ar: { home: 'الرئيسية', products: 'المنتجات', factories: 'المصانع', requests: 'طلباتي', more: 'المزيد' },
  en: { home: 'Home', products: 'Products', factories: 'Factories', requests: 'Requests', more: 'More' },
  zh: { home: '首页', products: '产品', factories: '工厂', requests: '需求', more: '更多' },
};

const SHEET = {
  ar: { head: 'ارفع طلبك',
    standardT: 'طلب عادي', standardS: 'لمنتج واضح وتحتاج عروض مباشرة من الموردين',
    managedT: 'الطلب المُدار', managedS: 'مَعبر تبحث لك وتتكفّل بكل خطوة حتى باب بيتك',
    ideaT: 'تصنيع فكرة', ideaS: 'حوّل فكرتك إلى طلب احترافي بمساعدة الذكاء الاصطناعي' },
  en: { head: 'Submit your request',
    standardT: 'Standard request', standardS: 'For a known product with direct offers from suppliers',
    managedT: 'Managed order', managedS: 'Maabar sources and handles every step to your door',
    ideaT: 'Build your idea', ideaS: 'Turn your idea into a professional request with AI' },
  zh: { head: '提交您的需求',
    standardT: '标准请求', standardS: '针对明确产品，直接获取供应商报价',
    managedT: '托管订单', managedS: 'Maabar 全程为您寻源直至送货上门',
    ideaT: '实现您的创意', ideaS: '借助 AI 将创意转化为专业请求' },
};

const MORE = {
  ar: [{ tab: 'samples', label: 'العينات' }, { tab: 'product-inquiries', label: 'استفسارات المنتجات' }, { tab: 'settings', label: 'الإعدادات' }],
  en: [{ tab: 'samples', label: 'Samples' }, { tab: 'product-inquiries', label: 'Product inquiries' }, { tab: 'settings', label: 'Settings' }],
  zh: [{ tab: 'samples', label: '样品' }, { tab: 'product-inquiries', label: '产品咨询' }, { tab: 'settings', label: '设置' }],
};

export default function BuyerBottomNav({ lang = 'ar' }) {
  const nav = useNavigate();
  const loc = useLocation();
  const isAr = lang === 'ar';
  const font = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const [moreOpen, setMoreOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const c = T[lang] || T.ar;
  const sh = SHEET[lang] || SHEET.ar;
  const more = MORE[lang] || MORE.ar;

  const params = new URLSearchParams(loc.search);
  const tab = params.get('tab') || 'overview';
  const onDash = loc.pathname === '/dashboard' || loc.pathname === '/dashboard/';
  const active = (id) => {
    if (id === 'home') return onDash && (tab === 'overview' || tab === 'direct-orders');
    if (id === 'products') return loc.pathname.startsWith('/products');
    if (id === 'factories') return loc.pathname.startsWith('/factories') || loc.pathname.startsWith('/factory');
    if (id === 'requests') return onDash && tab === 'requests';
    if (id === 'more') return onDash && ['samples', 'product-inquiries', 'settings'].includes(tab);
    return false;
  };

  const go = (id) => {
    setMoreOpen(false);
    if (id === 'home') nav('/dashboard');
    else if (id === 'products') nav('/products');
    else if (id === 'factories') nav('/factories');
    else if (id === 'requests') nav('/dashboard?tab=requests');
    else if (id === 'more') setMoreOpen((o) => !o);
    else if (id === 'new') { setMoreOpen(false); setSheetOpen(true); }
  };

  const pickType = (type) => {
    setSheetOpen(false);
    if (type === 'standard') nav('/requests');            // standard RFQ — suppliers compete
    else if (type === 'managed') nav('/request');         // the NEW managed wizard
    else if (type === 'idea') window.dispatchEvent(new CustomEvent('maabar:open-idea'));
  };

  const items = [
    { id: 'home', label: c.home }, { id: 'products', label: c.products },
    { id: 'new', label: null }, { id: 'factories', label: c.factories },
    { id: 'requests', label: c.requests }, { id: 'more', label: c.more },
  ];

  const Overlay = ({ onClose }) => (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1998, background: 'rgba(0,0,0,0.4)' }} />
  );
  const SheetRow = ({ title, sub, onClick, primary }) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: isAr ? 'right' : 'left',
      background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 15, marginBottom: 10, cursor: 'pointer',
      [isAr ? 'borderRight' : 'borderLeft']: primary ? '3px solid var(--bronze, #8B7355)' : undefined }}>
      <span style={{ flex: 1 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3, ...font }}>{title}</span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--text-disabled)', lineHeight: 1.5, ...font }}>{sub}</span>
      </span>
      <span style={{ color: 'var(--text-disabled)', fontSize: 16 }}>{isAr ? '←' : '→'}</span>
    </button>
  );

  return (
    <>
      {/* Request-type sheet */}
      {sheetOpen && <Overlay onClose={() => setSheetOpen(false)} />}
      {sheetOpen && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1999, background: 'var(--bg-base)', borderRadius: '24px 24px 0 0', padding: '12px 20px calc(24px + env(safe-area-inset-bottom, 0px))', animation: 'slideUp 0.2s ease' }}>
          <div style={{ width: 40, height: 4, background: 'var(--border-default, #ccc)', borderRadius: 2, margin: '0 auto 18px' }} />
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-disabled)', textAlign: isAr ? 'right' : 'left', marginBottom: 12, ...font }}>{sh.head}</p>
          <SheetRow title={sh.standardT} sub={sh.standardS} onClick={() => pickType('standard')} />
          <SheetRow title={sh.managedT} sub={sh.managedS} onClick={() => pickType('managed')} primary />
          <SheetRow title={sh.ideaT} sub={sh.ideaS} onClick={() => pickType('idea')} />
        </div>
      )}

      <nav className="db-bottom-nav" dir={isAr ? 'rtl' : 'ltr'}>
        {/* More menu */}
        {moreOpen && <Overlay onClose={() => setMoreOpen(false)} />}
        {moreOpen && (
          <div style={{ position: 'fixed', bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))', left: 0, right: 0, zIndex: 1999,
            background: 'var(--bg-overlay)', borderRadius: '16px 16px 0 0', padding: '16px 20px 8px', borderTop: '1px solid var(--border)', animation: 'slideUp 0.2s ease' }}>
            {more.map((m, i, arr) => (
              <button key={m.tab} onClick={() => { setMoreOpen(false); nav(`/dashboard?tab=${m.tab}`); }}
                style={{ display: 'block', width: '100%', textAlign: isAr ? 'right' : 'left', padding: '13px 0', background: 'none', border: 'none',
                  borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                  color: active('more') && tab === m.tab ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 15, cursor: 'pointer', ...font }}>
                {m.label}
              </button>
            ))}
          </div>
        )}

        {items.map((item) => {
          if (item.id === 'new') {
            return (
              <button key="new" onClick={() => go('new')} style={{ flex: 1, background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--text-primary)', color: 'var(--bg-base, #fff)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 300, marginTop: -4, lineHeight: 1 }}>+</span>
              </button>
            );
          }
          const isActive = active(item.id);
          return (
            <button key={item.id} onClick={() => go(item.id)} style={{ flex: 1, padding: '10px 4px 6px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'pointer', color: isActive ? 'var(--text-primary)' : 'var(--text-disabled)' }}>
              <span style={{ fontSize: 10.5, letterSpacing: isAr ? 0 : 0.5, fontWeight: isActive ? 700 : 400, ...font }}>{item.label}</span>
              {isActive && <div style={{ width: 16, height: 2, background: 'var(--text-primary)', borderRadius: 1 }} />}
            </button>
          );
        })}
      </nav>
    </>
  );
}
