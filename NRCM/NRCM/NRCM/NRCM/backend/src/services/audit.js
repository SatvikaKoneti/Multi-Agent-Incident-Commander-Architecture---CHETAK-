import { run } from '../db/index.js';
import { nowIso } from '../utils/index.js';

export function audit({ userId, role, action, entityType, entityId, details, ip }) {
  try {
    run(
      `INSERT INTO audit_logs (user_id, user_role, action, entity_type, entity_id, details, ip, created_at)
       VALUES ($user, $role, $action, $type, $id, $details, $ip, $created)`,
      {
        $user: userId || null,
        $role: role || null,
        $action: action,
        $type: entityType || null,
        $id: entityId !== undefined && entityId !== null ? String(entityId) : null,
        $details: details === undefined ? null : JSON.stringify(details),
        $ip: ip || null,
        $created: nowIso(),
      },
    );
  } catch {
    // Audit logging never breaks the request.
  }
}