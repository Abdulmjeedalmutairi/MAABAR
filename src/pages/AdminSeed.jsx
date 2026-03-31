import usePageTitle from '../hooks/usePageTitle';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb, SUPABASE_URL as SUPABASE_PROJECT_URL } from '../supabase';
import { sendMaabarEmail } from '../lib/maabarEmail';
import {
  getSupplierOnboardingState,
  getSupplierPublicVisibilityStatuses,
  getSupplierReviewQueueStatuses,
} from '../lib/supplierOnboarding';

const ADMIN_EMAIL = 'mjeedalmutairis@gmail.com';
const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8';

export default function AdminSeed({ user, lang }) {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [command, setCommand] = useState('');
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ real: 0, activeSuppliers: 0, completedDeals: 0, commissions: 0, newToday: 0 });
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [verifying, setVerifying] = useState({});
  const [verifyResults, setVerifyResults] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [docLoading, setDocLoading] = useState({});
  const [overviewUsers, setOverviewUsers] = useState([]);
  const [overviewRequests, setOverviewRequests] = useState([]);
  const [overviewDeals, setOverviewDeals] = useState([]);
  const [togglingUser, setTogglingUser] = useState({});
  const [updatingRequestStatus, setUpdatingRequestStatus] = useState({});
  const [expandedSupplier, setExpandedSupplier] = useState(null);
  const isAr = lang === 'ar';
  usePageTitle('admin', lang);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) { nav('/'); return; }
    loadStats();
    loadPendingSuppliers();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'overview') loadOverviewData();
  }, [activeTab]);

  const loadStats = async () => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [realUsers, activeSuppliers, completedDeals, completedPayments, newToday] = await Promise.all([
      sb.from('profiles').select('id', { count: 'exact' }).eq('is_seed', false),
      sb.from('profiles').select('id', { count: 'exact' }).eq('role', 'supplier').in('status', getSupplierPublicVisibilityStatuses()),
      sb.from('offers').select('id', { count: 'exact' }).eq('status', 'completed'),
      sb.from('payments').select('amount').eq('status', 'completed'),
      sb.from('profiles').select('id', { count: 'exact' }).eq('is_seed', false).gte('created_at', today.toISOString()),
    ]);
    const totalCommissions = (completedPayments.data || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0) * 0.06, 0);
    setStats({
      real: realUsers.count || 0,
      activeSuppliers: activeSuppliers.count || 0,
      completedDeals: completedDeals.count || 0,
      commissions: Math.round(totalCommissions),
      newToday: newToday.count || 0,
    });
  };

  const loadOverviewData = async () => {
    const [users, requests, deals] = await Promise.all([
      sb.from('profiles').select('id,full_name,company_name,role,status,created_at').eq('is_seed', false).order('created_at', { ascending: false }).limit(10),
      sb.from('requests').select('id,title_ar,title_en,status,created_at,buyer_id').order('created_at', { ascending: false }).limit(10),
      sb.from('offers').select('id,request_id,supplier_id,status,created_at,requests(title_ar,title_en),profiles!offers_supplier_id_fkey(company_name)').eq('status', 'accepted').order('created_at', { ascending: false }),
    ]);
    if (users.data) setOverviewUsers(users.data);
    if (requests.data) setOverviewRequests(requests.data);
    if (deals.data) setOverviewDeals(deals.data);
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    setTogglingUser(prev => ({ ...prev, [userId]: true }));
    const newStatus = currentStatus === 'verified' || currentStatus === 'active' ? 'disabled' : 'verified';
    await sb.from('profiles').update({ status: newStatus }).eq('id', userId);
    setOverviewUsers(prev => prev.map(u => u.id === userId ? { ...u, status: newStatus } : u));
    setTogglingUser(prev => ({ ...prev, [userId]: false }));
  };

  const loadPendingSuppliers = async () => {
    setPendingSuppliersError(null);
    const { data, error } = await sb.from('profiles')
      .select('id,role,status,full_name,company_name,city,country,speciality,whatsapp,wechat,trade_link,reg_number,license_photo,factory_photo,pay_method,alipay_account,swift_code,bank_name,years_experience,num_employees,created_at,email,bio_ar,bio_en,bio_zh')
      .eq('role', 'supplier')
      .in('status', getSupplierReviewQueueStatuses())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('loadPendingSuppliers error:', error);
      setPendingSuppliersError(`${error.code}: ${error.message}`);
      return;
    }

    if (data) setPendingSuppliers(data.filter((supplier) => getSupplierOnboardingState(supplier).isUnderReviewStage));
  };

  const openSupplierDoc = async (supplierId, docType) => {
    const docKey = `${supplierId}-${docType}`;
    setDocLoading(prev => ({ ...prev, [docKey]: true }));
    try {
      const { data: sessionData } = await sb.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) throw new Error('Missing access token');

      const res = await fetch('https://utzalmszfqfcofywfetv.supabase.co/functions/v1/admin-supplier-doc', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ supplierId, docType }),
      });

      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload?.signedUrl) {
        throw new Error(payload?.error || 'Failed to open document');
      }

      const signedUrl = payload.signedUrl.startsWith('http') ? payload.signedUrl : `${SUPABASE_PROJECT_URL}${payload.signedUrl}`;
      window.open(signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('openSupplierDoc error:', error);
      alert(isAr ? 'تعذر فتح المستند بشكل آمن الآن' : 'Unable to open the document securely right now');
    } finally {
      setDocLoading(prev => ({ ...prev, [docKey]: false }));
    }
  };

  const verifySupplier = async (supplier) => {
    setVerifying(prev => ({ ...prev, [supplier.id]: true }));
    try {
      const res = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          system: `أنت نظام التحقق من الموردين لمنصة معبر B2B. مهمتك تحليل بيانات المورد وإعطاء تقرير موضوعي.
أرجع JSON فقط بهذا الشكل:
{
  "score": 0,
  "recommendation": "approve|reject|review",
  "summary": "ملخص قصير في جملة واحدة",
  "positives": ["نقطة إيجابية 1", "نقطة إيجابية 2"],
  "concerns": ["نقطة قلق 1"],
  "trade_link_valid": true,
  "contact_complete": true
}
معايير التقييم (من 100):
- اسم الشركة واضح ومهني: +20
- وصف الشركة موجود: +15
- رابط صفحة تجارية موجود: +25
- واتساب موجود: +15
- WeChat موجود: +10
- مدينة/دولة موجودة: +10
- تخصص محدد: +5
recommendation: approve لو score >= 60، review لو 40-59، reject لو أقل من 40`,
          messages: [{
            role: 'user',
            content: `بيانات المورد:
اسم الشركة: ${supplier.company_name || 'غير محدد'}
وصف الشركة: ${supplier.bio_ar || supplier.bio_en || supplier.bio_zh || 'غير موجود'}
رابط الصفحة التجارية: ${supplier.trade_link || 'غير موجود'}
واتساب: ${supplier.whatsapp || 'غير موجود'}
WeChat: ${supplier.wechat || 'غير موجود'}
المدينة: ${supplier.city || 'غير محدد'}
الدولة: ${supplier.country || 'غير محدد'}
التخصص: ${supplier.speciality || 'غير محدد'}
طريقة الدفع: ${supplier.pay_method || 'غير محدد'}`
          }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const result = JSON.parse(clean);
      setVerifyResults(prev => ({ ...prev, [supplier.id]: result }));
    } catch (e) {
      setVerifyResults(prev => ({ ...prev, [supplier.id]: { score: 0, recommendation: 'review', summary: 'فشل التحقق التلقائي', positives: [], concerns: ['تعذر التحقق التلقائي — راجع يدوياً'] } }));
    }
    setVerifying(prev => ({ ...prev, [supplier.id]: false }));
  };

  const approveSupplier = async (supplier) => {
    setActionLoading(prev => ({ ...prev, [supplier.id]: 'approving' }));
    try {
      const { data: updatedSupplier, error: updateError } = await sb.from('profiles')
        .update({ status: 'verified' })
        .eq('id', supplier.id)
        .in('status', getSupplierReviewQueueStatuses())
        .select('id,status,company_name')
        .maybeSingle();

      if (updateError) throw updateError;

      if (!updatedSupplier) {
        addLog(`⚠️ لم يتم قبول المورد لأن حالته تغيرت أو لم يتم تحديثها: ${supplier.company_name}`);
        await loadPendingSuppliers();
        return;
      }

      const { error: notifError } = await sb.from('notifications').insert({
        user_id: supplier.id,
        type: 'account_approved',
        title_ar: '🎉 تم قبول حسابك في مَعبر! يمكنك الآن إضافة منتجاتك',
        title_en: '🎉 Your Maabar account has been approved! You can now add your products',
        title_zh: '🎉 您的Maabar账户已获批准！您现在可以添加产品',
        ref_id: supplier.id,
        is_read: false,
      });
      if (notifError) throw notifError;

      const supplierEmail = supplier.email || '';
      if (supplierEmail) {
        await sendMaabarEmail({
          type: 'supplier_approved',
          to: supplierEmail,
          data: { name: supplier.company_name || 'Supplier', lang },
        });
      } else {
        console.warn('approveSupplier: no email found for supplier', supplier.id);
      }

      await loadPendingSuppliers();
      addLog(`✅ تم قبول المورد: ${supplier.company_name}`);
      loadStats();
    } catch (e) {
      console.error('approveSupplier error:', e);
      addLog(`❌ فشل قبول المورد: ${supplier.company_name}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [supplier.id]: null }));
    }
  };

  const rejectSupplier = async (supplier) => {
    setActionLoading(prev => ({ ...prev, [supplier.id]: 'rejecting' }));
    try {
      const { data: updatedSupplier, error: updateError } = await sb.from('profiles')
        .update({ status: 'rejected' })
        .eq('id', supplier.id)
        .in('status', getSupplierReviewQueueStatuses())
        .select('id,status,company_name')
        .maybeSingle();

      if (updateError) throw updateError;

      if (!updatedSupplier) {
        addLog(`⚠️ لم يتم رفض المورد لأن حالته تغيرت أو لم يتم تحديثها: ${supplier.company_name}`);
        await loadPendingSuppliers();
        return;
      }

      const { error: notifError } = await sb.from('notifications').insert({
        user_id: supplier.id,
        type: 'account_rejected',
        title_ar: 'نأسف، لم يتم قبول حسابك. للاستفسار تواصل معنا على hello@maabar.io',
        title_en: 'Sorry, your account was not approved. Contact hello@maabar.io for inquiries',
        title_zh: '抱歉，您的账户未获批准。请联系hello@maabar.io',
        ref_id: supplier.id,
        is_read: false,
      });
      if (notifError) throw notifError;

      const supplierEmail = supplier.email || '';
      if (supplierEmail) {
        await sendMaabarEmail({
          type: 'supplier_rejected',
          to: supplierEmail,
          data: { name: supplier.company_name || 'Supplier', lang },
        });
      }

      await loadPendingSuppliers();
      addLog(`❌ تم رفض المورد: ${supplier.company_name}`);
      loadStats();
    } catch (e) {
      console.error('rejectSupplier error:', e);
      addLog(`❌ فشل رفض المورد: ${supplier.company_name}`);
    } finally {
      setActionLoading(prev => ({ ...prev, [supplier.id]: null }));
    }
  };

  const addLog = (msg) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const updateRequestStatus = async (requestId, newStatus) => {
    setUpdatingRequestStatus(prev => ({ ...prev, [requestId]: true }));
    await sb.from('requests').update({ status: newStatus }).eq('id', requestId);
    setOverviewRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
    setUpdatingRequestStatus(prev => ({ ...prev, [requestId]: false }));
  };

  const executeCommand = async () => {
    if (!command.trim()) return;
    setLoading(true);
    addLog(`تنفيذ: ${command}`);
    try {
      const res = await fetch(SUPABASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}` },
        body: JSON.stringify({
          system: `أنت مساعد إدارة منصة معبر B2B. المستخدم يعطيك أوامر لإدارة البيانات التجريبية.
رد بـ JSON فقط:
{"action":"add_requests","count":5,"data":[{"title_ar":"...","title_en":"...","quantity":"..."}]}
الأنواع المتاحة: add_requests, add_products, close_requests`,
          messages: [{ role: 'user', content: command }]
        })
      });
      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      if (!text || !text.includes('{')) throw new Error('Empty or invalid response');
      const clean = text.replace(/```json|```/g, '').trim();
      let parsed;
      try { parsed = JSON.parse(clean); } catch { throw new Error('JSON parse failed'); }
      if (parsed.action === 'add_requests') {
        for (const r of parsed.data) {
          await sb.from('requests').insert({ buyer_id: user.id, title_ar: r.title_ar, title_en: r.title_en, title_zh: r.title_zh || r.title_en, quantity: r.quantity, status: 'open', description: r.description || '' });
        }
        addLog(`✅ تم إضافة ${parsed.data.length} طلب`);
      } else if (parsed.action === 'add_products') {
        for (const p of parsed.data) {
          await sb.from('products').insert({ supplier_id: user.id, name_ar: p.name_ar, name_en: p.name_en, name_zh: p.name_zh || p.name_en, price_from: p.price_from, moq: p.moq, is_active: true });
        }
        addLog(`✅ تم إضافة ${parsed.data.length} منتج`);
      } else if (parsed.action === 'close_requests') {
        await sb.from('requests').update({ status: 'closed' }).eq('status', 'open').limit(parsed.count || 3);
        addLog(`✅ تم إغلاق ${parsed.count || 3} طلبات`);
      }
      loadStats();
    } catch (e) {
      addLog('❌ فشل تنفيذ الأمر — حاول مرة أخرى');
    }
    setLoading(false);
    setCommand('');
  };

  const getScoreColor = (score) => {
    if (score >= 60) return '#2d7a4f';
    if (score >= 40) return '#f57f17';
    return '#c00';
  };

  const getRecBadge = (rec) => {
    if (rec === 'approve') return { bg: 'rgba(45,122,79,0.1)', color: '#2d7a4f', label: 'يُنصح بالقبول' };
    if (rec === 'reject') return { bg: 'rgba(204,0,0,0.08)', color: '#c00', label: 'يُنصح بالرفض' };
    return { bg: 'rgba(245,127,23,0.1)', color: '#f57f17', label: 'يحتاج مراجعة' };
  };

  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: '#1a1a1a', color: '#fff' }}>
      <div style={{ padding: '40px 60px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 300, marginBottom: 8 }}>لوحة الإدارة</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, marginBottom: 40 }}>سرية — لك فقط</p>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(5,1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'مستخدمين حقيقيين', val: stats.real },
            { label: 'موردين نشطين', val: stats.activeSuppliers },
            { label: 'صفقات مكتملة', val: stats.completedDeals },
            { label: 'إجمالي العمولات (ريال)', val: stats.commissions.toLocaleString() },
            { label: 'مستخدمين جدد اليوم', val: stats.newToday },
          ].map((s, i) => (
            <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: 24, borderRadius: 4 }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 36, fontWeight: 300 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.1)', overflowX: 'auto' }}>
          {[
            { id: 'overview', label: 'نظرة عامة' },
            { id: 'suppliers', label: `الموردون المعلقون (${pendingSuppliers.length})` },
            { id: 'seed', label: 'البيانات التجريبية' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '12px 24px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent',
              color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* آخر المستخدمين */}
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 16, textTransform: 'uppercase' }}>آخر المستخدمين</p>
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                {overviewUsers.length === 0 ? (
                  <p style={{ padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>لا يوجد بيانات</p>
                ) : overviewUsers.map((u, i) => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < overviewUsers.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, color: '#fff', marginBottom: 2 }}>{u.full_name || u.company_name || '—'}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        {u.role} · {new Date(u.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: (u.status === 'verified' || u.status === 'active') ? 'rgba(45,122,79,0.15)' : 'rgba(200,60,60,0.15)', color: (u.status === 'verified' || u.status === 'active') ? '#4caf50' : '#ff6b6b' }}>{u.status}</span>
                      <button onClick={() => toggleUserStatus(u.id, u.status)} disabled={!!togglingUser[u.id]} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '5px 12px', fontSize: 11, cursor: 'pointer', borderRadius: 3 }}>
                        {togglingUser[u.id] ? '...' : ((u.status === 'verified' || u.status === 'active') ? 'تعطيل' : 'تفعيل')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* آخر الطلبات */}
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 16, textTransform: 'uppercase' }}>آخر الطلبات</p>
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                {overviewRequests.length === 0 ? (
                  <p style={{ padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>لا يوجد بيانات</p>
                ) : overviewRequests.map((r, i) => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < overviewRequests.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, color: '#fff', marginBottom: 2 }}>{r.title_ar || r.title_en || '—'}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        {new Date(r.created_at).toLocaleDateString('ar-SA')}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <select
                        value={r.status}
                        disabled={!!updatingRequestStatus[r.id]}
                        onChange={e => updateRequestStatus(r.id, e.target.value)}
                        style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', padding: '4px 8px', fontSize: 11, borderRadius: 3, cursor: 'pointer' }}
                      >
                        {['open', 'closed', 'in_progress', 'shipped', 'delivered', 'cancelled'].map(s => (
                          <option key={s} value={s} style={{ background: '#222' }}>{s}</option>
                        ))}
                      </select>
                      {updatingRequestStatus[r.id] && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>...</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* الصفقات الجارية */}
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 16, textTransform: 'uppercase' }}>الصفقات الجارية</p>
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
                {overviewDeals.length === 0 ? (
                  <p style={{ padding: 20, color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>لا توجد صفقات جارية</p>
                ) : overviewDeals.map((d, i) => (
                  <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: i < overviewDeals.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none', flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <p style={{ fontSize: 14, color: '#fff', marginBottom: 2 }}>{d.requests?.title_ar || d.requests?.title_en || '—'}</p>
                      <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
                        مورد: {d.profiles?.company_name || '—'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>{d.status}</span>
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{new Date(d.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUPPLIERS TAB */}
        {activeTab === 'suppliers' && (
          <div>
            {pendingSuppliers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                <p style={{ fontSize: 14 }}>لا يوجد موردون معلقون</p>
              </div>
            ) : [...pendingSuppliers].sort((a, b) => {
              const hoursA = (Date.now() - new Date(a.created_at)) / 3600000;
              const hoursB = (Date.now() - new Date(b.created_at)) / 3600000;
              return (hoursB > 24 ? 1 : 0) - (hoursA > 24 ? 1 : 0) || new Date(a.created_at) - new Date(b.created_at);
            }).map((s, idx) => {
              const vResult = verifyResults[s.id];
              const isVerifying = verifying[s.id];
              const isActing = actionLoading[s.id];
              const hoursWaiting = (Date.now() - new Date(s.created_at)) / 3600000;

              return (
                <div key={s.id} style={{
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                  marginBottom: 16, overflow: 'hidden',
                  animation: `fadeIn 0.4s ease ${idx * 0.05}s both`,
                }}>
                  {/* SUPPLIER HEADER */}
                  <div style={{ padding: '20px 24px', background: 'rgba(255,255,255,0.04)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 500 }}>
                          {(s.company_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <p style={{ fontSize: 16, fontWeight: 500 }}>{s.company_name || 'بدون اسم'}</p>
                            {hoursWaiting > 24 && (
                              <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(200,0,0,0.2)', color: '#ff6b6b', border: '1px solid rgba(200,0,0,0.3)' }}>⚠ تجاوز 24 ساعة</span>
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.city || ''}{s.country ? ` · ${s.country}` : ''}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                        {s.whatsapp && <span>📱 {s.whatsapp}</span>}
                        {s.wechat && <span>💬 {s.wechat}</span>}
                        {s.trade_link && <a href={s.trade_link} target="_blank" rel="noreferrer" style={{ color: '#4a9eff', textDecoration: 'none' }}>🔗 صفحة تجارية</a>}
                        {s.speciality && <span>🏭 {s.speciality}</span>}
                      </div>
                      {(s.bio_ar || s.bio_en) && (
                        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 1.6 }}>
                          {s.bio_ar || s.bio_en}
                        </p>
                      )}
                      {/* Documents */}
                      {(s.license_photo || s.factory_photo) && (
                        <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                          {s.license_photo && (
                            <button onClick={() => openSupplierDoc(s.id, 'license')} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11 }}>
                              {docLoading[`${s.id}-license`] ? '...' : '📄 رخصة تجارية'}
                            </button>
                          )}
                          {s.factory_photo && (
                            <button onClick={() => openSupplierDoc(s.id, 'factory')} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.14)', padding: '8px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11 }}>
                              {docLoading[`${s.id}-factory`] ? '...' : '🏭 صورة المصنع'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* ACTIONS */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 140 }}>
                      {!vResult && (
                        <button onClick={() => verifySupplier(s)} disabled={isVerifying} style={{
                          background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
                          padding: '9px 16px', fontSize: 12, cursor: 'pointer', borderRadius: 3, transition: 'all 0.2s',
                          opacity: isVerifying ? 0.6 : 1,
                        }}>
                          {isVerifying ? '⏳ جاري التحقق...' : '🤖 تحقق بالـ AI'}
                        </button>
                      )}
                      <button onClick={() => setExpandedSupplier(expandedSupplier === s.id ? null : s.id)} style={{
                        background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        padding: '9px 16px', fontSize: 12, cursor: 'pointer', borderRadius: 3,
                      }}>
                        {expandedSupplier === s.id ? '← إخفاء' : '📋 الملف الكامل'}
                      </button>
                      <button onClick={() => approveSupplier(s)} disabled={!!isActing} style={{
                        background: 'rgba(45,122,79,0.2)', color: '#4caf50',
                        border: '1px solid rgba(45,122,79,0.4)',
                        padding: '9px 16px', fontSize: 12, cursor: 'pointer', borderRadius: 3,
                        opacity: isActing ? 0.5 : 1, transition: 'all 0.2s',
                      }}>
                        {isActing === 'approving' ? '...' : '✓ قبول'}
                      </button>
                      <button onClick={() => rejectSupplier(s)} disabled={!!isActing} style={{
                        background: 'rgba(204,0,0,0.15)', color: '#ff6b6b',
                        border: '1px solid rgba(204,0,0,0.3)',
                        padding: '9px 16px', fontSize: 12, cursor: 'pointer', borderRadius: 3,
                        opacity: isActing ? 0.5 : 1, transition: 'all 0.2s',
                      }}>
                        {isActing === 'rejecting' ? '...' : '✕ رفض'}
                      </button>
                    </div>
                  </div>

                  {/* FULL PROFILE */}
                  {expandedSupplier === s.id && (
                    <div style={{ padding: '20px 24px', background: 'rgba(0,0,0,0.4)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 16 }}>الملف الكامل</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', fontSize: 13 }}>
                        {[
                          { label: 'الإيميل', val: s.email },
                          { label: 'اسم الشركة', val: s.company_name },
                          { label: 'WhatsApp', val: s.whatsapp },
                          { label: 'WeChat', val: s.wechat },
                          { label: 'طريقة الدفع', val: s.pay_method },
                          { label: 'Alipay', val: s.alipay_account },
                          { label: 'SWIFT', val: s.swift_code },
                          { label: 'البنك', val: s.bank_name },
                          { label: 'التخصص', val: s.speciality },
                          { label: 'رقم التسجيل', val: s.reg_number },
                          { label: 'المدينة', val: s.city },
                          { label: 'الدولة', val: s.country },
                          { label: 'الصفحة التجارية', val: s.trade_link },
                          { label: 'سنوات الخبرة', val: s.years_experience },
                        ].map(({ label, val }) => val ? (
                          <div key={label} style={{ padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>{label}: </span>
                            <span style={{ color: 'rgba(255,255,255,0.75)' }}>{val}</span>
                          </div>
                        ) : null)}
                      </div>
                      {(s.license_photo || s.factory_photo) && (
                        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
                          {s.license_photo && (
                            <button onClick={() => openSupplierDoc(s.id, 'license')} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.14)', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                              {docLoading[`${s.id}-license`] ? '...' : 'فتح الرخصة بشكل آمن'}
                            </button>
                          )}
                          {s.factory_photo && (
                            <button onClick={() => openSupplierDoc(s.id, 'factory')} style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.14)', padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 12 }}>
                              {docLoading[`${s.id}-factory`] ? '...' : 'فتح صورة المصنع بشكل آمن'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI VERIFICATION RESULT */}
                  {vResult && (
                    <div style={{ padding: '20px 24px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                        <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>تقرير الـ AI</p>
                        {/* SCORE */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 48, height: 48, borderRadius: '50%', border: `3px solid ${getScoreColor(vResult.score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 14, fontWeight: 600, color: getScoreColor(vResult.score) }}>{vResult.score}</span>
                          </div>
                          <div>
                            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 2 }}>Trust Score</p>
                            <span style={{ fontSize: 10, padding: '2px 10px', borderRadius: 20, background: getRecBadge(vResult.recommendation).bg, color: getRecBadge(vResult.recommendation).color }}>
                              {getRecBadge(vResult.recommendation).label}
                            </span>
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', flex: 1 }}>{vResult.summary}</p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        {vResult.positives?.length > 0 && (
                          <div>
                            <p style={{ fontSize: 10, letterSpacing: 1.5, color: '#4caf50', marginBottom: 8 }}>✓ إيجابيات</p>
                            {vResult.positives.map((p, i) => (
                              <p key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>• {p}</p>
                            ))}
                          </div>
                        )}
                        {vResult.concerns?.length > 0 && (
                          <div>
                            <p style={{ fontSize: 10, letterSpacing: 1.5, color: '#ff6b6b', marginBottom: 8 }}>⚠ نقاط قلق</p>
                            {vResult.concerns.map((c, i) => (
                              <p key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>• {c}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SEED TAB */}
        {activeTab === 'seed' && (
          <div>
            {/* COMMAND */}
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>اكتب أمر بالنص الحر:</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  style={{ flex: 1, padding: '13px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14, borderRadius: 3, outline: 'none' }}
                  placeholder="مثال: أضف 5 طلبات أثاث مكتبي"
                  value={command}
                  onChange={e => setCommand(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && executeCommand()}
                />
                <button onClick={executeCommand} disabled={loading} style={{ background: '#fff', color: '#1a1a1a', border: 'none', padding: '13px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer', borderRadius: 3 }}>
                  {loading ? '...' : 'تنفيذ'}
                </button>
              </div>
            </div>

            {/* QUICK COMMANDS */}
            <div style={{ marginBottom: 32 }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>أوامر سريعة:</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['أضف 5 طلبات منتجات متنوعة', 'أضف 3 منتجات إلكترونيات', 'أغلق 3 طلبات قديمة', 'أضف 5 طلبات أثاث'].map((cmd, i) => (
                  <button key={i} onClick={() => setCommand(cmd)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '8px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 3 }}>
                    {cmd}
                  </button>
                ))}
              </div>
            </div>

            {/* LOG */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: 20, maxHeight: 300, overflowY: 'auto' }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>LOG:</p>
              {log.length === 0
                ? <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>لا توجد عمليات بعد...</p>
                : log.map((l, i) => <p key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{l}</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}