import { sb } from '../supabase';

export async function logAdminAction({
  actorId,
  action,
  entityType = null,
  entityId = null,
  beforeState = null,
  afterState = null,
  notes = null,
}) {
  try {
    await sb.from('audit_log').insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_state: beforeState,
      after_state: afterState,
      notes,
    });
  } catch (err) {
    console.error('[adminAudit] failed to log action:', action, err);
  }
}
