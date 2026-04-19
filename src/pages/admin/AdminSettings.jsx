import React, { useEffect, useState, useCallback } from 'react';
import AdminShell from '../../components/admin/AdminShell';
import AdminRouteGuard from '../../components/admin/AdminRouteGuard';
import AdminConfirmDialog from '../../components/admin/AdminConfirmDialog';
import { sb } from '../../supabase';
import { logAdminAction } from '../../lib/adminAudit';

const FONT_HEADING = "'Cormorant Garamond', Georgia, serif";
const FONT_BODY    = "'Tajawal', sans-serif";

const fmtTime = d => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

const CSS = `
  .st-page { padding: 36px 32px; max-width: 720px; }
  .st-page-title { margin: 0 0 4px; font-size: 26px; font-weight: 400; color: rgba(0,0,0,0.88); font-family: ${FONT_HEADING}; line-height: 1.1; }
  .st-page-sub { margin: 0 0 28px; font-size: 12px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .st-card { background: var(--bg-raised, #fff); border: 1px solid rgba(0,0,0,0.07); border-radius: 10px; padding: 20px; margin-bottom: 14px; }
  .st-card-title { margin: 0 0 16px; font-size: 10px; font-weight: 600; letter-spacing: 1.6px; text-transform: uppercase; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; }
  .st-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; flex-wrap: wrap; }
  .st-row:last-child { margin-bottom: 0; }
  .st-label { font-size: 13px; color: rgba(0,0,0,0.75); font-family: ${FONT_BODY}; }
  .st-sub { font-size: 11px; color: rgba(0,0,0,0.38); font-family: ${FONT_BODY}; margin-top: 2px; }
  .st-toggle { appearance: none; width: 40px; height: 22px; border-radius: 99px; background: rgba(0,0,0,0.15); cursor: pointer; position: relative; outline: none; transition: background 0.15s; flex-shrink: 0; }
  .st-toggle:checked { background: #27725a; }
  .st-toggle::after { content: ''; position: absolute; width: 16px; height: 16px; border-radius: 50%; background: #fff; top: 3px; left: 3px; transition: transform 0.15s; }
  .st-toggle:checked::after { transform: translateX(18px); }
  .st-input { padding: 8px 12px; background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; font-size: 14px; color: rgba(0,0,0,0.80); font-family: ${FONT_BODY}; outline: none; width: 80px; text-align: center; }
  .st-input:focus { border-color: rgba(0,0,0,0.22); }
  .st-input-wide { width: 100%; box-sizing: border-box; margin-top: 8px; padding: 9px 12px; background: var(--bg-subtle, #F5F2EE); border: 1px solid rgba(0,0,0,0.09); border-radius: 8px; font-size: 13px; color: rgba(0,0,0,0.80); font-family: ${FONT_BODY}; outline: none; }
  .st-input-wide:focus { border-color: rgba(0,0,0,0.22); }
  .st-btn { min-height: 34px; padding: 0 14px; border-radius: 7px; font-size: 12px; cursor: pointer; font-family: ${FONT_BODY}; white-space: nowrap; border: 1px solid rgba(0,0,0,0.09); background: transparent; color: rgba(0,0,0,0.55); transition: all 0.12s; }
  .st-btn:hover { background: rgba(0,0,0,0.04); }
  .st-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .st-btn-primary { background: #1a1814; color: #fff; border-color: #1a1814; font-weight: 600; }
  .st-btn-primary:hover { opacity: 0.88; background: #1a1814; }
  .st-btn-danger { color: #c0392b; border-color: rgba(192,57,43,0.20); }
  .st-btn-danger:hover { background: rgba(192,57,43,0.06); }
  .st-flash { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); background: #1a1814; color: #fff; padding: 10px 22px; border-radius: 99px; font-size: 12px; font-family: ${FONT_BODY}; z-index: 999; white-space: nowrap; pointer-events: none; }
  .st-divider { border: none; border-top: 1px solid rgba(0,0,0,0.06); margin: 14px 0; }
  .st-audit-row { padding: 10px 0; border-bottom: 1px solid rgba(0,0,0,0.05); }
  .st-audit-row:last-child { border-bottom: none; }
  .st-mono { font-family: monospace; font-size: 11px; color: rgba(0,0,0,0.55); }
  @media (max-width: 900px) { .st-page { padding: 22px 16px; } }
`;

