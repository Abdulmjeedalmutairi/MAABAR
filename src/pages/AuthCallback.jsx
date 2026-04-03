import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import { sanitizeNextPath } from '../lib/authRedirects';
import { getSupplierPrimaryRoute } from '../lib/supplierOnboarding';
import BrandedLoading from '../components/BrandedLoading';

const COPY = {
  ar: {
    loadingTitle: 'جارٍ تأكيد الدخول…',
    loadingBody: 'نجهّز حسابك الآن ونحوّلك إلى الوجهة الصحيحة.',
    errorTitle: 'تعذر إكمال التحقق',
    errorBody: 'رابط التحقق غير صالح أو منتهي. حاول تسجيل الدخول مرة أخرى أو اطلب رسالة جديدة.',
    backToSupplier: 'العودة إلى دخول المورد',
    backToBuyer: 'العودة إلى الدخول',
    home: 'العودة للرئيسية',
  },
  en: {
    loadingTitle: 'Finalizing your sign-in…',
    loadingBody: 'We are preparing your account and sending you to the right place.',
    errorTitle: 'We could not complete verification',
    errorBody: 'This confirmation link is invalid or expired. Try signing in again or request a fresh email.',
    backToSupplier: 'Back to supplier sign in',
    backToBuyer: 'Back to sign in',
    home: 'Back to home',
  },
  zh: {
    loadingTitle: '正在完成登录验证…',
    loadingBody: '系统正在准备您的账户，并将您带到正确页面。',
    errorTitle: '无法完成邮箱验证',
    errorBody: '该确认链接无效或已过期。请重新登录或请求新的确认邮件。',
    backToSupplier: '返回供应商登录',
    backToBuyer: '返回登录',
    home: '返回首页',
  },
};

function getHashParams(hash = '') {
  return new URLSearchParams((hash || '').replace(/^#/, ''));
}

function readAuthError(searchParams, hashParams) {
  return searchParams.get('error_description')
    || searchParams.get('error')
    || hashParams.get('error_description')
    || hashParams.get('error')
    || '';
}

export default function AuthCallback({ user, profile, lang }) {
  const nav = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const t = COPY[lang] || COPY.en;

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const hashParams = useMemo(() => getHashParams(location.hash), [location.hash]);
  const nextPath = useMemo(() => sanitizeNextPath(searchParams.get('next') || hashParams.get('next') || '/dashboard'), [searchParams, hashParams]);
  const requestedRole = searchParams.get('role') || hashParams.get('role') || '';
  const authType = searchParams.get('type') || hashParams.get('type') || '';

  useEffect(() => {
    let active = true;

    const finalizeAuth = async () => {
      const incomingError = readAuthError(searchParams, hashParams);
      if (incomingError) {
        if (!active) return;
        setStatus('error');
        setErrorMessage(incomingError);
        return;
      }

      try {
        const code = searchParams.get('code');
        const tokenHash = searchParams.get('token_hash') || hashParams.get('token_hash');
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');

        if (code) {
          const { error } = await sb.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (tokenHash && authType) {
          const { error } = await sb.auth.verifyOtp({ token_hash: tokenHash, type: authType });
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await sb.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
        } else {
          await new Promise((resolve) => setTimeout(resolve, 350));
        }

        const { data: { session } } = await sb.auth.getSession();
        if (!session?.user) {
          throw new Error('Missing authenticated session after callback.');
        }

        if (!active) return;
        setStatus('ready');
      } catch (error) {
        if (!active) return;
        setStatus('error');
        setErrorMessage(error?.message || 'Auth callback failed.');
      }
    };

    finalizeAuth();
    return () => { active = false; };
  }, [searchParams, hashParams, authType]);

  useEffect(() => {
    if (status !== 'ready' || !user) return;

    if (profile?.role === 'supplier') {
      nav(getSupplierPrimaryRoute(profile, user), { replace: true });
      return;
    }

    if (profile) {
      nav(nextPath, { replace: true });
    }
  }, [status, user, profile, nextPath, nav]);

  const loginTarget = requestedRole === 'supplier' ? '/login/supplier' : '/login';

  if (status !== 'error') {
    return (
      <BrandedLoading
        lang={lang}
        tag="MAABAR AUTH"
        title={t.loadingTitle}
        body={t.loadingBody}
        tone="app"
        fullscreen
      />
    );
  }

  return (
    <div style={{
      minHeight: 'var(--app-dvh)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base)',
      padding: 24,
      color: 'var(--text-primary)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        borderRadius: 24,
        border: '1px solid var(--border-subtle)',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
        padding: '36px 30px',
        textAlign: lang === 'ar' ? 'right' : 'left',
      }}>
        <p style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--text-tertiary)',
          margin: '0 0 12px',
        }}>
          MAABAR AUTH
        </p>

        <h1 style={{
          margin: '0 0 12px',
          fontSize: lang === 'ar' ? 30 : 32,
          fontWeight: 300,
          lineHeight: 1.15,
          fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {status === 'error' ? t.errorTitle : t.loadingTitle}
        </h1>

        <p style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--text-secondary)',
          fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {status === 'error' ? t.errorBody : t.loadingBody}
        </p>

        {status === 'error' ? (
          <>
            {errorMessage ? (
              <p style={{
                margin: '18px 0 0',
                fontSize: 12,
                lineHeight: 1.7,
                color: '#d9a5a5',
                wordBreak: 'break-word',
                fontFamily: 'var(--font-sans)',
              }}>
                {errorMessage}
              </p>
            ) : null}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 22 }}>
              <button
                onClick={() => nav(loginTarget, { replace: true })}
                style={{
                  background: 'var(--text-primary)',
                  color: 'var(--bg-base)',
                  border: 'none',
                  borderRadius: 14,
                  minHeight: 44,
                  padding: '11px 18px',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {requestedRole === 'supplier' ? t.backToSupplier : t.backToBuyer}
              </button>
              <button
                onClick={() => nav('/', { replace: true })}
                style={{
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 14,
                  minHeight: 44,
                  padding: '11px 18px',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {t.home}
              </button>
            </div>
          </>
        ) : (
          <div style={{
            width: 40,
            height: 2,
            borderRadius: 999,
            background: 'rgba(255,255,255,0.18)',
            marginTop: 24,
            overflow: 'hidden',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(255,255,255,0.75)',
              transformOrigin: 'left center',
              animation: 'authCallbackPulse 1.2s ease-in-out infinite',
            }} />
          </div>
        )}
      </div>

      <style>{`
        @keyframes authCallbackPulse {
          0%, 100% { transform: scaleX(0.25); opacity: 0.4; }
          50% { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
