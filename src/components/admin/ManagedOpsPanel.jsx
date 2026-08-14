import React, { useEffect, useState } from 'react';
import { MANAGED_STAGES, STATUS_FOR_STAGE, stageIndexOf } from '../../lib/managedStages';
import {
  createManagedOffer, fetchManagedEvents, addManagedEvent, setManagedStage, uploadManagedMedia,
} from '../../lib/managedOrder';

// Admin operations for a managed order — the pipeline Maabar drives: advance the 7
// stages, present the single curated (anonymized) offer, upload the pre-shipping
// video, and post buyer-visible updates. Mirrors what the trader sees in the tracker.
const FB = "'Tajawal', sans-serif";
const inp = { width: '100%', padding: '8px 10px', border: '1px solid rgba(0,0,0,0.14)', borderRadius: 8, fontSize: 13, fontFamily: FB, boxSizing: 'border-box', background: '#fff' };
const lbl = { fontSize: 11, color: 'rgba(0,0,0,0.5)', fontFamily: FB, display: 'block', marginBottom: 3 };
const btn = { padding: '9px 16px', borderRadius: 8, border: 'none', background: '#1a1814', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FB };
const card = { border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 16, marginBottom: 14, background: 'var(--bg-raised,#fff)' };
const h = { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: 'rgba(0,0,0,0.75)', fontFamily: FB };

