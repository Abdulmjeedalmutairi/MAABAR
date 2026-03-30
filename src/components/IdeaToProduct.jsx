import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import { generateIdeaToProductReport, requestProductConversationReply } from '../lib/maabarAi/client';
import { MAABAR_AI_PERSONA_NAME } from '../lib/maabarAi/config';

const SAUDI_REPRESENTATIVE_NAMES = [
  'سلمان', 'فيصل', 'تركي', 'عبدالعزيز', 'سعود', 'نورة', 'العنود', 'الجوهرة', 'ريم', 'لولوة'
];

const CAT_LABEL = {
  ar: { electronics: 'إلكترونيات', furniture: 'أثاث', clothing: 'ملابس', building: 'مواد بناء', food: 'غذاء', other: 'أخرى' },
  en: { electronics: 'Electronics', furniture: 'Furniture', clothing: 'Clothing', building: 'Building Materials', food: 'Food', other: 'Other' },
  zh: { electronics: '电子产品', furniture: '家具', clothing: '服装', building: '建材', food: '食品', other: '其他' },
};

const COPY = {
  ar: {
    title: 'صنّع فكرتك',
    subtitle: `${MAABAR_AI_PERSONA_NAME} يحوّل الفكرة إلى طلب تصنيع احترافي`,
    minimized: 'صنّع فكرتك — متابعة',
    intro: 'اكتب لي فكرتك أو قل مباشرة: أبي أوصل لموردين، وأنا أمشي معك بخطوات قصيرة وواضحة.',
    placeholder: 'اكتب رسالتك هنا...',
    send: 'إرسال',
    generating: 'أرتب فكرتك الآن وأبني لك brief احترافي...',
    report: 'تقرير التصنيع',
    submit: 'إرسال لموردين مختصين',
    loginSubmit: 'تسجيل الدخول للإرسال',
    newChat: 'محادثة جديدة',
    error: 'حدث خطأ، حاول مرة أخرى',
    reportReady: 'جهزت لك التقرير. راجعه، وإذا مناسب أرسله لموردين مختصين مباشرة.',
    supplierRouteIntro: 'واضح أنك تريد الوصول لموردين بسرعة. خلني آخذ منك الحد الأدنى فقط ثم أجهز الطلب بشكل احترافي.',
    buildRouteIntro: 'ممتاز. خلني أفهم فكرتك بشكل مرتب، وبعدها أطلع لك brief جاهز للتصنيع.',
    supplierQuestions: [
      'وش المنتج أو الفكرة بشكل مختصر؟',
      'كم الكمية الأولية تقريبًا؟',
      'هل عندك ميزانية أو سعر مستهدف للوحدة؟',
    ],
    buildQuestions: [
      'وش نوع المنتج أو استخدامه الأساسي؟',
      'هل فيه خامات أو مواصفات مهمة؟',
      'كم الكمية الأولية تقريبًا؟',
      'هل عندك ميزانية أو سعر مستهدف؟',
    ],
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
  },
  en: {
    title: 'Build Your Product',
    subtitle: `${MAABAR_AI_PERSONA_NAME} turns your idea into a professional manufacturing brief`,
    minimized: 'Build Your Product — Continue',
    intro: 'Tell me your idea — or just say “connect me to suppliers” — and I will guide you in short, clear steps.',
    placeholder: 'Write your message...',
    send: 'Send',
    generating: 'Preparing your manufacturing brief...',
    report: 'Manufacturing Report',
    submit: 'Send to matched suppliers',
    loginSubmit: 'Login to submit',
    newChat: 'New Chat',
    error: 'Something went wrong, please try again',
    reportReady: 'Your report is ready. Review it and send it to matched suppliers when ready.',
    supplierRouteIntro: 'Got it — you want supplier matching fast. I’ll only ask for the essentials, then prepare a clean brief.',
    buildRouteIntro: 'Great. I’ll understand your idea first, then turn it into a professional manufacturing brief.',
    supplierQuestions: [
      'What is the product or idea in one short line?',
      'What is the approximate initial quantity?',
      'Do you have a target budget or unit price?',
    ],
    buildQuestions: [
      'What is the product and main use case?',
      'Any key materials or specifications?',
      'What is the approximate initial quantity?',
      'Do you have a target budget or unit price?',
    ],
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
  },
  zh: {
    title: '打造您的产品',
    subtitle: `${MAABAR_AI_PERSONA_NAME} 将想法整理成专业制造需求`,
    minimized: '继续打造产品',
    intro: '告诉我您的想法，或直接说“帮我对接供应商”，我会用清晰简短的步骤协助您。',
    placeholder: '请输入内容...',
    send: '发送',
    generating: '正在整理您的制造需求...',
    report: '制造报告',
    submit: '发送给匹配供应商',
    loginSubmit: '登录后发送',
    newChat: '新对话',
    error: '出错了，请重试',
    reportReady: '报告已准备好。确认后可直接发送给匹配供应商。',
    supplierRouteIntro: '了解，您想尽快对接供应商。我先收集最核心的信息，再为您整理成专业需求。',
    buildRouteIntro: '很好。我先了解您的产品想法，然后整理成专业制造 brief。',
    supplierQuestions: [
      '请简要描述产品或想法？',
      '预计首批数量是多少？',
      '您是否有目标预算或单价？',
    ],
    buildQuestions: [
      '产品是什么？主要用途是什么？',
      '是否有关键材料或规格要求？',
      '预计首批数量是多少？',
      '您是否有目标预算或单价？',
    ],
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
        background: isUser ? '#E8E3D8' : '#23242A',
        color: isUser ? '#141414' : '#F5F2EC',
        border: `1px solid ${isUser ? 'rgba(232,227,216,0.35)' : 'rgba(255,255,255,0.06)'}`,
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

function TypingBubble({ isAr }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div style={{ maxWidth: '86%', padding: '14px 16px', borderRadius: 16, background: '#23242A', color: '#F5F2EC', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {[0, 1, 2].map((dot) => (
            <span key={dot} style={{ width: 8, height: 8, borderRadius: '50%', background: '#8F9198', display: 'inline-block', opacity: 0.35, animation: `maabarTyping 1.2s ${dot * 0.15}s infinite ease-in-out` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ReportRow({ label, value, isAr }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <span style={{ color: '#8F9198', fontSize: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{label}</span>
      <span style={{ color: '#F4F1EB', fontSize: 13, fontWeight: 500, textAlign: isAr ? 'left' : 'right', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{value}</span>
    </div>
  );
}

export default function IdeaToProduct({ lang, user, onClose }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const t = COPY[lang] || COPY.en;
  const representativeName = useMemo(() => SAUDI_REPRESENTATIVE_NAMES[Math.floor(Math.random() * SAUDI_REPRESENTATIVE_NAMES.length)], []);
  const initialMessages = useMemo(() => getInitialMessages(lang, representativeName), [lang, representativeName]);
  const [minimized, setMinimized] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const bodyRef = useRef(null);
  const [draftText, setDraftText] = useState('');
  const [phase, setPhase] = useState('chat');
  const [idea, setIdea] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [briefReady, setBriefReady] = useState(false);
  const [messages, setMessages] = useState(() =>
    initialMessages.map((content, index) => ({ id: index + 1, role: 'assistant', content }))
  );

  const hasUserMessages = useMemo(() => messages.some((message) => message.role === 'user'), [messages]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, isTyping, phase]);

  const resetAll = () => {
    setDraftText('');
    setPhase('chat');
    setIdea('');
    setResult(null);
    setError('');
    setSubmitting(false);
    setIsTyping(false);
    setBriefReady(false);
    setMessages(initialMessages.map((content, index) => ({ id: Date.now() + index, role: 'assistant', content })));
  };

  const appendMessage = (role, content) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role, content }]);
  };

  const generateReport = async (sourceOverride = '') => {
    const userConversation = messages
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
      setResult(report);
      setPhase('report');
      appendMessage('assistant', t.reportReady);
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
    setDraftText('');
    setIdea((prev) => prev || value);
    appendMessage('user', value);
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
      appendMessage('assistant', productReply?.reply || t.error);
      const readyForBrief = Boolean(productReply?.enoughInfo || productReply?.nextStep === 'brief_ready');
      setBriefReady(readyForBrief);
      if (readyForBrief) {
        await generateReport([...nextConversation.filter((message) => message.role === 'user').map((message) => message.content), value].join('\n'));
      }
    } catch (_error) {
      appendMessage('assistant', t.error);
      setError(t.error);
    } finally {
      setIsTyping(false);
    }
  };

  const submitRequest = async () => {
    if (!result) return;
    if (!user) {
      const draft = {
        title_ar: result.product_name_ar,
        title_en: result.product_name_en,
        title_zh: result.product_name_zh || result.product_name_en,
        description: result.request_description,
        quantity: result.moq,
        category: result.category,
      };
      sessionStorage.setItem('maabar_ai_draft', JSON.stringify(draft));
      if (onClose) onClose();
      nav('/login');
      return;
    }

    setSubmitting(true);
    const { error: requestError } = await sb.from('requests').insert({
      buyer_id: user.id,
      title_ar: result.product_name_ar,
      title_en: result.product_name_en,
      title_zh: result.product_name_zh || result.product_name_en,
      quantity: result.moq,
      description: result.request_description,
      category: result.category,
      status: 'open',
    });
    setSubmitting(false);
    if (requestError) {
      setError(t.error);
      return;
    }
    if (onClose) onClose();
    nav('/requests');
  };

  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 2000,
          background: '#1F2025', color: '#F4F1EB', border: '1px solid rgba(255,255,255,0.08)',
          padding: '12px 18px', borderRadius: 14, cursor: 'pointer', fontSize: 12,
          boxShadow: '0 18px 50px rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8FB1FF', display: 'inline-block' }} />
        {t.minimized}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,4,6,0.72)', zIndex: 2000, display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'center', padding: isMobile ? 0 : 18 }}>
      <style>{`@keyframes maabarTyping { 0%, 80%, 100% { transform: translateY(0); opacity: .35; } 40% { transform: translateY(-3px); opacity: 1; } }`}</style>
      <div style={{ width: '100%', maxWidth: isMobile ? '100%' : 760, height: isMobile ? '100dvh' : 'min(88vh, 860px)', background: '#141519', border: '1px solid rgba(255,255,255,0.07)', borderRadius: isMobile ? 0 : 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: isMobile ? 'none' : '0 30px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ padding: '20px 24px', background: '#191A1F', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#F4F1EB', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.title}</p>
            <p style={{ fontSize: 12, color: '#8B8E96', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.subtitle}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMinimized(true)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.12)', color: '#F4F1EB', fontSize: 14, cursor: 'pointer', padding: '4px 12px', borderRadius: 10 }}>—</button>
            <button onClick={() => { resetAll(); if (onClose) onClose(); }} style={{ background: 'none', border: 'none', color: '#F4F1EB', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div ref={bodyRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '18px 14px' : '24px 22px', display: 'flex', flexDirection: 'column', gap: 14, background: 'linear-gradient(180deg, #17181D 0%, #141519 100%)', direction: isAr ? 'rtl' : 'ltr' }}>
          {messages.map((message) => (
            <Bubble key={message.id} role={message.role} isAr={isAr}>{message.content}</Bubble>
          ))}

          {isTyping && <TypingBubble isAr={isAr} />}

          {phase === 'report' && result && (
            <div style={{ marginTop: 8, padding: 18, background: '#1F2025', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 }}>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#8B8E96', marginBottom: 16 }}>{t.report}</p>
              <ReportRow label={t.reportFields.product} value={lang === 'zh' ? result.product_name_zh : (isAr ? result.product_name_ar : result.product_name_en)} isAr={isAr} />
              <ReportRow label={t.reportFields.factory} value={result.factory_type} isAr={isAr} />
              <ReportRow label={t.reportFields.city} value={result.city} isAr={isAr} />
              <ReportRow label={t.reportFields.moq} value={result.moq} isAr={isAr} />
              <ReportRow label={t.reportFields.timeline} value={result.timeline} isAr={isAr} />
              <ReportRow label={t.reportFields.category} value={CAT_LABEL[lang]?.[result.category] || result.category} isAr={isAr} />
              <div style={{ paddingTop: 14 }}>
                <p style={{ color: '#8F9198', fontSize: 12, marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{t.reportFields.specs}</p>
                <div style={{ padding: '12px 14px', background: '#17181D', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, color: '#F4F1EB', fontSize: 13, lineHeight: 1.9, whiteSpace: 'pre-wrap', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {result.specs || result.request_description}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                <button onClick={submitRequest} disabled={submitting} style={{ flex: 1, minWidth: 180, background: '#E8E3D8', color: '#141414', border: 'none', padding: '14px 16px', borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', opacity: submitting ? 0.65 : 1 }}>
                  {user ? t.submit : t.loginSubmit}
                </button>
                <button onClick={resetAll} style={{ flex: 1, minWidth: 160, background: 'transparent', color: '#F4F1EB', border: '1px solid rgba(255,255,255,0.12)', padding: '14px 16px', borderRadius: 12, fontSize: 13, cursor: 'pointer', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {t.newChat}
                </button>
              </div>
            </div>
          )}

          {phase === 'generating' && (
            <Bubble role="assistant" isAr={isAr}>{t.generating}</Bubble>
          )}

          {error && <p style={{ color: '#ff8f8f', fontSize: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{error}</p>}
        </div>

        {phase !== 'report' && (
          <div style={{ padding: isMobile ? '14px 12px calc(14px + env(safe-area-inset-bottom))' : 18, borderTop: '1px solid rgba(255,255,255,0.06)', background: '#17181D' }}>
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
                rows={2}
                placeholder={t.placeholder}
                style={{
                  flex: 1,
                  resize: 'none',
                  background: '#23242A',
                  color: '#F4F1EB',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14,
                  padding: '14px 16px',
                  outline: 'none',
                  fontSize: 14,
                  lineHeight: 1.8,
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  direction: isAr ? 'rtl' : 'ltr',
                }}
              />
              <button onClick={handleSend} disabled={!draftText.trim() || isTyping} style={{ minWidth: 112, background: draftText.trim() && !isTyping ? '#E8E3D8' : '#555', color: '#141414', border: 'none', padding: '14px 18px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: draftText.trim() && !isTyping ? 'pointer' : 'default', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {t.send}
              </button>
            </div>
            {briefReady && (
              <button
                onClick={generateReport}
                disabled={isTyping}
                style={{ marginTop: 10, width: '100%', background: 'transparent', color: '#E8E3D8', border: '1px solid rgba(232,227,216,0.18)', padding: '12px 14px', borderRadius: 14, fontSize: 12, cursor: isTyping ? 'default' : 'pointer', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', opacity: isTyping ? 0.5 : 1 }}>
                {isAr ? 'حوّل المحادثة إلى تقرير احترافي' : lang === 'zh' ? '将对话整理成专业报告' : 'Turn this conversation into a professional brief'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
