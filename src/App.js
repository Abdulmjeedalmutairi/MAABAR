import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';
import { sb } from './supabase';
import {
  DEFAULT_DISPLAY_CURRENCY,
  fetchDisplayRates,
  getCachedDisplayRates,
  getStoredDisplayCurrency,
  normalizeDisplayCurrency,
  persistDisplayCurrencyPreference,
} from './lib/displayCurrency';
import { getSupplierOnboardingState, getSupplierPrimaryRoute } from './lib/supplierOnboarding';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import DashboardBuyer from './pages/DashboardBuyer';
import DashboardSupplier from './pages/DashboardSupplier';
import PendingApproval from './pages/PendingApproval';
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
import AdminSeed from './pages/AdminSeed';
import AgentPanel from './pages/AgentPanel';
// ApolloAgent removed — file not found
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';

// Components
import Navbar from './components/Navbar';
import AIHub from './components/AIHub';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('ar');
  const [displayCurrency, setDisplayCurrency] = useState(() => getStoredDisplayCurrency());
  const [exchangeRates, setExchangeRates] = useState(() => getCachedDisplayRates());
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const welcomeEmailSentRef = React.useRef(false);

  useEffect(() => {
    fetchDisplayRates().then(setExchangeRates);

    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setProfileError(false);
        loadProfile(session.user.id);
      } else {
        setProfile(null); setLoading(false);
        if (window._profileChannel) { sb.removeChannel(window._profileChannel); window._profileChannel = null; }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (profile?.preferred_display_currency) {
      setDisplayCurrency(normalizeDisplayCurrency(profile.preferred_display_currency));
    } else if (!user) {
      setDisplayCurrency(getStoredDisplayCurrency());
    }
  }, [profile?.preferred_display_currency, user]);

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

  const loadProfile = async (id, attempt = 1) => {
    const { data, error } = await sb.from('profiles').select('*').eq('id', id).single();

    if (!data && attempt < 5) {
      // DB trigger may not have run yet — retry up to 4 times with backoff
      await new Promise(r => setTimeout(r, attempt * 800));
      return loadProfile(id, attempt + 1);
    }

    if (data) {
      setProfile(data);
      setProfileError(false);
      // Send trader welcome email once after email confirmation — deduplicated via ref + notifications table
      if (data?.role === 'buyer' && data?.status === 'active' && !welcomeEmailSentRef.current) {
        welcomeEmailSentRef.current = true;
        try {
          const { data: existing } = await sb.from('notifications')
            .select('id').eq('user_id', id).eq('type', 'trader_welcome_sent').limit(1);
          if (!existing || existing.length === 0) {
            const _ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
            const _URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
            await fetch(_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${_ANON}` },
              body: JSON.stringify({ type: 'trader_welcome', to: data.email, data: { name: data.full_name || '', lang } }),
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

    if (!data) return; // Don't set up realtime if profile didn't load

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

  const DashboardRouter = () => {
    if (loading) return <div className="loading">...</div>;
    if (profileError) return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: '#0a0a0b', gap: 16, padding: 24,
      }}>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, fontFamily: 'var(--font-ar)', textAlign: 'center', lineHeight: 1.8 }}>
          فشل تحميل بيانات الحساب. تحقق من اتصالك وحاول مجدداً.
        </p>
        <button
          onClick={() => { setProfileError(false); setLoading(true); loadProfile(user?.id); }}
          style={{
            background: 'rgba(255,255,255,0.88)', color: '#0a0a0b',
            border: 'none', padding: '12px 28px', borderRadius: 6,
            fontSize: 13, cursor: 'pointer', fontWeight: 500,
          }}>
          إعادة المحاولة
        </button>
        <button
          onClick={() => sb.auth.signOut()}
          style={{
            background: 'none', color: 'rgba(255,255,255,0.3)',
            border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: 6,
            fontSize: 12, cursor: 'pointer',
          }}>
          تسجيل الخروج
        </button>
      </div>
    );
    if (!profile) return <DashboardBuyer {...sharedProps} />;
    if (profile.role === 'admin') return <Navigate to="/admin-seed" replace />;
    if (profile.role === 'supplier') {
      const supplierState = getSupplierOnboardingState(profile);

      if (supplierState.isRejectedStage)
        return (
          <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: '#0a0a0b', gap: 16, padding: 24, textAlign: 'center',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 16, fontFamily: 'var(--font-ar)', lineHeight: 1.8 }}>
              نأسف، لم يتم قبول حسابك.
            </p>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontFamily: 'var(--font-ar)' }}>
              للاستفسار تواصل معنا على <a href="mailto:hello@maabar.io" style={{ color: 'rgba(255,255,255,0.5)' }}>hello@maabar.io</a>
            </p>
            <button onClick={() => sb.auth.signOut()} style={{
              background: 'none', color: 'rgba(255,255,255,0.3)',
              border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px',
              borderRadius: 6, fontSize: 12, cursor: 'pointer', marginTop: 8,
            }}>
              تسجيل الخروج
            </button>
          </div>
        );

      if (supplierState.isUnderReviewStage) {
        return <PendingApproval {...sharedProps} />;
      }

      return <DashboardSupplier {...sharedProps} />;
    }
    return <DashboardBuyer {...sharedProps} />;
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
  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a0b',
      gap: 12,
    }}>
      {/* Logo mark */}
      <div style={{
        fontFamily: "'Inter', sans-serif",
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '3px',
        color: 'rgba(255,255,255,0.35)',
      }}>
        MAABAR
      </div>
      {/* Subtle pulse bar */}
      <div style={{
        width: 32,
        height: 1,
        background: 'rgba(255,255,255,0.12)',
        borderRadius: 1,
        animation: 'loadPulse 1.4s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes loadPulse {
          0%, 100% { opacity: 0.3; transform: scaleX(1); }
          50%       { opacity: 0.7; transform: scaleX(1.6); }
        }
      `}</style>
    </div>
  );

  function AppContent() {
    const location = useLocation();
    const isSupplierAccessPage = location.pathname === '/supplier-access';
    const pageDir = isSupplierAccessPage ? 'ltr' : (lang === 'ar' ? 'rtl' : 'ltr');
    const supplierState = profile?.role === 'supplier' ? getSupplierOnboardingState(profile) : null;
    const supplierPrimaryRoute = profile?.role === 'supplier' ? getSupplierPrimaryRoute(profile) : '/dashboard';
    const withSupplierOperationalAccess = (element) => {
      if (supplierState && !supplierState.canAccessOperationalFeatures) {
        return <Navigate to={supplierPrimaryRoute} replace />;
      }
      return element;
    };

    return (
      <div dir={pageDir}>
        {!isSupplierAccessPage && <Navbar {...sharedProps} />}
        <Routes>
          <Route path="/"               element={<Home            {...sharedProps} />} />
          <Route path="/products"       element={<Products        {...sharedProps} />} />
          <Route path="/products/:id"   element={<ProductDetail   {...sharedProps} />} />
          <Route path="/login/:role"    element={<Login           {...sharedProps} />} />
          <Route path="/login"          element={<Login           {...sharedProps} />} />
          <Route path="/dashboard"      element={<DashboardRouter />} />
          <Route path="/about"          element={<About           {...sharedProps} />} />
          <Route path="/contact"        element={<Contact         {...sharedProps} />} />
          <Route path="/support"        element={<Support         {...sharedProps} />} />
          <Route path="/requests"       element={withSupplierOperationalAccess(<Requests        {...sharedProps} />)} />
          <Route path="/supplier"       element={<SupplierLanding {...sharedProps} />} />
          <Route path="/supplier-access" element={<SupplierAccess {...sharedProps} />} />
          <Route path="/supplier/:id"   element={<SupplierProfile {...sharedProps} />} />
          <Route path="/suppliers"      element={<Suppliers       {...sharedProps} />} />
          <Route path="/chat/:partnerId"element={withSupplierOperationalAccess(<Chat            {...sharedProps} />)} />
          <Route path="/inbox"          element={withSupplierOperationalAccess(<Inbox           {...sharedProps} />)} />
          <Route path="/terms"          element={<Terms           {...sharedProps} />} />
          <Route path="/faq"            element={<FAQ             {...sharedProps} />} />
          <Route path="/admin-seed"     element={<AdminSeed       {...sharedProps} />} />
          <Route path="/agent"          element={<AgentPanel />} />
          {/* /apollo route removed — ApolloAgent not available */}
          <Route path="/checkout"       element={<Checkout        {...sharedProps} />} />
          <Route path="/payment-success"element={<PaymentSuccess  {...sharedProps} />} />
          <Route path="*"               element={<NotFound        {...sharedProps} />} />
        </Routes>

        {!isSupplierAccessPage && (!profile || profile?.role === 'buyer') && (
          <AIHub lang={lang} user={user} profile={profile} />
        )}
      </div>
    );
  }

  /* ─── App ────────────────────────────────────── */
  return (
    <ErrorBoundary lang={lang}>
      <Router>
        <AppContent />
      </Router>
    </ErrorBoundary>
  );
}

export default App;