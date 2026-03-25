import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const AI_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const CATS = ['electronics', 'furniture', 'clothing', 'building', 'food', 'other'];

const CAT_LABEL = {
  ar: { electronics: 'إلكترونيات', furniture: 'أثاث', clothing: 'ملابس', building: 'مواد بناء', food: 'غذاء', other: 'أخرى' },
  en: { electronics: 'Electronics', furniture: 'Furniture', clothing: 'Clothing', building: 'Building Materials', food: 'Food', other: 'Other' },
  zh: { electronics: '电子产品', furniture: '家具', clothing: '服装', building: '建材', food: '食品', other: '其他' },
};

const SYSTEM = `You are a Chinese manufacturing advisor for Maabar B2B platform. Given a product idea, produce ONLY a JSON object (no markdown, no extra text) with these exact fields:
{
  "product_name_ar": "اسم المنتج بالعربي",
  "product_name_en": "Product name in English",
  "product_name_zh": "产品中文名",
  "specs": "Key specifications",
  "factory_type": "Type of factory needed",
  "city": "Best Chinese manufacturing city",
  "price_estimate": "Price per unit estimate in USD",
  "moq": "Minimum order quantity",
  "timeline": "Production timeline",
  "request_description": "Full request description for suppliers",
  "category": "one of: electronics, furniture, clothing, building, food, other"
}
Always respond in the user's language for text fields, but category must be one of the enum values.`;

const QUESTIONS = {
  ar: [
    'ما المواد المفضلة؟ (بلاستيك، معدن، قماش، خشب...)',
    'كم الكمية الأولى المطلوبة تقريباً؟',
    'ما الميزانية التقريبية للوحدة الواحدة؟',
  ],
  en: [
    'What materials do you prefer? (plastic, metal, fabric, wood...)',
    'What is the approximate initial quantity you need?',
    'What is your approximate budget per unit?',
  ],
  zh: [
    '您偏好什么材料？（塑料、金属、布料、木材...）',
    '您大约需要多少初始数量？',
    '每件产品的大约预算是多少？',
  ],
};

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

