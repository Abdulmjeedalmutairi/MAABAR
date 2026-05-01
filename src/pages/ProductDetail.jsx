import Footer from '../components/Footer';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';
import { buildDisplayPrice, formatPriceWithConversion } from '../lib/displayCurrency';
import { buildProductSpecs, getProductGalleryImages } from '../lib/productMedia';
import {
  buildSupplierTrustSignals,
  getSupplierMaabarId,
  isSupplierPubliclyVisible,
} from '../lib/supplierOnboarding';
import { attachSupplierProfiles, fetchSupplierPublicProfileById } from '../lib/profileVisibility';
import { PRODUCT_TIER_EMBED, deriveProductPriceFrom, deriveProductPriceRange } from '../lib/productPriceLookup';
import { loadProductCertifications } from '../lib/productCertifications';
import { T } from '../lib/supplierDashboardConstants';
import { formatPriceLocale, formatDateLocale } from '../lib/formatLocale';
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
  const optionName = buyerText(option, lang, 'name_ar', 'name_en');
  const values = (option.product_option_values || []).slice().sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
  const selectedId = selectedValues[option.id];
  const isColor = option.input_type === 'color_swatch';

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
  const tT = T[lang] || T.en;
  const qty = Number(activeQty) || 0;
  return (
    <div style={{ marginBottom: 20 }}>
      <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>
        {tT.tieredPricingTitle.replace(' *', '')}
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
                ${formatPriceLocale(tier.unit_price, lang)}
              </p>
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
  const tT = T[lang] || T.en;
  const methodLabel = (m) => {
    if (m === 'sea')     return tT.pdShipMethodSea;
    if (m === 'air')     return tT.pdShipMethodAir;
    if (m === 'express') return tT.pdShipMethodExpress;
    return tT.pdShipMethodLand;
  };
  const methodIcon = (m) => m === 'sea' ? '🚢' : m === 'air' ? '✈️' : m === 'express' ? '⚡' : '🚛';
  return (
    <div style={{ marginBottom: 24 }}>
      <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>
        {tT.pdShippingOptionsTitle}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
        {options.map((opt, i) => (
          <div key={i} style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
            <p style={{ fontSize: 13, marginBottom: 4 }}>{methodIcon(opt.method)} {methodLabel(opt.method)}</p>
            {(opt.lead_time_min_days != null || opt.lead_time_max_days != null) && (
              <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                {tT.cardLeadTimeFn(
                  opt.lead_time_min_days != null ? Number(opt.lead_time_min_days) : null,
                  opt.lead_time_max_days != null ? Number(opt.lead_time_max_days) : null
                )}
              </p>
            )}
            {opt.cost_per_unit_usd != null && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', direction: 'ltr', marginTop: 2 }}>${formatPriceLocale(opt.cost_per_unit_usd, lang)}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Phase 5B buyer blocks ───────────────────────────────────────────────────

// Localized port label: prefer the T-table translation when the value matches a
// canonical port code; otherwise return the raw value (covers the supplier's
// "Other → free text" case).
function localizedPortLabel(value, tT) {
  if (!value) return null;
  const key = `port${value}`;
  return tT[key] || value;
}

// Pricing & Trade Terms block — tier table + range header + trade terms grid.
// Renders a card for ALL products (flat or has_variants) when there is at
// least one tier OR any trade-term field (incoterm/port/lead-time/validity).
function PricingTradeTermsBlock({ product, tiers, lang, vfFont, isAr }) {
  const tT = T[lang] || T.en;
  const currency = product.currency || 'USD';
  const range = deriveProductPriceRange(tiers);
  const incoterms = Array.isArray(product.incoterms) ? product.incoterms.filter(Boolean) : [];
  const portValue = String(product.port_of_loading || '').trim();
  const leadMin = product.lead_time_min_days != null ? Number(product.lead_time_min_days) : null;
  const leadMax = product.lead_time_max_days != null ? Number(product.lead_time_max_days) : null;
  const negotiable = Boolean(product.lead_time_negotiable);
  const validityDays = Number.isFinite(parseInt(product.price_validity_days, 10)) ? parseInt(product.price_validity_days, 10) : null;

  const hasTiers = (tiers || []).length > 0;
  const hasAnyTerm = incoterms.length > 0 || Boolean(portValue) || leadMin !== null || leadMax !== null || validityDays !== null;
  if (!hasTiers && !hasAnyTerm) return null;

  // Term mini-card
  const Term = ({ label, children }) => (
    <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
      <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6, ...vfFont }}>{label}</p>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5, ...vfFont }}>{children}</div>
    </div>
  );

  return (
    <div style={{ marginBottom: 24, padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
      <p style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, ...vfFont }}>
        {tT.buyerBlockPricingTitle}
      </p>

      {hasTiers && (
        <>
          {range.from !== null && (
            <p style={{ fontSize: 22, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 12, direction: 'ltr', textAlign: isAr ? 'right' : 'left', ...vfFont }}>
              {range.from === range.to
                ? `${formatPriceLocale(range.from, lang)} ${currency}`
                : `${formatPriceLocale(range.from, lang)} – ${formatPriceLocale(range.to, lang)} ${currency}`}
              <span style={{ fontSize: 12, color: 'var(--text-disabled)', marginInlineStart: 6 }}>/ {tT.pdPerUnit}</span>
            </p>
          )}
          <TierPricingTable tiers={tiers} activeQty={0} lang={lang} />
        </>
      )}

      {hasAnyTerm && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: hasTiers ? 6 : 0 }}>
          <Term label={tT.buyerCurrencyLabel}>{currency}</Term>
          {validityDays !== null && (
            <Term label={tT.buyerPriceValidityLabel}>{tT.priceValidDaysFn(validityDays)}</Term>
          )}
          {incoterms.length > 0 && (
            <Term label={tT.buyerIncotermsLabel}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {incoterms.map((code) => (
                  <span key={code} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', color: 'var(--text-primary)', ...vfFont }}>
                    {code}
                  </span>
                ))}
              </div>
            </Term>
          )}
          {portValue && (
            <Term label={tT.buyerPortOfLoadingLabel}>{localizedPortLabel(portValue, tT)}</Term>
          )}
          {(leadMin !== null || leadMax !== null) && (
            <Term label={tT.buyerLeadTimeLabel}>{tT.leadTimeBuyerFn(leadMin, leadMax, negotiable)}</Term>
          )}
        </div>
      )}
    </div>
  );
}

