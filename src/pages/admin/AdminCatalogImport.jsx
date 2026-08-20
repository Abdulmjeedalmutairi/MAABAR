import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import { fetchImports, createImport, triggerExtraction, workerConfigured, hashFile, findImportByHash, embedProductsBackfill } from '../../lib/catalogImport';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY = "'Tajawal', sans-serif";

const STATUS_META = {
  queued:     { en: 'Queued', ar: 'بالانتظار', color: '#6B6560', bg: 'rgba(0,0,0,0.05)' },
  extracting: { en: 'Extracting', ar: 'جارٍ الاستخراج', color: '#6B6560', bg: 'rgba(0,0,0,0.05)' },
  extracted:  { en: 'Ready to review', ar: 'جاهز للمراجعة', color: '#b8860b', bg: 'rgba(201,134,63,0.12)' },
  reviewing:  { en: 'In review', ar: 'قيد المراجعة', color: '#2c6fb0', bg: 'rgba(44,111,176,0.12)' },
  approved:   { en: 'Approved', ar: 'معتمد', color: '#3f9d5a', bg: 'rgba(63,157,90,0.14)' },
  failed:     { en: 'Failed', ar: 'فشل', color: '#c0392b', bg: 'rgba(192,57,43,0.10)' },
};

const TABS = [
  { key: 'all',       en: 'All',      ar: 'الكل' },
  { key: 'extracted', en: 'To review', ar: 'للمراجعة' },
  { key: 'reviewing', en: 'In review', ar: 'قيد المراجعة' },
  { key: 'approved',  en: 'Approved',  ar: 'معتمد' },
];

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function StatusPill({ status, lang }) {
  const m = STATUS_META[status] || STATUS_META.extracting;
  return (
    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
      color: m.color, background: m.bg, fontFamily: FONT_BODY, whiteSpace: 'nowrap' }}>
      {lang === 'ar' ? m.ar : m.en}
    </span>
  );
}

const SHARED_CSS = (isAr) => `
  .a-page { padding: 36px 32px; max-width: 1080px; }
  .a-page-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FONT_HEADING}; line-height: 1.1; }
  .a-page-sub { margin: 0 0 24px; font-size: 12px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .a-tabs { display: flex; gap: 4px; margin-bottom: 18px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .a-tabs::-webkit-scrollbar { display: none; }
  .a-tab { flex-shrink: 0; padding: 6px 14px; border-radius: 99px; border: 1px solid rgba(0,0,0,0.09); background: transparent; cursor: pointer; font-size: 12px; color: rgba(0,0,0,0.45); min-height: 34px; transition: all 0.12s; white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-tab.on { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
  .a-tab:not(.on):hover { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.72); }
  .a-error { margin: 0 0 16px; padding: 11px 14px; border-radius: 8px; background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.18); color: #c0392b; font-size: 12px; font-family: ${FONT_BODY}; }
  .a-table-wrap { border-radius: 10px; border: 1px solid rgba(0,0,0,0.07); overflow: hidden; }
  .a-table { width: 100%; border-collapse: collapse; }
  .a-table th { padding: 11px 16px; font-size: 10px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; color: rgba(0,0,0,0.38); text-align: ${isAr ? 'right' : 'left'}; background: var(--bg-subtle, #F5F2EE); border-bottom: 1px solid rgba(0,0,0,0.06); white-space: nowrap; font-family: ${FONT_BODY}; }
  .a-table td { padding: 13px 16px; font-size: 13px; color: rgba(0,0,0,0.80); border-bottom: 1px solid rgba(0,0,0,0.05); vertical-align: middle; font-family: ${FONT_BODY}; }
  .a-table tr:last-child td { border-bottom: none; }
  .a-table tbody tr { cursor: pointer; transition: background 0.1s; }
  .a-table tbody tr:hover td { background: rgba(0,0,0,0.025); }
  .a-empty { text-align: center; padding: 40px 20px; color: rgba(0,0,0,0.30); font-family: ${FONT_BODY}; font-size: 13px; }
  .a-cards { display: none; flex-direction: column; gap: 8px; }
  .a-card { background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 15px; cursor: pointer; transition: border-color 0.12s; }
  .a-card:active { border-color: rgba(0,0,0,0.15); }
  .a-card-meta { font-size: 10px; color: rgba(0,0,0,0.35); font-family: ${FONT_BODY}; letter-spacing: 0.8px; text-transform: uppercase; margin-bottom: 2px; }
  .a-card-val { font-size: 13px; color: rgba(0,0,0,0.75); font-family: ${FONT_BODY}; }
  @media (max-width: 900px) { .a-page { padding: 22px 16px; } }
  @media (max-width: 768px) { .a-table-wrap { display: none; } .a-cards { display: flex; } }
  @media (min-width: 769px) { .a-cards { display: none; } }
`;

