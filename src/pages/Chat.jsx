import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sb, SUPABASE_ANON_KEY, SUPABASE_FUNCTIONS_URL } from '../supabase';
import {
  getTranslationDirection,
  inferTranslationDirection,
} from '../lib/maabarAi/config';
import { translateChatMessage } from '../lib/maabarAi/client';
import { fetchProfileDirectoryByIds } from '../lib/profileVisibility';
import BrandedLoading from '../components/BrandedLoading';

const SEND_EMAILS_URL = `${SUPABASE_FUNCTIONS_URL}/send-email`;
const STORAGE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/product-images/';

const MSG_TEMPLATES = {
  ar: [
    { label: 'المنتج', msg: 'Can you provide more details about this product? Specifications, materials, and available colors?' },
    { label: 'السعر', msg: 'What is the price per unit for bulk orders? Can you offer a discount for larger quantities?' },
    { label: 'MOQ', msg: 'What is the minimum order quantity? Is there flexibility for first orders?' },
    { label: 'العينة', msg: 'Do you offer product samples? What is the sample cost and shipping time to Saudi Arabia?' },
    { label: 'الشحن', msg: 'What shipping methods do you offer to Saudi Arabia? What is the estimated delivery time?' },
    { label: 'الدفع', msg: 'What are your payment terms? Do you accept the Maabar platform payment system?' },
  ],
  en: [
    { label: 'Product', msg: 'Can you provide more details about this product? Specifications, materials, and available colors?' },
    { label: 'Price', msg: 'What is the price per unit for bulk orders? Can you offer a discount for larger quantities?' },
    { label: 'MOQ', msg: 'What is the minimum order quantity? Is there flexibility for first orders?' },
    { label: 'Sample', msg: 'Do you offer product samples? What is the sample cost and shipping time to Saudi Arabia?' },
    { label: 'Shipping', msg: 'What shipping methods do you offer to Saudi Arabia? What is the estimated delivery time?' },
    { label: 'Payment', msg: 'What are your payment terms? Do you accept the Maabar platform payment system?' },
  ],
  zh: [
    { label: '产品', msg: '能提供更多产品详情吗？规格、材料和可用颜色？' },
    { label: '价格', msg: '批量订购的单价是多少？量大可以优惠吗？' },
    { label: 'MOQ', msg: '最小起订量是多少？首次订单有灵活性吗？' },
    { label: '样品', msg: '你们提供产品样品吗？样品费用和运到沙特的时间是多少？' },
    { label: '运输', msg: '你们有哪些运到沙特的运输方式？预计到货时间是多少？' },
    { label: '付款', msg: '付款条件是什么？接受Maabar平台支付系统吗？' },
  ],
};

const COPY = {
  ar: {
    translationLabel: 'اتجاه الترجمة',
    translating: 'جاري الترجمة...',
    inputPlaceholder: 'اكتب رسالة...',
    uploading: 'جاري رفع الملف...',
    attachImage: 'صورة',
    attachVideo: 'فيديو',
    quickTemplates: 'رسائل جاهزة',
    protection: 'للحماية الكاملة — أتمّ صفقتك عبر معبر',
    chinaTime: 'توقيت الصين',
  },
  en: {
    translationLabel: 'Translation direction',
    translating: 'Translating...',
    inputPlaceholder: 'Type a message...',
    uploading: 'Uploading...',
    attachImage: 'Image',
    attachVideo: 'Video',
    quickTemplates: 'Quick Templates',
    protection: 'For full protection — complete your deal on Maabar',
    chinaTime: 'China time',
  },
  zh: {
    translationLabel: '翻译方向',
    translating: '翻译中...',
    inputPlaceholder: '输入消息...',
    uploading: '正在上传文件...',
    attachImage: '图片',
    attachVideo: '视频',
    quickTemplates: '快捷模板',
    protection: '获得完整保障 — 通过 Maabar 完成交易',
    chinaTime: '中国时间',
  },
};

function isMediaMessage(content) {
  return content && (content.startsWith('[img:') || content.startsWith('[vid:') || content.startsWith('[pdf:'));
}

