import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../../supabase';

// ─── Icons ───────────────────────────────────────────────────────────────────
// Inline stroke icons (currentColor, 24-grid) — no icon library dependency.
const PATHS = {
  overview:  'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
  suppliers: 'M3 21V9l6-4 6 4v12M9 21v-5h3v5M15 21V11l6 3v7M3 21h18',
  referrals: 'M16 6a3 3 0 1 0 0-.01M6 14a3 3 0 1 0 0-.01M16 20a3 3 0 1 0 0-.01M8.6 12.7l4.8-3.4M8.6 15.3l4.8 3.4',
  concierge: 'M12 3a7 7 0 0 0-7 7v5M19 15v-5a7 7 0 0 0-2.1-5M4 15h2v5H4zM18 15h2v5h-2zM12 21h4',
  disputes:  'M12 3l9 16H3zM12 9v5M12 17v.5',
  traders:   'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-.01M22 20v-2a4 4 0 0 0-3-3.8',
  orders:    'M3 6h18l-1.5 12H4.5zM3 6l-.7-3H1M8 11v4M12 11v4M16 11v4',
  payments:  'M2 7h20v11H2zM2 11h20M6 15h4',
  support:   'M21 12a9 9 0 1 1-3.2-6.9M21 4v5h-5M12 8v5M12 16v.5',
  emails:    'M3 6h18v13H3zM3 6l9 7 9-7',
  analytics: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  settings:  'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M19.4 14a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1V20a2 2 0 1 1-4 0v-.1A1.6 1.6 0 0 0 7.5 18.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.6 1.6 0 0 0 4 14H4a2 2 0 1 1 0-4h.1A1.6 1.6 0 0 0 5.6 7.5l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.6 1.6 0 0 0 11 4V4a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 2.7 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 .3 1.8h.1a2 2 0 1 1 0 4H20',
  menu:      'M3 6h18M3 12h18M3 18h18',
  logout:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  chevron:   'M6 9l6 6 6-6',
};