function SectionCard({ title, children }) {
  return (
    <div className="st-card">
      {title && <p className="st-card-title">{title}</p>}
      {children}
    </div>
  );
}

export default function AdminSettings({ user, profile, lang, ...rest }) {
  const isAr = lang === 'ar';
  const isSuperAdmin = profile?.role === 'super_admin';

  const [settings, setSettings]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState({});
  const [flashMsg, setFlashMsg]   = useState('');
  const [confirm, setConfirm]     = useState(null);
  const [auditLog, setAuditLog]   = useState([]);
  const [auditLoading, setAuditLoading] = useState(true);

  // Fee editor local state
  const [feeValue, setFeeValue]   = useState('');
  // Maintenance message local state
  const [maintMsg, setMaintMsg]   = useState('');
  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole]   = useState('admin');

  const showFlash = msg => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await sb.from('admin_settings').select('*');
    const map = {};
    (data || []).forEach(r => { map[r.key] = r.value; });
    setSettings(map);
    setFeeValue(String(map.platform_fee_pct?.value ?? 5));
    setMaintMsg(map.maintenance_mode?.message || '');
    setLoading(false);
  }, []);

  const loadAudit = useCallback(async () => {
    setAuditLoading(true);
    const { data } = await sb.from('audit_log').select('id, created_at, action, entity_type, entity_id, actor:actor_id(full_name, email)').order('created_at', { ascending: false }).limit(100);
    setAuditLog(data || []);
    setAuditLoading(false);
  }, []);

  useEffect(() => { load(); loadAudit(); }, [load, loadAudit]);

  const saveSetting = async (key, newValue) => {
    setSaving(prev => ({ ...prev, [key]: true }));
    const before = settings[key];
    await sb.from('admin_settings').update({ value: newValue, updated_at: new Date().toISOString(), updated_by: user.id }).eq('key', key);
    await logAdminAction({ actorId: user.id, action: 'settings_update', entityType: 'admin_settings', entityId: key, beforeState: before, afterState: newValue });
    await load();
    setSaving(prev => ({ ...prev, [key]: false }));
    showFlash(isAr ? 'تم الحفظ' : 'Saved');
  };

  const doFeeUpdate = async () => {
    const parsed = parseFloat(feeValue);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) { showFlash(isAr ? 'قيمة غير صالحة' : 'Invalid value'); return; }
    await saveSetting('platform_fee_pct', { value: parsed });
    setConfirm(null);
  };

  const toggleMaintenance = async (enabled) => {
    await saveSetting('maintenance_mode', { enabled, message: maintMsg });
  };

  const toggleFoundingClub = async (enabled) => {
    await saveSetting('founding_club_active', { enabled });
  };

  const inviteAdmin = async () => {
    if (!inviteEmail.trim()) return;
    setSaving(prev => ({ ...prev, invite: true }));
    const { data: existing } = await sb.from('profiles').select('id, role, full_name').ilike('email', inviteEmail.trim()).single();
    if (!existing) { showFlash(isAr ? 'المستخدم غير موجود' : 'User not found'); setSaving(prev => ({ ...prev, invite: false })); return; }
    const before = { role: existing.role };
    await sb.from('profiles').update({ role: inviteRole }).eq('id', existing.id);
    await logAdminAction({ actorId: user.id, action: 'admin_role_assign', entityType: 'profile', entityId: existing.id, beforeState: before, afterState: { role: inviteRole } });
    setInviteEmail('');
    setSaving(prev => ({ ...prev, invite: false }));
    showFlash(isAr ? `تم تعيين الدور: ${inviteRole}` : `Role updated to ${inviteRole}`);
  };

  const feePct = settings.platform_fee_pct?.value ?? 5;
  const maintEnabled = settings.maintenance_mode?.enabled ?? false;
  const foundingActive = settings.founding_club_active?.enabled ?? true;

  return (
    <AdminRouteGuard user={user} profile={profile} lang={lang}>
      <AdminShell user={user} profile={profile} lang={lang}>
        <style>{CSS}</style>
        {flashMsg && <div className="st-flash">{flashMsg}</div>}

        <AdminConfirmDialog
          isOpen={confirm?.type === 'fee'}
          title={isAr ? 'تغيير رسوم المنصة' : 'Update Platform Fee'}
          description={isAr ? `تغيير الرسوم من ${feePct}% إلى ${feeValue}%` : `Change platform fee from ${feePct}% to ${feeValue}%`}
          confirmWord="CONFIRM"
          onConfirm={doFeeUpdate}
          onCancel={() => setConfirm(null)}
          isAr={isAr}
          danger
        />

        <div className="st-page" dir={isAr ? 'rtl' : 'ltr'}>
          <h1 className="st-page-title">{isAr ? 'الإعدادات' : 'Settings'}</h1>
          <p className="st-page-sub">{isAr ? 'إعدادات المنصة والفريق' : 'Platform configuration and team'}</p>

          {loading ? (
            <p style={{ color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, fontSize: 13 }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>
          ) : (
            <>
              {/* Platform Fee */}
              <SectionCard title={isAr ? 'رسوم المنصة' : 'Platform Fee'}>
                <div className="st-row">
                  <div>
                    <div className="st-label">{isAr ? 'نسبة الرسوم الحالية' : 'Current fee percentage'}</div>
                    <div className="st-sub">{isAr ? 'تُطبّق على جميع الطلبات الجديدة' : 'Applied to all new orders'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      className="st-input"
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={feeValue}
                      onChange={e => setFeeValue(e.target.value)}
                    />
                    <span style={{ fontSize: 13, fontFamily: FONT_BODY, color: 'rgba(0,0,0,0.55)' }}>%</span>
                    <button
                      className="st-btn st-btn-danger"
                      disabled={String(feePct) === feeValue}
                      onClick={() => setConfirm({ type: 'fee' })}
                    >
                      {isAr ? 'حفظ' : 'Save'}
                    </button>
                  </div>
                </div>
              </SectionCard>

              {/* Maintenance Mode */}
              <SectionCard title={isAr ? 'وضع الصيانة' : 'Maintenance Mode'}>
                <div className="st-row">
                  <div>
                    <div className="st-label">{isAr ? 'تفعيل وضع الصيانة' : 'Enable maintenance mode'}</div>
                    <div className="st-sub">{isAr ? 'يمنع وصول المستخدمين للمنصة' : 'Blocks user access to the platform'}</div>
                  </div>
                  <input
                    type="checkbox"
                    className="st-toggle"
                    checked={maintEnabled}
                    onChange={e => toggleMaintenance(e.target.checked)}
                    disabled={saving.maintenance_mode}
                  />
                </div>
                {maintEnabled && (
                  <>
                    <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.38)', fontFamily: FONT_BODY, marginBottom: 4 }}>{isAr ? 'رسالة الصيانة (اختياري)' : 'Maintenance message (optional)'}</div>
                    <input
                      className="st-input-wide"
                      value={maintMsg}
                      onChange={e => setMaintMsg(e.target.value)}
                      placeholder={isAr ? 'سيتم العودة قريباً...' : 'We\'ll be back shortly…'}
                      dir={isAr ? 'rtl' : 'ltr'}
                    />
                    <button
                      className="st-btn st-btn-primary"
                      style={{ marginTop: 10 }}
                      disabled={saving.maintenance_mode}
                      onClick={() => saveSetting('maintenance_mode', { enabled: maintEnabled, message: maintMsg })}
                    >
                      {isAr ? 'حفظ الرسالة' : 'Save message'}
                    </button>
                  </>
                )}
              </SectionCard>

              {/* Founding Club */}
              <SectionCard title={isAr ? 'نادي المؤسسين' : 'Founding Club'}>
                <div className="st-row">
                  <div>
                    <div className="st-label">{isAr ? 'تفعيل نادي المؤسسين' : 'Founding club active'}</div>
                    <div className="st-sub">{isAr ? 'يتيح التسجيل في النادي للمستخدمين الجدد' : 'Allows new users to join the founding club'}</div>
                  </div>
                  <input
                    type="checkbox"
                    className="st-toggle"
                    checked={foundingActive}
                    onChange={e => toggleFoundingClub(e.target.checked)}
                    disabled={saving.founding_club_active}
                  />
                </div>
              </SectionCard>

              {/* Admin Team Invite — super_admin only */}
              {isSuperAdmin && (
                <SectionCard title={isAr ? 'إدارة الفريق' : 'Admin Team'}>
                  <div className="st-label" style={{ marginBottom: 8 }}>{isAr ? 'تغيير دور مستخدم' : 'Assign admin role to a user'}</div>
                  <input
                    className="st-input-wide"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    placeholder={isAr ? 'البريد الإلكتروني...' : 'User email…'}
                    dir="ltr"
                    style={{ marginBottom: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={inviteRole}
                      onChange={e => setInviteRole(e.target.value)}
                      style={{ padding: '7px 10px', background: 'var(--bg-subtle, #F5F2EE)', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 7, fontSize: 12, color: 'rgba(0,0,0,0.75)', fontFamily: FONT_BODY, outline: 'none', minHeight: 34, cursor: 'pointer' }}
                    >
                      <option value="admin">admin</option>
                      <option value="super_admin">super_admin</option>
                      <option value="buyer">buyer</option>
                      <option value="supplier">supplier</option>
                    </select>
                    <button
                      className="st-btn st-btn-primary"
                      disabled={!inviteEmail.trim() || saving.invite}
                      onClick={inviteAdmin}
                    >
                      {saving.invite ? '…' : (isAr ? 'تعيين الدور' : 'Assign Role')}
                    </button>
                  </div>
                </SectionCard>
              )}

              {/* Audit Log */}
              <SectionCard title={isAr ? 'سجل المراجعة (آخر 100)' : 'Audit Log (last 100)'}>
                {auditLoading ? (
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY }}>{isAr ? 'جارٍ التحميل...' : 'Loading…'}</p>
                ) : auditLog.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: 'rgba(0,0,0,0.30)', fontFamily: FONT_BODY }}>{isAr ? 'لا توجد سجلات' : 'No audit entries'}</p>
                ) : (
                  auditLog.map(entry => (
                    <div key={entry.id} className="st-audit-row">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(0,0,0,0.80)', fontFamily: FONT_BODY }}>{entry.action}</span>
                          {' '}
                          <span className="st-mono">{entry.entity_type}</span>
                        </div>
                        <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontFamily: FONT_BODY, whiteSpace: 'nowrap', fontVariantNumeric: 'lining-nums' }}>{fmtTime(entry.created_at)}</span>
                      </div>
                      <div style={{ fontSize: 11, color: 'rgba(0,0,0,0.45)', fontFamily: FONT_BODY, marginTop: 2 }}>
                        {entry.actor?.full_name || entry.actor?.email || '—'}
                        {entry.entity_id && <span className="st-mono" style={{ marginLeft: 6 }}>#{String(entry.entity_id).slice(0, 8)}</span>}
                      </div>
                    </div>
                  ))
                )}
              </SectionCard>
            </>
          )}
        </div>
      </AdminShell>
    </AdminRouteGuard>
  );
}
