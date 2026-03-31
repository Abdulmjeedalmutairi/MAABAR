import Footer from '../components/Footer';
import React from 'react';
import BrandLogo from '../components/BrandLogo';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const T = {
  ar: {
    tag: 'مَعبر · المورد',
    title: 'تم إرسال التحقق التجاري',
    sub: 'شكراً لك. بيانات التحقق والمستندات وصلت لفريق مَعبر وهي الآن تحت المراجعة قبل تفعيل الحساب.',
    steps: [
      { n: '01', t: 'استلام التحقق', d: 'وصلتنا بيانات شركتك والمستندات المطلوبة.' },
      { n: '02', t: 'مراجعة المستندات', d: 'فريق مَعبر يتحقق من السجل التجاري وصورة المصنع.' },
      { n: '03', t: 'قرار التفعيل', d: 'ستصلك رسالة بالبريد فور قبول الحساب أو طلب أي توضيح إضافي.' },
    ],
    note: 'للاستفسار تواصل معنا عبر البريد الإلكتروني',
    email: 'hello@maabar.io',
    logout: 'تسجيل خروج',
    copy: 'مَعبر © 2026',
  },
  en: {
    tag: 'Maabar · Supplier',
    title: 'Verification Submitted',
    sub: 'Thanks. Your business verification details and documents are now under Maabar review before account activation.',
    steps: [
      { n: '01', t: 'Verification Received', d: 'We received your company details and required documents.' },
      { n: '02', t: 'Document Review', d: 'Maabar team is checking your registration and factory evidence.' },
      { n: '03', t: 'Activation Decision', d: 'You will receive an email once your account is approved or if we need more clarification.' },
    ],
    note: 'For inquiries, contact us at',
    email: 'hello@maabar.io',
    logout: 'Sign Out',
    copy: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 供应商',
    title: '认证资料已提交',
    sub: '感谢您。您的企业认证信息和文件已提交给 Maabar 团队审核，审核通过后才会激活账户。',
    steps: [
      { n: '01', t: '已收到认证资料', d: '我们已收到您的公司信息和所需文件。' },
      { n: '02', t: '文件审核', d: 'Maabar 团队正在核查注册资料与工厂证明。' },
      { n: '03', t: '激活结果', d: '账户批准后，或需要补充说明时，都会通过邮件通知您。' },
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
