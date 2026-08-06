import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../../supabase';
import {
  fetchFactoryImports, createImport, triggerExtraction, deleteImport,
  catalogSourceUrl, workerConfigured,
} from '../../lib/catalogImport';

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const rel = (iso, isAr) => {
  if (!iso) return '—';
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (d <= 0) return isAr ? 'اليوم' : 'today';
  if (d < 30) return isAr ? `${d} يوم` : `${d}d`;
  return isAr ? `${Math.floor(d / 30)} شهر` : `${Math.floor(d / 30)}mo`;
};

const IMPORT_BADGE = {
  queued: 'info', extracting: 'info', extracted: 'warn', reviewing: 'warn',
  approved: 'ok', failed: 'danger', cancelled: 'neutral',
};
const importLabel = (s, isAr) => {
  const ar = { queued: 'بالانتظار', extracting: 'جارٍ الاستخراج', extracted: 'بانتظار المراجعة', reviewing: 'قيد المراجعة', approved: 'معتمد', failed: 'فشل', cancelled: 'ملغى' };
  const en = { queued: 'Queued', extracting: 'Extracting', extracted: 'Needs review', reviewing: 'Reviewing', approved: 'Approved', failed: 'Failed', cancelled: 'Cancelled' };
  return (isAr ? ar : en)[s] || s;
};

// ── Catalogs ─────────────────────────────────────────────────────────────────
export function CatalogsTab({ factoryId, isAr, flash }) {
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  const [pct, setPct] = useState(null);   // upload %
  const fileRef = useRef(null);

  const load = async () => { try { setRows(await fetchFactoryImports(factoryId)); } catch { setRows([]); } };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [factoryId]);

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) { flash(isAr ? 'الملف يجب أن يكون PDF' : 'Must be a PDF'); return; }
    setPct(0);
    try {
      const importId = await createImport(file, '', 'curated', null, (f) => setPct(Math.round(f * 100)), factoryId);
      if (workerConfigured()) triggerExtraction(importId).catch(() => {});
      setPct(null);
      flash(isAr ? 'رُفع — جارٍ الاستخراج' : 'Uploaded — extracting');
      await load();
    } catch (err) { setPct(null); flash((isAr ? 'تعذّر الرفع: ' : 'Upload failed: ') + (err.message || '')); }
  };

  const download = async (r) => { const url = await catalogSourceUrl(r.source_pdf_path); if (url) window.open(url, '_blank'); else flash(isAr ? 'تعذّر فتح الملف' : 'Could not open file'); };
  const remove = async (r) => {
    if (!window.confirm(isAr ? 'حذف هذا الكتالوج ومنتجاته المستخرجة؟' : 'Delete this catalog and its extracted products?')) return;
    try { await deleteImport(r.id); setRows((rs) => rs.filter((x) => x.id !== r.id)); flash(isAr ? 'حُذف' : 'Deleted'); }
    catch { flash(isAr ? 'تعذّر الحذف' : 'Delete failed'); }
  };

  return (
    <div style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
      <div className="ac-toolbar">
        <button className="ac-btn ac-btn-primary" onClick={() => fileRef.current?.click()} disabled={pct !== null}>
          {pct !== null ? (isAr ? `جارٍ الرفع… ${pct}%` : `Uploading… ${pct}%`) : (isAr ? '+ رفع كتالوج (PDF)' : '+ Upload catalog (PDF)')}
        </button>
        <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={onPick} />
        <span style={{ fontSize: 12.5, color: 'var(--ac-faint)' }}>{rows ? (isAr ? `${rows.length} كتالوج` : `${rows.length} catalogs`) : '…'}</span>
      </div>

      {rows == null ? (
        <div className="ac-skel" style={{ height: 90 }} />
      ) : rows.length === 0 ? (
        <div className="ac-placeholder">{isAr ? 'لا كتالوجات بعد. ارفع PDF لبدء الاستخراج.' : 'No catalogs yet. Upload a PDF to start extraction.'}</div>
      ) : rows.map((r) => (
        <div className="ac-card" key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: 'var(--ac-ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {nf(r.catalog_title) || nf(r.original_filename) || '—'}
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: 12, color: 'var(--ac-faint)', flexWrap: 'wrap' }}>
              <span className={`ac-badge ${IMPORT_BADGE[r.status] || 'neutral'}`} style={{ height: 20 }}>{importLabel(r.status, isAr)}</span>
              {r.page_count ? <span>{r.page_count} {isAr ? 'صفحة' : 'pages'}</span> : null}
              <span>{r.product_count} {isAr ? 'منتج' : 'products'}</span>
              <span>{r.extraction_mode === 'full' ? (isAr ? 'كامل' : 'Full') : (isAr ? 'منتقى' : 'Curated')}</span>
              <span>{rel(r.created_at, isAr)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="ac-btn ac-btn-sm" onClick={() => nav(`/admin/catalog-import/${r.id}`)}>{isAr ? 'مراجعة' : 'Review'}</button>
            <button className="ac-btn ac-btn-sm" onClick={() => download(r)}>{isAr ? 'تنزيل' : 'Download'}</button>
            <button className="ac-iconbtn danger" onClick={() => remove(r)} title={isAr ? 'حذف' : 'Delete'}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Requests ─────────────────────────────────────────────────────────────────
export function RequestsTab({ factoryId, isAr, lang }) {
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    sb.from('request_factory_invites')
      .select('id, request_id, status, created_at, requests(id, title_ar, title_en, quantity, managed_status)')
      .eq('factory_id', factoryId).order('created_at', { ascending: false })
      .then(({ data }) => setRows(data || [])).then(null, () => setRows([]));
  }, [factoryId]);

  const title = (r) => (isAr ? (nf(r.requests?.title_ar) || nf(r.requests?.title_en)) : (nf(r.requests?.title_en) || nf(r.requests?.title_ar))) || (isAr ? 'طلب' : 'Request');
  const badge = { sent: 'info', opened: 'info', registered: 'warn', offer_submitted: 'ok' };
  const stLabel = (s) => {
    const ar = { sent: 'أُرسل', opened: 'فُتح', registered: 'سجّل', offer_submitted: 'قدّم عرضاً' };
    const en = { sent: 'Sent', opened: 'Opened', registered: 'Registered', offer_submitted: 'Quoted' };
    return (isAr ? ar : en)[s] || s;
  };

  if (rows == null) return <div className="ac-skel" style={{ height: 80 }} />;
  if (rows.length === 0) return <div className="ac-placeholder" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{isAr ? 'لا طلبات تسعير لهذا المورّد.' : 'No quotation requests for this supplier.'}</div>;
  return (
    <div style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
      {rows.map((r) => (
        <div className="ac-card" key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: 'var(--ac-ink)' }}>{title(r)}</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 5, fontSize: 12, color: 'var(--ac-faint)', flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={`ac-badge ${badge[r.status] || 'neutral'}`} style={{ height: 20 }}>{stLabel(r.status)}</span>
              {r.requests?.quantity ? <span>{isAr ? 'الكمية' : 'Qty'}: {r.requests.quantity}</span> : null}
              <span>{rel(r.created_at, isAr)}</span>
            </div>
          </div>
          <button className="ac-btn ac-btn-sm" onClick={() => nav(`/admin/concierge/${r.request_id}`)}>{isAr ? 'فتح الطلب' : 'Open request'}</button>
        </div>
      ))}
    </div>
  );
}

