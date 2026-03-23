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
import Checkout from './pages/Checkout';
import PaymentSuccess from './pages/PaymentSuccess';

// Components
import Navbar from './components/Navbar';
import AIAssistant from './components/AIAssistant';
import TraderCalculator from './components/TraderCalculator';
import NegotiationAgent from './components/NegotiationAgent';

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

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#FAF8F4'
    }}>
      <div style={{
        fontFamily: 'var(--font-en)', fontSize: 20,
        fontWeight: 600, letterSpacing: 3, color: '#2C2C2C'
      }}>
        MAABAR
      </div>
    </div>
  );

  return (
    <Router>
      <div dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <Navbar {...sharedProps} />
        <Routes>
          <Route path="/" element={<Home {...sharedProps} />} />
          <Route path="/products" element={<Products {...sharedProps} />} />
          <Route path="/products/:id" element={<ProductDetail {...sharedProps} />} />
          <Route path="/login/:role" element={<Login {...sharedProps} />} />
          <Route path="/login" element={<Login {...sharedProps} />} />
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/about" element={<About {...sharedProps} />} />
          <Route path="/contact" element={<Contact {...sharedProps} />} />
          <Route path="/requests" element={<Requests {...sharedProps} />} />
          <Route path="/supplier" element={<SupplierLanding {...sharedProps} />} />
          <Route path="/supplier/:id" element={<SupplierProfile {...sharedProps} />} />
          <Route path="/suppliers" element={<Suppliers {...sharedProps} />} />
          <Route path="/chat/:partnerId" element={<Chat {...sharedProps} />} />
          <Route path="/inbox" element={<Inbox {...sharedProps} />} />
          <Route path="/terms" element={<Terms {...sharedProps} />} />
          <Route path="/faq" element={<FAQ {...sharedProps} />} />
          <Route path="/admin-seed" element={<AdminSeed {...sharedProps} />} />
          <Route path="/agent" element={<AgentPanel />} />
          <Route path="/checkout" element={<Checkout {...sharedProps} />} />
          <Route path="/payment-success" element={<PaymentSuccess {...sharedProps} />} />
        </Routes>

        {/* AI Assistant — للتاجر فقط */}
        {user && profile?.role === 'buyer' && <AIAssistant {...sharedProps} />}

        {/* Trader Calculator — للجميع */}
        <TraderCalculator lang={lang} />

        {/* Negotiation Agent — للتاجر المسجل فقط */}
        {user && profile?.role === 'buyer' && <NegotiationAgent lang={lang} />}
      </div>
    </Router>
  );
}

export default App;