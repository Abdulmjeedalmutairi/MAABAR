import React, { useState } from 'react';

const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const T = {
  ar: {
    btn: 'حاسبة التكلفة',
    title: 'حاسبة التكلفة الحقيقية',
    sub: 'اعرف التكلفة الفعلية قبل ما تشتري',
    product: 'المنتج',
    productPlaceholder: 'مثال: كراسي مكتب',
    qty: 'الكمية',
    qtyPlaceholder: 'مثال: 500 قطعة',
    unitPrice: 'سعر الوحدة (ريال)',
    unitPricePlaceholder: 'مثال: 50',
    weight: 'الوزن الإجمالي (كجم)',
    weightPlaceholder: 'مثال: 200',
    shipping: 'طريقة الشحن',
    sea: 'بحري (اقتصادي)',
    air: 'جوي (سريع)',
    calc: 'احسب التكلفة',
    loading: 'جاري الحساب...',
    result: 'تقرير التكلفة',
    disclaimer: '* هذه أرقام تقريبية. تأكد من المخلص الجمركي للأرقام الدقيقة.',
    new: 'حساب جديد',
    items: {
      product_cost: 'تكلفة المنتج',
      shipping_cost: 'تكلفة الشحن',
      customs_duty: 'رسوم الجمارك',
      vat: 'ضريبة القيمة المضافة 15%',
      clearance: 'تخليص جمركي',
      total: 'التكلفة الإجمالية',
      unit_landed: 'تكلفة الوحدة الحقيقية',
    }
  },
  en: {
    btn: 'Cost Calculator',
    title: 'True Landing Cost',
    sub: 'Know the real cost before you buy',
    product: 'Product',
    productPlaceholder: 'e.g. Office Chairs',
    qty: 'Quantity',
    qtyPlaceholder: 'e.g. 500 units',
    unitPrice: 'Unit Price (SAR)',
    unitPricePlaceholder: 'e.g. 50',
    weight: 'Total Weight (kg)',
    weightPlaceholder: 'e.g. 200',
    shipping: 'Shipping Method',
    sea: 'Sea (Economy)',
    air: 'Air (Fast)',
    calc: 'Calculate Cost',
    loading: 'Calculating...',
    result: 'Cost Report',
    disclaimer: '* These are estimates. Confirm with a customs broker for exact figures.',
    new: 'New Calculation',
    items: {
      product_cost: 'Product Cost',
      shipping_cost: 'Shipping Cost',
      customs_duty: 'Customs Duty',
      vat: 'VAT 15%',
      clearance: 'Customs Clearance',
      total: 'Total Landing Cost',
      unit_landed: 'True Unit Cost',
    }
  },
  zh: {
    btn: '成本计算器',
    title: '真实到岸成本',
    sub: '购买前了解真实成本',
    product: '产品',
    productPlaceholder: '例如：办公椅',
    qty: '数量',
    qtyPlaceholder: '例如：500件',
    unitPrice: '单价 (SAR)',
    unitPricePlaceholder: '例如：50',
    weight: '总重量 (kg)',
    weightPlaceholder: '例如：200',
    shipping: '运输方式',
    sea: '海运（经济）',
    air: '空运（快速）',
    calc: '计算成本',
    loading: '计算中...',
    result: '成本报告',
    disclaimer: '* 以上为估算数字，请向报关行确认准确数据。',
    new: '重新计算',
    items: {
      product_cost: '产品成本',
      shipping_cost: '运费',
      customs_duty: '关税',
      vat: '增值税 15%',
      clearance: '清关费',
      total: '总到岸成本',
      unit_landed: '真实单位成本',
    }
  }
};

