import React, { useState } from 'react';
import { sb } from '../../supabase';
import { runWithOptionalColumns } from '../../lib/supabaseColumnFallback';
import { T } from '../../lib/supplierDashboardConstants';
import { VF_C, VF_CSS, VfChk, VfField, VfG2 } from './VerificationFormUI';
import { normalizeProfileList, serializeProfileList } from '../../lib/supplierFormHelpers';

// Post-approval onboarding sequence — full-screen overlay shown to a
// supplier whose profile is in a verified state but has not yet flipped
// onboarding_completed=true. Four sequential steps:
//   A. Welcome     — confirms approval, shows the Maabar Supplier ID
//   B. Profile     — pre-filled form for company description, business type,
//                    year established, employee count, export markets,
//                    certifications, company website
//   C. Bank        — payout details (beneficiary, bank, account, SWIFT,
//                    optional IBAN, preferred display currency); has a
//                    "Complete later" skip that jumps to step D without
//                    saving any bank fields
//   D. Ready       — congratulatory CTA card with two destinations:
//                    add-product (primary) and requests (secondary).
//                    Either choice flips onboarding_completed=true and
//                    routes the supplier into the dashboard.
//
// The component is presentational + has its own form state. It writes to
// public.profiles directly via service-role-anon flows (RLS allows the
// supplier to update their own row). On completion it calls onComplete()
// so the parent dashboard can refresh state and unmount the overlay,
// and onNavigateToTab(tabId) for the final routing.
//
// Pre-fill behavior is option (i) from the redesign spec: existing
// profile values populate every field; the supplier can edit or extend.

// Phase 6D — certifications now carry an optional file_url alongside the name.
// Hydrate any pre-existing profile.certifications (which historically stored
// just `{ name }` or even a bare string) into the richer row shape used by
// the multi-entry UI. Stable `_id` per row prevents React-key drift on add/remove.
function hydrateCerts(rawCerts = []) {
  if (!Array.isArray(rawCerts)) return [];
  return rawCerts
    .map((c) => {
      const name = typeof c === 'string' ? c : (c && c.name) ? c.name : '';
      const fileUrl = (c && typeof c === 'object' && c.file_url) ? c.file_url : null;
      return {
        _id: Math.random().toString(36).slice(2, 10),
        name,
        file_url: fileUrl,
        uploading: false,
        error: null,
      };
    })
    .filter((c) => c.name || c.file_url);
}

const ONBOARDING_INPUT_STYLE = {
  width: '100%',
  background: 'none',
  border: 'none',
  borderBottom: `1px solid ${VF_C.ink10}`,
  outline: 'none',
  fontSize: 16,
  color: VF_C.ink,
  fontFamily: "'Tajawal', sans-serif",
  fontWeight: 400,
  padding: '8px 0 10px',
  borderRadius: 0,
  lineHeight: 1.5,
};

