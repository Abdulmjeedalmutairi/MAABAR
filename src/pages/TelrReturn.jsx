import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { completeTelrReturn } from '../lib/telrPay';

// Landing page Telr redirects back to after the hosted-payment page. Verifies the
// payment server-side (telr-verify) and shows the result, then returns to the
// buyer's orders.
export default function TelrReturn({ lang = 'ar' }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [params] = useSearchParams();
  const requestId = params.get('requestId');
  const [state, setState] = useState('verifying'); // verifying | ok | failed
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!requestId) { setState('failed'); setMessage(isAr ? 'طلب غير معروف.' : 'Unknown order.'); return; }
      try {
        await completeTelrReturn(requestId);
        if (!cancelled) { setState('ok'); }
      } catch (e) {
        if (!cancelled) { setState('failed'); setMessage(e.message || (isAr ? 'تعذّر تأكيد الدفع.' : 'Could not confirm payment.')); }
      }
    })();
    return () => { cancelled = true; };
  }, [requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = {
    verifying: isAr ? 'جارٍ تأكيد الدفع…' : 'Confirming your payment…',
    ok: isAr ? 'تم الدفع بنجاح ✓' : 'Payment successful ✓',
    okBody: isAr ? 'سجّلنا دفعتك وحدّثنا طلبك.' : 'Your payment is recorded and your order is updated.',
    failedTitle: isAr ? 'لم يكتمل الدفع' : 'Payment not completed',
    toOrders: isAr ? 'إلى طلباتي ←' : 'To my orders →',
    retry: isAr ? 'حاول مرة أخرى' : 'Try again',
  };

  return (
    <div style={{ minHeight: 'var(--app-dvh)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 24 }}>
      <div dir={isAr ? 'rtl' : 'ltr'} style={{ maxWidth: 420, width: '100%', textAlign: 'center', background: 'var(--bg-overlay)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px 28px' }}>
        {state === 'verifying' && (
          <>
            <div style={{ width: 40, height: 40, margin: '0 auto 20px', border: '3px solid var(--border)', borderTopColor: 'var(--text-primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <style>{'@keyframes spin{to{transform:rotate(360deg)}}'}</style>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t.verifying}</p>
          </>
        )}
        {state === 'ok' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 8 }}>{t.ok}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 22 }}>{t.okBody}</p>
            <button onClick={() => nav('/dashboard')} style={{ padding: '11px 22px', borderRadius: 10, border: 'none', background: 'var(--text-primary)', color: 'var(--bg-base)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t.toOrders}</button>
          </>
        )}
        {state === 'failed' && (
          <>
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 8 }}>{t.failedTitle}</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 22 }}>{message}</p>
            <button onClick={() => nav('/dashboard')} style={{ padding: '11px 22px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{t.toOrders}</button>
          </>
        )}
      </div>
    </div>
  );
}
