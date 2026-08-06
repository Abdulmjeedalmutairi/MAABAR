import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../../supabase';
import AdminRouteGuard from '../admin/AdminRouteGuard';
import '../../pages/admin2/console.css';

// ── Inline stroke icons (currentColor, 24-grid) ──────────────────────────────
const PATHS = {
  dashboard: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  suppliers: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01',
  quotations: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
  import: 'M12 3v10M8 9l4 4 4-4M20 17v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  legacy: 'M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.4 2.6L3 8M3 3v5h5M12 7v5l3 2',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  menu: 'M3 6h18M3 12h18M3 18h18',
  chevron: 'M6 9l6 6 6-6',
};
export function Icon({ name, size = 17, style }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// ── Navigation. Items with `live:false` are not built in this console yet — they
// open their current (legacy) equivalent so nothing is a dead end during the
// parallel build; each phase flips one to `live` on its new /admin2 route. ──────
const NAV = [
  { key: 'dashboard',  path: '/admin2/dashboard',  legacy: null,                    icon: 'dashboard',  ar: 'الرئيسية',       en: 'Dashboard',          live: true },
  { key: 'suppliers',  path: '/admin2/suppliers',  legacy: null,                    icon: 'suppliers',  ar: 'الموردون',       en: 'Suppliers',          live: true },
  { key: 'quotations', path: '/admin2/quotations', legacy: null,                    icon: 'quotations', ar: 'طلبات التسعير',  en: 'Quotation Requests', live: true },
  { key: 'import',     path: '/admin2/import',     legacy: null,                    icon: 'import',     ar: 'استيراد كتالوج', en: 'Import Catalog',     live: true },
  { key: 'notifs',     path: '/admin2/notifications', legacy: null,                 icon: 'bell',       ar: 'الإشعارات',      en: 'Notifications',      live: false },
];

// Collapsed "current console" — the legacy marketplace, kept reachable, out of
// the primary flow (decision: factory_directory is the supplier; park the rest).
const LEGACY = [
  { path: '/admin/orders', ar: 'الطلبات', en: 'Orders' },
  { path: '/admin/payments', ar: 'المدفوعات', en: 'Payments' },
  { path: '/admin/traders', ar: 'التجار', en: 'Traders' },
  { path: '/admin/support', ar: 'التذاكر', en: 'Support' },
  { path: '/admin/disputes', ar: 'النزاعات', en: 'Disputes' },
  { path: '/admin/referrals', ar: 'الإحالات', en: 'Referrals' },
  { path: '/admin/emails', ar: 'الإيميلات', en: 'Emails' },
  { path: '/admin/analytics', ar: 'التحليلات', en: 'Analytics' },
  { path: '/admin/settings', ar: 'الإعدادات', en: 'Settings' },
];

function Brand({ isAr }) {
  return (
    <div dir="ltr" style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 500, letterSpacing: '0.22em', color: 'var(--ac-ink)', textTransform: 'uppercase' }}>MAABAR</span>
        <span style={{ color: 'var(--ac-line-2)', fontSize: 13 }}>|</span>
        <span style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 600, color: 'var(--ac-muted)' }}>مَعبر</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--ac-faint)', textTransform: 'uppercase' }}>
        {isAr ? 'كونسول' : 'Console'}
      </div>
    </div>
  );
}

