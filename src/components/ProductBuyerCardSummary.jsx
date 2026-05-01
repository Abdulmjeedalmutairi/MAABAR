/**
 * ProductBuyerCardSummary — shared card body for the public listing pages.
 *
 * Used by Products.jsx and SupplierProfile.jsx to render the price range,
 * MOQ, trade chips (Incoterms / OEM / ODM / lead time), and cert badges
 * (with SASO emphasis + "+N" overflow). RTL-aware via `flex-wrap` + the
 * parent's `dir` attribute.
 *
 * Caller-supplied data (no internal queries):
 *   - product: row from `products` (must include the embedded
 *              `product_pricing_tiers` and `product_certifications` arrays
 *              from PRODUCT_TIER_EMBED + PRODUCT_CERT_EMBED).
 *   - displayCurrency, exchangeRates: standard Maabar pricing context.
 *   - lang: 'ar' | 'en' | 'zh'.
 */

import React from 'react';
import { buildDisplayPrice } from '../lib/displayCurrency';
import { deriveProductPriceRange } from '../lib/productPriceLookup';
import { getProductCertTypes } from '../lib/productCertLookup';
import { T } from '../lib/supplierDashboardConstants';
import { formatPriceLocale } from '../lib/formatLocale';

const KNOWN_INCOTERMS = ['FOB', 'CIF', 'EXW', 'DDP'];
const MAX_VISIBLE_INCOTERMS = 2;
const MAX_VISIBLE_CERTS = 3;

// Inline chip used across the trade-chip row and cert-badge row.
function Chip({ children, tone = 'neutral', vfFont }) {
  const palette = tone === 'sage'
    ? { bg: 'rgba(45,122,79,0.10)', br: 'rgba(45,122,79,0.30)', fg: '#2d7a4f' }
    : tone === 'ink'
    ? { bg: 'var(--bg-raised)', br: 'var(--border-muted)', fg: 'var(--text-primary)' }
    : { bg: 'var(--bg-subtle)', br: 'var(--border-subtle)', fg: 'var(--text-secondary)' };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 3,
      fontSize: 10,
      padding: '2px 7px',
      borderRadius: 999,
      background: palette.bg,
      border: `1px solid ${palette.br}`,
      color: palette.fg,
      whiteSpace: 'nowrap',
      ...vfFont,
    }}>
      {children}
    </span>
  );
}

export default function ProductBuyerCardSummary({
  product,
  displayCurrency,
  exchangeRates,
  lang,
}) {
  if (!product) return null;
  const tT = T[lang] || T.en;
  const isAr = lang === 'ar';
  const sourceCurrency = product.currency || 'USD';
  const targetCurrency = displayCurrency || sourceCurrency;
  const arabicFont = isAr ? { fontFamily: 'var(--font-ar)' } : {};

  // ── Price range ───────────────────────────────────────────────────────────
  const range = deriveProductPriceRange(product);
  let priceText = '—';
  if (range.from != null && range.to != null) {
    // Convert via buildDisplayPrice (handles source→display currency math) then
    // render the digits with formatPriceLocale for Eastern-Arabic-aware output.
    const fromBuilt = buildDisplayPrice({ amount: range.from, sourceCurrency, displayCurrency: targetCurrency, rates: exchangeRates, lang });
    const toBuilt   = buildDisplayPrice({ amount: range.to,   sourceCurrency, displayCurrency: targetCurrency, rates: exchangeRates, lang });
    const ccy = fromBuilt.displayCurrency;
    if (range.from === range.to) {
      priceText = `${formatPriceLocale(fromBuilt.displayAmount, lang)} ${ccy}`;
    } else {
      priceText = `${formatPriceLocale(fromBuilt.displayAmount, lang)} – ${formatPriceLocale(toBuilt.displayAmount, lang)} ${ccy}`;
    }
  }

  // ── MOQ ───────────────────────────────────────────────────────────────────
  const moq = Number.isFinite(parseInt(product.moq, 10)) && parseInt(product.moq, 10) >= 1
    ? parseInt(product.moq, 10)
    : null;

  // ── Trade chips (Incoterms · OEM · ODM · Lead time) ──────────────────────
  const incoterms = (Array.isArray(product.incoterms) ? product.incoterms : [])
    .filter(c => KNOWN_INCOTERMS.includes(c));
  const incotermsVisible = incoterms.slice(0, MAX_VISIBLE_INCOTERMS);
  const incotermsHidden  = Math.max(0, incoterms.length - MAX_VISIBLE_INCOTERMS);

  const leadMin = product.lead_time_min_days != null ? Number(product.lead_time_min_days) : null;
  const leadMax = product.lead_time_max_days != null ? Number(product.lead_time_max_days) : null;
  const hasLeadTime = leadMin !== null || leadMax !== null;

  const oem = Boolean(product.oem_available);
  const odm = Boolean(product.odm_available);

  const hasTradeChips = incotermsVisible.length > 0 || hasLeadTime || oem || odm;

  // ── Cert badges ──────────────────────────────────────────────────────────
  const certTypes = getProductCertTypes(product);
  const certVisible = certTypes.slice(0, MAX_VISIBLE_CERTS);
  const certHidden  = Math.max(0, certTypes.length - MAX_VISIBLE_CERTS);

  return (
    <>
      <p className="product-card-price" style={{ direction: 'ltr', textAlign: isAr ? 'right' : 'left' }}>
        {priceText}
      </p>

      {moq !== null && (
        <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: -4, marginBottom: 6, ...arabicFont }}>
          {tT.cardMoqFn(moq)}
        </p>
      )}

      {hasTradeChips && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {incotermsVisible.map((code) => (
            <Chip key={code} tone="ink" vfFont={arabicFont}>{code}</Chip>
          ))}
          {incotermsHidden > 0 && (
            <Chip tone="neutral" vfFont={arabicFont}>+{incotermsHidden}</Chip>
          )}
          {oem && <Chip tone="sage" vfFont={arabicFont}>OEM</Chip>}
          {odm && <Chip tone="sage" vfFont={arabicFont}>ODM</Chip>}
          {hasLeadTime && (
            <Chip tone="neutral" vfFont={arabicFont}>{tT.cardLeadTimeFn(leadMin, leadMax)}</Chip>
          )}
        </div>
      )}

      {certVisible.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
          {certVisible.map((code) => (
            <Chip key={code} tone={code === 'SASO' ? 'sage' : 'ink'} vfFont={arabicFont}>
              {code === 'SASO' ? `✓ ${code}` : code}
            </Chip>
          ))}
          {certHidden > 0 && (
            <Chip tone="neutral" vfFont={arabicFont}>+{certHidden}</Chip>
          )}
        </div>
      )}
    </>
  );
}
