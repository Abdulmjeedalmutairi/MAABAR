import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import usePageTitle from '../hooks/usePageTitle';
import { fetchManagedTracker, fetchAccountManager } from '../lib/managedOrder';
import { MANAGED_STAGES, stageIndexOf, isCancelled } from '../lib/managedStages';
import { waLink } from '../lib/maabarContact';
import { toSAR } from '../lib/currency';
import { startTelrPayment } from '../lib/telrPay';

// Trader's managed-order tracker (the approved premium design). Shows the 7-stage
// journey, the assigned account manager (+ WhatsApp), the curated offer at the
// offer stage (approve → deposit / negotiate → WhatsApp), the pre-shipping video,
// and the buyer-visible event feed. Comms happen on WhatsApp; the app is tracking
// + offer + payment.
const money = (n, c) => `${(Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c || 'SAR'}`;
const LOGO = '/email-logo.png';

const CSS = `
.mo-wrap{ --paper:#F7F4EE; --ink:#141210; --ink-soft:#3A342C; --muted:#6B655B; --faint:#8F887C; --hair:#DcD4C4; --hair-strong:#C8BEA8; --header:#0E0D0C; --bronze:#9A7B4F; --done:#2F5D3A;
  --serif:'Cormorant Garamond','Iowan Old Style',Georgia,serif; --num:'Palatino Linotype',Georgia,serif; background:var(--paper); border-radius:6px; overflow:hidden; box-shadow:0 30px 70px -30px rgba(20,18,16,0.4); }
.mo-wrap *{ box-sizing:border-box; }
.mo-head{ position:relative; background:var(--header); color:#F3EFE7; padding:26px 30px 22px; border-bottom:2px solid var(--bronze); overflow:hidden; }
.mo-head::before{ content:''; position:absolute; inset:0; background:radial-gradient(120% 150% at 50% -40%, rgba(255,255,255,0.12), transparent 60%); }
.mo-hrow{ position:relative; display:flex; justify-content:space-between; align-items:flex-start; gap:18px; flex-wrap:wrap; }
.mo-logo{ height:38px; filter:brightness(0) invert(1); }
.mo-kick{ font-size:9.5px; letter-spacing:0.3em; text-transform:uppercase; color:#B69669; text-align:end; }
.mo-ref{ font-family:var(--num); font-size:15px; margin-top:5px; text-align:end; letter-spacing:0.04em; }
.mo-pill{ display:inline-block; margin-top:9px; font-size:11px; font-weight:700; padding:5px 12px; border-radius:999px; background:rgba(154,123,79,0.22); color:#EbDcC2; border:1px solid rgba(182,150,105,0.5); }
.mo-title{ position:relative; margin-top:15px; font-family:var(--serif); font-size:26px; font-weight:600; }
.mo-mgr{ display:flex; align-items:center; gap:12px; padding:14px 30px; border-bottom:1px solid var(--hair); flex-wrap:wrap; }
.mo-av{ width:42px; height:42px; border-radius:50%; background:linear-gradient(135deg,#2b2b2b,#4a4640); color:#EbDcC2; display:flex; align-items:center; justify-content:center; font-weight:700; }
.mo-mk{ font-size:9.5px; letter-spacing:0.14em; text-transform:uppercase; color:var(--bronze); }
.mo-mn{ font-size:14px; font-weight:600; color:var(--ink); }
.mo-ms{ font-size:11.5px; color:var(--muted); }
.mo-wa{ margin-inline-start:auto; display:inline-flex; align-items:center; gap:7px; background:#25D366; color:#fff; border-radius:9px; padding:9px 15px; font-size:12.5px; font-weight:600; text-decoration:none; }
.mo-body{ padding:24px 30px 30px; }
.mo-sl{ font-size:10px; font-weight:700; letter-spacing:0.2em; text-transform:uppercase; color:var(--bronze); margin-bottom:18px; }
.mo-stage{ position:relative; padding-inline-start:38px; padding-bottom:24px; }
.mo-stage:last-child{ padding-bottom:0; }
.mo-stage::before{ content:''; position:absolute; inset-inline-start:12px; top:24px; bottom:-2px; width:2px; background:var(--hair); }
.mo-stage:last-child::before{ display:none; }
.mo-stage.done::before{ background:var(--done); }
.mo-node{ position:absolute; inset-inline-start:2px; top:2px; width:22px; height:22px; border-radius:50%; background:var(--paper); border:2px solid var(--hair-strong); display:flex; align-items:center; justify-content:center; font-size:12px; color:var(--faint); }
.mo-stage.done .mo-node{ background:var(--done); border-color:var(--done); color:#fff; }
.mo-stage.active .mo-node{ border-color:var(--bronze); box-shadow:0 0 0 4px rgba(154,123,79,0.15); }
.mo-stage.active .mo-node::after{ content:''; width:8px; height:8px; border-radius:50%; background:var(--bronze); }
.mo-st{ font-size:15px; font-weight:600; color:var(--ink); }
.mo-stage.upcoming .mo-st{ color:var(--faint); font-weight:500; }
.mo-ev{ font-size:12.5px; color:var(--muted); margin-top:5px; line-height:1.55; }
.mo-ev b{ color:var(--ink-soft); font-weight:600; }
.mo-video{ margin-top:10px; border:1px solid var(--hair); border-radius:10px; overflow:hidden; background:#000; max-width:360px; }
.mo-video video{ width:100%; display:block; }
.mo-offer{ margin-top:12px; border:1px solid var(--hair-strong); border-radius:12px; overflow:hidden; background:#fff; max-width:420px; }
.mo-otop{ padding:11px 15px; background:rgba(154,123,79,0.07); border-bottom:1px solid var(--hair); display:flex; justify-content:space-between; align-items:center; }
.mo-otop .k{ font-size:10px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; color:var(--bronze); }
.mo-ofac{ font-size:11px; color:var(--ink-soft); }
.mo-orow{ display:flex; justify-content:space-between; padding:13px 15px; align-items:center; }
.mo-ok{ font-size:12px; color:var(--muted); }
.mo-ov{ font-family:var(--num); font-size:20px; font-weight:600; }
.mo-ov small{ font-size:11px; color:var(--muted); }
.mo-oref{ font-size:11px; color:var(--muted); padding:0 15px 12px; text-align:end; }
.mo-oact{ display:flex; gap:9px; padding:13px 15px; border-top:1px solid var(--hair); flex-wrap:wrap; }
.mo-approve{ flex:1; min-width:150px; background:var(--ink); color:var(--paper); border:none; border-radius:9px; padding:12px; font-size:14px; font-weight:600; cursor:pointer; }
.mo-approve:disabled{ opacity:0.55; cursor:default; }
.mo-neg{ background:none; border:1px solid var(--hair-strong); border-radius:9px; padding:12px 16px; font-size:13px; color:var(--ink); text-decoration:none; display:inline-flex; align-items:center; }
.mo-assure{ display:flex; gap:7px; padding:10px 15px; background:rgba(47,93,58,0.08); border-top:1px solid rgba(47,93,58,0.15); font-size:11.5px; color:#2c5236; }
.mo-fp{ display:grid; grid-template-columns:1fr 1fr; border-bottom:1px solid var(--hair); }
.mo-fpi{ padding:10px 15px; border-inline-end:1px solid var(--hair); border-bottom:1px solid var(--hair); }
.mo-fpi:nth-child(2n){ border-inline-end:none; }
.mo-fpi .l{ font-size:9px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--faint); }
.mo-fpi .v{ font-size:12.5px; color:var(--ink); margin-top:2px; }
.mo-certblock{ padding:10px 15px; border-bottom:1px solid var(--hair); }
.mo-certlabel{ font-size:9px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:var(--faint); margin-bottom:6px; }
.mo-certs-in{ display:flex; flex-wrap:wrap; gap:5px; }
.mo-onote{ padding:10px 15px; border-bottom:1px solid var(--hair); font-size:12.5px; color:var(--muted); line-height:1.55; }
.mo-cert{ font-size:10.5px; color:var(--ink-soft); background:rgba(154,123,79,0.08); border:1px solid rgba(154,123,79,0.25); border-radius:5px; padding:2px 8px; }
.mo-photos{ display:flex; gap:6px; padding:10px 15px; overflow-x:auto; border-bottom:1px solid var(--hair); }
.mo-photos img{ width:64px; height:64px; object-fit:cover; border-radius:6px; border:1px solid var(--hair); flex-shrink:0; }
`;

