import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import {
  sb,
  SUPABASE_ANON_KEY,
  SUPABASE_FUNCTIONS_URL,
} from '../supabase';
import { sendMaabarEmail } from '../lib/maabarEmail';
import {
  buildSupplierTrustSignals,
  getSupplierOnboardingState,
  getSupplierPublicVisibilityStatuses,
  getSupplierReviewQueueStatuses,
  getSupplierTradeLinks,
} from '../lib/supplierOnboarding';
import ManagedAdminWorkspace from '../components/ManagedAdminWorkspace';
import {
  buildManagedBriefRow,
  generateManagedBriefWithAI,
  getManagedVerificationLevel,
  isManagedRequest,
} from '../lib/managedSourcing';

const REVIEW_STORAGE_KEY = 'maabar_adminseed_review_state_v2';
const REVIEW_QUEUE_STATUSES = getSupplierReviewQueueStatuses();
const PUBLIC_SUPPLIER_STATUSES = getSupplierPublicVisibilityStatuses();
const DEFAULT_TAB = 'review';

const REVIEW_CHECKLIST = [
  {
    key: 'identity',
    label: {
      en: 'Identity and company name checked',
      ar: 'تم التحقق من الهوية واسم الشركة',
    },
  },
  {
    key: 'trade',
    label: {
      en: 'Trade link / website verified',
      ar: 'تم التحقق من الرابط التجاري / الموقع',
    },
  },
  {
    key: 'proof',
    label: {
      en: 'Registration + license reviewed',
      ar: 'تمت مراجعة السجل والترخيص',
    },
  },
  {
    key: 'media',
    label: {
      en: 'Factory images / videos reviewed',
      ar: 'تمت مراجعة صور / فيديو المصنع',
    },
  },
  {
    key: 'payout',
    label: {
      en: 'Payout readiness understood',
      ar: 'تمت مراجعة جاهزية التحويل',
    },
  },
];

const BUCKET_LABELS = {
  all: { en: 'All queue', ar: 'كل الطابور' },
  urgent: { en: 'Urgent', ar: 'عاجل' },
  ready: { en: 'Ready to approve', ar: 'جاهز للاعتماد' },
  needs_info: { en: 'Needs follow-up', ar: 'يحتاج متابعة' },
  with_video: { en: 'Has videos', ar: 'يحتوي فيديو' },
  triage: { en: 'Triage', ar: 'فرز' },
  watchlist: { en: 'Watchlist', ar: 'قائمة مراقبة' },
  escalated: { en: 'Escalated', ar: 'مصعّد' },
};

const SORT_OPTIONS = {
  oldest: { en: 'Oldest first', ar: 'الأقدم أولاً' },
  newest: { en: 'Newest first', ar: 'الأحدث أولاً' },
  completeness: { en: 'Most complete', ar: 'الأكثر اكتمالاً' },
  trust: { en: 'Highest trust score', ar: 'أعلى درجة ثقة' },
};

const FIELD_LABELS = {
  company_name: { en: 'Company name', ar: 'اسم الشركة' },
  business_type: { en: 'Business type', ar: 'نوع النشاط' },
  location: { en: 'City / country', ar: 'المدينة / الدولة' },
  trade_link: { en: 'Trade link', ar: 'الرابط التجاري' },
  contact: { en: 'Business contact', ar: 'وسيلة التواصل التجارية' },
  description: { en: 'Company description', ar: 'وصف الشركة' },
  website: { en: 'Company website', ar: 'موقع الشركة' },
  address: { en: 'Company address', ar: 'عنوان الشركة' },
  reg_number: { en: 'Registration number', ar: 'رقم السجل' },
  years_experience: { en: 'Years of experience', ar: 'سنوات الخبرة' },
  license_photo: { en: 'License file', ar: 'ملف الترخيص' },
  factory_images: { en: 'Factory images', ar: 'صور المصنع' },
  factory_videos: { en: 'Factory videos', ar: 'فيديوهات المصنع' },
  employees: { en: 'Employee count', ar: 'عدد الموظفين' },
  pay_method: { en: 'Payout method', ar: 'طريقة التحويل' },
  alipay_account: { en: 'Alipay account', ar: 'حساب Alipay' },
  swift_details: { en: 'SWIFT + bank', ar: 'SWIFT + البنك' },
};

function safeLower(value) {
  return String(value || '').toLowerCase();
}

function safeTrim(value) {
  return String(value || '').trim();
}

function safeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toList(value) {
  if (Array.isArray(value)) {
    return value.map((item) => safeTrim(item)).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => safeTrim(item)).filter(Boolean);
      }
    } catch {
      return [trimmed];
    }

    return [trimmed];
  }

  return [];
}

function getLocale(lang = 'en') {
  return lang === 'ar' ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : 'en-GB';
}

function pickLangText(value, lang = 'en') {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  return value[lang] || value.en || value.ar || Object.values(value)[0] || '';
}

function formatDateTime(value, lang = 'en') {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat(getLocale(lang), {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '—';
  }
}

function formatDate(value, lang = 'en') {
  if (!value) return '—';

  try {
    return new Intl.DateTimeFormat(getLocale(lang), {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    }).format(new Date(value));
  } catch {
    return '—';
  }
}

function getQueueAgeHours(value) {
  if (!value) return 0;
  const diff = Date.now() - new Date(value).getTime();
  return Math.max(0, Math.round(diff / 3600000));
}

function formatQueueAge(value, lang = 'en') {
  const hours = getQueueAgeHours(value);

  if (lang === 'ar') {
    if (hours >= 48) return `${Math.floor(hours / 24)}ي ${hours % 24}س`;
    if (hours >= 24) return `${Math.floor(hours / 24)}ي`;
    return `${hours}س`;
  }

  if (hours >= 48) return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  if (hours >= 24) return `${Math.floor(hours / 24)}d`;
  return `${hours}h`;
}

function getDescription(profile = {}) {
  return safeTrim(
    profile.company_description
      || profile.bio_en
      || profile.bio_ar
      || profile.bio_zh
  );
}

function getTradeLinks(profile = {}) {
  return getSupplierTradeLinks(profile);
}

function buildAssetEntries(profile = {}) {
  const licensePhoto = safeTrim(profile.license_photo);
  const factoryImages = toList(profile.factory_images).length > 0
    ? toList(profile.factory_images)
    : toList(profile.factory_photo);
  const factoryVideos = toList(profile.factory_videos || profile.verification_videos);

  return {
    licensePhoto,
    factoryImages,
    factoryVideos,
    all: [
      ...(licensePhoto ? [{ key: `license-${licensePhoto}`, label: { en: 'Business license', ar: 'رخصة العمل' }, path: licensePhoto, kind: 'license' }] : []),
      ...factoryImages.map((path, index) => ({
        key: `factory-image-${index}-${path}`,
        label: { en: `Factory image ${index + 1}`, ar: `صورة المصنع ${index + 1}` },
        path,
        kind: 'factory_image',
      })),
      ...factoryVideos.map((path, index) => ({
        key: `factory-video-${index}-${path}`,
        label: { en: `Factory video ${index + 1}`, ar: `فيديو المصنع ${index + 1}` },
        path,
        kind: 'factory_video',
      })),
    ],
  };
}

function getAutoBucket(caseItem) {
  if (caseItem.needsFollowUp) return 'needs_info';
  if (caseItem.isUrgent) return 'urgent';
  if (caseItem.isReadyToApprove) return 'ready';
  return 'triage';
}

function buildDefaultReviewDraft(caseItem) {
  return {
    notes: '',
    reason: '',
    bucket: getAutoBucket(caseItem),
    checklist: REVIEW_CHECKLIST.reduce((acc, item) => ({ ...acc, [item.key]: false }), {}),
  };
}

function readStoredReviewDrafts() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(REVIEW_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function persistReviewDrafts(value) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Ignore localStorage write failures.
  }
}

function getFieldPresence(value) {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0;
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(safeTrim(value));
}

function buildSupplierCaseModel(profile = {}) {
  const onboardingState = getSupplierOnboardingState(profile);
  const tradeLinks = getTradeLinks(profile);
  const trustSignals = buildSupplierTrustSignals({ ...profile, status: onboardingState.status });
  const description = getDescription(profile);
  const assets = buildAssetEntries(profile);
  const waitHours = getQueueAgeHours(profile.created_at);
  const trustScore = safeNumber(profile.trust_score);
  const languages = toList(profile.languages);
  const exportMarkets = toList(profile.export_markets);

  const profileChecks = [
    { key: 'company_name', label: FIELD_LABELS.company_name, present: getFieldPresence(profile.company_name) },
    { key: 'business_type', label: FIELD_LABELS.business_type, present: getFieldPresence(profile.business_type) },
    { key: 'location', label: FIELD_LABELS.location, present: getFieldPresence(profile.city) && getFieldPresence(profile.country) },
    { key: 'trade_link', label: FIELD_LABELS.trade_link, present: tradeLinks.length > 0 },
    { key: 'contact', label: FIELD_LABELS.contact, present: getFieldPresence(profile.whatsapp) || getFieldPresence(profile.wechat) },
    { key: 'description', label: FIELD_LABELS.description, present: getFieldPresence(description) },
    { key: 'website', label: FIELD_LABELS.website, present: getFieldPresence(profile.company_website) },
    { key: 'address', label: FIELD_LABELS.address, present: getFieldPresence(profile.company_address) },
  ];

  const verificationChecks = [
    { key: 'reg_number', label: FIELD_LABELS.reg_number, present: getFieldPresence(profile.reg_number) },
    { key: 'years_experience', label: FIELD_LABELS.years_experience, present: getFieldPresence(profile.years_experience) },
    { key: 'license_photo', label: FIELD_LABELS.license_photo, present: getFieldPresence(assets.licensePhoto) },
    { key: 'factory_images', label: FIELD_LABELS.factory_images, present: assets.factoryImages.length > 0 },
    { key: 'factory_videos', label: FIELD_LABELS.factory_videos, present: assets.factoryVideos.length > 0 },
    { key: 'employees', label: FIELD_LABELS.employees, present: getFieldPresence(profile.num_employees) },
  ];

  const payoutChecks = [
    { key: 'pay_method', label: FIELD_LABELS.pay_method, present: getFieldPresence(profile.pay_method) },
    { key: 'alipay_account', label: FIELD_LABELS.alipay_account, present: profile.pay_method === 'alipay' ? getFieldPresence(profile.alipay_account) : false },
    { key: 'swift_details', label: FIELD_LABELS.swift_details, present: profile.pay_method === 'swift' ? getFieldPresence(profile.swift_code) && getFieldPresence(profile.bank_name) : false },
  ];

  const profilePresentCount = profileChecks.filter((item) => item.present).length;
  const verificationPresentCount = verificationChecks.filter((item) => item.present).length;
  const overallChecks = [...profileChecks, ...verificationChecks];
  const overallPresentCount = overallChecks.filter((item) => item.present).length;
  const missingRequired = [
    ...profileChecks.filter((item) => !item.present && ['company_name', 'location', 'trade_link', 'contact'].includes(item.key)).map((item) => item.key),
    ...verificationChecks.filter((item) => !item.present && ['reg_number', 'years_experience', 'license_photo', 'factory_images'].includes(item.key)).map((item) => item.key),
  ];

  const statusMismatch = REVIEW_QUEUE_STATUSES.includes(String(profile.status || '').toLowerCase()) && !onboardingState.isUnderReviewStage;
  const needsFollowUp = missingRequired.length > 0 || statusMismatch;
  const isReadyToApprove = missingRequired.length === 0;
  const isUrgent = waitHours >= 48;

  return {
    ...profile,
    onboardingState,
    tradeLinks,
    trustSignals,
    description,
    assets,
    languages,
    exportMarkets,
    profileChecks,
    verificationChecks,
    payoutChecks,
    profileCompletion: Math.round((profilePresentCount / profileChecks.length) * 100),
    verificationCompletion: Math.round((verificationPresentCount / verificationChecks.length) * 100),
    completenessScore: Math.round((overallPresentCount / overallChecks.length) * 100),
    missingRequired,
    statusMismatch,
    needsFollowUp,
    isReadyToApprove,
    isUrgent,
    waitHours,
    trustScore,
    queueAgeLabel: formatQueueAge(profile.created_at),
    searchBlob: [
      profile.company_name,
      profile.full_name,
      profile.email,
      profile.city,
      profile.country,
      profile.wechat,
      profile.whatsapp,
      profile.speciality,
      profile.business_type,
      profile.maabar_supplier_id,
      tradeLinks.join(' '),
      profile.reg_number,
    ].filter(Boolean).join(' ').toLowerCase(),
  };
}

