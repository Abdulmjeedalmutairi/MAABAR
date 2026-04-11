import React from 'react';

export const VF_C = {
  cream: '#FAF8F5', paper: '#F4F1EC', white: '#FFFFFF',
  ink: '#1A1814', ink60: '#6B6459', ink30: '#A09486',
  ink10: '#E8E3DC', ink05: '#F0EBE4',
  sage: '#3D6B4F', sageBg: 'rgba(61,107,79,0.07)', sageBr: 'rgba(61,107,79,0.22)',
  amber: '#8B6914', amberBg: 'rgba(139,105,20,0.08)', amberBr: 'rgba(139,105,20,0.25)',
};

export const VF_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

@keyframes vf-slideUp   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
@keyframes vf-fadeIn    { from{opacity:0} to{opacity:1} }
@keyframes vf-checkDraw { from{stroke-dashoffset:28} to{stroke-dashoffset:0} }
@keyframes vf-lineGrow  { from{transform:scaleX(0)} to{transform:scaleX(1)} }
@keyframes vf-pulse     { 0%,100%{opacity:1}50%{opacity:0.35} }
@keyframes vf-breathe   { 0%,100%{transform:scale(1)}50%{transform:scale(1.07)} }
@keyframes vf-ringPulse {
  0%  { box-shadow:0 0 0 0 rgba(61,107,79,0.3); }
  60% { box-shadow:0 0 0 18px rgba(61,107,79,0); }
  100%{ box-shadow:0 0 0 0 rgba(61,107,79,0); }
}

.vf-fu { animation: vf-slideUp 0.55s cubic-bezier(0.22,1,0.36,1) both; }
.vf-fi { animation: vf-fadeIn 0.45s ease both; }

