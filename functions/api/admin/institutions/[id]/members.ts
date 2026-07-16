import { requireAuthContext, requireActiveAuthContext, requirePermissionContext } from '../../../../_lib/auth-adapter';
import { logAdminAction } from '../../../../_lib/roles';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'institution:read');

    const { id } = context.params;
    const { results } = await context.env.DB.prepare(
      `SELECT im.id, im.user_id, im.role, im.status, im.created_at,
              u.email, u.nombre
       FROM institution_members im
       LEFT JOIN usuarios u ON im.user_id = u.id
       WHERE im.institution_id = ?
       ORDER BY im.created_at DESC`
    ).bind(id).all();

    return Response.json({ members: results });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'user:create');

    const { id } = context.params;
    const body = await context.request.json() as { email?: string; role?: string };
    const role = body.role || 'docente';

    if (!body.email) {
      return Response.json({ error: 'Falta email' }, { status: 400 });
    }

    const user = await context.env.DB.prepare(
      'SELECT id FROM usuarios WHERE email = ?'
    ).bind(body.email).first<{ id: string }>();

    if (!user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    const existing = await context.env.DB.prepare(
      'SELECT id FROM institution_members WHERE user_id = ? AND institution_id = ?'
    ).bind(user.id, id).first();

    if (existing) {
      return Response.json({ error: 'El usuario ya es miembro de esta institución' }, { status: 409 });
    }

    const memberId = crypto.randomUUID();
    await context.env.DB.prepare(
      `INSERT INTO institution_members (id, institution_id, user_id, role, status)
       VALUES (?, ?, ?, ?, 'active')`
    ).bind(memberId, id, user.id, role).run();

    await logAdminAction(context.env, authContext.userId, 'add_institution_member', 'institution_member', memberId, {
      institution_id: id,
      user_id: user.id,
      email: body.email,
      role,
    });

    return Response.json({ ok: true, id: memberId }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
