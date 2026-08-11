import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ConsoleShell from '../../components/admin2/ConsoleShell';
import { sb } from '../../supabase';
import { displayCategoryForCode } from '../../lib/factoryCategories';

// A read-first admin table of every factory's contact channels, flagging the
// ones with a missing/invalid email or phone so the team can fix them before
// reaching out (the factory quote-request email is sent to factory_directory.email).
const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());
const validPhone = (v) => (v || '').replace(/[^\d]/g, '').length >= 7;

const RED = '#c0392b';
const tdS = { padding: '10px 12px', verticalAlign: 'top' };

function Th({ children, isAr }) {
  return <th style={{ padding: '10px 12px', fontWeight: 600, fontSize: 12, color: 'var(--text-secondary)', textAlign: isAr ? 'right' : 'left', whiteSpace: 'nowrap' }}>{children}</th>;
}
function Stat({ n, label, bad }) {
  return (
    <div style={{ padding: '10px 16px', borderRadius: 12, border: '1px solid var(--border-subtle)', background: bad ? 'rgba(192,57,43,0.06)' : 'var(--bg-raised)', minWidth: 120 }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: bad ? RED : 'var(--text-primary)' }}>{n}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>{label}</div>
    </div>
  );
}

export default function ConsoleFactoryContacts({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [onlyIssues, setOnlyIssues] = useState(false);
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

  const enriched = useMemo(() => (rows || []).map((f) => {
    const email = nf(f.email);
    const phone = nf(f.phone);
    const emailOk = validEmail(email);
    const phoneOk = validPhone(phone);
    return { ...f, email, phone, emailOk, phoneOk, hasIssue: !emailOk || !phoneOk };
  }), [rows]);

  const filtered = useMemo(() => {
    let list = enriched;
    if (onlyIssues) list = list.filter((f) => f.hasIssue);
    const s = q.trim().toLowerCase();
    if (s) list = list.filter((f) => [f.company_name, f.company_name_latin, f.email, f.phone, f.city]
      .filter(Boolean).some((v) => String(v).toLowerCase().includes(s)));
    return list;
  }, [enriched, onlyIssues, q]);

  const stats = useMemo(() => ({
    total: enriched.length,
    noEmail: enriched.filter((f) => !f.emailOk).length,
    noPhone: enriched.filter((f) => !f.phoneOk).length,
  }), [enriched]);

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="factory-contacts">
      <div className="ac-page">
        <div className="ac-page-head">
          <div>
            <h1 className="ac-h1" style={font}>{isAr ? 'تواصل المصانع' : 'Factory Contacts'}</h1>
            <p className="ac-sub" style={font}>{isAr ? 'راجع بيانات التواصل — المُعلَّم بالأحمر إيميل أو جوال ناقص/غير صحيح.' : 'Review contact details — red = a missing or invalid email/phone.'}</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <Stat n={stats.total} label={isAr ? 'مصنع' : 'Factories'} />
          <Stat n={stats.noEmail} label={isAr ? 'إيميل ناقص/غلط' : 'Email missing/invalid'} bad={stats.noEmail > 0} />
          <Stat n={stats.noPhone} label={isAr ? 'جوال ناقص/غلط' : 'Phone missing/invalid'} bad={stats.noPhone > 0} />
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <input className="ac-input" style={{ flex: '1 1 260px', ...font }}
            placeholder={isAr ? 'ابحث باسم / إيميل / جوال…' : 'Search name / email / phone…'}
            value={q} onChange={(e) => setQ(e.target.value)} />
          <button className={`ac-btn${onlyIssues ? ' ac-btn-primary' : ''}`} style={font} onClick={() => setOnlyIssues((v) => !v)} type="button">
            {isAr ? 'الناقص فقط' : 'Issues only'}
          </button>
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
                  <Th isAr={isAr}>{isAr ? 'الموقع' : 'Website'}</Th>
                  <Th isAr={isAr}> </Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((f) => {
                  const name = nf(f.company_name_latin) || nf(f.company_name) || '—';
                  const cat = displayCategoryForCode(f.category);
                  return (
                    <tr key={f.id} style={{ borderTop: '1px solid var(--border-subtle)', background: f.hasIssue ? 'rgba(192,57,43,0.045)' : 'transparent' }}>
                      <td style={tdS}>
                        <div style={{ fontWeight: 600 }} dir="ltr">{name}</div>
                        {nf(f.city) && <div style={{ color: 'var(--text-tertiary)', fontSize: 12 }}>{f.city}</div>}
                        {!f.is_active && <span className="ac-badge warn" style={{ fontSize: 10 }}>{isAr ? 'مخفي' : 'Hidden'}</span>}
                      </td>
                      <td style={tdS}>{cat ? (cat.label[lang] || cat.label.en) : '—'}</td>
                      <td style={{ ...tdS, color: f.emailOk ? 'var(--text-primary)' : RED, fontWeight: f.emailOk ? 400 : 600 }} dir="ltr">
                        {f.email || (isAr ? '— ناقص' : '— missing')}
                      </td>
                      <td style={{ ...tdS, color: f.phoneOk ? 'var(--text-primary)' : RED, fontWeight: f.phoneOk ? 400 : 600 }} dir="ltr">
                        {f.phone || (isAr ? '— ناقص' : '— missing')}
                      </td>
                      <td style={tdS} dir="ltr">{nf(f.wechat) || '—'}</td>
                      <td style={tdS} dir="ltr">{nf(f.website) ? <a href={f.website} target="_blank" rel="noreferrer">{isAr ? 'رابط' : 'link'}</a> : '—'}</td>
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
