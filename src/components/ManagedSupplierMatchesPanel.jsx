import React, { useState } from 'react';
import { sb } from '../supabase';

export default function ManagedSupplierMatchesPanel({
  lang = 'ar',
  matches = [],
  activeGroup = 'all',
  onChangeGroup,
  offerForms = {},
  setOfferForms,
  offerDrafts = {},
  setOfferDrafts,
  submittingOfferId,
  onSubmitOffer,
  onDeclineMatch,
}) {
  const isAr = lang === 'ar';
  const isZh = lang === 'zh';

  // Request Details modal. Brief is fetched on open so the panel stays
  // presentational — DashboardSupplier doesn't need a schema change.
  const [detailsMatch, setDetailsMatch] = useState(null);
  const [detailsBrief, setDetailsBrief] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const openDetails = async (match) => {
    setDetailsMatch(match);
    setDetailsBrief(null);
    if (!match?.request_id) return;
    setDetailsLoading(true);
    const { data, error } = await sb
      .from('managed_request_briefs')
      .select('cleaned_description, supplier_brief, ai_output, ai_confidence')
      .eq('request_id', match.request_id)
      .maybeSingle();
    if (error) console.error('[ManagedSupplierMatchesPanel] brief fetch error:', error);
    setDetailsBrief(data || null);
    setDetailsLoading(false);
  };

  const closeDetails = () => {
    setDetailsMatch(null);
    setDetailsBrief(null);
    setDetailsLoading(false);
  };

  const pickBriefText = (brief) => {
    if (!brief) return null;
    const byLang = brief.ai_output?.supplier_brief_all;
    if (byLang && (byLang[lang] || byLang.en || byLang.ar || byLang.zh)) {
      return byLang[lang] || byLang.en || byLang.ar || byLang.zh;
    }
    return brief.supplier_brief || null;
  };

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch { return String(d); }
  };

  const groups = [
    { id: 'all', label: isAr ? 'الكل' : isZh ? '全部' : 'All' },
    { id: 'urgent', label: isAr ? 'عاجل' : isZh ? '紧急' : 'Urgent' },
    { id: 'electronics', label: isAr ? 'إلكترونيات' : isZh ? '电子产品' : 'Electronics' },
    { id: 'furniture', label: isAr ? 'أثاث' : isZh ? '家具' : 'Furniture' },
    { id: 'clothing', label: isAr ? 'ملابس' : isZh ? '服装' : 'Clothing' },
    { id: 'building', label: isAr ? 'مواد بناء' : isZh ? '建筑材料' : 'Building Materials' },
    { id: 'food', label: isAr ? 'غذاء' : isZh ? '食品' : 'Food' },
    { id: 'general', label: isAr ? 'عام' : isZh ? '通用' : 'General' },
  ];

  const filteredMatches = activeGroup === 'all'
    ? matches
    : matches.filter(m => m.group === activeGroup || m.category === activeGroup || m.requests?.category === activeGroup);

  const statusLabels = {
    ar: { new: 'جديد', viewed: 'تمت المشاهدة', quoted: 'تم التقديم', under_review: 'قيد المراجعة', declined: 'مرفوض', selected: 'مُختار', rejected: 'مرفوض', pending: 'بانتظار العرض', shortlisted: 'في القائمة المختصرة', selected_by_buyer: 'اختاره التاجر', dismissed: 'تم استبعاده', closed: 'مُغلق' },
    en: { new: 'New', viewed: 'Viewed', quoted: 'Submitted', under_review: 'Under review', declined: 'Declined', selected: 'Selected', rejected: 'Rejected', pending: 'Awaiting offer', shortlisted: 'Shortlisted', selected_by_buyer: 'Buyer chose you', dismissed: 'Dismissed', closed: 'Closed' },
    zh: { new: '新', viewed: '已查看', quoted: '已提交', under_review: '审核中', declined: '已拒绝', selected: '已选择', rejected: '已拒绝', pending: '等待报价', shortlisted: '入围候选', selected_by_buyer: '买家已选择您', dismissed: '已排除', closed: '已关闭' },
  };
  const getStatusLabel = (s) => statusLabels[lang]?.[s] || statusLabels.ar[s] || s || '—';

  const getRequestTitle = (m) => {
    const r = m.requests || {};
    return r.title || m.title || (isAr ? 'طلب بدون عنوان' : isZh ? '无标题请求' : 'Untitled request');
  };

  const getRequestDescription = (m) => {
    const r = m.requests || {};
    const desc = isZh
      ? (r.description_zh || r.description_en || r.description_ar || r.description)
      : lang === 'en'
        ? (r.description_en || r.description_ar || r.description)
        : (r.description_ar || r.description);
    return desc || m.description || '';
  };

  const updateDraft = (matchId, patch) => {
    setOfferDrafts?.((prev) => ({ ...prev, [matchId]: { ...(prev?.[matchId] || {}), ...patch } }));
  };

  const openForm = (matchId) => {
    setOfferForms?.((prev) => ({ ...prev, [matchId]: true }));
  };

  const closeForm = (matchId) => {
    setOfferForms?.((prev) => ({ ...prev, [matchId]: false }));
  };

  const handleDecline = (match) => {
    const msg = isAr ? 'هل تريد رفض هذا الطلب المطابق؟' : isZh ? '确定拒绝此匹配请求吗？' : 'Decline this matched request?';
    if (typeof window !== 'undefined' && !window.confirm(msg)) return;
    onDeclineMatch?.(match);
  };

  if (matches.length === 0) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}>
        <h3 style={{ fontSize: 18, color: 'var(--text-primary)', marginBottom: 12 }}>
          {isAr ? 'لا توجد طلبات مطابقة حالياً' : isZh ? '暂无匹配请求' : 'No matched requests yet'}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {isAr
            ? 'فريق معبر يبحث عن طلبات تناسب تخصصك. ستظهر هنا عند توفرها.'
            : isZh
              ? 'معبر（Maabar）团队正在为您寻找匹配的需求，出现后会在此显示。'
              : 'Maabar team is searching for requests that match your specialty. They will appear here when available.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {groups.map(group => (
          <button
            key={group.id}
            onClick={() => onChangeGroup?.(group.id)}
            style={{
              padding: '8px 16px',
              background: activeGroup === group.id ? 'var(--accent)' : 'var(--bg-subtle)',
              border: `1px solid ${activeGroup === group.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
              color: activeGroup === group.id ? 'white' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-md)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {group.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {filteredMatches.map(match => {
          const req = match.requests || {};
          const submitted = !!match.offer;
          const formOpen = !!offerForms[match.id];
          const draft = offerDrafts[match.id] || {};
          const submitting = submittingOfferId === match.id;
          const description = getRequestDescription(match);

          return (
            <div
              key={match.id}
              style={{
                padding: 20,
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {match.priority === 'urgent' && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  [isAr ? 'right' : 'left']: 12,
                  background: 'var(--accent)',
                  color: 'white',
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 12,
                  letterSpacing: 0.5,
                }}>
                  {isAr ? 'عاجل' : isZh ? '紧急' : 'URGENT'}
                </div>
              )}

              <div>
                <h4 style={{ fontSize: 16, color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  {getRequestTitle(match)}
                </h4>
                {description && (
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                    {description.substring(0, 120)}{description.length > 120 ? '…' : ''}
                  </p>
                )}
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-disabled)', flexWrap: 'wrap' }}>
                  <span>{isAr ? 'الفئة:' : isZh ? '类别：' : 'Category:'} {req.category || match.category || 'general'}</span>
                  <span>{isAr ? 'الحالة:' : isZh ? '状态：' : 'Status:'} {getStatusLabel(match.status)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => openDetails(match)}
                  style={{
                    marginTop: 8, padding: 0, background: 'none', border: 'none',
                    color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
                    textDecoration: 'underline',
                  }}
                >
                  {isAr ? 'تفاصيل الطلب' : isZh ? '需求详情' : 'Request Details'} →
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6, fontSize: 13 }}>
                <Row label={isAr ? 'الكمية المطلوبة:' : isZh ? '需求数量：' : 'Quantity:'} value={req.quantity || match.quantity || '—'} />
                <Row label={isAr ? 'الميزانية:' : isZh ? '预算：' : 'Budget:'} value={`${req.budget_per_unit || req.budget || match.budget || '—'} ${req.currency || match.currency || 'USD'}`} />
                <Row label={isAr ? 'الموعد النهائي:' : isZh ? '截止日期：' : 'Deadline:'} value={req.response_deadline || req.deadline || match.deadline || '—'} />
              </div>

              {submitted ? (
                <div style={{
                  padding: 12,
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>
                    {isAr ? '✓ تم تقديم عرضك' : isZh ? '✓ 您的报价已提交' : '✓ Your offer has been submitted'}
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 12, color: 'var(--text-disabled)', direction: 'ltr' }}>
                    {match.offer?.price != null && <span>${match.offer.price}/u</span>}
                    {match.offer?.moq && <span>MOQ {match.offer.moq}</span>}
                    {match.offer?.delivery_days != null && <span>{match.offer.delivery_days}d prod.</span>}
                  </div>
                </div>
              ) : formOpen ? (
                <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">{isAr ? 'سعر الوحدة (USD) *' : isZh ? '单价 (USD) *' : 'Unit Price (USD) *'}</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      dir="ltr"
                      value={draft.price ?? ''}
                      onChange={e => updateDraft(match.id, { price: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'تكلفة الشحن (USD) *' : isZh ? '运费 (USD) *' : 'Shipping Cost (USD) *'}</label>
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      dir="ltr"
                      value={draft.shippingCost ?? ''}
                      onChange={e => updateDraft(match.id, { shippingCost: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'MOQ *' : isZh ? '最小起订量 *' : 'MOQ *'}</label>
                    <input
                      className="form-input"
                      type="text"
                      value={draft.moq ?? ''}
                      onChange={e => updateDraft(match.id, { moq: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'مدة الإنتاج (أيام) *' : isZh ? '生产周期（天）*' : 'Production Days *'}</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      step="1"
                      dir="ltr"
                      value={draft.productionDays ?? ''}
                      onChange={e => updateDraft(match.id, { productionDays: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{isAr ? 'مدة الشحن (أيام) *' : isZh ? '运输时效（天）*' : 'Shipping Days *'}</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      step="1"
                      dir="ltr"
                      value={draft.shippingDays ?? ''}
                      onChange={e => updateDraft(match.id, { shippingDays: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">{isAr ? 'ملاحظة' : isZh ? '备注' : 'Note'}</label>
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ resize: 'none' }}
                      value={draft.note ?? ''}
                      onChange={e => updateDraft(match.id, { note: e.target.value })}
                      disabled={submitting}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      className="btn-dark-sm"
                      onClick={() => onSubmitOffer?.(match, draft)}
                      disabled={submitting}
                      style={{ minHeight: 40, flex: 1, opacity: submitting ? 0.7 : 1 }}
                    >
                      {submitting
                        ? (isAr ? 'جاري الإرسال...' : isZh ? '发送中...' : 'Sending...')
                        : (isAr ? 'إرسال العرض' : isZh ? '发送报价' : 'Send Offer')}
                    </button>
                    <button
                      className="btn-outline"
                      onClick={() => closeForm(match.id)}
                      disabled={submitting}
                      style={{ minHeight: 40 }}
                    >
                      {isAr ? 'إلغاء' : isZh ? '取消' : 'Cancel'}
                    </button>
                  </div>
                  <p style={{ gridColumn: '1 / -1', margin: 0, fontSize: 11, color: 'var(--text-disabled)' }}>
                    {isAr
                      ? 'يراه فريق معبر فقط — سعرك يبقى سرياً حتى إدراجك في القائمة القصيرة'
                      : isZh
                        ? '仅معبر（Maabar）团队可见 — 在您被列入候选名单前，您的报价保密'
                        : 'Only the Maabar team sees this — your price stays private until you are shortlisted'}
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => openForm(match.id)}
                    className="btn-dark-sm"
                    style={{ minHeight: 40, flex: 1 }}
                  >
                    {isAr ? 'تقديم عرض' : isZh ? '提交报价' : 'Submit Offer'}
                  </button>
                  <button
                    onClick={() => handleDecline(match)}
                    className="btn-outline"
                    style={{ minHeight: 40 }}
                  >
                    {isAr ? 'رفض' : isZh ? '拒绝' : 'Decline'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {detailsMatch && (() => {
        const req = detailsMatch.requests || {};
        const description = getRequestDescription(detailsMatch);
        const title = getRequestTitle(detailsMatch);
        const briefText = pickBriefText(detailsBrief);
        const L = (ar, en, zh) => (isAr ? ar : isZh ? zh : en);

        return (
          <div
            onClick={closeDetails}
            style={{
              position: 'fixed', inset: 0, zIndex: 1000,
              background: 'rgba(0,0,0,0.55)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              padding: 20,
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              dir={isAr ? 'rtl' : 'ltr'}
              style={{
                background: 'var(--bg-raised, #fff)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 16,
                width: '100%', maxWidth: 640, maxHeight: '85vh', overflow: 'auto',
                padding: 24,
                boxShadow: '0 12px 44px rgba(0,0,0,0.18)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontSize: 20, color: 'var(--text-primary)', lineHeight: 1.3 }}>{title}</h3>
                <button
                  type="button"
                  onClick={closeDetails}
                  aria-label="Close"
                  style={{
                    minWidth: 32, minHeight: 32, borderRadius: 16,
                    border: '1px solid var(--border-subtle)', background: 'transparent',
                    cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px 18px', marginBottom: 18 }}>
                <InfoField label={L('التصنيف', 'Category', '类别')} value={req.category || detailsMatch.category || '—'} />
                <InfoField label={L('الكمية', 'Quantity', '数量')} value={req.quantity || detailsMatch.quantity || '—'} />
                <InfoField
                  label={L('الميزانية', 'Budget', '预算')}
                  value={`${req.budget_per_unit || req.budget || detailsMatch.budget || '—'} ${req.currency || detailsMatch.currency || 'USD'}`}
                />
                <InfoField
                  label={L('الموعد النهائي', 'Deadline', '截止日期')}
                  value={fmtDate(req.response_deadline || req.deadline || detailsMatch.deadline)}
                />
                <InfoField label={L('الحالة', 'Status', '状态')} value={getStatusLabel(detailsMatch.status)} />
              </div>

              {description && (
                <div style={{ marginBottom: 18 }}>
                  <p style={{ margin: '0 0 6px', fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-disabled)' }}>
                    {L('الوصف الكامل', 'Full Description', '完整描述')}
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {description}
                  </p>
                </div>
              )}

              <div style={{
                padding: 14, borderRadius: 12,
                border: '1px solid rgba(139,105,20,0.20)',
                background: 'rgba(139,105,20,0.04)',
              }}>
                <p style={{ margin: '0 0 8px', fontSize: 10, fontWeight: 600, letterSpacing: 1.4, textTransform: 'uppercase', color: '#8B6914' }}>
                  {L('ملخص المورد من معبر', 'Maabar Supplier Brief', 'Maabar 供应商简报')}
                </p>
                {detailsLoading ? (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                    {L('جارٍ التحميل…', 'Loading…', '加载中…')}
                  </p>
                ) : briefText ? (
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {briefText}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--text-disabled)' }}>
                    {L('لم يُنشأ ملخص بعد.', 'No AI brief available yet.', '暂无 AI 简报。')}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: 'var(--text-disabled)' }}>{label}</p>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)' }}>{value}</p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ color: 'var(--text-primary)' }}>{value}</span>
    </div>
  );
}
