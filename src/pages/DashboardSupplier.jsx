import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb, SUPABASE_URL } from '../supabase';
import Footer from '../components/Footer';
import { DISPLAY_CURRENCIES } from '../lib/displayCurrency';
import {
  PRODUCT_GALLERY_LIMIT,
  buildProductSpecs,
  getProductGalleryImages,
  getPrimaryProductImage,
  normalizeProductDraftMedia,
} from '../lib/productMedia';
import { runWithOptionalColumns } from '../lib/supabaseColumnFallback';
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

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const STORAGE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/product-images/';

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
    { val: 'all', label: 'الكل' }, { val: 'electronics', label: 'إلكترونيات' },
    { val: 'furniture', label: 'أثاث' }, { val: 'clothing', label: 'ملابس' },
    { val: 'building', label: 'مواد بناء' }, { val: 'food', label: 'غذاء' }, { val: 'other', label: 'أخرى' },
  ],
  en: [
    { val: 'all', label: 'All' }, { val: 'electronics', label: 'Electronics' },
    { val: 'furniture', label: 'Furniture' }, { val: 'clothing', label: 'Clothing' },
    { val: 'building', label: 'Building Materials' }, { val: 'food', label: 'Food' }, { val: 'other', label: 'Other' },
  ],
  zh: [
    { val: 'all', label: '全部' }, { val: 'electronics', label: '电子产品' },
    { val: 'furniture', label: '家具' }, { val: 'clothing', label: '服装' },
    { val: 'building', label: '建材' }, { val: 'food', label: '食品' }, { val: 'other', label: '其他' },
  ],
};

const OFFER_STATUS = {
  ar: { pending: 'قيد المراجعة', accepted: 'مقبول', rejected: 'مرفوض' },
  en: { pending: 'Pending', accepted: 'Accepted', rejected: 'Rejected' },
  zh: { pending: '待审核', accepted: '已接受', rejected: '已拒绝' },
};

