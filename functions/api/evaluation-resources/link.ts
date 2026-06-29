interface Env { DB: D1Database }

function getUserId(context: EventContext<Env>): string | null {
  const auth = context.request.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    const payload = JSON.parse(atob(auth.slice(7).split('.')[1]));
    return payload.sub || null;
  } catch { return null; }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const auth = getUserId(context);
  if (!auth) return Response.json({ error: 'No autorizado' }, { status: 401 });

  try {
    const body = await context.request.json() as Record<string, unknown>;
    const sourceId = String(body.sourceId || body.source_id || '');
    if (!sourceId) return Response.json({ error: 'sourceId es obligatorio' }, { status: 400 });
    if (!body.title) return Response.json({ error: 'title es obligatorio' }, { status: 400 });

    const newId = crypto.randomUUID();
    const now = new Date().toISOString();

    await context.env.DB.prepare(
      `INSERT INTO evaluation_resource_links
       (id, source_id, title, description, url, resource_type, subject, course,
        objective_code, skill, evaluation_type, tags_json, access_type, license_note,
        validation_status, user_id, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      newId,
      sourceId,
      body.title,
      String(body.description || ''),
      String(body.url || ''),
      String(body.resourceType || body.resource_type || 'recurso'),
      String(body.subject || ''),
      String(body.course || ''),
      String(body.objectiveCode || body.objective_code || ''),
      String(body.skill || ''),
      String(body.evaluationType || body.evaluation_type || ''),
      JSON.stringify(body.tags || []),
      String(body.accessType || body.access_type || 'unknown'),
      String(body.licenseNote || body.license_note || ''),
      'pending',
      auth,
      String(body.notes || ''),
      now,
      now
    ).run();

    return Response.json({ data: { id: newId } }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
