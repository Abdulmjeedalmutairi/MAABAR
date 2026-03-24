import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

// ترجمة ذكية بالسياق التجاري
const translateText = async (text, targetLang) => {
  const langNames = { ar: 'العربية', en: 'English', zh: '中文' };
  try {
    const res = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
      body: JSON.stringify({
        system: `أنت مترجم تجاري متخصص في تجارة الاستيراد والتصدير بين السعودية والصين.
ترجم النص التالي إلى ${langNames[targetLang]} مع مراعاة:
- السياق التجاري والمصطلحات الدقيقة
- الطبيعة التفاوضية للمحادثة
- أن تكون الترجمة طبيعية ومفهومة
أرجع الترجمة فقط بدون أي نص إضافي أو تفسير.`,
        messages: [{ role: 'user', content: text }]
      })
    });
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || '';
  } catch {
    return '';
  }
};

export default function Chat({ lang, user }) {
  const { partnerId } = useParams();
  const nav = useNavigate();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [translations, setTranslations] = useState({}); // { msgId: translatedText }
  const [translatingIds, setTranslatingIds] = useState(new Set());
  const bodyRef = useRef(null);
  const channelRef = useRef(null);
  const isAr = lang === 'ar';

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    loadPartner();
    loadMessages();
    subscribeRealtime();
    return () => {
      if (channelRef.current) sb.removeChannel(channelRef.current);
    };
  }, [partnerId, user]);

  useEffect(() => {
    if (bodyRef.current)
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  // ترجمة تلقائية للرسائل الجديدة من الطرف الثاني
  useEffect(() => {
    const untranslated = messages.filter(m =>
      m.sender_id !== user.id &&
      !translations[m.id] &&
      !translatingIds.has(m.id)
    );
    if (untranslated.length === 0) return;

    untranslated.forEach(async (m) => {
      setTranslatingIds(prev => new Set(prev).add(m.id));
      const translated = await translateText(m.content, lang);
      if (translated && translated !== m.content) {
        setTranslations(prev => ({ ...prev, [m.id]: translated }));
      }
      setTranslatingIds(prev => {
        const next = new Set(prev);
        next.delete(m.id);
        return next;
      });
    });
  }, [messages]);

  const loadPartner = async () => {
    const { data } = await sb
      .from('profiles')
      .select('company_name,full_name,avatar_url')
      .eq('id', partnerId)
      .single();
    if (data) setPartner(data);
  };

  const loadMessages = async () => {
    if (!user) return;
    const { data } = await sb
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
    setLoading(false);
    await sb.from('messages')
      .update({ is_read: true })
      .eq('receiver_id', user.id)
      .eq('sender_id', partnerId)
      .eq('is_read', false);
  };

  // Supabase Realtime بدل الـ polling
  const subscribeRealtime = () => {
    if (channelRef.current) sb.removeChannel(channelRef.current);
    const channel = sb
      .channel(`chat-${user.id}-${partnerId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, async (payload) => {
        const msg = payload.new;
        if (msg.sender_id !== partnerId) return;
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        await sb.from('messages')
          .update({ is_read: true })
          .eq('id', msg.id);
      })
      .subscribe();
    channelRef.current = channel;
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);

    // إضافة الرسالة محلياً فوراً
    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: partnerId,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, tempMsg]);

    await sb.from('messages').insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content,
    });

    await sb.from('notifications').insert({
      user_id: partnerId,
      type: 'new_message',
      title_ar: 'رسالة جديدة من مَعبر',
      title_en: 'New message on Maabar',
      title_zh: '新消息',
      ref_id: user.id,
      is_read: false,
    });

    setSending(false);

    // تحديث الرسائل لاستبدال الـ temp
    loadMessages();
  };

  const fmtTime = (d) => new Date(d).toLocaleTimeString(
    isAr ? 'ar-SA' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  );

  const fmtDate = (d) => new Date(d).toLocaleDateString(
    isAr ? 'ar-SA' : 'en-US',
    { weekday: 'long', month: 'short', day: 'numeric' }
  );

  const partnerName = partner?.company_name || partner?.full_name || '—';
  let lastDate = '';

  // SKELETON
  if (loading) return (
    <div className="chat-wrap">
      <div className="chat-header">
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-hover)', animation: 'pulse 1.5s ease infinite' }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: 120, height: 14, background: 'var(--bg-hover)', borderRadius: 3, marginBottom: 6, animation: 'pulse 1.5s ease infinite' }} />
          <div style={{ width: 60, height: 10, background: 'var(--bg-hover)', borderRadius: 3, animation: 'pulse 1.5s ease infinite' }} />
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );

  return (
    <div className="chat-wrap">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      {/* HEADER */}
      <div className="chat-header">
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginInlineEnd: 8 }}
          onClick={() => nav('/inbox')}>←</button>
        <div className="avatar-sm">{partnerName[0]}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 500, fontSize: 15 }}>{partnerName}</p>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 1 }}>
            {isAr ? 'ترجمة تلقائية مفعّلة' : lang === 'zh' ? '自动翻译已启用' : 'Auto-translate on'}
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="chat-body" ref={bodyRef}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13, padding: 40 }}>
            {isAr ? 'ابدأ المحادثة' : lang === 'zh' ? '开始对话' : 'Start the conversation'}
          </div>
        )}

        {messages.map((m) => {
          const isMe = m.sender_id === user.id;
          const dateStr = fmtDate(m.created_at);
          const showDate = dateStr !== lastDate;
          lastDate = dateStr;
          const translation = !isMe ? translations[m.id] : null;
          const isTranslating = !isMe && translatingIds.has(m.id);

          return (
            <React.Fragment key={m.id}>
              {showDate && (
                <div className="chat-day-sep"><span>{dateStr}</span></div>
              )}
              <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                {/* الرسالة الأصلية */}
                <div>{m.content}</div>

                {/* الترجمة التلقائية — للرسائل الواردة فقط */}
                {!isMe && (
                  <div style={{
                    marginTop: 6,
                    paddingTop: 6,
                    borderTop: '1px solid var(--border-subtle)',
                  }}>
                    {isTranslating ? (
                      <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontStyle: 'italic', animation: 'pulse 1s ease infinite' }}>
                        {isAr ? 'جاري الترجمة...' : lang === 'zh' ? '翻译中...' : 'Translating...'}
                      </p>
                    ) : translation ? (
                      <p style={{
                        fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5,
                        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-body)',
                        fontStyle: 'italic',
                      }}>
                        {translation}
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="bubble-time">{fmtTime(m.created_at)}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* INPUT */}
      <div className="chat-footer">
        <input
          className="chat-input"
          placeholder={isAr ? 'اكتب رسالة...' : lang === 'zh' ? '输入消息...' : 'Type a message...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !sending && sendMessage()}
          dir={isAr ? 'rtl' : 'ltr'}
        />
        <button className="chat-send" onClick={sendMessage} disabled={sending}>
          <svg viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}