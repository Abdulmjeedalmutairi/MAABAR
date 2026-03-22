import React, { useState } from 'react';

const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

const T = {
  ar: {
    btn: 'مفاوض AI',
    title: 'مفاوض AI',
    sub: 'اكتب بالعربي — يرد للمورد بالإنجليزي أو الصيني',
    situation: 'وصف الموقف',
    situationPlaceholder: 'مثال: المورد عرض 50 ريال للوحدة وأبي أوصله لـ 42 ريال، الكمية 1000 قطعة',
    targetLang: 'لغة الرد للمورد',
    english: 'إنجليزي',
    chinese: 'صيني',
    generate: 'اكتب الرد',
    generating: 'جاري الكتابة...',
    copy: 'نسخ الرد',
    copied: '✓ تم النسخ',
    result: 'الرد للمورد',
    explanation: 'شرح الاستراتيجية',
    new: 'موقف جديد',
    tips: 'نصائح التفاوض',
  },
  en: {
    btn: 'AI Negotiator',
    title: 'AI Negotiator',
    sub: 'Write in Arabic — replies to supplier in English or Chinese',
    situation: 'Describe the situation',
    situationPlaceholder: 'e.g. Supplier offered $14/unit, I want to reach $11, quantity is 1000 units',
    targetLang: 'Reply language for supplier',
    english: 'English',
    chinese: 'Chinese',
    generate: 'Write Reply',
    generating: 'Writing...',
    copy: 'Copy Reply',
    copied: '✓ Copied',
    result: 'Reply to Supplier',
    explanation: 'Strategy Explanation',
    new: 'New Situation',
    tips: 'Negotiation Tips',
  },
  zh: {
    btn: 'AI谈判助手',
    title: 'AI谈判助手',
    sub: '用阿拉伯语描述 — 自动生成给供应商的回复',
    situation: '描述情况',
    situationPlaceholder: '例如：供应商报价50里亚尔/件，我希望谈到42里亚尔，数量1000件',
    targetLang: '回复供应商的语言',
    english: '英语',
    chinese: '中文',
    generate: '生成回复',
    generating: '生成中...',
    copy: '复制回复',
    copied: '✓ 已复制',
    result: '给供应商的回复',
    explanation: '策略说明',
    new: '新情况',
    tips: '谈判技巧',
  }
};

