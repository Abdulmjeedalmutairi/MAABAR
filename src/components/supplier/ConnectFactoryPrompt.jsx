import React, { useEffect, useState } from 'react';
import { sb } from '../../supabase';
import { fetchMyFactory } from '../../lib/catalogImport';

// "Connect your factory by code" — shown to a supplier who is NOT yet linked to a
// factory_directory row. Covers the recognition gap for factories we registered
// but who signed up directly via Apple / Google / a different email, where the
// automatic email/phone match (link_account_to_factory) can't fire. They enter
// the short code we shared (= the factory's claim_slug); claim_factory_by_slug
// binds + seeds their pre-filled profile + products, then we refresh so the
// dashboard reflects the "ready" state.
export default function ConnectFactoryPrompt({ user, lang, onLinked }) {
  const isAr = lang === 'ar';
  const font = isAr ? 'var(--font-ar)' : 'var(--font-sans)';
  const [show, setShow] = useState(false);      // only when unlinked
  const [open, setOpen] = useState(false);      // input revealed
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try { const fac = await fetchMyFactory(); if (alive) setShow(!fac); }
      catch { if (alive) setShow(false); }
    })();
    return () => { alive = false; };
  }, [user?.id]);

  if (!show) return null;

  const submit = async () => {
    const c = code.trim();
    if (!c || busy) return;
    setBusy(true); setErr('');
    try {
      await sb.rpc('claim_factory_by_slug', { p_slug: c });
      if (onLinked) onLinked(); else window.location.reload();
    } catch (e) {
      const m = e?.message || '';
      setErr(
        /not found/i.test(m) ? (isAr ? 'الكود غير صحيح.' : 'Invalid code.')
          : /already claimed/i.test(m) ? (isAr ? 'هذا المصنع مرتبط بحساب آخر.' : 'Already linked to another account.')
            : (isAr ? 'تعذّر الربط — تأكد من الكود.' : 'Could not link — check the code.'),
      );
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: 24, padding: '18px 20px', background: 'linear-gradient(135deg,#FCF8F0,#F5EEDD)', border: '1px solid rgba(176,141,46,.45)', borderRadius: 16 }}>
      <p style={{ margin: 0, fontSize: 10, letterSpacing: 2.4, textTransform: 'uppercase', color: '#8A6D1E', fontWeight: 700, fontFamily: font }}>
        {isAr ? 'سجّلناك مسبقًا؟' : 'Already registered by us?'}
      </p>
      <h3 style={{ margin: '8px 0 6px', fontSize: isAr ? 18 : 19, fontWeight: 700, color: 'var(--text-primary)', fontFamily: font }}>
        {isAr ? 'اربط مصنعك بالكود' : 'Connect your factory with a code'}
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', fontFamily: font }}>
        {isAr
          ? 'إذا وصلك كود من مَعبر، أدخله لتظهر لك بيانات شركتك ومنتجاتك جاهزة فورًا.'
          : 'If Maabar sent you a code, enter it to load your company profile and products, ready to go.'}
      </p>

      {!open ? (
        <button type="button" className="btn-dark-sm" style={{ fontSize: 12.5, minHeight: 38 }} onClick={() => setOpen(true)}>
          {isAr ? 'أدخل الكود' : 'Enter code'}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            value={code}
            onChange={(e) => { setCode(e.target.value); setErr(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder={isAr ? 'كود المصنع' : 'Factory code'}
            dir="ltr"
            autoFocus
            style={{ flex: '1 1 180px', minWidth: 160, background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 10, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)', outline: 'none', textAlign: 'center', letterSpacing: '.06em' }}
          />
          <button type="button" className="btn-dark-sm" style={{ fontSize: 12.5, minHeight: 40, opacity: (busy || !code.trim()) ? 0.6 : 1 }} onClick={submit} disabled={busy || !code.trim()}>
            {busy ? (isAr ? 'جارٍ الربط…' : 'Linking…') : (isAr ? 'ربط' : 'Link')}
          </button>
          <button type="button" onClick={() => { setOpen(false); setErr(''); }} style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', fontSize: 12.5, cursor: 'pointer', fontFamily: font }}>
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>
        </div>
      )}
      {err && <p style={{ margin: '10px 0 0', fontSize: 12.5, color: 'var(--red, #c0392b)', fontFamily: font }}>{err}</p>}
    </div>
  );
}
