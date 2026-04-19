import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../../supabase';

const NAV = [
  { path: '/admin/overview',   labelEn: 'Overview',          labelAr: 'نظرة عامة',     phase: 1 },
  { path: '/admin/suppliers',  labelEn: 'Suppliers',         labelAr: 'الموردون',       phase: 1 },
  { path: '/admin/managed',    labelEn: 'Managed Requests',  labelAr: 'الطلبات المُدارة', phase: 1 },
  { path: '/admin/concierge',  labelEn: 'Concierge',         labelAr: 'الكونسيرج',     phase: 1 },
  { path: '/admin/disputes',   labelEn: 'Disputes',          labelAr: 'النزاعات',       phase: 2 },
  { path: '/admin/traders',    labelEn: 'Traders',           labelAr: 'التجار',         phase: 2 },
  { path: '/admin/orders',     labelEn: 'Orders',            labelAr: 'الطلبات',        phase: 2 },
  { path: '/admin/payments',   labelEn: 'Payments',          labelAr: 'المدفوعات',      phase: 2 },
  { path: '/admin/support',    labelEn: 'Support',           labelAr: 'الدعم',          phase: 2 },
  { path: '/admin/emails',     labelEn: 'Emails',            labelAr: 'الإيميلات',      phase: 2 },
  { path: '/admin/analytics',  labelEn: 'Analytics',         labelAr: 'التحليلات',      phase: 2 },
  { path: '/admin/settings',   labelEn: 'Settings',          labelAr: 'الإعدادات',      phase: 2 },
];

const BOTTOM_NAV = NAV.slice(0, 5); // Overview, Suppliers, Managed, Concierge, Disputes

const BOTTOM_ICONS = {
  '/admin/overview':   '▦',
  '/admin/suppliers':  '◈',
  '/admin/managed':    '◉',
  '/admin/concierge':  '◎',
  '/admin/disputes':   '◇',
};

function NavItem({ item, isActive, lang, onClick }) {
  const isRTL = lang === 'ar';
  return (
    <button
      onClick={() => onClick(item.path)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '10px 14px', border: 'none',
        background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
        borderRadius: 10, cursor: 'pointer', textAlign: isRTL ? 'right' : 'left',
        color: isActive ? 'var(--text-primary)' : item.phase === 2 ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.65)',
        fontSize: 13, fontWeight: isActive ? 600 : 400,
        fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)',
        minHeight: 44, transition: 'background 0.12s, color 0.12s',
        borderLeft: !isRTL && isActive ? '2px solid rgba(255,255,255,0.7)' : '2px solid transparent',
        borderRight: isRTL && isActive ? '2px solid rgba(255,255,255,0.7)' : '2px solid transparent',
      }}
    >
      {isRTL ? item.labelAr : item.labelEn}
      {item.phase === 2 && (
        <span style={{ marginInlineStart: 'auto', fontSize: 9, letterSpacing: 0.8, opacity: 0.5, fontFamily: 'var(--font-sans)' }}>
          SOON
        </span>
      )}
    </button>
  );
}

