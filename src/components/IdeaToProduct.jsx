import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const AI_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const CAT_LABEL = {
  ar: { electronics: 'إلكترونيات', furniture: 'أثاث', clothing: 'ملابس', building: 'مواد بناء', food: 'غذاء', other: 'أخرى' },
  en: { electronics: 'Electronics', furniture: 'Furniture', clothing: 'Clothing', building: 'Building Materials', food: 'Food', other: 'Other' },
  zh: { electronics: '电子产品', furniture: '家具', clothing: '服装', building: '建材', food: '食品', other: '其他' },
};

const SYSTEM = `You are Maabar's manufacturing and supplier-matching agent.
Return ONLY valid JSON with these exact fields:
{
  "product_name_ar": "اسم المنتج بالعربي",
  "product_name_en": "Product name in English",
  "product_name_zh": "产品中文名",
  "specs": "Key specifications and user requirements",
  "factory_type": "Type of supplier or factory needed",
  "city": "Best Chinese manufacturing city",
  "price_estimate": "Estimated target/unit price in USD if possible",
  "moq": "Recommended minimum order quantity",
  "timeline": "Estimated production timeline",
  "request_description": "Professional supplier-ready brief for matching and sourcing",
  "category": "one of: electronics, furniture, clothing, building, food, other"
}
Rules:
- If the user intent is supplier matching, optimize the request_description for routing to suitable suppliers.
- Keep text professional, concise, and commercial.
- Always respond in the user's language for text fields, but category must stay in English enum.
- No markdown. No extra commentary.`;

