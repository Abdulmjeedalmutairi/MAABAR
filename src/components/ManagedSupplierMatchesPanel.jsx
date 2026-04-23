import React from 'react';

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
    ar: { new: 'جديد', viewed: 'تمت المشاهدة', quoted: 'تم التقديم', under_review: 'قيد المراجعة', declined: 'مرفوض', selected: 'مُختار', rejected: 'مرفوض', pending: 'بانتظار العرض' },
    en: { new: 'New', viewed: 'Viewed', quoted: 'Submitted', under_review: 'Under review', declined: 'Declined', selected: 'Selected', rejected: 'Rejected', pending: 'Awaiting offer' },
    zh: { new: '新', viewed: '已查看', quoted: '已提交', under_review: '审核中', declined: '已拒绝', selected: '已选择', rejected: '已拒绝', pending: '等待报价' },
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
