/**
 * Locale-aware numeric and date formatting for buyer-facing surfaces.
 *
 * Why a separate helper from `displayCurrency.formatCurrencyAmount`:
 *   `formatCurrencyAmount` is currency-suffixed and uses `ar-SA-u-nu-latn`
 *   (forces Latin digits even in Arabic). Phase 5D.5 calls for **Eastern
 *   Arabic numerals** in Arabic mode (٣٫٧٥), so this module uses `ar-SA`
 *   without the `-u-nu-latn` override and returns the bare number.
 *
 * Naming note: the spec calls this `formatPriceLocale`. The helper is
 * actually general-purpose numeric formatting (CBM, weights, quantities,
 * prices) — the `fractionDigits` option lets the caller pick precision.
 */

const NULL_PLACEHOLDER = '—';

function pickNumberLocale(lang) {
  // ar-SA → Eastern Arabic digits, Arabic separators (٣٫٧٥)
  // zh-CN → Western digits with Chinese grouping
  // en-US → Western digits
  return lang === 'ar' ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : 'en-US';
}

// Format a numeric value for buyer-side display. Returns '—' for any
// null/undefined/NaN/non-finite input (never "NaN" or "undefined").
export function formatPriceLocale(value, lang = 'en', { fractionDigits = 2 } = {}) {
  if (value === null || value === undefined || value === '') return NULL_PLACEHOLDER;
  const n = Number(value);
  if (!Number.isFinite(n)) return NULL_PLACEHOLDER;
  return n.toLocaleString(pickNumberLocale(lang), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

// Format an ISO/Date-parseable string in the buyer's locale. Returns null
// for null/empty input (so callers can use && short-circuit), and falls
// back to the raw value when the date is unparseable rather than
// rendering "Invalid Date".
export function formatDateLocale(iso, lang = 'en') {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat(pickNumberLocale(lang), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(d);
  } catch (_e) {
    return iso;
  }
}
