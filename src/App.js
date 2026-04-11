import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import { sb } from './supabase';
import {
  DEFAULT_DISPLAY_CURRENCY,
  fetchDisplayRates,
  getCachedDisplayRates,
  normalizeDisplayCurrency,
  persistDisplayCurrencyPreference,
} from './lib/displayCurrency';
import { sendMaabarEmail } from './lib/maabarEmail';
import {
  getSupplierOnboardingState,
  getSupplierPrimaryRoute,
  getSupplierTradeLinks,
  shouldNotifyAdminOfConfirmedSupplier,
} from './lib/supplierOnboarding';
import {
  AUTH_CALLBACK_PATH,
  buildAuthCallbackPath,
  hasAuthCallbackPayload,
} from './lib/authRedirects';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import DashboardBuyer from './pages/DashboardBuyer';
import DashboardSupplier from './pages/DashboardSupplier';
import AuthCallback from './pages/AuthCallback';
import About from './pages/About';
import Contact from './pages/Contact';
import Support from './pages/Support';
import Requests from './pages/Requests';
import SupplierLanding from './pages/SupplierLanding';
import SupplierAccess from './pages/SupplierAccess';
import SupplierProfile from './pages/SupplierProfile';
import Suppliers from './pages/Suppliers';
import Chat from './pages/Chat';
import Inbox from './pages/Inbox';
import Terms from './pages/Terms';
import FAQ from './pages/FAQ';
import FAQTraders from './pages/FAQTraders';
import FAQSuppliers from './pages/FAQSuppliers';
import AdminSeed from './pages/AdminSeed';
import AgentPanel from './pages/AgentPanel';
// ApolloAgent removed — file not found
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';

// Components
import Navbar from './components/Navbar';
import AIHub from './components/AIHub';
import BrandedLoading from './components/BrandedLoading';
import useMobileViewport from './hooks/useMobileViewport';

function getLocaleDisplayCurrency(lang) {
  if (lang === 'ar') return 'SAR';
  if (lang === 'zh') return 'CNY';
  return 'USD';
}

