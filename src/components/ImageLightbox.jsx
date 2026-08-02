import React, { useState, useEffect, useRef, useCallback } from 'react';

// Amazon-style fullscreen image viewer: navigate (arrows / keyboard / swipe),
// zoom (click / wheel) + pan (drag), thumbnail strip, counter. Shows the image
// at full resolution. Mount it conditionally; it fills the screen while open.
// Optional per-image `captions` (string[]) and `actions`
// ([{ label, onClick(idx), primary? }]) show a caption + action bar — e.g. a
// product name + "Request a quote" while browsing a factory's product photos.
export default function ImageLightbox({ images = [], start = 0, onClose, alt = '', captions = null, actions = null }) {
  const list = (Array.isArray(images) ? images : []).filter(Boolean);
  const n = list.length;
  const [idx, setIdx] = useState(Math.min(Math.max(start, 0), Math.max(0, n - 1)));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  const touchX = useRef(null);

  const reset = () => { setZoom(1); setPan({ x: 0, y: 0 }); };
  const go = useCallback((d) => { reset(); setIdx((i) => (i + d + n) % n); }, [n]);
  const jump = (i) => { reset(); setIdx(i); };
  const close = useCallback(() => onClose && onClose(), [onClose]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, close]);

  if (!n) return null;

  const caption = Array.isArray(captions) ? captions[idx] : null;
  const acts = Array.isArray(actions) ? actions : [];

  const onImgClick = (e) => {
    e.stopPropagation();
    if (zoom > 1) { reset(); return; }
    const r = e.currentTarget.getBoundingClientRect();
    const ox = (e.clientX - r.left) / r.width - 0.5;
    const oy = (e.clientY - r.top) / r.height - 0.5;
    const z = 2.5;
    setZoom(z);
    setPan({ x: -ox * r.width * (z - 1), y: -oy * r.height * (z - 1) });
  };
  const onWheel = (e) => { setZoom((z) => Math.min(4, Math.max(1, +(z - Math.sign(e.deltaY) * 0.3).toFixed(2)))); };
  const onMouseDown = (e) => { if (zoom <= 1) return; e.preventDefault(); drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }; };
  const onMouseMove = (e) => { if (!drag.current) return; setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) }); };
  const onMouseUp = () => { drag.current = null; };
  const onTouchStart = (e) => { touchX.current = e.touches[0] ? e.touches[0].clientX : null; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const end = e.changedTouches[0] ? e.changedTouches[0].clientX : touchX.current;
    if (zoom <= 1 && Math.abs(end - touchX.current) > 50) go(end - touchX.current < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <div className="ilb-overlay" onClick={close} onMouseMove={onMouseMove} onMouseUp={onMouseUp} role="dialog" aria-modal="true">
      <button className="ilb-close" onClick={(e) => { e.stopPropagation(); close(); }} aria-label="Close">×</button>
      {n > 1 && <span className="ilb-counter">{idx + 1} / {n}</span>}
      {n > 1 && <button className="ilb-nav prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous">‹</button>}
      {n > 1 && <button className="ilb-nav next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next">›</button>}

      <div className="ilb-stage" onClick={(e) => e.stopPropagation()} onWheel={onWheel}>
        <img
          className="ilb-img"
          src={list[idx]}
          alt={alt}
          draggable={false}
          onClick={onImgClick}
          onMouseDown={onMouseDown}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, cursor: zoom > 1 ? 'grab' : 'zoom-in' }}
        />
      </div>

      {(caption || acts.length > 0) && (
        <div className="ilb-bar" style={{ bottom: n > 1 ? 84 : 22 }} onClick={(e) => e.stopPropagation()}>
          {caption && <span className="ilb-caption">{caption}</span>}
          {acts.map((a, i) => (
            <button key={i} type="button" className={`ilb-action${a.primary ? ' primary' : ''}`} onClick={() => a.onClick(idx)}>{a.label}</button>
          ))}
        </div>
      )}

      {n > 1 && (
        <div className="ilb-thumbs" onClick={(e) => e.stopPropagation()}>
          {list.map((u, i) => (
            <button key={i} type="button" className={`ilb-thumb${i === idx ? ' on' : ''}`} onClick={() => jump(i)} aria-label={`Image ${i + 1}`}>
              <img src={u} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
