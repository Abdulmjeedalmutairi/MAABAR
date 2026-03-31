import React from 'react';
import BrandLogo from '../components/BrandLogo';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const T = {
  ar: {
    tag: 'مَعبر · طلب المورد',
    title: 'طلبك الآن تحت المراجعة',
    sub: 'استلمنا طلب الانضمام وبيانات التحقق الخاصة بك. فريق مَعبر يراجع الطلب الآن قبل تفعيل وصولك للمشترين وإطلاق حسابك كمورد.',
    badge: 'قبل الإطلاق العام',
    steps: [
      { n: '01', t: 'تم استلام الطلب', d: 'اكتمل طلب الانضمام ووصلتنا بيانات شركتك والمستندات المطلوبة.' },
      { n: '02', t: 'مراجعة قبل الإطلاق', d: 'نراجع الموردين المختارين قبل فتح الوصول الكامل حتى يبقى الانضمام انتقائياً وعالي الجودة.' },
      { n: '03', t: 'وصول مبكر بعد القبول', d: 'بعد الموافقة تحصل على لوحة المورد الكاملة وفرصة تجهيز حضورك مبكراً قبل الإطلاق العام.' },
    ],
    note: 'إذا احتجنا أي توضيح إضافي أو تم قبول الحساب، سنرسل لك تحديثاً على',
    email: 'hello@maabar.io',
    home: 'العودة للرئيسية',
    logout: 'تسجيل خروج',
    copy: 'مَعبر © 2026',
  },
  en: {
    tag: 'Maabar · Supplier Application',
    title: 'Your application is under review',
    sub: 'We received your supplier application and verification details. Maabar team is now reviewing it before giving you launch access and activating the full supplier dashboard.',
    badge: 'Before public launch',
    steps: [
      { n: '01', t: 'Application received', d: 'Your application, company details, and required documents have been received.' },
      { n: '02', t: 'Reviewed before launch', d: 'Selected suppliers are reviewed before public rollout so supplier intake stays focused and high quality.' },
      { n: '03', t: 'Early visibility after approval', d: 'Once approved, you unlock the full supplier dashboard and can prepare your presence before the wider launch.' },
    ],
    note: 'If we need clarification or your account is approved, we will email you at',
    email: 'hello@maabar.io',
    home: 'Back to Home',
    logout: 'Sign Out',
    copy: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 供应商申请',
    title: '您的申请正在审核中',
    sub: '我们已收到您的供应商申请和认证资料。Maabar 团队正在审核，审核通过后才会开放完整供应商控制台和上线权限。',
    badge: '公开上线前',
    steps: [
      { n: '01', t: '已收到申请', d: '我们已收到您的申请、公司信息和所需文件。' },
      { n: '02', t: '上线前审核', d: '公开上线前会先审核精选供应商，保证入驻质量与节奏。' },
      { n: '03', t: '通过后获得早期曝光', d: '审核通过后，您将解锁完整供应商后台，并可在更广泛上线前提前准备展示。' },
    ],
    note: '如果需要补充说明，或账户审核通过，我们会通过邮件通知您：',
    email: 'hello@maabar.io',
    home: '返回首页',
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
      <div style={{
        padding: '60px 60px 48px',
        background: 'rgba(0,0,0,0.52)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <p style={{
          fontSize: 11, letterSpacing: 4, textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)', marginBottom: 18,
          fontFamily: 'var(--font-body)'
        }}>
          {t.tag}
        </p>
        <div style={{ marginBottom: 18 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            border: '1px solid rgba(255,255,255,0.14)',
            background: 'rgba(255,255,255,0.04)',
            color: 'rgba(255,255,255,0.62)', fontSize: 11,
            letterSpacing: 1.2, textTransform: 'uppercase'
          }}>
            {t.badge}
          </span>
        </div>
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
          maxWidth: 620, lineHeight: 1.8, fontWeight: 300,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
        }}>
          {t.sub}
        </p>
      </div>

      <div style={{
        background: 'rgba(247,245,242,0.92)',
        backdropFilter: 'blur(8px)',
        minHeight: 'calc(100vh - 280px)',
      }}>
        <div style={{ padding: '48px 60px', maxWidth: 880, margin: '0 auto' }}>
          <div className="pending-steps" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
            background: '#E5E0D8',
            marginBottom: 40,
          }}>
            {t.steps.map((s, i) => (
              <div key={i} style={{
                background: i === 1 ? '#2C2C2C' : '#F7F5F2',
                padding: '32px 28px',
                animation: `fadeIn 0.4s ease ${i * 0.1}s both`,
              }}>
                <p style={{
                  fontFamily: 'var(--font-en)', fontSize: 28, fontWeight: 300,
                  color: i === 1 ? 'rgba(247,245,242,0.25)' : '#E5E0D8',
                  marginBottom: 20, lineHeight: 1,
                }}>
                  {s.n}
                </p>
                <p style={{
                  fontSize: 13, fontWeight: 500, marginBottom: 8,
                  color: i === 1 ? '#F7F5F2' : '#2C2C2C',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                }}>
                  {s.t}
                </p>
                <p style={{
                  fontSize: 12, lineHeight: 1.7,
                  color: i === 1 ? 'rgba(247,245,242,0.58)' : '#7a7a7a',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                }}>
                  {s.d}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            borderTop: '1px solid #E5E0D8',
            paddingTop: 28,
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', flexWrap: 'wrap', gap: 16,
          }}>
            <p style={{
              fontSize: 13, color: '#7a7a7a',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
              lineHeight: 1.8,
            }}>
              {t.note}{' '}
              <a href={`mailto:${t.email}`} style={{
                color: '#2C2C2C', fontWeight: 500, textDecoration: 'none',
                borderBottom: '1px solid #2C2C2C',
              }}>
                {t.email}
              </a>
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => nav('/')} style={{
                background: '#2C2C2C', border: 'none',
                color: '#F7F5F2', padding: '10px 22px',
                fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase',
                cursor: 'pointer', borderRadius: 2,
                fontFamily: 'var(--font-body)',
              }}>
                {t.home}
              </button>
              <button onClick={doSignOut} style={{
                background: 'none', border: '1px solid #E5E0D8',
                color: '#7a7a7a', padding: '9px 22px',
                fontSize: 11, letterSpacing: 1.3, textTransform: 'uppercase',
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
      </div>

      <footer style={{
        background: '#2C2C2C', padding: '32px 60px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <BrandLogo size="sm" />
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 1 }}>{t.copy}</p>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .pending-steps { grid-template-columns: 1fr !important; }
        }
      `}</style>

    </div>
  );
}
