import React, { useEffect, useState } from 'react';
import { sb } from '../supabase';

export default function ManagedBuyerRequestPanel({
  request,
  lang = 'ar',
  onChooseOffer,
  onRequestNegotiation,
  onRejectOffer,
  onRestartSearch,
}) {
  const isAr = lang === 'ar';
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOfferId, setSelectedOfferId] = useState(null);

  useEffect(() => {
    if (!request?.id) return;
    
    const loadManagedOffers = async () => {
      setLoading(true);
      try {
        const { data, error } = await sb
          .from('managed_shortlisted_offers')
          .select('*')
          .eq('request_id', request.id)
          .order('rank', { ascending: true });
        
        if (!error && data) {
          setOffers(data);
          // Find the offer selected by buyer
          const selected = data.find(offer => offer.selected_by_buyer);
          if (selected) setSelectedOfferId(selected.id);
        }
      } catch (error) {
        console.error('Failed to load managed offers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadManagedOffers();
  }, [request?.id]);

  const getStatusLabel = () => {
    const status = request?.managed_status;
    if (!status) return isAr ? 'قيد الإدارة' : 'Managed';
    
    const labels = {
      ar: {
        submitted: 'تم التقديم',
        admin_review: 'قيد المراجعة',
        sourcing: 'قيد البحث عن موردين',
        matching: 'قيد المطابقة',
        buyer_review: 'بانتظار مراجعتك',
        buyer_selected: 'تم الاختيار',
        negotiation: 'قيد التفاوض',
        completed: 'مكتمل',
      },
      en: {
        submitted: 'Submitted',
        admin_review: 'Under review',
        sourcing: 'Sourcing suppliers',
        matching: 'Matching',
        buyer_review: 'Awaiting your review',
        buyer_selected: 'Selected',
        negotiation: 'Negotiation',
        completed: 'Completed',
      },
      zh: {
        submitted: '已提交',
        admin_review: '审核中',
        sourcing: '寻找供应商',
        matching: '匹配中',
        buyer_review: '等待您审核',
        buyer_selected: '已选择',
        negotiation: '谈判中',
        completed: '已完成',
      },
    };
    
    return labels[lang]?.[status] || labels.ar[status] || status;
  };

  const handleChooseOffer = (offer) => {
    if (onChooseOffer && window.confirm(isAr ? 'هل تريد اختيار هذا العرض؟' : 'Do you want to choose this offer?')) {
      onChooseOffer(request, offer);
    }
  };

  const handleRequestNegotiation = (offer) => {
    const reason = window.prompt(isAr ? 'أدخل سبب التفاوض:' : 'Enter negotiation reason:');
    if (reason && onRequestNegotiation) {
      onRequestNegotiation(request, offer, reason);
    }
  };

  const handleRejectOffer = (offer) => {
    if (onRejectOffer && window.confirm(isAr ? 'هل تريد رفض هذا العرض؟' : 'Do you want to reject this offer?')) {
      onRejectOffer(request, offer);
    }
  };

  const handleRestartSearch = () => {
    if (onRestartSearch && window.confirm(isAr ? 'هل تريد إعادة البحث عن موردين؟' : 'Do you want to restart supplier search?')) {
      onRestartSearch(request);
    }
  };

  if (loading) {
    return (
      <div style={{
        padding: '16px',
        background: 'var(--bg-raised)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '16px',
      }}>
        <div style={{ height: '20px', background: 'var(--bg-muted)', borderRadius: '4px', marginBottom: '8px' }} />
        <div style={{ height: '16px', background: 'var(--bg-muted)', borderRadius: '4px', width: '60%' }} />
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      background: 'var(--bg-raised)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      marginBottom: '20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div>
          <h4 style={{ margin: '0 0 4px', fontSize: '16px', color: 'var(--text-primary)' }}>
            {isAr ? 'طلب مُدار' : 'Managed Request'}
          </h4>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
            {getStatusLabel()}
          </p>
        </div>
        <button
          onClick={handleRestartSearch}
          style={{
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid var(--border-default)',
            color: 'var(--text-secondary)',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          {isAr ? 'إعادة البحث' : 'Restart Search'}
        </button>
      </div>

      {offers.length > 0 ? (
        <div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {isAr ? 'العروض المختارة:' : 'Shortlisted offers:'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {offers.map((offer) => (
              <div
                key={offer.id}
                style={{
                  padding: '12px',
                  background: selectedOfferId === offer.id ? 'rgba(0,0,0,0.03)' : 'var(--bg-subtle)',
                  border: `1px solid ${selectedOfferId === offer.id ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                      {offer.supplier_name || (isAr ? 'مورد' : 'Supplier')}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '8px' }}>
                      {offer.unit_price} {offer.currency || 'USD'} {isAr ? 'للقطعة' : 'per unit'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleChooseOffer(offer)}
                      disabled={selectedOfferId === offer.id}
                      style={{
                        padding: '4px 8px',
                        background: selectedOfferId === offer.id ? 'var(--accent-faint)' : 'var(--accent)',
                        border: 'none',
                        color: selectedOfferId === offer.id ? 'var(--accent)' : 'white',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: selectedOfferId === offer.id ? 'default' : 'pointer',
                      }}
                    >
                      {selectedOfferId === offer.id 
                        ? (isAr ? 'مُختار' : 'Selected') 
                        : (isAr ? 'اختر' : 'Choose')}
                    </button>
                    <button
                      onClick={() => handleRequestNegotiation(offer)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-secondary)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {isAr ? 'تفاوض' : 'Negotiate'}
                    </button>
                    <button
                      onClick={() => handleRejectOffer(offer)}
                      style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px solid var(--border-default)',
                        color: 'var(--text-error)',
                        borderRadius: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      {isAr ? 'رفض' : 'Reject'}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0' }}>
                  {offer.selection_reason || (isAr ? 'لا يوجد سبب مذكور' : 'No reason provided')}
                </p>
                <div style={{ fontSize: '11px', color: 'var(--text-disabled)', display: 'flex', gap: '12px' }}>
                  <span>{isAr ? 'الحد الأدنى للطلب:' : 'MOQ:'} {offer.moq || 'N/A'}</span>
                  <span>{isAr ? 'وقت الإنتاج:' : 'Production:'} {offer.production_time_days || '?'} {isAr ? 'يوم' : 'days'}</span>
                  <span>{isAr ? 'مستوى التحقق:' : 'Verification:'} {offer.verification_level || 'basic'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            {isAr ? 'لا توجد عروض مختارة حتى الآن' : 'No shortlisted offers yet'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-disabled)' }}>
            {isAr ? 'فريق معبر يبحث عن أفضل الموردين لطلبك' : 'Maabar team is searching for the best suppliers for your request'}
          </p>
        </div>
      )}
    </div>
  );
}