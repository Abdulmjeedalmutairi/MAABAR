import React, { useEffect, useMemo, useState } from 'react';
import { fetchFactory } from '../../lib/catalogImport';
import { TEMPLATES, BODY, SUBJECT } from '../../lib/inviteTemplates';
import { sendFactoryEmail } from '../../lib/adminFactoryEmail';

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const digits = (v) => (v || '').replace(/[^\d]/g, '');

export default function InviteModal({ factoryId, request, isAr, onClose, flash }) {
  const [fac, setFac] = useState(null);
  const [tpl, setTpl] = useState(request ? 'quote' : 'new_message');
  // Factories are Chinese — default the outgoing message to 中文 (admin can switch to EN).
  const [msgLang, setMsgLang] = useState('zh');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { fetchFactory(factoryId).then(setFac).catch(() => setFac(null)); }, [factoryId]);

  const vars = useMemo(() => {
    const origin = window.location.origin;
    const reg = !!fac?.linked_supplier_id;
    const claimLink = fac?.claim_slug ? `${origin}/claim/${fac.claim_slug}` : `${origin}/factory/${factoryId}`;
    return {
      factory: nf(fac?.company_name_latin) || nf(fac?.company_name) || 'there',
      reg,
      cta: reg ? `${origin}/dashboard` : claimLink,   // registered → their dashboard; else the claim link
      claimLink,
      publicLink: `${origin}/factory/${factoryId}`,
      product: request ? (isAr ? (nf(request.title_ar) || nf(request.title_en)) : (nf(request.title_en) || nf(request.title_ar))) : '',
      qty: request?.quantity || '',
    };
  }, [fac, factoryId, request, isAr]);

  useEffect(() => { if (fac) setText(BODY[msgLang][tpl](vars)); }, [fac, tpl, msgLang, vars]);

  const subject = fac ? SUBJECT[msgLang][tpl] : '';
  const phone = digits(fac?.phone);
  const email = nf(fac?.email);

  const openWa = () => { if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank'); else flash?.(isAr ? 'لا رقم واتساب' : 'No WhatsApp number'); };
  const copy = () => { try { navigator.clipboard.writeText(text); flash?.(isAr ? 'نُسخت الرسالة' : 'Message copied'); } catch { /* noop */ } };

  // Send a MAABAR-branded email from the system. The edited `text` is split into
  // paragraphs; the CTA URL + brand signature become the button + footer, not body.
  const sendEmail = async () => {
    if (!email) { flash?.(isAr ? 'لا إيميل لهذا المورّد' : 'No email on file'); return; }
    const paragraphs = text.split('\n\n').map((b) => b.trim())
      .filter((b) => b && b !== vars.cta && b !== 'MAABAR' && !/^MAABAR\s*—/.test(b));
    const ctaText = msgLang === 'zh' ? (vars.reg ? '打开后台' : '认领主页') : (vars.reg ? 'Open your dashboard' : 'Claim your page');
    setSending(true);
    try {
      await sendFactoryEmail({ factoryId, lang: msgLang, headline: subject, paragraphs, ctaUrl: vars.cta, ctaText });
      flash?.(isAr ? 'أُرسل الإيميل من معبر ✅' : 'Sent from MAABAR ✅');
      onClose?.();
    } catch (e) { flash?.((isAr ? 'تعذّر الإرسال: ' : 'Send failed: ') + (e.message || '')); }
    setSending(false);
  };

  return (
    <div className="ac-modal-ov" onClick={onClose}>
      <div className="ac-modal" style={{ maxWidth: 560, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <p className="ac-modal-title" style={{ margin: 0 }}>{isAr ? 'إرسال دعوة' : 'Send invitation'}</p>
            <button className="ac-ghost-link" onClick={() => window.open('/admin2/templates', '_blank')}
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 11.5, color: 'var(--ac-info)', fontFamily: 'inherit' }}>
              {isAr ? 'عرض كل القوالب ↗' : 'View all templates ↗'}
            </button>
          </div>
          <div className="ac-langs" style={{ display: 'flex', gap: 4 }}>
            {['en', 'zh'].map((l) => <button key={l} className={`ac-chip${msgLang === l ? ' on' : ''}`} style={{ height: 28 }} onClick={() => setMsgLang(l)}>{l === 'en' ? 'EN' : '中文'}</button>)}
          </div>
        </div>

        <p className="ac-flabel" style={{ marginBottom: 6 }}>{isAr ? 'القالب' : 'Template'}</p>
        <div className="ac-chiprow" style={{ marginBottom: 14 }}>
          {TEMPLATES.map((t) => <button key={t.key} className={`ac-chip${tpl === t.key ? ' on' : ''}`} onClick={() => setTpl(t.key)}>{isAr ? t.ar : t.en}</button>)}
        </div>

        {!fac ? <div className="ac-skel" style={{ height: 140 }} /> : (
          <>
            <p style={{ fontSize: 11.5, color: 'var(--ac-faint)', margin: '0 0 8px' }}>
              {vars.reg
                ? (isAr ? '● مسجّل — الزر يوجّه للوحته' : '● Registered — CTA links to their dashboard')
                : (isAr ? '● غير مسجّل — الزر يوجّه لرابط المطالبة' : '● Not registered — CTA links to the claim page')}
            </p>
            <textarea className="ac-textarea" style={{ minHeight: 170, direction: 'ltr', textAlign: 'left' }} value={text} onChange={(e) => setText(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button className="ac-btn" onClick={copy}>{isAr ? 'نسخ' : 'Copy'}</button>
              <button className="ac-btn" onClick={openWa} disabled={!phone} style={{ opacity: phone ? 1 : 0.5 }}>WhatsApp</button>
              <button className="ac-btn ac-btn-primary" onClick={sendEmail} disabled={!email || sending} style={{ opacity: email ? 1 : 0.5 }}>
                {sending ? (isAr ? 'جارٍ الإرسال…' : 'Sending…') : (isAr ? 'إرسال إيميل من معبر' : 'Send email from MAABAR')}
              </button>
            </div>
            {!phone && !email && <p style={{ fontSize: 12, color: 'var(--ac-warn)', marginTop: 8 }}>{isAr ? 'لا يوجد هاتف أو إيميل لهذا المورّد — أضفه من تبويب الملف.' : 'No phone or email on file — add one in the Profile tab.'}</p>}
          </>
        )}
      </div>
    </div>
  );
}
