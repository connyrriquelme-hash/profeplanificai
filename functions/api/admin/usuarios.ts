import { requireAuthContext, requireActiveAuthContext, requirePermissionContext } from '../../_lib/auth-adapter';
import { hashPassword } from '../../_lib/auth';
import { logAdminAction } from '../../_lib/roles';
import { ROLE_PERMISSIONS } from '../../core/authorization';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'user:read');

    const { results } = await context.env.DB.prepare(
      'SELECT id, email, nombre, rol, active, created_at, updated_at FROM usuarios ORDER BY created_at DESC'
    ).all();
    return Response.json({ usuarios: results });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'user:create');

    const body = await context.request.json() as { name?: string; email?: string; password?: string; role?: string; active?: boolean };
    const { name, email, password, role, active } = body;

    if (!name || !email || !password) {
      return Response.json({ error: 'Faltan campos requeridos: name, email, password' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const validRoles = Object.keys(ROLE_PERMISSIONS);
    const userRole = validRoles.includes(role || '') ? role! : 'docente';

    const existing = await context.env.DB.prepare('SELECT id FROM usuarios WHERE email = ?').bind(email).first();
    if (existing) {
      return Response.json({ error: 'Este email ya está registrado' }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();
    const userActive = active === false ? 0 : 1;

    await context.env.DB.prepare(
      `INSERT INTO usuarios (id, email, nombre, password_hash, rol, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, email, name, passwordHash, userRole, userActive, now, now).run();

    await logAdminAction({ DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET }, authContext.userId, 'create_user', 'user', id, { email, rol: userRole });

    return Response.json({
      success: true,
      data: { id, name, email, role: userRole, active: !!userActive },
    }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'user:update');

    const body = await context.request.json() as { userId?: string; rol?: string; password?: string; nombre?: string; active?: boolean };
    const { userId, rol, password, nombre, active } = body;

    if (!userId) {
      return Response.json({ error: 'Falta userId' }, { status: 400 });
    }

    if (rol) {
      const validRoles = Object.keys(ROLE_PERMISSIONS);
      if (!validRoles.includes(rol)) {
        return Response.json({ error: 'Rol inválido.' }, { status: 400 });
      }
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (rol) { updates.push('rol = ?'); values.push(rol); }
    if (nombre) { updates.push('nombre = ?'); values.push(nombre); }
    if (password) {
      const ph = await hashPassword(password);
      updates.push('password_hash = ?');
      values.push(ph);
    }
    if (active !== undefined) {
      if (userId === authContext.userId && !active) {
        return Response.json({ error: 'No puedes desactivar tu propia cuenta.' }, { status: 400 });
      }
      updates.push('active = ?');
      values.push(active ? 1 : 0);
    }
    updates.push("updated_at = datetime('now')");

    if (updates.length === 1) {
      return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    values.push(userId);
    await context.env.DB.prepare(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    if (active === false) {
      const adminCount = await context.env.DB.prepare('SELECT COUNT(*) as c FROM usuarios WHERE rol = ? AND active = 1').bind('admin').first<{ c: number }>();
      if (adminCount && adminCount.c === 0) {
        await context.env.DB.prepare('UPDATE usuarios SET active = 1 WHERE id = ?').bind(userId).run();
        return Response.json({ error: 'No se puede desactivar: es el único administrador activo.' }, { status: 400 });
      }
    }

    await logAdminAction({ DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET }, authContext.userId, 'update_user', 'user', userId, { rol, nombre: !!nombre, active });

    return Response.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}