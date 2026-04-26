import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import { generateIdeaToProductReport, requestProductConversationReply } from '../lib/maabarAi/client';
import { MAABAR_AI_PERSONA_NAME } from '../lib/maabarAi/config';
import {
  buildIdeaRequestDraft,
  clearIdeaFlowDraft,
  loadIdeaFlowDraft,
  saveIdeaFlowDraft,
} from '../lib/ideaToProductFlow';
import { buildTranslatedRequestFields } from '../lib/requestTranslation';
import { runWithOptionalColumns } from '../lib/supabaseColumnFallback';
import {
  DISPLAY_CURRENCIES,
  DEFAULT_DISPLAY_CURRENCY,
  normalizeDisplayCurrency,
} from '../lib/displayCurrency';

const SAUDI_REPRESENTATIVE_NAMES = [
  'سلمان', 'فيصل', 'تركي', 'عبدالعزيز', 'سعود', 'نورة', 'العنود', 'الجوهرة', 'ريم', 'لولوة'
];

const CAT_LABEL = {
  ar: { electronics: 'إلكترونيات', furniture: 'أثاث', clothing: 'ملابس', building: 'مواد بناء', food: 'غذاء', other: 'أخرى' },
  en: { electronics: 'Electronics', furniture: 'Furniture', clothing: 'Clothing', building: 'Building Materials', food: 'Food', other: 'Other' },
  zh: { electronics: '电子产品', furniture: '家具', clothing: '服装', building: '建材', food: '食品', other: '其他' },
};

const PAYMENT_PLAN_LABEL = {
  ar: {
    30: '30% مقدماً',
    50: '50% مقدماً',
    100: '100% مقدماً',
  },
  en: {
    30: '30% upfront',
    50: '50% upfront',
    100: '100% upfront',
  },
  zh: {
    30: '预付 30%',
    50: '预付 50%',
    100: '预付 100%',
  },
};

const SAMPLE_LABEL = {
  ar: {
    none: 'لا حاجة لعينة',
    preferred: 'عينة مفضلة إن توفرت',
    required: 'عينة إلزامية',
  },
  en: {
    none: 'No sample needed',
    preferred: 'Sample preferred if available',
    required: 'Sample is mandatory',
  },
  zh: {
    none: '无需样品',
    preferred: '如方便可提供样品',
    required: '必须提供样品',
  },
};

