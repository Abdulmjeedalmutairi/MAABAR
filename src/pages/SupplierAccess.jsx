import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const ACCESS_DEADLINE = '2026-04-14T23:59:59Z';

const earlyBenefits = [
  {
    title: 'Early access to Saudi buyers',
    description: 'Enter Maabar before public launch and position your company ahead of wider supplier onboarding.',
  },
  {
    title: 'Founding supplier advantage',
    description: 'Be among the first selected suppliers presented through Maabar as Saudi buyer demand grows.',
  },
  {
    title: 'Selective onboarding',
    description: 'Applications are reviewed carefully to onboard quality suppliers before public rollout.',
  },
  {
    title: 'Early market positioning',
    description: 'Establish your presence in a Saudi-focused B2B channel before the marketplace opens broadly.',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Apply as a supplier',
    description: 'Submit your company information to request founding supplier access.',
  },
  {
    step: '02',
    title: 'Get reviewed before launch',
    description: 'Our team reviews supplier applications before public launch and broader onboarding.',
  },
  {
    step: '03',
    title: 'Gain early visibility',
    description: 'Approved suppliers gain early positioning with Saudi buyer opportunities on Maabar.',
  },
];

const whyMaabar = [
  'Direct positioning for Saudi buyer demand',
  'Arabic–Chinese communication support',
  'Structured onboarding before public launch',
  'A premium, selective supplier intake process',
];

