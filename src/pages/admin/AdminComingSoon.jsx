import React from 'react';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';

export default function AdminComingSoon({ user, profile, lang, section }) {
  const isRTL = lang === 'ar';
  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <div style={{ padding: '80px 28px', textAlign: 'center', direction: isRTL ? 'rtl' : 'ltr' }}>
          <p style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
            PHASE 2
          </p>
          <h1 style={{ margin: '0 0 12px', fontSize: 26, fontWeight: 300, color: 'var(--text-primary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {section || (isRTL ? 'قيد البناء' : 'Coming Soon')}
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-tertiary)', fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isRTL ? 'هذا القسم سيكون متاحاً في المرحلة الثانية.' : 'This section will be available in Phase 2.'}
          </p>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