const COPY = {
  ar: {
    title: 'صنّع فكرتك',
    subtitle: 'وكيل معبر يساعدك يحوّل الفكرة إلى طلب تصنيع احترافي',
    minimized: 'صنّع فكرتك — متابعة',
    intro: 'أهلاً، أنا وكيل معبر. اكتب لي فكرتك أو قل مباشرة: أبي أوصل لموردين، وأنا أمشي معك بخطوات قصيرة وواضحة.',
    placeholder: 'اكتب رسالتك هنا...',
    send: 'إرسال',
    generating: 'أرتب فكرتك الآن وأبني لك brief احترافي...',
    report: 'تقرير التصنيع',
    submit: 'إرسال لموردين مختصين',
    loginSubmit: 'تسجيل الدخول للإرسال',
    newChat: 'محادثة جديدة',
    close: 'إغلاق',
    edit: 'تعديل',
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
    subtitle: 'A Maabar agent turns your idea into a professional manufacturing brief',
    minimized: 'Build Your Product — Continue',
    intro: 'Hi, I am Maabar’s sourcing agent. Tell me your idea — or just say “connect me to suppliers” — and I will guide you in short, clear steps.',
    placeholder: 'Write your message...',
    send: 'Send',
    generating: 'Preparing your manufacturing brief...',
    report: 'Manufacturing Report',
    submit: 'Send to matched suppliers',
    loginSubmit: 'Login to submit',
    newChat: 'New Chat',
    close: 'Close',
    edit: 'Edit',
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
};

function detectIntent(text = '') {
  const t = text.toLowerCase();
  const supplierKeywords = [
    'مورد', 'موردين', 'مصنع', 'مصانع', 'وصلني', 'ابي مورد', 'أبي مورد', 'ابي اوصل', 'أبي أوصل',
    'supplier', 'suppliers', 'factory', 'factories', 'manufacturer', 'sourcing', 'connect me'
  ];
  return supplierKeywords.some((k) => t.includes(k)) ? 'supplier_match' : 'build_product';
}

async function callAI(prompt) {
  const res = await fetch(AI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
    body: JSON.stringify({
      system: SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '';
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
  const [minimized, setMinimized] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [phase, setPhase] = useState('chat'); // chat | generating | report
  const [routeMode, setRouteMode] = useState(null);
  const [idea, setIdea] = useState('');
  const [questionIndex, setQuestionIndex] = useState(-1);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: t.intro },
  ]);

  const questions = useMemo(() => (
    routeMode === 'supplier_match' ? t.supplierQuestions : t.buildQuestions
  ), [routeMode, t]);

  const resetAll = () => {
    setDraftText('');
    setPhase('chat');
    setRouteMode(null);
    setIdea('');
    setQuestionIndex(-1);
    setAnswers([]);
    setResult(null);
    setError('');
    setSubmitting(false);
    setMessages([{ id: Date.now(), role: 'assistant', content: t.intro }]);
  };

  const appendMessage = (role, content) => {
    setMessages((prev) => [...prev, { id: Date.now() + Math.random(), role, content }]);
  };

  const generateReport = async (initialIdea, mode, collectedAnswers) => {
    setPhase('generating');
    setError('');
    try {
      const prompt = [
        `User intent mode: ${mode}`,
        `Original user message: ${initialIdea}`,
        ...collectedAnswers.map((answer, idx) => `Q${idx + 1}: ${questions[idx]}\nA${idx + 1}: ${answer}`),
      ].join('\n\n');

      const text = await callAI(prompt);
      const clean = text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(clean);
      setResult(json);
      setPhase('report');
      appendMessage('assistant', t.reportReady);
    } catch (e) {
      setError(t.error);
      setPhase('chat');
      appendMessage('assistant', t.error);
    }
  };

  const handleSend = async () => {
    const value = draftText.trim();
    if (!value) return;
    setDraftText('');
    appendMessage('user', value);

    if (!routeMode) {
      const detected = detectIntent(value);
      setRouteMode(detected);
      setIdea(value);
      const intro = detected === 'supplier_match' ? t.supplierRouteIntro : t.buildRouteIntro;
      appendMessage('assistant', `${intro}\n\n${questions[0]}`);
      setQuestionIndex(0);
      return;
    }

    if (questionIndex >= 0) {
      const nextAnswers = [...answers, value];
      setAnswers(nextAnswers);

      if (questionIndex < questions.length - 1) {
        const nextIdx = questionIndex + 1;
        setQuestionIndex(nextIdx);
        appendMessage('assistant', questions[nextIdx]);
        return;
      }

      setQuestionIndex(-1);
      appendMessage('assistant', t.generating);
      await generateReport(idea, routeMode, nextAnswers);
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
    const { error: err } = await sb.from('requests').insert({
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
    if (err) {
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
        }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#8FB1FF', display: 'inline-block' }} />
        {t.minimized}
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(4,4,6,0.72)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 18 }}>
      <div style={{ width: '100%', maxWidth: 760, height: 'min(88vh, 860px)', background: '#141519', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
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

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 22px', display: 'flex', flexDirection: 'column', gap: 14, background: 'linear-gradient(180deg, #17181D 0%, #141519 100%)', direction: isAr ? 'rtl' : 'ltr' }}>
          {messages.map((m) => (
            <Bubble key={m.id} role={m.role} isAr={isAr}>{m.content}</Bubble>
          ))}

          {phase === 'report' && result && (
            <div style={{ marginTop: 8, padding: 18, background: '#1F2025', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 }}>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#8B8E96', marginBottom: 16 }}>{t.report}</p>
              <ReportRow label={t.reportFields.product} value={lang === 'zh' ? result.product_name_zh : (isAr ? result.product_name_ar : result.product_name_en)} isAr={isAr} />
              <ReportRow label={t.reportFields.factory} value={result.factory_type} isAr={isAr} />
              <ReportRow label={t.reportFields.city} value={result.city} isAr={isAr} />
              <ReportRow label={t.reportFields.cost} value={result.price_estimate} isAr={isAr} />
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
          <div style={{ padding: 18, borderTop: '1px solid rgba(255,255,255,0.06)', background: '#17181D' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
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
              <button onClick={handleSend} disabled={!draftText.trim()} style={{ minWidth: 112, background: draftText.trim() ? '#E8E3D8' : '#555', color: '#141414', border: 'none', padding: '14px 18px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: draftText.trim() ? 'pointer' : 'default', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {t.send}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
