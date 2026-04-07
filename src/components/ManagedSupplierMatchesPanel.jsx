import React from 'react';
import {
  getManagedMatchGroup,
  getManagedMatchGroupLabel,
} from '../lib/managedSourcing';

function groupMatches(matches = []) {
  return {
    new: matches.filter((match) => getManagedMatchGroup(match) === 'new'),
    quoted: matches.filter((match) => getManagedMatchGroup(match) === 'quoted'),
    closed: matches.filter((match) => getManagedMatchGroup(match) === 'closed'),
  };
}

export default function ManagedSupplierMatchesPanel({
  lang = 'ar',
  matches = [],
  activeGroup = 'new',
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
  const grouped = groupMatches(matches);
  const visibleMatches = grouped[activeGroup] || [];

  const updateDraft = (matchId, key, value) => {
    setOfferDrafts?.((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || {}),
        [key]: value,
      },
    }));
  };

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139,120,255,0.18)', background: 'rgba(139,120,255,0.05)' }}>
        <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(139,120,255,0.9)' }}>
          {isAr ? 'Managed by Maabar' : lang === 'zh' ? '由 Maabar 托管' : 'Managed by Maabar'}
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {isAr
            ? 'هذه ليست طلبات عامة. معبر راجع الطلب أولاً ثم طابقه معك لأن تخصّصك مناسب. ارفع عرضاً واضحاً أو علّم الطلب بأنه غير مناسب.'
            : lang === 'zh'
              ? '这些不是公开广播的需求。Maabar 先审核了需求，再因为您的专业匹配而发送给您。请提交清晰报价，或标记为不适合。'
              : 'These are not public broadcasts. Maabar reviewed the request first and matched it to you because your profile fits. Submit a clear offer or mark it as not suitable.'}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {['new', 'quoted', 'closed'].map((groupKey) => (
          <button
            key={groupKey}
            type="button"
            onClick={() => onChangeGroup?.(groupKey)}
            style={{
              minHeight: 38,
              padding: '0 14px',
              borderRadius: 999,
              border: `1px solid ${activeGroup === groupKey ? 'rgba(139,120,255,0.28)' : 'var(--border-subtle)'}`,
              background: activeGroup === groupKey ? 'rgba(139,120,255,0.12)' : 'rgba(255,255,255,0.03)',
              color: activeGroup === groupKey ? '#d7d0ff' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
            }}
          >
            {getManagedMatchGroupLabel(groupKey, lang)} ({grouped[groupKey].length})
          </button>
        ))}
      </div>

      {visibleMatches.length === 0 ? (
        <div style={{ padding: '18px 20px', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-subtle)', color: 'var(--text-disabled)', fontSize: 13, lineHeight: 1.8, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {isAr ? 'لا توجد طلبات في هذا القسم حالياً.' : lang === 'zh' ? '这个分组里暂时没有需求。' : 'No requests in this section right now.'}
        </div>
      ) : (
        visibleMatches.map((match) => {
          const draft = offerDrafts[match.id] || {};
          const request = match.requests || {};
          const isOpen = Boolean(offerForms[match.id]);
          return (
            <div key={match.id} style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                      <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 999, background: 'rgba(139,120,255,0.1)', border: '1px solid rgba(139,120,255,0.2)', color: 'rgba(139,120,255,0.9)' }}>
                        {isAr ? 'طلب مُدار من معبر' : lang === 'zh' ? 'Maabar 托管需求' : 'Managed by Maabar'}
                      </span>
                      {request.response_deadline && (
                        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          {isAr ? 'الموعد النهائي' : lang === 'zh' ? '截止时间' : 'Deadline'}: {new Date(request.response_deadline).toLocaleDateString(isAr ? 'ar-SA' : lang === 'zh' ? 'zh-CN' : 'en-US')}
                        </span>
                      )}
                    </div>
                    <h4 style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      {request.title_ar || request.title_en || (isAr ? 'طلب بدون عنوان' : lang === 'zh' ? '未命名需求' : 'Untitled request')}
                    </h4>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', color: 'var(--text-secondary)', fontSize: 12, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                      <span>{isAr ? 'الكمية' : lang === 'zh' ? '数量' : 'Quantity'}: {request.quantity || '—'}</span>
                      <span>{isAr ? 'المواصفات' : lang === 'zh' ? '规格' : 'Specifications'}: {request.description || '—'}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {activeGroup !== 'closed' && (
                      <>
                        <button type="button" className="btn-primary" onClick={() => setOfferForms?.((prev) => ({ ...prev, [match.id]: !prev[match.id] }))} style={{ minHeight: 36 }}>
                          {isAr ? 'تقديم عرض' : lang === 'zh' ? '提交报价' : 'Submit offer'}
                        </button>
                        <button type="button" className="btn-outline" onClick={() => onDeclineMatch?.(match)} style={{ minHeight: 36 }}>
                          {isAr ? 'غير مناسب' : lang === 'zh' ? '不合适' : 'Not suitable'}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {match.admin_note && (
                  <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--text-disabled)' }}>
                      {isAr ? 'ملاحظة من معبر' : lang === 'zh' ? 'Maabar 备注' : 'Maabar note'}
                    </p>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.7, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{match.admin_note}</p>
                  </div>
                )}
              </div>

              {isOpen && activeGroup !== 'closed' && (
                <div style={{ padding: '18px 20px', borderTop: '1px solid var(--border-subtle)', display: 'grid', gap: 12, background: 'rgba(255,255,255,0.02)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                    <input className="form-input" type="number" placeholder={isAr ? 'سعر الوحدة USD' : lang === 'zh' ? '产品单价（USD）' : 'Unit price USD'} value={draft.price || ''} onChange={(event) => updateDraft(match.id, 'price', event.target.value)} />
                    <input className="form-input" type="number" placeholder={isAr ? 'تكلفة الشحن USD' : lang === 'zh' ? '运费（USD）' : 'Shipping cost USD'} value={draft.shippingCost || ''} onChange={(event) => updateDraft(match.id, 'shippingCost', event.target.value)} />
                    <input className="form-input" placeholder={isAr ? 'الحد الأدنى للطلب' : lang === 'zh' ? '最小起订量' : 'MOQ'} value={draft.moq || ''} onChange={(event) => updateDraft(match.id, 'moq', event.target.value)} />
                    <input className="form-input" type="number" placeholder={isAr ? 'مدة الإنتاج (أيام)' : lang === 'zh' ? '生产周期（天）' : 'Production days'} value={draft.productionDays || ''} onChange={(event) => updateDraft(match.id, 'productionDays', event.target.value)} />
                    <input className="form-input" type="number" placeholder={isAr ? 'مدة الشحن (أيام)' : lang === 'zh' ? '运输时效（天）' : 'Shipping days'} value={draft.shippingDays || ''} onChange={(event) => updateDraft(match.id, 'shippingDays', event.target.value)} />
                  </div>
                  <textarea className="form-input" rows={3} style={{ resize: 'vertical' }} placeholder={isAr ? 'ملاحظة المورد / ما الذي تقدمه في هذا العرض؟' : lang === 'zh' ? '供应商备注 / 您的方案说明' : 'Supplier note / what are you offering?'} value={draft.note || ''} onChange={(event) => updateDraft(match.id, 'note', event.target.value)} />
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" className="btn-primary" onClick={() => onSubmitOffer?.(match, draft)} disabled={submittingOfferId === match.id} style={{ minHeight: 38 }}>
                      {submittingOfferId === match.id ? (isAr ? 'جارٍ الإرسال...' : lang === 'zh' ? '提交中...' : 'Submitting...') : (isAr ? 'إرسال العرض' : lang === 'zh' ? '发送报价' : 'Send offer')}
                    </button>
                    <button type="button" className="btn-outline" onClick={() => setOfferForms?.((prev) => ({ ...prev, [match.id]: false }))} style={{ minHeight: 38 }}>
                      {isAr ? 'إغلاق' : lang === 'zh' ? '关闭' : 'Close'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
