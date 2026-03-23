import React, { useState } from 'react';

const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const T = {
  ar: {
    btn: 'حاسبة التاجر',
    tabs: ['تكلفة الاستيراد', 'نصيحة الشحن', 'حاسبة الربح'],
    // Tab 1
    t1title: 'تكلفة الاستيراد الحقيقية',
    t1sub: 'اعرف التكلفة الفعلية قبل ما تشتري',
    product: 'المنتج', productP: 'مثال: كراسي مكتب',
    qty: 'الكمية', qtyP: 'مثال: 500 قطعة',
    unitPrice: 'سعر الوحدة (ريال)', unitPriceP: 'مثال: 50',
    weight: 'الوزن الإجمالي (كجم)', weightP: 'مثال: 200',
    shipping: 'طريقة الشحن', sea: 'بحري', air: 'جوي',
    calc: 'احسب التكلفة', calcLoading: 'جاري الحساب...',
    productCost: 'تكلفة المنتج', shippingCost: 'تكلفة الشحن',
    customs: 'رسوم الجمارك', vat: 'ضريبة القيمة المضافة 15%',
    clearance: 'تخليص جمركي', total: 'الإجمالي', unitLanded: 'تكلفة الوحدة الحقيقية',
    disclaimer: '* أرقام تقريبية — تأكد مع المخلص الجمركي',
    // Tab 2
    t2title: 'نصيحة الشحن الذكية',
    t2sub: 'جوي أم بحري؟ الـ AI يقرر لك',
    urgency: 'مدى الاستعجال',
    urgencyOpts: ['غير مستعجل', 'متوسط', 'مستعجل جداً'],
    productType: 'نوع المنتج',
    productTypeOpts: ['إلكترونيات', 'أثاث وديكور', 'ملابس', 'مواد بناء', 'غذاء', 'أخرى'],
    getAdvice: 'احصل على النصيحة', adviceLoading: 'جاري التحليل...',
    recommendation: 'التوصية',
    // Tab 3
    t3title: 'حاسبة الربح',
    t3sub: 'كم ستربح من هذه الصفقة؟',
    landedCost: 'تكلفة الوحدة بعد الاستيراد (ريال)',
    landedCostP: 'من نتيجة الحاسبة الأولى',
    channel: 'قناة البيع',
    channelOpts: ['نون', 'متجرك الإلكتروني', 'تويتر/سوشيال ميديا', 'محل فيزيكل', 'جملة'],
    hasStorage: 'عندك مخزن؟',
    yes: 'نعم', no: 'لا',
    returnRate: 'توقع نسبة المرتجعات',
    returnOpts: ['منخفضة (2-5%)', 'متوسطة (5-10%)', 'عالية (+10%)'],
    calcProfit: 'احسب الربح', profitLoading: 'جاري الحساب...',
    // Common
    new: 'حساب جديد', sar: 'ريال',
    copy: 'نسخ', copied: '✓',
  },
  en: {
    btn: 'Trader Calculator',
    tabs: ['Import Cost', 'Shipping Advice', 'Profit Calculator'],
    t1title: 'True Landing Cost',
    t1sub: 'Know the real cost before you buy',
    product: 'Product', productP: 'e.g. Office Chairs',
    qty: 'Quantity', qtyP: 'e.g. 500 units',
    unitPrice: 'Unit Price (SAR)', unitPriceP: 'e.g. 50',
    weight: 'Total Weight (kg)', weightP: 'e.g. 200',
    shipping: 'Shipping Method', sea: 'Sea', air: 'Air',
    calc: 'Calculate Cost', calcLoading: 'Calculating...',
    productCost: 'Product Cost', shippingCost: 'Shipping Cost',
    customs: 'Customs Duty', vat: 'VAT 15%',
    clearance: 'Customs Clearance', total: 'Total', unitLanded: 'True Unit Cost',
    disclaimer: '* Estimates only — confirm with customs broker',
    t2title: 'Smart Shipping Advice',
    t2sub: 'Sea or Air? Let AI decide for you',
    urgency: 'Urgency Level',
    urgencyOpts: ['Not Urgent', 'Moderate', 'Very Urgent'],
    productType: 'Product Type',
    productTypeOpts: ['Electronics', 'Furniture', 'Clothing', 'Building Materials', 'Food', 'Other'],
    getAdvice: 'Get Advice', adviceLoading: 'Analyzing...',
    recommendation: 'Recommendation',
    t3title: 'Profit Calculator',
    t3sub: 'How much will you make?',
    landedCost: 'Unit Cost After Import (SAR)',
    landedCostP: 'From the first calculator',
    channel: 'Sales Channel',
    channelOpts: ['Noon', 'Your Online Store', 'Twitter/Social Media', 'Physical Store', 'Wholesale'],
    hasStorage: 'Do you have storage?',
    yes: 'Yes', no: 'No',
    returnRate: 'Expected Return Rate',
    returnOpts: ['Low (2-5%)', 'Medium (5-10%)', 'High (+10%)'],
    calcProfit: 'Calculate Profit', profitLoading: 'Calculating...',
    new: 'New Calculation', sar: 'SAR',
    copy: 'Copy', copied: '✓',
  },
  zh: {
    btn: '贸易计算器',
    tabs: ['进口成本', '运输建议', '利润计算'],
    t1title: '真实到岸成本',
    t1sub: '购买前了解真实成本',
    product: '产品', productP: '例如：办公椅',
    qty: '数量', qtyP: '例如：500件',
    unitPrice: '单价 (SAR)', unitPriceP: '例如：50',
    weight: '总重量 (kg)', weightP: '例如：200',
    shipping: '运输方式', sea: '海运', air: '空运',
    calc: '计算成本', calcLoading: '计算中...',
    productCost: '产品成本', shippingCost: '运费',
    customs: '关税', vat: '增值税 15%',
    clearance: '清关费', total: '总计', unitLanded: '真实单位成本',
    disclaimer: '* 估算数字，请向报关行确认',
    t2title: '智能运输建议',
    t2sub: '海运还是空运？让AI来决定',
    urgency: '紧急程度',
    urgencyOpts: ['不紧急', '一般', '非常紧急'],
    productType: '产品类型',
    productTypeOpts: ['电子产品', '家具', '服装', '建材', '食品', '其他'],
    getAdvice: '获取建议', adviceLoading: '分析中...',
    recommendation: '建议',
    t3title: '利润计算器',
    t3sub: '这笔交易能赚多少？',
    landedCost: '进口后单位成本 (SAR)',
    landedCostP: '来自第一个计算器',
    channel: '销售渠道',
    channelOpts: ['Noon', '自营网店', '社交媒体', '实体店', '批发'],
    hasStorage: '有仓储吗？',
    yes: '是', no: '否',
    returnRate: '预期退货率',
    returnOpts: ['低 (2-5%)', '中 (5-10%)', '高 (+10%)'],
    calcProfit: '计算利润', profitLoading: '计算中...',
    new: '重新计算', sar: 'SAR',
    copy: '复制', copied: '✓',
  }
};