export default function IdeaToProduct({ lang, user, onClose }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [minimized, setMinimized] = useState(false);

  // step: 'input' | 'choice' | 'questions' | 'report'
  const [step, setStep] = useState('input');
  const [idea, setIdea] = useState('');
  const [qAnswers, setQAnswers] = useState(['', '', '']);
  const [qIdx, setQIdx] = useState(0);
  const [qInput, setQInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const questions = QUESTIONS[lang] || QUESTIONS.ar;

  const generateReport = async (fullIdea) => {
    setLoading(true);
    setError('');
    try {
      const text = await callAI(fullIdea);
      const clean = text.replace(/```json|```/g, '').trim();
      const json = JSON.parse(clean);
      setResult(json);
      setStep('report');
    } catch (e) {
      setError(isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Error generating report, try again');
      setStep('choice');
    }
    setLoading(false);
  };

  const handleIdeaSubmit = () => {
    if (!idea.trim()) return;
    setStep('choice');
  };

  const handleDirect = () => {
    generateReport(idea.trim());
  };

  const handleDetails = () => {
    setStep('questions');
    setQIdx(0);
    setQInput('');
  };

  const handleQNext = () => {
    if (!qInput.trim()) return;
    const updated = [...qAnswers];
    updated[qIdx] = qInput.trim();
    setQAnswers(updated);
    setQInput('');
    if (qIdx < questions.length - 1) {
      setQIdx(qIdx + 1);
    } else {
      // All answers collected — generate report
      const fullIdea = `${idea.trim()}\n${questions.map((q, i) => `${q}: ${updated[i]}`).join('\n')}`;
      setQAnswers(updated);
      generateReport(fullIdea);
    }
  };

  const submitRequest = async () => {
    if (!result) return;
    if (!user) {
      // Save draft to sessionStorage and redirect to login
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
    if (err) { setError(isAr ? 'حدث خطأ' : 'Error'); return; }
    if (onClose) onClose();
    nav('/requests');
  };

  const reset = () => {
    setStep('input');
    setIdea('');
    setQAnswers(['', '', '']);
    setQIdx(0);
    setQInput('');
    setResult(null);
    setError('');
  };

  if (minimized) return (
    <div onClick={() => setMinimized(false)} style={{
      position: 'fixed', bottom: 24, left: 24, zIndex: 2000,
      background: '#2C2C2C', color: '#F7F5F2',
      padding: '10px 20px', borderRadius: 3,
      cursor: 'pointer', fontSize: 12, fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      fontFamily: isAr ? 'var(--font-ar)' : 'inherit',
      display: 'flex', alignItems: 'center', gap: 8, letterSpacing: 0.5,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf50', display: 'inline-block' }} />
      {isAr ? 'ابتكر منتجك — متابعة' : 'Create Product — Continue'}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#F7F5F2', borderRadius: 4, width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ padding: '18px 24px', background: '#2C2C2C', color: '#F7F5F2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', letterSpacing: 0.5 }}>
              {isAr ? 'ابتكر منتجك الخاص' : 'Create Your Own Product'}
            </p>
            <p style={{ fontSize: 11, opacity: 0.5, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {isAr ? 'AI يحول فكرتك لطلب توريد' : 'AI turns your idea into a sourcing request'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setMinimized(true)} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.2)', color: '#F7F5F2', fontSize: 14, cursor: 'pointer', padding: '2px 10px', borderRadius: 2 }}>—</button>
            <button onClick={() => { reset(); if (onClose) onClose(); }} style={{ background: 'none', border: 'none', color: '#F7F5F2', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ padding: '28px 28px 24px', fontFamily: isAr ? 'var(--font-ar)' : 'inherit', direction: isAr ? 'rtl' : 'ltr' }}>

          {/* STEP: INPUT */}
          {step === 'input' && (
            <div>
              <p style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.7 }}>
                {isAr ? 'صف فكرتك في جملة واحدة:' : 'Describe your idea in one sentence:'}
              </p>
              <textarea
                autoFocus
                value={idea}
                onChange={e => setIdea(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleIdeaSubmit(); } }}
                placeholder={isAr ? 'مثال: أريد كرسي مكتبي بظهر داعم من الشبك...' : 'e.g. I want a mesh office chair with lumbar support...'}
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #E5E0D8', borderRadius: 3, fontSize: 13, outline: 'none', background: '#fff', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', lineHeight: 1.6 }}
                dir={isAr ? 'rtl' : 'ltr'}
              />
              <button
                onClick={handleIdeaSubmit}
                disabled={!idea.trim()}
                style={{ marginTop: 12, width: '100%', padding: '12px', background: idea.trim() ? '#2C2C2C' : '#ccc', color: '#F7F5F2', border: 'none', borderRadius: 3, fontSize: 12, cursor: idea.trim() ? 'pointer' : 'default', letterSpacing: 1.5, textTransform: 'uppercase' }}
              >
                {isAr ? 'متابعة' : 'Continue'} →
              </button>
            </div>
          )}

          {/* STEP: CHOICE */}
          {step === 'choice' && !loading && (
            <div>
              <div style={{ background: '#EFECE7', borderRadius: 4, padding: '12px 16px', fontSize: 13, lineHeight: 1.7, color: '#2C2C2C', marginBottom: 20 }}>
                {idea}
              </div>
              {error && <p style={{ color: '#c00', fontSize: 12, marginBottom: 12 }}>{error}</p>}
              <p style={{ fontSize: 13, color: '#555', marginBottom: 16, lineHeight: 1.7 }}>
                {isAr ? 'كيف تريد المتابعة؟' : 'How would you like to continue?'}
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={handleDirect}
                  style={{ flex: 1, padding: '12px', background: '#2C2C2C', color: '#F7F5F2', border: 'none', borderRadius: 3, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}
                >
                  {isAr ? '⚡ مباشرة' : '⚡ Directly'}
                </button>
                <button
                  onClick={handleDetails}
                  style={{ flex: 1, padding: '12px', background: 'none', color: '#2C2C2C', border: '1px solid #2C2C2C', borderRadius: 3, fontSize: 12, cursor: 'pointer', letterSpacing: 1 }}
                >
                  {isAr ? '📋 إضافة تفاصيل' : '📋 Add Details'}
                </button>
              </div>
              <button onClick={reset} style={{ marginTop: 10, width: '100%', padding: '8px', background: 'none', border: '1px solid #E5E0D8', color: '#7a7a7a', borderRadius: 3, fontSize: 11, cursor: 'pointer' }}>
                {isAr ? '← تعديل الفكرة' : '← Edit idea'}
              </button>
            </div>
          )}

          {/* STEP: QUESTIONS */}
          {step === 'questions' && !loading && (
            <div>
              <p style={{ fontSize: 11, color: '#aaa', marginBottom: 8, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                {isAr ? `سؤال ${qIdx + 1} من ${questions.length}` : `Question ${qIdx + 1} of ${questions.length}`}
              </p>
              <p style={{ fontSize: 14, color: '#2C2C2C', marginBottom: 16, lineHeight: 1.7 }}>
                {questions[qIdx]}
              </p>
              <input
                autoFocus
                value={qInput}
                onChange={e => setQInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQNext()}
                style={{ width: '100%', padding: '11px 14px', border: '1px solid #E5E0D8', borderRadius: 3, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                dir={isAr ? 'rtl' : 'ltr'}
              />
              <button
                onClick={handleQNext}
                disabled={!qInput.trim()}
                style={{ marginTop: 12, width: '100%', padding: '12px', background: qInput.trim() ? '#2C2C2C' : '#ccc', color: '#F7F5F2', border: 'none', borderRadius: 3, fontSize: 12, cursor: qInput.trim() ? 'pointer' : 'default', letterSpacing: 1.5 }}
              >
                {qIdx < questions.length - 1 ? (isAr ? 'التالي →' : 'Next →') : (isAr ? 'إنشاء التقرير ✓' : 'Generate Report ✓')}
              </button>
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#7a7a7a', fontSize: 13 }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
              {isAr ? 'جاري التحليل...' : 'Analyzing your idea...'}
            </div>
          )}

          {/* STEP: REPORT */}
          {step === 'report' && result && (
            <div>
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16 }}>
                {isAr ? 'تقرير التصنيع' : 'Manufacturing Report'}
              </p>
              {[
                { label: isAr ? 'المنتج' : 'Product', val: lang === 'zh' ? result.product_name_zh : (isAr ? result.product_name_ar : result.product_name_en) },
                { label: isAr ? 'نوع المصنع' : 'Factory Type', val: result.factory_type },
                { label: isAr ? 'المدينة' : 'City', val: result.city },
                { label: isAr ? 'تكلفة تقريبية' : 'Est. Cost', val: result.price_estimate },
                { label: 'MOQ', val: result.moq },
                { label: isAr ? 'مدة التصنيع' : 'Timeline', val: result.timeline },
                { label: isAr ? 'التخصص' : 'Category', val: CAT_LABEL[lang]?.[result.category] || result.category },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E5E0D8', fontSize: 12 }}>
                  <span style={{ color: '#7a7a7a', letterSpacing: 0.5 }}>{r.label}</span>
                  <span style={{ fontWeight: 500, color: '#2C2C2C' }}>{r.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, display: 'flex', gap: 10 }}>
                <button
                  onClick={submitRequest}
                  disabled={submitting}
                  style={{ flex: 1, background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '11px', fontSize: 11, cursor: 'pointer', borderRadius: 2, letterSpacing: 1.5, textTransform: 'uppercase', opacity: submitting ? 0.6 : 1 }}
                >
                  {user
                    ? (isAr ? 'إرسال للموردين' : 'Send to Suppliers')
                    : (isAr ? 'تسجيل الدخول للإرسال' : 'Login to Submit')}
                </button>
                <button
                  onClick={reset}
                  style={{ flex: 1, background: 'none', border: '1px solid #E5E0D8', color: '#2C2C2C', padding: '11px', fontSize: 11, cursor: 'pointer', borderRadius: 2, letterSpacing: 1.5, textTransform: 'uppercase' }}
                >
                  {isAr ? 'جديد' : 'New'}
                </button>
              </div>
              {error && <p style={{ color: '#c00', fontSize: 12, marginTop: 10 }}>{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
