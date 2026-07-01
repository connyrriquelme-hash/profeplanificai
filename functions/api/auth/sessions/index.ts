interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { getSessionFromRequest, type SessionEnv } from '../../../_lib/session';

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const env: SessionEnv = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const session = await getSessionFromRequest(context.request, env);

    if (!session) {
      return Response.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!session.sessionId) {
      return Response.json({ sessions: [] });
    }

    const now = new Date().toISOString();
    const rows = await context.env.DB.prepare(
      `SELECT id, created_at, last_seen_at, expires_at, user_agent_hash
       FROM user_sessions
       WHERE user_id = ? AND revoked_at IS NULL AND expires_at > ?
       ORDER BY created_at DESC`
    ).bind(session.userId, now).all<{ id: string; created_at: string; last_seen_at: string | null; expires_at: string; user_agent_hash: string | null }>();

    const sessions = (rows.results || []).map(row => ({
      id: row.id,
      createdAt: row.created_at,
      lastSeenAt: row.last_seen_at,
      expiresAt: row.expires_at,
      userAgent: row.user_agent_hash || '',
      isCurrent: row.id === session.sessionId,
    }));

    return Response.json({ sessions });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
