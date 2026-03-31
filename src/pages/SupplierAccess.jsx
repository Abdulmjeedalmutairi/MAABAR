import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

const ACCESS_DEADLINE = '2026-04-14T23:59:59Z';

const earlyBenefits = [
  {
    title: 'Early access to Saudi buyers',
    description: 'Enter Maabar before public launch and position your company ahead of broader supplier onboarding.',
  },
  {
    title: 'Founding supplier advantage',
    description: 'Approved suppliers can prepare their presence and upload products before public launch begins.',
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
  'Selective supplier access instead of open-listing noise',
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
    <div className="supplier-count-unit">
      <div className="supplier-count-value">{String(value).padStart(2, '0')}</div>
      <div className="supplier-count-label">{label}</div>
    </div>
  );
}

export default function SupplierAccess() {
  usePageTitle('supplier-access', 'en');
  const nav = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [activeScene, setActiveScene] = useState(0);
  const [isCompact, setIsCompact] = useState(typeof window !== 'undefined' ? window.innerWidth < 960 : false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    const onResize = () => setIsCompact(window.innerWidth < 960);
    window.addEventListener('resize', onResize);
    return () => {
      clearInterval(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const ctaCopy = useMemo(() => (timeLeft.expired ? 'Start supplier application' : 'Start early supplier application'), [timeLeft.expired]);
  const totalScenes = 5;
  const sceneProgress = ((activeScene + 1) / totalScenes) * 100;

  const goToApply = () => nav('/login/supplier?mode=signup');
  const goHome = () => nav('/');
  const nextScene = () => setActiveScene((prev) => Math.min(prev + 1, totalScenes - 1));
  const prevScene = () => setActiveScene((prev) => Math.max(prev - 1, 0));
  const jumpToScene = (index) => setActiveScene(index);

  return (
    <div dir="ltr" lang="en" className="supplier-access-page">
      <div className="supplier-access-topbar">
        <div className="supplier-access-shell supplier-access-topbar-inner">
          <BrandLogo as="button" size="sm" align="flex-start" onClick={goHome} />

          <div className="supplier-topbar-actions">
            <button onClick={() => jumpToScene(0)} className="supplier-topbar-link">Start Journey</button>
            <button onClick={goToApply} className="supplier-topbar-cta">Start application</button>
          </div>
        </div>
      </div>

      <main className="supplier-access-main">
        <div className="supplier-access-shell">
          <div className="supplier-journey-progress-wrap">
            <div className="supplier-journey-progress-bar">
              <div className="supplier-journey-progress-fill" style={{ width: `${sceneProgress}%` }} />
            </div>
            <div className="supplier-journey-progress-meta">
              <span>Journey</span>
              <span>{activeScene + 1} / {totalScenes}</span>
            </div>
          </div>

          <div className="supplier-journey-stage">
            {activeScene === 0 && (
              <section key="scene-0" className="supplier-scene supplier-scene-hero">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">Founding supplier access</div>
                  <h1 className="supplier-scene-title supplier-scene-title-hero">Secure early access to Saudi buyers before public launch</h1>
                  <p className="supplier-scene-description supplier-scene-description-large">
                    Maabar is a Saudi B2B platform connecting selected Chinese suppliers with Saudi merchants. This is not full account activation — it is a guided supplier application before launch.
                  </p>
                  <div className="supplier-scene-actions">
                    <button onClick={nextScene} className="supplier-primary-btn">Start Journey</button>
                    <button onClick={goToApply} className="supplier-secondary-btn">Start application</button>
                  </div>
                </div>
                <div className="supplier-scene-sidecard">
                  <div className="supplier-sidecard-label">Currently open</div>
                  <div className="supplier-sidecard-title">Founding supplier intake is limited</div>
                  <div className="supplier-sidecard-text">Applications are reviewed before public rollout to keep supplier onboarding selective and premium.</div>
                </div>
              </section>
            )}

            {activeScene === 1 && (
              <section key="scene-1" className="supplier-scene">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">Why join early</div>
                  <h2 className="supplier-scene-title">Position your company before broader supplier rollout begins</h2>
                  <p className="supplier-scene-description">
                    The opportunity is not simply to join a marketplace. It is to enter early, gain positioning sooner, and secure stronger visibility before public launch.
                  </p>
                </div>
                <div className="supplier-card-grid">
                  {earlyBenefits.map((item) => (
                    <div key={item.title} className="supplier-feature-card">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeScene === 2 && (
              <section key="scene-2" className="supplier-scene">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">How it works</div>
                  <h2 className="supplier-scene-title">A short, selective path to supplier access</h2>
                  <p className="supplier-scene-description">
                    The journey is simple: apply, get reviewed, then enter early with better positioning before launch.
                  </p>
                </div>
                <div className="supplier-steps-grid">
                  {howItWorks.map((item) => (
                    <div key={item.step} className="supplier-step-card">
                      <div className="supplier-step-number">{item.step}</div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeScene === 3 && (
              <section key="scene-3" className="supplier-scene">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">Why Maabar</div>
                  <h2 className="supplier-scene-title">Built for Saudi buyer access, not open-listing clutter</h2>
                  <p className="supplier-scene-description">
                    Maabar is structured around Saudi market entry, buyer–supplier coordination, and selective onboarding rather than random marketplace noise.
                  </p>
                </div>
                <div className="supplier-bullets-wrap">
                  {whyMaabar.map((item) => (
                    <div key={item} className="supplier-bullet-row">
                      <span className="supplier-bullet-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeScene === 4 && (
              <section key="scene-4" className="supplier-scene supplier-scene-final">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">Limited access</div>
                  <h2 className="supplier-scene-title">Apply before public launch</h2>
                  <p className="supplier-scene-description">
                    We are currently onboarding a limited number of Chinese suppliers before official launch. Selected applications move into review before approval, onboarding, and early product setup ahead of launch.
                  </p>
                </div>
                <div className="supplier-countdown-row">
                  <CountUnit label="Days" value={timeLeft.days} />
                  <CountUnit label="Hours" value={timeLeft.hours} />
                  <CountUnit label="Minutes" value={timeLeft.minutes} />
                </div>
                <div className="supplier-scene-actions supplier-scene-actions-final">
                  <button onClick={goToApply} className="supplier-primary-btn">{ctaCopy}</button>
                  <button onClick={() => jumpToScene(0)} className="supplier-secondary-btn">Restart journey</button>
                </div>
              </section>
            )}
          </div>

          <div className="supplier-journey-footer">
            <div className="supplier-scene-dots">
              {Array.from({ length: totalScenes }).map((_, index) => (
                <button
                  key={`scene-dot-${index}`}
                  onClick={() => jumpToScene(index)}
                  className={`supplier-scene-dot${index === activeScene ? ' active' : ''}`}
                  aria-label={`Go to scene ${index + 1}`}
                />
              ))}
            </div>

            <div className="supplier-nav-actions">
              <button onClick={prevScene} className="supplier-secondary-btn" disabled={activeScene === 0}>Back</button>
              {activeScene < totalScenes - 1 ? (
                <button onClick={nextScene} className="supplier-primary-btn">Next</button>
              ) : (
                <button onClick={goToApply} className="supplier-primary-btn">Start application</button>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .supplier-access-page {
          min-height: 100vh;
          background: var(--bg-base);
          color: var(--text-primary);
          text-align: left;
        }

        .supplier-access-shell {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;
          padding-left: 20px;
          padding-right: 20px;
        }

        .supplier-access-topbar {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(10,10,11,0.92);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .supplier-access-topbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 72px;
        }

        .supplier-brand-button {
          display: flex;
          align-items: center;
          gap: 12px;
          border: none;
          background: transparent;
          color: var(--text-primary);
          cursor: pointer;
        }

        .supplier-brand-word {
          font-size: 13px;
          letter-spacing: 0.18em;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .supplier-brand-separator {
          color: var(--text-tertiary);
        }

        .supplier-brand-sub {
          font-size: 16px;
        }

        .supplier-topbar-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .supplier-topbar-link,
        .supplier-topbar-cta,
        .supplier-primary-btn,
        .supplier-secondary-btn {
          border-radius: 14px;
          padding: 14px 20px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, background 220ms ease, border-color 220ms ease;
        }

        .supplier-topbar-link:hover,
        .supplier-topbar-cta:hover,
        .supplier-primary-btn:hover,
        .supplier-secondary-btn:hover {
          transform: translateY(-1px);
        }

        .supplier-topbar-link,
        .supplier-secondary-btn {
          background: transparent;
          color: var(--text-primary);
          border: 1px solid var(--border-default);
        }

        .supplier-topbar-cta,
        .supplier-primary-btn {
          background: var(--text-primary);
          color: var(--bg-base);
          border: none;
        }

        .supplier-secondary-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }

        .supplier-access-main {
          min-height: calc(100vh - 72px);
          display: flex;
          align-items: center;
          padding: 32px 0 36px;
        }

        .supplier-journey-progress-wrap {
          margin-bottom: 24px;
        }

        .supplier-journey-progress-bar {
          width: 100%;
          height: 5px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
          margin-bottom: 12px;
        }

        .supplier-journey-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: var(--text-primary);
          transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .supplier-journey-progress-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .supplier-journey-stage {
          position: relative;
          overflow: hidden;
          min-height: 66vh;
          border-radius: 34px;
          border: 1px solid var(--border-subtle);
          background: linear-gradient(180deg, var(--bg-subtle), var(--bg-base));
          box-shadow: 0 34px 90px rgba(0,0,0,0.22);
        }

        .supplier-journey-stage::before {
          content: '';
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at top left, rgba(255,255,255,0.045), transparent 30%);
          pointer-events: none;
        }

        @keyframes supplierSceneEnter {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .supplier-scene {
          position: relative;
          min-height: 66vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 28px;
          padding: 54px;
          animation: supplierSceneEnter 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .supplier-scene-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
          align-items: center;
        }

        .supplier-scene-content {
          max-width: 760px;
        }

        .supplier-scene-eyebrow {
          color: var(--text-tertiary);
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 14px;
        }

        .supplier-scene-title {
          font-size: clamp(2rem, 3.2vw, 3.25rem);
          line-height: 0.98;
          letter-spacing: -0.05em;
          margin: 0 0 16px;
        }

        .supplier-scene-title-hero {
          max-width: 780px;
          font-size: clamp(2.4rem, 4.2vw, 4rem);
        }

        .supplier-scene-description {
          color: var(--text-secondary);
          font-size: 17px;
          line-height: 1.78;
          margin: 0;
          max-width: 720px;
        }

        .supplier-scene-description-large {
          font-size: 17px;
        }

        .supplier-scene-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .supplier-scene-sidecard {
          padding: 26px;
          border-radius: 24px;
          background: var(--bg-muted);
          border: 1px solid var(--border-muted);
          color: var(--text-primary);
        }

        .supplier-sidecard-label {
          color: var(--text-tertiary);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 12px;
        }

        .supplier-sidecard-title {
          font-size: 24px;
          line-height: 1.1;
          margin-bottom: 10px;
        }

        .supplier-sidecard-text {
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .supplier-card-grid,
        .supplier-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }

        .supplier-feature-card,
        .supplier-step-card {
          padding: 24px;
          border-radius: 24px;
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease;
        }

        .supplier-feature-card:hover,
        .supplier-step-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-default);
        }

        .supplier-feature-card h3,
        .supplier-step-card h3 {
          margin: 0 0 10px;
          font-size: 20px;
        }

        .supplier-feature-card p,
        .supplier-step-card p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.7;
        }

        .supplier-step-number {
          color: var(--text-tertiary);
          font-size: 14px;
          letter-spacing: 0.12em;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .supplier-bullets-wrap {
          display: grid;
          gap: 14px;
          max-width: 760px;
        }

        .supplier-bullet-row {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 18px 0;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-primary);
          font-size: 18px;
        }

        .supplier-bullet-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--text-primary);
          opacity: 0.72;
          margin-top: 8px;
          flex: 0 0 auto;
        }

        .supplier-scene-final {
          text-align: center;
          align-items: center;
        }

        .supplier-scene-final .supplier-scene-content {
          max-width: 760px;
        }

        .supplier-countdown-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 14px;
        }

        .supplier-count-unit {
          min-width: 96px;
          padding: 18px 16px;
          border-radius: 20px;
          background: var(--bg-muted);
          border: 1px solid var(--border-muted);
          text-align: center;
        }

        .supplier-count-value {
          font-size: 30px;
          line-height: 1;
          font-weight: 700;
        }

        .supplier-count-label {
          margin-top: 8px;
          font-size: 12px;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .supplier-scene-actions-final {
          justify-content: center;
          margin-top: 0;
        }

        .supplier-journey-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          padding: 18px 4px 0;
        }

        .supplier-scene-dots {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .supplier-scene-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          border: none;
          background: var(--border-strong);
          cursor: pointer;
          transition: all 240ms cubic-bezier(0.22, 1, 0.36, 1);
          padding: 0;
        }

        .supplier-scene-dot.active {
          width: 34px;
          background: var(--text-primary);
        }

        .supplier-nav-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (max-width: 959px) {
          .supplier-access-main {
            padding-top: 20px;
          }

          .supplier-journey-stage,
          .supplier-scene {
            min-height: auto;
          }

          .supplier-scene {
            padding: 28px;
          }

          .supplier-scene-hero {
            grid-template-columns: 1fr;
          }

          .supplier-scene-title-hero {
            font-size: 2.35rem;
          }

          .supplier-topbar-actions {
            display: none;
          }

          .supplier-journey-footer {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