export default function AdminCatalogImport({ user, profile, lang }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [imports, setImports] = useState([]);
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [importMode, setImportMode] = useState('curated');   // 'curated' | 'full'
  const [selFile, setSelFile] = useState(null);
  const [fileHash, setFileHash] = useState(null);
  const [dupChecking, setDupChecking] = useState(false);
  const [dup, setDup] = useState(null);   // prior import of the same file, or null
  const fileRef = useRef(null);
  const [embedding, setEmbedding] = useState(false);
  const [embedMsg, setEmbedMsg] = useState('');

  async function rebuildSemanticIndex() {
    if (embedding) return;
    setEmbedding(true); setEmbedMsg(isAr ? 'جارٍ الفهرسة…' : 'Indexing…');
    try {
      await embedProductsBackfill({
        onProgress: ({ embedded, remaining }) => setEmbedMsg(
          isAr ? `${embedded} مُفهرَس · ${remaining} متبقٍ` : `${embedded} indexed · ${remaining} left`),
      });
      setEmbedMsg(isAr ? 'اكتمل فهرس البحث ✓' : 'Search index complete ✓');
    } catch (e) {
      setEmbedMsg((isAr ? 'تعذّرت الفهرسة: ' : 'Indexing failed: ') + (e.message || ''));
    }
    setEmbedding(false);
  }

  const load = useCallback(async () => {
    setLoading(true);
    try { setImports(await fetchImports()); setError(''); }
    catch (e) { setError(e.message || 'Query failed'); setImports([]); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const openModal = () => { setNotes(''); setImportMode('curated'); setSelFile(null); setFileHash(null); setDup(null); setError(''); setModalOpen(true); };
  const closeModal = () => { if (!uploading) { setModalOpen(false); setSelFile(null); setFileHash(null); setDup(null); setNotes(''); } };

  const onFileChosen = async (e) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';   // allow re-picking the same file
    if (!file) return;
    if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) {
      setError(isAr ? 'الملف يجب أن يكون PDF.' : 'File must be a PDF.'); return;
    }
    setError(''); setSelFile(file); setDup(null); setFileHash(null);
    // Fingerprint the file + check for a prior import of the SAME content.
    setDupChecking(true);
    try {
      const h = await hashFile(file);
      setFileHash(h);
      setDup(await findImportByHash(h));
    } catch { /* dedupe is best-effort — never blocks the upload */ }
    setDupChecking(false);
  };

  const doUpload = async () => {
    if (!selFile || uploading) return;
    setUploading(true); setError(''); setUploadPct(0);
    try {
      const importId = await createImport(selFile, notes, importMode, fileHash,
        (f) => setUploadPct(Math.round(f * 100)));
      // Notes are saved on the row; extraction stays automatic.
      if (workerConfigured()) triggerExtraction(importId).catch(() => {});
      nav(`/admin/catalog-import/${importId}`);
    } catch (err) {
      setError((isAr ? 'تعذّر الرفع: ' : 'Upload failed: ') + (err.message || ''));
      setUploading(false);
    }
  };

  const shown = tab === 'all' ? imports : imports.filter((r) => r.status === tab);
  const factoryName = (r) => r.factory_fields?.name_original || r.factory_fields?.name_en || '—';
  const factorySub = (r) => {
    const en = r.factory_fields?.name_en;
    return en && en !== r.factory_fields?.name_original && en !== 'not_found' ? en : null;
  };

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{SHARED_CSS(isAr)}</style>
        <div className="a-page" dir={isAr ? 'rtl' : 'ltr'}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div>
              <h1 className="a-page-title">{isAr ? 'استيراد الكتالوج' : 'Catalog Import'}</h1>
              <p className="a-page-sub">
                {loading ? '…' : `${shown.length} ${isAr ? 'دفعة' : 'import' + (shown.length !== 1 ? 's' : '')}`}
              </p>
            </div>
            <div style={{ textAlign: isAr ? 'left' : 'right' }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: isAr ? 'flex-start' : 'flex-end', flexWrap: 'wrap' }}>
                {workerConfigured() && (
                  <button
                    onClick={rebuildSemanticIndex}
                    disabled={embedding}
                    title={isAr ? 'يُنشئ متجهات البحث الدلالي للمنتجات الجديدة (يربط المرادفات مثل كنب↔أريكة)'
                                : 'Builds semantic-search vectors for new products (bridges synonyms like كنب↔Sofa)'}
                    style={{ background: '#fff', color: '#1a1814', border: '1px solid #d9d2c4', borderRadius: 8, padding: '10px 16px',
                      fontSize: 13, fontWeight: 600, cursor: embedding ? 'default' : 'pointer', opacity: embedding ? 0.6 : 1, fontFamily: FONT_BODY }}>
                    {embedding ? (isAr ? '… جارٍ الفهرسة' : '… Indexing') : (isAr ? '⟳ فهرسة البحث الدلالي' : '⟳ Rebuild search index')}
                  </button>
                )}
                <button
                  onClick={openModal}
                  style={{ background: '#1a1814', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT_BODY }}>
                  {isAr ? '+ استيراد كتالوج جديد' : '+ New catalog import'}
                </button>
              </div>
              {embedMsg && (
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#6b6357', fontFamily: FONT_BODY }}>{embedMsg}</p>
              )}
              {!workerConfigured() && (
                <p style={{ margin: '6px 0 0', fontSize: 11, color: '#b8860b', fontFamily: FONT_BODY }}>
                  {isAr ? 'خادم الاستخراج غير مُعدّ بعد — سيُرفع الملف ويبقى بانتظار الاستخراج.' : 'Extraction worker not configured — the file uploads and waits.'}
                </p>
              )}
            </div>
          </div>

          <div className="a-tabs">
            {TABS.map((t) => (
              <button key={t.key} className={`a-tab${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}>
                {isAr ? t.ar : t.en}
              </button>
            ))}
          </div>

          {error && <div className="a-error">{isAr ? 'تعذّر التحميل: ' : 'Failed to load: '}{error}</div>}

          {modalOpen && (
            <div onClick={closeModal}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 2000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              <div onClick={(e) => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'}
                style={{ background: '#fff', borderRadius: 14, padding: '22px 24px', width: '100%', maxWidth: 480,
                  fontFamily: FONT_BODY, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 400, fontFamily: FONT_HEADING, color: 'rgba(0,0,0,0.88)' }}>
                  {isAr ? 'استيراد كتالوج جديد' : 'New catalog import'}
                </h2>
                <p style={{ margin: '0 0 16px', fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                  {isAr ? 'اختر ملف PDF، وأضِف توجيهات اختيارية لهذا الكتالوج ثم يبدأ الاستخراج تلقائياً.'
                        : 'Choose a PDF, optionally add guidance for this catalog, then extraction runs automatically.'}
                </p>

                {/* Extraction mode — curated highlight reel vs every product */}
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(0,0,0,0.55)', marginBottom: 6 }}>
                  {isAr ? 'نطاق الاستخراج' : 'Extraction scope'}
                </label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  {[
                    { key: 'curated', ar: 'منتقى', en: 'Curated', arSub: 'أفضل المنتجات الممثِّلة', enSub: 'Best representative products' },
                    { key: 'full', ar: 'كامل', en: 'Full', arSub: 'كل المنتجات في الكتالوج', enSub: 'Every product in the catalog' },
                  ].map((m) => {
                    const on = importMode === m.key;
                    return (
                      <button key={m.key} type="button" onClick={() => setImportMode(m.key)} disabled={uploading}
                        style={{ flex: '1 1 160px', textAlign: isAr ? 'right' : 'left', padding: '10px 12px', borderRadius: 8,
                          cursor: uploading ? 'default' : 'pointer', fontFamily: FONT_BODY,
                          border: `1.5px solid ${on ? '#1a1814' : 'rgba(0,0,0,0.15)'}`,
                          background: on ? 'rgba(26,24,20,0.04)' : 'transparent' }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: on ? '#1a1814' : 'rgba(0,0,0,0.7)' }}>
                          {isAr ? m.ar : m.en}{m.key === 'curated' ? (isAr ? ' (موصى به)' : ' (recommended)') : ''}
                        </div>
                        <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>{isAr ? m.arSub : m.enSub}</div>
                      </button>
                    );
                  })}
                </div>

                {/* Notes — "before upload" */}
                <label style={{ display: 'block', fontSize: 12, color: 'rgba(0,0,0,0.55)', marginBottom: 5 }}>
                  {isAr ? 'توجيهات لهذا الكتالوج (اختياري)' : 'Guidance for this catalog (optional)'}
                </label>
                <textarea
                  value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} disabled={uploading}
                  dir={isAr ? 'rtl' : 'ltr'}
                  placeholder={isAr ? 'مثال: تجاهل أول ٣ صفحات · الأكواد المطبوعة هي OE numbers مو أسماء · كل صورة فيها أكثر من منتج لا تفصلها'
                                    : 'e.g. ignore the first 3 pages · printed codes are OE numbers, not names · each photo shows several products, don’t split'}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: '1px solid rgba(0,0,0,0.15)',
                    borderRadius: 8, fontSize: 13, fontFamily: FONT_BODY, resize: 'vertical', minHeight: 64, marginBottom: 16 }} />

                {/* File picker */}
                <input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={onFileChosen} style={{ display: 'none' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
                  <button onClick={() => fileRef.current?.click()} disabled={uploading}
                    style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.2)', borderRadius: 8, padding: '9px 16px',
                      fontSize: 13, cursor: 'pointer', fontFamily: FONT_BODY }}>
                    {isAr ? 'اختر ملف PDF' : 'Choose PDF'}
                  </button>
                  <span style={{ fontSize: 12.5, color: selFile ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }}>
                    {selFile ? selFile.name : (isAr ? 'لم يُختَر ملف' : 'No file chosen')}
                  </span>
                  {dupChecking && (
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.4)' }}>{isAr ? '· جارٍ التحقق…' : '· checking…'}</span>
                  )}
                </div>

                {/* Duplicate warning — the same file content was imported before */}
                {dup && (
                  <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 8, background: 'rgba(184,134,11,0.08)',
                    border: '1px solid rgba(184,134,11,0.28)' }}>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#8a6d0b', marginBottom: 3 }}>
                      {isAr ? '⚠ نفس الملف مستورد من قبل' : '⚠ This exact file was already imported'}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>
                      {(dup.factory_fields?.name_original || dup.factory_fields?.name_en || dup.original_filename || '—')}
                      {' · '}{fmtDate(dup.created_at)}
                      {' · '}{(STATUS_META[dup.status] ? (isAr ? STATUS_META[dup.status].ar : STATUS_META[dup.status].en) : dup.status)}
                    </div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                      <button type="button" onClick={() => nav(`/admin/catalog-import/${dup.id}`)}
                        style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
                          fontSize: 12.5, fontWeight: 600, color: '#8a6d0b', fontFamily: FONT_BODY }}>
                        {isAr ? 'افتح الاستيراد الموجود ←' : 'Open the existing import →'}
                      </button>
                      <span style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.45)' }}>
                        {isAr ? 'أو تابع الرفع لو هذي نسخة محدّثة.' : 'Or continue if this is an updated version.'}
                      </span>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10, justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
                  <button onClick={closeModal} disabled={uploading}
                    style={{ background: 'transparent', border: '1px solid rgba(0,0,0,0.15)', borderRadius: 8, padding: '9px 16px',
                      fontSize: 13, cursor: uploading ? 'default' : 'pointer', fontFamily: FONT_BODY }}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button onClick={doUpload} disabled={!selFile || uploading}
                    style={{ background: '#1a1814', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px',
                      fontSize: 13, fontWeight: 600, fontFamily: FONT_BODY,
                      cursor: (!selFile || uploading) ? 'default' : 'pointer', opacity: (!selFile || uploading) ? 0.55 : 1 }}>
                    {uploading ? (isAr ? `جارٍ الرفع… ${uploadPct}%` : `Uploading… ${uploadPct}%`) : (isAr ? 'رفع + استخراج' : 'Upload + extract')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Desktop table */}
          <div className="a-table-wrap">
            <table className="a-table">
              <thead>
                <tr>
                  <th>{isAr ? 'المصنع' : 'Factory'}</th>
                  <th>{isAr ? 'الملف' : 'File'}</th>
                  <th>{isAr ? 'المنتجات' : 'Products'}</th>
                  <th>{isAr ? 'الصفحات' : 'Pages'}</th>
                  <th>{isAr ? 'الحالة' : 'Status'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'جارٍ التحميل...' : 'Loading…'}</div></td></tr>}
                {!loading && !error && shown.length === 0 && <tr><td colSpan={6}><div className="a-empty">{isAr ? 'لا توجد عمليات استيراد بعد' : 'No imports yet'}</div></td></tr>}
                {!loading && shown.map((r) => (
                  <tr key={r.id} onClick={() => nav(`/admin/catalog-import/${r.id}`)}>
                    <td>
                      <div style={{ fontWeight: 500, color: 'rgba(0,0,0,0.85)' }}>{factoryName(r)}</div>
                      {factorySub(r) && <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', marginTop: 1 }}>{factorySub(r)}</div>}
                    </td>
                    <td style={{ fontSize: 12, color: 'rgba(0,0,0,0.55)' }}>{r.original_filename || '—'}</td>
                    <td style={{ fontVariantNumeric: 'lining-nums' }}>{r.product_count}</td>
                    <td style={{ fontVariantNumeric: 'lining-nums', color: 'rgba(0,0,0,0.45)' }}>{r.page_count ?? '—'}</td>
                    <td><StatusPill status={r.status} lang={lang} /></td>
                    <td style={{ fontSize: 12, color: 'rgba(0,0,0,0.40)', fontVariantNumeric: 'lining-nums' }}>{fmtDate(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="a-cards">
            {loading && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>}
            {!loading && !error && shown.length === 0 && <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'لا توجد عمليات استيراد بعد' : 'No imports yet'}</p>}
            {!loading && shown.map((r) => (
              <div key={r.id} className="a-card" onClick={() => nav(`/admin/catalog-import/${r.id}`)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, fontFamily: FONT_BODY, color: 'rgba(0,0,0,0.85)' }}>{factoryName(r)}</div>
                  <StatusPill status={r.status} lang={lang} />
                </div>
                <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
                  {[
                    [isAr ? 'الملف' : 'FILE', r.original_filename],
                    [isAr ? 'المنتجات' : 'PRODUCTS', String(r.product_count)],
                    [isAr ? 'الصفحات' : 'PAGES', r.page_count != null ? String(r.page_count) : null],
                    [isAr ? 'التاريخ' : 'DATE', fmtDate(r.created_at)],
                  ].filter(([, v]) => v).map(([label, val]) => (
                    <div key={label}>
                      <div className="a-card-meta">{label}</div>
                      <div className="a-card-val">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
