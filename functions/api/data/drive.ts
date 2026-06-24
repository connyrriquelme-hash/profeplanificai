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
          const item = await context.env.DB.prepare(
            'SELECT * FROM drive_items WHERE id = ? AND usuario_id = ?'
          ).bind(id, auth).first();
          return Response.json({ data: item ?? null });
        }
        const folderId = url.searchParams.get('folderId');
        if (folderId) {
          const { results } = await context.env.DB.prepare(
            'SELECT * FROM drive_items WHERE usuario_id = ? AND carpeta_id = ? ORDER BY created_at DESC'
          ).bind(auth, folderId).all();
          return Response.json({ data: results });
        }
        const { results } = await context.env.DB.prepare(
          'SELECT * FROM drive_items WHERE usuario_id = ? ORDER BY created_at DESC'
        ).bind(auth).all();
        const folders = await context.env.DB.prepare(
          'SELECT * FROM drive_folders WHERE usuario_id = ? ORDER BY created_at DESC'
        ).bind(auth).all();
        return Response.json({ data: { items: results, folders: folders.results } });
      }
      case 'POST': {
        const body = await request.json() as Record<string, unknown>;
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        const isFolder = body._type === 'folder';
        if (isFolder) {
          await context.env.DB.prepare(
            'INSERT INTO drive_folders (id, usuario_id, nombre, created_at) VALUES (?, ?, ?, ?)'
          ).bind(newId, auth, body.nombre || '', now).run();
          return Response.json({ data: { id: newId, nombre: body.nombre, _type: 'folder' } }, { status: 201 });
        }
        await context.env.DB.prepare(
          'INSERT INTO drive_items (id, usuario_id, nombre, tipo, contenido, nivel, asignatura, carpeta_id, tamano, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(
          newId, auth,
          body.nombre || '', body.tipo || 'documento', body.contenido || '',
          body.nivel || '', body.asignatura || '', body.carpeta_id || null,
          (body.contenido || '').length, now, now
        ).run();
        return Response.json({ data: { id: newId, ...body } }, { status: 201 });
      }
      case 'DELETE': {
        if (!id) return Response.json({ error: 'Se requiere id' }, { status: 400 });
        await context.env.DB.prepare(
          'DELETE FROM drive_items WHERE id = ? AND usuario_id = ?'
        ).bind(id, auth).run();
        await context.env.DB.prepare(
          'DELETE FROM drive_folders WHERE id = ? AND usuario_id = ?'
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
