import { requireAdmin } from '../../_lib/roles';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    await requireAdmin(context.request, context.env);

    const { results } = await context.env.DB.prepare(
      `SELECT aal.id, aal.admin_user_id, aal.action, aal.target_type, aal.target_id,
              aal.metadata_json, aal.created_at, u.email as admin_email
       FROM admin_audit_log aal
       LEFT JOIN usuarios u ON aal.admin_user_id = u.id
       ORDER BY aal.created_at DESC
       LIMIT 100`
    ).all();

    return Response.json({ entries: results });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
