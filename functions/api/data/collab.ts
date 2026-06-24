interface Env {
  DB: D1Database;
}

export async function onRequest(context: EventContext<Env>): Promise<Response> {
  const auth = getUserId(context);
  if (!auth) return Response.json({ error: 'No autorizado' }, { status: 401 });

  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const action = url.searchParams.get('action');
  const method = request.method;

  try {
    switch (method) {
      case 'GET': {
        if (id) {
          const post = await context.env.DB.prepare(
            'SELECT * FROM colaboracion_posts WHERE id = ?'
          ).bind(id).first();
          const comentarios = await context.env.DB.prepare(
            'SELECT c.*, u.nombre as usuario_nombre FROM colaboracion_comentarios c LEFT JOIN usuarios u ON c.usuario_id = u.id WHERE c.post_id = ? ORDER BY c.created_at ASC'
          ).bind(id).all();
          return Response.json({ data: { ...post as Record<string, unknown>, comentarios: comentarios.results } });
        }
        const { results } = await context.env.DB.prepare(
          'SELECT p.*, u.nombre as autor_nombre FROM colaboracion_posts p LEFT JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.created_at DESC'
        ).all();
        return Response.json({ data: results });
      }
      case 'POST': {
        if (id && action === 'like') {
          const post = await context.env.DB.prepare('SELECT likes FROM colaboracion_posts WHERE id = ?').bind(id).first() as { likes: number } | null;
          if (!post) return Response.json({ error: 'Post no encontrado' }, { status: 404 });
          await context.env.DB.prepare('UPDATE colaboracion_posts SET likes = ? WHERE id = ?').bind(post.likes + 1, id).run();
          return Response.json({ success: true, likes: post.likes + 1 });
        }
        if (id && action === 'comment') {
          const body = await request.json() as { texto?: string };
          if (!body.texto) return Response.json({ error: 'Texto requerido' }, { status: 400 });
          const commentId = crypto.randomUUID();
          const now = new Date().toISOString();
          await context.env.DB.prepare(
            'INSERT INTO colaboracion_comentarios (id, post_id, usuario_id, texto, created_at) VALUES (?, ?, ?, ?, ?)'
          ).bind(commentId, id, auth, body.texto, now).run();
          return Response.json({ success: true, id: commentId });
        }
        // Create post
        const body = await request.json() as Record<string, unknown>;
        if (!body.titulo || !body.contenido) return Response.json({ error: 'Título y contenido requeridos' }, { status: 400 });
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        await context.env.DB.prepare(
          'INSERT INTO colaboracion_posts (id, usuario_id, titulo, contenido, tipo, nivel, asignatura, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(newId, auth, body.titulo, body.contenido, body.tipo || 'Otro', body.nivel || '', body.asignatura || '', now, now).run();
        return Response.json({ data: { id: newId, ...body } }, { status: 201 });
      }
      case 'DELETE': {
        if (!id) return Response.json({ error: 'Se requiere id' }, { status: 400 });
        await context.env.DB.prepare('DELETE FROM colaboracion_comentarios WHERE post_id = ?').bind(id).run();
        await context.env.DB.prepare('DELETE FROM colaboracion_posts WHERE id = ?').bind(id).run();
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
