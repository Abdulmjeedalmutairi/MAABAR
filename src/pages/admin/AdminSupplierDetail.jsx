import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminStatusBadge from '../../components/admin/AdminStatusBadge';
import AdminNoteThread from '../../components/admin/AdminNoteThread';
import { sb } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';
import { sendMaabarEmail } from '../../lib/maabarEmail';
import { normalizeSupplierDocStoragePath } from '../../lib/supplierOnboarding';
import { getSpecialtyLabel } from '../../lib/supplierDashboardConstants';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

function InfoRow({ label, value, mono }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>{label}</span>
      <span style={{ fontSize: 13, color: 'rgba(0,0,0,0.80)', wordBreak: 'break-word', fontFamily: mono ? "'Courier New', monospace" : FONT_BODY }}>
        {value || '—'}
      </span>
    </div>
  );
}

function SectionCard({ title, children, style }) {
  return (
    <div style={{ background: 'var(--bg-raised, #fff)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 10, padding: '20px 20px 18px', marginBottom: 12, ...style }}>
      {title && (
        <p style={{ margin: '0 0 16px', fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY }}>
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

function InfoGrid({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '14px 24px' }}>
      {children}
    </div>
  );
}

export default function AdminSupplierDetail({ user, profile, lang, ...rest }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [supplier, setSupplier] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [signedUrls, setSignedUrls] = useState({});

  // Phase 5 — product management
  const [products, setProducts] = useState([]);
  const [expandedProductId, setExpandedProductId] = useState(null);
  const [productVariants, setProductVariants] = useState({}); // productId → variants[]
  const [productTiers, setProductTiers] = useState({});       // productId → tiers[]
  const [productShipping, setProductShipping] = useState({}); // productId → shipping[]
  const [variantAction, setVariantAction] = useState(null);   // { variantId, type: 'toggle'|'stock', reason, value }
  const [savingVariant, setSavingVariant] = useState(null);

  const isAr = lang === 'ar';

  const getSignedUrl = useCallback(async (rawPath) => {
    const path = normalizeSupplierDocStoragePath(rawPath);
    if (!path) return null;
    const { data, error } = await sb.storage.from('supplier-docs').createSignedUrl(path, 60 * 30);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  }, []);

  const openDoc = useCallback(async (rawPath) => {
    const url = await getSignedUrl(rawPath);
    if (!url) { alert('Could not open file.'); return; }
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [getSignedUrl]);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: supplierData }, { data: productsData }] = await Promise.all([
      sb.from('profiles').select('*').eq('id', id).single(),
      sb.from('products').select('id, name_en, name_zh, name_ar, price_from, moq, is_active, has_variants, created_at').eq('supplier_id', id).order('created_at', { ascending: false }),
    ]);
    setSupplier(supplierData);
    // Fetch variant counts per product
    if (productsData?.length) {
      const variantCounts = await Promise.all(
        productsData.filter(p => p.has_variants).map(async (p) => {
          const { count } = await sb.from('product_variants').select('id', { count: 'exact', head: true }).eq('product_id', p.id);
          return [p.id, count || 0];
        })
      );
      const countMap = Object.fromEntries(variantCounts);
      setProducts((productsData || []).map(p => ({ ...p, variantCount: countMap[p.id] ?? null })));
    } else {
      setProducts(productsData || []);
    }
    setLoading(false);
  }, [id]);

  const loadProductVariants = useCallback(async (productId) => {
    const [varRes, tierRes, shipRes] = await Promise.all([
      sb.from('product_variants').select('*').eq('product_id', productId).order('created_at'),
      sb.from('product_pricing_tiers').select('*').eq('product_id', productId).order('qty_from'),
      sb.from('product_shipping_options').select('*').eq('product_id', productId),
    ]);
    setProductVariants(prev => ({ ...prev, [productId]: varRes.data || [] }));
    setProductTiers(prev => ({ ...prev, [productId]: tierRes.data || [] }));
    setProductShipping(prev => ({ ...prev, [productId]: shipRes.data || [] }));
  }, []);

  const toggleExpandProduct = (productId) => {
    if (expandedProductId === productId) { setExpandedProductId(null); return; }
    setExpandedProductId(productId);
    if (!productVariants[productId]) loadProductVariants(productId);
  };

  const adminToggleVariant = async (variant, reason) => {
    if (!reason?.trim()) { alert('Please enter a reason for the audit log.'); return; }
    setSavingVariant(variant.id);
    const newActive = !variant.is_active;
    const { error } = await sb.from('product_variants').update({ is_active: newActive }).eq('id', variant.id);
    if (error) { alert('Error: ' + error.message); setSavingVariant(null); return; }
    await logAdminAction({ actorId: user.id, action: newActive ? 'variant_activated' : 'variant_deactivated', entityType: 'product_variant', entityId: variant.id, beforeState: { is_active: variant.is_active }, afterState: { is_active: newActive }, notes: reason });
    await loadProductVariants(variant.product_id);
    setVariantAction(null);
    setSavingVariant(null);
    flash(`Variant ${newActive ? 'activated' : 'deactivated'}`);
  };

  const adminAdjustStock = async (variant, newStock, reason) => {
    if (!reason?.trim()) { alert('Please enter a reason for the audit log.'); return; }
    const stockNum = parseInt(newStock, 10);
    if (isNaN(stockNum) || stockNum < 0) { alert('Invalid stock value.'); return; }
    setSavingVariant(variant.id);
    const { error } = await sb.from('product_variants').update({ stock_qty: stockNum }).eq('id', variant.id);
    if (error) { alert('Error: ' + error.message); setSavingVariant(null); return; }
    await logAdminAction({ actorId: user.id, action: 'variant_stock_adjusted', entityType: 'product_variant', entityId: variant.id, beforeState: { stock_qty: variant.stock_qty }, afterState: { stock_qty: stockNum }, notes: reason });
    await loadProductVariants(variant.product_id);
    setVariantAction(null);
    setSavingVariant(null);
    flash(`Stock updated to ${stockNum}`);
  };

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!supplier) return;
    const rawPaths = [
      supplier.license_photo,
      supplier.factory_photo,
      ...(Array.isArray(supplier.factory_images) ? supplier.factory_images : []),
      ...(Array.isArray(supplier.factory_videos) ? supplier.factory_videos : []),
    ].filter(Boolean);

    Promise.all(
      rawPaths.map(async (raw) => {
        const signed = await getSignedUrl(raw);
        return [raw, signed];
      })
    ).then((entries) => {
      setSignedUrls(Object.fromEntries(entries.filter(([, v]) => v)));
    });
  }, [supplier, getSignedUrl]);

  const flash = (msg) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3500);
  };

  const updateStatus = async (newStatus, reason) => {
    if (!supplier) return;
    setSaving(true);
    const before = { status: supplier.status };
    const { error } = await sb.from('profiles').update({ status: newStatus }).eq('id', id);
    if (error) {
      flash(isAr ? `خطأ: ${error.message}` : `Error: ${error.message}`);
      setSaving(false);
      return;
    }
    await logAdminAction({
      actorId: user.id,
      action: `supplier_${newStatus}`,
      entityType: 'supplier',
      entityId: id,
      beforeState: before,
      afterState: { status: newStatus },
      notes: reason || null,
    });
    if (newStatus === 'active') {
      try {
        await sendMaabarEmail({
          type: 'supplier_approved',
          to: supplier.email,
          data: { name: supplier.full_name || '', lang: supplier.lang || 'en' },
        });
      } catch (e) { console.error('approval email error:', e); }
    }
    await load();
    flash(isAr ? 'تم التحديث بنجاح' : 'Status updated');
    setSaving(false);
    setShowRejectForm(false);
    setRejectReason('');
  };

  const CSS = `
    .sd-page { padding: 32px 32px; max-width: 920px; }
    .sd-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; color: rgba(0,0,0,0.38); font-size: 12px; padding: 0 0 22px; font-family: ${FONT_BODY}; min-height: 44px; letter-spacing: 0.3px; transition: color 0.12s; }
    .sd-back:hover { color: rgba(0,0,0,0.65); }
    .sd-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
    .sd-action-bar { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
    .sd-btn { min-height: 40px; padding: 0 18px; border-radius: 8px; border: none; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; font-family: ${FONT_BODY}; white-space: nowrap; }
    .sd-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .sd-btn-approve { background: #27725a; color: #fff; }
    .sd-btn-approve:hover:not(:disabled) { background: #1f5f49; }
    .sd-btn-reject { background: rgba(192,57,43,0.08); color: #c0392b; border: 1px solid rgba(192,57,43,0.2); }
    .sd-btn-reject:hover:not(:disabled) { background: rgba(192,57,43,0.13); }
    .sd-btn-ghost { background: transparent; color: rgba(0,0,0,0.45); border: 1px solid rgba(0,0,0,0.09); }
    .sd-btn-ghost:hover:not(:disabled) { background: rgba(0,0,0,0.04); color: rgba(0,0,0,0.72); }
    .sd-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #1a1814; color: #fff; padding: 10px 22px; border-radius: 99px; font-size: 12px; font-family: ${FONT_BODY}; z-index: 999; white-space: nowrap; pointer-events: none; }
    .sd-doc-link { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; background: transparent; color: rgba(0,0,0,0.65); font-size: 12px; cursor: pointer; font-family: ${FONT_BODY}; text-decoration: none; min-height: 40px; transition: all 0.12s; }
    .sd-doc-link:hover { background: rgba(0,0,0,0.04); border-color: rgba(0,0,0,0.14); }
    .sd-img-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; }
    .sd-img { width: 100%; aspect-ratio: 4/3; object-fit: cover; border-radius: 8px; background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.07); cursor: pointer; display: block; }
    @media (max-width: 900px) { .sd-page { padding: 22px 16px; } }
    @media (max-width: 600px) { .sd-header { flex-direction: column; } .sd-action-bar { width: 100%; } .sd-btn { flex: 1; text-align: center; } }
  `;

  if (loading) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="sd-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Loading…</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  if (!supplier) return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        <div className="sd-page"><p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>Supplier not found.</p></div>
      </AdminShell>
    </AdminRouteGuard>
  );

  const images = [supplier.factory_photo, ...(Array.isArray(supplier.factory_images) ? supplier.factory_images : [])].filter(Boolean);
  const docs = [supplier.license_photo && { label: isAr ? 'السجل التجاري' : 'Business License', url: supplier.license_photo }].filter(Boolean);

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        {actionMsg && <div className="sd-flash">{actionMsg}</div>}

        <div className="sd-page" dir={isAr ? 'rtl' : 'ltr'}>
          <button className="sd-back" onClick={() => nav('/admin/suppliers')}>
            {isAr ? '‹ الموردون' : '‹ Suppliers'}
          </button>

          {/* Header */}
          <div className="sd-header">
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 400, color: 'rgba(0,0,0,0.88)', fontFamily: FONT_HEADING, lineHeight: 1.1 }}>
                {supplier.full_name || supplier.email}
              </h1>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <AdminStatusBadge status={supplier.status} lang={lang} />
                {supplier.maabar_supplier_id && (
                  <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY, letterSpacing: 0.4 }}>{supplier.maabar_supplier_id}</span>
                )}
              </div>
            </div>
            <div className="sd-action-bar">
              {supplier.status === 'verification_under_review' && (
                <>
                  <button className="sd-btn sd-btn-approve" disabled={saving} onClick={() => updateStatus('active')}>
                    {saving ? '…' : (isAr ? 'قبول المورد' : 'Approve')}
                  </button>
                  <button className="sd-btn sd-btn-reject" disabled={saving} onClick={() => setShowRejectForm(v => !v)}>
                    {isAr ? 'رفض' : 'Reject'}
                  </button>
                </>
              )}
              {supplier.status === 'active' && (
                <button className="sd-btn sd-btn-ghost" disabled={saving} onClick={() => updateStatus('inactive')}>
                  {isAr ? 'إيقاف' : 'Deactivate'}
                </button>
              )}
              {(supplier.status === 'inactive' || supplier.status === 'rejected') && (
                <button className="sd-btn sd-btn-approve" disabled={saving} onClick={() => updateStatus('active')}>
                  {isAr ? 'إعادة تفعيل' : 'Reactivate'}
                </button>
              )}
            </div>
          </div>

          {/* Reject form */}
          {showRejectForm && (
            <SectionCard style={{ marginBottom: 12, borderColor: 'rgba(192,57,43,0.20)' }}>
              <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(0,0,0,0.55)', fontFamily: FONT_BODY }}>
                {isAr ? 'سبب الرفض (اختياري، للسجل الداخلي)' : 'Rejection reason (optional, internal record)'}
              </p>
              <textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={3}
                placeholder={isAr ? 'سبب الرفض...' : 'Reason for rejection…'}
                dir={isAr ? 'rtl' : 'ltr'}
                style={{ width: '100%', boxSizing: 'border-box', background: 'var(--bg-subtle, #F5F2EE)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY, resize: 'vertical', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="sd-btn sd-btn-reject" disabled={saving} onClick={() => updateStatus('rejected', rejectReason)}>
                  {saving ? '…' : (isAr ? 'تأكيد الرفض' : 'Confirm Rejection')}
                </button>
                <button className="sd-btn sd-btn-ghost" onClick={() => setShowRejectForm(false)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </SectionCard>
          )}

          {/* Account info */}
          <SectionCard title={isAr ? 'معلومات الحساب' : 'Account Info'}>
            <InfoGrid>
              <InfoRow label={isAr ? 'الاسم الكامل' : 'Full Name'} value={supplier.full_name} />
              <InfoRow label="Email" value={supplier.email} mono />
              <InfoRow label={isAr ? 'واتساب' : 'WhatsApp'} value={supplier.whatsapp} mono />
              <InfoRow label="WeChat" value={supplier.wechat} mono />
              <InfoRow label={isAr ? 'تاريخ الانضمام' : 'Joined'} value={supplier.created_at ? new Date(supplier.created_at).toLocaleString('en-GB') : '—'} mono />
              <InfoRow label={isAr ? 'معرّف معبر' : 'Maabar ID'} value={supplier.maabar_supplier_id} mono />
            </InfoGrid>
          </SectionCard>

          {/* Company */}
          <SectionCard title={isAr ? 'بيانات الشركة' : 'Company'}>
            <InfoGrid>
              <InfoRow label={isAr ? 'اسم الشركة' : 'Company Name'} value={supplier.company_name} />
              <InfoRow label={isAr ? 'الدولة' : 'Country'} value={supplier.country} />
              <InfoRow label={isAr ? 'المدينة' : 'City'} value={supplier.city} />
              <InfoRow label={isAr ? 'التخصص' : 'Speciality'} value={getSpecialtyLabel(supplier.speciality, lang)} />
              <InfoRow label={isAr ? 'نوع النشاط' : 'Business Type'} value={supplier.business_type} />
              <InfoRow label={isAr ? 'سنة التأسيس' : 'Est. Year'} value={supplier.year_established} />
              <InfoRow label={isAr ? 'عدد الموظفين' : 'Employees'} value={supplier.num_employees} />
              <InfoRow label={isAr ? 'سنوات الخبرة' : 'Experience (yrs)'} value={supplier.years_experience} />
              <InfoRow label={isAr ? 'رقم السجل' : 'Reg Number'} value={supplier.reg_number} mono />
            </InfoGrid>
            {supplier.trade_link && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>
                  {isAr ? 'رابط التجارة' : 'Trade Link'}
                </p>
                <a href={supplier.trade_link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'rgba(0,0,0,0.60)', wordBreak: 'break-all', fontFamily: FONT_BODY }}>
                  {supplier.trade_link} ↗
                </a>
              </div>
            )}
          </SectionCard>

          {/* Documents */}
          {docs.length > 0 && (
            <SectionCard title={isAr ? 'المستندات' : 'Documents'}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {docs.map((doc, i) => (
                  <button key={i} onClick={() => openDoc(doc.url)} className="sd-doc-link" style={{ cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}>
                    {doc.label} ↗
                  </button>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Factory images */}
          {images.length > 0 && (
            <SectionCard title={isAr ? 'صور المصنع' : 'Factory Photos'}>
              <div className="sd-img-grid">
                {images.map((raw, i) => {
                  const signed = signedUrls[raw];
                  return signed ? (
                    <a key={i} href={signed} target="_blank" rel="noopener noreferrer">
                      <img src={signed} alt={`Factory ${i + 1}`} className="sd-img" />
                    </a>
                  ) : (
                    <div key={i} className="sd-img" style={{ background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>…</div>
                  );
                })}
              </div>
            </SectionCard>
          )}

          {/* ── Phase 5: Products ── */}
          {products.length > 0 && (
            <SectionCard title="Products">
              {products.map(p => {
                const isExpanded = expandedProductId === p.id;
                const variants = productVariants[p.id] || [];
                const tiers = productTiers[p.id] || [];
                const shipping = productShipping[p.id] || [];
                const productName = p.name_en || p.name_zh || p.name_ar || p.id;
                return (
                  <div key={p.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', marginBottom: 0, paddingBottom: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', cursor: 'pointer' }} onClick={() => p.has_variants && toggleExpandProduct(p.id)}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.80)', marginBottom: 2, fontFamily: FONT_BODY }}>{productName}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>MOQ {p.moq || '—'}</span>
                          {p.price_from && <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>${p.price_from}</span>}
                          {p.has_variants && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY }}>{p.variantCount ?? '?'} variants</span>}
                          {/* Flag unusual pricing: product > 10x no baseline, just flag if no price */}
                        </div>
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 99, background: p.is_active ? 'rgba(39,114,90,0.1)' : 'rgba(0,0,0,0.05)', color: p.is_active ? '#27725a' : 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>{p.is_active ? 'Active' : 'Inactive'}</span>
                      {p.has_variants && <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY }}>{isExpanded ? '▲' : '▼'}</span>}
                    </div>

                    {isExpanded && p.has_variants && (
                      <div style={{ paddingBottom: 16 }}>
                        {/* Variant matrix */}
                        {variants.length > 0 ? (
                          <div style={{ overflowX: 'auto', marginBottom: 14 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11, fontFamily: FONT_BODY }}>
                              <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                                  {['SKU', 'Price (USD)', 'MOQ', 'Stock', 'Lead (days)', 'Active', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '6px 10px', textAlign: 'left', color: 'rgba(0,0,0,0.38)', fontWeight: 600, letterSpacing: 0.8, whiteSpace: 'nowrap', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {variants.map(v => {
                                  const basePrice = products.find(pr => pr.id === v.product_id)?.price_from;
                                  const unusualPrice = basePrice && v.price_usd && v.price_usd > basePrice * 10;
                                  return (
                                    <tr key={v.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                      <td style={{ padding: '8px 10px', fontFamily: 'monospace', color: 'rgba(0,0,0,0.60)', fontSize: 10 }}>{v.sku || '—'}</td>
                                      <td style={{ padding: '8px 10px', color: unusualPrice ? '#c0392b' : 'rgba(0,0,0,0.70)' }}>
                                        ${Number(v.price_usd || 0).toFixed(2)}
                                        {unusualPrice && <span style={{ marginInlineStart: 4, fontSize: 9, background: 'rgba(192,57,43,0.1)', color: '#c0392b', padding: '1px 5px', borderRadius: 99 }}>⚠ unusual</span>}
                                      </td>
                                      <td style={{ padding: '8px 10px', color: 'rgba(0,0,0,0.60)' }}>{v.moq || '—'}</td>
                                      <td style={{ padding: '8px 10px', color: v.stock_qty != null ? (v.stock_qty > 0 ? '#27725a' : '#c0392b') : 'rgba(0,0,0,0.30)' }}>{v.stock_qty ?? '—'}</td>
                                      <td style={{ padding: '8px 10px', color: 'rgba(0,0,0,0.60)' }}>{v.lead_time_days ?? '—'}</td>
                                      <td style={{ padding: '8px 10px' }}>
                                        <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: v.is_active ? 'rgba(39,114,90,0.1)' : 'rgba(0,0,0,0.05)', color: v.is_active ? '#27725a' : 'rgba(0,0,0,0.35)' }}>
                                          {v.is_active ? 'Active' : 'Off'}
                                        </span>
                                      </td>
                                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                                        <button
                                          onClick={() => setVariantAction({ variantId: v.id, productId: v.product_id, type: 'toggle', variant: v, reason: '', value: '' })}
                                          style={{ fontSize: 10, padding: '3px 8px', marginInlineEnd: 6, background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, cursor: 'pointer', color: 'rgba(0,0,0,0.50)', fontFamily: FONT_BODY }}>
                                          {v.is_active ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                          onClick={() => setVariantAction({ variantId: v.id, productId: v.product_id, type: 'stock', variant: v, reason: '', value: String(v.stock_qty ?? '') })}
                                          style={{ fontSize: 10, padding: '3px 8px', background: 'none', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, cursor: 'pointer', color: 'rgba(0,0,0,0.50)', fontFamily: FONT_BODY }}>
                                          Stock
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, padding: '8px 0' }}>No active variants found.</p>
                        )}

                        {/* Inline action form */}
                        {variantAction?.productId === p.id && (
                          <div style={{ padding: '14px 16px', borderRadius: 8, border: '1px solid rgba(0,0,0,0.10)', background: 'rgba(0,0,0,0.02)', marginBottom: 12 }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.60)', fontFamily: FONT_BODY, marginBottom: 10 }}>
                              {variantAction.type === 'toggle' ? `${variantAction.variant.is_active ? 'Deactivate' : 'Activate'} variant — ${variantAction.variant.sku || variantAction.variantId.slice(0, 8)}` : `Adjust stock — ${variantAction.variant.sku || variantAction.variantId.slice(0, 8)}`}
                            </p>
                            {variantAction.type === 'stock' && (
                              <div style={{ marginBottom: 8 }}>
                                <label style={{ fontSize: 10, color: 'rgba(0,0,0,0.40)', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT_BODY, display: 'block', marginBottom: 4 }}>New Stock Qty</label>
                                <input
                                  type="number" min="0"
                                  value={variantAction.value}
                                  onChange={e => setVariantAction(prev => ({ ...prev, value: e.target.value }))}
                                  style={{ width: 120, padding: '6px 10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: 13, fontFamily: FONT_BODY }}
                                />
                              </div>
                            )}
                            <div style={{ marginBottom: 10 }}>
                              <label style={{ fontSize: 10, color: 'rgba(0,0,0,0.40)', letterSpacing: 0.8, textTransform: 'uppercase', fontFamily: FONT_BODY, display: 'block', marginBottom: 4 }}>Reason (required, logged to audit_log)</label>
                              <input
                                type="text"
                                value={variantAction.reason}
                                onChange={e => setVariantAction(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="e.g. Quality issue, restock, admin correction…"
                                style={{ width: '100%', boxSizing: 'border-box', padding: '6px 10px', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 6, fontSize: 13, fontFamily: FONT_BODY }}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                className="sd-btn sd-btn-approve"
                                disabled={savingVariant === variantAction.variantId}
                                onClick={() => {
                                  if (variantAction.type === 'toggle') adminToggleVariant(variantAction.variant, variantAction.reason);
                                  else adminAdjustStock(variantAction.variant, variantAction.value, variantAction.reason);
                                }}
                              >
                                {savingVariant === variantAction.variantId ? '…' : 'Confirm'}
                              </button>
                              <button className="sd-btn sd-btn-ghost" onClick={() => setVariantAction(null)}>Cancel</button>
                            </div>
                          </div>
                        )}

                        {/* Tiered pricing (read-only) */}
                        {tiers.length > 0 && (
                          <div style={{ marginBottom: 12 }}>
                            <p style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 6, fontFamily: FONT_BODY }}>Tiered Pricing</p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {tiers.map((t, i) => (
                                <div key={i} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.02)' }}>
                                  <p style={{ fontSize: 10, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY }}>{t.qty_to ? `${t.qty_from}–${t.qty_to}` : `${t.qty_from}+`}</p>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.70)', fontFamily: FONT_BODY }}>${Number(t.unit_price_usd).toFixed(2)}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Shipping options (read-only) */}
                        {shipping.length > 0 && (
                          <div>
                            <p style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', color: 'rgba(0,0,0,0.35)', marginBottom: 6, fontFamily: FONT_BODY }}>Shipping Options</p>
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {shipping.map((s, i) => (
                                <div key={i} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(0,0,0,0.08)', background: s.enabled ? 'rgba(39,114,90,0.05)' : 'rgba(0,0,0,0.02)' }}>
                                  <p style={{ fontSize: 10, color: 'rgba(0,0,0,0.40)', fontFamily: FONT_BODY, textTransform: 'capitalize' }}>{s.method}</p>
                                  <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.60)', fontFamily: FONT_BODY }}>{s.lead_time_days ? `${s.lead_time_days}d` : '—'} {s.cost_usd ? `· $${s.cost_usd}` : ''}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </SectionCard>
          )}

          {/* Notes */}
          <SectionCard>
            <AdminNoteThread entityType="supplier" entityId={id} user={user} lang={lang} />
          </SectionCard>
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
