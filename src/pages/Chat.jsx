import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb } from '../supabase';

const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy';
const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
const STORAGE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/product-images/';

// ترجمة ذكية بالسياق التجاري
const translateText = async (text, targetLang) => {
  const langNames = { ar: 'العربية', en: 'English', zh: '中文' };
  try {
    const res = await fetch(SUPABASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
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

const MSG_TEMPLATES = {
  ar: [
    { label: 'المنتج',  msg: 'Can you provide more details about this product? Specifications, materials, and available colors?' },
    { label: 'السعر',   msg: 'What is the price per unit for bulk orders? Can you offer a discount for larger quantities?' },
    { label: 'MOQ',     msg: 'What is the minimum order quantity? Is there flexibility for first orders?' },
    { label: 'العينة',  msg: 'Do you offer product samples? What is the sample cost and shipping time to Saudi Arabia?' },
    { label: 'الشحن',   msg: 'What shipping methods do you offer to Saudi Arabia? What is the estimated delivery time?' },
    { label: 'الدفع',   msg: 'What are your payment terms? Do you accept the Maabar platform payment system?' },
  ],
  en: [
    { label: 'Product',  msg: 'Can you provide more details about this product? Specifications, materials, and available colors?' },
    { label: 'Price',    msg: 'What is the price per unit for bulk orders? Can you offer a discount for larger quantities?' },
    { label: 'MOQ',      msg: 'What is the minimum order quantity? Is there flexibility for first orders?' },
    { label: 'Sample',   msg: 'Do you offer product samples? What is the sample cost and shipping time to Saudi Arabia?' },
    { label: 'Shipping', msg: 'What shipping methods do you offer to Saudi Arabia? What is the estimated delivery time?' },
    { label: 'Payment',  msg: 'What are your payment terms? Do you accept the Maabar platform payment system?' },
  ],
  zh: [
    { label: '产品',  msg: '能提供更多产品详情吗？规格、材料和可用颜色？' },
    { label: '价格',  msg: '批量订购的单价是多少？量大可以优惠吗？' },
    { label: 'MOQ',   msg: '最小起订量是多少？首次订单有灵活性吗？' },
    { label: '样品',  msg: '你们提供产品样品吗？样品费用和运到沙特的时间是多少？' },
    { label: '运输',  msg: '你们有哪些运到沙特的运输方式？预计到货时间是多少？' },
    { label: '付款',  msg: '付款条件是什么？接受Maabar平台支付系统吗？' },
  ],
};

export default function Chat({ lang, user }) {
  const { partnerId } = useParams();
  const nav = useNavigate();
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [translations, setTranslations] = useState({});
  const [translatingIds, setTranslatingIds] = useState(new Set());
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chinaTime, setChinaTime] = useState('');
  const bodyRef = useRef(null);
  const channelRef = useRef(null);
  const fileRef = useRef(null);
  const isAr = lang === 'ar';
  const templates = MSG_TEMPLATES[lang] || MSG_TEMPLATES.ar;

  // China time
  useEffect(() => {
    const update = () => {
      setChinaTime(new Date().toLocaleTimeString('en', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit', minute: '2-digit'
      }));
    };
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, []);

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
      !translatingIds.has(m.id) &&
      m.content && !m.content.startsWith('[img:') && !m.content.startsWith('[vid:') && !m.content.startsWith('[pdf:')
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
      .select('company_name,full_name,avatar_url,role')
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
    await sb.from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('type', 'new_message')
      .eq('is_read', false);
    window.dispatchEvent(new CustomEvent('maabar:messages-read'));
  };

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

  const sendMessage = async (content = null) => {
    const text = content || input.trim();
    if (!text || sending) return;
    if (!content) setInput('');
    setSending(true);

    const tempMsg = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: partnerId,
      content: text,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages(prev => [...prev, tempMsg]);

    await sb.from('messages').insert({
      sender_id: user.id,
      receiver_id: partnerId,
      content: text,
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

    try {
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          type: 'new_message',
          record: {
            recipient_id: partnerId,
            recipient_name: partner?.company_name || partner?.full_name || '',
            sender_id: user.id,
            sender_name: user.email?.split('@')[0] || '',
          },
        }),
      });
    } catch (e) { console.error('email error:', e); }

    setSending(false);
    loadMessages();
  };

  const uploadFile = async (file, type) => {
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      alert(isAr ? 'الحد الأقصى 50MB' : 'Max file size 50MB');
      return;
    }
    setUploading(true);
    setShowAttachMenu(false);
    const ext = file.name.split('.').pop();
    const path = `chat/${user.id}/${type}_${Date.now()}.${ext}`;
    const { error } = await sb.storage.from('product-images').upload(path, file, { upsert: true });
    setUploading(false);
    if (error) { alert(isAr ? 'فشل الرفع' : 'Upload failed'); return; }
    const url = STORAGE_URL + path;
    const prefix = type === 'image' ? '[img:' : type === 'video' ? '[vid:' : '[pdf:';
    await sendMessage(`${prefix}${url}]`);
  };

  const renderMessageContent = (content) => {
    if (content?.startsWith('[img:') && content.endsWith(']')) {
      const url = content.slice(5, -1);
      return <img src={url} alt="" style={{ maxWidth: 200, maxHeight: 200, borderRadius: 'var(--radius-md)', display: 'block', objectFit: 'cover' }} />;
    }
    if (content?.startsWith('[vid:') && content.endsWith(']')) {
      const url = content.slice(5, -1);
      return <video src={url} controls style={{ maxWidth: 240, borderRadius: 'var(--radius-md)', display: 'block' }} />;
    }
    if (content?.startsWith('[pdf:') && content.endsWith(']')) {
      const url = content.slice(5, -1);
      const name = url.split('/').pop();
      return (
        <a href={url} target="_blank" rel="noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: 'rgba(139,120,255,0.1)',
          border: '1px solid rgba(139,120,255,0.2)', borderRadius: 'var(--radius-md)',
          color: 'rgba(139,120,255,0.85)', fontSize: 12, textDecoration: 'none',
        }}>
          PDF: {name}
        </a>
      );
    }
    return <div>{content}</div>;
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
  const isNewChat = messages.length === 0;
  let lastDate = '';

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
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginInlineEnd: 8, color: 'var(--text-secondary)' }}
          onClick={() => nav('/inbox')}>←</button>
        <div className="avatar-sm">{partnerName[0]}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 500, fontSize: 15 }}>{partnerName}</p>
          <p style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>
            {isAr ? 'ترجمة تلقائية مفعّلة' : lang === 'zh' ? '自动翻译已启用' : 'Auto-translate on'}
            {chinaTime && (
              <span style={{ marginInlineStart: 10, opacity: 0.7 }}>
                {chinaTime} {isAr ? 'توقيت الصين' : lang === 'zh' ? '中国时间' : 'China time'}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* PROTECTION NOTICE */}
      <div style={{
        padding: '7px 16px',
        background: 'rgba(139,120,255,0.06)',
        border: '1px solid rgba(139,120,255,0.12)',
        borderRadius: 'var(--radius-md)',
        fontSize: 11, color: 'rgba(139,120,255,0.65)',
        textAlign: 'center', margin: '8px 16px',
        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
      }}>
        {isAr ? 'للحماية الكاملة — أتمّ صفقتك عبر معبر' : lang === 'zh' ? '获得完整保障 — 通过Maabar完成交易' : 'For full protection — complete your deal on Maabar'}
      </div>

      {/* MESSAGES */}
      <div className="chat-body" ref={bodyRef}>
        {/* Message templates — new chat only */}
        {isNewChat && (
          <div style={{ padding: '16px 0', textAlign: isAr ? 'right' : 'left' }}>
            <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-sans)' }}>
              {isAr ? 'رسائل جاهزة' : lang === 'zh' ? '快速模板' : 'Quick Templates'}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {templates.map((tpl, i) => (
                <button key={i} onClick={() => sendMessage(tpl.msg)} style={{
                  padding: '7px 14px', fontSize: 11, cursor: 'pointer',
                  background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
                  borderRadius: 20, color: 'var(--text-secondary)',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  {tpl.label}
                </button>
              ))}
            </div>
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
                {renderMessageContent(m.content)}

                {/* Auto translation — incoming only */}
                {!isMe && (m.content && !m.content.startsWith('[img:') && !m.content.startsWith('[vid:') && !m.content.startsWith('[pdf:')) && (
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                    {isTranslating ? (
                      <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontStyle: 'italic', animation: 'pulse 1s ease infinite' }}>
                        {isAr ? 'جاري الترجمة...' : lang === 'zh' ? '翻译中...' : 'Translating...'}
                      </p>
                    ) : translation ? (
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', fontStyle: 'italic' }}>
                        {translation}
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="bubble-time" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <span>{fmtTime(m.created_at)}</span>
                  {isMe && (
                    <span style={{
                      fontSize: 9,
                      color: m.is_read ? 'var(--accent)' : 'var(--text-disabled)',
                      letterSpacing: -1,
                    }}>
                      {m.is_read ? '✓✓' : m.id?.startsWith('temp-') ? '✓' : '✓✓'}
                    </span>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {uploading && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-disabled)', fontSize: 12 }}>
            {isAr ? 'جاري رفع الملف...' : 'Uploading...'}
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="chat-footer" style={{ position: 'relative' }}>
        {/* Attach menu */}
        {showAttachMenu && (
          <div style={{
            position: 'absolute', bottom: '100%', left: isAr ? 'auto' : 8, right: isAr ? 8 : 'auto',
            marginBottom: 4, background: 'var(--bg-overlay)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
            overflow: 'hidden', zIndex: 10,
          }}>
            {[
              { label: isAr ? 'صورة' : 'Image', accept: 'image/*', type: 'image' },
              { label: isAr ? 'فيديو' : 'Video', accept: 'video/*', type: 'video' },
              { label: 'PDF', accept: '.pdf', type: 'pdf' },
            ].map((opt, i) => (
              <button key={i} onClick={() => {
                fileRef.current.accept = opt.accept;
                fileRef.current._uploadType = opt.type;
                fileRef.current.click();
              }} style={{
                display: 'block', width: '100%', padding: '10px 16px',
                background: 'none', border: 'none', textAlign: isAr ? 'right' : 'left',
                color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <input ref={fileRef} type="file" style={{ display: 'none' }}
          onChange={e => {
            const file = e.target.files[0];
            if (file) uploadFile(file, fileRef.current._uploadType || 'image');
            e.target.value = '';
          }}
        />

        {/* Attach button */}
        <button
          onClick={() => setShowAttachMenu(prev => !prev)}
          style={{
            background: 'none', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-disabled)',
            fontSize: 16, cursor: 'pointer', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-disabled)'; }}>
          +
        </button>

        <input
          className="chat-input"
          placeholder={isAr ? 'اكتب رسالة...' : lang === 'zh' ? '输入消息...' : 'Type a message...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !sending && sendMessage()}
          dir={isAr ? 'rtl' : 'ltr'}
        />
        <button className="chat-send" onClick={() => sendMessage()} disabled={sending}>
          <svg viewBox="0 0 24 24">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}
