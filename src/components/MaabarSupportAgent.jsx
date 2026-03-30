import React, { useMemo, useRef, useState, useEffect } from 'react';
import { requestSupportReply } from '../lib/maabarAi/client';
import {
  MAABAR_AI_PERSONA_NAME,
  MAABAR_AI_SUPPORT_CHANNELS,
  MAABAR_AI_SUPPORT_PROMISE,
  getSaudiRepresentativeIntro,
  getSessionSaudiRepresentative,
} from '../lib/maabarAi/config';

const COPY = {
  ar: {
    badge: 'دعم معبر 24/7',
    title: 'وكيل الدعم',
    subtitle: 'اسأل عن الحسابات، الطلبات، المدفوعات، الموردين، الشحن، أو الترجمة التجارية.',
    placeholder: 'اكتب سؤالك هنا...',
    send: 'إرسال',
    thinking: 'جاري تجهيز الرد...',
    welcome: 'أنا موجود 24/7 لمساعدتك في الحسابات، الطلبات، الدفع، الموردين، الشحن، والترجمة التجارية داخل المنصة.',
    quickLabel: 'أسئلة سريعة',
    quickActions: [
      'عندي مشكلة في تسجيل الدخول',
      'أبغى أعرف حالة طلبي',
      'كيف أحمي الدفع في الصفقة؟',
      'كيف أبدأ التفاوض مع مورد؟',
    ],
    escalateEmail: 'راسل الدعم',
    escalateWhatsapp: 'واتساب الدعم',
    suggestions: 'خطوات مقترحة',
    emptySuggestions: 'إذا احتجت تصعيد يدوي، تواصل مباشرة مع فريق معبر.',
  },
  en: {
    badge: 'Maabar Support 24/7',
    title: 'Support Agent',
    subtitle: 'Ask about accounts, orders, payments, suppliers, shipping, or trade translation.',
    placeholder: 'Type your question...',
    send: 'Send',
    thinking: 'Preparing a reply...',
    welcome: 'I am available 24/7 to help with accounts, orders, payments, suppliers, shipping, and trade translation inside the platform.',
    quickLabel: 'Quick questions',
    quickActions: [
      'I have a login problem',
      'I want to know my order status',
      'How is payment protected on Maabar?',
      'How do I start negotiating with a supplier?',
    ],
    escalateEmail: 'Email support',
    escalateWhatsapp: 'Support WhatsApp',
    suggestions: 'Suggested actions',
    emptySuggestions: 'If you need manual escalation, contact the Maabar team directly.',
  },
  zh: {
    badge: 'Maabar 24/7 支持',
    title: '支持助手',
    subtitle: '可咨询账户、订单、付款、供应商、物流与商务翻译问题。',
    placeholder: '请输入您的问题...',
    send: '发送',
    thinking: '正在准备回复...',
    welcome: '我 24/7 在线，可协助处理平台内的账户、订单、付款、供应商、物流与商务翻译问题。',
    quickLabel: '快捷问题',
    quickActions: [
      '我登录时遇到问题',
      '我想查看订单状态',
      'Maabar 如何保障付款？',
      '我该如何开始和供应商谈判？',
    ],
    escalateEmail: '邮件联系支持',
    escalateWhatsapp: 'WhatsApp 支持',
    suggestions: '建议步骤',
    emptySuggestions: '如果需要人工升级，请直接联系 Maabar 团队。',
  },
};

function SupportBubble({ role, children, lang }) {
  const isUser = role === 'user';
  const isAr = lang === 'ar';

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{
        maxWidth: '88%',
        padding: '14px 16px',
        borderRadius: 16,
        background: isUser ? 'rgba(255,255,255,0.9)' : 'var(--bg-raised)',
        color: isUser ? '#111' : 'var(--text-primary)',
        border: '1px solid var(--border-subtle)',
        fontSize: 13,
        lineHeight: 1.8,
        whiteSpace: 'pre-wrap',
        fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
      }}>
        {children}
      </div>
    </div>
  );
}

