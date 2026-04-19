import React, { useState } from 'react';

const FONT_BODY = "'Tajawal', sans-serif";

export default function AdminConfirmDialog({ isOpen, title, description, confirmWord, onConfirm, onCancel, isAr, danger }) {
  const [typed, setTyped] = useState('');
  if (!isOpen) return null;

  const needsTyping = !!confirmWord;
  const canSubmit = !needsTyping || typed === confirmWord;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(26,24,20,0.55)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onCancel}>
      <div style={{
        background: '#fff', borderRadius: 12, padding: '28px 24px', maxWidth: 420, width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        direction: isAr ? 'rtl' : 'ltr',
      }} onClick={e => e.stopPropagation()}>
        <p style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 600, color: danger ? '#c0392b' : 'rgba(0,0,0,0.88)', fontFamily: FONT_BODY }}>
          {title}
        </p>
        {description && (
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'rgba(0,0,0,0.55)', fontFamily: FONT_BODY, lineHeight: 1.6 }}>
            {description}
          </p>
        )}
        {needsTyping && (
          <div style={{ marginBottom: 16 }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: 'rgba(0,0,0,0.50)', fontFamily: FONT_BODY }}>
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
                border: '1px solid rgba(0,0,0,0.12)', borderRadius: 7,
                fontSize: 13, fontFamily: "'Courier New', monospace", outline: 'none',
                background: 'rgba(0,0,0,0.02)',
              }}
              onKeyDown={e => { if (e.key === 'Enter' && canSubmit) { onConfirm(); setTyped(''); } }}
            />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
          <button
            onClick={() => { setTyped(''); onCancel(); }}
            style={{ minHeight: 38, padding: '0 16px', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 7, background: 'transparent', color: 'rgba(0,0,0,0.45)', fontSize: 13, cursor: 'pointer', fontFamily: FONT_BODY }}
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
          <button
            onClick={() => { setTyped(''); onConfirm(); }}
            disabled={!canSubmit}
            style={{
              minHeight: 38, padding: '0 20px', border: 'none', borderRadius: 7,
              background: canSubmit ? (danger ? '#c0392b' : '#1a1814') : 'rgba(0,0,0,0.08)',
              color: canSubmit ? '#fff' : 'rgba(0,0,0,0.25)',
              fontSize: 13, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed', fontFamily: FONT_BODY,
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
