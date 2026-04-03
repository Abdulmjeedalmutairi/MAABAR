import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotFound({ lang }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  return (
    <div style={{ minHeight: 'var(--app-dvh)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-base)', padding: 40, textAlign: 'center' }}>
      <p style={{ fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 20 }}>404</p>
      <h1 style={{ fontSize: isAr ? 36 : 48, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', letterSpacing: isAr ? 0 : -1 }}>
        {isAr ? 'الصفحة غير موجودة' : 'Page Not Found'}
      </h1>
      <p style={{ fontSize: 14, color: 'var(--text-disabled)', marginBottom: 40, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        {isAr ? 'الرابط الذي فتحته غير موجود أو تم حذفه' : 'The page you\'re looking for doesn\'t exist'}
      </p>
      <button onClick={() => nav('/')} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)', padding: '12px 28px', fontSize: 13, cursor: 'pointer', borderRadius: 'var(--radius-md)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        {isAr ? 'العودة للرئيسية' : 'Back to Home'}
      </button>
    </div>
  );
}
