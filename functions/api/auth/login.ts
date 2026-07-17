interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { verifyPassword } from '../../_lib/auth';
import { createSession, serializeSessionCookie, type SessionEnv } from '../../_lib/session';
import { requireAuthenticatedUserById } from '../../core/authorization';

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as { email?: string; password?: string };
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: 'Faltan email o password' }, { status: 400 });
    }

    const user = await context.env.DB.prepare(
      'SELECT id, email, nombre, password_hash, rol, active FROM usuarios WHERE email = ?'
    ).bind(email).first() as { id: string; email: string; nombre: string; password_hash: string; rol: string; active: number } | null;

    if (!user) {
      return Response.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
    }

    if (user.active === 0) {
      return Response.json({ error: 'Tu cuenta está desactivada. Contacta al administrador.' }, { status: 403 });
    }

    if (!(await verifyPassword(password, user.password_hash))) {
      return Response.json({ error: 'Usuario o contraseña incorrectos.' }, { status: 401 });
    }

    const env: SessionEnv = { DB: context.env.DB, JWT_SECRET: context.env.JWT_SECRET };
    const { token, sessionId } = await createSession({ id: user.id, email: user.email }, context.request, env);
    const authContext = await requireAuthenticatedUserById(user.id, env);

    const expiresAt = new Date(Date.now() + 86400 * 30 * 1000);
    const cookie = serializeSessionCookie(sessionId, expiresAt);

    return new Response(JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        active: user.active,
        institutionId: authContext.institutionId,
        institutionalRole: authContext.role,
        permissions: authContext.permissions,
        scope: authContext.scope ? {
          courseIds: authContext.scope.courseIds,
          subjectIds: authContext.scope.subjectIds,
          levelIds: authContext.scope.levelIds,
          academicYearIds: authContext.scope.academicYearIds,
        } : undefined,
      },
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
