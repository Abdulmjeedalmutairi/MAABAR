import React, { useState } from 'react';

export default function AdminConfirmDialog({ isOpen, title, description, confirmWord, onConfirm, onCancel, isAr, danger }) {
  const [typed, setTyped] = useState('');
  if (!isOpen) return null;

  const needsTyping = !!confirmWord;
  const canSubmit = !needsTyping || typed === confirmWord;
  const fontBody = isAr ? 'var(--font-ar)' : 'var(--font-sans)';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(26,24,20,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onCancel}>
      <div style={{
        background: 'var(--surface-raised)', borderRadius: 'var(--radius-card)', padding: '28px 24px', maxWidth: 420, width: '100%',
        border: '1px solid var(--border-strong)',
        direction: isAr ? 'rtl' : 'ltr',
      }} onClick={e => e.stopPropagation()}>
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: danger ? 'var(--red)' : 'var(--ink)', fontFamily: fontBody }}>
          {title}
        </p>
        {description && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--text-secondary)', fontFamily: fontBody, lineHeight: 1.6 }}>
            {description}
          </p>
        )}
        {needsTyping && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-secondary)', fontFamily: fontBody }}>
              {isAr ? `اكتب "${confirmWord}" للتأكيد` : `Type "${confirmWord}" to confirm`}
            </p>
            <input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder={confirmWord}
              dir="ltr"
              autoFocus
              style={{
                width: '100%', boxSizing: 'border-box', padding: '9px 12px',
                border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-control)',
                fontSize: 13, fontFamily: "'Courier New', monospace", outline: 'none',
                background: 'var(--bg-page)',
              }}
              onKeyDown={e => { if (e.key === 'Enter' && canSubmit) { onConfirm(); setTyped(''); } }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
          <button
            onClick={() => { setTyped(''); onCancel(); }}
            style={{ minHeight: 38, padding: '0 16px', border: '1px solid var(--border)', borderRadius: 'var(--radius-control)', background: 'transparent', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: fontBody }}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={() => { setTyped(''); onConfirm(); }}
            disabled={!canSubmit}
            style={{
              minHeight: 38, padding: '0 20px', border: 'none', borderRadius: 'var(--radius-control)',
              background: canSubmit ? (danger ? 'var(--red)' : 'var(--ink)') : 'var(--bg-hover)',
              color: canSubmit ? 'var(--on-dark)' : 'var(--text-disabled)',
              fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: fontBody,
              transition: 'all 0.12s',
            }}
          >
            {isAr ? 'تأكيد' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
