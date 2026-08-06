import React, { useState } from 'react';
import ConsoleShell from '../../components/admin2/ConsoleShell';
import { TEMPLATES, BODY } from '../../lib/inviteTemplates';

// Read-only reference of every invitation template, in both languages and both
// claim states, so the admin sees exactly what each option sends before using
// "Send invitation" on a supplier. Sample values stand in for the auto-filled vars.
const SAMPLE = (reg) => ({
  factory: 'Rainbow Furniture',
  reg,
  cta: reg ? 'https://maabar.io/dashboard' : 'https://maabar.io/claim/xxxxxxx',
  product: 'Wooden dining table',
  qty: '200',
});

export default function ConsoleTemplates({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const [msgLang, setMsgLang] = useState('en');
  const [toast, setToast] = useState('');
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 1600); };
  const copy = (txt) => { try { navigator.clipboard.writeText(txt); flash(isAr ? 'نُسخ' : 'Copied'); } catch { /* noop */ } };

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="quotations">
      <div className="ac-page" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', maxWidth: 900 }}>
        <div className="ac-page-head">
          <div>
            <h1 className="ac-h1">{isAr ? 'قوالب الرسائل' : 'Message templates'}</h1>
            <p className="ac-sub">{isAr ? 'ما الذي تُرسله لكل مصنع — تُرسَل عبر واتساب/إيميل/نسخ من زر «إرسال دعوة».' : 'What each option sends — delivered via WhatsApp / Email / Copy from the “Send invitation” button.'}</p>
          </div>
          <div className="ac-langs" style={{ display: 'flex', gap: 4 }}>
            {['en', 'zh'].map((l) => <button key={l} className={`ac-chip${msgLang === l ? ' on' : ''}`} onClick={() => setMsgLang(l)}>{l === 'en' ? 'EN' : '中文'}</button>)}
          </div>
        </div>

        {TEMPLATES.map((t) => (
          <div className="ac-card" key={t.key}>
            <p className="ac-card-title" style={{ marginBottom: 12 }}>{isAr ? t.ar : t.en} · {t.en}</p>
            <div className="ac-grid2">
              {[false, true].map((reg) => {
                const txt = BODY[msgLang][t.key](SAMPLE(reg));
                return (
                  <div key={String(reg)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <span className={`ac-badge ${reg ? 'ok' : 'neutral'}`}>{reg ? (isAr ? 'مسجّل → لوحته' : 'Registered → dashboard') : (isAr ? 'غير مسجّل → مطالبة' : 'Not registered → claim')}</span>
                      <button className="ac-btn ac-btn-sm" onClick={() => copy(txt)}>{isAr ? 'نسخ' : 'Copy'}</button>
                    </div>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', direction: 'ltr', textAlign: 'left', fontFamily: 'inherit', fontSize: 12.5, lineHeight: 1.6, color: 'var(--ac-text)', background: 'var(--ac-sunk)', border: '1px solid var(--ac-line)', borderRadius: 10, padding: 12, margin: 0 }}>{txt}</pre>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {toast && <div className="ac-toast" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{toast}</div>}
    </ConsoleShell>
  );
}