function SupplierVerificationLocked({ lang }) {
  return (
    <div style={{
      minHeight: 'var(--app-dvh)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: 24,
      color: 'var(--text-primary)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 560,
        borderRadius: 24,
        border: '1px solid var(--border-subtle)',
        background: '#FFFFFF',
        padding: '36px 30px',
        textAlign: lang === 'ar' ? 'right' : 'left',
      }}>
        <p style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          margin: '0 0 12px',
        }}>
          MAABAR SUPPLIER ACCESS
        </p>
        <h1 style={{
          margin: '0 0 12px',
          fontSize: lang === 'ar' ? 30 : 32,
          fontWeight: 300,
          lineHeight: 1.15,
          fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          Complete verification to unlock the full supplier experience on Maabar
        </h1>
        <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--text-secondary)',
          fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {lang === 'ar'
            ? 'يمكنك استخدام لوحة المورد، إعدادات الملف، ومسار التحقق فقط إلى أن يتم توثيق الحساب.'
            : lang === 'zh'
              ? '在账户完成验证前，您只能使用供应商控制台、资料设置和认证流程。'
              : 'Until your account is verified, only the supplier dashboard, profile settings, and verification flow stay open.'}
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
          <button
            onClick={() => window.location.assign('/dashboard')}
            style={{
              background: 'var(--text-primary)',
              color: 'var(--bg-base)',
              border: 'none',
              borderRadius: 14,
              minHeight: 44,
              padding: '11px 18px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {lang === 'ar' ? 'العودة إلى لوحة المورد' : lang === 'zh' ? '返回供应商控制台' : 'Back to supplier dashboard'}
          </button>
          <button
            onClick={() => window.location.assign('/dashboard?tab=verification')}
            style={{
              background: 'transparent',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: 14,
              minHeight: 44,
              padding: '11px 18px',
              cursor: 'pointer',
              fontSize: 12,
            }}
          >
            {lang === 'ar' ? 'افتح التحقق' : lang === 'zh' ? '打开认证流程' : 'Open verification'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardRouter({ loading, user, profile, profileError, setProfileError, setLoading, loadProfile, sharedProps }) {
  const { lang } = sharedProps;
  if (loading || (user && !profile && !profileError)) {
    return <BrandedLoading lang={lang} tone="dashboard" fullscreen />;
  }
  if (profileError) return (
    <div style={{
      minHeight: 'var(--app-dvh)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', gap: 16, padding: 24,
    }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'var(--font-ar)', textAlign: 'center', lineHeight: 1.8 }}>
        فشل تحميل بيانات الحساب. تحقق من اتصالك وحاول مجدداً.
      </p>
      <button
        onClick={() => { setProfileError(false); setLoading(true); loadProfile(user?.id, 1, user); }}
        style={{
          background: '#1a1a1a', color: '#ffffff',
          border: 'none', padding: '12px 28px', borderRadius: 6,
          fontSize: 13, cursor: 'pointer', fontWeight: 500,
        }}>
        إعادة المحاولة
      </button>
      <button
        onClick={() => sb.auth.signOut()}
        style={{
          background: 'none', color: 'var(--text-disabled)',
          border: '1px solid var(--border-default)', padding: '10px 24px', borderRadius: 6,
          fontSize: 12, cursor: 'pointer',
        }}>
        تسجيل الخروج
      </button>
    </div>
  );
  if (!profile) return <DashboardBuyer {...sharedProps} />;
  if (profile.role === 'admin') return <Navigate to="/admin-seed" replace />;
  if (profile.role === 'supplier') {
    const supplierState = getSupplierOnboardingState(profile, user);

    if (supplierState.isRejectedStage)
      return (
        <div style={{
          minHeight: 'var(--app-dvh)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-base)', gap: 16, padding: 24, textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontFamily: 'var(--font-ar)', lineHeight: 1.8 }}>
            نأسف، لم يتم قبول حسابك.
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, fontFamily: 'var(--font-ar)' }}>
            للاستفسار تواصل معنا على <a href="mailto:hello@maabar.io" style={{ color: 'var(--text-secondary)' }}>hello@maabar.io</a>
          </p>
          <button onClick={() => sb.auth.signOut()} style={{
            background: 'none', color: 'var(--text-disabled)',
            border: '1px solid var(--border-default)', padding: '10px 24px',
            borderRadius: 6, fontSize: 12, cursor: 'pointer', marginTop: 8,
          }}>
            تسجيل الخروج
          </button>
        </div>
      );

    if (supplierState.isInactiveStage)
      return (
        <div style={{
          minHeight: 'var(--app-dvh)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'var(--bg-base)', gap: 16, padding: 24, textAlign: 'center',
        }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, fontFamily: 'var(--font-ar)', lineHeight: 1.8 }}>
            حساب المورد متوقف مؤقتاً.
          </p>
          <p style={{ color: 'var(--text-tertiary)', fontSize: 13, fontFamily: 'var(--font-ar)', maxWidth: 460, lineHeight: 1.9 }}>
            إذا كنت تحتاج توضيحاً أو إعادة تفعيل، تواصل معنا على <a href="mailto:hello@maabar.io" style={{ color: 'var(--text-secondary)' }}>hello@maabar.io</a>
          </p>
          <button onClick={() => sb.auth.signOut()} style={{
            background: 'none', color: 'var(--text-disabled)',
            border: '1px solid var(--border-default)', padding: '10px 24px',
            borderRadius: 6, fontSize: 12, cursor: 'pointer', marginTop: 8,
          }}>
            تسجيل الخروج
          </button>
        </div>
      );

    return <DashboardSupplier {...sharedProps} />;
  }
  return <DashboardBuyer {...sharedProps} />;
}

