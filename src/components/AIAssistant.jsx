import React, { useState } from 'react';
import { sb } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function AIAssistant({ lang, user, onRequestCreated }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const nav = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [chatLang, setChatLang] = useState(lang);
  const isAr = lang === 'ar';

  const systemPrompt = `أنت مساعد ذكي لمنصة معبر B2B. مهمتك مساعدة التاجر على بناء طلب شراء احترافي من خلال محادثة بسيطة.
اسأل عن:
1. المنتج المطلوب
2. الكمية
3. المواصفات (اللون، الحجم، المادة)
4. الميزانية التقريبية
بعد جمع المعلومات، أنشئ ملخص الطلب بـ JSON:
{"ready":true,"title_ar":"...","title_en":"...","quantity":"...","description":"...","budget":"..."}
تحدث باللغة: ${chatLang === 'ar' ? 'العربية' : chatLang === 'en' ? 'الإنجليزية' : 'الصينية'}.`;

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
      if (text.includes('"ready":true')) {
        try {
          const jsonMatch = text.match(/\{[\s\S]*"ready":true[\s\S]*\}/);
          if (jsonMatch) setRequestData(JSON.parse(jsonMatch[0]));
        } catch (e) {}
      }
    } catch (e) {
      setMessages([...newMessages, { role: 'assistant', content: chatLang === 'ar' ? 'حدث خطأ، حاول مرة أخرى' : 'Error, please try again' }]);
    }
    setLoading(false);
  };

  const submitRequest = async () => {
    if (!requestData) return;
    if (!user) {
      alert(chatLang === 'ar' ? 'سجل دخولك لإتمام الطلب' : 'Please login to submit your request');
      nav('/login');
      return;
    }
    const { error } = await sb.from('requests').insert({
      buyer_id: user.id,
      title_ar: requestData.title_ar,
      title_en: requestData.title_en,
      title_zh: requestData.title_en,
      quantity: requestData.quantity,
      description: requestData.description,
      status: 'open'
    });
    if (error) { alert(chatLang === 'ar' ? 'حدث خطأ' : 'Error'); return; }
    alert(chatLang === 'ar' ? 'تم رفع طلبك!' : 'Request submitted!');
    setOpen(false);
    setMessages([]);
    setRequestData(null);
    if (onRequestCreated) onRequestCreated();
  };

  // مخفي كلياً
  if (hidden) return null;

  return (
    <>
      {/* TRIGGER BUTTON */}
      {!open && (
        <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 1500, display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setOpen(true)} style={{
            background: '#2C2C2C', color: '#F7F5F2', border: 'none',
            borderRadius: 3, fontSize: 12, fontWeight: 500, letterSpacing: 0.5,
            cursor: 'pointer', boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
            padding: '10px 18px', whiteSpace: 'nowrap',
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
            transition: 'all 0.2s'
          }}>
            {isAr ? 'مساعد الطلبات' : 'Request Assistant'}
          </button>
          <button onClick={() => setHidden(true)} style={{
            background: 'rgba(44,44,44,0.08)', color: '#7a7a7a',
            border: '1px solid #E5E0D8', borderRadius: 3,
            width: 32, height: 32, cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}>×</button>
        </div>
      )}

      {/* PANEL */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 1500,
          width: 360, height: 520,
          background: 'rgba(255,255,255,0.97)',
          border: '1px solid #E5E0D8', borderRadius: 4,
          boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          animation: 'slideUp 0.3s ease'
        }}>
          {/* HEADER */}
          <div style={{ padding: '14px 16px', background: '#2C2C2C', color: '#F7F5F2' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div>
                <p style={{ fontSize: 13, fontWeight: 500, letterSpacing: 0.5 }}>
                  {chatLang === 'ar' ? 'مساعد الطلبات' : chatLang === 'en' ? 'Request Assistant' : '请求助手'}
                </p>
                <p style={{ fontSize: 11, opacity: 0.5, marginTop: 2 }}>
                  {chatLang === 'ar' ? 'سأساعدك ترفع طلبك' : "I'll help you post your request"}
                </p>
              </div>
              <button onClick={() => setOpen(false)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4,
                transition: 'color 0.2s'
              }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['ar', 'en', 'zh'].map(l => (
                <button key={l} onClick={() => setChatLang(l)} style={{
                  background: chatLang === l ? '#F7F5F2' : 'none',
                  color: chatLang === l ? '#2C2C2C' : 'rgba(255,255,255,0.5)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  padding: '2px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 2,
                  letterSpacing: 0.5, transition: 'all 0.2s'
                }}>
                  {l === 'ar' ? 'AR' : l === 'en' ? 'EN' : 'ZH'}
                </button>
              ))}
            </div>
          </div>

          {/* MESSAGES */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: '#FAFAF8' }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '8px 0' }}>
                <div style={{ background: '#EFECE7', borderRadius: '0 12px 12px 12px', padding: '10px 14px', fontSize: 13, lineHeight: 1.6, maxWidth: '85%', color: '#2C2C2C' }}>
                  {chatLang === 'ar' ? 'أهلاً! وش المنتج اللي تبي تستورده؟' : chatLang === 'en' ? 'Hi! What product would you like to import?' : '您好！您想进口什么产品？'}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                background: m.role === 'user' ? '#2C2C2C' : '#EFECE7',
                color: m.role === 'user' ? '#F7F5F2' : '#2C2C2C',
                borderRadius: m.role === 'user' ? '12px 12px 0 12px' : '0 12px 12px 12px',
                padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                maxWidth: '85%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                {m.role === 'assistant' ? m.content.replace(/\{[\s\S]*\}/g, '').trim() : m.content}
              </div>
            ))}
            {loading && (
              <div style={{ background: '#EFECE7', borderRadius: '0 12px 12px 12px', padding: '10px 14px', fontSize: 13, maxWidth: '85%', color: '#7a7a7a' }}>
                ···
              </div>
            )}
            {requestData && (
              <div style={{ border: '1px solid #E5E0D8', borderRadius: 4, padding: 14, background: '#fff', marginTop: 8 }}>
                <p style={{ fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: '#7a7a7a', marginBottom: 10 }}>
                  {chatLang === 'ar' ? 'ملخص طلبك' : 'Request Summary'}
                </p>
                <p style={{ fontSize: 13, marginBottom: 4, color: '#2C2C2C' }}>
                  {chatLang === 'ar' ? 'المنتج:' : 'Product:'} <strong>{requestData.title_ar || requestData.title_en}</strong>
                </p>
                <p style={{ fontSize: 13, marginBottom: 4, color: '#2C2C2C' }}>
                  {chatLang === 'ar' ? 'الكمية:' : 'Quantity:'} <strong>{requestData.quantity}</strong>
                </p>
                {requestData.budget && (
                  <p style={{ fontSize: 13, marginBottom: 12, color: '#2C2C2C' }}>
                    {chatLang === 'ar' ? 'الميزانية:' : 'Budget:'} <strong>{requestData.budget}</strong>
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={submitRequest} style={{ flex: 1, background: '#2C2C2C', color: '#F7F5F2', border: 'none', padding: '9px', fontSize: 12, cursor: 'pointer', borderRadius: 3, transition: 'opacity 0.2s' }}>
                    {chatLang === 'ar' ? 'رفع الطلب' : 'Submit Request'}
                  </button>
                  <button onClick={() => setRequestData(null)} style={{ background: 'none', border: '1px solid #E5E0D8', padding: '9px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 3, color: '#2C2C2C' }}>
                    {chatLang === 'ar' ? 'تعديل' : 'Edit'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #E5E0D8', display: 'flex', gap: 8, background: '#fff' }}>
            <input
              style={{ flex: 1, padding: '9px 14px', border: '1px solid #E5E0D8', borderRadius: 3, fontSize: 13, outline: 'none', background: '#F7F5F2', color: '#2C2C2C', transition: 'border-color 0.2s' }}
              placeholder={chatLang === 'ar' ? 'اكتب هنا...' : chatLang === 'en' ? 'Type here...' : '在此输入...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              dir={chatLang === 'ar' ? 'rtl' : 'ltr'}
            />
            <button onClick={sendMessage} disabled={loading} style={{
              background: '#2C2C2C', color: '#F7F5F2', border: 'none',
              width: 34, height: 34, borderRadius: 3, cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'opacity 0.2s', opacity: loading ? 0.5 : 1
            }}>→</button>
          </div>
        </div>
      )}
    </>
  );
}