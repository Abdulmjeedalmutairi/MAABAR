import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { sb, SUPABASE_ANON_KEY, SUPABASE_FUNCTIONS_URL } from '../supabase';
import {
  getTranslationDirection,
  inferTranslationDirection,
} from '../lib/maabarAi/config';
import { translateChatMessage } from '../lib/maabarAi/client';
import { fetchProfileDirectoryByIds } from '../lib/profileVisibility';
import BrandedLoading from '../components/BrandedLoading';
import { fetchFactoryIdentity, fetchBuyerFactoryMessages, sendBuyerFactoryMessage, fetchOwnerFactoryMessages, sendOwnerFactoryMessage } from '../lib/factoryChat';
import ChatInvoiceComposer from '../components/ChatInvoiceComposer';
import ChatInvoiceCard from '../components/ChatInvoiceCard';

const SEND_EMAILS_URL = `${SUPABASE_FUNCTIONS_URL}/send-email`;
const STORAGE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/storage/v1/object/public/product-images/';

// Role-specific quick-reply templates (mirrors the mobile ChatScreen): a buyer
// asks sourcing questions; a supplier / factory owner answers with pricing/terms.
// The viewer's own role picks the set. English messages translate cleanly for the
// Chinese side via the chat's auto-translation.
const MSG_TEMPLATES = {
  buyer: {
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
  },
  supplier: {
    ar: [
      { label: 'السعر', msg: 'Our best unit price for this quantity is [price]. Larger quantities get a better rate.' },
      { label: 'MOQ', msg: 'Our minimum order quantity for this product is [MOQ]. We can be flexible on a first order.' },
      { label: 'العينة', msg: 'Yes, we can provide a sample. Sample cost is [cost] and it ships to Saudi Arabia in about [days] days.' },
      { label: 'الإنتاج', msg: 'Production lead time is about [days] days after the order is confirmed.' },
      { label: 'الشحن', msg: 'We ship to Saudi Arabia via [method]. Estimated delivery is about [days] days.' },
      { label: 'الدفع', msg: 'We accept payment through the Maabar platform: [x]% upfront and the balance on shipping.' },
    ],
    en: [
      { label: 'Price', msg: 'Our best unit price for this quantity is [price]. Larger quantities get a better rate.' },
      { label: 'MOQ', msg: 'Our minimum order quantity for this product is [MOQ]. We can be flexible on a first order.' },
      { label: 'Sample', msg: 'Yes, we can provide a sample. Sample cost is [cost] and it ships to Saudi Arabia in about [days] days.' },
      { label: 'Lead time', msg: 'Production lead time is about [days] days after the order is confirmed.' },
      { label: 'Shipping', msg: 'We ship to Saudi Arabia via [method]. Estimated delivery is about [days] days.' },
      { label: 'Payment', msg: 'We accept payment through the Maabar platform: [x]% upfront and the balance on shipping.' },
    ],
    zh: [
      { label: '价格', msg: '此数量的最优单价为 [price]。数量越大价格越优惠。' },
      { label: 'MOQ', msg: '该产品的最小起订量为 [MOQ]。首次订单我们可以灵活处理。' },
      { label: '样品', msg: '可以提供样品。样品费用为 [cost]，运到沙特约需 [days] 天。' },
      { label: '生产', msg: '订单确认后生产周期约为 [days] 天。' },
      { label: '运输', msg: '我们通过 [method] 运往沙特，预计约 [days] 天送达。' },
      { label: '付款', msg: '我们通过 Maabar 平台收款：[x]% 定金，余款发货前支付。' },
    ],
  },
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
  return content && (content.startsWith('[img:') || content.startsWith('[vid:') || content.startsWith('[pdf:') || content.startsWith('[invoice:'));
}

