import React from 'react';

// Choose which flagged image becomes the factory's profile/logo image (or none).
export default function ProfileImagePicker({ candidates = [], selected, onSelect, lang }) {
  const isAr = lang === 'ar';
  const FB = "'Tajawal', sans-serif";

  if (!candidates.length) {
    return (
      <div style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', fontFamily: FB }}>
        {isAr ? 'لم يُرصد شعار/غلاف في هذا الكتالوج.' : 'No logo/cover image was flagged in this catalog.'}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
      {candidates.map((url) => {
        const on = selected === url;
        return (
          <button key={url} type="button" onClick={() => onSelect(on ? null : url)}
            style={{
              padding: 0, width: 120, height: 120, borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
              position: 'relative', background: '#fff',
              border: `2px solid ${on ? '#c9863f' : 'rgba(0,0,0,0.12)'}`,
              boxShadow: on ? '0 2px 10px rgba(201,134,63,0.3)' : 'none',
            }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            {on && (
              <span style={{ position: 'absolute', top: 4, [isAr ? 'left' : 'right']: 4, background: '#c9863f',
                color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: FB }}>
                {isAr ? 'محدد' : 'SELECTED'}
              </span>
            )}
          </button>
        );
      })}
      <button type="button" onClick={() => onSelect(null)}
        style={{
          width: 120, height: 120, borderRadius: 10, cursor: 'pointer', fontSize: 12, fontFamily: FB,
          color: 'rgba(0,0,0,0.5)',
          border: `2px dashed ${selected == null ? '#1a1814' : 'rgba(0,0,0,0.15)'}`,
          background: selected == null ? 'rgba(0,0,0,0.03)' : 'transparent',
        }}>
        {isAr ? 'بدون صورة' : 'No image'}
      </button>
    </div>
  );
}