export default function LandingCostCalculator({ lang }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [step, setStep] = useState('form'); // form | loading | result
  const [form, setForm] = useState({ product: '', qty: '', unitPrice: '', weight: '', shipping: 'sea' });
  const [result, setResult] = useState(null);
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  const calculate = async () => {
    if (!form.product || !form.qty || !form.unitPrice || !form.weight) return;
    setStep('loading');

    const systemPrompt = `أنت خبير جمارك سعودي. المستخدم يعطيك بيانات منتج مستورد من الصين.
احسب التكلفة الحقيقية وأرجع JSON فقط بهذا الشكل بدون أي نص إضافي:
{
  "product_cost": 0,
  "shipping_cost": 0,
  "customs_duty": 0,
  "customs_duty_pct": 0,
  "vat": 0,
  "clearance": 0,
  "total": 0,
  "unit_landed": 0,
  "notes": ""
}
قواعد الحساب:
- تكلفة المنتج = الكمية × سعر الوحدة
- الشحن البحري: تقريباً 15-25 ريال/كجم للشحنات الصغيرة
- الشحن الجوي: تقريباً 40-60 ريال/كجم
- رسوم الجمارك: حددها حسب نوع المنتج (إلكترونيات 5%، أثاث 15%، ملابس 20%، مواد بناء 12%، غذاء 5-15%، الافتراضي 5%)
- تُحسب الجمارك على (تكلفة المنتج + الشحن)
- ضريبة القيمة المضافة 15% على (المنتج + الشحن + الجمارك)
- تخليص جمركي ثابت: 500 ريال للشحنات تحت 1 طن، 1000 ريال فوقها
- تكلفة الوحدة الحقيقية = الإجمالي ÷ الكمية
كل الأرقام بالريال السعودي مقربة لأقرب ريال.`;

    const userMsg = `المنتج: ${form.product}
الكمية: ${form.qty}
سعر الوحدة: ${form.unitPrice} ريال
الوزن الإجمالي: ${form.weight} كجم
طريقة الشحن: ${form.shipping === 'sea' ? 'بحري' : 'جوي'}`;

    try {
      const res = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({ system: systemPrompt, messages: [{ role: 'user', content: userMsg }] })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setStep('result');
    } catch (e) {
      alert(isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Error, please try again');
      setStep('form');
    }
  };

  const reset = () => {
    setStep('form');
    setResult(null);
    setForm({ product: '', qty: '', unitPrice: '', weight: '', shipping: 'sea' });
  };

  const fmt = (n) => n ? Number(n).toLocaleString('ar-SA', { maximumFractionDigits: 0 }) : '0';

  if (hidden) return null;

  return (
    <>
      {/* TRIGGER BUTTON */}
      {!open && (
        <div style={{
          position: 'fixed', bottom: 24,
          [isAr ? 'right' : 'left']: 24,
          zIndex: 1400,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button onClick={() => setOpen(true)} style={{
            background: '#F7F5F2', color: '#2C2C2C',
            border: '1px solid #E5E0D8',
            borderRadius: 3, fontSize: 12, fontWeight: 500,
            letterSpacing: 0.5, cursor: 'pointer',
            boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
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
            transition: 'all 0.2s',
          }}>×</button>
        </div>
      )}

      {/* PANEL */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24,
          [isAr ? 'right' : 'left']: 24,
          zIndex: 1400,
          width: 360,
          maxHeight: '85vh',
          background: 'rgba(247,245,242,0.98)',
          border: '1px solid #E5E0D8',
          borderRadius: 4,
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.3s ease',
          direction: isAr ? 'rtl' : 'ltr',
        }}>

          {/* HEADER */}
          <div style={{ padding: '14px 16px', background: '#2C2C2C', color: '#F7F5F2', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  {t.title}
                </p>
                <p style={{ fontSize: 11, opacity: 0.5, marginTop: 2, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  {t.sub}
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4,
              }}>×</button>
            </div>
          </div>

          {/* BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {/* FORM */}
            {step === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle(isAr)}>{t.product}</label>
                  <input style={inputStyle} value={form.product}
                    onChange={e => setForm({ ...form, product: e.target.value })}
                    placeholder={t.productPlaceholder} dir={isAr ? 'rtl' : 'ltr'} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle(isAr)}>{t.qty}</label>
                    <input style={inputStyle} type="number" value={form.qty}
                      onChange={e => setForm({ ...form, qty: e.target.value })}
                      placeholder={t.qtyPlaceholder} />
                  </div>
                  <div>
                    <label style={labelStyle(isAr)}>{t.unitPrice}</label>
                    <input style={inputStyle} type="number" value={form.unitPrice}
                      onChange={e => setForm({ ...form, unitPrice: e.target.value })}
                      placeholder={t.unitPricePlaceholder} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle(isAr)}>{t.weight}</label>
                  <input style={inputStyle} type="number" value={form.weight}
                    onChange={e => setForm({ ...form, weight: e.target.value })}
                    placeholder={t.weightPlaceholder} />
                </div>
                <div>
                  <label style={labelStyle(isAr)}>{t.shipping}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {['sea', 'air'].map(m => (
                      <button key={m} onClick={() => setForm({ ...form, shipping: m })} style={{
                        padding: '10px', fontSize: 12, cursor: 'pointer', borderRadius: 3,
                        border: '1px solid',
                        borderColor: form.shipping === m ? '#2C2C2C' : '#E5E0D8',
                        background: form.shipping === m ? '#2C2C2C' : 'transparent',
                        color: form.shipping === m ? '#F7F5F2' : '#7a7a7a',
                        transition: 'all 0.2s',
                        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                      }}>
                        {m === 'sea' ? t.sea : t.air}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={calculate}
                  disabled={!form.product || !form.qty || !form.unitPrice || !form.weight}
                  style={{
                    background: '#2C2C2C', color: '#F7F5F2', border: 'none',
                    padding: '13px', fontSize: 13, fontWeight: 500,
                    cursor: 'pointer', borderRadius: 3, marginTop: 4,
                    opacity: (!form.product || !form.qty || !form.unitPrice || !form.weight) ? 0.4 : 1,
                    fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                    transition: 'opacity 0.2s',
                  }}>
                  {t.calc}
                </button>
              </div>
            )}

            {/* LOADING */}
            {step === 'loading' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 16, animation: 'pulse 1s ease infinite' }}>⚡</div>
                <p style={{ fontSize: 13, color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  {t.loading}
                </p>
                <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
              </div>
            )}

            {/* RESULT */}
            {step === 'result' && result && (
              <div>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
                  {t.result}
                </p>

                {/* ROWS */}
                {[
                  { key: 'product_cost', bold: false },
                  { key: 'shipping_cost', bold: false },
                  { key: 'customs_duty', bold: false, extra: result.customs_duty_pct ? ` (${result.customs_duty_pct}%)` : '' },
                  { key: 'vat', bold: false },
                  { key: 'clearance', bold: false },
                ].map(({ key, bold, extra }) => (
                  <div key={key} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '10px 0', borderBottom: '1px solid #E5E0D8',
                    fontSize: 12,
                  }}>
                    <span style={{ color: '#7a7a7a', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                      {t.items[key]}{extra}
                    </span>
                    <span style={{ fontWeight: bold ? 600 : 400, color: '#2C2C2C' }}>
                      {fmt(result[key])} SAR
                    </span>
                  </div>
                ))}

                {/* TOTAL */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '14px 0', borderBottom: '1px solid #E5E0D8',
                  marginTop: 4,
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#2C2C2C', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                    {t.items.total}
                  </span>
                  <span style={{ fontSize: 20, fontWeight: 300, color: '#2C2C2C', fontFamily: 'var(--font-en)' }}>
                    {fmt(result.total)} SAR
                  </span>
                </div>

                {/* UNIT COST */}
                <div style={{
                  background: '#2C2C2C', padding: '16px',
                  borderRadius: 3, marginTop: 12, marginBottom: 12,
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <span style={{ fontSize: 12, color: 'rgba(247,245,242,0.6)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                    {t.items.unit_landed}
                  </span>
                  <span style={{ fontSize: 24, fontWeight: 300, color: '#F7F5F2', fontFamily: 'var(--font-en)' }}>
                    {fmt(result.unit_landed)} <span style={{ fontSize: 11, opacity: 0.6 }}>SAR</span>
                  </span>
                </div>

                {/* NOTES */}
                {result.notes && (
                  <p style={{ fontSize: 11, color: '#7a7a7a', lineHeight: 1.6, marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                    {result.notes}
                  </p>
                )}

                {/* DISCLAIMER */}
                <p style={{ fontSize: 10, color: '#7a7a7a', lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                  {t.disclaimer}
                </p>

                <button onClick={reset} style={{
                  width: '100%', background: 'none', border: '1px solid #E5E0D8',
                  color: '#2C2C2C', padding: '11px', fontSize: 11,
                  letterSpacing: 2, textTransform: 'uppercase', cursor: 'pointer',
                  borderRadius: 3, fontFamily: 'var(--font-body)',
                }}>
                  {t.new}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const labelStyle = (isAr) => ({
  display: 'block', fontSize: 10, letterSpacing: 1.5,
  textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 6,
  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
});

const inputStyle = {
  width: '100%', padding: '10px 12px',
  border: '1px solid #E5E0D8',
  background: 'rgba(247,245,242,0.8)',
  fontSize: 13, color: '#2C2C2C', outline: 'none',
  borderRadius: 3, boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};