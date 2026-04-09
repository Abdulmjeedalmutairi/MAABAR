import React, { useState } from 'react';

export default function ManagedSupplierMatchesPanel({
  lang = 'ar',
  matches = [],
  activeGroup = 'all',
  onChangeGroup,
  offerForms = {},
}) {
  const isAr = lang === 'ar';
  
  const groups = [
    { id: 'all', label: isAr ? 'الكل' : 'All' },
    { id: 'urgent', label: isAr ? 'عاجل' : 'Urgent' },
    { id: 'electronics', label: isAr ? 'إلكترونيات' : 'Electronics' },
    { id: 'furniture', label: isAr ? 'أثاث' : 'Furniture' },
    { id: 'clothing', label: isAr ? 'ملابس' : 'Clothing' },
    { id: 'building', label: isAr ? 'مواد بناء' : 'Building Materials' },
    { id: 'food', label: isAr ? 'غذاء' : 'Food' },
    { id: 'general', label: isAr ? 'عام' : 'General' },
  ];

  const filteredMatches = activeGroup === 'all' 
    ? matches 
    : matches.filter(match => match.group === activeGroup || match.category === activeGroup);

  const getStatusLabel = (status) => {
    const labels = {
      ar: {
        pending: 'بانتظار العرض',
        submitted: 'تم التقديم',
        reviewed: 'تم المراجعة',
        selected: 'مُختار',
        rejected: 'مرفوض',
      },
      en: {
        pending: 'Awaiting offer',
        submitted: 'Submitted',
        reviewed: 'Reviewed',
        selected: 'Selected',
        rejected: 'Rejected',
      },
      zh: {
        pending: '等待报价',
        submitted: '已提交',
        reviewed: '已审核',
        selected: '已选择',
        rejected: '已拒绝',
      },
    };
    
    return labels[lang]?.[status] || labels.ar[status] || status;
  };

  const handleSubmitOffer = (matchId) => {
    const form = offerForms[matchId];
    if (form && typeof form.onSubmit === 'function') {
      form.onSubmit();
    } else {
      alert(isAr ? 'نموذج العرض غير متاح' : 'Offer form not available');
    }
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
        <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px' }}>
          {isAr ? 'لا توجد طلبات مطابقة حالياً' : 'No matched requests yet'}
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
          {isAr ? 'فريق معبر يبحث عن طلبات تناسب تخصصك. ستظهر هنا عند توفرها.' : 'Maabar team is searching for requests that match your specialty. They will appear here when available.'}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {group.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {filteredMatches.map(match => {
          const offerForm = offerForms[match.id];
          const canSubmit = offerForm && !offerForm.submitted;
          
          return (
            <div
              key={match.id}
              style={{
                padding: '20px',
                background: 'var(--bg-raised)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                position: 'relative',
              }}
            >
              {match.priority === 'urgent' && (
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  background: 'var(--accent)',
                  color: 'white',
                  fontSize: '10px',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  letterSpacing: '0.5px',
                }}>
                  {isAr ? 'عاجل' : 'URGENT'}
                </div>
              )}
              
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                  {match.title || (isAr ? 'طلب بدون عنوان' : 'Untitled request')}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 8px' }}>
                  {match.description?.substring(0, 100)}...
                </p>
                <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-disabled)' }}>
                  <span>{isAr ? 'الفئة:' : 'Category:'} {match.category || 'general'}</span>
                  <span>{isAr ? 'الحالة:' : 'Status:'} {getStatusLabel(match.status)}</span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الكمية المطلوبة:' : 'Quantity:'}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{match.quantity || 'N/A'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الميزانية:' : 'Budget:'}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{match.budget || 'N/A'} {match.currency || 'USD'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{isAr ? 'الموعد النهائي:' : 'Deadline:'}</span>
                  <span style={{ color: 'var(--text-primary)' }}>{match.deadline || 'N/A'}</span>
                </div>
              </div>

              {canSubmit ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => handleSubmitOffer(match.id)}
                    style={{
                      flex: 1,
                      padding: '10px 16px',
                      background: 'var(--accent)',
                      border: 'none',
                      color: 'white',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? 'تقديم عرض' : 'Submit Offer'}
                  </button>
                  <button
                    onClick={() => alert(isAr ? 'عرض التفاصيل' : 'Show details')}
                    style={{
                      padding: '10px 16px',
                      background: 'transparent',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? 'تفاصيل' : 'Details'}
                  </button>
                </div>
              ) : offerForm?.submitted ? (
                <div style={{
                  padding: '10px',
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                }}>
                  {isAr ? 'تم تقديم عرضك' : 'Your offer has been submitted'}
                </div>
              ) : (
                <div style={{
                  padding: '10px',
                  background: 'rgba(0,0,0,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--text-disabled)',
                }}>
                  {isAr ? 'نموذج العرض غير متاح' : 'Offer form not available'}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}