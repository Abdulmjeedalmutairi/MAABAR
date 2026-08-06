import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsoleShell, { Icon as ShellIcon } from '../../components/admin2/ConsoleShell';
import { fetchDashboardStats } from '../../lib/consoleDashboard';

// KPI icons (24-grid, currentColor)
const KI = {
  msg: 'M21 15a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z',
  quote: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',
  invite: 'M4 4h16v16H4zM4 7l8 6 8-6',
  catalog: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
  trader: 'M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 10a4 4 0 1 0 0-.01M22 20v-2a4 4 0 0 0-3-3.8',
  ticket: 'M21 12a9 9 0 1 1-3.2-6.9M21 4v5h-5M12 8v5M12 16v.5',
};
function KIco({ d }) {
  return <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>;
}

export default function ConsoleDashboard({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [s, setS] = useState(null);

  useEffect(() => { fetchDashboardStats().then(setS).catch(() => setS({})); }, []);

  const name = (profile?.full_name || '').split(' ')[0] || '';
  const v = (k) => (s ? s[k] || 0 : null);

  // The single most pressing item → surfaced as the "next action" line.
  const nextAction = () => {
    if (!s) return null;
    if (s.catalogsToReview > 0) return { t: isAr ? `${s.catalogsToReview} كتالوج بانتظار مراجعتك` : `${s.catalogsToReview} catalogs need your review`, go: '/admin2/import' };
    if (s.pendingQuotations > 0) return { t: isAr ? `${s.pendingQuotations} طلب تسعير بانتظار المورّد` : `${s.pendingQuotations} quotations awaiting a supplier`, go: '/admin2/quotations' };
    if (s.unreadMessages > 0) return { t: isAr ? `${s.unreadMessages} رسالة غير مقروءة` : `${s.unreadMessages} unread messages`, go: '/admin2/notifications' };
    if (s.waitingInvitation > 0) return { t: isAr ? `${s.waitingInvitation} مورّد جاهز للدعوة` : `${s.waitingInvitation} suppliers ready to invite`, go: '/admin2/suppliers' };
    return null;
  };
  const na = nextAction();

  const CARDS = [
    { k: 'unreadMessages', ico: KI.msg, ar: 'رسائل غير مقروءة', en: 'Unread messages', hintAr: 'محادثات بانتظار المصنع', hintEn: 'awaiting a supplier reply', go: '/admin2/notifications', tone: 'attn' },
    { k: 'pendingQuotations', ico: KI.quote, ar: 'طلبات تسعير معلّقة', en: 'Pending quotations', hintAr: 'لم يُقدَّم لها عرض بعد', hintEn: 'no offer yet', go: '/admin2/quotations', tone: 'attn' },
    { k: 'waitingInvitation', ico: KI.invite, ar: 'موردون بلا تسجيل', en: 'Suppliers to invite', hintAr: 'جاهزون لإرسال دعوة', hintEn: 'ready for an invitation', go: '/admin2/suppliers', tone: 'plain' },
    { k: 'catalogsToReview', ico: KI.catalog, ar: 'كتالوجات للمراجعة', en: 'Catalogs to review', hintAr: 'انتهى استخراجها', hintEn: 'extraction finished', go: '/admin2/import', tone: 'hot' },
    { k: 'newTradersToday', ico: KI.trader, ar: 'تجّار جدد اليوم', en: 'New traders today', hintAr: 'سجّلوا اليوم', hintEn: 'registered today', go: '/admin/traders', tone: 'plain' },
    { k: 'openTickets', ico: KI.ticket, ar: 'تذاكر دعم مفتوحة', en: 'Open support tickets', hintAr: 'بانتظار ردّ', hintEn: 'awaiting a reply', go: '/admin/support', tone: 'hot' },
  ];

  const QUICK = [
    { ico: 'import', ar: 'استيراد كتالوج', en: 'Import catalog', subAr: 'ارفع PDF واستخرج', subEn: 'Upload a PDF & extract', go: '/admin2/import' },
    { ico: 'suppliers', ar: 'إنشاء / إدارة مورّد', en: 'Create / manage supplier', subAr: 'مركز الموردين', subEn: 'Supplier hub', go: '/admin2/suppliers' },
    { ico: 'quotations', ar: 'طلبات التسعير', en: 'Quotation requests', subAr: 'راجع الطلبات', subEn: 'Review requests', go: '/admin2/quotations' },
    { ico: 'quotations', ar: 'قوالب الرسائل', en: 'Message templates', subAr: 'شوف ما تُرسله للمصانع', subEn: 'See what you send factories', go: '/admin2/templates' },
  ];

  const toneClass = (c) => (v(c.k) > 0 ? (c.tone === 'hot' ? ' hot' : c.tone === 'attn' ? ' attn' : '') : '');

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="dashboard">
      <div className="ac-page" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        <div className="ac-page-head">
          <div>
            <h1 className="ac-h1">{isAr ? `أهلاً${name ? ' ' + name : ''}` : `Welcome${name ? ', ' + name : ''}`}</h1>
            <p className="ac-hello">
              {na
                ? <>{isAr ? 'التالي: ' : 'Next: '}<button className="ac-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, font: 'inherit', color: 'var(--ac-ink)', fontWeight: 700, textDecoration: 'underline' }} onClick={() => nav(na.go)}>{na.t}</button></>
                : (s ? (isAr ? 'كل شيء تحت السيطرة اليوم 👌' : "You're all caught up 👌") : '…')}
            </p>
          </div>
        </div>

        <div className="ac-kpi-grid">
          {CARDS.map((c) => (
            <button key={c.k} className="ac-kpi" onClick={() => nav(c.go)}>
              <div className="ac-kpi-top">
                <span className={`ac-kpi-num${toneClass(c)}`}>{v(c.k) == null ? '·' : v(c.k)}</span>
                <span className="ac-kpi-ico"><KIco d={c.ico} /></span>
              </div>
              <p className="ac-kpi-lbl">{isAr ? c.ar : c.en}</p>
              <p className="ac-kpi-hint">{isAr ? c.hintAr : c.hintEn}</p>
            </button>
          ))}
        </div>

        <p className="ac-section-label">{isAr ? 'إجراءات سريعة' : 'Quick actions'}</p>
        <div className="ac-quickgrid">
          {QUICK.map((a, i) => (
            <button key={i} className="ac-quick-card" onClick={() => (a.go ? nav(a.go) : null)} style={{ opacity: a.go ? 1 : 0.6, cursor: a.go ? 'pointer' : 'default' }}>
              <span className="ac-quick-ico"><ShellIcon name={a.ico} size={19} /></span>
              <span style={{ minWidth: 0 }}>
                <span className="ac-quick-t" style={{ display: 'block' }}>{isAr ? a.ar : a.en}</span>
                <span className="ac-quick-s" style={{ display: 'block' }}>{isAr ? a.subAr : a.subEn}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </ConsoleShell>
  );
}
