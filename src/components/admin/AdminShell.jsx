import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../../supabase';

const NAV = [
  { path: '/admin/overview',  enLabel: 'Overview',          arLabel: 'نظرة عامة',      phase: 1 },
  { path: '/admin/suppliers', enLabel: 'Suppliers',         arLabel: 'الموردون',        phase: 1 },
  { path: '/admin/concierge', enLabel: 'Concierge',         arLabel: 'الكونسيرج',      phase: 1 },
  { path: '/admin/disputes',  enLabel: 'Disputes',          arLabel: 'النزاعات',        phase: 2 },
  { path: '/admin/traders',   enLabel: 'Traders',           arLabel: 'التجار',          phase: 2 },
  { path: '/admin/orders',    enLabel: 'Orders',            arLabel: 'الطلبات',         phase: 2 },
  { path: '/admin/payments',  enLabel: 'Payments',          arLabel: 'المدفوعات',       phase: 2 },
  { path: '/admin/support',   enLabel: 'Support',           arLabel: 'الدعم',           phase: 2 },
  { path: '/admin/emails',    enLabel: 'Emails',            arLabel: 'الإيميلات',       phase: 2 },
  { path: '/admin/analytics', enLabel: 'Analytics',         arLabel: 'التحليلات',       phase: 2 },
  { path: '/admin/settings',  enLabel: 'Settings',          arLabel: 'الإعدادات',       phase: 2 },
];

const BOTTOM_NAV = [
  { path: '/admin/overview',  enLabel: 'Overview',  arLabel: 'نظرة عامة' },
  { path: '/admin/suppliers', enLabel: 'Suppliers', arLabel: 'الموردون' },
  { path: '/admin/concierge', enLabel: 'Concierge', arLabel: 'كونسيرج' },
  { path: '/admin/disputes',  enLabel: 'Disputes',  arLabel: 'نزاعات' },
];

// Trilingual logo — always LTR regardless of page direction
function MaabarAdminLogo() {
  return (
    <div dir="ltr" style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 15, fontWeight: 500, letterSpacing: '0.2em',
          color: 'rgba(0,0,0,0.88)', textTransform: 'uppercase',
        }}>
          MAABAR
        </span>
        <span style={{ color: '#d4cfc6', fontSize: 14, fontWeight: 300 }}>|</span>
        <span style={{
          fontFamily: "'Cairo', sans-serif",
          fontSize: 14, fontWeight: 600, color: '#6b6560',
          letterSpacing: 0,
        }}>
          مَعبر
        </span>
        <span style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 11, color: '#b0ab9e', letterSpacing: 0.3,
        }}>
          迈巴尔
        </span>
      </div>
      <div style={{ marginTop: 3 }}>
        <span style={{
          display: 'inline-block',
          fontFamily: "'Tajawal', sans-serif",
          fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
          color: '#fff', background: '#1a1814',
          padding: '1px 7px', borderRadius: 3,
          textTransform: 'uppercase',
        }}>
          ADMIN
        </span>
      </div>
    </div>
  );
}

function NavItem({ item, isActive, lang, onClick }) {
  const isAr = lang === 'ar';
  const label = isAr ? item.arLabel : item.enLabel;
  return (
    <button
      onClick={() => onClick(item.path)}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', padding: '0 12px', border: 'none',
        background: isActive ? '#1a1814' : 'transparent',
        borderRadius: 7, cursor: 'pointer',
        color: isActive ? '#fff' : item.phase === 2 ? 'rgba(0,0,0,0.28)' : 'rgba(0,0,0,0.62)',
        fontSize: 13, fontWeight: isActive ? 600 : 400,
        fontFamily: isAr ? "'Tajawal', sans-serif" : "'Tajawal', sans-serif",
        minHeight: 40, transition: 'background 0.12s, color 0.12s',
        textAlign: isAr ? 'right' : 'left',
      }}
    >
      <span>{label}</span>
      {item.phase === 2 && (
        <span style={{
          fontSize: 8, letterSpacing: 0.8, opacity: 0.5,
          fontFamily: "'Tajawal', sans-serif", fontWeight: 400,
        }}>
          SOON
        </span>
      )}
    </button>
  );
}

