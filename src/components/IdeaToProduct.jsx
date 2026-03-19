import React, { useState } from 'react';
import { sb } from '../supabase';

export default function IdeaToProduct({ lang, user, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const isAr = lang === 'ar';

  const systemPrompt = `أنت مستشار تصنيع متخصص في الصين لمنصة معبر. مهمتك تحويل أفكار المستخدمين لمنتجات قابلة للتصنيع.
عند استلام فكرة، اسأل عن:
١- وصف الفكرة بالتفصيل
٢- المواد المفضلة (بلاستيك، معدن، قماش، خشب...)
٣- الكمية الأولى المطلوبة
٤- الميزانية التقريبية للوحدة
بعد جمع المعلومات، أنشئ تقرير JSON:
{"ready":true,"product_name_ar":"...","product_name_en":"...","specs":"...","factory_type":"...","city":"...","price_estimate":"...","moq":"...","timeline":"...","request_description":"..."}
تحدث بنفس لغة المستخدم.`;

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8`
        },
        body: JSON.stringify({ system: systemPrompt, messages: newMessages })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      setMessages([...newMessages, { role: 'assistant', content: text }]);
      if (text.includes('"ready":true') || text.includes('"ready": true')) {
        try {
          const jsonMatch = text.match(/\{[\s\S]*"ready"[\s\S]*\}/);
          if (jsonMatch) setResult(JSON.parse(jsonMatch[0]));
        } catch (e) {}
      }
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: isAr ? 'حدث خطأ، حاول مرة أخرى' : 'Error, please try again' }]);
    }
    setLoading(false);
  };

  const submitRequest = async () => {
    if (!result) return;
    if (!user) { alert(isAr ? 'سجل دخولك أولاً' : 'Please login first'); return; }
    const { error } = await sb.from('requests').insert({
      buyer_id: user.id,
      title_ar: result.product_name_ar,
      title_en: result.product_name_en,
      title_zh: result.product_name_en,
      quantity: result.moq,
      description: result.request_description,
      status: 'open'
    });
    if (error) { alert(isAr ? 'حدث خطأ' : 'Error'); return; }
    alert(isAr ? '✅ تم إرسال فكرتك للموردين!' : '✅ Idea sent to suppliers!');
    if (onClose) onClose();
  };

  // MINIMIZED
  if (minimized) return (
    <div
      onClick={() => setMinimized(false)}
      style={{
        position: 'fixed', bottom: 24, left: 24, zIndex: 2000,
        background: '#1a1a1a', color: '#fff',
        padding: '10px 20px', borderRadius: 24,
        cursor: 'pointer', fontSize: 13, fontWeight: 500,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        fontFamily: isAr ? 'var(--font-ar)' : 'inherit',
        display: 'flex', alignItems: 'center', gap: 8
      }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf50', display: 'inline-block' }}></span>
      {isAr ? 'ابتكر منتجك — متابعة' : 'Create Product — Continue'}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '92vh', height: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* HEADER */}
        <div style={{ padding: '20px 24px', background: '#1a1a1a', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 18, fontWeight: 500, marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {isAr ? 'ابتكر منتجك الخاص' : 'Create Your Own Product'}
            </p>
            <p style={{ fontSize: 12, opacity: 0.6, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {isAr ? 'AI يحول فكرتك لمنتج حقيقي من الصين' : 'AI turns your idea into a real product from China'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={() => setMinimized(true)}
              title={isAr ? 'تصغير' : 'Minimize'}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 16, cursor: 'pointer', padding: '2px 10px', borderRadius: 4, lineHeight: 1 }}>
              —
            </button>
            <button
              onClick={() => { setMessages([]); setResult(null); setInput(''); }}
              title={isAr ? 'محادثة جديدة' : 'New Chat'}
              style={{ background: 'none', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', fontSize: 12, cursor: 'pointer', padding: '4px 10px', borderRadius: 4, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {isAr ? 'جديد' : 'New'}
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', lineHeight: 1 }}>×</button>
          </div>
        </div>

        {/* STEPS */}
        <div style={{ padding: '12px 24px', background: '#FAF8F4', borderBottom: '1px solid #e8e4de', display: 'flex', gap: 16, justifyContent: 'center' }}>
          {[
            isAr ? '١- صف فكرتك' : '1- Describe',
            isAr ? '٢- AI يحللها' : '2- AI Analyzes',
            isAr ? '٣- أرسل للموردين' : '3- Send to Suppliers'
          ].map((s, i) => (
            <span key={i} style={{ fontSize: 11, color: '#6b6b6b', display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span>→</span>}
              {s}
            </span>
          ))}
        </div>

        {/* MESSAGES */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', minHeight: 300, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.length === 0 && (
            <div style={{ background: '#f0ede8', borderRadius: '12px 12px 12px 4px', padding: '12px 16px', fontSize: 14, lineHeight: 1.7, maxWidth: '85%', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
              {isAr ? 'أهلاً! صف لي فكرتك — أي منتج تبي تصنعه؟' : "Hi! Describe your idea — what product would you like to manufacture?"}
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} style={{
              background: m.role === 'user' ? '#1a1a1a' : '#f0ede8',
              color: m.role === 'user' ? '#fff' : '#1a1a1a',
              borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              padding: '12px 16px', fontSize: 14, lineHeight: 1.7,
              maxWidth: '85%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              fontFamily: isAr ? 'var(--font-ar)' : 'inherit'
            }}>
              {m.role === 'assistant' ? m.content.replace(/\{[\s\S]*\}/g, '').trim() : m.content}
            </div>
          ))}
          {loading && (
            <div style={{ background: '#f0ede8', borderRadius: '12px 12px 12px 4px', padding: '12px 16px', fontSize: 14, maxWidth: '85%' }}>●●●</div>
          )}
          {result && (
            <div style={{ border: '2px solid #1a1a1a', borderRadius: 12, padding: 20, background: '#fff', marginTop: 8 }}>
              <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                {isAr ? 'تقرير التصنيع جاهز' : 'Manufacturing Report Ready'}
              </p>
              {[
                { label: isAr ? 'المنتج' : 'Product', val: result.product_name_ar || result.product_name_en },
                { label: isAr ? 'نوع المصنع' : 'Factory Type', val: result.factory_type },
                { label: isAr ? 'المدينة' : 'City', val: result.city },
                { label: isAr ? 'تكلفة تقريبية' : 'Est. Cost', val: result.price_estimate },
                { label: 'MOQ', val: result.moq },
                { label: isAr ? 'مدة التصنيع' : 'Timeline', val: result.timeline },
              ].map((r, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f0ede8', fontSize: 13 }}>
                  <span style={{ color: '#6b6b6b' }}>{r.label}</span>
                  <span style={{ fontWeight: 500 }}>{r.val}</span>
                </div>
              ))}
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 12, textAlign: 'center', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                  {isAr ? 'وش تبي الحين؟' : 'What would you like to do next?'}
                </p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={submitRequest} style={{ flex: 1, background: '#1a1a1a', color: '#fff', border: 'none', padding: '12px', fontSize: 13, cursor: 'pointer', borderRadius: 6, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                    {isAr ? 'Agent يتواصل معك' : 'Agent contacts you'}
                  </button>
                  <button onClick={() => setResult(null)} style={{ flex: 1, background: 'none', border: '1px solid #1a1a1a', color: '#1a1a1a', padding: '12px', fontSize: 13, cursor: 'pointer', borderRadius: 6, fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}>
                    {isAr ? 'كمّل مع AI' : 'Continue with AI'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* INPUT */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #e8e4de', display: 'flex', gap: 10 }}>
          <input
            style={{ flex: 1, padding: '11px 16px', border: '1px solid #e8e4de', borderRadius: 24, fontSize: 14, outline: 'none', background: '#FAF8F4', fontFamily: isAr ? 'var(--font-ar)' : 'inherit' }}
            placeholder={isAr ? 'صف فكرتك هنا...' : 'Describe your idea here...'}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            dir={isAr ? 'rtl' : 'ltr'}
          />
          <button onClick={sendMessage} disabled={loading} style={{ background: '#1a1a1a', color: '#fff', border: 'none', width: 42, height: 42, borderRadius: '50%', cursor: 'pointer', fontSize: 18 }}>
            →
          </button>
        </div>
      </div>
    </div>
  );
}