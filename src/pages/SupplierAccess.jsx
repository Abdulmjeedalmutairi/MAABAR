import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../components/BrandLogo';
import { getSupplierOnboardingState, getSupplierPrimaryRoute } from '../lib/supplierOnboarding';

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
    title: 'Complete the shared supplier signup',
    description: 'Use the single supplier signup page to submit your basic company details once.',
  },
  {
    step: '02',
    title: 'Confirm your email',
    description: 'After email confirmation, your account moves straight into the pending-review state.',
  },
  {
    step: '03',
    title: 'Wait for Maabar review',
    description: 'The team reviews your application and contacts you directly before unlocking full supplier access.',
  },
];

const whyMaabar = [
  'Direct positioning around Saudi buyer demand',
  'Arabic–Chinese communication support',
  'Structured onboarding before public launch',
  'Selective supplier access instead of open-listing clutter',
];

const sceneTitles = [
  'Founding supplier access',
  'Why join early',
  'How it works',
  'Why Maabar',
  'Apply before launch',
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

export default function SupplierAccess({ user, profile }) {
  usePageTitle('supplier-access', 'en');
  const nav = useNavigate();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());
  const [activeScene, setActiveScene] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, []);

  const supplierState = profile?.role === 'supplier' ? getSupplierOnboardingState(profile) : null;
  const supplierPrimaryRoute = supplierState ? getSupplierPrimaryRoute(profile) : '/login/supplier?mode=signup';
  const hasExistingSupplierAccount = Boolean(user && profile?.role === 'supplier');
  const ctaCopy = useMemo(() => {
    if (supplierState?.isApprovedStage) return 'Open supplier dashboard';
    if (supplierState?.isUnderReviewStage) return 'View application status';
    if (supplierState?.isApplicationStage) return 'Continue supplier application';
    return timeLeft.expired ? 'Apply as a supplier' : 'Apply for early supplier access';
  }, [supplierState, timeLeft.expired]);
  const totalScenes = 5;
  const sceneProgress = ((activeScene + 1) / totalScenes) * 100;

  const goToApply = () => nav(supplierPrimaryRoute);
  const goHome = () => nav('/');
  const startJourney = () => setActiveScene(1);
  const jumpToScene = (index) => setActiveScene(index);
  const goToNextScene = () => setActiveScene((prev) => Math.min(prev + 1, totalScenes - 1));
  const goToPreviousScene = () => setActiveScene((prev) => Math.max(prev - 1, 0));
  const isFirstScene = activeScene === 0;
  const isFinalScene = activeScene === totalScenes - 1;

  return (
    <div dir="ltr" lang="en" className={`supplier-access-page supplier-scene-${activeScene}`}>
      <div className="supplier-access-topbar">
        <div className="supplier-access-shell supplier-access-topbar-inner">
          <BrandLogo as="button" size="sm" align="flex-start" onClick={goHome} />

          <div className="supplier-topbar-actions">
            <button onClick={goToApply} className="supplier-topbar-cta">{hasExistingSupplierAccount ? ctaCopy : 'Apply now'}</button>
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
            <div className="supplier-stage-glow supplier-stage-glow-a" />
            <div className="supplier-stage-glow supplier-stage-glow-b" />

            {activeScene === 0 && (
              <section key="scene-0" className="supplier-scene supplier-scene-hero supplier-scene-enter">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">Founding supplier access</div>
                  <h1 className="supplier-scene-title supplier-scene-title-hero">Secure early access to Saudi buyers before the wider launch</h1>
                  <p className="supplier-scene-description supplier-scene-description-large">
                    Maabar is a Saudi B2B platform connecting selected Chinese suppliers with Saudi merchants. This page only explains the journey — when you apply, you move into the shared supplier signup.
                  </p>
                  <div className="supplier-scene-actions">
                    <button onClick={startJourney} className="supplier-primary-btn">Start Journey</button>
                    <button onClick={goToApply} className="supplier-secondary-btn">{hasExistingSupplierAccount ? ctaCopy : 'Apply now'}</button>
                  </div>
                </div>
                <div className="supplier-scene-sidecard supplier-lift-card">
                  <div className="supplier-sidecard-label">Currently open</div>
                  <div className="supplier-sidecard-title">Founding supplier intake stays intentionally limited</div>
                  <div className="supplier-sidecard-text">The first wave stays selective so approved suppliers enter with better positioning and a cleaner review path.</div>
                </div>
              </section>
            )}

            {activeScene === 1 && (
              <section key="scene-1" className="supplier-scene supplier-scene-enter">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">Why join early</div>
                  <h2 className="supplier-scene-title">Position your company before broader supplier rollout begins</h2>
                  <p className="supplier-scene-description">
                    This is not about joining another crowded listing page. It is about entering earlier, being reviewed sooner, and showing up with stronger positioning before public supplier expansion.
                  </p>
                </div>
                <div className="supplier-card-grid">
                  {earlyBenefits.map((item, index) => (
                    <div key={item.title} className="supplier-feature-card supplier-lift-card" style={{ animationDelay: `${index * 70}ms` }}>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeScene === 2 && (
              <section key="scene-2" className="supplier-scene supplier-scene-enter">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">How it works</div>
                  <h2 className="supplier-scene-title">A short, clear path from signup to review</h2>
                  <p className="supplier-scene-description">
                    No second registration and no duplicate forms: complete the lightweight signup once, confirm your email, then wait inside a controlled pending-review state while the team checks your application.
                  </p>
                </div>
                <div className="supplier-steps-grid">
                  {howItWorks.map((item, index) => (
                    <div key={item.step} className="supplier-step-card supplier-lift-card" style={{ animationDelay: `${index * 90}ms` }}>
                      <div className="supplier-step-number">{item.step}</div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeScene === 3 && (
              <section key="scene-3" className="supplier-scene supplier-scene-enter">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">Why Maabar</div>
                  <h2 className="supplier-scene-title">Built for Saudi buyer access, not open-listing clutter</h2>
                  <p className="supplier-scene-description">
                    Maabar is structured around Saudi market entry, buyer–supplier coordination, and a more curated supplier intake instead of generic marketplace noise.
                  </p>
                </div>
                <div className="supplier-bullets-wrap">
                  {whyMaabar.map((item, index) => (
                    <div key={item} className="supplier-bullet-row supplier-bullet-row-enter" style={{ animationDelay: `${index * 80}ms` }}>
                      <span className="supplier-bullet-dot" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeScene === 4 && (
              <section key="scene-4" className="supplier-scene supplier-scene-final supplier-scene-enter">
                <div className="supplier-scene-content">
                  <div className="supplier-scene-eyebrow">Limited access</div>
                  <h2 className="supplier-scene-title">Apply before the public launch window closes</h2>
                  <p className="supplier-scene-description">
                    We are onboarding a limited number of Chinese suppliers before official launch. Strong applications move into review first, then approved accounts unlock early supplier access and full dashboard functionality ahead of the broader rollout.
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
            <div className="supplier-scene-dots" aria-label="Supplier journey steps">
              {Array.from({ length: totalScenes }).map((_, index) => (
                <button
                  key={`scene-dot-${index}`}
                  onClick={() => jumpToScene(index)}
                  className={`supplier-scene-dot${index === activeScene ? ' active' : ''}`}
                  aria-label={`Go to scene ${index + 1}`}
                />
              ))}
            </div>
            <p className="supplier-journey-footer-note">Use the dots to explore the journey.</p>

            <div className="supplier-mobile-journey-controls">
              <div className="supplier-mobile-journey-summary">
                <span className="supplier-mobile-journey-step">Step {activeScene + 1} of {totalScenes}</span>
                <strong>{sceneTitles[activeScene]}</strong>
              </div>
              <div className="supplier-mobile-journey-buttons">
                {!isFirstScene && (
                  <button onClick={goToPreviousScene} className="supplier-secondary-btn supplier-mobile-nav-btn">
                    Back
                  </button>
                )}
                <button
                  onClick={isFinalScene ? goToApply : (isFirstScene ? startJourney : goToNextScene)}
                  className="supplier-primary-btn supplier-mobile-nav-btn supplier-mobile-nav-btn-primary"
                >
                  {isFinalScene ? ctaCopy : (isFirstScene ? 'Start journey' : 'Continue')}
                </button>
              </div>
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
          background: rgba(10,10,11,0.84);
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

        .supplier-topbar-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .supplier-topbar-cta,
        .supplier-primary-btn,
        .supplier-secondary-btn {
          border-radius: 14px;
          padding: 13px 18px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease, background 220ms ease, border-color 220ms ease, box-shadow 260ms ease;
          -webkit-tap-highlight-color: transparent;
        }

        .supplier-topbar-cta:hover,
        .supplier-primary-btn:hover,
        .supplier-secondary-btn:hover {
          transform: translateY(-1px);
        }

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
          box-shadow: 0 16px 34px rgba(255,255,255,0.08);
        }

        .supplier-access-main {
          min-height: calc(100vh - 72px);
          display: flex;
          align-items: center;
          padding: 30px 0 34px;
        }

        .supplier-journey-progress-wrap {
          margin-bottom: 18px;
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
          background: linear-gradient(90deg, rgba(255,255,255,0.72), var(--text-primary));
          transition: width 360ms cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: 0 0 18px rgba(255,255,255,0.16);
        }

        .supplier-journey-progress-meta {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
        }

        .supplier-journey-stage {
          position: relative;
          overflow: hidden;
          min-height: 64vh;
          border-radius: 30px;
          border: 1px solid var(--border-subtle);
          background: linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015));
          box-shadow: 0 34px 90px rgba(0,0,0,0.22);
          isolation: isolate;
        }

        .supplier-stage-glow {
          position: absolute;
          border-radius: 999px;
          filter: blur(18px);
          opacity: 0.55;
          pointer-events: none;
          z-index: 0;
          animation: supplierAmbientFloat 14s ease-in-out infinite;
        }

        .supplier-stage-glow-a {
          inset: auto auto -110px -60px;
          width: 220px;
          height: 220px;
          background: radial-gradient(circle, rgba(255,255,255,0.1), transparent 70%);
        }

        .supplier-stage-glow-b {
          inset: -50px -45px auto auto;
          width: 210px;
          height: 210px;
          background: radial-gradient(circle, rgba(255,255,255,0.08), transparent 68%);
          animation-direction: reverse;
          animation-duration: 18s;
        }

        @keyframes supplierAmbientFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(12px, -12px, 0) scale(1.05);
          }
        }

        @keyframes supplierSceneEnter {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.985);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes supplierCardEnter {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .supplier-scene {
          position: relative;
          z-index: 1;
          min-height: 64vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 24px;
          padding: 46px;
        }

        .supplier-scene-enter {
          animation: supplierSceneEnter 440ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .supplier-scene-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.14fr) minmax(260px, 0.86fr);
          align-items: center;
          gap: 24px;
        }

        .supplier-scene-content {
          max-width: 760px;
        }

        .supplier-scene-eyebrow {
          color: var(--text-tertiary);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.17em;
          margin-bottom: 12px;
        }

        .supplier-scene-title {
          font-size: clamp(2rem, 3vw, 3.1rem);
          line-height: 1.02;
          letter-spacing: -0.05em;
          margin: 0 0 14px;
        }

        .supplier-scene-title-hero {
          max-width: 760px;
          font-size: clamp(2.25rem, 4.1vw, 3.85rem);
        }

        .supplier-scene-description {
          color: var(--text-secondary);
          font-size: 16px;
          line-height: 1.75;
          margin: 0;
          max-width: 720px;
        }

        .supplier-scene-description-large {
          font-size: 17px;
        }

        .supplier-scene-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 22px;
        }

        .supplier-lift-card {
          animation: supplierCardEnter 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .supplier-scene-sidecard {
          padding: 24px;
          border-radius: 24px;
          background: linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.03));
          border: 1px solid var(--border-muted);
          color: var(--text-primary);
          box-shadow: 0 20px 42px rgba(0,0,0,0.18);
          animation: supplierAmbientFloat 12s ease-in-out infinite, supplierCardEnter 520ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .supplier-sidecard-label {
          color: var(--text-tertiary);
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.14em;
          margin-bottom: 10px;
        }

        .supplier-sidecard-title {
          font-size: 23px;
          line-height: 1.1;
          margin-bottom: 12px;
        }

        .supplier-sidecard-text {
          color: var(--text-secondary);
          line-height: 1.75;
          font-size: 14px;
        }

        .supplier-card-grid,
        .supplier-steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
        }

        .supplier-feature-card,
        .supplier-step-card {
          padding: 22px;
          border-radius: 22px;
          background: var(--bg-muted);
          border: 1px solid var(--border-subtle);
          transition: transform 240ms cubic-bezier(0.22, 1, 0.36, 1), border-color 220ms ease, box-shadow 220ms ease;
        }

        .supplier-feature-card:hover,
        .supplier-step-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-default);
          box-shadow: 0 16px 36px rgba(0,0,0,0.18);
        }

        .supplier-feature-card h3,
        .supplier-step-card h3 {
          margin: 0 0 10px;
          font-size: 19px;
          line-height: 1.22;
        }

        .supplier-feature-card p,
        .supplier-step-card p {
          margin: 0;
          color: var(--text-secondary);
          line-height: 1.72;
          font-size: 14px;
        }

        .supplier-step-number {
          color: var(--text-tertiary);
          font-size: 13px;
          letter-spacing: 0.12em;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .supplier-bullets-wrap {
          display: grid;
          gap: 8px;
          max-width: 760px;
        }

        .supplier-bullet-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 16px 0;
          border-bottom: 1px solid var(--border-subtle);
          color: var(--text-primary);
          font-size: 17px;
          line-height: 1.58;
        }

        .supplier-bullet-row-enter {
          animation: supplierCardEnter 460ms cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .supplier-bullet-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
          background: var(--text-primary);
          opacity: 0.72;
          margin-top: 9px;
          flex: 0 0 auto;
          box-shadow: 0 0 14px rgba(255,255,255,0.14);
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
          gap: 12px;
        }

        .supplier-count-unit {
          min-width: 98px;
          padding: 18px 14px;
          border-radius: 20px;
          background: var(--bg-muted);
          border: 1px solid var(--border-muted);
          text-align: center;
          box-shadow: 0 10px 24px rgba(0,0,0,0.16);
        }

        .supplier-count-value {
          font-size: 30px;
          line-height: 1;
          font-weight: 700;
        }

        .supplier-count-label {
          margin-top: 7px;
          font-size: 11px;
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
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 16px 4px 0;
        }

        .supplier-scene-dots {
          display: flex;
          gap: 8px;
          align-items: center;
          justify-content: center;
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

        .supplier-journey-footer-note {
          margin: 0;
          color: var(--text-tertiary);
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .supplier-mobile-journey-controls {
          display: none;
        }

        .supplier-mobile-journey-summary {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }

        .supplier-mobile-journey-summary strong {
          font-size: 14px;
          color: var(--text-primary);
          line-height: 1.35;
        }

        .supplier-mobile-journey-step {
          color: var(--text-tertiary);
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .supplier-mobile-journey-buttons {
          display: flex;
          gap: 10px;
          width: 100%;
        }

        .supplier-mobile-nav-btn {
          min-height: 48px;
        }

        .supplier-mobile-nav-btn-primary {
          flex: 1 1 auto;
        }

        @media (max-width: 959px) {
          .supplier-scene-0 .supplier-journey-footer {
            display: none;
          }

          .supplier-access-shell {
            padding-left: 16px;
            padding-right: 16px;
          }

          .supplier-access-main {
            padding-top: 18px;
            padding-bottom: 24px;
            align-items: flex-start;
          }

          .supplier-journey-stage,
          .supplier-scene {
            min-height: auto;
          }

          .supplier-scene {
            padding: 30px 22px;
            gap: 20px;
          }

          .supplier-scene-hero {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .supplier-scene-title {
            font-size: clamp(1.85rem, 6.9vw, 2.45rem);
          }

          .supplier-scene-title-hero {
            font-size: clamp(2rem, 8.2vw, 2.95rem);
          }

          .supplier-scene-description,
          .supplier-scene-description-large {
            font-size: 15px;
            line-height: 1.72;
          }

          .supplier-feature-card h3,
          .supplier-step-card h3 {
            font-size: 18px;
          }

          .supplier-bullet-row {
            font-size: 15px;
            padding: 14px 0;
          }

          .supplier-topbar-actions {
            display: none;
          }

          .supplier-mobile-journey-controls {
            position: sticky;
            bottom: calc(env(safe-area-inset-bottom, 0px) + 12px);
            display: flex;
            flex-direction: column;
            gap: 14px;
            width: 100%;
            margin-top: 8px;
            padding: 14px;
            border-radius: 22px;
            border: 1px solid var(--border-subtle);
            background: rgba(10,10,11,0.92);
            backdrop-filter: blur(18px);
            box-shadow: 0 18px 34px rgba(0,0,0,0.22);
          }

          .supplier-mobile-nav-btn {
            flex: 1 1 0;
          }

          .supplier-scene-actions .supplier-primary-btn,
          .supplier-scene-actions .supplier-secondary-btn {
            flex: 1 1 100%;
            width: 100%;
          }

          .supplier-scene-0 .supplier-scene-actions {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px;
            margin-top: 18px;
          }

          .supplier-scene-0 .supplier-scene-actions .supplier-primary-btn,
          .supplier-scene-0 .supplier-scene-actions .supplier-secondary-btn {
            flex: 1 1 auto;
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
            min-height: 60px;
          }

          .supplier-access-main {
            padding-top: 10px;
            padding-bottom: 16px;
          }

          .supplier-journey-progress-wrap {
            margin-bottom: 10px;
          }

          .supplier-journey-progress-bar {
            margin-bottom: 10px;
          }

          .supplier-journey-progress-meta {
            font-size: 10px;
          }

          .supplier-journey-stage {
            border-radius: 22px;
          }

          .supplier-scene {
            padding: 18px 14px;
            gap: 14px;
          }

          .supplier-scene-0 .supplier-scene {
            padding: 16px 14px 14px;
            gap: 12px;
          }

          .supplier-scene-0 .supplier-scene-hero {
            min-height: calc(100svh - 138px);
            align-content: start;
            gap: 12px;
          }

          .supplier-scene-0 .supplier-scene-content {
            max-width: none;
          }

          .supplier-scene-eyebrow {
            font-size: 10px;
            margin-bottom: 8px;
          }

          .supplier-scene-title {
            margin-bottom: 10px;
          }

          .supplier-scene-0 .supplier-scene-title-hero {
            font-size: clamp(1.72rem, 8vw, 2.24rem);
            max-width: 12ch;
          }

          .supplier-scene-0 .supplier-scene-description-large {
            font-size: 14px;
            line-height: 1.58;
            max-width: 35ch;
          }

          .supplier-card-grid,
          .supplier-steps-grid {
            grid-template-columns: 1fr;
          }

          .supplier-feature-card,
          .supplier-step-card,
          .supplier-scene-sidecard {
            padding: 18px;
            border-radius: 20px;
          }

          .supplier-scene-0 .supplier-scene-sidecard {
            padding: 14px;
            border-radius: 18px;
            display: grid;
            gap: 6px;
          }

          .supplier-sidecard-title {
            font-size: 20px;
          }

          .supplier-scene-0 .supplier-sidecard-label {
            margin-bottom: 4px;
            font-size: 10px;
          }

          .supplier-scene-0 .supplier-sidecard-title {
            margin-bottom: 0;
            font-size: 16px;
            line-height: 1.2;
          }

          .supplier-scene-0 .supplier-sidecard-text {
            font-size: 12px;
            line-height: 1.45;
          }

          .supplier-scene-0 .supplier-mobile-journey-controls {
            display: none;
          }

          .supplier-countdown-row {
            gap: 8px;
          }

          .supplier-count-unit {
            padding: 14px 10px;
            border-radius: 16px;
          }

          .supplier-count-value {
            font-size: 24px;
          }

          .supplier-primary-btn,
          .supplier-secondary-btn {
            min-height: 42px;
            padding: 11px 14px;
            font-size: 13px;
          }
        }
      `}</style>
    </div>
  );
}
