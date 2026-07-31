import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import FactoryFieldsPanel from '../../components/admin/catalog/FactoryFieldsPanel';
import ProfileImagePicker from '../../components/admin/catalog/ProfileImagePicker';
import { fetchImport, fetchFactories, resolveFactory, HIGH_CONF } from '../../lib/catalogImport';

const FH = "'Cormorant Garamond', Georgia, serif";
const FB = "'Tajawal', sans-serif";

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
  const [savedFactoryId, setSavedFactoryId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState({ ok: false, text: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { batch: b, products: p } = await fetchImport(id);
      setBatch(b); setProducts(p);
      setFields(b?.factory_fields || {});
      setSavedFactoryId(b?.factory_id || null);
      setProfileSel(b?.profile_image_path || null);
      if (b?.factory_id) { setMode('existing'); setExistingId(b.factory_id); }
      setError('');
    } catch (e) { setError(e.message || 'Failed to load'); }
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { fetchFactories().then(setFactories).catch(() => {}); }, []);

  const candidates = (fields?.profile_candidates && fields.profile_candidates.length)
    ? fields.profile_candidates
    : (batch?.profile_image_path ? [batch.profile_image_path] : []);

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
      setSaveMsg({ ok: true, text: isAr ? 'تم حفظ المصنع.' : 'Factory saved.' });
      await load();
    } catch (e) {
      setSaveMsg({ ok: false, text: (isAr ? 'خطأ: ' : 'Error: ') + (e.message || '') });
    }
    setSaving(false);
  }

  const counts = {
    total: products.length,
    high: products.filter((p) => p.status === 'pending' && (p.confidence_score ?? 0) >= HIGH_CONF).length,
    mid: products.filter((p) => p.status === 'pending' && (p.confidence_score ?? 0) < HIGH_CONF).length,
    approved: products.filter((p) => p.status === 'approved').length,
    skipped: products.filter((p) => p.status === 'skipped').length,
  };

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
                {counts.total} {isAr ? 'منتج' : 'products'} · {batch.page_count} {isAr ? 'صفحة' : 'pages'} · {isAr ? 'الحالة' : 'status'}: {batch.status}
              </p>

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
                <ProfileImagePicker candidates={candidates} selected={profileSel} onSelect={setProfileSel} lang={lang} />
              </div>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22, flexWrap: 'wrap' }}>
                <button className="ci-btn-primary" onClick={saveFactory} disabled={saving}>
                  {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving…')
                    : savedFactoryId ? (isAr ? 'تحديث المصنع' : 'Update factory')
                      : (isAr ? 'حفظ المصنع + الصورة' : 'Save factory + image')}
                </button>
                {saveMsg.text && (
                  <span style={{ fontSize: 13, color: saveMsg.ok ? '#3f9d5a' : '#c0392b', fontFamily: FB }}>{saveMsg.text}</span>
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
                <p className="ci-hint">
                  {savedFactoryId
                    ? (isAr ? 'أدوات الاعتماد (اعتماد جماعي للثقة العالية + مراجعة فردية بلوحة المفاتيح) تُضاف في الخطوة التالية.'
                      : 'Approval tools (bulk-approve high-confidence + keyboard card review) arrive in the next commit.')
                    : (isAr ? 'احفظ المصنع أولاً لتفعيل اعتماد المنتجات.' : 'Save the factory first to enable product approval.')}
                </p>
              </div>
            </>
          )}
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
