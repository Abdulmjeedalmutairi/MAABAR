import React, { useState } from 'react';
import BrandLogo from '../BrandLogo';

// Supplier-app header (decision #3): logo + bell + avatar. The hamburger is gone;
// profile / verification / language / logout open from the avatar sheet. Rendered
// by the supplier dashboard, which hides the global Navbar for its route.

const LANGS = [['ar', 'ع'], ['en', 'EN'], ['zh', '中']];

const T = {
  ar: { profile: 'ملف الشركة', verify: 'التحقق', language: 'اللغة', logout: 'تسجيل الخروج', supplier: 'مورد' },
  en: { profile: 'Company profile', verify: 'Verification', language: 'Language', logout: 'Log out', supplier: 'Supplier' },
  zh: { profile: '公司资料', verify: '认证', language: '语言', logout: '退出登录', supplier: '供应商' },
};

export default function SupplierHeader({ lang = 'ar', setLang, companyName = '', subtitle = '', avatarUrl, avatarText, onProfile, onVerification, onLogout, onBell }) {
  const c = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const font = isAr ? { fontFamily: 'var(--font-ar)' } : {};
  const [open, setOpen] = useState(false);
  const initials = (avatarText || companyName || 'S').trim().slice(0, 2).toUpperCase();

  const Row = ({ label, onClick, children }) => (
    <button onClick={() => { setOpen(false); onClick?.(); }} style={{ display: 'flex', width: '100%', alignItems: 'center', gap: 13, padding: '15px 20px', borderBottom: '1px solid var(--border-subtle)', background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: 'var(--border-subtle)', cursor: 'pointer', textAlign: isAr ? 'right' : 'left' }}>
      <span style={{ flex: 1, fontSize: 14.5, color: 'var(--text-primary)', ...font }}>{label}</span>
      {children || <span style={{ color: 'var(--text-disabled)', fontSize: 15 }}>{isAr ? '←' : '→'}</span>}
    </button>
  );

  return (
    <>
      <header style={{ background: 'var(--bg-raised, #fff)', borderBottom: '1px solid var(--border-subtle)', padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 40 }}>
        <BrandLogo size="sm" align="flex-start" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 15, color: 'var(--text-disabled)' }}>
          <button onClick={onBell} aria-label="notifications" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0 }}>
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></svg>
          </button>
          <button onClick={() => setOpen(true)} aria-label="profile" style={{ width: 31, height: 31, borderRadius: '50%', background: 'var(--bronze-soft, #EFE9E1)', border: '1px solid var(--bronze-line, #E2D8C9)', color: 'var(--bronze, #8B7355)', fontSize: 11.5, fontWeight: 600, fontFamily: 'Inter, sans-serif', cursor: 'pointer', overflow: 'hidden' }}>
            {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </button>
        </div>
      </header>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(26,24,20,.42)', zIndex: 50 }} />
          <div style={{ position: 'fixed', bottom: 0, right: 0, left: 0, zIndex: 51, background: 'var(--bg-raised, #fff)', borderRadius: '20px 20px 0 0', maxWidth: 520, margin: '0 auto', paddingBottom: 'max(20px, env(safe-area-inset-bottom))', maxHeight: '82vh', overflowY: 'auto' }}>
            <div style={{ width: 38, height: 4, borderRadius: 99, background: 'var(--border-subtle)', margin: '10px auto 14px' }} />
            <div style={{ display: 'flex', gap: 13, alignItems: 'center', padding: '0 20px 16px', borderBottom: '1px solid var(--border-subtle)', flexDirection: isAr ? 'row-reverse' : 'row' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bronze-soft, #EFE9E1)', border: '1px solid var(--bronze-line, #E2D8C9)', color: 'var(--bronze, #8B7355)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: 15, fontWeight: 600, flexShrink: 0, overflow: 'hidden' }}>
                {avatarUrl ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
              </div>
              <div style={{ minWidth: 0, textAlign: isAr ? 'right' : 'left' }}>
                <h3 style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.35, color: 'var(--text-primary)', ...font }}>{companyName}</h3>
                <div style={{ fontSize: 12.5, color: 'var(--text-disabled)', marginTop: 2, ...font }}>{c.supplier}{subtitle ? ` · ${subtitle}` : ''}</div>
              </div>
            </div>
            <Row label={c.profile} onClick={onProfile} />
            <Row label={c.verify} onClick={onVerification} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '15px 20px', borderBottom: '1px solid var(--border-subtle)', flexDirection: isAr ? 'row-reverse' : 'row' }}>
              <span style={{ flex: 1, fontSize: 14.5, color: 'var(--text-primary)', ...font }}>{c.language}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {LANGS.map(([code, lbl]) => (
                  <button key={code} onClick={() => setLang?.(code)} style={{ padding: '5px 11px', borderRadius: 8, fontSize: 12.5, cursor: 'pointer', border: '1px solid', background: lang === code ? 'var(--text-primary)' : 'transparent', color: lang === code ? 'var(--bg-base, #fff)' : 'var(--text-disabled)', borderColor: lang === code ? 'var(--text-primary)' : 'var(--border-subtle)', fontWeight: lang === code ? 600 : 400 }}>{lbl}</button>
                ))}
              </div>
            </div>
            <Row label={c.logout} onClick={onLogout}><span /></Row>
          </div>
        </>
      )}
    </>
  );
}
