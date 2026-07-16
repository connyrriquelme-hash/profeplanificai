import { requireAuthContext, requireActiveAuthContext, requireInstitutionContext, requirePermissionContext } from '../../../../_lib/auth-adapter';
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
    await requireInstitutionContext(context.request, env);
    await requirePermissionContext(context.request, env, 'institution:read');

    const { id } = context.params;
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM calendar_templates WHERE institution_id = ? ORDER BY created_at DESC'
    ).bind(id).all();

    return Response.json({ templates: results });
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
    await requireInstitutionContext(context.request, env);
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

    if (!body.name || !body.school_year || body.weekday === undefined || !body.start_time || !body.end_time) {
      return Response.json({ error: 'Faltan campos requeridos: name, school_year, weekday, start_time, end_time' }, { status: 400 });
    }

    const templateId = crypto.randomUUID();
    await context.env.DB.prepare(
      `INSERT INTO calendar_templates
       (id, institution_id, name, description, school_year, level_id, subject_id, weekday, start_time, end_time, block_type, room, starts_on, ends_on)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      templateId,
      id,
      body.name,
      body.description || null,
      body.school_year,
      body.level_id || null,
      body.subject_id || null,
      body.weekday,
      body.start_time,
      body.end_time,
      body.block_type || null,
      body.room || null,
      body.starts_on || null,
      body.ends_on || null
    ).run();

    await logAdminAction(context.env, authContext.userId, 'create_calendar_template', 'calendar_template', templateId, {
      institution_id: id,
      name: body.name,
    });

    return Response.json({ ok: true, id: templateId }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
