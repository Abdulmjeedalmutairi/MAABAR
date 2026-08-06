import React, { useEffect, useMemo, useState } from 'react';
import { fetchFactory } from '../../lib/catalogImport';

const nf = (v) => (v && v !== 'not_found' ? String(v).trim() : '');
const digits = (v) => (v || '').replace(/[^\d]/g, '');

// Supplier-facing invitation templates (EN default + 中文). {vars} are filled from
// the factory + optional request context. All CTAs point at the /claim link so the
// factory lands on its prepared page.
const TEMPLATES = [
  { key: 'new_message', ar: 'رسالة جديدة', en: 'New message', zh: '新消息' },
  { key: 'quote', ar: 'طلب تسعير', en: 'Quotation request', zh: '报价请求' },
  { key: 'discover', ar: 'اجذب المشترين', en: 'Get discovered', zh: '吸引买家' },
  { key: 'complete', ar: 'إكمال الملف', en: 'Complete profile', zh: '完善资料' },
  { key: 'reminder', ar: 'تذكير', en: 'Reminder', zh: '提醒' },
  { key: 'catalog', ar: 'رفع كتالوج', en: 'Catalog uploaded', zh: '目录已上传' },
];

// Templates are claim-aware: v.reg = the factory already has an account, so the
// CTA (v.cta) points at their dashboard and the wording says "reply now / manage";
// otherwise it points at the /claim link and says "claim your page".
const BODY = {
  en: {
    new_message: (v) => v.reg
      ? `Hi ${v.factory},\n\nYou have a new message from a Saudi buyer on MAABAR. Open your dashboard to reply:\n${v.cta}\n\nMAABAR`
      : `Hi ${v.factory},\n\nA Saudi buyer on MAABAR is interested in your products. Your factory page is already prepared — claim it to reply and receive orders:\n${v.cta}\n\nMAABAR — your bridge to Saudi buyers.`,
    quote: (v) => `Hi ${v.factory},\n\nYou have a new quote request from a Saudi buyer:\n• Product: ${v.product || '-'}\n• Quantity: ${v.qty || '-'}\n\n${v.reg ? 'Open your dashboard to reply now:' : 'Reply directly from your ready factory page:'}\n${v.cta}\n\nMAABAR`,
    discover: (v) => v.reg
      ? `Hi ${v.factory},\n\nYour factory page is live on MAABAR. Add your best products and photos so Saudi buyers can find and request you — factories with complete pages get more requests:\n${v.cta}\n\nMAABAR`
      : `Hi ${v.factory},\n\nClaim your ready factory page on MAABAR and add your products so Saudi buyers can find and request you:\n${v.cta}\n\nMAABAR`,
    complete: (v) => v.reg
      ? `Hi ${v.factory},\n\nComplete your MAABAR profile to attract more Saudi buyers — add products, photos and certifications:\n${v.cta}\n\nMAABAR`
      : `Hi ${v.factory},\n\nYour factory page is ready on MAABAR. Claim it and add a few details to attract Saudi buyers:\n${v.cta}\n\nMAABAR`,
    reminder: (v) => v.reg
      ? `Hi ${v.factory},\n\nA quick reminder — Saudi buyers are waiting for your reply on MAABAR. Open your dashboard to respond:\n${v.cta}\n\nMAABAR`
      : `Hi ${v.factory},\n\nA quick reminder — Saudi buyers are waiting on MAABAR. Claim your page to respond:\n${v.cta}\n\nMAABAR`,
    catalog: (v) => v.reg
      ? `Hi ${v.factory},\n\nYour catalog is live on MAABAR — your products are now visible to Saudi buyers. Manage it from your dashboard:\n${v.cta}\n\nMAABAR`
      : `Hi ${v.factory},\n\nWe've published your catalog on MAABAR — your products are now visible to Saudi buyers. Claim your page to manage it:\n${v.cta}\n\nMAABAR`,
  },
  zh: {
    new_message: (v) => v.reg
      ? `${v.factory} 您好，\n\n您在 MAABAR 收到一条来自沙特买家的新消息。请打开后台回复：\n${v.cta}\n\nMAABAR`
      : `${v.factory} 您好，\n\nMAABAR 上有沙特买家对您的产品感兴趣。您的工厂主页已准备就绪 — 认领即可回复并接收订单：\n${v.cta}\n\nMAABAR`,
    quote: (v) => `${v.factory} 您好，\n\n您收到一条来自沙特买家的报价请求：\n• 产品：${v.product || '-'}\n• 数量：${v.qty || '-'}\n\n${v.reg ? '请打开后台立即回复：' : '请从您的工厂主页直接回复：'}\n${v.cta}\n\nMAABAR`,
    discover: (v) => v.reg
      ? `${v.factory} 您好，\n\n您的工厂主页已在 MAABAR 上线。上传您的优质产品和照片，让沙特买家能找到并向您询价 — 资料完整的工厂会收到更多请求：\n${v.cta}\n\nMAABAR`
      : `${v.factory} 您好，\n\n认领您在 MAABAR 已准备好的工厂主页并上传产品，让沙特买家能找到您：\n${v.cta}\n\nMAABAR`,
    complete: (v) => v.reg
      ? `${v.factory} 您好，\n\n完善您的 MAABAR 资料以吸引更多沙特买家 — 添加产品、照片和认证：\n${v.cta}\n\nMAABAR`
      : `${v.factory} 您好，\n\n您的工厂主页已在 MAABAR 准备就绪。认领并补充信息以吸引沙特买家：\n${v.cta}\n\nMAABAR`,
    reminder: (v) => v.reg
      ? `${v.factory} 您好，\n\n温馨提醒 — 沙特买家正在 MAABAR 等待您的回复。请打开后台回应：\n${v.cta}\n\nMAABAR`
      : `${v.factory} 您好，\n\n温馨提醒 — 沙特买家正在 MAABAR 等待。认领主页即可回应：\n${v.cta}\n\nMAABAR`,
    catalog: (v) => v.reg
      ? `${v.factory} 您好，\n\n您的目录已在 MAABAR 上线 — 产品现已对沙特买家可见。请从后台管理：\n${v.cta}\n\nMAABAR`
      : `${v.factory} 您好，\n\n我们已在 MAABAR 发布您的目录 — 产品现已对沙特买家可见。认领主页即可管理：\n${v.cta}\n\nMAABAR`,
  },
};
const SUBJECT = {
  en: { new_message: 'A new message on MAABAR', quote: 'New quote request', discover: 'Get discovered by Saudi buyers', complete: 'Complete your MAABAR page', reminder: 'Buyers are waiting on MAABAR', catalog: 'Your catalog is live on MAABAR' },
  zh: { new_message: 'MAABAR 上有新消息', quote: '新报价请求', discover: '让沙特买家发现您', complete: '完善您的 MAABAR 主页', reminder: '买家正在 MAABAR 等待', catalog: '您的目录已上线 MAABAR' },
};

