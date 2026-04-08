import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const STORAGE_KEY = 'maabar_role_tour_seen';

const T = {
  ar: {
    eyebrow: 'مرحباً بك في مَعبر',
    title: 'كيف تريد أن تبدأ؟',
    question: 'اختر دورك حتى نريك المسار الأنسب لك.',
    buyer: 'أنا تاجر',
    buyerSub: 'أريد استيراد أو طلب عروض من موردين صينيين',
    supplier: 'أنا مورد',
    supplierSub: 'أريد الانضمام ومعرفة كيف تعمل المنصة',
    skip: 'تخطّ',
  },
  en: {
    eyebrow: 'Welcome to Maabar',
    title: 'How do you want to start?',
    question: 'Choose your role so we can show you the right path.',
    buyer: 'I\'m a trader',
    buyerSub: 'I want to import or request quotes from Chinese suppliers',
    supplier: 'I\'m a supplier',
    supplierSub: 'I want to join and understand how the platform works',
    skip: 'Skip',
  },
  zh: {
    eyebrow: '欢迎来到 Maabar',
    title: '您想如何开始？',
    question: '选择您的角色，我们将为您展示合适的路径。',
    buyer: '我是贸易商',
    buyerSub: '我想从中国供应商处进口或请求报价',
    supplier: '我是供应商',
    supplierSub: '我想加入并了解平台的运作方式',
    skip: '跳过',
  },
};

export default function RoleIntroTour({ lang, user }) {
  const [visible, setVisible] = useState(false);
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  useEffect(() => {
    if (user) return; // already logged in — skip tour
    const seen = sessionStorage.getItem(STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleBuyer = () => { dismiss(); nav('/login/buyer'); };
  const handleSupplier = () => { dismiss(); nav('/login/supplier'); };

  if (!visible) return null;

  return (
    <div className="role-tour-overlay" onClick={dismiss}>
      <div className="role-tour-modal" onClick={e => e.stopPropagation()}>

        <div className="role-tour-glow role-tour-glow-primary" />
        <div className="role-tour-glow role-tour-glow-secondary" />

        <div className="role-tour-topbar">
          <div />
          <button className="role-tour-close" onClick={dismiss}>×</button>
        </div>

        <div className="role-tour-brand">
          <BrandLogo size="md" />
        </div>

        <div className="role-tour-stage role-tour-selection-stage" dir={isAr ? 'rtl' : 'ltr'}>
          <p className="role-tour-eyebrow" style={isAr ? { fontFamily: 'var(--font-ar)' } : {}}>{t.eyebrow}</p>
          <h2 className="role-tour-title" style={isAr ? {} : { fontFamily: 'var(--font-sans)' }}>{t.title}</h2>
          <p className="role-tour-question" style={isAr ? { fontFamily: 'var(--font-ar)' } : {}}>{t.question}</p>

          <div className="role-tour-role-grid">
            <button className="role-tour-role-card" onClick={handleBuyer} dir={isAr ? 'rtl' : 'ltr'}>
              <span className="role-tour-role-badge">{isAr ? 'تاجر' : lang === 'zh' ? '贸易商' : 'TRADER'}</span>
              <span className="role-tour-role-title" style={isAr ? { fontFamily: 'var(--font-ar)' } : {}}>{t.buyer}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.buyerSub}</span>
            </button>

            <button className="role-tour-role-card" onClick={handleSupplier} dir={isAr ? 'rtl' : 'ltr'}>
              <span className="role-tour-role-badge">{isAr ? 'مورد' : lang === 'zh' ? '供应商' : 'SUPPLIER'}</span>
              <span className="role-tour-role-title" style={isAr ? { fontFamily: 'var(--font-ar)' } : {}}>{t.supplier}</span>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.supplierSub}</span>
            </button>
          </div>

          <div className="role-tour-actions" style={{ justifyContent: 'center', marginTop: 16 }}>
            <button className="role-tour-text-action subtle" onClick={dismiss}
              style={isAr ? { fontFamily: 'var(--font-ar)' } : {}}>
              {t.skip}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