// Compliance & Certifications block — renders when the product has ≥1 cert.
// SASO certs get a green "Saudi-ready" badge; all others render as clean cards
// with optional issued/expiry dates and a Download PDF link.
function CompliancCertsBlock({ certs, lang, vfFont, isAr }) {
  const tT = T[lang] || T.en;
  const list = (certs || []).filter(c => c && (c.cert_type || c.cert_label));
  if (!list.length) return null;

  return (
    <div style={{ marginBottom: 24, padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
      <p style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, ...vfFont }}>
        {tT.buyerBlockComplianceTitle}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
        {list.map((cert) => {
          const isSaso = String(cert.cert_type || '').toUpperCase() === 'SASO';
          return (
            <div key={cert._key || cert.id} style={{
              padding: '12px 14px',
              borderRadius: 10,
              background: 'var(--bg-raised)',
              border: `1px solid ${isSaso ? 'rgba(45,122,79,0.3)' : 'var(--border-subtle)'}`,
              boxShadow: isSaso ? '0 0 0 1px rgba(45,122,79,0.08)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 9px',
                  borderRadius: 6,
                  background: isSaso ? 'rgba(45,122,79,0.12)' : 'var(--bg-subtle)',
                  color: isSaso ? '#2d7a4f' : 'var(--text-secondary)',
                  letterSpacing: 0.5,
                  fontFamily: 'monospace',
                }}>
                  {cert.cert_type || '—'}
                </span>
                {isSaso && (
                  <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'rgba(45,122,79,0.1)', border: '1px solid rgba(45,122,79,0.25)', color: '#2d7a4f', ...vfFont }}>
                    ✓ {tT.certSaudiReadyBadge}
                  </span>
                )}
              </div>
              {cert.cert_label && (
                <p style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 6, lineHeight: 1.5, ...vfFont }}>{cert.cert_label}</p>
              )}
              {(cert.issued_date || cert.expiry_date) && (
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: cert.cert_file_url ? 8 : 0 }}>
                  {cert.issued_date && (
                    <p style={{ fontSize: 10, color: 'var(--text-disabled)', ...vfFont }}>
                      <span style={{ letterSpacing: 1, textTransform: 'uppercase', marginInlineEnd: 4 }}>{tT.certIssuedShort}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatDateLocale(cert.issued_date, lang)}</span>
                    </p>
                  )}
                  {cert.expiry_date && (
                    <p style={{ fontSize: 10, color: 'var(--text-disabled)', ...vfFont }}>
                      <span style={{ letterSpacing: 1, textTransform: 'uppercase', marginInlineEnd: 4 }}>{tT.certExpiresShort}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{formatDateLocale(cert.expiry_date, lang)}</span>
                    </p>
                  )}
                </div>
              )}
              {cert.cert_file_url && (
                <a
                  href={cert.cert_file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    padding: '5px 10px',
                    borderRadius: 6,
                    border: '1px solid var(--border-muted)',
                    background: 'var(--bg-subtle)',
                    color: 'var(--text-secondary)',
                    textDecoration: 'none',
                    ...vfFont,
                  }}
                >
                  📄 {tT.certDownloadPdf}
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Customization block — renders when oem_available || odm_available is true.
// Surfaces OEM/ODM availability chips, OEM/ODM lead time (if set), and a
// helper line nudging the buyer to reach out to the supplier.
function CustomizationBlock({ product, lang, vfFont, isAr }) {
  const tT = T[lang] || T.en;
  const oem = Boolean(product.oem_available);
  const odm = Boolean(product.odm_available);
  if (!oem && !odm) return null;

  const oemMin = product.oem_lead_time_min_days != null ? Number(product.oem_lead_time_min_days) : null;
  const oemMax = product.oem_lead_time_max_days != null ? Number(product.oem_lead_time_max_days) : null;
  const hasOemLeadTime = oemMin !== null || oemMax !== null;

  return (
    <div style={{ marginBottom: 24, padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
      <p style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, ...vfFont }}>
        {tT.buyerBlockCustomizationTitle}
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {oem && (
          <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.25)', color: '#2d7a4f', ...vfFont }}>
            ✓ {tT.oemAvailableLabel}
          </span>
        )}
        {odm && (
          <span style={{ fontSize: 12, padding: '5px 12px', borderRadius: 999, background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.25)', color: '#2d7a4f', ...vfFont }}>
            ✓ {tT.odmAvailableLabel}
          </span>
        )}
      </div>
      {hasOemLeadTime && (
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, ...vfFont }}>
          <span style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.2, textTransform: 'uppercase', marginInlineEnd: 8 }}>
            {tT.oemLeadTimeSection}
          </span>
          {tT.buyerOemLeadTimeFn(oemMin, oemMax)}
        </p>
      )}
      <p style={{ fontSize: 12, color: 'var(--text-disabled)', lineHeight: 1.6, margin: 0, ...vfFont }}>
        {tT.customizationContactHelper}
      </p>
    </div>
  );
}