function getMetricTone(value, threshold) {
  return value >= threshold ? 'attention' : 'default';
}

function badgeStyle(tone = 'default') {
  const tones = {
    default: {
      color: 'var(--text-secondary)',
      border: 'var(--border-subtle)',
      background: 'rgba(255,255,255,0.04)',
    },
    success: {
      color: '#7bc091',
      border: 'rgba(93, 192, 132, 0.24)',
      background: 'rgba(93, 192, 132, 0.08)',
    },
    warning: {
      color: '#f0bc75',
      border: 'rgba(240, 188, 117, 0.24)',
      background: 'rgba(240, 188, 117, 0.08)',
    },
    danger: {
      color: '#ff9b9b',
      border: 'rgba(255, 112, 112, 0.24)',
      background: 'rgba(255, 112, 112, 0.08)',
    },
    accent: {
      color: '#b7a5ff',
      border: 'rgba(139, 120, 255, 0.24)',
      background: 'rgba(139, 120, 255, 0.08)',
    },
  };

  const toneStyle = tones[tone] || tones.default;

  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--adminseed-badge-gap, 6px)',
    padding: 'var(--adminseed-badge-padding, 6px 10px)',
    borderRadius: 'var(--adminseed-badge-radius, 999px)',
    border: `1px solid ${toneStyle.border}`,
    background: toneStyle.background,
    color: toneStyle.color,
    fontSize: 'var(--adminseed-badge-font-size, 11px)',
    lineHeight: 'var(--adminseed-badge-line-height, 1)',
    whiteSpace: 'nowrap',
  };
}

function sectionCardStyle() {
  return {
    borderRadius: 'var(--adminseed-card-radius, 24px)',
    border: '1px solid var(--border-subtle)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
    padding: 'var(--adminseed-card-padding, 22px)',
  };
}

function ActionButton({ children, tone = 'default', disabled, onClick, fullWidth = false }) {
  const tones = {
    default: {
      background: 'rgba(255,255,255,0.06)',
      border: 'var(--border-default)',
      color: 'var(--text-primary)',
    },
    success: {
      background: 'rgba(93, 192, 132, 0.12)',
      border: 'rgba(93, 192, 132, 0.24)',
      color: '#7bc091',
    },
    warning: {
      background: 'rgba(240, 188, 117, 0.12)',
      border: 'rgba(240, 188, 117, 0.24)',
      color: '#f0bc75',
    },
    danger: {
      background: 'rgba(255, 112, 112, 0.12)',
      border: 'rgba(255, 112, 112, 0.24)',
      color: '#ff9b9b',
    },
    accent: {
      background: 'rgba(139, 120, 255, 0.12)',
      border: 'rgba(139, 120, 255, 0.24)',
      color: '#b7a5ff',
    },
  };

  const toneStyle = tones[tone] || tones.default;

  return (
    <button
      type="button"
      className="adminseed-action-button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 'var(--adminseed-action-height, 42px)',
        width: fullWidth ? '100%' : 'auto',
        padding: 'var(--adminseed-action-padding, 0 14px)',
        borderRadius: 'var(--adminseed-action-radius, 14px)',
        border: `1px solid ${toneStyle.border}`,
        background: toneStyle.background,
        color: toneStyle.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 'var(--adminseed-action-font-size, 12px)',
        fontWeight: 600,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, helper, tone = 'default' }) {
  const toneBorder = tone === 'attention'
    ? 'rgba(240, 188, 117, 0.22)'
    : 'var(--border-subtle)';

  return (
    <div className="adminseed-stat-card" style={{
      borderRadius: 'var(--adminseed-stat-radius, 24px)',
      border: `1px solid ${toneBorder}`,
      background: 'var(--bg-subtle)',
      padding: 'var(--adminseed-stat-padding, 20px 18px)',
    }}>
      <p style={{ margin: '0 0 10px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
        {label}
      </p>
      <p className="adminseed-stat-card-value" style={{ margin: '0 0 8px', fontSize: 'var(--adminseed-stat-value-size, 30px)', fontWeight: 300, color: 'var(--text-primary)' }}>{value}</p>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.75, color: 'var(--text-secondary)' }}>{helper}</p>
    </div>
  );
}

function InfoPair({ label, value, href }) {
  if (!value) return null;

  return (
    <div className="adminseed-info-pair" style={{
      padding: 'var(--adminseed-info-padding, 12px 14px)',
      borderRadius: 'var(--adminseed-info-radius, 16px)',
      border: '1px solid var(--border-subtle)',
      background: 'rgba(255,255,255,0.03)',
    }}>
      <p style={{ margin: '0 0 6px', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
        {label}
      </p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--text-primary)', lineHeight: 1.7, textDecoration: 'none', wordBreak: 'break-word' }}>
          {value}
        </a>
      ) : (
        <p style={{ margin: 0, color: 'var(--text-primary)', lineHeight: 1.7, wordBreak: 'break-word' }}>{value}</p>
      )}
    </div>
  );
}

function ChecklistRow({ label, checked, onToggle, textAlign = 'left', doneLabel = 'Done', pendingLabel = 'Pending' }) {
  return (
    <button
      type="button"
      className="adminseed-checklist-row"
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--adminseed-checklist-gap, 12px)',
        width: '100%',
        padding: 'var(--adminseed-checklist-padding, 11px 12px)',
        borderRadius: 'var(--adminseed-checklist-radius, 14px)',
        border: '1px solid var(--border-subtle)',
        background: 'rgba(255,255,255,0.03)',
        color: 'var(--text-primary)',
        cursor: 'pointer',
        textAlign,
      }}
    >
      <span className="adminseed-checklist-label" style={{ fontSize: 'var(--adminseed-checklist-font-size, 12px)', lineHeight: 'var(--adminseed-checklist-line-height, 1.6)' }}>{label}</span>
      <span style={badgeStyle(checked ? 'success' : 'default')}>{checked ? doneLabel : pendingLabel}</span>
    </button>
  );
}

function getMissingRequiredLabels(keys = [], lang = 'en') {
  return keys.map((key) => pickLangText(FIELD_LABELS[key], lang) || key);
}

