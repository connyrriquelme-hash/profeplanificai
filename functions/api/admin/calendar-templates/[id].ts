import { requireAuthContext, requireActiveAuthContext, requirePermissionContext } from '../../../_lib/auth-adapter';
import { logAdminAction } from '../../../_lib/roles';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'institution:update');

    const { id } = context.params;
    const body = await context.request.json() as {
      name?: string;
      description?: string;
      school_year?: string;
      level_id?: string;
      subject_id?: string;
      weekday?: number;
      start_time?: string;
      end_time?: string;
      block_type?: string;
      room?: string;
      starts_on?: string;
      ends_on?: string;
    };

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
    if (body.description !== undefined) { updates.push('description = ?'); values.push(body.description); }
    if (body.school_year !== undefined) { updates.push('school_year = ?'); values.push(body.school_year); }
    if (body.level_id !== undefined) { updates.push('level_id = ?'); values.push(body.level_id); }
    if (body.subject_id !== undefined) { updates.push('subject_id = ?'); values.push(body.subject_id); }
    if (body.weekday !== undefined) { updates.push('weekday = ?'); values.push(body.weekday); }
    if (body.start_time !== undefined) { updates.push('start_time = ?'); values.push(body.start_time); }
    if (body.end_time !== undefined) { updates.push('end_time = ?'); values.push(body.end_time); }
    if (body.block_type !== undefined) { updates.push('block_type = ?'); values.push(body.block_type); }
    if (body.room !== undefined) { updates.push('room = ?'); values.push(body.room); }
    if (body.starts_on !== undefined) { updates.push('starts_on = ?'); values.push(body.starts_on); }
    if (body.ends_on !== undefined) { updates.push('ends_on = ?'); values.push(body.ends_on); }

    if (updates.length === 0) {
      return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    values.push(id as string);

    await context.env.DB.prepare(
      `UPDATE calendar_templates SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    await logAdminAction(context.env, authContext.userId, 'update_calendar_template', 'calendar_template', id as string, body);

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function onRequestDelete(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'institution:update');

    const { id } = context.params;

    const template = await context.env.DB.prepare(
      'SELECT id, name, institution_id FROM calendar_templates WHERE id = ?'
    ).bind(id).first<{ id: string; name: string; institution_id: string }>();

    if (!template) {
      return Response.json({ error: 'Template no encontrado' }, { status: 404 });
    }

    await context.env.DB.prepare('DELETE FROM calendar_templates WHERE id = ?').bind(id).run();

    await logAdminAction(context.env, authContext.userId, 'delete_calendar_template', 'calendar_template', id as string, {
      name: template.name,
      institution_id: template.institution_id,
    });

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
