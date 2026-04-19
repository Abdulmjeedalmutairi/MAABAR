import React, { useState, useEffect, useCallback } from 'react';
import { sb } from '../../supabase';

function timeAgo(dateStr, lang) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'ar' ? 'الآن' : 'Just now';
  if (mins < 60) return lang === 'ar' ? `منذ ${mins} د` : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return lang === 'ar' ? `منذ ${hrs} س` : `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return lang === 'ar' ? `منذ ${days} يوم` : `${days}d ago`;
}

export default function AdminNoteThread({ entityType, entityId, user, lang }) {
  const [notes, setNotes] = useState([]);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const isRTL = lang === 'ar';

  const load = useCallback(async () => {
    if (!entityId) return;
    const { data } = await sb
      .from('admin_notes')
      .select('*, author:author_id(full_name, email)')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    setNotes(data || []);
  }, [entityType, entityId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!body.trim()) return;
    setSaving(true);
    await sb.from('admin_notes').insert({
      entity_type: entityType,
      entity_id: entityId,
      author_id: user.id,
      body: body.trim(),
    });
    setBody('');
    await load();
    setSaving(false);
  };

  const togglePin = async (note) => {
    await sb.from('admin_notes').update({ is_pinned: !note.is_pinned }).eq('id', note.id);
    await load();
  };

  const deleteNote = async (id) => {
    await sb.from('admin_notes').delete().eq('id', id);
    await load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ margin: 0, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
        {isRTL ? 'الملاحظات' : 'Notes'}
      </p>

      {/* Add note */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={isRTL ? 'أضف ملاحظة...' : 'Add a note…'}
          dir={isRTL ? 'rtl' : 'ltr'}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg-base)', border: '1px solid var(--border-default)',
            borderRadius: 10, padding: '10px 12px', fontSize: 14, color: 'var(--text-primary)',
            fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)',
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
          }}
        />
        <button
          onClick={submit}
          disabled={saving || !body.trim()}
          style={{
            alignSelf: 'flex-start', minHeight: 44, padding: '0 20px',
            background: body.trim() ? 'var(--text-primary)' : 'var(--bg-subtle)',
            color: body.trim() ? 'var(--bg-base)' : 'var(--text-disabled)',
            border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600,
            cursor: body.trim() ? 'pointer' : 'default', transition: 'all 0.15s',
            fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)',
          }}
        >
          {saving ? (isRTL ? 'جارٍ الحفظ...' : 'Saving…') : (isRTL ? 'إضافة' : 'Add note')}
        </button>
      </div>

      {/* Note list */}
      {notes.length === 0 && (
        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', margin: 0, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)' }}>
          {isRTL ? 'لا توجد ملاحظات بعد.' : 'No notes yet.'}
        </p>
      )}
      {notes.map(note => (
        <div key={note.id} style={{
          background: note.is_pinned ? 'rgba(245,208,65,0.08)' : 'var(--bg-raised)',
          border: note.is_pinned ? '1px solid rgba(245,208,65,0.35)' : '1px solid var(--border-subtle)',
          borderRadius: 12, padding: '12px 14px',
          direction: isRTL ? 'rtl' : 'ltr',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'var(--font-sans)' }}>
              {note.author?.full_name || note.author?.email || 'Admin'}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-sans)' }}>
                {timeAgo(note.created_at, lang)}
              </span>
              <button
                onClick={() => togglePin(note)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, padding: '4px', minWidth: 28, minHeight: 28 }}
                title={note.is_pinned ? 'Unpin' : 'Pin'}
              >
                {note.is_pinned ? '★' : '☆'}
              </button>
              <button
                onClick={() => deleteNote(note.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-tertiary)', padding: '4px', minWidth: 28, minHeight: 28 }}
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.65, fontFamily: isRTL ? 'var(--font-ar)' : 'var(--font-sans)', whiteSpace: 'pre-wrap' }}>
            {note.body}
          </p>
        </div>
      ))}
    </div>
  );
}
