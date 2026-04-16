import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb, SUPABASE_URL } from '../supabase';
import Footer from '../components/Footer';
import ManagedSupplierMatchesPanel from '../components/ManagedSupplierMatchesPanel';
import { getManagedMatchGroup, isManagedRequest } from '../lib/managedSourcing';
import { DISPLAY_CURRENCIES } from '../lib/displayCurrency';
import {
  PRODUCT_GALLERY_LIMIT,
  getProductGalleryImages,
  getPrimaryProductImage,
  normalizeProductDraftMedia,
} from '../lib/productMedia';
import { T, CATEGORIES, OFFER_STATUS } from '../lib/supplierDashboardConstants';
import {
  VERIFICATION_IMAGE_LIMIT,
  VERIFICATION_VIDEO_LIMIT,
  VERIFICATION_VIDEO_MAX_BYTES,
  getCompanyDescription,
  normalizeProfileList,
  serializeProfileList,
  getProfileReadiness,
  buildSupplierJourneySteps,
  normalizeVerificationMedia,
  buildSettingsState,
  buildVerificationState,
  buildPayoutState,
  normalizeTextInput,
  normalizeOptionalNumber,
  normalizeOptionalInteger,
  stripEmptyFields,
  buildSettingsPayload,
  buildPayoutPayload,
  hasPersistedSupplierSettings,
  hasPersistedSupplierPayout,
  buildSettingsSaveFeedback,
  buildPayoutSaveFeedback,
  getSupplierVerificationDraftKey,
  getSupplierDashboardUiStateKey,
  getVerificationProgressState,
  formatDraftSavedAt,
} from '../lib/supplierFormHelpers';
import {
  SkeletonCard,
  StatCard,
  QuickAction,
  BackBtn,
  SaveFeedbackCard,
  SupplierJourneyStepper,
} from '../components/supplier/DashboardPrimitives';
import {
  VF_C,
  VF_CSS,
  VfChk,
  VfReviewDot,
  VfField,
  VfSep,
  VfG2,
  VfDotStepper,
  VfProgressBar,
  VfStepBadges,
} from '../components/supplier/VerificationFormUI';
import {
  emptyProduct,
  PRODUCT_OPTIONAL_DB_FIELDS,
  buildProductWritePayload,
  getProductComposerValidationMessage,
  getProductFormPlaceholders,
  getProductCompletenessItems,
  ProductForm,
  ProductPreviewPanel,
} from '../components/supplier/ProductComposer';
import { runWithOptionalColumns } from '../lib/supabaseColumnFallback';
import { buildTranslatedProductFields, translateTextToAllLanguages } from '../lib/requestTranslation';
import {
  getOfferEstimatedTotal,
  getOfferProductSubtotal,
  getOfferShippingCost,
  getOfferShippingMethod,
  hasOfferShippingCost,
} from '../lib/offerPricing';
import {
  getSupplierMaabarId,
  getSupplierOnboardingState,
  getSupplierStageLabel,
  normalizeSupplierDocStoragePath,
} from '../lib/supplierOnboarding';
import { attachDirectoryProfiles } from '../lib/profileVisibility';
import {
  fetchProductInquiryThreads,
  getProductInquiryProductName,
  getProductInquiryStatusLabel,
} from '../lib/productInquiry';

// Function لترجمة الاستفسارات
const translateInquiryText = async (text, sourceLang, targetLang) => {
  if (!text || sourceLang === targetLang) return text;
  
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/maabar-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        task: 'chat_translation',
        payload: {
          text,
          sourceLanguage: sourceLang,
          targetLanguage: targetLang,
          conversationRole: 'product_inquiry',
        },
      }),
    });
    
    if (!response.ok) {
      console.error('Translation API error:', await response.text());
      return text; // نرجع النص الأصلي إذا فشلت الترجمة
    }
    
    const data = await response.json();
    return data.translatedText || text;
  } catch (error) {
    console.error('Translation error:', error);
    return text; // نرجع النص الأصلي إذا فشلت الترجمة
  }
};

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const STORAGE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/product-images/';

// جلب سعر الصرف USD → SAR
const getUsdToCny = async () => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    return data?.rates?.CNY || 7.25;
  } catch {
    return 7.25;
  }
};
const getUsdToSar = async () => {
  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    return data?.rates?.SAR || 3.75;
  } catch {
    return 3.75; // fallback ثابت
  }
};

