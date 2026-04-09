import React, { useState } from 'react';

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
  const [activeTab, setActiveTab] = useState('requests');
  
  const selectedRequest = requests.find(req => req.id === selectedRequestId);
  const selectedSuppliers = supplierDirectory.filter(sup => selectedSupplierIds.includes(sup.id));

  const getRequestStatusLabel = (status) => {
    const labels = {
      ar: {
        submitted: 'مقدم',
        admin_review: 'قيد المراجعة',
        sourcing: 'قيد البحث',
        matching: 'قيد المطابقة',
        buyer_review: 'بانتظار المشتري',
        buyer_selected: 'مختار من المشتري',
        negotiation: 'تفاوض',
        completed: 'مكتمل',
      },
      en: {
        submitted: 'Submitted',
        admin_review: 'Under review',
        sourcing: 'Sourcing',
        matching: 'Matching',
        buyer_review: 'Awaiting buyer',
        buyer_selected: 'Selected by buyer',
        negotiation: 'Negotiation',
        completed: 'Completed',
      },
    };
    
    return labels[lang]?.[status] || labels.ar[status] || status;
  };

  const handleSelectRequest = (requestId) => {
    setSelectedRequestId?.(requestId);
    setActiveTab('details');
  };

  const handleSelectSupplier = (supplierId) => {
    const newSelected = selectedSupplierIds.includes(supplierId)
      ? selectedSupplierIds.filter(id => id !== supplierId)
      : [...selectedSupplierIds, supplierId];
    setSelectedSupplierIds?.(newSelected);
  };

  const handleGenerateBrief = () => {
    if (selectedRequest && onGenerateBrief) {
      onGenerateBrief(selectedRequest);
    }
  };

  const handleMatchSuppliers = () => {
    if (selectedRequest && onMatchSuppliers) {
      onMatchSuppliers(selectedRequest);
    }
  };

  const handleShortlistOffer = (supplierId) => {
    if (selectedRequest && onShortlistOffer) {
      onShortlistOffer(selectedRequest, supplierId);
    }
  };

  const handlePublishShortlist = () => {
    if (selectedRequest && onPublishShortlist) {
      onPublishShortlist(selectedRequest);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', minHeight: '600px' }}>
      {/* Sidebar */}
      <div style={{ width: '300px', flexShrink: 0 }}>
        <div style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 16px' }}>
            {isAr ? 'الطلبات المُدارة' : 'Managed Requests'}
          </h3>
          
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button
              onClick={() => setActiveTab('requests')}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === 'requests' ? 'var(--accent)' : 'var(--bg-subtle)',
                border: `1px solid ${activeTab === 'requests' ? 'var(--accent)' : 'var(--border-subtle)'}`,
                color: activeTab === 'requests' ? 'white' : 'var(--text-secondary)',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {isAr ? 'الطلبات' : 'Requests'}
            </button>
            <button
              onClick={() => setActiveTab('suppliers')}
              style={{
                flex: 1,
                padding: '8px',
                background: activeTab === 'suppliers' ? 'var(--accent)' : 'var(--bg-subtle)',
                border: `1px solid ${activeTab === 'suppliers' ? 'var(--accent)' : 'var(--border-subtle)'}`,
                color: activeTab === 'suppliers' ? 'white' : 'var(--text-secondary)',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {isAr ? 'الموردين' : 'Suppliers'}
            </button>
          </div>

          {activeTab === 'requests' && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {requests.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                  {isAr ? 'لا توجد طلبات مُدارة' : 'No managed requests'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {requests.map(request => (
                    <button
                      key={request.id}
                      onClick={() => handleSelectRequest(request.id)}
                      style={{
                        padding: '12px',
                        textAlign: 'left',
                        background: selectedRequestId === request.id ? 'rgba(0,0,0,0.03)' : 'transparent',
                        border: `1px solid ${selectedRequestId === request.id ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {request.title || `Request ${request.id.slice(0, 8)}`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{getRequestStatusLabel(request.managed_status)}</span>
                        <span>{request.category || 'general'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'suppliers' && (
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {supplierDirectory.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
                  {isAr ? 'لا توجد موردين' : 'No suppliers'}
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {supplierDirectory.map(supplier => (
                    <div
                      key={supplier.id}
                      style={{
                        padding: '12px',
                        background: selectedSupplierIds.includes(supplier.id) ? 'rgba(0,0,0,0.03)' : 'transparent',
                        border: `1px solid ${selectedSupplierIds.includes(supplier.id) ? 'var(--accent-border)' : 'var(--border-subtle)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSelectSupplier(supplier.id)}
                    >
                      <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {supplier.company_name || supplier.full_name || `Supplier ${supplier.id.slice(0, 8)}`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{supplier.status || 'unknown'}</span>
                        <span>{supplier.city || ''}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
            <button
              onClick={onRefresh}
              style={{
                width: '100%',
                padding: '10px',
                background: 'transparent',
                border: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {isAr ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1 }}>
        <div style={{
          background: 'var(--bg-raised)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
        }}>
          {selectedRequest ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', color: 'var(--text-primary)', margin: '0 0 8px' }}>
                    {selectedRequest.title || `Request ${selectedRequest.id.slice(0, 8)}`}
                  </h2>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <span>{getRequestStatusLabel(selectedRequest.managed_status)}</span>
                    <span>{selectedRequest.category || 'general'}</span>
                    <span>{selectedRequest.buyer_id ? `Buyer: ${selectedRequest.buyer_id.slice(0, 8)}` : ''}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleGenerateBrief}
                    disabled={savingKey?.startsWith('brief:')}
                    style={{
                      padding: '8px 16px',
                      background: 'var(--accent)',
                      border: 'none',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: savingKey?.startsWith('brief:') ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingKey?.startsWith('brief:') 
                      ? (isAr ? 'جارٍ التوليد...' : 'Generating...') 
                      : (isAr ? 'توليد AI Brief' : 'Generate AI Brief')}
                  </button>
                  <button
                    onClick={handleMatchSuppliers}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    {isAr ? 'مطابقة موردين' : 'Match Suppliers'}
                  </button>
                  <button
                    onClick={handlePublishShortlist}
                    disabled={!selectedSupplierIds.length}
                    style={{
                      padding: '8px 16px',
                      background: selectedSupplierIds.length ? 'var(--accent)' : 'var(--bg-subtle)',
                      border: 'none',
                      color: selectedSupplierIds.length ? 'white' : 'var(--text-disabled)',
                      borderRadius: '6px',
                      fontSize: '13px',
                      cursor: selectedSupplierIds.length ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {isAr ? 'نشر القائمة المختارة' : 'Publish Shortlist'}
                  </button>
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 12px' }}>
                  {isAr ? 'وصف الطلب' : 'Request Description'}
                </h3>
                <div style={{
                  padding: '16px',
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '14px',
                  color: 'var(--text-secondary)',
                  lineHeight: '1.6',
                }}>
                  {selectedRequest.description || (isAr ? 'لا يوجد وصف' : 'No description')}
                </div>
              </div>

              {selectedSuppliers.length > 0 && (
                <div>
                  <h3 style={{ fontSize: '16px', color: 'var(--text-primary)', margin: '0 0 12px' }}>
                    {isAr ? 'الموردون المختارون' : 'Selected Suppliers'}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                    {selectedSuppliers.map(supplier => (
                      <div
                        key={supplier.id}
                        style={{
                          padding: '16px',
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                          {supplier.company_name || supplier.full_name}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          {supplier.city && `${supplier.city}, `}{supplier.country || ''}
                        </div>
                        <button
                          onClick={() => handleShortlistOffer(supplier.id)}
                          style={{
                            width: '100%',
                            padding: '8px',
                            background: 'var(--accent)',
                            border: 'none',
                            color: 'white',
                            borderRadius: '6px',
                            fontSize: '12px',
                            cursor: 'pointer',
                          }}
                        >
                          {isAr ? 'إضافة إلى القائمة المختارة' : 'Add to Shortlist'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <h3 style={{ fontSize: '18px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                {isAr ? 'اختر طلباً مُداراً' : 'Select a managed request'}
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                {isAr ? 'اختر طلباً من القائمة لمعاينته وإدارته.' : 'Select a request from the list to preview and manage it.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}