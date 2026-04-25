import Footer from '../components/Footer';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';
import { buildDisplayPrice } from '../lib/displayCurrency';
import { buildProductSpecs, getProductGalleryImages } from '../lib/productMedia';
import {
  buildSupplierTrustSignals,
  getSupplierMaabarId,
  isSupplierPubliclyVisible,
} from '../lib/supplierOnboarding';
import { attachSupplierProfiles, fetchSupplierPublicProfileById } from '../lib/profileVisibility';
import {
  getProductInquiryQuestion,
  getProductInquiryAllTranslations,
  getProductInquiryTemplates,
} from '../lib/productInquiry';
import BrandedLoading from '../components/BrandedLoading';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

function getLocalizedText(product, lang, key) {
  if (key === 'name') {
    if (lang === 'ar') return product.name_ar || product.name_en || product.name_zh;
    if (lang === 'zh') return product.name_zh || product.name_en || product.name_ar;
    return product.name_en || product.name_zh || product.name_ar;
  }
  if (key === 'desc') {
    if (lang === 'ar') return product.desc_ar || product.desc_en || product.desc_zh;
    if (lang === 'zh') return product.desc_zh || product.desc_en || product.desc_ar;
    return product.desc_en || product.desc_zh || product.desc_ar;
  }
  return '';
}

// Buyer-side lang helper: ar or en only, never zh
function buyerText(obj, lang, arKey, enKey) {
  if (lang === 'ar') return obj[arKey] || obj[enKey] || '';
  return obj[enKey] || obj[arKey] || '';
}

function buildDefaultActionError(lang, fallbackAr, fallbackZh, fallbackEn) {
  if (lang === 'ar') return fallbackAr;
  if (lang === 'zh') return fallbackZh;
  return fallbackEn;
}

function buildRequestCreationErrorMessage(lang, error) {
  const rawMessage = String(error?.message || error?.details || error?.hint || error?.error_description || '').trim();
  const normalized = rawMessage.toLowerCase();
  if (!rawMessage) return buildDefaultActionError(lang, 'تعذر إنشاء طلب الشراء الآن. حاول مرة أخرى بعد تحديث الصفحة.', '现在无法创建采购订单，请刷新页面后重试。', 'Unable to create the purchase order right now. Please refresh the page and try again.');
  if (normalized.includes('row-level security') || normalized.includes('permission denied')) return buildDefaultActionError(lang, 'تعذر إنشاء الطلب من هذا الحساب حالياً. تأكد أنك داخل حساب التاجر الصحيح ثم حاول مرة أخرى.', '当前账号无法创建此订单。请确认您登录的是正确的买家账号后再试。', 'This account cannot create the order right now. Make sure you are signed in with the correct buyer account and try again.');
  if (normalized.includes('payment_plan') || normalized.includes('sample_requirement') || normalized.includes('null value')) return buildDefaultActionError(lang, 'تعذر تجهيز الطلب بسبب بيانات شراء ناقصة. حدّث الصفحة ثم حاول مرة أخرى.', '由于订单字段不完整，暂时无法继续购买。请刷新页面后重试。', 'The order could not be prepared because some required purchase fields are missing. Please refresh the page and try again.');
  return buildDefaultActionError(lang, `تعذر إنشاء طلب الشراء الآن. ${rawMessage}`, `现在无法创建采购订单。${rawMessage}`, `Unable to create the purchase order right now. ${rawMessage}`);
}

function buildSampleRequestErrorMessage(lang, error) {
  const rawMessage = String(error?.message || error?.details || error?.hint || error?.error_description || '').trim();
  if (!rawMessage) return buildDefaultActionError(lang, 'تعذر إرسال طلب العينة الآن. حاول مرة أخرى بعد قليل.', '现在无法发送样品申请，请稍后重试。', 'Unable to send the sample request right now. Please try again shortly.');
  return buildDefaultActionError(lang, `تعذر إرسال طلب العينة الآن. ${rawMessage}`, `现在无法发送样品申请。${rawMessage}`, `Unable to send the sample request right now. ${rawMessage}`);
}

function buildProductInquiryErrorMessage(lang, error) {
  const rawMessage = String(error?.message || error?.details || error?.hint || error?.error_description || '').trim();
  if (!rawMessage) return buildDefaultActionError(lang, 'تعذر إرسال الاستفسار الآن. حاول مرة أخرى بعد قليل.', '现在无法发送咨询，请稍后重试。', 'Unable to send the inquiry right now. Please try again shortly.');
  return buildDefaultActionError(lang, `تعذر إرسال الاستفسار الآن. ${rawMessage}`, `现在无法发送咨询。${rawMessage}`, `Unable to send the inquiry right now. ${rawMessage}`);
}

function createDirectRequestId() {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    return (c === 'x' ? r : ((r & 0x3) | 0x8)).toString(16);
  });
}

// ── Variant UI sub-components ────────────────────────────────────────────────

