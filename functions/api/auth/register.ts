interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

import { createToken, hashPassword } from '../../_lib/auth';

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as { email?: string; password?: string; nombre?: string };
    const { email, password, nombre } = body;

    if (!email || !password || !nombre) {
      return Response.json({ error: 'Faltan campos requeridos: email, password, nombre' }, { status: 400 });
    }

    if (password.length < 6) {
      return Response.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 });
    }

    const existing = await context.env.DB.prepare('SELECT id FROM usuarios WHERE email = ?').bind(email).first();
    if (existing) {
      return Response.json({ error: 'Este email ya está registrado' }, { status: 409 });
    }

    const id = crypto.randomUUID();
    const passwordHash = await hashPassword(password);
    const now = new Date().toISOString();

    await context.env.DB.prepare(
      'INSERT INTO usuarios (id, email, nombre, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(id, email, nombre, passwordHash, now, now).run();

    const token = await createToken(id, email.toLowerCase(), context.env.JWT_SECRET);

    return Response.json({
      user: { id, email, nombre, rol: 'docente' },
      token,
    }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