export default function AdminSeed({ user, profile, lang = 'en' }) {
  const navigate = useNavigate();
  const isAr = lang === 'ar';

  usePageTitle('admin', lang);

  const [activeTab, setActiveTab] = useState(DEFAULT_TAB);
  const [stats, setStats] = useState({
    realUsers: 0,
    activeSuppliers: 0,
    completedDeals: 0,
    commissions: 0,
    newToday: 0,
  });
  const [recentSuppliers, setRecentSuppliers] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentDeals, setRecentDeals] = useState([]);
  const [queueRows, setQueueRows] = useState([]);
  const [queueLoading, setQueueLoading] = useState(false);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [queueError, setQueueError] = useState('');
  const [search, setSearch] = useState('');
  const [bucketFilter, setBucketFilter] = useState('all');
  const [sortBy, setSortBy] = useState('oldest');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [reviewDrafts, setReviewDrafts] = useState(() => readStoredReviewDrafts());
  const [docLoading, setDocLoading] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const [aiResults, setAiResults] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [command, setCommand] = useState('');
  const [seedLoading, setSeedLoading] = useState(false);
  const [log, setLog] = useState([]);
  const [collapsedSections, setCollapsedSections] = useState({});
  const toggleSection = (key) => setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  const SectionToggle = ({ id, label, badge, defaultOpen = true, children }) => {
    const isOpen = collapsedSections[id] === undefined ? defaultOpen : !collapsedSections[id];
    return (
      <div style={{ ...sectionCardStyle(), padding: 0, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => toggleSection(id)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            background: 'none',
            border: 'none',
            padding: '16px 20px',
            cursor: 'pointer',
            color: 'var(--text-primary)',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{label}</span>
            {badge !== undefined && <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.08)', borderRadius: 999, padding: '2px 8px', color: 'var(--text-secondary)' }}>{badge}</span>}
          </div>
          <span style={{ fontSize: 14, color: 'var(--text-disabled)', transition: 'transform 0.2s', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </button>
        {isOpen && (
          <div style={{ padding: '0 20px 20px' }}>
            {children}
          </div>
        )}
      </div>
    );
  };
  const [managedRequests, setManagedRequests] = useState([]);
  const [selectedManagedRequestId, setSelectedManagedRequestId] = useState('');
  const [managedSuppliers, setManagedSuppliers] = useState([]);
  const [selectedManagedSupplierIds, setSelectedManagedSupplierIds] = useState([]);
  const [managedSavingKey, setManagedSavingKey] = useState('');

  const isAdmin = profile?.role === 'admin';
  const tx = (arText, enText) => (isAr ? arText : enText);
  const textAlign = isAr ? 'right' : 'left';
  const locale = getLocale(lang);
  const bucketLabels = useMemo(
    () => Object.fromEntries(Object.entries(BUCKET_LABELS).map(([key, value]) => [key, pickLangText(value, lang)])),
    [lang],
  );
  const sortLabels = useMemo(
    () => Object.fromEntries(Object.entries(SORT_OPTIONS).map(([key, value]) => [key, pickLangText(value, lang)])),
    [lang],
  );
  const reviewChecklist = useMemo(
    () => REVIEW_CHECKLIST.map((item) => ({ ...item, label: pickLangText(item.label, lang) })),
    [lang],
  );

  useEffect(() => {
    if (profile && !isAdmin) {
      navigate('/dashboard', { replace: true });
    }
  }, [profile, isAdmin, navigate]);

  useEffect(() => {
    persistReviewDrafts(reviewDrafts);
  }, [reviewDrafts]);

  useEffect(() => {
    if (!isAdmin) return;
    loadStats();
    loadOverviewData();
    loadReviewQueue();
    loadManagedWorkspace();
  }, [isAdmin]);

  const reviewCases = useMemo(() => queueRows.map(buildSupplierCaseModel), [queueRows]);

  const queueMetrics = useMemo(() => {
    const urgent = reviewCases.filter((item) => item.isUrgent).length;
    const ready = reviewCases.filter((item) => item.isReadyToApprove).length;
    const needsFollowUp = reviewCases.filter((item) => item.needsFollowUp).length;
    const withVideos = reviewCases.filter((item) => item.assets.factoryVideos.length > 0).length;
    return { total: reviewCases.length, urgent, ready, needsFollowUp, withVideos };
  }, [reviewCases]);

  const filteredCases = useMemo(() => {
    const query = safeLower(search);
    const withBucket = reviewCases.filter((item) => {
      if (query && !item.searchBlob.includes(query)) return false;

      const draft = reviewDrafts[item.id] || buildDefaultReviewDraft(item);
      const assignedBucket = draft.bucket;

      if (bucketFilter === 'all') return true;
      if (bucketFilter === 'urgent') return item.isUrgent;
      if (bucketFilter === 'ready') return item.isReadyToApprove;
      if (bucketFilter === 'needs_info') return item.needsFollowUp;
      if (bucketFilter === 'with_video') return item.assets.factoryVideos.length > 0;
      if (bucketFilter === 'watchlist' || bucketFilter === 'escalated') return assignedBucket === bucketFilter;
      return true;
    });

    return [...withBucket].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'completeness') return b.completenessScore - a.completenessScore || new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'trust') return b.trustScore - a.trustScore || new Date(a.created_at) - new Date(b.created_at);
      return new Date(a.created_at) - new Date(b.created_at);
    });
  }, [bucketFilter, reviewCases, reviewDrafts, search, sortBy]);

  const selectedSupplier = useMemo(
    () => filteredCases.find((item) => item.id === selectedSupplierId) || reviewCases.find((item) => item.id === selectedSupplierId) || filteredCases[0] || null,
    [filteredCases, reviewCases, selectedSupplierId],
  );

  useEffect(() => {
    if (selectedSupplier && selectedSupplier.id !== selectedSupplierId) {
      setSelectedSupplierId(selectedSupplier.id);
    }
  }, [selectedSupplier, selectedSupplierId]);

  useEffect(() => {
    setSelectedManagedSupplierIds([]);
  }, [selectedManagedRequestId]);

  const selectedDraft = selectedSupplier
    ? (reviewDrafts[selectedSupplier.id] || buildDefaultReviewDraft(selectedSupplier))
    : null;

  const addLog = (message) => {
    setLog((prev) => [`[${new Date().toLocaleTimeString(locale)}] ${message}`, ...prev].slice(0, 50));
  };

  const refreshManagedWorkspace = async () => {
    await loadManagedWorkspace();
  };

  const generateManagedBrief = async (request) => {
    setManagedSavingKey(`brief:${request.id}`);
    try {
      const brief = await generateManagedBriefWithAI({ request, lang });
      await sb.from('managed_request_briefs').upsert(buildManagedBriefRow({ requestId: request.id, buyerId: request.buyer_id, brief }), { onConflict: 'request_id' });
      await sb.from('requests').update({ managed_status: 'admin_review', managed_priority: brief.priority || 'normal', managed_ai_ready_at: new Date().toISOString() }).eq('id', request.id);
      addLog(tx('تم تحديث AI brief للطلب المُدار.', 'Managed AI brief refreshed.'));
      await loadManagedWorkspace();
    } finally {
      setManagedSavingKey('');
    }
  };

  const saveManagedBriefReview = async (request, draft) => {
    setManagedSavingKey(`save-brief:${request.id}`);
    try {
      await sb.from('managed_request_briefs').upsert({
        request_id: request.id,
        buyer_id: request.buyer_id,
        ai_status: request.brief?.ai_status || 'ready',
        admin_review_status: draft.admin_follow_up_question ? 'follow_up' : 'approved',
        supplier_brief: draft.supplier_brief,
        admin_internal_notes: draft.admin_internal_notes || null,
        admin_follow_up_question: draft.admin_follow_up_question || null,
        priority: draft.priority || 'normal',
        extracted_specs: request.brief?.extracted_specs || [],
        cleaned_description: request.brief?.cleaned_description || request.description || '',
        category: request.brief?.category || request.category || 'other',
        ai_confidence: request.brief?.ai_confidence || 'medium',
        ai_output: request.brief?.ai_output || {},
      }, { onConflict: 'request_id' });
      await sb.from('requests').update({
        managed_status: draft.admin_follow_up_question ? 'admin_review' : 'sourcing',
        managed_priority: draft.priority || 'normal',
        managed_review_state: draft.admin_follow_up_question ? 'follow_up_requested' : 'approved',
        managed_follow_up_needed: Boolean(draft.admin_follow_up_question),
        managed_reviewed_at: new Date().toISOString(),
      }).eq('id', request.id);
      addLog(tx('تم حفظ مراجعة الطلب المُدار.', 'Managed request review saved.'));
      await loadManagedWorkspace();
    } finally {
      setManagedSavingKey('');
    }
  };

  const matchManagedSuppliers = async (request, supplierIds) => {
    if (!supplierIds?.length) return;
    setManagedSavingKey(`match:${request.id}`);
    try {
      const rows = supplierIds.map((supplierId) => ({
        request_id: request.id,
        buyer_id: request.buyer_id,
        supplier_id: supplierId,
        status: 'new',
        admin_note: request.brief?.supplier_brief || null,
      }));
      await sb.from('managed_supplier_matches').upsert(rows, { onConflict: 'request_id,supplier_id' });
      await sb.from('requests').update({ managed_status: 'sourcing', managed_review_state: 'matched' }).eq('id', request.id);
      setSelectedManagedSupplierIds([]);
      addLog(tx('تمت مطابقة الموردين المختارين مع الطلب.', 'Selected suppliers matched to the request.'));
      await loadManagedWorkspace();
    } finally {
      setManagedSavingKey('');
    }
  };

  const shortlistManagedOffer = async (request, offer, draft) => {
    setManagedSavingKey(`shortlist:${offer.id}`);
    try {
      const shippingTimeDays = (() => {
        const raw = String(offer.negotiation_note || '');
        const match = raw.match(/shipping_time_days:(\d+)/);
        return match ? parseInt(match[1], 10) : null;
      })();
      await sb.from('managed_shortlisted_offers').upsert({
        request_id: request.id,
        buyer_id: request.buyer_id,
        supplier_id: offer.supplier_id,
        offer_id: offer.id,
        rank: parseInt(draft.rank, 10) || 1,
        unit_price: offer.price,
        moq: offer.moq,
        production_time_days: offer.delivery_days || null,
        shipping_time_days: shippingTimeDays,
        verification_level: draft.verification_level || getManagedVerificationLevel(offer.profiles, lang),
        maabar_notes: draft.maabar_notes || null,
        selection_reason: draft.selection_reason || null,
        negotiation_summary: offer.note || null,
        status: 'active',
      }, { onConflict: 'request_id,rank' });
      await sb.from('offers').update({ shortlisted_at: new Date().toISOString() }).eq('id', offer.id);
      if (offer.managed_match_id) {
        await sb.from('managed_supplier_matches').update({ status: 'shortlisted' }).eq('id', offer.managed_match_id);
      }
      addLog(tx('تمت إضافة العرض إلى القائمة المختصرة.', 'Offer added to shortlist.'));
      await loadManagedWorkspace();
    } finally {
      setManagedSavingKey('');
    }
  };

  const publishManagedShortlist = async (request) => {
    setManagedSavingKey(`publish:${request.id}`);
    try {
      await sb.from('requests').update({ managed_status: 'shortlist_ready', managed_shortlist_ready_at: new Date().toISOString() }).eq('id', request.id);
      await sb.from('managed_supplier_matches').update({ status: 'closed', closed_at: new Date().toISOString() }).eq('request_id', request.id).neq('status', 'shortlisted');
      addLog(tx('تم نشر أفضل 3 عروض للعميل داخل صفحة الطلب.', 'Top 3 offers published to the buyer inside the request page.'));
      await loadManagedWorkspace();
    } finally {
      setManagedSavingKey('');
    }
  };

  const patchDraft = (supplierId, patch) => {
    setReviewDrafts((prev) => ({
      ...prev,
      [supplierId]: {
        ...(prev[supplierId] || buildDefaultReviewDraft(reviewCases.find((item) => item.id === supplierId) || {})),
        ...patch,
      },
    }));
  };

  const patchChecklist = (supplierId, key, value) => {
    setReviewDrafts((prev) => {
      const current = prev[supplierId] || buildDefaultReviewDraft(reviewCases.find((item) => item.id === supplierId) || {});
      return {
        ...prev,
        [supplierId]: {
          ...current,
          checklist: {
            ...(current.checklist || {}),
            [key]: value,
          },
        },
      };
    });
  };

  const loadStats = async () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [realUsers, activeSuppliers, completedDeals, completedPayments, newToday] = await Promise.all([
      sb.from('profiles').select('id', { count: 'exact', head: true }).eq('is_seed', false),
      sb.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'supplier').in('status', PUBLIC_SUPPLIER_STATUSES),
      sb.from('offers').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      sb.from('payments').select('amount').eq('status', 'completed'),
      sb.from('profiles').select('id', { count: 'exact', head: true }).eq('is_seed', false).gte('created_at', startOfDay.toISOString()),
    ]);

    const totalCommissions = 0;

    setStats({
      realUsers: realUsers.count || 0,
      activeSuppliers: activeSuppliers.count || 0,
      completedDeals: completedDeals.count || 0,
      commissions: Math.round(totalCommissions),
      newToday: newToday.count || 0,
    });
  };

  const loadOverviewData = async () => {
    setOverviewLoading(true);

    const [suppliersRes, requestsRes, dealsRes] = await Promise.all([
      sb.from('profiles')
        .select('id, company_name, full_name, status, created_at, city, country, trust_score, maabar_supplier_id')
        .eq('role', 'supplier')
        .order('created_at', { ascending: false })
        .limit(8),
      sb.from('requests')
        .select('id, title_ar, title_en, status, created_at, quantity')
        .order('created_at', { ascending: false })
        .limit(8),
      sb.from('offers')
        .select('id, status, created_at, requests(title_ar, title_en), profiles!offers_supplier_id_fkey(company_name)')
        .in('status', ['accepted', 'completed'])
        .order('created_at', { ascending: false })
        .limit(8),
    ]);

    setRecentSuppliers(suppliersRes.data || []);
    setRecentRequests(requestsRes.data || []);
    setRecentDeals(dealsRes.data || []);
    setOverviewLoading(false);
  };

  const loadManagedWorkspace = async () => {
    const [requestsRes, briefsRes, matchesRes, shortlistRes, offersRes, suppliersRes] = await Promise.all([
      sb.from('requests').select('*').eq('sourcing_mode', 'managed').order('created_at', { ascending: false }).limit(50),
      sb.from('managed_request_briefs').select('*').order('created_at', { ascending: false }),
      sb.from('managed_supplier_matches').select('*').order('matched_at', { ascending: false }),
      sb.from('managed_shortlisted_offers').select('*').order('rank', { ascending: true }),
      sb.from('offers').select('*, profiles!offers_supplier_id_fkey(company_name,full_name,status,city,country,speciality)').not('managed_match_id', 'is', null).order('created_at', { ascending: false }),
      sb.from('profiles').select('id, company_name, full_name, email, status, city, country, speciality').eq('role', 'supplier').in('status', PUBLIC_SUPPLIER_STATUSES).order('company_name', { ascending: true }),
    ]);

    const briefsByRequest = (briefsRes.data || []).reduce((acc, brief) => ({ ...acc, [brief.request_id]: brief }), {});
    const matchesByRequest = (matchesRes.data || []).reduce((acc, match) => {
      acc[match.request_id] = [...(acc[match.request_id] || []), match];
      return acc;
    }, {});
    const shortlistByRequest = (shortlistRes.data || []).reduce((acc, item) => {
      acc[item.request_id] = [...(acc[item.request_id] || []), item];
      return acc;
    }, {});
    const offersByRequest = (offersRes.data || []).reduce((acc, offer) => {
      acc[offer.request_id] = [...(acc[offer.request_id] || []), offer];
      return acc;
    }, {});

    const nextRequests = (requestsRes.data || []).map((request) => ({
      ...request,
      brief: briefsByRequest[request.id] || null,
      matches: matchesByRequest[request.id] || [],
      shortlist: shortlistByRequest[request.id] || [],
      offerCandidates: offersByRequest[request.id] || [],
    }));

    setManagedRequests(nextRequests);
    setManagedSuppliers(suppliersRes.data || []);
    if (!selectedManagedRequestId && nextRequests[0]?.id) {
      setSelectedManagedRequestId(nextRequests[0].id);
    }
  };

  const loadReviewQueue = async () => {
    setQueueLoading(true);
    setQueueError('');

    const { data, error } = await sb.from('profiles')
      .select('*')
      .eq('role', 'supplier')
      .in('status', REVIEW_QUEUE_STATUSES)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('loadReviewQueue error:', error);
      setQueueError(error.message || tx('فشل تحميل طابور مراجعة الموردين.', 'Failed to load supplier review queue.'));
      setQueueRows([]);
      setQueueLoading(false);
      return;
    }

    setQueueRows(data || []);
    setQueueLoading(false);
  };

  const openSupplierAsset = async (supplierId, asset) => {
    const requestKey = `${supplierId}:${asset.path}`;
    setDocLoading((prev) => ({ ...prev, [requestKey]: true }));

    try {
      const { data: authData } = await sb.auth.getSession();
      const accessToken = authData?.session?.access_token;
      if (!accessToken) throw new Error('Missing access token');

      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/admin-supplier-doc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ supplierId, docPath: asset.path }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.signedUrl) {
        throw new Error(payload?.error || 'Unable to open asset');
      }

      window.open(payload.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('openSupplierAsset error:', error);
      window.alert(tx('تعذر فتح هذا الملف بشكل آمن حالياً.', 'Unable to open this file securely right now.'));
    } finally {
      setDocLoading((prev) => ({ ...prev, [requestKey]: false }));
    }
  };

  const runAiReview = async (caseItem) => {
    setAiLoading((prev) => ({ ...prev, [caseItem.id]: true }));

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/Ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          system: `You are reviewing a B2B supplier onboarding case for Maabar. Return JSON only with this shape:
{
  "score": 0,
  "recommendation": "approve|review|reject",
  "summary": "short summary",
  "positives": ["item"],
  "concerns": ["item"],
  "missing_evidence": ["item"],
  "confidence": "low|medium|high"
}
Score is 0-100. Focus on credibility, proof completeness, business identity clarity, contact readiness, trade link quality, and media evidence.`,
          messages: [{
            role: 'user',
            content: JSON.stringify({
              company_name: caseItem.company_name,
              contact: {
                email: caseItem.email,
                whatsapp: caseItem.whatsapp,
                wechat: caseItem.wechat,
              },
              location: {
                city: caseItem.city,
                country: caseItem.country,
              },
              company_profile: {
                business_type: caseItem.business_type,
                speciality: caseItem.speciality,
                year_established: caseItem.year_established,
                languages: caseItem.languages,
                export_markets: caseItem.exportMarkets,
                company_website: caseItem.company_website,
                company_address: caseItem.company_address,
                company_description: caseItem.description,
                trade_links: caseItem.tradeLinks,
              },
              verification: {
                reg_number: caseItem.reg_number,
                years_experience: caseItem.years_experience,
                num_employees: caseItem.num_employees,
                license_uploaded: Boolean(caseItem.assets.licensePhoto),
                factory_images_count: caseItem.assets.factoryImages.length,
                factory_videos_count: caseItem.assets.factoryVideos.length,
              },
              payout: {
                pay_method: caseItem.pay_method,
                alipay_account: Boolean(caseItem.alipay_account),
                swift_code: Boolean(caseItem.swift_code),
                bank_name: Boolean(caseItem.bank_name),
              },
              trust: {
                trust_score: caseItem.trustScore,
                maabar_supplier_id: caseItem.maabar_supplier_id,
                trust_signals: caseItem.trustSignals,
              },
              queue: {
                raw_status: caseItem.status,
                resolved_status: caseItem.onboardingState.status,
                wait_hours: caseItem.waitHours,
                missing_required: caseItem.missingRequired,
              },
            }),
          }],
        }),
      });

      const payload = await response.json();
      const text = payload?.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setAiResults((prev) => ({ ...prev, [caseItem.id]: parsed }));
    } catch (error) {
      console.error('runAiReview error:', error);
      setAiResults((prev) => ({
        ...prev,
        [caseItem.id]: {
          score: 0,
          recommendation: 'review',
          summary: tx('فشل ملخص الذكاء الاصطناعي. استخدم المراجعة اليدوية فقط.', 'AI review failed. Use manual review only.'),
          positives: [],
          concerns: [tx('تعذر إكمال فحص الذكاء الاصطناعي.', 'AI check could not complete.')],
          missing_evidence: caseItem.missingRequired,
          confidence: 'low',
        },
      }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [caseItem.id]: false }));
    }
  };

  const clearDraftForSupplier = (supplierId) => {
    setReviewDrafts((prev) => {
      const next = { ...prev };
      delete next[supplierId];
      return next;
    });
  };

  const sendDecision = async (caseItem, decision) => {
    const draft = reviewDrafts[caseItem.id] || buildDefaultReviewDraft(caseItem);
    const reason = safeTrim(draft.reason);
    const notes = safeTrim(draft.notes);

    if ((decision === 'needs_info' || decision === 'rejected') && !reason) {
      window.alert(tx('أضف سبب المراجعة قبل إرسال هذا القرار.', 'Add a review reason before sending this decision.'));
      return;
    }

    if (decision === 'approved' && caseItem.missingRequired.length > 0) {
      const shouldContinue = window.confirm(tx(`لا يزال هذا المورد ينقصه: ${getMissingRequiredLabels(caseItem.missingRequired, 'ar').join('، ')}. هل تريد الاعتماد رغم ذلك؟`, `This supplier is still missing: ${getMissingRequiredLabels(caseItem.missingRequired, 'en').join(', ')}. Approve anyway?`));
      if (!shouldContinue) return;
    }

    const nextStatus = decision === 'approved'
      ? 'verified'
      : decision === 'needs_info'
        ? 'verification_required'
        : 'rejected';

    const loadingKey = `${caseItem.id}:${decision}`;
    setActionLoading((prev) => ({ ...prev, [loadingKey]: true }));

    try {
      const { data: updated, error } = await sb.from('profiles')
        .update({ status: nextStatus })
        .eq('id', caseItem.id)
        .in('status', REVIEW_QUEUE_STATUSES)
        .select('id, status, company_name, maabar_supplier_id')
        .maybeSingle();

      if (error) throw error;
      if (!updated) {
        addLog(tx(`تم التخطي ${caseItem.company_name || caseItem.email}: تغيّرت حالة الطابور بالفعل.`, `Skipped ${caseItem.company_name || caseItem.email}: queue state already changed.`));
        await loadReviewQueue();
        return;
      }

      const notifType = decision === 'approved'
        ? 'account_approved'
        : decision === 'needs_info'
          ? 'account_more_info_required'
          : 'account_rejected';

      const notificationPayload = decision === 'approved'
        ? {
          user_id: caseItem.id,
          type: notifType,
          title_ar: 'تم قبول حسابك في مَعبر. يمكنك الآن إضافة منتجاتك',
          title_en: 'Your Maabar account has been approved. You can now add your products',
          title_zh: '您的 Maabar 账户已获批准。您现在可以添加产品',
          ref_id: caseItem.id,
          is_read: false,
        }
        : decision === 'needs_info'
          ? {
            user_id: caseItem.id,
            type: notifType,
            title_ar: 'حسابك يحتاج استكمال بعض معلومات التحقق قبل المتابعة',
            title_en: 'Your account needs more verification details before review can continue',
            title_zh: '您的账户需要补充更多认证信息后才能继续审核',
            ref_id: caseItem.id,
            is_read: false,
          }
          : {
            user_id: caseItem.id,
            type: notifType,
            title_ar: 'نأسف، لم يتم قبول حسابك حالياً. راجع بريدك لمعرفة الخطوة التالية',
            title_en: 'Your account was not approved at this time. Check your email for next steps',
            title_zh: '您的账户暂未通过审核。请查看邮件了解后续步骤',
            ref_id: caseItem.id,
            is_read: false,
          };

      const { error: notificationError } = await sb.from('notifications').insert(notificationPayload);
      if (notificationError) throw notificationError;

      if (caseItem.email) {
        // نستخدم لغة المورد نفسه لإرسال الإيميل — مش لغة الأدمن
        const supplierLang = caseItem.lang || caseItem.preferred_language || 'en';

        if (decision === 'approved') {
          await sendMaabarEmail({
            type: 'supplier_approved',
            to: caseItem.email,
            data: {
              name: caseItem.company_name || caseItem.full_name || 'Supplier',
              lang: supplierLang,
              maabarSupplierId: updated.maabar_supplier_id || caseItem.maabar_supplier_id || '',
            },
          });
        }

        if (decision === 'needs_info') {
          await sendMaabarEmail({
            type: 'supplier_more_info_required',
            to: caseItem.email,
            data: {
              name: caseItem.company_name || caseItem.full_name || 'Supplier',
              lang: supplierLang,
              reason,
              notes,
            },
          });
        }

        if (decision === 'rejected') {
          await sendMaabarEmail({
            type: 'supplier_rejected',
            to: caseItem.email,
            data: {
              name: caseItem.company_name || caseItem.full_name || 'Supplier',
              lang: supplierLang,
              reason,
              notes,
            },
          });
        }
      }

      addLog(`${tx(decision === 'approved' ? 'اعتماد' : decision === 'needs_info' ? 'طلب معلومات' : 'رفض', decision)} → ${caseItem.company_name || caseItem.email}${reason ? ` | ${reason}` : ''}`);
      clearDraftForSupplier(caseItem.id);
      await Promise.all([loadReviewQueue(), loadStats(), loadOverviewData()]);
    } catch (error) {
      console.error('sendDecision error:', error);
      addLog(tx(`فشل ${decision} لـ ${caseItem.company_name || caseItem.email}`, `Failed ${decision} for ${caseItem.company_name || caseItem.email}`));
      window.alert(tx('فشل تنفيذ إجراء المراجعة. حاول مرة أخرى.', 'The review action failed. Please try again.'));
    } finally {
      setActionLoading((prev) => ({ ...prev, [loadingKey]: false }));
    }
  };

  const executeSeedCommand = async () => {
    if (!safeTrim(command)) return;

    setSeedLoading(true);
    addLog(tx(`أمر البذور: ${command}`, `Seed command: ${command}`));

    try {
      const response = await fetch(`${SUPABASE_FUNCTIONS_URL}/Ai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          system: `You help Maabar admin generate seed data commands. Reply with JSON only.
Available actions: add_requests, add_products, close_requests.
Shape: {"action":"add_requests","count":3,"data":[{"title_ar":"","title_en":"","quantity":"","description":""}]}`,
          messages: [{ role: 'user', content: command }],
        }),
      });

      const payload = await response.json();
      const text = payload?.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      if (parsed.action === 'add_requests') {
        for (const item of parsed.data || []) {
          await sb.from('requests').insert({
            buyer_id: user.id,
            title_ar: item.title_ar,
            title_en: item.title_en,
            title_zh: item.title_zh || item.title_en || item.title_ar,
            quantity: item.quantity,
            status: 'open',
            description: item.description || '',
          });
        }
        addLog(tx(`تمت إضافة ${(parsed.data || []).length} طلبات تجريبية.`, `Added ${(parsed.data || []).length} seed requests.`));
      }

      if (parsed.action === 'add_products') {
        for (const item of parsed.data || []) {
          await sb.from('products').insert({
            supplier_id: user.id,
            name_ar: item.name_ar,
            name_en: item.name_en,
            name_zh: item.name_zh || item.name_en,
            price_from: item.price_from,
            moq: item.moq,
            is_active: true,
          });
        }
        addLog(tx(`تمت إضافة ${(parsed.data || []).length} منتجات تجريبية.`, `Added ${(parsed.data || []).length} seed products.`));
      }

      if (parsed.action === 'close_requests') {
        const openRequestsRes = await sb.from('requests').select('id').eq('status', 'open').order('created_at', { ascending: true }).limit(parsed.count || 3);
        const ids = (openRequestsRes.data || []).map((item) => item.id);
        if (ids.length) {
          await sb.from('requests').update({ status: 'closed' }).in('id', ids);
        }
        addLog(tx(`تم إغلاق ${ids.length} طلبات تجريبية.`, `Closed ${ids.length} seed requests.`));
      }

      await Promise.all([loadStats(), loadOverviewData()]);
      setCommand('');
    } catch (error) {
      console.error('executeSeedCommand error:', error);
      addLog(tx('فشل أمر البذور.', 'Seed command failed.'));
      window.alert(tx('فشل أمر البذور.', 'Seed command failed.'));
    } finally {
      setSeedLoading(false);
    }
  };

  if (!user || !profile || !isAdmin) return null;

  return (
    <div className="adminseed-page" dir={isAr ? 'rtl' : 'ltr'} style={{ minHeight: 'var(--app-dvh)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
      <div className="adminseed-shell" style={{ maxWidth: 1440, margin: '0 auto', padding: '92px 24px 48px' }}>
        <div className="adminseed-hero" style={{ ...sectionCardStyle(), padding: 'var(--adminseed-hero-padding, 28px)', marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(circle at top right, rgba(0,0,0,0.04), transparent 28%)' }} />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: 18, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div style={{ maxWidth: 880 }}>
              <p style={{ margin: '0 0 12px', fontSize: 11, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                {tx('عمليات إدارة مَعبر', 'MAABAR ADMIN OPERATIONS')}
              </p>
              <h1 className="adminseed-hero-title" style={{ margin: '0 0 12px', fontSize: isAr ? 36 : 48, fontWeight: 300, lineHeight: 1.05 }}>
                {tx('عمليات مراجعة الموردين أصبحت أوضح ومهيكلة لعمل الأدمن الحقيقي', 'Supplier review ops, cleaned up and structured for real admin work')}
              </h1>
              <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.9, maxWidth: 860 }}>
                {tx('طابور المراجعة صار واضحاً طوال الوقت، وواجهة الحالة تعكس مسار انضمام المورد الفعلي، ومسار الاعتماد يدعم اعتماد / طلب معلومات / رفض مع الملاحظات والسبب وقائمة التحقق والفلاتر التشغيلية الثابتة.', 'The review queue now stays visible, the case view reflects the live supplier onboarding model, and approval flow supports approve / more info / reject with notes, reason, checklist, and stable operational filters.')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ActionButton onClick={() => { loadStats(); loadOverviewData(); loadReviewQueue(); loadManagedWorkspace(); }}>{tx('تحديث البيانات', 'Refresh data')}</ActionButton>
              <span style={badgeStyle('accent')}>{tx('واجهة إدارية خاصة', 'Private admin surface')}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {[
            { id: 'review', label: tx(`مراجعة الموردين (${queueMetrics.total})`, `Supplier review (${queueMetrics.total})`) },
            { id: 'managed', label: tx(`الطلبات المُدارة (${managedRequests.length})`, `Managed sourcing (${managedRequests.length})`) },
            { id: 'operations', label: tx('نظرة تشغيلية عامة', 'Operations overview') },
            { id: 'seed', label: tx('أدوات البيانات التجريبية', 'Seed tooling') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className="adminseed-tab-button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                minHeight: 'var(--adminseed-tab-height, 42px)',
                padding: 'var(--adminseed-tab-padding, 0 16px)',
                borderRadius: 'var(--adminseed-tab-radius, 14px)',
                border: `1px solid ${activeTab === tab.id ? 'rgba(139, 120, 255, 0.28)' : 'var(--border-subtle)'}`,
                background: activeTab === tab.id ? 'rgba(139, 120, 255, 0.1)' : 'rgba(255,255,255,0.03)',
                color: activeTab === tab.id ? '#d7d0ff' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontSize: 'var(--adminseed-action-font-size, 12px)',
                fontWeight: 600,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {queueError && (
          <div style={{
            marginBottom: 20,
            borderRadius: 18,
            border: '1px solid rgba(255, 112, 112, 0.2)',
            background: 'rgba(255, 112, 112, 0.08)',
            padding: '14px 16px',
            color: '#ffb3b3',
            fontSize: 13,
          }}>
            {queueError}
          </div>
        )}

        {activeTab === 'managed' && (
          <ManagedAdminWorkspace
            lang={lang}
            requests={managedRequests}
            selectedRequestId={selectedManagedRequestId}
            setSelectedRequestId={setSelectedManagedRequestId}
            supplierDirectory={managedSuppliers}
            selectedSupplierIds={selectedManagedSupplierIds}
            setSelectedSupplierIds={setSelectedManagedSupplierIds}
            onRefresh={refreshManagedWorkspace}
            onGenerateBrief={generateManagedBrief}
            onSaveBrief={saveManagedBriefReview}
            onMatchSuppliers={matchManagedSuppliers}
            onShortlistOffer={shortlistManagedOffer}
            onPublishShortlist={publishManagedShortlist}
            savingKey={managedSavingKey}
          />
        )}

        {activeTab === 'operations' && (
          <div style={{ display: 'grid', gap: 14 }}>

            <SectionToggle id="ops-metrics" label={tx('الإحصائيات', 'Metrics')} badge={6} defaultOpen={true}>
              <div className="adminseed-metrics" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 14, paddingTop: 4 }}>
                <StatCard label={tx('المستخدمون الحقيقيون', 'Real users')} value={stats.realUsers} helper={tx('الحسابات غير التجريبية في المنصة.', 'Non-seed accounts on the platform.')} />
                <StatCard label={tx('الموردون المعتمدون', 'Approved suppliers')} value={stats.activeSuppliers} helper={tx('حسابات الموردين الظاهرة حالياً للتجار.', 'Supplier accounts already visible to traders.')} />
                <StatCard label={tx('الصفقات المكتملة', 'Completed deals')} value={stats.completedDeals} helper={tx('العروض التي تم تعليمها كمكتملة.', 'Offers marked completed.')} />
                <StatCard label={tx('عمولة معبر', 'Maabar commission')} value={`SAR ${stats.commissions.toLocaleString(locale)}`} helper={tx('0% عمولة معبر على الصفقات.', 'Maabar charges 0% commission on transactions.')} />
                <StatCard label={tx('مستخدمون جدد اليوم', 'New users today')} value={stats.newToday} helper={tx('الحسابات التي أُنشئت منذ منتصف الليل.', 'Accounts created since midnight.')} />
                <StatCard label={tx('مراجعات عاجلة', 'Urgent reviews')} value={queueMetrics.urgent} helper={tx('حالات تنتظر 48 ساعة أو أكثر.', 'Queue cases waiting 48h or more.')} tone={getMetricTone(queueMetrics.urgent, 1)} />
              </div>
            </SectionToggle>

            <SectionToggle id="ops-queue" label={tx('الموردون المعلقون', 'Pending suppliers')} badge={reviewCases.length} defaultOpen={true}>
              <div className="adminseed-two-col" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20, paddingTop: 4 }}>
                <div style={sectionCardStyle()}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('صحة الطابور', 'Queue health')}</p>
                      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 400 }}>{tx('ما الذي يحتاج اهتماماً الآن', 'What needs attention right now')}</h2>
                    </div>
                    {queueLoading && <span style={badgeStyle('default')}>{tx('جارٍ التحديث…', 'Refreshing…')}</span>}
                  </div>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {reviewCases.length === 0 ? (
                      <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{tx('لا يوجد موردون حالياً في طابور المراجعة.', 'No suppliers are currently sitting in the review queue.')}</p>
                    ) : reviewCases
                      .slice()
                      .sort((a, b) => b.waitHours - a.waitHours)
                      .slice(0, 5)
                      .map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="adminseed-quick-case"
                          onClick={() => { setActiveTab('review'); setSelectedSupplierId(item.id); }}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            alignItems: 'center',
                            width: '100%',
                            textAlign,
                            padding: '14px 16px',
                            borderRadius: 18,
                            border: '1px solid var(--border-subtle)',
                            background: 'rgba(255,255,255,0.03)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>{item.company_name || item.full_name || tx('مورد بدون اسم', 'Unnamed supplier')}</p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>
                              {item.city || '—'}{item.country ? `, ${item.country}` : ''} · {formatQueueAge(item.created_at, lang)} {tx('في الطابور', 'in queue')}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <span style={badgeStyle(item.isUrgent ? 'warning' : 'default')}>{item.isUrgent ? tx('عاجل', 'Urgent') : tx('ضمن المهلة', 'In SLA')}</span>
                            <span style={badgeStyle(item.isReadyToApprove ? 'success' : 'danger')}>
                              {item.isReadyToApprove ? tx('جاهز', 'Ready') : tx(`${item.missingRequired.length} نواقص`, `${item.missingRequired.length} gaps`)}
                            </span>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 20 }}>
                  <div style={sectionCardStyle()}>
                    <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('نشاط الموردين الأخير', 'Recent supplier activity')}</p>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {overviewLoading && recentSuppliers.length === 0 ? (
                        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{tx('جارٍ التحميل…', 'Loading…')}</p>
                      ) : recentSuppliers.map((item) => (
                        <div key={item.id} style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                            <div>
                              <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600 }}>{item.company_name || item.full_name || tx('مورد بدون اسم', 'Unnamed supplier')}</p>
                              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{formatDate(item.created_at, lang)} · {item.city || '—'}{item.country ? `, ${item.country}` : ''}</p>
                            </div>
                            <span style={badgeStyle(PUBLIC_SUPPLIER_STATUSES.includes(String(item.status || '').toLowerCase()) ? 'success' : 'default')}>
                              {item.status || '—'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </SectionToggle>

            <SectionToggle id="ops-requests" label={tx('أحدث الطلبات والصفقات', 'Recent requests & deals')} badge={recentRequests.length + recentDeals.length} defaultOpen={false}>
              <div style={{ display: 'grid', gap: 10, paddingTop: 4 }}>
                {recentRequests.slice(0, 4).map((item) => (
                  <div key={`request-${item.id}`} style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600 }}>{(lang === 'ar' ? item.title_ar || item.title_en : item.title_en || item.title_ar) || tx('طلب بدون عنوان', 'Untitled request')}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{item.status || '—'} · {tx('الكمية', 'Qty')} {item.quantity || '—'} · {formatDate(item.created_at, lang)}</p>
                  </div>
                ))}
                {recentDeals.slice(0, 4).map((item) => (
                  <div key={`deal-${item.id}`} style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600 }}>{(lang === 'ar' ? item.requests?.title_ar || item.requests?.title_en : item.requests?.title_en || item.requests?.title_ar) || tx('عرض مقبول', 'Accepted offer')}</p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{item.profiles?.company_name || tx('مورد غير معروف', 'Unknown supplier')} · {item.status} · {formatDate(item.created_at, lang)}</p>
                  </div>
                ))}
              </div>
            </SectionToggle>

          </div>
        )}

        {activeTab === 'review' && (
          <div className="adminseed-review-layout" style={{ display: 'grid', gridTemplateColumns: '380px minmax(0, 1fr)', gap: 20 }}>
            <div style={{ display: 'grid', gap: 20, alignSelf: 'start' }}>
              <div style={sectionCardStyle()}>
                <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('مؤشرات الطابور', 'Queue metrics')}</p>
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                    <StatCard label={tx('الطابور', 'Queue')} value={queueMetrics.total} helper={tx('الحالات الحالية قيد المراجعة.', 'Current cases in review.')} />
                    <StatCard label={tx('جاهز', 'Ready')} value={queueMetrics.ready} helper={tx('كل الإثباتات الأساسية موجودة.', 'All core proof present.')} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                    <StatCard label={tx('عاجل', 'Urgent')} value={queueMetrics.urgent} helper={tx('انتظار 48 ساعة أو أكثر.', '>= 48h waiting.')} tone={getMetricTone(queueMetrics.urgent, 1)} />
                    <StatCard label={tx('فيديوهات', 'Videos')} value={queueMetrics.withVideos} helper={tx('حالات تحتوي على فيديو مصنع.', 'Cases with factory video evidence.')} />
                  </div>
                  <StatCard label={tx('يحتاج متابعة', 'Needs follow-up')} value={queueMetrics.needsFollowUp} helper={tx('يوجد نقص في الإثباتات أو تعارض في الحالة.', 'Missing proof or status mismatch detected.')} tone={getMetricTone(queueMetrics.needsFollowUp, 1)} />
                </div>
              </div>

              <div style={sectionCardStyle()}>
                <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('الفلاتر', 'Filters')}</p>
                <div style={{ display: 'grid', gap: 12 }}>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder={tx('ابحث باسم الشركة أو البريد أو المعرّف أو المدينة أو الرابط التجاري', 'Search company, email, ID, city, trade link')}
                    style={{
                      minHeight: 44,
                      borderRadius: 14,
                      border: '1px solid var(--border-default)',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text-primary)',
                      padding: '0 14px',
                      outline: 'none',
                    }}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                    <select
                      value={bucketFilter}
                      onChange={(event) => setBucketFilter(event.target.value)}
                      style={{
                        minHeight: 44,
                        borderRadius: 14,
                        border: '1px solid var(--border-default)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)',
                        padding: '0 12px',
                      }}
                    >
                      {Object.entries(bucketLabels).map(([value, label]) => (
                        <option key={value} value={value} style={{ background: '#111113' }}>{label}</option>
                      ))}
                    </select>
                    <select
                      value={sortBy}
                      onChange={(event) => setSortBy(event.target.value)}
                      style={{
                        minHeight: 44,
                        borderRadius: 14,
                        border: '1px solid var(--border-default)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)',
                        padding: '0 12px',
                      }}
                    >
                      {Object.entries(sortLabels).map(([value, label]) => (
                        <option key={value} value={value} style={{ background: '#111113' }}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['all', 'urgent', 'ready', 'needs_info', 'with_video'].map((bucket) => (
                      <button
                        key={bucket}
                        type="button"
                        className="adminseed-pill-button"
                        onClick={() => setBucketFilter(bucket)}
                        style={{
                          minHeight: 34,
                          padding: '0 12px',
                          borderRadius: 999,
                          border: `1px solid ${bucketFilter === bucket ? 'rgba(0,0,0,0.15)' : 'var(--border-subtle)'}`,
                          background: bucketFilter === bucket ? '#1a1a1a' : 'transparent',
                          color: bucketFilter === bucket ? '#ffffff' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          fontSize: 11,
                        }}
                      >
                        {bucketLabels[bucket]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ ...sectionCardStyle(), padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ margin: 0, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('قائمة الطابور', 'Queue list')}</p>
                  {queueLoading && <span style={badgeStyle('default')}>{tx('جارٍ التحديث…', 'Refreshing…')}</span>}
                </div>
                <div className="adminseed-queue-list" style={{ display: 'grid', gap: 10, maxHeight: 'calc(var(--app-dvh) - 280px)', overflowY: 'auto', paddingRight: 4 }}>
                  {filteredCases.length === 0 ? (
                    <div style={{ padding: '24px 14px', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.8 }}>
                      {tx('لا توجد حالات تطابق الفلاتر الحالية.', 'No queue cases match the current filters.')}
                    </div>
                  ) : filteredCases.map((item) => {
                    const draft = reviewDrafts[item.id] || buildDefaultReviewDraft(item);
                    const isSelected = selectedSupplier?.id === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="adminseed-queue-item"
                        onClick={() => setSelectedSupplierId(item.id)}
                        style={{
                          width: '100%',
                          textAlign,
                          padding: '14px 14px 12px',
                          borderRadius: 18,
                          border: `1px solid ${isSelected ? 'rgba(0,0,0,0.15)' : 'var(--border-subtle)'}`,
                          background: isSelected ? 'var(--bg-subtle)' : 'transparent',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>{item.company_name || item.full_name || tx('مورد بدون اسم', 'Unnamed supplier')}</p>
                            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{item.city || '—'}{item.country ? `, ${item.country}` : ''}</p>
                          </div>
                          <span style={badgeStyle(item.isUrgent ? 'warning' : 'default')}>{formatQueueAge(item.created_at, lang)}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                          <span style={badgeStyle(item.isReadyToApprove ? 'success' : 'danger')}>
                            {item.isReadyToApprove ? tx('جاهز', 'Ready') : tx(`${item.missingRequired.length} نواقص`, `${item.missingRequired.length} gaps`)}
                          </span>
                          {item.assets.factoryVideos.length > 0 && <span style={badgeStyle('accent')}>{tx('فيديو', 'Video')}</span>}
                          {item.statusMismatch && <span style={badgeStyle('warning')}>{tx('تعارض حالة', 'Status mismatch')}</span>}
                          {draft.bucket === 'watchlist' && <span style={badgeStyle('warning')}>{tx('مراقبة', 'Watchlist')}</span>}
                          {draft.bucket === 'escalated' && <span style={badgeStyle('danger')}>{tx('مصعّد', 'Escalated')}</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('الملف', 'Profile')}</p>
                            <p style={{ margin: 0, fontSize: 12 }}>{item.profileCompletion}%</p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('الإثباتات', 'Proof')}</p>
                            <p style={{ margin: 0, fontSize: 12 }}>{item.verificationCompletion}%</p>
                          </div>
                          <div>
                            <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('الثقة', 'Trust')}</p>
                            <p style={{ margin: 0, fontSize: 12 }}>{item.trustScore || '—'}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: 20, alignSelf: 'start' }}>
              {!selectedSupplier ? (
                <div style={{ ...sectionCardStyle(), minHeight: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  {tx('اختر حالة مورد لبدء المراجعة.', 'Select a supplier case to review.')}
                </div>
              ) : (
                <>
                  <div style={{ ...sectionCardStyle(), padding: 24 }}>
                    <div className="adminseed-case-header" style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>
                      <div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
                          <span style={badgeStyle(selectedSupplier.isReadyToApprove ? 'success' : 'warning')}>
                            {selectedSupplier.isReadyToApprove ? tx('جاهز للاعتماد', 'Ready to approve') : tx('يحتاج متابعة', 'Needs follow-up')}
                          </span>
                          <span style={badgeStyle(selectedSupplier.isUrgent ? 'warning' : 'default')}>
                            {formatQueueAge(selectedSupplier.created_at, lang)} {tx('في الطابور', 'in queue')}
                          </span>
                          {selectedSupplier.statusMismatch && <span style={badgeStyle('danger')}>{tx('تعارض مع حالة قديمة', 'Legacy status mismatch')}</span>}
                        </div>
                        <h2 className="adminseed-case-title" style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 400 }}>
                          {selectedSupplier.company_name || selectedSupplier.full_name || tx('مورد بدون اسم', 'Unnamed supplier')}
                        </h2>
                        <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                          {selectedSupplier.description || tx('لا يوجد وصف للشركة حتى الآن.', 'No company description yet.')}
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={badgeStyle('default')}>{tx('الحالة الخام', 'Raw status')}: {selectedSupplier.status || '—'}</span>
                          <span style={badgeStyle('default')}>{tx('الحالة المحسومة', 'Resolved')}: {selectedSupplier.onboardingState.status}</span>
                          {selectedSupplier.maabar_supplier_id && <span style={badgeStyle('accent')}>{selectedSupplier.maabar_supplier_id}</span>}
                          {selectedSupplier.trustScore > 0 && <span style={badgeStyle('accent')}>{tx('الثقة', 'Trust')} {selectedSupplier.trustScore}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: 10 }}>
                        <div style={{ padding: '14px 16px', borderRadius: 18, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                          <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('ملخص المراجعة', 'Review summary')}</p>
                          <div style={{ display: 'grid', gap: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{tx('اكتمال الملف', 'Profile completeness')}</span><strong style={{ fontSize: 13 }}>{selectedSupplier.profileCompletion}%</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{tx('اكتمال التحقق', 'Verification completeness')}</span><strong style={{ fontSize: 13 }}>{selectedSupplier.verificationCompletion}%</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{tx('وسائط المصنع', 'Factory media')}</span><strong style={{ fontSize: 13 }}>{selectedSupplier.assets.factoryImages.length} {tx('صور', 'images')} · {selectedSupplier.assets.factoryVideos.length} {tx('فيديوهات', 'videos')}</strong></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}><span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{tx('تاريخ الإرسال', 'Submitted')}</span><strong style={{ fontSize: 13 }}>{formatDateTime(selectedSupplier.created_at, lang)}</strong></div>
                          </div>
                        </div>
                        {selectedSupplier.missingRequired.length > 0 && (
                          <div style={{ padding: '14px 16px', borderRadius: 18, border: '1px solid rgba(255, 112, 112, 0.2)', background: 'rgba(255, 112, 112, 0.08)' }}>
                            <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', color: '#ffb3b3' }}>{tx('عناصر مراجعة مطلوبة ومفقودة', 'Missing required review items')}</p>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: '#ffd4d4' }}>{getMissingRequiredLabels(selectedSupplier.missingRequired, lang).join(' · ')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="adminseed-case-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 20 }}>
                    <div style={{ display: 'grid', gap: 20 }}>
                      <SectionToggle id={`review-profile-${selectedSupplier.id}`} label={tx('ملف الشركة', 'Company profile')} defaultOpen={false}>
                        <div className="adminseed-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, paddingTop: 4 }}>
                          <InfoPair label={tx('اسم الشركة', 'Company name')} value={selectedSupplier.company_name} />
                          <InfoPair label={tx('الاسم الكامل', 'Full name')} value={selectedSupplier.full_name} />
                          <InfoPair label={tx('البريد الإلكتروني', 'Email')} value={selectedSupplier.email} href={selectedSupplier.email ? `mailto:${selectedSupplier.email}` : ''} />
                          <InfoPair label={tx('المدينة / الدولة', 'City / country')} value={[selectedSupplier.city, selectedSupplier.country].filter(Boolean).join(', ')} />
                          <InfoPair label={tx('نوع النشاط', 'Business type')} value={selectedSupplier.business_type} />
                          <InfoPair label={tx('التخصص', 'Speciality')} value={selectedSupplier.speciality} />
                          <InfoPair label={tx('موقع الشركة', 'Company website')} value={selectedSupplier.company_website} href={selectedSupplier.company_website} />
                          <InfoPair label={tx('الروابط التجارية', 'Trade links')} value={selectedSupplier.tradeLinks.join(' · ')} href={selectedSupplier.tradeLinks[0]} />
                          <InfoPair label={tx('واتساب', 'WhatsApp')} value={selectedSupplier.whatsapp} />
                          <InfoPair label={tx('ويتشات', 'WeChat')} value={selectedSupplier.wechat} />
                          <InfoPair label={tx('العنوان', 'Address')} value={selectedSupplier.company_address} />
                          <InfoPair label={tx('اللغات', 'Languages')} value={selectedSupplier.languages.join(', ')} />
                          <InfoPair label={tx('أسواق التصدير', 'Export markets')} value={selectedSupplier.exportMarkets.join(', ')} />
                          <InfoPair label={tx('سنة التأسيس', 'Year established')} value={selectedSupplier.year_established} />
                        </div>
                      </SectionToggle>

                      <SectionToggle id={`review-verification-${selectedSupplier.id}`} label={tx('إثباتات التحقق', 'Verification evidence')} defaultOpen={true}>
                        <div style={{ paddingTop: 4 }}>
                        <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('إثباتات التحقق', 'Verification evidence')}</p>
                        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                          {selectedSupplier.verificationChecks.map((item) => (
                            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '11px 12px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                              <span style={{ fontSize: 12 }}>{pickLangText(item.label, lang)}</span>
                              <span style={badgeStyle(item.present ? 'success' : 'danger')}>{item.present ? tx('موجود', 'On file') : tx('مفقود', 'Missing')}</span>
                            </div>
                          ))}
                        </div>
                        <div className="adminseed-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                          <InfoPair label={tx('رقم السجل', 'Registration number')} value={selectedSupplier.reg_number} />
                          <InfoPair label={tx('سنوات الخبرة', 'Years experience')} value={selectedSupplier.years_experience} />
                          <InfoPair label={tx('الموظفون', 'Employees')} value={selectedSupplier.num_employees} />
                        </div>
                        </div>
                      </SectionToggle>

                      <SectionToggle id={`review-media-${selectedSupplier.id}`} label={tx('وسائط المصنع والملفات', 'Factory media & files')} badge={selectedSupplier.assets.all.length} defaultOpen={false}>
                        <div style={{ paddingTop: 4 }}>
                        {selectedSupplier.assets.all.length === 0 ? (
                          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{tx('لا توجد ملفات خاصة مرفوعة بعد.', 'No private files uploaded yet.')}</p>
                        ) : (
                          <div style={{ display: 'grid', gap: 10 }}>
                            {selectedSupplier.assets.all.map((asset) => {
                              const loadingKey = `${selectedSupplier.id}:${asset.path}`;
                              return (
                                <div className="adminseed-file-row" key={asset.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: '11px 12px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                                  <div>
                                    <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600 }}>{pickLangText(asset.label, lang)}</p>
                                    <p style={{ margin: 0, fontSize: 11, color: 'var(--text-tertiary)' }}>{asset.kind === 'license' ? tx('ترخيص', 'license') : asset.kind === 'factory_image' ? tx('صورة مصنع', 'factory image') : tx('فيديو مصنع', 'factory video')}</p>
                                  </div>
                                  <ActionButton onClick={() => openSupplierAsset(selectedSupplier.id, asset)} disabled={docLoading[loadingKey]}>
                                    {docLoading[loadingKey] ? tx('جارٍ الفتح…', 'Opening…') : tx('فتح آمن', 'Open securely')}
                                  </ActionButton>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        </div>
                      </SectionToggle>
                    </div>

                    <div style={{ display: 'grid', gap: 20 }}>
                      <div style={sectionCardStyle()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                          <p style={{ margin: 0, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('مساحة قرار الأدمن', 'Admin decision workspace')}</p>
                          <span style={badgeStyle(selectedDraft?.bucket === 'escalated' ? 'danger' : selectedDraft?.bucket === 'watchlist' ? 'warning' : 'default')}>
                            {tx('التصنيف', 'Bucket')}: {bucketLabels[selectedDraft?.bucket || getAutoBucket(selectedSupplier)]}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gap: 12, marginBottom: 14 }}>
                          <select
                            value={selectedDraft?.bucket || getAutoBucket(selectedSupplier)}
                            onChange={(event) => patchDraft(selectedSupplier.id, { bucket: event.target.value })}
                            style={{ minHeight: 44, borderRadius: 14, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', padding: '0 12px' }}
                          >
                            <option value="triage" style={{ background: '#111113' }}>{bucketLabels.triage}</option>
                            <option value="urgent" style={{ background: '#111113' }}>{bucketLabels.urgent}</option>
                            <option value="ready" style={{ background: '#111113' }}>{bucketLabels.ready}</option>
                            <option value="needs_info" style={{ background: '#111113' }}>{bucketLabels.needs_info}</option>
                            <option value="watchlist" style={{ background: '#111113' }}>{bucketLabels.watchlist}</option>
                            <option value="escalated" style={{ background: '#111113' }}>{bucketLabels.escalated}</option>
                          </select>

                          <input
                            value={selectedDraft?.reason || ''}
                            onChange={(event) => patchDraft(selectedSupplier.id, { reason: event.target.value })}
                            placeholder={tx('سبب القرار (مطلوب عند طلب معلومات أو الرفض)', 'Decision reason (required for more info / reject)')}
                            style={{ minHeight: 44, borderRadius: 14, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', padding: '0 14px', outline: 'none' }}
                          />

                          <textarea
                            value={selectedDraft?.notes || ''}
                            onChange={(event) => patchDraft(selectedSupplier.id, { notes: event.target.value })}
                            rows={5}
                            placeholder={tx('ملاحظات داخلية لهذه الحالة', 'Private admin notes for this case')}
                            style={{ width: '100%', borderRadius: 16, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', padding: 14, resize: 'vertical', outline: 'none' }}
                          />
                        </div>

                        <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                          {reviewChecklist.map((item) => (
                            <ChecklistRow
                              key={item.key}
                              label={item.label}
                              checked={Boolean(selectedDraft?.checklist?.[item.key])}
                              onToggle={() => patchChecklist(selectedSupplier.id, item.key, !selectedDraft?.checklist?.[item.key])}
                              textAlign={textAlign}
                              doneLabel={tx('تم', 'Done')}
                              pendingLabel={tx('معلق', 'Pending')}
                            />
                          ))}
                        </div>

                        <div className="adminseed-action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                          <ActionButton
                            tone="success"
                            fullWidth
                            disabled={actionLoading[`${selectedSupplier.id}:approved`]}
                            onClick={() => sendDecision(selectedSupplier, 'approved')}
                          >
                            {actionLoading[`${selectedSupplier.id}:approved`] ? tx('جارٍ الاعتماد…', 'Approving…') : tx('اعتماد', 'Approve')}
                          </ActionButton>
                          <ActionButton
                            tone="warning"
                            fullWidth
                            disabled={actionLoading[`${selectedSupplier.id}:needs_info`]}
                            onClick={() => sendDecision(selectedSupplier, 'needs_info')}
                          >
                            {actionLoading[`${selectedSupplier.id}:needs_info`] ? tx('جارٍ الإرسال…', 'Sending…') : tx('طلب معلومات إضافية', 'Request more info')}
                          </ActionButton>
                          <ActionButton
                            tone="danger"
                            fullWidth
                            disabled={actionLoading[`${selectedSupplier.id}:rejected`]}
                            onClick={() => sendDecision(selectedSupplier, 'rejected')}
                          >
                            {actionLoading[`${selectedSupplier.id}:rejected`] ? tx('جارٍ الرفض…', 'Rejecting…') : tx('رفض', 'Reject')}
                          </ActionButton>
                        </div>
                      </div>

                      <div style={sectionCardStyle()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 14, flexWrap: 'wrap' }}>
                          <p style={{ margin: 0, fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('ملخص الثقة والمخاطر', 'Trust & risk snapshot')}</p>
                          <ActionButton tone="accent" onClick={() => runAiReview(selectedSupplier)} disabled={aiLoading[selectedSupplier.id]}>
                            {aiLoading[selectedSupplier.id] ? tx('جارٍ التشغيل…', 'Running…') : tx('تشغيل ملخص الذكاء الاصطناعي', 'Run AI snapshot')}
                          </ActionButton>
                        </div>

                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                          {selectedSupplier.trustSignals.length > 0
                            ? selectedSupplier.trustSignals.map((signal) => <span key={signal} style={badgeStyle('accent')}>{signal.replace(/_/g, ' ')}</span>)
                            : <span style={badgeStyle('default')}>{tx('لا توجد إشارات ثقة بعد', 'No trust signals yet')}</span>}
                        </div>

                        <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                          {selectedSupplier.profileChecks.map((item) => (
                            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', padding: '11px 12px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                              <span style={{ fontSize: 12 }}>{pickLangText(item.label, lang)}</span>
                              <span style={badgeStyle(item.present ? 'success' : 'danger')}>{item.present ? tx('موجود', 'Present') : tx('مفقود', 'Missing')}</span>
                            </div>
                          ))}
                        </div>

                        {aiResults[selectedSupplier.id] && (
                          <div style={{ padding: '14px 16px', borderRadius: 18, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10, flexWrap: 'wrap' }}>
                              <strong style={{ fontSize: 14 }}>{tx('ملخص مراجعة الذكاء الاصطناعي', 'AI review summary')}</strong>
                              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                <span style={badgeStyle(aiResults[selectedSupplier.id].recommendation === 'approve' ? 'success' : aiResults[selectedSupplier.id].recommendation === 'reject' ? 'danger' : 'warning')}>
                                  {aiResults[selectedSupplier.id].recommendation}
                                </span>
                                <span style={badgeStyle('accent')}>{tx('الدرجة', 'Score')} {aiResults[selectedSupplier.id].score}</span>
                                <span style={badgeStyle('default')}>{aiResults[selectedSupplier.id].confidence || tx('غير متاح', 'n/a')} {tx('ثقة', 'confidence')}</span>
                              </div>
                            </div>
                            <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                              {aiResults[selectedSupplier.id].summary}
                            </p>
                            <div className="adminseed-ai-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7bc091' }}>{tx('الإيجابيات', 'Positives')}</p>
                                {(aiResults[selectedSupplier.id].positives || []).map((item) => <p key={item} style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-secondary)' }}>• {item}</p>)}
                              </div>
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#f0bc75' }}>{tx('المخاوف', 'Concerns')}</p>
                                {(aiResults[selectedSupplier.id].concerns || []).map((item) => <p key={item} style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-secondary)' }}>• {item}</p>)}
                              </div>
                              <div>
                                <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#ffb3b3' }}>{tx('الأدلة الناقصة', 'Missing evidence')}</p>
                                {(aiResults[selectedSupplier.id].missing_evidence || []).map((item) => <p key={item} style={{ margin: '0 0 6px', fontSize: 12, color: 'var(--text-secondary)' }}>• {item}</p>)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div style={sectionCardStyle()}>
                        <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('جاهزية التحويل', 'Payout readiness')}</p>
                        <div style={{ display: 'grid', gap: 10 }}>
                          {selectedSupplier.payoutChecks.map((item) => (
                            <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: '11px 12px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                              <span style={{ fontSize: 12 }}>{pickLangText(item.label, lang)}</span>
                              <span style={badgeStyle(item.present ? 'success' : 'default')}>{item.present ? tx('جاهز', 'Ready') : tx('ليس بعد', 'Not yet')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'seed' && (
          <div className="adminseed-two-col" style={{ display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 20 }}>
            <div style={sectionCardStyle()}>
              <p style={{ margin: '0 0 8px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('أدوات البيانات التجريبية', 'Seed tooling')}</p>
              <h2 style={{ margin: '0 0 10px', fontSize: 26, fontWeight: 400 }}>{tx('تم فصلها عن مراجعة الموردين', 'Kept separate from supplier review')}</h2>
              <p style={{ margin: '0 0 16px', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                {tx('إجراءات البيانات التجريبية ما زالت متاحة، لكنها معزولة حتى لا تختلط مراجعة الأدمن مع أوامر الذكاء الاصطناعي وعمليات الاختبار.', 'Seed actions are still available, but isolated so admin review work is not mixed with AI helper prompts and test data operations.')}
              </p>

              <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
                <input
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  onKeyDown={(event) => { if (event.key === 'Enter') executeSeedCommand(); }}
                  placeholder={tx('مثال: أضف 5 طلبات أثاث مكتبي', 'Example: add 5 office furniture requests')}
                  style={{ minHeight: 46, borderRadius: 14, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', padding: '0 14px', outline: 'none' }}
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    tx('أضف 5 طلبات توريد متنوعة', 'Add 5 mixed sourcing requests'),
                    tx('أضف 3 منتجات إلكترونية', 'Add 3 electronics products'),
                    tx('أغلق 3 طلبات قديمة', 'Close 3 old requests'),
                    tx('أضف 5 طلبات أثاث', 'Add 5 furniture requests'),
                  ].map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="adminseed-pill-button"
                      onClick={() => setCommand(item)}
                      style={{ minHeight: 34, padding: '0 12px', borderRadius: 999, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11 }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <ActionButton tone="accent" onClick={executeSeedCommand} disabled={seedLoading}>
                  {seedLoading ? tx('جارٍ التشغيل…', 'Running…') : tx('تنفيذ أمر البذور', 'Execute seed command')}
                </ActionButton>
              </div>
            </div>

            <div style={sectionCardStyle()}>
              <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{tx('سجل نشاط الأدمن', 'Admin activity log')}</p>
              <div style={{ maxHeight: 420, overflowY: 'auto', display: 'grid', gap: 8 }}>
                {log.length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{tx('لا توجد إجراءات إدارية بعد في هذه الجلسة.', 'No admin actions yet in this session.')}</p>
                ) : log.map((entry, index) => (
                  <div key={`${entry}-${index}`} style={{ padding: '11px 12px', borderRadius: 14, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', fontSize: 12, lineHeight: 1.7 }}>
                    {entry}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .adminseed-page {
          --adminseed-card-padding: 22px;
          --adminseed-card-radius: 24px;
          --adminseed-hero-padding: 28px;
          --adminseed-badge-gap: 6px;
          --adminseed-badge-padding: 6px 10px;
          --adminseed-badge-radius: 999px;
          --adminseed-badge-font-size: 11px;
          --adminseed-badge-line-height: 1;
          --adminseed-action-height: 42px;
          --adminseed-action-padding: 0 14px;
          --adminseed-action-radius: 14px;
          --adminseed-action-font-size: 12px;
          --adminseed-tab-height: 42px;
          --adminseed-tab-padding: 0 16px;
          --adminseed-tab-radius: 14px;
          --adminseed-stat-radius: 24px;
          --adminseed-stat-padding: 20px 18px;
          --adminseed-stat-value-size: 30px;
          --adminseed-info-padding: 12px 14px;
          --adminseed-info-radius: 16px;
          --adminseed-checklist-gap: 12px;
          --adminseed-checklist-padding: 11px 12px;
          --adminseed-checklist-radius: 14px;
          --adminseed-checklist-font-size: 12px;
          --adminseed-checklist-line-height: 1.6;
          --adminseed-input-height: 44px;
          --adminseed-input-radius: 14px;
          --adminseed-input-padding-x: 14px;
          --adminseed-mobile-section-gap: 20px;
          --adminseed-mobile-inline-gap: 12px;
        }

        @media (max-width: 1280px) {
          .adminseed-review-layout,
          .adminseed-two-col,
          .adminseed-case-grid,
          .adminseed-case-header {
            grid-template-columns: 1fr !important;
          }
        }

        @media (max-width: 1100px) {
          .adminseed-metrics,
          .adminseed-ai-grid,
          .adminseed-info-grid {
            grid-template-columns: 1fr 1fr !important;
          }
        }

        @media (max-width: 900px) {
          .adminseed-page {
            --adminseed-card-padding: 18px;
            --adminseed-card-radius: 20px;
            --adminseed-hero-padding: 22px;
            --adminseed-badge-gap: 5px;
            --adminseed-badge-padding: 5px 9px;
            --adminseed-action-height: 40px;
            --adminseed-action-padding: 0 12px;
            --adminseed-action-radius: 13px;
            --adminseed-tab-height: 40px;
            --adminseed-tab-padding: 0 14px;
            --adminseed-tab-radius: 13px;
            --adminseed-stat-radius: 20px;
            --adminseed-stat-padding: 18px 16px;
            --adminseed-stat-value-size: 27px;
            --adminseed-info-padding: 11px 12px;
            --adminseed-info-radius: 15px;
            --adminseed-checklist-gap: 10px;
            --adminseed-checklist-padding: 10px 11px;
            --adminseed-checklist-radius: 13px;
            --adminseed-input-height: 42px;
            --adminseed-input-radius: 13px;
            --adminseed-input-padding-x: 12px;
            --adminseed-mobile-section-gap: 16px;
            --adminseed-mobile-inline-gap: 10px;
          }

          .adminseed-shell {
            padding: 84px 16px 32px !important;
          }

          .adminseed-hero-title {
            font-size: 30px !important;
          }

          .adminseed-review-layout,
          .adminseed-two-col,
          .adminseed-case-grid,
          .adminseed-case-header,
          .adminseed-metrics,
          .adminseed-ai-grid,
          .adminseed-info-grid,
          .adminseed-action-grid {
            gap: var(--adminseed-mobile-section-gap) !important;
          }

          .adminseed-page input:not([type='checkbox']):not([type='radio']),
          .adminseed-page select {
            min-height: var(--adminseed-input-height) !important;
            border-radius: var(--adminseed-input-radius) !important;
            padding: 0 var(--adminseed-input-padding-x) !important;
            font-size: 13px !important;
          }

          .adminseed-page textarea {
            border-radius: var(--adminseed-input-radius) !important;
            padding: 12px var(--adminseed-input-padding-x) !important;
            font-size: 13px !important;
          }

          .adminseed-tab-button,
          .adminseed-pill-button,
          .adminseed-quick-case,
          .adminseed-queue-item,
          .adminseed-file-row {
            border-radius: 16px !important;
          }

          .adminseed-quick-case,
          .adminseed-queue-item {
            padding: 12px !important;
          }

          .adminseed-pill-button {
            min-height: 32px !important;
            padding: 0 11px !important;
            font-size: 10px !important;
          }

          .adminseed-queue-list {
            max-height: none !important;
            padding-right: 0 !important;
            gap: 8px !important;
          }

          .adminseed-action-grid {
            grid-template-columns: 1fr !important;
          }

          .adminseed-file-row {
            flex-direction: column;
            align-items: stretch !important;
            gap: 8px !important;
          }
        }

        @media (max-width: 720px) {
          .adminseed-page {
            --adminseed-card-padding: 15px;
            --adminseed-card-radius: 18px;
            --adminseed-hero-padding: 18px;
            --adminseed-badge-gap: 4px;
            --adminseed-badge-padding: 4px 8px;
            --adminseed-badge-font-size: 10px;
            --adminseed-action-height: 38px;
            --adminseed-action-padding: 0 11px;
            --adminseed-action-radius: 12px;
            --adminseed-action-font-size: 11px;
            --adminseed-tab-height: 38px;
            --adminseed-tab-padding: 0 12px;
            --adminseed-tab-radius: 12px;
            --adminseed-stat-radius: 18px;
            --adminseed-stat-padding: 16px 14px;
            --adminseed-stat-value-size: 24px;
            --adminseed-info-padding: 10px 11px;
            --adminseed-info-radius: 14px;
            --adminseed-checklist-gap: 8px;
            --adminseed-checklist-padding: 10px 11px;
            --adminseed-checklist-radius: 12px;
            --adminseed-checklist-font-size: 11px;
            --adminseed-checklist-line-height: 1.5;
            --adminseed-input-height: 40px;
            --adminseed-input-radius: 12px;
            --adminseed-input-padding-x: 11px;
            --adminseed-mobile-section-gap: 12px;
            --adminseed-mobile-inline-gap: 8px;
          }

          .adminseed-metrics,
          .adminseed-ai-grid,
          .adminseed-info-grid {
            grid-template-columns: 1fr !important;
          }

          .adminseed-shell {
            padding: 74px 12px 24px !important;
          }

          .adminseed-hero-title,
          .adminseed-case-title {
            font-size: 24px !important;
            line-height: 1.15 !important;
          }

          .adminseed-stat-card-value {
            margin-bottom: 6px !important;
          }

          .adminseed-tab-button {
            font-size: 11px !important;
          }

          .adminseed-quick-case,
          .adminseed-queue-item {
            padding: 10px 11px !important;
          }
        }
      `}</style>
    </div>
  );
}
