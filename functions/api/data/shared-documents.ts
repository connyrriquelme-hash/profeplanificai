interface Env {
  DB: D1Database;
}

export async function onRequest(context: EventContext<Env>): Promise<Response> {
  const auth = getUserId(context);
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const token = url.searchParams.get('token');
  const action = url.searchParams.get('action');
  const method = request.method;

  try {
    switch (method) {
      case 'GET': {
        if (token) {
          const doc = await context.env.DB.prepare(
            'SELECT * FROM shared_documents WHERE share_token = ?'
          ).bind(token).first() as Record<string, unknown> | null;
          if (!doc) return Response.json({ error: 'Documento no encontrado' }, { status: 404 });
          if (doc.visibility === 'private' && (!auth || doc.owner_user_id !== auth)) {
            return Response.json({ error: 'Documento no encontrado' }, { status: 404 });
          }
          const comments = await context.env.DB.prepare(
            'SELECT * FROM shared_document_comments WHERE document_id = ? ORDER BY created_at ASC'
          ).bind(doc.id).all();
          return Response.json({ data: { ...doc, comments: comments.results ?? [] } });
        }
        if (!auth) return Response.json({ error: 'No autorizado' }, { status: 401 });
        if (id) {
          const doc = await context.env.DB.prepare(
            'SELECT * FROM shared_documents WHERE id = ? AND owner_user_id = ?'
          ).bind(id, auth).first() as Record<string, unknown> | null;
          if (!doc) return Response.json({ data: null }, { status: 404 });
          const comments = await context.env.DB.prepare(
            'SELECT * FROM shared_document_comments WHERE document_id = ? ORDER BY created_at ASC'
          ).bind(id).all();
          return Response.json({ data: { ...doc, comments: comments.results ?? [] } });
        }
        const { results } = await context.env.DB.prepare(
          'SELECT * FROM shared_documents WHERE owner_user_id = ? ORDER BY created_at DESC'
        ).bind(auth).all();
        return Response.json({ data: results });
      }

      case 'POST': {
        if (id && action === 'comment') {
          const body = await request.json() as { comment?: string; authorName?: string };
          if (!body.comment) return Response.json({ error: 'Comentario requerido' }, { status: 400 });
          if (!auth && token) {
            const doc = await context.env.DB.prepare(
              'SELECT id FROM shared_documents WHERE share_token = ?'
            ).bind(token).first() as Record<string, unknown> | null;
            if (!doc) return Response.json({ error: 'Documento no encontrado' }, { status: 404 });
            if (doc.id !== id) return Response.json({ error: 'Token no coincide con el documento' }, { status: 403 });
          } else if (!auth) {
            return Response.json({ error: 'No autorizado' }, { status: 401 });
          }
          const commentId = crypto.randomUUID();
          const now = new Date().toISOString();
          await context.env.DB.prepare(
            'INSERT INTO shared_document_comments (id, document_id, user_id, author_name, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)'
          ).bind(commentId, id, auth || '', body.authorName || '', body.comment, now).run();
          return Response.json({ success: true, id: commentId });
        }

        if (id && action === 'share') {
          if (!auth) return Response.json({ error: 'No autorizado' }, { status: 401 });
          const shareToken = crypto.randomUUID().replace(/-/g, '');
          await context.env.DB.prepare(
            'UPDATE shared_documents SET share_token = ?, visibility = ?, updated_at = ? WHERE id = ? AND owner_user_id = ?'
          ).bind(shareToken, 'shared', new Date().toISOString(), id, auth).run();
          return Response.json({ shareToken });
        }

        if (!auth) return Response.json({ error: 'No autorizado' }, { status: 401 });
        const body = await request.json() as Record<string, unknown>;
        const newId = crypto.randomUUID();
        const existingToken = typeof body.shareToken === 'string' && body.shareToken ? body.shareToken : null;
        const shareToken = existingToken || crypto.randomUUID().replace(/-/g, '');
        const now = new Date().toISOString();
        await context.env.DB.prepare(
          `INSERT INTO shared_documents (id, owner_user_id, owner_name, title, content, source_type, source_id,
            share_token, visibility, permission, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(
          newId, auth,
          body.ownerName || '',
          body.title || '',
          body.content || '',
          body.sourceType || '',
          body.sourceId || '',
          shareToken,
          body.visibility || 'shared',
          body.permission || 'view',
          now, now
        ).run();
        return Response.json({ data: { id: newId, shareToken, ...body, owner_user_id: auth } }, { status: 201 });
      }

      case 'PATCH': {
        if (!auth) return Response.json({ error: 'No autorizado' }, { status: 401 });
        if (!id && token) {
          const doc = await context.env.DB.prepare(
            'SELECT id, permission FROM shared_documents WHERE share_token = ?'
          ).bind(token).first() as Record<string, unknown> | null;
          if (!doc) return Response.json({ error: 'Documento no encontrado' }, { status: 404 });
          if (doc.permission !== 'edit') return Response.json({ error: 'No tienes permisos de edición' }, { status: 403 });
          const body = await request.json() as { content?: string };
          const now = new Date().toISOString();
          await context.env.DB.prepare(
            'UPDATE shared_documents SET content = ?, updated_at = ? WHERE id = ?'
          ).bind(body.content || '', now, doc.id).run();
          return Response.json({ success: true });
        }
        if (!id) return Response.json({ error: 'Se requiere id' }, { status: 400 });
        const body = await request.json() as { title?: string; content?: string };
        const now = new Date().toISOString();
        const updates: string[] = [];
        const values: unknown[] = [];

        if (body.title !== undefined) { updates.push('title = ?'); values.push(body.title); }
        if (body.content !== undefined) { updates.push('content = ?'); values.push(body.content); }
        updates.push('updated_at = ?');
        values.push(now);
        values.push(id);
        values.push(auth);

        await context.env.DB.prepare(
          `UPDATE shared_documents SET ${updates.join(', ')} WHERE id = ? AND owner_user_id = ?`
        ).bind(...values).run();
        return Response.json({ success: true });
      }

      case 'DELETE': {
        if (!auth) return Response.json({ error: 'No autorizado' }, { status: 401 });
        if (!id) return Response.json({ error: 'Se requiere id' }, { status: 400 });
        await context.env.DB.prepare('DELETE FROM shared_document_comments WHERE document_id = ?').bind(id).run();
        await context.env.DB.prepare('DELETE FROM shared_document_versions WHERE document_id = ?').bind(id).run();
        await context.env.DB.prepare('DELETE FROM shared_document_collaborators WHERE document_id = ?').bind(id).run();
        await context.env.DB.prepare('DELETE FROM shared_documents WHERE id = ? AND owner_user_id = ?').bind(id, auth).run();
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
