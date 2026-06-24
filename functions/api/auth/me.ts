interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { verifyToken } from '../../_lib/auth';

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const auth = context.request.headers.get('Authorization');
    if (!auth?.startsWith('Bearer ')) {
      return Response.json({ error: 'Token requerido' }, { status: 401 });
    }

    const tokenPayload = await verifyToken(auth.slice(7), context.env.JWT_SECRET);
    if (!tokenPayload) {
      return Response.json({ error: 'Token inválido o expirado' }, { status: 401 });
    }

    const user = await context.env.DB.prepare(
      'SELECT id, email, nombre, rol FROM usuarios WHERE id = ?'
    ).bind(tokenPayload.sub).first() as { id: string; email: string; nombre: string; rol: string } | null;

    if (!user) {
      return Response.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    return Response.json({ user });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
