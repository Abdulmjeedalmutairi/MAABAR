import usePageTitle from '../hooks/usePageTitle';
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { sb } from '../supabase';
import {
  DISPLAY_CURRENCIES,
  DEFAULT_DISPLAY_CURRENCY,
  formatPriceWithConversion,
  normalizeDisplayCurrency,
} from '../lib/displayCurrency';
import { getPrimaryProductImage } from '../lib/productMedia';
import {
  getOfferEstimatedTotal,
  formatMoq,
  getOfferProductSubtotal,
  getOfferShippingCost,
  getOfferShippingMethod,
  hasOfferShippingCost,
} from '../lib/offerPricing';
import {
  buildSupplierTrustSignals,
  getSupplierMaabarId,
  isSupplierPubliclyVisible,
} from '../lib/supplierOnboarding';
import { shouldResumeIdeaFlow } from '../lib/ideaToProductFlow';
import { PRODUCT_TIER_EMBED, deriveProductPriceFrom } from '../lib/productPriceLookup';
import {
  attachDirectoryProfiles,
  attachSupplierProfiles,
} from '../lib/profileVisibility';
import {
  fetchProductInquiryThreads,
  getProductInquiryProductName,
  getProductInquiryStatusLabel,
} from '../lib/productInquiry';

const SEND_EMAILS_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/send-email';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';
import Footer from '../components/Footer';
import ManagedBuyerRequestPanel from '../components/ManagedBuyerRequestPanel';
import { isManagedRequest } from '../lib/managedSourcing';

const getTrackingUrl = (company, num) => {
  const urls = {
    'DHL':    `https://www.dhl.com/track?tracking-id=${num}`,
    'FedEx':  `https://www.fedex.com/tracking?tracknumbers=${num}`,
    'Aramex': `https://www.aramex.com/track/${num}`,
    'UPS':    `https://www.ups.com/track?tracknum=${num}`,
    'SMSA':   `https://www.smsaexpress.com/track?awbno=${num}`,
  };
  return urls[company] || `https://t.17track.net/en#nums=${num}`;
};

const STATUS_AR = { open: 'مرفوع', offers_received: 'عروض وصلت', closed: 'عرض مقبول', pending_supplier_confirmation: 'بانتظار تأكيد المورد', supplier_confirmed: 'المورد جاهز', supplier_rejected: 'رفض المورد الطلب', paid: 'تم الدفع', ready_to_ship: 'الشحنة جاهزة', shipping: 'قيد الشحن', arrived: 'وصل السعودية', delivered: 'تم التسليم' };
const STATUS_EN = { open: 'Posted', offers_received: 'Offers In', closed: 'Accepted', pending_supplier_confirmation: 'Awaiting Supplier', supplier_confirmed: 'Supplier Ready', supplier_rejected: 'Supplier Declined', paid: 'Paid', ready_to_ship: 'Ready to Ship', shipping: 'Shipping', arrived: 'Arrived', delivered: 'Delivered' };
const STATUS_STEPS = ['open', 'offers_received', 'closed', 'supplier_confirmed', 'paid', 'ready_to_ship', 'shipping', 'arrived', 'delivered'];

const CITIES_AR = ['الرياض', 'جدة', 'مكة المكرمة', 'المدينة المنورة', 'الدمام', 'الخبر', 'تبوك', 'أبها', 'القصيم', 'حائل', 'جازان', 'نجران'];
const CITIES_EN = ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Abha', 'Qassim', 'Hail', 'Jazan', 'Najran'];

/* ─── Status Bar ─────────────────────────── */
function StatusBar({ status, isAr }) {
  const idx     = STATUS_STEPS.indexOf(status);
  const current = idx === -1 ? 0 : idx;
  const label   = isAr ? (STATUS_AR[status] || STATUS_AR.open) : (STATUS_EN[status] || STATUS_EN.open);
  return (
    <div style={{ margin: '12px 0 8px' }}>
      <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
        {STATUS_STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 2,
            background: i <= current ? 'var(--text-tertiary)' : 'var(--border-subtle)',
            borderRadius: 1, transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <p style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 500, letterSpacing: 1.5, textTransform: 'uppercase' }}>
        {label}
      </p>
    </div>
  );
}

