import { verifyToken } from './auth';
import { requireAuthContext, requireActiveAuthContext, requireInstitutionMatchContext, requirePermissionContext } from './auth-adapter';
import { requireInstitutionAdminContext } from './auth-adapter';

export interface AdminEnv {
  DB: D1Database;
  JWT_SECRET?: string;
}

export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  rol: string;
}

/**
 * @deprecated Use requireAuthContext + requirePermission from functions/core/authorization instead.
 * Maintained for backward compatibility with existing endpoints.
 * Now uses institutionalRole + permissions instead of legacy user.rol.
 */
export async function requireAdmin(request: Request, env: AdminEnv): Promise<AdminUser> {
  const authEnv = { DB: env.DB, JWT_SECRET: env.JWT_SECRET };
  const authContext = await requireAuthContext(request, authEnv);
  await requireActiveAuthContext(request, authEnv);
  await requirePermissionContext(request, authEnv, 'user:*');

  const user = await env.DB.prepare(
    'SELECT id, email, nombre, rol FROM usuarios WHERE id = ?'
  ).bind(authContext.userId).first<AdminUser>();

  if (!user) {
    throw new Response(JSON.stringify({ ok: false, error: 'Usuario no encontrado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return user;
}

/**
 * @deprecated Use requireInstitutionAdminContext from functions/_lib/auth-adapter instead.
 * Maintained for backward compatibility.
 * Now uses institutionalRole + permissions instead of legacy user.rol.
 */
export async function requireInstitutionAdmin(
  request: Request,
  env: AdminEnv,
  institutionId: string,
): Promise<AdminUser> {
  const authEnv = { DB: env.DB, JWT_SECRET: env.JWT_SECRET };
  const authContext = await requireInstitutionAdminContext(request, authEnv, institutionId);

  const user = await env.DB.prepare(
    'SELECT id, email, nombre, rol FROM usuarios WHERE id = ?'
  ).bind(authContext.userId).first<AdminUser>();

  if (!user) {
    throw new Response(JSON.stringify({ ok: false, error: 'Usuario no encontrado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return user;
}

export async function logAdminAction(
  env: AdminEnv,
  adminUserId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const id = crypto.randomUUID();
  const metadataJson = metadata ? JSON.stringify(metadata) : null;

  await env.DB.prepare(
    `INSERT INTO admin_audit_log (id, admin_user_id, action, target_type, target_id, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(id, adminUserId, action, targetType || null, targetId || null, metadataJson).run();
}

/**
 * @deprecated Use requirePermission from functions/core/authorization instead.
 * Maps legacy role to institutional role for backward compatibility.
 */
function mapLegacyRole(legacyRole: string): string {
  switch (legacyRole) {
    case 'admin':
      return 'institution_admin';
    case 'docente':
      return 'teacher';
    case 'student':
      return 'student';
    case 'coordinator':
      return 'coordinator';
    case 'super_admin':
      return 'super_admin';
    default:
      return 'teacher';
  }
}

/**
 * @deprecated Use requirePermission from functions/core/authorization instead.
 * Returns permissions for a legacy role for backward compatibility.
 */
function getPermissionsForRole(legacyRole: string): string[] {
  switch (legacyRole) {
    case 'admin':
    case 'super_admin':
      return ['institution:*', 'user:*', 'course:*', 'plan:*', 'classbook:*', 'report:*', 'config:*', 'audit:*'];
    case 'institution_admin':
      return ['institution:read', 'institution:update', 'user:create', 'user:read', 'user:update', 'user:delete', 'course:create', 'course:read', 'course:update', 'course:assign_teacher', 'plan:read', 'classbook:read', 'classbook:write', 'report:institution', 'audit:institution'];
    case 'coordinator':
      return ['course:read', 'plan:read', 'plan:review', 'plan:approve', 'plan:observe', 'classbook:read', 'report:scope'];
    case 'docente':
    case 'teacher':
      return ['course:read_own', 'plan:create', 'plan:read_own', 'plan:update_own', 'classbook:create', 'classbook:read_own', 'classbook:update_own', 'classbook:sign_own', 'resource:create', 'resource:read', 'evaluation:create'];
    case 'student':
      return ['classbook:read_own', 'resource:read_assigned', 'evaluation:take_assigned'];
    default:
      return [];
  }
}