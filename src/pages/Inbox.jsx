import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

export default function Inbox({ lang, user }) {
  const nav = useNavigate();
  const [convs, setConvs] = useState([]);
  const isAr = lang === 'ar';

  useEffect(() => {
    const navEl = document.querySelector('nav');
    if (navEl) navEl.classList.add('scrolled');
    return () => { if (navEl) navEl.classList.remove('scrolled'); };
  }, []);

  useEffect(() => {
    if (!user) { nav('/login'); return; }
    loadInbox();
  }, [user]);

  const loadInbox = async () => {
    const [sent, recv] = await Promise.all([
      sb.from('messages').select('receiver_id,content,created_at').eq('sender_id', user.id).order('created_at', { ascending: false }),
      sb.from('messages').select('sender_id,content,created_at,is_read').eq('receiver_id', user.id).order('created_at', { ascending: false })
    ]);

    const map = {};
    if (sent.data) sent.data.forEach(m => {
      if (!map[m.receiver_id] || new Date(m.created_at) > new Date(map[m.receiver_id].last_time))
        map[m.receiver_id] = { partner_id: m.receiver_id, last_msg: m.content, last_time: m.created_at, unread: 0 };
    });
    if (recv.data) recv.data.forEach(m => {
      if (!map[m.sender_id] || new Date(m.created_at) > new Date(map[m.sender_id].last_time))
        map[m.sender_id] = { partner_id: m.sender_id, last_msg: m.content, last_time: m.created_at, unread: map[m.sender_id]?.unread || 0 };
      if (!m.is_read) map[m.sender_id].unread = (map[m.sender_id].unread || 0) + 1;
    });

    const list = Object.values(map).sort((a, b) => new Date(b.last_time) - new Date(a.last_time));
    if (!list.length) { setConvs([]); return; }

    const ids = list.map(c => c.partner_id);
    const { data: profiles } = await sb.from('profiles').select('id,full_name,company_name,avatar_url').in('id', ids);
    const pm = {};
    if (profiles) profiles.forEach(p => pm[p.id] = p);

    setConvs(list.map(c => ({ ...c, profile: pm[c.partner_id] || {} })));

    // mark as read
    await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('is_read', false);
  };

  const openChat = async (partnerId) => {
    await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', partnerId).eq('is_read', false);
    setConvs(prev => prev.map(c => c.partner_id === partnerId ? { ...c, unread: 0 } : c));
    nav(`/chat/${partnerId}`);
  };

  const fmtDate = (d) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 3600) return isAr ? Math.floor(diff / 60) + ' د' : Math.floor(diff / 60) + 'm';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' س' : Math.floor(diff / 3600) + 'h';
    return isAr ? Math.floor(diff / 86400) + ' ي' : Math.floor(diff / 86400) + 'd';
  };

  return (
    <div style={{ minHeight: '100vh', paddingTop: 72, background: 'transparent' }}>

      {/* HEADER */}
      <div style={{
        padding: '60px 60px 32px',
        background: 'rgba(0,0,0,0.38)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button onClick={() => nav('/dashboard')} style={{
          background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)',
          fontSize: 11, cursor: 'pointer', letterSpacing: 2,
          textTransform: 'uppercase', padding: 0, marginBottom: 20,
          transition: 'color 0.2s', display: 'block'
        }}
          onMouseEnter={e => e.currentTarget.style.color = '#F7F5F2'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
          {isAr ? 'لوحتي →' : '← Dashboard'}
        </button>
        <p style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
          {isAr ? 'مَعبر · الرسائل' : 'Maabar · Messages'}
        </p>
        <h1 style={{ fontSize: 64, fontWeight: 300, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', color: '#F7F5F2', letterSpacing: isAr ? 0 : -1, lineHeight: 1 }}>
          {isAr ? 'الرسائل' : 'Messages'}
        </h1>
      </div>

      {/* LIST */}
      <div style={{ background: 'rgba(247,245,242,0.92)', backdropFilter: 'blur(8px)', minHeight: 'calc(100vh - 280px)' }}>
        <div style={{ padding: '40px 60px', maxWidth: 760, margin: '0 auto' }}>
          {convs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ color: '#7a7a7a', fontSize: 13, letterSpacing: 1 }}>
                {isAr ? 'لا توجد رسائل بعد' : 'No messages yet'}
              </p>
            </div>
          ) : convs.map((c, idx) => {
            const name = c.profile?.company_name || c.profile?.full_name || '—';
            return (
              <div key={c.partner_id} onClick={() => openChat(c.partner_id)} style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '20px 0', borderTop: idx === 0 ? '1px solid #E5E0D8' : 'none',
                borderBottom: '1px solid #E5E0D8',
                cursor: 'pointer', transition: 'opacity 0.2s',
                animation: `fadeIn 0.4s ease ${idx * 0.05}s both`
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: c.unread > 0 ? '#2C2C2C' : '#E5E0D8',
                  color: c.unread > 0 ? '#F7F5F2' : '#7a7a7a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 500, flexShrink: 0,
                  transition: 'all 0.2s'
                }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: c.unread > 0 ? 600 : 400, color: '#2C2C2C', marginBottom: 4 }}>{name}</p>
                  <p style={{ fontSize: 12, color: '#7a7a7a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_msg}</p>
                </div>
                <div style={{ textAlign: 'end', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <p style={{ fontSize: 11, color: '#7a7a7a', letterSpacing: 0.5 }}>{fmtDate(c.last_time)}</p>
                  {c.unread > 0 && (
                    <div style={{ background: '#2C2C2C', color: '#F7F5F2', fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.unread}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <footer style={{ background: '#2C2C2C', padding: '32px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-en)', fontSize: 16, fontWeight: 600, color: '#F7F5F2', letterSpacing: 2 }}>
          MAABAR <span style={{ fontFamily: 'var(--font-ar)', fontSize: 13, opacity: 0.5 }}>| مَعبر</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, letterSpacing: 1 }}>{isAr ? 'مَعبر © 2026' : 'Maabar © 2026'}</p>
      </footer>
    </div>
  );
}
