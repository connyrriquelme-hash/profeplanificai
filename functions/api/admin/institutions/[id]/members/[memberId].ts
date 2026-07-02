import { requireAdmin, logAdminAction } from '../../../../../_lib/roles';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const admin = await requireAdmin(context.request, context.env);

    const { id, memberId } = context.params;
    const body = await context.request.json() as { role?: string; status?: string };

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.role !== undefined) { updates.push('role = ?'); values.push(body.role); }
    if (body.status !== undefined) { updates.push('status = ?'); values.push(body.status); }

    if (updates.length === 0) {
      return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    values.push(memberId as string);
    values.push(id as string);

    await context.env.DB.prepare(
      `UPDATE institution_members SET ${updates.join(', ')} WHERE id = ? AND institution_id = ?`
    ).bind(...values).run();

    await logAdminAction(context.env, admin.id, 'update_institution_member', 'institution_member', memberId as string, {
      institution_id: id,
      ...body,
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