// ── Messages ─────────────────────────────────────────────────────────────────
export function MessagesTab({ factoryId, isAr, flash, onEmail }) {
  const nav = useNavigate();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    sb.from('factory_threads').select('id, share_slug, last_message_at, created_at')
      .eq('factory_id', factoryId).order('last_message_at', { ascending: false, nullsFirst: false })
      .then(({ data }) => setRows(data || [])).then(null, () => setRows([]));
  }, [factoryId]);

  const copyShare = (slug) => { try { navigator.clipboard.writeText(`${window.location.origin}/factory-chat/${slug}`); flash(isAr ? 'نُسخ رابط المحادثة' : 'Chat link copied'); } catch { /* noop */ } };

  return (
    <div style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
      {onEmail && (
        <div className="ac-toolbar" style={{ marginBottom: 12 }}>
          <button className="ac-btn ac-btn-primary ac-btn-sm" onClick={onEmail}>{isAr ? '✉ إرسال إيميل/دعوة للمورّد' : '✉ Email / invite the supplier'}</button>
          <span style={{ fontSize: 12, color: 'var(--ac-faint)' }}>{isAr ? 'نبّه المورّد ليرد على التاجر' : 'Nudge the supplier to reply'}</span>
        </div>
      )}
      {rows == null ? <div className="ac-skel" style={{ height: 80 }} />
        : rows.length === 0 ? <div className="ac-placeholder">{isAr ? 'لا محادثات مع هذا المورّد بعد.' : 'No conversations with this supplier yet.'}</div>
        : rows.map((t) => (
        <div className="ac-card" key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 650, color: 'var(--ac-ink)' }}>{isAr ? 'محادثة مع تاجر' : 'Trader conversation'}</p>
            <div style={{ fontSize: 12, color: 'var(--ac-faint)', marginTop: 4 }}>
              {isAr ? 'آخر رسالة' : 'Last message'}: {rel(t.last_message_at || t.created_at, isAr)}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {t.share_slug && <button className="ac-btn ac-btn-sm" onClick={() => copyShare(t.share_slug)}>{isAr ? 'رابط المشاركة' : 'Share link'}</button>}
            <button className="ac-btn ac-btn-sm" onClick={() => nav(`/admin/conversations/${t.id}`)}>{isAr ? 'فتح' : 'Open'}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