const T = {
  ar: {
    tag: 'مَعبر · لوحة المورد', welcome: 'أهلاً،', desc: 'تابع عروضك ومنتجاتك ورسائلك من مكان واحد', supplierStageLabel: 'حالة الحساب', supplierIdLabel: 'معرّف مورد مَعبر',
    overview: 'نظرة عامة', myProducts: 'منتجاتي', offers: 'عروضي', addProduct: 'إضافة منتج',
    messages: 'الرسائل', settings: 'إعداداتي', offersCount: 'عروض مقدمة',
    productsCount: 'منتجات نشطة', messagesCount: 'رسائل جديدة',
    browseRequests: 'تصفح طلبات التجار', addNewProduct: 'إضافة منتج جديد',
    quickActions: 'الإجراءات السريعة', stats: 'الإحصائيات', backHome: 'العودة للرئيسية ←', back: 'رجوع ←',
    myOffers: 'عروضي', noOffers: 'ما قدمت عروض بعد', browseReqs: 'تصفح الطلبات',
    trackingPrompt: 'أدخل رقم التتبع لإخطار التاجر', trackingNum: 'رقم التتبع', send: 'إرسال',
    contactTrader: 'تواصل مع التاجر', tracking: 'رقم التتبع:',
    messagesTitle: 'الرسائل', noMessages: 'ما عندك رسائل بعد',
    addProductTitle: 'إضافة منتج جديد', myProductsTitle: 'منتجاتي', noProducts: 'ما أضفت منتجات بعد',
    nameAr: 'اسم المنتج بالعربي', nameEn: 'اسم المنتج بالإنجليزي *', nameZh: 'اسم المنتج بالصيني *',
    category: 'التصنيف *', currency: 'العملة *', price: 'السعر الابتدائي *', moq: 'MOQ *', descLabel: 'الوصف بالعربي', descEnLabel: 'الوصف بالإنجليزي *', descHint: 'العربي اختياري، والإنجليزي هو الأساس لعرض المنتج وترجمته لاحقًا.',
    save: 'حفظ', cancel: 'إلغاء', saving: '...',
    edit: 'تعديل', delete: 'حذف', confirmDelete: 'هل تبي تحذف هذا المنتج؟',
    active: 'نشط', inactive: 'موقوف', toggleActive: 'تفعيل/إيقاف',
    needsAttention: 'يحتاج انتباهك', acceptedOffer: 'عرض مقبول — تواصل مع التاجر',
    offerRejected: 'تم رفض عرضك على',
    uploadImage: 'رفع صورة', uploadVideo: 'رفع فيديو',
    uploadingImage: 'جاري رفع الصورة...', uploadingVideo: 'جاري رفع الفيديو...',
    imageUploaded: 'تم رفع الصورة', videoUploaded: 'تم رفع الفيديو', maxVideo: 'الحد الأقصى للفيديو 50MB',
    galleryImages: 'صور المنتج', addMoreImages: 'إضافة صور أخرى', galleryHint: `حتى ${PRODUCT_GALLERY_LIMIT} صور — الصورة الأولى هي الرئيسية حالياً`, maxImagesReached: `وصلت للحد الأقصى (${PRODUCT_GALLERY_LIMIT} صور)`, maxImagesError: `يمكن رفع ${PRODUCT_GALLERY_LIMIT} صور كحد أقصى`, removeMedia: 'حذف', previewStep: 'معاينة قبل النشر', continueToPreview: 'متابعة للمعاينة', backToEdit: 'رجوع للتعديل', publishNow: 'نشر المنتج', previewNote: 'راجع الوسائط والمواصفات والسعر قبل النشر. العملة المعروضة هنا لا تغيّر عملة المنتج الأصلية.', previewBadge: 'معاينة', previewEmptyMedia: 'ما تمت إضافة صور بعد', primaryImage: 'الصورة الرئيسية', videoLimitHint: `فيديو واحد فقط لكل منتج`,
    specsTitle: 'مواصفات المنتج', specMaterial: 'الخامة / المادة', specDimensions: 'الأبعاد / المقاس', specWeight: 'وزن القطعة', specColors: 'الألوان أو الخيارات', specPackaging: 'تفاصيل التغليف', specCustomization: 'التخصيص / OEM', specLeadTime: 'مدة التجهيز (أيام)', productSavedWithFallback: 'تم حفظ المنتج، لكن بعض الحقول الجديدة تحتاج تفعيل قاعدة البيانات حتى تُحفظ بالكامل.',
    sampleSettings: 'إعدادات العينة', sampleAvailable: 'متاح للعينة',
    samplePrice: 'سعر العينة (ريال) *', sampleShipping: 'تكلفة الشحن (ريال)',
    sampleMaxQty: 'الحد الأقصى للكمية', sampleNote: 'ملاحظة للعينة',
    settingsTitle: 'إعدادات الحساب', companyName: 'اسم الشركة',
    bioAr: 'وصف الشركة بالعربي', bioEn: 'وصف الشركة بالإنجليزي', bioZh: 'وصف الشركة بالصيني',
    whatsapp: 'واتساب', wechat: 'WeChat', city: 'المدينة', country: 'الدولة',
    tradeLink: 'رابط صفحتك التجارية', speciality: 'تخصص الشركة', minOrder: 'أقل قيمة طلب (ريال)',
    logo: 'لوقو / صورة الشركة', factoryImages: 'صور المصنع (حتى 3)',
    uploadLogo: 'رفع اللوقو', uploadFactory: 'إضافة صورة', uploadingLogo: 'جاري الرفع...',
    saveSettings: 'حفظ الإعدادات', settingsSaved: 'تم حفظ التغييرات', days: 'يوم',
    verificationTab: 'التحقق', verificationTitle: 'أكمل التحقق التجاري', verificationIntro: 'أرسل بيانات التحقق والمستندات من هنا بعد إنشاء الحساب. لن نطلبها في التسجيل الأولي.',
    verificationStatusIncomplete: 'التحقق غير مكتمل', verificationStatusComplete: 'تم إرسال التحقق للمراجعة', verificationStatusLocked: 'الحساب الآن تحت المراجعة',
    verificationCtaTitle: 'أكمل التحقق التجاري', verificationCtaBody: 'أرسل السجل التجاري وصورة المصنع وبيانات الخبرة حتى يدخل طلبك مرحلة المراجعة.', verificationCtaAction: 'أكمل التحقق ←',
    regNumber: 'رقم تسجيل الشركة *', yearsExp: 'سنوات الخبرة *', employees: 'عدد الموظفين (اختياري)', businessLicense: 'رخصة الأعمال أو هوية المنشأة *', factoryPhoto: 'صورة المصنع أو المستودع *', replaceFile: 'استبدال الملف', viewCurrentFile: 'عرض الملف الحالي', secureStorageNote: 'يتم حفظ هذه الملفات داخل تخزين خاص، ولا تُعرض بروابط عامة.', verificationSubmitted: 'تم إرسال التحقق بنجاح. الحساب الآن في حالة verification_under_review.', verificationMissing: 'يرجى تعبئة جميع حقول التحقق المطلوبة ورفع المستندات.',
    payoutTab: 'المدفوعات', payoutTitle: 'إعدادات استلام الدفعات', payoutIntro: 'أضف طريقة استلام الدفعات بعد قبول الحساب فقط.', payoutLocked: 'إعداد استلام الدفعات يفتح بعد الموافقة على حسابك.', payoutCtaTitle: 'أكمل إعداد استلام الدفعات', payoutCtaBody: 'حسابك مقبول، لكن بيانات استلام الأرباح غير مكتملة بعد.', payoutCtaAction: 'إعداد الدفعات ←', payoutSaved: 'تم حفظ بيانات الدفعات', payMethod: 'طريقة استلام المدفوعات *', alipay: 'Alipay', swift: 'تحويل بنكي (SWIFT)', alipayAccount: 'رقم حساب Alipay *', swiftCode: 'رمز SWIFT *', bankName: 'اسم البنك *', onboardingTitle: 'طلبك ما زال في مرحلة الانضمام', onboardingBody: 'هذه لوحة المورد الأساسية، لكن الإجراءات الأساسية ما زالت مقفلة. أكمل ملف الشركة وأرسل التحقق حتى ينتقل الحساب إلى verification_under_review.', onboardingProgress: 'تقدّم الطلب', onboardingLockedTitle: 'المزايا المقفلة حتى التوثيق', onboardingLockedBody: 'الطلبات والعروض والمنتجات والرسائل وكل الإجراءات الأساسية تفتح فقط بعد اعتماد التحقق.', onboardingStepApply: '1) أكمل الملف الأساسي', onboardingStepReview: '2) أرسل التحقق للمراجعة', onboardingStepVisibility: '3) افتح التجربة الكاملة بعد التوثيق', onboardingGoSettings: 'إعدادات الملف', onboardingStatusDraft: 'verification_required', onboardingVerificationReady: 'بعد إرسال التحقق ينتقل الحساب مباشرة إلى verification_under_review.', verificationSubmitAction: 'إرسال التحقق',
  },
  en: {
    tag: 'Maabar · Supplier Dashboard', welcome: 'Welcome,', desc: 'Manage your offers, products and messages in one place', supplierStageLabel: 'Account status', supplierIdLabel: 'Maabar Supplier ID',
    overview: 'Overview', myProducts: 'My Products', offers: 'My Offers', addProduct: 'Add Product',
    messages: 'Messages', settings: 'Settings', offersCount: 'Offers Submitted',
    productsCount: 'Active Products', messagesCount: 'New Messages',
    browseRequests: 'Browse Trader Requests', addNewProduct: 'Add New Product',
    quickActions: 'Quick Actions', stats: 'Overview', backHome: '← Back to Home', back: '← Back',
    myOffers: 'My Offers', noOffers: 'No offers yet', browseReqs: 'Browse Requests',
    trackingPrompt: 'Enter tracking number to notify buyer', trackingNum: 'Tracking number', send: 'Send',
    contactTrader: 'Contact Trader', tracking: 'Tracking:',
    messagesTitle: 'Messages', noMessages: 'No messages yet',
    addProductTitle: 'Add New Product', myProductsTitle: 'My Products', noProducts: 'No products yet',
    nameAr: 'Arabic Name', nameEn: 'English Name *', nameZh: 'Chinese Name *',
    category: 'Category *', currency: 'Currency *', price: 'Starting Price *', moq: 'MOQ *', descLabel: 'Arabic Description', descEnLabel: 'English Description *', descHint: 'Arabic is optional. English is the main source for listing quality and later translation.',
    save: 'Save', cancel: 'Cancel', saving: '...',
    edit: 'Edit', delete: 'Delete', confirmDelete: 'Delete this product?',
    active: 'Active', inactive: 'Paused', toggleActive: 'Toggle',
    needsAttention: 'Needs Attention', acceptedOffer: 'Offer accepted — Contact trader',
    offerRejected: 'Your offer was rejected on',
    uploadImage: 'Upload Image', uploadVideo: 'Upload Video',
    uploadingImage: 'Uploading...', uploadingVideo: 'Uploading...',
    imageUploaded: 'Image uploaded', videoUploaded: 'Video uploaded', maxVideo: 'Max 50MB',
    galleryImages: 'Product Images', addMoreImages: 'Add More Images', galleryHint: `Up to ${PRODUCT_GALLERY_LIMIT} images — the first image stays the primary cover`, maxImagesReached: `Maximum reached (${PRODUCT_GALLERY_LIMIT} images)`, maxImagesError: `You can upload up to ${PRODUCT_GALLERY_LIMIT} images`, removeMedia: 'Remove', previewStep: 'Preview Before Publish', continueToPreview: 'Continue to Preview', backToEdit: 'Back to Edit', publishNow: 'Publish Product', previewNote: 'Review media, specs, and pricing before publishing. Display currency never replaces the saved source product currency.', previewBadge: 'Preview', previewEmptyMedia: 'No product images yet', primaryImage: 'Primary image', videoLimitHint: 'One product video only',
    specsTitle: 'Product Specifications', specMaterial: 'Material', specDimensions: 'Dimensions / Size', specWeight: 'Unit Weight', specColors: 'Colors / Variants', specPackaging: 'Packaging Details', specCustomization: 'Customization / OEM', specLeadTime: 'Lead Time (days)', productSavedWithFallback: 'Product saved, but some new fields still need the DB migration before they can persist fully.',
    sampleSettings: 'Sample Settings', sampleAvailable: 'Available for Sample',
    samplePrice: 'Sample Price (SAR) *', sampleShipping: 'Shipping Cost (SAR)',
    sampleMaxQty: 'Max Sample Qty', sampleNote: 'Sample Note',
    settingsTitle: 'Account Settings', companyName: 'Company Name',
    bioAr: 'Description (Arabic)', bioEn: 'Description (English)', bioZh: 'Description (Chinese)',
    whatsapp: 'WhatsApp', wechat: 'WeChat', city: 'City', country: 'Country',
    tradeLink: 'Business Profile Link', speciality: 'Specialty', minOrder: 'Min Order Value (SAR)',
    logo: 'Company Logo', factoryImages: 'Factory Images (up to 3)',
    uploadLogo: 'Upload Logo', uploadFactory: 'Add Image', uploadingLogo: 'Uploading...',
    saveSettings: 'Save Settings', settingsSaved: 'Changes saved', days: 'days',
    verificationTab: 'Verification', verificationTitle: 'Complete business verification', verificationIntro: 'Submit the full verification details and documents here after signup. They are no longer required during initial registration.',
    verificationStatusIncomplete: 'Verification incomplete', verificationStatusComplete: 'Verification submitted for review', verificationStatusLocked: 'Account is currently under review',
    verificationCtaTitle: 'Complete your business verification', verificationCtaBody: 'Submit your registration, factory evidence, and experience details so your application can enter review.', verificationCtaAction: 'Complete verification →',
    regNumber: 'Company Registration Number *', yearsExp: 'Years of Experience *', employees: 'Number of Employees (optional)', businessLicense: 'Business License or Company ID *', factoryPhoto: 'Factory or Warehouse Photo *', replaceFile: 'Replace file', viewCurrentFile: 'View current file', secureStorageNote: 'These files are stored in private storage and are never exposed through public URLs.', verificationSubmitted: 'Verification submitted successfully. Your account is now in verification_under_review.', verificationMissing: 'Please complete all required verification fields and upload the required documents.',
    payoutTab: 'Payout', payoutTitle: 'Payout setup', payoutIntro: 'Add your payout details only after your account is approved.', payoutLocked: 'Payout setup unlocks after your account is approved.', payoutCtaTitle: 'Complete your payout setup', payoutCtaBody: 'Your account is approved, but payout details are still missing.', payoutCtaAction: 'Set up payout →', payoutSaved: 'Payout details saved', payMethod: 'Payment Method *', alipay: 'Alipay', swift: 'Bank Transfer (SWIFT)', alipayAccount: 'Alipay Account Number *', swiftCode: 'SWIFT Code *', bankName: 'Bank Name *', onboardingTitle: 'Your account is still in the supplier application stage', onboardingBody: 'This is the supplier dashboard, but core actions are still locked. Complete your company profile and submit verification so the account can move into verification_under_review.', onboardingProgress: 'Application progress', onboardingLockedTitle: 'Locked until verification is approved', onboardingLockedBody: 'Products, offers, messages, trader requests, and every core supplier action unlock only after verification is approved.', onboardingStepApply: '1) Complete the basic profile', onboardingStepReview: '2) Submit verification for review', onboardingStepVisibility: '3) Unlock the full supplier experience after verification', onboardingGoSettings: 'Profile settings', onboardingStatusDraft: 'verification_required', onboardingVerificationReady: 'Once you submit verification, the account moves directly into verification_under_review.', verificationSubmitAction: 'Submit verification',
  },
  zh: {
    tag: 'Maabar · 供应商控制台', welcome: '欢迎，', desc: '在一个地方管理您的报价、产品和消息', supplierStageLabel: '账户状态', supplierIdLabel: 'Maabar 供应商编号',
    overview: '概览', myProducts: '我的产品', offers: '我的报价', addProduct: '添加产品',
    messages: '消息', settings: '账户设置', offersCount: '已提交报价',
    productsCount: '活跃产品', messagesCount: '新消息',
    browseRequests: '浏览采购商需求', addNewProduct: '添加新产品',
    quickActions: '快速操作', stats: '数据概览', backHome: '← 返回首页', back: '← 返回',
    myOffers: '我的报价', noOffers: '暂无报价', browseReqs: '浏览需求',
    trackingPrompt: '输入物流单号以通知采购商', trackingNum: '物流单号', send: '发送',
    contactTrader: '联系采购商', tracking: '物流单号：',
    messagesTitle: '消息', noMessages: '暂无消息',
    addProductTitle: '添加新产品', myProductsTitle: '我的产品', noProducts: '暂无产品',
    nameAr: '阿拉伯语名称', nameEn: '英文名称 *', nameZh: '中文名称 *',
    category: '产品分类 *', currency: '货币 *', price: '起始价格 *', moq: '最小起订量 *', descLabel: '阿拉伯语描述', descEnLabel: '英文描述 *', descHint: '阿拉伯语可选，英文作为主描述，后续更方便做展示与翻译。',
    save: '保存', cancel: '取消', saving: '...',
    edit: '编辑', delete: '删除', confirmDelete: '确认删除此产品？',
    active: '上架', inactive: '下架', toggleActive: '切换状态',
    needsAttention: '需要处理', acceptedOffer: '报价已接受 — 联系采购商',
    offerRejected: '您的报价被拒绝',
    uploadImage: '上传图片', uploadVideo: '上传视频',
    uploadingImage: '上传中...', uploadingVideo: '上传中...',
    imageUploaded: '图片已上传', videoUploaded: '视频已上传', maxVideo: '最大50MB',
    galleryImages: '产品图片', addMoreImages: '继续添加图片', galleryHint: `最多 ${PRODUCT_GALLERY_LIMIT} 张图片 — 第一张将作为主图`, maxImagesReached: `已达到上限（${PRODUCT_GALLERY_LIMIT} 张）`, maxImagesError: `最多可上传 ${PRODUCT_GALLERY_LIMIT} 张图片`, removeMedia: '删除', previewStep: '发布前预览', continueToPreview: '继续预览', backToEdit: '返回编辑', publishNow: '发布产品', previewNote: '发布前请先确认媒体、规格和价格。这里的显示货币不会替代产品原始货币。', previewBadge: '预览', previewEmptyMedia: '暂未添加产品图片', primaryImage: '主图', videoLimitHint: '每个产品仅支持 1 个视频',
    specsTitle: '产品规格', specMaterial: '材质', specDimensions: '尺寸 / 规格', specWeight: '单件重量', specColors: '颜色 / 款式', specPackaging: '包装信息', specCustomization: '定制 / OEM', specLeadTime: '交期（天）', productSavedWithFallback: '产品已保存，但部分新字段仍需要先执行数据库迁移后才能完整持久化。',
    sampleSettings: '样品设置', sampleAvailable: '可提供样品',
    samplePrice: '样品价格 (SAR) *', sampleShipping: '运费 (SAR)',
    sampleMaxQty: '最大样品数量', sampleNote: '样品备注',
    settingsTitle: '账户设置', companyName: '公司名称',
    bioAr: '公司介绍（阿拉伯语）', bioEn: '公司介绍（英语）', bioZh: '公司介绍（中文）',
    whatsapp: 'WhatsApp', wechat: 'WeChat', city: '城市', country: '国家',
    tradeLink: '商业主页链接', speciality: '专业领域', minOrder: '最小订单金额 (SAR)',
    logo: '公司Logo', factoryImages: '工厂图片（最多3张）',
    uploadLogo: '上传Logo', uploadFactory: '添加图片', uploadingLogo: '上传中...',
    saveSettings: '保存设置', settingsSaved: '保存成功', days: '天',
    verificationTab: '认证', verificationTitle: '完成企业认证', verificationIntro: '注册后在这里补充完整认证资料和文件，初始注册不再要求一次填完。',
    verificationStatusIncomplete: '认证未完成', verificationStatusComplete: '认证资料已提交审核', verificationStatusLocked: '账户正在审核中',
    verificationCtaTitle: '请完成企业认证', verificationCtaBody: '请提交注册资料、工厂证明和经验信息，审核流程才会开始。', verificationCtaAction: '去完成认证 →',
    regNumber: '公司注册号 *', yearsExp: '从业年限 *', employees: '员工人数（可选）', businessLicense: '营业执照或企业身份证明 *', factoryPhoto: '工厂或仓库照片 *', replaceFile: '更换文件', viewCurrentFile: '查看当前文件', secureStorageNote: '这些文件保存在私有存储中，不会通过公开链接暴露。', verificationSubmitted: '认证资料已提交，账户当前处于 verification_under_review。', verificationMissing: '请填写所有必填认证信息并上传所需文件。',
    payoutTab: '收款', payoutTitle: '收款设置', payoutIntro: '只有在账户通过审核后才需要补充收款信息。', payoutLocked: '账户审核通过后才可设置收款方式。', payoutCtaTitle: '请完成收款设置', payoutCtaBody: '您的账户已通过审核，但收款资料还未填写完整。', payoutCtaAction: '去设置收款 →', payoutSaved: '收款信息已保存', payMethod: '收款方式 *', alipay: 'Alipay', swift: '银行转账 (SWIFT)', alipayAccount: 'Alipay账号 *', swiftCode: 'SWIFT代码 *', bankName: '银行名称 *', onboardingTitle: '您的账户仍处于供应商申请阶段', onboardingBody: '这里已经是供应商控制台，但核心操作仍然锁定。请先完善公司资料并提交认证，让账户进入 verification_under_review。', onboardingProgress: '申请进度', onboardingLockedTitle: '认证通过前保持锁定', onboardingLockedBody: '产品、报价、消息、采购需求以及所有核心供应商操作，都要在认证通过后才会开放。', onboardingStepApply: '1) 完成基础资料', onboardingStepReview: '2) 提交认证进入审核', onboardingStepVisibility: '3) 认证通过后解锁完整供应商体验', onboardingGoSettings: '资料设置', onboardingStatusDraft: 'verification_required', onboardingVerificationReady: '提交认证后，账户会直接进入 verification_under_review。', verificationSubmitAction: '提交认证',
  },
};

