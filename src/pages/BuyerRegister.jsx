import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import BrandLogo from '../components/BrandLogo';
import { buildAuthCallbackUrl } from '../lib/authRedirects';

const LAUNCH = new Date('2026-05-01T00:00:00+03:00').getTime();

function useCountdown() {
  const [diff, setDiff] = useState(() => Math.max(0, LAUNCH - Date.now()));
  useEffect(() => {
    const id = setInterval(() => setDiff(Math.max(0, LAUNCH - Date.now())), 1000);
    return () => clearInterval(id);
  }, []);
  const total = Math.floor(diff / 1000);
  return {
    d: Math.floor(total / 86400),
    h: Math.floor(total / 3600) % 24,
    m: Math.floor(total / 60) % 60,
    s: total % 60,
  };
}

const CITIES_AR = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'القصيم', 'حائل', 'جازان', 'نجران'];
const CITIES_EN = ['Riyadh', 'Jeddah', 'Makkah', 'Madinah', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Qassim', 'Hail', 'Jazan', 'Najran'];

const L = {
  ar: {
    title: 'سجّل كتاجر',
    sub: 'انضم إلى مَعبر قبل الإطلاق',
    name: 'الاسم الكامل',
    phone: 'رقم الجوال',
    city: 'المدينة',
    cityPlaceholder: 'اختر مدينتك',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    submit: 'إنشاء حساب',
    loading: 'جاري الإنشاء...',
    confirmMsg: 'تم إرسال رسالة التأكيد إلى بريدك. بعد التأكيد يمكنك تسجيل الدخول.',
    alreadyHave: 'عندك حساب؟',
    signIn: 'سجّل دخولك',
    required: 'هذا الحقل مطلوب',
    founderTitle: 'دائرة المؤسسين',
    founderSub: 'أول 20 تاجر يسجلون يحصلون على:',
    perk1: 'شارة المؤسس — دائمة على حسابك',
    perk2: 'عمولة 0% للأبد',
    perk3: 'خدمة الطلب المُدار مجاناً لأول 3 طلبات',
    spotsLeft: 'المقاعد محدودة',
    countdown: 'الإطلاق في',
    days: 'يوم',
    hours: 'ساعة',
    min: 'دقيقة',
    sec: 'ثانية',
  },
  en: {
    title: 'Register as a Trader',
    sub: 'Join Maabar before launch',
    name: 'Full Name',
    phone: 'Phone',
    city: 'City',
    cityPlaceholder: 'Select your city',
    email: 'Email',
    password: 'Password',
    submit: 'Create Account',
    loading: 'Creating...',
    confirmMsg: 'A confirmation link has been sent to your email. Sign in after confirming.',
    alreadyHave: 'Already have an account?',
    signIn: 'Sign in',
    required: 'This field is required',
    founderTitle: 'Founding Circle',
    founderSub: 'First 20 traders to sign up receive:',
    perk1: 'Founding badge — permanent on your account',
    perk2: '0% commission forever',
    perk3: 'Managed Order Service free for your first 3 orders',
    spotsLeft: 'Limited spots',
    countdown: 'Launching in',
    days: 'Days',
    hours: 'Hours',
    min: 'Min',
    sec: 'Sec',
  },
};

const inputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  height: 48,
  border: '1px solid var(--border-default)',
  borderRadius: 12,
  padding: '0 14px',
  fontSize: 14,
  fontFamily: 'var(--font-sans)',
  background: '#FFFFFF',
  color: 'var(--text-primary)',
  outline: 'none',
};

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 6,
};