function StepBadgeRow({ active, isAr }) {
  const steps = isAr
    ? ['الترحيب', 'الملف', 'الاستلام', 'جاهز']
    : ['Welcome', 'Profile', 'Bank', 'Ready'];
  const indexByStep = { welcome: 0, profile: 1, bank: 2, ready: 3 };
  const currentIdx = indexByStep[active] ?? 0;
  return (
    <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
      {steps.map((label, i) => {
        const done = i < currentIdx;
        const cur = i === currentIdx;
        return (
          <div key={i} style={{
            flex: 1,
            padding: '9px 10px',
            borderRadius: 8,
            textAlign: 'center',
            border: `1px solid ${done ? VF_C.sageBr : cur ? 'rgba(26,24,20,0.22)' : VF_C.ink10}`,
            background: done ? VF_C.sageBg : cur ? VF_C.paper : 'transparent',
          }}>
            <p style={{
              fontSize: 11,
              color: done ? VF_C.sage : cur ? VF_C.ink : VF_C.ink30,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: cur ? 500 : 400,
              margin: 0,
            }}>
              {label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export default function SupplierOnboardingSequence({
  user,
  profile,
  lang = 'en',
  supplierMaabarId,
  setProfile,
  onComplete,
  onNavigateToTab,
}) {
  const isAr = lang === 'ar';
  const t = T[lang] || T.en;

  const [step, setStep] = useState('welcome');

  // Step B — pre-filled
  const [companyDescription, setCompanyDescription] = useState(profile?.company_description || profile?.bio_en || profile?.bio_ar || profile?.bio_zh || '');
  const [businessType, setBusinessType] = useState(profile?.business_type || '');
  const [yearEstablished, setYearEstablished] = useState(profile?.year_established != null ? String(profile.year_established) : '');
  const [numEmployees, setNumEmployees] = useState(profile?.num_employees != null ? String(profile.num_employees) : '');
  const [exportMarketsRaw, setExportMarketsRaw] = useState(serializeProfileList(profile?.export_markets));
  const [certs, setCerts] = useState(() => hydrateCerts(profile?.certifications));
  const [companyWebsite, setCompanyWebsite] = useState(profile?.company_website || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Step C — pre-filled
  const [beneficiaryName, setBeneficiaryName] = useState(profile?.payout_beneficiary_name || '');
  const [bankName, setBankName] = useState(profile?.bank_name || '');
  const [accountNumber, setAccountNumber] = useState(profile?.payout_account_number || '');
  const [swiftCode, setSwiftCode] = useState(profile?.swift_code || '');
  const [iban, setIban] = useState(profile?.payout_iban || '');
  const [preferredCurrency, setPreferredCurrency] = useState(profile?.preferred_display_currency || 'USD');
  const [savingBank, setSavingBank] = useState(false);
  const [bankError, setBankError] = useState('');

  const [completing, setCompleting] = useState(false);

  const saveProfile = async () => {
    setProfileError('');
    setSavingProfile(true);
    const yr = yearEstablished ? parseInt(yearEstablished, 10) : null;
    const ne = numEmployees ? parseInt(numEmployees, 10) : null;
    // Phase 6D — strip ephemeral row state (_id, uploading, error) before persist.
    // Keep entries that have a name OR a file (don't drop a file the user uploaded
    // while they're still typing the name).
    const certsArray = certs
      .map((c) => ({ name: String(c.name || '').trim(), file_url: c.file_url || null }))
      .filter((c) => c.name || c.file_url);
    const exportArray = normalizeProfileList(exportMarketsRaw);
    const description = String(companyDescription || '').trim();
    const payload = {
      company_description: description || null,
      bio_en: description || null,
      business_type: String(businessType || '').trim() || null,
      year_established: Number.isFinite(yr) ? yr : null,
      num_employees: Number.isFinite(ne) ? ne : null,
      export_markets: exportArray,
      certifications: certsArray,
      company_website: String(companyWebsite || '').trim() || null,
    };
    const { error, payload: persistedPayload } = await runWithOptionalColumns({
      table: 'profiles',
      payload,
      optionalKeys: ['company_description', 'bio_en', 'business_type', 'year_established', 'num_employees', 'export_markets', 'certifications', 'company_website'],
      execute: (next) => sb.from('profiles').update(next).eq('id', user.id),
    });
    setSavingProfile(false);
    if (error) {
      setProfileError(t.onbSavingError);
      return;
    }
    if (setProfile) setProfile((prev) => ({ ...(prev || {}), ...persistedPayload }));
    setStep('bank');
  };

  const saveBank = async () => {
    setBankError('');
    const beneficiary = String(beneficiaryName || '').trim();
    const bank = String(bankName || '').trim();
    const account = String(accountNumber || '').trim();
    const swift = String(swiftCode || '').trim();
    if (!beneficiary || !bank || !account || !swift) {
      setBankError(t.onbBankRequiredError);
      return;
    }
    setSavingBank(true);
    const payload = {
      pay_method: 'swift',
      payout_beneficiary_name: beneficiary,
      bank_name: bank,
      payout_account_number: account,
      swift_code: swift,
      payout_iban: String(iban || '').trim() || null,
      preferred_display_currency: String(preferredCurrency || 'USD').trim() || 'USD',
    };
    const { error, payload: persistedPayload } = await runWithOptionalColumns({
      table: 'profiles',
      payload,
      optionalKeys: ['payout_beneficiary_name', 'bank_name', 'payout_account_number', 'swift_code', 'payout_iban', 'pay_method', 'preferred_display_currency'],
      execute: (next) => sb.from('profiles').update(next).eq('id', user.id),
    });
    setSavingBank(false);
    if (error) {
      setBankError(t.onbSavingError);
      return;
    }
    if (setProfile) setProfile((prev) => ({ ...(prev || {}), ...persistedPayload }));
    setStep('ready');
  };

  // ── Phase 6D — quality certifications row handlers ──────────────────────
  const updateCertRow = (id, patch) => {
    setCerts((prev) => prev.map((c) => (c._id === id ? { ...c, ...patch } : c)));
  };

  const addCertRow = () => {
    setCerts((prev) => [
      ...prev,
      { _id: Math.random().toString(36).slice(2, 10), name: '', file_url: null, uploading: false, error: null },
    ]);
  };

  const removeCertRow = (id) => {
    // We intentionally do NOT delete the storage object here — orphaned files
    // in the public supplier-certifications bucket are bounded (≤10 MB each,
    // small per-supplier counts) and a periodic cleanup is the safer path
    // than a hard delete that races with the save call.
    setCerts((prev) => prev.filter((c) => c._id !== id));
  };

  const removeCertFile = (id) => {
    updateCertRow(id, { file_url: null, error: null });
  };

  const uploadCertFile = async (id, file) => {
    if (!file) return;
    updateCertRow(id, { uploading: true, error: null });
    const ext = (file.name.split('.').pop() || 'pdf').toLowerCase();
    const path = `${user.id}/cert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await sb.storage.from('supplier-certifications').upload(path, file, { upsert: true });
    if (error) {
      updateCertRow(id, { uploading: false, error: t.certUploadFailed });
      return;
    }
    const { data: { publicUrl } } = sb.storage.from('supplier-certifications').getPublicUrl(path);
    updateCertRow(id, { uploading: false, file_url: publicUrl, error: null });
  };

  const completeOnboarding = async (target) => {
    setCompleting(true);
    const { error } = await sb.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
    if (error) {
      setCompleting(false);
      // Best-effort failure: still close the overlay; admin can re-open if needed
      console.error('[onboarding] failed to flip onboarding_completed:', error);
    }
    if (setProfile) setProfile((prev) => ({ ...(prev || {}), onboarding_completed: true }));
    if (onComplete) onComplete();
    if (target && onNavigateToTab) onNavigateToTab(target);
  };

  return (
    <div
      dir={isAr ? 'rtl' : 'ltr'}
      style={{
        position: 'fixed',
        inset: 0,
        background: VF_C.cream,
        zIndex: 1500,
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <style>{VF_CSS}</style>

      <div style={{
        maxWidth: 560,
        margin: '0 auto',
        padding: '60px 24px 80px',
      }}>
        <StepBadgeRow active={step} isAr={isAr} />

        {step === 'welcome' && (
          <div className="vf-fu" style={{ textAlign: 'center' }}>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 40,
              fontWeight: 300,
              color: VF_C.ink,
              letterSpacing: -0.8,
              lineHeight: 1.2,
              marginBottom: 14,
            }}>
              {t.onbWelcomeTitle}
            </h1>
            <p style={{
              fontSize: 14,
              color: VF_C.ink60,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 300,
              lineHeight: 1.8,
              marginBottom: 30,
              maxWidth: 440,
              marginInline: 'auto',
            }}>
              {t.onbWelcomeIntro}
            </p>

            {supplierMaabarId && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px',
                borderRadius: 999,
                background: VF_C.sageBg,
                border: `1px solid ${VF_C.sageBr}`,
                marginBottom: 36,
              }}>
                <VfChk size={14} />
                <span style={{
                  fontSize: 13,
                  color: VF_C.sage,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: 500,
                  letterSpacing: 0.4,
                }}>
                  {t.supplierIdLabel} · {supplierMaabarId}
                </span>
              </div>
            )}

            <div style={{ display: 'grid', gap: 10, maxWidth: 320, marginInline: 'auto' }}>
              <button className="vf-btn-ink" onClick={() => setStep('profile')}>
                {t.onbWelcomeBtn}
              </button>
            </div>
          </div>
        )}

        {step === 'profile' && (
          <div className="vf-fu">
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 36,
              fontWeight: 300,
              color: VF_C.ink,
              letterSpacing: -0.8,
              lineHeight: 1.2,
              marginBottom: 10,
            }}>
              {t.onbProfileTitle}
            </h1>
            <p style={{
              fontSize: 13,
              color: VF_C.ink30,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 300,
              marginBottom: 30,
            }}>
              {t.onbWelcomeIntro}
            </p>

            <VfField label={t.onbProfileFieldDescription} delay={0}>
              <textarea
                style={{ ...ONBOARDING_INPUT_STYLE, resize: 'vertical', minHeight: 70, lineHeight: 1.7 }}
                rows={3}
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
              />
            </VfField>
            <div style={{ height: 18 }} />

            <VfG2>
              <VfField label={t.onbProfileFieldBusinessType} delay={0.05}>
                <input
                  style={ONBOARDING_INPUT_STYLE}
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  placeholder={isAr ? 'مصنّع / تاجر جملة' : lang === 'zh' ? '制造商 / 批发商' : 'Manufacturer / Wholesaler'}
                />
              </VfField>
              <VfField label={t.onbProfileFieldYearEstablished} delay={0.1}>
                <input
                  style={ONBOARDING_INPUT_STYLE}
                  type="number"
                  min="1800"
                  max="2099"
                  value={yearEstablished}
                  onChange={(e) => setYearEstablished(e.target.value)}
                  dir="ltr"
                />
              </VfField>
            </VfG2>
            <div style={{ height: 18 }} />

            <VfG2>
              <VfField label={t.onbProfileFieldNumEmployees} delay={0.15}>
                <input
                  style={ONBOARDING_INPUT_STYLE}
                  type="number"
                  min="0"
                  value={numEmployees}
                  onChange={(e) => setNumEmployees(e.target.value)}
                  dir="ltr"
                />
              </VfField>
              <VfField label={t.onbProfileFieldWebsite} delay={0.2}>
                <input
                  style={ONBOARDING_INPUT_STYLE}
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  placeholder="https://..."
                  dir="ltr"
                />
              </VfField>
            </VfG2>
            <div style={{ height: 18 }} />

            <VfField label={t.onbProfileFieldExportMarkets} delay={0.25}>
              <input
                style={ONBOARDING_INPUT_STYLE}
                value={exportMarketsRaw}
                onChange={(e) => setExportMarketsRaw(e.target.value)}
              />
            </VfField>
            <p style={{ fontSize: 11, color: VF_C.ink30, fontFamily: "'Tajawal', sans-serif", fontWeight: 300, marginTop: 6, marginBottom: 18 }}>
              {t.onbProfileFieldExportMarketsHint}
            </p>

            {/* Phase 6D — multi-entry quality certifications with optional file upload */}
            <div className="vf-fu" style={{ animationDelay: '0.3s' }}>
              <label className="vf-label">{t.onbProfileFieldCertifications}</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 10 }}>
                {certs.map((cert) => (
                  <div
                    key={cert._id}
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10,
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: VF_C.paper,
                      border: `1px solid ${VF_C.ink10}`,
                    }}
                  >
                    <input
                      type="text"
                      placeholder={t.certNamePlaceholder}
                      value={cert.name}
                      onChange={(e) => updateCertRow(cert._id, { name: e.target.value })}
                      style={{
                        flex: '1 1 180px',
                        minWidth: 0,
                        background: 'none',
                        border: 'none',
                        borderBottom: `1px solid ${VF_C.ink10}`,
                        outline: 'none',
                        fontSize: 14,
                        color: VF_C.ink,
                        fontFamily: "'Tajawal', sans-serif",
                        fontWeight: 400,
                        padding: '6px 0 7px',
                      }}
                    />

                    {cert.uploading ? (
                      <span
                        style={{
                          fontSize: 11,
                          color: VF_C.ink60,
                          fontFamily: "'Tajawal', sans-serif",
                          padding: '5px 10px',
                          letterSpacing: 0.3,
                        }}
                      >
                        {t.certUploadingLabel}
                      </span>
                    ) : cert.file_url ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 10px 4px 8px',
                          borderRadius: 999,
                          background: VF_C.sageBg,
                          border: `1px solid ${VF_C.sageBr}`,
                          color: VF_C.sage,
                          fontSize: 11,
                          fontFamily: "'Tajawal', sans-serif",
                          fontWeight: 500,
                        }}
                      >
                        <VfChk size={11} />
                        <a
                          href={cert.file_url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: VF_C.sage, textDecoration: 'none' }}
                        >
                          {t.certUploadedLabel}
                        </a>
                        <button
                          type="button"
                          onClick={() => removeCertFile(cert._id)}
                          aria-label={t.certUploadedLabel}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: VF_C.sage,
                            cursor: 'pointer',
                            padding: 0,
                            fontSize: 14,
                            lineHeight: 1,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    ) : (
                      <label
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 8,
                          border: `1px solid ${VF_C.ink10}`,
                          background: VF_C.cream,
                          color: VF_C.ink60,
                          fontSize: 12,
                          fontFamily: "'Tajawal', sans-serif",
                          cursor: 'pointer',
                        }}
                      >
                        {t.certUploadBtn}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) uploadCertFile(cert._id, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}

                    {cert.file_url && !cert.uploading && (
                      <label
                        style={{
                          fontSize: 11,
                          color: VF_C.ink60,
                          fontFamily: "'Tajawal', sans-serif",
                          textDecoration: 'underline',
                          textDecorationColor: VF_C.ink10,
                          cursor: 'pointer',
                        }}
                      >
                        {t.certReplaceBtn}
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files && e.target.files[0];
                            if (file) uploadCertFile(cert._id, file);
                            e.target.value = '';
                          }}
                        />
                      </label>
                    )}

                    <button
                      type="button"
                      onClick={() => removeCertRow(cert._id)}
                      style={{
                        marginInlineStart: 'auto',
                        background: 'none',
                        border: 'none',
                        color: VF_C.ink30,
                        cursor: 'pointer',
                        padding: '4px 6px',
                        fontSize: 18,
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>

                    {cert.error && (
                      <p style={{ flexBasis: '100%', margin: 0, fontSize: 11, color: '#a07070', fontFamily: "'Tajawal', sans-serif" }}>
                        {cert.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addCertRow}
                style={{
                  background: 'none',
                  border: `1px dashed ${VF_C.ink10}`,
                  borderRadius: 8,
                  color: VF_C.ink60,
                  fontSize: 12,
                  fontFamily: "'Tajawal', sans-serif",
                  fontWeight: 400,
                  padding: '8px 14px',
                  cursor: 'pointer',
                }}
              >
                {t.certAddBtn}
              </button>

              <p style={{ fontSize: 11, color: VF_C.ink30, fontFamily: "'Tajawal', sans-serif", fontWeight: 300, marginTop: 8 }}>
                {t.certFileTypesHint}
              </p>
            </div>

            {profileError && (
              <div className="vf-fi" style={{ marginTop: 18, padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(160,112,112,0.2)', background: 'rgba(160,112,112,0.07)' }}>
                <p style={{ fontSize: 13, color: '#a07070', fontFamily: "'Tajawal', sans-serif", margin: 0 }}>{profileError}</p>
              </div>
            )}

            <div className="vf-fu" style={{ animationDelay: '0.4s', marginTop: 36 }}>
              <button className="vf-btn-ink" disabled={savingProfile} onClick={saveProfile}>
                {savingProfile
                  ? (isAr ? 'جاري الحفظ...' : lang === 'zh' ? '保存中...' : 'Saving...')
                  : t.onbSaveContinueBtn}
              </button>
            </div>
          </div>
        )}

        {step === 'bank' && (
          <div className="vf-fu">
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 36,
              fontWeight: 300,
              color: VF_C.ink,
              letterSpacing: -0.8,
              lineHeight: 1.2,
              marginBottom: 10,
            }}>
              {t.onbBankTitle}
            </h1>
            <div style={{ marginBottom: 28, padding: '14px 18px', borderRadius: 10, background: VF_C.paper, border: `1px solid ${VF_C.ink10}` }}>
              <p style={{ fontSize: 12, color: VF_C.ink60, fontFamily: "'Tajawal', sans-serif", fontWeight: 300, lineHeight: 1.7, margin: 0 }}>
                {t.onbBankNote}
              </p>
            </div>

            <VfField label={t.onbBankFieldBeneficiary} delay={0}>
              <input
                style={ONBOARDING_INPUT_STYLE}
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
              />
            </VfField>
            <div style={{ height: 18 }} />

            <VfField label={t.onbBankFieldBankName} delay={0.05}>
              <input
                style={ONBOARDING_INPUT_STYLE}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </VfField>
            <div style={{ height: 18 }} />

            <VfG2>
              <VfField label={t.onbBankFieldAccountNumber} delay={0.1}>
                <input
                  style={ONBOARDING_INPUT_STYLE}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  dir="ltr"
                />
              </VfField>
              <VfField label={t.onbBankFieldSwift} delay={0.15}>
                <input
                  style={ONBOARDING_INPUT_STYLE}
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value)}
                  dir="ltr"
                />
              </VfField>
            </VfG2>
            <div style={{ height: 18 }} />

            <VfG2>
              <VfField label={t.onbBankFieldIban} delay={0.2}>
                <input
                  style={ONBOARDING_INPUT_STYLE}
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  dir="ltr"
                />
              </VfField>
              <VfField label={t.onbBankFieldCurrency} delay={0.25}>
                <select
                  style={{ ...ONBOARDING_INPUT_STYLE, appearance: 'none', cursor: 'pointer' }}
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                >
                  <option value="USD">USD</option>
                  <option value="SAR">SAR</option>
                  <option value="CNY">CNY</option>
                  <option value="EUR">EUR</option>
                </select>
              </VfField>
            </VfG2>

            {bankError && (
              <div className="vf-fi" style={{ marginTop: 18, padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(160,112,112,0.2)', background: 'rgba(160,112,112,0.07)' }}>
                <p style={{ fontSize: 13, color: '#a07070', fontFamily: "'Tajawal', sans-serif", margin: 0 }}>{bankError}</p>
              </div>
            )}

            <div className="vf-fu" style={{ animationDelay: '0.4s', marginTop: 36, display: 'grid', gap: 14, justifyItems: 'center' }}>
              <button className="vf-btn-ink" disabled={savingBank} onClick={saveBank} style={{ width: '100%' }}>
                {savingBank
                  ? (isAr ? 'جاري الحفظ...' : lang === 'zh' ? '保存中...' : 'Saving...')
                  : t.onbSaveContinueBtn}
              </button>
              <button
                onClick={() => setStep('ready')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: VF_C.ink60,
                  fontFamily: "'Tajawal', sans-serif",
                  fontSize: 13,
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '6px 12px',
                }}>
                {t.onbBankSkipLink}
              </button>
            </div>
          </div>
        )}

        {step === 'ready' && (
          <div className="vf-fu" style={{ textAlign: 'center' }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              border: `1px solid ${VF_C.sageBr}`,
              background: VF_C.sageBg,
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <VfChk size={26} />
            </div>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 36,
              fontWeight: 300,
              color: VF_C.ink,
              letterSpacing: -0.8,
              lineHeight: 1.2,
              marginBottom: 12,
            }}>
              {t.onbReadyTitle}
            </h1>
            <p style={{
              fontSize: 14,
              color: VF_C.ink60,
              fontFamily: "'Tajawal', sans-serif",
              fontWeight: 300,
              lineHeight: 1.8,
              marginBottom: 36,
              maxWidth: 440,
              marginInline: 'auto',
            }}>
              {t.onbReadyBody}
            </p>

            <div style={{ display: 'grid', gap: 12, maxWidth: 360, marginInline: 'auto' }}>
              <button
                className="vf-btn-ink"
                disabled={completing}
                onClick={() => completeOnboarding('add-product')}>
                {t.onbReadyPrimaryBtn}
              </button>
              <button
                className="vf-btn-ghost"
                disabled={completing}
                onClick={() => completeOnboarding('requests')}>
                {t.onbReadySecondaryBtn}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
