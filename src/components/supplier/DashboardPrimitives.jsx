import React from 'react';

/* ─── Skeleton ───────────────────────────── */
export const SkeletonCard = () => (
  <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: '40%', height: 14, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ width: '25%', height: 10, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div style={{ width: 72, height: 32, background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
    </div>
  </div>
);

/* ─── Stat Card ──────────────────────────── */
export function StatCard({ label, value, onClick, highlight }) {
  return (
    <div onClick={onClick} style={{
      background: highlight ? 'var(--bg-raised)' : 'var(--bg-subtle)',
      border: `1px solid ${highlight ? 'var(--border-muted)' : 'var(--border-subtle)'}`,
      padding: '24px 28px', cursor: 'pointer', transition: 'all 0.2s',
      borderRadius: 'var(--radius-lg)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? 'var(--bg-raised)' : 'var(--bg-subtle)'}>
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 44, fontWeight: 300, color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1, letterSpacing: -1.5, fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>{value}</p>
    </div>
  );
}

/* ─── Quick Action ───────────────────────── */
export function QuickAction({ title, sub, onClick, primary, isAr }) {
  return (
    <div onClick={onClick} style={{
      padding: '24px',
      background: primary ? 'var(--bg-raised)' : 'var(--bg-subtle)',
      border: `1px solid ${primary ? 'var(--border-muted)' : 'var(--border-subtle)'}`,
      cursor: 'pointer', transition: 'all 0.2s', borderRadius: 'var(--radius-lg)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = primary ? 'var(--bg-raised)' : 'var(--bg-subtle)'}>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

/* ─── Back Button ────────────────────────── */
export function BackBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', color: 'var(--text-disabled)',
      fontSize: 11, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase',
      fontFamily: 'var(--font-sans)', padding: 0, marginBottom: 32, transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
      {label}
    </button>
  );
}

export function SaveFeedbackCard({ feedback, isAr = false }) {
  if (!feedback?.title) return null;

  const tones = {
    success: { border: 'rgba(45,122,79,0.22)', background: 'rgba(45,122,79,0.08)', title: 'var(--green)', body: 'var(--green)', meta: 'var(--green)' },
    warning: { border: 'rgba(160,136,80,0.22)', background: 'rgba(160,136,80,0.08)', title: 'var(--warn)', body: 'var(--text-secondary)', meta: 'var(--warn)' },
    error: { border: 'rgba(224,92,92,0.22)', background: 'rgba(224,92,92,0.08)', title: 'var(--red)', body: 'var(--red)', meta: 'var(--red)' },
    neutral: { border: 'var(--border)', background: 'var(--bg-subtle)', title: 'var(--text-primary)', body: 'var(--text-secondary)', meta: 'var(--text-disabled)' },
  };
  const palette = tones[feedback.tone] || tones.neutral;

  return (
    <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: `1px solid ${palette.border}`, background: palette.background }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: palette.title, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{feedback.title}</p>
          {feedback.body && (
            <p style={{ margin: '6px 0 0', fontSize: 12, lineHeight: 1.8, color: palette.body, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{feedback.body}</p>
          )}
        </div>
        {feedback.meta && (
          <span style={{ alignSelf: 'flex-start', padding: '5px 10px', borderRadius: 'var(--radius-chip)', border: '1px solid var(--border)', background: 'var(--bg-subtle)', fontSize: 11, color: palette.meta, whiteSpace: 'nowrap' }}>
            {feedback.meta}
          </span>
        )}
      </div>
    </div>
  );
}

export function SupplierJourneyStepper({ steps, isAr, lang }) {
  const stateLabel = (state) => {
    if (state === 'completed') return isAr ? 'مكتمل' : lang === 'zh' ? '已完成' : 'Completed';
    if (state === 'current') return isAr ? 'الحالي' : lang === 'zh' ? '当前' : 'Current';
    if (state === 'under_review') return isAr ? 'تحت المراجعة' : lang === 'zh' ? '审核中' : 'Under Review';
    if (state === 'verified') return isAr ? 'موثّق' : lang === 'zh' ? '已验证' : 'Verified';
    return isAr ? 'قادم' : lang === 'zh' ? '下一步' : 'Next';
  };

  const stateStyles = {
    completed: { border: '1px solid rgba(45,122,79,0.22)', background: 'rgba(45,122,79,0.08)', color: 'var(--green)' },
    current: { border: '1px solid var(--border-strong)', background: 'var(--bg-hero)', color: 'var(--text-primary)' },
    under_review: { border: '1px solid rgba(160,136,80,0.22)', background: 'rgba(160,136,80,0.09)', color: 'var(--warn)' },
    verified: { border: '1px solid rgba(45,122,79,0.26)', background: 'rgba(45,122,79,0.12)', color: 'var(--green)' },
    upcoming: { border: '1px solid var(--border-subtle)', background: 'var(--bg-base)', color: 'var(--text-disabled)' },
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
      {steps.map((step, index) => {
        const style = stateStyles[step.state] || stateStyles.upcoming;
        return (
          <div key={step.key} style={{ padding: '18px 18px 16px', borderRadius: 'var(--radius-lg)', ...style }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', opacity: 0.9 }}>0{index + 1}</span>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.3 }}>{stateLabel(step.state)}</span>
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{step.label}</p>
          </div>
        );
      })}
    </div>
  );
}
