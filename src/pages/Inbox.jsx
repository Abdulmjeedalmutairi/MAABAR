import Footer from '../components/Footer';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';
import { fetchProfileDirectoryByIds } from '../lib/profileVisibility';
import { fetchMyBuyerThreads } from '../lib/factoryChat';

export default function Inbox({ lang, user }) {
  const nav = useNavigate();
  const [convs, setConvs] = useState([]);
  const isAr = lang === 'ar';
  const isZh = lang === 'zh';

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
    // Direct DMs exclude factory rows (factory_id null); factory conversations are
    // grouped separately and merged into one unified list.
    const [sent, recv, factoryThreads] = await Promise.all([
      sb.from('messages').select('receiver_id,content,created_at').eq('sender_id', user.id).is('factory_id', null).order('created_at', { ascending: false }),
      sb.from('messages').select('sender_id,content,created_at,is_read').eq('receiver_id', user.id).is('factory_id', null).order('created_at', { ascending: false }),
      fetchMyBuyerThreads(user.id),
    ]);

    const map = {};
    if (sent.data) sent.data.forEach(m => {
      if (!map[m.receiver_id] || new Date(m.created_at) > new Date(map[m.receiver_id].last_time))
        map[m.receiver_id] = { kind: 'direct', partner_id: m.receiver_id, last_msg: m.content, last_time: m.created_at, unread: 0 };
    });
    if (recv.data) recv.data.forEach(m => {
      if (!map[m.sender_id] || new Date(m.created_at) > new Date(map[m.sender_id].last_time))
        map[m.sender_id] = { kind: 'direct', partner_id: m.sender_id, last_msg: m.content, last_time: m.created_at, unread: map[m.sender_id]?.unread || 0 };
      if (!m.is_read) map[m.sender_id].unread = (map[m.sender_id].unread || 0) + 1;
    });

    const directList = Object.values(map);
    const factoryList = (factoryThreads || []).map(th => ({
      kind: 'factory', factory_id: th.factory_id,
      last_msg: th.last_preview, last_time: th.last_at, unread: th.unread,
      profile: { company_name: th.factory?.company_name || th.factory?.company_name_latin || '—' },
    }));

    const list = [...directList, ...factoryList].sort((a, b) => new Date(b.last_time) - new Date(a.last_time));
    if (!list.length) { setConvs([]); return; }

    const ids = directList.map(c => c.partner_id);
    const profiles = ids.length ? await fetchProfileDirectoryByIds(sb, ids) : [];
    const pm = {};
    if (profiles) profiles.forEach(p => pm[p.id] = p);

    setConvs(list.map(c => c.kind === 'factory' ? c : ({ ...c, profile: pm[c.partner_id] || {} })));

    // mark direct DMs as read (factory threads are marked read when opened)
    await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).is('factory_id', null).eq('is_read', false);
  };

  const openChat = async (conv) => {
    if (conv.kind === 'factory') { nav(`/chat/f/${conv.factory_id}`); return; }
    await sb.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', conv.partner_id).is('factory_id', null).eq('is_read', false);
    setConvs(prev => prev.map(c => c.partner_id === conv.partner_id ? { ...c, unread: 0 } : c));
    nav(`/chat/${conv.partner_id}`);
  };

  const fmtDate = (d) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 3600) return isAr ? Math.floor(diff / 60) + ' د' : isZh ? Math.floor(diff / 60) + '分钟前' : Math.floor(diff / 60) + 'm';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' س' : isZh ? Math.floor(diff / 3600) + '小时前' : Math.floor(diff / 3600) + 'h';
    return isAr ? Math.floor(diff / 86400) + ' ي' : isZh ? Math.floor(diff / 86400) + '天前' : Math.floor(diff / 86400) + 'd';
  };

  return (
    <div style={{ minHeight: 'var(--app-dvh)', paddingTop: 'var(--page-top-offset)', background: 'var(--bg-base)' }}>

      {/* HEADER */}
      <div style={{
        padding: 'clamp(28px, 8vw, 60px) clamp(16px, 6vw, 60px) clamp(20px, 5vw, 32px)',
        background: 'var(--bg-overlay)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <button onClick={() => nav('/dashboard')} style={{
          background: 'none', border: 'none', color: 'var(--text-tertiary)',
          fontSize: 11, cursor: 'pointer', letterSpacing: 2,
          textTransform: 'uppercase', padding: 0, marginBottom: 20,
          transition: 'color 0.2s', display: 'block'
        }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
          {isAr ? 'لوحتي →' : isZh ? '← 控制台' : '← Dashboard'}
        </button>
        <p style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16, fontFamily: 'var(--font-body)' }}>
          {isAr ? 'مَعبر · الرسائل' : isZh ? 'Maabar · 消息' : 'Maabar · Messages'}
        </p>
        <h1 style={{ fontSize: 'clamp(34px, 10vw, 64px)', fontWeight: 300, fontFamily: isAr ? 'var(--font-ar)' : 'var(--font-en)', color: 'var(--text-primary)', letterSpacing: isAr ? 0 : -1, lineHeight: 1 }}>
          {isAr ? 'الرسائل' : isZh ? '消息' : 'Messages'}
        </h1>
      </div>

      {/* LIST */}
      <div style={{ background: 'var(--bg-subtle)', minHeight: 'calc(var(--app-dvh) - 280px)' }}>
        <div style={{ padding: 'clamp(24px, 5vw, 40px) clamp(16px, 6vw, 60px)', maxWidth: 760, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>
          {convs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 0' }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, letterSpacing: 1 }}>
                {isAr ? 'لا توجد رسائل بعد' : isZh ? '暂无消息' : 'No messages yet'}
              </p>
            </div>
          ) : convs.map((c, idx) => {
            const name = c.profile?.company_name || c.profile?.full_name || '—';
            return (
              <div key={c.kind === 'factory' ? `f:${c.factory_id}` : c.partner_id} onClick={() => openChat(c)} style={{
                display: 'flex', alignItems: 'center', gap: 20,
                padding: '20px 0', borderTop: idx === 0 ? '1px solid var(--border-muted)' : 'none',
                borderBottom: '1px solid var(--border-muted)',
                cursor: 'pointer', transition: 'opacity 0.2s',
                animation: `fadeIn 0.4s ease ${idx * 0.05}s both`
              }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: c.unread > 0 ? 'var(--bg-raised)' : 'var(--bg-hover)',
                  color: c.unread > 0 ? 'var(--text-primary)' : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 500, flexShrink: 0,
                  transition: 'all 0.2s'
                }}>
                  {name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: c.unread > 0 ? 600 : 400, color: 'var(--text-primary)', marginBottom: 4 }}>{name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_msg}</p>
                </div>
                <div style={{ textAlign: 'end', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <p style={{ fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 0.5 }}>{fmtDate(c.last_time)}</p>
                  {c.unread > 0 && (
                    <div style={{ background: 'var(--bg-raised)', color: 'var(--text-primary)', fontSize: 9, fontWeight: 700, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.unread}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer lang={lang} />
    </div>
  );
}
