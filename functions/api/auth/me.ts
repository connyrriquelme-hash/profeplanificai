interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { getSessionFromRequest, type SessionEnv } from '../../_lib/session';

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env: SessionEnv = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const session = await getSessionFromRequest(context.request, env);

    if (!session) {
      return Response.json({ error: 'Token requerido' }, { status: 401 });
    }

    const user = await context.env.DB.prepare(
      'SELECT id, email, nombre, rol, active FROM usuarios WHERE id = ?'
    ).bind(session.userId).first() as { id: string; email: string; nombre: string; rol: string; active: number } | null;

    if (!user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    if (user.active === 0) {
      return Response.json({ error: 'Tu cuenta está desactivada. Contacta al administrador.' }, { status: 403 });
    }

    let sessionMeta = null;
    if (session.sessionId) {
      sessionMeta = await context.env.DB.prepare(
        'SELECT id, created_at, last_seen_at, expires_at FROM user_sessions WHERE id = ?'
      ).bind(session.sessionId).first<{ id: string; created_at: string; last_seen_at: string; expires_at: string }>();
    }

    return Response.json({ user, session: sessionMeta ? {
      id: sessionMeta.id,
      createdAt: sessionMeta.created_at,
      lastSeenAt: sessionMeta.last_seen_at,
      expiresAt: sessionMeta.expires_at,
    } : null });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
