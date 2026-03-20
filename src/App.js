import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { sb } from './supabase';

// Pages
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Requests from './pages/Requests';
import SupplierLanding from './pages/SupplierLanding';
import SupplierProfile from './pages/SupplierProfile';
import Chat from './pages/Chat';
import Inbox from './pages/Inbox';
import Terms from './pages/Terms';
import FAQ from './pages/FAQ';
import AdminSeed from './pages/AdminSeed';
import AgentPanel from './pages/AgentPanel';

// Components
import Navbar from './components/Navbar';
import AIAssistant from './components/AIAssistant';
import IdeaToProduct from './components/IdeaToProduct';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [lang, setLang] = useState('ar');

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      if (session) { setUser(session.user); loadProfile(session.user.id); }
    });
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setProfile(null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (id) => {
    const { data } = await sb.from('profiles').select('*').eq('id', id).single();
    if (data) setProfile(data);
  };

  const sharedProps = { user, profile, lang, setLang, setUser, setProfile };

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
          <Route path="/dashboard" element={<Dashboard {...sharedProps} />} />
          <Route path="/about" element={<About {...sharedProps} />} />
          <Route path="/contact" element={<Contact {...sharedProps} />} />
          <Route path="/requests" element={<Requests {...sharedProps} />} />
          <Route path="/supplier" element={<SupplierLanding {...sharedProps} />} />
          <Route path="/supplier/:id" element={<SupplierProfile {...sharedProps} />} />
          <Route path="/chat/:partnerId" element={<Chat {...sharedProps} />} />
          <Route path="/inbox" element={<Inbox {...sharedProps} />} />
          <Route path="/terms" element={<Terms {...sharedProps} />} />
          <Route path="/faq" element={<FAQ {...sharedProps} />} />
          <Route path="/admin-seed" element={<AdminSeed {...sharedProps} />} />
          <Route path="/agent" element={<AgentPanel />} />
        </Routes>
        {user && profile?.role === 'buyer' && <AIAssistant {...sharedProps} />}
        {user && profile?.role === 'buyer' && <IdeaToProduct {...sharedProps} />}
      </div>
    </Router>
  );
}

export default App;