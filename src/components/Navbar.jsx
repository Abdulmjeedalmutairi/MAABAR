import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../supabase';

export default function Navbar({ user, profile, lang, setLang, setUser, setProfile }) {
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const doSignOut = async () => {
    await sb.auth.signOut();
    setUser(null); setProfile(null);
    nav('/');
  };

  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';
  const location = useLocation();
const isHome = location.pathname === '/';

  const links = isSupplier
    ? [{ label: isAr ? 'الرئيسية' : 'Home', path: '/' }, { label: isAr ? 'الطلبات' : 'Requests', path: '/requests' }, { label: isAr ? 'لوحتي' : 'Dashboard', path: '/dashboard' }, { label: isAr ? 'عن مَعبر' : 'About', path: '/about' }]
    : [{ label: isAr ? 'الرئيسية' : 'Home', path: '/' }, { label: isAr ? 'المنتجات' : 'Products', path: '/products' }, { label: isAr ? 'عن مَعبر' : 'About', path: '/about' }, { label: isAr ? 'تواصل' : 'Contact', path: '/contact' }];

  return (
    <>
      <nav className={scrolled || !isHome ? 'scrolled' : ''}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <button className="nav-logo" onClick={() => nav('/')}>
            MAABAR <span className="ar-part">| مَعبر</span>
          </button>
        </div>

        <ul className="nav-links">
          {links.map((l, i) => (
            <li key={i}>
              <button className="nav-link" onClick={() => nav(l.path)}>{l.label}</button>
            </li>
          ))}
        </ul>

        <div className="nav-right">
          <div className="lang-switcher">
            {['ar', 'en', 'zh'].map(l => (
              <button key={l} className={`lang-btn${lang === l ? ' active' : ''}`} onClick={() => setLang(l)}>
                {l === 'ar' ? 'AR' : l === 'en' ? 'EN' : '中文'}
              </button>
            ))}
          </div>

          {user ? (
            <>
              <button className="nav-cta" onClick={() => nav('/dashboard')}>{isAr ? 'لوحتي' : 'Dashboard'}</button>
              <button className="nav-logout" onClick={doSignOut}>{isAr ? 'خروج' : 'Logout'}</button>
            </>
          ) : (
            <>
              {/* ← التغيير هنا: كل زر يروح لصفحة login مخصصة */}
              <button className="nav-supplier-btn" onClick={() => nav('/login/supplier')}>
                {isAr ? 'بوابة الموردين' : 'Supplier Portal'}
              </button>
              <button className="nav-cta" onClick={() => nav('/login/buyer')}>
                {isAr ? 'دخول / تسجيل' : 'Login'}
              </button>
            </>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu open">
          {links.map((l, i) => (
            <button key={i} className="mobile-menu-item" onClick={() => { nav(l.path); setMenuOpen(false); }}>{l.label}</button>
          ))}
          <div className="mobile-menu-auth">
            {user
              ? <><button className="btn-dark-sm" onClick={() => { nav('/dashboard'); setMenuOpen(false); }}>{isAr ? 'لوحتي' : 'Dashboard'}</button><button className="btn-outline" onClick={() => { doSignOut(); setMenuOpen(false); }}>{isAr ? 'خروج' : 'Logout'}</button></>
              : <>
    <button className="btn-dark-sm" onClick={() => { nav('/login/buyer'); setMenuOpen(false); }}>{isAr ? 'دخول / تسجيل' : 'Login'}</button>
    <button className="btn-outline" onClick={() => { nav('/login/supplier'); setMenuOpen(false); }}>{isAr ? 'بوابة الموردين' : 'Supplier Portal'}</button>
  </>
            }
          </div>
        </div>
      )}
    </>
  );
}