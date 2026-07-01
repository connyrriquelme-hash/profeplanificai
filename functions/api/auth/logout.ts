interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { getSessionFromRequest, destroySession, clearSessionCookie, type SessionEnv } from '../../_lib/session';

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const env: SessionEnv = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const session = await getSessionFromRequest(context.request, env);

    if (session?.sessionId) {
      await destroySession(session.sessionId, env);
    }

    return new Response(JSON.stringify({ ok: true, message: 'Sesión cerrada correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearSessionCookie() },
    });
  } catch {
    return new Response(JSON.stringify({ ok: true, message: 'Sesión cerrada correctamente' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearSessionCookie() },
    });
  }
}
