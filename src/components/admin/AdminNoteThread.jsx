import React, { useState, useEffect, useCallback } from 'react';
import { sb } from '../../supabase';

const FONT_BODY = "'Tajawal', sans-serif";

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
  const isAr = lang === 'ar';

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
      <p style={{ margin: 0, fontSize: 10, fontWeight: 600, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY }}>
        {isAr ? 'الملاحظات' : 'Notes'}
      </p>

      {/* Add note */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={isAr ? 'أضف ملاحظة...' : 'Add a note…'}
          dir={isAr ? 'rtl' : 'ltr'}
          rows={3}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'var(--bg-subtle, #F5F2EE)',
            border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 8, padding: '10px 12px', fontSize: 13, color: 'rgba(0,0,0,0.80)',
            fontFamily: FONT_BODY,
            resize: 'vertical', outline: 'none', lineHeight: 1.6,
            transition: 'border-color 0.15s',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(0,0,0,0.22)'; }}
          onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.09)'; }}
        />
        <button
          onClick={submit}
          disabled={saving || !body.trim()}
          style={{
            alignSelf: 'flex-start', minHeight: 38, padding: '0 18px',
            background: body.trim() ? '#1a1814' : 'rgba(0,0,0,0.06)',
            color: body.trim() ? '#fff' : 'rgba(0,0,0,0.28)',
            border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: body.trim() ? 'pointer' : 'default', transition: 'all 0.15s',
            fontFamily: FONT_BODY,
          }}
        >
          {saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving…') : (isAr ? 'إضافة' : 'Add note')}
        </button>
      </div>

      {/* Note list */}
      {notes.length === 0 && (
        <p style={{ fontSize: 12, color: 'rgba(0,0,0,0.30)', margin: 0, fontFamily: FONT_BODY }}>
          {isAr ? 'لا توجد ملاحظات بعد.' : 'No notes yet.'}
        </p>
      )}
      {notes.map(note => (
        <div key={note.id} style={{
          background: note.is_pinned ? 'rgba(139,105,20,0.05)' : 'var(--bg-subtle, #F5F2EE)',
          border: note.is_pinned ? '1px solid rgba(139,105,20,0.22)' : '1px solid rgba(0,0,0,0.06)',
          borderRadius: 8, padding: '11px 13px',
          direction: isAr ? 'rtl' : 'ltr',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(0,0,0,0.55)', fontFamily: FONT_BODY }}>
              {note.author?.full_name || note.author?.email || 'Admin'}
            </span>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <span style={{ fontSize: 10, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY }}>
                {timeAgo(note.created_at, lang)}
              </span>
              <button
                onClick={() => togglePin(note)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '4px', minWidth: 28, minHeight: 28, color: note.is_pinned ? '#8B6914' : 'rgba(0,0,0,0.25)' }}
                title={note.is_pinned ? 'Unpin' : 'Pin'}
              >
                {note.is_pinned ? '★' : '☆'}
              </button>
              <button
                onClick={() => deleteNote(note.id)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'rgba(0,0,0,0.25)', padding: '4px', minWidth: 28, minHeight: 28, lineHeight: 1 }}
                title="Delete"
              >
                ×
              </button>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(0,0,0,0.75)', lineHeight: 1.65, fontFamily: FONT_BODY, whiteSpace: 'pre-wrap' }}>
            {note.body}
          </p>
        </div>
      ))}
    </div>
  );
}
