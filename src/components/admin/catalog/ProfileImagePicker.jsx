import React, { useRef, useState } from 'react';

// Pick the factory's profile/logo image from ANY of the catalog's images
// (flagged candidates first, then all product images), UPLOAD one from the
// admin's device (when Gemini missed the logo), or none.
export default function ProfileImagePicker({ candidates = [], selected, onSelect, lang, onUploadFile }) {
  const isAr = lang === 'ar';
  const FB = "'Tajawal', sans-serif";
  const list = Array.from(new Set((candidates || []).filter(Boolean)));

  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [upErr, setUpErr] = useState('');

  const doUpload = async (e) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';   // allow re-picking the same file
    if (!file || !onUploadFile) return;
    if (!/^image\//.test(file.type || '') && !/\.(png|jpe?g|webp|gif)$/i.test(file.name || '')) {
      setUpErr(isAr ? 'الملف يجب أن يكون صورة.' : 'File must be an image.'); return;
    }
    setUpErr(''); setUploading(true);
    try { await onUploadFile(file); }
    catch (err) { setUpErr((isAr ? 'تعذّر الرفع: ' : 'Upload failed: ') + (err.message || '')); }
    setUploading(false);
  };

  const UploadBtn = onUploadFile ? (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={doUpload} style={{ display: 'none' }} />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
        style={{ background: 'transparent', border: '1px dashed rgba(0,0,0,0.3)', borderRadius: 8,
          padding: '8px 14px', fontSize: 12.5, cursor: uploading ? 'default' : 'pointer', fontFamily: FB,
          color: 'rgba(0,0,0,0.65)' }}>
        {uploading ? (isAr ? '… جارٍ الرفع' : '… uploading') : (isAr ? '⬆ رفع صورة من جهازك' : '⬆ Upload from device')}
      </button>
    </>
  ) : null;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', margin: '0 0 10px' }}>
        <p style={{ fontSize: 11.5, color: 'rgba(0,0,0,0.4)', fontFamily: FB, margin: 0 }}>
          {list.length
            ? (isAr ? `اختر اللوقو من أي صورة (${list.length} صورة) أو ارفع صورة من جهازك.` : `Pick the logo from any image (${list.length}) or upload your own.`)
            : (isAr ? 'لا توجد صور في هذا الكتالوج — ارفع صورة اللوقو من جهازك.' : 'No images in this catalog — upload a logo from your device.')}
        </p>
        {UploadBtn}
      </div>
      {upErr && (
        <p style={{ fontSize: 11.5, color: '#c0392b', fontFamily: FB, margin: '0 0 8px' }}>{upErr}</p>
      )}

      {(list.length > 0 || onUploadFile) && (
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
      )}
    </>
  );
}
