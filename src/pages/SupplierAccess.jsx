import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';

const ACCESS_DEADLINE = '2026-04-14T23:59:59Z';

const earlyBenefits = [
  {
    title: 'Early access to Saudi demand',
    description: 'Enter Maabar before wider supplier onboarding opens and position your company closer to real Saudi buyer demand.',
  },
  {
    title: 'Founding supplier advantage',
    description: 'Approved suppliers move first, with time to prepare their presence before broader supplier traffic arrives.',
  },
  {
    title: 'Selective review, not open listing',
    description: 'Supplier applications are reviewed carefully so early access stays focused, credible, and high quality.',
  },
  {
    title: 'A cleaner market entry path',
    description: 'Maabar is designed to help serious Chinese suppliers enter Saudi B2B demand with more structure and less noise.',
  },
];

const howItWorks = [
  {
    step: '01',
    title: 'Start the supplier application',
    description: 'Use the shared supplier signup page to submit your company and application details.',
  },
  {
    step: '02',
    title: 'Confirm email and enter review',
    description: 'After confirmation, your account moves into a controlled pending-review state while the team evaluates it.',
  },
  {
    step: '03',
    title: 'Unlock early supplier access',
    description: 'Approved suppliers unlock the full supplier dashboard and gain early positioning before public launch.',
  },
];

