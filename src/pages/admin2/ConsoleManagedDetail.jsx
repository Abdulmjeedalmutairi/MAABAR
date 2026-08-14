import React, { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConsoleShell from '../../components/admin2/ConsoleShell';
import ManagedOpsPanel from '../../components/admin/ManagedOpsPanel';
import { fetchManagedOrderAdmin } from '../../lib/managedOrder';
import { MANAGED_STAGES, stageKeyOf, isCancelled } from '../../lib/managedStages';
import { waTo } from '../../lib/maabarContact';

// One managed order in the new console — the concierge cockpit. Request summary +
// direct WhatsApp to the trader + a preview of the trader tracker, with the full
// lifecycle controls (ManagedOpsPanel) embedded below.
export default function ConsoleManagedDetail({ user, profile, lang }) {
  const isAr = lang === 'ar';
  const { id } = useParams();
  const nav = useNavigate();
  const [req, setReq] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setReq(await fetchManagedOrderAdmin(id));
    setLoading(false);
  }, [id]);
  useEffect(() => { load(); }, [load]);

  const title = req ? ((isAr ? (req.title_ar || req.title_en) : (req.title_en || req.title_ar)) || (isAr ? 'طلب' : 'Request')) : '';
  const trader = req?.requester?.company_name || req?.requester?.full_name || (isAr ? 'تاجر' : 'Trader');
  const phone = req?.contact_phone || req?.requester?.whatsapp;
  const stageK = stageKeyOf(req?.managed_status);
  const stageObj = MANAGED_STAGES.find((s) => s.key === stageK);
  const cancelled = isCancelled(req?.managed_status);

  return (
    <ConsoleShell user={user} profile={profile} lang={lang} active="managed">
      <div className="ac-page" style={{ fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-sans)' }}>
        <button className="ac-btn ac-btn-sm" onClick={() => nav('/admin2/managed')} style={{ marginBottom: 14 }}>
          {isAr ? '→ كل الطلبات المُدارة' : '← All managed orders'}
        </button>

        {loading ? (
          <div className="ac-skel" style={{ height: 120 }} />
        ) : !req ? (
          <div className="ac-placeholder">{isAr ? 'الطلب غير موجود.' : 'Order not found.'}</div>
        ) : (
          <>
            <div className="ac-page-head">
              <div>
                <h1 className="ac-h1">{title}</h1>
                <p className="ac-sub">
                  <span className="ac-badge neutral">{req.request_ref}</span>{' '}
                  {trader}
                  {req.quantity ? ` · ${isAr ? 'الكمية' : 'Qty'} ${req.quantity}${req.unit ? ' ' + req.unit : ''}` : ''}
                  {' · '}
                  <span style={{ color: cancelled ? 'var(--ac-danger, #c0392b)' : '#9A7B4F', fontWeight: 700 }}>
                    {cancelled ? (isAr ? 'ملغي' : 'Cancelled') : (stageObj ? (isAr ? stageObj.ar : stageObj.en) : req.managed_status)}
                  </span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
              {phone && (
                <a className="ac-btn ac-btn-sm" target="_blank" rel="noopener noreferrer"
                  href={waTo(phone, isAr ? `مرحباً، معك مدير حسابك في مَعبر بخصوص طلبك المُدار رقم ${req.request_ref || req.id}` : `Hello, this is your Maabar account manager regarding managed order ${req.request_ref || req.id}`)}
                  style={{ background: '#25D366', color: '#fff', textDecoration: 'none', borderColor: '#25D366' }}>
                  {isAr ? '💬 راسل التاجر على واتساب' : '💬 WhatsApp the trader'}
                </a>
              )}
              <a className="ac-btn ac-btn-sm" href={`/managed-order/${req.id}`} target="_blank" rel="noopener noreferrer">
                {isAr ? 'معاينة كما يراها التاجر ↗' : 'Preview as trader ↗'}
              </a>
            </div>

            {req.description && (
              <div className="ac-card" style={{ padding: 16, marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--ac-muted)', marginBottom: 6 }}>{isAr ? 'وصف الطلب' : 'Request brief'}</div>
                <div style={{ fontSize: 13.5, color: 'var(--ac-ink)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{req.description}</div>
              </div>
            )}

            <ManagedOpsPanel requestId={id} managedStatus={req.managed_status} isAr={isAr} onChanged={load} />
          </>
        )}
      </div>
    </ConsoleShell>
  );
}