const COPY = {
  ar: {
    title: 'صنّع فكرتك',
    subtitle: `${MAABAR_AI_PERSONA_NAME} يحوّل الفكرة إلى طلب تصنيع احترافي`,
    minimized: 'صنّع فكرتك — متابعة',
    placeholder: 'اكتب رسالتك هنا...',
    send: 'إرسال',
    generating: 'أرتب فكرتك الآن وأبني لك brief احترافي...',
    report: 'تقرير التصنيع',
    review: 'راجع الطلب قبل الإرسال',
    reviewHint: 'هذا هو الطلب الذي سيصل للموردين المطابقين لتخصصك. عدّل فقط ما يلزم ثم أرسله.',
    submit: 'إرسال لموردين مختصين',
    loginSubmit: 'تسجيل الدخول للإرسال',
    newChat: 'محادثة جديدة',
    error: 'حدث خطأ، حاول مرة أخرى',
    reportReady: 'جهزت لك التقرير. راجعه، وإذا مناسب أرسله لموردين مختصين مباشرة.',
    sentSuccess: 'تم إرسال طلبك للموردين المطابقين. تقدر تتابع العروض من لوحة التحكم.',
    supplierRouteIntro: 'واضح أنك تريد الوصول لموردين بسرعة. خلني آخذ منك الحد الأدنى فقط ثم أجهز الطلب بشكل احترافي.',
    buildRouteIntro: 'ممتاز. خلني أفهم فكرتك بشكل مرتب، وبعدها أطلع لك brief جاهز للتصنيع.',
    budgetOptional: 'الميزانية للوحدة',
    requestPreviewNote: 'الإرسال ينشر طلبك المفتوح تحت هذا التصنيف حتى يراه الموردون المناسبون.',
    reportFields: {
      product: 'المنتج',
      factory: 'نوع المصنع',
      city: 'المدينة',
      cost: 'تكلفة تقريبية',
      moq: 'MOQ',
      timeline: 'مدة التصنيع',
      category: 'التخصص',
      specs: 'المواصفات',
    },
    reviewFields: {
      titleAr: 'اسم المنتج بالعربي',
      titleEn: 'اسم المنتج بالإنجليزي',
      quantity: 'الكمية المطلوبة',
      category: 'التصنيف',
      description: 'تفاصيل الطلب',
      paymentPlan: 'خطة الدفع',
      sampleRequirement: 'متطلبات العينة',
    },
    requiredDraft: 'أكمل اسم المنتج والكمية قبل الإرسال',
  },
  en: {
    title: 'Build Your Product',
    subtitle: `${MAABAR_AI_PERSONA_NAME} turns your idea into a professional manufacturing brief`,
    minimized: 'Build Your Product — Continue',
    placeholder: 'Write your message...',
    send: 'Send',
    generating: 'Preparing your manufacturing brief...',
    report: 'Manufacturing Report',
    review: 'Review before sending',
    reviewHint: 'This is the request that will be sent to the best-matched suppliers. Adjust anything important, then send it.',
    submit: 'Send to matched suppliers',
    loginSubmit: 'Login to submit',
    newChat: 'New Chat',
    error: 'Something went wrong, please try again',
    reportReady: 'Your report is ready. Review it and send it to matched suppliers when ready.',
    sentSuccess: 'Your request was sent to matched suppliers. You can track offers from your dashboard.',
    supplierRouteIntro: 'Got it — you want supplier matching fast. I’ll only ask for the essentials, then prepare a clean brief.',
    buildRouteIntro: 'Great. I’ll understand your idea first, then turn it into a professional manufacturing brief.',
    budgetOptional: 'Budget per unit',
    requestPreviewNote: 'Sending publishes your request under this category so the right suppliers can see it.',
    reportFields: {
      product: 'Product',
      factory: 'Factory Type',
      city: 'City',
      cost: 'Est. Cost',
      moq: 'MOQ',
      timeline: 'Timeline',
      category: 'Category',
      specs: 'Specifications',
    },
    reviewFields: {
      titleAr: 'Product Name (AR)',
      titleEn: 'Product Name (EN)',
      quantity: 'Required Quantity',
      category: 'Category',
      description: 'Request Details',
      paymentPlan: 'Payment Plan',
      sampleRequirement: 'Sample Requirement',
    },
    requiredDraft: 'Add a product name and quantity before sending',
  },
  zh: {
    title: '打造您的产品',
    subtitle: `${MAABAR_AI_PERSONA_NAME} 将想法整理成专业制造需求`,
    minimized: '继续打造产品',
    placeholder: '请输入内容...',
    send: '发送',
    generating: '正在整理您的制造需求...',
    report: '制造报告',
    review: '发送前确认',
    reviewHint: '这份需求将发送给最匹配的供应商。请先确认并修改必要内容，再发送。',
    submit: '发送给匹配供应商',
    loginSubmit: '登录后发送',
    newChat: '新对话',
    error: '出错了，请重试',
    reportReady: '报告已准备好。确认后可直接发送给匹配供应商。',
    sentSuccess: '需求已发送给匹配供应商。您可以在控制台查看报价。',
    supplierRouteIntro: '了解，您想尽快对接供应商。我先收集最核心的信息，再为您整理成专业需求。',
    buildRouteIntro: '很好。我先了解您的产品想法，然后整理成专业制造 brief。',
    budgetOptional: '单价预算',
    requestPreviewNote: '发送后会按当前分类发布需求，方便匹配供应商查看。',
    reportFields: {
      product: '产品',
      factory: '工厂类型',
      city: '城市',
      cost: '预估成本',
      moq: 'MOQ',
      timeline: '生产周期',
      category: '类别',
      specs: '规格要求',
    },
    reviewFields: {
      titleAr: '阿拉伯语产品名',
      titleEn: '英语产品名',
      quantity: '需求数量',
      category: '类别',
      description: '需求详情',
      paymentPlan: '付款方案',
      sampleRequirement: '样品要求',
    },
    requiredDraft: '发送前请补充产品名和数量',
  },
};

