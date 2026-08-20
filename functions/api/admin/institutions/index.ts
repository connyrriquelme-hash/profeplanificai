import { z } from 'zod';
import { requireAuthContext, requireActiveAuthContext, requirePermissionContext } from '../../../_lib/auth-adapter';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

const CreateInstitutionSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es requerido').max(200),
  rbd: z.string().trim().max(20).optional(),
  region: z.string().trim().max(100).optional(),
  commune: z.string().trim().max(100).optional(),
  contact_name: z.string().trim().max(150).optional(),
  contact_email: z.string().trim().email('Correo de contacto inválido').max(320).optional().or(z.literal('')),
  contact_phone: z.string().trim().max(30).optional(),
});

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    await requirePermissionContext(context.request, env, 'institution:read');

    const { results } = authContext.role === 'super_admin'
      ? await context.env.DB.prepare(
          'SELECT * FROM institutions ORDER BY created_at DESC'
        ).all()
      : await context.env.DB.prepare(
          'SELECT * FROM institutions WHERE id = ? ORDER BY created_at DESC'
        ).bind(authContext.institutionId).all();
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

    const parsed = CreateInstitutionSchema.safeParse(await context.request.json());
    if (!parsed.success) {
      return Response.json({ error: parsed.error.issues[0]?.message || 'Datos inválidos' }, { status: 400 });
    }
    const body = parsed.data;

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