/* ─── Skeleton ───────────────────────────── */
const SkeletonCard = () => (
  <div style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: '40%', height: 14, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
        <div style={{ width: '25%', height: 10, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
      </div>
      <div style={{ width: 72, height: 32, background: 'var(--bg-raised)', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
    </div>
  </div>
);

/* ─── Stat Card ──────────────────────────── */
function StatCard({ label, value, onClick, highlight }) {
  return (
    <div onClick={onClick} style={{
      background: highlight ? 'var(--bg-raised)' : 'var(--bg-subtle)',
      border: `1px solid ${highlight ? 'var(--border-muted)' : 'var(--border-subtle)'}`,
      padding: '24px 28px', cursor: 'pointer', transition: 'all 0.2s',
      borderRadius: 'var(--radius-lg)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? 'var(--bg-raised)' : 'var(--bg-subtle)'}>
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16, fontWeight: 500 }}>{label}</p>
      <p style={{ fontSize: 44, fontWeight: 300, color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1, letterSpacing: -1.5 }}>{value}</p>
    </div>
  );
}

/* ─── Quick Action ───────────────────────── */
function QuickAction({ title, sub, onClick, primary, isAr }) {
  return (
    <div onClick={onClick} style={{
      padding: '24px',
      background: primary ? 'var(--bg-raised)' : 'var(--bg-subtle)',
      border: `1px solid ${primary ? 'var(--border-muted)' : 'var(--border-subtle)'}`,
      cursor: 'pointer', transition: 'all 0.2s', borderRadius: 'var(--radius-lg)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = primary ? 'var(--bg-raised)' : 'var(--bg-subtle)'}>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{title}</p>
      {sub && <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

/* ─── Back Button ────────────────────────── */
function BackBtn({ onClick, label }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', color: 'var(--text-disabled)',
      fontSize: 11, cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase',
      fontFamily: 'var(--font-sans)', padding: 0, marginBottom: 32, transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
      {label}
    </button>
  );
}

const emptyProduct = {
  name_ar: '', name_en: '', name_zh: '',
  price_from: '', currency: 'USD', category: 'other', moq: '',
  desc_en: '', desc_ar: '',
  image_url: null, gallery_images: [], video_url: null,
  spec_material: '', spec_dimensions: '', spec_unit_weight: '', spec_color_options: '', spec_packaging_details: '', spec_customization: '', spec_lead_time_days: '',
  sample_available: false, sample_price: '', sample_shipping: '', sample_max_qty: '3', sample_note: '',
};

const PRODUCT_OPTIONAL_DB_FIELDS = [
  'gallery_images',
  'spec_material',
  'spec_dimensions',
  'spec_unit_weight',
  'spec_color_options',
  'spec_packaging_details',
  'spec_customization',
  'spec_lead_time_days',
];

const buildProductWritePayload = (rawProduct, supplierId) => {
  const product = normalizeProductDraftMedia(rawProduct);
  const fallbackName = product.name_en || product.name_zh || product.name_ar || '';

  return {
    ...(supplierId ? { supplier_id: supplierId } : {}),
    name_ar: product.name_ar || fallbackName,
    name_en: product.name_en || fallbackName,
    name_zh: product.name_zh || fallbackName,
    price_from: parseFloat(product.price_from),
    currency: product.currency || 'USD',
    category: product.category || 'other',
    moq: product.moq,
    desc_en: product.desc_en,
    desc_ar: product.desc_ar || product.desc_en,
    image_url: product.image_url || null,
    gallery_images: product.gallery_images || [],
    video_url: product.video_url || null,
    spec_material: product.spec_material || null,
    spec_dimensions: product.spec_dimensions || null,
    spec_unit_weight: product.spec_unit_weight || null,
    spec_color_options: product.spec_color_options || null,
    spec_packaging_details: product.spec_packaging_details || null,
    spec_customization: product.spec_customization || null,
    spec_lead_time_days: product.spec_lead_time_days ? parseInt(product.spec_lead_time_days, 10) : null,
    sample_available: product.sample_available,
    sample_price: product.sample_available ? parseFloat(product.sample_price) : null,
    sample_shipping: product.sample_available ? parseFloat(product.sample_shipping || 0) : null,
    sample_max_qty: product.sample_available ? parseInt(product.sample_max_qty || 3, 10) : null,
    sample_note: product.sample_note || null,
    is_active: true,
  };
};

function getProductComposerValidationMessage(product, lang = 'en') {
  if (!product?.name_zh || !product?.name_en || !product?.price_from || !product?.moq || !product?.desc_en) {
    if (lang === 'ar') return 'يرجى تعبئة الحقول المطلوبة: الاسم الصيني، الاسم الإنجليزي، السعر، MOQ، والوصف الإنجليزي';
    if (lang === 'zh') return '请先填写必填字段：中文名、英文名、价格、MOQ 和英文描述';
    return 'Please fill required fields: Chinese name, English name, price, MOQ, and English description';
  }

  return '';
}

function getProductFormPlaceholders(lang = 'en') {
  if (lang === 'ar') {
    return {
      name_zh: 'مثال: سماعة بلوتوث TWS',
      name_en: 'Example: TWS Bluetooth Earbuds',
      name_ar: 'مثال: سماعات بلوتوث لاسلكية',
      moq: 'مثال: 500',
      price_from: 'مثال: 8.50',
      desc_en: 'Example: ABS charging case with Bluetooth 5.3, ENC mic, and OEM logo support.',
      desc_ar: 'مثال: علبة ABS مع بلوتوث 5.3 ودعم شعار OEM.',
      spec_material: 'ABS / فولاذ / قطن...',
      spec_dimensions: '20×12×8 cm',
      spec_unit_weight: '0.35 kg',
      spec_color_options: 'أسود، أبيض، مخصص',
      spec_packaging_details: 'كرتون داخلي + كرتون تصدير',
      spec_customization: 'شعار OEM، تغليف خاص، لون خاص',
      spec_lead_time_days: '15',
      sample_price: 'مثال: 50',
      sample_shipping: 'مثال: 25',
      sample_max_qty: '3',
      sample_note: 'مثال: العينة تُخصم من الطلب الكبير',
    };
  }

  if (lang === 'zh') {
    return {
      name_zh: '例：TWS 蓝牙耳机',
      name_en: 'Example: TWS Bluetooth Earbuds',
      name_ar: 'مثال: سماعات بلوتوث لاسلكية',
      moq: '例：500',
      price_from: '例：8.50',
      desc_en: 'Example: ABS charging case with Bluetooth 5.3, ENC mic, and OEM logo support.',
      desc_ar: '可选：给阿语买家补充说明',
      spec_material: '例：ABS / 铝合金 / 纯棉',
      spec_dimensions: '例：20×12×8 cm',
      spec_unit_weight: '例：0.35 kg',
      spec_color_options: '例：黑 / 白 / 定制色',
      spec_packaging_details: '例：彩盒 + 外箱',
      spec_customization: '例：支持 OEM / Logo / 包装定制',
      spec_lead_time_days: '例：15',
      sample_price: '例：50',
      sample_shipping: '例：25',
      sample_max_qty: '3',
      sample_note: '例：大货下单可返还样品费',
    };
  }

  return {
    name_zh: 'Example: TWS 蓝牙耳机',
    name_en: 'Example: TWS Bluetooth Earbuds',
    name_ar: 'Example: سماعات بلوتوث لاسلكية',
    moq: 'Example: 500',
    price_from: 'Example: 8.50',
    desc_en: 'Example: ABS charging case with Bluetooth 5.3, ENC mic, and OEM logo support.',
    desc_ar: 'Optional Arabic buyer-facing note',
    spec_material: 'Example: ABS / Aluminum / Cotton',
    spec_dimensions: 'Example: 20×12×8 cm',
    spec_unit_weight: 'Example: 0.35 kg',
    spec_color_options: 'Example: Black / White / Custom',
    spec_packaging_details: 'Example: Retail box + export carton',
    spec_customization: 'Example: OEM logo / custom packaging',
    spec_lead_time_days: 'Example: 15',
    sample_price: 'Example: 50',
    sample_shipping: 'Example: 25',
    sample_max_qty: '3',
    sample_note: 'Example: sample cost can be deducted from bulk order',
  };
}

function getProductCompletenessItems(product, lang = 'en') {
  return [
    {
      key: 'name_zh',
      label: lang === 'ar' ? 'اسم صيني واضح كما يستخدمه فريق المبيعات' : lang === 'zh' ? '销售团队常用的中文产品名' : 'Chinese sales-facing product name',
      done: Boolean(product?.name_zh),
    },
    {
      key: 'name_en',
      label: lang === 'ar' ? 'اسم إنجليزي واضح للمشتري' : lang === 'zh' ? '给买家看的英文产品名' : 'Buyer-facing English product name',
      done: Boolean(product?.name_en),
    },
    {
      key: 'desc_en',
      label: lang === 'ar' ? 'وصف إنجليزي يشرح المادة والاستخدام والجودة' : lang === 'zh' ? '英文描述包含材质、用途与质量点' : 'English description with material, use, and quality point',
      done: Boolean(product?.desc_en),
    },
    {
      key: 'pricing',
      label: lang === 'ar' ? 'السعر + العملة + MOQ' : lang === 'zh' ? '价格 + 币种 + MOQ' : 'Price + currency + MOQ',
      done: Boolean(product?.price_from) && Boolean(product?.currency) && Boolean(product?.moq),
    },
    {
      key: 'media',
      label: lang === 'ar' ? 'صورة رئيسية أو أكثر' : lang === 'zh' ? '至少 1 张主图' : 'At least one product image',
      done: getProductGalleryImages(product).length > 0,
    },
    {
      key: 'specs',
      label: lang === 'ar' ? 'مواصفات أو تعبئة أو OEM أو مدة تجهيز' : lang === 'zh' ? '规格 / 包装 / OEM / 交期 至少一项' : 'At least one spec, packaging, OEM, or lead-time detail',
      done: buildProductSpecs(product).length > 0,
    },
  ];
}

/* ─── Product Form (defined outside to prevent remount on parent render) ─ */
function ProductForm({
  data,
  setData,
  onSave,
  onCancel,
  onPreview,
  showPreviewAction = false,
  imgRef,
  vidRef,
  onImgChange,
  onVidChange,
  onRemoveImage,
  onRemoveVideo,
  uploadingImage,
  uploadingVideo,
  t,
  isAr,
  saving,
  usdRate,
  categories,
  saveLabel,
  lang,
}) {
  const arFont = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const productCategories = (categories || []).filter(c => c.val !== 'all');
  const galleryImages = getProductGalleryImages(data);
  const placeholders = getProductFormPlaceholders(lang);
  const completenessItems = getProductCompletenessItems(data, lang);
  const completenessDone = completenessItems.filter(item => item.done).length;
  const completenessPct = Math.round((completenessDone / completenessItems.length) * 100);

  return (
    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', padding: '28px 32px', maxWidth: 760, borderRadius: 'var(--radius-xl)' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', textTransform: 'uppercase' }}>{t.galleryImages}</p>
          <p style={{ fontSize: 11, color: 'var(--text-disabled)', ...arFont }}>{t.galleryHint}</p>
        </div>
        <input ref={imgRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={onImgChange} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 12 }}>
          {galleryImages.map((url, index) => (
            <div key={`${url}-${index}`} style={{ position: 'relative', height: 110, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-muted)' }}>
              <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {index === 0 && (
                <span style={{ position: 'absolute', left: 8, bottom: 8, fontSize: 9, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.55)', color: '#fff', letterSpacing: 0.5 }}>
                  {t.primaryImage}
                </span>
              )}
              <button type="button" onClick={() => onRemoveImage?.(index)} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                ×
              </button>
            </div>
          ))}
          {galleryImages.length < PRODUCT_GALLERY_LIMIT && (
            <div onClick={() => imgRef.current?.click()} style={{ height: 110, border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--bg-muted)', transition: 'border-color 0.2s', flexDirection: 'column', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}>
              {uploadingImage
                ? <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{t.uploadingImage}</p>
                : <>
                    <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>+ {galleryImages.length === 0 ? t.uploadImage : t.addMoreImages}</p>
                    <p style={{ fontSize: 9, color: 'var(--text-disabled)', opacity: 0.75 }}>{galleryImages.length}/{PRODUCT_GALLERY_LIMIT}</p>
                  </>}
            </div>
          )}
        </div>
        {galleryImages.length >= PRODUCT_GALLERY_LIMIT && <p style={{ fontSize: 10, color: '#a08850', marginTop: 8 }}>{t.maxImagesReached}</p>}
      </div>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', marginBottom: 8, textTransform: 'uppercase' }}>{t.uploadVideo}</p>
        <input ref={vidRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={onVidChange} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
          <div onClick={() => !data.video_url && vidRef.current?.click()} style={{ height: 140, border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: data.video_url ? 'default' : 'pointer', overflow: 'hidden', background: 'var(--bg-muted)', transition: 'border-color 0.2s', flexDirection: 'column', gap: 4, position: 'relative' }}
            onMouseEnter={e => { if (!data.video_url) e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-default)'; }}>
            {uploadingVideo
              ? <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{t.uploadingVideo}</p>
              : data.video_url
              ? <>
                  <video src={data.video_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} controls />
                  <button type="button" onClick={onRemoveVideo} style={{ position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,0.55)', color: '#fff', cursor: 'pointer', fontSize: 12 }}>
                    ×
                  </button>
                </>
              : <>
                  <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>+ {t.uploadVideo}</p>
                  <p style={{ fontSize: 9, color: 'var(--text-disabled)', opacity: 0.6 }}>{t.videoLimitHint} · {t.maxVideo}</p>
                </>}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 22, padding: '16px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', textTransform: 'uppercase', marginBottom: 10 }}>
          {isAr ? 'نصيحة قبل النشر' : lang === 'zh' ? '发布前建议' : 'Before you publish'}
        </p>
        <div style={{ display: 'grid', gap: 8 }}>
          {[
            isAr ? 'ابدأ بالاسم الصيني كما يعرفه فريق المبيعات أو المتجر، ثم أضف الاسم الإنجليزي للمشتري.' : lang === 'zh' ? '先填写销售团队或店铺常用的中文产品名，再补英文名给买家查看。' : 'Start with the Chinese product name your sales team/store already uses, then add the buyer-facing English name.',
            isAr ? 'اكتب وصفاً إنجليزياً عملياً يوضح المادة والاستخدام وأهم نقطة جودة.' : lang === 'zh' ? '英文描述建议直接说明材质、用途和最重要的质量点。' : 'Use the English description for material, use case, and the main quality point buyers should notice.',
            isAr ? 'تفاصيل التغليف وOEM ومدة التجهيز ترفع الثقة عند المورد الصيني وعند المشتري السعودي أيضاً.' : lang === 'zh' ? '包装信息、OEM 定制能力和交期会明显提升中方供应商专业感，也方便沙特买家判断。' : 'Packaging details, OEM capability, and lead time noticeably improve professionalism for both Chinese suppliers and Saudi buyers.',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--text-primary)', opacity: 0.7, marginTop: 7, flex: '0 0 auto' }} />
              <span style={{ fontSize: 12, lineHeight: 1.75, color: 'var(--text-secondary)', ...arFont }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 22, padding: '16px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139,120,255,0.18)', background: 'rgba(139,120,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(139,120,255,0.9)', textTransform: 'uppercase', marginBottom: 6 }}>
              {isAr ? 'جاهزية النشر التجارية' : lang === 'zh' ? '发布完整度' : 'Publishing readiness'}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, ...arFont }}>
              {isAr ? 'كلما اكتملت هذه النقاط، ظهر المنتج بشكل أكثر موثوقية للمشتري.' : lang === 'zh' ? '这些信息越完整，买家看到的专业感和可信度就越强。' : 'The more of these details you complete, the more credible the listing feels to buyers.'}
            </p>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{completenessPct}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ width: `${completenessPct}%`, height: '100%', borderRadius: 999, background: 'rgba(139,120,255,0.75)' }} />
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          {completenessItems.map((item) => (
            <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontSize: 12, color: item.done ? 'var(--text-primary)' : 'var(--text-secondary)', ...arFont }}>{item.label}</span>
              <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, border: '1px solid', borderColor: item.done ? 'rgba(58,122,82,0.25)' : 'var(--border-subtle)', background: item.done ? 'rgba(58,122,82,0.08)' : 'rgba(255,255,255,0.03)', color: item.done ? '#5a9a72' : 'var(--text-disabled)', whiteSpace: 'nowrap' }}>
                {item.done ? (isAr ? 'مكتمل' : lang === 'zh' ? '已完成' : 'Done') : (isAr ? 'ينقصه' : lang === 'zh' ? '待补充' : 'Missing')}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-grid">
        {[
          [t.nameZh, 'name_zh'], [t.nameEn, 'name_en'], [t.nameAr, 'name_ar'], [t.moq, 'moq'],
        ].map(([label, key, type]) => (
          <div key={key} className="form-group">
            <label className="form-label">{label}</label>
            <input className="form-input" type={type || 'text'} placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
          </div>
        ))}
        <div className="form-group">
          <label className="form-label">{t.category}</label>
          <select className="form-input" value={data.category || 'other'} onChange={e => setData(prev => ({ ...prev, category: e.target.value }))}>
            {productCategories.map(cat => <option key={cat.val} value={cat.val}>{cat.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t.currency}</label>
          <select className="form-input" value={data.currency || 'USD'} onChange={e => setData(prev => ({ ...prev, currency: e.target.value }))}>
            {DISPLAY_CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">{t.price}</label>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input className="form-input" type="number" placeholder={placeholders.price_from || (data.currency || 'USD')} value={data.price_from || ''} onChange={e => setData(prev => ({ ...prev, price_from: e.target.value }))} style={{ paddingRight: 52 }} dir="ltr" />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, color: 'var(--text-disabled)', pointerEvents: 'none' }}>{data.currency || 'USD'}</span>
            </div>
            {data.price_from && data.currency === 'USD' && (
              <div style={{ flex: 1, padding: '10px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 3, fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center', direction: 'ltr' }}>
                ≈ {(parseFloat(data.price_from || 0) * (usdRate || 3.75)).toFixed(2)} SAR
              </div>
            )}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-disabled)', margin: '4px 0 12px', ...arFont }}>{t.descHint}</p>
      <div className="form-group">
        <label className={`form-label${isAr ? ' ar' : ''}`}>{t.descEnLabel}</label>
        <textarea className="form-input" rows={3} placeholder={placeholders.desc_en || ''} style={{ resize: 'vertical' }} value={data.desc_en || ''} onChange={e => setData(prev => ({ ...prev, desc_en: e.target.value }))} />
      </div>

      <div className="form-group">
        <label className={`form-label${isAr ? ' ar' : ''}`}>{t.descLabel}</label>
        <textarea className="form-input" rows={2} placeholder={placeholders.desc_ar || ''} style={{ resize: 'vertical', ...arFont }} value={data.desc_ar || ''} onChange={e => setData(prev => ({ ...prev, desc_ar: e.target.value }))} />
      </div>

      <div style={{ marginTop: 20, padding: '18px 20px', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', marginBottom: 14, textTransform: 'uppercase' }}>{t.specsTitle}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            [t.specMaterial, 'spec_material'],
            [t.specDimensions, 'spec_dimensions'],
            [t.specWeight, 'spec_unit_weight'],
            [t.specColors, 'spec_color_options'],
            [t.specPackaging, 'spec_packaging_details'],
            [t.specCustomization, 'spec_customization'],
            [t.specLeadTime, 'spec_lead_time_days', 'number'],
          ].map(([label, key, type]) => (
            <div key={key} className="form-group" style={{ marginBottom: 0 }}>
              <label className={`form-label${isAr ? ' ar' : ''}`}>{label}</label>
              <input className="form-input" type={type || 'text'} placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20, padding: '18px 20px', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: data.sample_available ? 18 : 0 }}>
          <input type="checkbox" id="sample_toggle" checked={data.sample_available || false} onChange={e => setData(prev => ({ ...prev, sample_available: e.target.checked }))} style={{ width: 15, height: 15, cursor: 'pointer', accentColor: 'var(--text-secondary)' }} />
          <label htmlFor="sample_toggle" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', cursor: 'pointer', ...arFont }}>{t.sampleAvailable}</label>
        </div>
        {data.sample_available && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, animation: 'fadeIn 0.25s ease' }}>
            {[[t.samplePrice, 'sample_price', 'number'], [t.sampleShipping, 'sample_shipping', 'number'], [t.sampleMaxQty, 'sample_max_qty', 'number'], [t.sampleNote, 'sample_note']].map(([label, key, type]) => (
              <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{label}</label>
                <input className="form-input" type={type || 'text'} placeholder={placeholders[key] || ''} value={data[key] || ''} onChange={e => setData(prev => ({ ...prev, [key]: e.target.value }))} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
        {showPreviewAction
          ? <button onClick={onPreview} className="btn-primary" style={{ padding: '11px 28px', fontSize: 12, minHeight: 44 }}>{t.continueToPreview}</button>
          : <button onClick={onSave} disabled={saving} className="btn-primary" style={{ padding: '11px 28px', fontSize: 12, minHeight: 44 }}>{saving ? t.saving : (saveLabel || t.save)}</button>}
        <button onClick={onCancel} className="btn-outline" style={{ padding: '11px 20px', fontSize: 12, minHeight: 44 }}>{t.cancel}</button>
      </div>
    </div>
  );
}

function ProductPreviewPanel({ product, onPublish, onBack, t, isAr, saving, lang }) {
  const galleryImages = getProductGalleryImages(product);
  const specs = buildProductSpecs(product);
  const displayName = lang === 'zh'
    ? product.name_zh || product.name_en || product.name_ar
    : lang === 'ar'
    ? product.name_ar || product.name_en || product.name_zh
    : product.name_en || product.name_ar || product.name_zh;
  const arFont = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const completenessItems = getProductCompletenessItems(product, lang);
  const completenessDone = completenessItems.filter(item => item.done).length;
  const providedNames = [
    { key: 'zh', label: lang === 'ar' ? 'الاسم الصيني' : lang === 'zh' ? '中文名' : 'Chinese name', value: product.name_zh },
    { key: 'en', label: lang === 'ar' ? 'الاسم الإنجليزي' : lang === 'zh' ? '英文名' : 'English name', value: product.name_en },
    { key: 'ar', label: lang === 'ar' ? 'الاسم العربي' : lang === 'zh' ? '阿拉伯语名' : 'Arabic name', value: product.name_ar },
  ].filter((item) => item.value);

  return (
    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', padding: '28px 32px', maxWidth: 760, borderRadius: 'var(--radius-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', textTransform: 'uppercase', marginBottom: 8 }}>{t.previewStep}</p>
          <h3 style={{ fontSize: 24, fontWeight: 400, color: 'var(--text-primary)', ...arFont }}>{displayName || '—'}</h3>
        </div>
        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-disabled)', letterSpacing: 1 }}>{t.previewBadge}</span>
      </div>

      <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 20, lineHeight: 1.7, ...arFont }}>{t.previewNote}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
        <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'rgba(139,120,255,0.05)', border: '1px solid rgba(139,120,255,0.18)' }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(139,120,255,0.9)', marginBottom: 10 }}>
            {isAr ? 'جاهزية العرض' : lang === 'zh' ? '发布摘要' : 'Listing readiness'}
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 10, ...arFont }}>
            {isAr ? `${completenessDone}/${completenessItems.length} نقاط مكتملة قبل النشر` : lang === 'zh' ? `发布前已完成 ${completenessDone}/${completenessItems.length} 项` : `${completenessDone}/${completenessItems.length} credibility checks completed before publish`}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
              {isAr ? `${galleryImages.length} صور` : lang === 'zh' ? `${galleryImages.length} 张图片` : `${galleryImages.length} images`}
            </span>
            {product.video_url && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>Video</span>}
            {product.sample_available && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'rgba(58,122,82,0.08)', border: '1px solid rgba(58,122,82,0.18)', color: '#5a9a72' }}>{isAr ? 'عينة مفعلة' : lang === 'zh' ? '样品已开启' : 'Samples enabled'}</span>}
            {specs.length > 0 && <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>{isAr ? `${specs.length} مواصفات` : lang === 'zh' ? `${specs.length} 项规格` : `${specs.length} specs`}</span>}
          </div>
        </div>

        <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>
            {isAr ? 'الأسماء المعروضة' : lang === 'zh' ? '展示名称' : 'Displayed names'}
          </p>
          <div style={{ display: 'grid', gap: 8 }}>
            {providedNames.map((item) => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{item.label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-primary)', textAlign: isAr ? 'left' : 'right' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 18, marginBottom: 24 }}>
        <div>
          {galleryImages.length > 0 ? (
            <>
              <div style={{ height: 300, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--bg-muted)', marginBottom: 12 }}>
                <img src={galleryImages[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              {galleryImages.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(84px, 1fr))', gap: 10 }}>
                  {galleryImages.slice(1).map((url, index) => (
                    <div key={`${url}-${index}`} style={{ height: 72, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                      <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ height: 220, borderRadius: 'var(--radius-xl)', border: '1px dashed var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-disabled)', background: 'var(--bg-muted)' }}>{t.previewEmptyMedia}</div>
          )}
        </div>

        <div>
          <div style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', marginBottom: 14 }}>
            <p style={{ fontSize: 28, fontWeight: 300, color: 'var(--text-primary)', marginBottom: 8 }}>
              {product.price_from || '—'} <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>{product.currency || 'USD'}</span>
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>MOQ: {product.moq || '—'}</p>
            {product.category && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{t.category}: {product.category}</p>}
          </div>

          {product.video_url && (
            <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#1a1a1a', marginBottom: 14 }}>
              <video src={product.video_url} controls style={{ width: '100%', display: 'block', maxHeight: 220, objectFit: 'cover' }} />
            </div>
          )}

          {specs.length > 0 && (
            <div style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', textTransform: 'uppercase', marginBottom: 12 }}>{t.specsTitle}</p>
              <div style={{ display: 'grid', gap: 10 }}>
                {specs.map(spec => (
                  <div key={spec.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-disabled)', textTransform: 'capitalize' }}>{spec.label}</span>
                    <span style={{ fontSize: 13, color: 'var(--text-primary)', textAlign: isAr ? 'left' : 'right' }}>{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {product.desc_en && <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: product.desc_ar ? 12 : 24 }}>{product.desc_en}</p>}
      {product.desc_ar && <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--text-secondary)', marginBottom: 24, ...arFont }}>{product.desc_ar}</p>}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onPublish} disabled={saving} className="btn-primary" style={{ padding: '11px 28px', fontSize: 12, minHeight: 44 }}>{saving ? t.saving : t.publishNow}</button>
        <button onClick={onBack} className="btn-outline" style={{ padding: '11px 20px', fontSize: 12, minHeight: 44 }}>{t.backToEdit}</button>
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────── */
export default function DashboardSupplier({ user, profile, lang, displayCurrency, setDisplayCurrency, setProfile }) {
  const nav      = useNavigate();
  const location = useLocation();
  const t        = T[lang] || T.zh;
  const cats     = CATEGORIES[lang] || CATEGORIES.zh;
  const isAr     = lang === 'ar';

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search]);

  const [stats, setStats]                   = useState({ products: 0, offers: 0, messages: 0 });
  const [myOffers, setMyOffers]             = useState([]);
  const [myProducts, setMyProducts]         = useState([]);
  const [inbox, setInbox]                   = useState([]);
  const [requests, setRequests]             = useState([]);
  const [activeTab, setActiveTab]           = useState('overview');
  const [activeCat, setActiveCat]           = useState('all');
  const [loadingOffers, setLoadingOffers]   = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [trackingInputs, setTrackingInputs] = useState({});
  const [shippingCompany, setShippingCompany] = useState('DHL');
  const [product, setProduct]               = useState(emptyProduct);
  const [usdRate, setUsdRate]               = useState(3.75);
  useEffect(() => { getUsdToSar().then(r => setUsdRate(r)); }, []);
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

  const [settings, setSettings] = useState({
    bio_ar: '', bio_en: '', bio_zh: '', company_name: '',
    whatsapp: '', wechat: '', city: '', country: '',
    trade_link: '', speciality: '', min_order_value: '',
    preferred_display_currency: displayCurrency || 'USD',
    avatar_url: '', factory_images: [],
  });
  const [verification, setVerification] = useState({
    reg_number: '', years_experience: '', num_employees: '', license_photo: '', factory_photo: '',
  });
  const [payout, setPayout] = useState({ pay_method: '', alipay_account: '', swift_code: '', bank_name: '' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [savingVerification, setSavingVerification] = useState(false);
  const [verificationSaved, setVerificationSaved] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState('');
  const [uploadingVerificationDoc, setUploadingVerificationDoc] = useState({ license: false, factory: false });
  const [savingPayout, setSavingPayout] = useState(false);
  const [payoutSaved, setPayoutSaved] = useState(false);
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
  const supplierState = getSupplierOnboardingState({ ...(profile || {}), ...verification, ...payout }, user);
  const needsVerification = !supplierState.isVerificationComplete;
  const needsPayoutSetup = supplierState.isApprovedStage && !supplierState.isPayoutComplete;
  const isOnboardingLimited = !supplierState.canAccessOperationalFeatures;
  const verificationLockMessage = 'Complete verification to unlock the full supplier experience on Maabar';
  const tabs = [
    { id: 'overview',     label: t.overview },
    { id: 'verification', label: t.verificationTab, badge: needsVerification ? '!' : null },
    { id: 'payout',       label: t.payoutTab, badge: needsPayoutSetup ? '!' : null },
    { id: 'requests',     label: isAr ? 'الطلبات' : lang === 'zh' ? '需求' : 'Requests' },
    { id: 'my-products',  label: t.myProducts },
    { id: 'offers',       label: t.offers },
    { id: 'add-product',  label: t.addProduct },
    { id: 'samples',      label: isAr ? 'العينات' : lang === 'zh' ? '样品' : 'Samples', badge: stats.pendingSamples > 0 ? stats.pendingSamples : null },
    { id: 'reviews',      label: isAr ? 'تقييماتي' : lang === 'zh' ? '评价' : 'Reviews' },
    { id: 'messages',     label: t.messages, badge: stats.messages > 0 ? stats.messages : null },
    { id: 'settings',     label: t.settings },
  ];
  const lockedTabIds = isOnboardingLimited
    ? tabs.filter((tab) => !supplierState.limitedTabs.includes(tab.id)).map((tab) => tab.id)
    : [];
  const isRestrictedSupplierTab = lockedTabIds.includes(activeTab);

  const imageRef = useRef(null); const videoRef = useRef(null);
  const editImageRef = useRef(null); const editVideoRef = useRef(null);
  const logoRef = useRef(null); const factoryRef = useRef(null);

  useEffect(() => {
    if (!user) { nav('/login/supplier'); return; }
    loadStats(); loadPendingTracking(); loadRejectedOffers();
  }, [user]);

  useEffect(() => {
    const knownTabs = tabs.map((tab) => tab.id);
    if (!knownTabs.includes(activeTab)) {
      setActiveTab(supplierState.isApplicationStage ? 'verification' : 'overview');
    }
  }, [activeTab, supplierState.isApplicationStage, tabs]);

  useEffect(() => {
    if (!user || isRestrictedSupplierTab) return;
    if (activeTab === 'offers')       loadMyOffers();
    if (activeTab === 'messages')     loadInbox();
    if (activeTab === 'my-products')  loadMyProducts();
    if (activeTab === 'requests')     loadRequests();
    if (activeTab === 'settings')     loadSettings();
    if (activeTab === 'verification') loadVerification();
    if (activeTab === 'payout')       loadPayout();
    if (activeTab === 'samples')      loadSamples();
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
    setSettings(prev => ({ ...prev, preferred_display_currency: displayCurrency || 'USD' }));
  }, [displayCurrency]);

  useEffect(() => {
    if (!profile) return;
    setVerification({
      reg_number: profile.reg_number || '',
      years_experience: profile.years_experience || '',
      num_employees: profile.num_employees || '',
      license_photo: profile.license_photo || '',
      factory_photo: profile.factory_photo || '',
    });
    setPayout({
      pay_method: profile.pay_method || '',
      alipay_account: profile.alipay_account || '',
      swift_code: profile.swift_code || '',
      bank_name: profile.bank_name || '',
    });
  }, [profile]);

  // Save product form draft to sessionStorage on every change
  useEffect(() => {
    if (activeTab === 'add-product' && !editingProduct) {
      sessionStorage.setItem('maabar_product_draft', JSON.stringify(normalizeProductDraftMedia(product)));
    }
  }, [product, activeTab, editingProduct]);

  useEffect(() => { if (activeTab === 'requests') loadRequests(); }, [activeCat]);

  const loadStats = async () => {
    const [products, offersData, messages, acceptedOffers, payments] = await Promise.all([
      sb.from('products').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('is_active', true),
      sb.from('offers').select('id', { count: 'exact' }).eq('supplier_id', user.id),
      sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
      sb.from('offers').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('status', 'accepted'),
      sb.from('payments').select('amount').eq('supplier_id', user.id).eq('status', 'first_paid'),
    ]);
    const totalSales = (payments.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    // Load matching open requests
    const profData = await sb.from('profiles').select('speciality').eq('id', user.id).single();
    let matchingRequests = 0;
    if (profData.data?.speciality) {
      const { count } = await sb.from('requests').select('id', { count: 'exact' }).eq('status', 'open').eq('category', profData.data.speciality);
      matchingRequests = count || 0;
    }
    const { count: pendingSamples } = await sb.from('samples').select('id', { count: 'exact' }).eq('supplier_id', user.id).eq('status', 'pending');
    setStats({
      products: products.count || 0,
      offers: offersData.count || 0,
      messages: messages.count || 0,
      acceptedOffers: acceptedOffers.count || 0,
      totalSales: Math.round(totalSales),
      matchingRequests,
      pendingSamples: pendingSamples || 0,
    });
  };

  const loadSamples = async () => {
    const { data } = await sb.from('samples').select('*,products(name_ar,name_en,name_zh),profiles!samples_buyer_id_fkey(full_name,company_name)').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setSamples(data);
  };

  const loadMyReviews = async () => {
    const { data } = await sb.from('reviews').select('*,profiles!reviews_buyer_id_fkey(full_name,company_name)').eq('supplier_id', user.id).order('created_at', { ascending: false });
    if (data) setMyReviews(data);
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
    const { data } = await sb.from('profiles').select('bio_ar,bio_en,bio_zh,company_name,whatsapp,wechat,city,country,trade_link,speciality,min_order_value,avatar_url,factory_images').eq('id', user.id).single();
    if (data) setSettings({ bio_ar: data.bio_ar || '', bio_en: data.bio_en || '', bio_zh: data.bio_zh || '', company_name: data.company_name || '', whatsapp: data.whatsapp || '', wechat: data.wechat || '', city: data.city || '', country: data.country || '', trade_link: data.trade_link || '', speciality: data.speciality || '', min_order_value: data.min_order_value || '', preferred_display_currency: displayCurrency || 'USD', avatar_url: data.avatar_url || '', factory_images: data.factory_images || [] });
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
    const { data } = await sb.from('profiles').select('pay_method,alipay_account,swift_code,bank_name').eq('id', user.id).single();
    if (data) {
      setPayout({
        pay_method: data.pay_method || '',
        alipay_account: data.alipay_account || '',
        swift_code: data.swift_code || '',
        bank_name: data.bank_name || '',
      });
    }
  };

  const uploadVerificationDoc = async (file, type) => {
    if (!file) return;
    const key = type === 'license' ? 'license' : 'factory';
    setUploadingVerificationDoc(prev => ({ ...prev, [key]: true }));
    const extension = file.name.split('.').pop() || (file.type === 'application/pdf' ? 'pdf' : 'jpg');
    const path = `${user.id}/${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${extension}`;
    const { error } = await sb.storage.from('supplier-docs').upload(path, file, { upsert: true });
    setUploadingVerificationDoc(prev => ({ ...prev, [key]: false }));
    if (error) {
      alert(isAr ? 'فشل رفع الملف' : lang === 'zh' ? '文件上传失败' : 'Failed to upload file');
      return;
    }
    setVerification(prev => ({ ...prev, [type === 'license' ? 'license_photo' : 'factory_photo']: path }));
  };

  const openVerificationDoc = async (field) => {
    const rawValue = verification?.[field];
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

  const saveVerification = async () => {
    const nextProfile = {
      ...profile,
      reg_number: verification.reg_number,
      years_experience: verification.years_experience,
      num_employees: verification.num_employees || null,
      license_photo: verification.license_photo,
      factory_photo: verification.factory_photo,
    };
    const nextSupplierState = getSupplierOnboardingState(nextProfile, user);

    if (!nextSupplierState.isVerificationComplete) {
      setVerificationMsg(t.verificationMissing);
      return;
    }

    setSavingVerification(true);
    setVerificationMsg('');
    const payload = {
      reg_number: verification.reg_number,
      years_experience: parseInt(verification.years_experience, 10),
      num_employees: verification.num_employees ? parseInt(verification.num_employees, 10) : null,
      license_photo: verification.license_photo,
      factory_photo: verification.factory_photo,
      status: supplierState.isApprovedStage ? profile?.status : 'verification_under_review',
    };
    const { error } = await sb.from('profiles').update(payload).eq('id', user.id);
    setSavingVerification(false);
    if (error) {
      setVerificationMsg(isAr ? 'تعذر حفظ بيانات التحقق. حاول مرة أخرى.' : lang === 'zh' ? '认证资料保存失败，请重试。' : 'Failed to save verification details. Please try again.');
      return;
    }

    const mergedProfile = { ...profile, ...payload };
    setProfile?.(mergedProfile);
    setVerificationSaved(true);
    setVerificationMsg(t.verificationSubmitted);

  };

  const savePayout = async () => {
    if (!payout.pay_method) {
      alert(t.fillRequired || (isAr ? 'يرجى اختيار طريقة الاستلام' : 'Please choose a payout method'));
      return;
    }
    if (payout.pay_method === 'alipay' && !payout.alipay_account) {
      alert(t.fillRequired || (isAr ? 'أدخل حساب Alipay' : 'Enter Alipay account'));
      return;
    }
    if (payout.pay_method === 'swift' && (!payout.swift_code || !payout.bank_name)) {
      alert(t.fillRequired || (isAr ? 'أدخل بيانات SWIFT والبنك' : 'Enter SWIFT and bank details'));
      return;
    }

    setSavingPayout(true);
    const payload = {
      pay_method: payout.pay_method,
      alipay_account: payout.pay_method === 'alipay' ? payout.alipay_account : null,
      swift_code: payout.pay_method === 'swift' ? payout.swift_code : null,
      bank_name: payout.pay_method === 'swift' ? payout.bank_name : null,
    };
    const { error } = await sb.from('profiles').update(payload).eq('id', user.id);
    setSavingPayout(false);
    if (error) {
      alert(isAr ? 'تعذر حفظ بيانات الدفعات' : lang === 'zh' ? '收款资料保存失败' : 'Failed to save payout details');
      return;
    }

    const mergedProfile = { ...profile, ...payload };
    setProfile?.(mergedProfile);
    setPayoutSaved(true);
    setTimeout(() => setPayoutSaved(false), 3000);
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    await sb.from('profiles').update({ bio_ar: settings.bio_ar, bio_en: settings.bio_en, bio_zh: settings.bio_zh, company_name: settings.company_name, whatsapp: settings.whatsapp, wechat: settings.wechat, city: settings.city, country: settings.country, trade_link: settings.trade_link, speciality: settings.speciality, min_order_value: settings.min_order_value ? parseFloat(settings.min_order_value) : null }).eq('id', user.id);
    await setDisplayCurrency?.(settings.preferred_display_currency || 'USD');
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
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
    if ((settings.factory_images || []).length >= 3) { alert(isAr ? 'الحد الأقصى 3 صور' : 'Max 3 images'); return; }
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
    const { data } = await sb.from('offers').select('*,requests(title_ar,title_en,title_zh,buyer_id,status,tracking_number,shipping_status,quantity,description,payment_plan)').eq('supplier_id', user.id).order('created_at', { ascending: false });
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
    // جلب كل الطلبات المفتوحة بدون فلتر تخصص — الفلتر اختياري من الـ UI فقط
    let query = sb.from('requests').select('*').eq('status', 'open').order('created_at', { ascending: false });
    if (activeCat !== 'all') query = query.or(`category.eq.${activeCat},category.is.null`);
    const { data, error } = await query;
    console.log('loadRequests result:', data?.length, 'error:', error);
    if (data) setRequests(data);
    setLoadingRequests(false);
  };

  const loadInbox = async () => {
    const { data } = await sb.from('messages').select('*, profiles!messages_sender_id_fkey(full_name, company_name)').eq('receiver_id', user.id).order('created_at', { ascending: false });
    if (data) {
      const seen = new Set();
      setInbox(data.filter(m => { if (seen.has(m.sender_id)) return false; seen.add(m.sender_id); return true; }));
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
    if (error) { alert(isAr ? 'فشل الرفع' : 'Upload failed'); return null; }
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
    const payload = buildProductWritePayload(product, user.id);
    const { error, strippedColumns } = await runWithOptionalColumns({
      table: 'products',
      payload,
      optionalKeys: PRODUCT_OPTIONAL_DB_FIELDS,
      execute: (nextPayload) => sb.from('products').insert(nextPayload),
    });
    setSaving(false);
    if (error) {
      console.error('addProduct error:', error);
      setProductSaveMsg(isAr ? 'حدث خطأ أثناء الحفظ. حاول مرة أخرى.' : 'Error saving product. Please try again.');
      return;
    }
    sessionStorage.removeItem('maabar_product_draft');
    setProduct(emptyProduct);
    setProductComposerStep('edit');
    setProductSaveMsg(strippedColumns.length > 0 ? t.productSavedWithFallback : (isAr ? 'تم إضافة المنتج بنجاح ✓' : 'Product added successfully ✓'));
    setTimeout(() => { setProductSaveMsg(''); setActiveTab('my-products'); }, 1800);
    loadStats();
  };

  const updateProduct = async () => {
    if (!editingProduct) return;
    setSaving(true);
    const payload = buildProductWritePayload(editingProduct);
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
      },
      optionalKeys: ['shipping_cost', 'shipping_method'],
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
      alert(isAr ? 'لا يمكن حذف عرض تم قبوله أو رفضه' : 'Cannot delete an accepted or rejected offer');
      return;
    }
    if (!window.confirm(isAr ? 'هل تريد حذف هذا العرض؟' : 'Delete this offer?')) return;
    await sb.from('offers').delete().eq('id', o.id);
    loadMyOffers(); loadStats();
  };

  const cancelOffer = async (o) => {
    const requestStatus = o.requests?.status || '';
    const isAcceptedBeforePayment = o.status === 'accepted' && !['paid', 'ready_to_ship', 'shipping', 'arrived', 'delivered'].includes(requestStatus);

    if (!window.confirm(isAcceptedBeforePayment
      ? (isAr ? 'هل تريد سحب العرض المقبول وإعادة الطلب للتاجر؟' : 'Withdraw this accepted offer and reopen the request for the trader?')
      : (isAr ? 'هل تريد إلغاء هذا العرض؟' : 'Cancel this offer?'))) return;

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
          ? (isAr ? `قام المورد بسحب العرض المقبول على الطلب: ${title}` : `The supplier withdrew the accepted offer on: ${title}`)
          : (isAr ? `قام المورد بسحب عرضه على الطلب: ${title}` : `The supplier withdrew the offer on: ${title}`),
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
        optionalKeys: ['shipping_cost', 'shipping_method'],
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
              lang,
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
            lang,
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
    if (diff < 3600)  return isAr ? Math.floor(diff / 60) + ' د'  : Math.floor(diff / 60) + 'm';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' س' : Math.floor(diff / 3600) + 'h';
    return isAr ? Math.floor(diff / 86400) + ' ي' : Math.floor(diff / 86400) + 'd';
  };

  const name = profile?.company_name || profile?.full_name || user?.email?.split('@')[0];
  const supplierMaabarId = getSupplierMaabarId(profile || {});
  const pendingCount = pendingTracking.length + rejectedOffers.length;

  const arFont = { fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' };
  const section = { animation: 'fadeIn 0.35s ease' };

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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-secondary)', fontSize: 11 }}>
            <span style={{ color: 'var(--text-disabled)' }}>{t.supplierStageLabel}</span>
            <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{getSupplierStageLabel(supplierState.stage, lang)}</strong>
          </span>
          {supplierMaabarId && supplierState.isApprovedStage && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(139,120,255,0.18)', background: 'rgba(139,120,255,0.08)', color: 'rgba(139,120,255,0.9)', fontSize: 11 }}>
              <span style={{ color: 'rgba(139,120,255,0.7)' }}>{t.supplierIdLabel}</span>
              <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{supplierMaabarId}</strong>
            </span>
          )}
        </div>

        <div style={{ display: 'flex', overflowX: 'auto', gap: 0 }}>
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
                  <span style={{ marginInlineStart: 6, fontSize: 10, color: 'var(--text-tertiary)' }}>🔒</span>
                )}
                {tab.badge && (
                  <span style={{ position: 'absolute', top: 6, right: 2, background: 'var(--bg-raised)', border: '1px solid var(--border-muted)', color: 'var(--text-secondary)', fontSize: 8, fontWeight: 700, borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════
          CONTENT
      ══════════════════════════════════════ */}
      <div style={{ background: 'var(--bg-base)', minHeight: 'calc(100vh - 280px)' }}>
        <div className="dash-content">

          {isRestrictedSupplierTab && (
            <div style={{ ...section, maxWidth: 760 }}>
              <div style={{
                padding: '28px 28px 24px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid rgba(139,120,255,0.18)',
                background: 'rgba(139,120,255,0.06)',
              }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10, fontWeight: 500 }}>
                  MAABAR SUPPLIER ACCESS
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
                  <button onClick={() => setActiveTab('verification')} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 36 }}>
                    {t.verificationCtaAction}
                  </button>
                  <button onClick={() => setActiveTab('settings')} className="btn-outline" style={{ fontSize: 11, minHeight: 36 }}>
                    {t.onboardingGoSettings}
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
                  <div style={{ marginBottom: 24, padding: '24px 26px', background: 'rgba(139,120,255,0.06)', border: '1px solid rgba(139,120,255,0.18)', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <div style={{ maxWidth: 720 }}>
                        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10, fontWeight: 500 }}>
                          {t.onboardingStatusDraft}
                        </p>
                        <h2 style={{ fontSize: isAr ? 28 : 36, fontWeight: 300, marginBottom: 12, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.6 }}>
                          {t.onboardingTitle}
                        </h2>
                        <p style={{ fontSize: 13, color: 'var(--text-disabled)', lineHeight: 1.8, marginBottom: 16, ...arFont }}>
                          {t.onboardingBody}
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => setActiveTab('verification')} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 36 }}>{t.verificationCtaAction}</button>
                          <button onClick={() => setActiveTab('settings')} className="btn-outline" style={{ fontSize: 11, minHeight: 36 }}>{t.onboardingGoSettings}</button>
                        </div>
                      </div>
                      <div style={{ minWidth: 220, maxWidth: 280, flex: '1 1 220px' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 8, ...arFont }}>{t.onboardingProgress}</p>
                        <p style={{ fontSize: 32, color: 'var(--text-primary)', marginBottom: 6 }}>{supplierState.completedRequiredCount}/{supplierState.requiredCount}</p>
                        <div style={{ width: '100%', height: 8, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden', marginBottom: 10 }}>
                          <div style={{ width: `${supplierState.progressPercent}%`, height: '100%', background: 'var(--text-primary)' }} />
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, ...arFont }}>
                          {supplierState.progressPercent}% · {t.onboardingVerificationReady}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginBottom: 24 }}>
                    {[t.onboardingStepApply, t.onboardingStepReview, t.onboardingStepVisibility].map((step, index) => (
                      <div key={step} style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', background: index === 1 ? 'var(--bg-raised)' : 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10 }}>0{index + 1}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.7, ...arFont }}>{step}</p>
                      </div>
                    ))}
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
                          🔒 {item}
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
              {/* ── Onboarding / verification ── */}
              {needsVerification && (
                <div style={{ marginBottom: 32, padding: '20px 24px', background: 'rgba(139,120,255,0.06)', border: '1px solid rgba(139,120,255,0.2)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, ...arFont }}>
                    {t.verificationCtaTitle}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 16, ...arFont, lineHeight: 1.7 }}>
                    {t.verificationCtaBody}
                  </p>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => setActiveTab('verification')} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 34 }}>{t.verificationCtaAction}</button>
                    <button onClick={() => setActiveTab('settings')} className="btn-outline" style={{ fontSize: 11, minHeight: 34 }}>{isAr ? 'تعديل الملف' : lang === 'zh' ? '编辑资料' : 'Edit profile'}</button>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {pendingTracking.map((o, i) => (
                      <div key={i} onClick={() => setActiveTab('offers')} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: 'all 0.15s', gap: 12 }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-muted)'; e.currentTarget.style.borderColor = 'var(--border-muted)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-subtle)'; e.currentTarget.style.borderColor = 'var(--border-subtle)'; }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3, ...arFont }}>{t.acceptedOffer}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{getTitle(o.requests)}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {o.requests?.buyer_id && (
                            <button
                              className="btn-outline"
                              style={{ minHeight: 32, padding: '6px 12px', fontSize: 10 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                nav(`/chat/${o.requests.buyer_id}`);
                              }}>
                              {t.contactTrader}
                            </button>
                          )}
                          <span style={{ color: 'var(--text-disabled)', fontSize: 14 }}>→</span>
                        </div>
                      </div>
                    ))}
                    {rejectedOffers.map((o, i) => (
                      <div key={i} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: 13, color: '#a07070', ...arFont }}>{t.offerRejected}: {getTitle(o.requests)}</p>
                        <button onClick={() => dismissRejected(o.id)} className="btn-outline" style={{ padding: '5px 12px', fontSize: 10, minHeight: 30 }}>{isAr ? 'تجاهل' : lang === 'zh' ? '忽略' : 'Dismiss'}</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>{t.stats}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <StatCard label={t.offersCount}   value={stats.offers}   onClick={() => setActiveTab('offers')} />
                  <StatCard label={t.productsCount} value={stats.products} onClick={() => setActiveTab('my-products')} />
                  <StatCard label={t.messagesCount} value={stats.messages} onClick={() => setActiveTab('messages')} highlight={stats.messages > 0} />
                </div>
                {/* Extended Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 10 }}>
                  <StatCard
                    label={isAr ? 'إجمالي المبيعات' : 'Total Sales (SAR)'}
                    value={stats.totalSales ? `${stats.totalSales.toLocaleString()} ` : '—'}
                    onClick={() => {}}
                  />
                  <StatCard
                    label={isAr ? 'نسبة قبول العروض' : 'Offer Accept Rate'}
                    value={stats.offers > 0 ? `${Math.round((stats.acceptedOffers || 0) / stats.offers * 100)}%` : '—'}
                    onClick={() => setActiveTab('offers')}
                  />
                  <StatCard
                    label={isAr ? 'طلبات مفتوحة مناسبة' : 'Matching Open Requests'}
                    value={stats.matchingRequests || '—'}
                    onClick={() => setActiveTab('requests')}
                    highlight={(stats.matchingRequests || 0) > 0}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>{t.quickActions}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  <QuickAction title={t.browseRequests} onClick={() => setActiveTab('requests')} primary isAr={isAr} />
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
              {!loadingRequests && requests.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0' }}><p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{isAr ? 'لا توجد طلبات' : 'No requests'}</p></div>}

              {!loadingRequests && requests.map(r => (
                <div key={r.id} style={{ marginBottom: offerForms[r.id] ? 0 : 10 }}>
                  <div style={{ border: '1px solid var(--border-subtle)', padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, background: 'var(--bg-subtle)', transition: 'all 0.15s', borderRadius: offerForms[r.id] ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-muted)'; e.currentTarget.style.background = 'var(--bg-muted)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.background = 'var(--bg-subtle)'; }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                        <span className="status-badge status-open">{isAr ? 'مفتوح' : 'open'}</span>
                        {r.category && r.category !== 'other' && <span style={{ fontSize: 10, padding: '2px 8px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 20, color: 'var(--text-disabled)' }}>{cats.find(c => c.val === r.category)?.label || r.category}</span>}
                        <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>{fmtDate(r.created_at)}</span>
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)', ...arFont }}>{getTitle(r)}</h3>
                      <div style={{ display: 'flex', gap: 16, color: 'var(--text-disabled)', fontSize: 12, flexWrap: 'wrap' }}>
                        <span>{r.profiles?.full_name || r.profiles?.company_name || (isAr ? 'تاجر' : 'Trader')}</span>
                        <span>{r.quantity || '—'}</span>
                        {r.description && <span>{r.description.substring(0, 55)}…</span>}
                      </div>
                    </div>
                    <button className="btn-dark-sm" onClick={() => toggleOfferForm(r.id)} style={{ minHeight: 38, whiteSpace: 'nowrap' }}>
                      {offerForms[r.id] ? (isAr ? 'إغلاق' : 'Close') : (isAr ? 'قدم عرضك' : lang === 'zh' ? '提交报价' : 'Submit Quote')}
                    </button>
                  </div>

                  {offerForms[r.id] && (
                    <div style={{ background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderTop: 'none', padding: '18px 22px', marginBottom: 10, borderRadius: '0 0 var(--radius-lg) var(--radius-lg)' }}>
                      {(r.budget_per_unit || r.payment_plan || r.sample_requirement) && (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
                          {r.budget_per_unit && <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-disabled)' }}>{isAr ? `ميزانية تقريبية: ${r.budget_per_unit} SAR` : lang === 'zh' ? `预算参考：${r.budget_per_unit} SAR` : `Budget hint: ${r.budget_per_unit} SAR`}</span>}
                          {r.payment_plan && <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-disabled)' }}>{isAr ? `خطة الدفع: ${r.payment_plan}%` : lang === 'zh' ? `付款计划：${r.payment_plan}%` : `Payment plan: ${r.payment_plan}%`}</span>}
                          {r.sample_requirement && <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-disabled)' }}>{isAr ? `العينة: ${r.sample_requirement}` : lang === 'zh' ? `样品：${r.sample_requirement}` : `Sample: ${r.sample_requirement}`}</span>}
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
                                ≈ {(parseFloat(offers[r.id]?.price || 0) * (usdRate || 3.75)).toFixed(2)} ﷼
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
                                ≈ {(parseFloat(offers[r.id]?.shippingCost || 0) * (usdRate || 3.75)).toFixed(2)} ﷼
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
                        {[['MOQ *', 'moq'], [isAr ? 'مدة التسليم (أيام) *' : 'Delivery Days *', 'days', 'number'], [isAr ? 'بلد المنشأ' : 'Origin', 'origin']].map(([label, key, type]) => (
                          <div key={key} className="form-group">
                            <label className="form-label">{label}</label>
                            <input className="form-input" type={type || 'text'} value={offers[r.id]?.[key] || (key === 'origin' ? 'China' : '')} onChange={e => setOffers(prev => ({ ...prev, [r.id]: { ...prev[r.id], [key]: e.target.value } }))} />
                          </div>
                        ))}
                      </div>
                      <div className="form-group">
                        <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'ملاحظة' : 'Note'}</label>
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
                          🔒 {isAr ? 'يراه التاجر فقط — سعرك سري' : lang === 'zh' ? '仅买家可见 — 您的报价保密' : 'Only the buyer sees this — your price is private'}
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
                          {getProductGalleryImages(p).length > 1 && <span style={{ fontSize: 9, padding: '2px 7px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>{getProductGalleryImages(p).length} IMG</span>}
                          {p.video_url && <span style={{ fontSize: 9, padding: '2px 7px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>VIDEO</span>}
                          {p.sample_available && <span style={{ fontSize: 9, padding: '2px 7px', background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', borderRadius: 10, color: '#5a9a72', letterSpacing: 0.5 }}>{isAr ? 'عينة' : 'SAMPLE'}</span>}
                          {p.category && p.category !== 'other' && <span style={{ fontSize: 9, padding: '2px 7px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 10, color: 'var(--text-disabled)', letterSpacing: 0.5 }}>{cats.find(c => c.val === p.category)?.label || p.category}</span>}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{p.price_from} {p.currency || 'USD'} · MOQ: {p.moq}</p>
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

              {!loadingOffers && myOffers.map((o, idx) => (
                <div key={o.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0', animation: `fadeIn 0.35s ease ${idx * 0.04}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', ...arFont }}>{getTitle(o.requests)}</h3>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 20, border: '1px solid', borderColor: o.status === 'accepted' ? 'rgba(58,122,82,0.3)' : o.status === 'rejected' ? 'rgba(138,58,58,0.3)' : 'var(--border-subtle)', color: o.status === 'accepted' ? '#5a9a72' : o.status === 'rejected' ? '#a07070' : 'var(--text-disabled)' }}>
                        {OFFER_STATUS[lang]?.[o.status] || o.status}
                      </span>
                      {o.status === 'pending' && (
                        <>
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
                            style={{ padding: '3px 8px', fontSize: 10, minHeight: 24 }}>
                            {t.edit}
                          </button>
                          <button
                            onClick={() => cancelOffer(o)}
                            style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '3px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 24 }}>
                            {isAr ? 'إلغاء العرض' : 'Cancel Offer'}
                          </button>
                          <button
                            onClick={() => deleteOffer(o)}
                            style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '3px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 24 }}>
                            {t.delete}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 8, marginBottom: 14 }}>
                    <div style={{ padding: '12px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'سعر الوحدة' : lang === 'zh' ? '单价' : 'Unit Price'}</p>
                      <p style={{ fontSize: 22, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1 }}>{o.price} <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>USD</span></p>
                    </div>
                    <div style={{ padding: '12px 14px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الشحن' : lang === 'zh' ? '运费' : 'Shipping'}</p>
                      <p style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                        {hasOfferShippingCost(o) ? `${getOfferShippingCost(o).toFixed(2)} USD` : (isAr ? 'غير محدد' : lang === 'zh' ? '未单独填写' : 'Not specified separately')}
                      </p>
                      {getOfferShippingMethod(o) && (
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>{getOfferShippingMethod(o)}</p>
                      )}
                    </div>
                    <div style={{ padding: '12px 14px', background: 'var(--bg-raised)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4 }}>{isAr ? 'الإجمالي التقديري' : lang === 'zh' ? '预计总额' : 'Estimated Total'}</p>
                      <p style={{ fontSize: 18, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1.1 }}>{getOfferEstimatedTotal(o, o.requests).toFixed(2)} <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>USD</span></p>
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>{isAr ? `MOQ: ${o.moq} · ${o.delivery_days} يوم` : lang === 'zh' ? `MOQ: ${o.moq} · ${o.delivery_days} 天` : `MOQ: ${o.moq} · ${o.delivery_days} days`}{o.origin ? ` · ${isAr ? 'المنشأ' : lang === 'zh' ? '原产地' : 'Origin'}: ${o.origin}` : ''}</p>
                    </div>
                  </div>

                  {/* Accepted offer: full order details */}
                  {o.status === 'accepted' && (
                    <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {o.requests?.quantity && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', ...arFont }}>
                          <span style={{ color: 'var(--text-disabled)' }}>{isAr ? 'الكمية: ' : 'Qty: '}</span>{o.requests.quantity}
                        </p>
                      )}
                      {o.requests?.description && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', ...arFont }}>
                          <span style={{ color: 'var(--text-disabled)' }}>{isAr ? 'المواصفات: ' : 'Specs: '}</span>{o.requests.description}
                        </p>
                      )}
                      {o.requests?.payment_plan && (
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          <span style={{ color: 'var(--text-disabled)' }}>{isAr ? 'خطة الدفع: ' : 'Payment plan: '}</span>{o.requests.payment_plan}%
                        </p>
                      )}
                      <p style={{ fontSize: 12 }}>
                        <span style={{ color: 'var(--text-disabled)' }}>{isAr ? 'حالة الدفع: ' : 'Payment: '}</span>
                        <span style={{ color: ['paid','ready_to_ship','shipping','arrived','delivered'].includes(o.requests?.status) ? '#5a9a72' : '#a07070' }}>
                          {['paid','ready_to_ship','shipping','arrived','delivered'].includes(o.requests?.status)
                            ? (isAr ? 'تم الدفع' : 'Paid')
                            : (isAr ? 'في انتظار الدفع' : 'Pending')}
                        </span>
                      </p>
                      {o.updated_at && (
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                          {isAr ? 'تاريخ القبول: ' : 'Accepted: '}{new Date(o.updated_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* "Shipment Ready" button — when offer accepted and request paid */}
                  {o.status === 'accepted' && o.requests?.status === 'paid' && (
                    <div style={{ marginBottom: 14 }}>
                      <button
                        className="btn-primary"
                        style={{ padding: '11px 24px', fontSize: 12, minHeight: 42, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                        onClick={async () => {
                          await sb.from('requests')
                            .update({ status: 'ready_to_ship' })
                            .eq('id', o.request_id);
                          await sb.from('notifications').insert({
                            user_id: o.requests.buyer_id,
                            type: 'ready_to_ship',
                            title_ar: 'شحنتك جاهزة — ادفع الدفعة الثانية لإتمام الشحن',
                            title_en: 'Your shipment is ready — Pay the second installment to ship',
                            title_zh: '您的货物已准备好 — 支付尾款以完成发货',
                            ref_id: o.request_id,
                            is_read: false,
                          });
                          loadMyOffers();
                        }}>
                        {isAr ? 'الشحنة جاهزة' : lang === 'zh' ? '货物已备好' : 'Shipment Ready'}
                      </button>
                    </div>
                  )}

                  {o.status === 'accepted' && !['paid','shipping','delivered','ready_to_ship'].includes(o.requests?.status || '') && (
                    <div style={{ marginBottom: 14, padding: '12px 16px', background: 'var(--bg-muted)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 10, ...arFont }}>
                        {isAr ? 'في انتظار إتمام الدفع من التاجر' : 'Awaiting payment completion'}
                      </p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {o.requests?.buyer_id && (
                          <button className="btn-outline" onClick={() => nav(`/chat/${o.requests.buyer_id}`)} style={{ minHeight: 36 }}>
                            {t.contactTrader}
                          </button>
                        )}
                        <button
                          style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '8px 14px', fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 36 }}
                          onClick={() => cancelOffer(o)}>
                          {isAr ? 'سحب العرض' : lang === 'zh' ? '撤回报价' : 'Withdraw Offer'}
                        </button>
                      </div>
                    </div>
                  )}

                  {o.status === 'accepted' && completedPayments.has(o.request_id) && (
                    <div style={{ marginBottom: 14, padding: '14px 16px', background: 'var(--bg-raised)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)' }}>
                      <p style={{ fontSize: 13, marginBottom: 10, color: 'var(--text-secondary)', ...arFont }}>{t.trackingPrompt}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <select
                          value={shippingCompany}
                          onChange={e => setShippingCompany(e.target.value)}
                          style={{
                            padding: '10px 12px', fontSize: 13,
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-subtle)',
                            color: 'var(--text-secondary)',
                            borderRadius: 'var(--radius-md)',
                            cursor: 'pointer', outline: 'none', minHeight: 40,
                          }}>
                          {['DHL','FedEx','Aramex','UPS','SMSA',isAr ? 'أخرى' : 'Other'].map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <input className="form-input" style={{ flex: 1, minWidth: 140 }} placeholder={t.trackingNum} value={trackingInputs[o.request_id] || ''} onChange={e => setTrackingInputs(prev => ({ ...prev, [o.request_id]: e.target.value }))} dir="ltr" />
                        <button className="btn-dark-sm" onClick={() => submitTracking(o.request_id, o.requests?.buyer_id, o.delivery_days)} style={{ minHeight: 40 }}>{t.send}</button>
                      </div>
                    </div>
                  )}

                  {o.requests?.tracking_number && (
                    <p style={{ fontSize: 12, marginBottom: 12, padding: '8px 14px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
                      {t.tracking} <strong style={{ color: 'var(--text-primary)' }}>{o.requests.tracking_number}</strong>
                    </p>
                  )}

                  {o.status === 'accepted' && o.requests?.buyer_id && (
                    <button className="btn-outline" onClick={() => nav(`/chat/${o.requests.buyer_id}`)} style={{ minHeight: 38 }}>{t.contactTrader}</button>
                  )}
                </div>
              ))}
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
                  <p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{isAr ? 'لا توجد طلبات عينات بعد' : 'No sample requests yet'}</p>
                </div>
              ) : samples.map((s, idx) => (
                <div key={s.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '20px 0', animation: `fadeIn 0.35s ease ${idx*0.04}s both` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, ...arFont }}>
                        {lang === 'zh' ? s.products?.name_zh : lang === 'ar' ? s.products?.name_ar : s.products?.name_en}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 4 }}>
                        {s.profiles?.company_name || s.profiles?.full_name || '—'} · {isAr ? `الكمية: ${s.quantity}` : `Qty: ${s.quantity}`}
                      </p>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)' }}>
                        {s.sample_price} SAR {isAr ? '+ شحن' : '+ shipping'} {s.shipping_price} SAR
                      </p>
                      {s.notes && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, ...arFont }}>{s.notes}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, border: '1px solid', borderColor: s.status==='approved' ? 'rgba(58,122,82,0.3)' : s.status==='rejected' ? 'rgba(138,58,58,0.3)' : 'var(--border-subtle)', color: s.status==='approved' ? '#5a9a72' : s.status==='rejected' ? '#a07070' : 'var(--text-disabled)' }}>
                        {s.status === 'approved' ? (isAr ? 'مقبول' : 'Approved') : s.status === 'rejected' ? (isAr ? 'مرفوض' : 'Rejected') : (isAr ? 'قيد المراجعة' : 'Pending')}
                      </span>
                      {s.status === 'pending' && <>
                        <button onClick={() => updateSampleStatus(s.id, 'approved')} className="btn-dark-sm" style={{ fontSize: 11, minHeight: 28, padding: '4px 12px' }}>{isAr ? 'قبول' : 'Approve'}</button>
                        <button onClick={() => updateSampleStatus(s.id, 'rejected')} style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '4px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 28 }}>{isAr ? 'رفض' : 'Reject'}</button>
                      </>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── REVIEWS ── */}
          {!isRestrictedSupplierTab && activeTab === 'reviews' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'تقييماتي' : 'My Reviews'}
              </h2>
              {myReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 14, ...arFont }}>{isAr ? 'لا توجد تقييمات بعد' : 'No reviews yet'}</p>
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
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)', letterSpacing: 1 }}>{myReviews.length} {isAr ? 'تقييم' : 'reviews'}</p>
                    </div>
                  </div>
                  {myReviews.map((r, idx) => (
                    <div key={r.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '18px 0', animation: `fadeIn 0.35s ease ${idx*0.04}s both` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{r.profiles?.company_name || r.profiles?.full_name || (isAr ? 'تاجر' : 'Trader')}</p>
                        <div style={{ display: 'flex', gap: 1 }}>
                          {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: 12, color: s <= r.rating ? '#a08050' : 'var(--border-default)' }}>★</span>)}
                        </div>
                      </div>
                      {r.comment && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, ...arFont }}>{r.comment}</p>}
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 6 }}>{new Date(r.created_at).toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}</p>
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
                <p style={{ marginTop: 12, fontSize: 13, color: productSaveMsg.includes('✓') ? '#5a9a72' : productSaveMsg === t.productSavedWithFallback ? '#a08850' : '#a07070', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {productSaveMsg}
                </p>
              )}
            </div>
          )}

          {/* ── VERIFICATION ── */}
          {activeTab === 'verification' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 14, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.verificationTitle}</h2>
              <p style={{ maxWidth: 720, fontSize: 13, color: 'var(--text-disabled)', lineHeight: 1.9, marginBottom: 24, ...arFont }}>{t.verificationIntro}</p>

              <div style={{ marginBottom: 24, padding: '16px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-muted)', background: 'var(--bg-subtle)', maxWidth: 720 }}>
                <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8 }}>{needsVerification ? t.verificationStatusIncomplete : t.verificationStatusComplete}</p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 8, ...arFont }}>{t.secureStorageNote}</p>
                {isOnboardingLimited && (
                  <p style={{ fontSize: 12, color: 'var(--text-disabled)', lineHeight: 1.8, ...arFont }}>
                    {t.onboardingVerificationReady}
                  </p>
                )}
              </div>

              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', padding: '24px 28px', borderRadius: 'var(--radius-xl)', maxWidth: 720 }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{t.regNumber}</label>
                    <input className="form-input" value={verification.reg_number} onChange={e => setVerification(prev => ({ ...prev, reg_number: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{t.yearsExp}</label>
                    <input className="form-input" type="number" min="0" value={verification.years_experience} onChange={e => setVerification(prev => ({ ...prev, years_experience: e.target.value }))} dir="ltr" />
                  </div>
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{t.employees}</label>
                    <input className="form-input" type="number" min="0" value={verification.num_employees} onChange={e => setVerification(prev => ({ ...prev, num_employees: e.target.value }))} dir="ltr" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16, marginTop: 8 }}>
                  {[{ key: 'license_photo', type: 'license', label: t.businessLicense, accept: 'image/*,.pdf' }, { key: 'factory_photo', type: 'factory', label: t.factoryPhoto, accept: 'image/*' }].map((doc) => {
                    const isUploading = uploadingVerificationDoc[doc.type];
                    const hasFile = Boolean(verification[doc.key]);
                    return (
                      <div key={doc.key} style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', padding: 16, background: 'var(--bg-base)' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 14, ...arFont }}>{doc.label}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          <label className="btn-outline" style={{ minHeight: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '0 14px' }}>
                            {isUploading ? '...' : hasFile ? t.replaceFile : (isAr ? 'رفع ملف' : lang === 'zh' ? '上传文件' : 'Upload file')}
                            <input type="file" accept={doc.accept} style={{ display: 'none' }} onChange={async (e) => {
                              await uploadVerificationDoc(e.target.files?.[0], doc.type);
                              e.target.value = '';
                            }} />
                          </label>
                          {hasFile && (
                            <button onClick={() => openVerificationDoc(doc.key)} className="btn-dark-sm" style={{ minHeight: 38, padding: '0 14px', fontSize: 11 }}>
                              {t.viewCurrentFile}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button onClick={saveVerification} disabled={savingVerification} className="btn-primary" style={{ padding: '12px 32px', fontSize: 13, alignSelf: 'flex-start', minHeight: 46, marginTop: 22 }}>
                  {savingVerification ? t.saving : t.verificationSubmitAction}
                </button>
                {verificationMsg && (
                  <p style={{ color: verificationSaved ? '#5a9a72' : '#a07070', fontSize: 13, marginTop: 12, ...arFont }}>
                    {verificationMsg}
                  </p>
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
                  <div style={{ marginBottom: 18 }}>
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{t.payMethod}</label>
                    <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                      {['alipay', 'swift'].map(method => (
                        <button key={method} type="button" onClick={() => setPayout(prev => ({ ...prev, pay_method: method }))} style={{
                          minWidth: 180,
                          padding: '11px 14px',
                          background: payout.pay_method === method ? 'var(--bg-raised)' : 'transparent',
                          border: '1px solid',
                          borderColor: payout.pay_method === method ? 'var(--border-strong)' : 'var(--border-subtle)',
                          color: payout.pay_method === method ? 'var(--text-primary)' : 'var(--text-disabled)',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderRadius: 'var(--radius-md)',
                          transition: 'all 0.15s',
                          minHeight: 42,
                        }}>
                          {method === 'alipay' ? t.alipay : t.swift}
                        </button>
                      ))}
                    </div>
                  </div>

                  {payout.pay_method === 'alipay' && (
                    <div className="form-group">
                      <label className={`form-label${isAr ? ' ar' : ''}`}>{t.alipayAccount}</label>
                      <input className="form-input" value={payout.alipay_account} onChange={e => setPayout(prev => ({ ...prev, alipay_account: e.target.value }))} dir="ltr" />
                    </div>
                  )}

                  {payout.pay_method === 'swift' && (
                    <div className="form-grid">
                      <div className="form-group">
                        <label className={`form-label${isAr ? ' ar' : ''}`}>{t.swiftCode}</label>
                        <input className="form-input" value={payout.swift_code} onChange={e => setPayout(prev => ({ ...prev, swift_code: e.target.value }))} dir="ltr" />
                      </div>
                      <div className="form-group">
                        <label className={`form-label${isAr ? ' ar' : ''}`}>{t.bankName}</label>
                        <input className="form-input" value={payout.bank_name} onChange={e => setPayout(prev => ({ ...prev, bank_name: e.target.value }))} />
                      </div>
                    </div>
                  )}

                  <button onClick={savePayout} disabled={savingPayout} className="btn-primary" style={{ padding: '12px 32px', fontSize: 13, alignSelf: 'flex-start', minHeight: 46, marginTop: 10 }}>
                    {savingPayout ? t.saving : t.payoutTitle}
                  </button>
                  {payoutSaved && (
                    <p style={{ color: '#5a9a72', fontSize: 13, marginTop: 12, ...arFont }}>
                      {t.payoutSaved} ✓
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} label={t.back} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, color: 'var(--text-primary)', ...arFont, letterSpacing: isAr ? 0 : -0.5 }}>{t.settingsTitle}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 660 }}>

                {/* Logo */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>{t.logo}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                      {settings.avatar_url ? <img src={settings.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: 24, opacity: 0.3 }}>◻</span>}
                    </div>
                    <div>
                      <input ref={logoRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadLogo} />
                      <button onClick={() => logoRef.current?.click()} className="btn-dark-sm" style={{ marginBottom: 6, fontSize: 11, minHeight: 34 }}>{uploadingLogo ? t.uploadingLogo : t.uploadLogo}</button>
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{isAr ? 'JPG أو PNG · حتى 5MB' : 'JPG or PNG · Max 5MB'}</p>
                    </div>
                  </div>
                </div>

                {/* Factory images */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>{t.factoryImages}</p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {(settings.factory_images || []).map((img, i) => (
                      <div key={i} style={{ width: 90, height: 90, borderRadius: 'var(--radius-lg)', overflow: 'hidden', position: 'relative', flexShrink: 0, border: '1px solid var(--border-subtle)' }}>
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button onClick={() => removeFactoryImage(img)} style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.55)', color: 'rgba(255,255,255,0.9)', border: 'none', width: 18, height: 18, borderRadius: '50%', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                      </div>
                    ))}
                    {(settings.factory_images || []).length < 3 && (
                      <>
                        <input ref={factoryRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={uploadFactoryImage} />
                        <div onClick={() => factoryRef.current?.click()} style={{ width: 90, height: 90, borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-default)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}>
                          {uploadingFactory ? <p style={{ fontSize: 10, color: 'var(--text-disabled)' }}>...</p> : <p style={{ fontSize: 22, color: 'var(--text-disabled)' }}>+</p>}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Company info */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>{isAr ? 'بيانات الشركة' : 'Company Info'}</p>
                  <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-muted)', padding: '24px 28px', borderRadius: 'var(--radius-xl)' }}>
                    <div className="form-grid">
                      {[[t.companyName, 'company_name'], [t.speciality, 'speciality', 'select'], [t.city, 'city'], [t.country, 'country'], [t.whatsapp, 'whatsapp', 'tel'], [t.wechat, 'wechat'], [t.minOrder, 'min_order_value', 'number'], [t.tradeLink, 'trade_link', 'url'], [isAr ? 'عملة العرض المفضلة' : lang === 'zh' ? '首选显示货币' : 'Preferred Display Currency', 'preferred_display_currency', 'display_currency']].map(([label, key, type]) => (
                        <div key={key} className="form-group">
                          <label className={`form-label${isAr ? ' ar' : ''}`}>{label}</label>
                          {type === 'select'
                            ? <select className="form-input" value={settings[key]} onChange={e => setSettings({ ...settings, [key]: e.target.value })}>
                                <option value="">{isAr ? 'اختر' : 'Select'}</option>
                                {CATEGORIES[lang]?.filter(c => c.val !== 'all').map(c => <option key={c.val} value={c.val}>{c.label}</option>)}
                              </select>
                            : type === 'display_currency'
                            ? <select className="form-input" value={settings[key] || 'USD'} onChange={e => setSettings({ ...settings, [key]: e.target.value })}>
                                {DISPLAY_CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
                              </select>
                            : <input className="form-input" type={type || 'text'} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} dir={['whatsapp', 'wechat', 'trade_link'].includes(key) ? 'ltr' : undefined} />}
                        </div>
                      ))}
                    </div>

                    <p style={{ fontSize: 12, color: 'var(--text-disabled)', margin: '6px 0 16px', lineHeight: 1.7, ...arFont }}>
                      {isAr ? 'هذه العملة للعرض فقط أثناء التصفح. المدفوعات والمنتجات تبقى بعملتها الأصلية.' : lang === 'zh' ? '这只影响浏览时的显示货币。付款与产品原始货币保持不变。' : 'This affects browsing display only. Payments and saved product currencies remain in their original currency.'}
                    </p>

                    {[[t.bioZh, 'bio_zh'], [t.bioEn, 'bio_en'], [t.bioAr, 'bio_ar', true]].map(([label, key, rtl]) => (
                      <div key={key} className="form-group">
                        <label className={`form-label${isAr ? ' ar' : ''}`}>{label}</label>
                        <textarea className="form-input" rows={2} style={{ resize: 'vertical' }} value={settings[key] || ''} onChange={e => setSettings({ ...settings, [key]: e.target.value })} dir={rtl ? 'rtl' : 'ltr'} />
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={saveSettings} disabled={savingSettings} className="btn-primary" style={{ padding: '12px 32px', fontSize: 13, alignSelf: 'flex-start', minHeight: 46 }}>
                  {savingSettings ? t.saving : t.saveSettings}
                </button>
                {settingsSaved && (
                  <p style={{ color: '#5a9a72', fontSize: 13, marginTop: 8, ...arFont }}>
                    {t.settingsSaved} ✓
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════
          EDIT OFFER MODAL
      ══════════════════════════════════════ */}
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

      <Footer lang={lang} />
    </div>
  );
}