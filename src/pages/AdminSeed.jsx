import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const ADMIN_EMAIL = 'mjeedalmutairis@gmail.com';
const SUPABASE_URL = 'https://utzalmszfqfcofywfetv.supabase.co/functions/v1/Ai-proxy';
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export default function AdminSeed({ user, lang }) {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [command, setCommand] = useState('');
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ real: 0, fake: 0, requests: 0, products: 0 });
  const [pendingSuppliers, setPendingSuppliers] = useState([]);
  const [verifying, setVerifying] = useState({});
  const [verifyResults, setVerifyResults] = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const isAr = lang === 'ar';

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) { nav('/'); return; }
    loadStats();
    loadPendingSuppliers();
  }, [user]);

  const loadStats = async () => {
    const [profiles, requests, products] = await Promise.all([
      sb.from('profiles').select('id,is_seed', { count: 'exact' }),
      sb.from('requests').select('id', { count: 'exact' }),
      sb.from('products').select('id', { count: 'exact' }),
    ]);
    const fake = profiles.data?.filter(p => p.is_seed).length || 0;
    setStats({ real: (profiles.count || 0) - fake, fake, requests: requests.count || 0, products: products.count || 0 });
  };

  const loadPendingSuppliers = async () => {
    const { data } = await sb.from('profiles')
      .select('*')
      .eq('role', 'supplier')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setPendingSuppliers(data);
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
    await sb.from('profiles').update({ status: 'active' }).eq('id', supplier.id);
    await sb.from('notifications').insert({
      user_id: supplier.id,
      type: 'account_approved',
      title_ar: '🎉 تم قبول حسابك في مَعبر! يمكنك الآن إضافة منتجاتك',
      title_en: '🎉 Your Maabar account has been approved! You can now add your products',
      title_zh: '🎉 您的Maabar账户已获批准！您现在可以添加产品',
      ref_id: supplier.id,
      is_read: false,
    });
    setPendingSuppliers(prev => prev.filter(s => s.id !== supplier.id));
    setActionLoading(prev => ({ ...prev, [supplier.id]: null }));
    addLog(`✅ تم قبول المورد: ${supplier.company_name}`);
    loadStats();
  };

  const rejectSupplier = async (supplier) => {
    setActionLoading(prev => ({ ...prev, [supplier.id]: 'rejecting' }));
    await sb.from('profiles').update({ status: 'rejected' }).eq('id', supplier.id);
    await sb.from('notifications').insert({
      user_id: supplier.id,
      type: 'account_rejected',
      title_ar: 'نأسف، لم يتم قبول حسابك. للاستفسار تواصل معنا على hello@maabar.io',
      title_en: 'Sorry, your account was not approved. Contact hello@maabar.io for inquiries',
      title_zh: '抱歉，您的账户未获批准。请联系hello@maabar.io',
      ref_id: supplier.id,
      is_read: false,
    });
    setPendingSuppliers(prev => prev.filter(s => s.id !== supplier.id));
    setActionLoading(prev => ({ ...prev, [supplier.id]: null }));
    addLog(`❌ تم رفض المورد: ${supplier.company_name}`);
    loadStats();
  };

  const addLog = (msg) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

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
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
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
      addLog(`❌ خطأ: ${e.message}`);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'مستخدمين حقيقيين', val: stats.real },
            { label: 'بيانات تجريبية', val: stats.fake },
            { label: 'طلبات', val: stats.requests },
            { label: 'منتجات', val: stats.products },
          ].map((s, i) => (
            <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)', padding: 24, borderRadius: 4 }}>
              <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{s.label}</p>
              <p style={{ fontSize: 42, fontWeight: 300 }}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {[
            { id: 'suppliers', label: `الموردون المعلقون (${pendingSuppliers.length})` },
            { id: 'seed', label: 'البيانات التجريبية' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '12px 24px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #fff' : '2px solid transparent',
              color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* SUPPLIERS TAB */}
        {activeTab === 'suppliers' && (
          <div>
            {pendingSuppliers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)' }}>
                <p style={{ fontSize: 14 }}>لا يوجد موردون معلقون</p>
              </div>
            ) : pendingSuppliers.map((s, idx) => {
              const vResult = verifyResults[s.id];
              const isVerifying = verifying[s.id];
              const isActing = actionLoading[s.id];

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
                          <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 2 }}>{s.company_name || 'بدون اسم'}</p>
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
                      {(s.license_url || s.factory_image_url) && (
                        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
                          {s.license_url && (
                            <a href={s.license_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                              <img src={s.license_url} alt="رخصة تجارية" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 3, border: '1px solid rgba(255,255,255,0.15)' }} />
                              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 4 }}>رخصة تجارية</p>
                            </a>
                          )}
                          {s.factory_image_url && (
                            <a href={s.factory_image_url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                              <img src={s.factory_image_url} alt="صورة المصنع" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 3, border: '1px solid rgba(255,255,255,0.15)' }} />
                              <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 4 }}>صورة المصنع</p>
                            </a>
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