import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../supabase';

export default function Navbar({ user, profile, lang, setLang, setUser, setProfile }) {
  const nav = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef(null);
  const isHome = location.pathname === '/';
  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadNotifs();
    const interval = setInterval(loadNotifs, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifs = async () => {
    const { data } = await sb
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) {
      setNotifs(data);
      setUnread(data.filter(n => !n.is_read).length);
    }
  };

  const openNotifs = async () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && unread > 0) {
      await sb.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      setUnread(0);
      setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleNotifClick = (n) => {
    setNotifOpen(false);
    if (n.type === 'new_message') nav(`/chat/${n.ref_id}`);
    else nav('/dashboard');
  };

  const fmtTime = (d) => {
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 3600) return isAr ? Math.floor(diff / 60) + ' د' : Math.floor(diff / 60) + 'm';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' س' : Math.floor(diff / 3600) + 'h';
    return isAr ? Math.floor(diff / 86400) + ' ي' : Math.floor(diff / 86400) + 'd';
  };

  const doSignOut = async () => {
    await sb.auth.signOut();
    setUser(null); setProfile(null);
    nav('/');
  };

  const links = isSupplier
    ? [
        { label: isAr ? 'الرئيسية' : lang === 'zh' ? '首页' : 'Home', path: '/' },
        { label: isAr ? 'الطلبات' : lang === 'zh' ? '需求' : 'Requests', path: '/requests' },
        { label: isAr ? 'لوحتي' : lang === 'zh' ? '控制台' : 'Dashboard', path: '/dashboard' },
        { label: isAr ? 'عن مَعبر' : lang === 'zh' ? '关于' : 'About', path: '/about' },
      ]
    : [
        { label: isAr ? 'الرئيسية' : lang === 'zh' ? '首页' : 'Home', path: '/' },
        { label: isAr ? 'المنتجات' : lang === 'zh' ? '产品' : 'Products', path: '/products' },
        { label: isAr ? 'الموردون' : lang === 'zh' ? '供应商' : 'Suppliers', path: '/suppliers' },
        { label: isAr ? 'عن مَعبر' : lang === 'zh' ? '关于' : 'About', path: '/about' },
        { label: isAr ? 'تواصل' : lang === 'zh' ? '联系' : 'Contact', path: '/contact' },
      ];

  return (
    <>
      <nav className={scrolled || !isHome ? 'scrolled' : ''}>

        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <button className="nav-logo" onClick={() => nav('/')}>
            MAABAR <span className="ar-part">| مَعبر</span>
          </button>
        </div>

        {/* LINKS */}
        <ul className="nav-links">
          {links.map((l, i) => (
            <li key={i}>
              <button className="nav-link" onClick={() => nav(l.path)}>{l.label}</button>
            </li>
          ))}
        </ul>

        {/* RIGHT */}
        <div className="nav-right">

          {/* LANG SWITCHER */}
          <div className="lang-switcher">
            {['ar', 'en', 'zh'].map(l => (
              <button key={l} className={`lang-btn${lang === l ? ' active' : ''}`} onClick={() => setLang(l)}>
                {l === 'ar' ? 'AR' : l === 'en' ? 'EN' : '中文'}
              </button>
            ))}
          </div>

          {user ? (
            <>
              {/* NOTIFICATION BELL */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button className="icon-btn" onClick={openNotifs} title={isAr ? 'الإشعارات' : 'Notifications'}>
                  <svg viewBox="0 0 24 24">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <span className={`icon-badge${unread > 0 ? ' show' : ''}`}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                </button>

                {/* NOTIFICATIONS DROPDOWN */}
                {notifOpen && (
                  <div className="notif-panel open" style={{
                    position: 'absolute',
                    top: 44,
                    [isAr ? 'left' : 'right']: 0,
                    width: 300,
                  }}>
                    <div className="notif-header">
                      {isAr ? 'الإشعارات' : lang === 'zh' ? '通知' : 'Notifications'}
                      {unread > 0 && (
                        <span style={{
                          marginRight: isAr ? 8 : 0,
                          marginLeft: isAr ? 0 : 8,
                          background: '#2C2C2C', color: '#F7F5F2',
                          fontSize: 9, fontWeight: 700, borderRadius: '50%',
                          width: 16, height: 16,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {unread}
                        </span>
                      )}
                    </div>

                    {notifs.length === 0 ? (
                      <div className="notif-empty">
                        {isAr ? 'لا توجد إشعارات' : lang === 'zh' ? '暂无通知' : 'No notifications'}
                      </div>
                    ) : notifs.map((n, i) => (
                      <div key={i} className="notif-item"
                        onClick={() => handleNotifClick(n)}
                        style={{ background: n.is_read ? 'transparent' : 'rgba(44,44,44,0.04)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                          <p style={{
                            fontSize: 13, color: '#2C2C2C', lineHeight: 1.5,
                            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                            flex: 1,
                          }}>
                            {isAr ? n.title_ar : lang === 'zh' ? n.title_zh : n.title_en}
                          </p>
                          <span style={{ fontSize: 10, color: '#7a7a7a', flexShrink: 0, marginTop: 2 }}>
                            {fmtTime(n.created_at)}
                          </span>
                        </div>
                        {!n.is_read && (
                          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#2C2C2C', marginTop: 6 }} />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button className="nav-cta" onClick={() => nav('/dashboard')}>
                {isAr ? 'لوحتي' : lang === 'zh' ? '控制台' : 'Dashboard'}
              </button>
              <button className="nav-logout" onClick={doSignOut}>
                {isAr ? 'خروج' : lang === 'zh' ? '退出' : 'Logout'}
              </button>
            </>
          ) : (
            <>
              <button className="nav-supplier-btn" onClick={() => nav('/login/supplier')}>
                {isAr ? 'بوابة الموردين' : lang === 'zh' ? '供应商入口' : 'Supplier Portal'}
              </button>
              <button className="nav-cta" onClick={() => nav('/login/buyer')}>
                {isAr ? 'دخول / تسجيل' : lang === 'zh' ? '登录' : 'Login'}
              </button>
            </>
          )}

          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu open">
          {links.map((l, i) => (
            <button key={i} className="mobile-menu-item"
              onClick={() => { nav(l.path); setMenuOpen(false); }}>
              {l.label}
            </button>
          ))}
          <div className="mobile-menu-auth">
            {user ? (
              <>
                <button className="btn-dark-sm" onClick={() => { nav('/dashboard'); setMenuOpen(false); }}>
                  {isAr ? 'لوحتي' : lang === 'zh' ? '控制台' : 'Dashboard'}
                </button>
                <button className="btn-outline" onClick={() => { doSignOut(); setMenuOpen(false); }}>
                  {isAr ? 'خروج' : lang === 'zh' ? '退出' : 'Logout'}
                </button>
              </>
            ) : (
              <>
                <button className="btn-dark-sm" onClick={() => { nav('/login/buyer'); setMenuOpen(false); }}>
                  {isAr ? 'دخول / تسجيل' : lang === 'zh' ? '登录' : 'Login'}
                </button>
                <button className="btn-outline" onClick={() => { nav('/login/supplier'); setMenuOpen(false); }}>
                  {isAr ? 'بوابة الموردين' : lang === 'zh' ? '供应商入口' : 'Supplier Portal'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}