function AppContent({ lang, profile, user, sharedProps, loading, profileError, setProfileError, setLoading, loadProfile }) {
  const location = useLocation();
  const isAuthCallbackPage = location.pathname === AUTH_CALLBACK_PATH;
  const isChromelessPage = isAuthCallbackPage;
  const isLTRPage = isChromelessPage || location.pathname === '/supplier-access';
  const pageDir = isLTRPage ? 'ltr' : (lang === 'ar' ? 'rtl' : 'ltr');
  const supplierState = profile?.role === 'supplier' ? getSupplierOnboardingState(profile, user) : null;
  const supplierPrimaryRoute = profile?.role === 'supplier' ? getSupplierPrimaryRoute(profile, user) : '/dashboard';

  if (!isAuthCallbackPage && hasAuthCallbackPayload(location.search, location.hash)) {
    return <Navigate to={buildAuthCallbackPath(location.search, location.hash)} replace />;
  }

  const withSupplierVerifiedAccess = (element) => {
    if (supplierState && !supplierState.canAccessOperationalFeatures) {
      return <SupplierVerificationLocked lang={lang} />;
    }
    return element;
  };

  return (
    <div dir={pageDir} className="app-shell">
      {!isChromelessPage && <Navbar {...sharedProps} />}
      <Routes>
        <Route path="/"               element={<Home            {...sharedProps} />} />
        <Route path="/products"       element={<Products        {...sharedProps} />} />
        <Route path="/products/:id"   element={<ProductDetail   {...sharedProps} />} />
        <Route path="/login/:role"    element={<Login           {...sharedProps} />} />
        <Route path="/login"          element={<Login           {...sharedProps} />} />
        <Route path="/auth/callback"  element={<AuthCallback    {...sharedProps} />} />
        <Route path="/dashboard"      element={<DashboardRouter loading={loading} user={user} profile={profile} profileError={profileError} setProfileError={setProfileError} setLoading={setLoading} loadProfile={loadProfile} sharedProps={sharedProps} />} />
        <Route path="/about"          element={<About           {...sharedProps} />} />
        <Route path="/contact"        element={<Contact         {...sharedProps} />} />
        <Route path="/support"        element={<Support         {...sharedProps} />} />
        <Route path="/requests"       element={withSupplierVerifiedAccess(<Requests        {...sharedProps} />)} />
        <Route path="/supplier"       element={<SupplierLanding {...sharedProps} />} />
        <Route path="/supplier-access" element={<SupplierAccess {...sharedProps} />} />
        <Route path="/supplier/:id"   element={<SupplierProfile {...sharedProps} />} />
        <Route path="/suppliers"      element={<Suppliers       {...sharedProps} />} />
        <Route path="/chat/:partnerId"element={withSupplierVerifiedAccess(<Chat            {...sharedProps} />)} />
        <Route path="/inbox"          element={withSupplierVerifiedAccess(<Inbox           {...sharedProps} />)} />
        <Route path="/terms"          element={<Terms           {...sharedProps} />} />
        <Route path="/faq"            element={<FAQ             {...sharedProps} />} />
        <Route path="/faq/traders"    element={<FAQTraders      {...sharedProps} />} />
        <Route path="/faq/suppliers"  element={<FAQSuppliers    {...sharedProps} />} />
        <Route path="/admin-seed"     element={<AdminSeed       {...sharedProps} />} />
        <Route path="/agent"          element={<AgentPanel />} />
        {/* /apollo route removed — ApolloAgent not available */}
        <Route path="/checkout"       element={<Checkout        {...sharedProps} />} />
        <Route path="/payment-success"element={<PaymentSuccess  {...sharedProps} />} />
        <Route path="*"               element={<NotFound        {...sharedProps} />} />
      </Routes>

      {!isChromelessPage && (!profile || profile?.role === 'buyer') && (
        <AIHub lang={lang} user={user} profile={profile} />
      )}
    </div>
  );
}

