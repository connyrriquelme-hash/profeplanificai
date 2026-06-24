interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { createToken, verifyPassword } from '../../_lib/auth';

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

    const token = await createToken(user.id, user.email, context.env.JWT_SECRET);

    return Response.json({
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
      token,
    });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
