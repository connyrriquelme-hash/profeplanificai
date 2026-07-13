import { requireAuthContext, requireActiveAuthContext } from '../../../_lib/auth-adapter';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const authContext = await requireAuthContext(context.request, env);
    await requireActiveAuthContext(context.request, env);
    return Response.json({ 
      user: authContext,
      isAdmin: true,
      institutionalRole: authContext.role,
      institutionId: authContext.institutionId,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Error interno' }, { status: 500 });
  }
}
