interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const { results } = await context.env.DB.prepare(
      'SELECT * FROM external_resource_sources ORDER BY is_official DESC, name ASC'
    ).all();
    return Response.json({ data: results });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
