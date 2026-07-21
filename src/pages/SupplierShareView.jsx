import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { SUPABASE_FUNCTIONS_URL, SUPABASE_ANON_KEY } from '../supabase';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const kindOf = (path = '') => {
  const p = String(path).toLowerCase().split('?')[0];
  if (/\.(mp4|mov|webm|m4v|avi|mkv)$/.test(p)) return 'video';
  if (/\.pdf$/.test(p)) return 'pdf';
  return 'image';
};

export default function SupplierShareView({ lang = 'ar' }) {
  const { token } = useParams();
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [viewerIdx, setViewerIdx] = useState(null);
  const isAr = lang === 'ar';

  useEffect(() => {
    // A shared verification dossier must never be indexed.
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow, noarchive';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/supplier-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
        body: JSON.stringify({ token }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) { setState({ loading: false, error: body?.error || 'invalid', data: null }); return; }
      setState({ loading: false, error: '', data: body });
    } catch {
      setState({ loading: false, error: 'network', data: null });
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const { loading, error, data } = state;
  const s = data?.supplier;
  const files = data?.files || {};

  const attachments = s ? [
    ...[
      [s.license_photo,        isAr ? 'السجل التجاري' : 'Business License'],
      [s.legal_rep_id_photo,   isAr ? 'هوية الممثل القانوني' : 'Legal Representative ID'],
      [s.address_proof_photo,  isAr ? 'إثبات العنوان' : 'Address Proof'],
    ].filter(([p]) => p).map(([raw, label]) => ({ raw, label, kind: kindOf(raw) })),
    ...Array.from(new Set([s.factory_photo, ...(Array.isArray(s.factory_images) ? s.factory_images : [])].filter(Boolean)))
      .map((raw, i) => ({ raw, label: `${isAr ? 'صورة المصنع' : 'Factory photo'} ${i + 1}`, kind: 'image' })),
    ...(Array.isArray(s.factory_videos) ? s.factory_videos.filter(Boolean) : [])
      .map((raw, i) => ({ raw, label: `${isAr ? 'فيديو المصنع' : 'Factory video'} ${i + 1}`, kind: 'video' })),
  ].map(a => ({ ...a, url: files[a.raw] || null })) : [];

  const viewerOpen = viewerIdx !== null;
  const current = viewerOpen ? attachments[Math.max(0, Math.min(viewerIdx, attachments.length - 1))] : null;

  useEffect(() => {
    if (!viewerOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setViewerIdx(null);
      if (e.key === 'ArrowRight') setViewerIdx(i => (i === null ? i : (i + 1) % attachments.length));
      if (e.key === 'ArrowLeft')  setViewerIdx(i => (i === null ? i : (i - 1 + attachments.length) % attachments.length));
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [viewerOpen, attachments.length]);

  const CSS = `
    .sv-wrap { min-height: 100dvh; background: var(--bg-page, #F5F3EF); padding: 0 0 64px; }
    .sv-hero { background: linear-gradient(160deg, var(--bg-hero,#EDE8DC) 0%, var(--bg-page,#F5F3EF) 65%); border-bottom: 1px solid var(--border,#E8E5DE); padding: 34px 24px 28px; }
    .sv-inner { max-width: 940px; margin: 0 auto; }
    .sv-eyebrow { margin: 0 0 10px; font-size: 10px; font-weight: 600; letter-spacing: 0.3em; text-transform: uppercase; color: #B0AB9E; font-family: ${FONT_BODY}; }
    .sv-name { margin: 0; font-size: 32px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FONT_HEADING}; line-height: 1.1; }
    .sv-sub { margin: 8px 0 0; font-size: 13px; color: #6B6560; font-family: ${FONT_BODY}; }
    .sv-body { max-width: 940px; margin: 0 auto; padding: 26px 24px 0; }
    .sv-card { background: #fff; border: 1px solid var(--border,#E8E5DE); border-radius: 12px; padding: 22px; margin-bottom: 16px; }
    .sv-card-title { margin: 0 0 16px; font-size: 11px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: rgba(0,0,0,0.40); font-family: ${FONT_BODY}; }
    .sv-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; }
    .sv-label { font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(0,0,0,0.35); font-family: ${FONT_BODY}; margin-bottom: 3px; }
    .sv-val { font-size: 14px; color: rgba(0,0,0,0.82); font-family: ${FONT_BODY}; word-break: break-word; }
    .sv-thumbs { display: flex; gap: 10px; flex-wrap: wrap; }
    .sv-thumb { position: relative; width: 138px; height: 112px; border-radius: 10px; overflow: hidden; cursor: pointer; padding: 0; border: 1px solid rgba(0,0,0,0.08); background: #F5F2EE; display: flex; align-items: center; justify-content: center; }
    .sv-thumb img, .sv-thumb video { width: 100%; height: 100%; object-fit: cover; }
    .sv-thumb-cap { position: absolute; left: 0; right: 0; bottom: 0; padding: 5px 7px; background: linear-gradient(transparent, rgba(0,0,0,0.62)); color: #fff; font-size: 9.5px; font-family: ${FONT_BODY}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .sv-note { max-width: 940px; margin: 0 auto; padding: 8px 24px 0; font-size: 11px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; line-height: 1.7; }
    .sv-msg { max-width: 520px; margin: 18vh auto; padding: 32px 24px; text-align: center; }
    @media (max-width: 700px) { .sv-hero { padding: 26px 16px 22px; } .sv-name { font-size: 25px; } .sv-body { padding: 20px 16px 0; } .sv-card { padding: 18px; } }
  `;

  if (loading) {
    return (<><style>{CSS}</style><div className="sv-wrap"><p className="sv-msg" style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>{isAr ? 'جارٍ التحميل…' : 'Loading…'}</p></div></>);
  }

  if (error || !s) {
    const msg = error === 'expired'
      ? (isAr ? 'انتهت صلاحية هذا الرابط.' : 'This link has expired.')
      : error === 'revoked'
        ? (isAr ? 'تم إلغاء هذا الرابط.' : 'This link has been revoked.')
        : error === 'rate_limited'
          ? (isAr ? 'محاولات كثيرة. حاول بعد قليل.' : 'Too many attempts. Please try again shortly.')
          : (isAr ? 'رابط غير صالح.' : 'This link is not valid.');
    return (
      <>
        <style>{CSS}</style>
        <div className="sv-wrap" dir={isAr ? 'rtl' : 'ltr'}>
          <div className="sv-msg">
            <p style={{ margin: '0 0 8px', fontSize: 22, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_HEADING }}>{msg}</p>
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY }}>
              {isAr ? 'اطلب رابطاً جديداً من معبر.' : 'Please request a new link from Maabar.'}
            </p>
          </div>
        </div>
      </>
    );
  }

  const Field = ({ label, value }) => value ? (
    <div><div className="sv-label">{label}</div><div className="sv-val">{value}</div></div>
  ) : null;

  return (
    <>
      <style>{CSS}</style>
      <div className="sv-wrap" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="sv-hero">
          <div className="sv-inner">
            <p className="sv-eyebrow">MAABAR · معبر — {isAr ? 'ملف مورد' : 'Supplier Dossier'}</p>
            <h1 className="sv-name">{s.company_name || s.full_name || '—'}</h1>
            <p className="sv-sub">
              {[s.maabar_supplier_id, s.country, s.city].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>

        <div className="sv-body">
          <div className="sv-card">
            <p className="sv-card-title">{isAr ? 'بيانات الشركة' : 'Company'}</p>
            <div className="sv-grid">
              <Field label={isAr ? 'اسم الشركة' : 'Company'} value={s.company_name} />
              <Field label={isAr ? 'المسؤول' : 'Contact'} value={s.full_name} />
              <Field label={isAr ? 'السجل التجاري' : 'Registration No.'} value={s.reg_number} />
              <Field label={isAr ? 'سنوات الخبرة' : 'Years of experience'} value={s.years_experience} />
              <Field label={isAr ? 'التخصص' : 'Speciality'} value={s.speciality} />
              <Field label={isAr ? 'الدولة' : 'Country'} value={s.country} />
              <Field label={isAr ? 'المدينة' : 'City'} value={s.city} />
              <Field label={isAr ? 'العنوان' : 'Address'} value={s.address} />
              <Field label="WhatsApp" value={s.whatsapp} />
              <Field label="WeChat" value={s.wechat} />
              <Field label={isAr ? 'رابط المتجر' : 'Trade link'} value={s.trade_link} />
              <Field label={isAr ? 'تاريخ التسجيل' : 'Registered'} value={fmtDate(s.created_at)} />
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="sv-card">
              <p className="sv-card-title">{isAr ? `المرفقات (${attachments.length})` : `Attachments (${attachments.length})`}</p>
              <div className="sv-thumbs">
                {attachments.map((att, i) => (
                  <button key={i} className="sv-thumb" onClick={() => setViewerIdx(i)} title={att.label}>
                    {att.url && att.kind === 'image' ? <img src={att.url} alt={att.label} />
                      : att.url && att.kind === 'video' ? <video src={att.url} preload="metadata" muted />
                      : <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(0,0,0,0.45)', fontFamily: FONT_BODY }}>{att.kind === 'pdf' ? 'PDF' : '…'}</span>}
                    <span className="sv-thumb-cap">{att.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <p className="sv-note">
          {isAr
            ? `رابط خاص للمراجعة — تنتهي صلاحيته في ${fmtDate(data.expiresAt)}. يحتوي على وثائق هوية؛ الرجاء عدم إعادة توجيهه.`
            : `Private review link — expires ${fmtDate(data.expiresAt)}. It contains identity documents; please do not forward it.`}
        </p>
      </div>

      {viewerOpen && current && (
        <div onClick={() => setViewerIdx(null)} style={{ position: 'fixed', inset: 0, zIndex: 5000, background: 'rgba(20,18,15,0.93)', display: 'flex', flexDirection: 'column' }}>
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 18px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }} dir={isAr ? 'rtl' : 'ltr'}>
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{current.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: FONT_BODY }}>{viewerIdx + 1} / {attachments.length}</p>
            </div>
            <button onClick={() => setViewerIdx(null)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.22)', background: 'transparent', color: '#fff', fontSize: 18, cursor: 'pointer' }}>×</button>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 14, minHeight: 0 }}>
            <button onClick={e => { e.stopPropagation(); setViewerIdx(i => (i - 1 + attachments.length) % attachments.length); }} style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>‹</button>
            <div onClick={e => e.stopPropagation()} style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 0 }}>
              {current.kind === 'image' ? <img src={current.url} alt={current.label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
                : current.kind === 'video' ? <video src={current.url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: 8, background: '#000' }} />
                : <iframe src={current.url} title={current.label} style={{ width: '100%', height: '100%', border: 'none', borderRadius: 8, background: '#fff' }} />}
            </div>
            <button onClick={e => { e.stopPropagation(); setViewerIdx(i => (i + 1) % attachments.length); }} style={{ width: 42, height: 42, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>›</button>
          </div>
        </div>
      )}
    </>
  );
}
