import { requireAuthContext, requireActiveAuthContext, requirePermissionContext } from '../../../_lib/auth-adapter';

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

    const { results } = await context.env.DB.prepare(
      'SELECT id, name, rbd, country, region, commune, address, contact_name, contact_email, contact_phone, status, plan, created_at FROM institutions ORDER BY name'
    ).all();

    return Response.json({ ok: true, data: results });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ ok: false, error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}