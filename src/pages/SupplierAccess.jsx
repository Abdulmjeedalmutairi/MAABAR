import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import usePageTitle from '../hooks/usePageTitle';
import { getSupplierOnboardingState, getSupplierPrimaryRoute } from '../lib/supplierOnboarding';

// Deadline: 14 days from now
const ACCESS_DEADLINE = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

function getTimeLeft() {
  const diff = new Date(ACCESS_DEADLINE).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

const TRANSLATIONS = {
  en: {
    badge: 'Founding Supplier Program',
    title: 'The Saudi market is waiting.<br />Be first to reach it.',
    subtitle: 'We are selecting verified suppliers for early access to the Saudi market — upload your products now and go live from day one.',
    countdownLabel: 'EARLY REGISTRATION CLOSES IN',
    alreadyApproved: 'Already approved? Sign in',
    whatYouGet: 'What you get',
    benefits: [
      {
        title: '0% Commission',
        desc: 'First 20 suppliers: 0% commission for 6 months.',
      },
      {
        title: 'Direct Access to Saudi Buyers',
        desc: 'Saudi Arabia imports $100B annually from China. Maabar connects you directly.',
      },
      {
        title: 'Priority Placement',
        desc: 'Your products appear first in search results and category listings from launch day.',
      },
      {
        title: 'Founding Supplier Badge',
        desc: 'A permanent badge on your profile that builds trust with Saudi traders from day one.',
      },
    ],
    howItWorks: 'How it works',
    steps: [
      'Submit your application',
      'Get approved as a Founding Supplier',
      'Upload your products and prepare your profile',
      'Your products go live on launch day',
      'Start receiving requests from Saudi merchants immediately',
    ],
    reviewNote: 'Review takes 24 to 72 hours · Limited spots available',
    footerLine1: 'maabar.io · support@maabar.io',
    footerLine2: 'Saudi Arabia × China',
    comingSoon: 'Coming soon on App Store & Google Play',
    languageEnglish: 'English',
    languageChinese: '中文',
    ctaLabels: {
      openDashboard: 'Open Supplier Dashboard',
      viewStatus: 'View Application Status',
      continueApplication: 'Continue Application',
      applyNow: 'APPLY NOW →',
    },
  },
  zh: {
    badge: '创始供应商计划',
    title: '沙特市场正在等待您的加入。<br />成为首批进入沙特市场的中国供应商。',
    subtitle: '我们正在严格筛选优质供应商，优先进入沙特市场 — 立即上传您的产品，从第一天起即可上线。',
    countdownLabel: '早期注册即将截止',
    alreadyApproved: '已经批准了？登录',
    whatYouGet: '您将获得',
    benefits: [
      {
        title: '0% 佣金',
        desc: '前20名供应商：6个月内享受0%佣金。',
      },
      {
        title: '直接对接沙特买家',
        desc: '沙特每年从中国进口 1000 亿美元。Maabar 直接为您对接。',
      },
      {
        title: '搜索结果优先展示',
        desc: '您的产品将在搜索结果和分类列表中优先显示，从发布之日起。',
      },
      {
        title: '创始供应商专属标识',
        desc: '永久显示在您的主页上，从第一天起就建立与沙特商家的信任。',
      },
    ],
    howItWorks: '流程怎么走',
    steps: [
      '立即申请成为创始供应商',
      '获批准成为创始供应商',
      '上传您的产品并完善个人资料',
      '您的产品在发布日上线',
      '立即开始接收沙特商家的询价',
    ],
    reviewNote: '审核需要 24 到 72 小时 · 名额有限',
    footerLine1: 'maabar.io · support@maabar.io',
    footerLine2: '沙特阿拉伯 × 中国',
    comingSoon: '即将上线 App Store 与 Google Play',
    languageEnglish: 'English',
    languageChinese: '中文',
    ctaLabels: {
      openDashboard: '打开供应商仪表板',
      viewStatus: '查看申请状态',
      continueApplication: '继续申请',
      applyNow: '立即申请 →',
    },
  },
};

export default function SupplierAccess({ user, profile, lang = 'zh' }) {
  const nav = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [currentLang, setCurrentLang] = useState('zh');
  usePageTitle('supplier-access', currentLang);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const supplierState = profile?.role === 'supplier' ? getSupplierOnboardingState(profile, user) : null;
  const supplierPrimaryRouteRaw = supplierState ? getSupplierPrimaryRoute(profile, user) : '/login/supplier';
  const routeLang = supplierState ? currentLang : 'zh';
  const supplierPrimaryRoute = supplierPrimaryRouteRaw + (supplierPrimaryRouteRaw.includes('?') ? `&lang=${routeLang}` : `?lang=${routeLang}`);
  const hasExistingSupplierAccount = Boolean(user && profile?.role === 'supplier');

  const t = TRANSLATIONS[currentLang] || TRANSLATIONS.zh;

  const ctaLabel = useMemo(() => {
    if (supplierState?.isApprovedStage || supplierState?.isInactiveStage) return t.ctaLabels.openDashboard;
    if (supplierState?.isUnderReviewStage) return t.ctaLabels.viewStatus;
    if (supplierState?.isApplicationStage) return t.ctaLabels.continueApplication;
    return t.ctaLabels.applyNow;
  }, [supplierState, t]);

  const goToApply = () => {
    let url = supplierPrimaryRoute;
    if (!user && supplierPrimaryRouteRaw === '/login/supplier') {
      url += (url.includes('?') ? '&' : '?') + 'mode=signup';
    }
    nav(url);
  };
  const goToSignIn = () => nav(`/login/supplier?lang=${currentLang}`);

  const fmt = (v) => String(v).padStart(2, '0');

  return (
    <div lang={currentLang} style={{ minHeight: 'var(--app-dvh,100dvh)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>

      {/* CONTENT */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 60px' }}>

        {/* Already approved? Sign in - MOVED TO TOP */}
        <div style={{ textAlign: 'right', padding: '20px 0 10px' }}>
          <button onClick={goToSignIn} style={{ background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '.04em' }}>
            {t.alreadyApproved}
          </button>
        </div>

        {/* HERO */}
        <div style={{ padding: '0 0 36px' }}>
          <div style={{ display: 'inline-block', background: 'var(--text-primary)', color: 'var(--bg-base)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 4, marginBottom: 22 }}>
            {t.badge}
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 8vw, 52px)', fontWeight: 800, lineHeight: 1.12, color: 'var(--text-primary)', margin: '0 0 18px' }} dangerouslySetInnerHTML={{ __html: t.title }} />

          <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 32px', maxWidth: 520 }}>
            {t.subtitle}
          </p>

          {/* COUNTDOWN */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '20px 24px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>{t.countdownLabel}</div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
              {[
                { v: fmt(timeLeft.days), l: 'DAYS' },
                { v: fmt(timeLeft.hours), l: 'HOURS' },
                { v: fmt(timeLeft.minutes), l: 'MIN' },
                { v: fmt(timeLeft.seconds), l: 'SEC' },
              ].map(({ v, l }) => (
                <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>{v}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: '0.1em' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SPOTS SECTION REMOVED COMPLETELY */}
        </div>

        {/* WHAT YOU GET */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 20 }}>{t.whatYouGet}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {t.benefits.map((b, i) => (
              <div key={b.title}>
                <div style={{ padding: '16px 0' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{b.desc}</div>
                </div>
                {i < t.benefits.length - 1 && <div style={{ height: 1, background: 'var(--border-subtle)' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 20 }}>{t.howItWorks}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {t.steps.map((step, i) => (
              <div key={step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-disabled)', minWidth: 20, paddingTop: 1 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch' }}>
          <button
            onClick={goToApply}
            style={{ width: '100%', background: 'var(--text-primary)', color: 'var(--bg-base)', border: 'none', borderRadius: 10, padding: '18px 24px', fontSize: 14, fontWeight: 800, letterSpacing: '0.08em', cursor: 'pointer', textTransform: 'uppercase' }}
          >
            {ctaLabel}
          </button>
          
          {/* Language Selection - TOGGLE WITHOUT NAVIGATION */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            <button 
              onClick={() => setCurrentLang('en')}
              style={{ background: 'none', border: 'none', color: currentLang === 'en' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t.languageEnglish}
            </button>
            <button 
              onClick={() => setCurrentLang('zh')}
              style={{ background: 'none', border: 'none', color: currentLang === 'zh' ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              {t.languageChinese}
            </button>
          </div>
          
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-disabled)', lineHeight: 1.7 }}>
            {t.reviewNote}
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-disabled)', lineHeight: 1.9, marginTop: 40 }}>
          <div>{t.footerLine1}</div>
          <div>{t.footerLine2}</div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#bbb' }}>{t.comingSoon}</div>
        </div>

      </div>
    </div>
  );
}
