import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFactoryRequest } from '../../lib/createFactoryRequest';

const T = {
  ar: { title: 'استفسار / طلب مخصص', subject: 'وش تدور عليه؟ *', subjectPh: 'اكتب المنتج أو الخدمة أو سؤالك للمصنع', qty: 'الكمية التقريبية (اختياري)', notes: 'ملاحظات (اختياري)', submit: 'إرسال', sending: 'جارٍ الإرسال...', cancel: 'إلغاء', errSubject: 'يرجى كتابة ما تبحث عنه.', errGeneric: 'حدث خطأ، حاول مرة أخرى.', doneT: 'تم إرسال استفسارك إلى المصنع', doneB: 'سيتم إشعارك عند رد المصنع عبر مَعبر.', close: 'إغلاق', note: 'المصنع يرد بالتفاصيل والسعر — لا حاجة لإدخال ميزانية.', signin: 'سيُطلب منك تسجيل الدخول عند الإرسال.' },
  en: { title: 'Inquiry / custom request', subject: 'What are you looking for? *', subjectPh: 'Describe the product, service, or your question to the factory', qty: 'Approx. quantity (optional)', notes: 'Notes (optional)', submit: 'Send', sending: 'Sending...', cancel: 'Cancel', errSubject: 'Please describe what you are looking for.', errGeneric: 'Something went wrong, please try again.', doneT: 'Your inquiry has been sent to the factory', doneB: "You'll be notified when the factory responds through Maabar.", close: 'Close', note: 'The factory responds with details and pricing — no budget needed.', signin: 'You will be asked to sign in when submitting.' },
  zh: { title: '咨询 / 定制需求', subject: '您在找什么？*', subjectPh: '描述产品、服务或您对工厂的问题', qty: '大约数量（可选）', notes: '备注（可选）', submit: '发送', sending: '发送中...', cancel: '取消', errSubject: '请描述您的需求。', errGeneric: '出错了，请重试。', doneT: '您的咨询已发送至工厂', doneB: '工厂通过 Maabar 回复后会通知您。', close: '关闭', note: '工厂会回复详情和价格——无需填写预算。', signin: '提交时会要求您登录。' },
};

// General factory inquiry / custom request on the factory page. Same pipeline as
// ProductRequestModal but NOT bound to a catalog product (factory_product_id
// stays null): a MANAGED request → request_factory_invites → buyer-stripped brief
// emailed to the factory server-side → offer → Concierge. NO wizard, NO nav away.
// Placeholder styling — combined design pass restyles this with ProductRequestModal.
export default function FactoryInquiryModal({ lang = 'ar', user, factory, displayCurrency, onClose }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const c = T[lang] || T.ar;
  const [subject, setSubject] = useState('');
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!subject.trim()) { setError(c.errSubject); return; }
    if (!user) { nav('/login/buyer'); return; }
    setSubmitting(true);
    setError('');
    const { request, error: e } = await createFactoryRequest({ user, factory, product: null, subject, quantity: qty, notes, lang, viewerCurrency: displayCurrency });
    setSubmitting(false);
    if (e || !request) { setError(c.errGeneric); return; }
    setDone(true);
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}
        style={{ width: '100%', maxWidth: 440, background: 'var(--bg-raised, #fff)', border: '1px solid var(--border-muted)', borderRadius: 14, padding: 24, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        {done ? (
          <>
            <h3 style={{ fontSize: 17, color: 'var(--text-primary)', margin: '0 0 8px' }}>{c.doneT}</h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: '0 0 20px' }}>{c.doneB}</p>
            <button className="btn-dark-sm" onClick={onClose} style={{ minHeight: 42, padding: '10px 24px' }}>{c.close}</button>
          </>
        ) : (
          <>
            <h3 style={{ fontSize: 17, color: 'var(--text-primary)', margin: '0 0 16px' }}>{c.title}</h3>
            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>{c.subject}</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={c.subjectPh} dir={isAr ? 'rtl' : 'ltr'} />
            </div>
            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>{c.qty}</label>
              <input className="form-input" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" placeholder={isAr ? 'مثال: 500' : 'e.g. 500'} />
            </div>
            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>{c.notes}</label>
              <textarea className="form-input" rows={2} style={{ resize: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} value={notes} onChange={(e) => setNotes(e.target.value)} dir={isAr ? 'rtl' : 'ltr'} />
            </div>
            <p style={{ fontSize: 11.5, color: 'var(--text-disabled)', margin: '2px 0 14px' }}>{c.note}</p>
            {!!error && <p style={{ color: '#a05050', fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
            {!user && <p style={{ fontSize: 12, color: 'var(--text-disabled)', margin: '0 0 12px' }}>{c.signin}</p>}
            <div style={{ display: 'flex', gap: 10, flexDirection: isAr ? 'row-reverse' : 'row' }}>
              <button className="btn-dark-sm" onClick={submit} disabled={submitting} style={{ flex: 1, minHeight: 44 }}>{submitting ? c.sending : c.submit}</button>
              <button className="btn-outline" onClick={onClose} style={{ minHeight: 44, padding: '10px 20px' }}>{c.cancel}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
