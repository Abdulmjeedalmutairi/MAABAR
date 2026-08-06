import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsoleShell from '../../components/admin2/ConsoleShell';
import { fetchNotifications } from '../../lib/consoleNotifications';

const ICON = { message: '💬', quotation: '📄', registered: '✅', extraction: '📦', error: '⚠️', support: '🎫', bounce: '📭' };
const FILTERS = [
  { key: 'all', ar: 'الكل', en: 'All' },
  { key: 'message', ar: 'رسائل', en: 'Messages' },
  { key: 'quotation', ar: 'تسعيرات', en: 'Quotations' },
  { key: 'registered', ar: 'تسجيلات', en: 'Registrations' },
  { key: 'catalog', ar: 'كتالوجات', en: 'Catalogs' },
  { key: 'support', ar: 'دعم', en: 'Support' },
  { key: 'bounce', ar: 'مرتدّة', en: 'Bounces' },
];

const rel = (iso, isAr) => {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return isAr ? 'الآن' : 'now';
  if (mins < 60) return isAr ? `${mins} د` : `${mins}m`;
  const h = Math.floor(mins / 60);
  if (h < 24) return isAr ? `${h} س` : `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return isAr ? `${d} يوم` : `${d}d`;
  return isAr ? `${Math.floor(d / 30)} شهر` : `${Math.floor(d / 30)}mo`;
};

export default function ConsoleNotifications({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchNotifications().then(setRows).catch(() => setRows([])); }, []);

  const counts = useMemo(() => {
    const c = { all: 0 };
    (rows || []).forEach((r) => { c.all++; c[r.group] = (c[r.group] || 0) + 1; });
    return c;
  }, [rows]);

  const shown = (rows || []).filter((r) => filter === 'all' || r.group === filter);

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="notifs">
      <div className="ac-page" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', maxWidth: 820 }}>
        <div className="ac-page-head">
          <div>
            <h1 className="ac-h1">{isAr ? 'الإشعارات' : 'Notifications'}</h1>
            <p className="ac-sub">{isAr ? 'كل ما يحدث على المنصّة في مكان واحد.' : 'Everything happening on the platform, in one inbox.'}</p>
          </div>
          <button className="ac-btn ac-btn-sm" onClick={() => { setRows(null); fetchNotifications().then(setRows).catch(() => setRows([])); }}>
            {isAr ? 'تحديث' : 'Refresh'}
          </button>
        </div>

        <div className="ac-chiprow" style={{ marginBottom: 18 }}>
          {FILTERS.map((f) => (
            <button key={f.key} className={`ac-chip${filter === f.key ? ' on' : ''}`} onClick={() => setFilter(f.key)}>
              {isAr ? f.ar : f.en}{counts[f.key] ? <span style={{ opacity: 0.6, marginInlineStart: 4 }}>{counts[f.key]}</span> : null}
            </button>
          ))}
        </div>

        {rows == null ? (
          <div className="ac-skel" style={{ height: 90 }} />
        ) : shown.length === 0 ? (
          <div className="ac-placeholder">{isAr ? 'لا شيء هنا بعد.' : 'Nothing here yet.'}</div>
        ) : shown.map((r, i) => (
          <button key={i} className="ac-card" onClick={() => nav(r.link)}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 8, width: '100%', textAlign: isAr ? 'right' : 'left', cursor: 'pointer', border: '1px solid var(--ac-line)', fontFamily: 'inherit' }}>
            <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden>{ICON[r.type] || '•'}</span>
            <span style={{ minWidth: 0, flex: 1 }}>
              <span style={{ display: 'block', fontSize: 13.5, fontWeight: 650, color: 'var(--ac-ink)' }}>{isAr ? r.title_ar : r.title_en}</span>
              {r.sub ? <span style={{ display: 'block', fontSize: 12, color: 'var(--ac-faint)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.sub}</span> : null}
            </span>
            {r.tone && <span className={`ac-badge ${r.tone}`} style={{ height: 8, width: 8, padding: 0, borderRadius: '50%' }} />}
            <span style={{ fontSize: 11.5, color: 'var(--ac-faint)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{rel(r.at, isAr)}</span>
          </button>
        ))}
      </div>
    </ConsoleShell>
  );
}
