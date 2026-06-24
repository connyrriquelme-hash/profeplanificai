interface Env {
  DB: D1Database;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const adminId = await requireAdmin(context);
  if (!adminId) return Response.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const { results } = await context.env.DB.prepare(
      'SELECT id, email, nombre, rol, created_at, updated_at FROM usuarios ORDER BY created_at DESC'
    ).all();
    return Response.json({ usuarios: results });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  const adminId = await requireAdmin(context);
  if (!adminId) return Response.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await context.request.json() as { userId?: string; rol?: string; password?: string; nombre?: string };
    const { userId, rol, password, nombre } = body;

    if (!userId) {
      return Response.json({ error: 'Falta userId' }, { status: 400 });
    }

    if (rol && !['admin', 'docente'].includes(rol)) {
      return Response.json({ error: 'Rol inválido. Debe ser admin o docente' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: (string | number)[] = [];

    if (rol) { updates.push('rol = ?'); values.push(rol); }
    if (nombre) { updates.push('nombre = ?'); values.push(nombre); }
    if (password) {
      const passwordHash = await hashPassword(password);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }
    updates.push("updated_at = datetime('now')");

    if (updates.length === 1) {
      return Response.json({ error: 'No hay campos para actualizar' }, { status: 400 });
    }

    values.push(userId);
    await context.env.DB.prepare(
      `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...values).run();

    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

async function requireAdmin(context: EventContext<Env>): Promise<string | null> {
  const auth = context.request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(atob(auth.slice(7).split('.')[1]));
    const userId = payload.sub;
    if (!userId) return null;
    const user = await context.env.DB.prepare('SELECT rol FROM usuarios WHERE id = ?').bind(userId).first() as { rol: string } | null;
    if (!user || user.rol !== 'admin') return null;
    return userId as string;
  } catch { return null; }
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)));
}