/* ─── Stat Card ──────────────────────────── */
function StatCard({ label, value, onClick, highlight }) {
  return (
    <div onClick={onClick} style={{
      background: highlight ? 'var(--bg-raised)' : 'var(--bg-subtle)',
      border: `1px solid ${highlight ? 'var(--border-muted)' : 'var(--border-subtle)'}`,
      padding: '24px 28px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      borderRadius: 'var(--radius-lg)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = highlight ? 'var(--bg-raised)' : 'var(--bg-subtle)'}>
      <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 16, fontWeight: 500 }}>
        {label}
      </p>
      <p style={{ fontSize: 44, fontWeight: 300, color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1, letterSpacing: -1.5, fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>
        {value}
      </p>
    </div>
  );
}

/* ─── relativeTime ───────────────────────── */
function relativeTime(dateStr, isAr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (isAr) {
    if (mins < 1)  return 'الآن';
    if (mins < 60) return `منذ ${mins} د`;
    if (hrs < 24)  return `منذ ${hrs} س`;
    if (days < 30) return `منذ ${days} يوم`;
    return new Date(dateStr).toLocaleDateString('ar-SA-u-nu-latn', { month: 'short', day: 'numeric' });
  }
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24)  return `${hrs}h ago`;
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─── StatusTimeline ─────────────────────── */
const TIMELINE_STEPS = [
  { key: 'posted',    ar: 'رفع الطلب',     en: 'Posted'     },
  { key: 'accepted',  ar: 'قبول العرض',    en: 'Accepted'   },
  { key: 'paid',      ar: 'الدفعة الأولى', en: '1st Payment' },
  { key: 'producing', ar: 'الإنتاج',       en: 'Production' },
  { key: 'shipping',  ar: 'الشحن',         en: 'Shipping'   },
  { key: 'received',  ar: 'الاستلام',      en: 'Received'   },
];

function timelineIndexFromStatus(status) {
  const map = {
    open: 0, offers_received: 0,
    closed: 1, supplier_confirmed: 1,
    paid: 2,
    ready_to_ship: 3,
    shipping: 4,
    arrived: 5, delivered: 5,
  };
  return map[status] ?? 0;
}

function StatusTimeline({ status, isAr }) {
  const current = timelineIndexFromStatus(status);
  return (
    <div style={{ overflowX: 'auto', margin: '12px 0 4px', paddingBottom: 2 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', minWidth: 360, position: 'relative' }}>
        {/* connector track */}
        <div style={{ position: 'absolute', top: 7, left: 7, right: 7, height: 1, background: 'var(--border-subtle)', zIndex: 0 }} />
        <div style={{ position: 'absolute', top: 7, left: 7, height: 1, zIndex: 0, background: 'rgba(90,154,114,0.55)', width: `calc(${(current / (TIMELINE_STEPS.length - 1)) * 100}% - 14px)`, transition: 'width 0.4s ease' }} />
        {TIMELINE_STEPS.map((step, i) => {
          const done    = i < current;
          const active  = i === current;
          const future  = i > current;
          return (
            <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{
                width: 14, height: 14, borderRadius: '50%', marginBottom: 6, flexShrink: 0,
                background: done ? 'rgba(90,154,114,0.7)' : active ? 'var(--text-primary)' : 'var(--bg-raised)',
                border: active ? '2px solid var(--text-primary)' : done ? '2px solid rgba(90,154,114,0.7)' : '2px solid var(--border-default)',
                boxShadow: active ? '0 0 0 3px rgba(26,24,20,0.12)' : 'none',
                transition: 'all 0.3s',
              }} />
              <p style={{
                fontSize: 9, lineHeight: 1.3, textAlign: 'center',
                color: done ? 'rgba(90,154,114,0.9)' : active ? 'var(--text-primary)' : 'var(--text-disabled)',
                fontWeight: active ? 600 : 400,
                fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                whiteSpace: 'nowrap',
              }}>
                {isAr ? step.ar : step.en}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── PaymentBadge ───────────────────────── */
function PaymentBadge({ label, amount, currency, badgeState, isAr }) {
  const colors = {
    paid:    { bg: 'rgba(90,154,114,0.07)', border: 'rgba(90,154,114,0.3)',  text: '#5a9a72' },
    due:     { bg: 'rgba(180,120,30,0.07)', border: 'rgba(180,120,30,0.3)',  text: '#b4781e' },
    pending: { bg: 'var(--bg-subtle)',       border: 'var(--border-subtle)',   text: 'var(--text-disabled)' },
  };
  const c = colors[badgeState] || colors.pending;
  return (
    <div style={{ padding: '7px 12px', borderRadius: 'var(--radius-md)', border: `1px solid ${c.border}`, background: c.bg, minWidth: 104 }}>
      <p style={{ fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: c.text, marginBottom: 4, fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: 16, fontWeight: 300, color: c.text, lineHeight: 1, fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>
        {amount > 0 ? Number(amount).toFixed(0) : '—'}
        <span style={{ fontSize: 9, marginInlineStart: 3, color: 'var(--text-disabled)' }}>{currency}</span>
      </p>
      {badgeState === 'paid'    && <p style={{ fontSize: 9, color: c.text, marginTop: 3 }}>✓ {isAr ? 'مدفوع' : 'Paid'}</p>}
      {badgeState === 'due'     && <p style={{ fontSize: 9, color: c.text, marginTop: 3 }}>{isAr ? 'مطلوبة الآن' : 'Due now'}</p>}
      {badgeState === 'pending' && <p style={{ fontSize: 9, color: 'var(--text-disabled)', marginTop: 3 }}>{isAr ? 'بعد الشحن' : 'After shipping'}</p>}
    </div>
  );
}

/* ─── PaymentPlanRow ─────────────────────── */
function PaymentPlanRow({ request, offer, isAr }) {
  if (!offer) return null;
  const showFrom = ['closed','supplier_confirmed','paid','ready_to_ship','shipping','arrived','delivered'];
  if (!showFrom.includes(request.status)) return null;

  const subtotal  = (offer.price || 0) * (Number(request.quantity) || 1);
  const shipping  = parseFloat(offer.shipping_cost) || 0;
  const total     = subtotal + shipping;
  const pct       = request.payment_pct > 0 ? request.payment_pct : 30;
  const firstAmt  = request.amount       > 0 ? request.amount       : parseFloat((total * pct / 100).toFixed(2));
  const secondAmt = request.payment_second > 0 ? request.payment_second : parseFloat((total * (100 - pct) / 100).toFixed(2));
  const currency  = offer.currency || 'USD';

  const isPaidFirst  = ['paid','ready_to_ship','shipping','arrived','delivered'].includes(request.status);
  const isPaidSecond = ['shipping','arrived','delivered'].includes(request.status) || !!request.payment_second_paid;
  const isDueSecond  = request.status === 'ready_to_ship';

  return (
    <div style={{ display: 'flex', gap: 8, margin: '10px 0', flexWrap: 'wrap' }}>
      <PaymentBadge
        label={isAr ? `دفعة أولى · ${pct}%` : `1st · ${pct}%`}
        amount={firstAmt}
        currency={currency}
        badgeState={isPaidFirst ? 'paid' : 'pending'}
        isAr={isAr}
      />
      <PaymentBadge
        label={isAr ? `دفعة ثانية · ${100 - pct}%` : `2nd · ${100 - pct}%`}
        amount={secondAmt}
        currency={currency}
        badgeState={isPaidSecond ? 'paid' : isDueSecond ? 'due' : 'pending'}
        isAr={isAr}
      />
    </div>
  );
}

/* ─── TrackingCard ───────────────────────── */
function TrackingCard({ request, isAr }) {
  if (!request.tracking_number) return null;
  const trackUrl = (() => {
    const n = request.tracking_number;
    const urls = { DHL: `https://www.dhl.com/track?tracking-id=${n}`, FedEx: `https://www.fedex.com/tracking?tracknumbers=${n}`, Aramex: `https://www.aramex.com/track/${n}`, UPS: `https://www.ups.com/track?tracknum=${n}`, SMSA: `https://www.smsaexpress.com/track?awbno=${n}` };
    return urls[request.shipping_company] || `https://t.17track.net/en#nums=${n}`;
  })();
  return (
    <div style={{ margin: '10px 0', padding: '10px 14px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          {request.shipping_company && (
            <span style={{ fontSize: 10, color: 'var(--text-disabled)', letterSpacing: 0.5, display: 'block', marginBottom: 2 }}>{request.shipping_company}</span>
          )}
          <span style={{ fontSize: 13, color: 'var(--text-primary)', fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1' }}>
            {request.tracking_number}
          </span>
          {request.estimated_delivery && (
            <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 3 }}>
              {isAr ? 'وصول متوقع: ' : 'ETA: '}
              {new Date(request.estimated_delivery).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US', { month: 'short', day: 'numeric' })}
            </p>
          )}
        </div>
        <a href={trackUrl} target="_blank" rel="noreferrer"
          style={{ fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 1.5, textTransform: 'uppercase', textDecoration: 'none', border: '1px solid var(--border-subtle)', padding: '5px 10px', borderRadius: 'var(--radius-md)', flexShrink: 0 }}>
          {isAr ? 'تتبع ←' : 'Track →'}
        </a>
      </div>
    </div>
  );
}

/* ─── PendingBanner ──────────────────────── */
function PendingBanner({ action, isAr, onGo }) {
  const styles = {
    supplier_confirmed: { border: 'rgba(90,154,114,0.35)',  bg: 'rgba(90,154,114,0.05)',  dot: '#5a9a72' },
    ready_to_ship:      { border: 'rgba(180,120,30,0.35)',  bg: 'rgba(180,120,30,0.05)',  dot: '#b4781e' },
    arrived:            { border: 'rgba(60,100,180,0.35)',  bg: 'rgba(60,100,180,0.04)',  dot: '#4a6bbf' },
    offers:             { border: 'var(--border-subtle)',   bg: 'var(--bg-subtle)',        dot: 'var(--text-disabled)' },
    managed_shortlist:  { border: 'var(--border-subtle)',   bg: 'var(--bg-subtle)',        dot: 'var(--text-disabled)' },
    messages:           { border: 'var(--border-subtle)',   bg: 'var(--bg-subtle)',        dot: 'var(--text-disabled)' },
    payment_sent:       { border: 'var(--border-subtle)',   bg: 'var(--bg-subtle)',        dot: 'var(--text-disabled)' },
    delivery:           { border: 'rgba(60,100,180,0.35)',  bg: 'rgba(60,100,180,0.04)',  dot: '#4a6bbf' },
  };
  const s = styles[action.type] || styles.offers;
  const title = (() => {
    if (action.type === 'supplier_confirmed') return isAr ? `المورد جاهز — ادفع الآن · ${action.request?.title_ar || action.request?.title_en}` : `Supplier ready — pay now · ${action.request?.title_en || action.request?.title_ar}`;
    if (action.type === 'ready_to_ship')      return isAr ? `الشحنة جاهزة — ادفع الدفعة الثانية · ${action.request?.title_ar || action.request?.title_en}` : `Shipment ready — pay 2nd installment · ${action.request?.title_en || action.request?.title_ar}`;
    if (action.type === 'arrived')            return isAr ? `وصل الطلب — أكد الاستلام · ${action.request?.title_ar || action.request?.title_en}` : `Order arrived — confirm delivery · ${action.request?.title_en || action.request?.title_ar}`;
    if (action.type === 'offers')             return isAr ? `${action.count} عرض ينتظرك — ${action.request?.title_ar || action.request?.title_en}` : `${action.count} offer(s) waiting — ${action.request?.title_en || action.request?.title_ar}`;
    if (action.type === 'managed_shortlist')  return isAr ? `العروض المختارة جاهزة — ${action.request?.title_ar || action.request?.title_en}` : `Selected offers ready — ${action.request?.title_en || action.request?.title_ar}`;
    if (action.type === 'payment_sent')       return isAr ? 'تم الدفع — في انتظار تجهيز المورد' : 'Payment sent — Awaiting preparation';
    if (action.type === 'delivery')           return isAr ? `تأكيد الاستلام — ${action.request?.title_ar || action.request?.title_en}` : `Confirm delivery — ${action.request?.title_en || action.request?.title_ar}`;
    if (action.type === 'messages')           return isAr ? `${action.count} رسالة غير مقروءة` : `${action.count} unread message(s)`;
    return '';
  })();
  return (
    <div onClick={onGo} style={{
      background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 'var(--radius-lg)', padding: '12px 16px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      cursor: 'pointer', transition: 'opacity 0.15s', gap: 10,
    }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.5 }}>{title}</p>
      </div>
      <span style={{ color: 'var(--text-disabled)', fontSize: 14, flexShrink: 0 }}>{isAr ? '←' : '→'}</span>
    </div>
  );
}

/* ─── TopSubTabs ─────────────────────────── */
function TopSubTabs({ tabs, active, onSelect, isAr }) {
  return (
    <div className="db-mobile-subtabs" style={{ gap: 6, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border-subtle)' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onSelect(t.id)} style={{
          padding: '5px 13px', borderRadius: 999,
          border: `1px solid ${active === t.id ? 'var(--text-primary)' : 'var(--border-subtle)'}`,
          background: active === t.id ? 'var(--text-primary)' : 'none',
          color: active === t.id ? 'var(--bg-base)' : 'var(--text-secondary)',
          fontSize: 12, cursor: 'pointer',
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          transition: 'all 0.15s',
        }}>
          {t.label}
          {t.badge != null && t.badge > 0 && (
            <span style={{ marginInlineStart: 5, fontSize: 10, opacity: 0.75 }}>{t.badge}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ─── MobileBottomNav ────────────────────── */
function MobileBottomNav({ activeTab, setActiveTab, nav, isAr, stats, moreOpen, setMoreOpen }) {
  const moreActive = ['direct-orders','samples','product-inquiries','settings'].includes(activeTab);
  const items = [
    { id: 'overview',  label: isAr ? 'الرئيسية' : 'Home'     },
    { id: 'requests',  label: isAr ? 'طلباتي'   : 'Requests' },
    { id: 'new',       label: isAr ? 'اطلب'     : 'New RFQ'  },
    { id: 'messages',  label: isAr ? 'الرسائل'  : 'Messages', badge: stats.messages > 0 ? stats.messages : null },
    { id: 'more',      label: isAr ? 'المزيد'   : 'More' },
  ];
  return (
    <nav className="db-bottom-nav" dir={isAr ? 'rtl' : 'ltr'}>
      {moreOpen && (
        <div onClick={() => setMoreOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 198, background: 'rgba(0,0,0,0.3)',
        }} />
      )}
      {moreOpen && (
        <div style={{
          position: 'fixed', bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
          left: 0, right: 0, zIndex: 199,
          background: 'var(--bg-overlay)',
          border: '1px solid var(--border-muted)',
          borderBottom: 'none',
          borderRadius: '16px 16px 0 0',
          padding: '16px 20px 8px',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.12)',
          animation: 'slideUp 0.2s ease',
        }}>
          {[
            { id: 'direct-orders',     label: isAr ? 'مشترياتي المباشرة' : 'My Direct Purchases' },
            { id: 'samples',           label: isAr ? 'العينات' : 'Samples' },
            { id: 'product-inquiries', label: isAr ? 'استفسارات المنتجات' : 'Product Inquiries' },
            { id: 'settings',          label: isAr ? 'الإعدادات' : 'Settings' },
          ].map((item, i, arr) => (
            <button key={item.id} onClick={() => { setActiveTab(item.id); setMoreOpen(false); }}
              style={{
                display: 'block', width: '100%',
                textAlign: isAr ? 'right' : 'left',
                padding: '13px 0', background: 'none', border: 'none',
                borderBottom: i < arr.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                color: activeTab === item.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontSize: 15, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                cursor: 'pointer', fontWeight: activeTab === item.id ? 600 : 400,
              }}>
              {item.label}
            </button>
          ))}
        </div>
      )}
      {items.map(item => {
        const isActive = item.id === 'more' ? moreActive : item.id === 'new' ? false : activeTab === item.id;
        return (
          <button key={item.id}
            onClick={() => {
              if (item.id === 'new')  { nav('/requests'); return; }
              if (item.id === 'more') { setMoreOpen(o => !o); return; }
              setActiveTab(item.id);
              setMoreOpen(false);
            }}
            style={{
              flex: 1, padding: '10px 4px 6px',
              background: 'none', border: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              cursor: 'pointer', position: 'relative',
              color: isActive ? 'var(--text-primary)' : 'var(--text-disabled)',
              transition: 'color 0.15s',
            }}>
            {item.badge && (
              <span style={{
                position: 'absolute', top: 6, insetInlineEnd: '18%',
                width: 14, height: 14, borderRadius: '50%',
                background: '#c0392b', color: '#fff',
                fontSize: 8, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{item.badge > 9 ? '9+' : item.badge}</span>
            )}
            <span style={{
              fontSize: 10, letterSpacing: 0.5,
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              fontWeight: isActive ? 600 : 400,
            }}>
              {item.label}
            </span>
            {isActive && <div style={{ width: 16, height: 2, background: 'var(--text-primary)', borderRadius: 1, marginTop: 1 }} />}
          </button>
        );
      })}
    </nav>
  );
}

/* ─── Quick Action ───────────────────────── */
function QuickAction({ title, sub, onClick, primary, isAr }) {
  return (
    <div onClick={onClick} style={{
      padding: '24px',
      background: primary ? 'var(--bg-raised)' : 'var(--bg-subtle)',
      border: `1px solid ${primary ? 'var(--border-muted)' : 'var(--border-subtle)'}`,
      cursor: 'pointer',
      transition: 'all 0.2s',
      borderRadius: 'var(--radius-lg)',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = primary ? 'var(--bg-raised)' : 'var(--bg-subtle)'}>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        {title}
      </p>
      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.6 }}>
        {sub}
      </p>
    </div>
  );
}

/* ─── Back Button ────────────────────────── */
function BackBtn({ onClick, isAr }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none',
      color: 'var(--text-disabled)', fontSize: 11,
      cursor: 'pointer', letterSpacing: 2,
      textTransform: 'uppercase',
      fontFamily: 'var(--font-sans)',
      padding: 0, marginBottom: 32,
      transition: 'color 0.2s',
    }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
      {isAr ? 'رجوع ←' : '← Back'}
    </button>
  );
}

/* ─── Main ───────────────────────────────── */
export default function DashboardBuyer({ user, profile, lang, displayCurrency, setDisplayCurrency, exchangeRates }) {
  const viewerCurrency = normalizeDisplayCurrency(displayCurrency || DEFAULT_DISPLAY_CURRENCY);
  const nav      = useNavigate();
  const location = useLocation();
  const isAr     = lang === 'ar';

  // Handle dashboard query params (tab focus / custom manufacturing resume)
  useEffect(() => {
    if (shouldResumeIdeaFlow(location.search)) {
      nav('/requests?flow=custom');
      return;
    }

    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
  }, [location.search, nav]);

  const [stats, setStats]                 = useState({ requests: 0, messages: 0, offers: 0, productInquiries: 0 });
  const [myRequests, setMyRequests]       = useState([]);
  const [inbox, setInbox]                 = useState([]);
  const [productInquiries, setProductInquiries] = useState([]);
  const [activeTab, setActiveTab]         = useState('overview');
  const [pendingActions, setPendingActions] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [samples, setSamples] = useState([]);
  const [directOrders, setDirectOrders] = useState([]);
  const [loadingDirectOrders, setLoadingDirectOrders] = useState(false);
  const [directOrderPaying, setDirectOrderPaying] = useState({});
  const [directOrderActioning, setDirectOrderActioning] = useState({});
  const focusedRequestId = new URLSearchParams(location.search).get('request');

  // Review modal
  const [reviewModal, setReviewModal]           = useState(null);
  const [reviewRating, setReviewRating]         = useState(0);
  const [reviewComment, setReviewComment]       = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittedReviewIds, setSubmittedReviewIds] = useState(new Set());

  // Active orders for overview (supplier_confirmed → arrived)
  const [activeOrders, setActiveOrders]         = useState([]);
  const [loadingActiveOrders, setLoadingActiveOrders] = useState(false);

  // Edit/Delete request
  const [editReqModal, setEditReqModal]   = useState(null);
  const [editReqForm, setEditReqForm]     = useState({});
  const [savingEditReq, setSavingEditReq] = useState(false);

  // Cancel request confirmation
  const [cancelConfirmReq, setCancelConfirmReq] = useState(null);

  // Sub-filters (mobile)
  const [reqSubFilter, setReqSubFilter] = useState('all');
  const [msgSubFilter, setMsgSubFilter] = useState('all');
  const [moreOpen, setMoreOpen]         = useState(false);

  // Settings
  const [settings, setSettings]         = useState({ full_name: '', phone: '', city: '', company_name: '', preferred_display_currency: displayCurrency || 'USD' });
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    if (!user) { nav('/login/buyer'); return; }
    loadStats();
    loadPendingActions();
    loadActiveOrders();
    loadMyDirectOrders();

    // Realtime — refresh when offers/requests change
    const channel = sb.channel(`buyer-dash-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offers' }, () => {
        loadStats(); loadPendingActions(); loadActiveOrders();
        if (activeTab === 'requests') loadMyRequests();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'requests', filter: `buyer_id=eq.${user.id}` }, () => {
        loadStats(); loadPendingActions(); loadActiveOrders(); loadMyDirectOrders();
        if (activeTab === 'requests') loadMyRequests();
      })
      .subscribe();
    return () => sb.removeChannel(channel);
  }, [user]);

  useEffect(() => {
    if (activeTab === 'overview') loadActiveOrders();
    if (activeTab === 'requests') loadMyRequests();
    if (activeTab === 'direct-orders') loadMyDirectOrders();
    if (activeTab === 'messages') loadInbox();
    if (activeTab === 'product-inquiries') loadProductInquiries();
    if (activeTab === 'samples') loadMySamples();
    if (activeTab === 'settings') loadSettings();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'requests' || !focusedRequestId || loadingRequests) return;
    const timer = window.setTimeout(() => {
      const el = document.querySelector(`[data-request-id="${String(focusedRequestId)}"]`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => window.clearTimeout(timer);
  }, [activeTab, focusedRequestId, loadingRequests, myRequests.length]);

  useEffect(() => {
    setSettings(prev => ({ ...prev, preferred_display_currency: displayCurrency || 'USD' }));
  }, [displayCurrency]);

  const loadStats = async () => {
    const { data: myReqIds } = await sb.from('requests').select('id').eq('buyer_id', user.id);
    const ids = myReqIds?.map(r => r.id) || [];
    const [requests, messages, offers, productInquiries] = await Promise.all([
      sb.from('requests').select('id', { count: 'exact' }).eq('buyer_id', user.id),
      sb.from('messages').select('id', { count: 'exact' }).eq('receiver_id', user.id).eq('is_read', false),
      ids.length > 0
        ? sb.from('offers').select('id', { count: 'exact' }).eq('status', 'pending').in('request_id', ids)
        : Promise.resolve({ count: 0 }),
      sb.from('product_inquiries').select('id', { count: 'exact' }).eq('buyer_id', user.id),
    ]);
    setStats({ requests: requests.count || 0, messages: messages.count || 0, offers: offers.count || 0, productInquiries: productInquiries.count || 0 });
  };

  const loadPendingActions = async () => {
    const actions = [];
    // Exclude direct purchase orders — they live in the dedicated direct-orders tab.
    const { data: reqs } = await sb.from('requests').select('*, offers(id,status)').eq('buyer_id', user.id).is('product_ref', null);
    if (reqs) {
      reqs.forEach(r => {
        const pending = r.offers?.filter(o => o.status === 'pending') || [];
        if (String(r.sourcing_mode || 'direct') === 'managed' && String(r.managed_status || '') === 'shortlist_ready') {
          actions.push({ type: 'managed_shortlist', request: r });
        } else if (pending.length > 0) {
          actions.push({ type: 'offers', request: r, count: pending.length });
        }
        if (r.status === 'supplier_confirmed') actions.push({ type: 'supplier_confirmed', request: r });
        if (r.status === 'paid')          actions.push({ type: 'payment_sent', request: r });
        if (r.status === 'ready_to_ship') actions.push({ type: 'ready_to_ship', request: r });
        if (r.status === 'shipping')      actions.push({ type: 'delivery', request: r });
        if (r.status === 'arrived')       actions.push({ type: 'arrived', request: r });
      });
    }
    const { data: msgs } = await sb.from('messages').select('id').eq('receiver_id', user.id).eq('is_read', false);
    if (msgs?.length > 0) actions.push({ type: 'messages', count: msgs.length });
    setPendingActions(actions);
  };

  const loadActiveOrders = async () => {
    setLoadingActiveOrders(true);
    const ACTIVE_STATUSES = ['supplier_confirmed', 'paid', 'ready_to_ship', 'shipping', 'arrived'];
    // Exclude direct purchase orders — they have their own dedicated tab.
    const { data: reqs } = await sb
      .from('requests')
      .select('*')
      .eq('buyer_id', user.id)
      .is('product_ref', null)
      .in('status', ACTIVE_STATUSES)
      .order('updated_at', { ascending: false })
      .limit(5);
    if (reqs && reqs.length > 0) {
      const withOffers = await Promise.all(reqs.map(async (r) => {
        const { data: offers } = await sb.from('offers').select('*').eq('request_id', r.id);
        const withProfiles = await attachSupplierProfiles(sb, offers || [], 'supplier_id', 'profiles');
        return { ...r, offers: withProfiles || [] };
      }));
      setActiveOrders(withOffers);
    } else {
      setActiveOrders([]);
    }
    setLoadingActiveOrders(false);
  };

  const loadMyRequests = async () => {
    setLoadingRequests(true);
    // Exclude direct purchase orders — they live in the dedicated direct-orders tab.
    const { data } = await sb.from('requests').select('*').eq('buyer_id', user.id).is('product_ref', null).order('created_at', { ascending: false });
    if (data) {
      const requestIds = data.map((request) => request.id);
      const managedRequestIds = data.filter((request) => isManagedRequest(request)).map((request) => request.id);

      const [briefsResult, shortlistResult, feedbackResult] = await Promise.all([
        managedRequestIds.length > 0
          ? sb.from('managed_request_briefs').select('*').in('request_id', managedRequestIds)
          : Promise.resolve({ data: [] }),
        managedRequestIds.length > 0
          ? sb.from('managed_shortlisted_offers').select('*').in('request_id', managedRequestIds).order('rank', { ascending: true })
          : Promise.resolve({ data: [] }),
        managedRequestIds.length > 0
          ? sb.from('managed_shortlist_feedback').select('*').in('request_id', managedRequestIds).order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);

      const shortlistWithProfiles = await attachSupplierProfiles(sb, shortlistResult.data || [], 'supplier_id', 'profiles');
      const shortlistByRequest = (shortlistWithProfiles || []).reduce((acc, offer) => {
        acc[offer.request_id] = [...(acc[offer.request_id] || []), offer];
        return acc;
      }, {});
      const briefByRequest = (briefsResult.data || []).reduce((acc, brief) => ({ ...acc, [brief.request_id]: brief }), {});
      const feedbackByRequest = (feedbackResult.data || []).reduce((acc, entry) => {
        acc[entry.request_id] = [...(acc[entry.request_id] || []), entry];
        return acc;
      }, {});

      // Fetch order_line_items for variant-based requests
      const { data: allLineItems } = requestIds.length
        ? await sb.from('order_line_items').select('*, product_variants(sku)').in('request_id', requestIds)
        : { data: [] };
      const linesByRequest = (allLineItems || []).reduce((acc, li) => {
        acc[li.request_id] = [...(acc[li.request_id] || []), li];
        return acc;
      }, {});

      const withOffers = await Promise.all(data.map(async (request) => {
        const { data: offers } = await sb.from('offers').select('*').eq('request_id', request.id);
        const offersWithProfiles = await attachSupplierProfiles(sb, offers || [], 'supplier_id', 'profiles');
        return {
          ...request,
          offers: offersWithProfiles || [],
          brief: briefByRequest[request.id] || null,
          managedShortlist: shortlistByRequest[request.id] || [],
          managedFeedback: feedbackByRequest[request.id] || [],
          lineItems: linesByRequest[request.id] || [],
        };
      }));
      setMyRequests(withOffers);
    }
    setLoadingRequests(false);
  };

  const loadMyDirectOrders = async () => {
    setLoadingDirectOrders(true);

    const ordersRes = await sb
      .from('requests')
      .select('*')
      .eq('buyer_id', user.id)
      .not('product_ref', 'is', null)
      .order('created_at', { ascending: false });
    console.log('[loadMyDirectOrders] requests query response:', ordersRes);

    const refIds = [...new Set((ordersRes.data || []).map(r => r.product_ref).filter(Boolean))];
    if (refIds.length === 0) {
      setDirectOrders([]);
      setLoadingDirectOrders(false);
      return;
    }

    const productsRes = await sb
      .from('products')
      .select(`id, supplier_id, name_ar, name_en, name_zh, currency, spec_lead_time_days, gallery_images, image_url, ${PRODUCT_TIER_EMBED}`)
      .in('id', refIds);
    console.log('[loadMyDirectOrders] products query response:', productsRes);

    const productsWithProfiles = await attachSupplierProfiles(sb, productsRes.data || [], 'supplier_id', 'profiles');
    console.log('[loadMyDirectOrders] products with supplier profiles:', productsWithProfiles);

    const productsById = (productsWithProfiles || []).reduce((acc, p) => { acc[p.id] = p; return acc; }, {});

    setDirectOrders((ordersRes.data || []).map(r => ({ ...r, product: productsById[r.product_ref] || null })));
    setLoadingDirectOrders(false);
  };

  const markDirectOrderArrived = async (request) => {
    if (!request?.id || !request?.product?.supplier_id) {
      alert(isAr ? 'تعذّر تنفيذ العملية' : 'Could not perform this action');
      return;
    }
    setDirectOrderActioning(prev => ({ ...prev, [request.id]: 'marking_arrived' }));

    const supplierId = request.product.supplier_id;
    const productName = request.product?.name_ar || request.product?.name_en || request.product?.name_zh || request.title_ar || request.title_en || '';

    const updRes = await sb
      .from('requests')
      .update({ status: 'arrived', shipping_status: 'arrived' })
      .eq('id', request.id)
      .select()
      .single();
    console.log('[markDirectOrderArrived] update response:', updRes);
    if (updRes.error) {
      setDirectOrderActioning(prev => ({ ...prev, [request.id]: null }));
      alert(isAr ? 'تعذّر التحديث — حاول مرة أخرى' : lang === 'zh' ? '无法更新 — 请重试' : 'Could not update — try again');
      return;
    }

    const notifRes = await sb.from('notifications').insert({
      user_id: supplierId,
      type: 'arrived',
      title_ar: `استلم التاجر الشحنة — ${productName}`,
      title_en: `Buyer marked shipment arrived — ${productName}`,
      title_zh: `买家已收到货物 — ${productName}`,
      ref_id: request.id,
      is_read: false,
    }).select().single();
    console.log('[markDirectOrderArrived] notification response:', notifRes);

    try {
      const r = await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'direct_order_arrived',
          data: {
            recipientUserId: supplierId,
            productName,
            trackingNumber: request.tracking_number || '',
          },
        }),
      });
      const body = await r.json().catch(() => null);
      console.log('[markDirectOrderArrived] email response:', { status: r.status, body });
    } catch (emailError) {
      console.error('[markDirectOrderArrived] email error:', emailError);
    }

    setDirectOrderActioning(prev => ({ ...prev, [request.id]: null }));
    loadMyDirectOrders();
  };

  const confirmDirectDelivery = async (request) => {
    if (!request?.id || !request?.product?.supplier_id) {
      alert(isAr ? 'تعذّر تنفيذ العملية' : 'Could not perform this action');
      return;
    }
    if (!window.confirm(isAr
      ? 'تأكيد استلام البضاعة؟ سيتم تحرير المبلغ للمورد ولا يمكن التراجع.'
      : lang === 'zh'
        ? '确认收货？款项将放给供应商，此操作不可撤销。'
        : 'Confirm delivery? This will release the payment to the supplier and cannot be undone.')) {
      return;
    }
    setDirectOrderActioning(prev => ({ ...prev, [request.id]: 'confirming_delivery' }));

    const supplierId = request.product.supplier_id;
    const supplierName = request.product?.profiles?.company_name || request.product?.profiles?.full_name || 'Supplier';
    const productName = request.product?.name_ar || request.product?.name_en || request.product?.name_zh || request.title_ar || request.title_en || '';

    const updRes = await sb
      .from('requests')
      .update({ status: 'delivered', shipping_status: 'delivered' })
      .eq('id', request.id)
      .select()
      .single();
    console.log('[confirmDirectDelivery] update response:', updRes);
    if (updRes.error) {
      setDirectOrderActioning(prev => ({ ...prev, [request.id]: null }));
      alert(isAr ? 'تعذّر تأكيد التسليم — حاول مرة أخرى' : lang === 'zh' ? '无法确认收货 — 请重试' : 'Could not confirm delivery — try again');
      return;
    }

    const paymentLookupRes = await sb
      .from('payments')
      .select('id, amount')
      .eq('request_id', request.id)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    console.log('[confirmDirectDelivery] payments lookup response:', paymentLookupRes);

    let payoutAmount = 0;
    if (paymentLookupRes.data?.id) {
      payoutAmount = Number(paymentLookupRes.data.amount || 0);
      const payUpdRes = await sb
        .from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentLookupRes.data.id)
        .select()
        .single();
      console.log('[confirmDirectDelivery] payments update response:', payUpdRes);
    }

    const notifRes = await sb.from('notifications').insert({
      user_id: supplierId,
      type: 'delivery_confirmed',
      title_ar: `أكد التاجر الاستلام — سيتم تحويل المبلغ خلال 24 ساعة (${productName})`,
      title_en: `Buyer confirmed delivery — payout within 24h (${productName})`,
      title_zh: `买家已确认收货 — 24 小时内放款 (${productName})`,
      ref_id: request.id,
      is_read: false,
    }).select().single();
    console.log('[confirmDirectDelivery] notification response:', notifRes);

    try {
      const r = await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'payout_initiated',
          data: {
            recipientUserId: supplierId,
            name: supplierName,
            amount: payoutAmount,
          },
        }),
      });
      const body = await r.json().catch(() => null);
      console.log('[confirmDirectDelivery] email response:', { status: r.status, body });
    } catch (emailError) {
      console.error('[confirmDirectDelivery] email error:', emailError);
    }

    setDirectOrderActioning(prev => ({ ...prev, [request.id]: null }));
    loadMyDirectOrders();
  };

  const payDirectOrder = async (request) => {
    if (!request?.id || !request?.product) {
      alert(isAr ? 'تعذّر تجهيز الدفع — حاول إعادة تحميل الصفحة' : 'Could not prepare payment — try refreshing the page');
      return;
    }
    if (request.status !== 'supplier_confirmed') {
      alert(isAr ? 'لا يمكن الدفع قبل تأكيد المورد' : 'Cannot pay before the supplier confirms');
      return;
    }
    setDirectOrderPaying(prev => ({ ...prev, [request.id]: true }));

    const product = request.product;
    const supplierId = product.supplier_id;
    const supplierProfile = product.profiles || null;

    const offer = {
      id: request.id,
      request_id: request.id,
      supplier_id: supplierId,
      profiles: supplierProfile,
      price: Number(deriveProductPriceFrom(product) || 0),
      currency: product.currency || 'USD',
      delivery_days: product.spec_lead_time_days || 30,
      status: 'accepted',
      isDirect: true,
    };
    console.log('[payDirectOrder] navigating to /checkout with payload:', { offer, request });

    setDirectOrderPaying(prev => ({ ...prev, [request.id]: false }));
    nav('/checkout', { state: { offer, request } });
  };

  const loadMySamples = async () => {
    const { data } = await sb.from('samples')
      .select('*,products(name_ar,name_en,name_zh)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setSamples(await attachSupplierProfiles(sb, data, 'supplier_id', 'profiles'));
  };

  const loadInbox = async () => {
    const { data } = await sb.from('messages')
      .select('*')
      .eq('receiver_id', user.id).order('created_at', { ascending: false });
    if (data) {
      const withProfiles = await attachDirectoryProfiles(sb, data, 'sender_id', 'profiles');
      const seen = new Set();
      setInbox(withProfiles.filter(m => { if (seen.has(m.sender_id)) return false; seen.add(m.sender_id); return true; }));
      await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('is_read', false);
      setStats(s => ({ ...s, messages: 0 }));
    }
  };

  const loadProductInquiries = async () => {
    try {
      const data = await fetchProductInquiryThreads(sb, { buyerId: user.id });
      setProductInquiries(await attachSupplierProfiles(sb, data, 'supplier_id', 'profiles'));
    } catch (error) {
      console.error('load buyer product inquiries error:', error);
      setProductInquiries([]);
    }
  };

  const loadSettings = async () => {
    const { data } = await sb.from('profiles').select('full_name,phone,city,company_name').eq('id', user.id).single();
    if (data) {
      setSettings({
        full_name: data.full_name || '',
        phone: data.phone || '',
        city: data.city || '',
        company_name: data.company_name || '',
        preferred_display_currency: displayCurrency || 'USD',
      });
    }
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    await sb.from('profiles').update({
      full_name: settings.full_name, phone: settings.phone,
      city: settings.city, company_name: settings.company_name,
    }).eq('id', user.id);
    await setDisplayCurrency?.(settings.preferred_display_currency || 'USD');
    setSavingSettings(false);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const rejectOffer = async (offerId, supplierId, requestId) => {
    if (!window.confirm(isAr ? 'هل تريد رفض هذا العرض؟' : 'Reject this offer?')) return;
    const { data: reqData } = await sb.from('requests').select('title_ar,title_en').eq('id', requestId).single();
    const reqTitle = reqData?.title_ar || reqData?.title_en || '';

    const { error } = await sb.from('offers').update({ status: 'rejected' }).eq('id', offerId);
    if (error) {
      alert(isAr ? 'حدث خطأ أثناء رفض العرض' : 'Error rejecting offer');
      return;
    }

    await sb.from('notifications').insert({
      user_id: supplierId,
      type: 'offer_rejected',
      title_ar: `تم رفض عرضك على الطلب: ${reqTitle}`,
      title_en: `Your offer was rejected for: ${reqTitle}`,
      title_zh: `您的报价已被拒绝: ${reqTitle}`,
      ref_id: requestId,
      is_read: false,
    });

    setMyRequests(prev => prev.map(req => req.id !== requestId ? req : {
      ...req,
      offers: req.offers.map(o => o.id === offerId ? { ...o, status: 'rejected' } : o),
    }));
    loadPendingActions();
    loadStats();
  };

  const acceptOffer = async (offerId, supplierId, requestId) => {
    // Get request title and all other pending offers before updating
    const { data: allOffers } = await sb.from('offers')
      .select('id,supplier_id')
      .eq('request_id', requestId)
      .eq('status', 'pending')
      .neq('id', offerId);
    const { data: reqData } = await sb.from('requests').select('title_ar,title_en').eq('id', requestId).single();
    const reqTitle = reqData?.title_ar || reqData?.title_en || '';

    try {
      const { error: e1 } = await sb.from('offers').update({ status: 'accepted' }).eq('id', offerId);
      if (e1) { console.error('acceptOffer: failed to set offer accepted:', e1); alert(isAr ? 'حدث خطأ أثناء قبول العرض' : 'Error accepting offer'); return; }

      const { error: e2 } = await sb.from('requests').update({ status: 'closed' }).eq('id', requestId);
      if (e2) { console.error('acceptOffer: failed to close request:', e2); alert(isAr ? 'حدث خطأ أثناء تحديث الطلب' : 'Error updating request'); return; }

      const { error: e3 } = await sb.from('offers').update({ status: 'rejected' }).eq('request_id', requestId).neq('id', offerId);
      if (e3) { console.error('acceptOffer: failed to reject other offers:', e3); alert(isAr ? 'حدث خطأ أثناء تحديث العروض الأخرى' : 'Error updating other offers'); return; }
    } catch (e) {
      console.error('acceptOffer: unexpected DB error:', e);
      alert(isAr ? 'حدث خطأ غير متوقع' : 'Unexpected error');
      return;
    }

    // All DB writes succeeded — now send notifications and emails
    await sb.from('notifications').insert({
      user_id: supplierId, type: 'offer_accepted',
      title_ar: 'تم قبول عرضك', title_en: 'Your offer has been accepted', title_zh: '您的报价已被接受',
      ref_id: offerId, is_read: false,
    });
    try {
      const res = await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ type: 'offer_accepted', data: { recipientUserId: supplierId, name: 'Supplier', requestTitle: reqTitle } }),
      });
      if (!res.ok) {
        console.error('offer_accepted email failed:', await res.text());
      }
    } catch (e) { console.error('email error:', e); }

    // Notify and email each rejected supplier individually
    if (allOffers?.length) {
      await Promise.all(allOffers.map(async (o) => {
        await sb.from('notifications').insert({
          user_id: o.supplier_id, type: 'offer_rejected',
          title_ar: `تم اختيار عرض آخر على الطلب: ${reqTitle}`,
          title_en: `Another offer was selected for: ${reqTitle}`,
          title_zh: `已选择其他报价: ${reqTitle}`,
          ref_id: requestId, is_read: false,
        });
        try {
          await fetch(SEND_EMAILS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
            body: JSON.stringify({ type: 'offer_rejected', data: { recipientUserId: o.supplier_id, name: 'Supplier', requestTitle: reqTitle } }),
          });
        } catch (e) { console.error('email error:', e); }
      }));
    }

    loadMyRequests(); loadPendingActions();
  };

  const recordManagedShortlistAction = async ({ request, shortlistOffer = null, action, reason = null }) => {
    await sb.from('managed_shortlist_feedback').insert({
      request_id: request.id,
      buyer_id: user.id,
      shortlist_offer_id: shortlistOffer?.id || null,
      action,
      reason,
    });
  };

  const ensureBuyerVisibleOfferForShortlist = async (shortlistOffer) => {
    const now = new Date().toISOString();
    const shippingDays = shortlistOffer.shipping_time_days;
    const shippingMethodText = shippingDays ? `${shippingDays} shipping days` : null;
    const negotiationNote = shippingDays ? `shipping_time_days:${shippingDays}` : null;

    if (shortlistOffer.offer_id) {
      const updates = {
        managed_visibility: 'buyer_visible',
        status: 'accepted',
        shortlisted_at: now,
      };
      if (shortlistOffer.unit_price != null) updates.price = shortlistOffer.unit_price;
      if (shortlistOffer.moq) updates.moq = shortlistOffer.moq;
      if (shortlistOffer.production_time_days != null) updates.delivery_days = shortlistOffer.production_time_days;
      if (shippingMethodText) {
        updates.shipping_method = shippingMethodText;
        updates.negotiation_note = negotiationNote;
      }
      const { data, error } = await sb.from('offers').update(updates).eq('id', shortlistOffer.offer_id).select().maybeSingle();
      if (error) throw error;
      return data;
    }

    const { data: matchRow } = await sb
      .from('managed_supplier_matches')
      .select('id')
      .eq('request_id', shortlistOffer.request_id)
      .eq('supplier_id', shortlistOffer.supplier_id)
      .maybeSingle();

    const { data: inserted, error: insertError } = await sb.from('offers').insert({
      request_id: shortlistOffer.request_id,
      supplier_id: shortlistOffer.supplier_id,
      price: shortlistOffer.unit_price,
      shipping_cost: 0,
      shipping_method: shippingMethodText,
      moq: shortlistOffer.moq,
      delivery_days: shortlistOffer.production_time_days,
      note: shortlistOffer.selection_reason || shortlistOffer.maabar_notes || null,
      status: 'accepted',
      managed_match_id: matchRow?.id || null,
      managed_visibility: 'buyer_visible',
      shortlisted_at: now,
      negotiation_note: negotiationNote,
    }).select().maybeSingle();
    if (insertError) throw insertError;

    if (inserted?.id) {
      await sb.from('managed_shortlisted_offers').update({ offer_id: inserted.id }).eq('id', shortlistOffer.id);
    }
    return inserted;
  };

  const chooseManagedOffer = async (request, shortlistOffer) => {
    await recordManagedShortlistAction({ request, shortlistOffer, action: 'choose_offer' });
    await sb.from('managed_shortlisted_offers').update({ selected_by_buyer: true, buyer_selected_at: new Date().toISOString(), status: 'selected_by_buyer' }).eq('id', shortlistOffer.id);
    await sb.from('managed_shortlisted_offers').update({ selected_by_buyer: false }).eq('request_id', request.id).neq('id', shortlistOffer.id);

    let offer;
    try {
      offer = await ensureBuyerVisibleOfferForShortlist(shortlistOffer);
    } catch (err) {
      console.error('ensureBuyerVisibleOfferForShortlist error:', err);
    }

    if (!offer) {
      alert(isAr ? 'تعذر فتح صفحة الدفع الآن' : lang === 'zh' ? '暂时无法打开结账页面' : 'Unable to open checkout right now');
      await loadMyRequests();
      await loadPendingActions();
      return;
    }

    // Managed accept lands on `closed` so the supplier still goes through the
    // "Ready — notify buyer" handshake before the first payment unlocks — same
    // as the direct-offer flow. No immediate nav to checkout.
    await sb.from('requests').update({
      managed_status: 'buyer_selected',
      managed_last_buyer_action: 'choose_offer',
      status: 'closed',
    }).eq('id', request.id);

    // Notify the chosen supplier — they need to confirm readiness next.
    if (offer?.supplier_id) {
      try {
        await sb.from('notifications').insert({
          user_id: offer.supplier_id,
          type: 'managed_offer_accepted',
          title_ar: 'تم قبول عرضك المُدار — أكّد جاهزيتك',
          title_en: 'Your managed offer was accepted — confirm readiness',
          title_zh: '您的托管报价已被接受 — 请确认就绪',
          ref_id: request.id,
          is_read: false,
        });
      } catch (e) { console.error('chooseManagedOffer notify supplier error:', e); }
      try {
        await fetch(SEND_EMAILS_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
          body: JSON.stringify({
            type: 'managed_offer_accepted',
            data: { recipientUserId: offer.supplier_id, name: 'Supplier', requestTitle: request.title_ar || request.title_en || '' },
          }),
        });
      } catch (e) { console.error('chooseManagedOffer email error:', e); }
    }

    await loadMyRequests();
    await loadPendingActions();
    alert(isAr
      ? 'تم قبول العرض. في انتظار تأكيد المورد الجاهزية ثم يفتح خيار الدفع.'
      : lang === 'zh'
        ? '报价已接受。等待供应商确认就绪后，即可开始付款。'
        : 'Offer accepted. Waiting for the supplier to confirm readiness — payment will unlock once confirmed.');
  };

  const requestManagedNegotiation = async (request, shortlistOffer, reason) => {
    await recordManagedShortlistAction({ request, shortlistOffer, action: 'request_negotiation', reason });
    await sb.from('requests').update({ managed_status: 'sourcing', managed_last_buyer_action: 'request_negotiation' }).eq('id', request.id);
    await loadMyRequests();
    await loadPendingActions();
  };

  const rejectManagedOffer = async (request, shortlistOffer) => {
    await recordManagedShortlistAction({ request, shortlistOffer, action: 'not_suitable' });
    await sb.from('managed_shortlisted_offers').update({ status: 'dismissed' }).eq('id', shortlistOffer.id);
    await sb.from('requests').update({ managed_last_buyer_action: 'not_suitable' }).eq('id', request.id);
    await loadMyRequests();
  };

  const restartManagedSearch = async (request) => {
    await recordManagedShortlistAction({ request, action: 'restart_search' });
    await sb.from('requests').update({ managed_status: 'sourcing', managed_last_buyer_action: 'restart_search', managed_research_requested_count: (request.managed_research_requested_count || 0) + 1 }).eq('id', request.id);
    await loadMyRequests();
    await loadPendingActions();
  };

  const confirmDelivery = async (requestId, supplierId, supplierName) => {
    // Update request status
    await sb.from('requests').update({ status: 'delivered', shipping_status: 'delivered' }).eq('id', requestId);

    // Trigger payout: mark payment as completed
    const { data: paymentData } = await sb.from('payments')
      .select('id, amount, amount_second, payment_pct')
      .eq('request_id', requestId)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (paymentData) {
      // If split payment and second payment was made, total is fully paid
      // Mark payment as completed — triggers payout to supplier
      await sb.from('payments')
        .update({ status: 'completed' })
        .eq('id', paymentData.id);
    }

    // Notify supplier
    await sb.from('notifications').insert({
      user_id: supplierId, type: 'delivery_confirmed',
      title_ar: 'التاجر أكد الاستلام — سيتم تحويل المبلغ خلال 24 ساعة',
      title_en: 'Buyer confirmed delivery — payout will be processed within 24h',
      title_zh: '买家已确认收货 — 款项将在24小时内处理',
      ref_id: requestId, is_read: false,
    });

    // Send payout email to supplier
    try {
      await fetch(SEND_EMAILS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({
          type: 'payout_initiated',
          data: {
            recipientUserId: supplierId,
            name: supplierName || 'Supplier',
            amount: paymentData?.amount || 0,
          },
        }),
      });
    } catch (e) { console.error('payout email error:', e); }

    loadMyRequests(); loadPendingActions();
    setReviewRating(0); setReviewComment('');
    setReviewModal({ supplierId, requestId, supplierName });
  };

  const submitReview = async () => {
    if (!reviewRating || !reviewModal) return;
    const { data: existingReview } = await sb.from('reviews')
      .select('id')
      .eq('supplier_id', reviewModal.supplierId)
      .eq('buyer_id', user.id)
      .eq('request_id', reviewModal.requestId)
      .maybeSingle();
    if (existingReview) {
      setReviewModal(null);
      return;
    }
    setSubmittingReview(true);
    await sb.from('reviews').insert({
      supplier_id: reviewModal.supplierId, buyer_id: user.id,
      request_id: reviewModal.requestId, rating: reviewRating, comment: reviewComment || '',
    });
    const { data: reviews } = await sb.from('reviews').select('rating').eq('supplier_id', reviewModal.supplierId);
    if (reviews?.length > 0) {
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await sb.from('profiles').update({ rating: avg, reviews_count: reviews.length }).eq('id', reviewModal.supplierId);
    }
    setSubmittingReview(false);
    setSubmittedReviewIds(prev => new Set([...prev, reviewModal.requestId]));
    setReviewModal(null);
    alert(isAr ? 'شكراً على تقييمك!' : 'Thank you for your review!');
  };

  const saveEditRequest = async () => {
    if (!editReqModal) return;
    setSavingEditReq(true);
    await sb.from('requests').update({
      title_ar: editReqForm.title_ar,
      title_en: editReqForm.title_en,
      desc_ar: editReqForm.desc_ar,
      quantity: editReqForm.quantity,
    }).eq('id', editReqModal.id);
    setSavingEditReq(false);
    setEditReqModal(null);
    loadMyRequests();
  };

  const deleteRequest = async (r) => {
    if (r.status !== 'open') {
      alert(isAr ? 'لا يمكن حذف طلب غير مفتوح' : 'Can only delete open requests');
      return;
    }
    const pendingOffers = (r.offers || []).filter(o => o.status === 'pending');
    if (pendingOffers.length > 0) {
      const confirmed = window.confirm(isAr
        ? `يوجد ${pendingOffers.length} عرض على هذا الطلب. هل تريد حذفه وإلغاء كل العروض؟`
        : `There are ${pendingOffers.length} offer(s) on this request. Delete and cancel all offers?`);
      if (!confirmed) return;
      // Notify suppliers
      await Promise.all(pendingOffers.map(o =>
        sb.from('notifications').insert({ user_id: o.supplier_id, type: 'request_deleted', title_ar: `تم حذف الطلب: ${r.title_ar || r.title_en}`, title_en: `Request deleted: ${r.title_en || r.title_ar}`, title_zh: `需求已删除`, ref_id: r.id, is_read: false })
      ));
    } else {
      if (!window.confirm(isAr ? 'هل تريد حذف هذا الطلب؟' : 'Delete this request?')) return;
    }
    await sb.from('requests').delete().eq('id', r.id);
    loadMyRequests(); loadPendingActions(); loadStats();
  };

  const cancelRequest = async (r) => {
    const acceptedOffer = r.offers.find(o => o.status === 'accepted');
    await sb.from('requests').update({ status: 'open' }).eq('id', r.id);
    if (acceptedOffer) {
      await sb.from('offers').update({ status: 'rejected' }).eq('id', acceptedOffer.id);
      const reqNameAr = r.title_ar || r.title_en || '';
      const reqNameEn = r.title_en || r.title_ar || '';
      await sb.from('notifications').insert({
        user_id: acceptedOffer.supplier_id,
        type: 'request_cancelled',
        title_ar: `قام التاجر بإلغاء الطلب: ${reqNameAr}`,
        title_en: `The trader has cancelled the request: ${reqNameEn}`,
        title_zh: `采购商已取消请求: ${reqNameEn}`,
        ref_id: r.id,
        is_read: false,
      });
      await sb.from('messages').insert({
        sender_id: user.id,
        receiver_id: acceptedOffer.supplier_id,
        content: JSON.stringify({
          ar: `قام التاجر بإلغاء الطلب: ${reqNameAr}`,
          en: `The trader has cancelled the request: ${reqNameEn}`,
          zh: `采购商已取消请求: ${reqNameEn}`,
        }),
        message_type: 'system',
        is_read: false,
      });
    }
    setCancelConfirmReq(null);
    setMyRequests(prev => prev.map(req =>
      req.id !== r.id ? req : {
        ...req,
        status: 'open',
        offers: req.offers.map(o => o.status === 'accepted' ? { ...o, status: 'rejected' } : o),
      }
    ));
  };

  const name = profile?.full_name || user?.email?.split('@')[0];

  const directOrdersPayableCount = directOrders.filter(r => r.status === 'supplier_confirmed').length;
  const tabs = [
    { id: 'overview',  label: isAr ? 'نظرة عامة' : 'Overview' },
    { id: 'requests',  label: isAr ? 'طلباتي'    : 'My Requests' },
    { id: 'direct-orders', label: isAr ? 'مشترياتي المباشرة' : lang === 'zh' ? '我的直接采购' : 'My Direct Purchases', badge: directOrdersPayableCount > 0 ? directOrdersPayableCount : null },
    { id: 'samples',   label: isAr ? 'العينات'   : 'Samples' },
    { id: 'product-inquiries', label: isAr ? 'استفسارات المنتجات' : lang === 'zh' ? '产品咨询' : 'Product Inquiries', badge: stats.productInquiries > 0 ? stats.productInquiries : null },
    { id: 'messages',  label: isAr ? 'الرسائل'   : 'Messages', badge: stats.messages > 0 ? stats.messages : null },
    { id: 'settings',  label: isAr ? 'الإعدادات' : 'Settings' },
  ];

  /* ── shared section style ── */
  const section = { animation: 'fadeIn 0.35s ease' };

  return (
    <div className="dashboard-wrap">

      {/* ══════════════════════════════════════
          HEADER
      ══════════════════════════════════════ */}
      <div className="dash-header-pad" style={{
        background: 'var(--bg-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {/* Label */}
        <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 20, fontWeight: 500 }}>
          {isAr ? 'مَعبر · لوحة التاجر' : 'Maabar · Trader Dashboard'}
        </p>

        {/* Name */}
        <h1 style={{
          fontSize: isAr ? 36 : 42,
          fontWeight: 300,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          color: 'var(--text-primary)',
          letterSpacing: isAr ? 0 : -1,
          lineHeight: 1.2,
          marginBottom: 10,
        }}>
          {isAr ? `أهلاً، ${name}` : `Welcome, ${name}`}
        </h1>
        <p style={{
          fontSize: 14, color: 'var(--text-tertiary)',
          marginBottom: 36, lineHeight: 1.7,
          fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
          maxWidth: 420,
        }}>
          {isAr ? 'تابع طلباتك وعروضك ورسائلك من مكان واحد' : 'Track your requests, offers and messages in one place'}
        </p>

        {/* Tabs */}
        <div className="db-desktop-tabs" style={{ gap: 0 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '10px 20px',
              background: 'none', border: 'none',
              borderBottom: activeTab === t.id
                ? '1px solid var(--text-primary)'
                : '1px solid transparent',
              color: activeTab === t.id ? 'var(--text-primary)' : 'var(--text-disabled)',
              fontSize: 11, cursor: 'pointer',
              transition: 'all 0.2s', position: 'relative',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
              letterSpacing: 1.5, textTransform: 'uppercase',
              minHeight: 44,
            }}>
              {t.label}
              {t.badge && (
                <span style={{
                  position: 'absolute', top: 6,
                  right: isAr ? 'auto' : 2, left: isAr ? 2 : 'auto',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border-muted)',
                  color: 'var(--text-secondary)',
                  fontSize: 8, fontWeight: 700, borderRadius: '50%',
                  width: 14, height: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          CONTENT
      ══════════════════════════════════════ */}
      <div className="db-main-wrap" style={{ background: 'var(--bg-base)', minHeight: 'calc(var(--app-dvh) - 280px)' }}>
        <div className="dash-content">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div style={section}>

              {/* Stats strip */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 28, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                {[
                  { label: isAr ? 'تحتاج إجراء' : 'Needs Action', value: pendingActions.filter(a => ['supplier_confirmed','arrived','ready_to_ship','offers'].includes(a.type)).length, red: true, onClick: () => setActiveTab('requests') },
                  { label: isAr ? 'طلبات نشطة' : 'Active', value: stats.requests, onClick: () => setActiveTab('requests') },
                  { label: isAr ? 'رسائل جديدة' : 'Messages', value: stats.messages, onClick: () => setActiveTab('messages') },
                ].map((s, i) => (
                  <div key={i} onClick={s.onClick} style={{
                    flex: 1, padding: '18px 20px', cursor: 'pointer',
                    background: 'var(--bg-subtle)',
                    borderRight: i < 2 ? '1px solid var(--border-subtle)' : 'none',
                    transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-raised)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-subtle)'}>
                    <p style={{ fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8, fontWeight: 500 }}>{s.label}</p>
                    <p style={{ fontSize: 36, fontWeight: 300, lineHeight: 1, fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1', color: s.red && s.value > 0 ? '#c0392b' : 'var(--text-primary)' }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Pending action banners */}
              {pendingActions.length > 0 && (
                <div style={{ marginBottom: 40 }}>
                  <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 12, fontWeight: 500 }}>
                    {isAr ? `يحتاج انتباهك (${pendingActions.length})` : `Needs Attention (${pendingActions.length})`}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {pendingActions.map((action, i) => (
                      <PendingBanner
                        key={i}
                        action={action}
                        isAr={isAr}
                        onGo={() => {
                          if (action.type === 'messages') { setActiveTab('messages'); return; }
                          if (action.request?.id) {
                            nav(`/dashboard?tab=requests&request=${action.request.id}`, { replace: true });
                          } else {
                            setActiveTab('requests');
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Active orders mini-cards */}
              {(loadingActiveOrders || activeOrders.length > 0) && (
                <div style={{ marginBottom: 40 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                    <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', fontWeight: 500 }}>
                      {isAr ? 'طلبات نشطة' : 'Active Orders'}
                    </p>
                    {activeOrders.length > 0 && (
                      <button onClick={() => setActiveTab('requests')} style={{ background: 'none', border: 'none', fontSize: 11, color: 'var(--text-secondary)', cursor: 'pointer', padding: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {isAr ? 'عرض الكل' : 'View all'}
                      </button>
                    )}
                  </div>
                  {loadingActiveOrders && (
                    <div style={{ height: 80, background: 'var(--bg-subtle)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }} />
                  )}
                  {!loadingActiveOrders && activeOrders.slice(0, 3).map((r, idx) => {
                    const acceptedOffer = r.offers?.find(o => o.status === 'accepted');
                    return (
                      <div key={r.id} onClick={() => nav(`/dashboard?tab=requests&request=${r.id}`, { replace: true })}
                        style={{ borderTop: idx === 0 ? '1px solid var(--border-subtle)' : 'none', borderBottom: '1px solid var(--border-subtle)', padding: '16px 0', cursor: 'pointer', transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.72'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                        {/* Title + status badge */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.3, flex: 1, minWidth: 0 }}>
                            {isAr ? r.title_ar || r.title_en : r.title_en || r.title_ar}
                          </p>
                          <span style={{ fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', padding: '2px 8px', borderRadius: 999, border: '1px solid var(--border-subtle)', color: 'var(--text-disabled)', flexShrink: 0 }}>
                            {isAr ? (STATUS_AR[r.status] || r.status) : (STATUS_EN[r.status] || r.status)}
                          </span>
                        </div>
                        {/* Supplier name */}
                        {acceptedOffer?.profiles?.company_name && (
                          <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginBottom: 4, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                            {acceptedOffer.profiles.company_name}
                          </p>
                        )}
                        {/* Timeline */}
                        <StatusTimeline status={r.shipping_status || r.status} isAr={isAr} />
                        {/* Payment plan badges */}
                        {acceptedOffer && <PaymentPlanRow request={r} offer={acceptedOffer} isAr={isAr} />}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Quick actions */}
              <div style={{ marginBottom: 40 }}>
                <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14, fontWeight: 500 }}>
                  {isAr ? 'الإجراءات السريعة' : 'Quick Actions'}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
                  <QuickAction title={isAr ? 'تصفح المنتجات' : 'Browse Products'} sub={isAr ? 'استكشف منتجات الموردين الصينيين' : 'Explore Chinese supplier products'} onClick={() => nav('/products')} primary isAr={isAr} />
                  <QuickAction title={isAr ? 'رفع طلب قياسي'  : 'Post Standard RFQ'} sub={isAr ? 'لمنتج واضح وتحتاج عروض مباشرة' : 'For a known product and direct offers'} onClick={() => nav('/requests')} isAr={isAr} />
                  <QuickAction title={isAr ? 'Private Label / Custom' : 'Private Label / Custom'} sub={isAr ? 'إذا تحتاج تصنيع خاص أو علامة خاصة' : 'For OEM, ODM, or custom manufacturing'} onClick={() => nav('/requests?flow=custom')} isAr={isAr} />
                  <QuickAction title={isAr ? 'طلباتي'         : 'My Requests'} sub={isAr ? 'تابع الطلبات، العروض، والدفع' : 'Track requests, offers, and payment steps'} onClick={() => setActiveTab('requests')} isAr={isAr} />
                </div>
              </div>

              <button onClick={() => nav('/')} style={{
                background: 'none', border: 'none',
                color: 'var(--text-disabled)', fontSize: 11,
                cursor: 'pointer', letterSpacing: 2, textTransform: 'uppercase',
                padding: 0, transition: 'color 0.2s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-disabled)'}>
                {isAr ? 'العودة للرئيسية ←' : '← Back to Home'}
              </button>
            </div>
          )}

          {/* ── MY REQUESTS ── */}
          {activeTab === 'requests' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 20 }}>
                <h2 style={{
                  fontSize: isAr ? 28 : 34, fontWeight: 300,
                  fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                  color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5,
                }}>
                  {isAr ? 'طلباتي' : 'My Requests'}
                </h2>
                <button className="btn-dark-sm" onClick={() => nav('/requests')}
                  style={{ fontSize: 11, letterSpacing: 1, minHeight: 36 }}>
                  {isAr ? '+ طلب جديد' : '+ New Request'}
                </button>
              </div>

              {/* Stats mini-strip */}
              {!loadingRequests && myRequests.length > 0 && (() => {
                const needsAct = myRequests.filter(r => {
                  const hasPendingOffers = r.offers?.some(o => o.status === 'pending');
                  return hasPendingOffers || ['supplier_confirmed','arrived'].includes(r.status);
                }).length;
                const activeCount    = myRequests.filter(r => !['open','offers_received','delivered'].includes(r.status)).length;
                const completedCount = myRequests.filter(r => r.status === 'delivered').length;
                return (
                  <div style={{ display: 'flex', gap: 0, marginBottom: 20, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                    {[
                      { label: isAr ? 'تحتاج إجراء' : 'Action needed', value: needsAct, red: true },
                      { label: isAr ? 'نشطة' : 'Active', value: activeCount },
                      { label: isAr ? 'مكتملة' : 'Completed', value: completedCount },
                    ].map((s, i) => (
                      <div key={i} style={{ flex: 1, padding: '12px 14px', background: 'var(--bg-subtle)', borderRight: i < 2 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <p style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 5, fontWeight: 500 }}>{s.label}</p>
                        <p style={{ fontSize: 24, fontWeight: 300, lineHeight: 1, fontVariantNumeric: 'lining-nums', fontFeatureSettings: '"lnum" 1', color: s.red && s.value > 0 ? '#c0392b' : 'var(--text-secondary)' }}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Mobile sub-filter tabs */}
              <TopSubTabs
                isAr={isAr}
                active={reqSubFilter}
                onSelect={setReqSubFilter}
                tabs={[
                  { id: 'all',       label: isAr ? 'الكل'    : 'All'       },
                  { id: 'open',      label: isAr ? 'مفتوحة'  : 'Open',     badge: myRequests.filter(r => ['open','offers_received'].includes(r.status)).length || null },
                  { id: 'active',    label: isAr ? 'نشطة'    : 'Active'    },
                  { id: 'completed', label: isAr ? 'مكتملة'  : 'Done'      },
                ]}
              />

              {/* Loading skeleton */}
              {loadingRequests && [1, 2].map(i => (
                <div key={i} style={{ borderTop: '1px solid var(--border-subtle)', padding: '28px 0' }}>
                  <div style={{ width: '45%', height: 16, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)', marginBottom: 10 }} />
                  <div style={{ width: '25%', height: 10, background: 'var(--bg-raised)', borderRadius: 'var(--radius-sm)' }} />
                </div>
              ))}

              {/* Empty */}
              {!loadingRequests && myRequests.length === 0 && (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-disabled)', marginBottom: 24, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'ما عندك طلبات بعد' : 'No requests yet'}
                  </p>
                  <button className="btn-dark-sm" onClick={() => nav('/requests')} style={{ minHeight: 40 }}>
                    {isAr ? 'ارفع أول طلب' : 'Post First Request'}
                  </button>
                </div>
              )}

              {/* Requests list */}
              {!loadingRequests && (() => {
                const filteredRequests = myRequests.filter(r => {
                  if (reqSubFilter === 'open')      return ['open','offers_received'].includes(r.status);
                  if (reqSubFilter === 'active')    return !['open','offers_received','delivered'].includes(r.status);
                  if (reqSubFilter === 'completed') return r.status === 'delivered';
                  return true;
                });
                if (filteredRequests.length === 0 && myRequests.length > 0) return (
                  <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-disabled)', fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'لا توجد طلبات في هذا التصنيف' : 'No requests in this filter'}
                  </div>
                );
                return filteredRequests.map((r, idx) => {
                const managed = isManagedRequest(r);
                const pendingOffers = r.offers.filter(o => o.status === 'pending');
                const acceptedOffer = r.offers.find(o => o.status === 'accepted');
                const offerTotals = r.offers.map(o => getOfferEstimatedTotal(o, r)).filter(Number.isFinite);
                const lowestOfferTotal = offerTotals.length > 0 ? Math.min(...offerTotals) : null;
                const fastestOffer = r.offers.reduce((best, current) => {
                  if (!best) return current;
                  if ((parseInt(current.delivery_days, 10) || Infinity) < (parseInt(best.delivery_days, 10) || Infinity)) return current;
                  return best;
                }, null);
                const isFocusedRequest = String(focusedRequestId || '') === String(r.id);
                const nextStepCopy = (() => {
                  if (managed) {
                    if ((r.managedShortlist || []).length > 0 || String(r.managed_status || '') === 'shortlist_ready') {
                      return {
                        title: isAr ? 'الخطوة التالية: راجع العروض المختارة لك' : 'Next step: review your selected offers',
                        body: isAr ? 'كل قرار في هذا الطلب المُدار يتم من نفس الصفحة: اختر العرض المناسب، اطلب تفاوضاً إضافياً، أو اطلب من معبر أن يعيد البحث.' : 'Every decision for this managed request stays in the same page: choose the right offer, ask for more negotiation, or ask Maabar to search again.',
                      };
                    }
                    return {
                      title: isAr ? 'الطلب الآن داخل المسار المُدار' : 'This request is now inside the managed flow',
                      body: isAr ? 'معبر يجهّز الـ brief، يراجع الوضوح، ويطابق الموردين المناسبين فقط قبل إظهار أفضل 3 عروض لك هنا.' : 'Maabar is preparing the brief, reviewing clarity, and matching only suitable suppliers before showing your top 3 here.',
                    };
                  }
                  if (acceptedOffer && r.status === 'closed') {
                    return {
                      title: isAr ? 'الخطوة التالية: انتظر تأكيد المورد' : 'Next step: waiting for supplier to confirm',
                      body: isAr ? 'تم قبول العرض — المورد سيراسلك لتأكيد التفاصيل ثم يفتح لك خيار الدفع.' : 'Offer accepted — the supplier will message you to confirm details, then unlock payment.',
                    };
                  }
                  if (acceptedOffer && r.status === 'supplier_confirmed') {
                    return {
                      title: isAr ? 'الخطوة التالية: المورد جاهز — ادفع بأمان داخل مَعبر' : 'Next step: supplier is ready — pay securely on Maabar',
                      body: isAr ? 'تم تأكيد التفاصيل. أكمل الدفع من نفس الطلب حتى يبقى السجل التجاري واضحاً للطرفين.' : 'Details confirmed. Complete checkout from this request so payment and execution stay on one clear record.',
                    };
                  }
                  if (r.status === 'ready_to_ship' && r.payment_second > 0) {
                    return {
                      title: isAr ? 'الخطوة التالية: ادفع الدفعة الثانية قبل إصدار الشحنة' : 'Next step: pay the second installment before shipment release',
                      body: isAr ? 'المورد أكد جاهزية الشحنة. أكمل الدفعة المتبقية من هذا الطلب حتى يبدأ الشحن.' : 'The supplier confirmed shipment readiness. Complete the remaining balance here to release shipping.',
                    };
                  }
                  if (r.status === 'shipping') {
                    return {
                      title: isAr ? 'الخطوة التالية: تابع التتبع ثم أكد وصول الشحنة للسعودية' : 'Next step: follow tracking, then confirm arrival in KSA',
                      body: isAr ? 'بمجرد وصول الشحنة يمكنك تحديث الحالة ثم تأكيد الاستلام لاحقاً.' : 'Once the shipment arrives, update the status here and confirm final delivery afterwards.',
                    };
                  }
                  if (r.status === 'arrived') {
                    return {
                      title: isAr ? 'الخطوة التالية: أكد الاستلام لإغلاق الصفقة' : 'Next step: confirm delivery to close the deal',
                      body: isAr ? 'إذا استلمت البضاعة كما هو متفق عليه، أكد الاستلام من هذا الطلب.' : 'If the goods arrived as agreed, confirm delivery from this request.',
                    };
                  }
                  if (pendingOffers.length > 0) {
                    return {
                      title: isAr ? `الخطوة التالية: قارن ${pendingOffers.length} عرض${pendingOffers.length > 1 ? 'اً' : ''} واختر الأنسب` : `Next step: compare ${pendingOffers.length} offer${pendingOffers.length > 1 ? 's' : ''} and pick the best fit`,
                      body: isAr ? 'راجع الإجمالي، مدة التجهيز، وطريقة الشحن قبل قبول العرض.' : 'Review total cost, lead time, and shipping method before accepting an offer.',
                    };
                  }
                  if (r.offers.length > 0) {
                    return {
                      title: isAr ? 'العروض موجودة داخل هذا الطلب' : 'Offers are already attached to this request',
                      body: isAr ? 'كل قرار لاحق — قبول، دفع، متابعة، أو استلام — يتم من نفس البطاقة.' : 'Every next decision — accept, pay, track, or confirm receipt — stays inside this same card.',
                    };
                  }
                  return null;
                })();

                return (
                <div key={r.id} data-request-id={r.id} style={{
                  borderTop: '1px solid var(--border-subtle)',
                  padding: '24px 0',
                  animation: `fadeIn 0.35s ease ${idx * 0.04}s both`,
                  scrollMarginTop: 110,
                  background: isFocusedRequest ? 'var(--bg-subtle)' : 'transparent',
                  boxShadow: isFocusedRequest ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : 'none',
                  borderRadius: isFocusedRequest ? 'var(--radius-lg)' : 0,
                }}>
                  {/* ── Card header: category tag + title + time ── */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, gap: 8 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        {(r.category_ar || r.category_en || r.category) && (
                          <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 999 }}>
                            {isAr ? (r.category_ar || r.category) : (r.category_en || r.category)}
                          </span>
                        )}
                        {managed && (
                          <span style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', border: '1px solid var(--border-subtle)', padding: '2px 8px', borderRadius: 999 }}>
                            {isAr ? 'طلب مُدار' : 'Managed'}
                          </span>
                        )}
                        <span style={{ fontSize: 10, color: 'var(--text-disabled)', marginInlineStart: 'auto' }}>
                          {relativeTime(r.created_at, isAr)}
                        </span>
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 500, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {isAr ? r.title_ar || r.title_en : r.title_en || r.title_ar}
                      </h3>
                      <p style={{ fontSize: 11, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {isAr ? 'الكمية: ' : 'Qty: '}{r.quantity || '—'}
                        {!managed && (
                          <span style={{ marginInlineStart: 10 }}>
                            {isAr ? STATUS_AR[r.status] || r.status : STATUS_EN[r.status] || r.status}
                          </span>
                        )}
                      </p>
                    </div>
                    {/* Edit/Delete for open requests */}
                    {r.status === 'open' && (
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => { setEditReqModal(r); setEditReqForm({ title_ar: r.title_ar || '', title_en: r.title_en || '', desc_ar: r.desc_ar || '', quantity: r.quantity || '' }); }}
                          className="btn-outline" style={{ padding: '3px 8px', fontSize: 10, minHeight: 24 }}>
                          {isAr ? 'تعديل' : 'Edit'}
                        </button>
                        <button onClick={() => deleteRequest(r)}
                          style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '3px 8px', fontSize: 10, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 24 }}>
                          {isAr ? 'حذف' : 'Delete'}
                        </button>
                      </div>
                    )}
                    {['paid','ready_to_ship','shipping','arrived','delivered'].includes(r.status) && (
                      <a href={`mailto:support@maabar.io?subject=${encodeURIComponent((isAr ? 'مشكلة في طلب: ' : 'Issue with order: ') + (r.title_ar || r.title_en || r.id))}&body=${encodeURIComponent((isAr ? 'رقم الطلب: ' : 'Order ID: ') + r.id)}`}
                        style={{ fontSize: 10, color: '#a07070', textDecoration: 'none', border: '1px solid rgba(138,58,58,0.25)', padding: '3px 8px', borderRadius: 'var(--radius-md)', flexShrink: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {isAr ? 'إبلاغ' : 'Report'}
                      </a>
                    )}
                  </div>

                  {/* ── Variant line items (Phase 4) ── */}
                  {(r.lineItems || []).length > 0 && (
                    <div style={{ margin: '10px 0', padding: '12px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8 }}>
                        {isAr ? 'المنتجات المطلوبة' : 'Order Lines'}
                      </p>
                      {(r.lineItems || []).map((li, idx) => (
                        <div key={li.id || idx} style={{ display: 'flex', gap: 8, fontSize: 11, color: 'var(--text-secondary)', padding: '4px 0', borderBottom: idx < r.lineItems.length - 1 ? '1px solid var(--border-subtle)' : 'none', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: 'monospace', flex: 1 }}>{li.product_variants?.sku || li.variant_id?.slice(0, 8) || '—'}</span>
                          <span>×{li.quantity}</span>
                          <span style={{ direction: 'ltr' }}>${Number(li.unit_price_usd).toFixed(2)}/u</span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', direction: 'ltr' }}>${(li.quantity * li.unit_price_usd).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Supplier strip (when accepted offer) ── */}
                  {!managed && acceptedOffer && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0 2px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 500 }}>
                        {acceptedOffer.profiles?.company_name || '—'}
                      </span>
                      {isSupplierPubliclyVisible(acceptedOffer.profiles?.status) && (
                        <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', color: '#5a9a72' }}>
                          ✓ {isAr ? 'موثّق' : 'Verified'}
                        </span>
                      )}
                      {getSupplierMaabarId(acceptedOffer.profiles || {}) && (
                        <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>
                          · {getSupplierMaabarId(acceptedOffer.profiles)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Status timeline ── */}
                  {!managed && <StatusTimeline status={r.shipping_status || r.status} isAr={isAr} />}

                  {/* ── Payment plan row ── */}
                  {!managed && acceptedOffer && (
                    <PaymentPlanRow request={r} offer={acceptedOffer} isAr={isAr} />
                  )}

                  {/* ── Tracking card ── */}
                  {!managed && <TrackingCard request={r} isAr={isAr} />}

                  {/* Managed next-step banner (kept for managed only) */}
                  {managed && (() => {
                    const hasShortlist = (r.managedShortlist || []).length > 0 || String(r.managed_status || '') === 'shortlist_ready';
                    const title = hasShortlist
                      ? (isAr ? 'الخطوة التالية: راجع العروض المختارة لك' : 'Next step: review your selected offers')
                      : (isAr ? 'الطلب الآن داخل المسار المُدار' : 'This request is now inside the managed flow');
                    const body = hasShortlist
                      ? (isAr ? 'اختر العرض المناسب، اطلب تفاوضاً، أو اطلب من معبر إعادة البحث.' : 'Choose the right offer, request negotiation, or ask Maabar to search again.')
                      : (isAr ? 'معبر يجهّز الـ brief ويطابق الموردين المناسبين قبل إظهار أفضل 3 عروض لك.' : 'Maabar is matching suitable suppliers before showing your top 3 here.');
                    return (
                      <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(0,0,0,0.08)', background: 'var(--bg-subtle)' }}>
                        <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 500, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{title}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{body}</p>
                      </div>
                    );
                  })()}

                  {managed && (
                    <ManagedBuyerRequestPanel
                      request={r}
                      lang={lang}
                      onChooseOffer={chooseManagedOffer}
                      onRequestNegotiation={requestManagedNegotiation}
                      onRejectOffer={rejectManagedOffer}
                      onRestartSearch={restartManagedSearch}
                    />
                  )}

                  {/* ── Compare offers grid (pending offers only, or all when comparing) ── */}
                  {!managed && pendingOffers.length > 0 && (
                    <div>
                      {pendingOffers.length > 1 && (
                        <p style={{ fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 10 }}>
                          {isAr ? `${pendingOffers.length} عروض — قارن واختر` : `${pendingOffers.length} Offers — Compare & Choose`}
                        </p>
                      )}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.min(pendingOffers.length, 3)}, 1fr)`,
                        gap: 1,
                        background: 'var(--border-subtle)',
                        borderRadius: 'var(--radius-lg)',
                        overflow: 'hidden',
                      }}>
                        {pendingOffers.map(o => {
                          const offerEstimatedTotal = getOfferEstimatedTotal(o, r);
                          const lowestOfferTotal = Math.min(...pendingOffers.map(x => getOfferEstimatedTotal(x, r)));

                          return (
                          <div key={o.id} style={{
                            background: o.status === 'accepted' ? 'var(--bg-raised)' : 'var(--bg-subtle)',
                            padding: '18px 16px',
                            position: 'relative',
                          }}>
                            {r.offers.length > 1 && offerEstimatedTotal === lowestOfferTotal && (
                              <span style={{
                                position: 'absolute', top: 10,
                                insetInlineEnd: 10,
                                fontSize: 9, padding: '2px 8px',
                                background: 'rgba(58,122,82,0.12)',
                                border: '1px solid rgba(58,122,82,0.2)',
                                color: '#5a9a72', borderRadius: 20,
                              }}>
                                {isAr ? 'الأقل إجمالاً' : lang === 'zh' ? '总价最低' : 'Lowest Total'}
                              </span>
                            )}
                            {(() => {
                              const supplierTrustSignals = buildSupplierTrustSignals(o.profiles || {});
                              const isReviewedSupplier = isSupplierPubliclyVisible(o.profiles?.status);
                              const supplierMaabarId = getSupplierMaabarId(o.profiles || {});

                              return (
                                <>
                                  <div style={{ marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                                      <p style={{ fontSize: 12, color: 'var(--text-primary)', marginBottom: 0, fontWeight: 500 }}>
                                        {o.profiles?.company_name || '—'}
                                      </p>
                                      {isReviewedSupplier && (
                                        <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', color: '#5a9a72' }}>
                                          ✓ {isAr ? 'موثّق' : lang === 'zh' ? '已认证' : 'Verified'}
                                        </span>
                                      )}
                                    </div>
                                    {o.profiles?.rating > 0 && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
                                        <span style={{ color: '#a08050', fontSize: 11 }}>{'★'.repeat(Math.round(o.profiles.rating))}{'☆'.repeat(5 - Math.round(o.profiles.rating))}</span>
                                        <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>{o.profiles.rating.toFixed(1)} ({o.profiles.reviews_count || 0})</span>
                                      </div>
                                    )}
                                    {(supplierMaabarId || o.profiles?.city || o.profiles?.country || o.profiles?.years_experience) && (
                                      <p style={{ fontSize: 10, color: 'var(--text-disabled)', lineHeight: 1.6, marginBottom: 0 }}>
                                        {supplierMaabarId ? `${isAr ? 'معرّف المورد' : lang === 'zh' ? '供应商编号' : 'Supplier ID'}: ${supplierMaabarId}` : ''}
                                        {supplierMaabarId && (o.profiles?.city || o.profiles?.country) ? ' · ' : ''}
                                        {[o.profiles?.city, o.profiles?.country].filter(Boolean).join(', ')}
                                        {(supplierMaabarId || o.profiles?.city || o.profiles?.country) && o.profiles?.years_experience ? ' · ' : ''}
                                        {o.profiles?.years_experience ? (isAr ? `${o.profiles.years_experience} سنة خبرة` : lang === 'zh' ? `${o.profiles.years_experience} 年经验` : `${o.profiles.years_experience} years`) : ''}
                                      </p>
                                    )}
                                  </div>

                                  {supplierTrustSignals.length > 0 && (
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                                      {supplierTrustSignals.includes('trade_profile_available') && (
                                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'rgba(58,122,82,0.08)', border: '1px solid rgba(58,122,82,0.18)', color: '#5a9a72' }}>
                                          {isAr ? 'رابط شركة' : lang === 'zh' ? '店铺链接' : 'Trade link'}
                                        </span>
                                      )}
                                      {supplierTrustSignals.includes('wechat_available') && (
                                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}>
                                          WeChat
                                        </span>
                                      )}
                                      {supplierTrustSignals.includes('factory_media_available') && (
                                        <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                                          {isAr ? 'صور مصنع' : lang === 'zh' ? '工厂图片' : 'Factory photos'}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {(() => {
                                    const offerCcy = normalizeDisplayCurrency(o.currency || 'USD');
                                    return (
                                  <div style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
                                    <p style={{ fontSize: 24, fontWeight: 300, color: 'var(--text-primary)', lineHeight: 1 }}>
                                      {o.price} <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>{offerCcy}</span>
                                    </p>
                                    <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                                      {isAr ? 'سعر الوحدة' : lang === 'zh' ? '产品单价' : 'Unit price'}
                                      {offerCcy !== viewerCurrency && (
                                        <> · ≈ {formatPriceWithConversion({ amount: parseFloat(o.price || 0), sourceCurrency: offerCcy, displayCurrency: viewerCurrency, rates: exchangeRates, lang, options: { minimumFractionDigits: 2 } }).split(' ≈ ')[1]}</>
                                      )}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                      {isAr ? 'تكلفة المنتجات' : lang === 'zh' ? '产品合计' : 'Products total'}: {formatPriceWithConversion({ amount: getOfferProductSubtotal(o, r), sourceCurrency: offerCcy, displayCurrency: viewerCurrency, rates: exchangeRates, lang, options: { minimumFractionDigits: 2 } })}
                                    </p>
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                      {isAr ? 'الشحن' : lang === 'zh' ? '运费' : 'Shipping'}: {hasOfferShippingCost(o)
                                        ? formatPriceWithConversion({ amount: getOfferShippingCost(o), sourceCurrency: offerCcy, displayCurrency: viewerCurrency, rates: exchangeRates, lang, options: { minimumFractionDigits: 2 } })
                                        : (isAr ? 'غير محدد بشكل منفصل' : lang === 'zh' ? '未单独填写' : 'Not specified separately')}
                                    </p>
                                    {getOfferShippingMethod(o, lang) && (
                                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                        {isAr ? 'طريقة الشحن' : lang === 'zh' ? '运输方式' : 'Shipping method'}: {getOfferShippingMethod(o, lang)}
                                      </p>
                                    )}
                                    <p style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                                      {isAr ? 'الإجمالي التقديري' : lang === 'zh' ? '预计总额' : 'Estimated total'}: {formatPriceWithConversion({ amount: offerEstimatedTotal, sourceCurrency: offerCcy, displayCurrency: viewerCurrency, rates: exchangeRates, lang, options: { minimumFractionDigits: 2 } })}
                                    </p>
                                    <p style={{ fontSize: 11, color: 'var(--text-disabled)' }}>
                                      MOQ: {formatMoq(o.moq)} · {o.delivery_days} {isAr ? 'يوم' : lang === 'zh' ? '天' : 'd'}{o.origin ? ` · ${isAr ? 'المنشأ' : lang === 'zh' ? '原产地' : 'Origin'}: ${o.origin}` : ''}
                                    </p>
                                  </div>
                                    );
                                  })()}

                                  {o.note && (
                                    <div style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                                      <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
                                        {isAr ? 'ملاحظة تجارية' : lang === 'zh' ? '商务备注' : 'Commercial note'}
                                      </p>
                                      <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                                        {o.note}
                                      </p>
                                    </div>
                                  )}
                                </>
                              );
                            })()}

                            {/* Pending offer action buttons */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                              <button onClick={() => acceptOffer(o.id, o.supplier_id, r.id)} className="btn-primary"
                                style={{ padding: '8px', fontSize: 11, letterSpacing: 1, width: '100%', minHeight: 34 }}>
                                {isAr ? 'قبول' : lang === 'zh' ? '接受报价' : 'Accept'}
                              </button>
                              <button onClick={() => rejectOffer(o.id, o.supplier_id, r.id)}
                                style={{ background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', padding: '7px', fontSize: 11, cursor: 'pointer', borderRadius: 'var(--radius-md)', minHeight: 34, width: '100%' }}>
                                {isAr ? 'رفض' : lang === 'zh' ? '拒绝' : 'Reject'}
                              </button>
                              <button onClick={() => nav(`/supplier/${o.supplier_id}`)} className="btn-outline"
                                style={{ padding: '7px', fontSize: 11, letterSpacing: 1, width: '100%', minHeight: 34 }}>
                                {isAr ? 'ملف المورد' : lang === 'zh' ? '供应商主页' : 'Supplier Profile'}
                              </button>
                              <button onClick={() => nav(`/chat/${o.supplier_id}`)} className="btn-outline"
                                style={{ padding: '7px', fontSize: 11, letterSpacing: 1, width: '100%', minHeight: 34 }}>
                                {isAr ? 'تواصل' : lang === 'zh' ? '联系' : 'Chat'}
                              </button>
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Status-driven action area (accepted offer) ── */}
                  {!managed && acceptedOffer && (() => {
                    const o = acceptedOffer;
                    const subtotal  = (o.price || 0) * (Number(r.quantity) || 1);
                    const shipping  = parseFloat(o.shipping_cost) || 0;
                    const total     = subtotal + shipping;
                    const pct       = r.payment_pct > 0 ? r.payment_pct : 30;
                    const firstAmt  = r.amount > 0 ? r.amount : parseFloat((total * pct / 100).toFixed(2));
                    const secondAmt = r.payment_second > 0 ? r.payment_second : parseFloat((total * (100 - pct) / 100).toFixed(2));
                    const currency  = o.currency || 'USD';

                    const btnPrimary = { padding: '11px 18px', fontSize: 13, minHeight: 44, width: '100%', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', letterSpacing: isAr ? 0 : 0.5 };
                    const btnOutline = { ...btnPrimary, background: 'none', border: '1px solid var(--border-muted)', color: 'var(--text-secondary)', cursor: 'pointer', borderRadius: 'var(--radius-md)' };
                    const btnDanger  = { ...btnPrimary, background: 'none', border: '1px solid rgba(138,58,58,0.3)', color: '#a07070', cursor: 'pointer', borderRadius: 'var(--radius-md)' };

                    return (
                      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 0', borderTop: '1px solid var(--border-subtle)' }}>

                        {r.status === 'closed' && (
                          <>
                            <p style={{ fontSize: 12, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', marginBottom: 4 }}>
                              {isAr ? 'في انتظار تأكيد المورد' : 'Waiting for supplier confirmation'}
                            </p>
                            <button onClick={() => nav(`/chat/${o.supplier_id}`)} style={btnOutline}>
                              {isAr ? 'تواصل مع المورد' : 'Chat with Supplier'}
                            </button>
                            <button onClick={() => setCancelConfirmReq(r)} style={btnDanger}>
                              {isAr ? 'إلغاء الطلب' : 'Cancel Request'}
                            </button>
                          </>
                        )}

                        {r.status === 'supplier_confirmed' && (
                          <>
                            <button onClick={() => nav('/checkout', { state: { offer: o, request: r } })} className="btn-primary" style={btnPrimary}>
                              {isAr ? `ادفع الدفعة الأولى — ${firstAmt} ${currency}` : `Pay 1st Installment — ${firstAmt} ${currency}`}
                            </button>
                            <button onClick={() => nav(`/chat/${o.supplier_id}`)} style={btnOutline}>
                              {isAr ? 'تواصل مع المورد' : 'Chat with Supplier'}
                            </button>
                            <button onClick={() => setCancelConfirmReq(r)} style={btnDanger}>
                              {isAr ? 'إلغاء الطلب' : 'Cancel Request'}
                            </button>
                          </>
                        )}

                        {r.status === 'paid' && (
                          <>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', padding: '4px 0' }}>
                              {isAr ? 'في انتظار الإنتاج — المورد يجهّز شحنتك' : 'Awaiting production — supplier is preparing your order'}
                            </p>
                            <button onClick={() => nav(`/chat/${o.supplier_id}`)} style={btnOutline}>
                              {isAr ? 'تواصل مع المورد' : 'Chat with Supplier'}
                            </button>
                          </>
                        )}

                        {r.status === 'ready_to_ship' && secondAmt > 0 && (
                          <>
                            <button onClick={() => nav('/checkout', { state: { offer: o, request: r, isSecondPayment: true } })} className="btn-primary" style={btnPrimary}>
                              {isAr ? `ادفع الدفعة الثانية — ${secondAmt} ${currency}` : `Pay 2nd Installment — ${secondAmt} ${currency}`}
                            </button>
                            <button onClick={() => nav(`/chat/${o.supplier_id}`)} style={btnOutline}>
                              {isAr ? 'تواصل مع المورد' : 'Chat with Supplier'}
                            </button>
                          </>
                        )}

                        {r.status === 'shipping' && (
                          <>
                            {secondAmt > 0 && (
                              <button onClick={() => nav('/checkout', { state: { offer: o, request: r, isSecondPayment: true } })} className="btn-primary" style={btnPrimary}>
                                {isAr ? `ادفع الدفعة الثانية — ${secondAmt} ${currency}` : `Pay 2nd Installment — ${secondAmt} ${currency}`}
                              </button>
                            )}
                            <button onClick={async () => { await sb.from('requests').update({ status: 'arrived', shipping_status: 'arrived' }).eq('id', r.id); loadMyRequests(); }} style={btnOutline}>
                              {isAr ? 'استلمت الشحنة' : 'Shipment Received'}
                            </button>
                            <button onClick={() => nav(`/chat/${o.supplier_id}`)} style={btnOutline}>
                              {isAr ? 'تواصل مع المورد' : 'Chat with Supplier'}
                            </button>
                          </>
                        )}

                        {r.status === 'arrived' && (
                          <button onClick={() => confirmDelivery(r.id, o.supplier_id, o.profiles?.company_name)} className="btn-primary"
                            style={{ ...btnPrimary, background: 'rgba(58,122,82,0.9)', borderColor: 'transparent' }}>
                            {isAr ? 'تأكيد الاستلام' : 'Confirm Delivery'}
                          </button>
                        )}

                        {r.status === 'delivered' && (
                          <>
                            <p style={{ fontSize: 12, color: '#5a9a72', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                              {isAr ? 'تم التسليم ✓' : 'Delivered ✓'}
                            </p>
                            {!submittedReviewIds.has(r.id) && (
                              <button onClick={() => setReviewModal({ supplierId: o.supplier_id, requestId: r.id, supplierName: o.profiles?.company_name || '' })}
                                style={btnOutline}>
                                {isAr ? 'قيّم المورد' : 'Rate Supplier'}
                              </button>
                            )}
                            <button onClick={() => nav(`/supplier/${o.supplier_id}`)} style={btnOutline}>
                              {isAr ? 'ملف المورد' : 'Supplier Profile'}
                            </button>
                          </>
                        )}

                      </div>
                    );
                  })()}

                  {!managed && r.offers.length === 0 && (
                    <p style={{ color: 'var(--text-disabled)', fontSize: 12, marginTop: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {isAr ? 'لا توجد عروض بعد' : 'No offers yet'}
                    </p>
                  )}
                </div>
              );
              });
              })()}
            </div>
          )}

          {/* ── DIRECT PURCHASE ORDERS (Step 4) ── */}
          {activeTab === 'direct-orders' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'مشترياتي المباشرة' : lang === 'zh' ? '我的直接采购' : 'My Direct Purchases'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 28, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isAr
                  ? 'الطلبات التي اشتريتها مباشرة من صفحات المنتجات. عند تأكيد المورد، تظهر هنا «ادفع الآن».'
                  : lang === 'zh'
                    ? '您从产品页面直接下单的采购订单。供应商确认后，此处会出现「立即付款」。'
                    : 'Orders you placed directly from product pages. When the supplier confirms, "Pay Now" appears here.'}
              </p>

              {loadingDirectOrders && (
                <div style={{ padding: '60px 0', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'جاري التحميل…' : lang === 'zh' ? '加载中…' : 'Loading…'}
                  </p>
                </div>
              )}

              {!loadingDirectOrders && directOrders.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 14, marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'لا توجد مشتريات مباشرة بعد' : lang === 'zh' ? '暂无直接采购订单' : 'No direct purchases yet'}
                  </p>
                  <button onClick={() => nav('/products')} className="btn-outline" style={{ padding: '8px 20px', fontSize: 12, minHeight: 36 }}>
                    {isAr ? 'تصفح المنتجات' : lang === 'zh' ? '浏览产品' : 'Browse Products'}
                  </button>
                </div>
              )}

              {!loadingDirectOrders && directOrders.map(r => {
                const product = r.product || {};
                const supplierProfile = product.profiles || null;
                const productName = lang === 'zh'
                  ? (product.name_zh || product.name_en || product.name_ar)
                  : lang === 'en'
                    ? (product.name_en || product.name_ar || product.name_zh)
                    : (product.name_ar || product.name_en || product.name_zh);
                const supplierName = supplierProfile?.company_name || supplierProfile?.full_name || (isAr ? 'مورد' : lang === 'zh' ? '供应商' : 'Supplier');
                const unitPrice = Number(deriveProductPriceFrom(product) || 0);
                const currency = product.currency || 'USD';
                const qty = Number(r.quantity || 0);
                const totalEstimate = unitPrice * qty;
                const productImage = getPrimaryProductImage(product);
                const paying = Boolean(directOrderPaying[r.id]);

                // Status-specific copy + UI tone
                const statusInfo = (() => {
                  if (r.status === 'pending_supplier_confirmation') return {
                    label: isAr ? 'بانتظار تأكيد المورد' : lang === 'zh' ? '等待供应商确认' : 'Awaiting Supplier',
                    color: '#b4781e',
                    bg: 'rgba(180,120,30,0.05)',
                    border: 'rgba(180,120,30,0.30)',
                    body: isAr ? 'سيؤكد المورد طلبك خلال 24 ساعة. ستصلك إشعار فور الرد.' : lang === 'zh' ? '供应商将在 24 小时内确认订单，回复后您会收到通知。' : 'The supplier will confirm within 24 hours. You will be notified once they respond.',
                  };
                  if (r.status === 'supplier_confirmed') return {
                    label: isAr ? 'تم التأكيد — ادفع الآن' : lang === 'zh' ? '已确认 — 请立即付款' : 'Confirmed — Pay Now',
                    color: '#2d7a4f',
                    bg: 'rgba(45,122,79,0.06)',
                    border: 'rgba(45,122,79,0.35)',
                    body: isAr ? 'أكد المورد جاهزيته لتنفيذ طلبك. أكمل الدفع الكامل ليبدأ بالتجهيز.' : lang === 'zh' ? '供应商已确认接单。请完成全额付款，供应商将立即开始备货。' : 'Supplier confirmed. Pay the full amount to start preparation.',
                  };
                  if (r.status === 'supplier_rejected') return {
                    label: isAr ? 'رفض المورد' : lang === 'zh' ? '供应商已拒绝' : 'Supplier Declined',
                    color: '#a07070',
                    bg: 'rgba(138,58,58,0.05)',
                    border: 'rgba(138,58,58,0.30)',
                    body: isAr ? 'لم يتمكن المورد من تنفيذ طلبك. يمكنك تصفح موردين آخرين.' : lang === 'zh' ? '供应商无法接受此订单。您可以浏览其他供应商。' : 'The supplier could not fulfill this order. You can browse other suppliers.',
                  };
                  if (r.status === 'paid') return {
                    label: isAr ? 'تم الدفع — في انتظار التجهيز' : lang === 'zh' ? '已付款 — 等待备货' : 'Paid — Awaiting Preparation',
                    color: '#2d7a4f',
                    bg: 'rgba(45,122,79,0.05)',
                    border: 'rgba(45,122,79,0.25)',
                    body: isAr ? 'تم استلام دفعتك. المورد سيبدأ التجهيز ويرسل رقم التتبع قريباً.' : lang === 'zh' ? '已收到您的付款。供应商将开始备货，并尽快提供物流单号。' : 'Payment received. The supplier will prepare your order and share tracking shortly.',
                  };
                  if (r.status === 'ready_to_ship') return {
                    label: isAr ? 'الشحنة جاهزة' : lang === 'zh' ? '准备发货' : 'Ready to Ship',
                    color: '#b4781e',
                    bg: 'rgba(180,120,30,0.05)',
                    border: 'rgba(180,120,30,0.30)',
                    body: isAr ? 'المورد جهّز الشحنة وسيرسل رقم التتبع قريباً.' : lang === 'zh' ? '供应商已备货完毕，物流单号将很快提供。' : 'The supplier has prepared your shipment. Tracking will appear here shortly.',
                  };
                  if (r.status === 'shipping') return {
                    label: isAr ? 'في الطريق إليك' : lang === 'zh' ? '运输中' : 'On the Way',
                    color: '#b4781e',
                    bg: 'rgba(180,120,30,0.05)',
                    border: 'rgba(180,120,30,0.30)',
                    body: isAr ? 'الشحنة في الطريق. تابع رقم التتبع، وأكد الاستلام عند الوصول.' : lang === 'zh' ? '货物正在运送途中。请使用物流单号跟踪，到货后请确认。' : 'Your shipment is on the way. Track it below and mark it as arrived once it lands.',
                  };
                  if (r.status === 'arrived') return {
                    label: isAr ? 'وصلت — أكد الاستلام' : lang === 'zh' ? '已到货 — 请确认收货' : 'Arrived — Confirm Delivery',
                    color: '#4a6bbf',
                    bg: 'rgba(60,100,180,0.05)',
                    border: 'rgba(60,100,180,0.30)',
                    body: isAr ? 'وصلت الشحنة. عند فحصها وتأكيد سلامتها، أكد الاستلام لتحرير المبلغ للمورد.' : lang === 'zh' ? '货物已到达。检查无误后请确认收货，款项将放给供应商。' : 'The shipment arrived. After inspection, confirm delivery to release the payment to the supplier.',
                  };
                  if (r.status === 'delivered') return {
                    label: isAr ? 'مكتمل ✓' : lang === 'zh' ? '已完成 ✓' : 'Completed ✓',
                    color: '#2d7a4f',
                    bg: 'rgba(45,122,79,0.04)',
                    border: 'rgba(45,122,79,0.25)',
                    body: isAr ? `تم التسليم بنجاح في ${relativeTime(r.updated_at, isAr)}. تم تحويل المبلغ للمورد.` : lang === 'zh' ? `订单已于 ${relativeTime(r.updated_at, isAr)} 完成交付，款项已放给供应商。` : `Delivered ${relativeTime(r.updated_at, isAr)}. Payout has been released to the supplier.`,
                  };
                  return {
                    label: r.status,
                    color: 'var(--text-disabled)',
                    bg: 'var(--bg-subtle)',
                    border: 'var(--border-subtle)',
                    body: '',
                  };
                })();

                return (
                  <div key={r.id} style={{ marginBottom: 14, border: `1px solid ${statusInfo.border}`, background: statusInfo.bg, borderRadius: 'var(--radius-lg)', padding: '20px 22px' }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
                      {productImage && (
                        <div style={{ width: 88, height: 88, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--bg-subtle)', flexShrink: 0 }}>
                          <img src={productImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'var(--bg-raised)', border: `1px solid ${statusInfo.border}`, color: statusInfo.color, letterSpacing: 0.4, fontWeight: 600, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                            {statusInfo.label}
                          </span>
                          <span style={{ color: 'var(--text-disabled)', fontSize: 11 }}>{relativeTime(r.created_at, isAr)}</span>
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 500, marginBottom: 6, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          {productName || (isAr ? 'منتج' : 'Product')}
                        </h3>
                        <div style={{ display: 'flex', gap: 14, color: 'var(--text-secondary)', fontSize: 12, flexWrap: 'wrap', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          <span>{isAr ? 'المورد:' : lang === 'zh' ? '供应商：' : 'Supplier:'} {supplierName}</span>
                          <span>{isAr ? 'الكمية:' : lang === 'zh' ? '数量：' : 'Qty:'} {qty || '—'}</span>
                          {unitPrice > 0 && (
                            <span style={{ direction: 'ltr' }}>{unitPrice.toFixed(2)} {currency} / unit</span>
                          )}
                          {totalEstimate > 0 && (
                            <span style={{ direction: 'ltr', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {isAr ? 'الإجمالي:' : lang === 'zh' ? '总计：' : 'Total:'} {totalEstimate.toFixed(2)} {currency}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {statusInfo.body && (
                      <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 14, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {statusInfo.body}
                      </p>
                    )}

                    {/* Tracking panel — visible whenever a tracking number has been uploaded */}
                    {r.tracking_number && ['shipping', 'arrived', 'delivered'].includes(r.status) && (() => {
                      const carrier = r.shipping_company || 'Other';
                      const trackUrl = getTrackingUrl(carrier, r.tracking_number);
                      return (
                        <div style={{ marginBottom: 14, padding: '12px 14px', background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                          <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 8, fontFamily: 'var(--font-sans)' }}>
                            {isAr ? 'تتبع الشحنة' : lang === 'zh' ? '物流跟踪' : 'Shipment Tracking'}
                          </p>
                          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              {isAr ? 'شركة الشحن:' : lang === 'zh' ? '承运商：' : 'Carrier:'} <strong style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{carrier}</strong>
                            </span>
                            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                              {isAr ? 'رقم التتبع:' : lang === 'zh' ? '物流单号：' : 'Tracking #:'} <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-en)', fontWeight: 600, direction: 'ltr', display: 'inline-block' }}>{r.tracking_number}</strong>
                            </span>
                            <a href={trackUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#4a6bbf', textDecoration: 'none', borderBottom: '1px dashed #4a6bbf', paddingBottom: 1 }}>
                              {isAr ? 'تتبع الشحنة ↗' : lang === 'zh' ? '查看跟踪 ↗' : 'Track Shipment ↗'}
                            </a>
                          </div>
                        </div>
                      );
                    })()}

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {r.status === 'supplier_confirmed' && (
                        <button
                          onClick={() => payDirectOrder(r)}
                          disabled={paying || !product?.supplier_id}
                          className="btn-primary"
                          style={{ padding: '11px 22px', fontSize: 13, fontWeight: 600, minHeight: 44, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', letterSpacing: isAr ? 0 : 0.3 }}>
                          {paying ? '…' : isAr ? 'ادفع الآن ←' : lang === 'zh' ? '立即付款 →' : 'Pay Now →'}
                        </button>
                      )}
                      {r.status === 'shipping' && (
                        <button
                          onClick={() => markDirectOrderArrived(r)}
                          disabled={Boolean(directOrderActioning[r.id]) || !product?.supplier_id}
                          className="btn-primary"
                          style={{ padding: '11px 22px', fontSize: 13, fontWeight: 600, minHeight: 44, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', letterSpacing: isAr ? 0 : 0.3 }}>
                          {directOrderActioning[r.id] === 'marking_arrived' ? '…' : isAr ? 'تم استلام الشحنة' : lang === 'zh' ? '已收到货物' : 'Mark as Arrived'}
                        </button>
                      )}
                      {r.status === 'arrived' && (
                        <button
                          onClick={() => confirmDirectDelivery(r)}
                          disabled={Boolean(directOrderActioning[r.id]) || !product?.supplier_id}
                          style={{ padding: '11px 22px', fontSize: 13, fontWeight: 600, minHeight: 44, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', letterSpacing: isAr ? 0 : 0.3, background: '#2d7a4f', color: '#ffffff', border: 'none', borderRadius: 'var(--radius-md)', cursor: directOrderActioning[r.id] ? 'not-allowed' : 'pointer' }}>
                          {directOrderActioning[r.id] === 'confirming_delivery' ? '…' : isAr ? 'تأكيد الاستلام' : lang === 'zh' ? '确认收货' : 'Confirm Delivery'}
                        </button>
                      )}
                      {r.status === 'delivered' && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(45,122,79,0.10)', border: '1px solid rgba(45,122,79,0.30)', borderRadius: 'var(--radius-md)', color: '#2d7a4f', fontSize: 12, fontWeight: 600, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          ✓ {isAr ? `مكتمل · ${relativeTime(r.updated_at, isAr)}` : lang === 'zh' ? `已完成 · ${relativeTime(r.updated_at, isAr)}` : `Completed · ${relativeTime(r.updated_at, isAr)}`}
                        </span>
                      )}
                      {r.status === 'supplier_rejected' && (
                        <button onClick={() => nav('/products')} className="btn-outline" style={{ padding: '9px 18px', fontSize: 12, minHeight: 38, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          {isAr ? 'تصفح المنتجات' : lang === 'zh' ? '浏览产品' : 'Browse Products'}
                        </button>
                      )}
                      {product?.supplier_id && r.status !== 'supplier_rejected' && r.status !== 'delivered' && (
                        <button onClick={() => nav(`/chat/${product.supplier_id}`)} className="btn-outline" style={{ padding: '9px 18px', fontSize: 12, minHeight: 38, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          {isAr ? 'تواصل مع المورد' : lang === 'zh' ? '联系供应商' : 'Chat with Supplier'}
                        </button>
                      )}
                      {product?.id && (
                        <button onClick={() => nav(`/products/${product.id}`)} className="btn-outline" style={{ padding: '9px 18px', fontSize: 12, minHeight: 38, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          {isAr ? 'عرض المنتج' : lang === 'zh' ? '查看产品' : 'View Product'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SAMPLES ── */}
          {activeTab === 'samples' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'طلبات العينات' : 'Sample Requests'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {isAr ? 'تابع حالة العينات وتواصل مع المورد بعد الموافقة.' : 'Track your sample requests and contact the supplier after approval.'}
              </p>

              {samples.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'لا توجد طلبات عينات بعد' : 'No sample requests yet'}
                  </p>
                </div>
              ) : samples.map((s, idx) => {
                const supplierName = s.profiles?.company_name || s.profiles?.full_name || 'Supplier';
                const productName = s.products?.name_ar || s.products?.name_en || s.products?.name_zh || 'Product';
                const supplierTrustSignals = buildSupplierTrustSignals(s.profiles || {});
                const sampleSupplierMaabarId = getSupplierMaabarId(s.profiles || {});
                const isReviewedSupplier = isSupplierPubliclyVisible(s.profiles?.status);
                return (
                  <div key={s.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '18px 0', animation: `fadeIn 0.35s ease ${idx * 0.04}s both` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 10 }}>
                      <div>
                        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 5, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{productName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{isAr ? 'المورد:' : lang === 'zh' ? '供应商：' : 'Supplier:'} {supplierName}</p>
                          {isReviewedSupplier && (
                            <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 999, background: 'rgba(58,122,82,0.1)', border: '1px solid rgba(58,122,82,0.2)', color: '#5a9a72' }}>
                              ✓ {isAr ? 'موثّق' : lang === 'zh' ? '已认证' : 'Verified'}
                            </span>
                          )}
                        </div>
                        {(sampleSupplierMaabarId || s.profiles?.city || s.profiles?.country || s.profiles?.years_experience) && (
                          <p style={{ fontSize: 10, color: 'var(--text-disabled)', marginTop: 6, lineHeight: 1.6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                            {sampleSupplierMaabarId ? `${isAr ? 'معرّف المورد' : lang === 'zh' ? '供应商编号' : 'Supplier ID'}: ${sampleSupplierMaabarId}` : ''}
                            {sampleSupplierMaabarId && (s.profiles?.city || s.profiles?.country) ? ' · ' : ''}
                            {[s.profiles?.city, s.profiles?.country].filter(Boolean).join(', ')}
                            {(sampleSupplierMaabarId || s.profiles?.city || s.profiles?.country) && s.profiles?.years_experience ? ' · ' : ''}
                            {s.profiles?.years_experience ? (isAr ? `${s.profiles.years_experience} سنة خبرة` : lang === 'zh' ? `${s.profiles.years_experience} 年经验` : `${s.profiles.years_experience} years`) : ''}
                          </p>
                        )}
                      </div>
                      <span style={{ fontSize: 11, padding: '5px 10px', borderRadius: 999, background: s.status === 'approved' ? 'rgba(58,122,82,0.1)' : s.status === 'rejected' ? 'rgba(160,112,112,0.1)' : 'var(--bg-subtle)', color: s.status === 'approved' ? '#5a9a72' : s.status === 'rejected' ? '#a07070' : 'var(--text-secondary)' }}>
                        {s.status === 'approved' ? (isAr ? 'تمت الموافقة' : lang === 'zh' ? '已批准' : 'Approved') : s.status === 'rejected' ? (isAr ? 'مرفوضة' : lang === 'zh' ? '已拒绝' : 'Rejected') : (isAr ? 'قيد المراجعة' : lang === 'zh' ? '审核中' : 'Pending')}
                      </span>
                    </div>

                    {(supplierTrustSignals.length > 0 || s.profiles?.rating > 0) && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                        {s.profiles?.rating > 0 && (
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            ★ {s.profiles.rating.toFixed(1)}{s.profiles?.reviews_count ? ` · ${s.profiles.reviews_count}` : ''}
                          </span>
                        )}
                        {supplierTrustSignals.includes('trade_profile_available') && (
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, background: 'rgba(58,122,82,0.08)', border: '1px solid rgba(58,122,82,0.18)', color: '#5a9a72' }}>
                            {isAr ? 'رابط شركة' : lang === 'zh' ? '店铺链接' : 'Trade link'}
                          </span>
                        )}
                        {supplierTrustSignals.includes('wechat_available') && (
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid rgba(0,0,0,0.08)', color: 'var(--text-secondary)' }}>
                            WeChat
                          </span>
                        )}
                        {supplierTrustSignals.includes('factory_media_available') && (
                          <span style={{ fontSize: 10, padding: '3px 9px', borderRadius: 999, background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                            {isAr ? 'صور مصنع' : lang === 'zh' ? '工厂图片' : 'Factory photos'}
                          </span>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      <span>{isAr ? 'الكمية:' : lang === 'zh' ? '数量：' : 'Qty:'} {s.quantity}</span>
                      <span>{isAr ? 'الإجمالي:' : lang === 'zh' ? '总额：' : 'Total:'} {s.total_price} SAR</span>
                    </div>
                    {s.notes && (
                      <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>💬 {s.notes}</p>
                    )}
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {s.status === 'approved' && (
                        <button className="btn-primary" onClick={() => nav('/checkout', {
                          state: {
                            offer: {
                              id: s.id,
                              request_id: s.id,
                              supplier_id: s.supplier_id,
                              profiles: s.profiles || null,
                              price: (parseFloat(s.sample_price || 0) + parseFloat(s.shipping_price || 0)),
                              currency: 'SAR',
                              delivery_days: 14,
                              status: 'accepted',
                              isDirect: true,
                            },
                            request: {
                              id: s.id,
                              title_ar: `عينة: ${productName}`,
                              title_en: `Sample: ${productName}`,
                              quantity: s.quantity,
                              status: 'closed',
                              buyer_id: user.id,
                            },
                          }
                        })} style={{ minHeight: 34, fontSize: 11 }}>
                          {isAr ? `ادفع ${s.total_price} SAR` : lang === 'zh' ? `支付 ${s.total_price} SAR` : `Pay ${s.total_price} SAR`}
                        </button>
                      )}
                      <button className="btn-outline" onClick={() => nav(`/supplier/${s.supplier_id}`)} style={{ minHeight: 34, fontSize: 11 }}>
                        {isAr ? 'ملف المورد' : lang === 'zh' ? '供应商主页' : 'Supplier Profile'}
                      </button>
                      <button className="btn-outline" onClick={() => nav(`/chat/${s.supplier_id}`)} style={{ minHeight: 34, fontSize: 11 }}>
                        {isAr ? 'محادثة المورد' : lang === 'zh' ? '联系供应商' : 'Chat Supplier'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── PRODUCT INQUIRIES ── */}
          {activeTab === 'product-inquiries' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 14, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'استفسارات المنتجات' : lang === 'zh' ? '产品咨询' : 'Product Inquiries'}
              </h2>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 28, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', maxWidth: 760 }}>
                {isAr
                  ? 'كل استفسار ترسله من صفحة المنتج يظهر هنا، وعندما يرد المورد ستشاهد الرد داخل النظام بالإضافة إلى وصوله على بريدك.'
                  : lang === 'zh'
                    ? '您从产品页发送的咨询都会显示在这里。供应商回复后，您可以在系统内看到完整记录，邮件也会同步送达。'
                    : 'Every inquiry you send from a product page appears here. When the supplier replies, you will see it inside the system and also receive it by email.'}
              </p>

              {productInquiries.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'لا توجد استفسارات منتجات بعد' : lang === 'zh' ? '暂时没有产品咨询' : 'No product inquiries yet'}
                  </p>
                </div>
              ) : productInquiries.map((inquiry, idx) => {
                const supplierName = inquiry.profiles?.company_name || inquiry.profiles?.full_name || (isAr ? 'مورد' : lang === 'zh' ? '供应商' : 'Supplier');
                const productName = getProductInquiryProductName(inquiry.products, lang);
                const statusLabel = getProductInquiryStatusLabel(inquiry.status, lang, 'buyer');
                const replies = inquiry.product_inquiry_replies || [];
                return (
                  <div key={inquiry.id} style={{ borderTop: '1px solid var(--border-subtle)', padding: '22px 0', animation: `fadeIn 0.35s ease ${idx * 0.04}s both` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 12 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{productName}</p>
                        <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginBottom: 4 }}>{supplierName}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.8, margin: 0, fontFamily: 'var(--font-ar)' }}>{inquiry.question_text}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isAr ? 'flex-start' : 'flex-end', gap: 6 }}>
                        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, border: '1px solid var(--border-subtle)', color: inquiry.status === 'answered' ? '#5a9a72' : 'var(--text-secondary)' }}>
                          {statusLabel}
                        </span>
                        <p style={{ fontSize: 11, color: 'var(--text-disabled)', margin: 0 }}>{new Date(inquiry.updated_at || inquiry.created_at).toLocaleDateString(isAr ? 'ar-SA-u-nu-latn' : 'en-US')}</p>
                      </div>
                    </div>

                    {replies.length === 0 ? (
                      <div style={{ padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                          {isAr ? 'بانتظار رد المورد.' : lang === 'zh' ? '等待供应商回复。' : 'Waiting for the supplier reply.'}
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gap: 10 }}>
                        {replies.map((reply) => (
                          <div key={reply.id} style={{ padding: '12px 14px', borderRadius: 'var(--radius-lg)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                            <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 6 }}>
                              {isAr ? 'رد المورد' : lang === 'zh' ? '供应商回复' : 'Supplier reply'}
                            </p>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{reply.message}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                      {inquiry.product_id && (
                        <button className="btn-outline" onClick={() => nav(`/products/${inquiry.product_id}`)}>
                          {isAr ? 'فتح المنتج' : lang === 'zh' ? '打开产品' : 'Open Product'}
                        </button>
                      )}
                      {inquiry.supplier_id && (
                        <button className="btn-outline" onClick={() => nav(`/chat/${inquiry.supplier_id}`)}>
                          {isAr ? 'محادثة المورد' : lang === 'zh' ? '联系供应商' : 'Chat Supplier'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── MESSAGES ── */}
          {activeTab === 'messages' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 20, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'الرسائل' : 'Messages'}
              </h2>

              <TopSubTabs
                isAr={isAr}
                active={msgSubFilter}
                onSelect={setMsgSubFilter}
                tabs={[
                  { id: 'all',    label: isAr ? 'الكل'        : 'All'    },
                  { id: 'unread', label: isAr ? 'غير مقروءة' : 'Unread', badge: inbox.filter(m => !m.is_read).length || null },
                ]}
              />

              {inbox.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '80px 0', borderTop: '1px solid var(--border-subtle)' }}>
                  <p style={{ color: 'var(--text-disabled)', fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'ما عندك رسائل بعد' : 'No messages yet'}
                  </p>
                </div>
              ) : inbox.filter(m => msgSubFilter === 'unread' ? !m.is_read : true).map((m, idx) => {
                const senderName = m.profiles?.company_name || m.profiles?.full_name || '—';
                return (
                  <div key={m.id} onClick={() => nav(`/chat/${m.sender_id}`)} style={{
                    display: 'flex', alignItems: 'center', gap: 16,
                    padding: '14px 0', borderTop: '1px solid var(--border-subtle)',
                    cursor: 'pointer', transition: 'opacity 0.15s',
                    animation: `fadeIn 0.35s ease ${idx * 0.04}s both`,
                    minHeight: 56,
                  }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.65'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                    <div className="avatar">
                      {senderName.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>{senderName}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-disabled)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>{m.content}</p>
                    </div>
                    {!m.is_read && (
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, opacity: 0.8 }} />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div style={section}>
              <BackBtn onClick={() => setActiveTab('overview')} isAr={isAr} />
              <h2 style={{ fontSize: isAr ? 28 : 34, fontWeight: 300, marginBottom: 32, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -0.5 }}>
                {isAr ? 'إعدادات الحساب' : 'Account Settings'}
              </h2>

              <div style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-muted)',
                padding: '28px 32px',
                maxWidth: 560,
                borderRadius: 'var(--radius-xl)',
              }}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
                    <input className="form-input" value={settings.full_name} onChange={e => setSettings({ ...settings, full_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'رقم الجوال' : 'Phone'}</label>
                    <input className="form-input" value={settings.phone} onChange={e => setSettings({ ...settings, phone: e.target.value })} placeholder="+966 5x xxx xxxx" dir="ltr" />
                  </div>
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'المدينة' : 'City'}</label>
                    <select className="form-input" value={settings.city} onChange={e => setSettings({ ...settings, city: e.target.value })}>
                      <option value="">{isAr ? 'اختر مدينة' : 'Select city'}</option>
                      {(isAr ? CITIES_AR : CITIES_EN).map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'اسم الشركة / النشاط' : 'Company / Business'}</label>
                    <input className="form-input" value={settings.company_name} onChange={e => setSettings({ ...settings, company_name: e.target.value })} placeholder={isAr ? 'اختياري' : 'Optional'} />
                  </div>
                  <div className="form-group">
                    <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'عملة العرض المفضلة' : lang === 'zh' ? '首选显示货币' : 'Preferred Display Currency'}</label>
                    <select className="form-input" value={settings.preferred_display_currency || 'USD'} onChange={e => setSettings({ ...settings, preferred_display_currency: e.target.value })}>
                      {DISPLAY_CURRENCIES.map(currency => <option key={currency} value={currency}>{currency}</option>)}
                    </select>
                  </div>
                </div>

                <p style={{ fontSize: 12, color: 'var(--text-disabled)', marginTop: 8, lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                  {isAr
                    ? 'هذه للعملة المعروضة فقط أثناء التصفح. الدفع والعقود تبقى بعملة المنتج أو الصفقة الأصلية.'
                    : lang === 'zh'
                    ? '这只影响浏览时的显示货币。实际产品/交易货币保持原样。'
                    : 'This only changes browsing display prices. Product and transaction source currencies stay unchanged.'}
                </p>

                <button onClick={saveSettings} disabled={savingSettings} className="btn-primary"
                  style={{ padding: '11px 28px', fontSize: 13, marginTop: 8, minHeight: 44 }}>
                  {savingSettings ? '...' : isAr ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
                {settingsSaved && (
                  <p style={{ color: '#5a9a72', fontSize: 13, marginTop: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                    {isAr ? 'تم حفظ التغييرات ✓' : 'Changes saved ✓'}
                  </p>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══════════════════════════════════════
          REVIEW MODAL
      ══════════════════════════════════════ */}
      {reviewModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            width: '100%', maxWidth: 400,
            animation: 'slideUp 0.25s ease',
            boxShadow: 'var(--shadow-md)',
          }}>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
              {isAr ? 'تقييم المورد' : 'Rate Supplier'}
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 6, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)' }}>
              {isAr ? `كيف كانت تجربتك مع ${reviewModal.supplierName}؟` : `How was your experience with ${reviewModal.supplierName}?`}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 24, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.7 }}>
              {isAr ? 'تقييمك يساعد التجار الآخرين على اختيار الموردين الموثوقين' : 'Your review helps other traders choose reliable suppliers'}
            </p>

            {/* Stars */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, justifyContent: 'center' }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} onClick={() => setReviewRating(star)} style={{
                  fontSize: 32, background: 'none', border: 'none', cursor: 'pointer',
                  color: star <= reviewRating ? '#a08050' : 'var(--border-default)',
                  transition: 'all 0.15s',
                  transform: star <= reviewRating ? 'scale(1.1)' : 'scale(1)',
                }}>★</button>
              ))}
            </div>

            <div className="form-group">
              <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'تعليق (اختياري)' : 'Comment (optional)'}</label>
              <textarea className="form-input" rows={3}
                style={{ resize: 'none', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                value={reviewComment}
                onChange={e => setReviewComment(e.target.value)}
                placeholder={isAr ? 'شاركنا تجربتك...' : 'Share your experience...'}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button onClick={submitReview} disabled={!reviewRating || submittingReview} className="btn-primary"
                style={{ flex: 1, padding: '11px', fontSize: 12, minHeight: 44, opacity: !reviewRating ? 0.4 : 1 }}>
                {submittingReview ? '...' : isAr ? 'إرسال التقييم' : 'Submit Review'}
              </button>
              <button onClick={() => setReviewModal(null)} className="btn-outline"
                style={{ padding: '11px 18px', fontSize: 12, minHeight: 44 }}>
                {isAr ? 'تخطي' : 'Skip'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          EDIT REQUEST MODAL
      ══════════════════════════════════════ */}
      {editReqModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            width: '100%', maxWidth: 480,
            animation: 'slideUp 0.25s ease',
            boxShadow: 'var(--shadow-md)',
          }}>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
              {isAr ? 'تعديل الطلب' : 'Edit Request'}
            </p>

            <div className="form-grid" style={{ marginBottom: 16 }}>
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'العنوان بالعربي' : 'Title (Arabic)'}</label>
                <input className="form-input" dir="rtl" value={editReqForm.title_ar}
                  onChange={e => setEditReqForm(f => ({ ...f, title_ar: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">{isAr ? 'العنوان بالإنجليزي' : 'Title (English)'}</label>
                <input className="form-input" dir="ltr" value={editReqForm.title_en}
                  onChange={e => setEditReqForm(f => ({ ...f, title_en: e.target.value }))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'الوصف' : 'Description'}</label>
                <textarea className="form-input" rows={3} style={{ resize: 'none', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}
                  value={editReqForm.desc_ar}
                  onChange={e => setEditReqForm(f => ({ ...f, desc_ar: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className={`form-label${isAr ? ' ar' : ''}`}>{isAr ? 'الكمية' : 'Quantity'}</label>
                <input className="form-input" value={editReqForm.quantity}
                  onChange={e => setEditReqForm(f => ({ ...f, quantity: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={saveEditRequest} disabled={savingEditReq} className="btn-primary"
                style={{ flex: 1, padding: '11px', fontSize: 12, minHeight: 44 }}>
                {savingEditReq ? '...' : isAr ? 'حفظ التغييرات' : 'Save Changes'}
              </button>
              <button onClick={() => setEditReqModal(null)} className="btn-outline"
                style={{ padding: '11px 18px', fontSize: 12, minHeight: 44 }}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          CANCEL REQUEST MODAL
      ══════════════════════════════════════ */}
      {cancelConfirmReq && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 24, animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border-muted)',
            borderRadius: 'var(--radius-xl)',
            padding: '36px 32px',
            width: '100%', maxWidth: 400,
            animation: 'slideUp 0.25s ease',
            boxShadow: 'var(--shadow-md)',
          }}>
            <p style={{ fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: 'var(--text-disabled)', marginBottom: 14 }}>
              {isAr ? 'إلغاء الطلب' : 'Cancel Request'}
            </p>
            <h3 style={{ fontSize: 18, fontWeight: 400, marginBottom: 10, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', color: 'var(--text-primary)' }}>
              {isAr
                ? (cancelConfirmReq.title_ar || cancelConfirmReq.title_en)
                : (cancelConfirmReq.title_en || cancelConfirmReq.title_ar)}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-disabled)', marginBottom: 16, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.7 }}>
              {isAr
                ? 'سيتم إلغاء الطلب وإعادته للحالة المفتوحة. هل تريد المتابعة؟'
                : 'This will cancel the accepted offer and re-open the request. Are you sure?'}
            </p>
            <p style={{ fontSize: 12, color: '#a07070', marginBottom: 20, padding: '10px 14px', background: 'rgba(138,58,58,0.08)', border: '1px solid rgba(138,58,58,0.2)', borderRadius: 'var(--radius-md)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)', lineHeight: 1.6 }}>
              {isAr
                ? 'تنبيه: بمجرد إتمام الدفع، لا يمكن الإلغاء واسترداد المبلغ.'
                : 'Note: Once payment is made, the order cannot be cancelled or refunded.'}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => cancelRequest(cancelConfirmReq)}
                style={{ flex: 1, padding: '11px', fontSize: 12, minHeight: 44, background: 'none', border: '1px solid rgba(138,58,58,0.4)', color: '#a07070', cursor: 'pointer', borderRadius: 'var(--radius-md)' }}>
                {isAr ? 'نعم، إلغاء الطلب' : 'Yes, Cancel Request'}
              </button>
              <button onClick={() => setCancelConfirmReq(null)} className="btn-outline"
                style={{ padding: '11px 18px', fontSize: 12, minHeight: 44 }}>
                {isAr ? 'رجوع' : 'Go Back'}
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={(tab) => { setActiveTab(tab); setMoreOpen(false); }}
        nav={nav}
        isAr={isAr}
        stats={stats}
        moreOpen={moreOpen}
        setMoreOpen={setMoreOpen}
      />

      <Footer lang={lang} />
    </div>
  );
}