import React, { useState } from 'react';
import { sb } from '../supabase';
import { useNavigate } from 'react-router-dom';

export default function AIAssistant({ lang, user, onRequestCreated }) {
  const [open, setOpen] = useState(false);
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
    // ← هنا التحقق من المستخدم فقط عند الإرسال
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
    alert(chatLang === 'ar' ? '✅ تم رفع طلبك!' : '✅ Request submitted!');
    setOpen(false);
    setMessages([]);
    setRequestData(null);
    if (onRequestCreated) onRequestCreated();
  };

  return (
    <>
      {/* TRIGGER BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 1500,
          background: '#1a1a1a', color: '#fff', border: 'none',
          borderRadius: 24, fontSize: 13, fontWeight: 500,
          cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center',
          gap: 8, padding: '10px 16px', whiteSpace: 'nowrap'
        }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf50', display: 'inline-block' }}></span>
        {isAr ? 'تحتاج مساعدة بطلبك؟' : 'Need help with your request?'}
      </button>

      {/* PANEL */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 72, left: 24, zIndex: 1500,
          width: 360, height: 520, background: '#fff',
          border: '1px solid #e8e4de', borderRadius: 12,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden'
        }}>
          {/* HEADER */}
          <div style={{ padding: '14px 16px', background: '#1a1a1a', color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4caf50', display: 'inline-block' }}></span>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500 }}>
                    {chatLang === 'ar' ? 'مساعد الطلبات' : chatLang === 'en' ? 'Request Assistant' : '请求助手'}
                  </p>
                  <p style={{ fontSize: 11, opacity: 0.6 }}>
                    {chatLang === 'ar' ? 'سأساعدك ترفع طلبك' : chatLang === 'en' ? "I'll help you post your request" : '我将帮助您提交请求'}
                  </p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {['ar', 'en', 'zh'].map(l => (
                <button key={l} onClick={() => setChatLang(l)} style={{
                  background: chatLang === l ? '#fff' : 'none',
                  color: chatLang === l ? '#1a1a1a' : 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  padding: '2px 8px', fontSize: 11, cursor: 'pointer', borderRadius: 3
                }}>
                  {l === 'ar' ? 'AR' : l === 'en' ? 'EN' : '中文'}
                </button>
              ))}
            </div>
          </div>

          {/* MESSAGES */}
          <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {messages.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
                <div style={{ background: '#f0ede8', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, lineHeight: 1.6, maxWidth: '85%' }}>
                  Welcome · أهلاً · 欢迎
                  <br />
                  {chatLang === 'ar' ? 'اختر لغة المحادثة:' : chatLang === 'en' ? 'Choose conversation language:' : '选择对话语言：'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[
                    { code: 'ar', label: 'العربية' },
                    { code: 'en', label: 'English' },
                    { code: 'zh', label: '中文' }
                  ].map(l => (
                    <button key={l.code} onClick={() => setChatLang(l.code)} style={{
                      background: chatLang === l.code ? '#1a1a1a' : '#fff',
                      color: chatLang === l.code ? '#fff' : '#1a1a1a',
                      border: '1px solid #e8e4de',
                      padding: '8px 14px', fontSize: 12,
                      cursor: 'pointer', borderRadius: 20
                    }}>
                      {l.label}
                    </button>
                  ))}
                </div>
                <div style={{ background: '#f0ede8', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, lineHeight: 1.6, maxWidth: '85%' }}>
                  {chatLang === 'ar' ? 'أهلاً! وش المنتج اللي تبي تستورده؟' : chatLang === 'en' ? "Hi! What product would you like to import?" : '您好！您想进口什么产品？'}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} style={{
                background: m.role === 'user' ? '#1a1a1a' : '#f0ede8',
                color: m.role === 'user' ? '#fff' : '#1a1a1a',
                borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                padding: '10px 14px', fontSize: 13, lineHeight: 1.6,
                maxWidth: '85%', alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                {m.role === 'assistant' ? m.content.replace(/\{[\s\S]*\}/g, '').trim() : m.content}
              </div>
            ))}
            {loading && (
              <div style={{ background: '#f0ede8', borderRadius: '12px 12px 12px 4px', padding: '10px 14px', fontSize: 13, maxWidth: '85%' }}>●●●</div>
            )}
            {requestData && (
              <div style={{ border: '1px solid #e8e4de', borderRadius: 8, padding: 14, background: '#fff', marginTop: 8 }}>
                <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>
                  ✅ {chatLang === 'ar' ? 'ملخص طلبك:' : chatLang === 'en' ? 'Request Summary:' : '请求摘要：'}
                </p>
                <p style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 4 }}>
                  {chatLang === 'ar' ? 'المنتج:' : 'Product:'} <strong>{requestData.title_ar || requestData.title_en}</strong>
                </p>
                <p style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 4 }}>
                  {chatLang === 'ar' ? 'الكمية:' : 'Quantity:'} <strong>{requestData.quantity}</strong>
                </p>
                {requestData.budget && (
                  <p style={{ fontSize: 12, color: '#6b6b6b', marginBottom: 12 }}>
                    {chatLang === 'ar' ? 'الميزانية:' : 'Budget:'} <strong>{requestData.budget}</strong>
                  </p>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={submitRequest} style={{ flex: 1, background: '#1a1a1a', color: '#fff', border: 'none', padding: '9px', fontSize: 12, cursor: 'pointer', borderRadius: 3 }}>
                    {chatLang === 'ar' ? 'رفع الطلب' : chatLang === 'en' ? 'Submit Request' : '提交请求'}
                  </button>
                  <button onClick={() => setRequestData(null)} style={{ background: 'none', border: '1px solid #e8e4de', padding: '9px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 3 }}>
                    {chatLang === 'ar' ? 'تعديل' : chatLang === 'en' ? 'Edit' : '编辑'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* INPUT */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid #e8e4de', display: 'flex', gap: 8 }}>
            <input
              style={{ flex: 1, padding: '9px 14px', border: '1px solid #e8e4de', borderRadius: 20, fontSize: 13, outline: 'none', background: '#FAF8F4' }}
              placeholder={chatLang === 'ar' ? 'اكتب هنا...' : chatLang === 'en' ? 'Type here...' : '在此输入...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              dir={chatLang === 'ar' ? 'rtl' : 'ltr'}
            />
            <button onClick={sendMessage} disabled={loading} style={{ background: '#1a1a1a', color: '#fff', border: 'none', width: 34, height: 34, borderRadius: '50%', cursor: 'pointer', fontSize: 14 }}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}