export default function InviteModal({ factoryId, request, isAr, onClose, flash }) {
  const [fac, setFac] = useState(null);
  const [tpl, setTpl] = useState(request ? 'quote' : 'new_message');
  const [msgLang, setMsgLang] = useState('en');
  const [text, setText] = useState('');

  useEffect(() => { fetchFactory(factoryId).then(setFac).catch(() => setFac(null)); }, [factoryId]);

  const vars = useMemo(() => {
    const origin = window.location.origin;
    const reg = !!fac?.linked_supplier_id;
    const claimLink = fac?.claim_slug ? `${origin}/claim/${fac.claim_slug}` : `${origin}/factory/${factoryId}`;
    return {
      factory: nf(fac?.company_name_latin) || nf(fac?.company_name) || 'there',
      reg,
      cta: reg ? `${origin}/dashboard` : claimLink,   // registered → their dashboard; else the claim link
      claimLink,
      publicLink: `${origin}/factory/${factoryId}`,
      product: request ? (isAr ? (nf(request.title_ar) || nf(request.title_en)) : (nf(request.title_en) || nf(request.title_ar))) : '',
      qty: request?.quantity || '',
    };
  }, [fac, factoryId, request, isAr]);

  useEffect(() => { if (fac) setText(BODY[msgLang][tpl](vars)); }, [fac, tpl, msgLang, vars]);

  const subject = fac ? SUBJECT[msgLang][tpl] : '';
  const phone = digits(fac?.phone);
  const email = nf(fac?.email);

  const openWa = () => { if (phone) window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank'); else flash?.(isAr ? 'لا رقم واتساب' : 'No WhatsApp number'); };
  const openMail = () => { if (email) window.open(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`); else flash?.(isAr ? 'لا إيميل' : 'No email'); };
  const copy = () => { try { navigator.clipboard.writeText(text); flash?.(isAr ? 'نُسخت الرسالة' : 'Message copied'); } catch { /* noop */ } };

  return (
    <div className="ac-modal-ov" onClick={onClose}>
      <div className="ac-modal" style={{ maxWidth: 560, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p className="ac-modal-title" style={{ margin: 0 }}>{isAr ? 'إرسال دعوة' : 'Send invitation'}</p>
          <div className="ac-langs" style={{ display: 'flex', gap: 4 }}>
            {['en', 'zh'].map((l) => <button key={l} className={`ac-chip${msgLang === l ? ' on' : ''}`} style={{ height: 28 }} onClick={() => setMsgLang(l)}>{l === 'en' ? 'EN' : '中文'}</button>)}
          </div>
        </div>

        <p className="ac-flabel" style={{ marginBottom: 6 }}>{isAr ? 'القالب' : 'Template'}</p>
        <div className="ac-chiprow" style={{ marginBottom: 14 }}>
          {TEMPLATES.map((t) => <button key={t.key} className={`ac-chip${tpl === t.key ? ' on' : ''}`} onClick={() => setTpl(t.key)}>{isAr ? t.ar : t.en}</button>)}
        </div>

        {!fac ? <div className="ac-skel" style={{ height: 140 }} /> : (
          <>
            <p style={{ fontSize: 11.5, color: 'var(--ac-faint)', margin: '0 0 8px' }}>
              {vars.reg
                ? (isAr ? '● مسجّل — الزر يوجّه للوحته' : '● Registered — CTA links to their dashboard')
                : (isAr ? '● غير مسجّل — الزر يوجّه لرابط المطالبة' : '● Not registered — CTA links to the claim page')}
            </p>
            <textarea className="ac-textarea" style={{ minHeight: 170, direction: 'ltr', textAlign: 'left' }} value={text} onChange={(e) => setText(e.target.value)} />
            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button className="ac-btn" onClick={copy}>{isAr ? 'نسخ' : 'Copy'}</button>
              <button className="ac-btn" onClick={openMail} disabled={!email} style={{ opacity: email ? 1 : 0.5 }}>{isAr ? 'إيميل' : 'Email'}</button>
              <button className="ac-btn ac-btn-primary" onClick={openWa} disabled={!phone} style={{ opacity: phone ? 1 : 0.5 }}>WhatsApp</button>
            </div>
            {!phone && !email && <p style={{ fontSize: 12, color: 'var(--ac-warn)', marginTop: 8 }}>{isAr ? 'لا يوجد هاتف أو إيميل لهذا المورّد — أضفه من تبويب الملف.' : 'No phone or email on file — add one in the Profile tab.'}</p>}
          </>
        )}
      </div>
    </div>
  );
}
