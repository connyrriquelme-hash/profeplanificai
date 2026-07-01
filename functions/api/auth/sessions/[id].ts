interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { getSessionFromRequest, destroySession, clearSessionCookie, type SessionEnv } from '../../../_lib/session';

export async function onRequestDelete(context: EventContext<Env>): Promise<Response> {
  try {
    const env: SessionEnv = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const session = await getSessionFromRequest(context.request, env);

    if (!session) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    const targetId = (context.params as { id?: string })?.id;
    if (!targetId) {
      return Response.json({ error: 'ID de sesión requerido' }, { status: 400 });
    }

    const target = await context.env.DB.prepare(
      'SELECT id, user_id FROM user_sessions WHERE id = ?'
    ).bind(targetId).first<{ id: string; user_id: string }>();

    if (!target) {
      return Response.json({ error: 'Sesión no encontrada' }, { status: 404 });
    }

    if (target.user_id !== session.userId) {
      return Response.json({ error: 'No autorizado' }, { status: 403 });
    }

    await destroySession(targetId, env);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (targetId === session.sessionId) {
      headers['Set-Cookie'] = clearSessionCookie();
    }

    return new Response(JSON.stringify({ ok: true, message: 'Sesión eliminada correctamente' }), {
      status: 200,
      headers,
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