function detectIntent(text = '') {
  const t = text.toLowerCase();
  const supplierKeywords = [
    'مورد', 'موردين', 'مصنع', 'مصانع', 'وصلني', 'ابي مورد', 'أبي مورد', 'ابي اوصل', 'أبي أوصل',
    'supplier', 'suppliers', 'factory', 'factories', 'manufacturer', 'sourcing', 'connect me',
    '供应商', '工厂', '对接', '找工厂'
  ];
  return supplierKeywords.some((keyword) => t.includes(keyword)) ? 'supplier_match' : 'build_product';
}

function Bubble({ role, children, isAr }) {
  const isUser = role === 'user';
  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '86%',
        padding: '14px 16px',
        borderRadius: 16,
        background: isUser ? '#E8E3D8' : '#FFFFFF',
        color: isUser ? '#141414' : 'rgba(0,0,0,0.88)',
        border: `1px solid ${isUser ? 'rgba(232,227,216,0.35)' : 'rgba(0,0,0,0.07)'}`,
        fontSize: 14,
        lineHeight: 1.9,
        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        whiteSpace: 'pre-wrap',
        boxShadow: isUser ? '0 8px 30px rgba(0,0,0,0.12)' : 'none',
      }}>
        {children}
      </div>
    </div>
  );
}

function getInitialMessages(language = 'ar', representativeName = 'سلمان') {
  if (language === 'zh') {
    return [
      `您好，我是来自 Maabar 的 ${representativeName}。`,
      '请告诉我您的想法。',
    ];
  }

  if (language === 'en') {
    return [
      `Hello, this is ${representativeName} from Maabar.`,
      'What do you have in mind?',
    ];
  }

  return [
    `مرحبا، معك ${representativeName} من معبر.`,
    'كيف اقدر اساعدك ؟',
  ];
}