export default function NegotiationAgent({ lang }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [situation, setSituation] = useState('');
  const [targetLang, setTargetLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const t = T[lang] || T.ar;
  const isAr = lang === 'ar';

  const generate = async () => {
    if (!situation.trim()) return;
    setLoading(true);
    setResult(null);

    const targetLangName = targetLang === 'en' ? 'English' : 'Chinese (Simplified)';

    const systemPrompt = `أنت خبير تفاوض متخصص في تجارة الاستيراد من الصين إلى السعودية.
التاجر السعودي يصف لك موقف التفاوض بالعربي، وأنت تكتب له ردًا احترافيًا للمورد الصيني باللغة ${targetLangName}.

قواعد المفاوضة:
- اطلب خصم 5-15% كنقطة بداية
- استخدم حجة الكمية والعلاقة طويلة المدى
- كن محترمًا وإيجابيًا، لا عدوانيًا
- اترك مجالاً للتفاوض، لا تعطي سعرك النهائي أول مرة
- اذكر المنافسين بطريقة ذكية لو مناسب

أرجع JSON فقط بهذا الشكل بدون أي نص خارجه:
{
  "reply": "الرد الكامل للمورد باللغة المطلوبة",
  "strategy": "شرح الاستراتيجية بالعربي في جملتين",
  "tips": ["نصيحة 1", "نصيحة 2", "نصيحة 3"]
}`;

    try {
      const res = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          system: systemPrompt,
          messages: [{ role: 'user', content: situation }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      alert(isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Error, please try again');
    }
    setLoading(false);
  };

  const copyReply = () => {
    if (!result?.reply) return;
    navigator.clipboard.writeText(result.reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setResult(null);
    setSituation('');
  };

  if (hidden) return null;

  return (
    <>
      {/* TRIGGER */}
      {!open && (
        <div style={{
          position: 'fixed', bottom: 80,
          [isAr ? 'left' : 'right']: 24,
          zIndex: 1400, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <button onClick={() => setOpen(true)} style={{
            background: '#2C2C2C', color: '#F7F5F2',
            border: 'none', borderRadius: 3, fontSize: 12, fontWeight: 500,
            letterSpacing: 0.5, cursor: 'pointer',
            boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
            padding: '10px 18px', whiteSpace: 'nowrap',
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#444'}
            onMouseLeave={e => e.currentTarget.style.background = '#2C2C2C'}>
            {t.btn}
          </button>
          <button onClick={() => setHidden(true)} style={{
            background: 'rgba(44,44,44,0.08)', color: '#7a7a7a',
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
          [isAr ? 'left' : 'right']: 24,
          zIndex: 1400, width: 380,
          maxHeight: '88vh',
          background: 'rgba(247,245,242,0.98)',
          border: '1px solid #E5E0D8', borderRadius: 4,
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden', animation: 'slideUp 0.3s ease',
          direction: isAr ? 'rtl' : 'ltr',
        }}>

          {/* HEADER */}
          <div style={{ padding: '14px 16px', background: '#2C2C2C', color: '#F7F5F2', flexShrink: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{t.title}</p>
                <p style={{ fontSize: 11, opacity: 0.5, marginTop: 2, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{t.sub}</p>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4 }}>×</button>
            </div>
          </div>

          {/* BODY */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

            {!result ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* الموقف */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 8, fontFamily: 'var(--font-body)' }}>
                    {t.situation}
                  </label>
                  <textarea
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #E5E0D8', background: 'rgba(247,245,242,0.8)', fontSize: 13, color: '#2C2C2C', outline: 'none', borderRadius: 3, boxSizing: 'border-box', resize: 'vertical', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)', lineHeight: 1.6 }}
                    rows={4}
                    value={situation}
                    onChange={e => setSituation(e.target.value)}
                    placeholder={t.situationPlaceholder}
                    dir={isAr ? 'rtl' : 'ltr'}
                  />
                </div>

                {/* لغة الرد */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 8, fontFamily: 'var(--font-body)' }}>
                    {t.targetLang}
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {['en', 'zh'].map(l => (
                      <button key={l} onClick={() => setTargetLang(l)} style={{
                        padding: '10px', fontSize: 12, cursor: 'pointer', borderRadius: 3,
                        border: '1px solid', borderColor: targetLang === l ? '#2C2C2C' : '#E5E0D8',
                        background: targetLang === l ? '#2C2C2C' : 'transparent',
                        color: targetLang === l ? '#F7F5F2' : '#7a7a7a',
                        transition: 'all 0.2s', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                      }}>
                        {l === 'en' ? t.english : t.chinese}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={generate} disabled={!situation.trim() || loading} style={{
                  background: situation.trim() ? '#2C2C2C' : '#E5E0D8',
                  color: situation.trim() ? '#F7F5F2' : '#7a7a7a',
                  border: 'none', padding: '13px', fontSize: 13, fontWeight: 500,
                  cursor: situation.trim() ? 'pointer' : 'not-allowed', borderRadius: 3,
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                  transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
                }}>
                  {loading ? t.generating : t.generate}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>

                {/* الرد */}
                <div>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 10, fontFamily: 'var(--font-body)' }}>{t.result}</p>
                  <div style={{ background: '#F0EDE8', border: '1px solid #E5E0D8', borderRadius: 3, padding: 16, position: 'relative' }}>
                    <p style={{ fontSize: 13, lineHeight: 1.8, color: '#2C2C2C', fontFamily: targetLang === 'en' ? 'var(--font-body)' : 'inherit', direction: 'ltr', whiteSpace: 'pre-wrap' }}>
                      {result.reply}
                    </p>
                    <button onClick={copyReply} style={{
                      position: 'absolute', top: 10, left: isAr ? 10 : 'auto', right: isAr ? 'auto' : 10,
                      background: copied ? '#2d7a4f' : '#2C2C2C', color: '#F7F5F2',
                      border: 'none', padding: '5px 12px', fontSize: 10, letterSpacing: 1,
                      cursor: 'pointer', borderRadius: 2, transition: 'all 0.2s',
                    }}>
                      {copied ? t.copied : t.copy}
                    </button>
                  </div>
                </div>

                {/* الاستراتيجية */}
                {result.strategy && (
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 10, fontFamily: 'var(--font-body)' }}>{t.explanation}</p>
                    <p style={{ fontSize: 12, color: '#7a7a7a', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>
                      {result.strategy}
                    </p>
                  </div>
                )}

                {/* النصائح */}
                {result.tips?.length > 0 && (
                  <div>
                    <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 10, fontFamily: 'var(--font-body)' }}>{t.tips}</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {result.tips.map((tip, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                          <span style={{ fontSize: 10, color: '#7a7a7a', fontFamily: 'var(--font-body)', minWidth: 16, marginTop: 2 }}>0{i + 1}</span>
                          <p style={{ fontSize: 12, color: '#2C2C2C', lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)' }}>{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button onClick={reset} style={{
                  background: 'none', border: '1px solid #E5E0D8', color: '#7a7a7a',
                  padding: '11px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase',
                  cursor: 'pointer', borderRadius: 3, fontFamily: 'var(--font-body)',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#2C2C2C'; e.currentTarget.style.color = '#2C2C2C'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E0D8'; e.currentTarget.style.color = '#7a7a7a'; }}>
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