import React from 'react';

// Pick the factory's profile/logo image from ANY of the catalog's images
// (flagged candidates first, then all product images) — or none.
export default function ProfileImagePicker({ candidates = [], selected, onSelect, lang }) {
  const isAr = lang === 'ar';
  const FB = "'Tajawal', sans-serif";
  const list = Array.from(new Set((candidates || []).filter(Boolean)));

  if (!list.length) {
    return (
      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', fontFamily: FB }}>
        {isAr ? 'لا توجد صور في هذا الكتالوج.' : 'No images in this catalog.'}
      </div>
    );
  }

  return (
    <>
      <p style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.4)', fontFamily: FB, margin: '0 0 8px' }}>
        {isAr ? `اختر اللوقو من أي صورة (${list.length} صورة).` : `Pick the logo from any image (${list.length}).`}
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start', maxHeight: 340, overflowY: 'auto', padding: 2 }}>
        <button type="button" onClick={() => onSelect(null)}
          style={{
            width: 92, height: 92, borderRadius: 8, cursor: 'pointer', fontSize: 11, fontFamily: FB, flexShrink: 0,
            color: 'rgba(0,0,0,0.5)',
            border: `2px dashed ${selected == null ? '#1a1814' : 'rgba(0,0,0,0.15)'}`,
            background: selected == null ? 'rgba(0,0,0,0.03)' : 'transparent',
          }}>
          {isAr ? 'بدون صورة' : 'No image'}
        </button>
        {list.map((url) => {
          const on = selected === url;
          return (
            <button key={url} type="button" onClick={() => onSelect(on ? null : url)}
              style={{
                padding: 0, width: 92, height: 92, borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
                position: 'relative', background: '#fff', flexShrink: 0,
                border: `2px solid ${on ? '#c9863f' : 'rgba(0,0,0,0.12)'}`,
                boxShadow: on ? '0 2px 10px rgba(201,134,63,0.3)' : 'none',
              }}>
              <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              {on && (
                <span style={{ position: 'absolute', top: 3, [isAr ? 'left' : 'right']: 3, background: '#c9863f',
                  color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4, fontFamily: FB }}>
                  {isAr ? 'محدد' : 'SET'}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </>
  );
}