const WA = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.8 14.01c-.24.68-1.42 1.3-1.95 1.34-.5.04-.5.4-3.15-.66-2.67-1.05-4.35-3.76-4.48-3.94-.13-.18-1.07-1.42-1.07-2.71 0-1.29.68-1.92.92-2.19.24-.26.52-.33.7-.33.17 0 .35 0 .5.01.16.01.38-.06.59.45.24.58.81 2 .88 2.15.07.15.12.32.02.51-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.56.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.8.85.27.13.44.2.5.31.07.11.07.63-.17 1.31z" /></svg>
);

export default function ManagedOrder({ lang = 'ar' }) {
  const isAr = lang === 'ar';
  const { id } = useParams();
  const nav = useNavigate();
  usePageTitle(isAr ? 'متابعة الطلب المُدار' : 'Managed order', lang);

  const [data, setData] = useState(null);
  const [mgr, setMgr] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  const load = async () => {
    const d = await fetchManagedTracker(id);
    setData(d);
    if (d.request?.assigned_to) setMgr(await fetchAccountManager(d.request.assigned_to));
    setLoading(false);
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const t = {
    kicker: isAr ? 'الطلب المُدار' : 'Managed order', managing: isAr ? 'قيد المتابعة · مَعبر تدير كل خطوة' : 'In progress · Maabar manages every step',
    cancelled: isAr ? 'أُلغي الطلب' : 'Cancelled',
    mgrK: isAr ? 'مدير حسابك' : 'Your account manager', mgrS: isAr ? 'يتابع طلبك خطوة بخطوة' : 'Follows your order step by step',
    mgrDefault: isAr ? 'فريق مَعبر' : 'Maabar team', wa: isAr ? 'واتساب' : 'WhatsApp',
    journey: isAr ? 'رحلة طلبك' : 'Your order journey',
    offerK: isAr ? 'عرض مَعبر المنسّق' : "Maabar's curated offer", fac: isAr ? 'مصنع مُعتمد من مَعبر' : 'A Maabar-vetted factory',
    total: isAr ? 'الإجمالي المستحق' : 'Total due', approve: isAr ? 'وافق وادفع العربون' : 'Approve & pay deposit', payFull: isAr ? 'ادفع كامل' : 'Pay in full',
    negotiate: isAr ? 'أريد التفاوض' : 'Negotiate', assure: isAr ? 'لا نبدأ الإنتاج إلا بموافقتك — أموالك محفوظة لدى مَعبر حتى تستلم طلبك.' : "We only start once you approve — your funds are held by Maabar until you receive your order.",
    loading: isAr ? 'جارٍ التحميل…' : 'Loading…', notFound: isAr ? 'الطلب غير موجود.' : 'Order not found.',
    back: isAr ? '→ لوحتي' : '← My dashboard',
  };

  if (loading) return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{t.loading}</div>;
  if (!data?.request) return <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', color: 'var(--text-secondary)' }}>{t.notFound}</div>;

  const r = data.request;
  const offer = data.offer;
  const events = data.events || [];
  const title = (isAr ? r.title_ar : r.title_en) || r.title_ar || r.title_en || '';
  const currentIdx = stageIndexOf(r.managed_status);
  const cancelled = isCancelled(r.managed_status);
  const eventsByStage = events.reduce((acc, e) => { (acc[e.stage || 'received'] = acc[e.stage || 'received'] || []).push(e); return acc; }, {});
  const mgrName = mgr?.full_name || t.mgrDefault;

  // Offer money (buyer sees SAR + USD ref, at the 3.75 peg).
  const invCur = String(offer?.currency || 'SAR').toUpperCase();
  const isUSD = invCur === 'USD';
  const offerSar = offer ? toSAR(offer.total, invCur) : 0;
  const offerRef = offer && isUSD ? `≈ ${money(Number(offer.total), invCur)}` : '';
  const fp = offer?.factory_profile;   // anonymized factory profile (no name/contact)

  const pay = async (stage) => {
    if (!offer) return;
    setPaying(true);
    try { await startTelrPayment(offer.id, stage, 'invoice'); }
    catch (e) { alert(e.message || 'Error'); setPaying(false); }
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '22px 14px 60px' }} dir={isAr ? 'rtl' : 'ltr'}>
      <button onClick={() => nav('/dashboard?tab=requests')} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 12 }}>{t.back}</button>
      <div className="mo-wrap">
        <style>{CSS}</style>
        <div className="mo-head">
          <div className="mo-hrow">
            <img className="mo-logo" src={LOGO} alt="MAABAR" />
            <div>
              <div className="mo-kick">{t.kicker}</div>
              <div className="mo-ref">{r.request_ref || r.id?.slice(0, 8)}</div>
              <div className="mo-pill">{cancelled ? t.cancelled : t.managing}</div>
            </div>
          </div>
          <div className="mo-title">{title}</div>
        </div>

        <div className="mo-mgr">
          <div className="mo-av">{(mgrName || 'م').trim().charAt(0)}</div>
          <div>
            <div className="mo-mk">{t.mgrK}</div>
            <div className="mo-mn">{mgrName}</div>
            <div className="mo-ms">{t.mgrS}</div>
          </div>
          <a className="mo-wa" href={waLink(`استفسار عن طلبي المُدار رقم ${r.request_ref || r.id}`)} target="_blank" rel="noopener noreferrer">{WA} {t.wa}</a>
        </div>

        <div className="mo-body">
          <div className="mo-sl">{t.journey}</div>
          {MANAGED_STAGES.map((stg, i) => {
            const cls = i < currentIdx ? 'done' : i === currentIdx ? 'active' : 'upcoming';
            const evs = eventsByStage[stg.key] || [];
            const video = evs.find((e) => e.kind === 'video' && e.media_url);
            return (
              <div key={stg.key} className={`mo-stage ${cls}`}>
                <div className="mo-node">{i < currentIdx ? '✓' : ''}</div>
                <div className="mo-st">{isAr ? stg.ar : stg.en}</div>
                {evs.filter((e) => e.kind !== 'video').map((e) => (
                  <div key={e.id} className="mo-ev">{e.title ? <b>{e.title}{e.body ? ' — ' : ''}</b> : null}{e.body}</div>
                ))}
                {video && (
                  <div className="mo-video"><video src={video.media_url} controls playsInline /></div>
                )}
                {/* Curated offer at the offer stage */}
                {stg.key === 'offer' && offer && offer.status !== 'paid' && (
                  <div className="mo-offer">
                    <div className="mo-otop"><span className="k">{t.offerK}</span><span className="mo-ofac">{t.fac}</span></div>
                    {fp && (
                      <>
                        <div className="mo-fp">
                          {fp.city && <div className="mo-fpi"><div className="l">{isAr ? 'الموقع' : 'Location'}</div><div className="v">{fp.city}</div></div>}
                          {fp.years && <div className="mo-fpi"><div className="l">{isAr ? 'الخبرة' : 'Experience'}</div><div className="v">{fp.years} {isAr ? 'سنة' : 'yrs'}</div></div>}
                          {fp.rating && <div className="mo-fpi"><div className="l">{isAr ? 'التقييم' : 'Rating'}</div><div className="v">★ {fp.rating}</div></div>}
                          {fp.capacity && <div className="mo-fpi"><div className="l">{isAr ? 'الطاقة الإنتاجية' : 'Capacity'}</div><div className="v">{fp.capacity}</div></div>}
                          {fp.export_markets && <div className="mo-fpi"><div className="l">{isAr ? 'أسواق التصدير' : 'Export markets'}</div><div className="v">{fp.export_markets}</div></div>}
                          {fp.moq && <div className="mo-fpi"><div className="l">{isAr ? 'أقل كمية' : 'MOQ'}</div><div className="v">{fp.moq}</div></div>}
                          {fp.lead_time && <div className="mo-fpi"><div className="l">{isAr ? 'مدة التسليم المتوقعة' : 'Est. delivery'}</div><div className="v">{fp.lead_time}</div></div>}
                        </div>
                        {Array.isArray(fp.certifications) && fp.certifications.length > 0 && (
                          <div className="mo-certblock">
                            <div className="mo-certlabel">{isAr ? 'شهادات الجودة' : 'Quality certifications'}</div>
                            <div className="mo-certs-in">{fp.certifications.map((c, i) => <span key={i} className="mo-cert">{c}</span>)}</div>
                          </div>
                        )}
                        {Array.isArray(fp.photos) && fp.photos.length > 0 && (
                          <div className="mo-photos">{fp.photos.map((p, i) => <img key={i} src={p} alt="" />)}</div>
                        )}
                        {offer.notes && (
                          <div className="mo-onote"><div className="mo-certlabel">{isAr ? 'ملاحظات' : 'Notes'}</div>{offer.notes}</div>
                        )}
                      </>
                    )}
                    <div className="mo-orow"><span className="mo-ok">{t.total}</span><span className="mo-ov">{money(offerSar, isUSD ? 'SAR' : invCur)}<small> {isUSD ? 'SAR' : invCur}</small></span></div>
                    {offerRef ? <div className="mo-oref">{offerRef}</div> : null}
                    <div className="mo-oact">
                      <button className="mo-approve" disabled={paying} onClick={() => pay(String(r.payment_plan) === '100' ? 'full' : 'deposit')}>
                        {String(r.payment_plan) === '100' ? t.payFull : t.approve}
                      </button>
                      <a className="mo-neg" href={waLink(`أريد التفاوض على العرض — الطلب رقم ${r.request_ref || r.id}`)} target="_blank" rel="noopener noreferrer">{t.negotiate}</a>
                    </div>
                    <div className="mo-assure">🔒 {t.assure}</div>
                  </div>
                )}
                {stg.key === 'offer' && offer && offer.status === 'paid' && (
                  <div className="mo-ev"><b>{isAr ? '✓ تمت الموافقة والدفع' : '✓ Approved & paid'}</b></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
