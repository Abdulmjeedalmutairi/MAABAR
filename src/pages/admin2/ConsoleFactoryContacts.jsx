import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsoleShell from '../../components/admin2/ConsoleShell';
import { sb } from '../../supabase';
import { displayCategoryForCode } from '../../lib/factoryCategories';

// Admin view of every factory's contact channels, split into READY (a valid,
// unique, clean email — usable for the quote-request outreach) vs NEEDS ATTENTION
// (missing / malformed / placeholder-duplicate / hidden-character email). Row
// "Edit" opens the factory detail to fix it.
const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());
const validPhone = (v) => (v || '').replace(/[^\d]/g, '').length >= 7;
// invisible / bidi / zero-width chars that silently corrupt a value
const hasHidden = (v) => /[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/.test(v || '');

const RED = '#c0392b';
const tdS = { padding: '10px 12px', verticalAlign: 'top' };

function Th({ children, isAr }) {
  return <th style={{ padding: '10px 12px', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textAlign: isAr ? 'right' : 'left', whiteSpace: 'nowrap' }}>{children}</th>;
}
function Stat({ n, label, tone }) {
  const bad = tone === 'bad'; const ok = tone === 'ok';
  return (
    <div style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: bad ? 'rgba(192,57,43,0.06)' : ok ? 'rgba(45,106,79,0.07)' : 'var(--bg-raised)', minWidth: 120 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: bad ? RED : ok ? '#2D6A4F' : 'var(--text-primary)' }}>{n}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}
function ReasonChip({ reason, isAr }) {
  const M = {
    noEmail: { ar: 'بلا إيميل', en: 'No email' },
    format: { ar: 'صيغة غير صحيحة', en: 'Invalid format' },
    hidden: { ar: 'حرف مخفي', en: 'Hidden character' },
    dup: { ar: 'إيميل مكرّر', en: 'Duplicate email' },
  };
  const t = M[reason]; if (!t) return null;
  return <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 600, color: RED, background: 'rgba(192,57,43,0.10)', border: '1px solid rgba(192,57,43,0.30)', borderRadius: 999, padding: '2px 9px' }}>{isAr ? t.ar : t.en}</span>;
}

