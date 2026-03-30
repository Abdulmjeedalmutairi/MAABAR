import Footer from '../components/Footer';
import React from 'react';
import BrandLogo from '../components/BrandLogo';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const T = {
  ar: {
    tag: 'مَعبر · المورد',
    title: 'حسابك قيد المراجعة',
    sub: 'شكراً لتسجيلك في مَعبر. فريقنا يراجع بياناتك وسيتواصل معك خلال 24 ساعة.',
    steps: [
      { n: '01', t: 'تم استلام طلبك', d: 'وصلنا بياناتك وهي قيد المراجعة.' },
      { n: '02', t: 'مراجعة البيانات', d: 'فريق مَعبر يتحقق من بيانات شركتك.' },
      { n: '03', t: 'تفعيل الحساب', d: 'ستصلك رسالة بالبريد عند تفعيل حسابك.' },
    ],
    note: 'للاستفسار تواصل معنا عبر البريد الإلكتروني',
    email: 'hello@maabar.io',
    logout: 'تسجيل خروج',
    copy: 'مَعبر © 2026',
  },
  en: {
    tag: 'Maabar · Supplier',
    title: 'Account Under Review',
    sub: 'Thank you for registering with Maabar. Our team is reviewing your details and will contact you within 24 hours.',
    steps: [
      { n: '01', t: 'Request Received', d: 'We have received your details and they are under review.' },
      { n: '02', t: 'Data Verification', d: 'Maabar team is verifying your company information.' },
      { n: '03', t: 'Account Activation', d: 'You will receive an email once your account is activated.' },
    ],
    note: 'For inquiries, contact us at',
    email: 'hello@maabar.io',
    logout: 'Sign Out',
    copy: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 供应商',
    title: '账户审核中',
    sub: '感谢您注册Maabar。我们的团队正在审核您的信息，将在24小时内与您联系。',
    steps: [
      { n: '01', t: '已收到申请', d: '我们已收到您的信息，正在审核中。' },
      { n: '02', t: '资料核实', d: 'Maabar团队正在核实您的公司信息。' },
      { n: '03', t: '账户激活', d: '账户激活后您将收到电子邮件通知。' },
    ],
    note: '如有疑问，请联系',
    email: 'hello@maabar.io',
    logout: '退出登录',
    copy: 'Maabar © 2026',
  }
};

export default function PendingApproval({ lang, setUser, setProfile }) {
  const nav = useNavigate();
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  const doSignOut = async () => {
    await sb.auth.signOut();
    setUser(null);
    setProfile(null);
    nav('/');
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'transparent' }}>

      {/* HEADER */}
      <div style={{
        padding: '60px 60px 48px',
        background: 'rgba(0,0,0,0.52)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{
          fontSize: 11, letterSpacing: 4, textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)', marginBottom: 24,
          fontFamily: 'var(--font-body)'
        }}>
          {t.tag}
        </p>
        <h1 style={{
          fontSize: isAr ? 48 : 56, fontWeight: 300,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)',
          color: '#F7F5F2', letterSpacing: isAr ? 0 : -1,
          lineHeight: 1.1, marginBottom: 16,
        }}>
          {t.title}
        </h1>
        <p style={{
          fontSize: 15, color: 'rgba(255,255,255,0.55)',
          maxWidth: 480, lineHeight: 1.8, fontWeight: 300,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
        }}>
          {t.sub}
        </p>
      </div>

      {/* CONTENT */}
      <div style={{
        background: 'rgba(247,245,242,0.92)',
        backdropFilter: 'blur(8px)',
        minHeight: 'calc(100vh - 280px)',
      }}>
        <div style={{ padding: '48px 60px', maxWidth: 760, margin: '0 auto' }}>

          {/* STEPS */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1, background: '#E5E0D8',
            marginBottom: 48,
          }}>
            {t.steps.map((s, i) => (
              <div key={i} style={{
                background: i === 0 ? '#2C2C2C' : '#F7F5F2',
                padding: '32px 28px',
                animation: `fadeIn 0.4s ease ${i * 0.1}s both`,
              }}>
                <p style={{
                  fontFamily: 'var(--font-en)', fontSize: 28, fontWeight: 300,
                  color: i === 0 ? 'rgba(247,245,242,0.25)' : '#E5E0D8',
                  marginBottom: 20, lineHeight: 1,
                }}>
                  {s.n}
                </p>
                <p style={{
                  fontSize: 13, fontWeight: 500, marginBottom: 8,
                  color: i === 0 ? '#F7F5F2' : '#2C2C2C',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                }}>
                  {s.t}
                </p>
                <p style={{
                  fontSize: 12, lineHeight: 1.7,
                  color: i === 0 ? 'rgba(247,245,242,0.5)' : '#7a7a7a',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                }}>
                  {s.d}
                </p>
              </div>
            ))}
          </div>

          {/* NOTE */}
          <div style={{
            borderTop: '1px solid #E5E0D8',
            paddingTop: 32, marginBottom: 32,
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 16,
          }}>
            <p style={{
              fontSize: 13, color: '#7a7a7a',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
            }}>
              {t.note}{' '}
              <a href={`mailto:${t.email}`} style={{
                color: '#2C2C2C', fontWeight: 500, textDecoration: 'none',
                borderBottom: '1px solid #2C2C2C',
              }}>
                {t.email}
              </a>
            </p>
            <button onClick={doSignOut} style={{
              background: 'none', border: '1px solid #E5E0D8',
              color: '#7a7a7a', padding: '9px 22px',
              fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
              cursor: 'pointer', borderRadius: 2, transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2C2C2C'; e.currentTarget.style.color = '#2C2C2C'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E0D8'; e.currentTarget.style.color = '#7a7a7a'; }}>
              {t.logout}
            </button>
          </div>

        </div>
      </div>

      {/* FOOTER */}
      <footer style={{
        background: '#2C2C2C', padding: '32px 60px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <BrandLogo size="sm" />
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 1 }}>{t.copy}</p>
      </footer>

      {/* MOBILE */}
      <style>{`
        @media (max-width: 768px) {
          .pending-steps { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
