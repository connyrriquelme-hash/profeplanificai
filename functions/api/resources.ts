interface Env {
  DB: D1Database;
}

interface ResourceInput {
  title: string;
  subject: string;
  level: string;
  content: string;
  user_id: string;
}

export async function onRequestGet(context: { env: Env; request: Request }): Promise<Response> {
  try {
    const { env } = context;
    const { results } = await env.DB.prepare(
      `SELECT * FROM resources ORDER BY created_at DESC`
    ).all();
    return Response.json({ data: results });
  } catch (error) {
    return Response.json({ error: 'Error al obtener recursos' }, { status: 500 });
  }
}

export async function onRequestPost(context: { env: Env; request: Request }): Promise<Response> {
  try {
    const { env } = context;
    const body = await request.json<ResourceInput>();

    const { title, subject, level, content, user_id } = body;

    if (!title || !subject || !level || !content || !user_id) {
      return Response.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    const id = crypto.randomUUID();

    await env.DB.prepare(
      `INSERT INTO resources (id, user_id, title, subject, level, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
    ).bind(id, user_id, title, subject, level, content).run();

    const { results } = await env.DB.prepare(
      `SELECT * FROM resources WHERE id = ?`
    ).bind(id).all();

    return Response.json({ data: results[0] }, { status: 201 });
  } catch (error) {
    return Response.json({ error: 'Error al crear recurso' }, { status: 500 });
  }
}