// Logistics & Shipping block (Phase 5D) — surfaces packaging math the buyer
// needs to estimate landed cost: CBM, units per carton, gross & net weights.
// Hidden when none of the four fields are populated. Numeric values render
// with locale-aware separators via Intl.
function LogisticsBlock({ product, lang, vfFont }) {
  const tT = T[lang] || T.en;

  const cbm   = Number.isFinite(parseFloat(product.cbm))             ? parseFloat(product.cbm)             : null;
  const units = Number.isFinite(parseInt(product.units_per_carton, 10)) ? parseInt(product.units_per_carton, 10) : null;
  const gross = Number.isFinite(parseFloat(product.gross_weight_kg)) ? parseFloat(product.gross_weight_kg) : null;
  const net   = Number.isFinite(parseFloat(product.net_weight_kg))   ? parseFloat(product.net_weight_kg)   : null;

  // Each row uses fractionDigits appropriate for its unit. CBM defaults to 4
  // decimals (cubic meters can be small fractions); units render as integers;
  // weights render with 2 decimals (kg).
  const items = [
    { label: tT.cbmLabel,            value: cbm,   render: (v) => formatPriceLocale(v, lang, { fractionDigits: 4 }) },
    { label: tT.unitsPerCartonLabel, value: units, render: (v) => formatPriceLocale(v, lang, { fractionDigits: 0 }) },
    { label: tT.grossWeightLabel,    value: gross, render: (v) => formatPriceLocale(v, lang, { fractionDigits: 2 }) },
    { label: tT.netWeightLabel,      value: net,   render: (v) => formatPriceLocale(v, lang, { fractionDigits: 2 }) },
  ].filter(item => item.value !== null && item.value > 0);

  if (!items.length) return null;

  return (
    <div style={{ marginBottom: 24, padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
      <p style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, ...vfFont }}>
        {tT.buyerBlockLogisticsTitle}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 10 }}>
        {items.map(item => (
          <div key={item.label} style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)' }}>
            <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6, ...vfFont }}>{item.label}</p>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', direction: 'ltr', ...vfFont }}>{item.render(item.value)}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 11, color: 'var(--text-disabled)', lineHeight: 1.6, margin: 0, ...vfFont }}>
        {tT.buyerLogisticsHelper}
      </p>
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
  // Phase 5B — buyer-facing data (loaded for ALL products, not just variants)
  const [productCerts, setProductCerts] = useState([]);
  // Phase 5D.5 — does the supplier have ANY certs across ALL their products?
  // Drives the "Certified" pill on the supplier card so it stays accurate
  // even when the currently-viewed product itself has no certs but the
  // supplier has them on a sibling product.
  const [supplierHasAnyCert, setSupplierHasAnyCert] = useState(false);
  const [selectedValues, setSelectedValues] = useState({});
  const [orderLines, setOrderLines] = useState([]);
  const [variantQtyInput, setVariantQtyInput] = useState('');
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [submittingVariantOrder, setSubmittingVariantOrder] = useState(false);

  const isAr = lang === 'ar';
  const isSupplier = profile?.role === 'supplier';
  const inquiryTemplates = getProductInquiryTemplates();

  // Variant-specific data (options/variants/shipping) — only fetched for has_variants products.
  // Product-level pricing tiers + certifications are loaded by loadProduct for ALL products.
  const loadVariantData = useCallback(async (productId) => {
    setLoadingVariants(true);
    const [optionsRes, variantsRes, shippingRes] = await Promise.all([
      sb.from('product_options').select('*, product_option_values(*)').eq('product_id', productId).order('display_order'),
      sb.from('product_variants').select('*').eq('product_id', productId).eq('is_active', true).order('created_at'),
      sb.from('product_shipping_options').select('*').eq('product_id', productId).eq('is_available', true),
    ]);
    setVariantOptions(optionsRes.data || []);
    setVariantVariants(variantsRes.data || []);
    setShippingOptions(shippingRes.data || []);
    setLoadingVariants(false);
  }, []);

  // Phase 5B — product-level pricing tiers and certifications.
  // Loaded for every product the buyer views, regardless of has_variants.
  // variant_id IS NULL filter excludes per-SKU tier overrides (Phase 2 design).
  // Phase 5D.5 — also fires a lightweight supplier-wide cert-exists check
  // so the "Certified" pill on the supplier card reflects the supplier's
  // catalog (any product), not just the currently-viewed product.
  const loadBuyerExtras = useCallback(async (productId, supplierId) => {
    const [tiersRes, certsList, supplierCertsRes] = await Promise.all([
      sb.from('product_pricing_tiers').select('*').eq('product_id', productId).is('variant_id', null).order('qty_from'),
      loadProductCertifications(sb, productId),
      supplierId
        ? sb.from('product_certifications').select('id, products!inner(supplier_id)').eq('products.supplier_id', supplierId).limit(1)
        : Promise.resolve({ data: [] }),
    ]);
    setPricingTiers(tiersRes.data || []);
    setProductCerts(certsList || []);
    const certExists = (supplierCertsRes.data?.length || 0) > 0;
    console.log('[ProductDetail] supplier_id=' + supplierId + ' has_any_cert=' + certExists);
    setSupplierHasAnyCert(certExists);
  }, []);

  useEffect(() => { loadProduct(); }, [id, profile?.role, user?.id]);

  useEffect(() => {
    const firstImage = getProductGalleryImages(product)[0] || null;
    if (firstImage) setSelectedImage(firstImage);
  }, [product]);

  const loadProduct = async () => {
    setLoading(true);
    const { data: baseProduct } = await sb.from('products').select(`*, ${PRODUCT_TIER_EMBED}`).eq('id', id).maybeSingle();
    if (baseProduct) {
      const [productWithSupplier] = await attachSupplierProfiles(sb, [baseProduct], 'supplier_id', 'profiles');
      if (productWithSupplier?.profiles) {
        setProduct(productWithSupplier);
        setLoading(false);
        loadBuyerExtras(id, productWithSupplier.supplier_id || productWithSupplier.profiles?.id);
        if (productWithSupplier.has_variants) loadVariantData(id);
        return;
      }
    }
    if (profile?.role === 'supplier' && user?.id) {
      const { data: ownProduct } = await sb.from('products').select(`*, ${PRODUCT_TIER_EMBED}`).eq('id', id).eq('supplier_id', user.id).maybeSingle();
      if (ownProduct) {
        const ownSupplierProfile = await fetchSupplierPublicProfileById(sb, user.id);
        const p = { ...ownProduct, profiles: ownSupplierProfile || null };
        setProduct(p);
        loadBuyerExtras(id, ownProduct.supplier_id || user.id);
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
    // option_values is stored as an array [{option_id, value_id}, ...] (jsonb).
    // Match every option axis to the supplier-saved combo.
    return variantVariants.find(v => {
      const ov = Array.isArray(v.option_values) ? v.option_values : [];
      return variantOptions.every(opt => {
        const entry = ov.find(o => o && o.option_id === opt.id);
        return entry && entry.value_id === selectedValues[opt.id];
      });
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
    if (opt?.input_type === 'color_swatch') {
      const val = (opt.product_option_values || []).find(v => v.id === valueId);
      if (val?.image_url) setSelectedImage(val.image_url);
    }
  };

  const addToOrderBuilder = () => {
    const activeVariant = getActiveVariant();
    if (!activeVariant) {
      alert((T[lang] || T.en).pdAlertSelectAllOptions);
      return;
    }
    const qtyNum = parseInt(variantQtyInput, 10);
    if (!qtyNum || qtyNum < 1) {
      alert((T[lang] || T.en).pdAlertValidQuantity);
      return;
    }
    if (activeVariant.moq && qtyNum < activeVariant.moq) {
      alert((T[lang] || T.en).pdAlertMinQtyFn(activeVariant.moq));
      return;
    }
    const tier = getApplicableTier(qtyNum);
    const unitPrice = tier ? Number(tier.unit_price) : Number(activeVariant.price || 0);
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
      alert((T[lang] || T.en).pdAlertValidQuantity);
      return;
    }
    if (!product) return;
    const sup = product.profiles || {};
    const supplierId = sup.id || product.supplier_id;
    if (!supplierId) { alert((T[lang] || T.en).pdAlertSupplierNotFound); return; }
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
      budget_per_unit: deriveProductPriceFrom(product) || null,
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
      alert((T[lang] || T.en).pdAlertAddVariant);
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
        order_id: requestId,
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
    alert((T[lang] || T.en).pdAlertQuoteSent);
    nav('/dashboard?tab=requests');
  };

  // ── Sample & Inquiry (unchanged) ─────────────────────────────────────────────

  const submitSample = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!product) return;
    const sup = product.profiles || {};
    const supplierId = sup.id || product.supplier_id;
    if (!supplierId) { setSendingSample(false); alert((T[lang] || T.en).pdAlertSupplierNotFound); return; }
    const maxQty = product.sample_max_qty || 3;
    if (parseInt(sampleQty, 10) > maxQty) { alert((T[lang] || T.en).pdAlertMaxSampleQtyFn(maxQty)); return; }
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
    alert((T[lang] || T.en).pdAlertSampleSent);
    setShowSampleForm(false); setSampleQty('1'); setSampleNote('');
  };

  const submitInquiry = async () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!product) return;
    const sup = product.profiles || {};
    const supplierId = sup.id || product.supplier_id;
    if (!supplierId) { alert((T[lang] || T.en).pdAlertSupplierNotFound); return; }
    const questionText = getProductInquiryQuestion(selectedInquiryTemplate);
    if (!questionText) { alert((T[lang] || T.en).pdAlertSelectInquiryTemplate); return; }
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
    alert((T[lang] || T.en).pdAlertInquirySent);
    setShowInquiryForm(false); setSelectedInquiryTemplate('');
  };

  const handleChat = () => {
    if (!user) { nav('/login/buyer'); return; }
    if (!product) return;
    const sup = product.profiles || {};
    const supplierId = sup.id || product.supplier_id;
    if (!supplierId) { alert((T[lang] || T.en).pdAlertSupplierNotFound); return; }
    nav(`/chat/${supplierId}`);
  };

  const stars = (r) => { let s = ''; for (let i = 1; i <= 5; i++) s += i <= r ? '★' : '☆'; return s; };
  const fmt = (n) => Number(n).toLocaleString('ar-SA-u-nu-latn', { maximumFractionDigits: 2 });

  if (loading) return <div className="product-detail-wrap"><BrandedLoading lang={lang} tone="product" /></div>;

  if (!product) return (
    <div className="product-detail-wrap">
      <div className="product-detail-inner">
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: 60 }}>
          {(T[lang] || T.en).pdProductNotFound}
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
  const productPriceFrom = deriveProductPriceFrom(product);
  const price = buildDisplayPrice({ amount: productPriceFrom, sourceCurrency: product.currency || 'USD', displayCurrency: displayCurrency || product.currency || 'USD', rates: exchangeRates, lang });
  const productSpecs = buildProductSpecs(product, lang);
  const tT = T[lang] || T.en;
  // Origin value: localize "China" via the existing per-country T entries; for
  // any other stored value (free-text "Other" supplier choice) we fall through.
  const originStored = product.country_of_origin || sup.country || 'China';
  const originLocalized = tT[`country${String(originStored).replace(/[^A-Za-z]/g, '')}`] || originStored || '—';
  const sourcingHighlights = [
    { label: tT.pdSourcingMoqLabel,           value: product.moq || '—' },
    { label: tT.pdOriginLabel, value: originLocalized },
    { label: tT.pdSourcingLeadTimeLabel,      value: product.spec_lead_time_days ? tT.pdLeadTimeDaysFn(product.spec_lead_time_days) : '—' },
    { label: tT.pdSourcingCustomizationLabel, value: product.spec_customization || tT.pdCustomizationNotSpecified },
    { label: tT.pdSourcingSamplesLabel,       value: product.sample_available ? tT.pdSamplesAvailableValue : tT.pdSamplesNotAvailableValue },
    { label: tT.pdSourcingPackagingLabel,     value: product.spec_packaging_details || '—' },
  ];

  const activeVariant = getActiveVariant();
  const variantQtyNum = parseInt(variantQtyInput, 10) || 0;
  const activeTier = getApplicableTier(variantQtyNum);
  const activeUnitPrice = activeTier ? Number(activeTier.unit_price) : (activeVariant ? Number(activeVariant.price || 0) : null);

  return (
    <div className="product-detail-wrap">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
      <div className="product-detail-inner">
        <button className="back-btn" onClick={() => nav('/products')}>
          {tT.pdBackBtn}
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
              ✓ {tT.pdVerifiedSupplierPill}
            </span>
          )}
          {product.sample_available && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', color: '#2d7a4f', fontSize: 11 }}>
              {tT.pdSampleAvailablePill}
            </span>
          )}
        </div>

        {secondaryName && secondaryName !== name && (
          <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 0, marginBottom: 10 }}>
            {tT.pdAlternateNameFn(secondaryName)}
          </p>
        )}

        <p className="product-detail-price">{productPriceFrom ? price.formattedDisplay : '—'}</p>
        {price.isConverted && (
          <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: -12, marginBottom: 22 }}>
            {tT.pdOriginalPriceFn(price.formattedSource)}
          </p>
        )}

        {/* ─── Phase 5B: Pricing & Trade Terms (tiers + Incoterms + port + lead time + validity) ─── */}
        <PricingTradeTermsBlock product={product} tiers={pricingTiers} lang={lang} vfFont={{}} isAr={isAr} />

        {/* ─── Meta ─── */}
        <div className="product-detail-meta">
          <div>
            <p className="meta-label">{tT.pdMinOrderLabel}</p>
            <p className="meta-val">{product.moq || '—'}</p>
          </div>
          <div>
            <p className="meta-label">{tT.pdSupplierLabel}</p>
            <p className="meta-val">{sup.company_name || '—'}</p>
          </div>
          <div>
            <p className="meta-label">{tT.pdOriginLabel}</p>
            <p className="meta-val">{originLocalized}</p>
          </div>
          {product.sample_available && (
            <div>
              <p className="meta-label">{tT.pdSampleLabel}</p>
              <p className="meta-val" style={{ color: '#2d7a4f', fontSize: 14 }}>{fmt(product.sample_price)} SAR</p>
            </div>
          )}
        </div>

        {/* ─── Sourcing snapshot ─── */}
        <div style={{ marginBottom: 24, padding: '14px 16px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
          <p style={{ fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
            {tT.pdSourcingSnapshotTitle}
          </p>
          <p style={{ fontSize: 12, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {tT.pdSourcingSnapshotBody}
          </p>
        </div>

        {desc && <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.8, marginBottom: 8 }}>{desc}</p>}

        {/* Phase 5D: HS code line — small, near description, with native-tooltip explanation */}
        {product.hs_code && (
          <p
            style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 22, display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title={(T[lang] || T.en).buyerHsCodeTooltip}
          >
            <span style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.2, textTransform: 'uppercase' }}>{(T[lang] || T.en).hsCodeLabel}</span>
            <span style={{ direction: 'ltr', fontFamily: 'monospace', color: 'var(--text-primary)' }}>{product.hs_code}</span>
            <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>ⓘ</span>
          </p>
        )}

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
              {tT.pdAttributesTitle}
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

        {/* ─── Phase 5B: Compliance & Certifications ─── */}
        <CompliancCertsBlock certs={productCerts} lang={lang} vfFont={{}} isAr={isAr} />

        {/* ─── Phase 5B: Customization (OEM/ODM availability) ─── */}
        <CustomizationBlock product={product} lang={lang} vfFont={{}} isAr={isAr} />

        {/* ─── Phase 5D: Logistics & Shipping (CBM, units/carton, weights) ─── */}
        <LogisticsBlock product={product} lang={lang} vfFont={{}} />

        {/* ═══════════════════════════════════════════════════════════
            VARIANT SYSTEM (has_variants products only)
        ═══════════════════════════════════════════════════════════ */}
        {product.has_variants && !isSupplier && (
          <div style={{ marginBottom: 32 }}>

            {loadingVariants && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-disabled)', fontSize: 13 }}>
                {tT.pdLoadingOptions}
              </div>
            )}

            {!loadingVariants && variantOptions.length > 0 && (
              <>
                {/* ── Option selectors ── */}
                <div style={{ marginBottom: 20, padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
                  <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16 }}>
                    {tT.pdSelectOptions}
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
                        <p style={{ fontSize: 9, color: 'var(--text-disabled)', letterSpacing: 1.2, marginBottom: 3 }}>{tT.pdPriceLabel}</p>
                        <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-primary)', direction: 'ltr' }}>
                          {activeUnitPrice !== null ? `$${formatPriceLocale(activeUnitPrice, lang)}` : '—'}
                          {/* discount_pct column does not exist on product_pricing_tiers — discount chip removed in Phase 5A */}
                        </p>
                      </div>
                      <div>
                        <p style={{ fontSize: 9, color: 'var(--text-disabled)', letterSpacing: 1.2, marginBottom: 3 }}>MOQ</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{activeVariant.moq || product.moq || '—'}</p>
                      </div>
                      {activeVariant.stock != null && (
                        <div>
                          <p style={{ fontSize: 9, color: 'var(--text-disabled)', letterSpacing: 1.2, marginBottom: 3 }}>{tT.pdStockLabel}</p>
                          <p style={{ fontSize: 12, color: activeVariant.stock > 0 ? '#2d7a4f' : '#c0392b' }}>{activeVariant.stock > 0 ? activeVariant.stock : tT.pdOutOfStock}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 8, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                      {tT.pdSelectAllToSeePrice}
                    </p>
                  )}
                </div>

                {/* Tier pricing table moved to Phase-5B PricingTradeTermsBlock at the
                   top of the page (single source of truth for pricing display).
                   The tier-matching highlight on quantity-typing has been removed
                   here to avoid rendering the table twice; getApplicableTier still
                   computes the correct tier price for the order line below. */}

                {/* ── Add to order row ── */}
                <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: '0 0 140px' }}>
                    <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1, marginBottom: 6 }}>{tT.pdQuantity}</p>
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      value={variantQtyInput}
                      onChange={e => setVariantQtyInput(e.target.value)}
                      placeholder={tT.pdQuantityPlaceholder}
                      style={{ margin: 0 }}
                    />
                  </div>
                  <button
                    className="btn-dark-sm"
                    onClick={addToOrderBuilder}
                    disabled={!activeVariant || !variantQtyInput}
                    style={{ minHeight: 40, flex: '1 0 auto', maxWidth: 200 }}
                  >
                    {tT.pdAddToOrder}
                  </button>
                </div>

                {/* ── Order Builder ── */}
                <div style={{ marginBottom: 24, padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: orderLines.length ? '1px solid var(--border-muted)' : '1px solid var(--border-subtle)', background: orderLines.length ? 'var(--bg-raised)' : 'var(--bg-subtle)' }}>
                  <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
                    {tT.pdOrderSummary}
                  </p>

                  {orderLines.length === 0 ? (
                    <p style={{ fontSize: 13, color: 'var(--text-disabled)', textAlign: 'center', padding: '16px 0', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                      {tT.pdNoVariantsAdded}
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
                              <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 2 }}>{tT.pdQty}</p>
                              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{line.qty}</p>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: 70 }}>
                              <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 2 }}>{tT.pdUnit}</p>
                              <p style={{ fontSize: 13, color: 'var(--text-secondary)', direction: 'ltr' }}>${formatPriceLocale(line.unitPrice, lang)}</p>
                            </div>
                            <div style={{ textAlign: 'center', minWidth: 80 }}>
                              <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 2 }}>{tT.pdTotal}</p>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', direction: 'ltr' }}>${formatPriceLocale(line.qty * line.unitPrice, lang)}</p>
                            </div>
                            <button
                              onClick={() => removeOrderLine(line.variantId)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
                              title={tT.pdRemove}
                            >×</button>
                          </div>
                        ))}
                      </div>

                      {/* Grand total */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderTop: '1px solid var(--border-subtle)', marginBottom: 14 }}>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                          {tT.pdGrandTotalFn(orderLines.reduce((s, l) => s + l.qty, 0))}
                        </p>
                        <p style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', direction: 'ltr' }}>{formatPriceWithConversion({
                          amount: orderGrandTotal,
                          sourceCurrency: 'USD',
                          displayCurrency,
                          rates: exchangeRates,
                          lang,
                        })}</p>
                      </div>

                      {/* Request quote button */}
                      <button
                        className="btn-primary"
                        style={{ background: '#1a1a1a', color: '#fff', width: '100%', minHeight: 44, fontSize: 14 }}
                        onClick={submitVariantOrder}
                        disabled={submittingVariantOrder}
                      >
                        {submittingVariantOrder ? '…' : tT.pdRequestQuote}
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
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{tT.pdMaabarReviewLabel}</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {isReviewedSupplier ? tT.pdMaabarReviewYes : tT.pdMaabarReviewNo}
                </p>
              </div>
              <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{tT.pdTrustSignalsLabel}</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {[
                    supplierTrustSignals.includes('trade_profile_available') ? tT.pdTrustTradeProfile : tT.pdTrustNoTradeProfile,
                    supplierTrustSignals.includes('wechat_available') ? tT.pdTrustWeChat : null,
                    supplierTrustSignals.includes('factory_media_available') ? tT.pdTrustFactoryMedia : null,
                  ].filter(Boolean).join(' · ')}
                </p>
              </div>
              <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>{tT.pdCommercialIdentityLabel}</p>
                <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, margin: 0 }}>
                  {supplierMaabarId ? tT.pdSupplierIdFn(supplierMaabarId) : tT.pdSupplierIdMissing}
                  {sup.years_experience ? ` · ${tT.pdYearsExperienceFn(sup.years_experience)}` : ''}
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
                  {isReviewedSupplier && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', color: '#5a9a72' }}>✓ {tT.pdVerifiedShort}</span>}
                  {supplierHasAnyCert && (
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: 'rgba(45,122,79,0.06)', border: '1px solid rgba(45,122,79,0.18)', color: '#2d7a4f' }}>
                      ✓ {tT.supplierCertifiedPill}
                    </span>
                  )}
                </div>
                <p className="stars" style={{ marginBottom: 4 }}>{stars(Math.round(sup.rating || 0))}</p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
                  {[sup.city, sup.country].filter(Boolean).join(', ') || '—'}
                  {sup.reviews_count ? ` · ${tT.pdReviewsCountFn(sup.reviews_count)}` : ''}
                </p>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>→</span>
            </div>

            {(supplierTrustSignals.length > 0 || supplierMaabarId || sup.trade_link || sup.wechat || sup.whatsapp) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                {supplierMaabarId && <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{tT.pdSupplierIdLabel}: {supplierMaabarId}</span>}
                {sup.trade_link && <a href={sup.trade_link} target="_blank" rel="noreferrer" className="btn-outline" style={{ minHeight: 34, textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>{tT.pdCompanyStoreLink}</a>}
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
              {tT.pdCtaHelper}
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
              {/* Flat-product only: Buy Now */}
              {!product.has_variants && (
                <button
                  className="btn-primary"
                  style={{ background: '#1a1a1a', color: '#fff', letterSpacing: 0 }}
                  onClick={() => { setShowBuyForm(!showBuyForm); setShowSampleForm(false); setShowInquiryForm(false); }}>
                  {tT.pdBuyNowBtn}
                </button>
              )}

              <button
                className="btn-outline"
                style={{ borderColor: 'var(--text-primary)', color: 'var(--text-primary)' }}
                onClick={() => { setShowInquiryForm(!showInquiryForm); setShowBuyForm(false); setShowSampleForm(false); }}>
                {tT.pdInquiryBtn}
              </button>

              {product.sample_available && (
                <button
                  className="btn-outline"
                  style={{ borderColor: '#2d7a4f', color: '#2d7a4f' }}
                  onClick={() => { setShowSampleForm(!showSampleForm); setShowBuyForm(false); setShowInquiryForm(false); }}>
                  {tT.pdRequestSampleFn(fmt(product.sample_price))}
                </button>
              )}

              <button className="btn-outline" onClick={handleChat}>
                {tT.pdContactSupplierBtn}
              </button>
            </div>
          </>
        )}

        {/* ─── Flat buy form ─── */}
        {showBuyForm && !product.has_variants && !orderConfirmed && (
          <div className="buy-form">
            <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 20, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {tT.pdBuyModalTitle}
            </h3>
            <div className="form-group">
              <label className="form-label">{tT.pdBuyModalQtyLabel}</label>
              <input className="form-input" value={qty} onChange={e => setQty(e.target.value)} placeholder={tT.pdQuantityPlaceholder} type="number" min="1" />
            </div>
            <div className="form-group">
              <label className="form-label">{tT.pdBuyModalNoteLabel}</label>
              <textarea className="form-input" rows={2} style={{ resize: 'none' }} value={note} onChange={e => setNote(e.target.value)} placeholder={tT.pdBuyModalNotePlaceholder} />
            </div>
            {!user && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{tT.pdBuyModalSigninWarning}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-dark-sm" onClick={submitOrder} disabled={sending}>{sending ? '...' : tT.pdBuyModalSubmit}</button>
              <button className="btn-outline" onClick={() => setShowBuyForm(false)}>{tT.pdCancelBtn}</button>
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
                  {tT.pdOrderSentTitle}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                  {tT.pdOrderSentBody}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-outline" onClick={() => nav('/products')}>
                {tT.pdBackToProducts}
              </button>
              <button className="btn-outline" onClick={() => nav('/dashboard?tab=requests')}>
                {tT.pdViewMyOrders}
              </button>
            </div>
          </div>
        )}

        {/* ─── Inquiry form ─── */}
        {showInquiryForm && (
          <div className="buy-form" style={{ borderColor: 'var(--border-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 6, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{tT.pdInquiryModalTitle}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{tT.pdInquiryModalSubtitle}</p>
              </div>
              <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', letterSpacing: 1 }}>{tT.pdInquiryModalTemplatesCount}</span>
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
            {!user && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{tT.pdInquiryModalSigninWarning}</p>}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn-dark-sm" onClick={submitInquiry} disabled={sendingInquiry}>{sendingInquiry ? '...' : tT.pdInquirySubmit}</button>
              <button className="btn-outline" onClick={() => setShowInquiryForm(false)}>{tT.pdCancelBtn}</button>
            </div>
          </div>
        )}

        {/* ─── Sample form ─── */}
        {showSampleForm && product.sample_available && (
          <div className="buy-form" style={{ borderColor: '#2d7a4f', borderWidth: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 400, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', color: 'var(--text-primary)' }}>{tT.pdSampleModalTitle}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>{tT.pdSampleModalSubtitleFn(fmt(product.sample_price), fmt(product.sample_shipping || 0))}</p>
              </div>
              <span style={{ background: 'rgba(45,122,79,0.08)', border: '1px solid rgba(45,122,79,0.2)', color: '#2d7a4f', fontSize: 10, padding: '3px 10px', borderRadius: 20, letterSpacing: 1 }}>{tT.pdSampleBadge}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{tT.pdSampleQtyLabelFn(product.sample_max_qty || 3)}</label>
                <input className="form-input" type="number" min="1" max={product.sample_max_qty || 3} value={sampleQty} onChange={e => setSampleQty(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
                <div style={{ background: 'var(--bg-hover)', padding: '10px 16px', borderRadius: 3, width: '100%' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 4, letterSpacing: 1 }}>{tT.pdSampleTotalLabel}</p>
                  <p style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', fontFamily: 'var(--font-en)' }}>{fmt(sampleTotal)} <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>SAR</span></p>
                </div>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{tT.pdSampleNoteLabel}</label>
              <textarea className="form-input" rows={2} style={{ resize: 'none' }} value={sampleNote} onChange={e => setSampleNote(e.target.value)} placeholder={tT.pdSampleNotePlaceholder} />
            </div>
            {product.sample_note && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16, padding: '10px 14px', background: 'var(--bg-hover)', borderRadius: 3, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>💬 {product.sample_note}</p>}
            {!user && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>{tT.pdSampleModalSigninWarning}</p>}
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{ background: '#2d7a4f', color: '#fff', border: 'none', padding: '11px 24px', fontSize: 13, cursor: 'pointer', borderRadius: 3 }} onClick={submitSample} disabled={sendingSample}>{sendingSample ? '...' : tT.pdSampleSubmit}</button>
              <button className="btn-outline" onClick={() => setShowSampleForm(false)}>{tT.pdCancelBtn}</button>
            </div>
          </div>
        )}
      </div>

      <Footer lang={lang} />
    </div>
  );
}
