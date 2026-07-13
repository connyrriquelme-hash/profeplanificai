import { requireAuthContext, requireActiveAuthContext, requirePermissionContext, requireInstitutionMatchContext } from '../../../_lib/auth-adapter';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'institution:read');
    await requireInstitutionMatchContext(context.request, env, context.params.id as string);

    const { id } = context.params;
    const institution = await context.env.DB.prepare(
      'SELECT * FROM institutions WHERE id = ?'
    ).bind(id).first();

    if (!institution) {
      return Response.json({ error: 'Institución no encontrada' }, { status: 404 });
    }

    const memberCount = await context.env.DB.prepare(
      'SELECT COUNT(*) as count FROM institution_members WHERE institution_id = ?'
    ).bind(id).first() as { count: number } | null;

    return Response.json({
      institution,
      member_count: memberCount?.count || 0,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'institution:update');
    await requireInstitutionMatchContext(context.request, env, context.params.id as string);

    const { id } = context.params;
    const body = await context.request.json() as {
      name?: string;
      rbd?: string;
      region?: string;
      commune?: string;
      contact_name?: string;
      contact_email?: string;
      contact_phone?: string;
    };

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name); }
    if (body.rbd !== undefined) { updates.push('rbd = ?'); values.push(body.rbd); }
    if (body.region !== undefined) { updates.push('region = ?'); values.push(body.region); }
    if (body.commune !== undefined) { updates.push('commune = ?'); values.push(body.commune); }
    if (body.contact_name !== undefined) { updates.push('contact_name = ?'); values.push(body.contact_name); }
    if (body.contact_email !== undefined) { updates.push('contact_email = ?'); values.push(body.contact_email); }
    if (body.contact_phone !== undefined) { updates.push('contact_phone = ?'); values.push(body.contact_phone); }

    if (updates.length === 0) {
      return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    updates.push("updated_at = datetime('now')");
    values.push(id as string);

    await context.env.DB.prepare(
      `UPDATE institutions SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
