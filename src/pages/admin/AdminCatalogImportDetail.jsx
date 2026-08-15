import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import FactoryFieldsPanel from '../../components/admin/catalog/FactoryFieldsPanel';
import ProfileImagePicker from '../../components/admin/catalog/ProfileImagePicker';
import ProductReviewCard from '../../components/admin/catalog/ProductReviewCard';
import {
  fetchImport, fetchFactory, fetchFactories, resolveFactory, HIGH_CONF,
  approveProduct, bulkApproveHighConfidence, approveAllPending, skipProduct, finalizeImport,
  archiveFactory, deleteFactory, triggerExtraction, workerConfigured, updateImportNotes,
  cancelImport, deleteImport, assistField, assistAsk, updateImportFields, updateStagedProduct,
  uploadProfileImage, updateImportMode, uploadPriceFile, triggerPriceMatch,
} from '../../lib/catalogImport';
import { UI_CATEGORIES } from '../../lib/supplierDashboardConstants';

const FH = "'Cormorant Garamond', Georgia, serif";
const FB = "'Tajawal', sans-serif";

// Live extraction steps (order matches the worker's progress stages).
const EXTRACT_STEPS = [
  { key: 'upload', ar: 'رفع الملف', en: 'Upload' },
  { key: 'downloading', ar: 'التحضير', en: 'Prepare' },
  { key: 'images', ar: 'استخراج الصور', en: 'Read images' },
  { key: 'outline', ar: 'مخطّط الكتالوج', en: 'Catalog outline' },
  { key: 'analyzing', ar: 'تحليل الكتالوج', en: 'Analyze catalog' },
  { key: 'matching', ar: 'مطابقة الصور', en: 'Match images' },
  { key: 'uploading', ar: 'رفع الصور', en: 'Upload images' },
  { key: 'done', ar: 'الإنهاء', en: 'Finalize' },
];

const CSS = (isAr) => `
  .a-page { padding: 34px 30px; max-width: 900px; }
  .a-page-title { margin: 0 0 4px; font-size: 24px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FH}; line-height: 1.15; word-break: break-word; }
  .a-page-sub { margin: 0 0 20px; font-size: 12px; color: rgba(0,0,0,0.42); font-family: ${FB}; }
  .a-error { margin: 0 0 16px; padding: 11px 14px; border-radius: 8px; background: rgba(192,57,43,0.06); border: 1px solid rgba(192,57,43,0.18); color: #c0392b; font-size: 12px; font-family: ${FB}; }
  .ci-back { background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.45); font-size: 12px; font-family: ${FB}; padding: 0; margin-bottom: 12px; }
  .ci-back:hover { color: rgba(0,0,0,0.7); }
  .ci-card { background: var(--bg-raised,#fff); border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; padding: 20px 22px; margin-bottom: 16px; }
  .ci-h2 { margin: 0 0 14px; font-size: 14px; font-weight: 600; color: rgba(0,0,0,0.8); font-family: ${FB}; }
  .ci-label { display: block; font-size: 11px; color: rgba(0,0,0,0.5); font-family: ${FB}; margin-bottom: 4px; letter-spacing: 0.3px; }
  .ci-input { width: 100%; max-width: 420px; padding: 9px 12px; border: 1px solid rgba(0,0,0,0.14); border-radius: 8px; font-size: 14px; font-family: ${FB}; background: #fff; outline: none; box-sizing: border-box; }
  .ci-input:focus { border-color: rgba(0,0,0,0.35); }
  .ci-hint { font-size: 11.5px; color: rgba(0,0,0,0.4); font-family: ${FB}; margin: 4px 0 0; }
  .ci-seg { padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(0,0,0,0.14); background: transparent; cursor: pointer; font-size: 13px; font-family: ${FB}; }
  .ci-seg.on { background: #1a1814; color: #fff; border-color: #1a1814; }
  .ci-btn-primary { background: #1a1814; color: #fff; border: none; border-radius: 8px; padding: 11px 22px; font-size: 14px; cursor: pointer; font-family: ${FB}; }
  .ci-btn-primary:disabled { opacity: 0.55; cursor: default; }
  .ci-stat-n { font-size: 22px; font-weight: 600; color: rgba(0,0,0,0.85); font-family: ${FB}; font-variant-numeric: lining-nums; }
  .ci-stat-l { font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; color: rgba(0,0,0,0.4); font-family: ${FB}; margin-top: 2px; }
  .ci-conf { position: absolute; top: 6px; ${isAr ? 'left' : 'right'}: 6px; color: #fff; font-size: 11px; font-weight: 700; padding: 2px 7px; border-radius: 5px; font-family: ${FB}; }
  .ci-conf.hi { background: #3f9d5a; } .ci-conf.mid { background: #c9863f; } .ci-conf.lo { background: #c0503f; } .ci-conf.na { background: #999; }
  .ci-chip-ro { padding: 3px 10px; border-radius: 99px; background: rgba(0,0,0,0.05); font-size: 11.5px; color: rgba(0,0,0,0.6); font-family: ${FB}; }
  .ci-deck { border: 1px solid rgba(0,0,0,0.1); border-radius: 10px; padding: 16px; margin-top: 8px; outline: none; }
  .ci-deck:focus { border-color: rgba(0,0,0,0.28); box-shadow: 0 0 0 3px rgba(0,0,0,0.04); }
  .ci-deck-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; font-size: 13px; font-weight: 600; color: rgba(0,0,0,0.7); font-family: ${FB}; }
  .ci-deck-keys { font-size: 11px; font-weight: 400; color: rgba(0,0,0,0.4); }
  .ci-deck-nav { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; align-items: center; }
  .ci-btn-ghost { background: transparent; border: 1px solid rgba(0,0,0,0.14); border-radius: 8px; padding: 9px 16px; font-size: 13px; cursor: pointer; font-family: ${FB}; }
  .ci-btn-ghost:disabled { opacity: 0.4; cursor: default; }
  .ci-skip { background: transparent; border: 1px solid #c0503f; color: #c0503f; border-radius: 8px; padding: 9px 16px; font-size: 13px; cursor: pointer; font-family: ${FB}; }
  .ci-approve { background: #3f9d5a; color: #fff; border: none; border-radius: 8px; padding: 9px 20px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: ${FB}; margin-${isAr ? 'right' : 'left'}: auto; }
  .ci-approve:disabled, .ci-skip:disabled { opacity: 0.5; cursor: default; }
  .ci-prog-wrap { max-width: 520px; margin: 0 auto; }
  .ci-prog-track { height: 8px; border-radius: 99px; background: rgba(0,0,0,0.08); overflow: hidden; position: relative; }
  .ci-prog-fill { height: 100%; border-radius: 99px; background: linear-gradient(90deg, #c9863f, #8B7355); transition: width 0.5s ease; }
  .ci-prog-fill.pulse { background-size: 30px 30px; background-image: linear-gradient(45deg, rgba(255,255,255,0.28) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.28) 50%, rgba(255,255,255,0.28) 75%, transparent 75%, transparent); animation: ci-stripes 0.9s linear infinite; }
  @keyframes ci-stripes { from { background-position: 0 0; } to { background-position: 30px 0; } }
  .ci-prog-pct { font-variant-numeric: lining-nums; font-size: 12px; color: rgba(0,0,0,0.5); font-family: ${FB}; margin-top: 6px; }
  .ci-steps { display: flex; flex-direction: column; gap: 2px; max-width: 340px; margin: 20px auto 0; text-align: ${isAr ? 'right' : 'left'}; }
  .ci-step { display: flex; align-items: center; gap: 10px; padding: 7px 4px; font-size: 13px; font-family: ${FB}; color: rgba(0,0,0,0.35); }
  .ci-step.done { color: rgba(0,0,0,0.75); }
  .ci-step.active { color: #8B5e2b; font-weight: 600; }
  .ci-step-dot { width: 20px; height: 20px; border-radius: 99px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 12px; border: 1.5px solid rgba(0,0,0,0.15); background: #fff; }
  .ci-step.done .ci-step-dot { background: #3f9d5a; border-color: #3f9d5a; color: #fff; }
  .ci-step.active .ci-step-dot { border-color: #c9863f; }
  .ci-step.active .ci-step-dot::after { content: ''; width: 8px; height: 8px; border-radius: 99px; background: #c9863f; animation: ci-pulse 1s ease-in-out infinite; }
  @keyframes ci-pulse { 0%,100% { opacity: 0.35; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.15); } }
  @media (max-width: 900px) { .a-page { padding: 22px 16px; } }
`;