function Icon({ name, size = 17, style }) {
  const d = PATHS[name];
  if (!d) return null;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
         style={{ flexShrink: 0, ...style }} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

// ─── Navigation, grouped ─────────────────────────────────────────────────────
// Grouping replaces a flat list of 11 equally-weighted links, where nothing
// signalled what mattered. The old `phase: 2` / "SOON" tags are gone — every one
// of these pages is real now, so the label was lying.
const NAV_GROUPS = [
  {
    en: 'Operations', ar: 'العمليات',
    items: [
      { path: '/admin/overview',  icon: 'overview',  en: 'Overview',   ar: 'نظرة عامة' },
      { path: '/admin/suppliers', icon: 'suppliers', en: 'Suppliers',  ar: 'الموردون' },
      { path: '/admin/referrals', icon: 'referrals', en: 'Referrals',  ar: 'الإحالات' },
      { path: '/admin/concierge', icon: 'concierge', en: 'Concierge',  ar: 'الكونسيرج' },
    ],
  },
  {
    en: 'Commerce', ar: 'التجارة',
    items: [
      { path: '/admin/orders',   icon: 'orders',   en: 'Orders',   ar: 'الطلبات' },
      { path: '/admin/payments', icon: 'payments', en: 'Payments', ar: 'المدفوعات' },
      { path: '/admin/traders',  icon: 'traders',  en: 'Traders',  ar: 'التجار' },
    ],
  },
  {
    en: 'Care', ar: 'الدعم',
    items: [
      { path: '/admin/support',  icon: 'support',  en: 'Support',  ar: 'التذاكر' },
      { path: '/admin/disputes', icon: 'disputes', en: 'Disputes', ar: 'النزاعات' },
    ],
  },
  {
    en: 'System', ar: 'النظام',
    items: [
      { path: '/admin/emails',    icon: 'emails',    en: 'Emails',    ar: 'الإيميلات' },
      { path: '/admin/analytics', icon: 'analytics', en: 'Analytics', ar: 'التحليلات' },
      { path: '/admin/settings',  icon: 'settings',  en: 'Settings',  ar: 'الإعدادات' },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap(g => g.items);

const BOTTOM_NAV = [
  { path: '/admin/overview',  icon: 'overview',  en: 'Overview',  ar: 'عامة' },
  { path: '/admin/suppliers', icon: 'suppliers', en: 'Suppliers', ar: 'موردون' },
  { path: '/admin/referrals', icon: 'referrals', en: 'Referrals', ar: 'إحالات' },
  { path: '/admin/concierge', icon: 'concierge', en: 'Concierge', ar: 'كونسيرج' },
];

// ─── Wordmark ────────────────────────────────────────────────────────────────
// States "ADMIN CONSOLE / لوحة الإدارة" outright instead of a 9px chip nobody read.
function AdminWordmark({ isAr, onDark = true }) {
  const primary = onDark ? 'rgba(255,255,255,0.94)' : 'var(--text-primary)';
  const second  = onDark ? 'rgba(255,255,255,0.42)' : 'var(--text-secondary)';
  const rule    = onDark ? 'rgba(255,255,255,0.14)' : 'var(--border)';
  return (
    <div dir="ltr" style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 16, fontWeight: 500, letterSpacing: '0.22em', color: primary, textTransform: 'uppercase' }}>
          MAABAR
        </span>
        <span style={{ color: rule, fontSize: 14, fontWeight: 300 }}>|</span>
        <span style={{ fontFamily: 'var(--font-ar)', fontSize: 14, fontWeight: 600, color: second }}>مَعبر</span>
      </div>
      <div style={{ marginTop: 7, paddingTop: 7, borderTop: `1px solid ${rule}`, display: 'flex', alignItems: 'baseline', gap: 7 }}>
        <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', color: onDark ? 'rgba(255,255,255,0.62)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
          Admin Console
        </span>
        <span style={{ fontFamily: 'var(--font-ar)', fontSize: 11, fontWeight: 600, color: onDark ? 'rgba(255,255,255,0.40)' : 'var(--text-muted)' }}>
          لوحة الإدارة
        </span>
      </div>
    </div>
  );
}

function NavItem({ item, isActive, isAr, onClick }) {
  return (
    <button className={`a-nav-item${isActive ? ' on' : ''}`} onClick={() => onClick(item.path)}
            style={{ flexDirection: isAr ? 'row-reverse' : 'row', textAlign: isAr ? 'right' : 'left' }}>
      <span className="a-nav-rail" />
      <Icon name={item.icon} />
      <span style={{ flex: 1, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        {isAr ? item.ar : item.en}
      </span>
    </button>
  );
}

export default function AdminShell({ children, user, profile, lang }) {
  const nav = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const isAr = lang === 'ar';
  const activePath = location.pathname;

  useEffect(() => { setDrawerOpen(false); setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  // Close the account menu on any outside click.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  const handleNav = (path) => { setDrawerOpen(false); nav(path); };
  const handleSignOut = async () => { await sb.auth.signOut(); nav('/login'); };

  const displayName = profile?.full_name || profile?.email || 'Admin';
  const initial = (displayName || 'A').trim().charAt(0).toUpperCase();
  const roleLabel = (profile?.role || '').replace('_', ' ');

  const isItemActive = (path) => activePath === path || (path !== '/admin/overview' && activePath.startsWith(path));
  const current = ALL_ITEMS.find(i => isItemActive(i.path));
  const pageLabel = current ? (isAr ? current.ar : current.en) : (isAr ? 'لوحة الإدارة' : 'Admin');

  const SidebarInner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '22px 18px 18px' }}>
        <AdminWordmark isAr={isAr} />
      </div>
      {/* role="navigation" instead of <nav>: index.css styles the bare `nav`
          element as the site's fixed top bar (position:fixed; top:0; z-index:1000),
          so any <nav> in here inherits it and covers the admin top bar. */}
      <div role="navigation" style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 16px' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.en} style={{ marginBottom: 14 }}>
            <p className="a-nav-group" style={{ textAlign: isAr ? 'right' : 'left', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? group.ar : group.en}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {group.items.map(item => (
                <NavItem key={item.path} item={item} isActive={isItemActive(item.path)} isAr={isAr} onClick={handleNav} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AccountMenu = () => (
    <div ref={menuRef} style={{ position: 'relative' }}>
      <button className="a-account" onClick={() => setMenuOpen(o => !o)} aria-haspopup="menu" aria-expanded={menuOpen}
              style={{ flexDirection: isAr ? 'row-reverse' : 'row' }}>
        <span className="a-avatar">{initial}</span>
        <span className="a-account-name" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{displayName}</span>
        <Icon name="chevron" size={14} style={{ opacity: 0.5 }} />
      </button>
      {menuOpen && (
        <div className="a-menu" style={{ [isAr ? 'left' : 'right']: 0, textAlign: isAr ? 'right' : 'left' }} role="menu">
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {displayName}
            </p>
            <p style={{ margin: '3px 0 0', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}>
              {roleLabel}
            </p>
          </div>
          <button className="a-menu-item" onClick={handleSignOut} role="menuitem"
                  style={{ flexDirection: isAr ? 'row-reverse' : 'row', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            <Icon name="logout" size={16} />
            <span>{isAr ? 'تسجيل الخروج' : 'Sign out'}</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style>{`
        .a-shell { display: flex; min-height: 100dvh; background: var(--bg-page); }

        /* ── Dark sidebar: the single biggest lever turning a web page into a console ── */
        .a-sidebar {
          width: 244px; position: fixed; top: 0; bottom: 0; z-index: 100;
          background: var(--ink); overflow-y: auto;
          display: flex; flex-direction: column;
        }
        .a-sidebar.rtl { right: 0; left: auto; }
        .a-sidebar.ltr { left: 0; right: auto; }

        .a-nav-group {
          margin: 0 0 6px; padding: 0 12px;
          font-size: 9px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase;
          color: rgba(255,255,255,0.30);
        }
        .a-nav-item {
          position: relative; display: flex; align-items: center; gap: 11px;
          width: 100%; padding: 0 12px; min-height: 40px;
          border: none; background: transparent; cursor: pointer;
          border-radius: var(--radius-control);
          color: rgba(255,255,255,0.66); font-size: 13px; font-weight: 400;
          transition: background 0.12s, color 0.12s;
        }
        .a-nav-item:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.90); }
        .a-nav-item.on { background: rgba(237,232,220,0.12); color: #fff; font-weight: 600; }
        .a-nav-rail {
          position: absolute; top: 9px; bottom: 9px; width: 2.5px; border-radius: 2px;
          background: transparent; transition: background 0.12s;
        }
        .a-sidebar.ltr .a-nav-rail, .a-drawer.ltr .a-nav-rail { left: 0; }
        .a-sidebar.rtl .a-nav-rail, .a-drawer.rtl .a-nav-rail { right: 0; }
        .a-nav-item.on .a-nav-rail { background: var(--bg-hero); }

        .a-content { flex: 1; min-width: 0; overflow-x: hidden; display: flex; flex-direction: column; }
        .a-content.ltr { margin-left: 244px; }
        .a-content.rtl { margin-right: 244px; }

        /* ── Top bar: page context + account. Desktop had none at all before. ── */
        .a-topbar {
          position: sticky; top: 0; z-index: 90;
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          height: 60px; padding: 0 24px;
          background: rgba(250,249,247,0.88); backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border);
        }
        .a-crumb { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
        .a-crumb-root {
          font-size: 10px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase;
          color: var(--text-muted); font-family: var(--font-sans); white-space: nowrap;
        }
        .a-crumb-sep { color: var(--border-strong); font-size: 12px; }
        .a-crumb-page {
          font-size: 15px; font-weight: 600; color: var(--text-primary);
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .a-account {
          display: flex; align-items: center; gap: 9px; padding: 5px 10px 5px 6px;
          background: transparent; border: 1px solid transparent; border-radius: 99px;
          cursor: pointer; min-height: 40px; transition: background 0.12s, border-color 0.12s;
        }
        .a-account:hover { background: var(--bg-hero); border-color: var(--border); }
        .a-avatar {
          width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
          background: var(--ink); color: var(--on-dark);
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600; font-family: var(--font-sans);
        }
        .a-account-name {
          font-size: 13px; color: var(--text-secondary); max-width: 150px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .a-menu {
          position: absolute; top: calc(100% + 8px); min-width: 210px; z-index: 400;
          background: var(--bg-raised); border: 1px solid var(--border);
          border-radius: 12px; box-shadow: 0 12px 32px rgba(26,24,20,0.12); overflow: hidden;
        }
        .a-menu-item {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 12px 14px; min-height: 44px;
          background: transparent; border: none; cursor: pointer;
          font-size: 13px; color: var(--text-secondary); transition: background 0.12s, color 0.12s;
        }
        .a-menu-item:hover { background: var(--bg-hero); color: var(--text-primary); }

        .a-main { flex: 1; min-width: 0; }

        .a-mobilebar { display: none; }
        .a-drawer-overlay { display: none; }
        .a-bottom-nav { display: none; }

        @media (max-width: 900px) {
          .a-sidebar { display: none; }
          .a-content.ltr, .a-content.rtl { margin-left: 0; margin-right: 0; }
          .a-topbar { padding: 0 14px; height: 56px; }
          .a-crumb-root { display: none; }
          .a-crumb-sep { display: none; }
          .a-account-name { display: none; }
          .a-mobilebar { display: flex; align-items: center; }
          .a-content { padding-bottom: 62px; }
          .a-drawer-overlay {
            display: block; position: fixed; inset: 0; z-index: 300;
            background: rgba(26,24,20,0.5); backdrop-filter: blur(3px);
          }
          .a-drawer {
            position: fixed; top: 0; bottom: 0; width: 274px; max-width: 88vw;
            background: var(--ink); z-index: 301; overflow-y: auto;
            transition: transform 0.24s cubic-bezier(0.4,0,0.2,1);
          }
          .a-drawer.ltr { left: 0; transform: translateX(-100%); }
          .a-drawer.ltr.open { transform: translateX(0); }
          .a-drawer.rtl { right: 0; transform: translateX(100%); }
          .a-drawer.rtl.open { transform: translateX(0); }
          .a-bottom-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; height: 58px;
            background: var(--ink); z-index: 200;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        }

        .a-hamburger {
          background: none; border: none; cursor: pointer; padding: 8px;
          min-width: 42px; min-height: 42px; display: flex; align-items: center;
          justify-content: center; border-radius: var(--radius-control);
          color: var(--text-secondary); transition: background 0.12s;
        }
        .a-hamburger:hover { background: var(--bg-hero); }

        .a-bnav-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; background: none; border: none; cursor: pointer;
          min-height: 58px; padding: 6px 4px; gap: 3px;
          color: rgba(255,255,255,0.52); transition: color 0.12s;
        }
        .a-bnav-btn.on { color: #fff; }
        .a-bnav-label { font-size: 9.5px; font-weight: 500; letter-spacing: 0.2px; line-height: 1; }
      `}</style>

      <div className="a-shell">
        {/* Desktop sidebar */}
        <aside className={`a-sidebar ${isAr ? 'rtl' : 'ltr'}`}><SidebarInner /></aside>

        {/* Mobile drawer */}
        {drawerOpen && <div className="a-drawer-overlay" onClick={() => setDrawerOpen(false)} />}
        <aside className={`a-drawer ${isAr ? 'rtl' : 'ltr'}${drawerOpen ? ' open' : ''}`}><SidebarInner /></aside>

        <div className={`a-content ${isAr ? 'rtl' : 'ltr'}`} dir={isAr ? 'rtl' : 'ltr'}>
          <header className="a-topbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div className="a-mobilebar">
                <button className="a-hamburger" onClick={() => setDrawerOpen(true)} aria-label={isAr ? 'القائمة' : 'Menu'}>
                  <Icon name="menu" size={20} />
                </button>
              </div>
              <div className="a-crumb">
                <span className="a-crumb-root">{isAr ? 'لوحة الإدارة' : 'Admin Console'}</span>
                <span className="a-crumb-sep">/</span>
                <span className="a-crumb-page" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {pageLabel}
                </span>
              </div>
            </div>
            <AccountMenu />
          </header>

          <main className="a-main">{children}</main>
        </div>

        {/* Mobile bottom nav */}
        {/* Also a div, for the same reason as the sidebar nav above. */}
        <div role="navigation" className="a-bottom-nav">
          {BOTTOM_NAV.map(item => (
            <button key={item.path} className={`a-bnav-btn${isItemActive(item.path) ? ' on' : ''}`} onClick={() => handleNav(item.path)}>
              <Icon name={item.icon} size={19} />
              <span className="a-bnav-label" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isAr ? item.ar : item.en}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
