import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import Footer from '../components/Footer';
import {
  getOfferEstimatedTotal,
  getOfferProductSubtotal,
  getOfferShippingCost,
} from '../lib/offerPricing';
import { runWithOptionalColumns } from '../lib/supabaseColumnFallback';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

// جلب سعر الصرف USD → SAR
const getUsdToSar = async () => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    return data?.rates?.SAR || 3.75;
  } catch {
    return 3.75; // fallback ثابت
  }
};

const CATEGORIES = {
  ar: [
    { val: 'electronics', label: 'إلكترونيات' },
    { val: 'furniture',   label: 'أثاث' },
    { val: 'clothing',    label: 'ملابس' },
    { val: 'building',    label: 'مواد بناء' },
    { val: 'food',        label: 'غذاء' },
    { val: 'other',       label: 'أخرى' },
  ],
  en: [
    { val: 'electronics', label: 'Electronics' },
    { val: 'furniture',   label: 'Furniture' },
    { val: 'clothing',    label: 'Clothing' },
    { val: 'building',    label: 'Building Materials' },
    { val: 'food',        label: 'Food' },
    { val: 'other',       label: 'Other' },
  ],
  zh: [
    { val: 'electronics', label: '电子产品' },
    { val: 'furniture',   label: '家具' },
    { val: 'clothing',    label: '服装' },
    { val: 'building',    label: '建材' },
    { val: 'food',        label: '食品' },
    { val: 'other',       label: '其他' },
  ],
};