export default function Chat({ lang, user, profile }) {
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
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const isAr = lang === 'ar';
  const templates = MSG_TEMPLATES[lang] || MSG_TEMPLATES.ar;
  const t = COPY[lang] || COPY.ar;
  const translationDirection = useMemo(() => inferTranslationDirection(lang, partner?.lang), [lang, partner?.lang]);
  const selectedDirection = getTranslationDirection(translationDirection);

  useEffect(() => {
    const update = () => {
      setChinaTime(new Date().toLocaleTimeString('en', {
        timeZone: 'Asia/Shanghai',
        hour: '2-digit', minute: '2-digit'
      }));
    };
    update();
    const timer = setInterval(update, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isMobile) return undefined;

    const scrollY = window.scrollY;
    const htmlStyle = document.documentElement.style;
    const bodyStyle = document.body.style;
    const prevHtmlOverflow = htmlStyle.overflow;
    const prevBodyOverflow = bodyStyle.overflow;
    const prevBodyPosition = bodyStyle.position;
    const prevBodyTop = bodyStyle.top;
    const prevBodyWidth = bodyStyle.width;

    htmlStyle.overflow = 'hidden';
    bodyStyle.overflow = 'hidden';
    bodyStyle.position = 'fixed';
    bodyStyle.top = `-${scrollY}px`;
    bodyStyle.width = '100%';

    return () => {
      htmlStyle.overflow = prevHtmlOverflow;
      bodyStyle.overflow = prevBodyOverflow;
      bodyStyle.position = prevBodyPosition;
      bodyStyle.top = prevBodyTop;
      bodyStyle.width = prevBodyWidth;
      window.scrollTo(0, scrollY);
    };
  }, [isMobile]);

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
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, translations]);

  // Load cached translations from DB when messages or direction changes
  useEffect(() => {
    if (!user || translationDirection === 'off' || !messages.length) return;
    const ids = messages
      .filter((m) => !String(m.id).startsWith('temp-') && m.sender_id !== user.id)
      .map((m) => m.id);
    if (!ids.length) return;
    sb.from('message_translations')
      .select('message_id, translated_text')
      .eq('direction', translationDirection)
      .in('message_id', ids)
      .then(({ data }) => {
        if (!data?.length) return;
        setTranslations((current) => {
          const next = { ...current };
          data.forEach((row) => {
            next[`${translationDirection}:${row.message_id}`] = row.translated_text;
          });
          return next;
        });
      });
  }, [messages, translationDirection, user]);

  useEffect(() => {
    if (!user || translationDirection === 'off') return;

    const untranslated = messages.filter((message) => {
      const translationKey = `${translationDirection}:${message.id}`;
      return (
        message.sender_id !== user.id &&
        !translations[translationKey] &&
        !translatingIds.has(translationKey) &&
        message.content &&
        !isMediaMessage(message.content)
      );
    });

    if (untranslated.length === 0) return;

    untranslated.forEach(async (message) => {
      const translationKey = `${translationDirection}:${message.id}`;
      setTranslatingIds((current) => new Set(current).add(translationKey));
      try {
        const translated = await translateChatMessage({
          text: message.content,
          sourceLanguage: selectedDirection.source,
          targetLanguage: selectedDirection.target,
          conversationRole: 'trade_chat',
        });

        setTranslations((current) => ({
          ...current,
          [translationKey]: translated || message.content,
        }));
        // Persist to DB (fire-and-forget; skip temp- IDs)
        if (!String(message.id).startsWith('temp-')) {
          sb.from('message_translations').upsert({
            message_id: message.id,
            direction: translationDirection,
            translated_text: translated || message.content,
          }, { onConflict: 'message_id,direction' }).then(({ error: persistError }) => {
            if (persistError) console.error('[Chat] Failed to persist translation:', persistError.message);
          });
        }
      } catch (_error) {
        // silent fail — chat should continue without blocking
      }
      setTranslatingIds((current) => {
        const next = new Set(current);
        next.delete(translationKey);
        return next;
      });
    });
  }, [messages, selectedDirection.source, selectedDirection.target, translationDirection, translations, translatingIds, user]);

  const loadPartner = async () => {
    const [data] = await fetchProfileDirectoryByIds(sb, [partnerId]);
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
        const message = payload.new;
        if (message.sender_id !== partnerId) return;
        setMessages((current) => {
          if (current.find((item) => item.id === message.id)) return current;
          return [...current, message];
        });
        await sb.from('messages')
          .update({ is_read: true })
          .eq('id', message.id);
      })
      .subscribe();
    channelRef.current = channel;
  };

  const sendMessage = async (content = null) => {
    const text = content || input.trim();
    if (!text || sending) return;
    if (!content) setInput('');
    setSending(true);

    const tempMessage = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      receiver_id: partnerId,
      content: text,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setMessages((current) => [...current, tempMessage]);

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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'new_message',
          data: {
            recipientUserId: partnerId,
            senderId: user.id,
            senderName: profile?.company_name || profile?.full_name || user.email?.split('@')[0] || 'Maabar',
            preview: text.length > 80 ? `${text.slice(0, 80)}...` : text,
          },
        }),
      });
    } catch (error) {
      console.error('email error:', error);
    }

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
          padding: '8px 12px', background: 'var(--bg-subtle)',
          border: '1px solid rgba(0,0,0,0.08)', borderRadius: 'var(--radius-md)',
          color: 'var(--text-secondary)', fontSize: 12, textDecoration: 'none',
        }}>
          PDF: {name}
        </a>
      );
    }
    return <div>{content}</div>;
  };

  const fmtTime = (date) => new Date(date).toLocaleTimeString(
    isAr ? 'ar-SA-u-nu-latn' : 'en-US',
    { hour: '2-digit', minute: '2-digit' }
  );

  const fmtDate = (date) => new Date(date).toLocaleDateString(
    isAr ? 'ar-SA-u-nu-latn' : 'en-US',
    { weekday: 'long', month: 'short', day: 'numeric' }
  );

  const partnerName = partner?.company_name || partner?.full_name || '—';
  const isNewChat = messages.length === 0;
  let lastDate = '';

  if (loading) return (
    <div className="chat-wrap">
      <BrandedLoading lang={lang} tone="chat" />
    </div>
  );

  return (
    <div className="chat-wrap">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      <div className="chat-header" style={{ alignItems: 'flex-start' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, marginInlineEnd: 8, color: 'var(--text-secondary)' }}
          onClick={() => nav('/inbox')}>←</button>
        <div className="avatar-sm">{partnerName[0]}</div>
        <div style={{ flex: 1 }}>
          <p
            style={{ fontWeight: 500, fontSize: 15, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--border-subtle)' }}
            onClick={() => partner?.role === 'supplier' ? nav(`/supplier/${partnerId}`) : null}
          >
            {partnerName}
            {partner?.role === 'supplier' && (
              <span style={{ fontSize: 10, color: 'var(--text-disabled)', marginInlineStart: 6 }}>↗</span>
            )}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginTop: 6 }}>
            {chinaTime && (
              <span style={{ fontSize: 10, color: 'var(--text-secondary)', opacity: 0.7 }}>
                {chinaTime} {t.chinaTime}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{
        padding: '7px 16px',
        background: 'var(--bg-subtle)',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 'var(--radius-md)',
        fontSize: 11, color: 'var(--text-secondary)',
        textAlign: 'center', margin: '8px 16px',
        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
      }}>
        {t.protection}
      </div>

      <div className="chat-body" ref={bodyRef}>
        {isNewChat && (
          <div style={{ padding: '16px 0', textAlign: isAr ? 'right' : 'left' }}>
            <p style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10, fontFamily: 'var(--font-sans)' }}>
              {t.quickTemplates}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {templates.map((template, index) => (
                <button key={index} onClick={() => sendMessage(template.msg)} style={{
                  padding: '7px 14px', fontSize: 11, cursor: 'pointer',
                  background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)',
                  borderRadius: 20, color: 'var(--text-secondary)',
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  transition: 'all 0.15s',
                }}
                  onMouseEnter={event => { event.currentTarget.style.borderColor = 'var(--border-strong)'; event.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={event => { event.currentTarget.style.borderColor = 'var(--border-subtle)'; event.currentTarget.style.color = 'var(--text-secondary)'; }}>
                  {template.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => {
          const isMe = message.sender_id === user.id;
          const dateStr = fmtDate(message.created_at);
          const showDate = dateStr !== lastDate;
          lastDate = dateStr;
          const translationKey = `${translationDirection}:${message.id}`;
          const translation = !isMe && translationDirection !== 'off' ? translations[translationKey] : null;
          const isTranslating = !isMe && translatingIds.has(translationKey);

          return (
            <React.Fragment key={message.id}>
              {showDate && (
                <div className="chat-day-sep"><span>{dateStr}</span></div>
              )}
              <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-them'}`}>
                {renderMessageContent(message.content)}

                {!isMe && !isMediaMessage(message.content) && translationDirection !== 'off' && (
                  <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid var(--border-subtle)' }}>
                    {isTranslating ? (
                      <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontStyle: 'italic', animation: 'pulse 1s ease infinite' }}>
                        {t.translating}
                      </p>
                    ) : translation && translation !== message.content ? (
                      <p style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5, fontFamily: isAr ? 'var(--font-ar)' : 'inherit', fontStyle: 'italic' }}>
                        {translation}
                      </p>
                    ) : null}
                  </div>
                )}

                <div className="bubble-time" style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <span>{fmtTime(message.created_at)}</span>
                  {isMe && (
                    <span style={{
                      fontSize: 9,
                      color: message.is_read ? 'var(--accent)' : 'var(--text-disabled)',
                      letterSpacing: -1,
                    }}>
                      {message.is_read ? '✓✓' : message.id?.startsWith('temp-') ? '✓' : '✓✓'}
                    </span>
                  )}
                </div>
              </div>
            </React.Fragment>
          );
        })}

        {uploading && (
          <div style={{ textAlign: 'center', padding: '12px 0', color: 'var(--text-disabled)', fontSize: 12 }}>
            {t.uploading}
          </div>
        )}
      </div>

      <div className="chat-footer" style={{ position: 'relative' }}>
        {showAttachMenu && (
          <div style={{
            position: 'absolute', bottom: '100%', left: isAr ? 'auto' : 8, right: isAr ? 8 : 'auto',
            marginBottom: 4, background: 'var(--bg-overlay)',
            border: '1px solid var(--border-default)', borderRadius: 'var(--radius-lg)',
            overflow: 'hidden', zIndex: 10,
          }}>
            {[
              { label: t.attachImage, accept: 'image/*', type: 'image' },
              { label: t.attachVideo, accept: 'video/*', type: 'video' },
              { label: 'PDF', accept: '.pdf', type: 'pdf' },
            ].map((option, index) => (
              <button key={index} onClick={() => {
                fileRef.current.accept = option.accept;
                fileRef.current._uploadType = option.type;
                fileRef.current.click();
              }} style={{
                display: 'block', width: '100%', padding: '10px 16px',
                background: 'none', border: 'none', textAlign: isAr ? 'right' : 'left',
                color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer',
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                transition: 'background 0.1s',
              }}
                onMouseEnter={event => event.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={event => event.currentTarget.style.background = 'none'}>
                {option.label}
              </button>
            ))}
          </div>
        )}

        <input ref={fileRef} type="file" style={{ display: 'none' }}
          onChange={event => {
            const file = event.target.files[0];
            if (file) uploadFile(file, fileRef.current._uploadType || 'image');
            event.target.value = '';
          }}
        />

        <button
          onClick={() => setShowAttachMenu((current) => !current)}
          style={{
            background: 'none', border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)', color: 'var(--text-disabled)',
            fontSize: 16, cursor: 'pointer', width: 36, height: 36,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}
          onMouseEnter={event => { event.currentTarget.style.borderColor = 'var(--border-strong)'; event.currentTarget.style.color = 'var(--text-secondary)'; }}
          onMouseLeave={event => { event.currentTarget.style.borderColor = 'var(--border-subtle)'; event.currentTarget.style.color = 'var(--text-disabled)'; }}>
          +
        </button>

        <input
          className="chat-input"
          placeholder={t.inputPlaceholder}
          value={input}
          onChange={event => setInput(event.target.value)}
          onFocus={() => setTimeout(() => {
            if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
          }, 250)}
          onKeyDown={event => event.key === 'Enter' && !sending && sendMessage()}
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