export default function DashboardSupplier({ user, profile, lang, displayCurrency, setDisplayCurrency, setProfile }) {
  const nav      = useNavigate();
  const location = useLocation();
  const t        = T[lang] || T.zh;
  const cats     = CATEGORIES[lang] || CATEGORIES.zh;
  const isAr     = lang === 'ar';
  const verificationDraftKey = user?.id ? getSupplierVerificationDraftKey(user.id) : '';
  const dashboardUiStateKey = user?.id ? getSupplierDashboardUiStateKey(user.id) : '';

  const [stats, setStats]                   = useState({ products: 0, offers: 0, messages: 0, productInquiries: 0 });
  const [myOffers, setMyOffers]             = useState([]);
  const [myProducts, setMyProducts]         = useState([]);
  const [inbox, setInbox]                   = useState([]);
  const [productInquiries, setProductInquiries] = useState([]);
  const [inquiryReplies, setInquiryReplies] = useState({});
  const [replyingInquiryId, setReplyingInquiryId] = useState(null);
  const [translatedInquiries, setTranslatedInquiries] = useState({}); // لتخزين الاستفسارات المترجمة
  const [requests, setRequests]             = useState([]);
  const [managedMatches, setManagedMatches] = useState([]);
  const [managedMatchGroup, setManagedMatchGroup] = useState('new');
  const [managedOfferForms, setManagedOfferForms] = useState({});
  const [managedOfferDrafts, setManagedOfferDrafts] = useState({});
  const [activeTab, setActiveTab]           = useState('overview');
  const [activeCat, setActiveCat]           = useState('all');
  const [activeBottomTab, setActiveBottomTab] = useState('home');
  const [moreMenuOpen, setMoreMenuOpen]     = useState(false);
  const [requestStatusFilter, setRequestStatusFilter] = useState('all');
  const [productStatusFilter, setProductStatusFilter] = useState('all');
  const [messageFilter, setMessageFilter]   = useState('all');
  const [loadingOffers, setLoadingOffers]   = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [shippingCompany, setShippingCompany] = useState('DHL');
  const [product, setProduct]               = useState(emptyProduct);
  const [usdRate, setUsdRate]               = useState(3.75);
  useEffect(() => { getUsdToSar().then(r => setUsdRate(r)); }, []);
  const [cnyRate, setCnyRate] = useState(7.25);
  useEffect(() => { getUsdToCny().then(r => setCnyRate(r)); }, []);
  const [editingProduct, setEditingProduct] = useState(null);
  const [saving, setSaving]                 = useState(false);
  const [pendingTracking, setPendingTracking] = useState([]);
  const [rejectedOffers, setRejectedOffers] = useState([]);
  const [completedPayments, setCompletedPayments] = useState(new Set());
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [offerForms, setOfferForms]         = useState({});
  const [offers, setOffers]                 = useState({});
  const [submittingOfferId, setSubmittingOfferId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const [settings, setSettings] = useState(() => buildSettingsState(profile || {}, displayCurrency || 'USD'));
  const [verification, setVerification] = useState(() => buildVerificationState(profile || {}));
  const [payout, setPayout] = useState(() => buildPayoutState(profile || {}));
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSavedAt, setSettingsSavedAt] = useState('');
  const [settingsError, setSettingsError] = useState('');
  const [savingVerification, setSavingVerification] = useState(false);
  const [verificationSaved, setVerificationSaved] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState('');
  const [uploadingVerificationDoc, setUploadingVerificationDoc] = useState({ license: false, images: false, videos: false });
  const [verificationStep, _setVerificationStep] = useState(1);
  const setVerificationStep = (step) => {
    console.log('setVerificationStep called with:', step);
    console.trace();
    _setVerificationStep(step);
  };
  const [draftSavedAt, setDraftSavedAt] = useState('');
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutSavedAt, setPayoutSavedAt] = useState('');
  const [payoutError, setPayoutError] = useState('');
  const [productSaveMsg, setProductSaveMsg] = useState('');
  const [productComposerStep, setProductComposerStep] = useState('edit');
  const [editProductComposerStep, setEditProductComposerStep] = useState('edit');
  const [editOfferModal, setEditOfferModal]   = useState(null);
  const [editOfferForm, setEditOfferForm]     = useState({});
  const [savingEditOffer, setSavingEditOffer] = useState(false);
  const [uploadingLogo, setUploadingLogo]   = useState(false);
  const [uploadingFactory, setUploadingFactory] = useState(false);
  const [samples, setSamples] = useState([]);
  const [myReviews, setMyReviews] = useState([]);
  const [showVfSuccess, setShowVfSuccess] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');
  const [settingsMsgType, setSettingsMsgType] = useState('success');
  const verificationImages = normalizeVerificationMedia(verification.factory_images).slice(0, VERIFICATION_IMAGE_LIMIT);
  const verificationVideos = normalizeVerificationMedia(verification.factory_videos).slice(0, VERIFICATION_VIDEO_LIMIT);
  const verificationProgress = getVerificationProgressState({ settings, verification, verificationImages });
  // Compute stage/lock status from the DB profile only — NOT from local form state.
  // Merging local settings/verification into this call was causing the form to auto-lock
  // (show "under review") as soon as the supplier filled in the required fields locally,
  // because getSupplierResolvedStatus would see status='verification_under_review' (DB) +
  // isVerificationComplete=true (local form) and resolve to the locked stage before anything
  // was submitted. Stage transitions must only happen when the DB changes.
  const supplierState = getSupplierOnboardingState(profile || {}, user);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) {
      setActiveTab(tab);
      return;
    }
    // Application-stage and under-review suppliers are never taken off the
    // verification tab by a stale sessionStorage entry. The save effect
    // deliberately skips writing for these stages, so any stored value is
    // from a prior session and should be ignored.
    if (!dashboardUiStateKey) return;
    if (supplierState.isApplicationStage || supplierState.isUnderReviewStage) return;

    const rawUiState = sessionStorage.getItem(dashboardUiStateKey);
    if (!rawUiState) return;

    try {
      const parsed = JSON.parse(rawUiState);
      if (parsed?.activeTab) setActiveTab(parsed.activeTab);
    } catch {
      sessionStorage.removeItem(dashboardUiStateKey);
    }
  }, [location.search, dashboardUiStateKey, supplierState.isApplicationStage, supplierState.isUnderReviewStage]); // eslint-disable-line react-hooks/exhaustive-deps

  const profileReadiness = getProfileReadiness(settings);
  const isProfileReadyForVerification = profileReadiness.isReadyForVerification;
  const supplierJourneySteps = buildSupplierJourneySteps({ supplierState, profileReadiness, lang });
  const companyDescription = getCompanyDescription(settings);
  const settingsPayload = buildSettingsPayload(settings, companyDescription);
  const savedSettingsPayload = buildSettingsPayload(buildSettingsState(profile || {}, displayCurrency || 'USD'), getCompanyDescription(profile || {}));
  const isSettingsDirty = JSON.stringify(settingsPayload) !== JSON.stringify(savedSettingsPayload);
  const payoutPayload = buildPayoutPayload(payout);
  const savedPayoutPayload = buildPayoutPayload(buildPayoutState(profile || {}));
  const isPayoutDirty = JSON.stringify(payoutPayload) !== JSON.stringify(savedPayoutPayload);
  const hasSavedSettingsRecord = Boolean(settingsSavedAt) || hasPersistedSupplierSettings(profile || {});
  const hasSavedPayoutRecord = Boolean(payoutSavedAt) || hasPersistedSupplierPayout(profile || {});
  const resolvedSettingsSavedAt = settingsSavedAt || profile?.updated_at || profile?.created_at || '';
  const resolvedPayoutSavedAt = payoutSavedAt || profile?.updated_at || profile?.created_at || '';
  const settingsFeedback = buildSettingsSaveFeedback({
    lang,
    status: savingSettings ? 'saving' : (settingsError ? 'error' : (isSettingsDirty ? 'dirty' : (hasSavedSettingsRecord ? 'saved' : 'idle'))),
    savedAt: resolvedSettingsSavedAt,
    errorMessage: settingsError,
  });
  const payoutFeedback = buildPayoutSaveFeedback({
    lang,
    status: savingPayout ? 'saving' : (payoutError ? 'error' : (isPayoutDirty ? 'dirty' : (hasSavedPayoutRecord ? 'saved' : 'idle'))),
    savedAt: resolvedPayoutSavedAt,
    errorMessage: payoutError,
  });
  const needsVerification = !supplierState.isApprovedStage && !supplierState.isUnderReviewStage && !supplierState.isVerificationComplete;
  const needsPayoutSetup = supplierState.isApprovedStage && !supplierState.isPayoutComplete;
  const isOnboardingLimited = !supplierState.canAccessOperationalFeatures;
  const isVerificationLocked = supplierState.isUnderReviewStage || supplierState.isApprovedStage;
  const verificationLockMessage = 'Complete verification to unlock the full supplier experience on Maabar';
  const verificationDraftSavedLabel = draftSavedAt ? formatDraftSavedAt(draftSavedAt, lang) : '';
  const verificationStepLabels = [
    isAr ? 'بيانات الشركة' : lang === 'zh' ? '公司资料' : 'Company profile',
    isAr ? 'ملفات التحقق' : lang === 'zh' ? '认证文件' : 'Verification files',
    isAr ? 'المراجعة النهائية' : lang === 'zh' ? '最终确认' : 'Final review',
  ];
  const maxAccessibleVerificationStep = isVerificationLocked ? 3 : verificationProgress.maxReachableStep;
  const tabs = useMemo(() => [
    { id: 'overview',     label: t.overview },
    { id: 'verification', label: t.verificationTab, badge: needsVerification ? '!' : null },
    { id: 'payout',       label: t.payoutTab, badge: needsPayoutSetup ? '!' : null },
    { id: 'managed-matches', label: isAr ? 'الطلبات المطابقة لك' : lang === 'zh' ? '匹配给您的需求' : 'Matched requests for you' },
    { id: 'requests',     label: isAr ? 'الطلبات المفتوحة' : lang === 'zh' ? '开放需求' : 'Open requests' },
    { id: 'my-products',  label: t.myProducts },
    { id: 'offers',       label: t.offers },
    { id: 'add-product',  label: t.addProduct },
    { id: 'samples',      label: isAr ? 'العينات' : lang === 'zh' ? '样品' : 'Samples', badge: stats.pendingSamples > 0 ? stats.pendingSamples : null },
    { id: 'product-inquiries', label: isAr ? 'استفسارات المنتجات' : lang === 'zh' ? '产品咨询' : 'Product Inquiries', badge: stats.productInquiries > 0 ? stats.productInquiries : null },
    { id: 'reviews',      label: isAr ? 'تقييماتي' : lang === 'zh' ? '评价' : 'Reviews' },
    { id: 'messages',     label: t.messages, badge: stats.messages > 0 ? stats.messages : null },
    { id: 'settings',     label: t.settings },
  ], [lang, t, needsVerification, needsPayoutSetup, stats.pendingSamples, stats.productInquiries, stats.messages, isAr]); // eslint-disable-line react-hooks/exhaustive-deps
  const lockedTabIds = isOnboardingLimited
    ? tabs.filter((tab) => !supplierState.limitedTabs.includes(tab.id)).map((tab) => tab.id)
    : [];
  const isRestrictedSupplierTab = lockedTabIds.includes(activeTab);

  const imageRef = useRef(null); const videoRef = useRef(null);
  const editImageRef = useRef(null); const editVideoRef = useRef(null);
  const logoRef = useRef(null); const factoryRef = useRef(null);
  const saveDraftFirstRunRef = useRef(true);
  const draftSaveTimerRef = useRef(null);
  const profileInitRef = useRef(null);
  const verificationTextDebounceRef = useRef(null);
  const verificationTextFirstRunRef = useRef(true);
  const verificationJustSavedRef = useRef(false);

  useEffect(() => {
    if (!user) { nav('/login/supplier'); return; }
    loadStats(); loadPendingTracking(); loadRejectedOffers();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const knownTabs = tabs.map((tab) => tab.id);
    if (!knownTabs.includes(activeTab)) {
      setActiveTab(supplierState.isApplicationStage ? 'verification' : 'overview');
    }
  }, [activeTab, supplierState.isApplicationStage, tabs]);

  // Keep bottom nav in sync when activeTab is set programmatically
  useEffect(() => {
    if (['overview'].includes(activeTab)) setActiveBottomTab('home');
    else if (['requests', 'managed-matches'].includes(activeTab)) setActiveBottomTab('requests');
    else if (['my-products', 'add-product'].includes(activeTab)) setActiveBottomTab('products');
    else if (['messages'].includes(activeTab)) setActiveBottomTab('messages');
  }, [activeTab]);

  useEffect(() => {
    if (!dashboardUiStateKey) return;
    if (!supplierState.isApplicationStage && !supplierState.isUnderReviewStage) {
      sessionStorage.setItem(dashboardUiStateKey, JSON.stringify({ activeTab }));
    }
  }, [dashboardUiStateKey, activeTab, supplierState.isApplicationStage, supplierState.isUnderReviewStage]);

  useEffect(() => {
    const requestedTab = new URLSearchParams(location.search).get('tab');
    if (!supplierState.isApprovedStage || activeTab !== 'verification') return;

    if (requestedTab === 'verification') {
      nav('/dashboard', { replace: true });
      return;
    }

    setActiveTab('overview');
  }, [supplierState.isApprovedStage, activeTab, location.search, nav]);

  useEffect(() => {
    if (!user || isRestrictedSupplierTab) return;
    if (activeTab === 'offers')       loadMyOffers();
    if (activeTab === 'messages')     loadInbox();
    if (activeTab === 'my-products')  loadMyProducts();
    if (activeTab === 'managed-matches') loadManagedMatches();
    if (activeTab === 'samples')      loadSamples();
    if (activeTab === 'product-inquiries') loadProductInquiries();
    if (activeTab === 'reviews')      loadMyReviews();
    if (activeTab === 'add-product')  {
      setEditingProduct(null);
      setProductComposerStep('edit');
      setEditProductComposerStep('edit');
      const draft = sessionStorage.getItem('maabar_product_draft');
      if (draft) {
        try { setProduct(normalizeProductDraftMedia(JSON.parse(draft))); } catch { setProduct(emptyProduct); }
      } else {
        setProduct(emptyProduct);
      }
    }
  }, [activeTab, isRestrictedSupplierTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!profile) return;
    const hasDraft = verificationDraftKey ? Boolean(sessionStorage.getItem(verificationDraftKey)) : false;
    const next = displayCurrency || 'USD';
    if (profileInitRef.current === profile.id) {
      setSettings(prev => prev.preferred_display_currency === next ? prev : { ...prev, preferred_display_currency: next });
      return;
    }
    profileInitRef.current = profile.id;
    setSettings(buildSettingsState(profile, next));
    setVerification(buildVerificationState(profile));
    setPayout(buildPayoutState(profile));
  }, [profile, displayCurrency, verificationDraftKey]);

  useEffect(() => {
    if (!verificationDraftKey) return;

    const rawDraft = sessionStorage.getItem(verificationDraftKey);
    if (!rawDraft) {
      setVerificationStep(1);
      setDraftSavedAt('');
      return;
    }

    try {
      const parsed = JSON.parse(rawDraft);
      if (parsed?.settings) {
        setSettings((prev) => ({ ...prev, ...parsed.settings }));
      }
      if (parsed?.verification) {
        setVerification((prev) => ({
          ...prev,
          ...parsed.verification,
          factory_images: normalizeVerificationMedia(parsed.verification.factory_images ?? prev.factory_images).slice(0, VERIFICATION_IMAGE_LIMIT),
          factory_videos: normalizeVerificationMedia(parsed.verification.factory_videos ?? prev.factory_videos).slice(0, VERIFICATION_VIDEO_LIMIT),
        }));
      }
      setVerificationStep(Math.min(3, Math.max(1, Number(parsed?.step) || 1)));
      setDraftSavedAt(parsed?.savedAt || '');
    } catch {
      sessionStorage.removeItem(verificationDraftKey);
    }
  }, [verificationDraftKey]);

  useEffect(() => {
    if (saveDraftFirstRunRef.current) {
      saveDraftFirstRunRef.current = false;
      return;
    }
    if (!verificationDraftKey || isVerificationLocked) return;
    clearTimeout(draftSaveTimerRef.current);
    draftSaveTimerRef.current = setTimeout(() => {
      const savedAt = new Date().toISOString();
      sessionStorage.setItem(verificationDraftKey, JSON.stringify({
        settings,
        verification: stripEmptyFields({
          ...verification,
          factory_images: normalizeVerificationMedia(verification.factory_images).slice(0, VERIFICATION_IMAGE_LIMIT),
          factory_videos: normalizeVerificationMedia(verification.factory_videos).slice(0, VERIFICATION_VIDEO_LIMIT),
        }),
        step: verificationStep,
        savedAt,
      }));
      setDraftSavedAt(savedAt);
    }, 0);
    return () => clearTimeout(draftSaveTimerRef.current);
  }, [verificationDraftKey, settings, verification, verificationStep, isVerificationLocked]);

  useEffect(() => {
    if (verificationTextFirstRunRef.current) {
      verificationTextFirstRunRef.current = false;
      return;
    }
    if (verificationJustSavedRef.current) {
      verificationJustSavedRef.current = false;
      return;
    }
    if (!user || isVerificationLocked) return;
    clearTimeout(verificationTextDebounceRef.current);
    verificationTextDebounceRef.current = setTimeout(async () => {
      const reg_number = normalizeTextInput(verification.reg_number);
      const years_experience = normalizeOptionalInteger(verification.years_experience);
      const num_employees = normalizeOptionalInteger(verification.num_employees);
      const debouncePayload = stripEmptyFields({ reg_number, years_experience, num_employees });
      if (Object.keys(debouncePayload).length === 0) return;
      await sb.from('profiles').update(debouncePayload).eq('id', user.id);
      setProfile?.(prev => ({ ...(prev || {}), ...debouncePayload }));
    }, 800);
    return () => clearTimeout(verificationTextDebounceRef.current);
  }, [verification.reg_number, verification.years_experience, verification.num_employees]); // eslint-disable-line react-hooks/exhaustive-deps



  // Save product form draft to sessionStorage on every change
  useEffect(() => {
    if (activeTab === 'add-product' && !editingProduct) {
      sessionStorage.setItem('maabar_product_draft', JSON.stringify(normalizeProductDraftMedia(product)));
    }
  }, [product, activeTab, editingProduct]);

  useEffect(() => { if (activeTab === 'requests') loadRequests(); }, [activeTab, activeCat]);

  const loadStats = async () => {
    const [products, offersData, messages, acceptedOffers, payments, openProductInquiries, managedMatches, samplesResult] = await Promise.all([
      sb.from('products').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('is_active', true),
      sb.from('offers').select('id', { count: 'exact' }).eq('supplier_id', user.id),
      sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
      sb.from('offers').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('status', 'accepted'),
      sb.from('payments').select('amount').eq('supplier_id', user.id).eq('status', 'first_paid'),
      sb.from('product_inquiries').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('status', 'open'),
      sb.from('managed_supplier_matches').select('id', { count: 'exact', head: true }).eq('supplier_id', user.id).in('status', ['new', 'viewed', 'quoted', 'under_review']),
      sb.from('samples').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('status', 'pending'),
    ]);
    const totalSales = (payments.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    const matchingRequests = managedMatches.count || 0;
    const pendingSamples = samplesResult.count;
    setStats({
      products: products.count || 0,
      offers: offersData.count || 0,
      messages: messages.count || 0,
      productInquiries: openProductInquiries.count || 0,
      acceptedOffers: acceptedOffers.count || 0,
      totalSales: Math.round(totalSales),
      matchingRequests,
      pendingSamples: pendingSamples || 0,
    });
  };

  const loadSamples = async () => {
    const { data } = await sb.from('samples').select('*,products(name_ar,name_en,name_zh)').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setSamples(await attachDirectoryProfiles(sb, data, 'buyer_id', 'profiles'));
  };

  const loadProductInquiries = async () => {
    try {
      const data = await fetchProductInquiryThreads(sb, { supplierId: user.id });
      const inquiriesWithProfiles = await attachDirectoryProfiles(sb, data, 'buyer_id', 'profiles');
      setProductInquiries(inquiriesWithProfiles);
      
      // نترجم الاستفسارات إذا لغة المورد مختلفة عن لغة النص
      if (inquiriesWithProfiles.length > 0) {
        const translations = {};
        for (const inquiry of inquiriesWithProfiles) {
          if (inquiry.question_text) {
            // نحاول نكتشف لغة النص (بسيط - نتحقق من وجود حروف عربية/صينية)
            const hasArabic = /[\u0600-\u06FF]/.test(inquiry.question_text);
            const hasChinese = /[\u4e00-\u9fff]/.test(inquiry.question_text);
            
            let sourceLang = 'en'; // default
            if (hasArabic) sourceLang = 'ar';
            else if (hasChinese) sourceLang = 'zh';
            
            // نترجم فقط إذا لغة المصدر مختلفة عن لغة المورد
            if (sourceLang !== lang) {
              const translated = await translateInquiryText(
                inquiry.question_text, 
                sourceLang,
                lang
              );
              translations[inquiry.id] = translated;
            }
          }
        }
        setTranslatedInquiries(translations);
      }
    } catch (error) {
      console.error('load product inquiries error:', error);
      setProductInquiries([]);
    }
  };

  const submitInquiryReply = async (inquiry) => {
    const message = String(inquiryReplies[inquiry.id] || '').trim();
    if (!message) {
      alert(isAr ? 'اكتب رد المورد أولاً' : lang === 'zh' ? '请先填写回复内容' : 'Please write the supplier reply first');
      return;
    }

    setReplyingInquiryId(inquiry.id);
    const { error } = await sb.from('product_inquiry_replies').insert({
      inquiry_id: inquiry.id,
      sender_id: user.id,
      receiver_id: inquiry.buyer_id,
      message,
    });

    if (error) {
      console.error('submit inquiry reply error:', error);
      setReplyingInquiryId(null);
      alert(isAr ? 'تعذر إرسال الرد الآن' : lang === 'zh' ? '暂时无法发送回复' : 'Unable to send the reply right now');
      return;
    }

    await sb.from('notifications').insert({
      user_id: inquiry.buyer_id,
      type: 'product_inquiry_reply',
      title_ar: `رد المورد على استفسارك عن ${inquiry.products?.name_ar || inquiry.products?.name_en || inquiry.products?.name_zh || 'المنتج'}`,
      title_en: `Supplier replied about ${inquiry.products?.name_en || inquiry.products?.name_ar || inquiry.products?.name_zh || 'the product'}`,
      title_zh: `供应商已回复您关于 ${inquiry.products?.name_zh || inquiry.products?.name_en || inquiry.products?.name_ar || '该产品'} 的咨询`,
      ref_id: inquiry.id,
      is_read: false,
    });

    try {
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'product_inquiry_reply',
          data: {
            recipientUserId: inquiry.buyer_id,
            inquiryId: inquiry.id,
            productName: inquiry.products?.name_ar || inquiry.products?.name_en || inquiry.products?.name_zh || 'Product',
            supplierName: settings.company_name || profile?.company_name || user?.email?.split('@')[0] || 'Supplier',
            question: inquiry.question_text,
            replyMessage: message,
          },
        }),
      });
    } catch (emailError) {
      console.error('product inquiry reply email error:', emailError);
    }

    setInquiryReplies((current) => ({ ...current, [inquiry.id]: '' }));
    setReplyingInquiryId(null);
    await Promise.all([loadProductInquiries(), loadStats()]);
  };

  const loadMyReviews = async () => {
    const { data } = await sb.from('reviews').select('*').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setMyReviews(await attachDirectoryProfiles(sb, data, 'buyer_id', 'profiles'));
  };

  const updateSampleStatus = async (sampleId, status) => {
    const sample = samples.find(s => s.id === sampleId);
    const { error } = await sb.from('samples').update({ status }).eq('id', sampleId);
    if (error) {
      alert(isAr ? 'حدث خطأ أثناء تحديث حالة العينة' : lang === 'zh' ? '更新样品状态时出错' : 'Error updating sample status');
      return;
    }

    if (sample?.buyer_id) {
      await sb.from('notifications').insert({
        user_id: sample.buyer_id,
        type: status === 'approved' ? 'sample_approved' : 'sample_rejected',
        title_ar: status === 'approved' ? 'تمت الموافقة على طلب العينة' : 'تم رفض طلب العينة',
        title_en: status === 'approved' ? 'Your sample request was approved' : 'Your sample request was rejected',
        title_zh: status === 'approved' ? '您的样品申请已获批准' : '您的样品申请被拒绝',
        ref_id: sampleId,
        is_read: false,
      });

      try {
        await fetch(SEND_EMAILS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            type: status === 'approved' ? 'sample_approved' : 'sample_rejected',
            data: {
              recipientUserId: sample.buyer_id,
              name: 'Trader',
              productName: sample?.products?.name_ar || sample?.products?.name_en || sample?.products?.name_zh || 'Product',
              totalPrice: sample?.total_price || 0,
            },
          }),
        });
      } catch (e) { console.error('sample status email error:', e); }
    }

    loadSamples(); loadStats();
  };

  const loadPendingTracking = async () => {
    const { data } = await sb.from('offers').select('*,requests(title_ar,title_en,title_zh,buyer_id,status,tracking_number)').eq('supplier_id', user.id).eq('status', 'accepted');
    if (data) setPendingTracking(data.filter(o => o.requests?.status !== 'shipping' && o.requests?.status !== 'delivered'));
  };

  const loadRejectedOffers = async () => {
    const { data } = await sb.from('offers').select('*,requests(title_ar,title_en,title_zh)').eq('supplier_id', user.id).eq('status', 'rejected').eq('seen', false);
    if (data) setRejectedOffers(data);
  };

  const loadSettings = async () => {
    const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setSettings({
        company_name: data.company_name || '',
        whatsapp: data.whatsapp || '',
        wechat: data.wechat || '',
        city: data.city || '',
        country: data.country || '',
        trade_link: data.trade_link || '',
        speciality: data.speciality || '',
        min_order_value: data.min_order_value || '',
        business_type: data.business_type || '',
        year_established: data.year_established || '',
        languages: serializeProfileList(data.languages),
        customization_support: data.customization_support || '',
        export_markets: serializeProfileList(data.export_markets),
        company_address: data.company_address || '',
        company_website: data.company_website || '',
        company_description: getCompanyDescription(data),
        preferred_display_currency: data.preferred_display_currency || displayCurrency || 'USD',
        avatar_url: data.avatar_url || '',
        factory_images: data.factory_images || [],
      });
    }
  };

  const loadVerification = async () => {
    const { data } = await sb.from('profiles').select('reg_number,years_experience,num_employees,license_photo,factory_photo').eq('id', user.id).single();
    if (data) {
      setVerification({
        reg_number: data.reg_number || '',
        years_experience: data.years_experience || '',
        num_employees: data.num_employees || '',
        license_photo: data.license_photo || '',
        factory_photo: data.factory_photo || '',
      });
    }
  };

  const loadPayout = async () => {
    const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
    if (data) {
      setPayout(buildPayoutState(data));
    }
  };

  const clearVerificationDraft = () => {
    if (verificationDraftKey) sessionStorage.removeItem(verificationDraftKey);
    setDraftSavedAt('');
  };

  const openVerificationDoc = async (rawValue) => {
    const objectPath = normalizeSupplierDocStoragePath(rawValue);
    if (!objectPath) return;
    const { data, error } = await sb.storage.from('supplier-docs').createSignedUrl(objectPath, 60 * 10);
    if (error || !data?.signedUrl) {
      alert(isAr ? 'تعذر فتح الملف الآن' : lang === 'zh' ? '暂时无法打开文件' : 'Could not open the file right now');
      return;
    }
    const signedUrl = data.signedUrl.startsWith('http') ? data.signedUrl : `${SUPABASE_URL}${data.signedUrl}`;
    window.open(signedUrl, '_blank', 'noopener,noreferrer');
  };

  const uploadVerificationDoc = async (file, type) => {
    if (!file) return;
    const key = type === 'license' ? 'license' : 'images';
    setUploadingVerificationDoc(prev => ({ ...prev, [key]: true }));
    const extension = file.name.split('.').pop() || (file.type === 'application/pdf' ? 'pdf' : 'jpg');
    const path = `${user.id}/${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const { error } = await sb.storage.from('supplier-docs').upload(path, file, { upsert: true });
    setUploadingVerificationDoc(prev => ({ ...prev, [key]: false }));
    if (error) {
      alert(isAr ? 'فشل رفع الملف' : lang === 'zh' ? '文件上传失败' : 'Failed to upload file');
      return;
    }

    if (type === 'license') {
      await sb.from('profiles').update({ license_photo: path }).eq('id', user.id);
      setVerification(prev => ({ ...prev, license_photo: path }));
      setProfile?.(prev => ({ ...(prev || {}), license_photo: path }));
      return;
    }

    const nextFactoryImages = [...normalizeVerificationMedia(verification.factory_images), path].slice(0, VERIFICATION_IMAGE_LIMIT);
    const nextFactoryPhoto = verification.factory_photo || path;
    await sb.from('profiles').update({
      factory_images: nextFactoryImages,
      factory_photo: nextFactoryPhoto,
    }).eq('id', user.id);
    setVerification(prev => ({
      ...prev,
      factory_images: [...normalizeVerificationMedia(prev.factory_images), path].slice(0, VERIFICATION_IMAGE_LIMIT),
      factory_photo: prev.factory_photo || path,
    }));
    setProfile?.(prev => ({ ...(prev || {}), factory_images: nextFactoryImages, factory_photo: nextFactoryPhoto }));
  };

  const uploadVerificationMedia = async (fileList, mediaType) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    const isVideo = mediaType === 'video';
    const currentItems = isVideo ? verificationVideos : verificationImages;
    const limit = isVideo ? VERIFICATION_VIDEO_LIMIT : VERIFICATION_IMAGE_LIMIT;
    const remainingSlots = Math.max(0, limit - currentItems.length);

    if (remainingSlots <= 0) {
      alert(isAr
        ? (isVideo ? 'الحد الأقصى مقطعان فيديو للتحقق.' : 'الحد الأقصى 5 صور للتحقق.')
        : lang === 'zh'
          ? (isVideo ? '认证视频最多上传 2 个。' : '认证图片最多上传 5 张。')
          : (isVideo ? 'You can upload up to 2 verification videos.' : 'You can upload up to 5 verification images.'));
      return;
    }

    const acceptedFiles = files.slice(0, remainingSlots);
    const stateKey = isVideo ? 'videos' : 'images';
    setUploadingVerificationDoc(prev => ({ ...prev, [stateKey]: true }));

    const uploadedPaths = [];
    for (const file of acceptedFiles) {
      if (isVideo && file.size > VERIFICATION_VIDEO_MAX_BYTES) {
        alert(t.maxVideo);
        continue;
      }

      const extension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const path = `${user.id}/verification_${isVideo ? 'video' : 'image'}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
      const { error } = await sb.storage.from('supplier-docs').upload(path, file, { upsert: true });
      if (!error) uploadedPaths.push(path);
    }

    setUploadingVerificationDoc(prev => ({ ...prev, [stateKey]: false }));

    if (!uploadedPaths.length) {
      alert(isAr ? 'فشل رفع الملفات المحددة' : lang === 'zh' ? '所选文件上传失败' : 'Failed to upload the selected files');
      return;
    }

    const currentImages = normalizeVerificationMedia(verification.factory_images);
    const currentVideos = normalizeVerificationMedia(verification.factory_videos);
    const nextImages = isVideo ? currentImages : [...currentImages, ...uploadedPaths].slice(0, VERIFICATION_IMAGE_LIMIT);
    const nextVideos = isVideo ? [...currentVideos, ...uploadedPaths].slice(0, VERIFICATION_VIDEO_LIMIT) : currentVideos;
    const nextFactoryPhoto = nextImages[0] || verification.factory_photo || '';
    setVerification(prev => ({
      ...prev,
      factory_images: nextImages,
      factory_videos: nextVideos,
      factory_photo: nextFactoryPhoto,
    }));
    await runWithOptionalColumns({
      table: 'profiles',
      payload: { factory_images: nextImages, factory_photo: nextFactoryPhoto, factory_videos: nextVideos },
      optionalKeys: ['factory_videos'],
      execute: (p) => sb.from('profiles').update(p).eq('id', user.id),
    });
    setProfile?.(prev => ({ ...(prev || {}), factory_images: nextImages, factory_photo: nextFactoryPhoto, factory_videos: nextVideos }));
  };

  const removeVerificationMedia = (mediaType, pathToRemove) => {
    setVerification(prev => {
      const nextImages = mediaType === 'image'
        ? normalizeVerificationMedia(prev.factory_images).filter((item) => item !== pathToRemove)
        : normalizeVerificationMedia(prev.factory_images);
      const nextVideos = mediaType === 'video'
        ? normalizeVerificationMedia(prev.factory_videos).filter((item) => item !== pathToRemove)
        : normalizeVerificationMedia(prev.factory_videos);

      return {
        ...prev,
        factory_images: nextImages,
        factory_videos: nextVideos,
        factory_photo: nextImages[0] || '',
      };
    });
  };

  const saveVerification = async () => {
    if (isVerificationLocked) {
      return;
    }

    if (verificationProgress.missingProfileFields.length > 0) {
      setVerificationSaved(false);
      setVerificationMsg(t.verificationProfileRequired);
      return;
    }

    if (!verificationProgress.hasVerificationBasics) {
      setVerificationSaved(false);
      setVerificationMsg(t.verificationMissing);
      return;
    }

    if (!verificationVideos.length) {
      setVerificationSaved(false);
      setVerificationMsg(t.verificationVideoRequired);
      return;
    }

    setSavingVerification(true);
    setVerificationSaved(false);
    setVerificationMsg('');

    const payload = {
      ...buildSettingsPayload(settings, companyDescription),
      reg_number: normalizeTextInput(verification.reg_number),
      years_experience: normalizeOptionalInteger(verification.years_experience),
      num_employees: normalizeOptionalInteger(verification.num_employees),
      license_photo: normalizeTextInput(verification.license_photo),
      factory_photo: verificationImages[0] || '',
      factory_images: verificationImages,
      factory_videos: verificationVideos,
    };

    const { error, payload: persistedPayload } = await runWithOptionalColumns({
      table: 'profiles',
      payload: stripEmptyFields(payload),
      optionalKeys: ['business_type', 'year_established', 'languages', 'customization_support', 'export_markets', 'company_address', 'company_website', 'company_description', 'preferred_display_currency', 'factory_videos'],
      execute: (nextPayload) => sb.from('profiles').update(nextPayload).eq('id', user.id),
    });

    if (error) {
      setSavingVerification(false);
      console.error('DB error:', error);
      setVerificationMsg(isAr ? 'تعذر حفظ بيانات التحقق. حاول مرة أخرى.' : lang === 'zh' ? '认证资料保存失败，请重试。' : 'Failed to save verification details. Please try again.');
      return;
    }

    let submittedStatus = profile?.status;

    if (!supplierState.isApprovedStage) {
      const { data: submitResult, error: submitError } = await sb.rpc('submit_supplier_verification');
      if (submitError) {
        setSavingVerification(false);
        setVerificationMsg(isAr ? 'تعذر إرسال التحقق للمراجعة. حاول مرة أخرى.' : lang === 'zh' ? '提交认证审核失败，请重试。' : 'Failed to submit verification for review. Please try again.');
        return;
      }

      submittedStatus = Array.isArray(submitResult)
        ? submitResult[0]?.status
        : submitResult?.status;
    }

    setSavingVerification(false);

    await setDisplayCurrency?.(settings.preferred_display_currency || 'USD');
    clearVerificationDraft();
    const mergedProfile = {
      ...profile,
      ...persistedPayload,
      ...(submittedStatus ? { status: submittedStatus } : {}),
    };
    verificationJustSavedRef.current = true;
    setProfile?.(mergedProfile);
    setSettings(buildSettingsState(mergedProfile, settings.preferred_display_currency || 'USD'));
    setVerification(buildVerificationState(mergedProfile));

    try {
      await sb.from('notifications').insert({
        user_id: user.id,
        type: 'verification_submitted',
        title_ar: 'تم إرسال التحقق وبات الحساب الآن تحت المراجعة',
        title_en: 'Your verification was submitted and is now under review',
        title_zh: '您的认证已提交，账户现已进入审核中',
        ref_id: user.id,
        is_read: false,
      });
    } catch (notificationError) {
      console.error('verification submitted notification error:', notificationError);
    }

    try {
      await sendMaabarEmail({
        type: 'supplier_verification_submitted',
        data: {
          recipientUserId: user.id,
          name: mergedProfile.company_name || mergedProfile.full_name || user.email?.split('@')[0] || 'Supplier',
          lang,
        },
      });
    } catch (emailError) {
      console.error('supplier verification submitted email error:', emailError);
    }

    setVerificationSaved(true);
    setVerificationMsg(t.verificationSubmitted);
    setVerificationStep(3);
    if (dashboardUiStateKey) sessionStorage.removeItem(dashboardUiStateKey);
  };

  const savePayout = async () => {
    const requiredPayoutFields = [
      payout.payout_beneficiary_name,
      payout.bank_name,
      payout.payout_account_number,
      payout.swift_code,
      payout.preferred_display_currency,
    ].map(value => String(value || '').trim());

    if (requiredPayoutFields.some(value => !value)) {
      setPayoutError(isAr ? 'أكمل جميع بيانات الدفعات المطلوبة قبل الحفظ.' : lang === 'zh' ? '请先填写所有必填收款信息，再保存。' : 'Please complete all required payout details before saving.');
      return;
    }

    setPayoutError('');
    setSavingPayout(true);
    const payload = buildPayoutPayload(payout);
    const { error, payload: persistedPayload } = await runWithOptionalColumns({
      table: 'profiles',
      payload,
      optionalKeys: ['preferred_display_currency', 'payout_beneficiary_name', 'payout_account_number', 'payout_bank_address', 'payout_branch_name'],
      execute: (nextPayload) => sb.from('profiles').update(nextPayload).eq('id', user.id),
    });
    setSavingPayout(false);
    if (error) {
      setPayoutError(isAr ? 'تعذر حفظ بيانات الدفعات. حاول مرة أخرى.' : lang === 'zh' ? '收款资料保存失败，请重试。' : 'Failed to save payout details. Please try again.');
      return;
    }

    const savedAt = new Date().toISOString();
    const mergedProfile = { ...profile, ...persistedPayload };
    setProfile?.(mergedProfile);
    setSettings(prev => ({ ...prev, preferred_display_currency: persistedPayload.preferred_display_currency || prev.preferred_display_currency || 'USD' }));
    setPayout(buildPayoutState(mergedProfile));
    await setDisplayCurrency?.(persistedPayload.preferred_display_currency || payload.preferred_display_currency || 'USD');
    setPayoutSavedAt(savedAt);
  };

  const saveSettings = async ({ nextVerificationStep = null, navigateToVerification = false } = {}) => {
    const missingApplicationFields = [
      ['company_name', isAr ? 'اسم الشركة' : lang === 'zh' ? '公司名称' : 'Company name'],
      ['city', t.city],
      ['country', t.country],
      ['trade_link', t.tradeLink],
    ].filter(([key]) => !String(settings?.[key] || '').trim());

    if (missingApplicationFields.length > 0) {
      setSettingsError(isAr
        ? 'أكمل الحقول الأساسية المطلوبة أولاً: اسم الشركة، المدينة، الدولة، والرابط التجاري.'
        : lang === 'zh'
          ? '请先完成基础必填项：公司名称、城市、国家和贸易链接。'
          : 'Please complete the required basics first: company name, city, country, and trade link.');
      return false;
    }

    setSettingsError('');
    setSavingSettings(true);
    const payload = buildSettingsPayload(settings, companyDescription);

    const { error } = await runWithOptionalColumns({
      table: 'profiles',
      payload,
      optionalKeys: ['business_type', 'year_established', 'languages', 'customization_support', 'export_markets', 'company_address', 'company_website', 'company_description', 'preferred_display_currency'],
      execute: (nextPayload) => sb.from('profiles').update(nextPayload).eq('id', user.id),
    });

    setSavingSettings(false);

    if (error) {
      setSettingsError(isAr ? 'تعذر حفظ ملف الشركة. حاول مرة أخرى.' : lang === 'zh' ? '公司资料保存失败，请重试。' : 'Failed to save company profile. Please try again.');
      return false;
    }

    const savedAt = new Date().toISOString();
    await setDisplayCurrency?.(payload.preferred_display_currency || 'USD');

    const mergedProfile = {
      ...profile,
      ...payload,
    };
    setProfile?.(mergedProfile);
    setSettings(buildSettingsState(mergedProfile, payload.preferred_display_currency || 'USD'));
    setSettingsSavedAt(savedAt);

    const shouldAdvanceIntoVerification = !supplierState.isUnderReviewStage
      && !supplierState.isApprovedStage
      && (navigateToVerification || typeof nextVerificationStep === 'number');

    if (shouldAdvanceIntoVerification) {
      setVerificationSaved(true);
      setVerificationMsg(isAr ? 'تم حفظ ملف الشركة. الآن أرفق مستندات التحقق ثم أكمل الإرسال النهائي.' : lang === 'zh' ? '公司资料已保存。现在请上传认证文件，然后完成最终提交。' : 'Company profile saved. Now add your verification files, then complete the final submission.');
      setActiveTab('verification');
      if (typeof nextVerificationStep === 'number') {
        setVerificationStep(Math.min(3, Math.max(1, nextVerificationStep)));
      }
    }

    return true;
  };

  const uploadLogo = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setUploadingLogo(true);
    const path = `${user.id}/logo_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: true });
    if (!error) { const url = STORAGE_URL + path; await sb.from('profiles').update({ avatar_url: url }).eq('id', user.id); setSettings(prev => ({ ...prev, avatar_url: url })); }
    setUploadingLogo(false);
  };

  const uploadFactoryImage = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    if ((settings.factory_images || []).length >= 3) { alert(isAr ? 'الحد الأقصى 3 صور' : lang === 'zh' ? '最多只能上传 3 张图片' : 'Max 3 images'); return; }
    setUploadingFactory(true);
    const path = `${user.id}/factory_${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: true });
    if (!error) { const url = STORAGE_URL + path; const newImages = [...(settings.factory_images || []), url]; await sb.from('profiles').update({ factory_images: newImages }).eq('id', user.id); setSettings(prev => ({ ...prev, factory_images: newImages })); }
    setUploadingFactory(false);
  };

  const removeFactoryImage = async (url) => {
    const newImages = (settings.factory_images || []).filter(img => img !== url);
    await sb.from('profiles').update({ factory_images: newImages }).eq('id', user.id);
    setSettings(prev => ({ ...prev, factory_images: newImages }));
  };

  const dismissRejected = async (offerId) => {
    await sb.from('offers').update({ seen: true }).eq('id', offerId);
    setRejectedOffers(prev => prev.filter(o => o.id !== offerId));
  };

  const loadMyOffers = async () => {
    setLoadingOffers(true);
    const { data } = await sb.from('offers').select('*,requests(title_ar,title_en,title_zh,buyer_id,status,tracking_number,shipping_status,shipping_company,estimated_delivery,quantity,description,payment_plan,category,profiles!requests_buyer_id_fkey(full_name,company_name))').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setMyOffers(data);
    const { data: payData } = await sb.from('payments').select('request_id').eq('supplier_id', user.id).eq('status', 'completed');
    setCompletedPayments(new Set((payData || []).map(p => p.request_id)));
    setLoadingOffers(false);
  };

  const loadMyProducts = async () => {
    setLoadingProducts(true);
    const { data } = await sb.from('products').select('*').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setMyProducts(data);
    setLoadingProducts(false);
  };

  const loadRequests = async () => {
    if (!user) return;
    setLoadingRequests(true);
    // جلب الطلبات الظاهرة للمورد: المفتوحة + التي وصلتها عروض حتى لا تختفي بعد أول عرض
    let query = sb.from('requests').select('*, profiles!requests_buyer_id_fkey(full_name, company_name)').in('status', ['open', 'offers_received']).or('sourcing_mode.is.null,sourcing_mode.eq.direct').order('created_at', { ascending: false });
    if (activeCat !== 'all') query = query.or(`category.eq.${activeCat},category.is.null`);
    const { data, error } = await query;
    console.log('loadRequests result:', data?.length, 'error:', error);
    if (error) {
      setRequests([]);
      setLoadingRequests(false);
      return;
    }
    if (data) setRequests(data);
    setLoadingRequests(false);
  };

  const loadManagedMatches = async () => {
    if (!user) return;
    const { data, error } = await sb
      .from('managed_supplier_matches')
      .select('*, requests(*)')
      .eq('supplier_id', user.id)
      .order('matched_at', { ascending: false });

    if (error) {
      console.error('loadManagedMatches error:', error);
      setManagedMatches([]);
      return;
    }

    const requestIds = (data || []).map((match) => match.request_id).filter(Boolean);
    const { data: relatedOffers } = requestIds.length > 0
      ? await sb.from('offers').select('*').eq('supplier_id', user.id).in('request_id', requestIds)
      : { data: [] };

    const offerByRequest = (relatedOffers || []).reduce((acc, offer) => ({ ...acc, [offer.request_id]: offer }), {});

    setManagedMatches((data || []).map((match) => ({
      ...match,
      offer: offerByRequest[match.request_id] || null,
    })));
  };

  const submitManagedMatchOffer = async (match, draft) => {
    const price = parseFloat(draft.price);
    const shippingCost = parseFloat(draft.shippingCost);
    const productionDays = parseInt(draft.productionDays, 10);
    const shippingDays = parseInt(draft.shippingDays, 10);

    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(shippingCost) || shippingCost < 0 || !String(draft.moq || '').trim() || !Number.isFinite(productionDays) || productionDays <= 0 || !Number.isFinite(shippingDays) || shippingDays <= 0) {
      alert(isAr ? 'أدخل سعر الوحدة وتكلفة الشحن وMOQ ومدة الإنتاج ومدة الشحن قبل إرسال العرض' : lang === 'zh' ? '请先填写单价、运费、最小起订量、生产周期和运输时效后再发送报价' : 'Please add unit price, shipping cost, MOQ, production days, and shipping days before sending');
      return;
    }

    setSubmittingOfferId(match.id);
    const payload = {
      request_id: match.request_id,
      supplier_id: user.id,
      price,
      shipping_cost: shippingCost,
      shipping_method: shippingDays ? `${shippingDays} ${isAr ? 'يوم شحن' : lang === 'zh' ? '天运输时效' : 'shipping days'}` : null,
      moq: draft.moq,
      delivery_days: productionDays,
      origin: 'China',
      note: draft.note || null,
      status: 'pending',
      managed_match_id: match.id,
      managed_visibility: 'admin_only',
      negotiation_note: shippingDays ? `shipping_time_days:${shippingDays}` : null,
    };

    const existingOfferId = match.offer?.id || null;
    const query = existingOfferId
      ? sb.from('offers').update(payload).eq('id', existingOfferId)
      : sb.from('offers').insert(payload);

    const { error } = await query;
    if (error) {
      console.error('submitManagedMatchOffer error:', error);
      alert(isAr ? 'تعذر إرسال العرض الآن' : lang === 'zh' ? '暂时无法提交报价' : 'Unable to submit the offer right now');
      setSubmittingOfferId(null);
      return;
    }

    await sb.from('managed_supplier_matches').update({
      status: 'quoted',
      supplier_note: draft.note || null,
      supplier_response: 'quoted',
      supplier_responded_at: new Date().toISOString(),
    }).eq('id', match.id);

    setManagedOfferForms((prev) => ({ ...prev, [match.id]: false }));
    setSubmittingOfferId(null);
    await Promise.all([loadManagedMatches(), loadStats()]);
  };

  const declineManagedMatch = async (match) => {
    await sb.from('managed_supplier_matches').update({
      status: 'declined',
      supplier_response: 'declined',
      closed_at: new Date().toISOString(),
    }).eq('id', match.id);
    await Promise.all([loadManagedMatches(), loadStats()]);
  };

  const loadInbox = async () => {
    const { data } = await sb.from('messages').select('*').eq('receiver_id', user.id).order('created_at', { ascending: false });
    if (data) {
      const withProfiles = await attachDirectoryProfiles(sb, data, 'sender_id', 'profiles');
      const seen = new Set();
      setInbox(withProfiles.filter(m => { if (seen.has(m.sender_id)) return false; seen.add(m.sender_id); return true; }));
      await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('is_read', false);
      setStats(s => ({ ...s, messages: 0 }));
    }
  };

  const uploadFile = async (file, type) => {
    if (!file) return null;
    const isVideo = type === 'video';
    if (isVideo && file.size > 50 * 1024 * 1024) { alert(t.maxVideo); return null; }
    isVideo ? setUploadingVideo(true) : setUploadingImage(true);
    const path = `${user.id}/${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${file.name.split('.').pop()}`;
    const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: true });
    isVideo ? setUploadingVideo(false) : setUploadingImage(false);
    if (error) { alert(isAr ? 'فشل الرفع' : lang === 'zh' ? '上传失败' : 'Upload failed'); return null; }
    return STORAGE_URL + path;
  };

  const applyProductMedia = (setter, mediaUpdater) => {
    setter(prev => normalizeProductDraftMedia(mediaUpdater(prev || emptyProduct)));
  };

  const handleImageUpload = async (e, isEdit = false) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentImages = getProductGalleryImages(isEdit ? editingProduct : product);
    if (currentImages.length + files.length > PRODUCT_GALLERY_LIMIT) {
      alert(t.maxImagesError);
      e.target.value = '';
      return;
    }

    const nextUrls = [];
    for (const file of files) {
      const url = await uploadFile(file, 'image');
      if (url) nextUrls.push(url);
    }

    if (!nextUrls.length) return;
    const setter = isEdit ? setEditingProduct : setProduct;
    applyProductMedia(setter, prev => ({
      ...prev,
      gallery_images: [...getProductGalleryImages(prev), ...nextUrls].slice(0, PRODUCT_GALLERY_LIMIT),
    }));
    e.target.value = '';
  };

  const removeImageAt = (index, isEdit = false) => {
    const setter = isEdit ? setEditingProduct : setProduct;
    applyProductMedia(setter, prev => ({
      ...prev,
      gallery_images: getProductGalleryImages(prev).filter((_, imgIndex) => imgIndex !== index),
    }));
  };

  const handleVideoUpload = async (e, isEdit = false) => {
    const file = e.target.files?.[0];
    const url = await uploadFile(file, 'video');
    if (!url) return;
    const setter = isEdit ? setEditingProduct : setProduct;
    applyProductMedia(setter, prev => ({ ...prev, video_url: url }));
    e.target.value = '';
  };

  const removeVideo = (isEdit = false) => {
    const setter = isEdit ? setEditingProduct : setProduct;
    applyProductMedia(setter, prev => ({ ...prev, video_url: null }));
  };

  const openProductPreview = () => {
    const validationMessage = getProductComposerValidationMessage(product, lang);
    if (validationMessage) {
      setProductSaveMsg(validationMessage);
      return;
    }
    setProductSaveMsg('');
    setProduct(normalizeProductDraftMedia(product));
    setProductComposerStep('preview');
  };

  const openEditProductPreview = () => {
    const validationMessage = getProductComposerValidationMessage(editingProduct, lang);
    if (validationMessage) {
      setProductSaveMsg(validationMessage);
      return;
    }
    setProductSaveMsg('');
    setEditingProduct(prev => normalizeProductDraftMedia(prev));
    setEditProductComposerStep('preview');
  };

  const addProduct = async () => {
    const validationMessage = getProductComposerValidationMessage(product, lang);
    if (validationMessage) {
      setProductSaveMsg(validationMessage);
      return;
    }
    setSaving(true);
    setProductSaveMsg('');
    let translatedFields = {};
    try {
      translatedFields = await buildTranslatedProductFields({
        nameAr: product.name_ar, nameEn: product.name_en, nameZh: product.name_zh,
        descEn: product.desc_en, descAr: product.desc_ar, lang,
      });
    } catch (translationErr) {
      console.error('addProduct translation error:', translationErr?.message || translationErr);
    }
    const payload = buildProductWritePayload({ ...product, ...translatedFields }, user.id);
    const { error, strippedColumns } = await runWithOptionalColumns({
      table: 'products',
      payload,
      optionalKeys: PRODUCT_OPTIONAL_DB_FIELDS,
      execute: (nextPayload) => sb.from('products').insert(nextPayload),
    });
    setSaving(false);
    if (error) {
      console.error('addProduct error:', error);
      setProductSaveMsg(isAr ? 'حدث خطأ أثناء الحفظ. حاول مرة أخرى.' : lang === 'zh' ? '保存产品时出错，请重试。' : 'Error saving product. Please try again.');
      return;
    }
    sessionStorage.removeItem('maabar_product_draft');
    setProduct(emptyProduct);
    setProductComposerStep('edit');
    setProductSaveMsg(strippedColumns.length > 0 ? t.productSavedWithFallback : (isAr ? 'تم إضافة المنتج بنجاح' : lang === 'zh' ? '产品添加成功' : 'Product added successfully'));
    setTimeout(() => { setProductSaveMsg(''); setActiveTab('my-products'); }, 1800);
    loadStats();
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);
    let translatedFields = {};
    try {
      translatedFields = await buildTranslatedProductFields({
        nameAr: editingProduct.name_ar, nameEn: editingProduct.name_en, nameZh: editingProduct.name_zh,
        descEn: editingProduct.desc_en, descAr: editingProduct.desc_ar, lang,
      });
    } catch (translationErr) {
      console.error('updateProduct translation error:', translationErr?.message || translationErr);
    }
    const payload = buildProductWritePayload({ ...editingProduct, ...translatedFields });
    delete payload.supplier_id;
    const { error } = await runWithOptionalColumns({
      table: 'products',
      payload,
      optionalKeys: PRODUCT_OPTIONAL_DB_FIELDS,
      execute: (nextPayload) => sb.from('products').update(nextPayload).eq('id', editingProduct.id),
    });
    setSaving(false);
    if (error) {
      console.error('updateProduct error:', error);
      return;
    }
    setEditProductComposerStep('edit');
    setEditingProduct(null); loadMyProducts(); loadStats();
  };

  const toggleProductActive = async (p) => { await sb.from('products').update({ is_active: !p.is_active }).eq('id', p.id); loadMyProducts(); loadStats(); };
  const deleteProduct = async (id) => { if (!window.confirm(t.confirmDelete)) return; await sb.from('products').delete().eq('id', id); loadMyProducts(); loadStats(); };

  const saveEditOffer = async () => {
    if (!editOfferModal) return;

    const price = parseFloat(editOfferForm.price);
    const shippingCost = parseFloat(editOfferForm.shippingCost);
    const deliveryDays = parseInt(editOfferForm.days, 10);

    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(shippingCost) || shippingCost < 0 || !Number.isFinite(deliveryDays) || deliveryDays <= 0 || !String(editOfferForm.moq || '').trim()) {
      alert(isAr ? 'تأكد من سعر الوحدة وتكلفة الشحن و MOQ ومدة التسليم قبل الحفظ' : lang === 'zh' ? '请先确认单价、运费、起订量和交期是否正确' : 'Please check unit price, shipping cost, MOQ, and delivery days before saving');
      return;
    }

    setSavingEditOffer(true);
    let noteTranslations = {};
    if (editOfferForm.note) {
      try {
        const noteLangs = await translateTextToAllLanguages(editOfferForm.note, lang || 'zh');
        noteTranslations = { note_ar: noteLangs.ar, note_en: noteLangs.en, note_zh: noteLangs.zh };
      } catch (translationErr) {
        console.error('saveEditOffer translation error:', translationErr?.message || translationErr);
      }
    }
    const { error } = await runWithOptionalColumns({
      table: 'offers',
      payload: {
        price,
        shipping_cost: shippingCost,
        shipping_method: String(editOfferForm.shippingMethod || '').trim() || null,
        moq: editOfferForm.moq,
        delivery_days: deliveryDays,
        origin: editOfferForm.origin || 'China',
        note: editOfferForm.note,
        ...noteTranslations,
      },
      optionalKeys: ['shipping_cost', 'shipping_method', 'origin', 'note_ar', 'note_en', 'note_zh'],
      execute: (nextPayload) => sb.from('offers').update(nextPayload).eq('id', editOfferModal.id),
    });
    setSavingEditOffer(false);
    if (error) {
      console.error('saveEditOffer error:', error);
      alert(isAr ? 'حدث خطأ أثناء حفظ العرض' : lang === 'zh' ? '保存报价时出错' : 'Error saving offer');
      return;
    }
    setEditOfferModal(null);
    loadMyOffers();
  };

  const deleteOffer = async (o) => {
    if (o.status !== 'pending') {
      alert(isAr ? 'لا يمكن حذف عرض تم قبوله أو رفضه' : lang === 'zh' ? '已接受或已拒绝的报价无法删除' : 'Cannot delete an accepted or rejected offer');
      return;
    }
    if (!window.confirm(isAr ? 'هل تريد حذف هذا العرض؟' : lang === 'zh' ? '确认删除这个报价吗？' : 'Delete this offer?')) return;
    await sb.from('offers').delete().eq('id', o.id);
    loadMyOffers(); loadStats();
  };

  const cancelOffer = async (o) => {
    const requestStatus = o.requests?.status || '';
    const isAcceptedBeforePayment = o.status === 'accepted' && !['paid', 'ready_to_ship', 'shipping', 'arrived', 'delivered'].includes(requestStatus);

    if (!window.confirm(isAcceptedBeforePayment
      ? (isAr ? 'هل تريد سحب العرض المقبول وإعادة الطلب للتاجر؟' : lang === 'zh' ? '确认撤回这个已接受报价，并让需求重新开放给买家吗？' : 'Withdraw this accepted offer and reopen the request for the trader?')
      : (isAr ? 'هل تريد إلغاء هذا العرض؟' : lang === 'zh' ? '确认取消这个报价吗？' : 'Cancel this offer?'))) return;

    if (isAcceptedBeforePayment) {
      await sb.from('offers').update({ status: 'cancelled' }).eq('id', o.id);
      await sb.from('requests').update({ status: 'open', shipping_status: 'open' }).eq('id', o.request_id);
    } else {
      await sb.from('offers').update({ status: 'cancelled' }).eq('id', o.id);
    }

    const buyerId = o.requests?.buyer_id;
    if (buyerId) {
      const title = getTitle(o.requests);
      await sb.from('notifications').insert({
        user_id: buyerId,
        type: 'offer_cancelled',
        title_ar: isAcceptedBeforePayment
          ? `قام المورد بسحب العرض المقبول على طلبك: ${o.requests?.title_ar || title}`
          : `قام المورد بسحب عرضه على طلبك: ${o.requests?.title_ar || title}`,
        title_en: isAcceptedBeforePayment
          ? `Supplier withdrew the accepted offer on: ${o.requests?.title_en || title}`
          : `Supplier withdrew their offer on: ${o.requests?.title_en || title}`,
        title_zh: isAcceptedBeforePayment
          ? `供应商撤回了已接受的报价: ${o.requests?.title_zh || title}`
          : `供应商撤回了报价: ${o.requests?.title_zh || title}`,
        ref_id: o.request_id,
        is_read: false,
      });
      await sb.from('messages').insert({
        sender_id: user.id,
        receiver_id: buyerId,
        content: isAcceptedBeforePayment
          ? (isAr ? `قام المورد بسحب العرض المقبول على الطلب: ${title}` : lang === 'zh' ? `供应商撤回了已接受的报价：${title}` : `The supplier withdrew the accepted offer on: ${title}`)
          : (isAr ? `قام المورد بسحب عرضه على الطلب: ${title}` : lang === 'zh' ? `供应商撤回了报价：${title}` : `The supplier withdrew the offer on: ${title}`),
        is_read: false,
      });
    }

    loadMyOffers();
    loadPendingTracking();
    loadStats();
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
        optionalKeys: ['shipping_cost', 'shipping_method', 'origin'],
        execute: (nextPayload) => sb.from('offers').insert(nextPayload),
      });
      if (error) throw error;

      await sb.from('requests').update({ status: 'offers_received' }).eq('id', requestId).eq('status', 'open');
      await sb.from('notifications').insert({ user_id: buyerId, type: 'new_offer', title_ar: 'وصلك عرض جديد على طلبك', title_en: 'You received a new offer', title_zh: '您收到了新报价', ref_id: requestId, is_read: false });
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
            },
          }),
        });
      } catch (e) { console.error('email error:', e); }
      alert(isAr ? 'تم إرسال عرضك!' : lang === 'zh' ? '报价已发送！' : 'Offer submitted!');
      toggleOfferForm(requestId); loadRequests();
    } catch (error) {
      console.error('submitOffer error:', error);
      alert(isAr ? 'حدث خطأ أثناء إرسال العرض' : lang === 'zh' ? '发送报价时出错' : 'Error sending offer');
    } finally {
      setSubmittingOfferId(null);
    }
  };

  const submitTracking = async (requestId, buyerId, deliveryDays) => {
    const num = trackingInputs[requestId]; if (!num) return;
    const estimatedDelivery = deliveryDays
      ? new Date(Date.now() + (deliveryDays * 24 * 60 * 60 * 1000)).toISOString()
      : null;
    await sb.from('requests').update({
      tracking_number: num,
      shipping_company: shippingCompany,
      status: 'shipping',
      shipping_status: 'shipping',
      ...(estimatedDelivery ? { estimated_delivery: estimatedDelivery } : {}),
    }).eq('id', requestId);
    await sb.from('notifications').insert({ user_id: buyerId, type: 'shipped', title_ar: 'طلبك في الطريق — رقم التتبع: ' + num, title_en: 'Your order is on the way — Tracking: ' + num, title_zh: '您的订单已发货 — 跟踪号：' + num, ref_id: requestId, is_read: false });
    try {
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'shipment_tracking',
          data: {
            recipientUserId: buyerId,
            name: 'Trader',
            trackingNumber: num,
            shippingCompany,
          },
        }),
      });
    } catch (e) { console.error('tracking email error:', e); }
    loadMyOffers(); loadPendingTracking();
  };

  const getTitle = (item) => {
    if (lang === 'zh') return item?.title_zh || item?.title_en || item?.title_ar;
    if (lang === 'en') return item?.title_en || item?.title_ar;
    return item?.title_ar || item?.title_en;
  };

  const fmtDate = (d) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 3600)  return isAr ? Math.floor(diff / 60) + ' د'  : lang === 'zh' ? Math.floor(diff / 60) + '分钟前' : Math.floor(diff / 60) + 'm';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' س' : lang === 'zh' ? Math.floor(diff / 3600) + '小时前' : Math.floor(diff / 3600) + 'h';
    return isAr ? Math.floor(diff / 86400) + ' ي' : lang === 'zh' ? Math.floor(diff / 86400) + '天前' : Math.floor(diff / 86400) + 'd';
  };

  const relativeTime = (dateStr) => {
    if (!dateStr) return '';
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 3600)  return isAr ? `منذ ${Math.floor(diff / 60)} د`   : lang === 'zh' ? `${Math.floor(diff / 60)}分钟前` : `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return isAr ? `منذ ${Math.floor(diff / 3600)} س`  : lang === 'zh' ? `${Math.floor(diff / 3600)}小时前` : `${Math.floor(diff / 3600)}h ago`;
    const days = Math.floor(diff / 86400);
    if (days < 30)    return isAr ? `منذ ${days} ي`                      : lang === 'zh' ? `${days}天前` : `${days}d ago`;
    return isAr ? `منذ ${Math.floor(days / 30)} ش` : lang === 'zh' ? `${Math.floor(days / 30)}个月前` : `${Math.floor(days / 30)}mo ago`;
  };

  const SUPPLIER_STEP_MAP = {
    closed: 1, supplier_confirmed: 2,
    paid: 3, ready_to_ship: 4,
    shipping: 4, arrived: 5, delivered: 6,
  };
  const SUPPLIER_STEPS_AR = ['قدّمت العرض', 'العرض قُبل', 'تأكيد الجاهزية', 'الإنتاج', 'الشحن', 'مكتمل'];
  const SUPPLIER_STEPS_EN = ['Offer Sent', 'Accepted', 'Ready', 'Production', 'Shipping', 'Done'];
  const SUPPLIER_STEPS_ZH = ['报价已提交', '已接受', '确认就绪', '生产中', '运输中', '已完成'];

  const SupplierStatusTimeline = ({ step }) => {
    const steps = lang === 'zh' ? SUPPLIER_STEPS_ZH : isAr ? SUPPLIER_STEPS_AR : SUPPLIER_STEPS_EN;
    const SAGE = '#2D6A4F';
    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {steps.map((label, i) => {
          const done    = i < step;
          const current = i === step;
          const future  = i > step;
          const dotColor   = done ? SAGE : current ? 'var(--text-primary)' : 'rgba(0,0,0,0.10)';
          const leftLine   = i <= step ? SAGE : 'rgba(0,0,0,0.08)';
          const rightLine  = i < step  ? SAGE : 'rgba(0,0,0,0.08)';
          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 46 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && <div style={{ flex: 1, height: 1, background: leftLine }} />}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0,
                  ...(current ? { boxShadow: `0 0 0 3px rgba(0,0,0,0.10), 0 0 0 5px rgba(0,0,0,0.04)` } : {}),
                }} />
                {i < steps.length - 1 && <div style={{ flex: 1, height: 1, background: rightLine }} />}
              </div>
              <p style={{
                fontSize: 9, marginTop: 5, textAlign: 'center', whiteSpace: 'nowrap',
                color: future ? 'var(--text-disabled)' : done ? SAGE : 'var(--text-primary)',
                fontWeight: current ? 600 : done ? 500 : 400,
                fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)',
              }}>{label}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const SupplierPaymentPills = ({ requestStatus, paymentPlan }) => {
    const plan = paymentPlan || 50;
    const rest = 100 - plan;
    const tf = "'Tajawal', sans-serif";

    // State helpers
    const inst1State = (() => {
      if (['paid','ready_to_ship','shipping','arrived','delivered'].includes(requestStatus)) return 'black';
      return 'amber'; // closed, supplier_confirmed
    })();
    const inst2State = (() => {
      if (['arrived','delivered'].includes(requestStatus)) return 'black';
      if (requestStatus === 'shipping') return 'amber';
      return 'grey'; // closed, supplier_confirmed, paid, ready_to_ship
    })();

    const PILL_STYLES = {
      black: { background: 'var(--text-primary)', color: 'var(--bg-base)',           border: '1px solid var(--text-primary)' },
      amber: { background: 'transparent',         color: '#8B6914',                  border: '1px solid rgba(139,105,20,0.40)' },
      grey:  { background: 'transparent',         color: 'var(--text-tertiary)',      border: '1px solid var(--border-subtle)' },
    };

    const stateLabel = (state) => {
      if (state === 'black') return isAr ? 'محوّلة لك'         : lang === 'zh' ? '已转账'     : 'Transferred';
      if (state === 'amber') return isAr ? 'في انتظار التاجر'  : lang === 'zh' ? '等待买家'   : 'Awaiting Buyer';
      return                         isAr ? 'بعد الشحن'        : lang === 'zh' ? '发货后'     : 'After Shipping';
    };

    const Pill = ({ pct, state, suffix }) => (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontSize: 10, padding: '3px 10px', borderRadius: 20,
        fontFamily: isAr ? tf : 'var(--font-sans)',
        letterSpacing: isAr ? 0 : 0.3,
        ...PILL_STYLES[state],
      }}>
        <span style={{ fontVariantNumeric: 'lining-nums' }}>{pct}٪</span>
        <span style={{ opacity: 0.55 }}>{suffix}</span>
        <span>·</span>
        <span>{stateLabel(state)}</span>
      </span>
    );

    const suffix1 = isAr ? 'مقدم'      : lang === 'zh' ? '定金'   : 'upfront';
    const suffix2 = isAr ? 'عند الشحن' : lang === 'zh' ? '发货后' : 'on ship';

    return (
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <Pill pct={plan} state={inst1State} suffix={suffix1} />
        <Pill pct={rest} state={inst2State} suffix={suffix2} />
      </div>
    );
  };

  const name = profile?.company_name || profile?.full_name || user?.email?.split('@')[0];
  const supplierMaabarId = getSupplierMaabarId(profile || {});
  const pendingCount = pendingTracking.length + rejectedOffers.length;
  const closedOffers = myOffers.filter(o => o.status === 'accepted' && o.requests?.status === 'closed');
  const paidOffers   = myOffers.filter(o => o.status === 'accepted' && o.requests?.status === 'paid');

  const arFont = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const section = { animation: 'fadeIn 0.35s ease' };
  const verificationStatusHeadline = supplierState.isApprovedStage
    ? (isAr ? 'تم اعتماد حسابك كمورد موثّق' : lang === 'zh' ? '您的账户已通过认证' : 'Your supplier account is verified')
    : supplierState.isUnderReviewStage
      ? (isAr ? 'التحقق الآن تحت المراجعة' : lang === 'zh' ? '认证资料正在审核中' : 'Your verification is now under review')
      : (isAr ? 'أكمل ملف الشركة ثم أرسل التحقق' : lang === 'zh' ? '先完善公司资料，再提交认证' : 'Complete your company profile, then submit verification');
  const verificationStatusBody = supplierState.isApprovedStage
    ? (isAr ? 'تم فتح الوصول الكامل للمورد داخل مَعبر. يمكنك الآن استخدام الطلبات والمنتجات والعروض وباقي الإجراءات الأساسية.' : lang === 'zh' ? '完整供应商能力现已解锁，您可以开始使用需求、产品、报价和核心操作。' : 'The full supplier experience is now unlocked. You can use requests, products, offers, and core actions.')
    : supplierState.isUnderReviewStage
      ? (isAr ? 'تم استلام التحقق بنجاح. لن يظهر النموذج القابل للتعديل مرة أخرى أثناء المراجعة، وستظل الإجراءات الأساسية مقفلة حتى اعتماد الحساب.' : lang === 'zh' ? '认证资料已成功提交。审核期间不会再次显示可编辑表单，核心操作会保持锁定直到通过审核。' : 'Your verification was submitted successfully. The editable form stays locked during review, and core actions remain blocked until approval.')
      : (isAr ? 'رحلتك الآن: احفظ ملف الشركة، أرفق مستندات التحقق، ثم انتظر المراجعة. عند الموافقة سيظهر Badge المورّد الموثّق وتفتح المزايا الأساسية.' : lang === 'zh' ? '当前路径：先完善公司资料，再上传认证文件并提交，随后等待审核。通过后会显示认证徽章并解锁核心能力。' : 'Your current path: finish the company profile, upload verification documents, submit once, then wait for review. After approval, a verified badge appears and core features unlock.');
  const settingsCtaLabel = supplierState.isUnderReviewStage || supplierState.isApprovedStage
    ? (isAr ? 'حفظ تحديثات الملف' : lang === 'zh' ? '保存资料更新' : 'Save profile updates')
    : profileReadiness.isReadyForVerification
      ? (isAr ? 'احفظ وانتقل للخطوة التالية' : lang === 'zh' ? '保存并进入下一步' : 'Save and go to next step')
      : (isAr ? 'أكمل ملف الشركة' : lang === 'zh' ? '完成公司资料' : 'Complete company profile');
  const settingsPrimaryButtonLabel = savingSettings
    ? t.saving
    : isSettingsDirty
      ? settingsCtaLabel
      : hasSavedSettingsRecord
        ? (isAr ? 'تم الحفظ' : lang === 'zh' ? '已保存' : 'Saved')
        : settingsCtaLabel;
  const settingsSecondaryButtonLabel = savingSettings
    ? t.saving
    : isSettingsDirty
      ? t.saveSettings
      : hasSavedSettingsRecord
        ? (isAr ? 'تم حفظ الملف' : lang === 'zh' ? '资料已保存' : 'Profile saved')
        : t.saveSettings;
  const payoutButtonLabel = savingPayout
    ? t.saving
    : isPayoutDirty
      ? t.savePayout
      : hasSavedPayoutRecord
        ? (isAr ? 'تم حفظ الدفعات' : lang === 'zh' ? '收款资料已保存' : 'Payout saved')
        : t.savePayout;
  const openVerificationFlow = () => {
    setActiveTab('verification');
    // Only adjust the step when navigating from a different tab.
    // Never decrease the current step — the supplier may already be further along
    // (e.g. at step 3 review). Also cap at 2 so we don't skip the review screen.
    if (!isVerificationLocked && activeTab !== 'verification') {
      const target = Math.min(verificationProgress.firstIncompleteStep, 2);
      setVerificationStep(prev => Math.max(prev, target));
    }
  };

  return (
    <div className="dashboard-wrap">

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <div className="dash-header-pad" style={{ background: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 20, fontWeight: 500 }}>{t.tag}</p>
        <h1 style={{ fontSize: isAr ? 34 : 40, fontWeight: 300, ...arFont, color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -1, lineHeight: 1.2, marginBottom: 10 }}>
          {t.welcome} {name}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', marginBottom: 16, lineHeight: 1.7, ...arFont, maxWidth: 420 }}>{t.desc}</p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 11 }}>
            <span style={{ color: 'var(--text-disabled)' }}>{t.supplierStageLabel}</span>
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{getSupplierStageLabel(supplierState.stage, lang)}</strong>
          </span>
          {supplierState.isApprovedStage && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(80,180,120,0.22)', background: 'rgba(80,180,120,0.10)', color: '#8ad1a3', fontSize: 11 }}>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{isAr ? 'مورد موثّق' : lang === 'zh' ? '认证供应商' : 'Verified supplier'}</strong>
            </span>
          )}
          {supplierMaabarId && supplierState.isApprovedStage && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', fontSize: 11 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{t.supplierIdLabel}</span>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{supplierMaabarId}</strong>
            </span>
          )}
        </div>

        {/* Desktop: full flat tab row */}
        <div className="desktop-tab-row">
          {tabs.map(tab => {
            const tabLocked = lockedTabIds.includes(tab.id);
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '10px 18px', background: 'none', border: 'none',
                borderBottom: activeTab === tab.id ? '1px solid var(--text-primary)' : '1px solid transparent',
                color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-disabled)',
                opacity: tabLocked ? 0.72 : 1,
                fontSize: 11, cursor: 'pointer', transition: 'all 0.2s', position: 'relative',
                ...arFont, letterSpacing: lang === 'zh' ? 0 : 1.5,
                textTransform: lang === 'zh' ? 'none' : 'uppercase',
                whiteSpace: 'nowrap', minHeight: 44,
              }}>
                {tab.label}
                {tabLocked && !tab.badge && (
                  <span style={{ marginInlineStart: 6, fontSize: 9, color: 'var(--text-tertiary)', letterSpacing: 0.4 }}>
                    {isAr ? 'مقفل' : lang === 'zh' ? '锁定' : 'Locked'}
                  </span>
                )}
                {tab.badge && (
                  <span style={{ position: 'absolute', top: 6, right: 2, background: 'rgba(224,70,70,0.10)', border: '1px solid rgba(224,70,70,0.28)', color: '#e04646', fontSize: 8, fontWeight: 700, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile: contextual sub-tabs driven by active bottom tab */}
        {(() => {
          const subTabStyle = (active) => ({
            padding: '10px 16px', background: 'none', border: 'none',
            borderBottom: active ? '1px solid var(--text-primary)' : '1px solid transparent',
            color: active ? 'var(--text-primary)' : 'var(--text-disabled)',
            fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
            ...arFont, letterSpacing: lang === 'zh' ? 0 : 1.4,
            textTransform: lang === 'zh' ? 'none' : 'uppercase',
            whiteSpace: 'nowrap', minHeight: 44,
          });
          if (activeBottomTab === 'requests') return (
            <div className="mobile-sub-tabs">
              {[
                { id: 'all',        label: isAr ? 'الكل' : lang === 'zh' ? '全部' : 'All' },
                { id: 'open',       label: isAr ? 'مفتوح' : lang === 'zh' ? '开放中' : 'Open' },
                { id: 'closed',     label: isAr ? 'مغلق' : lang === 'zh' ? '已关闭' : 'Closed' },
                { id: 'high_value', label: isAr ? 'قيمة عالية' : lang === 'zh' ? '高价值' : 'High Value' },
              ].map(s => (
                <button key={s.id} style={subTabStyle(requestStatusFilter === s.id)} onClick={() => setRequestStatusFilter(s.id)}>{s.label}</button>
              ))}
            </div>
          );
          if (activeBottomTab === 'products') return (
            <div className="mobile-sub-tabs">
              {[
                { id: 'all',    label: isAr ? 'الكل' : lang === 'zh' ? '全部' : 'All' },
                { id: 'active', label: isAr ? 'نشط' : lang === 'zh' ? '上架' : 'Active' },
                { id: 'draft',  label: isAr ? 'موقوف' : lang === 'zh' ? '下架' : 'Draft' },
              ].map(s => (
                <button key={s.id} style={subTabStyle(productStatusFilter === s.id)} onClick={() => { setProductStatusFilter(s.id); setActiveTab('my-products'); }}>{s.label}</button>
              ))}
              <button style={subTabStyle(activeTab === 'add-product')} onClick={() => setActiveTab('add-product')}>
                {isAr ? '+ إضافة' : lang === 'zh' ? '+ 添加产品' : '+ Add Product'}
              </button>
            </div>
          );
          if (activeBottomTab === 'messages') return (
            <div className="mobile-sub-tabs">
              {[
                { id: 'all',    label: isAr ? 'الكل' : lang === 'zh' ? '全部' : 'All' },
                { id: 'unread', label: isAr ? 'غير مقروء' : lang === 'zh' ? '未读' : 'Unread' },
                { id: 'archived', label: isAr ? 'مؤرشف' : lang === 'zh' ? '已归档' : 'Archived' },
              ].map(s => (
                <button key={s.id} style={subTabStyle(messageFilter === s.id)} onClick={() => setMessageFilter(s.id)}>{s.label}</button>
              ))}
            </div>
          );
          return null;
        })()}
      </div>

      {/* ══════════════════════════════════════
          CONTENT
      ══════════════════════════════════════ */}
      <div style={{ background: 'var(--bg-base)', minHeight: 'calc(var(--app-dvh) - 280px)' }}>
        <div className="dash-content">

          {isRestrictedSupplierTab && (
            <div style={{ ...section, maxWidth: 760 }}>
              <div style={{
                padding: '28px 28px 24px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(0,0,0,0.08)',
                background: 'var(--bg-subtle)',
              }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10, fontWeight: 500 }}>
                  {isAr ? 'صلاحيات المورد' : lang === 'zh' ? '供应商权限' : 'MAABAR SUPPLIER ACCESS'}
                </p>
                <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 12, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>
                  {verificationLockMessage}
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.9, marginBottom: 18, ...arFont }}>
                  {isAr
                    ? 'هذه الصفحة تبقى مقفلة إلى أن تكتمل عملية التحقق ويتم اعتماد الحساب. حالياً يمكنك استخدام لوحة المورد، إعدادات الملف، ومسار التحقق فقط.'
                    : lang === 'zh'
                      ? '该页面会保持锁定，直到认证完成并且账户通过审核。目前您只能使用供应商控制台、资料设置和认证流程。'
                      : 'This page stays locked until verification is completed and the supplier account is approved. For now, you can use only the supplier dashboard, profile settings, and verification flow.'}
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button onClick={openVerificationFlow} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 36 }}>
                    {supplierState.isUnderReviewStage ? (isAr ? 'عرض حالة التحقق' : lang === 'zh' ? '查看认证状态' : 'View verification status') : t.verificationCtaAction}
                  </button>
                  <button onClick={() => setActiveTab('overview')} className="btn-outline" style={{ fontSize: 11, minHeight: 36 }}>
                    {isAr ? 'العودة للوحة المورد' : lang === 'zh' ? '返回控制台' : 'Back to dashboard'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div style={section}>
              {isOnboardingLimited ? (
                <>
                  <div style={{ marginBottom: 24, padding: '24px 26px', background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ maxWidth: 720 }}>
                        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10, fontWeight: 500 }}>
                          {supplierState.status}
                        </p>
                        <h2 style={{ fontSize: isAr ? 28 : 36, fontWeight: 300, marginBottom: 12, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.6 }}>
                          {verificationStatusHeadline}
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--text-disabled)', lineHeight: 1.8, marginBottom: 16, ...arFont }}>
                          {verificationStatusBody}
                        </p>
                      </div>
                      <div style={{ minWidth: 220, maxWidth: 280, flex: '1 1 220px' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 8, ...arFont }}>{t.onboardingProgress}</p>
                        <p style={{ fontSize: 32, color: 'var(--text-primary)', marginBottom: 6 }}>{profileReadiness.completedRequiredCount}/{profileReadiness.totalRequiredCount}</p>
                        <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'rgba(0,0,0,0.07)', overflow: 'hidden', marginBottom: 10 }}>
                          <div style={{ width: `${supplierState.isUnderReviewStage || supplierState.isApprovedStage ? 100 : profileReadiness.progressPercent}%`, height: '100%', background: 'var(--text-primary)' }} />
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, ...arFont }}>
                          {(supplierState.isUnderReviewStage || supplierState.isApprovedStage ? 100 : profileReadiness.progressPercent)}% · {supplierState.isUnderReviewStage ? (isAr ? 'بانتظار قرار فريق مَعبر' : lang === 'zh' ? '等待 Maabar 团队审核结果' : 'Waiting for Maabar review') : supplierState.isApprovedStage ? (isAr ? 'تم فتح الوصول الكامل' : lang === 'zh' ? '完整访问已解锁' : 'Full access unlocked') : t.onboardingVerificationReady}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <SupplierJourneyStepper steps={supplierJourneySteps} isAr={isAr} lang={lang} />
                  </div>

                  <div style={{ padding: '22px 24px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', marginBottom: 24 }}>
                    <p style={{ fontSize: 10, letterSpacing: 2.8, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>{isAr ? 'الخطوة التالية' : lang === 'zh' ? '下一步' : 'Next step'}</p>
                    <h3 style={{ fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 8, ...arFont }}>
                      {supplierState.isUnderReviewStage
                        ? (isAr ? 'تم إرسال التحقق — راقب حالة المراجعة' : lang === 'zh' ? '认证已提交 — 查看审核状态' : 'Verification submitted — follow the review status')
                        : verificationProgress.firstIncompleteStep === 1
                          ? (isAr ? 'ابدأ بحفظ ملف الشركة ثم انتقل لملفات التحقق' : lang === 'zh' ? '先保存公司资料，再进入认证文件' : 'Save the company profile first, then continue to verification files')
                          : verificationProgress.firstIncompleteStep === 2
                            ? (isAr ? 'أكمل ملفات التحقق ثم راجع الطلب' : lang === 'zh' ? '补全认证文件，然后进入最终确认' : 'Complete the verification files, then review the request')
                            : (isAr ? 'كل شيء جاهز — افتح المراجعة النهائية قبل الإرسال' : lang === 'zh' ? '资料已齐全 — 先打开最终确认，再提交' : 'Everything is ready — open the final review before submitting')}
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16, ...arFont }}>
                      {supplierState.isUnderReviewStage
                        ? (isAr ? 'النموذج مقفل الآن حتى ينتهي فريق مَعبر من المراجعة.' : lang === 'zh' ? '表单在审核完成前会保持锁定。' : 'The form stays locked while the Maabar team reviews your submission.')
                        : verificationProgress.firstIncompleteStep === 1
                          ? (isAr ? 'حفظ الخطوة الأولى يحدّث ملف الشركة فقط، ثم يفتح لك الخطوة الثانية داخل نفس المسار.' : lang === 'zh' ? '保存第 1 步只会更新公司资料，然后会在同一路径中打开第 2 步。' : 'Saving step 1 only updates the company profile, then opens step 2 inside the same flow.')
                          : verificationProgress.firstIncompleteStep === 2
                            ? (isAr ? 'لن يتم إرسال أي شيء بعد. الإرسال الحقيقي يحصل فقط من شاشة المراجعة النهائية.' : lang === 'zh' ? '现在还不会提交。只有在最终确认页点击最后按钮时才会正式送审。' : 'Nothing is submitted yet. The real submission only happens from the final review screen.')
                            : (isAr ? 'راجع الملخص النهائي ثم اضغط زر الإرسال الأخير مرة واحدة.' : lang === 'zh' ? '请先查看最终摘要，再点击最后的提交按钮。' : 'Open the summary screen, check everything, then use the one final submit button.')}
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button onClick={openVerificationFlow} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 36 }}>
                        {supplierState.isUnderReviewStage ? (isAr ? 'عرض حالة التحقق' : lang === 'zh' ? '查看认证状态' : 'View verification status') : t.verificationCtaAction}
                      </button>
                      {!supplierState.isUnderReviewStage && (
                        <button onClick={() => setActiveTab('settings')} className="btn-outline" style={{ fontSize: 11, minHeight: 36 }}>
                          {t.onboardingGoSettings}
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ padding: '22px 24px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-xl)', marginBottom: 24 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, ...arFont }}>{t.onboardingLockedTitle}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-disabled)', lineHeight: 1.8, marginBottom: 14, ...arFont }}>{t.onboardingLockedBody}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {[
                        isAr ? 'الطلبات' : lang === 'zh' ? '需求' : 'Requests',
                        isAr ? 'المنتجات' : lang === 'zh' ? '产品' : 'Products',
                        isAr ? 'العروض' : lang === 'zh' ? '报价' : 'Offers',
                        isAr ? 'الرسائل' : lang === 'zh' ? '消息' : 'Messages',
                        isAr ? 'العينات' : lang === 'zh' ? '样品' : 'Samples',
                      ].map((item) => (
                        <span key={item} style={{ padding: '6px 10px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', fontSize: 11, letterSpacing: 0.3 }}>
                          {item} · {isAr ? 'مقفل' : lang === 'zh' ? '锁定' : 'Locked'}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', fontSize: 11, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase', padding: 0, transition: 'color 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
                    {t.backHome}
                  </button>
                </>
              ) : (
                <>
              {/* ── Supplier identity card ── */}
              <div className="supplier-identity-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h2 style={{ fontSize: isAr ? 22 : 24, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4, ...arFont, letterSpacing: isAr ? 0 : -0.3 }}>
                      {settings.company_name || profile?.company_name || name}
                    </h2>
                    {(settings.city || settings.country) && (
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, ...arFont }}>
                        {[settings.city, settings.country].filter(Boolean).join(', ')}
                      </p>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      {supplierMaabarId && (
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 999, padding: '3px 10px', fontFamily: 'var(--font-sans)', letterSpacing: 0.5 }}>
                          {supplierMaabarId}
                        </span>
                      )}
                      {supplierState.isApprovedStage && (
                        <span style={{ fontSize: 11, color: '#5a9a72', background: 'rgba(80,180,120,0.10)', border: '1px solid rgba(80,180,120,0.22)', borderRadius: 999, padding: '3px 10px', fontWeight: 600, ...arFont }}>
                          {isAr ? '✓ مورد موثّق' : lang === 'zh' ? '✓ 认证供应商' : '✓ Verified'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                    {[
                      { label: isAr ? 'المنتجات' : lang === 'zh' ? '产品' : 'Products', value: stats.products ?? '—' },
                      { label: isAr ? 'العروض' : lang === 'zh' ? '报价' : 'Offers', value: stats.offers ?? '—' },
                      { label: isAr ? 'التقييم' : lang === 'zh' ? '评分' : 'Rating', value: profile?.rating ? `${profile.rating}` : '—' },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1 }}>{value}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 2, letterSpacing: 0.5, textTransform: lang === 'zh' ? 'none' : 'uppercase', ...arFont }}>{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {needsVerification && (
                <div style={{ marginBottom: 32, padding: '20px 24px', background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, ...arFont }}>
                    {t.verificationCtaTitle}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 16, ...arFont, lineHeight: 1.7 }}>
                    {t.verificationCtaBody}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={openVerificationFlow} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 34 }}>{t.verificationCtaAction}</button>
                  </div>
                </div>
              )}
              {needsPayoutSetup && (
                <div style={{ marginBottom: 32, padding: '20px 24px', background: 'rgba(80,180,120,0.06)', border: '1px solid rgba(80,180,120,0.18)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, ...arFont }}>
                    {t.payoutCtaTitle}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 16, ...arFont, lineHeight: 1.7 }}>
                    {t.payoutCtaBody}
                  </p>
                  <button onClick={() => setActiveTab('payout')} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 34 }}>{t.payoutCtaAction}</button>
                </div>
              )}
              {pendingCount > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>
                    {t.needsAttention} ({pendingCount})
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {closedOffers.map((o, i) => (
                      <div key={`closed-${i}`}
                        onClick={() => { setActiveTab('offers'); setTimeout(() => document.getElementById(`offer-${o.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150); }}
                        style={{ background: 'rgba(45,106,79,0.06)', border: '1px solid rgba(45,106,79,0.22)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', cursor: 'pointer', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.78'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#2D6A4F', marginBottom: 3, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                          {isAr ? 'عرضك قُبل — أكّد جاهزيتك' : lang === 'zh' ? '报价已通过 — 请确认就绪' : 'Offer accepted — confirm readiness'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                          {getTitle(o.requests)} · <span style={{ fontVariantNumeric: 'lining-nums' }}>{getOfferEstimatedTotal(o, o.requests).toFixed(2)} USD</span>
                        </p>
                      </div>
                    ))}
                    {paidOffers.map((o, i) => (
                      <div key={`paid-${i}`}
                        onClick={() => { setActiveTab('offers'); setTimeout(() => document.getElementById(`offer-${o.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150); }}
                        style={{ background: 'rgba(139,105,20,0.06)', border: '1px solid rgba(139,105,20,0.22)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', cursor: 'pointer', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.78'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        <p style={{ fontSize: 12, fontWeight: 600, color: '#8B6914', marginBottom: 3, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                          {isAr ? 'الدفعة الأولى وصلت — ابدأ الإنتاج' : lang === 'zh' ? '首付款已到账 — 开始生产' : 'First payment received — start production'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                          {getTitle(o.requests)} · <span style={{ fontVariantNumeric: 'lining-nums' }}>{getOfferEstimatedTotal(o, o.requests).toFixed(2)} USD</span>
                        </p>
                      </div>
                    ))}
                    {rejectedOffers.map((o, i) => (
                      <div key={`rej-${i}`} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 13, color: '#a07070', ...arFont }}>{t.offerRejected}: {getTitle(o.requests)}</p>
                        <button onClick={() => dismissRejected(o.id)} className="btn-outline" style={{ padding: '5px 12px', fontSize: 10, minHeight: 30 }}>{isAr ? 'تجاهل' : lang === 'zh' ? '忽略' : 'Dismiss'}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>{t.stats}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  <StatCard label={t.offersCount}   value={stats.offers}   onClick={() => setActiveTab('offers')} />
                  <StatCard label={t.productsCount} value={stats.products} onClick={() => setActiveTab('my-products')} />
                  <StatCard label={t.messagesCount} value={stats.messages} onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
                </div>
                {/* Extended Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginTop: 10 }}>
                  <StatCard
                    label={isAr ? 'إجمالي المبيعات' : lang === 'zh' ? '总销售额 (SAR)' : 'Total Sales (SAR)'}
                    value={stats.totalSales ? `${stats.totalSales.toLocaleString()} ` : '—'}
                    onClick={() => {}}
                  />
                  <StatCard
                    label={isAr ? 'نسبة قبول العروض' : lang === 'zh' ? '报价接受率' : 'Offer Accept Rate'}
                    value={stats.offers > 0 ? `${Math.round((stats.acceptedOffers || 0) / stats.offers * 100)}%` : '—'}
                    onClick={() => setActiveTab('offers')}
                  />
                  <StatCard
                    label={isAr ? 'طلبات المشترين المفتوحة' : lang === 'zh' ? '买家的开放需求' : 'Open Buyer Requests'}
                    value={stats.matchingRequests || '—'}
                    onClick={() => setActiveTab('managed-matches')}
                    highlight={(stats.matchingRequests || 0) > 0}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>{t.quickActions}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  <QuickAction title={isAr ? 'طلبات المشترين المفتوحة' : lang === 'zh' ? '买家的开放需求' : 'Open buyer requests'} onClick={() => setActiveTab('managed-matches')} primary isAr={isAr} />
                  <QuickAction title={t.myProducts}     onClick={() => setActiveTab('my-products')} isAr={isAr} />
                  <QuickAction title={t.addNewProduct}  onClick={() => setActiveTab('add-product')} isAr={isAr} />
                </div>
              </div>

              <button onClick={() => nav('/')} style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', fontSize: 11, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase', padding: 0, transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
                {t.backHome}
              </button>
                </>
              )}
            </div>
          )}

          {/* ── MANAGED MATCHES ── */}
          {!isRestrictedSupplierTab && activeTab === 'managed-matches' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 24, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'الطلبات المطابقة لك' : lang === 'zh' ? '匹配给您的需求' : 'Matched requests for you'}
              </h2>
              <ManagedSupplierMatchesPanel
                lang={lang}
                matches={managedMatches}
                activeGroup={managedMatchGroup}
                onChangeGroup={setManagedMatchGroup}
                offerForms={managedOfferForms}
                setOfferForms={setManagedOfferForms}
                offerDrafts={managedOfferDrafts}
                setOfferDrafts={setManagedOfferDrafts}
                submittingOfferId={submittingOfferId}
                onSubmitOffer={submitManagedMatchOffer}
                onDeclineMatch={declineManagedMatch}
              />
            </div>
          )}

          {/* ── REQUESTS ── */}
          {!isRestrictedSupplierTab && activeTab === 'requests' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 24, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'طلبات التجار' : lang === 'zh' ? '采购需求' : 'Trader Requests'}
              </h2>
              <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
                {cats.map(c => (
                  <button key={c.val} onClick={() => setActiveCat(c.val)} style={{ padding: '6px 14px', fontSize: 12, borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s', background: activeCat === c.val ? 'var(--bg-raised)' : 'transparent', color: activeCat === c.val ? 'var(--text-primary)' : 'var(--text-disabled)', border: '1px solid', borderColor: activeCat === c.val ? 'var(--border-muted)' : 'var(--border-subtle)', ...arFont, minHeight: 32 }}>{c.label}</button>
                ))}
              </div>

              {loadingRequests && [1, 2, 3].map(i => <SkeletonCard key={i} />)}
              {!loadingRequests && requests.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0' }}><p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{isAr ? 'لا توجد طلبات' : lang === 'zh' ? '暂无需求' : 'No requests'}</p></div>}

              {!loadingRequests && requests.map(r => (
                <div key={r.id} style={{ marginBottom: offerForms[r.id] ? 0 : 10 }}>
                  <div style={{ border: '1px solid var(--border-subtle)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, background: 'var(--bg-subtle)', transition: 'all 0.15s', borderRadius: offerForms[r.id] ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-muted)'; e.currentTarget.style.background = 'var(--bg-muted)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className={`status-badge ${r.status === 'offers_received' ? 'status-pending' : 'status-open'}`}>
                          {r.status === 'offers_received'
                            ? (isAr ? 'وصلته عروض' : lang === 'zh' ? '已有报价' : 'Offers received')
                            : (isAr ? 'مفتوح' : lang === 'zh' ? '开放中' : 'Open')}
                        </span>
                        {r.category && r.category !== 'other' && <span style={{ fontSize: 10, padding: '2px 8px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 20, color: 'var(--text-disabled)' }}>{cats.find(c => c.val === r.category)?.label || r.category}</span>}
                        <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>{fmtDate(r.created_at)}</span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)', ...arFont }}>{getTitle(r)}</h3>
                      <div style={{ display: 'flex', gap: 16, color: 'var(--text-disabled)', fontSize: 12, flexWrap: 'wrap' }}>
                        <span>{r.profiles?.full_name || r.profiles?.company_name || (isAr ? 'تاجر' : lang === 'zh' ? '采购商' : 'Trader')}</span>
                        <span>{r.quantity || '—'}</span>
                        {(() => {
                          const desc = lang === 'zh'
                            ? (r.description_zh || r.description_en || r.description_ar || r.description)
                            : lang === 'en'
                              ? (r.description_en || r.description_ar || r.description)
                              : (r.description_ar || r.description);
                          return desc ? <span>{desc.substring(0, 55)}…</span> : null;
                        })()}
                      </div>
                    </div>
                    <button className="btn-outline" onClick={() => setSelectedRequest(r)} style={{ minHeight: 38, whiteSpace: 'nowrap' }}>
  {isAr ? 'التفاصيل' : lang === 'zh' ? '详情' : 'Details'}
</button>
                    <button className="btn-dark-sm" onClick={() => toggleOfferForm(r.id)} style={{ minHeight: 38, whiteSpace: 'nowrap' }}>
                      {offerForms[r.id] ? (isAr ? 'إغلاق' : lang === 'zh' ? '关闭' : 'Close') : (isAr ? 'قدم عرضك' : lang === 'zh' ? '提交报价' : 'Submit Quote')}
                    </button>
                  </div>

                  {offerForms[r.id] && (
                    <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '18px 22px', marginBottom: 10, borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                      {(r.budget_per_unit || r.payment_plan || r.sample_requirement) && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                          {r.budget_per_unit && <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-disabled)' }}>{isAr ? `ميزانية تقريبية: ${r.budget_per_unit} SAR` : lang === 'zh' ? `预算参考：${r.budget_per_unit} 沙特里亚尔（SAR）` : `Budget hint: ${r.budget_per_unit} SAR (Saudi Riyal)`}</span>}
                          {r.payment_plan && <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-disabled)' }}>{isAr ? `خطة الدفع: ${r.payment_plan}%` : lang === 'zh' ? `付款计划：${r.payment_plan}% 定金，${100 - r.payment_plan}% 发货前` : `Payment plan: ${r.payment_plan}%`}</span>}
                          {r.sample_requirement && <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-disabled)' }}>{isAr ? `العينة: ${r.sample_requirement === 'required' ? 'إلزامية' : r.sample_requirement === 'preferred' ? 'مفضلة' : 'غير مطلوبة'}` : lang === 'zh' ? `样品：${r.sample_requirement === 'required' ? '必须提供' : r.sample_requirement === 'preferred' ? '建议提供' : '无需样品'}` : `Sample: ${r.sample_requirement === 'required' ? 'Required' : r.sample_requirement === 'preferred' ? 'Preferred' : 'Not needed'}`}</span>}
                        </div>
                      )}
                      <div className="form-grid">
                        <div className="form-group">
                          <label className="form-label">{isAr ? 'سعر الوحدة / المنتج (USD) *' : lang === 'zh' ? '产品单价 (USD) *' : 'Product / Unit Price (USD) *'}</label>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                className="form-input"
                                type="number"
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
                                {lang === 'ar' ? `≈ ${(parseFloat(offers[r.id]?.price || 0) * (usdRate || 3.75)).toFixed(2)} ﷼` : lang === 'zh' ? `≈ ${(parseFloat(offers[r.id]?.price || 0) * (cnyRate || 7.25)).toFixed(2)} ¥` : null}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">{isAr ? 'تكلفة الشحن (USD) *' : lang === 'zh' ? '运费 (USD) *' : 'Shipping Cost (USD) *'}</label>
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <div style={{ position: 'relative', flex: 1 }}>
                              <input
                                className="form-input"
                                type="number"
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
                                {lang === 'ar' ? `≈ ${(parseFloat(offers[r.id]?.shippingCost || 0) * (usdRate || 3.75)).toFixed(2)} ﷼` : lang === 'zh' ? `≈ ${(parseFloat(offers[r.id]?.shippingCost || 0) * (cnyRate || 7.25)).toFixed(2)} ¥` : null}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="form-group">
                          <label className="form-label">{isAr ? 'طريقة الشحن' : lang === 'zh' ? '运输方式' : 'Shipping Method'}</label>
                          <input
                            className="form-input"
                            placeholder={isAr ? 'مثال: بحري / جوي / FOB' : lang === 'zh' ? '例如：海运 / 空运 / FOB' : 'e.g. Sea / Air / FOB'}
                            value={offers[r.id]?.shippingMethod || ''}
                            onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], shippingMethod: e.target.value } }))}
                          />
                        </div>
                        {[[isAr ? 'MOQ *' : lang === 'zh' ? '最小起订量 *' : 'MOQ *', 'moq'], [isAr ? 'مدة التسليم (أيام) *' : lang === 'zh' ? '交期（天）*' : 'Delivery Days *', 'days', 'number'], [isAr ? 'بلد المنشأ' : lang === 'zh' ? '原产地' : 'Origin', 'origin']].map(([label, key, type]) => (
                          <div key={key} className="form-group">
                            <label className="form-label">{label}</label>
                            <input className="form-input" type={type || 'text'} value={offers[r.id]?.[key] || (key === 'origin' ? 'China' : '')} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], [key]: e.target.value } }))} />
                          </div>
                        ))}
                      </div>
                      <div className="form-group">
                        <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'ملاحظة' : lang === 'zh' ? '备注' : 'Note'}</label>
                        <textarea className="form-input" rows={2} style={{ resize: 'none' }} value={offers[r.id]?.note || ''} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], note: e.target.value } }))} />
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
                        <button className="btn-dark-sm" onClick={() => submitOffer(r.id, r.buyer_id)} disabled={submittingOfferId === r.id} style={{ minHeight: 40, opacity: submittingOfferId === r.id ? 0.7 : 1 }}>{submittingOfferId === r.id ? (isAr ? 'جاري الإرسال...' : lang === 'zh' ? '发送中...' : 'Sending...') : (isAr ? 'إرسال العرض' : lang === 'zh' ? '发送报价' : 'Send Offer')}</button>
                        <button className="btn-outline" onClick={() => toggleOfferForm(r.id)} style={{ minHeight: 40 }}>{t.cancel}</button>
                        <span style={{ fontSize: 11, color: 'var(--text-disabled)', display: 'flex', alignItems: 'center', gap: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          {isAr ? 'يراه التاجر فقط — سعرك سري' : lang === 'zh' ? '仅买家可见 — 您的报价保密' : 'Only the buyer sees this — your price is private'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── MY PRODUCTS ── */}
          {!isRestrictedSupplierTab && activeTab === 'my-products' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 32 }}>
                <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.myProductsTitle}</h2>
                <button className="btn-dark-sm" onClick={() => setActiveTab('add-product')} style={{ fontSize: 11, minHeight: 36 }}>{isAr ? '+ إضافة' : lang === 'zh' ? '+ 添加' : '+ Add'}</button>
              </div>

              {loadingProducts && [1, 2, 3].map(i => <SkeletonCard key={i} />)}
              {!loadingProducts && myProducts.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 14, marginBottom: 24, ...arFont }}>{t.noProducts}</p>
                  <button className="btn-dark-sm" onClick={() => setActiveTab('add-product')} style={{ minHeight: 40 }}>{t.addNewProduct}</button>
                </div>
              )}

              {!loadingProducts && myProducts.map((p, idx) => (
                <div key={p.id}>
                  {editingProduct?.id === p.id ? (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0', animation: 'fadeIn 0.3s ease' }}>
                      {editProductComposerStep === 'preview' ? (
                        <ProductPreviewPanel product={normalizeProductDraftMedia(editingProduct)} onPublish={updateProduct} onBack={() => setEditProductComposerStep('edit')} t={t} isAr={isAr} saving={saving} lang={lang} />
                      ) : (
                        <ProductForm data={editingProduct} setData={setEditingProduct} onSave={updateProduct} onPreview={openEditProductPreview} showPreviewAction onCancel={() => { setEditingProduct(null); setEditProductComposerStep('edit'); }} imgRef={editImageRef} vidRef={editVideoRef} onImgChange={e => handleImageUpload(e, true)} onVidChange={e => handleVideoUpload(e, true)} onRemoveImage={index => removeImageAt(index, true)} onRemoveVideo={() => removeVideo(true)} uploadingImage={uploadingImage} uploadingVideo={uploadingVideo} t={t} isAr={isAr} saving={saving} usdRate={usdRate} categories={cats} lang={lang} />
                      )}
                    </div>
                  ) : (
                    <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '16px 0', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', animation: `fadeIn 0.35s ease ${idx * 0.04}s both` }}>
                      <div style={{ width: 60, height: 60, borderRadius: 'var(--radius-lg)', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {getPrimaryProductImage(p) ? <img src={getPrimaryProductImage(p)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 20, opacity: 0.25 }}>◻</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 140 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', ...arFont }}>{lang === 'zh' ? p.name_zh || p.name_en : lang === 'ar' ? p.name_ar || p.name_en : p.name_en || p.name_ar}</p>
                          {getProductGalleryImages(p).length > 1 && <span style={{ fontSize: 9, padding: '2px 7px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>{lang === 'zh' ? `${getProductGalleryImages(p).length} 图` : `${getProductGalleryImages(p).length} IMG`}</span>}
                          {p.video_url && <span style={{ fontSize: 9, padding: '2px 7px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>{lang === 'zh' ? '视频' : 'VIDEO'}</span>}
                          {p.sample_available && <span style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', borderRadius: 10, color: '#5a9a72', letterSpacing: 0.5 }}>{isAr ? 'عينة' : lang === 'zh' ? '样品' : 'SAMPLE'}</span>}
                          {p.category && p.category !== 'other' && <span style={{ fontSize: 9, padding: '2px 7px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>{cats.find(c => c.val === p.category)?.label || p.category}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{p.price_from} {p.currency || 'USD'} · {isAr ? 'MOQ' : lang === 'zh' ? '最小起订量' : 'MOQ'}: {p.moq}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 20, border: '1px solid', borderColor: p.is_active ? 'rgba(58,122,82,0.3)' : 'var(--border-subtle)', color: p.is_active ? '#5a9a72' : 'var(--text-disabled)', background: p.is_active ? 'rgba(58,122,82,0.08)' : 'transparent' }}>{p.is_active ? t.active : t.inactive}</span>
                        <button onClick={() => toggleProductActive(p)} className="btn-outline" style={{ padding: '5px 10px', fontSize: 10, minHeight: 28 }}>{t.toggleActive}</button>
                        <button onClick={() => { setEditingProduct(normalizeProductDraftMedia(p)); setEditProductComposerStep('edit'); setProductSaveMsg(''); }} className="btn-outline" style={{ padding: '5px 10px', fontSize: 10, minHeight: 28 }}>{t.edit}</button>
                        <button onClick={() => deleteProduct(p.id)} style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '5px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 28 }}>{t.delete}</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── MY OFFERS ── */}
          {!isRestrictedSupplierTab && activeTab === 'offers' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.myOffers}</h2>

              {loadingOffers && [1, 2, 3].map(i => <SkeletonCard key={i} />)}
              {!loadingOffers && myOffers.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-disabled)', marginBottom: 24, ...arFont }}>{t.noOffers}</p>
                  <button className="btn-dark-sm" onClick={() => setActiveTab('requests')} style={{ minHeight: 40 }}>{t.browseReqs}</button>
                </div>
              )}

              {!loadingOffers && myOffers.map((o, idx) => {
                const reqStatus  = o.requests?.status || '';
                const isAccepted = o.status === 'accepted';
                const isPending  = o.status === 'pending';
                const step       = isAccepted ? (SUPPLIER_STEP_MAP[reqStatus] ?? 0) : 0;
                const isComplete = completedPayments.has(o.request_id);
                const buyerName  = o.requests?.profiles?.company_name || o.requests?.profiles?.full_name || '—';
                const category   = o.requests?.category;
                const total      = getOfferEstimatedTotal(o, o.requests);
                const isShipping = ['shipping', 'arrived', 'delivered'].includes(reqStatus);
                return (
                  <div key={o.id} id={`offer-${o.id}`} style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0', animation: `fadeIn 0.35s ease ${idx * 0.04}s both` }}>

                    {/* ── Section 1: category tag + time, then title ── */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                        {category && (
                          <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--border-subtle)', color: 'var(--text-disabled)' }}>
                            {category}
                          </span>
                        )}
                        {o.created_at && (
                          <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{relativeTime(o.created_at)}</span>
                        )}
                      </div>
                      {!isAccepted && (
                        <span style={{ fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, border: '1px solid', borderColor: o.status === 'rejected' ? 'rgba(138,58,58,0.3)' : 'var(--border-subtle)', color: o.status === 'rejected' ? '#a07070' : 'var(--text-disabled)' }}>
                          {OFFER_STATUS[lang]?.[o.status] || o.status}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 10, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)', lineHeight: 1.4 }}>{getTitle(o.requests)}</h3>

                    {/* ── Section 2: buyer name + verified badge (accepted only) ── */}
                    {isAccepted && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>{buyerName}</span>
                        <span style={{ fontSize: 10, color: '#2D6A4F', background: 'rgba(45,106,79,0.08)', border: '1px solid rgba(45,106,79,0.22)', borderRadius: 999, padding: '2px 8px', fontWeight: 600, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                          {isAr ? 'موثّق' : lang === 'zh' ? '认证' : 'Verified'}
                        </span>
                      </div>
                    )}

                    {/* ── 6-step status timeline (accepted only) ── */}
                    {isAccepted && <SupplierStatusTimeline step={step} />}

                    {/* ── Payment pills (accepted only) ── */}
                    {isAccepted && <SupplierPaymentPills requestStatus={reqStatus} paymentPlan={o.requests?.payment_plan} />}

                    {/* ── Price grid ── */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 14 }}>
                      <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'سعر الوحدة' : lang === 'zh' ? '单价' : 'Unit Price'}</p>
                        <p style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1, fontVariantNumeric: 'lining-nums' }}>
                          {parseFloat(o.price || 0).toFixed(2)} <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>USD</span>
                        </p>
                        {hasOfferShippingCost(o) && (
                          <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 3 }}>
                            {isAr ? 'شحن: ' : lang === 'zh' ? '运费：' : 'Ship: '}<span style={{ fontVariantNumeric: 'lining-nums' }}>{getOfferShippingCost(o).toFixed(2)}</span>
                          </p>
                        )}
                      </div>
                      {isAccepted && o.requests?.quantity && (
                        <div style={{ padding: '10px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                          <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الكمية' : lang === 'zh' ? '数量' : 'Quantity'}</p>
                          <p style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1, fontVariantNumeric: 'lining-nums' }}>{o.requests.quantity}</p>
                        </div>
                      )}
                      <div style={{ padding: '10px 14px', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الإجمالي التقديري' : lang === 'zh' ? '预计总额' : 'Est. Total'}</p>
                        <p style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1, fontVariantNumeric: 'lining-nums' }}>
                          {total.toFixed(2)} <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>USD</span>
                        </p>
                        {o.moq && <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 3 }}>MOQ {o.moq} · {o.delivery_days}{isAr ? ' يوم' : lang === 'zh' ? ' 天' : 'd'}{o.origin ? ` · ${o.origin}` : ''}</p>}
                      </div>
                    </div>

                    {/* ── Section 5: payment plan (accepted only) ── */}
                    {isAccepted && o.requests?.payment_plan && (
                      <div style={{ marginBottom: 14, padding: '10px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 3 }}>{isAr ? 'خطة الدفع' : lang === 'zh' ? '付款计划' : 'Payment Plan'}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-primary)', fontVariantNumeric: 'lining-nums', fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                          {isAr
                            ? `${o.requests.payment_plan}٪ مقدم + ${100 - o.requests.payment_plan}٪ عند الشحن`
                            : lang === 'zh'
                              ? `${o.requests.payment_plan}% 定金 + ${100 - o.requests.payment_plan}% 发货前`
                              : `${o.requests.payment_plan}% upfront + ${100 - o.requests.payment_plan}% on shipping`}
                        </p>
                      </div>
                    )}

                    {/* ── Section 6: shipment details (shipping / arrived / delivered only) ── */}
                    {isAccepted && isShipping && o.requests?.tracking_number && (
                      <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                          {isAr ? 'تفاصيل الشحنة' : lang === 'zh' ? '物流信息' : 'Shipment'}
                        </p>
                        {o.requests?.shipping_company && (
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                            {isAr ? 'شركة الشحن: ' : lang === 'zh' ? '承运商：' : 'Carrier: '}{o.requests.shipping_company}
                          </p>
                        )}
                        <p style={{ fontSize: 12, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-disabled)' }}>{isAr ? 'رقم التتبع: ' : lang === 'zh' ? '追踪号：' : 'Tracking: '}</span>
                          {o.requests.tracking_number}
                        </p>
                        {(() => {
                          const etaDate = o.requests?.estimated_delivery
                            ? new Date(o.requests.estimated_delivery)
                            : o.delivery_days && o.updated_at
                              ? (() => { const d = new Date(o.updated_at); d.setDate(d.getDate() + Number(o.delivery_days)); return d; })()
                              : null;
                          return etaDate ? (
                            <p style={{ fontSize: 11, color: 'var(--text-disabled)', fontVariantNumeric: 'lining-nums' }}>
                              {isAr ? 'التسليم المتوقع: ' : lang === 'zh' ? '预计到达：' : 'ETA: '}
                              {etaDate.toLocaleDateString(isAr ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : 'en-US')}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    )}

                    {/* ── Action area ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

                      {/* Pending offer: edit / cancel / delete */}
                      {isPending && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => {
                              setEditOfferModal(o);
                              setEditOfferForm({
                                price: String(o.price ?? ''),
                                shippingCost: o.shipping_cost === null || o.shipping_cost === undefined ? '' : String(o.shipping_cost),
                                shippingMethod: o.shipping_method || '',
                                moq: o.moq || '',
                                days: String(o.delivery_days ?? ''),
                                origin: o.origin || 'China',
                                note: o.note || '',
                              });
                            }}
                            className="btn-outline"
                            style={{ padding: '5px 12px', fontSize: 11, minHeight: 32 }}>
                            {t.edit}
                          </button>
                          <button onClick={() => cancelOffer(o)} style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '5px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 32 }}>
                            {isAr ? 'إلغاء العرض' : lang === 'zh' ? '取消报价' : 'Cancel Offer'}
                          </button>
                          <button onClick={() => deleteOffer(o)} style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '5px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 32 }}>
                            {t.delete}
                          </button>
                        </div>
                      )}

                      {/* Section 7a: accepted (closed) — supplier confirms readiness */}
                      {isAccepted && reqStatus === 'closed' && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            className="btn-primary"
                            style={{ minHeight: 40, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)', fontSize: 13 }}
                            onClick={async () => {
                              await sb.from('requests').update({ status: 'supplier_confirmed' }).eq('id', o.request_id);
                              await sb.from('notifications').insert({
                                user_id: o.requests.buyer_id,
                                type: 'supplier_confirmed',
                                title_ar: 'المورد جاهز — يمكنك الآن إتمام الدفع',
                                title_en: 'Supplier is ready — you can now complete payment',
                                title_zh: '供应商已准备好 — 您现在可以付款',
                                ref_id: o.request_id,
                                is_read: false,
                              });
                              loadMyOffers();
                            }}>
                            {isAr ? 'جاهز للمتابعة — أبلغ التاجر' : lang === 'zh' ? '已就绪 — 通知买家' : 'Ready — notify buyer'}
                          </button>
                          {o.requests?.buyer_id && (
                            <button className="btn-outline" onClick={() => nav(`/chat/${o.requests.buyer_id}`)} style={{ minHeight: 40, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                              {t.contactTrader}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Section 7a: supplier_confirmed — waiting for buyer first payment */}
                      {isAccepted && reqStatus === 'supplier_confirmed' && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <p style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)', flex: 1 }}>
                            {isAr ? 'في انتظار دفع التاجر' : lang === 'zh' ? '等待买家付款' : 'Awaiting buyer payment'}
                          </p>
                          {o.requests?.buyer_id && (
                            <button className="btn-outline" onClick={() => nav(`/chat/${o.requests.buyer_id}`)} style={{ minHeight: 38, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                              {t.contactTrader}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Section 7b: paid — first payment received, add tracking */}
                      {isAccepted && reqStatus === 'paid' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <div style={{ padding: '14px 16px', background: 'rgba(45,106,79,0.05)', border: '1px solid rgba(45,106,79,0.20)', borderRadius: 'var(--radius-lg)' }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: '#2D6A4F', marginBottom: 10, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                              {isAr ? 'جاهز للشحن — أضف رقم التتبع' : lang === 'zh' ? '准备发货 — 添加追踪号' : 'Ready to ship — add tracking number'}
                            </p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <select
                                value={shippingCompany}
                                onChange={e => setShippingCompany(e.target.value)}
                                style={{ padding: '8px 12px', fontSize: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', outline: 'none', minHeight: 38 }}>
                                {['DHL','FedEx','Aramex','UPS','SMSA', isAr ? 'أخرى' : lang === 'zh' ? '其他' : 'Other'].map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                              <input className="form-input" style={{ flex: 1, minWidth: 120 }} placeholder={t.trackingNum} value={trackingInputs[o.request_id] || ''} onChange={e => setTrackingInputs(prev => ({ ...prev, [o.request_id]: e.target.value }))} dir="ltr" />
                              <button className="btn-dark-sm" onClick={() => submitTracking(o.request_id, o.requests?.buyer_id, o.delivery_days)} style={{ minHeight: 38 }}>{t.send}</button>
                            </div>
                          </div>
                          {o.requests?.buyer_id && (
                            <button className="btn-outline" onClick={() => nav(`/chat/${o.requests.buyer_id}`)} style={{ minHeight: 38, alignSelf: 'flex-start', fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                              {t.contactTrader}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Section 7b: ready_to_ship — tracking not yet submitted */}
                      {isAccepted && reqStatus === 'ready_to_ship' && !o.requests?.tracking_number && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <select
                            value={shippingCompany}
                            onChange={e => setShippingCompany(e.target.value)}
                            style={{ padding: '8px 12px', fontSize: 12, border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', color: 'var(--text-secondary)', borderRadius: 'var(--radius-md)', cursor: 'pointer', outline: 'none', minHeight: 38 }}>
                            {['DHL','FedEx','Aramex','UPS','SMSA', isAr ? 'أخرى' : lang === 'zh' ? '其他' : 'Other'].map(c => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                          <input className="form-input" style={{ flex: 1, minWidth: 120 }} placeholder={t.trackingNum} value={trackingInputs[o.request_id] || ''} onChange={e => setTrackingInputs(prev => ({ ...prev, [o.request_id]: e.target.value }))} dir="ltr" />
                          <button className="btn-dark-sm" onClick={() => submitTracking(o.request_id, o.requests?.buyer_id, o.delivery_days)} style={{ minHeight: 38 }}>{t.send}</button>
                        </div>
                      )}

                      {/* Section 7c: shipping — awaiting second payment */}
                      {isAccepted && reqStatus === 'shipping' && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                          <p style={{ fontSize: 12, color: '#8B6914', fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)', flex: 1 }}>
                            {isAr ? 'في انتظار دفعة التاجر الثانية' : lang === 'zh' ? '等待买家支付尾款' : 'Awaiting second payment from buyer'}
                          </p>
                          {o.requests?.buyer_id && (
                            <button className="btn-outline" onClick={() => nav(`/chat/${o.requests.buyer_id}`)} style={{ minHeight: 38, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                              {t.contactTrader}
                            </button>
                          )}
                        </div>
                      )}

                      {/* Section 7d: arrived / delivered — order complete, no button */}
                      {isAccepted && ['arrived', 'delivered'].includes(reqStatus) && (
                        <p style={{ fontSize: 13, color: '#2D6A4F', fontWeight: 600, fontFamily: isAr ? "'Tajawal', sans-serif" : 'var(--font-sans)' }}>
                          {isAr ? '✓ الطلب مكتمل — تم تحويل كامل المبلغ' : lang === 'zh' ? '✓ 订单已完成 — 全款已转账' : '✓ Order complete — full amount transferred'}
                        </p>
                      )}

                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {!isRestrictedSupplierTab && activeTab === 'messages' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.messagesTitle}</h2>
              {inbox.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 13, ...arFont }}>{t.noMessages}</p>
                </div>
              ) : inbox.map((m, idx) => {
                const senderName = m.profiles?.full_name || m.profiles?.company_name || '—';
                return (
                  <div key={m.id} onClick={() => nav(`/chat/${m.sender_id}`)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderTop: '1px solid var(--border-subtle)', cursor: 'pointer', transition: 'opacity 0.15s', animation: `fadeIn 0.35s ease ${idx * 0.04}s both`, minHeight: 56 }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <div className="avatar">{senderName.charAt(0).toUpperCase()}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>{senderName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>{m.content}</p>
                    </div>
                    {!m.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, opacity: 0.8 }} />}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── ADD PRODUCT ── */}
          {/* ── SAMPLES ── */}
          {!isRestrictedSupplierTab && activeTab === 'samples' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'طلبات العينات' : lang === 'zh' ? '样品请求' : 'Sample Requests'}
              </h2>
              {samples.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{isAr ? 'لا توجد طلبات عينات بعد' : lang === 'zh' ? '暂无样品申请' : 'No sample requests yet'}</p>
                </div>
              ) : samples.map((s, idx) => (
                <div key={s.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 0', animation: `fadeIn 0.35s ease ${idx*0.04}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, ...arFont }}>
                        {lang === 'zh' ? s.products?.name_zh : lang === 'ar' ? s.products?.name_ar : s.products?.name_en}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 4 }}>
                        {s.profiles?.company_name || s.profiles?.full_name || '—'} · {isAr ? `الكمية: ${s.quantity}` : lang === 'zh' ? `数量：${s.quantity}` : `Qty: ${s.quantity}`}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
                        {s.sample_price} SAR {isAr ? '+ شحن' : lang === 'zh' ? '+ 运费' : '+ shipping'} {s.shipping_price} SAR
                      </p>
                      {s.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, ...arFont }}>{s.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, border: '1px solid', borderColor: s.status==='approved' ? 'rgba(58,122,82,0.3)' : s.status==='rejected' ? 'rgba(138,58,58,0.3)' : 'var(--border-subtle)', color: s.status==='approved' ? '#5a9a72' : s.status==='rejected' ? '#a07070' : 'var(--text-disabled)' }}>
                        {s.status === 'approved' ? (isAr ? 'مقبول' : lang === 'zh' ? '已通过' : 'Approved') : s.status === 'rejected' ? (isAr ? 'مرفوض' : lang === 'zh' ? '已拒绝' : 'Rejected') : (isAr ? 'قيد المراجعة' : lang === 'zh' ? '审核中' : 'Pending')}
                      </span>
                      {s.status === 'pending' && <>
                        <button onClick={() => updateSampleStatus(s.id, 'approved')} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 28, padding: '4px 12px' }}>{isAr ? 'قبول' : lang === 'zh' ? '通过' : 'Approve'}</button>
                        <button onClick={() => updateSampleStatus(s.id, 'rejected')} style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '4px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 28 }}>{isAr ? 'رفض' : lang === 'zh' ? '拒绝' : 'Reject'}</button>
                      </>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PRODUCT INQUIRIES ── */}
          {!isRestrictedSupplierTab && activeTab === 'product-inquiries' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 14, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'استفسارات المنتجات' : lang === 'zh' ? '产品咨询' : 'Product Inquiries'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 28, maxWidth: 760, ...arFont }}>
                {isAr
                  ? 'هذه الاستفسارات تأتي مباشرة من صفحات المنتجات الجاهزة. ردك هنا يُحفظ داخل النظام ويُرسل أيضًا إلى بريد المشتري.'
                  : lang === 'zh'
                    ? '这些咨询直接来自现货产品页面。您在这里的回复会保存到系统内，并同步发送到买家邮箱。'
                    : 'These inquiries come directly from ready-product pages. Your reply here is saved inside the system and also emailed to the buyer.'}
              </p>

              {productInquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{isAr ? 'لا توجد استفسارات منتجات بعد' : lang === 'zh' ? '暂时没有产品咨询' : 'No product inquiries yet'}</p>
                </div>
              ) : productInquiries.map((inquiry, idx) => {
                const buyerName = inquiry.profiles?.company_name || inquiry.profiles?.full_name || (isAr ? 'تاجر' : lang === 'zh' ? '买家' : 'Buyer');
                const productName = getProductInquiryProductName(inquiry.products, lang);
                const statusLabel = getProductInquiryStatusLabel(inquiry.status, lang, 'supplier');
                const replies = inquiry.product_inquiry_replies || [];
                const lastReply = replies[replies.length - 1] || null;
                return (
                  <div key={inquiry.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '22px 0', animation: `fadeIn 0.35s ease ${idx * 0.04}s both` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, ...arFont }}>{productName}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 4 }}>{buyerName}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.8, margin: 0, ...arFont }}>
                          {translatedInquiries[inquiry.id] || inquiry.question_text}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAr ? 'flex-start' : 'flex-end', gap: 6 }}>
                        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border-subtle)', color: inquiry.status === 'answered' ? '#5a9a72' : 'var(--text-secondary)' }}>
                          {statusLabel}
                        </span>
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', margin: 0 }}>{new Date(inquiry.updated_at || inquiry.created_at).toLocaleDateString(isAr ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : 'en-US')}</p>
                      </div>
                    </div>

                    {lastReply && (
                      <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                        <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
                          {isAr ? 'آخر رد محفوظ' : lang === 'zh' ? '最近回复' : 'Latest saved reply'}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, ...arFont }}>{lastReply.message}</p>
                      </div>
                    )}

                    <div className="form-group" style={{ marginBottom: 12 }}>
                      <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'رد المورد' : lang === 'zh' ? '供应商回复' : 'Supplier Reply'}</label>
                      <textarea
                        className="form-input"
                        rows={3}
                        style={{ resize: 'vertical' }}
                        value={inquiryReplies[inquiry.id] || ''}
                        onChange={(event) => setInquiryReplies((current) => ({ ...current, [inquiry.id]: event.target.value }))}
                        placeholder={isAr ? 'اكتب الرد الذي سيظهر للمشتري داخل مَعبر ويصل إلى بريده' : lang === 'zh' ? '输入将保存到系统并同步发送到买家邮箱的回复' : 'Write the reply that will be saved in-system and emailed to the buyer'}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button className="btn-dark-sm" onClick={() => submitInquiryReply(inquiry)} disabled={replyingInquiryId === inquiry.id}>
                        {replyingInquiryId === inquiry.id ? '...' : isAr ? 'إرسال الرد ←' : lang === 'zh' ? '发送回复 →' : 'Send Reply →'}
                      </button>
                      {inquiry.buyer_id && (
                        <button className="btn-outline" onClick={() => nav(`/chat/${inquiry.buyer_id}`)}>
                          {isAr ? 'فتح محادثة التاجر' : lang === 'zh' ? '打开买家聊天' : 'Open Buyer Chat'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── REVIEWS ── */}
          {!isRestrictedSupplierTab && activeTab === 'reviews' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'تقييماتي' : lang === 'zh' ? '我的评价' : 'My Reviews'}
              </h2>
              {myReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{isAr ? 'لا توجد تقييمات بعد' : lang === 'zh' ? '暂时没有评价' : 'No reviews yet'}</p>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 32 }}>
                    <p style={{ fontSize: 48, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>
                      {(myReviews.reduce((s,r) => s+r.rating, 0) / myReviews.length).toFixed(1)}
                    </p>
                    <div>
                      <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                        {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 16, color: s <= Math.round(myReviews.reduce((sum,r)=>sum+r.rating,0)/myReviews.length) ? '#a08050' : 'var(--border-default)' }}>★</span>)}
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)', letterSpacing: 1 }}>{myReviews.length} {isAr ? 'تقييم' : lang === 'zh' ? '条评价' : 'reviews'}</p>
                    </div>
                  </div>
                  {myReviews.map((r, idx) => (
                    <div key={r.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '18px 0', animation: `fadeIn 0.35s ease ${idx*0.04}s both` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.profiles?.company_name || r.profiles?.full_name || (isAr ? 'تاجر' : lang === 'zh' ? '采购商' : 'Trader')}</p>
                        <div style={{ display: 'flex', gap: 1 }}>
                          {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= r.rating ? '#a08050' : 'var(--border-default)' }}>★</span>)}
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, ...arFont }}>{r.comment}</p>}
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 6 }}>{new Date(r.created_at).toLocaleDateString(isAr ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : 'en-US')}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {!isRestrictedSupplierTab && activeTab === 'add-product' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.addProductTitle}</h2>
              {productComposerStep === 'preview' ? (
                <ProductPreviewPanel product={normalizeProductDraftMedia(product)} onPublish={addProduct} onBack={() => setProductComposerStep('edit')} t={t} isAr={isAr} saving={saving} lang={lang} />
              ) : (
                <ProductForm data={product} setData={setProduct} onSave={addProduct} onPreview={openProductPreview} showPreviewAction imgRef={imageRef} vidRef={videoRef} onImgChange={e => handleImageUpload(e, false)} onVidChange={e => handleVideoUpload(e, false)} onRemoveImage={index => removeImageAt(index, false)} onRemoveVideo={() => removeVideo(false)} onCancel={() => setActiveTab('overview')} uploadingImage={uploadingImage} uploadingVideo={uploadingVideo} t={t} isAr={isAr} saving={saving} usdRate={usdRate} categories={cats} lang={lang} />
              )}
              {productSaveMsg && (
                <p style={{ marginTop: 12, fontSize: 13, color: ([t.productSavedWithFallback, 'تم إضافة المنتج بنجاح', '产品添加成功', 'Product added successfully'].includes(productSaveMsg) ? (productSaveMsg === t.productSavedWithFallback ? '#a08850' : '#5a9a72') : '#a07070'), fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {productSaveMsg}
                </p>
              )}
            </div>
          )}

          {/* ── VERIFICATION ── */}
         {/* ── VERIFICATION ── */}
          {activeTab === 'verification' && (
            <div style={{ ...section, background: '#FAF8F5', minHeight: '100vh' }}>
              <style>{VF_CSS}</style>

              {/* Progress bar */}
              <VfProgressBar
                step={verificationStep}
                status={showVfSuccess ? 'success' : isVerificationLocked ? 'review' : 'form'}
              />

              <div style={{ maxWidth: 580, margin: '0 auto', padding: '44px 24px 80px' }}>

                {/* ── UNDER REVIEW ── */}
                {isVerificationLocked && !showVfSuccess && (
                  <div>
                    <div className="vf-fu" style={{ marginBottom: 36 }}>
                      <p style={{ fontSize: 11, color: VF_C.amber, fontFamily: 'Tajawal, sans-serif', fontWeight: 400, marginBottom: 12 }}>
                        VERIFICATION_UNDER_REVIEW
                      </p>
                      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 300, color: VF_C.ink, letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 14 }}>
                        {isAr ? 'التحقق الآن' : lang === 'zh' ? '认证正在' : 'Verification'}
                        <br />
                        <em style={{ fontStyle: 'italic', color: VF_C.ink60 }}>
                          {isAr ? 'تحت المراجعة' : lang === 'zh' ? '审核中' : 'Under Review'}
                        </em>
                      </h1>
                      <p style={{ fontSize: 15, lineHeight: 1.9, color: VF_C.ink60, fontWeight: 300, fontFamily: 'Tajawal, sans-serif' }}>
                        {isAr
                          ? 'تم استلام التحقق بنجاح. لن يظهر النموذج القابل للتعديل مرة أخرى أثناء المراجعة.'
                          : lang === 'zh'
                            ? '认证资料已成功提交。审核期间表单将保持锁定。'
                            : 'Your verification was received. The form stays locked during review.'}
                      </p>
                    </div>

                    <div className="vf-fu" style={{ marginBottom: 32, animationDelay: '0.08s' }}>
                      <VfStepBadges currentState="review" isAr={isAr} lang={lang} />
                    </div>

                    {/* Submitted data */}
                    <div className="vf-fu" style={{ marginBottom: 28, animationDelay: '0.14s' }}>
                      <p style={{ fontSize: 11, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 400, marginBottom: 10 }}>
                        {isAr ? 'البيانات المُرسلة' : lang === 'zh' ? '已提交资料' : 'Submitted data'}
                      </p>
                      <div style={{ background: VF_C.white, border: `1px solid ${VF_C.ink10}`, borderRadius: 12, overflow: 'hidden' }}>
                        {[
                          [isAr ? 'اسم الشركة' : lang === 'zh' ? '公司名称' : 'Company', settings.company_name || '—'],
                          [isAr ? 'المدينة / الدولة' : lang === 'zh' ? '城市 / 国家' : 'City / Country', `${settings.city || '—'} · ${settings.country || '—'}`],
                          [isAr ? 'التخصص' : lang === 'zh' ? '专业' : 'Specialty', settings.speciality || '—'],
                          ['WeChat', settings.wechat || '—'],
                          [isAr ? 'رابط المتجر' : lang === 'zh' ? '店铺链接' : 'Trade link', settings.trade_link || '—'],
                          [isAr ? 'رقم التسجيل' : lang === 'zh' ? '注册号' : 'Reg. number', verification.reg_number || '—'],
                          [isAr ? 'سنوات الخبرة' : lang === 'zh' ? '从业年限' : 'Experience', verification.years_experience ? `${verification.years_experience} ${isAr ? 'سنوات' : lang === 'zh' ? '年' : 'yrs'}` : '—'],
                          [isAr ? 'رخصة الأعمال' : lang === 'zh' ? '营业执照' : 'License', verification.license_photo ? (isAr ? 'مرفوعة ✓' : lang === 'zh' ? '已上传 ✓' : 'Uploaded ✓') : '—'],
                          [isAr ? 'صور المصنع' : lang === 'zh' ? '工厂图片' : 'Factory photos', verificationImages.length > 0 ? `${verificationImages.length} ${isAr ? 'صور ✓' : lang === 'zh' ? '张 ✓' : 'photos ✓'}` : '—'],
                          ...(verificationVideos.length > 0 ? [[isAr ? 'فيديو المصنع' : lang === 'zh' ? '工厂视频' : 'Factory video', `${verificationVideos.length} ${isAr ? 'فيديو ✓' : lang === 'zh' ? '个 ✓' : 'video ✓'}`]] : []),
                        ].map(([k, v]) => (
                          <div key={k} className="vf-info-row">
                            <span style={{ fontSize: 13, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 300, flexShrink: 0 }}>{k}</span>
                            <span style={{ fontSize: 13, color: VF_C.ink, fontFamily: 'Tajawal, sans-serif', fontWeight: 400 }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Locked features */}
                    <div className="vf-fu" style={{ marginBottom: 28, animationDelay: '0.2s' }}>
                      <p style={{ fontSize: 11, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 400, marginBottom: 10 }}>
                        {isAr ? 'مقفل حتى الاعتماد' : lang === 'zh' ? '通过前保持锁定' : 'Locked until approval'}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {[
                          isAr ? 'إضافة المنتجات' : lang === 'zh' ? '添加产品' : 'Add products',
                          isAr ? 'طلبات التجار'   : lang === 'zh' ? '采购需求'  : 'Trader requests',
                          isAr ? 'تقديم العروض'   : lang === 'zh' ? '提交报价'  : 'Submit offers',
                          isAr ? 'الرسائل'         : lang === 'zh' ? '消息'      : 'Messages',
                        ].map(f => (
                          <span key={f} style={{ padding: '7px 14px', borderRadius: 99, border: `1px solid ${VF_C.ink10}`, background: VF_C.paper, fontSize: 13, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 300 }}>
                            {f} · {isAr ? 'مقفل' : lang === 'zh' ? '锁定' : 'Locked'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* What's next */}
                    <div className="vf-fu" style={{ marginBottom: 24, animationDelay: '0.26s' }}>
                      <div style={{ background: VF_C.white, border: `1px solid ${VF_C.ink10}`, borderRadius: 12, overflow: 'hidden' }}>
                        {[
                          { title: isAr ? 'راقب بريدك الإلكتروني' : lang === 'zh' ? '关注邮箱通知' : 'Watch your email',
                            body:  isAr ? 'ستصلك رسالة فور اعتماد حسابك من فريق مَعبر' : lang === 'zh' ? '账户通过后系统会自动发邮件通知您' : 'You will get an email as soon as your account is approved' },
                          { title: isAr ? 'المدة المتوقعة' : lang === 'zh' ? '预计时间' : 'Expected time',
                            body:  isAr ? 'عادةً خلال 72 ساعة من وقت الإرسال' : lang === 'zh' ? '通常在提交后 72 小时内完成' : 'Usually within 72 hours of submission' },
                          { title: isAr ? 'هل تحتاج مساعدة؟' : lang === 'zh' ? '需要帮助？' : 'Need help?',
                            body:  isAr ? 'تواصل معنا على support@maabar.io' : lang === 'zh' ? '联系我们：support@maabar.io' : 'Contact us at support@maabar.io' },
                        ].map(({ title, body }, i) => (
                          <div key={i} className="vf-next-item" style={{ borderBottom: i < 2 ? `1px solid ${VF_C.ink05}` : 'none' }}>
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: VF_C.ink10, marginTop: 7, flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: 14, color: VF_C.ink, fontFamily: 'Tajawal, sans-serif', fontWeight: 500, marginBottom: 3 }}>{title}</p>
                              <p style={{ fontSize: 13, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 300, lineHeight: 1.6 }}>{body}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Amber note */}
                    <div className="vf-fu" style={{ animationDelay: '0.32s', padding: '14px 18px', borderRadius: 10, background: VF_C.amberBg, border: `1px solid ${VF_C.amberBr}` }}>
                      <p style={{ fontSize: 13, color: VF_C.amber, fontFamily: 'Tajawal, sans-serif', fontWeight: 400, lineHeight: 1.7 }}>
                        {isAr
                          ? 'يتم حفظ ملفاتك داخل تخزين خاص ولا تُعرض بروابط عامة. بياناتك في أمان.'
                          : lang === 'zh'
                            ? '您的文件存储在私有空间，不会通过公开链接暴露。数据安全有保障。'
                            : 'Your files are stored in private storage and never exposed through public URLs.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── SUCCESS SCREEN ── */}
                {showVfSuccess && (
                  <div className="vf-fi" style={{ textAlign: 'center', paddingTop: 8 }}>
                    <div style={{ width: 68, height: 68, borderRadius: '50%', background: VF_C.sageBg, border: `1.5px solid ${VF_C.sageBr}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', animation: 'vf-ringPulse 1.2s ease 0.4s' }}>
                      <VfChk size={28} color={VF_C.sage} />
                    </div>
                    <p style={{ fontSize: 11, color: VF_C.sage, fontFamily: 'Tajawal, sans-serif', fontWeight: 400, marginBottom: 12 }}>
                      {isAr ? 'تم الإرسال بنجاح' : lang === 'zh' ? '提交成功' : 'Submitted successfully'}
                    </p>
                    <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 300, color: VF_C.ink, letterSpacing: -1, lineHeight: 1.15, marginBottom: 16 }}>
                      {isAr ? 'طلبك في أيدي' : lang === 'zh' ? '您的申请已交到' : 'Your request is in the hands of'}
                      <br />
                      <em style={{ fontStyle: 'italic', color: VF_C.ink60 }}>
                        {isAr ? 'فريق مَعبر' : lang === 'zh' ? 'Maabar 团队' : 'the Maabar team'}
                      </em>
                    </h1>
                    <p style={{ fontSize: 15, lineHeight: 1.9, color: VF_C.ink60, fontWeight: 300, maxWidth: 340, margin: '0 auto 36px', fontFamily: 'Tajawal, sans-serif' }}>
                      {isAr
                        ? 'سنراجع طلبك ونتواصل معك خلال 72 ساعة.'
                        : lang === 'zh'
                          ? '我们会在 72 小时内审核并与您联系。'
                          : 'We will review your request and contact you within 72 hours.'}
                    </p>
                    <div style={{ marginBottom: 36 }}>
                      <VfStepBadges currentState="success" isAr={isAr} lang={lang} />
                    </div>
                    <div style={{ background: VF_C.white, border: `1px solid ${VF_C.ink10}`, borderRadius: 12, overflow: 'hidden', padding: '0 20px', textAlign: isAr ? 'right' : 'left', marginBottom: 32 }}>
                      {[
                        { title: isAr ? 'راقب بريدك الإلكتروني' : lang === 'zh' ? '关注邮箱' : 'Watch your email',
                          body:  isAr ? 'ستصلك رسالة فور اعتماد حسابك' : lang === 'zh' ? '账户通过后会收到邮件' : 'You will be notified when approved' },
                        { title: isAr ? 'جهّز منتجاتك' : lang === 'zh' ? '准备您的产品' : 'Prepare your products',
                          body:  isAr ? 'يمكنك تجهيز قائمة منتجاتك وإضافتها فور الموافقة' : lang === 'zh' ? '可以提前准备产品列表，通过后立即发布' : 'You can prepare your product list and add them upon approval' },
                        { title: isAr ? 'تواصل معنا' : lang === 'zh' ? '联系我们' : 'Contact us',
                          body:  'support@maabar.io' },
                      ].map(({ title, body }, i) => (
                        <div key={i} style={{ display: 'flex', gap: 14, padding: '16px 0', borderBottom: i < 2 ? `1px solid ${VF_C.ink05}` : 'none', alignItems: 'flex-start' }}>
                          <div style={{ width: 6, height: 6, borderRadius: '50%', background: VF_C.ink10, marginTop: 7, flexShrink: 0 }} />
                          <div>
                            <p style={{ fontSize: 14, color: VF_C.ink, fontFamily: 'Tajawal, sans-serif', fontWeight: 500, marginBottom: 3 }}>{title}</p>
                            <p style={{ fontSize: 13, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 300, lineHeight: 1.6 }}>{body}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      className="vf-btn-ink"
                      onClick={() => setShowVfSuccess(false)}>
                      {isAr ? 'عرض حالة الطلب ←' : lang === 'zh' ? '查看申请状态 →' : 'View request status →'}
                    </button>
                  </div>
                )}

                {/* ── ACTIVE FORM ── */}
                {!isVerificationLocked && !showVfSuccess && (
                  <div>
                    <VfDotStepper step={verificationStep} />
                    <div className="vf-fu" style={{ marginBottom: 36 }}>
                      <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 300, color: VF_C.ink, letterSpacing: -0.8, lineHeight: 1.2, marginBottom: 6 }}>
                        {verificationStep === 1
                          ? (isAr ? 'بيانات الشركة'      : lang === 'zh' ? '公司资料' : 'Company Profile')
                          : verificationStep === 2
                            ? (isAr ? 'ملفات التحقق'      : lang === 'zh' ? '认证文件' : 'Verification Files')
                            : (isAr ? 'المراجعة النهائية' : lang === 'zh' ? '最终确认' : 'Final Review')}
                      </h1>
                      <p style={{ fontSize: 13, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 300 }}>
                        {verificationStep === 1
                          ? (isAr ? 'معلومات شركتك — تُحفظ مباشرة في حسابك' : lang === 'zh' ? '公司信息将直接保存到您的账户' : 'Company info — saved directly to your account')
                          : verificationStep === 2
                            ? (isAr ? 'المستندات المطلوبة للتحقق من موثوقيتك' : lang === 'zh' ? '验证可信度所需的文件' : 'Documents required to verify your credibility')
                            : (isAr ? 'راجع كل شيء — لن يُرسل الطلب إلا عند تأكيدك' : lang === 'zh' ? '请确认所有内容后再提交' : 'Review everything — request only submits on confirmation')}
                      </p>
                    </div>

                    {/* Draft saved note */}
                    {verificationDraftSavedLabel && (
                      <div style={{ marginBottom: 18, padding: '10px 16px', borderRadius: 10, border: `1px solid ${VF_C.ink10}`, background: VF_C.paper }}>
                        <p style={{ fontSize: 12, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 300 }}>
                          {isAr ? `يتم حفظ المسودة محلياً. آخر حفظ: ${verificationDraftSavedLabel}` : lang === 'zh' ? `草稿已自动保存。最近保存：${verificationDraftSavedLabel}` : `Draft saved locally. Last saved: ${verificationDraftSavedLabel}`}
                        </p>
                      </div>
                    )}

                    {/* Error / success messages */}
                    {verificationMsg && (
                      <div className="vf-fi" style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 10, border: `1px solid ${verificationSaved ? VF_C.sageBr : 'rgba(160,112,112,0.2)'}`, background: verificationSaved ? VF_C.sageBg : 'rgba(160,112,112,0.07)' }}>
                        <p style={{ fontSize: 13, color: verificationSaved ? VF_C.sage : '#a07070', fontFamily: 'Tajawal, sans-serif', fontWeight: 400, lineHeight: 1.7 }}>{verificationMsg}</p>
                      </div>
                    )}

                    {/* ── STEP 1 ── */}
                    {verificationStep === 1 && (
                      <div>
                        {settingsMsg && (
                          <div className="vf-fi" style={{ marginBottom: 20, padding: '11px 16px', borderRadius: 10, background: settingsMsgType === 'success' ? VF_C.sageBg : 'rgba(160,112,112,0.07)', border: `1px solid ${settingsMsgType === 'success' ? VF_C.sageBr : 'rgba(160,112,112,0.2)'}` }}>
                            <p style={{ fontSize: 13, color: settingsMsgType === 'success' ? VF_C.sage : '#a07070', fontFamily: 'Tajawal, sans-serif', fontWeight: 400 }}>{settingsMsg}</p>
                          </div>
                        )}

                        <VfField label={isAr ? 'اسم الشركة *' : lang === 'zh' ? '公司名称 *' : 'Company Name *'} delay={0}>
                          <input className="vf-input" value={settings.company_name || ''} onChange={e => setSettings({ ...settings, company_name: e.target.value })} />
                        </VfField>
                        <div style={{ height: 20 }} />
                        <VfG2>
                          <VfField label={isAr ? 'المدينة *' : lang === 'zh' ? '城市 *' : 'City *'} delay={0.05}>
                            <input className="vf-input" value={settings.city || ''} onChange={e => setSettings({ ...settings, city: e.target.value })} />
                          </VfField>
                          <VfField label={isAr ? 'الدولة *' : lang === 'zh' ? '国家 *' : 'Country *'} delay={0.1}>
                            <input className="vf-input" value={settings.country || ''} onChange={e => setSettings({ ...settings, country: e.target.value })} />
                          </VfField>
                        </VfG2>
                        <div style={{ height: 20 }} />
                        <VfG2>
                          <VfField label={isAr ? 'التخصص *' : lang === 'zh' ? '专业 *' : 'Specialty *'} delay={0.15}>
                            <select className="vf-select" value={settings.speciality || ''} onChange={e => setSettings({ ...settings, speciality: e.target.value })}>
                              <option value="">—</option>
                              {(CATEGORIES[lang] || CATEGORIES.en).filter(c => c.val !== 'all').map(c => (
                                <option key={c.val} value={c.val}>{c.label}</option>
                              ))}
                            </select>
                          </VfField>
                          <VfField label={isAr ? 'نوع النشاط' : lang === 'zh' ? '企业类型' : 'Business Type'} delay={0.2}>
                            <input className="vf-input" value={settings.business_type || ''} onChange={e => setSettings({ ...settings, business_type: e.target.value })} placeholder={isAr ? 'مصنّع / تاجر جملة' : lang === 'zh' ? '制造商 / 批发商' : 'Manufacturer / Wholesaler'} />
                          </VfField>
                        </VfG2>
                        <VfSep label={isAr ? 'التواصل' : lang === 'zh' ? '联系方式' : 'Contact'} />
                        <VfG2>
                          <VfField label="WeChat *" delay={0.25}>
                            <input className="vf-input" value={settings.wechat || ''} onChange={e => setSettings({ ...settings, wechat: e.target.value })} dir="ltr" />
                          </VfField>
                          <VfField label={isAr ? 'واتساب' : 'WhatsApp'} delay={0.3}>
                            <input className="vf-input" value={settings.whatsapp || ''} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} dir="ltr" placeholder="+86..." />
                          </VfField>
                        </VfG2>
                        <div style={{ height: 20 }} />
                        <VfField label={isAr ? 'رابط المتجر / الملف التجاري *' : lang === 'zh' ? '店铺链接 *' : 'Trade Profile Link *'} delay={0.35}>
                          <input className="vf-input" value={settings.trade_link || ''} onChange={e => setSettings({ ...settings, trade_link: e.target.value })} dir="ltr" placeholder="https://alibaba.com/..." />
                        </VfField>
                        <div style={{ height: 20 }} />
                        <VfField label={isAr ? 'موقع الشركة' : lang === 'zh' ? '公司官网' : 'Company Website'} delay={0.4}>
                          <input className="vf-input" value={settings.company_website || ''} onChange={e => setSettings({ ...settings, company_website: e.target.value })} dir="ltr" placeholder="https://..." />
                        </VfField>
                        <div style={{ height: 20 }} />
                        <VfField label={isAr ? 'وصف الشركة' : lang === 'zh' ? '公司介绍' : 'Company Description'} delay={0.45}>
                          <textarea className="vf-input" rows={3} style={{ resize: 'none', lineHeight: 1.7 }}
                            value={settings.company_description || ''}
                            onChange={e => setSettings({ ...settings, company_description: e.target.value })}
                            placeholder={isAr ? 'نبذة — ما تنتجه، خبرتك، ميزتك التنافسية' : lang === 'zh' ? '简介 — 产品、经验、竞争优势' : 'Brief — products, experience, competitive advantage'}
                          />
                        </VfField>
                        <div className="vf-fu" style={{ animationDelay: '0.5s', marginTop: 36, display: 'grid', gap: 10 }}>
                          <button className="vf-btn-ink" disabled={savingSettings}
                            onClick={() => saveSettings({ nextVerificationStep: 2, navigateToVerification: true })}>
                            {savingSettings
                              ? (isAr ? 'جاري الحفظ...' : lang === 'zh' ? '保存中...' : 'Saving...')
                              : (isAr ? 'حفظ والانتقال للخطوة 2 ←' : lang === 'zh' ? '保存并进入第 2 步 →' : 'Save and continue to step 2 →')}
                          </button>
                          <button className="vf-btn-ghost" disabled={savingSettings} onClick={() => saveSettings()}>
                            {isAr ? 'حفظ فقط' : lang === 'zh' ? '仅保存' : 'Save only'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 2 ── */}
                    {verificationStep === 2 && (
                      <div>
                        <VfG2>
                          <VfField label={isAr ? 'رقم تسجيل الشركة *' : lang === 'zh' ? '公司注册号 *' : 'Company Reg. Number *'} delay={0}>
                            <input className="vf-input" value={verification.reg_number || ''} onChange={e => setVerification(prev => ({ ...prev, reg_number: e.target.value }))} dir="ltr" />
                          </VfField>
                          <VfField label={isAr ? 'سنوات الخبرة *' : lang === 'zh' ? '从业年限 *' : 'Years of Experience *'} delay={0.05}>
                            <input className="vf-input" type="number" min="0" value={verification.years_experience || ''} onChange={e => setVerification(prev => ({ ...prev, years_experience: e.target.value }))} dir="ltr" />
                          </VfField>
                        </VfG2>
                        <div style={{ height: 20 }} />
                        <VfField label={isAr ? 'عدد الموظفين' : lang === 'zh' ? '员工人数' : 'Number of Employees'} delay={0.1}>
                          <input className="vf-input" type="number" min="0" value={verification.num_employees || ''} onChange={e => setVerification(prev => ({ ...prev, num_employees: e.target.value }))} dir="ltr" placeholder={isAr ? 'اختياري' : lang === 'zh' ? '可选' : 'Optional'} />
                        </VfField>

                        <VfSep label={isAr ? 'المستندات' : lang === 'zh' ? '文件' : 'Documents'} />

                        {/* License */}
                        <div className="vf-fu" style={{ animationDelay: '0.2s', marginBottom: 12 }}>
                          <p style={{ fontSize: 12, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 400, marginBottom: 8 }}>
                            {isAr ? 'رخصة الأعمال أو هوية المنشأة *' : lang === 'zh' ? '营业执照或企业证明 *' : 'Business License or Company ID *'}
                          </p>
                          {verification.license_photo ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 10, background: VF_C.sageBg, border: `1px solid ${VF_C.sageBr}` }}>
                              <VfChk size={13} />
                              <p style={{ fontSize: 13, color: VF_C.sage, fontFamily: 'Tajawal, sans-serif', flex: 1, fontWeight: 400 }}>
                                {isAr ? 'رخصة الأعمال — مرفوعة' : lang === 'zh' ? '营业执照 — 已上传' : 'License — uploaded'}
                              </p>
                              <button onClick={() => openVerificationDoc(verification.license_photo)} style={{ background: 'none', border: 'none', color: VF_C.ink30, fontSize: 12, fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                                {isAr ? 'عرض' : lang === 'zh' ? '查看' : 'View'}
                              </button>
                              <label style={{ color: VF_C.ink30, fontSize: 12, fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                                {isAr ? 'استبدال' : lang === 'zh' ? '更换' : 'Replace'}
                                <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={async e => { await uploadVerificationDoc(e.target.files?.[0], 'license'); e.target.value = ''; }} />
                              </label>
                            </div>
                          ) : (
                            <label style={{ display: 'block', border: `1px solid ${VF_C.ink10}`, borderRadius: 10, padding: '26px 20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.25s', background: VF_C.paper }}>
                              {uploadingVerificationDoc.license
                                ? <p style={{ fontSize: 13, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif' }}>...</p>
                                : <>
                                    <p style={{ fontSize: 14, color: VF_C.ink60, fontFamily: 'Tajawal, sans-serif', fontWeight: 400, marginBottom: 4 }}>
                                      {isAr ? 'رفع الملف' : lang === 'zh' ? '上传文件' : 'Upload file'}
                                    </p>
                                    <p style={{ fontSize: 12, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 300 }}>
                                      PDF {isAr ? 'أو صورة' : lang === 'zh' ? '或图片' : 'or image'} · 10MB
                                    </p>
                                  </>
                              }
                              <input type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={async e => { await uploadVerificationDoc(e.target.files?.[0], 'license'); e.target.value = ''; }} />
                            </label>
                          )}
                        </div>

                        {/* Factory images */}
                        <div className="vf-fu" style={{ animationDelay: '0.25s', marginBottom: 12 }}>
                          <p style={{ fontSize: 12, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 400, marginBottom: 8 }}>
                            {isAr ? 'صور المصنع أو المستودع *' : lang === 'zh' ? '工厂或仓库照片 *' : 'Factory or Warehouse Photos *'}
                            <span style={{ fontSize: 11, color: VF_C.ink30, fontWeight: 300, marginRight: 6 }}>{verificationImages.length}/{VERIFICATION_IMAGE_LIMIT}</span>
                          </p>
                          {verificationImages.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {verificationImages.map((item, i) => (
                                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: VF_C.sageBg, border: `1px solid ${VF_C.sageBr}` }}>
                                  <VfChk size={13} />
                                  <p style={{ fontSize: 13, color: VF_C.sage, fontFamily: 'Tajawal, sans-serif', flex: 1, fontWeight: 400 }}>
                                    {isAr ? `صورة ${i + 1}` : lang === 'zh' ? `图片 ${i + 1}` : `Image ${i + 1}`}
                                  </p>
                                  <button onClick={() => openVerificationDoc(item)} style={{ background: 'none', border: 'none', color: VF_C.ink30, fontSize: 12, fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                                    {isAr ? 'عرض' : lang === 'zh' ? '查看' : 'View'}
                                  </button>
                                  <button onClick={() => removeVerificationMedia('image', item)} style={{ background: 'none', border: 'none', color: VF_C.ink30, fontSize: 12, fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                                    {isAr ? 'حذف' : lang === 'zh' ? '删除' : 'Remove'}
                                  </button>
                                </div>
                              ))}
                              {verificationImages.length < VERIFICATION_IMAGE_LIMIT && (
                                <label style={{ display: 'block', border: `1px solid ${VF_C.ink10}`, borderRadius: 10, padding: '14px 20px', textAlign: 'center', cursor: 'pointer', background: VF_C.paper }}>
                                  <p style={{ fontSize: 13, color: VF_C.ink60, fontFamily: 'Tajawal, sans-serif', fontWeight: 400 }}>
                                    + {isAr ? 'إضافة صورة' : lang === 'zh' ? '添加图片' : 'Add image'}
                                  </p>
                                  <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={async e => { await uploadVerificationMedia(e.target.files, 'image'); e.target.value = ''; }} />
                                </label>
                              )}
                            </div>
                          ) : (
                            <label style={{ display: 'block', border: `1px solid ${VF_C.ink10}`, borderRadius: 10, padding: '26px 20px', textAlign: 'center', cursor: 'pointer', background: VF_C.paper }}>
                              {uploadingVerificationDoc.images
                                ? <p style={{ fontSize: 13, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif' }}>...</p>
                                : <>
                                    <p style={{ fontSize: 14, color: VF_C.ink60, fontFamily: 'Tajawal, sans-serif', fontWeight: 400, marginBottom: 4 }}>
                                      {isAr ? 'صور المصنع أو المستودع' : lang === 'zh' ? '工厂或仓库照片' : 'Factory or warehouse photos'}
                                    </p>
                                    <p style={{ fontSize: 12, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 300 }}>
                                      {isAr ? 'حتى 5 صور · JPG أو PNG' : lang === 'zh' ? '最多 5 张 · JPG 或 PNG' : 'Up to 5 photos · JPG or PNG'}
                                    </p>
                                  </>
                              }
                              <input type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={async e => { await uploadVerificationMedia(e.target.files, 'image'); e.target.value = ''; }} />
                            </label>
                          )}
                        </div>

                        {/* Factory video — required */}
                        <div className="vf-fu" style={{ animationDelay: '0.3s', marginBottom: 12 }}>
                          <p style={{ fontSize: 12, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 400, marginBottom: 8 }}>
                            {isAr ? 'فيديو المصنع' : lang === 'zh' ? '工厂视频' : 'Factory Video'}
                            <span style={{ color: 'var(--error, #e53e3e)', marginRight: 4 }}>*</span>
                          </p>
                          {verificationVideos.length > 0 ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 10, background: VF_C.sageBg, border: `1px solid ${VF_C.sageBr}` }}>
                              <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" fill={VF_C.sage} /></svg>
                              <p style={{ fontSize: 13, color: VF_C.sage, fontFamily: 'Tajawal, sans-serif', flex: 1, fontWeight: 400 }}>
                                {isAr ? 'فيديو المصنع — مرفوع' : lang === 'zh' ? '工厂视频 — 已上传' : 'Factory video — uploaded'}
                              </p>
                              <button onClick={() => removeVerificationMedia('video', verificationVideos[0])} style={{ background: 'none', border: 'none', color: VF_C.ink30, fontSize: 12, fontFamily: 'Tajawal, sans-serif', cursor: 'pointer' }}>
                                {isAr ? 'حذف' : lang === 'zh' ? '删除' : 'Remove'}
                              </button>
                            </div>
                          ) : (
                            <label style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 10, border: `1px dashed ${VF_C.ink10}`, background: VF_C.paper, cursor: 'pointer' }}>
                              <div style={{ width: 34, height: 34, borderRadius: 8, background: VF_C.ink05, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width={14} height={14} viewBox="0 0 24 24" fill="none"><polygon points="5 3 19 12 5 21 5 3" fill={VF_C.ink30} /></svg>
                              </div>
                              <div>
                                <p style={{ fontSize: 13, color: VF_C.ink60, fontFamily: 'Tajawal, sans-serif', fontWeight: 400 }}>
                                  {isAr ? 'رفع فيديو' : lang === 'zh' ? '上传视频' : 'Upload video'}
                                </p>
                                <p style={{ fontSize: 11, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 300, marginTop: 2 }}>
                                  {isAr ? 'جولة في المصنع · MP4 · حتى 50MB' : lang === 'zh' ? '工厂参观视频 · MP4 · 最大 50MB' : 'Factory tour · MP4 · Max 50MB'}
                                </p>
                              </div>
                              <input type="file" accept="video/*" style={{ display: 'none' }} onChange={async e => { await uploadVerificationMedia(e.target.files, 'video'); e.target.value = ''; }} />
                            </label>
                          )}
                        </div>

                        <div className="vf-fu" style={{ animationDelay: '0.36s', marginTop: 36, display: 'grid', gap: 10 }}>
                          <button className="vf-btn-ink" onClick={() => {
                            const isStepReady = Boolean(String(verification.reg_number || '').trim())
                              && Boolean(String(verification.years_experience || '').trim())
                              && Boolean(String(verification.license_photo || '').trim())
                              && verificationImages.length > 0;
                            if (!isStepReady) { setVerificationSaved(false); setVerificationMsg(t.verificationMissing); return; }
                            setVerificationMsg('');
                            setVerificationStep(3);
                          }}>
                            {isAr ? 'التالي: المراجعة النهائية ←' : lang === 'zh' ? '下一步：最终确认 →' : 'Next: Final review →'}
                          </button>
                          <button className="vf-btn-ghost" onClick={() => setVerificationStep(1)}>
                            {isAr ? 'رجوع لبيانات الشركة' : lang === 'zh' ? '返回公司资料' : 'Back to company profile'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── STEP 3 ── */}
                    {verificationStep === 3 && (
                      <div>
                        <div className="vf-fu" style={{ animationDelay: '0s', background: VF_C.white, border: `1px solid ${VF_C.ink10}`, borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
                          {[
                            [isAr ? 'اسم الشركة'       : lang === 'zh' ? '公司名称'   : 'Company',       settings.company_name || '—'],
                            [isAr ? 'المدينة / الدولة'  : lang === 'zh' ? '城市 / 国家' : 'City / Country', `${settings.city || '—'} · ${settings.country || '—'}`],
                            [isAr ? 'التخصص'            : lang === 'zh' ? '专业'       : 'Specialty',      settings.speciality || '—'],
                            ['WeChat',                                                                         settings.wechat || '—'],
                            [isAr ? 'رابط المتجر'       : lang === 'zh' ? '店铺链接'   : 'Trade link',     settings.trade_link || '—'],
                            [isAr ? 'رقم التسجيل'       : lang === 'zh' ? '注册号'     : 'Reg. number',    verification.reg_number || '—'],
                            [isAr ? 'سنوات الخبرة'      : lang === 'zh' ? '从业年限'   : 'Experience',     verification.years_experience || '—'],
                            [isAr ? 'رخصة الأعمال'      : lang === 'zh' ? '营业执照'   : 'License',        verification.license_photo ? (isAr ? 'مرفوعة ✓' : lang === 'zh' ? '已上传 ✓' : 'Uploaded ✓') : '—'],
                            [isAr ? 'صور المصنع'         : lang === 'zh' ? '工厂图片'   : 'Factory photos', `${verificationImages.length} ${isAr ? 'صور' : lang === 'zh' ? '张' : 'photos'}`],
                            ...(verificationVideos.length > 0 ? [[isAr ? 'فيديو المصنع' : lang === 'zh' ? '工厂视频' : 'Factory video', isAr ? 'مرفوع ✓' : lang === 'zh' ? '已上传 ✓' : 'Uploaded ✓']] : []),
                          ].map(([k, v], i, arr) => (
                            <div key={k} className="vf-review-row" style={{ borderBottom: i < arr.length - 1 ? `1px solid ${VF_C.ink05}` : 'none' }}>
                              <span style={{ fontSize: 13, color: VF_C.ink30, fontFamily: 'Tajawal, sans-serif', fontWeight: 300, flexShrink: 0 }}>{k}</span>
                              <span style={{ fontSize: 13, color: VF_C.ink, fontFamily: 'Tajawal, sans-serif', fontWeight: 400 }}>{v}</span>
                            </div>
                          ))}
                        </div>
                        <div className="vf-fu" style={{ animationDelay: '0.1s', display: 'grid', gap: 10 }}>
                          <button className="vf-btn-ink" disabled={savingVerification} onClick={async () => { await saveVerification(); if (verificationSaved) setShowVfSuccess(true); }}>
                            {savingVerification
                              ? (isAr ? 'جاري الإرسال...' : lang === 'zh' ? '提交中...' : 'Submitting...')
                              : (isAr ? 'إرسال طلب التحقق ←' : lang === 'zh' ? '提交认证申请 →' : 'Submit verification request →')}
                          </button>
                          <button className="vf-btn-ghost" onClick={() => setVerificationStep(2)}>
                            {isAr ? 'رجوع للتعديل' : lang === 'zh' ? '返回修改' : 'Back to edit'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
          {/* ── PAYOUT ── */}
          {!isRestrictedSupplierTab && activeTab === 'payout' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 14, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.payoutTitle}</h2>
              <p style={{ maxWidth: 720, fontSize: 13, color: 'var(--text-disabled)', lineHeight: 1.9, marginBottom: 24, ...arFont }}>{t.payoutIntro}</p>

              {!supplierState.isApprovedStage ? (
                <div style={{ maxWidth: 720, padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-muted)', background: 'var(--bg-subtle)' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, ...arFont }}>{t.payoutLocked}</p>
                </div>
              ) : (
                <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', padding: '24px 28px', borderRadius: 'var(--radius-xl)', maxWidth: 720 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 18, ...arFont }}>{t.payoutNote}</p>
                  <div style={{ marginBottom: 18 }}>
                    <SaveFeedbackCard feedback={payoutFeedback} isAr={isAr} />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>{t.beneficiaryName}</label>
                      <input className="form-input" value={payout.payout_beneficiary_name} onChange={e => setPayout(prev => ({ ...prev, payout_beneficiary_name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>{t.bankName}</label>
                      <input className="form-input" value={payout.bank_name} onChange={e => setPayout(prev => ({ ...prev, bank_name: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>{t.bankAccountNumber}</label>
                      <input className="form-input" value={payout.payout_account_number} onChange={e => setPayout(prev => ({ ...prev, payout_account_number: e.target.value }))} dir="ltr" />
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>{t.swiftCode}</label>
                      <input className="form-input" value={payout.swift_code} onChange={e => setPayout(prev => ({ ...prev, swift_code: e.target.value }))} dir="ltr" />
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label className={`form-label${isAr ? ' ar' : ''}`}>{t.bankAddress}</label>
                      <input className="form-input" value={payout.payout_bank_address} onChange={e => setPayout(prev => ({ ...prev, payout_bank_address: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>{t.preferredCurrency}</label>
                      <select className="form-input" value={payout.preferred_display_currency || 'USD'} onChange={e => setPayout(prev => ({ ...prev, preferred_display_currency: e.target.value }))}>
                        {DISPLAY_CURRENCIES.map(code => <option key={code} value={code}>{code}</option>)}
                      </select>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 14, marginBottom: 4, lineHeight: 1.7, ...arFont }}>
                    {t.payoutReassurance}
                  </p>

                  <button onClick={savePayout} disabled={savingPayout} className="btn-primary" style={{ padding: '12px 32px', fontSize: 13, alignSelf: 'flex-start', minHeight: 46, marginTop: 10 }}>
                    {payoutButtonLabel}
                  </button>
                  <div style={{ marginTop: 12, minHeight: 22 }}>
                    {savingPayout ? (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', ...arFont }}>
                        {isAr ? 'جاري حفظ بيانات الدفعات...' : lang === 'zh' ? '正在保存收款信息…' : 'Saving payout details...'}
                      </p>
                    ) : payoutError ? (
                      <p style={{ margin: 0, fontSize: 12, color: '#a07070', ...arFont }}>
                        {payoutError}
                      </p>
                    ) : hasSavedPayoutRecord && !isPayoutDirty ? (
                      <p style={{ margin: 0, fontSize: 12, color: '#5a9a72', ...arFont }}>
                        {isAr
                          ? `تم حفظ بيانات الدفعات بنجاح${resolvedPayoutSavedAt ? ` · آخر حفظ ${formatDraftSavedAt(resolvedPayoutSavedAt, lang)}` : ''}`
                          : lang === 'zh'
                            ? `收款资料已成功保存${resolvedPayoutSavedAt ? ` · 最后保存时间：${formatDraftSavedAt(resolvedPayoutSavedAt, lang)}` : ''}`
                            : `Payout details saved successfully${resolvedPayoutSavedAt ? ` · Last saved ${formatDraftSavedAt(resolvedPayoutSavedAt, lang)}` : ''}`}
                      </p>
                    ) : isPayoutDirty ? (
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', ...arFont }}>
                        {isAr ? 'لديك تعديلات غير محفوظة على بيانات الدفعات.' : lang === 'zh' ? '您有尚未保存的收款修改。' : 'You have unsaved payout changes.'}
                      </p>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div style={{ ...section, background: '#f5f3ef', paddingBottom: 60 }}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 26 : 32, fontWeight: 300, marginBottom: 24, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', letterSpacing: isAr ? 0 : -0.5 }}>
                {t.settingsTitle}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>

                {/* ── Card 1: Verification status ── */}
                <div style={{ background: '#ede8dc', border: '1px solid #d8d0be', borderRadius: 14, padding: '22px 20px' }}>
                  <p style={{ fontSize: 10, fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif", letterSpacing: isAr ? 0 : '1.2px', textTransform: 'uppercase', color: '#b0ab9e', marginBottom: 14 }}>
                    {isAr ? 'حالة التحقق' : lang === 'zh' ? '验证状态' : 'Verification Status'}
                  </p>
                  <h3 style={{ fontSize: isAr ? 18 : 20, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', letterSpacing: isAr ? 0 : -0.2 }}>
                    {verificationStatusHeadline}
                  </h3>
                  <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {verificationStatusBody}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, background: 'rgba(45,122,79,0.10)', border: '1px solid rgba(45,122,79,0.22)', color: '#2d7a4f', fontFamily: "'Tajawal', sans-serif" }}>
                      {isAr ? `اكتمال الملف: ${profileReadiness.completedRequiredCount}/${profileReadiness.totalRequiredCount}` : lang === 'zh' ? `资料完成度：${profileReadiness.completedRequiredCount}/${profileReadiness.totalRequiredCount}` : `Profile: ${profileReadiness.completedRequiredCount}/${profileReadiness.totalRequiredCount}`}
                    </span>
                    <span style={{ padding: '5px 12px', borderRadius: 999, fontSize: 11, background: 'rgba(217,148,0,0.08)', border: '1px solid rgba(217,148,0,0.22)', color: '#b07800', fontFamily: "'Tajawal', sans-serif" }}>
                      {supplierState.isApprovedStage
                        ? (isAr ? 'موثّق' : lang === 'zh' ? '已认证' : 'Verified')
                        : supplierState.isUnderReviewStage
                          ? (isAr ? 'قيد المراجعة' : lang === 'zh' ? '审核中' : 'Under review')
                          : (isAr ? 'لم يُرسل بعد' : lang === 'zh' ? '尚未提交' : 'Not yet submitted')}
                    </span>
                  </div>
                </div>

                {/* ── Card 2: Visual identity ── */}
                <div style={{ background: '#faf9f7', border: '1px solid #e8e5de', borderRadius: 14, padding: '22px 20px' }}>
                  <p style={{ fontSize: 10, fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif", letterSpacing: isAr ? 0 : '1.2px', textTransform: 'uppercase', color: '#b0ab9e', marginBottom: 18 }}>
                    {isAr ? 'الهوية البصرية' : lang === 'zh' ? '品牌素材' : 'Visual Identity'}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <div>
                      <p style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", marginBottom: 12 }}>{t.logo}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#e8e5de', border: '1px solid #d8d5ce', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                          {settings.avatar_url
                            ? <img src={settings.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span style={{ fontSize: 20, opacity: 0.3 }}>◻</span>}
                        </div>
                        <div>
                          <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} />
                          <button
                            onClick={() => logoRef.current?.click()}
                            style={{ background: '#1a1814', color: '#ffffff', border: 'none', borderRadius: 6, padding: '7px 14px', fontSize: 12, fontFamily: "'Tajawal', sans-serif", fontWeight: 500, cursor: 'pointer', marginBottom: 6, display: 'block' }}>
                            {uploadingLogo ? t.uploadingLogo : t.uploadLogo}
                          </button>
                          <p style={{ fontSize: 11, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif" }}>
                            {isAr ? 'JPG أو PNG · حتى 5MB' : lang === 'zh' ? 'JPG 或 PNG · 最大 5MB' : 'JPG or PNG · Max 5MB'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", marginBottom: 12 }}>{t.factoryImages}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {(settings.factory_images || []).map((img, i) => (
                          <div key={i} style={{ width: 64, height: 64, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0, border: '1px solid #e8e5de' }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button onClick={() => removeFactoryImage(img)} style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: 16, height: 16, borderRadius: '50%', cursor: 'pointer', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                          </div>
                        ))}
                        {(settings.factory_images || []).length < 3 && (
                          <>
                            <input ref={factoryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadFactoryImage} />
                            <div
                              onClick={() => factoryRef.current?.click()}
                              style={{ width: 64, height: 64, borderRadius: 8, border: '1px dashed #c8c4bc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.borderColor = '#1a1814'}
                              onMouseLeave={e => e.currentTarget.style.borderColor = '#c8c4bc'}>
                              {uploadingFactory
                                ? <span style={{ fontSize: 10, color: '#b0ab9e' }}>...</span>
                                : <span style={{ fontSize: 20, color: '#b0ab9e' }}>+</span>}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Card 3: Company info ── */}
                <div style={{ background: '#faf9f7', border: '1px solid #e8e5de', borderRadius: 14, padding: '22px 20px' }}>
                  <p style={{ fontSize: 10, fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif", letterSpacing: isAr ? 0 : '1.2px', textTransform: 'uppercase', color: '#b0ab9e', marginBottom: 18 }}>
                    {isAr ? 'معلومات الشركة' : lang === 'zh' ? '公司信息' : 'Company Info'}
                  </p>
                  <div className="settings-form-grid">
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>{t.companyName} *</label>
                      <input className="settings-input" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} type="text" value={settings.company_name || ''} onChange={e => setSettings({ ...settings, company_name: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>
                        {isAr ? 'نوع النشاط التجاري' : lang === 'zh' ? '企业类型' : 'Business type'}
                      </label>
                      <select className="settings-select" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', width: '100%' }} value={settings.business_type || ''} onChange={e => setSettings({ ...settings, business_type: e.target.value })}>
                        <option value="">{isAr ? 'اختر' : lang === 'zh' ? '请选择' : 'Select'}</option>
                        <option value="manufacturer">{isAr ? 'مصنع' : lang === 'zh' ? '制造商' : 'Manufacturer'}</option>
                        <option value="trading_company">{isAr ? 'شركة تجارية' : lang === 'zh' ? '贸易公司' : 'Trading Company'}</option>
                        <option value="agent">{isAr ? 'وكيل' : lang === 'zh' ? '代理商' : 'Agent'}</option>
                        <option value="distributor">{isAr ? 'موزع' : lang === 'zh' ? '经销商' : 'Distributor'}</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>{t.speciality}</label>
                      <select className="settings-select" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', width: '100%' }} value={settings.speciality || ''} onChange={e => setSettings({ ...settings, speciality: e.target.value })}>
                        <option value="">{isAr ? 'اختر' : lang === 'zh' ? '请选择' : 'Select'}</option>
                        {CATEGORIES[lang]?.filter(c => c.val !== 'all').map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>
                        {isAr ? 'سنة التأسيس' : lang === 'zh' ? '成立年份' : 'Year established'}
                      </label>
                      <input className="settings-input" style={{ fontFamily: 'var(--font-sans)', direction: 'ltr' }} type="number" value={settings.year_established || ''} onChange={e => setSettings({ ...settings, year_established: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>{t.city} *</label>
                      <input className="settings-input" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} type="text" value={settings.city || ''} onChange={e => setSettings({ ...settings, city: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>{t.country} *</label>
                      <input className="settings-input" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} type="text" value={settings.country || ''} onChange={e => setSettings({ ...settings, country: e.target.value })} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>
                        {isAr ? 'عنوان الشركة' : lang === 'zh' ? '公司地址' : 'Company address'}
                      </label>
                      <input className="settings-input" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} type="text" value={settings.company_address || ''} onChange={e => setSettings({ ...settings, company_address: e.target.value })} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>
                        {isAr ? 'موقع الشركة الإلكتروني' : lang === 'zh' ? '公司官网链接' : 'Company website URL'}
                      </label>
                      <input className="settings-input" style={{ fontFamily: 'var(--font-sans)', direction: 'ltr' }} type="url" value={settings.company_website || ''} onChange={e => setSettings({ ...settings, company_website: e.target.value })} />
                    </div>
                  </div>
                </div>

                {/* ── Card 4: Contact details ── */}
                <div style={{ background: '#faf9f7', border: '1px solid #e8e5de', borderRadius: 14, padding: '22px 20px' }}>
                  <p style={{ fontSize: 10, fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif", letterSpacing: isAr ? 0 : '1.2px', textTransform: 'uppercase', color: '#b0ab9e', marginBottom: 18 }}>
                    {isAr ? 'بيانات التواصل' : lang === 'zh' ? '联系方式' : 'Contact Details'}
                  </p>
                  <div className="settings-form-grid">
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>{t.whatsapp}</label>
                      <input className="settings-input" style={{ fontFamily: 'var(--font-sans)', direction: 'ltr' }} type="tel" value={settings.whatsapp || ''} onChange={e => setSettings({ ...settings, whatsapp: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>{t.wechat}</label>
                      <input className="settings-input" style={{ fontFamily: 'var(--font-sans)', direction: 'ltr' }} type="text" value={settings.wechat || ''} onChange={e => setSettings({ ...settings, wechat: e.target.value })} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>
                        {isAr ? 'اللغات' : lang === 'zh' ? '支持语言' : 'Languages'}
                      </label>
                      <input className="settings-input" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} type="text" value={settings.languages || ''} onChange={e => setSettings({ ...settings, languages: e.target.value })} />
                      <p style={{ fontSize: 11, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", marginTop: 6 }}>
                        {isAr ? 'اكتبها مفصولة بفواصل أو أسطر جديدة' : lang === 'zh' ? '可用逗号或换行分隔' : 'Separate with commas or line breaks'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Card 5: Commercial details ── */}
                <div style={{ background: '#faf9f7', border: '1px solid #e8e5de', borderRadius: 14, padding: '22px 20px' }}>
                  <p style={{ fontSize: 10, fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif", letterSpacing: isAr ? 0 : '1.2px', textTransform: 'uppercase', color: '#b0ab9e', marginBottom: 18 }}>
                    {isAr ? 'التفاصيل التجارية' : lang === 'zh' ? '商业资料' : 'Commercial Details'}
                  </p>
                  <div className="settings-form-grid">
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>
                        {isAr ? 'الحد الأدنى لقيمة الطلب (USD)' : lang === 'zh' ? '最低订单金额 (USD)' : 'Minimum order value (USD)'}
                      </label>
                      <input className="settings-input" style={{ fontFamily: 'var(--font-sans)', direction: 'ltr' }} type="number" value={settings.min_order_value || ''} onChange={e => setSettings({ ...settings, min_order_value: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>
                        {isAr ? 'عملة العرض' : lang === 'zh' ? '显示货币' : 'Display currency'}
                      </label>
                      <select className="settings-select" style={{ fontFamily: 'var(--font-sans)', direction: 'ltr', width: '100%' }} value={settings.preferred_display_currency || 'USD'} onChange={e => setSettings({ ...settings, preferred_display_currency: e.target.value })}>
                        {DISPLAY_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>
                        {isAr ? 'دعم التخصيص' : lang === 'zh' ? '定制支持' : 'Customization support'}
                      </label>
                      <select className="settings-select" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', width: '100%' }} value={settings.customization_support || ''} onChange={e => setSettings({ ...settings, customization_support: e.target.value })}>
                        <option value="">{isAr ? 'اختر' : lang === 'zh' ? '请选择' : 'Select'}</option>
                        <option value="yes">{isAr ? 'نعم' : lang === 'zh' ? '是' : 'Yes'}</option>
                        <option value="oem">OEM</option>
                        <option value="odm">ODM</option>
                        <option value="no">{isAr ? 'لا' : lang === 'zh' ? '否' : 'No'}</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>{t.tradeLink} *</label>
                      <input className="settings-input" style={{ fontFamily: 'var(--font-sans)', direction: 'ltr' }} type="url" value={settings.trade_link || ''} onChange={e => setSettings({ ...settings, trade_link: e.target.value })} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 6 }}>
                        {isAr ? 'الأسواق التي تصدّرون إليها' : lang === 'zh' ? '出口市场' : 'Export markets'}
                      </label>
                      <input className="settings-input" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} type="text" value={settings.export_markets || ''} onChange={e => setSettings({ ...settings, export_markets: e.target.value })} />
                      <p style={{ fontSize: 11, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", marginTop: 6 }}>
                        {isAr ? 'اكتب الدول أو المناطق مفصولة بفواصل' : lang === 'zh' ? '填写国家或地区，逗号分隔' : 'List countries or regions, separated by commas'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Card 6: Company description ── */}
                <div style={{ background: '#faf9f7', border: '1px solid #e8e5de', borderRadius: 14, padding: '22px 20px' }}>
                  <p style={{ fontSize: 10, fontFamily: isAr ? "'Tajawal', sans-serif" : "'Cormorant Garamond', serif", letterSpacing: isAr ? 0 : '1.2px', textTransform: 'uppercase', color: '#b0ab9e', marginBottom: 18 }}>
                    {isAr ? 'وصف الشركة' : lang === 'zh' ? '公司介绍' : 'Company Description'}
                  </p>
                  <label style={{ fontSize: 12, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", display: 'block', marginBottom: 8 }}>
                    {isAr ? 'اكتب نبذة عن شركتك' : lang === 'zh' ? '请介绍您的公司' : 'Tell buyers about your company'}
                  </label>
                  <textarea
                    className="settings-textarea"
                    rows={5}
                    style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                    value={settings.company_description || ''}
                    onChange={e => setSettings({ ...settings, company_description: e.target.value })}
                    dir={isAr ? 'rtl' : 'ltr'}
                  />
                  <p style={{ fontSize: 11, color: '#b0ab9e', fontFamily: "'Tajawal', sans-serif", marginTop: 8 }}>
                    {isAr ? 'يمكنك الكتابة بأي لغة' : lang === 'zh' ? '可使用任意语言填写' : 'You can write in any language'}
                  </p>
                </div>

                {/* ── Save button ── */}
                <button
                  onClick={saveSettings}
                  disabled={savingSettings}
                  style={{ background: '#1a1814', color: '#ffffff', border: 'none', borderRadius: 8, padding: '13px 32px', fontFamily: "'Tajawal', sans-serif", fontSize: 14, fontWeight: 600, cursor: savingSettings ? 'default' : 'pointer', alignSelf: 'flex-start', fontVariantNumeric: 'lining-nums', opacity: savingSettings ? 0.7 : 1 }}>
                  {settingsPrimaryButtonLabel}
                </button>

              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════
          EDIT OFFER MODAL
      ══════════════════════════════════════ */}
      {selectedRequest && (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
    <div style={{ background: 'var(--bg-overlay)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-xl)', padding: '36px 32px', width: '100%', maxWidth: 520, maxHeight: '80vh', overflowY: 'auto' }}>
      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
        {isAr ? 'تفاصيل الطلب' : lang === 'zh' ? '需求详情' : 'Request Details'}
      </p>
      <h3 style={{ fontSize: 20, fontWeight: 400, color: 'var(--text-primary)', marginBottom: 20, ...arFont }}>{getTitle(selectedRequest)}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {[
          [isAr ? 'التاجر' : lang === 'zh' ? '采购商' : 'Buyer', selectedRequest.profiles?.full_name || selectedRequest.profiles?.company_name || '—'],
          [isAr ? 'الكمية' : lang === 'zh' ? '数量' : 'Quantity', selectedRequest.quantity || '—'],
          [isAr ? 'التصنيف' : lang === 'zh' ? '分类' : 'Category', cats.find(c => c.val === selectedRequest.category)?.label || selectedRequest.category || '—'],
          [isAr ? 'الميزانية' : lang === 'zh' ? '预算' : 'Budget', selectedRequest.budget_per_unit ? (lang === 'zh' ? `${selectedRequest.budget_per_unit} 沙特里亚尔（SAR）` : lang === 'en' ? `${selectedRequest.budget_per_unit} SAR (Saudi Riyal)` : `${selectedRequest.budget_per_unit} SAR`) : '—'],
          [isAr ? 'خطة الدفع' : lang === 'zh' ? '付款计划' : 'Payment Plan', selectedRequest.payment_plan ? (lang === 'zh' ? `${selectedRequest.payment_plan}% 定金，${100 - selectedRequest.payment_plan}% 发货前` : `${selectedRequest.payment_plan}%`) : '—'],
          [isAr ? 'العينة' : lang === 'zh' ? '样品' : 'Sample', selectedRequest.sample_requirement ? (isAr ? (selectedRequest.sample_requirement === 'required' ? 'إلزامية' : selectedRequest.sample_requirement === 'preferred' ? 'مفضلة' : 'غير مطلوبة') : lang === 'zh' ? (selectedRequest.sample_requirement === 'required' ? '必须提供' : selectedRequest.sample_requirement === 'preferred' ? '建议提供' : '无需样品') : (selectedRequest.sample_requirement === 'required' ? 'Required' : selectedRequest.sample_requirement === 'preferred' ? 'Preferred' : 'Not needed')) : '—'],
        ].map(([label, value]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-disabled)', flexShrink: 0 }}>{label}</span>
            <span style={{ fontSize: 13, color: 'var(--text-primary)', textAlign: isAr ? 'left' : 'right', ...arFont }}>{value}</span>
          </div>
        ))}
        {/* Description row — rendered separately to handle Arabic-only fallback for ZH suppliers */}
        {(() => {
          const descLabel = isAr ? 'الوصف' : lang === 'zh' ? '描述' : 'Description';
          const zhFallback = lang === 'zh' && !selectedRequest.description_zh && !selectedRequest.description_en && !!(selectedRequest.description_ar || selectedRequest.description);
          const descText = isAr
            ? (selectedRequest.description_ar || selectedRequest.description || '—')
            : lang === 'zh'
              ? (selectedRequest.description_zh || selectedRequest.description_en || selectedRequest.description_ar || selectedRequest.description || '—')
              : (selectedRequest.description_en || selectedRequest.description || '—');
          return (
            <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-disabled)', flexShrink: 0 }}>{descLabel}</span>
                <span style={{ fontSize: 13, color: 'var(--text-primary)', textAlign: isAr ? 'left' : 'right', direction: zhFallback ? 'rtl' : 'inherit', ...arFont }}>{descText}</span>
              </div>
              {zhFallback && (
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', textAlign: 'right', margin: '4px 0 0', fontFamily: 'var(--font-ar)' }}>暂无中文翻译</p>
              )}
            </div>
          );
        })()}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button className="btn-dark-sm" onClick={() => { setSelectedRequest(null); toggleOfferForm(selectedRequest.id); }} style={{ flex: 1, minHeight: 44 }}>
          {isAr ? 'قدم عرضك' : lang === 'zh' ? '提交报价' : 'Submit Quote'}
        </button>
        <button className="btn-outline" onClick={() => setSelectedRequest(null)} style={{ minHeight: 44, padding: '0 18px' }}>
          {isAr ? 'إغلاق' : lang === 'zh' ? '关闭' : 'Close'}
        </button>
      </div>
    </div>
  </div>
)}
{editOfferModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            width: '100%', maxWidth: 440,
            animation: 'slideUp 0.25s ease',
            boxShadow: 'var(--shadow-md)',
          }}>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
              {isAr ? 'تعديل العرض' : lang === 'zh' ? '编辑报价' : 'Edit Offer'}
            </p>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 20, ...arFont }}>
              {getTitle(editOfferModal.requests)}
            </p>

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className="form-label">{isAr ? 'سعر الوحدة / المنتج' : lang === 'zh' ? '产品单价' : 'Product / Unit Price'}</label>
                <input className="form-input" type="number" dir="ltr" value={editOfferForm.price}
                  onChange={e => setEditOfferForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'تكلفة الشحن' : lang === 'zh' ? '运费' : 'Shipping Cost'}</label>
                <input className="form-input" type="number" dir="ltr" value={editOfferForm.shippingCost || ''}
                  onChange={e => setEditOfferForm(f => ({ ...f, shippingCost: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'طريقة الشحن' : lang === 'zh' ? '运输方式' : 'Shipping Method'}</label>
                <input className="form-input" value={editOfferForm.shippingMethod || ''}
                  onChange={e => setEditOfferForm(f => ({ ...f, shippingMethod: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{t.moq}</label>
                <input className="form-input" value={editOfferForm.moq}
                  onChange={e => setEditOfferForm(f => ({ ...f, moq: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'أيام التسليم' : lang === 'zh' ? '交货天数' : 'Delivery Days'}</label>
                <input className="form-input" type="number" dir="ltr" value={editOfferForm.days}
                  onChange={e => setEditOfferForm(f => ({ ...f, days: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'بلد المنشأ' : lang === 'zh' ? '原产国' : 'Country of Origin'}</label>
                <input className="form-input" value={editOfferForm.origin || 'China'}
                  onChange={e => setEditOfferForm(f => ({ ...f, origin: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'ملاحظة' : lang === 'zh' ? '备注' : 'Note'}</label>
                <textarea className="form-input" rows={2} style={{ resize: 'none' }} value={editOfferForm.note}
                  onChange={e => setEditOfferForm(f => ({ ...f, note: e.target.value }))} />
              </div>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 8,
              marginBottom: 18,
            }}>
              <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'إجمالي المنتجات' : lang === 'zh' ? '产品合计' : 'Products Total'}</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', direction: 'ltr' }}>{getOfferProductSubtotal({ price: editOfferForm.price }, editOfferModal?.requests).toFixed(2)} USD</p>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الشحن' : lang === 'zh' ? '运费' : 'Shipping'}</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', direction: 'ltr' }}>{getOfferShippingCost({ shipping_cost: editOfferForm.shippingCost }).toFixed(2)} USD</p>
              </div>
              <div style={{ padding: '10px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الإجمالي التقديري' : lang === 'zh' ? '预计总额' : 'Estimated Total'}</p>
                <p style={{ fontSize: 14, color: 'var(--text-primary)', direction: 'ltr' }}>{getOfferEstimatedTotal({ price: editOfferForm.price, shipping_cost: editOfferForm.shippingCost }, editOfferModal?.requests).toFixed(2)} USD</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveEditOffer} disabled={savingEditOffer} className="btn-primary"
                style={{ flex: 1, padding: '11px', fontSize: 12, minHeight: 44 }}>
                {savingEditOffer ? t.saving : t.save}
              </button>
              <button onClick={() => setEditOfferModal(null)} className="btn-outline"
                style={{ padding: '11px 18px', fontSize: 12, minHeight: 44 }}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MOBILE BOTTOM NAVIGATION
      ══════════════════════════════════════ */}
      <nav className="supplier-bottom-nav" dir={isAr ? 'rtl' : 'ltr'}>
        {[
          {
            id: 'home',
            icon: '⌂',
            label: isAr ? 'الرئيسية' : lang === 'zh' ? '主页' : 'Home',
            onClick: () => setActiveTab('overview'),
          },
          {
            id: 'requests',
            icon: '◈',
            label: isAr ? 'الطلبات' : lang === 'zh' ? '需求' : 'Requests',
            onClick: () => setActiveTab('requests'),
          },
          {
            id: 'products',
            icon: '▦',
            label: isAr ? 'المنتجات' : lang === 'zh' ? '产品' : 'Products',
            onClick: () => setActiveTab('my-products'),
          },
          {
            id: 'messages',
            icon: '◉',
            label: isAr ? 'الرسائل' : lang === 'zh' ? '消息' : 'Messages',
            badge: stats.messages > 0 ? stats.messages : null,
            onClick: () => setActiveTab('messages'),
          },
          {
            id: 'more',
            icon: '⋯',
            label: isAr ? 'المزيد' : lang === 'zh' ? '更多' : 'More',
            badge: (needsVerification || needsPayoutSetup) ? '!' : null,
            onClick: () => setMoreMenuOpen(true),
          },
        ].map(item => (
          <button
            key={item.id}
            className={`supplier-bottom-nav-item${activeBottomTab === item.id ? ' active' : ''}`}
            onClick={item.onClick}
          >
            {item.badge && <span className="nav-badge">{item.badge}</span>}
            <span className="nav-icon">{item.icon}</span>
            <span className={`nav-label${isAr ? ' ar' : ''}`}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* ══════════════════════════════════════
          MORE MENU (mobile slide-up sheet)
      ══════════════════════════════════════ */}
      {moreMenuOpen && (
        <>
          <div className="more-menu-overlay" onClick={() => setMoreMenuOpen(false)} />
          <div className="more-menu-sheet" dir={isAr ? 'rtl' : 'ltr'}>
            <div className="more-menu-handle" />
            {[
              { id: 'offers',             label: isAr ? 'عروضي' : lang === 'zh' ? '我的报价' : 'My Offers',          badge: null },
              { id: 'payout',             label: isAr ? 'المدفوعات' : lang === 'zh' ? '收款设置' : 'Payments',       badge: needsPayoutSetup ? '!' : null },
              { id: 'verification',       label: isAr ? 'التحقق' : lang === 'zh' ? '企业认证' : 'Verification',      badge: needsVerification ? '!' : null },
              { id: 'product-inquiries',  label: isAr ? 'استفسارات المنتجات' : lang === 'zh' ? '产品咨询' : 'Product Inquiries', badge: stats.productInquiries > 0 ? stats.productInquiries : null },
              { id: 'reviews',            label: isAr ? 'تقييماتي' : lang === 'zh' ? '我的评价' : 'Reviews',         badge: null },
              { id: 'samples',            label: isAr ? 'العينات' : lang === 'zh' ? '样品管理' : 'Samples',          badge: stats.pendingSamples > 0 ? stats.pendingSamples : null },
              { id: 'settings',           label: isAr ? 'الإعدادات' : lang === 'zh' ? '账户设置' : 'Settings',       badge: null },
            ].map(item => {
              const locked = lockedTabIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  className={`more-menu-item${locked ? ' locked' : ''}`}
                  style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', textAlign: isAr ? 'right' : 'left' }}
                  onClick={() => { if (!locked) { setActiveTab(item.id); setMoreMenuOpen(false); } }}
                >
                  <span>{item.label}{locked && <span style={{ marginInlineStart: 8, fontSize: 10, color: 'var(--text-disabled)' }}>{isAr ? 'مقفل' : lang === 'zh' ? '锁定' : 'Locked'}</span>}</span>
                  {item.badge && <span className="item-badge">{item.badge}</span>}
                  {!item.badge && !locked && <span style={{ color: 'var(--text-disabled)', fontSize: 16 }}>{isAr ? '←' : '→'}</span>}
                </button>
              );
            })}
          </div>
        </>
      )}

      <Footer lang={lang} />
    </div>
  );
}