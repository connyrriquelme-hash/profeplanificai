interface Env {
  DB: D1Database;
}

export async function onRequest(context: EventContext<Env>): Promise<Response> {
  const auth = getUserId(context);
  const { request } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const method = request.method;

  await ensureTable(context.env.DB);

  try {
    switch (method) {
      case 'GET': {
        if (id) {
          const resource = await context.env.DB.prepare(
            'SELECT * FROM resources WHERE id = ?'
          ).bind(id).first();
          return Response.json({ data: resource ?? null });
        }
        const { results } = await context.env.DB.prepare(
          'SELECT * FROM resources ORDER BY id DESC'
        ).all();
        return Response.json({ data: results });
      }

      case 'POST': {
        const body = await request.json() as Record<string, unknown>;
        const content = (body.content as string || '').trim();
        if (!content) {
          return Response.json({ error: 'El contenido es obligatorio' }, { status: 400 });
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const userId = auth || body.user_id || 'anonymous';

        const title = (body.title as string || 'Planificación sin título').trim();
        const resourceType = (body.type as string || body.tipoRecurso as string || 'planificacion').trim();
        const source = (body.source as string || 'workspace').trim();
        const level = (body.level as string || body.nivel as string || '').trim();
        const subject = (body.subject as string || body.asignatura as string || '').trim();
        const objectiveCode = (body.objectiveCode as string || body.oa_id as string || '').trim();
        const objectiveText = (body.objectiveText as string || body.oa as string || body.objectiveText as string || '').trim();
        const skill = (body.skill as string || body.habilidad as string || '').trim();

        let metadataJson = '{}';
        if (body.metadata) {
          metadataJson = JSON.stringify(body.metadata);
        } else {
          const meta: Record<string, string> = {};
          if (level) meta.level = level;
          if (subject) meta.subject = subject;
          if (objectiveCode) meta.objectiveCode = objectiveCode;
          if (objectiveText) meta.objectiveText = objectiveText;
          if (skill) meta.skill = skill;
          if (Object.keys(meta).length > 0) metadataJson = JSON.stringify(meta);
        }

        await context.env.DB.prepare(
          `INSERT INTO resources (id, user_id, title, type, source, content, level, subject,
            objective_code, objective_text, skill, metadata_json, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).bind(id, userId, title, resourceType, source, content, level, subject,
          objectiveCode, objectiveText, skill, metadataJson, now, now).run();

        const { results } = await context.env.DB.prepare(
          'SELECT * FROM resources WHERE id = ?'
        ).bind(id).all();

        return Response.json({ data: results[0] }, { status: 201 });
      }

      case 'DELETE': {
        if (!id) return Response.json({ error: 'Se requiere id' }, { status: 400 });
        await context.env.DB.prepare('DELETE FROM resources WHERE id = ?').bind(id).run();
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

async function ensureTable(db: D1Database): Promise<void> {
  try {
    await db.prepare(
      `CREATE TABLE IF NOT EXISTS resources (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL DEFAULT '',
        title TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'recurso',
        source TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        level TEXT NOT NULL DEFAULT '',
        subject TEXT NOT NULL DEFAULT '',
        objective_code TEXT NOT NULL DEFAULT '',
        objective_text TEXT NOT NULL DEFAULT '',
        skill TEXT NOT NULL DEFAULT '',
        metadata_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`
    ).run();
  } catch { /* table already exists */ }
}
