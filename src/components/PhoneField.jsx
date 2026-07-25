import React, { useMemo, useState } from 'react';
import {
  getCountries,
  getCountryCallingCode,
  parsePhoneNumberFromString,
  isValidPhoneNumber,
  AsYouType,
} from 'libphonenumber-js';

// International phone entry for the sign-up forms.
//
// Why this exists: the old raw <input> had no country code, no `type="tel"`
// (so mobile showed the alphabetic keyboard), a hard-coded Saudi placeholder
// shown even to Chinese suppliers, and no E.164 validation/normalisation — so
// stored numbers were inconsistent ("05x", "5x", "+86 …"). Now that suppliers
// register *by* phone, the number is identity-critical and must be canonical.
//
// The whole control is locked `dir="ltr"` and self-contained, so it renders
// cleanly inside the RTL Arabic form without the caret-jumping / misalignment
// the previous LTR-input-in-RTL-form produced.
//
// onChange(e164, isValid): e164 is the canonical "+<cc><national>" (or '' when
// empty); isValid is libphonenumber's verdict for the chosen country.

// Surfaced at the top of the list — Maabar's two primary markets plus the Gulf.
const PRIORITY = ['SA', 'CN', 'AE', 'EG', 'KW', 'BH', 'QA', 'OM'];

function flagEmoji(iso) {
  return iso.toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export default function PhoneField({
  value = '',
  onChange,
  defaultCountry = 'SA',
  lang = 'ar',
  inputStyle = {},
  selectStyle = {},
  invalid = false,
  disabled = false,
  placeholder,
}) {
  const locale = lang === 'zh' ? 'zh' : lang === 'en' ? 'en' : 'ar';

  // Localised country names; falls back to the ISO code if unavailable.
  const regionNames = useMemo(() => {
    try { return new Intl.DisplayNames([locale], { type: 'region' }); }
    catch { return null; }
  }, [locale]);

  const countries = useMemo(() => {
    const all = getCountries();
    const decorate = (iso) => {
      let dial = '';
      try { dial = getCountryCallingCode(iso); } catch { dial = ''; }
      let name = iso;
      try { name = regionNames?.of(iso) || iso; } catch { name = iso; }
      return { iso, dial, name, flag: flagEmoji(iso) };
    };
    const priority = PRIORITY.filter((c) => all.includes(c)).map(decorate);
    const rest = all
      .filter((c) => !PRIORITY.includes(c))
      .map(decorate)
      .sort((a, b) => a.name.localeCompare(b.name, locale));
    return [...priority, ...rest];
  }, [regionNames, locale]);

  // Split an incoming E.164 value into (country, national) — computed once on mount.
  const initial = useMemo(() => {
    const parsed = value ? parsePhoneNumberFromString(value) : null;
    return {
      country: parsed?.country || defaultCountry,
      national: parsed?.nationalNumber ? String(parsed.nationalNumber) : '',
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [country, setCountry] = useState(initial.country);
  const [national, setNational] = useState(initial.national);

  const emit = (nextCountry, nextNational) => {
    const digits = (nextNational || '').replace(/[^\d]/g, '');
    if (!digits) { onChange?.('', false); return; }
    let dial = '';
    try { dial = getCountryCallingCode(nextCountry); } catch { dial = ''; }
    const e164 = `+${dial}${digits}`;
    let valid = false;
    try { valid = isValidPhoneNumber(e164); } catch { valid = false; }
    onChange?.(e164, valid);
  };

  const onCountry = (e) => {
    const c = e.target.value;
    setCountry(c);
    emit(c, national);
  };

  const onNational = (e) => {
    // Light as-you-type grouping for readability; emit() strips it back to digits.
    const formatted = new AsYouType(country).input(e.target.value);
    setNational(formatted);
    emit(country, formatted);
  };

  const mergedSelect = { direction: 'ltr', flex: '0 0 auto', maxWidth: 132, ...selectStyle };
  const mergedInput = {
    direction: 'ltr',
    flex: 1,
    ...inputStyle,
    ...(invalid ? { borderColor: '#e53e3e' } : null),
  };

  return (
    <div dir="ltr" style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
      <select
        value={country}
        onChange={onCountry}
        disabled={disabled}
        style={mergedSelect}
        aria-label="Country calling code"
      >
        {countries.map((c) => (
          <option key={c.iso} value={c.iso}>{c.flag} +{c.dial}  {c.name}</option>
        ))}
      </select>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        dir="ltr"
        value={national}
        onChange={onNational}
        disabled={disabled}
        placeholder={placeholder || '5x xxx xxxx'}
        style={mergedInput}
      />
    </div>
  );
}