function OptionSelector({ option, selectedValues, onSelect, lang }) {
  const optionName = buyerText(option, lang, 'display_name_ar', 'display_name_en');
  const values = (option.product_option_values || []).slice().sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const selectedId = selectedValues[option.id];
  const isColor = option.option_type === 'color_swatch';

  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10, letterSpacing: 0.3, fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'inherit' }}>
        {optionName}
        {selectedId && (() => {
          const val = values.find(v => v.id === selectedId);
          return val ? <span style={{ fontWeight: 400, color: 'var(--text-disabled)', marginInlineStart: 6 }}>— {buyerText(val, lang, 'value_ar', 'value_en')}</span> : null;
        })()}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: isColor ? 8 : 6 }}>
        {values.map(val => {
          const isSelected = selectedId === val.id;
          const label = buyerText(val, lang, 'value_ar', 'value_en');
          if (isColor) {
            return (
              <button
                key={val.id}
                title={label}
                onClick={() => onSelect(option.id, val.id)}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: val.color_hex || '#ccc',
                  border: isSelected ? '3px solid var(--text-primary)' : '2px solid var(--border-subtle)',
                  cursor: 'pointer', outline: 'none',
                  boxShadow: isSelected ? '0 0 0 2px var(--bg-base), 0 0 0 4px var(--text-primary)' : 'none',
                  transition: 'box-shadow 0.15s',
                }}
              />
            );
          }
          return (
            <button
              key={val.id}
              onClick={() => onSelect(option.id, val.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, fontSize: 12,
                border: isSelected ? '1px solid var(--text-primary)' : '1px solid var(--border-muted)',
                background: isSelected ? 'var(--bg-raised)' : 'var(--bg-subtle)',
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer', transition: 'all 0.15s', fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'inherit',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TierPricingTable({ tiers, activeQty, lang }) {
  if (!tiers.length) return null;
  const isAr = lang === 'ar';
  const qty = Number(activeQty) || 0;
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>
        {isAr ? 'أسعار الكميات' : 'Tiered Pricing'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(tiers.length, 4)}, 1fr)`, gap: 6 }}>
        {tiers.map((tier, i) => {
          const isActive = qty >= tier.qty_from && (tier.qty_to === null || qty <= tier.qty_to);
          return (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 8, textAlign: 'center',
              border: isActive ? '1px solid var(--text-primary)' : '1px solid var(--border-subtle)',
              background: isActive ? 'var(--bg-raised)' : 'var(--bg-subtle)',
              transition: 'all 0.2s',
            }}>
              <p style={{ fontSize: 9, color: isActive ? 'var(--text-secondary)' : 'var(--text-disabled)', marginBottom: 4, letterSpacing: 0.5 }}>
                {tier.qty_to ? `${tier.qty_from}–${tier.qty_to}` : `${tier.qty_from}+`}
              </p>
              <p style={{ fontSize: 14, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)', direction: 'ltr' }}>
                ${Number(tier.unit_price_usd).toFixed(2)}
              </p>
              {tier.discount_pct > 0 && (
                <p style={{ fontSize: 9, color: '#2d7a4f', marginTop: 2 }}>-{tier.discount_pct}%</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ShippingCards({ options, lang }) {
  if (!options.length) return null;
  const isAr = lang === 'ar';
  const methodLabel = (m) => {
    if (isAr) return m === 'sea' ? 'شحن بحري' : m === 'air' ? 'شحن جوي' : m === 'express' ? 'شحن سريع' : 'شحن بري';
    return m === 'sea' ? 'Sea' : m === 'air' ? 'Air' : m === 'express' ? 'Express' : 'Land';
  };
  const methodIcon = (m) => m === 'sea' ? '🚢' : m === 'air' ? '✈️' : m === 'express' ? '⚡' : '🚛';
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>
        {isAr ? 'خيارات الشحن' : 'Shipping Options'}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {options.map((opt, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
            <p style={{ fontSize: 13, marginBottom: 4 }}>{methodIcon(opt.method)} {methodLabel(opt.method)}</p>
            {opt.lead_time_days && (
              <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{opt.lead_time_days} {isAr ? 'يوم' : 'days'}</p>
            )}
            {opt.cost_usd != null && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', direction: 'ltr', marginTop: 2 }}>${Number(opt.cost_usd).toFixed(2)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductDetail({ lang, user, profile, displayCurrency, exchangeRates }) {
  const { id } = useParams();
  const nav = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [showSampleForm, setShowSampleForm] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [qty, setQty] = useState('');
  const [note, setNote] = useState('');
  const [sampleQty, setSampleQty] = useState('1');
  const [sampleNote, setSampleNote] = useState('');
  const [selectedInquiryTemplate, setSelectedInquiryTemplate] = useState('');
  const [sending, setSending] = useState(false);
  const [sendingSample, setSendingSample] = useState(false);
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  // Variant state
  const [variantOptions, setVariantOptions] = useState([]);
  const [variantVariants, setVariantVariants] = useState([]);
  const [pricingTiers, setPricingTiers] = useState([]);
  const [shippingOptions, setShippingOptions] = useState([]);
  const [selectedValues, setSelectedValues] = useState({});
  const [orderLines, setOrderLines] = useState([]);
  const [variantQtyInput, setVariantQtyInput] = useState('');
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [submittingVariantOrder, setSubmittingVariantOrder] = useState(false);

  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';
  const inquiryTemplates = getProductInquiryTemplates();

  const loadVariantData = useCallback(async (productId) => {
    setLoadingVariants(true);
    const [optionsRes, variantsRes, tiersRes, shippingRes] = await Promise.all([
      sb.from('product_options').select('*, product_option_values(*)').eq('product_id', productId).order('sort_order'),
      sb.from('product_variants').select('*').eq('product_id', productId).eq('is_active', true).order('created_at'),
      sb.from('product_pricing_tiers').select('*').eq('product_id', productId).order('qty_from'),
      sb.from('product_shipping_options').select('*').eq('product_id', productId).eq('enabled', true),
    ]);
    setVariantOptions(optionsRes.data || []);
    setVariantVariants(variantsRes.data || []);
    setPricingTiers(tiersRes.data || []);
    setShippingOptions(shippingRes.data || []);
    setLoadingVariants(false);
  }, []);

  useEffect(() => { loadProduct(); }, [id, profile?.role, user?.id]);

  useEffect(() => {
    const firstImage = getProductGalleryImages(product)[0] || null;
    if (firstImage) setSelectedImage(firstImage);
  }, [product]);

  const loadProduct = async () => {
    setLoading(true);
    const { data: baseProduct } = await sb.from('products').select('*').eq('id', id).maybeSingle();
    if (baseProduct) {
      const [productWithSupplier] = await attachSupplierProfiles(sb, [baseProduct], 'supplier_id', 'profiles');
      if (productWithSupplier?.profiles) {
        setProduct(productWithSupplier);
        setLoading(false);
        if (productWithSupplier.has_variants) loadVariantData(id);
        return;
      }
    }
    if (profile?.role === 'supplier' && user?.id) {
      const { data: ownProduct } = await sb.from('products').select('*').eq('id', id).eq('supplier_id', user.id).maybeSingle();
      if (ownProduct) {
        const ownSupplierProfile = await fetchSupplierPublicProfileById(sb, user.id);
        const p = { ...ownProduct, profiles: ownSupplierProfile || null };
        setProduct(p);
        if (ownProduct.has_variants) loadVariantData(id);
      } else {
        setProduct(null);
      }
    } else {
      setProduct(null);
    }
    setLoading(false);
  };

  // ── Variant helpers ──────────────────────────────────────────────────────────

  const getActiveVariant = useCallback(() => {
    if (!variantVariants.length || !variantOptions.length) return null;
    if (Object.keys(selectedValues).length !== variantOptions.length) return null;
    return variantVariants.find(v => {
      const ov = v.option_values || {};
      return variantOptions.every(opt => ov[opt.id] === selectedValues[opt.id]);
    }) || null;
  }, [variantVariants, selectedValues, variantOptions]);

  const getApplicableTier = useCallback((qty) => {
    if (!pricingTiers.length) return null;
    const q = Number(qty);
    return pricingTiers.find(t => q >= t.qty_from && (t.qty_to === null || q <= t.qty_to)) || null;
  }, [pricingTiers]);

  const handleSelectValue = (optionId, valueId) => {
    setSelectedValues(prev => ({ ...prev, [optionId]: valueId }));
    // Auto-swap gallery image if first color_swatch option selected
    const opt = variantOptions.find(o => o.id === optionId);
    if (opt?.option_type === 'color_swatch') {
      const val = (opt.product_option_values || []).find(v => v.id === valueId);
      if (val?.image_url) setSelectedImage(val.image_url);
    }
  };

  const addToOrderBuilder = () => {
    const activeVariant = getActiveVariant();
    if (!activeVariant) {
      alert(isAr ? 'يرجى اختيار جميع الخيارات أولاً' : 'Please select all options first');
      return;
    }
    const qtyNum = parseInt(variantQtyInput, 10);
    if (!qtyNum || qtyNum < 1) {
      alert(isAr ? 'أدخل كمية صحيحة' : 'Please enter a valid quantity');
      return;
    }
    if (activeVariant.moq && qtyNum < activeVariant.moq) {
      alert(isAr ? `الحد الأدنى للطلب ${activeVariant.moq} قطعة` : `Minimum order quantity is ${activeVariant.moq} units`);
      return;
    }
    const tier = getApplicableTier(qtyNum);
    const unitPrice = tier ? Number(tier.unit_price_usd) : Number(activeVariant.price_usd || 0);
    const label = variantOptions.map(opt => {
      const valId = selectedValues[opt.id];
      const val = (opt.product_option_values || []).find(v => v.id === valId);
      return val ? buyerText(val, lang, 'value_ar', 'value_en') : '';
    }).filter(Boolean).join(' / ');

    setOrderLines(prev => {
      const idx = prev.findIndex(l => l.variantId === activeVariant.id);
      const newLine = { variantId: activeVariant.id, sku: activeVariant.sku, label, qty: qtyNum, unitPrice };
      if (idx >= 0) { const next = [...prev]; next[idx] = newLine; return next; }
      return [...prev, newLine];
    });
    setVariantQtyInput('');
  };

  const removeOrderLine = (variantId) => setOrderLines(prev => prev.filter(l => l.variantId !== variantId));

  const orderGrandTotal = orderLines.reduce((s, l) => s + l.qty * l.unitPrice, 0);

  // ── Submit flat order ────────────────────────────────────────────────────────

  const submitOrder = async () => {
    if (!user) { nav('/login/buyer'); return; }
    const normalizedQty = String(qty || '').trim();
    if (!normalizedQty || Number.parseInt(normalizedQty, 10) <= 0) {
      alert(isAr ? 'يرجى تحديد كمية صحيحة' : lang === 'zh' ? '请输入有效数量' : 'Please enter a valid quantity');
      return;
    }
    if (!product) return;
    const sup = product.profiles || {};
    const supplierId = sup.id || product.supplier_id;
    if (!supplierId) { alert(isAr ? 'تعذّر تحديد المورد' : lang === 'zh' ? '未找到供应商' : 'Supplier not found'); return; }
    const requestId = createDirectRequestId();
    const productName = product.name_ar || product.name_en || product.name_zh || '';
    const requestPayload = {
      id: requestId,
      buyer_id: user.id,
      title_ar: 'شراء: ' + (product.name_ar || product.name_en || product.name_zh),
      title_en: 'Buy: ' + (product.name_en || product.name_zh || product.name_ar),
      title_zh: '采购: ' + (product.name_zh || product.name_en || product.name_ar),
      quantity: normalizedQty,
      description: String(note || '').trim(),
      product_ref: id,
      category: product.category || 'other',
      status: 'pending_supplier_confirmation',
      payment_plan: 100,
      sample_requirement: 'none',
      budget_per_unit: product.price_from ? Number(product.price_from) : null,
    };

    setSending(true);

    const reqRes = await sb.from('requests').insert(requestPayload).select().single();
    console.log('[submitOrder] requests.insert response:', reqRes);
    if (reqRes.error) {
      setSending(false);
      console.error('direct product order creation failed:', reqRes.error);
      alert(buildRequestCreationErrorMessage(lang, reqRes.error));
      return;
    }

    const notifRes = await sb.from('notifications').insert({
      user_id: supplierId,
      type: 'direct_order_pending',
      title_ar: `طلب شراء مباشر جديد: ${productName} — تأكيد خلال 24 ساعة`,
      title_en: `New direct purchase order: ${productName} — confirm within 24 hours`,
      title_zh: `新直接采购订单：${productName} — 请在 24 小时内确认`,
      ref_id: requestId,
      is_read: false,
    }).select().single();
    console.log('[submitOrder] notifications.insert response:', notifRes);

    try {
      const emailResp = await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'direct_order_pending',
          data: {
            recipientUserId: supplierId,
            productName,
            quantity: normalizedQty,
          },
        }),
      });
      const emailBody = await emailResp.json().catch(() => null);
      console.log('[submitOrder] send-email response:', { status: emailResp.status, body: emailBody });
    } catch (emailError) {
      console.error('[submitOrder] send-email error:', emailError);
    }

    setSending(false);
    setShowBuyForm(false);
    setOrderConfirmed(true);
  };

  // ── Submit variant quote request ─────────────────────────────────────────────

  const submitVariantOrder = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!orderLines.length) {
      alert(isAr ? 'أضف منتجاً واحداً على الأقل إلى طلبك' : 'Add at least one variant to your order');
      return;
    }
    if (!product) return;
    const sup = product.profiles || {};
    const supplierId = sup.id || product.supplier_id;
    if (!supplierId) return;

    setSubmittingVariantOrder(true);
    const requestId = createDirectRequestId();
    const totalQty = orderLines.reduce((s, l) => s + l.qty, 0);
    const requestPayload = {
      id: requestId,
      buyer_id: user.id,
      title_ar: 'طلب: ' + (product.name_ar || product.name_en || ''),
      title_en: 'Request: ' + (product.name_en || product.name_ar || ''),
      title_zh: '采购: ' + (product.name_zh || product.name_en || ''),
      quantity: String(totalQty),
      product_ref: id,
      category: product.category || 'other',
      status: 'open',
      payment_plan: 30,
      sample_requirement: 'none',
    };

    const { error: reqError } = await sb.from('requests').insert(requestPayload);
    if (reqError) {
      setSubmittingVariantOrder(false);
      alert(buildRequestCreationErrorMessage(lang, reqError));
      return;
    }

    const { error: liError } = await sb.from('order_line_items').insert(
      orderLines.map(line => ({
        request_id: requestId,
        product_id: id,
        variant_id: line.variantId,
        quantity: line.qty,
        unit_price_usd: line.unitPrice,
      }))
    );
    if (liError) console.error('order_line_items insert error:', liError);

    await sb.from('notifications').insert({ user_id: supplierId, type: 'new_request', title_ar: 'طلب عرض سعر جديد على منتجك', title_en: 'New quote request on your product', title_zh: '您的产品有新询价', ref_id: requestId, is_read: false }).catch(console.error);

    setSubmittingVariantOrder(false);
    setOrderLines([]);
    setSelectedValues({});
    alert(isAr ? '✅ تم إرسال طلب عرض السعر! سيتواصل معك المورد قريباً' : '✅ Quote request sent! The supplier will contact you soon.');
    nav('/dashboard?tab=requests');
  };

  // ── Sample & Inquiry (unchanged) ─────────────────────────────────────────────

  const submitSample = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!product) return;
    const sup = product.profiles || {};
    const supplierId = sup.id || product.supplier_id;
    if (!supplierId) { setSendingSample(false); alert(isAr ? 'تعذّر تحديد المورد، حاول لاحقاً' : lang === 'zh' ? '无法识别供应商，请稍后再试' : 'Supplier not found, try again'); return; }
    const maxQty = product.sample_max_qty || 3;
    if (parseInt(sampleQty, 10) > maxQty) { alert(isAr ? `الحد الأقصى للعينة ${maxQty} قطع` : lang === 'zh' ? `样品最多 ${maxQty} 件` : `Max sample quantity is ${maxQty}`); return; }
    setSendingSample(true);
    const total = (parseFloat(product.sample_price || 0) + parseFloat(product.sample_shipping || 0)) * parseInt(sampleQty || 1, 10);
    const activeVariant = getActiveVariant();
    const { error } = await sb.from('samples').insert({
      product_id: id, supplier_id: supplierId, buyer_id: user.id,
      quantity: parseInt(sampleQty || 1, 10), sample_price: parseFloat(product.sample_price || 0),
      shipping_price: parseFloat(product.sample_shipping || 0), total_price: total,
      notes: sampleNote || '', status: 'pending',
      ...(activeVariant ? { variant_id: activeVariant.id } : {}),
    });
    setSendingSample(false);
    if (error) { console.error('sample request creation failed:', error); alert(buildSampleRequestErrorMessage(lang, error)); return; }
    await sb.from('notifications').insert({ user_id: supplierId, type: 'new_sample', title_ar: 'طلب عينة جديد على منتجك', title_en: 'New sample request on your product', title_zh: '您的产品收到了新样品请求', ref_id: id, is_read: false });
    try {
      await fetch(SEND_EMAILS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }, body: JSON.stringify({ type: 'new_sample', data: { recipientUserId: supplierId, productName: product.name_ar || product.name_en || product.name_zh || 'Product', quantity: sampleQty, totalPrice: total, lang } }) });
    } catch (e) { console.error('sample email error:', e); }
    alert(isAr ? '✅ تم إرسال طلب العينة! سيتواصل معك المورد قريباً' : lang === 'zh' ? '✅ 样品请求已发送，供应商会尽快联系您' : '✅ Sample request sent! The supplier will contact you soon');
    setShowSampleForm(false); setSampleQty('1'); setSampleNote('');
  };

  const submitInquiry = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!product) return;
    const sup = product.profiles || {};
    const supplierId = sup.id || product.supplier_id;
    if (!supplierId) { alert(isAr ? 'تعذّر تحديد المورد، حاول لاحقاً' : lang === 'zh' ? '无法识别供应商，请稍后再试' : 'Supplier not found, try again'); return; }
    const questionText = getProductInquiryQuestion(selectedInquiryTemplate);
    if (!questionText) { alert(isAr ? 'اختر قالب الاستفسار أولاً' : lang === 'zh' ? '请先选择咨询模板' : 'Please choose an inquiry template first'); return; }
    setSendingInquiry(true);
    const inquiryTranslations = getProductInquiryAllTranslations(selectedInquiryTemplate);
    const activeVariant = getActiveVariant();
    const { data: inquiry, error } = await sb.from('product_inquiries').insert({
      product_id: product.id, buyer_id: user.id, supplier_id: supplierId,
      template_key: selectedInquiryTemplate, question_text: questionText,
      ...inquiryTranslations,
      ...(activeVariant ? { variant_id: activeVariant.id } : {}),
    }).select('id').single();
    setSendingInquiry(false);
    if (error) { console.error('product inquiry creation failed:', error); alert(buildProductInquiryErrorMessage(lang, error)); return; }
    await sb.from('notifications').insert({ user_id: supplierId, type: 'product_inquiry', title_ar: `استفسار جديد على المنتج: ${product.name_ar || product.name_en || product.name_zh || 'منتج'}`, title_en: `New product inquiry: ${product.name_en || product.name_ar || product.name_zh || 'Product'}`, title_zh: `新的产品咨询：${product.name_zh || product.name_en || product.name_ar || 'Product'}`, ref_id: inquiry?.id || product.id, is_read: false });
    try {
      await fetch(SEND_EMAILS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }, body: JSON.stringify({ type: 'product_inquiry', data: { recipientUserId: supplierId, inquiryId: inquiry?.id || '', productName: product.name_ar || product.name_en || product.name_zh || 'Product', buyerName: profile?.company_name || profile?.full_name || user.email?.split('@')[0] || 'Buyer', question: questionText } }) });
    } catch (emailError) { console.error('product inquiry email error:', emailError); }
    alert(isAr ? '✅ تم إرسال الاستفسار للمورد' : lang === 'zh' ? '✅ 已将咨询发送给供应商' : '✅ Inquiry sent to the supplier');
    setShowInquiryForm(false); setSelectedInquiryTemplate('');
  };

  const handleChat = () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!product) return;
    const sup = product.profiles || {};
    const supplierId = sup.id || product.supplier_id;
    if (!supplierId) { alert(isAr ? 'تعذّر تحديد المورد، حاول لاحقاً' : lang === 'zh' ? '无法识别供应商，请稍后再试' : 'Supplier not found, try again'); return; }
    nav(`/chat/${supplierId}`);
  };

  const stars = (r) => { let s = ''; for (let i = 1; i <= 5; i++) s += i <= r ? '★' : '☆'; return s; };
  const fmt = (n) => Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 2 });

  if (loading) return <div className="product-detail-wrap"><BrandedLoading lang={lang} tone="product" /></div>;

  if (!product) return (
    <div className="product-detail-wrap">
      <div className="product-detail-inner">
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 60 }}>
          {isAr ? 'المنتج غير موجود' : lang === 'zh' ? '产品不存在' : 'Product not found'}
        </p>
      </div>
    </div>
  );

  const sup = product.profiles || {};
  const supplierId = sup.id || product.supplier_id || '';
  const name = getLocalizedText(product, lang, 'name');
  const desc = getLocalizedText(product, lang, 'desc');
  const secondaryName = lang === 'zh' ? (product.name_en || product.name_ar || '') : (product.name_zh || product.name_en || '');
  const supplierTrustSignals = buildSupplierTrustSignals(sup);
  const isReviewedSupplier = isSupplierPubliclyVisible(sup.status);
  const supplierMaabarId = getSupplierMaabarId(sup);
  const sampleTotal = product.sample_available ? (parseFloat(product.sample_price || 0) + parseFloat(product.sample_shipping || 0)) * parseInt(sampleQty || 1, 10) : 0;
  const galleryImages = getProductGalleryImages(product);
  const previewImage = selectedImage || galleryImages[0] || null;
  const price = buildDisplayPrice({ amount: product.price_from, sourceCurrency: product.currency || 'USD', displayCurrency: displayCurrency || product.currency || 'USD', rates: exchangeRates, lang });
  const productSpecs = buildProductSpecs(product, lang);
  const sourcingHighlights = [
    { label: isAr ? 'الحد الأدنى للطلب' : lang === 'zh' ? '起订量' : 'MOQ', value: product.moq || '—' },
    { label: isAr ? 'بلد المنشأ' : lang === 'zh' ? '原产地' : 'Origin', value: isAr ? ((product.origin || sup.country || 'China') === 'China' ? 'الصين' : (product.origin || sup.country || '—')) : (product.origin || sup.country || 'China') },
    { label: isAr ? 'مدة التجهيز' : lang === 'zh' ? '备货周期' : 'Lead time', value: product.spec_lead_time_days ? (isAr ? `${product.spec_lead_time_days} يوم` : lang === 'zh' ? `${product.spec_lead_time_days} 天` : `${product.spec_lead_time_days} days`) : '—' },
    { label: isAr ? 'التخصيص' : lang === 'zh' ? '定制能力' : 'Customization', value: product.spec_customization || (isAr ? 'غير موضح' : lang === 'zh' ? '未说明' : 'Not specified') },
    { label: isAr ? 'العينات' : lang === 'zh' ? '样品' : 'Samples', value: product.sample_available ? (isAr ? 'متاحة' : lang === 'zh' ? '可提供' : 'Available') : (isAr ? 'غير متاحة' : lang === 'zh' ? '暂无' : 'Not available') },
    { label: isAr ? 'التغليف' : lang === 'zh' ? '包装' : 'Packaging', value: product.spec_packaging_details || '—' },
  ];

  const activeVariant = getActiveVariant();
  const variantQtyNum = parseInt(variantQtyInput, 10) || 0;
  const activeTier = getApplicableTier(variantQtyNum);
  const activeUnitPrice = activeTier ? Number(activeTier.unit_price_usd) : (activeVariant ? Number(activeVariant.price_usd || 0) : null);

  return (
    <div className="product-detail-wrap">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div className="product-detail-inner">
        <button className="back-btn" onClick={() => nav('/products')}>
          {isAr ? '← العودة' : lang === 'zh' ? '← 返回' : '← Back'}
        </button>

        {/* ─── Gallery ─── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 420px' }}>
            <div className="product-detail-img" style={{ marginBottom: 0 }}>
              {previewImage ? <img src={previewImage} alt={name} /> : <span>📦</span>}
            </div>
            {galleryImages.length > 1 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10, marginTop: 12 }}>
                {galleryImages.map((img, index) => (
                  <button key={`${img}-${index}`} type="button" onClick={() => setSelectedImage(img)} style={{ border: selectedImage === img ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)', padding: 0, borderRadius: 10, overflow: 'hidden', background: 'var(--bg-muted)', cursor: 'pointer', height: 72 }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>
          {product.video_url && (
            <div style={{ flex: '1 1 280px', maxWidth: 480, height: 320, borderRadius: 12, overflow: 'hidden', background: '#1a1a1a' }}>
              <video src={product.video_url} controls style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        {/* ─── Name + badges ─── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          <h1 className={`product-detail-name${isAr ? ' ar' : ''}`}>{name}</h1>
          {isReviewedSupplier && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', color: '#5a9a72', fontSize: 11 }}>
              ✓ {isAr ? 'مورد موثّق' : lang === 'zh' ? '认证供应商' : 'Verified supplier'}
            </span>
          )}
          {product.sample_available && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', color: '#2d7a4f', fontSize: 11 }}>
              {isAr ? 'عينة متاحة' : lang === 'zh' ? '可提供样品' : 'Sample available'}
            </span>
          )}
        </div>

        {secondaryName && secondaryName !== name && (
          <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 0, marginBottom: 10 }}>
            {lang === 'zh' ? `英文 / 其他名称：${secondaryName}` : isAr ? `اسم المصنع / الاسم البديل: ${secondaryName}` : `Factory / alternate name: ${secondaryName}`}
          </p>
        )}

        <p className="product-detail-price">{product.price_from ? price.formattedDisplay : '—'}</p>
        {price.isConverted && (
          <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: -12, marginBottom: 22 }}>
            {isAr ? `السعر الأصلي: ${price.formattedSource}` : lang === 'zh' ? `原始价格：${price.formattedSource}` : `Original price: ${price.formattedSource}`}
          </p>
        )}

        {/* ─── Meta ─── */}
        <div className="product-detail-meta">
          <div>
            <p className="meta-label">{isAr ? 'الحد الأدنى للطلب' : lang === 'zh' ? '起订量' : 'Min. Order'}</p>
            <p className="meta-val">{product.moq || '—'}</p>
          </div>
          <div>
            <p className="meta-label">{isAr ? 'المورد' : lang === 'zh' ? '供应商' : 'Supplier'}</p>
            <p className="meta-val">{sup.company_name || '—'}</p>
          </div>
          <div>
            <p className="meta-label">{isAr ? 'بلد المنشأ' : lang === 'zh' ? '原产地' : 'Origin'}</p>
            <p className="meta-val">{isAr ? ((product.origin || sup.country || 'China') === 'China' ? 'الصين' : (product.origin || sup.country || '—')) : (product.origin || sup.country || 'China')}</p>
          </div>
          {product.sample_available && (
            <div>
              <p className="meta-label">{isAr ? 'العينة' : lang === 'zh' ? '样品价' : 'Sample'}</p>
              <p className="meta-val" style={{ color: '#2d7a4f', fontSize: 14 }}>{fmt(product.sample_price)} SAR</p>
            </div>
          )}
        </div>

        {/* ─── Sourcing snapshot ─── */}
        <div style={{ marginBottom: 24, padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
          <p style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
            {isAr ? 'ملخص التوريد' : lang === 'zh' ? '采购摘要' : 'Sourcing snapshot'}
          </p>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isAr ? 'هذه الصفحة تعرض معلومات أقرب لتوقعات المورد الصيني: MOQ، وقت التجهيز، العينات، والتخصيص، مع إشارات ثقة المورد قبل التواصل أو الطلب.' : lang === 'zh' ? '此页面更贴近中国供应商常用展示方式：包含 MOQ、交期、样品、定制与供应商信任信息，便于先判断再沟通。' : 'This page surfaces the details buyers usually expect in a China sourcing flow: MOQ, lead time, samples, customization, and supplier trust before you order or chat.'}
          </p>
        </div>

        {desc && <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 28 }}>{desc}</p>}

        {/* ─── Sourcing highlights ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 28 }}>
          {sourcingHighlights.map(item => (
            <div key={item.label} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{item.label}</p>
              <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* ─── Product specs ─── */}
        {productSpecs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 28 }}>
            {productSpecs.map(spec => (
              <div key={spec.key} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: isAr ? 0 : 1.5, textTransform: isAr ? 'none' : 'uppercase', marginBottom: 6 }}>{spec.label}</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>{spec.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ─── Custom Attributes (flat products only) ─── */}
        {!product.has_variants && Array.isArray(product.attributes) && product.attributes.filter(a => a.name && a.values?.length).length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
              {isAr ? 'الخصائص' : lang === 'zh' ? '产品属性' : 'Attributes'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {product.attributes.filter(a => a.name && a.values?.length).map((attr, i) => (
                <div key={i} style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>{attr.name}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {attr.values.map((val, j) => (
                      <span key={j} style={{ padding: '5px 12px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', fontSize: 12, color: 'var(--text-primary)' }}>{val}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            VARIANT SYSTEM (has_variants products only)
        ═══════════════════════════════════════════════════════════ */}
        {product.has_variants && !isSupplier && (
          <div style={{ marginBottom: 32 }}>

            {loadingVariants && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-disabled)', fontSize: 13 }}>
                {isAr ? 'جاري تحميل الخيارات…' : 'Loading options…'}
              </div>
            )}

            {!loadingVariants && variantOptions.length > 0 && (
              <>
                {/* ── Option selectors ── */}
                <div style={{ marginBottom: 20, padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                  <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16 }}>
                    {isAr ? 'اختر المواصفات' : 'Select Options'}
                  </p>
                  {variantOptions.map(opt => (
                    <OptionSelector
                      key={opt.id}
                      option={opt}
                      selectedValues={selectedValues}
                      onSelect={handleSelectValue}
                      lang={lang}
                    />
                  ))}

                  {/* ── Active variant summary badge ── */}
                  {activeVariant ? (
                    <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-raised)', border: '1px solid var(--border-muted)', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontSize: 9, color: 'var(--text-disabled)', letterSpacing: 1.2, marginBottom: 3 }}>SKU</p>
                        <p style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{activeVariant.sku || '—'}</p>
                      </div>
                      <div>
                        <p style={{ fontSize: 9, color: 'var(--text-disabled)', letterSpacing: 1.2, marginBottom: 3 }}>{isAr ? 'السعر' : 'Price'}</p>
                        <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', direction: 'ltr' }}>
                          {activeUnitPrice !== null ? `$${activeUnitPrice.toFixed(2)}` : '—'}
                          {activeTier && <span style={{ fontSize: 10, color: '#2d7a4f', marginInlineStart: 6 }}>{isAr ? `(خصم ${activeTier.discount_pct || 0}%)` : `(${activeTier.discount_pct || 0}% off)`}</span>}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 9, color: 'var(--text-disabled)', letterSpacing: 1.2, marginBottom: 3 }}>MOQ</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{activeVariant.moq || product.moq || '—'}</p>
                      </div>
                      {activeVariant.stock_qty != null && (
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--text-disabled)', letterSpacing: 1.2, marginBottom: 3 }}>{isAr ? 'المخزون' : 'Stock'}</p>
                          <p style={{ fontSize: 12, color: activeVariant.stock_qty > 0 ? '#2d7a4f' : '#c0392b' }}>{activeVariant.stock_qty > 0 ? activeVariant.stock_qty : (isAr ? 'نفد' : 'Out of stock')}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 8, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                      {isAr ? 'اختر جميع الخيارات لعرض السعر' : 'Select all options to see pricing'}
                    </p>
                  )}
                </div>

                {/* ── Tiered pricing table ── */}
                {pricingTiers.length > 0 && (
                  <TierPricingTable tiers={pricingTiers} activeQty={variantQtyInput || (orderLines.reduce((s, l) => s + l.qty, 0))} lang={lang} />
                )}

                {/* ── Add to order row ── */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 140px' }}>
                    <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1, marginBottom: 6 }}>{isAr ? 'الكمية' : 'Quantity'}</p>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={variantQtyInput}
                      onChange={e => setVariantQtyInput(e.target.value)}
                      placeholder={isAr ? 'مثال: 200' : 'e.g. 200'}
                      style={{ margin: 0 }}
                    />
                  </div>
                  <button
                    className="btn-dark-sm"
                    onClick={addToOrderBuilder}
                    disabled={!activeVariant || !variantQtyInput}
                    style={{ minHeight: 40, flex: '1 0 auto', maxWidth: 200 }}
                  >
                    {isAr ? '+ أضف إلى الطلب' : '+ Add to Order'}
                  </button>
                </div>

                {/* ── Order Builder ── */}
                <div style={{ marginBottom: 24, padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: orderLines.length ? '1px solid var(--border-muted)' : '1px solid var(--border-subtle)', background: orderLines.length ? 'var(--bg-raised)' : 'var(--bg-subtle)' }}>
                  <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
                    {isAr ? 'ملخص الطلب' : 'Order Summary'}
                  </p>

                  {orderLines.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-disabled)', textAlign: 'center', padding: '16px 0', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                      {isAr ? 'لم تضف أي منتج بعد. اختر الخيارات وأضف الكمية.' : 'No variants added yet. Select options and add a quantity.'}
                    </p>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                        {orderLines.map(line => (
                          <div key={line.variantId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 2, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{line.label}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-disabled)', fontFamily: 'monospace' }}>{line.sku}</p>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: 50 }}>
                              <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 2 }}>{isAr ? 'الكمية' : 'Qty'}</p>
                              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{line.qty}</p>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: 70 }}>
                              <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 2 }}>{isAr ? 'سعر الوحدة' : 'Unit'}</p>
                              <p style={{ fontSize: 13, color: 'var(--text-secondary)', direction: 'ltr' }}>${line.unitPrice.toFixed(2)}</p>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: 80 }}>
                              <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 2 }}>{isAr ? 'الإجمالي' : 'Total'}</p>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', direction: 'ltr' }}>${(line.qty * line.unitPrice).toFixed(2)}</p>
                            </div>
                            <button
                              onClick={() => removeOrderLine(line.variantId)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
                              title={isAr ? 'إزالة' : 'Remove'}
                            >×</button>
                          </div>
                        ))}
                      </div>

                      {/* Grand total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--border-subtle)', marginBottom: 14 }}>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                          {isAr ? `الإجمالي (${orderLines.reduce((s, l) => s + l.qty, 0)} قطعة)` : `Grand Total (${orderLines.reduce((s, l) => s + l.qty, 0)} units)`}
                        </p>
                        <p style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', direction: 'ltr' }}>${orderGrandTotal.toFixed(2)}</p>
                      </div>

                      {/* Request quote button */}
                      <button
                        className="btn-primary"
                        style={{ background: '#1a1a1a', color: '#fff', width: '100%', minHeight: 44, fontSize: 14 }}
                        onClick={submitVariantOrder}
                        disabled={submittingVariantOrder}
                      >
                        {submittingVariantOrder ? '…' : isAr ? 'إرسال طلب عرض السعر ←' : 'Request Quote →'}
                      </button>
                    </>
                  )}
                </div>

                {/* ── Shipping options ── */}
                {shippingOptions.length > 0 && <ShippingCards options={shippingOptions} lang={lang} />}
              </>
            )}
          </div>
        )}
        {/* ═══════════════════════════════════════════════════════════ */}

        {/* ─── Supplier trust section ─── */}
        {supplierId && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10, marginBottom: 14 }}>
              <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{isAr ? 'مراجعة مَعبر' : lang === 'zh' ? 'Maabar 审核' : 'Maabar review'}</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {isReviewedSupplier ? (isAr ? 'هذا المورد ظاهر للمشترين بعد مراجعة مَعبر.' : lang === 'zh' ? '该供应商已通过 Maabar 审核并向买家展示。' : 'This supplier is visible to buyers after Maabar review.') : (isAr ? 'ملف المورد غير معروض كمورد موثّق.' : lang === 'zh' ? '该供应商尚未以认证状态展示。' : 'This supplier is not currently shown as verified.')}
                </p>
              </div>
              <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{isAr ? 'دلائل الثقة' : lang === 'zh' ? '信任信号' : 'Trust signals'}</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {isAr ? `${supplierTrustSignals.includes('trade_profile_available') ? 'رابط الشركة متوفر' : 'لا يوجد رابط شركة ظاهر'}${supplierTrustSignals.includes('wechat_available') ? ' · WeChat متاح' : ''}${supplierTrustSignals.includes('factory_media_available') ? ' · صور منشأة متاحة' : ''}` : lang === 'zh' ? `${supplierTrustSignals.includes('trade_profile_available') ? '已提供店铺/官网链接' : '暂无公开店铺链接'}${supplierTrustSignals.includes('wechat_available') ? ' · 支持 WeChat 沟通' : ''}${supplierTrustSignals.includes('factory_media_available') ? ' · 提供工厂图片' : ''}` : `${supplierTrustSignals.includes('trade_profile_available') ? 'trade profile available' : 'no public trade profile shown'}${supplierTrustSignals.includes('wechat_available') ? ' · WeChat available' : ''}${supplierTrustSignals.includes('factory_media_available') ? ' · factory photos available' : ''}`}
                </p>
              </div>
              <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{isAr ? 'الهوية التجارية' : lang === 'zh' ? '商业身份' : 'Commercial identity'}</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {supplierMaabarId ? (isAr ? `معرّف المورد: ${supplierMaabarId}` : lang === 'zh' ? `供应商编号：${supplierMaabarId}` : `Supplier ID: ${supplierMaabarId}`) : (isAr ? 'معرّف المورد غير ظاهر بعد' : lang === 'zh' ? '暂无供应商编号' : 'Supplier ID not shown yet')}
                  {sup.years_experience ? ` · ${isAr ? `${sup.years_experience} سنة خبرة` : lang === 'zh' ? `${sup.years_experience} 年经验` : `${sup.years_experience} years experience`}` : ''}
                </p>
              </div>
            </div>

            <div className="supplier-card" onClick={() => nav(`/supplier/${supplierId}`)}>
              <div className="avatar" style={{ overflow: 'hidden' }}>
                {sup.avatar_url ? <img src={sup.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (sup.company_name || '?')[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                  <p style={{ fontWeight: 500, marginBottom: 0 }}>{sup.company_name || ''}</p>
                  {isReviewedSupplier && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', color: '#5a9a72' }}>✓ {isAr ? 'موثّق' : lang === 'zh' ? '已认证' : 'Verified'}</span>}
                </div>
                <p className="stars" style={{ marginBottom: 4 }}>{stars(Math.round(sup.rating || 0))}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  {[sup.city, sup.country].filter(Boolean).join(', ') || '—'}
                  {sup.reviews_count ? ` · ${sup.reviews_count} ${isAr ? 'تقييم' : lang === 'zh' ? '条评价' : 'reviews'}` : ''}
                </p>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>→</span>
            </div>

            {(supplierTrustSignals.length > 0 || supplierMaabarId || sup.trade_link || sup.wechat || sup.whatsapp) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {supplierMaabarId && <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{isAr ? 'معرّف المورد' : lang === 'zh' ? '供应商编号' : 'Supplier ID'}: {supplierMaabarId}</span>}
                {sup.trade_link && <a href={sup.trade_link} target="_blank" rel="noreferrer" className="btn-outline" style={{ minHeight: 34, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>{isAr ? 'رابط الشركة / المتجر' : lang === 'zh' ? '官网 / 店铺链接' : 'Company / store link'}</a>}
                {sup.wechat && <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>WeChat: {sup.wechat}</span>}
                {sup.whatsapp && <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>WhatsApp: {sup.whatsapp}</span>}
              </div>
            )}

            {Array.isArray(sup.factory_images) && sup.factory_images.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                {sup.factory_images.slice(0, 3).map((img, index) => (
                  <div key={`${img}-${index}`} style={{ width: 110, height: 74, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Buyer actions ─── */}
        {!isSupplier && (
          <>
            <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 14, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'يمكنك الطلب مباشرة من هذه الصفحة أو مراسلة المورد أولاً لتأكيد التغليف، التخصيص، مدة التجهيز، أو الشحن.' : lang === 'zh' ? '您可以直接下单，也可以先联系供应商确认包装、定制、交期或运输方式。' : 'You can order directly from this page, or message the supplier first to confirm packaging, customization, lead time, or shipping terms.'}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              {/* Flat-product only: Buy Now */}
              {!product.has_variants && (
                <button
                  className="btn-primary"
                  style={{ background: '#1a1a1a', color: '#fff', letterSpacing: 0 }}
                  onClick={() => { setShowBuyForm(!showBuyForm); setShowSampleForm(false); setShowInquiryForm(false); }}>
                  {isAr ? 'اشترِ الآن' : lang === 'zh' ? '立即下单' : 'Buy Now'}
                </button>
              )}

              <button
                className="btn-outline"
                style={{ borderColor: 'var(--text-primary)', color: 'var(--text-primary)' }}
                onClick={() => { setShowInquiryForm(!showInquiryForm); setShowBuyForm(false); setShowSampleForm(false); }}>
                {isAr ? 'استفسار' : lang === 'zh' ? '咨询' : 'Inquiry'}
              </button>

              {product.sample_available && (
                <button
                  className="btn-outline"
                  style={{ borderColor: '#2d7a4f', color: '#2d7a4f' }}
                  onClick={() => { setShowSampleForm(!showSampleForm); setShowBuyForm(false); setShowInquiryForm(false); }}>
                  {isAr ? `اطلب عينة — ${fmt(product.sample_price)} SAR` : lang === 'zh' ? `申请样品 — ${fmt(product.sample_price)} SAR` : `Request Sample — ${fmt(product.sample_price)} SAR`}
                </button>
              )}

              <button className="btn-outline" onClick={handleChat}>
                {isAr ? 'تواصل مع المورد' : lang === 'zh' ? '联系供应商' : 'Contact Supplier'}
              </button>
            </div>
          </>
        )}

        {/* ─── Flat buy form ─── */}
        {showBuyForm && !product.has_variants && !orderConfirmed && (
          <div className="buy-form">
            <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 20, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {isAr ? 'أدخل الكمية' : lang === 'zh' ? '输入数量' : 'Enter Quantity'}
            </h3>
            <div className="form-group">
              <label className="form-label">{isAr ? 'الكمية *' : lang === 'zh' ? '数量 *' : 'Quantity *'}</label>
              <input className="form-input" value={qty} onChange={e => setQty(e.target.value)} placeholder={isAr ? 'مثال: 200' : lang === 'zh' ? '例如：200' : 'e.g. 200'} type="number" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'ملاحظة (اختياري)' : lang === 'zh' ? '备注（选填）' : 'Note (optional)'}</label>
              <textarea className="form-input" rows={2} style={{ resize: 'none' }} value={note} onChange={e => setNote(e.target.value)} placeholder={isAr ? 'مثلاً: التغليف، المواصفات النهائية، علامة خاصة...' : lang === 'zh' ? '例如：包装、最终规格、定制标识…' : 'e.g. packaging, final specs, private label...'} />
            </div>
            {!user && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{isAr ? '* سيُطلب منك تسجيل الدخول' : lang === 'zh' ? '* 提交前需要先登录' : '* You\'ll be asked to sign in'}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-dark-sm" onClick={submitOrder} disabled={sending}>{sending ? '...' : isAr ? 'إرسال الطلب ←' : lang === 'zh' ? '发送订单 →' : 'Send Order →'}</button>
              <button className="btn-outline" onClick={() => setShowBuyForm(false)}>{isAr ? 'إلغاء' : lang === 'zh' ? '取消' : 'Cancel'}</button>
            </div>
          </div>
        )}

        {/* ─── Direct purchase confirmation (Step 2 success card) ─── */}
        {orderConfirmed && (
          <div className="buy-form" style={{ borderColor: 'rgba(45,122,79,0.35)', background: 'rgba(45,122,79,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(45,122,79,0.12)', color: '#2d7a4f', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>✓</div>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 500, marginBottom: 8, color: '#2d7a4f', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                  {isAr ? 'تم إرسال طلبك، بانتظار تأكيد المورد' : lang === 'zh' ? '订单已发送，等待供应商确认' : 'Your order has been sent — awaiting supplier confirmation'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                  {isAr
                    ? 'سيتم تأكيد الطلب من المورد خلال 24 ساعة. ستصلك إشعار فور الرد، ثم تنتقل إلى خطوة الدفع.'
                    : lang === 'zh'
                      ? '供应商将在 24 小时内确认订单。一旦回复，您会收到通知并进入付款步骤。'
                      : 'The supplier will confirm within 24 hours. You\'ll receive a notification once they respond, and then proceed to payment.'}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-outline" onClick={() => nav('/products')}>
                {isAr ? 'العودة للمنتجات' : lang === 'zh' ? '返回产品' : 'Back to Products'}
              </button>
              <button className="btn-outline" onClick={() => nav('/dashboard?tab=requests')}>
                {isAr ? 'عرض طلباتي' : lang === 'zh' ? '查看我的订单' : 'View My Orders'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Inquiry form ─── */}
        {showInquiryForm && (
          <div className="buy-form" style={{ borderColor: 'var(--border-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 6, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{isAr ? 'استفسار سريع عن المنتج' : lang === 'zh' ? '产品快捷咨询' : 'Quick Product Inquiry'}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{isAr ? 'اختر أحد القوالب الجاهزة فقط، وسنرسل الاستفسار داخل مَعبر وعلى إيميل المورد.' : lang === 'zh' ? '请选择下方 3 个固定模板之一。咨询会同步发送到系统内和供应商邮箱。' : 'Choose one of the 3 fixed templates. The inquiry will be sent inside Maabar and to the supplier by email.'}</p>
              </div>
              <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', letterSpacing: 1 }}>{isAr ? '3 قوالب' : lang === 'zh' ? '3 个模板' : '3 templates'}</span>
            </div>
            <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
              {inquiryTemplates.map((template) => {
                const isSelected = selectedInquiryTemplate === template.key;
                return (
                  <button key={template.key} type="button" onClick={() => setSelectedInquiryTemplate(template.key)} style={{ textAlign: 'right', padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: `1px solid ${isSelected ? 'var(--border-strong)' : 'var(--border-subtle)'}`, background: isSelected ? 'var(--bg-raised)' : 'var(--bg-subtle)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-ar)' }}>
                    {template.question}
                  </button>
                );
              })}
            </div>
            {!user && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{isAr ? '* سيُطلب منك تسجيل الدخول عند الإرسال' : lang === 'zh' ? '* 发送前需要先登录' : '* You will be asked to sign in before sending'}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-dark-sm" onClick={submitInquiry} disabled={sendingInquiry}>{sendingInquiry ? '...' : isAr ? 'إرسال الاستفسار ←' : lang === 'zh' ? '发送咨询 →' : 'Send Inquiry →'}</button>
              <button className="btn-outline" onClick={() => setShowInquiryForm(false)}>{isAr ? 'إلغاء' : lang === 'zh' ? '取消' : 'Cancel'}</button>
            </div>
          </div>
        )}

        {/* ─── Sample form ─── */}
        {showSampleForm && product.sample_available && (
          <div className="buy-form" style={{ borderColor: '#2d7a4f', borderWidth: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 400, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', color: 'var(--text-primary)' }}>{isAr ? 'طلب عينة' : lang === 'zh' ? '申请样品' : 'Request Sample'}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{isAr ? `سعر الوحدة: ${fmt(product.sample_price)} ريال + شحن: ${fmt(product.sample_shipping || 0)} ريال` : lang === 'zh' ? `样品单价：${fmt(product.sample_price)} SAR + 运费：${fmt(product.sample_shipping || 0)} SAR` : `Unit: ${fmt(product.sample_price)} SAR + Shipping: ${fmt(product.sample_shipping || 0)} SAR`}</p>
              </div>
              <span style={{ background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', color: '#2d7a4f', fontSize: 10, padding: '3px 10px', borderRadius: 20, letterSpacing: 1 }}>{isAr ? 'عينة' : lang === 'zh' ? '样品' : 'SAMPLE'}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{isAr ? `الكمية (max ${product.sample_max_qty || 3})` : lang === 'zh' ? `数量（最多 ${product.sample_max_qty || 3}）` : `Quantity (max ${product.sample_max_qty || 3})`}</label>
                <input className="form-input" type="number" min="1" max={product.sample_max_qty || 3} value={sampleQty} onChange={e => setSampleQty(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                <div style={{ background: 'var(--bg-hover)', padding: '10px 16px', borderRadius: 3, width: '100%' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: 1 }}>{isAr ? 'الإجمالي' : lang === 'zh' ? '总计' : 'TOTAL'}</p>
                  <p style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>{fmt(sampleTotal)} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>SAR</span></p>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'ملاحظة' : lang === 'zh' ? '备注' : 'Note'}</label>
              <textarea className="form-input" rows={2} style={{ resize: 'none' }} value={sampleNote} onChange={e => setSampleNote(e.target.value)} placeholder={isAr ? 'اللون، المواصفات...' : lang === 'zh' ? '颜色、规格…' : 'Color, specs...'} />
            </div>
            {product.sample_note && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 3, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>💬 {product.sample_note}</p>}
            {!user && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{isAr ? '* سيُطلب منك تسجيل الدخول عند الإرسال' : lang === 'zh' ? '* 提交时需要先登录' : '* You\'ll be asked to sign in when submitting'}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{ background: '#2d7a4f', color: '#fff', border: 'none', padding: '11px 24px', fontSize: 13, cursor: 'pointer', borderRadius: 3 }} onClick={submitSample} disabled={sendingSample}>{sendingSample ? '...' : isAr ? 'إرسال طلب العينة ←' : lang === 'zh' ? '发送样品请求 →' : 'Send Sample Request →'}</button>
              <button className="btn-outline" onClick={() => setShowSampleForm(false)}>{isAr ? 'إلغاء' : lang === 'zh' ? '取消' : 'Cancel'}</button>
            </div>
          </div>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
