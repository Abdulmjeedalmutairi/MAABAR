import React, { useEffect, useState } from 'react';
import { fetchBuyerActionItems, sortByUrgency, waitingLabel } from '../../lib/buyerActionItems';
import { MANAGED_STAGES, stageIndexOf, isCancelled } from '../../lib/managedStages';
import TranslatedText from '../TranslatedText';

// Redesigned trader Home — opens on the WORK, not the paperwork (mirror of the mobile
// design + SupplierHomePanel). Order: managed-order box (invite ↔ tracker) → browse
// (products / factories) → needs-your-action (light) → activity. No dark block.

const BRONZE = '#8B7355', INK = '#1A1814', RED = '#C0503F';

const T = {
  ar: {
    eyebrow: 'مَعبر · لوحة التاجر', hi: 'أهلاً', sub: 'كل ما يحتاج تصرّفك، ومنتجاتك ومصانعك.',
    messages: 'الرسائل',
    managedK: 'الطلب المُدار', managedInviteTitle: 'دع مَعبر تتكفّل بطلبك',
    managedInvitePitch: 'من البحث والتفاوض حتى باب بيتك — أنت توافق، وإحنا نتولّى الباقي.',
    managedStart: 'ابدأ طلباً مُداراً ←', managedTrack: 'متابعة الطلب المُدار ←',
    stageOf: (i, n) => `المرحلة ${i} من ${n}`, offerReady: 'عرضك المنسّق جاهز',
    browseProducts: 'المنتجات ←', browseFactories: 'المصانع ←',
    needs: 'يحتاج تصرّفك', activity: 'نشاطك',
    active: 'طلبات نشطة', offers: 'عروض جديدة', msgs: 'رسائل', done: 'مكتملة',
    kinds: { managed: 'طلب مُدار', rfq: 'طلب عرض سعر', direct: 'شراء مباشر', sample: 'عيّنة', inquiry: 'استفسار', message: 'رسالة' },
    acts: { review_offers: 'قارن العروض ←', pay_order: 'ادفع ←', confirm_receipt: 'أكّد الاستلام ←', view_inquiry: 'عرض الاستفسار ←', reply_message: 'ردّ ←', view_request: 'عرض الطلب ←', track_order: 'تتبّع ←', view_sample: 'عرض العيّنة ←' },
    party: 'مورد',
  },
  en: {
    eyebrow: 'Maabar · Trader dashboard', hi: 'Welcome', sub: 'Everything that needs you, your products and your factories.',
    messages: 'Messages',
    managedK: 'Managed order', managedInviteTitle: 'Let Maabar handle it',
    managedInvitePitch: 'From sourcing and negotiation to your door — you approve, we handle the rest.',
    managedStart: 'Start a managed order →', managedTrack: 'Track managed order →',
    stageOf: (i, n) => `Stage ${i} of ${n}`, offerReady: 'Your curated offer is ready',
    browseProducts: 'Products →', browseFactories: 'Factories →',
    needs: 'Needs your action', activity: 'Your activity',
    active: 'Active', offers: 'New offers', msgs: 'Messages', done: 'Completed',
    kinds: { managed: 'Managed order', rfq: 'Quote request', direct: 'Direct purchase', sample: 'Sample', inquiry: 'Inquiry', message: 'Message' },
    acts: { review_offers: 'Compare offers →', pay_order: 'Pay →', confirm_receipt: 'Confirm receipt →', view_inquiry: 'View inquiry →', reply_message: 'Reply →', view_request: 'View request →', track_order: 'Track →', view_sample: 'View sample →' },
    party: 'Supplier',
  },
  zh: {
    eyebrow: 'Maabar · 采购商面板', hi: '您好', sub: '所有需要您处理的事项、您的产品与工厂。',
    messages: '消息',
    managedK: '托管订单', managedInviteTitle: '让 Maabar 为您代劳',
    managedInvitePitch: '从寻源谈判到送货上门——您批准，其余由我们负责。',
    managedStart: '开始托管订单 →', managedTrack: '跟踪托管订单 →',
    stageOf: (i, n) => `第 ${i}/${n} 阶段`, offerReady: '您的精选报价已就绪',
    browseProducts: '产品 →', browseFactories: '工厂 →',
    needs: '待您处理', activity: '您的活动',
    active: '进行中', offers: '新报价', msgs: '消息', done: '已完成',
    kinds: { managed: '托管订单', rfq: '询价', direct: '直接采购', sample: '样品', inquiry: '咨询', message: '消息' },
    acts: { review_offers: '比较报价 →', pay_order: '支付 →', confirm_receipt: '确认收货 →', view_inquiry: '查看咨询 →', reply_message: '回复 →', view_request: '查看需求 →', track_order: '跟踪 →', view_sample: '查看样品 →' },
    party: '供应商',
  },
};