export default function AdminCatalogImportDetail({ user, profile, lang }) {
  const { id } = useParams();
  const nav = useNavigate();
  const isAr = lang === 'ar';

  const [batch, setBatch] = useState(null);
  const [products, setProducts] = useState([]);
  const [factories, setFactories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [fields, setFields] = useState({});
  const [mode, setMode] = useState('new');
  const [existingId, setExistingId] = useState('');
  const [profileSel, setProfileSel] = useState(null);
  const [extraImages, setExtraImages] = useState([]);   // logos uploaded from the admin's device
  const [savedFactoryId, setSavedFactoryId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ ok: false, text: '' });

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { batch: b, products: p } = await fetchImport(id);
      setBatch(b); setProducts(p);
      setFields(b?.factory_fields || {});
      setSavedFactoryId(b?.factory_id || null);
      if (b?.factory_id) { setMode('existing'); setExistingId(b.factory_id); }
      // Logo selection: prefer the linked factory's SAVED logo (what actually
      // shows on the site) over the import's worker-picked one — otherwise every
      // reload/save reverts to the worker pick and the logo "never changes".
      // Reset only on a full load, never on a poll, so an unsaved pick survives.
      if (!silent) {
        let logo = b?.profile_image_path || null;
        if (b?.factory_id) {
          try { const fac = await fetchFactory(b.factory_id); if (fac?.profile_image) logo = fac.profile_image; }
          catch { /* fall back to the import's pick */ }
        }
        setProfileSel(logo);
        setError('');
      }
    } catch (e) { if (!silent) setError(e.message || 'Failed to load'); }
    if (!silent) setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchFactories().then(setFactories).catch(() => {}); }, []);

  // While the worker is extracting (or the row is queued), poll the status.
  const bStatus = batch?.status;
  useEffect(() => {
    if (bStatus !== 'queued' && bStatus !== 'extracting') return undefined;
    const t = setInterval(() => { load(true); }, 3000);
    return () => clearInterval(t);
  }, [bStatus, load]);

  // Start / retry extraction on the Cloud Run worker.
  const [starting, setStarting] = useState(false);
  const startExtraction = useCallback(async () => {
    if (!workerConfigured()) {
      setError(isAr ? 'خادم الاستخراج غير مُعدّ (REACT_APP_CATALOG_WORKER_URL).' : 'Extraction worker not configured (REACT_APP_CATALOG_WORKER_URL).');
      return;
    }
    setStarting(true); setError('');
    setBatch((b) => (b ? { ...b, status: 'extracting', error: null } : b));   // optimistic
    // Fire it — the worker responds only when done (minutes), so we DON'T await the
    // happy path; polling reflects progress. But a fast failure (403/CORS/network)
    // rejects in seconds — surface it instead of silently reverting to 'queued'.
    triggerExtraction(id).catch((e) => {
      setError((isAr ? 'تعذّر بدء الاستخراج: ' : "Couldn't start extraction: ") + (e.message || ''));
    });
    setStarting(false);
  }, [id, isAr]);

  // Re-curate: change the guidance / mode, then re-run extraction (replaces the products).
  const [recurOpen, setRecurOpen] = useState(false);
  const [recurNotes, setRecurNotes] = useState('');
  const [recurMode, setRecurMode] = useState('curated');
  // seed once per import (deliberately NOT on import_notes, to not clobber typing)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setRecurNotes(batch?.import_notes || ''); setRecurMode(batch?.extraction_mode || 'curated'); }, [batch?.id]);
  const reCurate = useCallback(async () => {
    setError('');
    try { await updateImportNotes(id, recurNotes); await updateImportMode(id, recurMode); }
    catch (e) { setError((isAr ? 'خطأ: ' : 'Error: ') + (e.message || '')); return; }
    setBatch((b) => (b ? { ...b, import_notes: recurNotes.trim() || null, extraction_mode: recurMode } : b));
    setRecurOpen(false);
    startExtraction();   // re-runs with the new guidance + mode
  }, [id, recurNotes, recurMode, isAr, startExtraction]);

  // When attaching to an existing factory, seed the trust fields (founded_year /
  // export_markets) from that factory so the admin sees + edits current values.
  // Only fills empties — never clobbers a typed edit or an extracted value.
  useEffect(() => {
    if (mode !== 'existing' || !existingId) return;
    const f = factories.find((x) => x.id === existingId);
    if (!f) return;
    setFields((prev) => {
      const empty = (v) => !v || v === 'not_found';
      const next = { ...prev };
      if (empty(prev.founded_year) && f.founded_year != null) next.founded_year = String(f.founded_year);
      if (empty(prev.export_markets) && f.export_markets) next.export_markets = f.export_markets;
      if (empty(prev.moq) && f.moq_note) next.moq = f.moq_note;
      if (prev.private_label === undefined) next.private_label = !!f.private_label;
      if (empty(prev.address) && f.address) next.address = f.address;
      if (empty(prev.city) && f.city) next.city = f.city;
      if (empty(prev.email) && f.email) next.email = f.email;
      if (empty(prev.phone) && f.phone) next.phone = f.phone;
      if (empty(prev.description_ar) && f.description_ar) next.description_ar = f.description_ar;
      if (empty(prev.description_en) && f.description_en) next.description_en = f.description_en;
      if (empty(prev.name_original) && f.company_name) next.name_original = f.company_name;
      if (empty(prev.name_en) && f.company_name_latin) next.name_en = f.company_name_latin;
      if (prev.is_verified === undefined) next.is_verified = !!f.is_verified;
      if (prev.is_featured === undefined) next.is_featured = !!f.is_featured;
      if ((!Array.isArray(prev.certifications) || prev.certifications.length === 0)
          && Array.isArray(f.certifications) && f.certifications.length) next.certifications = f.certifications;
      return Object.keys(next).some((k) => next[k] !== prev[k]) ? next : prev;
    });
  }, [mode, existingId, factories]);

  // The logo can be picked from ANY image: device-uploaded logos first, then the
  // flagged candidates, then every product image from this import.
  const candidates = Array.from(new Set([
    ...extraImages,
    ...(fields?.profile_candidates || []),
    ...(batch?.profile_image_path ? [batch.profile_image_path] : []),
    ...products.map((p) => p.image_path).filter(Boolean),
  ]));

  // Upload a logo the admin picked from their device → add to the pool + select it.
  const handleUploadLogo = useCallback(async (file) => {
    const url = await uploadProfileImage(id, file);
    setExtraImages((prev) => (prev.includes(url) ? prev : [url, ...prev]));
    setProfileSel(url);
  }, [id]);

  async function saveFactory() {
    setSaving(true); setSaveMsg({ ok: false, text: '' });
    try {
      if (mode === 'new' && !(fields.email && fields.email !== 'not_found')) {
        setSaveMsg({ ok: false, text: isAr ? 'البريد الإلكتروني مطلوب لمصنع جديد.' : 'Email is required for a new factory.' }); setSaving(false); return;
      }
      if (mode === 'new' && !fields.category) {
        setSaveMsg({ ok: false, text: isAr ? 'التصنيف مطلوب.' : 'Category is required.' }); setSaving(false); return;
      }
      if (mode === 'existing' && !existingId) {
        setSaveMsg({ ok: false, text: isAr ? 'اختر مصنعاً.' : 'Choose a factory.' }); setSaving(false); return;
      }
      const fid = await resolveFactory({ importId: id, mode, fields, existingId, profileImage: profileSel });
      setSavedFactoryId(fid);
      setSaveMsg({ ok: true, text: isAr ? 'تم حفظ المصنع كمسودة.' : 'Factory saved as draft.' });
      await load();
      fetchFactories().then(setFactories).catch(() => {});   // so the draft/published state reflects the new row
    } catch (e) {
      setSaveMsg({ ok: false, text: (isAr ? 'خطأ: ' : 'Error: ') + (e.message || '') });
    }
    setSaving(false);
  }

  // Save draft — persist inline product edits + factory fields WITHOUT publishing
  // or re-extracting (the extracted data already lives in staging → no re-run).
  const [savingDraft, setSavingDraft] = useState(false);
  async function saveDraft() {
    setSavingDraft(true); setSaveMsg({ ok: false, text: '' });
    try {
      const editedIds = new Set([...Object.keys(edits), ...Object.keys(imgEdits)]);
      const toSave = products.filter((p) => editedIds.has(p.id));
      await Promise.all(toSave.map((p) =>
        updateStagedProduct(p.id, edits[p.id] ?? p.extracted_json ?? {}, imgEdits[p.id] ?? p.image_path)));
      await updateImportFields(id, fields);
      setProducts((ps) => ps.map((p) => (editedIds.has(p.id)
        ? { ...p, extracted_json: edits[p.id] ?? p.extracted_json, image_path: imgEdits[p.id] ?? p.image_path,
            status: p.status === 'pending' ? 'edited' : p.status }
        : p)));
      setSaveMsg({ ok: true, text: isAr ? 'تم حفظ المسودة — لن تُستخرج مرّة أخرى.' : 'Draft saved — no re-extraction needed.' });
    } catch (e) { setSaveMsg({ ok: false, text: (isAr ? 'خطأ: ' : 'Error: ') + (e.message || '') }); }
    setSavingDraft(false);
  }

  // ── Factory removal (archive / permanent delete) ──
  const [danger, setDanger] = useState(false);   // reveal the destructive zone
  const [confirmDel, setConfirmDel] = useState(false);
  const [removing, setRemoving] = useState(false);
  const savedFactory = factories.find((x) => x.id === savedFactoryId) || null;

  async function handleArchive(active) {
    setRemoving(true); setSaveMsg({ ok: false, text: '' });
    try {
      await archiveFactory(savedFactoryId, active);
      setSaveMsg({ ok: true, text: active ? (isAr ? 'تم إظهار المصنع.' : 'Factory is live again.') : (isAr ? 'تم إخفاء المصنع من الموقع.' : 'Factory hidden from the site.') });
      setFactories((fs) => fs.map((f) => (f.id === savedFactoryId ? { ...f, is_active: active } : f)));
    } catch (e) { setSaveMsg({ ok: false, text: (isAr ? 'خطأ: ' : 'Error: ') + (e.message || '') }); }
    setRemoving(false);
  }

  async function handleDelete() {
    setRemoving(true); setSaveMsg({ ok: false, text: '' });
    try {
      await deleteFactory(savedFactoryId);
      // Row gone → detach from this import and reset the panel to "new".
      setSavedFactoryId(null); setMode('new'); setExistingId('');
      setFactories((fs) => fs.filter((f) => f.id !== savedFactoryId));
      setDanger(false); setConfirmDel(false);
      setSaveMsg({ ok: true, text: isAr ? 'تم حذف المصنع وكل منتجاته نهائياً.' : 'Factory and all its products permanently deleted.' });
    } catch (e) {
      const msg = e.code === 'HAS_REQUESTS'
        ? (isAr ? 'لا يمكن الحذف النهائي — يوجد طلب تاجر مرتبط بهذا المصنع. استخدم "إخفاء" بدلاً من ذلك.'
                : 'Cannot permanently delete — a buyer request is linked to this factory. Use “Hide” instead.')
        : (isAr ? 'خطأ: ' : 'Error: ') + (e.message || '');
      setSaveMsg({ ok: false, text: msg });
    }
    setRemoving(false);
  }

  const counts = {
    total: products.length,
    high: products.filter((p) => p.status === 'pending' && (p.confidence_score ?? 0) >= HIGH_CONF).length,
    mid: products.filter((p) => p.status === 'pending' && (p.confidence_score ?? 0) < HIGH_CONF).length,
    approved: products.filter((p) => p.status === 'approved').length,
    skipped: products.filter((p) => p.status === 'skipped').length,
  };

  // ── Product review (bulk + keyboard deck) ──
  const [edits, setEdits] = useState({});
  const [imgEdits, setImgEdits] = useState({});   // { [pid]: url } — admin-swapped product image
  const [deckIdx, setDeckIdx] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState({ ok: false, text: '' });
  const deckRef = useRef(null);

  const reviewQueue = products
    .filter((p) => p.status === 'pending')
    .sort((a, b) => ((a.confidence_score ?? 0) - (b.confidence_score ?? 0)) || ((a.sort_order ?? 0) - (b.sort_order ?? 0)));
  const current = reviewQueue.length ? reviewQueue[Math.min(deckIdx, reviewQueue.length - 1)] : null;

  const jsonFor = (p) => edits[p.id] ?? (p.extracted_json || {});
  const markStatus = (pid, status) => setProducts((ps) => ps.map((p) => (p.id === pid ? { ...p, status } : p)));
  const refocusDeck = () => setTimeout(() => deckRef.current?.focus(), 0);
  const moveDeck = (d) => { setDeckIdx((i) => Math.max(0, Math.min(reviewQueue.length - 1, i + d))); refocusDeck(); };
  const errMsg = (e) => setActionMsg({ ok: false, text: (isAr ? 'خطأ: ' : 'Error: ') + (e.message || '') });

  // Factory display name + category labels, used to synthesize fallback product
  // names at approval time (for products the catalog left unnamed).
  const buildMeta = () => {
    const nfv = (v) => (v && v !== 'not_found' ? v : '');
    let name;
    let catCode;
    if (mode === 'existing') {
      const f = factories.find((x) => x.id === existingId);
      name = nfv(f?.company_name_latin) || nfv(f?.company_name);
      catCode = f?.category;
    } else {
      name = nfv(fields.name_en) || nfv(fields.name_original);
      catCode = fields.category;
    }
    return {
      factoryName: name || 'Factory',
      categoryAr: (UI_CATEGORIES.ar.find((c) => c.val === catCode) || {}).label,
      categoryEn: (UI_CATEGORIES.en.find((c) => c.val === catCode) || {}).label,
    };
  };

  // ✨ Gemini suggest for a bilingual field of the current product (uses the whole
  // context: the extracted data + the factory fields + the product image).
  const suggestField = async (field) => {
    if (!current) return;
    const res = await assistField({
      field,
      context: { factory: fields, product: jsonFor(current) },
      imageUrl: imgEdits[current.id] ?? current.image_path,
    });
    setEdits((e) => {
      const cur = e[current.id] ?? (current.extracted_json || {});
      return { ...e, [current.id]: { ...cur, [field]: { ar: res.ar || '', en: res.en || '' } } };
    });
  };

  // Ask Gemini about this factory / catalog.
  const [askQ, setAskQ] = useState('');
  const [askAns, setAskAns] = useState('');
  const [asking, setAsking] = useState(false);
  const doAsk = async () => {
    if (!askQ.trim() || asking) return;
    setAsking(true); setAskAns('');
    try {
      const res = await assistAsk({
        question: askQ,
        context: {
          factory: fields,
          products: products.slice(0, 80).map((p) => ({
            name: p.extracted_json?.product_name, ref: p.extracted_json?.ref_code,
          })),
        },
      });
      setAskAns(res.answer || '');
    } catch (e) { setAskAns((isAr ? 'خطأ: ' : 'Error: ') + (e.message || '')); }
    setAsking(false);
  };

  const approveCurrent = async () => {
    if (!current || busy) return;
    setBusy(true); setActionMsg({ ok: false, text: '' });
    try { await approveProduct(savedFactoryId, { ...current, extracted_json: jsonFor(current), image_path: imgEdits[current.id] ?? current.image_path }, buildMeta()); markStatus(current.id, 'approved'); }
    catch (e) { errMsg(e); }
    setBusy(false); refocusDeck();
  };
  const skipCurrent = async () => {
    if (!current || busy) return;
    setBusy(true); setActionMsg({ ok: false, text: '' });
    try { await skipProduct(current.id); markStatus(current.id, 'skipped'); }
    catch (e) { errMsg(e); }
    setBusy(false); refocusDeck();
  };
  const handleBulk = async () => {
    if (busy) return;
    setBusy(true); setActionMsg({ ok: false, text: '' });
    try {
      const { count } = await bulkApproveHighConfidence(savedFactoryId, products, buildMeta());
      setProducts((ps) => ps.map((p) => (p.status === 'pending' && (p.confidence_score ?? 0) >= HIGH_CONF ? { ...p, status: 'approved' } : p)));
      setActionMsg({ ok: true, text: isAr ? `تم اعتماد ${count} منتج.` : `Approved ${count} products.` });
    } catch (e) { errMsg(e); }
    setBusy(false);
  };
  // Approve EVERYTHING remaining (any confidence) — one click when the whole
  // catalog is already good, instead of stepping through every card.
  const handleApproveAll = async () => {
    if (busy) return;
    setBusy(true); setActionMsg({ ok: false, text: '' });
    try {
      const { count } = await approveAllPending(savedFactoryId, products, buildMeta());
      setProducts((ps) => ps.map((p) => (p.status === 'pending' || p.status === 'edited' ? { ...p, status: 'approved' } : p)));
      setActionMsg({ ok: true, text: isAr ? `تم اعتماد ${count} منتج.` : `Approved ${count} products.` });
    } catch (e) { errMsg(e); }
    setBusy(false);
  };
  const handleFinalize = async () => {
    if (busy) return;
    setBusy(true);
    try { await finalizeImport(id); setBatch((b) => ({ ...b, status: 'approved' })); setActionMsg({ ok: true, text: isAr ? 'تم إنهاء الاستيراد.' : 'Import finalized.' }); }
    catch (e) { errMsg(e); }
    setBusy(false);
  };

  // ── Separate price file — upload + Gemini match, then an easy price review ──
  const [priceFile, setPriceFile] = useState(null);
  const [matching, setMatching] = useState(false);
  const [priceMsg, setPriceMsg] = useState({ ok: false, text: '' });
  const [priceEdits, setPriceEdits] = useState({});   // { [pid]: { price, currency } }
  const [savingPrices, setSavingPrices] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);   // reveal the review table
  const priceFileRef = useRef(null);

  // Gemini writes the literal 'not_found' into a product's price/currency when the
  // price file has no match — treat it as empty ("on request"), never show or
  // count it as a real value. (Approval already drops it via nf() in catalogImport.)
  const cleanNF = (v) => (v && v !== 'not_found' ? v : '');
  const priceVal = (p) => cleanNF(priceEdits[p.id]?.price ?? p.extracted_json?.price ?? '');
  const currVal = (p) => cleanNF(priceEdits[p.id]?.currency ?? p.extracted_json?.currency ?? '');
  const editPrice = (p, field, v) => setPriceEdits((e) => ({
    ...e,
    [p.id]: {
      price: field === 'price' ? v : cleanNF(e[p.id]?.price ?? p.extracted_json?.price ?? ''),
      currency: field === 'currency' ? v : cleanNF(e[p.id]?.currency ?? p.extracted_json?.currency ?? ''),
    },
  }));

  // Upload the price file, then let the worker match it to the extracted products.
  const runPriceMatch = async () => {
    if (!priceFile || matching) return;
    setMatching(true); setPriceMsg({ ok: false, text: '' });
    try {
      await uploadPriceFile(id, priceFile);
      const res = await triggerPriceMatch(id);
      await load(true);           // refresh staging → prices now filled in
      setPriceEdits({}); setPriceOpen(true);
      setPriceFile(null); if (priceFileRef.current) priceFileRef.current.value = '';
      setPriceMsg({ ok: true, text: isAr
        ? `طوبقت الأسعار لـ ${res.matched} من ${res.total} منتج${res.unmatched ? ` (${res.unmatched} بدون سعر)` : ''}.`
        : `Matched ${res.matched} of ${res.total} products${res.unmatched ? ` (${res.unmatched} left unpriced)` : ''}.` });
    } catch (e) { setPriceMsg({ ok: false, text: (isAr ? 'خطأ: ' : 'Error: ') + (e.message || '') }); }
    setMatching(false);
  };

  // Persist the reviewed prices back to staging; optionally approve everything in
  // one go (the "I glanced and I'm sure" path the admin asked for).
  const savePrices = async (thenApproveAll = false) => {
    setSavingPrices(true); setPriceMsg({ ok: false, text: '' });
    try {
      const fresh = products.map((p) => {
        const pe = priceEdits[p.id];
        if (!pe) return p;
        const ej = { ...(p.extracted_json || {}), price: (pe.price || '').trim() || null, currency: (pe.currency || '').trim() || null };
        return { ...p, extracted_json: ej, status: p.status === 'pending' ? 'edited' : p.status };
      });
      await Promise.all(Object.keys(priceEdits).map((pid) => {
        const p = fresh.find((x) => x.id === pid);
        return p ? updateStagedProduct(pid, p.extracted_json, undefined) : null;
      }));
      setProducts(fresh); setPriceEdits({});
      if (thenApproveAll && savedFactoryId) {
        const { count } = await approveAllPending(savedFactoryId, fresh, buildMeta());
        setProducts((ps) => ps.map((p) => (p.status === 'pending' || p.status === 'edited' ? { ...p, status: 'approved' } : p)));
        setPriceMsg({ ok: true, text: isAr ? `تم حفظ الأسعار واعتماد ${count} منتج.` : `Prices saved and ${count} products approved.` });
      } else {
        setPriceMsg({ ok: true, text: isAr ? 'تم حفظ الأسعار.' : 'Prices saved.' });
      }
    } catch (e) { setPriceMsg({ ok: false, text: (isAr ? 'خطأ: ' : 'Error: ') + (e.message || '') }); }
    setSavingPrices(false);
  };

  const pricedCount = products.filter((p) => (priceVal(p) || '').toString().trim()).length;

  // Keyboard: Enter=approve, Del/Esc=skip, arrows=navigate — ignored while typing in a field.
  useEffect(() => {
    if (!savedFactoryId || reviewQueue.length === 0) return undefined;
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') { if (e.key === 'Escape') e.target.blur(); return; }
      if (e.key === 'Enter') { e.preventDefault(); approveCurrent(); }
      else if (e.key === 'Delete' || e.key === 'Escape') { e.preventDefault(); skipCurrent(); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); moveDeck(isAr ? -1 : 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); moveDeck(isAr ? 1 : -1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedFactoryId, reviewQueue.length, deckIdx, current?.id, busy, edits, isAr]);

  // Stop a running extraction, or delete the whole import.
  const [canceling, setCanceling] = useState(false);
  const [impDanger, setImpDanger] = useState(false);   // reveal "delete import" once finished
  const stopExtraction = useCallback(async () => {
    setCanceling(true); setError('');
    try {
      await cancelImport(id);
      setBatch((b) => (b ? { ...b, status: 'cancelled', progress: null } : b));   // optimistic
    } catch (e) { setError((isAr ? 'خطأ: ' : 'Error: ') + (e.message || '')); }
    setCanceling(false);
  }, [id, isAr]);
  const removeImport = useCallback(async () => {
    if (!window.confirm(isAr ? 'حذف هذا الاستيراد نهائياً؟' : 'Delete this import permanently?')) return;
    setCanceling(true); setError('');
    try { await deleteImport(id); nav('/admin/catalog-import'); }
    catch (e) { setError((isAr ? 'تعذّر الحذف: ' : 'Delete failed: ') + (e.message || '')); setCanceling(false); }
  }, [id, isAr, nav]);

  // Extraction must finish before the review steps are meaningful.
  const ready = !!batch && ['extracted', 'reviewing', 'approved'].includes(batch.status);
  const extracting = !!batch && (batch.status === 'extracting' || batch.status === 'queued');
  const cancelled = !!batch && batch.status === 'cancelled';

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS(isAr)}</style>
        <div className="a-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="ci-back" onClick={() => nav('/admin/catalog-import')}>
            {isAr ? '→ رجوع إلى القائمة' : '← Back to imports'}
          </button>

          {loading ? (
            <p className="a-page-sub">{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>
          ) : error ? (
            <div className="a-error">{error}</div>
          ) : !batch ? (
            <div className="a-error">{isAr ? 'الاستيراد غير موجود' : 'Import not found'}</div>
          ) : (
            <>
              <h1 className="a-page-title">{batch.original_filename}</h1>
              <p className="a-page-sub">
                {counts.total} {isAr ? 'منتج' : 'products'} · {batch.page_count ?? '—'} {isAr ? 'صفحة' : 'pages'} · {isAr ? 'الحالة' : 'status'}: {batch.status}
              </p>
              {batch.import_notes && (
                <p style={{ margin: '-12px 0 18px', fontSize: 12, color: 'rgba(0,0,0,0.5)', fontFamily: FB,
                  background: 'rgba(201,134,63,0.07)', border: '1px solid rgba(201,134,63,0.2)', borderRadius: 8, padding: '8px 12px' }}>
                  <strong style={{ fontWeight: 600 }}>{isAr ? 'توجيهاتك: ' : 'Your guidance: '}</strong>{batch.import_notes}
                </p>
              )}

              {/* Extraction state — queued / extracting / failed (before review) */}
              {!ready && (
                <div className="ci-card" style={{ textAlign: 'center', padding: '30px 22px' }}>
                  {extracting ? (() => {
                    const stage = batch.progress?.stage;
                    const queued = batch.status === 'queued';
                    const activeIdx = queued ? 0.5 : (() => { const f = EXTRACT_STEPS.findIndex((s) => s.key === stage); return f < 0 ? 1 : f; })();
                    const pct = Math.max(0, Math.min(100, batch.progress?.pct ?? (queued ? 0 : 5)));
                    const note = batch.progress?.note;
                    return (
                      <>
                        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: FB, color: 'rgba(0,0,0,0.8)', marginBottom: 4 }}>
                          {queued ? (isAr ? 'بانتظار بدء الاستخراج' : 'Waiting to extract') : (isAr ? 'جارٍ استخراج الكتالوج…' : 'Extracting the catalog…')}
                        </div>
                        <p className="ci-hint" style={{ margin: '0 auto 18px', maxWidth: 440 }}>
                          {isAr ? 'يُحدَّث تلقائياً — تقدر تغادر الصفحة وترجع لها.' : 'Updates automatically — you can leave and come back.'}
                        </p>

                        <div className="ci-prog-wrap">
                          <div className="ci-prog-track">
                            <div className={`ci-prog-fill${stage === 'analyzing' ? ' pulse' : ''}`} style={{ width: `${pct}%` }} />
                          </div>
                          <div className="ci-prog-pct">{pct}%{note ? ` · ${note}` : ''}</div>

                          <div className="ci-steps">
                            {EXTRACT_STEPS.map((s, i) => {
                              const done = i < activeIdx;
                              const active = i === activeIdx;
                              return (
                                <div key={s.key} className={`ci-step${done ? ' done' : ''}${active ? ' active' : ''}`}>
                                  <span className="ci-step-dot">{done ? '✓' : ''}</span>
                                  <span>{isAr ? s.ar : s.en}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {queued ? (
                          <button className="ci-btn-primary" style={{ marginTop: 18 }} onClick={startExtraction} disabled={starting}>
                            {isAr ? 'بدء الاستخراج الآن' : 'Start extraction now'}
                          </button>
                        ) : (
                          <div style={{ marginTop: 18 }}>
                            <button className="ci-skip" onClick={stopExtraction} disabled={canceling}>
                              {canceling ? (isAr ? 'جارٍ الإيقاف…' : 'Stopping…') : (isAr ? 'إيقاف الاستخراج' : 'Stop extraction')}
                            </button>
                            <p className="ci-hint" style={{ margin: '8px auto 0', maxWidth: 420 }}>
                              {isAr ? 'يتوقّف عند أقرب مرحلة (قد يكمل نداء التحليل الجاري أولاً).' : 'Stops at the next stage (a running analysis call may finish first).'}
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })() : cancelled ? (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: FB, color: 'rgba(0,0,0,0.7)', marginBottom: 6 }}>
                        {isAr ? 'أُلغي الاستخراج' : 'Extraction cancelled'}
                      </div>
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12, flexWrap: 'wrap' }}>
                        <button className="ci-btn-primary" onClick={startExtraction} disabled={starting}>
                          {isAr ? 'إعادة الاستخراج' : 'Restart extraction'}
                        </button>
                        <button className="ci-skip" onClick={removeImport} disabled={canceling}>
                          {isAr ? 'حذف الاستيراد' : 'Delete import'}
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: 15, fontWeight: 600, fontFamily: FB, color: '#c0392b', marginBottom: 6 }}>
                        {isAr ? 'فشل الاستخراج' : 'Extraction failed'}
                      </div>
                      {batch.error && (
                        <p className="ci-hint" style={{ margin: '0 auto 4px', maxWidth: 520, color: 'rgba(0,0,0,0.55)', wordBreak: 'break-word' }}>{batch.error}</p>
                      )}
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                        <button className="ci-btn-primary" onClick={startExtraction} disabled={starting}>
                          {isAr ? 'إعادة المحاولة' : 'Retry extraction'}
                        </button>
                        <button className="ci-skip" onClick={removeImport} disabled={canceling}>
                          {isAr ? 'حذف الاستيراد' : 'Delete import'}
                        </button>
                      </div>
                    </>
                  )}
                  {!workerConfigured() && (
                    <p style={{ margin: '12px 0 0', fontSize: 11.5, color: '#b8860b', fontFamily: FB }}>
                      {isAr ? 'ملاحظة: خادم الاستخراج غير مُعدّ بعد (REACT_APP_CATALOG_WORKER_URL).' : 'Note: extraction worker not configured (REACT_APP_CATALOG_WORKER_URL).'}
                    </p>
                  )}
                </div>
              )}

              {ready && (<>
              {/* Re-curate — change the guidance / scope and let Gemini redo the profile */}
              <div className="ci-card">
                {!recurOpen ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => setRecurOpen(true)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 13, color: '#8B5e2b', padding: 0, fontWeight: 600 }}>
                      {isAr ? '🔁 أعد الاستخراج (توجيه / نطاق مختلف)' : '🔁 Re-extract (different guidance / scope)'}
                    </button>
                    <span style={{ fontSize: 11, fontFamily: FB, color: 'rgba(0,0,0,0.45)', background: 'rgba(0,0,0,0.05)', padding: '2px 8px', borderRadius: 99 }}>
                      {(batch.extraction_mode || 'curated') === 'full'
                        ? (isAr ? 'النطاق: كامل' : 'Scope: full')
                        : (isAr ? 'النطاق: منتقى' : 'Scope: curated')}
                    </span>
                  </div>
                ) : (
                  <>
                    <h2 className="ci-h2">{isAr ? 'أعد الاستخراج' : 'Re-extract'}</h2>
                    <p className="ci-hint" style={{ margin: '0 0 10px' }}>
                      {isAr ? 'عدّل النطاق و/أو التوجيه واطلب من Gemini يعيد استخراج هذا الكتالوج — يستبدل المنتجات الحالية.'
                            : 'Adjust the scope and/or guidance and let Gemini redo this catalog — replaces the current products.'}
                    </p>
                    <label className="ci-label" style={{ marginBottom: 6 }}>{isAr ? 'نطاق الاستخراج' : 'Extraction scope'}</label>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                      {[
                        { key: 'curated', ar: 'منتقى', en: 'Curated', arSub: 'أفضل المنتجات الممثِّلة', enSub: 'Best representative products' },
                        { key: 'full', ar: 'كامل', en: 'Full', arSub: 'كل المنتجات في الكتالوج', enSub: 'Every product in the catalog' },
                      ].map((m) => {
                        const on = recurMode === m.key;
                        return (
                          <button key={m.key} type="button" onClick={() => setRecurMode(m.key)}
                            style={{ flex: '1 1 160px', textAlign: isAr ? 'right' : 'left', padding: '9px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: FB,
                              border: `1.5px solid ${on ? '#1a1814' : 'rgba(0,0,0,0.15)'}`, background: on ? 'rgba(26,24,20,0.04)' : 'transparent' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: on ? '#1a1814' : 'rgba(0,0,0,0.7)' }}>{isAr ? m.ar : m.en}</div>
                            <div style={{ fontSize: 10.5, color: 'rgba(0,0,0,0.45)', marginTop: 2 }}>{isAr ? m.arSub : m.enSub}</div>
                          </button>
                        );
                      })}
                    </div>
                    <textarea className="ci-input" value={recurNotes} onChange={(e) => setRecurNotes(e.target.value)} rows={3}
                      dir={isAr ? 'rtl' : 'ltr'} style={{ resize: 'vertical', minHeight: 60, maxWidth: '100%' }}
                      placeholder={isAr ? 'مثال: اعرض ٢٥ منتج بس · ركّز على الأثاث الخارجي · اجمع كل المقاسات في منتج واحد'
                                        : 'e.g. show only 25 products · focus on outdoor furniture · group all sizes into one product'} />
                    <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                      <button className="ci-btn-primary" onClick={reCurate} disabled={starting}>
                        {isAr ? 'حفظ وأعد التنسيق' : 'Save & re-curate'}
                      </button>
                      <button className="ci-btn-ghost" onClick={() => { setRecurOpen(false); setRecurNotes(batch.import_notes || ''); setRecurMode(batch.extraction_mode || 'curated'); }}>
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Ask Gemini about this factory / catalog */}
              {workerConfigured() && (
                <div className="ci-card">
                  <h2 className="ci-h2">{isAr ? '💬 اسأل جيميني عن هذا المصنع' : '💬 Ask Gemini about this factory'}</h2>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <input className="ci-input" style={{ flex: 1, minWidth: 220 }} value={askQ}
                      onChange={(e) => setAskQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doAsk(); }}
                      dir={isAr ? 'rtl' : 'ltr'}
                      placeholder={isAr ? 'مثال: وحّد أسماء المنتجات · اقترح تصنيفاً · لخّص قدرات المصنع' : 'e.g. unify product names · suggest a category · summarize capabilities'} />
                    <button className="ci-btn-primary" onClick={doAsk} disabled={asking || !askQ.trim()}>
                      {asking ? (isAr ? '… يفكّر' : '… thinking') : (isAr ? 'اسأل' : 'Ask')}
                    </button>
                  </div>
                  {askAns && (
                    <div style={{ marginTop: 12, padding: '12px 14px', background: 'rgba(0,0,0,0.03)', borderRadius: 8,
                      fontSize: 13.5, lineHeight: 1.7, color: 'rgba(0,0,0,0.78)', fontFamily: FB, whiteSpace: 'pre-wrap' }}
                      dir={isAr ? 'rtl' : 'ltr'}>
                      {askAns}
                    </div>
                  )}
                </div>
              )}

              {/* Step 1 — factory */}
              <div className="ci-card">
                <h2 className="ci-h2">{isAr ? '١) بيانات المصنع' : '1) Factory details'}</h2>
                <FactoryFieldsPanel value={fields} onChange={setFields} mode={mode} onModeChange={setMode}
                  existingId={existingId} onExistingChange={setExistingId} factories={factories} lang={lang} />
              </div>

              {/* Step 2 — profile image */}
              <div className="ci-card">
                <h2 className="ci-h2">{isAr ? '٢) صورة المصنع (الشعار)' : '2) Factory profile image'}</h2>
                <p className="ci-hint" style={{ marginBottom: 12 }}>
                  {isAr ? 'اختر الصورة التي تُستخدم كشعار/واجهة للمصنع.' : 'Pick the image to use as the factory logo/avatar.'}
                </p>
                <ProfileImagePicker candidates={candidates} selected={profileSel} onSelect={setProfileSel} lang={lang} onUploadFile={handleUploadLogo} />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                <button className="ci-btn-primary" onClick={saveFactory} disabled={saving}>
                  {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving…')
                    : savedFactoryId ? (isAr ? 'تحديث المصنع' : 'Update factory')
                      : (isAr ? 'حفظ المصنع + الصورة' : 'Save factory + image')}
                </button>
                <button className="ci-btn-ghost" onClick={saveDraft} disabled={savingDraft}>
                  {savingDraft ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : (isAr ? 'حفظ كمسودة' : 'Save draft')}
                </button>
                {saveMsg.text && (
                  <span style={{ fontSize: 13, color: saveMsg.ok ? '#3f9d5a' : '#c0392b', fontFamily: FB }}>{saveMsg.text}</span>
                )}
              </div>

              {/* Draft vs published — new factories start hidden until published */}
              {savedFactoryId && (
                <div style={{ marginBottom: 22, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                  {savedFactory && savedFactory.is_active ? (
                    <span style={{ fontSize: 13, fontFamily: FB, color: '#3f9d5a', fontWeight: 600 }}>
                      {isAr ? '● منشور — ظاهر للمشترين' : '● Published — visible to buyers'}
                    </span>
                  ) : (
                    <>
                      <span style={{ fontSize: 13, fontFamily: FB, color: '#b8860b', fontWeight: 600 }}>
                        {isAr ? '● مسودة — غير ظاهر للمشترين' : '● Draft — hidden from buyers'}
                      </span>
                      <button className="ci-btn-primary" style={{ padding: '8px 18px' }} disabled={removing}
                        onClick={() => handleArchive(true)}>
                        {isAr ? 'نشر المصنع' : 'Publish factory'}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Factory management — archive / permanent delete (only once saved) */}
              {savedFactoryId && (
                <div style={{ marginBottom: 22 }}>
                  {!danger ? (
                    <button
                      type="button"
                      onClick={() => setDanger(true)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 12, color: 'rgba(0,0,0,0.4)', padding: 0 }}
                    >
                      {isAr ? 'إدارة المصنع (إخفاء / حذف)…' : 'Manage factory (hide / delete)…'}
                    </button>
                  ) : (
                    <div style={{ border: '1px solid rgba(192,57,43,0.25)', borderRadius: 10, padding: '14px 16px', background: 'rgba(192,57,43,0.03)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: FB, color: '#a23628', marginBottom: 4 }}>
                        {isAr ? 'إدارة المصنع' : 'Manage factory'}
                      </div>
                      <p className="ci-hint" style={{ margin: '0 0 12px' }}>
                        {savedFactory && savedFactory.is_active === false
                          ? (isAr ? 'هذا المصنع مخفيّ حالياً من الموقع.' : 'This factory is currently hidden from the site.')
                          : (isAr ? 'الإخفاء يزيل المصنع من الموقع مع الاحتفاظ ببياناته. الحذف النهائي يمسحه هو وكل منتجاته.'
                                  : 'Hiding removes the factory from the site but keeps its data. Permanent delete removes it and all its products.')}
                      </p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {savedFactory && savedFactory.is_active === false ? (
                          <button type="button" className="ci-btn-ghost" disabled={removing} onClick={() => handleArchive(true)}>
                            {isAr ? 'إظهار المصنع' : 'Make live'}
                          </button>
                        ) : (
                          <button type="button" className="ci-btn-ghost" disabled={removing} onClick={() => handleArchive(false)}>
                            {isAr ? 'إخفاء من الموقع' : 'Hide from site'}
                          </button>
                        )}
                        {!confirmDel ? (
                          <button type="button" className="ci-skip" disabled={removing} onClick={() => setConfirmDel(true)}>
                            {isAr ? 'حذف نهائي' : 'Delete permanently'}
                          </button>
                        ) : (
                          <>
                            <span style={{ fontSize: 12.5, fontFamily: FB, color: '#a23628' }}>
                              {isAr ? 'متأكد؟ لا يمكن التراجع.' : 'Sure? This cannot be undone.'}
                            </span>
                            <button type="button" className="ci-skip" disabled={removing} onClick={handleDelete}
                              style={{ background: '#c0503f', color: '#fff' }}>
                              {removing ? (isAr ? 'جارٍ الحذف…' : 'Deleting…') : (isAr ? 'نعم، احذف' : 'Yes, delete')}
                            </button>
                            <button type="button" className="ci-btn-ghost" disabled={removing} onClick={() => setConfirmDel(false)}>
                              {isAr ? 'إلغاء' : 'Cancel'}
                            </button>
                          </>
                        )}
                        <button type="button" onClick={() => { setDanger(false); setConfirmDel(false); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 12, color: 'rgba(0,0,0,0.4)', marginInlineStart: 'auto' }}>
                          {isAr ? 'إغلاق' : 'Close'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Separate price file — some factories send prices in their own
                  PDF / Excel; Gemini matches it to the extracted products. */}
              <div className="ci-card">
                <h2 className="ci-h2">{isAr ? '💵 ملف الأسعار (اختياري)' : '💵 Price file (optional)'}</h2>
                <p className="ci-hint" style={{ margin: '0 0 12px' }}>
                  {isAr ? 'هل أرسل المصنع الأسعار في ملف منفصل (PDF أو Excel)؟ ارفعه وسيطابقه جيميني مع المنتجات المستخرجة.'
                        : 'Did the factory send prices in a separate file (PDF or Excel)? Upload it and Gemini will match it to the extracted products.'}
                </p>
                {batch.price_file_path && !priceFile && (
                  <p style={{ margin: '0 0 10px', fontSize: 12, fontFamily: FB, color: '#3f9d5a' }}>
                    {isAr ? '✓ يوجد ملف أسعار مرفوع' : '✓ A price file is attached'}
                    {batch.price_matched_at ? (isAr ? ' وتمت مطابقته.' : ' and matched.') : (isAr ? ' (لم تُشغّل المطابقة بعد).' : ' (not matched yet).')}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input ref={priceFileRef} type="file" accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp"
                    onChange={(e) => setPriceFile(e.target.files?.[0] || null)}
                    style={{ fontSize: 12.5, fontFamily: FB }} />
                  <button className="ci-btn-primary" onClick={runPriceMatch}
                    disabled={!priceFile || matching || !workerConfigured()}>
                    {matching ? (isAr ? 'جارٍ المطابقة…' : 'Matching…') : (isAr ? 'رفع ومطابقة الأسعار' : 'Upload & match prices')}
                  </button>
                  {(pricedCount > 0 || batch.price_matched_at) && (
                    <button className="ci-btn-ghost" onClick={() => setPriceOpen((o) => !o)}>
                      {priceOpen ? (isAr ? 'إخفاء الأسعار' : 'Hide prices') : (isAr ? 'مراجعة الأسعار' : 'Review prices')}
                    </button>
                  )}
                </div>
                {!workerConfigured() && (
                  <p style={{ margin: '8px 0 0', fontSize: 11.5, color: '#b8860b', fontFamily: FB }}>
                    {isAr ? 'المطابقة تتطلّب خادم الاستخراج (يمكنك مع ذلك تعديل الأسعار يدوياً بالأسفل).' : 'Matching needs the extraction worker (you can still edit prices manually below).'}
                  </p>
                )}
                {priceMsg.text && (
                  <div style={{ marginTop: 10, fontSize: 13, color: priceMsg.ok ? '#3f9d5a' : '#c0392b', fontFamily: FB }}>{priceMsg.text}</div>
                )}

                {/* Easy price review — one glance over every product's price, editable,
                    with a single "save & approve all" for when it all looks right. */}
                {priceOpen && products.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontSize: 12.5, fontFamily: FB, color: 'rgba(0,0,0,0.6)' }}>
                        {isAr ? `${pricedCount} من ${products.length} لها سعر` : `${pricedCount} of ${products.length} priced`}
                      </span>
                      <span style={{ fontSize: 11, fontFamily: FB, color: 'rgba(0,0,0,0.4)' }}>
                        {isAr ? 'اترك السعر فارغاً لعرض «عند الطلب»' : 'Leave empty to show “On request”'}
                      </span>
                    </div>
                    <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }}>
                      {products.map((p, i) => {
                        const nm = p.extracted_json?.product_name || {};
                        const label = (isAr ? (nm.ar || nm.en) : (nm.en || nm.ar)) || (isAr ? 'منتج' : 'Product');
                        const ref = p.extracted_json?.ref_code && p.extracted_json.ref_code !== 'not_found' ? p.extracted_json.ref_code : '';
                        const has = (priceVal(p) || '').toString().trim();
                        return (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                            borderTop: i === 0 ? 'none' : '1px solid rgba(0,0,0,0.05)', background: has ? 'transparent' : 'rgba(201,134,63,0.05)' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontFamily: FB, color: 'rgba(0,0,0,0.8)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
                              {ref && <div style={{ fontSize: 10.5, fontFamily: FB, color: 'rgba(0,0,0,0.4)' }}>{ref}</div>}
                            </div>
                            <input value={priceVal(p)} onChange={(e) => editPrice(p, 'price', e.target.value)}
                              placeholder={isAr ? 'السعر' : 'Price'} dir="ltr"
                              style={{ width: 110, padding: '6px 8px', border: '1px solid rgba(0,0,0,0.14)', borderRadius: 6, fontSize: 12.5, fontFamily: FB, textAlign: 'center' }} />
                            <input value={currVal(p)} onChange={(e) => editPrice(p, 'currency', e.target.value)}
                              placeholder={isAr ? 'العملة' : 'Cur'} dir="ltr"
                              style={{ width: 62, padding: '6px 8px', border: '1px solid rgba(0,0,0,0.14)', borderRadius: 6, fontSize: 12.5, fontFamily: FB, textAlign: 'center' }} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button className="ci-btn-ghost" onClick={() => savePrices(false)} disabled={savingPrices || !Object.keys(priceEdits).length}>
                        {savingPrices ? (isAr ? 'جارٍ الحفظ…' : 'Saving…') : (isAr ? 'حفظ الأسعار' : 'Save prices')}
                      </button>
                      {savedFactoryId && (
                        <button className="ci-btn-primary" onClick={() => savePrices(true)} disabled={savingPrices}>
                          {isAr ? 'حفظ الأسعار واعتماد كل المنتجات' : 'Save prices & approve all products'}
                        </button>
                      )}
                      {!savedFactoryId && (
                        <span style={{ fontSize: 11.5, fontFamily: FB, color: 'rgba(0,0,0,0.45)' }}>
                          {isAr ? 'احفظ المصنع أولاً لاعتماد الكل.' : 'Save the factory first to approve all.'}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Step 3 — products (approval UI lands in commit 3) */}
              <div className="ci-card">
                <h2 className="ci-h2">{isAr ? '٣) مراجعة المنتجات' : '3) Product review'}</h2>
                <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginBottom: 10 }}>
                  {[
                    [isAr ? 'إجمالي' : 'Total', counts.total],
                    [isAr ? 'ثقة عالية' : 'High-conf', counts.high],
                    [isAr ? 'للمراجعة' : 'To review', counts.mid],
                    [isAr ? 'معتمد' : 'Approved', counts.approved],
                    [isAr ? 'متخطّى' : 'Skipped', counts.skipped],
                  ].map(([l, v]) => (
                    <div key={l}><div className="ci-stat-n">{v}</div><div className="ci-stat-l">{l}</div></div>
                  ))}
                </div>
                {actionMsg.text && (
                  <div style={{ margin: '4px 0 14px', fontSize: 13, color: actionMsg.ok ? '#3f9d5a' : '#c0392b', fontFamily: FB }}>{actionMsg.text}</div>
                )}
                {!savedFactoryId ? (
                  <p className="ci-hint">{isAr ? 'احفظ المصنع أولاً لتفعيل اعتماد المنتجات.' : 'Save the factory first to enable product approval.'}</p>
                ) : (
                  <>
                    {(counts.high + counts.mid) > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                          <button className="ci-btn-primary" onClick={handleApproveAll} disabled={busy}>
                            {isAr ? `اعتماد الكل (${counts.high + counts.mid})` : `Approve All (${counts.high + counts.mid})`}
                          </button>
                          {counts.high > 0 && counts.mid > 0 && (
                            <button className="ci-btn-ghost" onClick={handleBulk} disabled={busy}>
                              {isAr ? `الثقة العالية فقط (${counts.high})` : `High-confidence only (${counts.high})`}
                            </button>
                          )}
                        </div>
                        <p className="ci-hint" style={{ marginTop: 8 }}>
                          {isAr
                            ? `«اعتماد الكل» يضيف كل المنتجات المتبقّية (${counts.high + counts.mid}) إلى الكتالوج الحي دفعة واحدة — استخدمه إذا كانت المراجعة كلها تمام.`
                            : `“Approve All” adds every remaining product (${counts.high + counts.mid}) to the live catalog at once — use it when the whole batch looks good.`}
                        </p>
                      </div>
                    )}
                    {reviewQueue.length > 0 && current ? (
                      <div className="ci-deck" tabIndex={0} ref={deckRef}>
                        <div className="ci-deck-head">
                          <span>{isAr ? 'مراجعة' : 'Review'} {Math.min(deckIdx + 1, reviewQueue.length)} / {reviewQueue.length}</span>
                          <span className="ci-deck-keys">{isAr ? 'Enter اعتماد · Del/Esc تخطٍّ · ← → تنقّل' : 'Enter approve · Del/Esc skip · ← → navigate'}</span>
                        </div>
                        <ProductReviewCard key={current.id} value={jsonFor(current)}
                          onChange={(j) => setEdits((e) => ({ ...e, [current.id]: j }))} product={current} lang={lang}
                          candidates={candidates} image={imgEdits[current.id] ?? current.image_path}
                          onImageChange={(url) => setImgEdits((m) => ({ ...m, [current.id]: url ?? current.image_path }))}
                          onSuggest={workerConfigured() ? suggestField : undefined} />
                        <div className="ci-deck-nav">
                          <button className="ci-btn-ghost" onClick={() => moveDeck(-1)} disabled={deckIdx <= 0}>← {isAr ? 'السابق' : 'Prev'}</button>
                          <button className="ci-btn-ghost" onClick={() => moveDeck(1)} disabled={deckIdx >= reviewQueue.length - 1}>{isAr ? 'التالي' : 'Next'} →</button>
                          <button className="ci-skip" onClick={skipCurrent} disabled={busy}>{isAr ? 'تخطٍّ' : 'Skip'}</button>
                          <button className="ci-approve" onClick={approveCurrent} disabled={busy}>{isAr ? 'اعتماد' : 'Approve'} ↵</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ padding: '6px 0' }}>
                        <p style={{ color: '#3f9d5a', fontSize: 14, fontFamily: FB, margin: '0 0 12px' }}>
                          {isAr ? 'تمت مراجعة جميع المنتجات المعلّقة.' : 'All pending products reviewed.'}
                        </p>
                        {batch.status !== 'approved' ? (
                          <button className="ci-btn-primary" onClick={handleFinalize} disabled={busy}>
                            {isAr ? 'إنهاء الاستيراد' : 'Finalize import'}
                          </button>
                        ) : (
                          <span style={{ fontSize: 13, color: '#3f9d5a', fontFamily: FB }}>{isAr ? '✓ تم إنهاء الاستيراد' : '✓ Import finalized'}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Danger — delete this whole import (staging row + raw images + PDF).
                  Approved products already in the factory catalog are NOT touched. */}
              <div style={{ marginTop: 4 }}>
                {!impDanger ? (
                  <button type="button" onClick={() => setImpDanger(true)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: FB, fontSize: 12, color: 'rgba(0,0,0,0.4)', padding: 0 }}>
                    {isAr ? 'حذف هذا الاستيراد…' : 'Delete this import…'}
                  </button>
                ) : (
                  <div style={{ border: '1px solid rgba(192,57,43,0.25)', borderRadius: 10, padding: '14px 16px', background: 'rgba(192,57,43,0.03)' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, fontFamily: FB, color: '#a23628', marginBottom: 4 }}>
                      {isAr ? 'حذف الاستيراد' : 'Delete import'}
                    </div>
                    <p className="ci-hint" style={{ margin: '0 0 12px' }}>
                      {isAr ? 'يحذف صف الاستيراد وصوره الخام والملف المصدر نهائياً. المنتجات المعتمَدة في كتالوج المصنع لا تتأثّر — لحذف المصنع نفسه استخدم «إدارة المصنع» بالأعلى.'
                            : 'Permanently deletes the import row, its raw images, and the source PDF. Products already approved into the factory catalog are NOT affected — to remove the factory itself use “Manage factory” above.'}
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                      <button type="button" className="ci-skip" disabled={canceling}
                        onClick={async () => {
                          setCanceling(true); setError('');
                          try { await deleteImport(id); nav('/admin/catalog-import'); }
                          catch (e) { setError((isAr ? 'تعذّر الحذف: ' : 'Delete failed: ') + (e.message || '')); setCanceling(false); }
                        }}
                        style={{ background: '#c0503f', color: '#fff' }}>
                        {canceling ? (isAr ? 'جارٍ الحذف…' : 'Deleting…') : (isAr ? 'نعم، احذف الاستيراد' : 'Yes, delete import')}
                      </button>
                      <button type="button" className="ci-btn-ghost" disabled={canceling} onClick={() => setImpDanger(false)}>
                        {isAr ? 'إلغاء' : 'Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
              </>)}
            </>
          )}
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
