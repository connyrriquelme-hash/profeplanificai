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
      'SELECT * FROM institutions ORDER BY created_at DESC'
    ).all();
    return Response.json({ institutions: results });
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
    await requirePermissionContext(context.request, env, 'institution:create');

    const body = await context.request.json() as {
      name?: string;
      rbd?: string;
      region?: string;
      commune?: string;
      contact_name?: string;
      contact_email?: string;
      contact_phone?: string;
    };

    if (!body.name) {
      return Response.json({ error: 'Falta name' }, { status: 400 });
    }

    const id = crypto.randomUUID();
    await context.env.DB.prepare(
      `INSERT INTO institutions (id, name, rbd, region, commune, contact_name, contact_email, contact_phone)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      id,
      body.name,
      body.rbd || null,
      body.region || null,
      body.commune || null,
      body.contact_name || null,
      body.contact_email || null,
      body.contact_phone || null
    ).run();

    return Response.json({ ok: true, id }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
