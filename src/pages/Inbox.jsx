import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sb } from '../supabase';

export default function Inbox({ lang, user }) {
  const nav = useNavigate();
  const [convs, setConvs] = useState([]);
  const isAr = lang === 'ar';

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
  };

  const fmtDate = (d) => {
    if (!d) return '';
    const diff = Math.floor((Date.now() - new Date(d)) / 1000);
    if (diff < 3600) return isAr ? Math.floor(diff / 60) + ' د' : Math.floor(diff / 60) + 'm';
    if (diff < 86400) return isAr ? Math.floor(diff / 3600) + ' س' : Math.floor(diff / 3600) + 'h';
    return isAr ? Math.floor(diff / 86400) + ' ي' : Math.floor(diff / 86400) + 'd';
  };

  return (
    <div className="full-page">
      <div className="page-header">
        <h1 className={`page-title${isAr ? ' ar' : ''}`}>{isAr ? 'الرسائل' : 'Messages'}</h1>
      </div>
      <div className="list-wrap">
        {convs.length === 0 ? (
          <p style={{ color: '#6b6b6b', textAlign: 'center', padding: 40 }}>{isAr ? 'لا توجد رسائل بعد' : 'No messages yet'}</p>
        ) : (
          convs.map(c => {
            const name = c.profile?.company_name || c.profile?.full_name || '—';
            return (
              <div key={c.partner_id} className="inbox-item" onClick={() => nav(`/chat/${c.partner_id}`)}>
                <div className="avatar">{name[0]}</div>
                <div className="inbox-info">
                  <p className="inbox-name">{name}</p>
                  <p className="inbox-last">{c.last_msg}</p>
                </div>
                <div style={{ textAlign: 'end', flexShrink: 0 }}>
                  <p className="inbox-time">{fmtDate(c.last_time)}</p>
                  {c.unread > 0 && <div className="inbox-unread">{c.unread}</div>}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}