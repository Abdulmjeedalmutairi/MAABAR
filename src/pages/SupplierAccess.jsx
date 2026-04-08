import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import usePageTitle from '../hooks/usePageTitle';
import { getSupplierOnboardingState, getSupplierPrimaryRoute } from '../lib/supplierOnboarding';

const ACCESS_DEADLINE = '2026-04-14T23:59:59Z';
const TOTAL_SPOTS = 10;
const SPOTS_TAKEN = 2;
const SPOTS_LEFT = TOTAL_SPOTS - SPOTS_TAKEN;

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

const BENEFITS = [
  {
    title: '0% Commission',
    desc: 'No fees on any transaction. Zero cuts for founding suppliers.',
  },
  {
    title: 'Direct Access to Saudi Buyers',
    desc: 'Saudi Arabia imports $100B annually from China. Maabar connects you directly.',
  },
  {
    title: 'Priority Placement',
    desc: 'Your products appear first in search results and category listings from launch day.',
  },
];

const HOW_STEPS = [
  'Submit your application',
  'Get approved as a Founding Supplier',
  'Upload your products and prepare your profile',
  'Your products go live on launch day',
  'Start receiving requests from Saudi merchants immediately',
];

export default function SupplierAccess({ user, profile, lang = 'en' }) {
  usePageTitle('supplier-access', lang);
  const nav = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const supplierState = profile?.role === 'supplier' ? getSupplierOnboardingState(profile, user) : null;
  const supplierPrimaryRouteRaw = supplierState ? getSupplierPrimaryRoute(profile, user) : '/login/supplier';
  const supplierPrimaryRoute = supplierPrimaryRouteRaw + (supplierPrimaryRouteRaw.includes('?') ? '&lang=en' : '?lang=en');
  const hasExistingSupplierAccount = Boolean(user && profile?.role === 'supplier');

  const ctaLabel = useMemo(() => {
    if (supplierState?.isApprovedStage || supplierState?.isInactiveStage) return 'Open Supplier Dashboard';
    if (supplierState?.isUnderReviewStage) return 'View Application Status';
    if (supplierState?.isApplicationStage) return 'Continue Application';
    return 'APPLY NOW →';
  }, [supplierState]);

  const goToApply = () => {
    if (user && profile?.role === 'supplier') {
      nav(supplierPrimaryRoute);
    } else {
      nav('/login/supplier?lang=en');
    }
  };
  const goToSignIn = () => nav('/login/supplier?lang=en');

  const fmt = (v) => String(v).padStart(2, '0');

  return (
    <div lang="en" style={{ minHeight: 'var(--app-dvh,100dvh)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>

      {/* NAV */}
      <div style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(9,8,13,0.90)', backdropFilter: 'blur(18px)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px', minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <BrandLogo as="button" size="sm" onClick={() => nav('/')} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={goToSignIn} style={{ background: 'none', border: '1px solid var(--border-default)', color: 'var(--text-secondary)', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '.04em' }}>
              Already approved? Sign in
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px 60px' }}>

        {/* HERO */}
        <div style={{ padding: '48px 0 36px' }}>
          <div style={{ display: 'inline-block', background: 'var(--text-primary)', color: 'var(--bg-base)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 4, marginBottom: 22 }}>
            Founding Supplier Program
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 8vw, 52px)', fontWeight: 800, lineHeight: 1.12, color: 'var(--text-primary)', margin: '0 0 18px' }}>
            The Saudi market is waiting.<br />Be first to reach it.
          </h1>

          <p style={{ fontSize: 17, lineHeight: 1.75, color: 'var(--text-secondary)', margin: '0 0 32px', maxWidth: 520 }}>
            We are selecting verified suppliers for early access to the Saudi market — upload your products now and go live from day one.
          </p>

          {/* COUNTDOWN */}
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '20px 24px', marginBottom: 14 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>Official launch in</div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end' }}>
              {[
                { v: fmt(timeLeft.days), l: 'DAYS' },
                { v: fmt(timeLeft.hours), l: 'HOURS' },
                { v: fmt(timeLeft.minutes), l: 'MIN' },
                { v: fmt(timeLeft.seconds), l: 'SEC' },
              ].map(({ v, l }) => (
                <div key={l} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span style={{ fontSize: 'clamp(28px, 7vw, 40px)', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>{v}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: '0.1em' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SPOTS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#E8A020' }}>
              {SPOTS_LEFT} of {TOTAL_SPOTS} spots remaining in your category
            </span>
          </div>
        </div>

        {/* WHAT YOU GET */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 20 }}>What you get</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {BENEFITS.map((b, i) => (
              <div key={b.title}>
                <div style={{ padding: '16px 0' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{b.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{b.desc}</div>
                </div>
                {i < BENEFITS.length - 1 && <div style={{ height: 1, background: 'var(--border-subtle)' }} />}
              </div>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 20 }}>How it works</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {HOW_STEPS.map((step, i) => (
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
          
          {/* Language Selection */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
            <button 
              onClick={() => nav('/login/supplier?lang=en')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              English
            </button>
            <button 
              onClick={() => nav('/login/supplier?lang=zh')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
            >
              中文
            </button>
          </div>
          
          <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-disabled)', lineHeight: 1.7 }}>
            Review takes 24 to 72 hours · Limited spots available
          </div>
        </div>

        {/* FOOTER */}
        <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-disabled)', lineHeight: 1.9 }}>
          <div>maabar.io · info@maabar.io</div>
          <div>Saudi Arabia × China</div>
        </div>

      </div>
    </div>
  );
}
