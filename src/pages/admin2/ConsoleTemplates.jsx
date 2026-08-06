import React, { useState } from 'react';
import ConsoleShell from '../../components/admin2/ConsoleShell';
import { TEMPLATES, BODY, SUBJECT } from '../../lib/inviteTemplates';
import { sendFactoryEmail } from '../../lib/adminFactoryEmail';

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
  const flash = (m) => { setToast(m); setTimeout(() => setToast(''), 2000); };
  const copy = (txt) => { try { navigator.clipboard.writeText(txt); flash(isAr ? 'نُسخ' : 'Copied'); } catch { /* noop */ } };

  // ── Send a template to any email (preview / ad-hoc) ──────────────────────
  const [to, setTo] = useState(profile?.email || '');
  const [sendKey, setSendKey] = useState('new_message');
  const [sendReg, setSendReg] = useState(false);
  const [sending, setSending] = useState(false);
  const doSend = async () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to.trim())) { flash(isAr ? 'إيميل غير صالح' : 'Invalid email'); return; }
    const v = SAMPLE(sendReg);
    const paragraphs = BODY[msgLang][sendKey](v).split('\n\n').map((b) => b.trim())
      .filter((b) => b && b !== v.cta && b !== 'MAABAR' && !/^MAABAR\s*—/.test(b));
    const ctaText = msgLang === 'zh' ? (sendReg ? '打开后台' : '认领主页') : (sendReg ? 'Open your dashboard' : 'Claim your page');
    setSending(true);
    try {
      await sendFactoryEmail({ toOverride: to.trim(), lang: msgLang, headline: SUBJECT[msgLang][sendKey], paragraphs, ctaUrl: v.cta, ctaText });
      flash(isAr ? `أُرسل إلى ${to.trim()} ✅` : `Sent to ${to.trim()} ✅`);
    } catch (e) { flash((isAr ? 'تعذّر الإرسال: ' : 'Send failed: ') + (e.message || '')); }
    setSending(false);
  };

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

        <div className="ac-card" style={{ marginBottom: 18 }}>
          <p className="ac-card-title">{isAr ? 'إرسال قالب لأي إيميل (تجربة / يدوي)' : 'Send a template to any email (test / ad-hoc)'}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <input className="ac-input" style={{ flex: '1 1 220px' }} type="email" dir="ltr" value={to} onChange={(e) => setTo(e.target.value)} placeholder={isAr ? 'الإيميل المستلم' : 'Recipient email'} />
            <select className="ac-input" style={{ width: 'auto', minWidth: 150 }} value={sendKey} onChange={(e) => setSendKey(e.target.value)}>
              {TEMPLATES.map((t) => <option key={t.key} value={t.key}>{isAr ? t.ar : t.en}</option>)}
            </select>
            <button className={`ac-chip${!sendReg ? ' on' : ''}`} onClick={() => setSendReg(false)}>{isAr ? 'غير مسجّل' : 'Not registered'}</button>
            <button className={`ac-chip${sendReg ? ' on' : ''}`} onClick={() => setSendReg(true)}>{isAr ? 'مسجّل' : 'Registered'}</button>
            <button className="ac-btn ac-btn-primary" onClick={doSend} disabled={sending}>{sending ? (isAr ? 'جارٍ…' : 'Sending…') : (isAr ? 'إرسال من معبر' : 'Send from MAABAR')}</button>
          </div>
          <p style={{ fontSize: 11.5, color: 'var(--ac-faint)', margin: '8px 0 0' }}>
            {isAr ? 'يستخدم اللغة المختارة أعلاه وبيانات نموذجية (Rainbow Furniture). لإرسال مخصّص لمورّد، استخدم «إرسال دعوة» في صفحته.' : 'Uses the language above and sample data (Rainbow Furniture). For a personalised send, use "Send invitation" on the supplier.'}
          </p>
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
