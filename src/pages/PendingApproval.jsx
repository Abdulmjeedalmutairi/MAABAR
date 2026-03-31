import React from 'react';
import BrandLogo from '../components/BrandLogo';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const T = {
  ar: {
    tag: 'مَعبر · حالة طلب المورد',
    title: 'تم استلام طلبك — والحساب الآن تحت المراجعة',
    sub: 'وصلنا طلب انضمام المورد بنجاح. فريق مَعبر يراجع حسابك الآن قبل فتح لوحة المورد الكاملة والوصول إلى فرص المشترين السعوديين.',
    badge: 'وصول تأسيسي مبكر',
    steps: [
      { n: '01', t: 'تم استلام الطلب', d: 'وصلتنا بيانات شركتك ومعلومات التواصل الأساسية الخاصة بطلب الانضمام.' },
      { n: '02', t: 'الحساب تحت المراجعة', d: 'نراجع الموردين المختارين بعناية للحفاظ على دخول مبكر انتقائي وعالي الجودة قبل التوسع.' },
      { n: '03', t: 'سنتواصل قريباً', d: 'إذا احتجنا أي توضيح إضافي أو تم قبول الحساب، سيتواصل معك الفريق مباشرة.' },
    ],
    highlights: [
      'طلبك محفوظ لدينا',
      'الحساب ما زال مقيداً لحين انتهاء المراجعة',
      'الفريق سيتواصل معك قريباً',
    ],
    note: 'للاستفسارات السريعة يمكنك التواصل معنا على',
    email: 'hello@maabar.io',
    founder: 'نحن نبني مجموعة الموردين الأوائل بعناية — شكراً لصبرك.',
    home: 'العودة للرئيسية',
    logout: 'تسجيل خروج',
    copy: 'مَعبر © 2026',
  },
  en: {
    tag: 'Maabar · Supplier Application Status',
    title: 'Application received — your account is under review',
    sub: 'Your supplier application has been received successfully. The Maabar team is reviewing it now before unlocking the full supplier dashboard and buyer-facing access.',
    badge: 'Founding supplier access',
    steps: [
      { n: '01', t: 'Application received', d: 'We have your company details and core contact information on file.' },
      { n: '02', t: 'Account under review', d: 'Selected suppliers are reviewed carefully so early access stays focused, curated, and high quality.' },
      { n: '03', t: 'Team will contact you soon', d: 'If we need anything else, or if your account is approved, the team will reach out directly.' },
    ],
    highlights: [
      'Your application is safely received',
      'The supplier dashboard stays controlled during review',
      'Our team will contact you soon',
    ],
    note: 'For quick questions, reach us at',
    email: 'hello@maabar.io',
    founder: 'We are building the founding supplier group carefully — thanks for the patience.',
    home: 'Back to Home',
    logout: 'Sign Out',
    copy: 'Maabar © 2026',
  },
  zh: {
    tag: 'Maabar · 供应商申请状态',
    title: '申请已收到，账户正在审核中',
    sub: '您的供应商申请已成功提交。Maabar 团队正在审核，在审核完成前，完整供应商控制台与买家侧权限仍会保持受控状态。',
    badge: '创始供应商早期通道',
    steps: [
      { n: '01', t: '已收到申请', d: '我们已经收到了您的公司资料与核心联系方式。' },
      { n: '02', t: '账户审核中', d: '我们会谨慎审核首批供应商，确保早期入驻保持精选和高质量。' },
      { n: '03', t: '团队会尽快联系您', d: '如需补充信息，或审核通过，团队会直接联系您。' },
    ],
    highlights: [
      '申请资料已安全接收',
      '审核期间后台保持受控状态',
      '团队会尽快与您联系',
    ],
    note: '如需快速咨询，可联系',
    email: 'hello@maabar.io',
    founder: '我们正在认真搭建首批创始供应商名单，感谢您的耐心等待。',
    home: '返回首页',
    logout: '退出登录',
    copy: 'Maabar © 2026',
  },
};