/* ─── Skeleton ───────────────────────────── */
const SkeletonCard = () => (
  <div style={{
    border: '1px solid var(--border-subtle)',
    padding: '20px 24px', marginBottom: 10,
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-subtle)',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: '25%', height: 10, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ width: '55%', height: 14, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ width: '40%', height: 10, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div style={{ width: 96, height: 34, background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
    </div>
  </div>
);

/* ─── Main ───────────────────────────────── */
export default function Requests({ lang, user, profile }) {
  const nav = useNavigate();
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [search, setSearch]       = useState('');
  const [budgetRange, setBudgetRange] = useState({ min: '', max: '' });
  const [offerForms, setOfferForms] = useState({});
  const [offers, setOffers]       = useState({});
  const [submittingOfferId, setSubmittingOfferId] = useState(null);
  const [usdRate, setUsdRate]     = useState(3.75);
  useEffect(() => { getUsdToSar().then(r => setUsdRate(r)); }, []);
  const [newReq, setNewReq]       = useState({ title_ar: '', title_en: '', quantity: '', description: '', category: 'other', budget_per_unit: '', payment_plan: '', sample_requirement: '', image_url: '' });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingRef, setUploadingRef] = useState(false);
  const [showAllRequests, setShowAllRequests] = useState(true);
  const refImageRef = useRef(null);
  const isAr       = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';
  const cats       = CATEGORIES[lang] || CATEGORIES.ar;

  // Load request draft from sessionStorage on mount (buyer)
  useEffect(() => {
    if (!isSupplier) {
      const draft = sessionStorage.getItem('maabar_request_draft');
      if (draft) {
        try { setNewReq(prev => ({ ...prev, ...JSON.parse(draft) })); } catch {}
      }
    }
  }, []);

  // Save request form to sessionStorage on every change (buyer)
  useEffect(() => {
    if (!isSupplier) {
      sessionStorage.setItem('maabar_request_draft', JSON.stringify(newReq));
    }
  }, [newReq, isSupplier]);

  // Redirect non-logged-in visitor who arrives at /requests via supplier path
  useEffect(() => {
    if (user && !isSupplier && profile?.role === 'supplier') nav('/login/supplier');
  }, [user, profile]);

  useEffect(() => { if (isSupplier) loadRequests(); }, [user, profile, showAllRequests]);

  const loadRequests = async () => {
    setLoading(true);
    let query = sb
      .from('requests')
      .select('*,profiles(full_name,company_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false });
    // Filter by supplier's speciality unless "show all" toggled
    if (!showAllRequests && profile?.speciality) {
      query = query.eq('category', profile.speciality);
    }
    const { data } = await query;
    if (data) setRequests(data);
    setLoading(false);
  };

  const uploadRefImage = async (file) => {
    if (!file) return;
    setUploadingRef(true);
    const path = `requests/${Date.now()}_ref.${file.name.split('.').pop()}`;
    const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: true });
    setUploadingRef(false);
    if (error) { console.error('ref image upload error:', error); return; }
    const { data: { publicUrl } } = sb.storage.from('product-images').getPublicUrl(path);
    setNewReq(prev => ({ ...prev, image_url: publicUrl }));
  };

  const submitNewRequest = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!newReq.title_ar || !newReq.quantity || !newReq.payment_plan || !newReq.sample_requirement) {
      alert(isAr ? 'يرجى تعبئة الحقول المطلوبة' : lang === 'zh' ? '请填写必填字段' : 'Fill required fields');
      return;
    }
    setSubmitting(true);
    console.log('Sending request:', JSON.stringify(newReq));
    const { error } = await sb.from('requests').insert({
      buyer_id: user.id,
      title_ar: newReq.title_ar,
      title_en: newReq.title_en || newReq.title_ar,
      title_zh: newReq.title_ar,
      quantity: newReq.quantity,
      description: newReq.description,
      category: newReq.category || 'other',
      status: 'open',
      budget_per_unit: newReq.budget_per_unit ? parseFloat(newReq.budget_per_unit) : null,
      payment_plan: newReq.payment_plan ? parseInt(newReq.payment_plan) : null,
      sample_requirement: newReq.sample_requirement,
      reference_image: newReq.reference_image || newReq.image_url || null,
    });
    console.log('Supabase error:', JSON.stringify(error));
    setSubmitting(false);
    if (error) { alert(isAr ? 'حدث خطأ' : lang === 'zh' ? '发生错误' : 'Error'); return; }
    alert(isAr ? 'تم رفع طلبك! سيتواصل معك الموردون قريباً' : 'Request posted! Suppliers will contact you soon');
    sessionStorage.removeItem('maabar_request_draft');
    setNewReq({ title_ar: '', title_en: '', quantity: '', description: '', category: 'other', budget_per_unit: '', payment_plan: '', sample_requirement: '', image_url: '' });
  };

  const toggleOfferForm = (id) => {
    setOfferForms(prev => ({ ...prev, [id]: !prev[id] }));
    setOffers(prev => ({
      ...prev,
      [id]: prev[id] || {
        price: '',
        shippingCost: '',
        shippingMethod: '',
        moq: '',
        days: '',
        origin: 'China',
        note: '',
      },
    }));
  };

  const submitOffer = async (requestId, buyerId) => {
    const o = offers[requestId] || {};
    const price = parseFloat(o.price);
    const shippingCost = parseFloat(o.shippingCost);
    const days = parseInt(o.days, 10);
    const moq = String(o.moq || '').trim();
    const origin = String(o.origin || 'China').trim();
    const shippingMethod = String(o.shippingMethod || '').trim();
    const note = String(o.note || '').trim();
    const requestItem = requests.find(r => r.id === requestId);
    const estimatedTotal = getOfferEstimatedTotal({ price, shipping_cost: shippingCost }, requestItem);

    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(shippingCost) || shippingCost < 0 || !moq || !Number.isFinite(days) || days <= 0) {
      alert(isAr ? 'تأكد من سعر الوحدة وتكلفة الشحن و MOQ ومدة التسليم قبل الإرسال' : lang === 'zh' ? '请先确认单价、运费、起订量和交期是否正确' : 'Please check unit price, shipping cost, MOQ, and delivery days before sending');
      return;
    }

    setSubmittingOfferId(requestId);
    try {
      const { data: existing, error: existingError } = await sb.from('offers').select('id').eq('request_id', requestId).eq('supplier_id', user.id).not('status', 'eq', 'cancelled').limit(1).maybeSingle();
      if (existingError) throw existingError;
      if (existing) {
        alert(isAr ? 'لقد قدمت عرضاً على هذا الطلب مسبقاً' : lang === 'zh' ? '您已提交过此需求的报价' : 'You already submitted an offer on this request');
        return;
      }

      const { error } = await runWithOptionalColumns({
        table: 'offers',
        payload: {
          request_id: requestId,
          supplier_id: user.id,
          price,
          shipping_cost: shippingCost,
          shipping_method: shippingMethod || null,
          moq,
          delivery_days: days,
          origin,
          note: note || null,
          status: 'pending',
        },
        optionalKeys: ['shipping_cost', 'shipping_method'],
        execute: (nextPayload) => sb.from('offers').insert(nextPayload),
      });
      if (error) throw error;

      await sb.from('requests').update({ status: 'offers_received' }).eq('id', requestId).eq('status', 'open');
      await sb.from('notifications').insert({
        user_id: buyerId, type: 'new_offer',
        title_ar: 'وصلك عرض جديد على طلبك',
        title_en: 'You received a new offer',
        title_zh: '您收到了新报价',
        ref_id: requestId, is_read: false,
      });
      try {
        await fetch(SEND_EMAILS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            type: 'new_offer',
            data: {
              recipientUserId: buyerId,
              name: 'Trader',
              requestTitle: requestItem?.title_ar || requestItem?.title_en || '',
              supplierName: profile?.company_name || user?.email?.split('@')[0] || 'Supplier',
              price,
              shippingCost,
              shippingMethod,
              estimatedTotal,
              deliveryDays: days,
              lang,
            },
          }),
        });
      } catch (e) { console.error('email error:', e); }
      alert(isAr ? 'تم إرسال عرضك!' : lang === 'zh' ? '报价已发送！' : 'Offer submitted!');
      toggleOfferForm(requestId);
      loadRequests();
    } catch (error) {
      console.error('submitOffer error:', error);
      alert(isAr ? 'حدث خطأ أثناء إرسال العرض' : lang === 'zh' ? '发送报价时出错' : 'Error sending offer');
    } finally {
      setSubmittingOfferId(null);
    }
  };

  const filtered = requests
    .filter(r =>
      (r.title_ar || '').includes(search) ||
      (r.title_en || '').toLowerCase().includes(search.toLowerCase())
    )
    .filter(r => !budgetRange.min || !r.budget_per_unit || (parseFloat(r.budget_per_unit) >= parseFloat(budgetRange.min)))
    .filter(r => !budgetRange.max || !r.budget_per_unit || (parseFloat(r.budget_per_unit) <= parseFloat(budgetRange.max)));

  const fmtDate = (d) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 3600)  return isAr ? Math.floor(diff / 60) + ' دقيقة'  : Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' ساعة' : Math.floor(diff / 3600) + 'h ago';
    return isAr ? Math.floor(diff / 86400) + ' يوم' : Math.floor(diff / 86400) + 'd ago';
  };

  return (
    <div className="supplier-req-wrap">

      {/* ── Header ─────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className={`page-title${isAr ? ' ar' : ''}`}>
            {isSupplier
              ? (isAr ? 'طلبات التجار' : lang === 'zh' ? '采购需求' : 'Trader Requests')
              : (isAr ? 'ارفع طلبك' : lang === 'zh' ? '发布需求' : 'Post Your Request')}
          </h1>
          <p className={`page-sub${isAr ? ' ar' : ''}`}>
            {isSupplier
              ? (isAr ? 'قدم عرضك على الطلبات المفتوحة' : 'Submit offers on open requests')
              : (isAr ? 'اكتب طلبك وموردون صينيون يتنافسون لك' : 'Post your request and suppliers compete for you')}
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════
          واجهة التاجر / الزائر
      ════════════════════════════════════ */}
      {!isSupplier && (
        <div style={{ padding: '40px 60px', maxWidth: 820 }}>

          {/* Draft restore banner */}
          {user && sessionStorage.getItem('maabar_request_draft') && (() => {
            try { const d = JSON.parse(sessionStorage.getItem('maabar_request_draft')); return d.title_ar || d.title_en; } catch { return false; }
          })() && (
            <div style={{
              background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)',
              padding: '12px 18px', borderRadius: 'var(--radius-lg)', marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 13, color: '#5a9a72', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isAr ? '📝 طلبك محفوظ — أكمل الإرسال' : '📝 Your draft is saved — complete submission'}
              </span>
            </div>
          )}

          {/* إرشاد للزائر */}
          {!user && (
            <div style={{
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border-subtle)',
              padding: '18px 22px',
              borderRadius: 'var(--radius-lg)',
              marginBottom: 32,
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap', gap: 12,
            }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {isAr ? 'كيف يشتغل مَعبر؟' : 'How does Maabar work?'}
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {isAr
                    ? 'اكتب طلبك ← موردون صينيون يرسلون عروضهم ← اختر الأفضل ← استلم بضاعتك'
                    : 'Post request ← Suppliers send offers ← Choose the best ← Receive your order'}
                </p>
              </div>
              <button onClick={() => nav('/login/buyer')} style={{
                background: 'rgba(255,255,255,0.88)', color: '#0a0a0b',
                border: 'none', padding: '9px 20px',
                fontSize: 12, fontWeight: 500,
                cursor: 'pointer', borderRadius: 'var(--radius-md)',
                whiteSpace: 'nowrap', transition: 'all 0.15s',
                minHeight: 36,
              }}>
                {isAr ? 'تسجيل مجاني' : 'Free Sign Up'}
              </button>
            </div>
          )}

          {/* فورم الطلب */}
          <div style={{
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-muted)',
            padding: '32px 36px',
            borderRadius: 'var(--radius-xl)',
          }}>
            <h3 style={{
              fontSize: 20, fontWeight: 400,
              color: 'var(--text-primary)',
              marginBottom: 6,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              letterSpacing: isAr ? 0 : -0.3,
            }}>
              {isAr ? 'طلب تسعيرة جديد' : 'New Sourcing Request'}
            </h3>
            <p style={{
              color: 'var(--text-disabled)', fontSize: 13,
              marginBottom: 28, lineHeight: 1.7,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}>
              {isAr
                ? 'أكتب تفاصيل المنتج اللي تبيه وسيتواصل معك الموردون بأفضل الأسعار'
                : 'Describe what you need and suppliers will send you their best prices'}
            </p>

            {/* Category */}
            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>
                {isAr ? 'نوع المنتج *' : 'Product Category *'}
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cats.map(c => (
                  <button key={c.val} onClick={() => setNewReq({ ...newReq, category: c.val })} style={{
                    padding: '6px 14px', fontSize: 12,
                    borderRadius: 20, cursor: 'pointer',
                    transition: 'all 0.15s',
                    background: newReq.category === c.val ? 'var(--bg-raised)' : 'transparent',
                    color: newReq.category === c.val ? 'var(--text-primary)' : 'var(--text-disabled)',
                    border: '1px solid',
                    borderColor: newReq.category === c.val ? 'var(--border-muted)' : 'var(--border-subtle)',
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                    minHeight: 32,
                  }}>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>
                  {isAr ? 'اسم المنتج بالعربي *' : 'Product Name *'}
                </label>
                <input className="form-input"
                  value={newReq.title_ar}
                  onChange={e => setNewReq({ ...newReq, title_ar: e.target.value })}
                  placeholder={isAr ? 'مثال: كراسي مكتب' : 'e.g. Office Chairs'}
                  dir={isAr ? 'rtl' : 'ltr'}
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  {isAr ? 'اسم المنتج بالإنجليزي' : 'Product Name (EN)'}
                </label>
                <input className="form-input"
                  value={newReq.title_en}
                  onChange={e => setNewReq({ ...newReq, title_en: e.target.value })}
                  placeholder="e.g. Office Chairs"
                />
              </div>
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>
                  {isAr ? 'الكمية المطلوبة *' : 'Quantity *'}
                </label>
                <input className="form-input"
                  value={newReq.quantity}
                  onChange={e => setNewReq({ ...newReq, quantity: e.target.value })}
                  placeholder={isAr ? 'مثال: 500 قطعة' : 'e.g. 500 units'}
                />
              </div>
            </div>

            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>
                {isAr ? 'المواصفات المطلوبة' : 'Required Specifications'}
              </label>
              <textarea className="form-input" rows={3}
                style={{ resize: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                value={newReq.description}
                onChange={e => setNewReq({ ...newReq, description: e.target.value })}
                placeholder={isAr ? 'المواصفات، اللون، الجودة، المعايير...' : 'Specs, color, quality, standards...'}
                dir={isAr ? 'rtl' : 'ltr'}
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>
                  {isAr ? 'الميزانية لكل وحدة (ريال)' : 'Budget per Unit (SAR)'}
                </label>
                <input className="form-input" type="number" min="0"
                  value={newReq.budget_per_unit}
                  onChange={e => setNewReq({ ...newReq, budget_per_unit: e.target.value })}
                  placeholder={isAr ? 'اختياري' : 'Optional'}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>
                {isAr ? 'خطة الدفع *' : 'Payment Plan *'}
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { val: '30', ar: '30% مقدماً', en: '30% upfront' },
                  { val: '50', ar: '50% مقدماً', en: '50% upfront' },
                  { val: '100', ar: '100% مقدماً', en: '100% upfront' },
                ].map(p => (
                  <button key={p.val} type="button" onClick={() => setNewReq({ ...newReq, payment_plan: p.val })} style={{
                    padding: '7px 16px', fontSize: 12, borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                    background: newReq.payment_plan === p.val ? 'var(--bg-raised)' : 'transparent',
                    color: newReq.payment_plan === p.val ? 'var(--text-primary)' : 'var(--text-disabled)',
                    border: '1px solid',
                    borderColor: newReq.payment_plan === p.val ? 'var(--border-muted)' : 'var(--border-subtle)',
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                    minHeight: 32,
                  }}>
                    {isAr ? p.ar : p.en}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>
                {isAr ? 'متطلبات العينة *' : 'Sample Requirement *'}
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { val: 'none',      ar: 'لا حاجة لعينة',                 en: 'No sample needed' },
                  { val: 'preferred', ar: 'عينة مفضلة إن توفرت',           en: 'Sample preferred if available' },
                  { val: 'required',  ar: 'عينة إلزامية',                  en: 'Sample is mandatory' },
                ].map(s => (
                  <label key={s.val} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    <input type="radio" name="sample_req" value={s.val} checked={newReq.sample_requirement === s.val} onChange={() => setNewReq({ ...newReq, sample_requirement: s.val })} style={{ accentColor: 'var(--text-secondary)', cursor: 'pointer' }} />
                    {isAr ? s.ar : s.en}
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>
                {isAr ? 'صورة مرجعية (اختياري)' : 'Reference Image (optional)'}
              </label>
              <input ref={refImageRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={e => uploadRefImage(e.target.files[0])} />
              {newReq.image_url ? (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={newReq.image_url} alt="" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }} />
                  <button type="button" onClick={() => setNewReq({ ...newReq, image_url: '' })} style={{ fontSize: 11, color: '#a07070', background: 'none', border: 'none', cursor: 'pointer' }}>
                    {isAr ? 'إزالة' : 'Remove'}
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => refImageRef.current?.click()} className="btn-outline" style={{ marginTop: 6, fontSize: 11, padding: '7px 16px', minHeight: 32 }}>
                  {uploadingRef ? (isAr ? 'جاري الرفع...' : 'Uploading...') : (isAr ? 'رفع صورة' : 'Upload Image')}
                </button>
              )}
            </div>

            {!user && (
              <p style={{
                fontSize: 12, color: 'var(--text-disabled)',
                marginBottom: 20, padding: '10px 14px',
                background: 'var(--bg-muted)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              }}>
                {isAr ? 'سيُطلب منك تسجيل الدخول عند إرسال الطلب' : "You'll be asked to sign in when submitting"}
              </p>
            )}

            <button
              className="btn-dark-sm"
              onClick={submitNewRequest}
              disabled={submitting}
              style={{ padding: '12px 28px', fontSize: 14, minHeight: 46 }}>
              {submitting ? '...' : isAr ? 'إرسال الطلب' : 'Submit Request'}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════
          واجهة المورد
      ════════════════════════════════════ */}
      {isSupplier && (
        <div className="list-wrap">

          <div className="search-bar" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input className="search-input"
              placeholder={isAr ? 'ابحث...' : 'Search...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
              dir={isAr ? 'rtl' : 'ltr'}
              style={{ flex: 1 }}
            />
            {profile?.speciality && (
              <button
                onClick={() => setShowAllRequests(p => !p)}
                className="btn-outline"
                style={{ fontSize: 11, padding: '7px 14px', minHeight: 36, whiteSpace: 'nowrap', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {showAllRequests
                  ? (isAr ? 'طلبات تخصصي فقط' : 'My Specialty Only')
                  : (isAr ? 'عرض كل الطلبات' : 'Show All Requests')}
              </button>
            )}
          </div>

          {/* ── Budget Filter ─────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'الميزانية:' : 'Budget:'}
            </span>
            <input
              className="search-input"
              style={{ width: 90 }}
              type="number"
              placeholder={isAr ? 'من' : 'Min'}
              value={budgetRange.min}
              onChange={e => setBudgetRange(p => ({ ...p, min: e.target.value }))}
            />
            <span style={{ color: 'var(--text-disabled)', fontSize: 12 }}>—</span>
            <input
              className="search-input"
              style={{ width: 90 }}
              type="number"
              placeholder={isAr ? 'إلى' : 'Max'}
              value={budgetRange.max}
              onChange={e => setBudgetRange(p => ({ ...p, max: e.target.value }))}
            />
            <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>SAR</span>
            {(budgetRange.min || budgetRange.max) && (
              <button
                className="btn-outline"
                style={{ padding: '6px 12px', fontSize: 11, minHeight: 32 }}
                onClick={() => setBudgetRange({ min: '', max: '' })}>
                {isAr ? 'مسح' : 'Clear'}
              </button>
            )}
          </div>

          {!loading && (
            <p style={{ color: 'var(--text-disabled)', fontSize: 12, marginBottom: 20, letterSpacing: 0.3 }}>
              {filtered.length} {isAr ? 'طلبات مفتوحة' : 'open requests'}
            </p>
          )}

          {loading && [1, 2, 3].map(i => <SkeletonCard key={i} />)}

          {!loading && filtered.map(r => (
            <div key={r.id} style={{ marginBottom: offerForms[r.id] ? 0 : 10 }}>

              {/* Request card */}
              <div style={{
                border: '1px solid var(--border-subtle)',
                padding: '20px 24px',
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: 20,
                background: 'var(--bg-subtle)',
                transition: 'all 0.15s',
                borderRadius: offerForms[r.id] ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
                cursor: 'default',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-muted)'; e.currentTarget.style.background = 'var(--bg-muted)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}>

                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="status-badge status-open">
                      {isAr ? 'مفتوح' : 'open'}
                    </span>
                    {r.category && r.category !== 'other' && (
                      <span style={{
                        fontSize: 10, padding: '2px 8px',
                        background: 'var(--bg-raised)',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 20, color: 'var(--text-disabled)',
                        letterSpacing: 0.5,
                      }}>
                        {cats.find(c => c.val === r.category)?.label || r.category}
                      </span>
                    )}
                    {r.sample_requirement === 'required' && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(200,60,60,0.12)', color: '#d96060', border: '1px solid rgba(200,60,60,0.25)', letterSpacing: 0.3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {isAr ? '🔴 عينة إلزامية' : '🔴 Sample Required'}
                      </span>
                    )}
                    {r.sample_requirement === 'preferred' && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(255,255,255,0.08)', color: 'var(--text-secondary)', border: '1px solid var(--border-default)', letterSpacing: 0.3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {isAr ? '⚪ عينة مفضلة' : '⚪ Sample Preferred'}
                      </span>
                    )}
                    {r.sample_requirement === 'none' && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(58,122,82,0.1)', color: '#5a9a72', border: '1px solid rgba(58,122,82,0.2)', letterSpacing: 0.3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {isAr ? '🟢 بدون عينة' : '🟢 No Sample'}
                      </span>
                    )}
                    <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>
                      {fmtDate(r.created_at)}
                    </span>
                  </div>

                  <h3 className={`req-name${isAr ? ' ar' : ''}`}>
                    {isAr ? r.title_ar || r.title_en : r.title_en || r.title_ar}
                  </h3>

                  <div className="req-meta">
                    <span>{r.profiles?.full_name || r.profiles?.company_name || ''}</span>
                    <span>{r.quantity || '—'}</span>
                    {r.description && (
                      <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>
                        {r.description.substring(0, 60)}…
                      </span>
                    )}
                  </div>
                </div>

                <button className="btn-quote" onClick={() => toggleOfferForm(r.id)}>
                  {offerForms[r.id]
                    ? (isAr ? 'إغلاق' : 'Close')
                    : (isAr ? 'قدم عرضك' : 'Submit Quote')}
                </button>
              </div>

              {/* Offer form */}
              {offerForms[r.id] && (
                <div style={{
                  background: 'var(--bg-muted)',
                  border: '1px solid var(--border-subtle)',
                  borderTop: 'none',
                  padding: '20px 24px',
                  marginBottom: 10,
                  borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
                }}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>
                        {isAr ? 'سعر الوحدة / المنتج (USD) *' : lang === 'zh' ? '产品单价 (USD) *' : 'Product / Unit Price (USD) *'}
                      </label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input className="form-input" type="number"
                            placeholder="USD"
                            value={offers[r.id]?.price || ''}
                            onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], price: e.target.value } }))}
                            style={{ paddingRight: 40 }}
                            dir="ltr"
                          />
                          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-disabled)', pointerEvents: 'none' }}>$</span>
                        </div>
                        {offers[r.id]?.price && (
                          <div style={{
                            flex: 1, padding: '10px 12px', background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)', borderRadius: 3,
                            fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', direction: 'ltr',
                          }}>
                            ≈ {(parseFloat(offers[r.id]?.price || 0) * (usdRate || 3.75)).toFixed(2)} ﷼
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>
                        {isAr ? 'تكلفة الشحن (USD) *' : lang === 'zh' ? '运费 (USD) *' : 'Shipping Cost (USD) *'}
                      </label>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input className="form-input" type="number"
                            placeholder="USD"
                            value={offers[r.id]?.shippingCost || ''}
                            onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], shippingCost: e.target.value } }))}
                            style={{ paddingRight: 40 }}
                            dir="ltr"
                          />
                          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-disabled)', pointerEvents: 'none' }}>$</span>
                        </div>
                        {offers[r.id]?.shippingCost && (
                          <div style={{
                            flex: 1, padding: '10px 12px', background: 'var(--bg-subtle)',
                            border: '1px solid var(--border-subtle)', borderRadius: 3,
                            fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', direction: 'ltr',
                          }}>
                            ≈ {(parseFloat(offers[r.id]?.shippingCost || 0) * (usdRate || 3.75)).toFixed(2)} ﷼
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>
                        {isAr ? 'طريقة الشحن' : lang === 'zh' ? '运输方式' : 'Shipping Method'}
                      </label>
                      <input className="form-input"
                        placeholder={isAr ? 'مثال: بحري / جوي / FOB' : lang === 'zh' ? '例如：海运 / 空运 / FOB' : 'e.g. Sea / Air / FOB'}
                        value={offers[r.id]?.shippingMethod || ''}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], shippingMethod: e.target.value } }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">MOQ *</label>
                      <input className="form-input"
                        value={offers[r.id]?.moq || ''}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], moq: e.target.value } }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>
                        {isAr ? 'مدة التسليم (أيام) *' : 'Delivery Days *'}
                      </label>
                      <input className="form-input" type="number"
                        value={offers[r.id]?.days || ''}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], days: e.target.value } }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>
                        {isAr ? 'بلد المنشأ' : 'Country of Origin'}
                      </label>
                      <input className="form-input"
                        value={offers[r.id]?.origin || 'China'}
                        onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], origin: e.target.value } }))}
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>
                      {isAr ? 'ملاحظة' : 'Note'}
                    </label>
                    <textarea className="form-input" rows={2}
                      style={{ resize: 'none', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                      value={offers[r.id]?.note || ''}
                      onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], note: e.target.value } }))}
                    />
                  </div>
                  {(offers[r.id]?.price || offers[r.id]?.shippingCost) && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                      gap: 8,
                      marginBottom: 14,
                    }}>
                      <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'إجمالي المنتجات' : lang === 'zh' ? '产品合计' : 'Products Total'}</p>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', direction: 'ltr' }}>
                          {getOfferProductSubtotal({ price: offers[r.id]?.price }, r).toFixed(2)} USD
                        </p>
                      </div>
                      <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الشحن' : lang === 'zh' ? '运费' : 'Shipping'}</p>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', direction: 'ltr' }}>
                          {getOfferShippingCost({ shipping_cost: offers[r.id]?.shippingCost }).toFixed(2)} USD
                        </p>
                      </div>
                      <div style={{ padding: '10px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الإجمالي التقديري' : lang === 'zh' ? '预计总额' : 'Estimated Total'}</p>
                        <p style={{ fontSize: 14, color: 'var(--text-primary)', direction: 'ltr' }}>
                          {getOfferEstimatedTotal({ price: offers[r.id]?.price, shipping_cost: offers[r.id]?.shippingCost }, r).toFixed(2)} USD
                        </p>
                      </div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-dark-sm" onClick={() => submitOffer(r.id, r.buyer_id)} disabled={submittingOfferId === r.id}
                      style={{ minHeight: 40, opacity: submittingOfferId === r.id ? 0.7 : 1 }}>
                      {submittingOfferId === r.id ? (isAr ? 'جاري الإرسال...' : lang === 'zh' ? '发送中...' : 'Sending...') : (isAr ? 'إرسال العرض' : lang === 'zh' ? '发送报价' : 'Send Offer')}
                    </button>
                    <button className="btn-outline" onClick={() => toggleOfferForm(r.id)}
                      style={{ minHeight: 40 }}>
                      {isAr ? 'إلغاء' : 'Cancel'}
                    </button>
                    <span style={{ fontSize: 11, color: 'var(--text-disabled)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      🔒 {isAr ? 'يراه التاجر فقط — سعرك سري' : lang === 'zh' ? '仅买家可见' : 'Only the buyer sees this — your price is private'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ color: 'var(--text-disabled)', fontSize: 14, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isAr ? 'لا توجد طلبات بعد' : 'No requests yet'}
              </p>
            </div>
          )}
        </div>
      )}

      <Footer lang={lang} />
    </div>
  );
}