export default function AdminShell({ children, user, profile, lang }) {
  const nav = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isAr = lang === 'ar';
  const activePath = location.pathname;

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleNav = (path) => { setDrawerOpen(false); nav(path); };
  const handleSignOut = async () => { await sb.auth.signOut(); nav('/login'); };
  const displayName = profile?.full_name || profile?.email || 'Admin';

  const SidebarInner = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px 12px 16px' }}>
      {/* Logo */}
      <div style={{ padding: '0 4px 20px', borderBottom: '1px solid rgba(0,0,0,0.07)', marginBottom: 10 }}>
        <MaabarAdminLogo />
      </div>

      {/* Nav */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {NAV.map(item => (
          <NavItem
            key={item.path}
            item={item}
            isActive={activePath === item.path || (item.path !== '/admin/overview' && activePath.startsWith(item.path))}
            lang={lang}
            onClick={handleNav}
          />
        ))}
      </div>

      {/* User footer */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.07)', paddingTop: 12, marginTop: 12 }}>
        <div style={{ padding: '0 6px 10px', direction: isAr ? 'rtl' : 'ltr' }}>
          <p style={{
            margin: 0, fontSize: 13, fontWeight: 600, color: 'rgba(0,0,0,0.75)',
            fontFamily: "'Tajawal', sans-serif",
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {displayName}
          </p>
          <p style={{
            margin: '1px 0 0', fontSize: 9, color: 'rgba(0,0,0,0.35)',
            fontFamily: "'Tajawal', sans-serif", textTransform: 'uppercase', letterSpacing: 0.8,
          }}>
            {(profile?.role || '').replace('_', ' ')}
          </p>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: '8px 12px', background: 'transparent',
            border: '1px solid rgba(0,0,0,0.09)', borderRadius: 7, cursor: 'pointer',
            color: 'rgba(0,0,0,0.40)', fontSize: 12, minHeight: 40,
            fontFamily: "'Tajawal', sans-serif", transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = 'rgba(0,0,0,0.65)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(0,0,0,0.40)'; }}
        >
          {isAr ? 'تسجيل الخروج' : 'Sign out'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        .a-shell { display: flex; min-height: 100dvh; background: var(--bg-base, #FAF8F5); }

        /* Desktop sidebar */
        .a-sidebar {
          width: 216px; position: fixed; top: 0; bottom: 0;
          background: var(--bg-raised, #fff);
          border-right: 1px solid rgba(0,0,0,0.07);
          z-index: 100; overflow-y: auto; display: flex; flex-direction: column;
        }
        .a-sidebar.rtl { right: 0; left: auto; border-right: none; border-left: 1px solid rgba(0,0,0,0.07); }
        .a-sidebar.ltr { left: 0; right: auto; }
        .a-content { flex: 1; min-width: 0; overflow-x: hidden; }
        .a-content.ltr { margin-left: 216px; }
        .a-content.rtl { margin-right: 216px; }

        .a-topbar { display: none; }
        .a-drawer-overlay { display: none; }
        .a-bottom-nav { display: none; }

        @media (max-width: 900px) {
          .a-sidebar { display: none; }
          .a-content.ltr { margin-left: 0; }
          .a-content.rtl { margin-right: 0; }
          .a-topbar {
            display: flex; align-items: center; justify-content: space-between;
            position: fixed; top: 0; left: 0; right: 0; height: 58px;
            background: var(--bg-raised, #fff);
            border-bottom: 1px solid rgba(0,0,0,0.07);
            padding: 0 16px; z-index: 200;
          }
          .a-content { padding-top: 58px; padding-bottom: 62px; }
          .a-drawer-overlay {
            display: block; position: fixed; inset: 0; z-index: 300;
            background: rgba(26,24,20,0.45); backdrop-filter: blur(3px);
          }
          .a-drawer {
            position: fixed; top: 0; bottom: 0; width: 270px; max-width: 88vw;
            background: var(--bg-raised, #fff);
            z-index: 301; overflow-y: auto;
            transition: transform 0.24s cubic-bezier(0.4,0,0.2,1);
          }
          .a-drawer.ltr { left: 0; transform: translateX(-100%); }
          .a-drawer.ltr.open { transform: translateX(0); }
          .a-drawer.rtl { right: 0; transform: translateX(100%); }
          .a-drawer.rtl.open { transform: translateX(0); }
          .a-bottom-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; height: 58px;
            background: var(--bg-raised, #fff);
            border-top: 1px solid rgba(0,0,0,0.07); z-index: 200;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
        }

        .a-hamburger {
          background: none; border: none; cursor: pointer; padding: 8px;
          min-width: 44px; min-height: 44px; display: flex; align-items: center;
          justify-content: center; border-radius: 6px; transition: background 0.12s;
          color: rgba(0,0,0,0.6);
        }
        .a-hamburger:hover { background: rgba(0,0,0,0.05); }

        .a-bnav-btn {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          justify-content: center; background: none; border: none; cursor: pointer;
          min-height: 58px; padding: 6px 4px; gap: 2px; transition: background 0.12s;
        }
        .a-bnav-btn:active { background: rgba(0,0,0,0.04); }
        .a-bnav-label {
          font-size: 10px; font-family: 'Tajawal', sans-serif; font-weight: 500;
          letter-spacing: 0.2px; line-height: 1;
        }
      `}</style>

      <div className="a-shell" dir={isAr ? 'rtl' : 'ltr'}>
        {/* Desktop sidebar */}
        <nav className={`a-sidebar ${isAr ? 'rtl' : 'ltr'}`}>
          <SidebarInner />
        </nav>

        {/* Mobile topbar */}
        <div className="a-topbar">
          <button className="a-hamburger" onClick={() => setDrawerOpen(true)} aria-label="Menu">
            <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
              <rect y="0" width="18" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="6" width="14" height="1.5" rx="0.75" fill="currentColor"/>
              <rect y="12" width="10" height="1.5" rx="0.75" fill="currentColor"/>
            </svg>
          </button>
          <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <MaabarAdminLogo />
          </div>
          <div style={{ width: 44 }} />
        </div>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="a-drawer-overlay" onClick={() => setDrawerOpen(false)}>
            <div
              className={`a-drawer ${isAr ? 'rtl' : 'ltr'} open`}
              onClick={e => e.stopPropagation()}
            >
              <SidebarInner />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className={`a-content ${isAr ? 'rtl' : 'ltr'}`}>
          {children}
        </main>

        {/* Mobile bottom nav — text only, no icons */}
        <nav className="a-bottom-nav">
          {BOTTOM_NAV.map(item => {
            const isActive = activePath === item.path || activePath.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                className="a-bnav-btn"
                onClick={() => handleNav(item.path)}
              >
                <span className="a-bnav-label" style={{
                  color: isActive ? '#1a1814' : 'rgba(0,0,0,0.35)',
                  fontWeight: isActive ? 700 : 400,
                }}>
                  {isAr ? item.arLabel : item.enLabel}
                </span>
                {isActive && (
                  <span style={{ width: 16, height: 2, borderRadius: 1, background: '#1a1814', marginTop: 2 }} />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
}