function App() {
  useMobileViewport();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('ar');
  const [displayCurrency, setDisplayCurrency] = useState('SAR');
  const [exchangeRates, setExchangeRates] = useState(() => getCachedDisplayRates());
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const welcomeEmailSentRef = React.useRef(false);
  const supplierAdminEmailSentRef = React.useRef(new Set());

  useEffect(() => {
    fetchDisplayRates().then(setExchangeRates);

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        setLoading(true);
        loadProfile(session.user.id, 1, session.user);
      } else {
        setLoading(false);
      }
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      // TOKEN_REFRESHED / INITIAL_SESSION / USER_UPDATED — just keep the user ref fresh.
      // Do NOT reset loading or profile: that tears down the whole Router tree and forces
      // DashboardSupplier to unmount + remount, which re-fires every effect (draft restore,
      // verification step, etc.) as if the page was freshly loaded.
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
        return;
      }

      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT' || !session?.user) {
        setProfile(null); setLoading(false);
        if (window._profileChannel) { sb.removeChannel(window._profileChannel); window._profileChannel = null; }
        return;
      }
      // SIGNED_IN (new login or cross-tab sync) — full reset is appropriate here
      // because DashboardSupplier is not mounted yet (user was on login page).
      setLoading(true);
      setProfile(null);
      setProfileError(false);
      loadProfile(session.user.id, 1, session.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (profile?.preferred_display_currency) {
      setDisplayCurrency(normalizeDisplayCurrency(profile.preferred_display_currency));
      return;
    }
    setDisplayCurrency(getLocaleDisplayCurrency(lang));
  }, [profile?.preferred_display_currency, user, lang]);

  const updateDisplayCurrency = async (nextCurrency) => {
    const normalized = normalizeDisplayCurrency(nextCurrency || DEFAULT_DISPLAY_CURRENCY);
    setDisplayCurrency(normalized);
    await persistDisplayCurrencyPreference({
      sb,
      userId: user?.id,
      currency: normalized,
      setProfile,
    });
  };

  const maybeNotifyAdminOfConfirmedSupplier = async (profileRow, sessionUser) => {
    if (!shouldNotifyAdminOfConfirmedSupplier(profileRow, sessionUser)) return;
    if (supplierAdminEmailSentRef.current.has(profileRow.id)) return;

    supplierAdminEmailSentRef.current.add(profileRow.id);

    try {
      const { data: existing } = await sb.from('notifications')
        .select('id')
        .eq('user_id', profileRow.id)
        .eq('type', 'supplier_admin_notified')
        .limit(1);

      if (existing?.length) return;

      await sendMaabarEmail({
        type: 'admin_new_supplier',
        data: {
          companyName: profileRow.company_name || profileRow.full_name || '',
          email: profileRow.email || sessionUser?.email || '',
          country: profileRow.country || '',
          city: profileRow.city || '',
          speciality: profileRow.speciality || '',
          whatsapp: profileRow.whatsapp || '',
          wechat: profileRow.wechat || '',
          tradeLink: profileRow.trade_link || '',
          tradeLinks: getSupplierTradeLinks(profileRow),
        },
      });

      await sb.from('notifications').insert({
        user_id: profileRow.id,
        type: 'supplier_admin_notified',
        title_ar: 'تم إشعار الإدارة بطلب المورد بعد تأكيد البريد',
        title_en: 'Admin was notified after supplier email confirmation',
        is_read: true,
      });
    } catch (notifyError) {
      supplierAdminEmailSentRef.current.delete(profileRow.id);
      console.error('supplier admin notification error:', notifyError);
    }
  };

  const loadProfile = async (id, attempt = 1, sessionUser = null) => {
    const { data, error } = await sb.from('profiles').select('*').eq('id', id).single();

    if (!data && attempt < 5) {
      // DB trigger may not have run yet — retry up to 4 times with backoff
      await new Promise(r => setTimeout(r, attempt * 800));
      return loadProfile(id, attempt + 1, sessionUser);
    }

    const profileRow = data;

    if (profileRow) {
      setProfile(profileRow);
      setProfileError(false);
      await maybeNotifyAdminOfConfirmedSupplier(profileRow, sessionUser);
      // Send trader welcome email once after email confirmation — deduplicated via ref + notifications table
      if (profileRow?.role === 'buyer' && profileRow?.status === 'active' && !welcomeEmailSentRef.current) {
        welcomeEmailSentRef.current = true;
        try {
          const { data: existing } = await sb.from('notifications')
            .select('id').eq('user_id', id).eq('type', 'trader_welcome_sent').limit(1);
          if (!existing || existing.length === 0) {
            await sendMaabarEmail({
              type: 'trader_welcome',
              to: profileRow.email,
              data: { name: profileRow.full_name || '', lang },
            });
            await sb.from('notifications').insert({
              user_id: id, type: 'trader_welcome_sent',
              title_ar: 'تم إرسال إيميل الترحيب', title_en: 'Welcome email sent',
              is_read: true,
            });
          }
        } catch (e) { console.error('trader welcome error:', e); }
      }
    } else {
      // Failed after all retries — show error screen instead of falling through to buyer dashboard
      console.error('loadProfile failed after retries:', error);
      setProfileError(true);
    }
    setLoading(false);

    if (!profileRow) return; // Don't set up realtime if profile didn't load

    if (window._profileChannel) {
      sb.removeChannel(window._profileChannel);
      window._profileChannel = null;
    }

    // Realtime — لو الأدمن غيّر status المورد يتحدث فوراً
    const ch = sb.channel(`profile-status-${id}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${id}`
      }, (payload) => {
        if (payload.new) setProfile(prev => ({ ...(prev || {}), ...payload.new }));
      })
      .subscribe();
    // نحفظ الـ channel عشان نلغيها لو الجلسة انتهت
    window._profileChannel = ch;
  };

  const sharedProps = {
    user,
    profile,
    lang,
    setLang,
    setUser,
    setProfile,
    displayCurrency,
    setDisplayCurrency: updateDisplayCurrency,
    exchangeRates,
  };

  /* ─── Loading screen ─────────────────────────── */
  if (loading) return <BrandedLoading lang={lang} tone="app" fullscreen />;

  /* ─── App ────────────────────────────────────── */
  return (
    <ErrorBoundary lang={lang}>
      <Router>
        <AppContent
          lang={lang}
          profile={profile}
          user={user}
          sharedProps={sharedProps}
          loading={loading}
          profileError={profileError}
          setProfileError={setProfileError}
          setLoading={setLoading}
          loadProfile={loadProfile}
        />
      </Router>
    </ErrorBoundary>
  );
}

export default App;