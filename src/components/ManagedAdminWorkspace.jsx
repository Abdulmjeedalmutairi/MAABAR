import React, { useMemo, useState } from 'react';
import { getManagedStageLabel, getManagedVerificationLevel } from '../lib/managedSourcing';

function Card({ children, style = {} }) {
  return (
    <div style={{
      borderRadius: 24,
      border: '1px solid var(--border-subtle)',
      background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      padding: 22,
      ...style,
    }}>
      {children}
    </div>
  );
}

function MiniButton({ children, onClick, tone = 'default', disabled, style = {} }) {
  const tones = {
    default: { border: 'var(--border-subtle)', background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)' },
    accent: { border: 'rgba(139,120,255,0.24)', background: 'rgba(139,120,255,0.1)', color: '#d7d0ff' },
    success: { border: 'rgba(93,192,132,0.24)', background: 'rgba(93,192,132,0.1)', color: '#7bc091' },
  };
  const toneStyle = tones[tone] || tones.default;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 38,
        padding: '0 12px',
        borderRadius: 14,
        border: `1px solid ${toneStyle.border}`,
        background: toneStyle.background,
        color: toneStyle.color,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: 12,
        opacity: disabled ? 0.6 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default function ManagedAdminWorkspace({
  lang = 'ar',
  requests = [],
  selectedRequestId,
  setSelectedRequestId,
  supplierDirectory = [],
  selectedSupplierIds = [],
  setSelectedSupplierIds,
  onRefresh,
  onGenerateBrief,
  onSaveBrief,
  onMatchSuppliers,
  onShortlistOffer,
  onPublishShortlist,
  savingKey,
}) {
  const isAr = lang === 'ar';
  const [briefDraft, setBriefDraft] = useState({ admin_internal_notes: '', admin_follow_up_question: '', supplier_brief: '', priority: 'normal' });
  const [shortlistDrafts, setShortlistDrafts] = useState({});
  const selectedRequest = useMemo(
    () => requests.find((item) => item.id === selectedRequestId) || requests[0] || null,
    [requests, selectedRequestId],
  );

  React.useEffect(() => {
    if (!selectedRequest) return;
    setBriefDraft({
      admin_internal_notes: selectedRequest.brief?.admin_internal_notes || '',
      admin_follow_up_question: selectedRequest.brief?.admin_follow_up_question || '',
      supplier_brief: selectedRequest.brief?.supplier_brief || '',
      priority: selectedRequest.brief?.priority || selectedRequest.managed_priority || 'normal',
    });
  }, [selectedRequest]);

  const categorySuppliers = supplierDirectory.filter((supplier) => {
    if (!selectedRequest?.category || selectedRequest.category === 'other') return true;
    return String(supplier.speciality || '').toLowerCase() === String(selectedRequest.category || '').toLowerCase();
  });

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {isAr ? 'Managed sourcing ops' : 'Managed sourcing ops'}
          </p>
          <h2 style={{ margin: 0, fontSize: 30, fontWeight: 400, color: 'var(--text-primary)' }}>
            {isAr ? 'الطلبات المُدارة — AI + مراجعة بشرية + مطابقة مضبوطة' : 'Managed requests — AI prep + human review + controlled matching'}
          </h2>
        </div>
        <MiniButton onClick={onRefresh} tone="accent">{isAr ? 'تحديث' : 'Refresh'}</MiniButton>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px minmax(0, 1fr)', gap: 20 }}>
        <Card style={{ alignSelf: 'start' }}>
          <p style={{ margin: '0 0 14px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
            {isAr ? 'قائمة الطلبات المُدارة' : 'Managed requests'}
          </p>
          <div style={{ display: 'grid', gap: 10, maxHeight: '70vh', overflowY: 'auto' }}>
            {requests.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{isAr ? 'لا توجد طلبات مُدارة حالياً.' : 'No managed requests right now.'}</p>
            ) : requests.map((item) => {
              const isSelected = item.id === selectedRequest?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedRequestId?.(item.id)}
                  style={{
                    width: '100%',
                    textAlign: isAr ? 'right' : 'left',
                    padding: '14px 14px 12px',
                    borderRadius: 18,
                    border: `1px solid ${isSelected ? 'rgba(139,120,255,0.26)' : 'var(--border-subtle)'}`,
                    background: isSelected ? 'rgba(139,120,255,0.08)' : 'rgba(255,255,255,0.03)',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>{item.title_ar || item.title_en || (isAr ? 'طلب بدون عنوان' : 'Untitled request')}</p>
                  <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-secondary)' }}>{item.quantity || '—'} · {item.category || 'other'}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, padding: '4px 9px', borderRadius: 999, background: 'rgba(139,120,255,0.1)', border: '1px solid rgba(139,120,255,0.2)', color: '#d7d0ff' }}>
                      {getManagedStageLabel(item.managed_status, lang)}
                    </span>
                    <span style={{ fontSize: 10, padding: '4px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                      {isAr ? `${item.matches?.length || 0} مطابقات` : `${item.matches?.length || 0} matches`}
                    </span>
                    <span style={{ fontSize: 10, padding: '4px 9px', borderRadius: 999, background: 'rgba(58,122,82,0.08)', border: '1px solid rgba(58,122,82,0.18)', color: '#7bc091' }}>
                      {isAr ? `${item.shortlist?.length || 0} مختارة` : `${item.shortlist?.length || 0} shortlisted`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {!selectedRequest ? (
          <Card style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            {isAr ? 'اختر طلباً مُداراً لبدء المراجعة.' : 'Select a managed request to start review.'}
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 20 }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>
                    {isAr ? 'ملخص الطلب المُدار' : 'Managed request summary'}
                  </p>
                  <h3 style={{ margin: '0 0 8px', fontSize: 26, fontWeight: 400, color: 'var(--text-primary)' }}>{selectedRequest.title_ar || selectedRequest.title_en || (isAr ? 'طلب بدون عنوان' : 'Untitled request')}</h3>
                  <p style={{ margin: 0, fontSize: 13, lineHeight: 1.8, color: 'var(--text-secondary)' }}>{selectedRequest.description || '—'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <MiniButton onClick={() => onGenerateBrief?.(selectedRequest)} tone="accent" disabled={savingKey === `brief:${selectedRequest.id}`}>
                    {savingKey === `brief:${selectedRequest.id}` ? (isAr ? 'جارٍ التحضير...' : 'Preparing...') : (isAr ? 'تحديث AI brief' : 'Refresh AI brief')}
                  </MiniButton>
                  <MiniButton onClick={() => onPublishShortlist?.(selectedRequest)} tone="success" disabled={savingKey === `publish:${selectedRequest.id}`}>
                    {savingKey === `publish:${selectedRequest.id}` ? (isAr ? 'جارٍ النشر...' : 'Publishing...') : (isAr ? 'نشر أفضل 3 عروض' : 'Publish top 3')}
                  </MiniButton>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 16 }}>
                <div style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{isAr ? 'الكمية' : 'Quantity'}</p>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>{selectedRequest.quantity || '—'}</p>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{isAr ? 'الأولوية' : 'Priority'}</p>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>{selectedRequest.brief?.priority || selectedRequest.managed_priority || 'normal'}</p>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{isAr ? 'المطابقات' : 'Matches'}</p>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>{selectedRequest.matches?.length || 0}</p>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 10, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>{isAr ? 'أفضل 3 عروض' : 'Shortlist'}</p>
                  <p style={{ margin: 0, color: 'var(--text-primary)' }}>{selectedRequest.shortlist?.length || 0}</p>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                <textarea
                  rows={4}
                  value={briefDraft.supplier_brief}
                  onChange={(event) => setBriefDraft((prev) => ({ ...prev, supplier_brief: event.target.value }))}
                  placeholder={isAr ? 'Supplier brief المختصر الذي سيعتمد عليه الأدمن في المطابقة' : 'Supplier-ready brief used for matching'}
                  style={{ width: '100%', borderRadius: 16, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', padding: 14, resize: 'vertical' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <textarea
                    rows={3}
                    value={briefDraft.admin_internal_notes}
                    onChange={(event) => setBriefDraft((prev) => ({ ...prev, admin_internal_notes: event.target.value }))}
                    placeholder={isAr ? 'ملاحظات داخلية للأدمن' : 'Admin internal notes'}
                    style={{ width: '100%', borderRadius: 16, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', padding: 14, resize: 'vertical' }}
                  />
                  <textarea
                    rows={3}
                    value={briefDraft.admin_follow_up_question}
                    onChange={(event) => setBriefDraft((prev) => ({ ...prev, admin_follow_up_question: event.target.value }))}
                    placeholder={isAr ? 'سؤال متابعة إن كان الطلب يحتاج توضيحاً' : 'Follow-up question if clarification is needed'}
                    style={{ width: '100%', borderRadius: 16, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', padding: 14, resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {['low', 'normal', 'high'].map((priority) => (
                    <MiniButton key={priority} onClick={() => setBriefDraft((prev) => ({ ...prev, priority }))} tone={briefDraft.priority === priority ? 'accent' : 'default'}>
                      {priority}
                    </MiniButton>
                  ))}
                  <MiniButton onClick={() => onSaveBrief?.(selectedRequest, briefDraft)} tone="success" disabled={savingKey === `save-brief:${selectedRequest.id}`}>
                    {savingKey === `save-brief:${selectedRequest.id}` ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ المراجعة' : 'Save review')}
                  </MiniButton>
                </div>
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{isAr ? 'مطابقة الموردين' : 'Supplier matching'}</p>
                  <h4 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>{isAr ? 'اختر الموردين المناسبين فقط' : 'Choose only the right suppliers'}</h4>
                </div>
                <MiniButton onClick={() => onMatchSuppliers?.(selectedRequest, selectedSupplierIds)} tone="accent" disabled={selectedSupplierIds.length === 0 || savingKey === `match:${selectedRequest.id}`}>
                  {savingKey === `match:${selectedRequest.id}` ? (isAr ? 'جارٍ الإرسال...' : 'Matching...') : (isAr ? 'إرسال المطابقة' : 'Send matches')}
                </MiniButton>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                {categorySuppliers.map((supplier) => {
                  const checked = selectedSupplierIds.includes(supplier.id);
                  const alreadyMatched = (selectedRequest.matches || []).some((match) => match.supplier_id === supplier.id);
                  return (
                    <button
                      key={supplier.id}
                      type="button"
                      onClick={() => setSelectedSupplierIds?.((prev) => checked ? prev.filter((item) => item !== supplier.id) : [...prev, supplier.id])}
                      style={{
                        textAlign: isAr ? 'right' : 'left',
                        padding: '14px',
                        borderRadius: 18,
                        border: `1px solid ${checked ? 'rgba(139,120,255,0.28)' : alreadyMatched ? 'rgba(93,192,132,0.22)' : 'var(--border-subtle)'}`,
                        background: checked ? 'rgba(139,120,255,0.08)' : alreadyMatched ? 'rgba(93,192,132,0.07)' : 'rgba(255,255,255,0.03)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                      }}
                    >
                      <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>{supplier.company_name || supplier.full_name || supplier.email}</p>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--text-secondary)' }}>{supplier.speciality || (isAr ? 'بدون تخصّص' : 'No specialty')}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}>
                          {getManagedVerificationLevel(supplier, lang)}
                        </span>
                        {alreadyMatched && <span style={{ fontSize: 10, padding: '4px 8px', borderRadius: 999, background: 'rgba(93,192,132,0.1)', border: '1px solid rgba(93,192,132,0.22)', color: '#7bc091' }}>{isAr ? 'مطابق مسبقاً' : 'Already matched'}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <p style={{ margin: '0 0 6px', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>{isAr ? 'فلترة العروض واختيار أفضل 3' : 'Filter quotes and shortlist top 3'}</p>
                  <h4 style={{ margin: 0, fontSize: 22, fontWeight: 400 }}>{isAr ? 'العروض القادمة من الموردين المطابقين' : 'Offers from matched suppliers'}</h4>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {(selectedRequest.offerCandidates || []).length === 0 ? (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: 1.8 }}>{isAr ? 'لا توجد عروض من الموردين المطابقين بعد.' : 'No matched-supplier offers yet.'}</p>
                ) : (selectedRequest.offerCandidates || []).map((offer) => {
                  const draft = shortlistDrafts[offer.id] || {
                    rank: (selectedRequest.shortlist?.length || 0) + 1,
                    maabar_notes: '',
                    selection_reason: '',
                    verification_level: getManagedVerificationLevel(offer.profiles, lang),
                  };
                  return (
                    <div key={offer.id} style={{ padding: '14px 16px', borderRadius: 18, border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>{offer.profiles?.company_name || offer.profiles?.full_name || offer.supplier_id}</p>
                          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-secondary)' }}>{offer.price || '—'} USD · MOQ {offer.moq || '—'} · {offer.delivery_days || '—'} {isAr ? 'يوم' : 'days'}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <input className="form-input" type="number" min="1" max="3" value={draft.rank} onChange={(event) => setShortlistDrafts((prev) => ({ ...prev, [offer.id]: { ...draft, rank: event.target.value } }))} style={{ width: 82 }} />
                          <MiniButton onClick={() => onShortlistOffer?.(selectedRequest, offer, draft)} tone="success" disabled={savingKey === `shortlist:${offer.id}`}>
                            {savingKey === `shortlist:${offer.id}` ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'إضافة للقائمة' : 'Add to shortlist')}
                          </MiniButton>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <textarea rows={2} value={draft.selection_reason} onChange={(event) => setShortlistDrafts((prev) => ({ ...prev, [offer.id]: { ...draft, selection_reason: event.target.value } }))} placeholder={isAr ? 'لماذا تم اختيار هذا العرض؟' : 'Why was this offer selected?'} style={{ width: '100%', borderRadius: 14, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', padding: 12, resize: 'vertical' }} />
                        <textarea rows={2} value={draft.maabar_notes} onChange={(event) => setShortlistDrafts((prev) => ({ ...prev, [offer.id]: { ...draft, maabar_notes: event.target.value } }))} placeholder={isAr ? 'ملاحظات معبر للعميل' : 'Maabar notes for the buyer'} style={{ width: '100%', borderRadius: 14, border: '1px solid var(--border-default)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', padding: 12, resize: 'vertical' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 1180px) {
          .managed-admin-two-col {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