function TypingBubble() {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ maxWidth: '86%', padding: '14px 16px', borderRadius: 16, background: '#FFFFFF', color: 'rgba(0,0,0,0.88)', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[0, 1, 2].map((dot) => (
            <span key={dot} style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(0,0,0,0.25)', display: 'inline-block', opacity: 0.35, animation: `maabarTyping 1.2s ${dot * 0.15}s infinite ease-in-out` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportRow({ label, value, isAr }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
      <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{label}</span>
      <span style={{ color: 'rgba(0,0,0,0.88)', fontSize: 13, fontWeight: 500, textAlign: isAr ? 'left' : 'right', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{value}</span>
    </div>
  );
}

function FormLabel({ children, isAr }) {
  return (
    <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 11, marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
      {children}
    </p>
  );
}

function FieldInput({ isAr, as = 'input', ...props }) {
  const Comp = as;
  return (
    <Comp
      {...props}
      style={{
        width: '100%',
        background: '#FAF8F5',
        color: 'rgba(0,0,0,0.88)',
        border: '1px solid rgba(0,0,0,0.10)',
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 16,
        lineHeight: 1.8,
        outline: 'none',
        resize: as === 'textarea' ? 'vertical' : 'none',
        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        direction: isAr ? 'rtl' : 'ltr',
        ...props.style,
      }}
    />
  );
}

export default function IdeaToProduct({ lang, user, onClose, displayCurrency }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const t = COPY[lang] || COPY.en;
  // The Saudi trader is the primary user of this flow — default to SAR.
  // displayCurrency (if plumbed from App-level state) overrides; user can
  // still change it on the form. Stored AS-ENTERED, never converted.
  const defaultBudgetCurrency = normalizeDisplayCurrency(displayCurrency || 'SAR');
  const representativeName = useMemo(() => SAUDI_REPRESENTATIVE_NAMES[Math.floor(Math.random() * SAUDI_REPRESENTATIVE_NAMES.length)], []);
  const initialMessages = useMemo(() => getInitialMessages(lang, representativeName), [lang, representativeName]);
  const [minimized, setMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const bodyRef = useRef(null);
  const [draftText, setDraftText] = useState('');
  const [phase, setPhase] = useState('chat');
  const [idea, setIdea] = useState('');
  const [result, setResult] = useState(null);
  const [reviewDraft, setReviewDraft] = useState(() => buildIdeaRequestDraft({}, { budget_currency: defaultBudgetCurrency }));
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [briefReady, setBriefReady] = useState(false);
  const [messages, setMessages] = useState(() =>
    initialMessages.map((content, index) => ({ id: index + 1, role: 'assistant', content }))
  );

  useEffect(() => {
    const storedDraft = loadIdeaFlowDraft();
    if (!storedDraft) return;

    const storedMessages = Array.isArray(storedDraft.messages) && storedDraft.messages.length > 0
      ? storedDraft.messages
      : initialMessages.map((content, index) => ({ id: Date.now() + index, role: 'assistant', content }));

    setMessages(storedMessages.map((message, index) => ({
      id: message.id || Date.now() + index,
      role: message.role,
      content: message.content,
    })));
    setIdea(storedDraft.initialIdea || '');
    setResult(storedDraft.report || null);
    setReviewDraft(buildIdeaRequestDraft(storedDraft.report || {}, storedDraft.requestDraft || {}));
    setBriefReady(Boolean(storedDraft.report));
    setPhase(storedDraft.report ? 'report' : (storedDraft.phase || 'chat'));
  }, [initialMessages]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return undefined;

    const scrollY = window.scrollY;
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const prevHtmlOverflow = htmlStyle.overflow;
    const prevBodyOverflow = bodyStyle.overflow;
    const prevBodyPosition = bodyStyle.position;
    const prevBodyTop = bodyStyle.top;
    const prevBodyWidth = bodyStyle.width;

    htmlStyle.overflow = 'hidden';
    bodyStyle.overflow = 'hidden';
    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = '100%';

    return () => {
      htmlStyle.overflow = prevHtmlOverflow;
      bodyStyle.overflow = prevBodyOverflow;
      bodyStyle.position = prevBodyPosition;
      bodyStyle.top = prevBodyTop;
      bodyStyle.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isMobile]);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, isTyping, phase]);

  const resetAll = () => {
    clearIdeaFlowDraft();
    setDraftText('');
    setPhase('chat');
    setIdea('');
    setResult(null);
    setReviewDraft(buildIdeaRequestDraft({}, { budget_currency: defaultBudgetCurrency }));
    setError('');
    setSubmitting(false);
    setIsTyping(false);
    setBriefReady(false);
    setMessages(initialMessages.map((content, index) => ({ id: Date.now() + index, role: 'assistant', content })));
  };

  const appendMessage = (role, content) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role, content }]);
  };

  const persistFlowDraft = ({ report = result, nextReviewDraft = reviewDraft, nextMessages = messages, nextPhase = phase, pendingAuth = !user, initialIdea = idea }) => {
    saveIdeaFlowDraft({
      lang,
      phase: nextPhase,
      report,
      requestDraft: nextReviewDraft,
      messages: nextMessages,
      initialIdea,
      pendingAuth,
    });
  };

  const generateReport = async (sourceOverride = '', messageOverride = null) => {
    const conversationMessages = Array.isArray(messageOverride) ? messageOverride : messages;
    const userConversation = conversationMessages
      .filter((message) => message.role === 'user')
      .map((message) => message.content)
      .join('\n');

    const sourceIdea = sourceOverride || userConversation || idea;
    if (!sourceIdea.trim()) return;

    setPhase('generating');
    setError('');
    try {
      const report = await generateIdeaToProductReport({
        language: lang,
        mode: detectIntent(sourceIdea),
        initialIdea: sourceIdea,
        questions: [],
        answers: [],
      });
      const nextMessages = [...conversationMessages, { id: Date.now() + Math.random(), role: 'assistant', content: t.reportReady }];
      const nextReviewDraft = buildIdeaRequestDraft(report, reviewDraft);
      setResult(report);
      setReviewDraft(nextReviewDraft);
      setMessages(nextMessages);
      setPhase('report');
      setBriefReady(true);
      persistFlowDraft({
        report,
        nextReviewDraft,
        nextMessages,
        nextPhase: 'report',
        pendingAuth: !user,
        initialIdea: sourceIdea,
      });
    } catch (_error) {
      setError(t.error);
      setPhase('chat');
      appendMessage('assistant', t.error);
    }
  };

  const handleSend = async () => {
    const value = draftText.trim();
    if (!value || isTyping) return;

    const nextConversation = messages.map((message) => ({ role: message.role, content: message.content }));
    const nextMessagesWithUser = [...messages, { id: Date.now() + Math.random(), role: 'user', content: value }];
    setDraftText('');
    setIdea((prev) => prev || value);
    setMessages(nextMessagesWithUser);
    setIsTyping(true);
    setError('');

    try {
      const productReply = await requestProductConversationReply({
        language: lang,
        conversation: nextConversation,
        userMessage: value,
        userProfile: {
          role: 'buyer',
          representativeName,
        },
      });
      const cleanReply = lang === 'ar'
        ? String(productReply?.reply || t.error).replace(/[\u3400-\u9FFF]+/g, '').replace(/\s{2,}/g, ' ').trim()
        : (productReply?.reply || t.error);
      const nextMessages = [...nextMessagesWithUser, { id: Date.now() + Math.random(), role: 'assistant', content: cleanReply || t.error }];
      setMessages(nextMessages);
      const readyForBrief = Boolean(productReply?.enoughInfo || ['brief_ready', 'supplier_ready'].includes(productReply?.nextStep));
      setBriefReady(readyForBrief);
      if (readyForBrief) {
        await generateReport(
          [...nextConversation.filter((message) => message.role === 'user').map((message) => message.content), value].join('\n'),
          nextMessages,
        );
      } else {
        persistFlowDraft({ nextMessages, nextPhase: 'chat', initialIdea: idea || value });
      }
    } catch (_error) {
      const nextMessages = [...nextMessagesWithUser, { id: Date.now() + Math.random(), role: 'assistant', content: t.error }];
      setMessages(nextMessages);
      setError(t.error);
    } finally {
      setIsTyping(false);
    }
  };

  const updateReviewDraft = (field, value) => {
    setReviewDraft((prev) => {
      const nextDraft = { ...prev, [field]: value };
      persistFlowDraft({ nextReviewDraft: nextDraft, nextPhase: 'report' });
      return nextDraft;
    });
  };

  const submitRequest = async () => {
    const normalizedDraft = buildIdeaRequestDraft(result || {}, reviewDraft || {});
    if (!(normalizedDraft.title_ar || normalizedDraft.title_en) || !String(normalizedDraft.quantity || '').trim()) {
      setError(t.requiredDraft);
      return;
    }

    if (!user) {
      persistFlowDraft({ nextReviewDraft: normalizedDraft, nextPhase: 'report', pendingAuth: true });
      if (onClose) onClose();
      nav('/login/buyer');
      return;
    }

    setSubmitting(true);
    setError('');

    const rawDescription = normalizedDraft.description || result?.request_description || result?.specs || '';
    const rawTitleAr = normalizedDraft.title_ar || '';
    const rawTitleEn = normalizedDraft.title_en || '';

    // Translate title and description to all 3 languages at write time
    let translatedFields = {};
    try {
      translatedFields = await buildTranslatedRequestFields({
        titleAr: rawTitleAr,
        titleEn: rawTitleEn,
        description: rawDescription,
        lang: lang || 'ar',
      });
    } catch {
      translatedFields = {
        title_ar: rawTitleAr || rawTitleEn,
        title_en: rawTitleEn || rawTitleAr,
        title_zh: normalizedDraft.title_zh || rawTitleEn || rawTitleAr,
        description_ar: rawDescription,
        description_en: rawDescription,
        description_zh: rawDescription,
      };
    }

    const payload = {
      buyer_id: user.id,
      title_ar: translatedFields.title_ar || rawTitleAr || rawTitleEn,
      title_en: translatedFields.title_en || rawTitleEn || rawTitleAr,
      title_zh: translatedFields.title_zh || normalizedDraft.title_zh || rawTitleEn || rawTitleAr,
      quantity: normalizedDraft.quantity || '',
      description: rawDescription,
      description_ar: translatedFields.description_ar || null,
      description_en: translatedFields.description_en || null,
      description_zh: translatedFields.description_zh || null,
      category: normalizedDraft.category || result?.category || 'other',
      status: 'open',
      budget_per_unit: normalizedDraft.budget_per_unit ? parseFloat(normalizedDraft.budget_per_unit) : null,
      budget_currency: normalizedDraft.budget_per_unit ? normalizeDisplayCurrency(normalizedDraft.budget_currency || defaultBudgetCurrency) : null,
      payment_plan: normalizedDraft.payment_plan ? parseInt(normalizedDraft.payment_plan, 10) : null,
      sample_requirement: normalizedDraft.sample_requirement || null,
      reference_image: normalizedDraft.reference_image || normalizedDraft.image_url || null,
    };

    const { data, error: requestError } = await runWithOptionalColumns({
      table: 'requests',
      payload,
      optionalKeys: ['description_ar', 'description_en', 'description_zh'],
      execute: (nextPayload) => sb.from('requests').insert(nextPayload).select('id').single(),
    });
    setSubmitting(false);
    if (requestError) {
      setError(t.error);
      return;
    }

    clearIdeaFlowDraft();
    try {
      window.sessionStorage.removeItem('maabar_request_draft');
    } catch {}
    appendMessage('assistant', t.sentSuccess);
    if (onClose) onClose();
    nav(data?.id ? `/dashboard?tab=requests&request=${data.id}` : '/dashboard?tab=requests');
  };

  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 2000,
          background: '#FFFFFF', color: 'rgba(0,0,0,0.88)', border: '1px solid rgba(0,0,0,0.10)',
          padding: '12px 18px', borderRadius: 14, cursor: 'pointer', fontSize: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a1a1a', display: 'inline-block' }} />
        {t.minimized}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', top: isMobile ? 'var(--vv-top)' : 0, left: 0, right: 0, height: isMobile ? 'var(--app-dvh)' : '100dvh', background: 'rgba(4,4,6,0.72)', zIndex: 2000, display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 18, overflow: 'hidden' }}>
      <style>{`@keyframes maabarTyping { 0%, 80%, 100% { transform: translateY(0); opacity: .35; } 40% { transform: translateY(-3px); opacity: 1; } }`}</style>
      <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 760, height: isMobile ? '100%' : 'min(88vh, 860px)', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: isMobile ? 0 : 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: isMobile ? 'none' : '0 30px 80px rgba(0,0,0,0.15)' }}>
        <div style={{ padding: '20px 24px', background: '#FAF8F5', borderBottom: '1px solid rgba(0,0,0,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(0,0,0,0.88)', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.title}</p>
            <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.subtitle}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMinimized(true)} style={{ background: 'none', border: '1px solid rgba(0,0,0,0.10)', color: 'rgba(0,0,0,0.88)', fontSize: 14, cursor: 'pointer', padding: '4px 12px', borderRadius: 10 }}>—</button>
            <button onClick={() => { if (phase === 'report') persistFlowDraft({ nextPhase: 'report' }); else clearIdeaFlowDraft(); if (onClose) onClose(); }} style={{ background: 'none', border: 'none', color: 'rgba(0,0,0,0.88)', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div ref={bodyRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '18px 14px' : '24px 22px', display: 'flex', flexDirection: 'column', gap: 14, background: '#FAF8F5', direction: isAr ? 'rtl' : 'ltr' }}>
          {messages.map((message) => (
            <Bubble key={message.id} role={message.role} isAr={isAr}>{message.content}</Bubble>
          ))}

          {isTyping && <TypingBubble />}

          {phase === 'report' && result && (
            <div style={{ marginTop: 8, padding: 18, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18 }}>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 16 }}>{t.report}</p>
              <ReportRow label={t.reportFields.product} value={lang === 'zh' ? result.product_name_zh : (isAr ? result.product_name_ar : result.product_name_en)} isAr={isAr} />
              <ReportRow label={t.reportFields.factory} value={result.factory_type} isAr={isAr} />
              <ReportRow label={t.reportFields.city} value={result.city} isAr={isAr} />
              <ReportRow label={t.reportFields.moq} value={result.moq} isAr={isAr} />
              <ReportRow label={t.reportFields.timeline} value={result.timeline} isAr={isAr} />
              <ReportRow label={t.reportFields.category} value={CAT_LABEL[lang]?.[result.category] || result.category} isAr={isAr} />
              <div style={{ paddingTop: 14 }}>
                <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.reportFields.specs}</p>
                <div style={{ padding: '12px 14px', background: '#FAF8F5', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 12, color: 'rgba(0,0,0,0.88)', fontSize: 13, lineHeight: 1.9, whiteSpace: 'pre-wrap', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {result.specs || result.request_description}
                </div>
              </div>

              <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(0,0,0,0.07)' }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(0,0,0,0.45)', marginBottom: 10 }}>{t.review}</p>
                <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 12, lineHeight: 1.8, marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.reviewHint}</p>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                  <div>
                    <FormLabel isAr={isAr}>{t.reviewFields.titleAr}</FormLabel>
                    <FieldInput isAr={isAr} value={reviewDraft.title_ar || ''} onChange={(event) => updateReviewDraft('title_ar', event.target.value)} />
                  </div>
                  <div>
                    <FormLabel isAr={isAr}>{t.reviewFields.titleEn}</FormLabel>
                    <FieldInput isAr={isAr} value={reviewDraft.title_en || ''} onChange={(event) => updateReviewDraft('title_en', event.target.value)} dir="ltr" />
                  </div>
                  <div>
                    <FormLabel isAr={isAr}>{t.reviewFields.quantity}</FormLabel>
                    <FieldInput isAr={isAr} value={reviewDraft.quantity || ''} onChange={(event) => updateReviewDraft('quantity', event.target.value)} />
                  </div>
                  <div>
                    <FormLabel isAr={isAr}>{t.budgetOptional}</FormLabel>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <FieldInput isAr={isAr} type="number" min="0" value={reviewDraft.budget_per_unit || ''} onChange={(event) => updateReviewDraft('budget_per_unit', event.target.value)} dir="ltr" style={{ flex: 1 }} />
                      <select
                        value={reviewDraft.budget_currency || defaultBudgetCurrency}
                        onChange={(event) => updateReviewDraft('budget_currency', event.target.value)}
                        style={{
                          width: 90,
                          background: '#FAF8F5',
                          color: 'rgba(0,0,0,0.88)',
                          border: '1px solid rgba(0,0,0,0.10)',
                          borderRadius: 12,
                          padding: '12px 10px',
                          fontSize: 14,
                          outline: 'none',
                          direction: 'ltr',
                          fontFamily: 'var(--font-sans)',
                        }}
                      >
                        {DISPLAY_CURRENCIES.map(c => (<option key={c} value={c}>{c}</option>))}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <FormLabel isAr={isAr}>{t.reviewFields.category}</FormLabel>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.entries(CAT_LABEL[lang] || CAT_LABEL.en).map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateReviewDraft('category', value)}
                        style={{
                          padding: '7px 14px',
                          fontSize: 12,
                          borderRadius: 20,
                          cursor: 'pointer',
                          background: reviewDraft.category === value ? '#1a1a1a' : 'transparent',
                          color: reviewDraft.category === value ? '#ffffff' : 'rgba(0,0,0,0.45)',
                          border: '1px solid rgba(0,0,0,0.10)',
                          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <FormLabel isAr={isAr}>{t.reviewFields.description}</FormLabel>
                  <FieldInput isAr={isAr} as="textarea" rows={5} value={reviewDraft.description || ''} onChange={(event) => updateReviewDraft('description', event.target.value)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12, marginTop: 12 }}>
                  <div>
                    <FormLabel isAr={isAr}>{t.reviewFields.paymentPlan}</FormLabel>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {Object.entries(PAYMENT_PLAN_LABEL[lang] || PAYMENT_PLAN_LABEL.en).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => updateReviewDraft('payment_plan', value)}
                          style={{
                            padding: '7px 12px',
                            fontSize: 12,
                            borderRadius: 20,
                            cursor: 'pointer',
                            background: String(reviewDraft.payment_plan) === String(value) ? '#1a1a1a' : 'transparent',
                            color: String(reviewDraft.payment_plan) === String(value) ? '#ffffff' : 'rgba(0,0,0,0.45)',
                            border: '1px solid rgba(0,0,0,0.10)',
                            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <FormLabel isAr={isAr}>{t.reviewFields.sampleRequirement}</FormLabel>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {Object.entries(SAMPLE_LABEL[lang] || SAMPLE_LABEL.en).map(([value, label]) => (
                        <label key={value} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', color: 'rgba(0,0,0,0.45)', fontSize: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          <input type="radio" name="idea-sample-requirement" checked={reviewDraft.sample_requirement === value} onChange={() => updateReviewDraft('sample_requirement', value)} style={{ accentColor: '#1a1a1a' }} />
                          {label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <p style={{ color: 'rgba(0,0,0,0.45)', fontSize: 11, lineHeight: 1.8, marginTop: 14, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {t.requestPreviewNote}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button onClick={submitRequest} disabled={submitting} style={{ flex: 1, minWidth: 180, background: '#1a1a1a', color: '#ffffff', border: 'none', padding: '14px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', opacity: submitting ? 0.65 : 1 }}>
                  {user ? t.submit : t.loginSubmit}
                </button>
                <button onClick={resetAll} style={{ flex: 1, minWidth: 160, background: 'transparent', color: 'rgba(0,0,0,0.88)', border: '1px solid rgba(0,0,0,0.10)', padding: '14px 16px', borderRadius: 12, fontSize: 13, cursor: 'pointer', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {t.newChat}
                </button>
              </div>
            </div>
          )}

          {phase === 'generating' && (
            <Bubble role="assistant" isAr={isAr}>{t.generating}</Bubble>
          )}

          {error && <p style={{ color: 'var(--red)', fontSize: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{error}</p>}
        </div>

        {phase !== 'report' && (
          <div style={{ padding: isMobile ? '14px 12px calc(14px + env(safe-area-inset-bottom))' : 18, borderTop: '1px solid rgba(0,0,0,0.07)', background: '#FFFFFF' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    handleSend();
                  }
                }}
                onFocus={() => setTimeout(() => {
                  if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
                }, 250)}
                rows={2}
                placeholder={t.placeholder}
                style={{
                  flex: 1,
                  resize: 'none',
                  background: '#FAF8F5',
                  color: 'rgba(0,0,0,0.88)',
                  border: '1px solid rgba(0,0,0,0.10)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  outline: 'none',
                  fontSize: 16,
                  lineHeight: 1.8,
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  direction: isAr ? 'rtl' : 'ltr',
                }}
              />
              <button onClick={handleSend} disabled={!draftText.trim() || isTyping} style={{ minWidth: 112, background: draftText.trim() && !isTyping ? '#1a1a1a' : 'rgba(0,0,0,0.10)', color: draftText.trim() && !isTyping ? '#ffffff' : 'rgba(0,0,0,0.25)', border: 'none', padding: '14px 18px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: draftText.trim() && !isTyping ? 'pointer' : 'default', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {t.send}
              </button>
            </div>
            {briefReady && (
              <button
                onClick={generateReport}
                disabled={isTyping}
                style={{ marginTop: 10, width: '100%', background: 'transparent', color: 'rgba(0,0,0,0.45)', border: '1px solid rgba(0,0,0,0.10)', padding: '12px 14px', borderRadius: 14, fontSize: 12, cursor: isTyping ? 'default' : 'pointer', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', opacity: isTyping ? 0.5 : 1 }}>
                {isAr ? 'حوّل المحادثة إلى تقرير احترافي' : lang === 'zh' ? '将对话整理成专业报告' : 'Turn this conversation into a professional brief'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
