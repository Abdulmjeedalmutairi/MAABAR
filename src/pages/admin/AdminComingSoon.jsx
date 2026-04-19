import React from 'react';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

export default function AdminComingSoon({ user, profile, lang, section }) {
  const isAr = lang === 'ar';
  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <div style={{ padding: '80px 32px', textAlign: 'center', direction: isAr ? 'rtl' : 'ltr' }}>
          <p style={{ margin: '0 0 12px', fontSize: 10, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(0,0,0,0.25)', fontFamily: FONT_BODY }}>
            PHASE 2
          </p>
          <h1 style={{ margin: '0 0 12px', fontSize: 32, fontWeight: 400, color: 'rgba(0,0,0,0.75)', fontFamily: FONT_HEADING, lineHeight: 1.1 }}>
            {section || (isAr ? 'قيد البناء' : 'Coming Soon')}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>
            {isAr ? 'هذا القسم سيكون متاحاً في المرحلة الثانية.' : 'This section will be available in Phase 2.'}
          </p>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
