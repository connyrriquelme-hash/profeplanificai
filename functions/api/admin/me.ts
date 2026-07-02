import { requireAdmin } from '../../_lib/roles';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const user = await requireAdmin(context.request, context.env);
    return Response.json({ user, isAdmin: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
