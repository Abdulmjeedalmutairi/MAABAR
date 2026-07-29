import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createFactoryRequest } from '../../lib/createFactoryRequest';

const T = {
  ar: { title: 'طلب عرض سعر', product: 'المنتج', qty: 'الكمية المطلوبة *', notes: 'ملاحظات (اختياري)', submit: 'إرسال الطلب', sending: 'جارٍ الإرسال...', cancel: 'إلغاء', errQty: 'يرجى إدخال الكمية.', errGeneric: 'حدث خطأ، حاول مرة أخرى.', doneT: 'تم إرسال طلبك إلى المصنع', doneB: 'سيتم إشعارك عند رد المصنع بعرضه عبر مَعبر.', close: 'إغلاق', note: 'المصنع يرد بالسعر — لا حاجة لإدخال ميزانية.', signin: 'سيُطلب منك تسجيل الدخول عند الإرسال.' },
  en: { title: 'Request a quote', product: 'Product', qty: 'Required quantity *', notes: 'Notes (optional)', submit: 'Send request', sending: 'Sending...', cancel: 'Cancel', errQty: 'Please enter a quantity.', errGeneric: 'Something went wrong, please try again.', doneT: 'Your request has been sent to the factory', doneB: "You'll be notified when the factory responds with its offer through Maabar.", close: 'Close', note: 'The factory responds with pricing — no budget needed.', signin: 'You will be asked to sign in when submitting.' },
  zh: { title: '请求报价', product: '产品', qty: '所需数量 *', notes: '备注（可选）', submit: '发送需求', sending: '发送中...', cancel: '取消', errQty: '请输入数量。', errGeneric: '出错了，请重试。', doneT: '您的需求已发送至工厂', doneB: '工厂通过 Maabar 回复报价后会通知您。', close: '关闭', note: '工厂会回复价格——无需填写预算。', signin: '提交时会要求您登录。' },
};

// Product-bound request modal on the factory page. NO wizard, NO navigation away.
// Placeholder styling — combined design pass later.
export default function ProductRequestModal({ lang = 'ar', user, factory, product, displayCurrency, onClose }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const c = T[lang] || T.ar;
  const [qty, setQty] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const productName = product
    ? ((isAr ? product.name_ar : lang === 'zh' ? product.name_zh : product.name_en) || product.name_en || product.name_ar || product.name_zh || '')
    : '';

  async function submit() {
    if (!String(qty).trim()) { setError(c.errQty); return; }
    if (!user) { nav('/login/buyer'); return; }
    setSubmitting(true);
    setError('');
    const { request, error: e } = await createFactoryRequest({ user, factory, product, quantity: qty, notes, lang, viewerCurrency: displayCurrency });
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
            <div style={{ marginBottom: 14 }}>
              <label className={`form-label${isAr ? ' ar' : ''}`}>{c.product}</label>
              <div style={{ fontSize: 14, color: 'var(--text-primary)', padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', borderRadius: 8 }}>{productName || '—'}</div>
            </div>
            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>{c.qty}</label>
              <input className="form-input" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="numeric" placeholder={isAr ? 'مثال: 500' : 'e.g. 500'} />
            </div>
            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>{c.notes}</label>
              <textarea className="form-input" rows={3} style={{ resize: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} value={notes} onChange={(e) => setNotes(e.target.value)} dir={isAr ? 'rtl' : 'ltr'} />
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