export function MaabarSupportAgent({ lang = 'ar', user, profile, compact = false }) {
  const t = COPY[lang] || COPY.ar;
  const isAr = lang === 'ar';
  const representative = getSessionSaudiRepresentative();
  const introMessage = `${getSaudiRepresentativeIntro(lang)} ${t.welcome}`;
  const bodyRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: introMessage,
      suggestions: [],
      escalate: false,
    },
  ]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    setMessages((current) => current.map((message, index) => (
      index === 0 && message.id === 'welcome'
        ? { ...message, content: introMessage }
        : message
    )));
  }, [introMessage]);

  const supportSummary = useMemo(() => MAABAR_AI_SUPPORT_PROMISE[lang] || MAABAR_AI_SUPPORT_PROMISE.ar, [lang]);

  async function sendMessage(messageText) {
    const text = (messageText || draft).trim();
    if (!text || loading) return;

    const conversation = messages
      .filter((message) => message.id !== 'welcome')
      .map((message) => ({ role: message.role, content: message.content }));

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setLoading(true);

    try {
      const result = await requestSupportReply({
        language: lang,
        conversation,
        userMessage: text,
        userProfile: {
          email: user?.email || '',
          role: profile?.role || '',
          companyName: profile?.company_name || '',
          fullName: profile?.full_name || '',
          representativeName: representative.name,
        },
      });

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: result.reply,
          suggestions: result.suggestedActions || [],
          escalate: !!result.escalate,
        },
      ]);
    } catch (_error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: supportSummary,
          suggestions: [],
          escalate: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: compact ? '100%' : 980,
      margin: '0 auto',
      display: 'grid',
      gridTemplateColumns: compact ? '1fr' : 'minmax(260px, 320px) minmax(0, 1fr)',
      gap: 20,
      alignItems: 'start',
    }}>
      <aside style={{
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        padding: 22,
      }}>
        <p style={{
          fontSize: 11,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--text-disabled)',
          marginBottom: 10,
        }}>
          {t.badge}
        </p>
        <h2 style={{
          fontSize: 28,
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: 10,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {`${representative.name} · ${MAABAR_AI_PERSONA_NAME}`}
        </h2>
        <p style={{
          fontSize: 14,
          lineHeight: 1.8,
          color: 'var(--text-secondary)',
          marginBottom: 14,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {t.subtitle}
        </p>
        <div style={{
          padding: '14px 16px',
          borderRadius: 14,
          border: '1px solid rgba(139,120,255,0.16)',
          background: 'rgba(139,120,255,0.06)',
          color: 'var(--text-secondary)',
          fontSize: 13,
          lineHeight: 1.8,
          marginBottom: 18,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
        }}>
          {supportSummary}
        </div>

        <p style={{
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: 'var(--text-disabled)',
          marginBottom: 10,
        }}>
          {t.quickLabel}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
          {t.quickActions.map((action) => (
            <button
              key={action}
              onClick={() => sendMessage(action)}
              style={{
                textAlign: isAr ? 'right' : 'left',
                border: '1px solid var(--border-subtle)',
                background: 'transparent',
                color: 'var(--text-primary)',
                borderRadius: 12,
                padding: '12px 14px',
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              }}
            >
              {action}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <a
            href={`mailto:${MAABAR_AI_SUPPORT_CHANNELS.email}`}
            style={{
              textDecoration: 'none',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              padding: '12px 14px',
              borderRadius: 12,
              fontSize: 13,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}
          >
            {t.escalateEmail}
          </a>
          <a
            href={MAABAR_AI_SUPPORT_CHANNELS.whatsapp}
            target="_blank"
            rel="noreferrer"
            style={{
              textDecoration: 'none',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              padding: '12px 14px',
              borderRadius: 12,
              fontSize: 13,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}
          >
            {t.escalateWhatsapp}
          </a>
        </div>
      </aside>

      <section style={{
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-lg)',
        minHeight: compact ? 520 : 680,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <div style={{
          padding: '18px 20px',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-raised)',
        }}>
          <p style={{
            fontSize: 14,
            color: 'var(--text-primary)',
            fontWeight: 500,
            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          }}>
            {t.title}
          </p>
        </div>

        <div
          ref={bodyRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 18,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            direction: isAr ? 'rtl' : 'ltr',
          }}
        >
          {messages.map((message) => (
            <div key={message.id}>
              <SupportBubble role={message.role} lang={lang}>
                {message.content}
              </SupportBubble>

              {message.role === 'assistant' && (message.suggestions?.length > 0 || message.escalate) && (
                <div style={{
                  marginTop: 8,
                  paddingInline: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <p style={{
                    fontSize: 10,
                    letterSpacing: 2,
                    textTransform: 'uppercase',
                    color: 'var(--text-disabled)',
                  }}>
                    {t.suggestions}
                  </p>
                  {message.suggestions?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {message.suggestions.map((suggestion, index) => (
                        <div
                          key={`${message.id}-${index}`}
                          style={{
                            border: '1px solid var(--border-subtle)',
                            background: 'var(--bg-raised)',
                            borderRadius: 12,
                            padding: '10px 12px',
                            fontSize: 12,
                            color: 'var(--text-secondary)',
                            lineHeight: 1.7,
                            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                      fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                    }}>
                      {t.emptySuggestions}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <SupportBubble role="assistant" lang={lang}>
              {t.thinking}
            </SupportBubble>
          )}
        </div>

        <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-raised)' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              rows={2}
              placeholder={t.placeholder}
              style={{
                flex: 1,
                resize: 'none',
                borderRadius: 14,
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-base)',
                color: 'var(--text-primary)',
                padding: '13px 14px',
                outline: 'none',
                fontSize: 14,
                lineHeight: 1.7,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                direction: isAr ? 'rtl' : 'ltr',
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!draft.trim() || loading}
              style={{
                minWidth: 110,
                border: 'none',
                borderRadius: 14,
                padding: '14px 16px',
                background: !draft.trim() || loading ? 'var(--bg-muted)' : 'rgba(255,255,255,0.9)',
                color: !draft.trim() || loading ? 'var(--text-disabled)' : '#111',
                cursor: !draft.trim() || loading ? 'default' : 'pointer',
                fontWeight: 600,
                fontSize: 13,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              }}
            >
              {t.send}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