const whyMaabar = [
  'Direct positioning around Saudi buyer demand',
  'Arabic–Chinese communication support',
  'Structured onboarding before public launch',
  'Selective supplier access instead of open-listing clutter',
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

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const ctaCopy = useMemo(() => (timeLeft.expired ? 'Apply as a supplier' : 'Apply for early supplier access'), [timeLeft.expired]);
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
            <button onClick={goToApply} className="supplier-topbar-cta">Apply now</button>
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
                  <h1 className="supplier-scene-title supplier-scene-title-hero">Secure early access to Saudi buyers before the wider launch</h1>
                  <p className="supplier-scene-description supplier-scene-description-large">
                    Maabar is a Saudi B2B platform connecting selected Chinese suppliers with Saudi merchants. This page is the supplier journey only — when you click apply, you move to the single shared supplier signup page.
                  </p>
                  <div className="supplier-scene-actions">
                    <button onClick={nextScene} className="supplier-primary-btn">Continue</button>
                    <button onClick={goToApply} className="supplier-secondary-btn">Apply now</button>
                  </div>
                </div>
                <div className="supplier-scene-sidecard">
                  <div className="supplier-sidecard-label">Currently open</div>
                  <div className="supplier-sidecard-title">Founding supplier intake is intentionally limited</div>
                  <div className="supplier-sidecard-text">We keep the first wave selective so approved suppliers enter with better positioning, cleaner presentation, and more focused review.</div>
                </div>
              </section>
            )}

            {activeScene === 1 && (
              <section key="scene-1" className="supplier-scene">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">Why join early</div>
                  <h2 className="supplier-scene-title">Position your company before broader supplier rollout begins</h2>
                  <p className="supplier-scene-description">
                    This is not about joining another crowded listing page. It is about entering earlier, being reviewed sooner, and showing up with stronger positioning before public supplier expansion.
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
                  <h2 className="supplier-scene-title">A short, clear path from journey to review</h2>
                  <p className="supplier-scene-description">
                    No extra detours: click apply, complete the shared supplier signup, confirm your email, then wait inside a controlled review state while the team checks your application.
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
                    Maabar is structured around Saudi market entry, buyer–supplier coordination, and a more curated supplier intake instead of generic marketplace noise.
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
                  <h2 className="supplier-scene-title">Apply before the public launch window closes</h2>
                  <p className="supplier-scene-description">
                    We are onboarding a limited number of Chinese suppliers before official launch. Strong applications move into review first, then approved accounts unlock early supplier access and dashboard functionality ahead of the broader rollout.
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
                <button onClick={goToApply} className="supplier-primary-btn">Apply now</button>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .supplier-access-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(255,255,255,0.05), transparent 28%),
            radial-gradient(circle at bottom right, rgba(255,255,255,0.04), transparent 24%),
            var(--bg-base);
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
          background: rgba(10,10,11,0.86);
          backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--border-subtle);
        }

        .supplier-access-topbar-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          min-height: 74px;
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
          transition: transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, background 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
          -webkit-tap-highlight-color: transparent;
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
          box-shadow: 0 14px 30px rgba(255,255,255,0.08);
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
          padding: 36px 0 40px;
        }

        .supplier-journey-progress-wrap {
          margin-bottom: 22px;
        }

        .supplier-journey-progress-bar {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.06);
          overflow: hidden;
          margin-bottom: 12px;
        }

        .supplier-journey-progress-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, rgba(255,255,255,0.8), var(--text-primary));
          transition: width 320ms cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 0 18px rgba(255,255,255,0.16);
        }

        .supplier-journey-progress-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .supplier-journey-stage {
          position: relative;
          overflow: hidden;
          min-height: 68vh;
          border-radius: 34px;
          border: 1px solid var(--border-subtle);
          background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01));
          box-shadow: 0 34px 90px rgba(0,0,0,0.22);
        }

        .supplier-journey-stage::before,
        .supplier-journey-stage::after {
          content: '';
          position: absolute;
          pointer-events: none;
          border-radius: 50%;
          filter: blur(20px);
          opacity: 0.6;
        }

        .supplier-journey-stage::before {
          inset: auto auto -120px -80px;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, rgba(255,255,255,0.09), transparent 68%);
          animation: supplierAmbientFloat 14s ease-in-out infinite;
        }

        .supplier-journey-stage::after {
          inset: -70px -50px auto auto;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(255,255,255,0.08), transparent 66%);
          animation: supplierAmbientFloat 18s ease-in-out infinite reverse;
        }

        @keyframes supplierAmbientFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(12px, -10px, 0) scale(1.05);
          }
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
          min-height: 68vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 30px;
          padding: 56px;
          animation: supplierSceneEnter 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .supplier-scene-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
          align-items: center;
          gap: 28px;
        }

        .supplier-scene-content {
          max-width: 780px;
        }

        .supplier-scene-eyebrow {
          color: var(--text-tertiary);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.16em;
          margin-bottom: 14px;
        }

        .supplier-scene-title {
          font-size: clamp(2.2rem, 3.4vw, 3.45rem);
          line-height: 0.98;
          letter-spacing: -0.055em;
          margin: 0 0 18px;
        }

        .supplier-scene-title-hero {
          max-width: 820px;
          font-size: clamp(2.65rem, 4.6vw, 4.35rem);
        }

        .supplier-scene-description {
          color: var(--text-secondary);
          font-size: 18px;
          line-height: 1.82;
          margin: 0;
          max-width: 760px;
        }

        .supplier-scene-description-large {
          font-size: 18px;
        }

        .supplier-scene-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .supplier-scene-sidecard {
          padding: 28px;
          border-radius: 26px;
          background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.03));
          border: 1px solid var(--border-muted);
          color: var(--text-primary);
          box-shadow: 0 18px 38px rgba(0,0,0,0.18);
          animation: supplierAmbientFloat 12s ease-in-out infinite;
        }

        .supplier-sidecard-label {
          color: var(--text-tertiary);
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 12px;
        }

        .supplier-sidecard-title {
          font-size: 26px;
          line-height: 1.08;
          margin-bottom: 12px;
        }

        .supplier-sidecard-text {
          color: var(--text-secondary);
          line-height: 1.8;
          font-size: 15px;
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
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease, box-shadow 220ms ease;
        }

        .supplier-feature-card:hover,
        .supplier-step-card:hover {
          transform: translateY(-5px);
          border-color: var(--border-default);
          box-shadow: 0 16px 36px rgba(0,0,0,0.18);
        }

        .supplier-feature-card h3,
        .supplier-step-card h3 {
          margin: 0 0 12px;
          font-size: 21px;
          line-height: 1.18;
        }

        .supplier-feature-card p,
        .supplier-step-card p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.8;
          font-size: 15px;
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
          gap: 10px;
          max-width: 820px;
        }

        .supplier-bullet-row {
          display: flex;
          gap: 14px;
          align-items: flex-start;
          padding: 20px 0;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-primary);
          font-size: 19px;
          line-height: 1.6;
        }

        .supplier-bullet-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: var(--text-primary);
          opacity: 0.72;
          margin-top: 10px;
          flex: 0 0 auto;
        }

        .supplier-scene-final {
          text-align: center;
          align-items: center;
        }

        .supplier-scene-final .supplier-scene-content {
          max-width: 780px;
        }

        .supplier-countdown-row {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 14px;
        }

        .supplier-count-unit {
          min-width: 104px;
          padding: 20px 16px;
          border-radius: 22px;
          background: var(--bg-muted);
          border: 1px solid var(--border-muted);
          text-align: center;
          box-shadow: 0 10px 24px rgba(0,0,0,0.16);
        }

        .supplier-count-value {
          font-size: 32px;
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

        .supplier-scene-dot:hover {
          transform: scale(1.08);
        }

        .supplier-scene-dot.active {
          width: 34px;
          background: var(--text-primary);
          box-shadow: 0 0 14px rgba(255,255,255,0.18);
        }

        .supplier-nav-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        @media (max-width: 959px) {
          .supplier-access-shell {
            padding-left: 16px;
            padding-right: 16px;
          }

          .supplier-access-main {
            padding-top: 18px;
            padding-bottom: 28px;
            align-items: flex-start;
          }

          .supplier-journey-stage,
          .supplier-scene {
            min-height: auto;
          }

          .supplier-scene {
            padding: 30px 22px;
            gap: 24px;
          }

          .supplier-scene-hero {
            grid-template-columns: 1fr;
            gap: 18px;
          }

          .supplier-scene-title {
            font-size: clamp(2rem, 7.6vw, 2.7rem);
          }

          .supplier-scene-title-hero {
            font-size: clamp(2.2rem, 9vw, 3.2rem);
          }

          .supplier-scene-description,
          .supplier-scene-description-large {
            font-size: 16px;
            line-height: 1.75;
          }

          .supplier-feature-card h3,
          .supplier-step-card h3 {
            font-size: 19px;
          }

          .supplier-bullet-row {
            font-size: 16px;
            padding: 16px 0;
          }

          .supplier-topbar-actions {
            display: none;
          }

          .supplier-journey-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 14px;
          }

          .supplier-nav-actions {
            width: 100%;
          }

          .supplier-nav-actions .supplier-primary-btn,
          .supplier-nav-actions .supplier-secondary-btn,
          .supplier-scene-actions .supplier-primary-btn,
          .supplier-scene-actions .supplier-secondary-btn {
            flex: 1 1 100%;
            width: 100%;
          }

          .supplier-countdown-row {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            width: 100%;
          }

          .supplier-count-unit {
            min-width: 0;
          }
        }

        @media (max-width: 640px) {
          .supplier-access-topbar-inner {
            min-height: 68px;
          }

          .supplier-journey-stage {
            border-radius: 28px;
          }

          .supplier-scene {
            padding: 26px 18px;
          }

          .supplier-card-grid,
          .supplier-steps-grid {
            grid-template-columns: 1fr;
          }

          .supplier-countdown-row {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
          }

          .supplier-count-value {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  );
}
