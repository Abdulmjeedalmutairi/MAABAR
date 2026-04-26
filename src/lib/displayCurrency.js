const DISPLAY_CURRENCY_KEY = 'maabar_preferred_display_currency';
const DISPLAY_RATE_CACHE_KEY = 'maabar_display_currency_rates_v1';
const DEFAULT_RATES = { USD: 1, SAR: 3.75, CNY: 7.2 };

export const DISPLAY_CURRENCIES = ['USD', 'SAR', 'CNY'];
export const DEFAULT_DISPLAY_CURRENCY = 'USD';

export function normalizeDisplayCurrency(value) {
  return DISPLAY_CURRENCIES.includes(value) ? value : DEFAULT_DISPLAY_CURRENCY;
}

export function getStoredDisplayCurrency() {
  try {
    return normalizeDisplayCurrency(localStorage.getItem(DISPLAY_CURRENCY_KEY));
  } catch {
    return DEFAULT_DISPLAY_CURRENCY;
  }
}

export function storeDisplayCurrency(value) {
  try {
    localStorage.setItem(DISPLAY_CURRENCY_KEY, normalizeDisplayCurrency(value));
  } catch {
    // no-op
  }
}

export function getCachedDisplayRates() {
  try {
    const raw = localStorage.getItem(DISPLAY_RATE_CACHE_KEY);
    if (!raw) return DEFAULT_RATES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_RATES,
      ...parsed,
    };
  } catch {
    return DEFAULT_RATES;
  }
}

export function storeDisplayRates(rates) {
  try {
    localStorage.setItem(DISPLAY_RATE_CACHE_KEY, JSON.stringify({
      ...DEFAULT_RATES,
      ...rates,
    }));
  } catch {
    // no-op
  }
}

export async function fetchDisplayRates() {
  try {
    const response = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await response.json();
    const rates = {
      USD: 1,
      SAR: data?.rates?.SAR || DEFAULT_RATES.SAR,
      CNY: data?.rates?.CNY || DEFAULT_RATES.CNY,
    };
    storeDisplayRates(rates);
    return rates;
  } catch {
    return getCachedDisplayRates();
  }
}

export function convertCurrencyAmount(amount, sourceCurrency, targetCurrency, rates = DEFAULT_RATES) {
  const value = Number(amount || 0);
  const source = normalizeDisplayCurrency(sourceCurrency || 'USD');
  const target = normalizeDisplayCurrency(targetCurrency || source);
  const sourceRate = rates?.[source] || DEFAULT_RATES[source] || 1;
  const targetRate = rates?.[target] || DEFAULT_RATES[target] || 1;

  if (!Number.isFinite(value) || value <= 0) return 0;
  if (!sourceRate || !targetRate) return value;
  if (source === target) return value;

  const usdValue = value / sourceRate;
  return usdValue * targetRate;
}

export function formatCurrencyAmount(amount, currency, lang = 'en', options = {}) {
  const value = Number(amount || 0);
  if (!Number.isFinite(value)) return '—';

  const locale = lang === 'ar' ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : 'en-US';
  return `${value.toLocaleString(locale, {
    minimumFractionDigits: options.minimumFractionDigits ?? 0,
    maximumFractionDigits: options.maximumFractionDigits ?? 2,
  })} ${normalizeDisplayCurrency(currency)}`;
}

export function buildDisplayPrice({ amount, sourceCurrency, displayCurrency, rates, lang = 'en' }) {
  const source = normalizeDisplayCurrency(sourceCurrency || 'USD');
  const target = normalizeDisplayCurrency(displayCurrency || source);
  const displayAmount = convertCurrencyAmount(amount, source, target, rates);

  return {
    sourceCurrency: source,
    displayCurrency: target,
    sourceAmount: Number(amount || 0),
    displayAmount,
    formattedDisplay: formatCurrencyAmount(displayAmount, target, lang),
    formattedSource: formatCurrencyAmount(amount, source, lang),
    isConverted: source !== target,
  };
}

// Renders an amount in its source currency, optionally followed by an
// "≈ converted" tail when the viewer's display currency differs.
// Single row when source === display, both rows otherwise.
export function formatPriceWithConversion({ amount, sourceCurrency, displayCurrency, rates, lang = 'en', separator = ' ≈ ', options }) {
  const built = buildDisplayPrice({ amount, sourceCurrency, displayCurrency, rates, lang });
  const primary = formatCurrencyAmount(built.sourceAmount, built.sourceCurrency, lang, options);
  if (!built.isConverted) return primary;
  const secondary = formatCurrencyAmount(built.displayAmount, built.displayCurrency, lang, options);
  return `${primary}${separator}${secondary}`;
}

export async function persistDisplayCurrencyPreference({ sb, userId, currency, setProfile }) {
  const normalized = normalizeDisplayCurrency(currency);
  storeDisplayCurrency(normalized);

  if (!sb || !userId) {
    return { persistedRemotely: false, currency: normalized };
  }

  const { error } = await sb
    .from('profiles')
    .update({ preferred_display_currency: normalized })
    .eq('id', userId);

  if (!error) {
    setProfile?.(prev => prev ? { ...prev, preferred_display_currency: normalized } : prev);
    return { persistedRemotely: true, currency: normalized };
  }

  const missingColumn = /column profiles\.(preferred_display_currency) does not exist/i.test(error.message || '');
  return {
    persistedRemotely: false,
    currency: normalized,
    error,
    needsMigration: missingColumn,
  };
}