export default function ConsoleFactoryContacts({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [tab, setTab] = useState('attn'); // 'attn' | 'ready' | 'all'
  const font = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error } = await sb.from('factory_directory')
        .select('id, company_name, company_name_latin, category, email, phone, wechat, website, city, is_active')
        .order('company_name_latin', { ascending: true });
      if (!alive) return;
      if (error) { setErr(error.message); setRows([]); return; }
      setRows(data || []);
    })();
    return () => { alive = false; };
  }, []);

  const enriched = useMemo(() => {
    const list = rows || [];
    // count each email (normalized) to catch placeholders/duplicates shared across factories
    const counts = {};
    list.forEach((f) => { const e = nf(f.email).toLowerCase(); if (e) counts[e] = (counts[e] || 0) + 1; });
    return list.map((f) => {
      const email = nf(f.email);
      const phone = nf(f.phone);
      let reason = null;
      if (!email) reason = 'noEmail';
      else if (hasHidden(email)) reason = 'hidden';
      else if (!validEmail(email)) reason = 'format';
      else if (counts[email.toLowerCase()] > 1) reason = 'dup';
      return { ...f, email, phone, phoneOk: validPhone(phone), reason, ready: reason === null };
    });
  }, [rows]);

  const counts = useMemo(() => ({
    total: enriched.length,
    ready: enriched.filter((f) => f.ready).length,
    attn: enriched.filter((f) => !f.ready).length,
  }), [enriched]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (tab === 'ready') list = list.filter((f) => f.ready);
    else if (tab === 'attn') list = list.filter((f) => !f.ready);
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((f) => [f.company_name, f.company_name_latin, f.email, f.phone, f.city]
      .filter(Boolean).some((v) => String(v).toLowerCase().includes(s)));
    return list;
  }, [enriched, tab, q]);

  const Seg = ({ k, label }) => (
    <button type="button" onClick={() => setTab(k)}
      className={`ac-chip${tab === k ? ' on' : ''}`} style={font}>{label}</button>
  );

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="factory-contacts">
      <div className="ac-page">
        <div className="ac-page-head">
          <div>
            <h1 className="ac-h1" style={font}>{isAr ? 'تواصل المصانع' : 'Factory Contacts'}</h1>
            <p className="ac-sub" style={font}>{isAr ? 'مقسّمة لفئتين: جاهزة (إيميل صحيح ومميّز) وتحتاج مراجعة (ناقص/غير صحيح/مكرّر/حرف مخفي).' : 'Split into Ready (valid, unique email) and Needs attention (missing/invalid/duplicate/hidden-character).'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <Stat n={counts.total} label={isAr ? 'إجمالي المصانع' : 'Factories'} />
          <Stat n={counts.ready} label={isAr ? 'جاهزة' : 'Ready'} tone="ok" />
          <Stat n={counts.attn} label={isAr ? 'تحتاج مراجعة' : 'Needs attention'} tone="bad" />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Seg k="attn" label={`${isAr ? 'تحتاج مراجعة' : 'Needs attention'} (${counts.attn})`} />
          <Seg k="ready" label={`${isAr ? 'جاهزة' : 'Ready'} (${counts.ready})`} />
          <Seg k="all" label={`${isAr ? 'الكل' : 'All'} (${counts.total})`} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <input className="ac-input" style={{ width: '100%', maxWidth: 360, ...font }}
            placeholder={isAr ? 'ابحث باسم / إيميل / جوال…' : 'Search name / email / phone…'}
            value={q} onChange={(e) => setQ(e.target.value)} />
        </div>

        {err && <div className="ac-empty" style={font}>{err}</div>}
        {rows === null ? (
          <div className="ac-empty" style={font}>{isAr ? 'جارٍ التحميل…' : 'Loading…'}</div>
        ) : filtered.length === 0 ? (
          <div className="ac-empty" style={font}>{isAr ? 'لا نتائج.' : 'No results.'}</div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 12, background: 'var(--bg-raised)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, ...font }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)' }}>
                  <Th isAr={isAr}>{isAr ? 'المصنع' : 'Factory'}</Th>
                  <Th isAr={isAr}>{isAr ? 'الفئة' : 'Category'}</Th>
                  <Th isAr={isAr}>{isAr ? 'الإيميل' : 'Email'}</Th>
                  <Th isAr={isAr}>{isAr ? 'الجوال' : 'Phone'}</Th>
                  <Th isAr={isAr}>WeChat</Th>
                  <Th isAr={isAr}>{isAr ? 'الحالة' : 'Status'}</Th>
                  <Th isAr={isAr}> </Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const name = nf(f.company_name_latin) || nf(f.company_name) || '—';
                  const cat = displayCategoryForCode(f.category);
                  const emailBad = !!f.reason;
                  return (
                    <tr key={f.id} style={{ borderTop: '1px solid var(--border-subtle)', background: f.ready ? 'transparent' : 'rgba(192,57,43,0.045)' }}>
                      <td style={tdS}>
                        <div style={{ fontWeight: 600 }} dir="ltr">{name}</div>
                        {nf(f.city) && <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{f.city}</div>}
                        {!f.is_active && <span className="ac-badge warn" style={{ fontSize: 10 }}>{isAr ? 'مخفي' : 'Hidden'}</span>}
                      </td>
                      <td style={tdS}>{cat ? (cat.label[lang] || cat.label.en) : '—'}</td>
                      <td style={{ ...tdS, color: emailBad ? RED : 'var(--text-primary)', fontWeight: emailBad ? 600 : 400 }} dir="ltr">
                        {f.email || (isAr ? '— ناقص' : '— missing')}
                      </td>
                      <td style={{ ...tdS, color: f.phoneOk ? 'var(--text-primary)' : RED, fontWeight: f.phoneOk ? 400 : 600 }} dir="ltr">
                        {f.phone || (isAr ? '— ناقص' : '— missing')}
                      </td>
                      <td style={tdS} dir="ltr">{nf(f.wechat) || '—'}</td>
                      <td style={tdS}>
                        {f.ready
                          ? <span style={{ fontSize: 11, fontWeight: 600, color: '#2D6A4F', background: 'rgba(45,106,79,0.10)', border: '1px solid rgba(45,106,79,0.28)', borderRadius: 999, padding: '2px 9px' }}>{isAr ? 'جاهز' : 'Ready'}</span>
                          : <ReasonChip reason={f.reason} isAr={isAr} />}
                      </td>
                      <td style={tdS}>
                        <button className="ac-btn" style={{ padding: '4px 10px', ...font }} onClick={() => nav(`/admin2/suppliers/${f.id}`)} type="button">
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ConsoleShell>
  );
}