export default function ConsoleShell({ children, user, profile, lang, active }) {
  const nav = useNavigate();
  const location = useLocation();
  const isAr = lang === 'ar';
  const [drawer, setDrawer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [legacyOpen, setLegacyOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => { setDrawer(false); setMenu(false); }, [location.pathname]);
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menu]);

  const go = (item) => { setDrawer(false); nav(item.live === false && item.legacy ? item.legacy : item.path); };
  const signOut = async () => { await sb.auth.signOut(); nav('/login'); };

  const name = profile?.full_name || profile?.email || 'Admin';
  const initial = (name || 'A').trim().charAt(0).toUpperCase();
  const role = (profile?.role || '').replace('_', ' ');
  const current = NAV.find((n) => n.key === active);
  const pageLabel = current ? (isAr ? current.ar : current.en) : (isAr ? 'كونسول' : 'Console');

  const Sidebar = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="ac-brand"><Brand isAr={isAr} /></div>
      <div role="navigation" className="ac-nav">
        {NAV.map((item) => (
          <button key={item.key} className={`ac-nav-item${active === item.key ? ' on' : ''}`} onClick={() => go(item)}
                  style={{ flexDirection: isAr ? 'row-reverse' : 'row', textAlign: isAr ? 'right' : 'left' }}>
            <Icon name={item.icon} className="ac-nav-ico" style={{ opacity: active === item.key ? 1 : 0.72 }} />
            <span style={{ flex: 1, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{isAr ? item.ar : item.en}</span>
            {item.live === false && <span className="ac-nav-arrow">{isAr ? '↗' : '↗'}</span>}
          </button>
        ))}

        <p className="ac-nav-group-label" style={{ textAlign: isAr ? 'right' : 'left' }}>{isAr ? 'النظام القديم' : 'Legacy'}</p>
        <button className="ac-nav-item" onClick={() => setLegacyOpen((o) => !o)}
                style={{ flexDirection: isAr ? 'row-reverse' : 'row', textAlign: isAr ? 'right' : 'left' }}>
          <Icon name="legacy" className="ac-nav-ico" />
          <span style={{ flex: 1, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{isAr ? 'الأدوات القديمة' : 'Old tools'}</span>
          <Icon name="chevron" size={13} style={{ opacity: 0.4, transform: legacyOpen ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }} />
        </button>
        {legacyOpen && LEGACY.map((l) => (
          <button key={l.path} className="ac-nav-item" onClick={() => { setDrawer(false); nav(l.path); }}
                  style={{ flexDirection: isAr ? 'row-reverse' : 'row', textAlign: isAr ? 'right' : 'left', minHeight: 34, fontSize: 12.5, paddingInlineStart: 30, color: 'var(--ac-faint)' }}>
            <span style={{ flex: 1, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{isAr ? l.ar : l.en}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <div className="ac" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="ac-shell">
          {drawer && <div className="ac-drawer-ov" onClick={() => setDrawer(false)} />}
          <aside className={`ac-sidebar ${isAr ? 'rtl' : 'ltr'}${drawer ? ' open' : ''}`}><Sidebar /></aside>

          <div className={`ac-main ${isAr ? 'rtl' : 'ltr'}`}>
            <header className="ac-topbar">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <button className="ac-hamburger" onClick={() => setDrawer(true)} aria-label={isAr ? 'القائمة' : 'Menu'}><Icon name="menu" size={20} /></button>
                <div className="ac-crumb">
                  <span className="ac-crumb-root">{isAr ? 'كونسول' : 'Console'}</span>
                  <span className="ac-crumb-sep">/</span>
                  <span className="ac-crumb-page" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{pageLabel}</span>
                </div>
              </div>
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button className="ac-account" onClick={() => setMenu((o) => !o)} style={{ flexDirection: isAr ? 'row-reverse' : 'row' }}>
                  <span className="ac-avatar">{initial}</span>
                  <span className="ac-account-name" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{name}</span>
                  <Icon name="chevron" size={14} style={{ opacity: 0.5 }} />
                </button>
                {menu && (
                  <div className="ac-menu" style={{ [isAr ? 'left' : 'right']: 0, textAlign: isAr ? 'right' : 'left' }}>
                    <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--ac-line)' }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--ac-ink)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{name}</p>
                      <p style={{ margin: '3px 0 0', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--ac-faint)' }}>{role}</p>
                    </div>
                    <button className="ac-menu-item" onClick={signOut} style={{ flexDirection: isAr ? 'row-reverse' : 'row', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      <Icon name="logout" size={16} /><span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
                    </button>
                  </div>
                )}
              </div>
            </header>
            <main>{children}</main>
          </div>
        </div>
      </div>
    </AdminRouteGuard>
  );
}
