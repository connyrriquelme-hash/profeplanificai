interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { verifyPassword } from '../../_lib/auth';
import { createSession, serializeSessionCookie, type SessionEnv } from '../../_lib/session';

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: 'Faltan email o password' }, { status: 400 });
    }

    const user = await context.env.DB.prepare(
      'SELECT id, email, nombre, password_hash, rol FROM usuarios WHERE email = ?'
    ).bind(email).first() as { id: string; email: string; nombre: string; password_hash: string; rol: string } | null;

    if (!user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 401 });
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      return Response.json({ error: 'Contraseña incorrecta' }, { status: 401 });
    }

    const env: SessionEnv = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { token, sessionId } = await createSession({ id: user.id, email: user.email }, context.request, env);

    const expiresAt = new Date(Date.now() + 86400 * 30 * 1000);
    const cookie = serializeSessionCookie(sessionId, expiresAt);

    return new Response(JSON.stringify({
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      token,
      session: { id: sessionId, createdAt: new Date().toISOString(), expiresAt: expiresAt.toISOString() },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
