import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import IdeaToProduct from './IdeaToProduct';
import { hasIdeaFlowDraft, shouldResumeIdeaFlow } from '../lib/ideaToProductFlow';

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */
const API_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const callAI = async (system, messages) => {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
    body: JSON.stringify({ system, messages }),
  });
  const data = await res.json();
  return data.content?.[0]?.text || '';
};

const parseJSON = (text) => JSON.parse(text.replace(/```json|```/g, '').trim());

const fmt = (n) => n ? Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 0 }) : '0';

/* ─────────────────────────────────────────
   Tool definitions
───────────────────────────────────────── */
const TOOLS = {
  ar: [
    { id: 'assistant', icon: '◎', label: 'مساعد معبر', sub: 'يفهم فكرتك، يخدمك، ويرتب طلبك' },
    { id: 'calc', icon: '◈', label: 'الحاسبة', sub: 'تكلفة · شحن · ربح' },
  ],
  en: [
    { id: 'assistant', icon: '◎', label: 'Maabar Assistant', sub: 'Understands, guides, and structures your request' },
    { id: 'calc', icon: '◈', label: 'Calculator', sub: 'Cost · Shipping · Profit' },
  ],
  zh: [
    { id: 'assistant', icon: '◎', label: 'Maabar 助手', sub: '理解需求、协助沟通并整理请求' },
    { id: 'calc', icon: '◈', label: '计算器', sub: '成本 · 运输 · 利润' },
  ],
};

/* ─────────────────────────────────────────
   Shared sub-components
───────────────────────────────────────── */
const PanelHeader = ({ title, sub, onClose, lang }) => (
  <div style={{
    padding: '14px 16px 12px',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexShrink: 0,
  }}>
    <div>
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'var(--font-sans)' }}>{title}</p>
      {sub && <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 3, fontFamily: lang === 'ar' ? 'var(--font-ar)' : 'var(--font-sans)' }}>{sub}</p>}
    </div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-disabled)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '2px 4px', transition: 'color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
      ✕
    </button>
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', fontWeight: 500 }}>{label}</label>
    {children}
  </div>
);

const inp = {
  width: '100%', padding: '10px 12px',
  border: '1px solid var(--border-subtle)',
  background: 'var(--bg-muted)',
  fontSize: 16, color: 'var(--text-primary)',
  outline: 'none', borderRadius: 'var(--radius-md)',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
  fontFamily: 'var(--font-sans)',
};

const ToggleBtn = ({ active, onClick, children, isAr }) => (
  <button onClick={onClick} style={{
    padding: '9px 12px', fontSize: 12, cursor: 'pointer',
    borderRadius: 'var(--radius-md)', border: '1px solid',
    borderColor: active ? 'var(--border-strong)' : 'var(--border-subtle)',
    background: active ? 'var(--bg-raised)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-tertiary)',
    transition: 'all 0.15s', textAlign: isAr ? 'right' : 'left',
    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
  }}>
    {children}
  </button>
);

const SubmitBtn = ({ onClick, disabled, loading, label, loadingLabel, isAr }) => (
  <button onClick={onClick} disabled={disabled || loading} style={{
    background: disabled ? 'var(--bg-raised)' : 'rgba(255,255,255,0.88)',
    color: disabled ? 'var(--text-disabled)' : '#0a0a0b',
    border: '1px solid var(--border-default)',
    padding: '12px', fontSize: 13, fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 'var(--radius-md)', transition: 'all 0.2s',
    opacity: loading ? 0.6 : 1,
    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
  }}>
    {loading ? loadingLabel : label}
  </button>
);

const ResetBtn = ({ onClick, label, isAr }) => (
  <button onClick={onClick} style={{
    width: '100%', background: 'none',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-disabled)', padding: '10px', fontSize: 11,
    letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
    borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-sans)',
    transition: 'all 0.2s',
  }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-disabled)'; }}>
    {label}
  </button>
);

const ResultRow = ({ label, value, isAr }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)', fontSize: 12 }}>
    <span style={{ color: 'var(--text-tertiary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{label}</span>
    <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</span>
  </div>
);

const DarkCard = ({ children }) => (
  <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '16px 18px', marginBottom: 12 }}>
    {children}
  </div>
);