function getTimeLeft() {
  const diff = new Date(ACCESS_DEADLINE).getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

function CountUnit({ label, value }) {
  return (
    <div style={{
      minWidth: 86,
      padding: '16px 14px',
      borderRadius: 18,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      textAlign: 'center',
      backdropFilter: 'blur(10px)',
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', lineHeight: 1.1 }}>{String(value).padStart(2, '0')}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.58)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

export default function SupplierAccess() {
  usePageTitle('supplier-access', 'en');
  const nav = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ctaCopy = useMemo(() => (timeLeft.expired ? 'Apply for Supplier Access' : 'Apply for Early Supplier Access'), [timeLeft.expired]);

  const goToApply = () => nav('/login/supplier');
  const scrollToFlow = () => {
    const el = document.getElementById('supplier-access-flow');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ background: '#050816', color: '#fff', minHeight: '100vh' }}>
      <section style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '96px 20px 72px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'radial-gradient(circle at top right, rgba(179,155,89,0.18), transparent 30%), radial-gradient(circle at top left, rgba(255,255,255,0.06), transparent 24%), linear-gradient(180deg, #081122 0%, #050816 100%)',
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gap: 28, gridTemplateColumns: 'minmax(0,1.15fr) minmax(320px,0.85fr)', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.82)', fontSize: 13, marginBottom: 18 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c9a95c', display: 'inline-block' }} />
              Founding supplier access is limited
            </div>

            <h1 style={{ fontSize: 'clamp(2.6rem, 5vw, 4.7rem)', lineHeight: 0.98, margin: '0 0 18px', letterSpacing: '-0.04em', maxWidth: 760 }}>
              Secure early access to Saudi buyers before public launch
            </h1>

            <p style={{ fontSize: 20, lineHeight: 1.65, color: 'rgba(255,255,255,0.8)', maxWidth: 760, margin: '0 0 16px' }}>
              Maabar is a Saudi B2B platform connecting selected Chinese suppliers with Saudi merchants.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: 'rgba(255,255,255,0.62)', maxWidth: 740, margin: '0 0 28px' }}>
              We are currently reviewing a limited number of founding supplier applications before public launch. Enter early, position your company sooner, and gain an advantage before broader supplier onboarding begins.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
              <button onClick={goToApply} style={{ background: '#b89a52', color: '#081122', border: 'none', borderRadius: 14, padding: '15px 22px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                {ctaCopy}
              </button>
              <button onClick={scrollToFlow} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 14, padding: '15px 22px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                See how it works
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['Selective review', 'Saudi market opportunity', 'Pre-launch access'].map((item) => (
                <div key={item} style={{ padding: '9px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.68)', fontSize: 13 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 28,
            padding: 26,
            boxShadow: '0 40px 90px rgba(0,0,0,0.28)',
          }}>
            <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
              Founding supplier access closes in
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
              <CountUnit label="Days" value={timeLeft.days} />
              <CountUnit label="Hours" value={timeLeft.hours} />
              <CountUnit label="Minutes" value={timeLeft.minutes} />
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, display: 'grid', gap: 14 }}>
              {[
                'Selected suppliers only',
                'Applications reviewed before launch',
                'Designed for serious Saudi market entry',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'rgba(255,255,255,0.8)' }}>
                  <span style={{ marginTop: 2, color: '#c9a95c' }}>●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '72px 20px 24px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ color: '#c9a95c', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Why join early</div>
          <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', margin: '0 0 16px', letterSpacing: '-0.03em' }}>Why selected suppliers join Maabar before launch</h2>
          <p style={{ color: 'rgba(255,255,255,0.64)', fontSize: 17, lineHeight: 1.7, maxWidth: 780, margin: '0 0 28px' }}>
            This page is not about joining another generic directory. It is about entering the Saudi market early through a Saudi-focused B2B channel before public rollout.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            {earlyBenefits.map((item) => (
              <div key={item.title} style={{ padding: 24, borderRadius: 22, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 20 }}>{item.title}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="supplier-access-flow" style={{ padding: '52px 20px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div style={{ color: '#c9a95c', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', margin: '0 0 28px', letterSpacing: '-0.03em' }}>A short, selective path to pre-launch supplier access</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
            {howItWorks.map((item) => (
              <div key={item.step} style={{ padding: 26, borderRadius: 24, background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ color: '#c9a95c', fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 12 }}>{item.step}</div>
                <h3 style={{ margin: '0 0 10px', fontSize: 22 }}>{item.title}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.62)', lineHeight: 1.7 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '24px 20px 72px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', display: 'grid', gridTemplateColumns: 'minmax(0, 0.95fr) minmax(320px, 0.75fr)', gap: 22, alignItems: 'stretch' }}>
          <div style={{ padding: 30, borderRadius: 28, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ color: '#c9a95c', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Why Maabar</div>
            <h2 style={{ fontSize: 'clamp(1.9rem, 2.8vw, 2.8rem)', margin: '0 0 14px', letterSpacing: '-0.03em' }}>Why this is different from a standard supplier listing</h2>
            <p style={{ color: 'rgba(255,255,255,0.64)', fontSize: 17, lineHeight: 1.7, margin: '0 0 24px' }}>
              Maabar is built around Saudi buyer demand and structured supplier onboarding — not open listing noise.
            </p>
            <div style={{ display: 'grid', gap: 14 }}>
              {whyMaabar.map((item) => (
                <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'rgba(255,255,255,0.82)' }}>
                  <span style={{ marginTop: 2, color: '#c9a95c' }}>●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 30, borderRadius: 28, background: 'linear-gradient(180deg, rgba(184,154,82,0.14), rgba(255,255,255,0.03))', border: '1px solid rgba(201,169,92,0.24)' }}>
            <div style={{ color: '#c9a95c', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Scarcity & timing</div>
            <h2 style={{ fontSize: 30, margin: '0 0 12px', lineHeight: 1.15 }}>Founding supplier access is limited</h2>
            <p style={{ color: 'rgba(255,255,255,0.74)', lineHeight: 1.7, margin: '0 0 22px' }}>
              We are currently onboarding a limited number of Chinese suppliers before official launch. Applications are reviewed selectively.
            </p>
            <button onClick={goToApply} style={{ width: '100%', background: '#b89a52', color: '#081122', border: 'none', borderRadius: 14, padding: '15px 18px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>
              Apply before public launch
            </button>
            <div style={{ color: 'rgba(255,255,255,0.56)', fontSize: 14 }}>
              After applying, suppliers move into an under-review state before approval and onboarding.
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 20px 88px' }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', textAlign: 'center', padding: '42px 24px', borderRadius: 30, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ color: '#c9a95c', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Apply now</div>
          <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', margin: '0 0 14px', letterSpacing: '-0.03em' }}>Position your company early in the Saudi market</h2>
          <p style={{ color: 'rgba(255,255,255,0.64)', fontSize: 17, lineHeight: 1.7, maxWidth: 760, margin: '0 auto 26px' }}>
            Join Maabar as a founding supplier before public launch and secure early access to Saudi buyer opportunities through a selective onboarding process.
          </p>
          <button onClick={goToApply} style={{ background: '#b89a52', color: '#081122', border: 'none', borderRadius: 14, padding: '16px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            {ctaCopy}
          </button>
        </div>
      </section>

      <Footer lang="en" />
    </div>
  );
}
