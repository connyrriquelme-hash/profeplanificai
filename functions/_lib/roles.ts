import { verifyToken } from './auth';

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

export async function requireAdmin(request: Request, env: AdminEnv): Promise<AdminUser> {
  const auth = request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    throw new Response(JSON.stringify({ ok: false, error: 'Token requerido' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const secret = env.JWT_SECRET || '';
  if (!secret) {
    throw new Response(JSON.stringify({ ok: false, error: 'JWT_SECRET no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const payload = await verifyToken(auth.slice(7), secret);
  if (!payload?.sub) {
    throw new Response(JSON.stringify({ ok: false, error: 'Token inválido o expirado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const user = await env.DB.prepare(
    'SELECT id, email, nombre, rol FROM usuarios WHERE id = ?'
  ).bind(payload.sub).first<AdminUser>();

  if (!user) {
    throw new Response(JSON.stringify({ ok: false, error: 'Usuario no encontrado' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (user.rol !== 'admin') {
    throw new Response(JSON.stringify({ ok: false, error: 'No tienes permisos de administrador.' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return user;
}

export async function requireInstitutionAdmin(
  request: Request,
  env: AdminEnv,
  institutionId: string,
): Promise<AdminUser> {
  const user = await requireAdmin(request, env);

  if (user.rol === 'admin') return user;

  const member = await env.DB.prepare(
    'SELECT role FROM institution_members WHERE user_id = ? AND institution_id = ? AND status = ?'
  ).bind(user.id, institutionId, 'active').first<{ role: string }>();

  if (!member || member.role !== 'institution_admin') {
    throw new Response(JSON.stringify({ ok: false, error: 'No tienes permisos de administrador de institución.' }), {
      status: 403,
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