/* ─────────────────────────────────────────
   TOOL 1 — Request Assistant
───────────────────────────────────────── */
function AssistantTool({ lang, user, onClose }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [chatLang, setChatLang] = useState(lang);
  const bodyRef = useRef(null);

  const labels = {
    ar: { placeholder: 'اكتب هنا...', submit: 'رفع الطلب', edit: 'تعديل', welcome: 'أهلاً! وش المنتج اللي تبي تستورده؟', summary: 'ملخص طلبك', product: 'المنتج:', qty: 'الكمية:', budget: 'الميزانية:', success: 'تم رفع طلبك!', loginAlert: 'سجل دخولك لإتمام الطلب', error: 'حدث خطأ' },
    en: { placeholder: 'Type here...', submit: 'Submit Request', edit: 'Edit', welcome: 'Hi! What product would you like to import?', summary: 'Request Summary', product: 'Product:', qty: 'Quantity:', budget: 'Budget:', success: 'Request submitted!', loginAlert: 'Please login to submit', error: 'Error occurred' },
    zh: { placeholder: '在此输入...', submit: '提交请求', edit: '编辑', welcome: '您好！您想进口什么产品？', summary: '请求摘要', product: '产品:', qty: '数量:', budget: '预算:', success: '请求已提交！', loginAlert: '请登录后提交', error: '发生错误' },
  };
  const lb = labels[chatLang] || labels.ar;

  const system = `أنت مساعد ذكي لمنصة معبر B2B. مهمتك مساعدة التاجر على بناء طلب شراء احترافي.
اسأل عن: المنتج، الكمية، المواصفات، الميزانية.
بعد جمع المعلومات أنشئ: {"ready":true,"title_ar":"...","title_en":"...","quantity":"...","description":"...","budget":"..."}
تحدث بـ: ${chatLang === 'ar' ? 'العربية' : chatLang === 'en' ? 'الإنجليزية' : 'الصينية'}.`;

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next); setInput(''); setLoading(true);
    try {
      const text = await callAI(system, next);
      setMessages([...next, { role: 'assistant', content: text }]);
      if (text.includes('"ready":true')) {
        const m = text.match(/\{[\s\S]*"ready":true[\s\S]*\}/);
        if (m) setRequestData(JSON.parse(m[0]));
      }
    } catch { setMessages([...next, { role: 'assistant', content: lb.error }]); }
    setLoading(false);
  };

  const submitRequest = async () => {
    if (!requestData) return;
    if (!user) { alert(lb.loginAlert); nav('/login'); return; }
    const { error } = await sb.from('requests').insert({
      buyer_id: user.id, title_ar: requestData.title_ar,
      title_en: requestData.title_en, title_zh: requestData.title_en,
      quantity: requestData.quantity, description: requestData.description, status: 'open',
    });
    if (error) { alert(lb.error); return; }
    alert(lb.success);
    onClose(); setMessages([]); setRequestData(null);
  };

  return (
    <>
      <PanelHeader
        title={lang === 'ar' ? 'مساعد الطلبات' : lang === 'zh' ? '请求助手' : 'Request Assistant'}
        sub={lang === 'ar' ? 'سأساعدك ترفع طلبك' : 'I\'ll help you post your request'}
        onClose={onClose} lang={lang}
      />
      {/* Lang tabs */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: 4 }}>
        {['ar', 'en', 'zh'].map(l => (
          <button key={l} onClick={() => setChatLang(l)} style={{
            background: chatLang === l ? 'var(--bg-raised)' : 'transparent',
            color: chatLang === l ? 'var(--text-primary)' : 'var(--text-disabled)',
            border: '1px solid', borderColor: chatLang === l ? 'var(--border-muted)' : 'transparent',
            padding: '3px 10px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--radius-md)',
            letterSpacing: 0.5, transition: 'all 0.15s',
          }}>
            {l === 'ar' ? 'AR' : l === 'en' ? 'EN' : 'ZH'}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {messages.length === 0 && (
          <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: '3px 12px 12px 12px', padding: '10px 14px', fontSize: 13, lineHeight: 1.6, maxWidth: '85%', color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {lb.welcome}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            background: m.role === 'user' ? 'var(--bg-overlay)' : 'var(--bg-raised)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)',
            borderRadius: m.role === 'user' ? '12px 12px 3px 12px' : '3px 12px 12px 12px',
            padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
            maxWidth: '85%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          }}>
            {m.role === 'assistant' ? m.content.replace(/\{[\s\S]*\}/g, '').trim() : m.content}
          </div>
        ))}
        {loading && (
          <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: '3px 12px 12px 12px', padding: '10px 14px', fontSize: 13, maxWidth: '85%', color: 'var(--text-disabled)' }}>
            ···
          </div>
        )}
        {requestData && (
          <div style={{ border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: 14, background: 'var(--bg-overlay)', marginTop: 8 }}>
            <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>{lb.summary}</p>
            <p style={{ fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {lb.product} <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{requestData.title_ar || requestData.title_en}</span>
            </p>
            <p style={{ fontSize: 13, marginBottom: 4, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {lb.qty} <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{requestData.quantity}</span>
            </p>
            {requestData.budget && (
              <p style={{ fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {lb.budget} <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{requestData.budget}</span>
              </p>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={submitRequest} style={{ flex: 1, background: 'rgba(255,255,255,0.88)', color: '#0a0a0b', border: 'none', padding: '10px', fontSize: 12, fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius-md)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {lb.submit}
              </button>
              <button onClick={() => setRequestData(null)} style={{ background: 'none', border: '1px solid var(--border-subtle)', padding: '10px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)' }}>
                {lb.edit}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 8 }}>
        <input
          style={{ ...inp, flex: 1 }}
          placeholder={lb.placeholder}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          dir={chatLang === 'ar' ? 'rtl' : 'ltr'}
        />
        <button onClick={send} disabled={loading} style={{
          background: 'var(--bg-raised)', color: 'var(--text-secondary)',
          border: '1px solid var(--border-default)', width: 36, height: 36,
          borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: 14,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: loading ? 0.5 : 1, transition: 'all 0.15s',
        }}>→</button>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   TOOL 2 — Trader Calculator
───────────────────────────────────────── */
function CalcTool({ lang, onClose }) {
  const isAr = lang === 'ar';
  const [tab, setTab] = useState(0);

  const tabs = {
    ar: ['تكلفة الاستيراد', 'نصيحة الشحن', 'حاسبة الربح'],
    en: ['Import Cost', 'Shipping Advice', 'Profit Calculator'],
    zh: ['进口成本', '运输建议', '利润计算'],
  }[lang] || ['تكلفة الاستيراد', 'نصيحة الشحن', 'حاسبة الربح'];

  // Tab 1
  const [f1, setF1] = useState({ product: '', qty: '', unitPrice: '', weight: '', shipping: 'sea' });
  const [l1, setL1] = useState(false);
  const [r1, setR1] = useState(null);

  // Tab 2
  const [f2, setF2] = useState({ weight: '', qty: '', unitPrice: '', urgency: 0, productType: 0 });
  const [l2, setL2] = useState(false);
  const [r2, setR2] = useState(null);

  // Tab 3
  const [f3, setF3] = useState({ landedCost: '', channel: 0, hasStorage: true, returnRate: 0 });
  const [l3, setL3] = useState(false);
  const [r3, setR3] = useState(null);

  const urgencyOpts = { ar: ['غير مستعجل', 'متوسط', 'مستعجل جداً'], en: ['Not Urgent', 'Moderate', 'Very Urgent'], zh: ['不紧急', '一般', '非常紧急'] }[lang];
  const typeOpts    = { ar: ['إلكترونيات', 'أثاث', 'ملابس', 'مواد بناء', 'غذاء', 'أخرى'], en: ['Electronics', 'Furniture', 'Clothing', 'Building Materials', 'Food', 'Other'], zh: ['电子产品', '家具', '服装', '建材', '食品', '其他'] }[lang];
  const channelOpts = { ar: ['نون', 'متجرك الإلكتروني', 'سوشيال ميديا', 'محل فيزيكل', 'جملة'], en: ['Noon', 'Your Online Store', 'Social Media', 'Physical Store', 'Wholesale'], zh: ['Noon', '自营网店', '社交媒体', '实体店', '批发'] }[lang];
  const retOpts     = { ar: ['منخفضة (2-5%)', 'متوسطة (5-10%)', 'عالية (+10%)'], en: ['Low (2-5%)', 'Medium (5-10%)', 'High (+10%)'], zh: ['低 (2-5%)', '中 (5-10%)', '高 (+10%)'] }[lang];
  const sar = lang === 'ar' ? 'ريال' : 'SAR';
  const newCalc = lang === 'ar' ? 'حساب جديد' : lang === 'zh' ? '重新计算' : 'New Calculation';

  const calcCost = async () => {
    if (!f1.product || !f1.qty || !f1.unitPrice || !f1.weight) return;
    setL1(true);
    try {
      const text = await callAI(
        `خبير جمارك سعودي. احسب تكلفة الاستيراد وأرجع JSON فقط:
{"product_cost":0,"shipping_cost":0,"customs_duty":0,"customs_duty_pct":0,"vat":0,"clearance":0,"total":0,"unit_landed":0,"notes":""}
بحري: 15-25 ريال/كجم، جوي: 40-60. VAT 15%. تخليص: 500 تحت طن، 1000 فوقه.`,
        [{ role: 'user', content: `المنتج: ${f1.product}\nالكمية: ${f1.qty}\nسعر الوحدة: ${f1.unitPrice}\nالوزن: ${f1.weight} كجم\nالشحن: ${f1.shipping === 'sea' ? 'بحري' : 'جوي'}` }]
      );
      const res = parseJSON(text);
      setR1(res);
      if (res.unit_landed) setF3(p => ({ ...p, landedCost: String(Math.round(res.unit_landed)) }));
    } catch { alert(isAr ? 'حدث خطأ' : 'Error'); }
    setL1(false);
  };

  const getShipping = async () => {
    if (!f2.weight || !f2.qty || !f2.unitPrice) return;
    setL2(true);
    try {
      const text = await callAI(
        `خبير لوجستيات شحن من الصين للسعودية. أرجع JSON فقط:
{"recommendation":"sea|air","reason":"سببان بالعربي","sea_cost":0,"sea_days":0,"air_cost":0,"air_days":0,"warning":"","savings":0}`,
        [{ role: 'user', content: `وزن: ${f2.weight} كجم\nكمية: ${f2.qty}\nسعر الوحدة: ${f2.unitPrice}\nاستعجال: ${urgencyOpts[f2.urgency]}\nنوع: ${typeOpts[f2.productType]}` }]
      );
      setR2(parseJSON(text));
    } catch { alert(isAr ? 'حدث خطأ' : 'Error'); }
    setL2(false);
  };

  const calcProfit = async () => {
    if (!f3.landedCost) return;
    setL3(true);
    try {
      const text = await callAI(
        `خبير تجارة إلكترونية سعودي. احسب هامش الربح وأرجع JSON فقط:
{"suggested_price":0,"profit_per_unit":0,"profit_margin_pct":0,"platform_fee_pct":0,"storage_cost":0,"marketing_pct":0,"return_cost":0,"net_profit_per_unit":0,"monthly_profit_estimate":0,"advice":""}`,
        [{ role: 'user', content: `تكلفة الوحدة: ${f3.landedCost} ريال\nقناة: ${channelOpts[f3.channel]}\nمخزن: ${f3.hasStorage ? 'نعم' : 'لا'}\nمرتجعات: ${retOpts[f3.returnRate]}` }]
      );
      setR3(parseJSON(text));
    } catch { alert(isAr ? 'حدث خطأ' : 'Error'); }
    setL3(false);
  };

  return (
    <>
      <PanelHeader
        title={lang === 'ar' ? 'حاسبة التاجر' : lang === 'zh' ? '贸易计算器' : 'Trader Calculator'}
        onClose={onClose} lang={lang}
      />
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', flexShrink: 0 }}>
        {tabs.map((t, i) => (
          <button key={i} onClick={() => setTab(i)} style={{
            flex: 1, padding: '10px 6px', fontSize: 10, cursor: 'pointer',
            background: 'transparent', border: 'none',
            borderBottom: tab === i ? '1px solid var(--text-primary)' : '1px solid transparent',
            color: tab === i ? 'var(--text-primary)' : 'var(--text-disabled)',
            transition: 'all 0.15s', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            letterSpacing: 0.3, whiteSpace: 'nowrap',
          }}>
            {`0${i + 1}`} {t}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* TAB 1 */}
        {tab === 0 && !r1 && (
          <>
            <Field label={lang === 'ar' ? 'المنتج' : lang === 'zh' ? '产品' : 'Product'}>
              <input style={inp} value={f1.product} onChange={e => setF1({ ...f1, product: e.target.value })} placeholder={isAr ? 'مثال: كراسي مكتب' : 'e.g. Office Chairs'} dir={isAr ? 'rtl' : 'ltr'} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <Field label={isAr ? 'الكمية' : lang === 'zh' ? '数量' : 'Quantity'}>
                <input style={inp} type="number" value={f1.qty} onChange={e => setF1({ ...f1, qty: e.target.value })} placeholder="500" />
              </Field>
              <Field label={isAr ? 'سعر الوحدة' : lang === 'zh' ? '单价' : 'Unit Price'}>
                <input style={inp} type="number" value={f1.unitPrice} onChange={e => setF1({ ...f1, unitPrice: e.target.value })} placeholder="50" />
              </Field>
            </div>
            <Field label={isAr ? 'الوزن (كجم)' : lang === 'zh' ? '重量(kg)' : 'Weight (kg)'}>
              <input style={inp} type="number" value={f1.weight} onChange={e => setF1({ ...f1, weight: e.target.value })} placeholder="200" />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <ToggleBtn active={f1.shipping === 'sea'} onClick={() => setF1({ ...f1, shipping: 'sea' })} isAr={isAr}>{isAr ? 'بحري' : lang === 'zh' ? '海运' : 'Sea'}</ToggleBtn>
              <ToggleBtn active={f1.shipping === 'air'} onClick={() => setF1({ ...f1, shipping: 'air' })} isAr={isAr}>{isAr ? 'جوي' : lang === 'zh' ? '空运' : 'Air'}</ToggleBtn>
            </div>
            <SubmitBtn onClick={calcCost} disabled={!f1.product || !f1.qty || !f1.unitPrice || !f1.weight} loading={l1} label={isAr ? 'احسب التكلفة' : lang === 'zh' ? '计算成本' : 'Calculate Cost'} loadingLabel={isAr ? 'جاري الحساب...' : 'Calculating...'} isAr={isAr} />
          </>
        )}
        {tab === 0 && r1 && (
          <>
            {[
              [isAr ? 'تكلفة المنتج' : 'Product Cost', r1.product_cost],
              [isAr ? 'تكلفة الشحن' : 'Shipping', r1.shipping_cost],
              [`${isAr ? 'الجمارك' : 'Customs'} (${r1.customs_duty_pct}%)`, r1.customs_duty],
              ['VAT 15%', r1.vat],
              [isAr ? 'تخليص جمركي' : 'Clearance', r1.clearance],
            ].map(([label, val], i) => <ResultRow key={i} label={label} value={`${fmt(val)} ${sar}`} isAr={isAr} />)}
            <DarkCard>
              <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', marginBottom: 6 }}>{isAr ? 'تكلفة الوحدة الحقيقية' : 'True Unit Cost'}</p>
              <p style={{ fontSize: 28, fontWeight: 300, color: 'var(--text-primary)' }}>{fmt(r1.unit_landed)} <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{sar}</span></p>
            </DarkCard>
            {r1.notes && <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontStyle: 'italic' }}>{r1.notes}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <ResetBtn onClick={() => { setR1(null); setF1({ product: '', qty: '', unitPrice: '', weight: '', shipping: 'sea' }); }} label={isAr ? 'حساب جديد' : 'New'} />
              <button onClick={() => setTab(2)} style={{ flex: 1, background: 'rgba(255,255,255,0.88)', color: '#0a0a0b', border: 'none', padding: '10px', fontSize: 11, fontWeight: 500, cursor: 'pointer', borderRadius: 'var(--radius-md)', letterSpacing: 1 }}>
                {isAr ? 'احسب الربح ←' : 'Calc Profit →'}
              </button>
            </div>
          </>
        )}

        {/* TAB 2 */}
        {tab === 1 && !r2 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <Field label={isAr ? 'الوزن (كجم)' : 'Weight (kg)'}>
                <input style={inp} type="number" value={f2.weight} onChange={e => setF2({ ...f2, weight: e.target.value })} placeholder="200" />
              </Field>
              <Field label={isAr ? 'الكمية' : 'Qty'}>
                <input style={inp} type="number" value={f2.qty} onChange={e => setF2({ ...f2, qty: e.target.value })} placeholder="500" />
              </Field>
            </div>
            <Field label={isAr ? 'سعر الوحدة' : 'Unit Price'}>
              <input style={inp} type="number" value={f2.unitPrice} onChange={e => setF2({ ...f2, unitPrice: e.target.value })} placeholder="50" />
            </Field>
            <Field label={isAr ? 'مدى الاستعجال' : 'Urgency'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {urgencyOpts.map((o, i) => <ToggleBtn key={i} active={f2.urgency === i} onClick={() => setF2({ ...f2, urgency: i })} isAr={isAr}>{o}</ToggleBtn>)}
              </div>
            </Field>
            <Field label={isAr ? 'نوع المنتج' : 'Product Type'}>
              <select style={inp} value={f2.productType} onChange={e => setF2({ ...f2, productType: +e.target.value })}>
                {typeOpts.map((o, i) => <option key={i} value={i}>{o}</option>)}
              </select>
            </Field>
            <SubmitBtn onClick={getShipping} disabled={!f2.weight || !f2.qty || !f2.unitPrice} loading={l2} label={isAr ? 'احصل على النصيحة' : 'Get Advice'} loadingLabel={isAr ? 'جاري التحليل...' : 'Analyzing...'} isAr={isAr} />
          </>
        )}
        {tab === 1 && r2 && (
          <>
            <DarkCard>
              <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 6 }}>{isAr ? 'التوصية' : 'Recommendation'}</p>
              <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8 }}>
                {r2.recommendation === 'sea' ? (isAr ? 'شحن بحري' : 'Sea Freight') : (isAr ? 'شحن جوي' : 'Air Freight')}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{r2.reason}</p>
            </DarkCard>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: 4 }}>
              {[
                { label: isAr ? 'بحري' : 'Sea', cost: r2.sea_cost, days: r2.sea_days, active: r2.recommendation === 'sea' },
                { label: isAr ? 'جوي' : 'Air', cost: r2.air_cost, days: r2.air_days, active: r2.recommendation === 'air' },
              ].map((o, i) => (
                <div key={i} style={{ background: o.active ? 'var(--bg-raised)' : 'var(--bg-subtle)', padding: '14px 12px', textAlign: 'center' }}>
                  <p style={{ fontSize: 11, color: o.active ? 'var(--text-primary)' : 'var(--text-tertiary)', marginBottom: 6 }}>{o.label}</p>
                  <p style={{ fontSize: 20, fontWeight: 300, color: 'var(--text-primary)' }}>{fmt(o.cost)} <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{sar}</span></p>
                  <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 4 }}>{o.days} {isAr ? 'يوم' : 'days'}</p>
                </div>
              ))}
            </div>
            {r2.savings > 0 && <p style={{ fontSize: 12, color: '#5a9a72', padding: '8px 12px', background: 'rgba(58,122,82,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(58,122,82,0.15)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? `توفير: ${fmt(r2.savings)} ريال` : `Savings: ${fmt(r2.savings)} SAR`}
            </p>}
            {r2.warning && <p style={{ fontSize: 12, color: '#a07070', padding: '8px 12px', background: 'rgba(138,58,58,0.08)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(138,58,58,0.15)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {r2.warning}
            </p>}
            <ResetBtn onClick={() => setR2(null)} label={newCalc} />
          </>
        )}

        {/* TAB 3 */}
        {tab === 2 && !r3 && (
          <>
            <Field label={isAr ? 'تكلفة الوحدة بعد الاستيراد' : 'Landed Cost/Unit'}>
              <input style={inp} type="number" value={f3.landedCost} onChange={e => setF3({ ...f3, landedCost: e.target.value })} placeholder={isAr ? 'من الحاسبة الأولى' : 'From cost calculator'} />
              {r1?.unit_landed && (
                <p style={{ fontSize: 10, color: '#5a9a72', marginTop: 4, cursor: 'pointer' }} onClick={() => setF3(p => ({ ...p, landedCost: String(Math.round(r1.unit_landed)) }))}>
                  ↑ {isAr ? `استخدم: ${fmt(r1.unit_landed)} ريال` : `Use: ${fmt(r1.unit_landed)} SAR`}
                </p>
              )}
            </Field>
            <Field label={isAr ? 'قناة البيع' : 'Sales Channel'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {channelOpts.map((o, i) => <ToggleBtn key={i} active={f3.channel === i} onClick={() => setF3({ ...f3, channel: i })} isAr={isAr}>{o}</ToggleBtn>)}
              </div>
            </Field>
            <Field label={isAr ? 'عندك مخزن؟' : 'Storage?'}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ToggleBtn active={f3.hasStorage} onClick={() => setF3({ ...f3, hasStorage: true })} isAr={isAr}>{isAr ? 'نعم' : 'Yes'}</ToggleBtn>
                <ToggleBtn active={!f3.hasStorage} onClick={() => setF3({ ...f3, hasStorage: false })} isAr={isAr}>{isAr ? 'لا' : 'No'}</ToggleBtn>
              </div>
            </Field>
            <Field label={isAr ? 'نسبة المرتجعات' : 'Return Rate'}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {retOpts.map((o, i) => <ToggleBtn key={i} active={f3.returnRate === i} onClick={() => setF3({ ...f3, returnRate: i })} isAr={isAr}>{o}</ToggleBtn>)}
              </div>
            </Field>
            <SubmitBtn onClick={calcProfit} disabled={!f3.landedCost} loading={l3} label={isAr ? 'احسب الربح' : 'Calculate Profit'} loadingLabel={isAr ? 'جاري الحساب...' : 'Calculating...'} isAr={isAr} />
          </>
        )}
        {tab === 2 && r3 && (
          <>
            <DarkCard>
              <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', marginBottom: 6 }}>{isAr ? 'سعر البيع الموصى به' : 'Suggested Price'}</p>
              <p style={{ fontSize: 30, fontWeight: 300, color: 'var(--text-primary)' }}>{fmt(r3.suggested_price)} <span style={{ fontSize: 13, color: 'var(--text-disabled)' }}>{sar}</span></p>
            </DarkCard>
            {[
              [isAr ? 'رسوم المنصة' : 'Platform Fee', `${r3.platform_fee_pct}%`],
              [isAr ? 'تكلفة التسويق' : 'Marketing', `${r3.marketing_pct}%`],
              [isAr ? 'تكلفة المرتجعات' : 'Returns', `${fmt(r3.return_cost)} ${sar}`],
              [isAr ? 'صافي ربح الوحدة' : 'Net Profit/Unit', `${fmt(r3.net_profit_per_unit)} ${sar}`],
            ].map(([l, v], i) => <ResultRow key={i} label={l} value={v} isAr={isAr} />)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', margin: '8px 0' }}>
              {[
                [isAr ? 'هامش الربح' : 'Margin', `${r3.profit_margin_pct}%`, r3.profit_margin_pct > 20 ? '#5a9a72' : r3.profit_margin_pct > 10 ? 'var(--text-primary)' : '#a07070'],
                [isAr ? 'ربح شهري تقريبي' : 'Monthly Est.', `${fmt(r3.monthly_profit_estimate)} ${sar}`, 'var(--text-primary)'],
              ].map(([l, v, c], i) => (
                <div key={i} style={{ background: 'var(--bg-subtle)', padding: '14px', textAlign: 'center' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 6 }}>{l}</p>
                  <p style={{ fontSize: i === 0 ? 22 : 16, fontWeight: 300, color: c }}>{v}</p>
                </div>
              ))}
            </div>
            {r3.advice && <p style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '10px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {r3.advice}
            </p>}
            <ResetBtn onClick={() => setR3(null)} label={newCalc} />
          </>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   TOOL 3 — AI Negotiator
───────────────────────────────────────── */
function NegotiatorTool({ lang, onClose }) {
  const isAr = lang === 'ar';
  const [situation, setSituation] = useState('');
  const [targetLang, setTargetLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const lb = {
    ar: { situation: 'وصف الموقف', placeholder: 'مثال: المورد عرض 50 ريال للوحدة وأبي أوصله لـ 42 ريال...', targetLang: 'لغة الرد للمورد', en: 'إنجليزي', zh: 'صيني', generate: 'اكتب الرد', generating: 'جاري الكتابة...', reply: 'الرد للمورد', strategy: 'شرح الاستراتيجية', tips: 'نصائح', copy: 'نسخ', copied: '✓', new: 'موقف جديد' },
    en: { situation: 'Describe the situation', placeholder: 'e.g. Supplier offered $14/unit, I want $11...', targetLang: 'Reply language', en: 'English', zh: 'Chinese', generate: 'Write Reply', generating: 'Writing...', reply: 'Reply to Supplier', strategy: 'Strategy', tips: 'Tips', copy: 'Copy', copied: '✓', new: 'New Situation' },
    zh: { situation: '描述情况', placeholder: '例如：供应商报价50里亚尔/件，我希望谈到42里亚尔...', targetLang: '回复语言', en: '英语', zh: '中文', generate: '生成回复', generating: '生成中...', reply: '给供应商的回复', strategy: '策略说明', tips: '谈判技巧', copy: '复制', copied: '✓', new: '新情况' },
  }[lang] || {};

  const generate = async () => {
    if (!situation.trim()) return;
    setLoading(true); setResult(null);
    try {
      const text = await callAI(
        `خبير تفاوض استيراد من الصين للسعودية. أرجع JSON فقط:
{"reply":"الرد باللغة ${targetLang === 'en' ? 'الإنجليزية' : 'الصينية'}","strategy":"شرح بالعربي جملتان","tips":["نصيحة 1","نصيحة 2","نصيحة 3"]}
قواعد: خصم 5-15%، حجة الكمية والعلاقة، لا تعطِ سعرك النهائي أول مرة.`,
        [{ role: 'user', content: situation }]
      );
      setResult(parseJSON(text));
    } catch { alert(isAr ? 'حدث خطأ' : 'Error'); }
    setLoading(false);
  };

  const copy = () => {
    if (!result?.reply) return;
    navigator.clipboard.writeText(result.reply);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <PanelHeader
        title={lang === 'ar' ? 'مفاوض AI' : lang === 'zh' ? 'AI谈判助手' : 'AI Negotiator'}
        sub={lang === 'ar' ? 'اكتب بالعربي — يرد للمورد بالإنجليزي أو الصيني' : 'Write in Arabic — replies in English or Chinese'}
        onClose={onClose} lang={lang}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {!result ? (
          <>
            <Field label={lb.situation}>
              <textarea style={{ ...inp, resize: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.6 }}
                rows={4} value={situation} onChange={e => setSituation(e.target.value)}
                placeholder={lb.placeholder} dir={isAr ? 'rtl' : 'ltr'} />
            </Field>
            <Field label={lb.targetLang}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <ToggleBtn active={targetLang === 'en'} onClick={() => setTargetLang('en')} isAr={isAr}>{lb.en}</ToggleBtn>
                <ToggleBtn active={targetLang === 'zh'} onClick={() => setTargetLang('zh')} isAr={isAr}>{lb.zh}</ToggleBtn>
              </div>
            </Field>
            <SubmitBtn onClick={generate} disabled={!situation.trim()} loading={loading} label={lb.generate} loadingLabel={lb.generating} isAr={isAr} />
          </>
        ) : (
          <>
            <div>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8 }}>{lb.reply}</p>
              <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-muted)', borderRadius: 'var(--radius-lg)', padding: '14px 16px', position: 'relative' }}>
                <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', direction: 'ltr', whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)' }}>
                  {result.reply}
                </p>
                <button onClick={copy} style={{
                  position: 'absolute', top: 10, right: 10,
                  background: copied ? 'rgba(58,122,82,0.15)' : 'var(--bg-overlay)',
                  color: copied ? '#5a9a72' : 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)', padding: '4px 10px',
                  fontSize: 10, letterSpacing: 1, cursor: 'pointer',
                  borderRadius: 'var(--radius-md)', transition: 'all 0.2s',
                }}>
                  {copied ? lb.copied : lb.copy}
                </button>
              </div>
            </div>
            {result.strategy && (
              <div>
                <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8 }}>{lb.strategy}</p>
                <p style={{ fontSize: 13, color: 'var(--text-tertiary)', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{result.strategy}</p>
              </div>
            )}
            {result.tips?.length > 0 && (
              <div>
                <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>{lb.tips}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {result.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ fontSize: 10, color: 'var(--text-disabled)', minWidth: 16, marginTop: 3 }}>0{i + 1}</span>
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <ResetBtn onClick={() => { setResult(null); setSituation(''); }} label={lb.new} />
          </>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   TOOL 4 — Market Intelligence
───────────────────────────────────────── */
function MarketTool({ lang, onClose }) {
  const nav = useNavigate();
  const isAr = lang === 'ar';
  const [product, setProduct] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [maabarSuppliers, setMaabarSuppliers] = useState([]);
  const [detectedCategory, setDetectedCategory] = useState('');

  const analyze = async () => {
    if (!product.trim()) return;
    setLoading(true); setResult(null); setMaabarSuppliers([]);
    try {
      const text = await callAI(
        `أنت محلل سوق متخصص في السوق السعودي والتجارة مع الصين.
حلل المنتج وأرجع JSON فقط:
{
  "demand": "high|medium|low",
  "demand_reason": "سبب الطلب بجملتين بالعربي",
  "competition": "high|medium|low",
  "competition_reason": "وصف المنافسة بجملتين",
  "compliance": [{"body":"اسم الجهة","requirement":"المتطلب","required":true|false}],
  "best_channels": [{"name":"القناة","commission_pct":0,"notes":"ملاحظة"}],
  "profit_range": {"min_pct":0,"max_pct":0,"avg_pct":0},
  "supplier_cities": [{"city":"المدينة الصينية","reason":"سبب التخصص","search_term":"كلمة البحث بالإنجليزي"}],
  "verdict": "buy|caution|avoid",
  "verdict_reason": "التوصية النهائية بجملتين",
  "opportunity_score": 0
}
compliance: اذكر فقط اللوائح السعودية الحقيقية (SASO, SFDA, وزارة التجارة).
supplier_cities: أشهر 2-3 مدن صينية لهذا المنتج.
opportunity_score: من 0 إلى 100.`,
        [{ role: 'user', content: `المنتج: ${product}` }]
      );
      const parsed = parseJSON(text);
      setResult(parsed);
      // Detect category and fetch Maabar suppliers
      const categoryMap = {
        electronics: ['electronics', 'electronic', 'phone', 'laptop', 'headphone', 'speaker', 'إلكترون', 'جهاز', 'سماعة', 'هاتف'],
        furniture: ['furniture', 'chair', 'desk', 'table', 'أثاث', 'كرسي', 'طاولة'],
        clothing: ['clothing', 'fashion', 'shirt', 'pants', 'ملابس', 'قميص'],
        building: ['building', 'construction', 'tile', 'pipe', 'بناء', 'سيراميك'],
        food: ['food', 'snack', 'spice', 'غذاء', 'طعام'],
      };
      let cat = 'other';
      const lower = product.toLowerCase();
      for (const [key, keywords] of Object.entries(categoryMap)) {
        if (keywords.some(k => lower.includes(k))) { cat = key; break; }
      }
      setDetectedCategory(cat);
      const { data: sups } = await sb
        .from('supplier_public_profiles')
        .select('id, company_name, city, rating, speciality, avatar_url')
        .eq('speciality', cat)
        .limit(3);
      if (sups) setMaabarSuppliers(sups);
    } catch { alert(isAr ? 'حدث خطأ' : 'Error'); }
    setLoading(false);
  };

  const demandColor = (d) => d === 'high' ? '#5a9a72' : d === 'medium' ? '#a08850' : '#a07070';
  const demandLabel = (d) => {
    const m = { ar: { high: 'طلب عالي', medium: 'طلب متوسط', low: 'طلب منخفض' }, en: { high: 'High Demand', medium: 'Medium Demand', low: 'Low Demand' }, zh: { high: '需求高', medium: '需求中', low: '需求低' } };
    return (m[lang] || m.ar)[d] || d;
  };
  const verdictLabel = (v) => {
    const m = { ar: { buy: 'فرصة جيدة', caution: 'تحتاج دراسة', avoid: 'تجنب الآن' }, en: { buy: 'Good Opportunity', caution: 'Needs Study', avoid: 'Avoid Now' }, zh: { buy: '好机会', caution: '需要研究', avoid: '暂时回避' } };
    return (m[lang] || m.ar)[v] || v;
  };
  const verdictColor = (v) => v === 'buy' ? '#5a9a72' : v === 'caution' ? '#a08850' : '#a07070';

  return (
    <>
      <PanelHeader
        title={lang === 'ar' ? 'تحليل السوق' : lang === 'zh' ? '市场分析' : 'Market Analysis'}
        sub={lang === 'ar' ? 'السوق السعودي + أفضل مورد صيني' : 'Saudi market + best Chinese supplier'}
        onClose={onClose} lang={lang}
      />
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {!result ? (
          <>
            <Field label={lang === 'ar' ? 'المنتج الذي تريد تحليله' : lang === 'zh' ? '要分析的产品' : 'Product to analyze'}>
              <input style={inp} value={product}
                onChange={e => setProduct(e.target.value)}
                placeholder={isAr ? 'مثال: سماعات بلوتوث، كراسي مكتب، ملابس رياضية...' : 'e.g. Bluetooth headphones, office chairs...'}
                dir={isAr ? 'rtl' : 'ltr'}
                onKeyDown={e => e.key === 'Enter' && analyze()}
              />
            </Field>
            <SubmitBtn onClick={analyze} disabled={!product.trim()} loading={loading}
              label={isAr ? 'حلل السوق' : lang === 'zh' ? '分析市场' : 'Analyze Market'}
              loadingLabel={isAr ? 'جاري التحليل...' : 'Analyzing...'}
              isAr={isAr}
            />
            {/* Quick examples */}
            <div>
              <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8 }}>{isAr ? 'أمثلة سريعة' : 'Quick examples'}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {(isAr
                  ? ['سماعات بلوتوث', 'كراسي مكتب', 'ملابس رياضية', 'أدوات مطبخ', 'لعب أطفال']
                  : ['Bluetooth speakers', 'Office chairs', 'Sports clothing', 'Kitchen tools']
                ).map(ex => (
                  <button key={ex} onClick={() => setProduct(ex)} style={{
                    background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
                    color: 'var(--text-tertiary)', padding: '5px 10px', fontSize: 11,
                    cursor: 'pointer', borderRadius: 20, transition: 'all 0.15s',
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-muted)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-tertiary)'; }}>
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Verdict */}
            <div style={{ background: 'var(--bg-raised)', border: `1px solid ${verdictColor(result.verdict)}30`, borderRadius: 'var(--radius-lg)', padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <p style={{ fontSize: 15, fontWeight: 500, color: verdictColor(result.verdict), fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {verdictLabel(result.verdict)}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 64, height: 4, background: 'var(--border-subtle)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${result.opportunity_score}%`, height: '100%', background: verdictColor(result.verdict), borderRadius: 2, transition: 'width 0.5s ease' }} />
                  </div>
                  <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{result.opportunity_score}</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{result.verdict_reason}</p>
            </div>

            {/* Demand + Competition */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: 'var(--border-subtle)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
              {[
                { label: isAr ? 'الطلب' : 'Demand', val: result.demand, reason: result.demand_reason },
                { label: isAr ? 'المنافسة' : 'Competition', val: result.competition, reason: result.competition_reason },
              ].map((item, i) => (
                <div key={i} style={{ background: 'var(--bg-subtle)', padding: '14px 12px' }}>
                  <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginBottom: 4, letterSpacing: 1 }}>{item.label}</p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: demandColor(item.val), marginBottom: 6 }}>{demandLabel(item.val)}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-disabled)', lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{item.reason}</p>
                </div>
              ))}
            </div>

            {/* Profit Range */}
            {result.profit_range && (
              <DarkCard>
                <p style={{ fontSize: 10, letterSpacing: 2, color: 'var(--text-disabled)', marginBottom: 8 }}>{isAr ? 'هامش الربح المتوقع' : 'Expected Profit Margin'}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 24, fontWeight: 300, color: 'var(--text-primary)' }}>{result.profit_range.avg_pct}%</span>
                  <span style={{ fontSize: 12, color: 'var(--text-disabled)' }}>{isAr ? 'متوسط' : 'avg'}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-disabled)', marginInlineStart: 4 }}>({result.profit_range.min_pct}% – {result.profit_range.max_pct}%)</span>
                </div>
              </DarkCard>
            )}

            {/* Compliance */}
            {result.compliance?.length > 0 && (
              <div>
                <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8 }}>{isAr ? 'اللوائح والاشتراطات' : 'Compliance Requirements'}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {result.compliance.map((c, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{c.body}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.5 }}>{c.requirement}</p>
                      </div>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: c.required ? 'rgba(138,58,58,0.12)' : 'rgba(58,122,82,0.12)', color: c.required ? '#a07070' : '#5a9a72', border: `1px solid ${c.required ? 'rgba(138,58,58,0.2)' : 'rgba(58,122,82,0.2)'}`, whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {c.required ? (isAr ? 'إلزامي' : 'Required') : (isAr ? 'اختياري' : 'Optional')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Best Channels */}
            {result.best_channels?.length > 0 && (
              <div>
                <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8 }}>{isAr ? 'أفضل قنوات البيع' : 'Best Sales Channels'}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {result.best_channels.map((ch, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{ch.name}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{ch.notes}</p>
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0 }}>{ch.commission_pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supplier Cities */}
            {result.supplier_cities?.length > 0 && (
              <div>
                <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8 }}>{isAr ? 'أفضل مدن الموردين في الصين' : 'Best Chinese Supplier Cities'}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {result.supplier_cities.map((city, i) => (
                    <div key={i} style={{ padding: '10px 14px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 4 }}>{city.city}</p>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.5 }}>{city.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Maabar Suppliers */}
            <div>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8 }}>
                {isAr ? 'موردون معتمدون في معبر' : 'Verified Suppliers on Maabar'}
              </p>
              {maabarSuppliers.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {maabarSuppliers.map((s, i) => (
                    <div key={i} onClick={() => nav(`/supplier/${s.id}`)} style={{
                      padding: '10px 14px', background: 'var(--bg-raised)',
                      border: '1px solid rgba(139,120,255,0.15)',
                      borderRadius: 'var(--radius-md)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                      transition: 'all 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(139,120,255,0.3)'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(139,120,255,0.15)'; e.currentTarget.style.background = 'var(--bg-raised)'; }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {s.avatar_url
                          ? <img src={s.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{(s.company_name || '?')[0]}</span>}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>{s.company_name}</p>
                        <p style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{s.city || ''}</p>
                      </div>
                      <span style={{ fontSize: 10, color: 'rgba(139,120,255,0.85)', letterSpacing: 0.5 }}>
                        {isAr ? 'عرض ←' : 'View →'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: '12px 14px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'لا يوجد موردون متخصصون في معبر بعد لهذا المنتج' : 'No specialized suppliers on Maabar yet for this product'}
                  </p>
                </div>
              )}
            </div>

            <ResetBtn onClick={() => { setResult(null); setProduct(''); }} label={isAr ? 'تحليل منتج جديد' : lang === 'zh' ? '分析新产品' : 'Analyze New Product'} />
          </>
        )}
      </div>
    </>
  );
}

/* ─────────────────────────────────────────
   MAIN — AIHub
───────────────────────────────────────── */
export default function AIHub({ lang, user, profile }) {
  const nav = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
  const menuRef = useRef(null);
  const isAr = lang === 'ar';
  const tools = TOOLS[lang] || TOOLS.ar;

  // close menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!shouldResumeIdeaFlow(location.search) || !hasIdeaFlowDraft()) return;
    setActiveTool('assistant');
    const params = new URLSearchParams(location.search);
    params.delete('openAiReview');
    nav({
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : '',
    }, { replace: true });
  }, [location.pathname, location.search, nav]);

  const openTool = (id) => { setActiveTool(id); setMenuOpen(false); };
  const closeTool = () => setActiveTool(null);

  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 768;
  const safeBottom = parseInt(
    typeof window !== 'undefined'
      ? getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom') || '0px'
      : '0px',
    10
  ) || 0;
  const fabBottom = 24 + safeBottom;
  const panelBottom = fabBottom + 56;

  const panelStyle = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1500,
        width: '100%',
        maxHeight: 'calc(var(--app-dvh, 100dvh) - var(--page-top-offset, 56px))',
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-muted)',
        borderTop: '1px solid var(--border-muted)',
        borderRadius: '24px 24px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.25s ease',
        direction: isAr ? 'rtl' : 'ltr',
        paddingBottom: `max(0px, var(--safe-bottom, 0px))`,
      }
    : {
        position: 'fixed',
        bottom: panelBottom,
        right: 24,
        zIndex: 1500,
        width: 380,
        maxHeight: '82vh',
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-muted)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideUp 0.25s ease',
        direction: isAr ? 'rtl' : 'ltr',
      };

  return (
    <>
      {/* ── FAB Button ───────────────────────── */}
      <div ref={menuRef} style={{ position: 'fixed', bottom: `max(24px, calc(24px + var(--safe-bottom, 0px)))`, right: 24, zIndex: 1600 }}>

        {/* Menu */}
        {menuOpen && (
          <div style={{
            position: 'absolute', bottom: 52, right: 0,
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            overflow: 'hidden', minWidth: 220,
            animation: 'slideUp 0.2s ease',
          }}>
            <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)' }}>
                {isAr ? 'أدوات الذكاء الاصطناعي' : 'AI Tools'}
              </p>
            </div>
            {tools.map((tool) => (
              <button key={tool.id} onClick={() => openTool(tool.id)} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                width: '100%', padding: '11px 14px',
                background: 'transparent', border: 'none',
                cursor: 'pointer', transition: 'background 0.15s',
                borderBottom: '1px solid var(--border-subtle)',
                textAlign: isAr ? 'right' : 'left',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 14, color: 'var(--text-disabled)', flexShrink: 0 }}>{tool.icon}</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', marginBottom: 1 }}>{tool.label}</p>
                  <p style={{ fontSize: 11, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{tool.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main button */}
        <button onClick={() => { setMenuOpen(!menuOpen); if (activeTool) setActiveTool(null); }} style={{
          width: 44, height: 44,
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-default)',
          borderRadius: '50%',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          transition: 'all 0.2s',
          position: 'relative',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.borderColor = 'var(--border-default)'; }}>

          {/* AI label */}
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>AI</span>

          {/* Green online dot */}
          <span style={{
            position: 'absolute', top: 2, right: 2,
            width: 10, height: 10,
            background: '#3a7a52',
            border: '2px solid var(--bg-base)',
            borderRadius: '50%',
            boxShadow: '0 0 6px rgba(58,122,82,0.6)',
            animation: 'pulse 2.5s ease-in-out infinite',
          }} />
        </button>
      </div>

      {/* ── Tool Panels ──────────────────────── */}
      {activeTool === 'assistant' && (
        <IdeaToProduct lang={lang} user={user} onClose={closeTool} />
      )}
      {activeTool === 'calc' && (
        <div style={panelStyle}>
          <CalcTool lang={lang} onClose={closeTool} />
        </div>
      )}
      {activeTool === 'negotiator' && (
        <div style={panelStyle}>
          <NegotiatorTool lang={lang} onClose={closeTool} />
        </div>
      )}
      {activeTool === 'market' && (
        <div style={panelStyle}>
          <MarketTool lang={lang} onClose={closeTool} />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </>
  );
}