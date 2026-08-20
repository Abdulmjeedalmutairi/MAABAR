import React, { useEffect, useState } from 'react';

/**
 * Professional category navigation for /products.
 *  • A compact, scrollable row of TEXT tabs (short labels) with a bronze active
 *    underline — clean, editorial, no emoji.
 *  • A "كل الفئات" button opens a mega-panel of the full category list, each with
 *    a thin monochrome line-icon + long label + description.
 * Categories are passed in already localized + already filtered to what has data.
 */

// Thin line icons (stroke = currentColor). Keyed by the display category's `icon`.
const ICONS = {
  grid:     '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  bolt:     '<path d="M13 2L4 14h6l-1 8 9-12h-6z"/>',
  car:      '<path d="M5 13l1.6-4.5A2 2 0 018.5 7h7a2 2 0 011.9 1.5L19 13"/><path d="M4 13h16v4h-2M6 17H4v-4M8 17h8"/><circle cx="7.5" cy="17" r="1.4"/><circle cx="16.5" cy="17" r="1.4"/>',
  gear:     '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  building: '<path d="M4 21V5a1 1 0 011-1h6a1 1 0 011 1v16"/><path d="M12 21v-9a1 1 0 011-1h6a1 1 0 011 1v9"/><path d="M3 21h18M7 8h2M7 12h2M16 15h1"/>',
  sofa:     '<path d="M5 11V8a2 2 0 012-2h10a2 2 0 012 2v3"/><path d="M3 12a2 2 0 012 2v3h14v-3a2 2 0 012-2v4a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
  shirt:    '<path d="M8 3l4 2 4-2 4.5 3.2-2.5 2.8V20a1 1 0 01-1 1H7a1 1 0 01-1-1V9L3.5 6.2z"/>',
  beauty:   '<path d="M10 3h4M11 3v3M13 3v3M8.5 9.5A3.5 3.5 0 0112 7a3.5 3.5 0 013.5 2.5L17 20a1 1 0 01-1 1H8a1 1 0 01-1-1z"/>',
  toys:     '<rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/><path d="M8.5 13V9.5a2 2 0 012-2h3a2 2 0 012 2V13"/>',
  medical:  '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 012-2h4a2 2 0 012 2v2M12 12v4M10 14h4"/>',
  food:     '<path d="M6 3v6a2 2 0 002 2v9M8 3v6M17 3c-1.5 0-2.5 2-2.5 4.5S16 11 17 11v10"/>',
  sports:   '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  more:     '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
};

function LineIcon({ name, size = 22 }) {
  return (
    <svg className="fx-cat-ic" width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: ICONS[name] || ICONS.grid }} />
  );
}

const L = {
  ar: { all: 'كل الفئات', title: 'كل الفئات', close: 'إغلاق' },
  en: { all: 'All categories', title: 'All categories', close: 'Close' },
  zh: { all: '全部类别', title: '全部类别', close: '关闭' },
};

export default function CategoryFilterBar({ chips, activeKey, lang = 'ar', onSelect }) {
  const isAr = lang === 'ar';
  const t = L[lang] || L.ar;
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const pick = (key) => { onSelect(key); setOpen(false); };

  return (
    <div className={`fx-catnav${isAr ? ' ar' : ''}`}>
      <div className="fx-tabs" role="tablist">
        {chips.map((ch) => (
          <button key={ch.key} type="button" role="tab" aria-selected={activeKey === ch.key}
            className={`fx-tab${activeKey === ch.key ? ' on' : ''}`}
            onClick={() => onSelect(ch.key)}>
            {ch.short}
          </button>
        ))}
      </div>
      <button type="button" className="fx-allbtn" onClick={() => setOpen(true)}>
        <LineIcon name="grid" size={15} />
        <span>{t.all}</span>
      </button>

      {open && (
        <div className="fx-panel-ov" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="fx-panel" role="dialog" aria-label={t.title} dir={isAr ? 'rtl' : 'ltr'}>
            <div className="fx-panel-head">
              <h3>{t.title}</h3>
              <button type="button" className="fx-panel-x" aria-label={t.close} onClick={() => setOpen(false)}>✕</button>
            </div>
            <div className="fx-catcards">
              {chips.map((ch) => (
                <button key={ch.key} type="button"
                  className={`fx-catcard${activeKey === ch.key ? ' on' : ''}`}
                  onClick={() => pick(ch.key)}>
                  <LineIcon name={ch.icon} size={22} />
                  <span className="fx-catcard-t">
                    <span className="fx-catcard-n">{ch.label}</span>
                    <span className="fx-catcard-d">{ch.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
