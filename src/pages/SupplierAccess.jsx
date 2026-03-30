import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const ACCESS_DEADLINE = '2026-04-14T23:59:59Z';

const earlyBenefits = [
  {
    title: 'Early access to Saudi buyers',
    description: 'Enter Maabar before public launch and position your company ahead of broader supplier onboarding.',
  },
  {
    title: 'Founding supplier advantage',
    description: 'Be among the first selected suppliers positioned inside a Saudi-focused B2B marketplace.',
  },
  {
    title: 'Selective onboarding',
    description: 'Applications are reviewed carefully before official launch to keep supplier intake focused and high quality.',
  },
  {
    title: 'Saudi market positioning',
    description: 'Establish your company early before the platform opens publicly to a wider supplier base.',
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
    description: 'Our team reviews selected supplier applications before the public rollout.',
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
  'Selective supplier access rather than open listing noise',
];

function getTimeLeft() {
  const diff = new Date(ACCESS_DEADLINE).getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true };
  }

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    expired: false,
  };
}

function CountUnit({ label, value }) {
  return (
    <div style={{
      minWidth: 88,
      padding: '16px 14px',
      borderRadius: 18,
      background: 'var(--bg-muted)',
      border: '1px solid var(--border-muted)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>{String(value).padStart(2, '0')}</div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
    </div>
  );
}

export default function SupplierAccess() {
  usePageTitle('supplier-access', 'en');
  const nav = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [isCompact, setIsCompact] = useState(typeof window !== 'undefined' ? window.innerWidth < 960 : false);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    const onResize = () => setIsCompact(window.innerWidth < 960);
    window.addEventListener('resize', onResize);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const ctaCopy = useMemo(() => (timeLeft.expired ? 'Apply for Supplier Access' : 'Apply for Early Supplier Access'), [timeLeft.expired]);
  const containerStyle = useMemo(() => ({ maxWidth: 1180, margin: '0 auto', width: '100%' }), []);
  const currentStep = howItWorks[activeStep];

  const goToApply = () => nav('/login/supplier');
  const nextStep = () => setActiveStep((prev) => (prev + 1) % howItWorks.length);
  const prevStep = () => setActiveStep((prev) => (prev - 1 + howItWorks.length) % howItWorks.length);
  const scrollToFlow = () => {
    const el = document.getElementById('supplier-access-flow');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div dir="ltr" lang="en" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)', minHeight: '100vh', textAlign: 'left' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: '1px solid var(--border-subtle)', background: 'rgba(10,10,11,0.92)', backdropFilter: 'blur(16px)' }}>
        <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '16px 20px' }}>
          <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', fontSize: 18, fontWeight: 600 }}>
            <span style={{ letterSpacing: '0.18em', fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>MAABAR</span>
            <span style={{ color: 'var(--text-tertiary)' }}>|</span>
            <span style={{ fontSize: 16 }}>Supplier Access</span>
          </button>
          <button onClick={goToApply} style={{ background: 'var(--text-primary)', color: 'var(--bg-base)', border: 'none', borderRadius: 12, padding: '12px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            Apply now
          </button>
        </div>
      </div>

      <section style={{ padding: isCompact ? '56px 20px 56px' : '92px 20px 72px', borderBottom: '1px solid var(--border-subtle)', background: 'linear-gradient(180deg, var(--bg-base) 0%, var(--bg-subtle) 100%)' }}>
        <div style={{ ...containerStyle, display: 'grid', gap: 24, gridTemplateColumns: isCompact ? '1fr' : 'minmax(0,1.1fr) minmax(320px,0.9fr)', alignItems: 'center' }}>
          <div style={{ order: isCompact ? 2 : 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 999, background: 'var(--bg-muted)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)', fontSize: 13, marginBottom: 18 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-primary)', display: 'inline-block', opacity: 0.8 }} />
              Founding supplier access is limited
            </div>

            <h1 style={{ fontSize: isCompact ? '3rem' : 'clamp(3.4rem, 5vw, 5rem)', lineHeight: 0.98, margin: '0 0 18px', letterSpacing: '-0.05em', maxWidth: 760 }}>
              Secure early access to Saudi buyers before public launch
            </h1>

            <p style={{ fontSize: isCompact ? 18 : 20, lineHeight: 1.65, color: 'var(--text-primary)', maxWidth: 760, margin: '0 0 16px' }}>
              Maabar is a Saudi B2B platform connecting selected Chinese suppliers with Saudi merchants.
            </p>
            <p style={{ fontSize: 17, lineHeight: 1.7, color: 'var(--text-secondary)', maxWidth: 740, margin: '0 0 28px' }}>
              We are currently reviewing a limited number of founding supplier applications before public launch. Enter early, position your company sooner, and gain an advantage before broader supplier onboarding begins.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginBottom: 22 }}>
              <button onClick={goToApply} style={{ background: 'var(--text-primary)', color: 'var(--bg-base)', border: 'none', borderRadius: 14, padding: '15px 22px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
                {ctaCopy}
              </button>
              <button onClick={scrollToFlow} style={{ background: 'transparent', color: 'var(--text-primary)', border: '1px solid var(--border-default)', borderRadius: 14, padding: '15px 22px', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
                See how it works
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {['Selective review', 'Saudi market opportunity', 'Pre-launch access'].map((item) => (
                <div key={item} style={{ padding: '9px 12px', borderRadius: 999, background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 13 }}>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ order: isCompact ? 1 : 2, background: 'var(--bg-muted)', border: '1px solid var(--border-muted)', borderRadius: 28, padding: 26, boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>
              Founding supplier access closes in
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 22 }}>
              <CountUnit label="Days" value={timeLeft.days} />
              <CountUnit label="Hours" value={timeLeft.hours} />
              <CountUnit label="Minutes" value={timeLeft.minutes} />
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 20, display: 'grid', gap: 14 }}>
              {[
                'Selected suppliers only',
                'Applications reviewed before launch',
                'Designed for serious Saudi market entry',
              ].map((item) => (
                <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'var(--text-primary)' }}>
                  <span style={{ marginTop: 2, color: 'var(--text-primary)', opacity: 0.72 }}>●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '72px 20px 24px', background: 'var(--bg-base)' }}>
        <div style={containerStyle}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Why join early</div>
          <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', margin: '0 0 16px', letterSpacing: '-0.03em' }}>Why selected suppliers join Maabar before launch</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.7, maxWidth: 780, margin: '0 0 28px' }}>
            This is not a generic directory signup. It is an early market-entry opportunity built around Saudi buyer access, positioning, and selective onboarding.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            {earlyBenefits.map((item) => (
              <div key={item.title} style={{ padding: 24, borderRadius: 22, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <h3 style={{ margin: '0 0 10px', fontSize: 20 }}>{item.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="supplier-access-flow" style={{ padding: '52px 20px', background: 'var(--bg-base)' }}>
        <div style={containerStyle}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', margin: '0 0 16px', letterSpacing: '-0.03em' }}>A short, animated tour the user can control</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.7, maxWidth: 760, margin: '0 0 28px' }}>
            The supplier moves through the flow step by step, with clear motion and manual navigation.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: isCompact ? '1fr' : '320px minmax(0,1fr)', gap: 18, alignItems: 'stretch' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {howItWorks.map((item, index) => {
                const isActive = activeStep === index;
                return (
                  <button
                    key={item.step}
                    onClick={() => setActiveStep(index)}
                    className={`supplier-step-button${isActive ? ' active' : ''}`}
                    style={{ textAlign: 'left' }}
                  >
                    <div style={{ color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 8 }}>{item.step}</div>
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>{item.title}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{item.description}</div>
                  </button>
                );
              })}
            </div>

            <div className="supplier-tour-stage" style={{ padding: isCompact ? 22 : 30, minHeight: 320, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ marginBottom: 22 }}>
                <div style={{ height: 5, borderRadius: 999, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginBottom: 22 }}>
                  <div style={{ width: `${((activeStep + 1) / howItWorks.length) * 100}%`, height: '100%', borderRadius: 999, background: 'var(--text-primary)', transition: 'width 320ms cubic-bezier(0.22, 1, 0.36, 1)' }} />
                </div>

                <div key={currentStep.step} className="supplier-tour-content">
                  <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>
                    Step {activeStep + 1} of {howItWorks.length}
                  </div>
                  <div style={{ fontSize: isCompact ? 56 : 72, lineHeight: 0.95, marginBottom: 14, letterSpacing: '-0.06em' }}>{currentStep.step}</div>
                  <h3 style={{ fontSize: isCompact ? 28 : 36, lineHeight: 1.05, margin: '0 0 12px', letterSpacing: '-0.03em' }}>{currentStep.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 18, lineHeight: 1.75, maxWidth: 560, margin: 0 }}>{currentStep.description}</p>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', gap: 8, margin: '0 0 18px' }}>
                  {howItWorks.map((item, index) => (
                    <button
                      key={item.step}
                      onClick={() => setActiveStep(index)}
                      aria-label={`Go to step ${index + 1}`}
                      className={`supplier-tour-dot${index === activeStep ? ' active' : ''}`}
                    />
                  ))}
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <button onClick={prevStep} className="supplier-tour-nav supplier-tour-nav-secondary">
                    Previous
                  </button>
                  <button onClick={nextStep} className="supplier-tour-nav supplier-tour-nav-primary">
                    Next step
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '24px 20px 72px', background: 'var(--bg-base)' }}>
        <div style={{ ...containerStyle, display: 'grid', gridTemplateColumns: isCompact ? '1fr' : 'minmax(0, 0.95fr) minmax(320px, 0.75fr)', gap: 22, alignItems: 'stretch' }}>
          <div style={{ padding: 30, borderRadius: 28, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Why Maabar</div>
            <h2 style={{ fontSize: 'clamp(1.9rem, 2.8vw, 2.8rem)', margin: '0 0 14px', letterSpacing: '-0.03em' }}>Why this is different from a standard supplier listing</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.7, margin: '0 0 24px' }}>
              Maabar is built around Saudi buyer demand and structured supplier onboarding — not open listing noise.
            </p>
            <div style={{ display: 'grid', gap: 14 }}>
              {whyMaabar.map((item) => (
                <div key={item} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', color: 'var(--text-primary)' }}>
                  <span style={{ marginTop: 2, color: 'var(--text-primary)', opacity: 0.72 }}>●</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: 30, borderRadius: 28, background: 'var(--bg-muted)', border: '1px solid var(--border-muted)' }}>
            <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Scarcity & timing</div>
            <h2 style={{ fontSize: 30, margin: '0 0 12px', lineHeight: 1.15 }}>Founding supplier access is limited</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 22px' }}>
              We are currently onboarding a limited number of Chinese suppliers before official launch. Applications are reviewed selectively.
            </p>
            <button onClick={goToApply} style={{ width: '100%', background: 'var(--text-primary)', color: 'var(--bg-base)', border: 'none', borderRadius: 14, padding: '15px 18px', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginBottom: 16 }}>
              Apply before public launch
            </button>
            <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              After applying, suppliers move into an under-review state before approval and onboarding.
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 20px 88px', background: 'var(--bg-base)' }}>
        <div style={{ ...containerStyle, textAlign: 'center', padding: '42px 24px', borderRadius: 30, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12 }}>Apply now</div>
          <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', margin: '0 0 14px', letterSpacing: '-0.03em' }}>Position your company early in the Saudi market</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 17, lineHeight: 1.7, maxWidth: 760, margin: '0 auto 26px' }}>
            Join Maabar as a founding supplier before public launch and secure early access to Saudi buyer opportunities through a selective onboarding process.
          </p>
          <button onClick={goToApply} style={{ background: 'var(--text-primary)', color: 'var(--bg-base)', border: 'none', borderRadius: 14, padding: '16px 24px', fontSize: 16, fontWeight: 700, cursor: 'pointer' }}>
            {ctaCopy}
          </button>
        </div>
      </section>

      <style>{`
        @keyframes supplierTourFade {
          from {
            opacity: 0;
            transform: translateY(16px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .supplier-step-button {
          text-align: left;
          padding: 18px;
          border-radius: 20px;
          background: var(--bg-subtle);
          border: 1px solid var(--border-subtle);
          color: var(--text-primary);
          cursor: pointer;
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease, background 220ms ease, box-shadow 240ms ease;
        }

        .supplier-step-button:hover {
          transform: translateY(-2px);
          border-color: var(--border-default);
        }

        .supplier-step-button.active {
          background: var(--bg-muted);
          border-color: var(--border-default);
          transform: translateX(6px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.16);
        }

        .supplier-tour-stage {
          position: relative;
          border-radius: 28px;
          background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015));
          border: 1px solid var(--border-muted);
          overflow: hidden;
          box-shadow: 0 28px 70px rgba(0,0,0,0.18);
        }

        .supplier-tour-stage::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 34%);
          pointer-events: none;
        }

        .supplier-tour-content {
          animation: supplierTourFade 380ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .supplier-tour-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: none;
          background: var(--border-strong);
          cursor: pointer;
          transition: all 240ms cubic-bezier(0.22, 1, 0.36, 1);
          padding: 0;
        }

        .supplier-tour-dot.active {
          width: 34px;
          background: var(--text-primary);
        }

        .supplier-tour-nav {
          border-radius: 14px;
          padding: 14px 18px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, background 220ms ease, border-color 220ms ease;
        }

        .supplier-tour-nav:hover {
          transform: translateY(-1px);
        }

        .supplier-tour-nav-primary {
          background: var(--text-primary);
          color: var(--bg-base);
          border: none;
        }

        .supplier-tour-nav-secondary {
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--border-default);
        }
      `}</style>

      <Footer lang="en" />
    </div>
  );
}