const RED_ACTIONS = new Set(['pay_order', 'confirm_receipt']);

export default function BuyerHomePanel({ sb, buyerId, lang = 'ar', name = '', messagesCount = 0, onOpenRequests, onOpenProducts, onOpenSuppliers, onNewManaged, onOpenManaged, onOpenMessages }) {
  const c = T[lang] || T.ar;
  const isAr = lang === 'ar';
  const font = isAr ? { fontFamily: 'var(--font-ar)' } : {};
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [names, setNames] = useState({});

  useEffect(() => {
    let alive = true;
    (async () => {
      const { items: it, counts: ct } = await fetchBuyerActionItems(sb, buyerId, lang);
      if (!alive) return;
      setItems(it); setCounts(ct);
      const ids = [...new Set(it.map((x) => x.partyId).filter(Boolean))];
      if (ids.length) {
        const { data } = await sb.from('profile_directory').select('id, full_name, company_name').in('id', ids);
        if (alive && data) setNames(data.reduce((a, p) => ({ ...a, [p.id]: p.company_name || p.full_name }), {}));
      }
    })();
    return () => { alive = false; };
  }, [sb, buyerId, lang]);

  // Latest non-cancelled managed order → tracker; otherwise invite.
  const managed = sortByUrgency(items.filter((x) => x.kind === 'managed' && !isCancelled(x.status)))
    .filter((x) => x.bucket !== 'completed');
  const activeManaged = managed[0] || null;
  // Needs-action list excludes the managed order (it has its own box above).
  const needs = sortByUrgency(items.filter((x) => x.bucket === 'needs_action' && x.kind !== 'managed')).slice(0, 3);
  const offersNew = items.filter((x) => x.action === 'review_offers').length;

  const Tile = ({ label, onClick }) => (
    <button onClick={onClick} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '15px 16px', textAlign: isAr ? 'right' : 'left', cursor: 'pointer', fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', ...font }}>{label}</button>
  );
  const Stat = ({ v, k, red, go }) => (
    <button onClick={go} style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 14, padding: '13px 15px', textAlign: isAr ? 'right' : 'left', cursor: go ? 'pointer' : 'default' }}>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 26, fontWeight: 500, lineHeight: 1, color: red && v > 0 ? RED : 'var(--text-primary)' }}>{v}</div>
      <div style={{ fontSize: 12.5, color: 'var(--text-disabled)', marginTop: 5, ...font }}>{k}</div>
    </button>
  );

  return (
    <div style={{ maxWidth: 640 }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: BRONZE, fontWeight: 600, ...font }}>{c.eyebrow}</div>
          <h1 style={{ fontSize: isAr ? 24 : 28, fontWeight: 700, lineHeight: 1.3, color: 'var(--text-primary)', margin: '4px 0 0', overflowWrap: 'anywhere', ...font }}>{c.hi}{name ? `، ${name}` : ''}</h1>
          <p style={{ fontSize: 13, color: 'var(--text-disabled)', margin: '5px 0 0', maxWidth: 420, ...font }}>{c.sub}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <button onClick={onOpenMessages} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 999, padding: '7px 13px', fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', ...font }}>
            {c.messages}
            {messagesCount > 0 && <span style={{ background: RED, color: '#fff', fontSize: 10, fontWeight: 700, minWidth: 17, height: 17, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{messagesCount}</span>}
          </button>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: BRONZE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>{(name || 'ت').trim().charAt(0)}</div>
        </div>
      </div>

      {/* managed order box — invite ↔ tracker */}
      {activeManaged ? (
        <button onClick={() => onOpenManaged?.(activeManaged.requestId)} style={{ display: 'block', width: '100%', textAlign: isAr ? 'right' : 'left', background: 'var(--bronze-soft, #EFE9E1)', border: '1px solid var(--bronze-line, #E2D8C9)', [isAr ? 'borderRight' : 'borderLeft']: `3px solid ${BRONZE}`, borderRadius: 16, padding: 15, marginTop: 18, cursor: 'pointer' }}>
          <div style={{ fontSize: 11, color: 'var(--bronze-deep, #75603F)', fontWeight: 700, ...font }}>{c.managedK}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 2px', ...font }}>{activeManaged.title ? <TranslatedText text={activeManaged.title} lang={lang} /> : c.managedK}</div>
          <div style={{ fontSize: 12.5, color: 'var(--text-disabled)', ...font }}>
            {activeManaged.status === 'offer_ready' ? `${c.offerReady} · ` : ''}{c.stageOf(stageIndexOf(activeManaged.status) + 1, MANAGED_STAGES.length)}
          </div>
          <div style={{ display: 'flex', gap: 5, margin: '11px 0' }}>
            {MANAGED_STAGES.map((_, i) => {
              const idx = stageIndexOf(activeManaged.status);
              return <span key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= idx ? BRONZE : 'var(--bronze-line, #E2D8C9)' }} />;
            })}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--bronze-deep, #75603F)', ...font }}>{c.managedTrack}</div>
        </button>
      ) : (
        <div style={{ background: 'var(--bronze-soft, #EFE9E1)', border: '1px solid var(--bronze-line, #E2D8C9)', [isAr ? 'borderRight' : 'borderLeft']: `3px solid ${BRONZE}`, borderRadius: 16, padding: 16, marginTop: 18 }}>
          <div style={{ fontSize: 11, color: 'var(--bronze-deep, #75603F)', fontWeight: 700, ...font }}>{c.managedK}</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 6px', ...font }}>{c.managedInviteTitle}</div>
          <p style={{ fontSize: 13, color: 'var(--text-disabled)', margin: '0 0 14px', lineHeight: 1.6, ...font }}>{c.managedInvitePitch}</p>
          <button onClick={onNewManaged} style={{ display: 'block', width: '100%', textAlign: 'center', background: INK, color: '#FAF8F5', border: 'none', borderRadius: 12, padding: 12, fontSize: 14, fontWeight: 700, cursor: 'pointer', ...font }}>{c.managedStart}</button>
        </div>
      )}

      {/* browse — products + factories */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
        <Tile label={c.browseProducts} onClick={onOpenProducts} />
        <Tile label={c.browseFactories} onClick={onOpenSuppliers} />
      </div>

      {/* needs your action — light */}
      {needs.length > 0 && (
        <>
          <div style={{ fontSize: 12, color: 'var(--text-disabled)', fontWeight: 700, margin: '22px 0 10px', ...font }}>{c.needs}</div>
          <div style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-subtle)', borderRadius: 14, overflow: 'hidden' }}>
            {needs.map((it) => {
              const isRed = RED_ACTIONS.has(it.action);
              return (
                <button key={it.key} onClick={() => onOpenRequests?.(it)} style={{ position: 'relative', display: 'flex', width: '100%', alignItems: 'center', gap: 12, textAlign: isAr ? 'right' : 'left', background: 'none', border: 'none', borderBottom: '1px solid var(--border-subtle)', padding: '13px 14px', cursor: 'pointer' }}>
                  <span style={{ position: 'absolute', insetInlineStart: 0, top: 8, bottom: 8, width: 3, borderRadius: 2, background: isRed ? RED : BRONZE }} />
                  <span style={{ flex: 1, minWidth: 0, paddingInlineStart: 6 }}>
                    <span style={{ display: 'block', fontSize: 10, color: BRONZE, fontWeight: 700, ...font }}>{c.kinds[it.kind]}</span>
                    <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0', ...font }}>{it.title ? <TranslatedText text={it.title} lang={lang} /> : (names[it.partyId] || c.party)}</span>
                    <span style={{ display: 'block', fontSize: 12, fontWeight: 700, color: isRed ? RED : 'var(--bronze-deep, #75603F)', ...font }}>{c.acts[it.action] || ''}</span>
                  </span>
                  <span style={{ fontSize: 11.5, color: isRed ? RED : 'var(--text-disabled)', whiteSpace: 'nowrap', fontWeight: isRed ? 600 : 400, ...font }}>{waitingLabel(it.waitingSince, lang)}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* activity */}
      <div style={{ fontSize: 12, color: 'var(--text-disabled)', fontWeight: 700, margin: '22px 0 10px', ...font }}>{c.activity}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
        <Stat v={counts.in_progress || 0} k={c.active} go={onOpenRequests} />
        <Stat v={offersNew} k={c.offers} go={onOpenRequests} />
        <Stat v={messagesCount} k={c.msgs} go={onOpenMessages} />
        <Stat v={counts.completed || 0} k={c.done} go={onOpenRequests} />
      </div>
    </div>
  );
}