export default function BuyerRegister({ user }) {
  const navigate = useNavigate();
  const [lang, setLang] = useState('ar');
  const t = L[lang];
  const isRtl = lang === 'ar';
  const cities = isRtl ? CITIES_AR : CITIES_EN;

  const [form, setForm] = useState({ name: '', phone: '', city: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState('');
  const { d, h, m, s } = useCountdown();

  useEffect(() => {
    document.title = isRtl ? 'تسجيل التاجر | مَعبر' : 'Trader Sign Up | Maabar';
  }, [isRtl]);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = t.required;
    if (!form.phone.trim()) e.phone = t.required;
    if (!form.city) e.city = t.required;
    if (!form.email.trim()) e.email = t.required;
    if (!form.password || form.password.length < 6) e.password = isRtl ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setSubmitting(true);
    try {
      const { error } = await sb.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(),
          data: {
            role: 'buyer',
            full_name: form.name.trim(),
            phone: form.phone.trim(),
            city: form.city,
            lang,
          },
        },
      });
      if (error) { setServerError(error.message); return; }
      setDone(true);
    } catch (err) {
      setServerError(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  const boxNum = {
    width: 60,
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 10,
    fontSize: 24,
    fontWeight: 300,
    fontFamily: 'var(--font-sans)',
    color: '#FFFFFF',
    fontVariantNumeric: 'tabular-nums',
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        minHeight: '100dvh',
        background: 'var(--bg-base)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '32px 16px 48px',
      }}
    >
      {/* Lang toggle */}
      <div style={{
        width: '100%',
        maxWidth: 440,
        display: 'flex',
        justifyContent: isRtl ? 'flex-start' : 'flex-end',
        marginBottom: 28,
      }}>
        <button
          onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
          style={{
            background: 'none',
            border: '1px solid var(--border-default)',
            borderRadius: 8,
            padding: '6px 14px',
            fontSize: 12,
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {lang === 'ar' ? 'English' : 'العربية'}
        </button>
      </div>

      {/* Logo */}
      <div style={{ marginBottom: 28 }}>
        <BrandLogo size="lg" />
      </div>

      {done ? (
        <div style={{
          width: '100%',
          maxWidth: 440,
          background: '#FFFFFF',
          border: '1px solid var(--border-subtle)',
          borderRadius: 20,
          padding: '32px 28px',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--text-primary)', margin: 0, fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {t.confirmMsg}
          </p>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Heading */}
          <div>
            <h1 style={{
              margin: '0 0 6px',
              fontSize: 26,
              fontWeight: 300,
              color: 'var(--text-primary)',
              fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {t.title}
            </h1>
            <p style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--text-secondary)',
              fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {t.sub}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-subtle)',
            borderRadius: 20,
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            {/* Full name */}
            <div>
              <label style={{ ...labelStyle, fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.name}</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                style={{ ...inputStyle, borderColor: errors.name ? '#e53e3e' : undefined, fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}
                autoComplete="name"
              />
              {errors.name && <span style={{ fontSize: 11, color: '#e53e3e', marginTop: 4, display: 'block', fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>{errors.name}</span>}
            </div>

            {/* Phone */}
            <div>
              <label style={{ ...labelStyle, fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.phone}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                style={{ ...inputStyle, borderColor: errors.phone ? '#e53e3e' : undefined, direction: 'ltr' }}
                placeholder="+966 5X XXX XXXX"
                autoComplete="tel"
              />
              {errors.phone && <span style={{ fontSize: 11, color: '#e53e3e', marginTop: 4, display: 'block', fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>{errors.phone}</span>}
            </div>

            {/* City */}
            <div>
              <label style={{ ...labelStyle, fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.city}</label>
              <select
                value={form.city}
                onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                style={{ ...inputStyle, borderColor: errors.city ? '#e53e3e' : undefined, fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)', cursor: 'pointer' }}
              >
                <option value="">{t.cityPlaceholder}</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.city && <span style={{ fontSize: 11, color: '#e53e3e', marginTop: 4, display: 'block', fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>{errors.city}</span>}
            </div>

            {/* Email */}
            <div>
              <label style={{ ...labelStyle, fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.email}</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                style={{ ...inputStyle, borderColor: errors.email ? '#e53e3e' : undefined, direction: 'ltr' }}
                autoComplete="email"
              />
              {errors.email && <span style={{ fontSize: 11, color: '#e53e3e', marginTop: 4, display: 'block', fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>{errors.email}</span>}
            </div>

            {/* Password */}
            <div>
              <label style={{ ...labelStyle, fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.password}</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ ...inputStyle, borderColor: errors.password ? '#e53e3e' : undefined, direction: 'ltr' }}
                autoComplete="new-password"
              />
              {errors.password && <span style={{ fontSize: 11, color: '#e53e3e', marginTop: 4, display: 'block', fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>{errors.password}</span>}
            </div>

            {serverError && (
              <p style={{ margin: 0, fontSize: 12, color: '#e53e3e', fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {serverError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                width: '100%',
                height: 50,
                background: submitting ? 'var(--text-disabled)' : 'var(--text-primary)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 700,
                cursor: submitting ? 'default' : 'pointer',
                fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
                marginTop: 4,
              }}
            >
              {submitting ? t.loading : t.submit}
            </button>

            <p style={{
              margin: 0,
              textAlign: 'center',
              fontSize: 12,
              color: 'var(--text-tertiary)',
              fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {t.alreadyHave}{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ background: 'none', border: 'none', padding: 0, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer', textDecoration: 'underline', fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}
              >
                {t.signIn}
              </button>
            </p>
          </form>

          {/* Founding Circle box */}
          <div style={{
            background: 'var(--text-primary)',
            borderRadius: 20,
            padding: '28px 24px',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            <div>
              <p style={{
                margin: '0 0 4px',
                fontSize: 10,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-sans)',
              }}>
                {t.spotsLeft}
              </p>
              <h2 style={{
                margin: '0 0 6px',
                fontSize: 20,
                fontWeight: 600,
                fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {t.founderTitle}
              </h2>
              <p style={{
                margin: 0,
                fontSize: 13,
                color: 'rgba(255,255,255,0.7)',
                fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {t.founderSub}
              </p>
            </div>

            {/* Perks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[t.perk1, t.perk2, t.perk3].map((perk, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{
                    flexShrink: 0,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    border: '1px solid rgba(255,255,255,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontFamily: 'var(--font-sans)',
                    color: 'rgba(255,255,255,0.7)',
                    marginTop: 1,
                  }}>
                    {i + 1}
                  </div>
                  <span style={{
                    fontSize: 13,
                    lineHeight: 1.6,
                    fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)',
                  }}>
                    {perk}
                  </span>
                </div>
              ))}
            </div>

            {/* Countdown */}
            <div>
              <p style={{
                margin: '0 0 12px',
                fontSize: 11,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'var(--font-sans)',
              }}>
                {t.countdown}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                {[
                  { v: d, l: t.days },
                  { v: h, l: t.hours },
                  { v: m, l: t.min },
                  { v: s, l: t.sec },
                ].map(({ v, l }) => (
                  <div key={l} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={boxNum}>{String(v).padStart(2, '0')}</div>
                    <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontFamily: isRtl ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {l}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
