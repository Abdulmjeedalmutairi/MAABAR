import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

export default function Chat({ lang, user }) {
  const { partnerId } = useParams();
  const nav = useNavigate();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [input, setInput] = useState('');
  const [translating, setTranslating] = useState(false);
  const bodyRef = useRef(null);
  const isAr = lang === 'ar';
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    loadPartner();
    loadMessages();
    intervalRef.current = setInterval(loadMessages, 4000);
    return () => clearInterval(intervalRef.current);
  }, [partnerId, user]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  const loadPartner = async () => {
    const { data } = await sb.from('profiles').select('company_name,full_name,avatar_url').eq('id', partnerId).single();
    if (data) setPartner(data);
  };

  const loadMessages = async () => {
    if (!user) return;
    const { data } = await sb.from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
    await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', partnerId).eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput('');
    await sb.from('messages').insert({ sender_id: user.id, receiver_id: partnerId, content });
    await sb.from('notifications').insert({
      user_id: partnerId, type: 'new_message',
      title_ar: '💬 رسالة جديدة من معبر',
      title_en: '💬 New message on Maabar',
      title_zh: '💬 新消息',
      ref_id: user.id, is_read: false
    });
    loadMessages();
  };

  const translateMessage = async (content) => {
    setTranslating(true);
    try {
      const res = await fetch(`https://utzalmszfqfcofywfetv.supabase.co/functions/v1/AI-proxy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8` },
        body: JSON.stringify({
          system: 'You are a translator. Translate the given text to Arabic, English, and Chinese. Reply in JSON format: {"ar":"...","en":"...","zh":"..."}',
          messages: [{ role: 'user', content }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const translations = JSON.parse(clean);
      alert(`🌐 ترجمة:\n\n🇸🇦 ${translations.ar}\n🇬🇧 ${translations.en}\n🇨🇳 ${translations.zh}`);
    } catch (e) {
      alert(isAr ? 'حدث خطأ في الترجمة' : 'Translation error');
    }
    setTranslating(false);
  };

  const fmtTime = (d) => new Date(d).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' });
  const fmtDate = (d) => new Date(d).toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  const partnerName = partner?.company_name || partner?.full_name || '—';

  let lastDate = '';

  return (
    <div className="chat-wrap">
      <div className="chat-header">
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginInlineEnd: 8 }} onClick={() => nav('/inbox')}>←</button>
        <div className="avatar-sm">{partnerName[0]}</div>
        <div>
          <p style={{ fontWeight: 500, fontSize: 15 }}>{partnerName}</p>
          <p style={{ fontSize: 11, color: '#6b6b6b' }}>{isAr ? 'متصل' : 'Online'}</p>
        </div>
        <button style={{ marginInlineStart: 'auto', background: 'none', border: '1px solid #e8e4de', padding: '6px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 3 }}
          onClick={() => translating ? null : alert(isAr ? 'اضغط على أي رسالة لترجمتها' : 'Click any message to translate')}>
          🌐 {isAr ? 'ترجمة' : 'Translate'}
        </button>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b6b6b', fontSize: 13, padding: 40 }}>
            {isAr ? 'ابدأ المحادثة' : 'Start the conversation'}
          </div>
        )}
        {messages.map((m, i) => {
          const isMe = m.sender_id === user.id;
          const dateStr = fmtDate(m.created_at);
          const showDate = dateStr !== lastDate;
          lastDate = dateStr;
          return (
            <React.Fragment key={m.id}>
              {showDate && (
                <div className="chat-day-sep"><span>{dateStr}</span></div>
              )}
              <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}
                onClick={() => !isMe && translateMessage(m.content)}
                style={{ cursor: isMe ? 'default' : 'pointer' }}>
                <div>{m.content}</div>
                <div className="bubble-time">{fmtTime(m.created_at)}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <div className="chat-footer">
        <input
          className="chat-input"
          placeholder={isAr ? 'اكتب رسالة...' : 'Type a message...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          dir={isAr ? 'rtl' : 'ltr'}
        />
        <button className="chat-send" onClick={sendMessage}>
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
        </button>
      </div>
    </div>
  );
}