import React from 'react';

const FONT_BODY = "'Tajawal', sans-serif";

export default function AdminPaginator({ page, pageSize, total, onPage, isAr }) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  const start = page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, total);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)',
      fontFamily: FONT_BODY, direction: isAr ? 'rtl' : 'ltr',
    }}>
      <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)', fontVariantNumeric: 'lining-nums' }}>
        {isAr ? `${start}–${end} من ${total}` : `${start}–${end} of ${total}`}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 0}
          style={{
            minHeight: 32, minWidth: 32, padding: '0 10px', border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 6, background: 'transparent', color: page === 0 ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.55)',
            cursor: page === 0 ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: FONT_BODY,
          }}
        >
          {isAr ? '›' : '‹'}
        </button>
        <span style={{ minHeight: 32, padding: '0 12px', display: 'flex', alignItems: 'center', fontSize: 12, color: 'rgba(0,0,0,0.45)', fontVariantNumeric: 'lining-nums' }}>
          {isAr ? `${page + 1} / ${totalPages}` : `${page + 1} / ${totalPages}`}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages - 1}
          style={{
            minHeight: 32, minWidth: 32, padding: '0 10px', border: '1px solid rgba(0,0,0,0.09)',
            borderRadius: 6, background: 'transparent', color: page >= totalPages - 1 ? 'rgba(0,0,0,0.20)' : 'rgba(0,0,0,0.55)',
            cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: FONT_BODY,
          }}
        >
          {isAr ? '‹' : '›'}
        </button>
      </div>
    </div>
  );
}