export default function ManagedOpsPanel({ requestId, managedStatus, isAr = true, onChanged }) {
  const [events, setEvents] = useState([]);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');

  const reload = async () => setEvents(await fetchManagedEvents(requestId));
  useEffect(() => { reload(); }, [requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentIdx = stageIndexOf(managedStatus);

  // ── Advance stage ──
  const advance = async (stg) => {
    setBusy('stage'); setMsg('');
    try {
      await setManagedStage(requestId, STATUS_FOR_STAGE[stg.key]);
      await addManagedEvent({ requestId, stage: stg.key, kind: 'status', title: isAr ? stg.ar : stg.en });
      await reload(); onChanged?.();
    } catch (e) { setMsg(e.message); }
    setBusy('');
  };

  // ── Present offer ──
  const [rows, setRows] = useState([{ desc: '', qty: '', unit_price: '' }]);
  const [currency, setCurrency] = useState('USD');
  const [fp, setFp] = useState({ city: '', years: '', rating: '', capacity: '', export_markets: '', moq: '', lead_time: '', certs: '' });
  const [offerNotes, setOfferNotes] = useState('');
  const setRow = (i, k, v) => setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [k]: v } : row)));
  const setF = (k, v) => setFp((p) => ({ ...p, [k]: v }));

  const presentOffer = async () => {
    setBusy('offer'); setMsg('');
    try {
      const lineItems = rows.filter((r) => r.desc || r.qty).map((r) => ({
        desc: r.desc || '', qty: Number(r.qty) || 0, unit_price: Number(r.unit_price) || 0,
        amount: (Number(r.qty) || 0) * (Number(r.unit_price) || 0),
      }));
      const factoryProfile = {
        city: fp.city || undefined, years: fp.years ? Number(fp.years) : undefined,
        rating: fp.rating ? Number(fp.rating) : undefined, capacity: fp.capacity || undefined,
        export_markets: fp.export_markets || undefined, moq: fp.moq ? Number(fp.moq) : undefined,
        lead_time: fp.lead_time || undefined,
        certifications: fp.certs ? fp.certs.split(/[،,]/).map((c) => c.trim()).filter(Boolean) : undefined,
      };
      await createManagedOffer({ requestId, lineItems, currency, factoryProfile, notes: offerNotes || null });
      setMsg(isAr ? '✓ تم تقديم العرض للتاجر.' : '✓ Offer presented to the trader.');
      onChanged?.();
    } catch (e) { setMsg(e.message); }
    setBusy('');
  };

  // ── Pre-shipping video ──
  const onVideo = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy('video'); setMsg('');
    try {
      const url = await uploadManagedMedia(requestId, file);
      await addManagedEvent({ requestId, stage: 'video', kind: 'video', title: isAr ? 'فيديو قبل الشحن' : 'Pre-shipping video', mediaUrl: url });
      await setManagedStage(requestId, STATUS_FOR_STAGE.video);
      await reload(); onChanged?.();
      setMsg(isAr ? '✓ رُفع الفيديو وظهر للتاجر.' : '✓ Video uploaded and shown to the trader.');
    } catch (err) { setMsg(err.message); }
    setBusy(''); e.target.value = '';
  };

  // ── Add update ──
  const [upStage, setUpStage] = useState('production');
  const [upTitle, setUpTitle] = useState('');
  const [upBody, setUpBody] = useState('');
  const addUpdate = async () => {
    if (!upTitle.trim() && !upBody.trim()) return;
    setBusy('update'); setMsg('');
    try {
      await addManagedEvent({ requestId, stage: upStage, kind: 'note', title: upTitle.trim() || null, body: upBody.trim() || null });
      setUpTitle(''); setUpBody(''); await reload(); onChanged?.();
    } catch (e) { setMsg(e.message); }
    setBusy('');
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'}>
      {msg && <div style={{ marginBottom: 12, fontSize: 12.5, color: msg.startsWith('✓') ? '#2d7a4f' : '#c0392b', fontFamily: FB }}>{msg}</div>}

      {/* Stage advancer */}
      <div style={card}>
        <h3 style={h}>{isAr ? 'مرحلة الطلب' : 'Order stage'}</h3>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MANAGED_STAGES.map((stg, i) => (
            <button key={stg.key} onClick={() => advance(stg)} disabled={busy === 'stage'}
              style={{ padding: '7px 11px', borderRadius: 8, fontSize: 12, fontFamily: FB, cursor: 'pointer',
                border: i === currentIdx ? 'none' : '1px solid rgba(0,0,0,0.15)',
                background: i === currentIdx ? '#1a1814' : i < currentIdx ? 'rgba(47,93,58,0.1)' : 'transparent',
                color: i === currentIdx ? '#fff' : i < currentIdx ? '#2d7a4f' : 'rgba(0,0,0,0.6)' }}>
              {i < currentIdx ? '✓ ' : ''}{isAr ? stg.ar : stg.en}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'rgba(0,0,0,0.4)', fontFamily: FB, margin: '8px 0 0' }}>
          {isAr ? 'اضغط مرحلة لتقديم الطلب إليها — يظهر للتاجر فورًا في المتتبّع.' : 'Tap a stage to move the order there — the trader sees it instantly.'}
        </p>
      </div>

      {/* Present offer */}
      <div style={card}>
        <h3 style={h}>{isAr ? 'تقديم العرض المنسّق' : 'Present curated offer'}</h3>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            <input style={{ ...inp, flex: 2 }} placeholder={isAr ? 'الوصف' : 'Item'} value={r.desc} onChange={(e) => setRow(i, 'desc', e.target.value)} />
            <input style={{ ...inp, flex: 1 }} type="number" placeholder={isAr ? 'الكمية' : 'Qty'} value={r.qty} onChange={(e) => setRow(i, 'qty', e.target.value)} />
            <input style={{ ...inp, flex: 1 }} type="number" placeholder={isAr ? 'سعر (USD)' : 'Unit'} value={r.unit_price} onChange={(e) => setRow(i, 'unit_price', e.target.value)} />
          </div>
        ))}
        <button onClick={() => setRows((r) => [...r, { desc: '', qty: '', unit_price: '' }])}
          style={{ background: 'none', border: '1px dashed rgba(0,0,0,0.2)', borderRadius: 8, padding: '5px 11px', fontSize: 12, cursor: 'pointer', fontFamily: FB, marginBottom: 12 }}>{isAr ? '+ سطر' : '+ Row'}</button>

        <div style={{ marginBottom: 10 }}>
          <label style={lbl}>{isAr ? 'العملة' : 'Currency'}</label>
          <select style={{ ...inp, maxWidth: 120 }} value={currency} onChange={(e) => setCurrency(e.target.value)}><option>USD</option><option>SAR</option><option>CNY</option></select>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#9A7B4F', fontFamily: FB, margin: '4px 0 8px' }}>{isAr ? 'بروفايل المصنع (مجهول — بلا اسم)' : 'Factory profile (anonymized — no name)'}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
          <div><label style={lbl}>{isAr ? 'الموقع' : 'Location'}</label><input style={inp} value={fp.city} onChange={(e) => setF('city', e.target.value)} /></div>
          <div><label style={lbl}>{isAr ? 'الخبرة (سنة)' : 'Years'}</label><input style={inp} type="number" value={fp.years} onChange={(e) => setF('years', e.target.value)} /></div>
          <div><label style={lbl}>{isAr ? 'التقييم' : 'Rating'}</label><input style={inp} type="number" step="0.1" value={fp.rating} onChange={(e) => setF('rating', e.target.value)} /></div>
          <div><label style={lbl}>{isAr ? 'الطاقة الإنتاجية' : 'Capacity'}</label><input style={inp} value={fp.capacity} onChange={(e) => setF('capacity', e.target.value)} /></div>
          <div><label style={lbl}>{isAr ? 'أسواق التصدير' : 'Export markets'}</label><input style={inp} value={fp.export_markets} onChange={(e) => setF('export_markets', e.target.value)} /></div>
          <div><label style={lbl}>{isAr ? 'أقل كمية' : 'MOQ'}</label><input style={inp} type="number" value={fp.moq} onChange={(e) => setF('moq', e.target.value)} /></div>
          <div><label style={lbl}>{isAr ? 'مدة التسليم المتوقعة' : 'Est. delivery'}</label><input style={inp} value={fp.lead_time} onChange={(e) => setF('lead_time', e.target.value)} /></div>
          <div><label style={lbl}>{isAr ? 'شهادات الجودة (فاصلة)' : 'Quality certs (comma)'}</label><input style={inp} value={fp.certs} onChange={(e) => setF('certs', e.target.value)} placeholder="ISO 9001, BSCI" /></div>
        </div>
        <div style={{ marginBottom: 12 }}><label style={lbl}>{isAr ? 'ملاحظات العرض' : 'Offer notes'}</label><textarea style={{ ...inp, resize: 'vertical' }} rows={2} value={offerNotes} onChange={(e) => setOfferNotes(e.target.value)} /></div>
        <button style={btn} onClick={presentOffer} disabled={busy === 'offer'}>{busy === 'offer' ? '…' : (isAr ? 'قدّم العرض للتاجر' : 'Present offer')}</button>
      </div>

      {/* Video + updates */}
      <div style={card}>
        <h3 style={h}>{isAr ? 'فيديو قبل الشحن + تحديثات' : 'Pre-shipping video + updates'}</h3>
        <label style={lbl}>{isAr ? 'رفع فيديو (يظهر للتاجر ويقدّم المرحلة)' : 'Upload video (shows to the trader + advances the stage)'}</label>
        <input type="file" accept="video/*" onChange={onVideo} disabled={busy === 'video'} style={{ fontSize: 12, marginBottom: 14, display: 'block' }} />

        <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
          <select style={{ ...inp, maxWidth: 150 }} value={upStage} onChange={(e) => setUpStage(e.target.value)}>
            {MANAGED_STAGES.map((s) => <option key={s.key} value={s.key}>{isAr ? s.ar : s.en}</option>)}
          </select>
          <input style={{ ...inp, flex: 1 }} placeholder={isAr ? 'عنوان التحديث' : 'Update title'} value={upTitle} onChange={(e) => setUpTitle(e.target.value)} />
        </div>
        <textarea style={{ ...inp, resize: 'vertical', marginBottom: 8 }} rows={2} placeholder={isAr ? 'التفاصيل (تظهر للتاجر)' : 'Detail (shown to the trader)'} value={upBody} onChange={(e) => setUpBody(e.target.value)} />
        <button style={btn} onClick={addUpdate} disabled={busy === 'update'}>{isAr ? 'أضف تحديثًا' : 'Add update'}</button>
      </div>

      {/* Event log */}
      {events.length > 0 && (
        <div style={card}>
          <h3 style={h}>{isAr ? 'سجل الأحداث' : 'Event log'}</h3>
          {events.map((e) => (
            <div key={e.id} style={{ fontSize: 12, fontFamily: FB, color: 'rgba(0,0,0,0.65)', padding: '5px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ color: '#9A7B4F' }}>{e.stage || '—'}</span> · {e.kind === 'video' ? '🎥 ' : ''}{e.title || e.body}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