export default function AdminShell({ children, user, profile, lang, currentPath }) {
  const nav = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isRTL = lang === 'ar';
  const activePath = currentPath || location.pathname;

  // Close drawer on route change
  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleNav = (path) => {
    setDrawerOpen(false);
    nav(path);
  };

  const handleSignOut = async () => {
    await sb.auth.signOut();
    nav('/login');
  };

  const displayName = profile?.full_name || profile?.email || 'Admin';

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '16px 8px' }}>
      {/* Brand */}
      <div style={{ padding: '0 6px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 10, letterSpacing: 2.5, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase' }}>
          MAABAR
        </p>
        <p style={{ margin: '3px 0 0', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: 'var(--font-sans)', letterSpacing: 0.5 }}>
          Admin Console
        </p>
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {NAV.map(item => (
          <NavItem
            key={item.path}
            item={item}
            isActive={activePath.startsWith(item.path)}
            lang={lang}
            onClick={handleNav}
          />
        ))}
      </div>

      {/* User footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 14, marginTop: 12 }}>
        <div style={{ padding: '4px 8px 10px', direction: isRTL ? 'rtl' : 'ltr' }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {profile?.role?.replace('_', ' ')}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '9px 14px', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, cursor: 'pointer',
            color: 'rgba(255,255,255,0.5)', fontSize: 12, minHeight: 44,
            fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)',
            transition: 'all 0.15s',
          }}
        >
          {isRTL ? 'تسجيل الخروج' : 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .admin-shell-wrap { display: flex; min-height: var(--app-dvh, 100dvh); background: var(--bg-base); }
        .admin-sidebar {
          width: 220px; min-height: 100vh; position: fixed; top: 0;
          background: #0f0f0f; z-index: 100; overflow-y: auto;
          display: flex; flex-direction: column;
        }
        .admin-sidebar.ltr { left: 0; }
        .admin-sidebar.rtl { right: 0; }
        .admin-content {
          flex: 1; min-width: 0; overflow-x: hidden;
        }
        .admin-content.ltr { margin-left: 220px; }
        .admin-content.rtl { margin-right: 220px; }
        .admin-topbar { display: none; }
        .admin-drawer-overlay { display: none; }
        .admin-bottom-nav { display: none; }

        @media (max-width: 900px) {
          .admin-sidebar { display: none; }
          .admin-content.ltr { margin-left: 0; }
          .admin-content.rtl { margin-right: 0; }
          .admin-topbar {
            display: flex; align-items: center; justify-content: space-between;
            position: fixed; top: 0; left: 0; right: 0; height: 56px;
            background: #0f0f0f; z-index: 200; padding: 0 16px;
            border-bottom: 1px solid rgba(255,255,255,0.08);
          }
          .admin-content { padding-top: 56px; padding-bottom: 68px; }
          .admin-drawer-overlay {
            display: block; position: fixed; inset: 0; z-index: 300;
            background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);
          }
          .admin-drawer {
            position: fixed; top: 0; bottom: 0; width: 280px;
            background: #0f0f0f; z-index: 301; overflow-y: auto;
            transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
          }
          .admin-drawer.ltr { left: 0; transform: translateX(-100%); }
          .admin-drawer.ltr.open { transform: translateX(0); }
          .admin-drawer.rtl { right: 0; transform: translateX(100%); }
          .admin-drawer.rtl.open { transform: translateX(0); }
          .admin-bottom-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0;
            height: 60px; background: #0f0f0f; z-index: 200;
            border-top: 1px solid rgba(255,255,255,0.08);
          }
        }

        .admin-nav-item-hover:hover { background: rgba(255,255,255,0.06) !important; }
        .admin-topbar-btn {
          background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.7);
          font-size: 20px; padding: 8px; min-width: 44px; min-height: 44px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 8px; transition: background 0.12s;
        }
        .admin-topbar-btn:hover { background: rgba(255,255,255,0.08); }
        .admin-bottom-nav-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 4px; background: none; border: none;
          cursor: pointer; min-height: 60px; padding: 0;
          transition: background 0.12s; border-radius: 0;
        }
        .admin-bottom-nav-btn:active { background: rgba(255,255,255,0.06); }
      `}</style>

      <div className="admin-shell-wrap" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Desktop sidebar */}
        <nav className={`admin-sidebar ${isRTL ? 'rtl' : 'ltr'}`}>
          <SidebarContent />
        </nav>

        {/* Mobile topbar */}
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="admin-topbar-btn" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              ≡
            </button>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-sans)', letterSpacing: 1 }}>
              MAABAR ADMIN
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: 'var(--font-sans)' }}>
                {(displayName[0] || 'A').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile drawer overlay */}
        {drawerOpen && (
          <div className="admin-drawer-overlay" onClick={() => setDrawerOpen(false)}>
            <div
              className={`admin-drawer ${isRTL ? 'rtl' : 'ltr'} ${drawerOpen ? 'open' : ''}`}
              onClick={e => e.stopPropagation()}
            >
              <SidebarContent />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className={`admin-content ${isRTL ? 'rtl' : 'ltr'}`}>
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="admin-bottom-nav">
          {BOTTOM_NAV.map(item => {
            const isActive = activePath.startsWith(item.path);
            return (
              <button
                key={item.path}
                className="admin-bottom-nav-btn"
                onClick={() => handleNav(item.path)}
              >
                <span style={{ fontSize: 16, color: isActive ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)' }}>
                  {BOTTOM_ICONS[item.path]}
                </span>
                <span style={{
                  fontSize: 9, fontFamily: 'var(--font-sans)', letterSpacing: 0.3,
                  color: isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                  fontWeight: isActive ? 600 : 400, textTransform: 'uppercase',
                }}>
                  {lang === 'ar' ? item.labelAr.slice(0, 6) : item.labelEn.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
