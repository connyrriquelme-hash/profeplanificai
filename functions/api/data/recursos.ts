interface Env {
  DB: D1Database;
}

export async function onRequest(context: EventContext<Env>): Promise<Response> {
  const auth = getUserId(context);
  if (!auth) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const method = request.method;

  try {
    switch (method) {
      case 'GET': {
        if (id) {
          const rec = await context.env.DB.prepare(
            'SELECT * FROM recursos WHERE id = ? AND usuario_id = ?'
          ).bind(id, auth).first();
          return Response.json({ data: rec ?? null });
        }
        const { results } = await context.env.DB.prepare(
          'SELECT * FROM recursos WHERE usuario_id = ? ORDER BY created_at DESC'
        ).bind(auth).all();
        return Response.json({ data: results });
      }
      case 'POST': {
        const body = await request.json() as Record<string, unknown>;
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        await context.env.DB.prepare(
          `INSERT INTO recursos (id, usuario_id, tipo_recurso, titulo, nivel, asignatura, oa, contenido, texto, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          newId, auth,
          body.tipo_recurso || '',
          body.titulo || '',
          body.nivel || '',
          body.asignatura || '',
          body.oa || '',
          body.contenido || '',
          body.texto || '',
          now, now
        ).run();
        return Response.json({ data: { id: newId, ...body, usuario_id: auth } }, { status: 201 });
      }
      case 'PUT': {
        if (!id) return Response.json({ error: 'Se requiere id' }, { status: 400 });
        const body = await request.json() as Record<string, unknown>;
        const now = new Date().toISOString();
        await context.env.DB.prepare(
          `UPDATE recursos SET tipo_recurso=?, titulo=?, nivel=?, asignatura=?, oa=?, contenido=?, texto=?, updated_at=?
           WHERE id = ? AND usuario_id = ?`
        ).bind(
          body.tipo_recurso, body.titulo, body.nivel, body.asignatura,
          body.oa, body.contenido, body.texto, now, id, auth
        ).run();
        return Response.json({ success: true });
      }
      case 'DELETE': {
        if (!id) return Response.json({ error: 'Se requiere id' }, { status: 400 });
        await context.env.DB.prepare(
          'DELETE FROM recursos WHERE id = ? AND usuario_id = ?'
        ).bind(id, auth).run();
        return Response.json({ success: true });
      }
      default:
        return Response.json({ error: 'Método no soportado' }, { status: 405 });
    }
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}

function getUserId(context: EventContext<Env>): string | null {
  const auth = context.request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(atob(auth.slice(7).split('.')[1]));
    return payload.sub || null;
  } catch { return null; }
}