export default function PendingApproval({ lang, setUser, setProfile }) {
  const nav = useNavigate();
  const t = T[lang] || T.en;
  const isAr = lang === 'ar';

  const doSignOut = async () => {
    await sb.auth.signOut();
    setUser(null);
    setProfile(null);
    nav('/');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '92px 24px 48px' }}>
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 32,
          border: '1px solid var(--border-subtle)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
          boxShadow: '0 30px 80px rgba(0,0,0,0.24)',
          padding: '32px 32px 28px',
          marginBottom: 20,
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(255,255,255,0.08), transparent 28%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 14 }}>
              {t.tag}
            </p>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '6px 12px', borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.14)',
              background: 'rgba(255,255,255,0.04)',
              color: 'var(--text-secondary)', fontSize: 11,
              letterSpacing: 1.1, textTransform: 'uppercase', marginBottom: 18,
            }}>
              {t.badge}
            </span>
            <h1 style={{
              fontSize: isAr ? 40 : 54,
              fontWeight: 300,
              lineHeight: 1.05,
              letterSpacing: isAr ? 0 : -1.2,
              margin: '0 0 16px',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              maxWidth: 860,
            }}>
              {t.title}
            </h1>
            <p style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              maxWidth: 720,
              lineHeight: 1.85,
              margin: 0,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {t.sub}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 20 }} className="pending-review-grid">
          <div style={{
            borderRadius: 28,
            border: '1px solid var(--border-subtle)',
            background: 'var(--bg-subtle)',
            padding: 24,
          }}>
            <div className="pending-steps" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
              {t.steps.map((step, index) => (
                <div
                  key={step.n}
                  style={{
                    padding: '20px 18px',
                    borderRadius: 22,
                    border: '1px solid var(--border-subtle)',
                    background: index === 1 ? 'rgba(255,255,255,0.05)' : 'var(--bg-muted)',
                    animation: `pendingFade 0.45s ease ${index * 0.08}s both`,
                  }}
                >
                  <p style={{ fontSize: 28, lineHeight: 1, margin: '0 0 18px', color: 'var(--text-tertiary)' }}>{step.n}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px', color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {step.t}
                  </p>
                  <p style={{ fontSize: 12, lineHeight: 1.75, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {step.d}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            borderRadius: 28,
            border: '1px solid var(--border-subtle)',
            background: 'linear-gradient(180deg, var(--bg-subtle), rgba(255,255,255,0.02))',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}>
            <div>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 10 }}>
                {isAr ? 'ملخص الحالة' : lang === 'zh' ? '状态摘要' : 'Status summary'}
              </p>
              <div style={{ display: 'grid', gap: 10 }}>
                {t.highlights.map((item) => (
                  <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: 'var(--text-primary)' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--text-primary)', opacity: 0.75, marginTop: 7, flex: '0 0 auto' }} />
                    <span style={{ fontSize: 13, lineHeight: 1.75, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 20, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {t.founder}
              </p>
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {t.note}{' '}
              <a href={`mailto:${t.email}`} style={{ color: 'var(--text-primary)', textDecoration: 'none', borderBottom: '1px solid var(--text-primary)' }}>
                {t.email}
              </a>
            </p>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 'auto' }}>
              <button onClick={() => nav('/')} style={{
                background: 'var(--text-primary)', border: 'none', color: 'var(--bg-base)',
                padding: '11px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                borderRadius: 14, minHeight: 44,
              }}>
                {t.home}
              </button>
              <button onClick={doSignOut} style={{
                background: 'transparent', border: '1px solid var(--border-default)', color: 'var(--text-secondary)',
                padding: '11px 20px', fontSize: 12, cursor: 'pointer', borderRadius: 14, minHeight: 44,
              }}>
                {t.logout}
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px', marginTop: 8 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <BrandLogo size="sm" />
          <p style={{ color: 'var(--text-tertiary)', fontSize: 11, letterSpacing: 1, margin: 0 }}>{t.copy}</p>
        </div>
      </footer>

      <style>{`
        @keyframes pendingFade {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (max-width: 900px) {
          .pending-review-grid {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 768px) {
          .pending-steps {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