.vf-field-wrap { position: relative; margin-bottom: 0; }
.vf-label {
  display: block; font-size: 12px; color: #A09486;
  font-family: 'Tajawal', sans-serif; font-weight: 400;
  margin-bottom: 7px; transition: color 0.2s;
}
.vf-field-wrap:focus-within .vf-label { color: #1A1814; }
.vf-input {
  width: 100%; background: none; border: none;
  border-bottom: 1px solid #E8E3DC; outline: none;
  font-size: 16px; color: #1A1814;
  font-family: 'Tajawal', sans-serif; font-weight: 400;
  padding: 8px 0 10px; transition: border-color 0.25s;
  border-radius: 0; line-height: 1.5;
}
.vf-input:focus { border-bottom-color: #1A1814; }
.vf-input::placeholder { color: #C8BFB0; font-weight: 300; }
.vf-underline {
  position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
  background: #1A1814; transform-origin: left; transform: scaleX(0);
  transition: transform 0.3s cubic-bezier(0.22,1,0.36,1); pointer-events: none;
}
.vf-field-wrap:focus-within .vf-underline { transform: scaleX(1); }
.vf-select {
  width: 100%; background: none; border: none;
  border-bottom: 1px solid #E8E3DC; outline: none;
  font-size: 16px; color: #1A1814;
  font-family: 'Tajawal', sans-serif; font-weight: 400;
  padding: 8px 0 10px; appearance: none; cursor: pointer;
  transition: border-color 0.25s; border-radius: 0;
}
.vf-select:focus { border-bottom-color: #1A1814; }

.vf-btn-ink {
  display: block; width: 100%; padding: 15px 28px;
  background: #1A1814; color: #FAF8F5; border: none; border-radius: 10px;
  font-size: 15px; font-family: 'Tajawal', sans-serif; font-weight: 500;
  cursor: pointer; transition: all 0.22s;
}
.vf-btn-ink:hover { background:#2D2A24; transform:translateY(-1px); box-shadow:0 6px 18px rgba(26,24,20,0.18); }
.vf-btn-ink:active { transform:translateY(0); }
.vf-btn-ink:disabled { opacity:0.6; cursor:not-allowed; transform:none; box-shadow:none; }

.vf-btn-ghost {
  display: block; width: 100%; padding: 13px;
  background: none; color: #6B6459; border: 1px solid #E8E3DC; border-radius: 10px;
  font-size: 14px; font-family: 'Tajawal', sans-serif;
  cursor: pointer; transition: all 0.2s;
}
.vf-btn-ghost:hover { border-color:#1A1814; color:#1A1814; }

.vf-dot-row { display: flex; align-items: center; margin-bottom: 28px; }
.vf-dot-seg { height: 1px; flex: 1; background: #E8E3DC; transition: background 0.4s; }
.vf-dot-seg.on { background: #1A1814; }
.vf-dot-node { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; transition: all 0.35s; }
.vf-dot-node.done { background: #3D6B4F; }
.vf-dot-node.cur  { background: #1A1814; box-shadow: 0 0 0 4px rgba(26,24,20,0.1); }
.vf-dot-node.next { background: #E8E3DC; }

.vf-sep { display:flex; align-items:center; gap:14px; margin:28px 0 22px; }
.vf-sep::before,.vf-sep::after { content:''; flex:1; height:1px; background:#E8E3DC; }

.vf-review-row {
  display:flex; justify-content:space-between; align-items:baseline;
  padding:12px 20px; border-bottom:1px solid #F0EBE4; gap:16px;
}
.vf-review-row:last-child { border-bottom:none; }

.vf-info-row {
  display:flex; justify-content:space-between; align-items:baseline;
  padding:12px 20px; border-bottom:1px solid #F0EBE4; gap:16px;
}
.vf-info-row:last-child { border-bottom:none; }

.vf-next-item {
  display:flex; gap:14px; padding:16px 20px;
  border-bottom:1px solid #F0EBE4; align-items:flex-start;
}
.vf-next-item:last-child { border-bottom:none; }

.vf-step-badge { padding:13px 10px; border-radius:10px; text-align:center; }
`;

export function VfChk({ size = 14, color = '#3D6B4F' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <polyline points="20 6 9 17 4 12" stroke={color} strokeWidth="2.2"
        strokeLinecap="round" strokeLinejoin="round" strokeDasharray="28"
        style={{ animation: 'vf-checkDraw 0.4s ease 0.1s both' }} />
    </svg>
  );
}

export function VfReviewDot() {
  return (
    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8B6914', animation: 'vf-breathe 2.4s ease infinite', flexShrink: 0 }} />
  );
}

export function VfField({ label, delay = 0, children }) {
  return (
    <div className="vf-fu" style={{ animationDelay: `${delay}s` }}>
      <div className="vf-field-wrap">
        <label className="vf-label">{label}</label>
        {children}
        <div className="vf-underline" />
      </div>
    </div>
  );
}

export function VfSep({ label }) {
  return (
    <div className="vf-sep">
      <span style={{ fontSize: 12, color: '#A09486', fontFamily: "'Tajawal', sans-serif", whiteSpace: 'nowrap', fontWeight: 400 }}>
        {label}
      </span>
    </div>
  );
}

export function VfG2({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
      {children}
    </div>
  );
}

export function VfDotStepper({ step }) {
  return (
    <div className="vf-dot-row">
      {[1, 2, 3].map((n, i, arr) => (
        <React.Fragment key={n}>
          <div className={`vf-dot-node ${n < step ? 'done' : n === step ? 'cur' : 'next'}`} />
          {i < arr.length - 1 && <div className={`vf-dot-seg ${n < step ? 'on' : ''}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

export function VfProgressBar({ step, status }) {
  const pct = status === 'review' ? 85 : status === 'success' ? 100 : (step / 3) * 100;
  const color = status === 'review' ? '#8B6914' : status === 'success' ? '#3D6B4F' : '#1A1814';
  return (
    <div style={{ height: 1.5, background: '#E8E3DC', marginBottom: 0 }}>
      <div style={{
        height: '100%', background: color,
        width: `${pct}%`, transformOrigin: 'left',
        animation: 'vf-lineGrow 0.7s cubic-bezier(0.22,1,0.36,1) both',
      }} />
    </div>
  );
}

export function VfStepBadges({ currentState, isAr, lang }) {
  const steps = [
    { n: '01', ar: 'الحساب',   en: 'Account',      zh: '账户', state: 'done' },
    { n: '02', ar: 'الملف',    en: 'Profile',      zh: '资料', state: 'done' },
    { n: '03', ar: 'التحقق',   en: 'Verification', zh: '认证', state: 'done' },
    { n: '04', ar: 'المراجعة', en: 'Review',        zh: '审核', state: currentState === 'review' ? 'review' : 'done' },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6 }}>
      {steps.map(({ n, ar, en, zh, state }) => {
        const label = isAr ? ar : lang === 'zh' ? zh : en;
        const isDone   = state === 'done';
        const isReview = state === 'review';
        return (
          <div key={n} className="vf-step-badge" style={{
            border: `1px solid ${isDone ? 'rgba(61,107,79,0.22)' : isReview ? 'rgba(139,105,20,0.25)' : '#E8E3DC'}`,
            background: isDone ? 'rgba(61,107,79,0.07)' : isReview ? 'rgba(139,105,20,0.08)' : 'transparent',
          }}>
            <p style={{ fontSize: 9, color: isDone ? '#3D6B4F' : isReview ? '#8B6914' : '#A09486', marginBottom: 5, fontFamily: 'Tajawal, sans-serif' }}>{n}</p>
            <p style={{ fontSize: 11, color: isDone ? '#3D6B4F' : isReview ? '#8B6914' : '#A09486', fontFamily: 'Tajawal, sans-serif', fontWeight: 400 }}>{label}</p>
            {isDone   && <div style={{ marginTop: 5, display: 'flex', justifyContent: 'center' }}><VfChk size={10} /></div>}
            {isReview && <div style={{ marginTop: 5, display: 'flex', justifyContent: 'center' }}><VfReviewDot /></div>}
          </div>
        );
      })}
    </div>
  );
}
