interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { getSessionFromRequest, revokeAllUserSessions, type SessionEnv } from '../../../_lib/session';

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env: SessionEnv = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const session = await getSessionFromRequest(context.request, env);

    if (!session) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!session.sessionId) {
      return Response.json({ error: 'Se requiere una sesión activa para realizar esta acción' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const countResult = await context.env.DB.prepare(
      'SELECT COUNT(*) as cnt FROM user_sessions WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?'
    ).bind(session.userId, now).first<{ cnt: number }>();

    await revokeAllUserSessions(session.userId, env, session.sessionId);

    const revokedCount = (countResult?.cnt || 1) - 1;

    return Response.json({
      ok: true,
      revokedCount,
      message: 'Todas las demás sesiones han sido cerradas',
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
