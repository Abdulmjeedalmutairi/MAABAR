import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

const ADMIN_EMAIL = 'mjeedalmutairis@gmail.com';

export default function AdminSeed({ user, lang }) {
  const nav = useNavigate();
  const [command, setCommand] = useState('');
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ real: 0, fake: 0, requests: 0, products: 0 });
  const isAr = lang === 'ar';

  useEffect(() => {
    if (!user || user.email !== ADMIN_EMAIL) { nav('/'); return; }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    const [profiles, requests, products] = await Promise.all([
      sb.from('profiles').select('id,is_seed', { count: 'exact' }),
      sb.from('requests').select('id', { count: 'exact' }),
      sb.from('products').select('id', { count: 'exact' }),
    ]);
    const fake = profiles.data?.filter(p => p.is_seed).length || 0;
    setStats({
      real: (profiles.count || 0) - fake,
      fake,
      requests: requests.count || 0,
      products: products.count || 0
    });
  };

  const addLog = (msg) => setLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);

  const executeCommand = async () => {
    if (!command.trim()) return;
    setLoading(true);
    addLog(`تنفيذ: ${command}`);

    try {
      const res = await fetch('https://utzalmszfqfcofywfetv.supabase.co/functions/v1/AI-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0emFsbXN6ZnFmY29meXdmZXR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2NjE4NDAsImV4cCI6MjA4OTIzNzg0MH0.SSqFCeBRhKRIrS8oQasBkTsZxSv7uZGCT9pqfK-YmX8`
        },
        body: JSON.stringify({
          system: `أنت مساعد إدارة منصة معبر B2B. المستخدم يعطيك أوامر لإدارة البيانات التجريبية.
          رد بـ JSON فقط بهذا الشكل:
          {"action":"add_requests","count":5,"data":[{"title_ar":"...","title_en":"...","quantity":"..."}]}
          الأنواع المتاحة: add_requests, add_products, close_requests, add_reviews`,
          messages: [{ role: 'user', content: command }]
        })
      });

      const data = await res.json();
      const text = data.content?.[0]?.text || '';
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);

      if (parsed.action === 'add_requests') {
        for (const r of parsed.data) {
          await sb.from('requests').insert({
            buyer_id: user.id,
            title_ar: r.title_ar,
            title_en: r.title_en,
            title_zh: r.title_zh || r.title_en,
            quantity: r.quantity,
            status: 'open',
            description: r.description || ''
          });
        }
        addLog(`✅ تم إضافة ${parsed.data.length} طلب`);
      } else if (parsed.action === 'add_products') {
        for (const p of parsed.data) {
          await sb.from('products').insert({
            supplier_id: user.id,
            name_ar: p.name_ar,
            name_en: p.name_en,
            name_zh: p.name_zh || p.name_en,
            price_from: p.price_from,
            moq: p.moq,
            is_active: true
          });
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

  if (!user || user.email !== ADMIN_EMAIL) return null;

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: '#1a1a1a', color: '#fff' }}>
      <div style={{ padding: '40px 60px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 300, marginBottom: 8 }}>🌱 لوحة الـ Seeding</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginBottom: 40 }}>سرية — لك فقط</p>

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

        {/* COMMAND */}
        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 12 }}>
            {isAr ? 'اكتب أمر بالنص الحر:' : 'Enter a free-text command:'}
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              style={{ flex: 1, padding: '13px 16px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: 14, borderRadius: 3, outline: 'none' }}
              placeholder={isAr ? 'مثال: أضف 5 طلبات أثاث مكتبي من تاجرن سعوديين' : 'e.g. Add 5 office furniture requests from Saudi buyers'}
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && executeCommand()}
            />
            <button
              onClick={executeCommand}
              disabled={loading}
              style={{ background: '#fff', color: '#1a1a1a', border: 'none', padding: '13px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer', borderRadius: 3 }}>
              {loading ? '...' : isAr ? 'تنفيذ' : 'Execute'}
            </button>
          </div>
        </div>

        {/* QUICK COMMANDS */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>أوامر سريعة:</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              'أضف 5 طلبات منتجات متنوعة',
              'أضف 3 منتجات إلكترونيات',
              'أغلق 3 طلبات قديمة',
              'أضف 5 طلبات أثاث'
            ].map((cmd, i) => (
              <button key={i}
                onClick={() => { setCommand(cmd); }}
                style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', padding: '8px 14px', fontSize: 12, cursor: 'pointer', borderRadius: 3 }}>
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* LOG */}
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: 20, maxHeight: 300, overflowY: 'auto' }}>
          <p style={{ fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>LOG:</p>
          {log.length === 0 ? (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>لا توجد عمليات بعد...</p>
          ) : (
            log.map((l, i) => <p key={i} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 4 }}>{l}</p>)
          )}
        </div>
      </div>
    </div>
  );
}