export default function TraderCalculator({ lang }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  // Tab 1 state
  const [form1, setForm1] = useState({ product: '', qty: '', unitPrice: '', weight: '', shipping: 'sea' });
  const [loading1, setLoading1] = useState(false);
  const [result1, setResult1] = useState(null);

  // Tab 2 state
  const [form2, setForm2] = useState({ weight: '', qty: '', unitPrice: '', urgency: 0, productType: 0 });
  const [loading2, setLoading2] = useState(false);
  const [result2, setResult2] = useState(null);

  // Tab 3 state
  const [form3, setForm3] = useState({ landedCost: '', channel: 0, hasStorage: true, returnRate: 0 });
  const [loading3, setLoading3] = useState(false);
  const [result3, setResult3] = useState(null);

  const [copied, setCopied] = useState(false);

  const fmt = (n) => n ? Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 0 }) : '0';

  const callAI = async (system, userMsg) => {
    const res = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({ system, messages: [{ role: 'user', content: userMsg }] })
    });
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    return JSON.parse(text.replace(/```json|```/g, '').trim());
  };

  // حاسبة التكلفة
  const calcCost = async () => {
    if (!form1.product || !form1.qty || !form1.unitPrice || !form1.weight) return;
    setLoading1(true);
    try {
      const result = await callAI(
        `أنت خبير جمارك سعودي. احسب تكلفة الاستيراد وأرجع JSON فقط:
{"product_cost":0,"shipping_cost":0,"customs_duty":0,"customs_duty_pct":0,"vat":0,"clearance":0,"total":0,"unit_landed":0,"notes":""}
قواعد: شحن بحري 15-25 ريال/كجم، جوي 40-60 ريال/كجم. جمارك حسب نوع المنتج. VAT 15% على الكل. تخليص 500 ريال تحت طن، 1000 فوقه.`,
        `المنتج: ${form1.product}\nالكمية: ${form1.qty}\nسعر الوحدة: ${form1.unitPrice} ريال\nالوزن: ${form1.weight} كجم\nالشحن: ${form1.shipping === 'sea' ? 'بحري' : 'جوي'}`
      );
      setResult1(result);
      // نقل تكلفة الوحدة تلقائياً للحاسبة الثالثة
      if (result.unit_landed) setForm3(prev => ({ ...prev, landedCost: String(Math.round(result.unit_landed)) }));
    } catch { alert(isAr ? 'حدث خطأ' : 'Error'); }
    setLoading1(false);
  };

  // نصيحة الشحن
  const getShippingAdvice = async () => {
    if (!form2.weight || !form2.qty || !form2.unitPrice) return;
    setLoading2(true);
    try {
      const result = await callAI(
        `أنت خبير لوجستيات متخصص في الشحن من الصين للسعودية. حلل الموقف وأرجع JSON فقط:
{"recommendation":"sea|air","reason":"سبب التوصية بالعربي في جملتين","sea_cost":0,"sea_days":0,"air_cost":0,"air_days":0,"warning":"تحذير مهم لو موجود أو فارغ","savings":0}
sea_cost و air_cost بالريال السعودي. sea_days و air_days بالأيام.`,
        `وزن الشحنة: ${form2.weight} كجم\nالكمية: ${form2.qty}\nسعر الوحدة: ${form2.unitPrice} ريال\nالاستعجال: ${t.urgencyOpts[form2.urgency]}\nنوع المنتج: ${t.productTypeOpts[form2.productType]}`
      );
      setResult2(result);
    } catch { alert(isAr ? 'حدث خطأ' : 'Error'); }
    setLoading2(false);
  };

  // حاسبة الربح
  const calcProfit = async () => {
    if (!form3.landedCost) return;
    setLoading3(true);
    try {
      const result = await callAI(
        `أنت خبير تجارة إلكترونية في السوق السعودي. احسب هامش الربح وأرجع JSON فقط:
{"suggested_price":0,"profit_per_unit":0,"profit_margin_pct":0,"platform_fee_pct":0,"storage_cost":0,"marketing_pct":0,"return_cost":0,"net_profit_per_unit":0,"monthly_profit_estimate":0,"advice":"نصيحة مهمة بجملة واحدة"}
كل المبالغ بالريال السعودي.`,
        `تكلفة الوحدة بعد الاستيراد: ${form3.landedCost} ريال\nقناة البيع: ${t.channelOpts[form3.channel]}\nعندي مخزن: ${form3.hasStorage ? 'نعم' : 'لا'}\nnسبة المرتجعات المتوقعة: ${t.returnOpts[form3.returnRate]}`
      );
      setResult3(result);
    } catch { alert(isAr ? 'حدث خطأ' : 'Error'); }
    setLoading3(false);
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (hidden) return null;

  return (
    <>
      {/* TRIGGER */}
      {!open && (
        <div style={{
          position: 'fixed', bottom: 24,
          [isAr ? 'right' : 'left']: 24,
          zIndex: 1400, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button onClick={() => setOpen(true)} style={{
            background: '#F7F5F2', color: '#2C2C2C',
            border: '1px solid #E5E0D8', borderRadius: 3,
            fontSize: 12, fontWeight: 500, letterSpacing: 0.5,
            cursor: 'pointer', boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
            padding: '10px 18px', whiteSpace: 'nowrap',
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#EFECE7'}
            onMouseLeave={e => e.currentTarget.style.background = '#F7F5F2'}>
            {t.btn}
          </button>
          <button onClick={() => setHidden(true)} style={{
            background: 'rgba(247,245,242,0.9)', color: '#7a7a7a',
            border: '1px solid #E5E0D8', borderRadius: 3,
            width: 32, height: 32, cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>×</button>
        </div>
      )}

      {/* PANEL */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24,
          [isAr ? 'right' : 'left']: 24,
          zIndex: 1400, width: 380, maxHeight: '88vh',
          background: 'rgba(247,245,242,0.98)',
          border: '1px solid #E5E0D8', borderRadius: 4,
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', animation: 'slideUp 0.3s ease',
          direction: isAr ? 'rtl' : 'ltr',
        }}>

          {/* HEADER */}
          <div style={{ padding: '14px 16px', background: '#2C2C2C', color: '#F7F5F2', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 500, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{t.btn}</p>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            {/* TABS */}
            <div style={{ display: 'flex', gap: 2 }}>
              {t.tabs.map((tab, i) => (
                <button key={i} onClick={() => setActiveTab(i)} style={{
                  flex: 1, padding: '6px 4px', fontSize: 10, cursor: 'pointer',
                  background: activeTab === i ? 'rgba(247,245,242,0.15)' : 'transparent',
                  color: activeTab === i ? '#F7F5F2' : 'rgba(255,255,255,0.4)',
                  border: 'none', borderBottom: activeTab === i ? '1px solid #F7F5F2' : '1px solid transparent',
                  transition: 'all 0.2s', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                  letterSpacing: 0.5, whiteSpace: 'nowrap',
                }}>
                  {`0${i + 1}`} {tab}
                </button>
              ))}
            </div>
          </div>

          {/* BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {/* TAB 1 — تكلفة الاستيراد */}
            {activeTab === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 11, color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{t.t1sub}</p>

                {!result1 ? (
                  <>
                    <Field label={t.product} isAr={isAr}>
                      <input style={inputSt} value={form1.product} onChange={e => setForm1({ ...form1, product: e.target.value })} placeholder={t.productP} dir={isAr ? 'rtl' : 'ltr'} />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Field label={t.qty} isAr={isAr}><input style={inputSt} type="number" value={form1.qty} onChange={e => setForm1({ ...form1, qty: e.target.value })} placeholder={t.qtyP} /></Field>
                      <Field label={t.unitPrice} isAr={isAr}><input style={inputSt} type="number" value={form1.unitPrice} onChange={e => setForm1({ ...form1, unitPrice: e.target.value })} placeholder={t.unitPriceP} /></Field>
                    </div>
                    <Field label={t.weight} isAr={isAr}>
                      <input style={inputSt} type="number" value={form1.weight} onChange={e => setForm1({ ...form1, weight: e.target.value })} placeholder={t.weightP} />
                    </Field>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {['sea', 'air'].map(m => (
                        <button key={m} onClick={() => setForm1({ ...form1, shipping: m })} style={{ ...btnToggleSt, borderColor: form1.shipping === m ? '#2C2C2C' : '#E5E0D8', background: form1.shipping === m ? '#2C2C2C' : 'transparent', color: form1.shipping === m ? '#F7F5F2' : '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                          {m === 'sea' ? t.sea : t.air}
                        </button>
                      ))}
                    </div>
                    <button onClick={calcCost} disabled={loading1 || !form1.product || !form1.qty || !form1.unitPrice || !form1.weight} style={{ ...submitSt, opacity: (!form1.product || !form1.qty || !form1.unitPrice || !form1.weight) ? 0.4 : 1, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                      {loading1 ? t.calcLoading : t.calc}
                    </button>
                  </>
                ) : (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {[
                      { label: t.productCost, val: result1.product_cost },
                      { label: t.shippingCost, val: result1.shipping_cost },
                      { label: `${t.customs} (${result1.customs_duty_pct}%)`, val: result1.customs_duty },
                      { label: t.vat, val: result1.vat },
                      { label: t.clearance, val: result1.clearance },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E5E0D8', fontSize: 12 }}>
                        <span style={{ color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{row.label}</span>
                        <span style={{ color: '#2C2C2C' }}>{fmt(row.val)} {t.sar}</span>
                      </div>
                    ))}
                    <div style={{ background: '#2C2C2C', padding: '14px 16px', margin: '12px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'rgba(247,245,242,0.6)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{t.unitLanded}</span>
                      <span style={{ fontSize: 22, fontWeight: 300, color: '#F7F5F2', fontFamily: 'var(--font-en)' }}>{fmt(result1.unit_landed)} <span style={{ fontSize: 11, opacity: 0.6 }}>{t.sar}</span></span>
                    </div>
                    {result1.notes && <p style={{ fontSize: 11, color: '#7a7a7a', marginBottom: 8, fontStyle: 'italic' }}>{result1.notes}</p>}
                    <p style={{ fontSize: 10, color: '#7a7a7a', marginBottom: 12, fontStyle: 'italic' }}>{t.disclaimer}</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => { setResult1(null); setForm1({ product: '', qty: '', unitPrice: '', weight: '', shipping: 'sea' }); }} style={{ ...resetSt, flex: 1 }}>{t.new}</button>
                      <button onClick={() => setActiveTab(2)} style={{ flex: 1, background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '10px', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 3, fontFamily: 'var(--font-body)' }}>
                        {isAr ? 'احسب الربح ←' : 'Calc Profit →'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2 — نصيحة الشحن */}
            {activeTab === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 11, color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{t.t2sub}</p>

                {!result2 ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <Field label={t.weight} isAr={isAr}><input style={inputSt} type="number" value={form2.weight} onChange={e => setForm2({ ...form2, weight: e.target.value })} placeholder="200" /></Field>
                      <Field label={t.qty} isAr={isAr}><input style={inputSt} type="number" value={form2.qty} onChange={e => setForm2({ ...form2, qty: e.target.value })} placeholder="500" /></Field>
                    </div>
                    <Field label={t.unitPrice} isAr={isAr}>
                      <input style={inputSt} type="number" value={form2.unitPrice} onChange={e => setForm2({ ...form2, unitPrice: e.target.value })} placeholder="50" />
                    </Field>
                    <Field label={t.urgency} isAr={isAr}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {t.urgencyOpts.map((opt, i) => (
                          <button key={i} onClick={() => setForm2({ ...form2, urgency: i })} style={{ ...btnToggleSt, borderColor: form2.urgency === i ? '#2C2C2C' : '#E5E0D8', background: form2.urgency === i ? '#2C2C2C' : 'transparent', color: form2.urgency === i ? '#F7F5F2' : '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)', textAlign: isAr ? 'right' : 'left', padding: '8px 12px' }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label={t.productType} isAr={isAr}>
                      <select style={inputSt} value={form2.productType} onChange={e => setForm2({ ...form2, productType: parseInt(e.target.value) })}>
                        {t.productTypeOpts.map((opt, i) => <option key={i} value={i}>{opt}</option>)}
                      </select>
                    </Field>
                    <button onClick={getShippingAdvice} disabled={loading2 || !form2.weight || !form2.qty || !form2.unitPrice} style={{ ...submitSt, opacity: (!form2.weight || !form2.qty || !form2.unitPrice) ? 0.4 : 1, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                      {loading2 ? t.adviceLoading : t.getAdvice}
                    </button>
                  </>
                ) : (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* التوصية */}
                    <div style={{ background: result2.recommendation === 'sea' ? '#EFECE7' : '#2C2C2C', padding: '20px', borderRadius: 4, marginBottom: 16, textAlign: 'center' }}>
                      <p style={{ fontSize: 32, marginBottom: 8 }}>{result2.recommendation === 'sea' ? '🚢' : '✈️'}</p>
                      <p style={{ fontSize: 16, fontWeight: 500, color: result2.recommendation === 'sea' ? '#2C2C2C' : '#F7F5F2', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)', marginBottom: 8 }}>
                        {result2.recommendation === 'sea' ? (isAr ? 'شحن بحري' : 'Sea Freight') : (isAr ? 'شحن جوي' : 'Air Freight')}
                      </p>
                      <p style={{ fontSize: 12, color: result2.recommendation === 'sea' ? '#7a7a7a' : 'rgba(247,245,242,0.6)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)', lineHeight: 1.6 }}>
                        {result2.reason}
                      </p>
                    </div>

                    {/* المقارنة */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#E5E0D8', marginBottom: 16 }}>
                      {[
                        { label: isAr ? 'بحري 🚢' : 'Sea 🚢', cost: result2.sea_cost, days: result2.sea_days, active: result2.recommendation === 'sea' },
                        { label: isAr ? 'جوي ✈️' : 'Air ✈️', cost: result2.air_cost, days: result2.air_days, active: result2.recommendation === 'air' },
                      ].map((opt, i) => (
                        <div key={i} style={{ background: opt.active ? '#2C2C2C' : '#F7F5F2', padding: '14px 12px', textAlign: 'center' }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: opt.active ? '#F7F5F2' : '#2C2C2C', marginBottom: 8 }}>{opt.label}</p>
                          <p style={{ fontSize: 18, fontWeight: 300, color: opt.active ? '#F7F5F2' : '#2C2C2C', fontFamily: 'var(--font-en)' }}>{fmt(opt.cost)} <span style={{ fontSize: 10, opacity: 0.6 }}>{t.sar}</span></p>
                          <p style={{ fontSize: 11, color: opt.active ? 'rgba(247,245,242,0.5)' : '#7a7a7a', marginTop: 4 }}>{opt.days} {isAr ? 'يوم' : 'days'}</p>
                        </div>
                      ))}
                    </div>

                    {result2.savings > 0 && (
                      <p style={{ fontSize: 12, color: '#2d7a4f', marginBottom: 12, padding: '8px 12px', background: 'rgba(45,122,79,0.06)', borderRadius: 3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                        💰 {isAr ? `توفير: ${fmt(result2.savings)} ريال` : `Savings: ${fmt(result2.savings)} SAR`}
                      </p>
                    )}

                    {result2.warning && (
                      <p style={{ fontSize: 12, color: '#c00', marginBottom: 12, padding: '8px 12px', background: 'rgba(204,0,0,0.04)', borderRadius: 3, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                        ⚠️ {result2.warning}
                      </p>
                    )}

                    <button onClick={() => setResult2(null)} style={resetSt}>{t.new}</button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3 — حاسبة الربح */}
            {activeTab === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <p style={{ fontSize: 11, color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{t.t3sub}</p>

                {!result3 ? (
                  <>
                    <Field label={t.landedCost} isAr={isAr}>
                      <input style={inputSt} type="number" value={form3.landedCost} onChange={e => setForm3({ ...form3, landedCost: e.target.value })} placeholder={t.landedCostP} />
                      {result1?.unit_landed && (
                        <p style={{ fontSize: 10, color: '#2d7a4f', marginTop: 4, cursor: 'pointer' }} onClick={() => setForm3(prev => ({ ...prev, landedCost: String(Math.round(result1.unit_landed)) }))}>
                          ↑ {isAr ? `استخدم من الحاسبة: ${fmt(result1.unit_landed)} ريال` : `Use from calculator: ${fmt(result1.unit_landed)} SAR`}
                        </p>
                      )}
                    </Field>
                    <Field label={t.channel} isAr={isAr}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {t.channelOpts.map((opt, i) => (
                          <button key={i} onClick={() => setForm3({ ...form3, channel: i })} style={{ ...btnToggleSt, borderColor: form3.channel === i ? '#2C2C2C' : '#E5E0D8', background: form3.channel === i ? '#2C2C2C' : 'transparent', color: form3.channel === i ? '#F7F5F2' : '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)', textAlign: isAr ? 'right' : 'left', padding: '8px 12px' }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label={t.hasStorage} isAr={isAr}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {[true, false].map((v, i) => (
                          <button key={i} onClick={() => setForm3({ ...form3, hasStorage: v })} style={{ ...btnToggleSt, borderColor: form3.hasStorage === v ? '#2C2C2C' : '#E5E0D8', background: form3.hasStorage === v ? '#2C2C2C' : 'transparent', color: form3.hasStorage === v ? '#F7F5F2' : '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                            {v ? t.yes : t.no}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <Field label={t.returnRate} isAr={isAr}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {t.returnOpts.map((opt, i) => (
                          <button key={i} onClick={() => setForm3({ ...form3, returnRate: i })} style={{ ...btnToggleSt, borderColor: form3.returnRate === i ? '#2C2C2C' : '#E5E0D8', background: form3.returnRate === i ? '#2C2C2C' : 'transparent', color: form3.returnRate === i ? '#F7F5F2' : '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)', textAlign: isAr ? 'right' : 'left', padding: '8px 12px' }}>
                            {opt}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <button onClick={calcProfit} disabled={loading3 || !form3.landedCost} style={{ ...submitSt, opacity: !form3.landedCost ? 0.4 : 1, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                      {loading3 ? t.profitLoading : t.calcProfit}
                    </button>
                  </>
                ) : (
                  <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {/* السعر الموصى به */}
                    <div style={{ background: '#2C2C2C', padding: '20px', borderRadius: 4, marginBottom: 16, textAlign: 'center' }}>
                      <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(247,245,242,0.4)', marginBottom: 8, textTransform: 'uppercase' }}>
                        {isAr ? 'سعر البيع الموصى به' : 'Suggested Price'}
                      </p>
                      <p style={{ fontSize: 36, fontWeight: 300, color: '#F7F5F2', fontFamily: 'var(--font-en)' }}>
                        {fmt(result3.suggested_price)} <span style={{ fontSize: 14, opacity: 0.6 }}>{t.sar}</span>
                      </p>
                    </div>

                    {/* التفاصيل */}
                    {[
                      { label: isAr ? 'رسوم المنصة' : 'Platform Fee', val: `${result3.platform_fee_pct}%` },
                      { label: isAr ? 'تكلفة التسويق' : 'Marketing', val: `${result3.marketing_pct}%` },
                      { label: isAr ? 'تكلفة المرتجعات' : 'Return Cost', val: `${fmt(result3.return_cost)} ${t.sar}` },
                      { label: isAr ? 'ربح الوحدة الصافي' : 'Net Profit/Unit', val: `${fmt(result3.net_profit_per_unit)} ${t.sar}` },
                    ].map((row, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #E5E0D8', fontSize: 12 }}>
                        <span style={{ color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{row.label}</span>
                        <span style={{ color: '#2C2C2C', fontWeight: 500 }}>{row.val}</span>
                      </div>
                    ))}

                    {/* هامش الربح */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: '#E5E0D8', margin: '12px 0' }}>
                      <div style={{ background: '#F7F5F2', padding: '14px', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#7a7a7a', marginBottom: 6, letterSpacing: 1 }}>{isAr ? 'هامش الربح' : 'Margin'}</p>
                        <p style={{ fontSize: 24, fontWeight: 300, color: result3.profit_margin_pct > 20 ? '#2d7a4f' : result3.profit_margin_pct > 10 ? '#2C2C2C' : '#c00', fontFamily: 'var(--font-en)' }}>
                          {result3.profit_margin_pct}%
                        </p>
                      </div>
                      <div style={{ background: '#F7F5F2', padding: '14px', textAlign: 'center' }}>
                        <p style={{ fontSize: 10, color: '#7a7a7a', marginBottom: 6, letterSpacing: 1 }}>{isAr ? 'ربح شهري تقريبي' : 'Monthly Est.'}</p>
                        <p style={{ fontSize: 18, fontWeight: 300, color: '#2C2C2C', fontFamily: 'var(--font-en)' }}>
                          {fmt(result3.monthly_profit_estimate)} <span style={{ fontSize: 10, opacity: 0.6 }}>{t.sar}</span>
                        </p>
                      </div>
                    </div>

                    {result3.advice && (
                      <p style={{ fontSize: 12, color: '#2C2C2C', padding: '10px 12px', background: '#EFECE7', borderRadius: 3, marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)', lineHeight: 1.6 }}>
                        💡 {result3.advice}
                      </p>
                    )}

                    <button onClick={() => setResult3(null)} style={resetSt}>{t.new}</button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}

// Helper components & styles
function Field({ label, isAr, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputSt = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #E5E0D8', background: 'rgba(247,245,242,0.8)',
  fontSize: 13, color: '#2C2C2C', outline: 'none',
  borderRadius: 3, boxSizing: 'border-box', transition: 'border-color 0.2s',
};

const btnToggleSt = {
  padding: '9px', fontSize: 12, cursor: 'pointer',
  borderRadius: 3, border: '1px solid', transition: 'all 0.2s',
};

const submitSt = {
  background: '#2C2C2C', color: '#F7F5F2', border: 'none',
  padding: '13px', fontSize: 13, fontWeight: 500,
  cursor: 'pointer', borderRadius: 3, transition: 'opacity 0.2s',
};

const resetSt = {
  width: '100%', background: 'none', border: '1px solid #E5E0D8',
  color: '#7a7a7a', padding: '10px', fontSize: 11,
  letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
  borderRadius: 3, fontFamily: 'var(--font-body)', transition: 'all 0.2s',
};