export default function Chat({ lang, user, profile }) {
  const { partnerId, factoryId, traderId } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  // Factory mode: the conversation target is a factory_directory row (which may
  // have no account yet), not a profile.
  //   • buyer view  — /chat/f/:factoryId            (talks to the factory)
  //   • owner view  — /chat/f/:factoryId/:traderId  (factory owner ↔ that buyer)
  const isFactory = !!factoryId;
  const isFactoryOwner = isFactory && !!traderId;
  const productRef = location.state?.product || null;
  // A supplier can issue a chat invoice to the counterpart buyer (direct chat or
  // the factory-owner view); the buyer is the conversation counterpart.
  const invoiceBuyerId = isFactoryOwner ? traderId : (isFactory ? null : partnerId);
  const canIssueInvoice = profile?.role === 'supplier' && !!invoiceBuyerId;
  const [messages, setMessages] = useState([]);
  const [partner, setPartner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [translations, setTranslations] = useState({});
  const [translatingIds, setTranslatingIds] = useState(new Set());
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showInvoiceComposer, setShowInvoiceComposer] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [chinaTime, setChinaTime] = useState('');
  const bodyRef = useRef(null);
  const channelRef = useRef(null);
  const fileRef = useRef(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const isAr = lang === 'ar';
  // Templates follow the VIEWER's role: a supplier / factory owner answering a
  // buyer gets the supplier reply set, not the buyer's sourcing questions.
  const myRole = profile?.role === 'supplier' ? 'supplier' : 'buyer';
  const templates = (MSG_TEMPLATES[myRole] || MSG_TEMPLATES.buyer)[lang] || (MSG_TEMPLATES[myRole] || MSG_TEMPLATES.buyer).ar;
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
  }, [partnerId, factoryId, traderId, user]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, translations]);

  // Load cached translations from DB when messages or direction changes
  useEffect(() => {
    if (!user || translationDirection === 'off' || !messages.length) return;
    const ids = messages
      .filter((m) => !String(m.id).startsWith('temp-') && m.sender_id !== user.id && m.message_type !== 'system')
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
        message.message_type !== 'system' &&
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
    if (isFactoryOwner) {
      // Owner view: the "partner" shown is the buyer (trader).
      const [data] = await fetchProfileDirectoryByIds(sb, [traderId]);
      if (data) setPartner(data);
      return;
    }
    if (isFactory) {
      // A factory has no profile; render its public identity. lang defaults to
      // 'zh' so the translation direction infers correctly (Chinese factory).
      const f = await fetchFactoryIdentity(factoryId);
      if (f) setPartner({
        id: f.id,
        company_name: f.company_name || f.company_name_latin,
        full_name: f.company_name_latin || f.company_name,
        avatar_url: f.profile_image,
        lang: 'zh',
        __factory: true,
      });
      return;
    }
    const [data] = await fetchProfileDirectoryByIds(sb, [partnerId]);
    if (data) setPartner(data);
  };

  const loadMessages = async () => {
    if (!user) return;
    if (isFactoryOwner) {
      const data = await fetchOwnerFactoryMessages(factoryId, traderId);
      setMessages(data);
      setLoading(false);
      // Mark the trader's messages read.
      await sb.from('messages')
        .update({ is_read: true })
        .eq('factory_id', factoryId)
        .eq('sender_id', traderId)
        .eq('is_read', false);
      window.dispatchEvent(new CustomEvent('maabar:messages-read'));
      return;
    }
    if (isFactory) {
      const data = await fetchBuyerFactoryMessages(factoryId, user.id);
      setMessages(data);
      setLoading(false);
      // Mark the factory's replies (receiver = me) read.
      await sb.from('messages')
        .update({ is_read: true })
        .eq('factory_id', factoryId)
        .eq('receiver_id', user.id)
        .eq('is_read', false);
      window.dispatchEvent(new CustomEvent('maabar:messages-read'));
      return;
    }
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
      .channel(`chat-${user.id}-${factoryId || partnerId}-${traderId || ''}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        // Owner view listens on the factory (inbound has receiver_id NULL);
        // everyone else listens on their own inbox.
        filter: isFactoryOwner ? `factory_id=eq.${factoryId}` : `receiver_id=eq.${user.id}`,
      }, async (payload) => {
        const message = payload.new;
        const relevant = isFactoryOwner
          ? (message.sender_id === traderId)          // a new message from this buyer
          : isFactory
            ? (message.factory_id === factoryId)      // the factory owner's reply
            : (message.sender_id === partnerId);      // this direct partner
        if (!relevant) return;
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

    if (isFactoryOwner) {
      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender_id: user.id, receiver_id: traderId, factory_id: factoryId,
        content: text, created_at: new Date().toISOString(), is_read: false,
      };
      setMessages((current) => [...current, tempMessage]);
      try { await sendOwnerFactoryMessage(factoryId, user.id, traderId, text); } catch (_e) { /* surfaced on reload */ }
      setSending(false);
      loadMessages();
      return;
    }

    if (isFactory) {
      const tempMessage = {
        id: `temp-${Date.now()}`,
        sender_id: user.id, receiver_id: null, factory_id: factoryId,
        content: text, created_at: new Date().toISOString(), is_read: false,
      };
      setMessages((current) => [...current, tempMessage]);
      try {
        // Attach the product card only to the first message of the thread.
        const includeProduct = productRef && messages.length === 0;
        await sendBuyerFactoryMessage(factoryId, user.id, text, includeProduct ? productRef : null);
      } catch (_e) { /* surfaced on reload */ }
      setSending(false);
      loadMessages();
      return;
    }

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
    if (content?.startsWith('[invoice:') && content.endsWith(']')) {
      return <ChatInvoiceCard invoiceId={content.slice(9, -1)} myId={user?.id} lang={lang} />;
    }
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
        {canIssueInvoice && (
          <button onClick={() => setShowInvoiceComposer(true)}
            style={{ alignSelf: 'center', background: 'none', border: '1px solid #0C6B5A', color: '#0C6B5A', borderRadius: 8, padding: '6px 10px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {isAr ? '🧾 فاتورة' : '🧾 Invoice'}
          </button>
        )}
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

          // System messages — centered label, content is a JSON {ar,en,zh}
          // payload set by the writer (e.g., DashboardBuyer cancel flow). No
          // bubble, no AI translation.
          if (message.message_type === 'system') {
            let systemText = '';
            try {
              const parsed = JSON.parse(message.content);
              if (parsed && typeof parsed === 'object') {
                systemText = parsed[lang] || parsed.en || parsed.ar || parsed.zh || '';
              } else {
                systemText = message.content || '';
              }
            } catch {
              systemText = message.content || '';
            }
            return (
              <React.Fragment key={message.id}>
                {showDate && (
                  <div className="chat-day-sep"><span>{dateStr}</span></div>
                )}
                <div style={{ textAlign: 'center', padding: '8px 16px', color: 'var(--text-secondary)', fontSize: 12, fontStyle: 'italic' }}>
                  {systemText}
                </div>
              </React.Fragment>
            );
          }

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

      {showInvoiceComposer && canIssueInvoice && (
        <ChatInvoiceComposer
          buyerId={invoiceBuyerId}
          lang={lang}
          onClose={() => setShowInvoiceComposer(false)}
          onIssued={(inv) => { setShowInvoiceComposer(false); sendMessage(`[invoice:${inv.id}]`); }}
        />
      )}
    </div>
  );
}
