import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { sb } from './supabase';

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
import Requests from './pages/Requests';
import SupplierLanding from './pages/SupplierLanding';
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (id) => {
    const { data } = await sb.from('profiles').select('*').eq('id', id).single();
    if (data) setProfile(data);
    setLoading(false);
  };

  const DashboardRouter = () => {
    if (loading) return <div className="loading">...</div>;
    if (!profile) return <DashboardBuyer {...sharedProps} />;
    if (profile.role === 'supplier' && profile.status === 'pending')
      return <PendingApproval {...sharedProps} />;
    if (profile.role === 'supplier')
      return <DashboardSupplier {...sharedProps} />;
    return <DashboardBuyer {...sharedProps} />;
  };

  const sharedProps = { user, profile, lang, setLang, setUser, setProfile };

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

  /* ─── App ────────────────────────────────────── */
  return (
    <Router>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Navbar {...sharedProps} />
        <Routes>
          <Route path="/"               element={<Home            {...sharedProps} />} />
          <Route path="/products"       element={<Products        {...sharedProps} />} />
          <Route path="/products/:id"   element={<ProductDetail   {...sharedProps} />} />
          <Route path="/login/:role"    element={<Login           {...sharedProps} />} />
          <Route path="/login"          element={<Login           {...sharedProps} />} />
          <Route path="/dashboard"      element={<DashboardRouter />} />
          <Route path="/about"          element={<About           {...sharedProps} />} />
          <Route path="/contact"        element={<Contact         {...sharedProps} />} />
          <Route path="/requests"       element={<Requests        {...sharedProps} />} />
          <Route path="/supplier"       element={<SupplierLanding {...sharedProps} />} />
          <Route path="/supplier/:id"   element={<SupplierProfile {...sharedProps} />} />
          <Route path="/suppliers"      element={<Suppliers       {...sharedProps} />} />
          <Route path="/chat/:partnerId"element={<Chat            {...sharedProps} />} />
          <Route path="/inbox"          element={<Inbox           {...sharedProps} />} />
          <Route path="/terms"          element={<Terms           {...sharedProps} />} />
          <Route path="/faq"            element={<FAQ             {...sharedProps} />} />
          <Route path="/admin-seed"     element={<AdminSeed       {...sharedProps} />} />
          <Route path="/agent"          element={<AgentPanel />} />
          {/* /apollo route removed — ApolloAgent not available */}
          <Route path="/checkout"       element={<Checkout        {...sharedProps} />} />
          <Route path="/payment-success"element={<PaymentSuccess  {...sharedProps} />} />
        </Routes>

        {(!profile || profile?.role === 'buyer') && (
          <AIHub lang={lang} user={user} profile={profile} />
        )}
      </div>
    </Router>
  );
}

export default App;