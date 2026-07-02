import { requireAdmin, logAdminAction, type AdminEnv } from '../../_lib/roles';
import { hashPassword } from '../../_lib/auth';

interface Env extends AdminEnv {}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const admin = await requireAdmin(context.request, { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET });
    const { results } = await context.env.DB.prepare(
      'SELECT id, email, nombre, rol, created_at, updated_at FROM usuarios ORDER BY created_at DESC'
    ).all();
    return Response.json({ usuarios: results });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const admin = await requireAdmin(context.request, { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET });

    const body = await context.request.json() as { userId?: string; rol?: string; password?: string; nombre?: string };
    const { userId, rol, password, nombre } = body;

    if (!userId) {
      return Response.json({ error: 'Falta userId' }, { status: 400 });
    }

    if (rol && !['admin', 'docente', 'institution_admin'].includes(rol)) {
      return Response.json({ error: 'Rol inválido.' }, { status: 400 });
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
    updates.push("updated_at = datetime('now')");

    if (updates.length === 1) {
      return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    values.push(userId);
    await context.env.DB.prepare(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    await logAdminAction({ DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET }, admin.id, 'update_user', 'user', userId, { rol, nombre: !!nombre });

    return Response.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
