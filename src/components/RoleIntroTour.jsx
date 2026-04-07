import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from './BrandLogo';

const STORAGE_KEY = 'maabar:entry-intro-tour:v1';
const AUTO_OPEN_DELAY_MS = 420;

const TOUR_COPY = {
  ar: {
    eyebrow: 'جولة قصيرة',
    title: 'مرحبًا بك في معبر',
    question: 'أنت تاجر أم مورد؟',
    trader: 'أنا تاجر',
    supplier: 'أنا مورد',
    skip: 'تخطي',
    close: 'إغلاق',
    next: 'التالي',
    changeRole: 'تغيير الاختيار',
    start: 'ابدأ الآن',
    traderLabel: 'مسار التاجر',
    supplierLabel: 'مسار المورد',
    progressLabel: 'خطوات سريعة',
    traderSlides: [
      'موردون موثّقون مختارون بعناية',
      'خطط دفع مرنة مع 0% عمولة',
      'تواصل بلا حاجز لغة',
    ],
    supplierSlides: [
      'وصول مباشر إلى المشتري السعودي',
      '0% عمولة',
      'تواصل بلا حاجز لغة',
    ],
  },
  en: {
    eyebrow: 'Quick Intro',
    title: 'Welcome to Maabar',
    question: 'Are you a trader or a supplier?',
    trader: "I’m a Trader",
    supplier: "I’m a Supplier",
    skip: 'Skip',
    close: 'Close',
    next: 'Next',
    changeRole: 'Change role',
    start: 'Start now',
    traderLabel: 'Trader journey',
    supplierLabel: 'Supplier journey',
    progressLabel: 'Quick steps',
    traderSlides: [
      'Carefully selected verified suppliers',
      'Flexible payment plans with 0% commission',
      'Communication without a language barrier',
    ],
    supplierSlides: [
      'Direct access to the Saudi buyer',
      '0% commission',
      'Communication without a language barrier',
    ],
  },
  zh: {
    eyebrow: '快速介绍',
    title: '欢迎来到 Maabar',
    question: '您是贸易商还是供应商？',
    trader: '我是贸易商',
    supplier: '我是供应商',
    skip: '跳过',
    close: '关闭',
    next: '继续',
    changeRole: '切换身份',
    start: '立即开始',
    traderLabel: '贸易商路径',
    supplierLabel: '供应商路径',
    progressLabel: '快速步骤',
    traderSlides: [
      '精选且经过验证的供应商',
      '灵活付款方案，0% 佣金',
      '沟通没有语言障碍',
    ],
    supplierSlides: [
      '直接触达沙特买家',
      '0% 佣金',
      '沟通没有语言障碍',
    ],
  },
};

function readStoredTourState() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('role intro tour read error:', error);
    return null;
  }
}

function storeTourState(nextState) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      ...nextState,
      updatedAt: new Date().toISOString(),
    }));
  } catch (error) {
    console.error('role intro tour write error:', error);
  }
}

export default function RoleIntroTour({ lang = 'ar', user }) {
  const navigate = useNavigate();
  const copy = TOUR_COPY[lang] || TOUR_COPY.ar;
  const isAr = lang === 'ar';
  const [isVisible, setIsVisible] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const arFont = isAr ? { fontFamily: 'var(--font-ar)' } : undefined;

  useEffect(() => {
    if (user) return undefined;

    const stored = readStoredTourState();
    if (stored?.status === 'dismissed' || stored?.status === 'completed' || stored?.status === 'role_selected') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, AUTO_OPEN_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [user]);

  const slides = useMemo(() => {
    if (selectedRole === 'buyer') return copy.traderSlides;
    if (selectedRole === 'supplier') return copy.supplierSlides;
    return [];
  }, [copy, selectedRole]);

  if (!isVisible) return null;

  const handleDismiss = (status = 'dismissed') => {
    storeTourState({
      status,
      role: selectedRole,
    });
    setIsVisible(false);
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setStepIndex(0);
    storeTourState({
      status: 'role_selected',
      role,
    });
  };

  const handleStart = () => {
    storeTourState({
      status: 'completed',
      role: selectedRole,
    });
    setIsVisible(false);
    navigate(selectedRole === 'supplier' ? '/login/supplier' : '/requests');
  };

  const currentSlide = slides[stepIndex] || '';
  const isLastStep = stepIndex === slides.length - 1;
  const roleLabel = selectedRole === 'supplier' ? copy.supplierLabel : copy.traderLabel;

  return (
    <div className="role-tour-overlay" onClick={() => handleDismiss('dismissed')}>
      <div
        className={`role-tour-modal${selectedRole ? ' is-touring' : ''}`}
        dir={isAr ? 'rtl' : 'ltr'}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="role-tour-glow role-tour-glow-primary" />
        <div className="role-tour-glow role-tour-glow-secondary" />

        <div className="role-tour-topbar">
          <button type="button" className="role-tour-text-action" onClick={() => handleDismiss('dismissed')}>
            {copy.skip}
          </button>
          <button
            type="button"
            className="role-tour-close"
            onClick={() => handleDismiss('dismissed')}
            aria-label={copy.close}
            title={copy.close}
          >
            ×
          </button>
        </div>

        <div className="role-tour-brand">
          <BrandLogo size="lg" />
        </div>

        {!selectedRole ? (
          <div className="role-tour-stage role-tour-selection-stage">
            <p className="role-tour-eyebrow">{copy.eyebrow}</p>
            <h2 className="role-tour-title" style={arFont}>{copy.title}</h2>
            <p className="role-tour-question" style={arFont}>{copy.question}</p>

            <div className="role-tour-role-grid">
              <button type="button" className="role-tour-role-card" onClick={() => handleRoleSelect('buyer')}>
                <span className="role-tour-role-badge">01</span>
                <span className="role-tour-role-title" style={arFont}>{copy.trader}</span>
              </button>
              <button type="button" className="role-tour-role-card" onClick={() => handleRoleSelect('supplier')}>
                <span className="role-tour-role-badge">02</span>
                <span className="role-tour-role-title" style={arFont}>{copy.supplier}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="role-tour-stage role-tour-steps-stage">
            <div className="role-tour-meta">
              <span className="role-tour-pill">{roleLabel}</span>
              <button type="button" className="role-tour-text-action subtle" onClick={() => setSelectedRole(null)}>
                {copy.changeRole}
              </button>
            </div>

            <div className="role-tour-progress-row">
              <span className="role-tour-progress-label">{copy.progressLabel}</span>
              <span className="role-tour-progress-count">{stepIndex + 1} / {slides.length}</span>
            </div>

            <div className="role-tour-dots" aria-hidden="true">
              {slides.map((slide, index) => (
                <span key={slide} className={`role-tour-dot${index === stepIndex ? ' active' : ''}`} />
              ))}
            </div>

            <div className="role-tour-slide-card">
              <span className="role-tour-slide-index">0{stepIndex + 1}</span>
              <p className="role-tour-slide-copy" style={arFont}>{currentSlide}</p>
            </div>

            <div className="role-tour-actions">
              {!isLastStep ? (
                <button type="button" className="role-tour-primary-action" onClick={() => setStepIndex((current) => current + 1)}>
                  {copy.next}
                </button>
              ) : (
                <button type="button" className="role-tour-primary-action" onClick={handleStart}>
                  {copy.start}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
