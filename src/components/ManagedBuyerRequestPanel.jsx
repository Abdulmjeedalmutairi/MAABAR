import React, { useState } from 'react';
import {
  MANAGED_NEGOTIATION_REASONS,
  MANAGED_REQUEST_STAGE_KEYS,
  getLocalizedText,
  getManagedStageIndex,
  getManagedStageLabel,
  getManagedShortlistReasonLabel,
} from '../lib/managedSourcing';

function StageBar({ status, lang = 'ar' }) {
  const isAr = lang === 'ar';
  const currentIndex = Math.max(0, getManagedStageIndex(status));

  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${MANAGED_REQUEST_STAGE_KEYS.length}, minmax(0, 1fr))`, gap: 8 }}>
        {MANAGED_REQUEST_STAGE_KEYS.map((stageKey, index) => {
          const active = index <= currentIndex;
          return (
            <div key={stageKey} style={{ display: 'grid', gap: 8 }}>
              <div style={{ height: 4, borderRadius: 999, background: active ? 'rgba(139,120,255,0.92)' : 'var(--border-subtle)' }} />
              <p style={{ margin: 0, fontSize: 11, lineHeight: 1.7, color: active ? 'var(--text-primary)' : 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                {getManagedStageLabel(stageKey, lang)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ManagedBuyerRequestPanel({
  request,
  lang = 'ar',
  onChooseOffer,
  onRequestNegotiation,
  onRejectOffer,
  onRestartSearch,
  loadingAction,
}) {
  const isAr = lang === 'ar';
  const [openNegotiationId, setOpenNegotiationId] = useState('');
  const shortlist = Array.isArray(request?.managedShortlist) ? request.managedShortlist : [];
  const feedback = Array.isArray(request?.managedFeedback) ? request.managedFeedback : [];
  const lastFeedback = feedback[0] || null;

  return (
    <div style={{ display: 'grid', gap: 16, marginTop: 18 }}>
      <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139,120,255,0.18)', background: 'rgba(139,120,255,0.05)' }}>
        <p style={{ margin: '0 0 8px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(139,120,255,0.9)' }}>
          {isAr ? 'Managed by Maabar' : lang === 'zh' ? '由 Maabar 托管' : 'Managed by Maabar'}
        </p>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {isAr
            ? 'هذا الطلب يمر بمراجعة معبر أولاً، ثم تتم مطابقة الموردين المناسبين فقط، وبعد التفاوض ترى أفضل 3 عروض هنا داخل نفس الطلب.'
            : lang === 'zh'
              ? '该需求会先由 Maabar 审核，再仅匹配合适供应商，谈判后最佳 3 个方案会直接出现在这个需求页内。'
              : 'This request is reviewed by Maabar first, matched only with suitable suppliers, then the best 3 offers appear here inside the same request.'}
        </p>
      </div>

      <div style={{ padding: '16px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
        <p style={{ margin: '0 0 12px', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-disabled)' }}>
          {isAr ? 'حالة الطلب المُدار' : lang === 'zh' ? '托管状态' : 'Managed request status'}
        </p>
        <StageBar status={request?.managed_status || 'submitted'} lang={lang} />
      </div>

      <div style={{ padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', background: 'var(--bg-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 18, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {isAr ? 'العروض المختارة لك' : lang === 'zh' ? '为您挑选的方案' : 'Selected offers for you'}
            </h4>
            <p style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: 'var(--text-disabled)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {shortlist.length > 0
                ? (isAr ? 'هذه أفضل الخيارات التي اختارتها معبر بعد الفرز والتفاوض.' : lang === 'zh' ? '这些是 Maabar 筛选和议价后为您保留的最佳方案。' : 'These are the strongest options Maabar kept after screening and negotiation.')
                : (isAr ? 'عندما تجهز أفضل 3 عروض ستظهر هنا مباشرة.' : lang === 'zh' ? '最佳 3 个方案准备好后会直接出现在这里。' : 'Once the top 3 are ready, they will appear here directly.')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onRestartSearch?.(request)}
            disabled={Boolean(loadingAction)}
            className="btn-outline"
            style={{ minHeight: 36 }}
          >
            {isAr ? 'أعد البحث' : lang === 'zh' ? '重新搜索' : 'Search again'}
          </button>
        </div>

        {lastFeedback && (
          <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
            <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-disabled)' }}>
              {isAr ? 'آخر تفاعل' : lang === 'zh' ? '最近操作' : 'Latest action'}
            </p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
              {lastFeedback.action === 'request_negotiation'
                ? getManagedShortlistReasonLabel(lastFeedback.reason, lang)
                : lastFeedback.action === 'restart_search'
                  ? (isAr ? 'تم طلب إعادة البحث عن خيارات جديدة.' : lang === 'zh' ? '已请求重新寻找新的方案。' : 'A fresh search was requested.')
                  : lastFeedback.action === 'choose_offer'
                    ? (isAr ? 'تم اختيار أحد العروض وسيتابع فريق معبر الخطوة التالية.' : lang === 'zh' ? '您已选择其中一个方案，Maabar 将继续下一步。' : 'You selected one offer and Maabar will continue with the next step.')
                    : (isAr ? 'تم تسجيل التفضيل على هذا الطلب.' : lang === 'zh' ? '您的偏好已记录。' : 'Your preference was recorded on this request.')}
            </p>
          </div>
        )}

        {shortlist.length === 0 ? (
          <div style={{ padding: '14px 16px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-subtle)', color: 'var(--text-disabled)', lineHeight: 1.8, fontSize: 13, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
            {isAr
              ? 'فريق معبر الآن ينظف الطلب، يراجع المواصفات، ويطابق الموردين الأنسب قبل إظهار أفضل 3 عروض هنا.'
              : lang === 'zh'
                ? 'Maabar 正在整理需求、审核规格并筛选合适供应商，之后最佳 3 个方案会显示在这里。'
                : 'Maabar is cleaning the request, reviewing the specs, and matching the right suppliers before the top 3 appear here.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {shortlist.map((offer, index) => {
              const isNegotiationOpen = openNegotiationId === offer.id;
              return (
                <div key={offer.id || index} style={{ padding: '18px', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(139,120,255,0.16)', background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 999, background: 'rgba(139,120,255,0.1)', border: '1px solid rgba(139,120,255,0.2)', color: 'rgba(139,120,255,0.92)' }}>
                          #{offer.rank || index + 1}
                        </span>
                        <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 999, background: 'rgba(58,122,82,0.08)', border: '1px solid rgba(58,122,82,0.18)', color: '#5a9a72' }}>
                          {offer.verification_level || (isAr ? 'موثّق' : 'Verified')}
                        </span>
                      </div>
                      <h5 style={{ margin: 0, fontSize: 16, color: 'var(--text-primary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
                        {offer.profiles?.company_name || offer.supplier_name || (isAr ? 'مورد معتمد' : lang === 'zh' ? '认证供应商' : 'Verified supplier')}
                      </h5>
                    </div>
                    <div style={{ textAlign: isAr ? 'left' : 'right' }}>
                      <p style={{ margin: 0, fontSize: 22, color: 'var(--text-primary)', fontWeight: 300 }}>
                        {offer.unit_price ?? '—'} <span style={{ fontSize: 11, color: 'var(--text-disabled)' }}>USD</span>
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-disabled)' }}>
                        {isAr ? 'سعر الوحدة' : lang === 'zh' ? '单价' : 'Unit price'}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, marginBottom: 14 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-disabled)' }}>MOQ</p>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)' }}>{offer.moq || '—'}</p>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-disabled)' }}>{isAr ? 'مدة الإنتاج' : lang === 'zh' ? '生产时间' : 'Production time'}</p>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)' }}>{offer.production_time_days ? `${offer.production_time_days} ${isAr ? 'يوم' : lang === 'zh' ? '天' : 'days'}` : '—'}</p>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-subtle)', border: '1px solid var(--border-subtle)' }}>
                      <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-disabled)' }}>{isAr ? 'مدة الشحن' : lang === 'zh' ? '运输时间' : 'Shipping time'}</p>
                      <p style={{ margin: 0, fontSize: 13, color: 'var(--text-primary)' }}>{offer.shipping_time_days ? `${offer.shipping_time_days} ${isAr ? 'يوم' : lang === 'zh' ? '天' : 'days'}` : '—'}</p>
                    </div>
                  </div>

                  {offer.selection_reason && (
                    <div style={{ marginBottom: 10 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--text-disabled)' }}>
                        {isAr ? 'لماذا تم اختياره' : lang === 'zh' ? '为何入选' : 'Why it was selected'}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{offer.selection_reason}</p>
                    </div>
                  )}

                  {offer.maabar_notes && (
                    <div style={{ marginBottom: 14 }}>
                      <p style={{ margin: '0 0 4px', fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: 'var(--text-disabled)' }}>
                        {isAr ? 'ملاحظات معبر' : lang === 'zh' ? 'Maabar 备注' : 'Maabar notes'}
                      </p>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)', fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>{offer.maabar_notes}</p>
                    </div>
                  )}

                  <div style={{ display: 'grid', gap: 8 }}>
                    <button type="button" onClick={() => onChooseOffer?.(request, offer)} disabled={Boolean(loadingAction)} className="btn-primary" style={{ minHeight: 38 }}>
                      {isAr ? 'اختر هذا العرض' : lang === 'zh' ? '选择这个方案' : 'Choose this offer'}
                    </button>
                    <button type="button" onClick={() => setOpenNegotiationId(isNegotiationOpen ? '' : offer.id)} disabled={Boolean(loadingAction)} className="btn-outline" style={{ minHeight: 38 }}>
                      {isAr ? 'اطلب تفاوض إضافي' : lang === 'zh' ? '请求继续谈判' : 'Request more negotiation'}
                    </button>
                    <button type="button" onClick={() => onRejectOffer?.(request, offer)} disabled={Boolean(loadingAction)} className="btn-outline" style={{ minHeight: 38, borderColor: 'rgba(160,112,112,0.28)', color: '#c99494' }}>
                      {isAr ? 'غير مناسب' : lang === 'zh' ? '不合适' : 'Not suitable'}
                    </button>
                  </div>

                  {isNegotiationOpen && (
                    <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
                      {MANAGED_NEGOTIATION_REASONS.map((reason) => (
                        <button
                          key={reason.value}
                          type="button"
                          onClick={() => {
                            onRequestNegotiation?.(request, offer, reason.value);
                            setOpenNegotiationId('');
                          }}
                          disabled={Boolean(loadingAction)}
                          style={{
                            minHeight: 38,
                            textAlign: isAr ? 'right' : 'left',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--border-subtle)',
                            background: 'rgba(255,255,255,0.03)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            padding: '0 12px',
                            fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)',
                          }}
                        >
                          {getLocalizedText(reason, lang)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
