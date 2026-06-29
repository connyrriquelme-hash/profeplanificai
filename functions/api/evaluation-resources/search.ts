interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const course = url.searchParams.get('course') || '';
  const subject = url.searchParams.get('subject') || '';
  const objectiveCode = url.searchParams.get('objectiveCode') || '';
  const skill = url.searchParams.get('skill') || '';
  const evaluationType = url.searchParams.get('evaluationType') || '';
  const sourceId = url.searchParams.get('source') || '';
  const accessType = url.searchParams.get('accessType') || '';
  const validationStatus = url.searchParams.get('validationStatus') || '';
  const q = url.searchParams.get('q') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
  const offset = parseInt(url.searchParams.get('offset') || '0');

  try {
    let sql = `SELECT erl.*, ers.name AS source_name, ers.base_url AS source_base_url, ers.source_type AS source_source_type
               FROM evaluation_resource_links erl
               LEFT JOIN external_resource_sources ers ON ers.id = erl.source_id
               WHERE 1=1`;
    const binds: unknown[] = [];

    if (course) { sql += ' AND erl.course = ?'; binds.push(course); }
    if (subject) { sql += ' AND erl.subject = ?'; binds.push(subject); }
    if (objectiveCode) { sql += ' AND erl.objective_code = ?'; binds.push(objectiveCode); }
    if (skill) { sql += ' AND erl.skill = ?'; binds.push(skill); }
    if (evaluationType) { sql += ' AND erl.evaluation_type = ?'; binds.push(evaluationType); }
    if (sourceId) { sql += ' AND erl.source_id = ?'; binds.push(sourceId); }
    if (accessType) { sql += ' AND erl.access_type = ?'; binds.push(accessType); }
    if (validationStatus) { sql += ' AND erl.validation_status = ?'; binds.push(validationStatus); }
    if (q) { sql += ' AND (erl.title LIKE ? OR erl.description LIKE ? OR erl.tags_json LIKE ?)'; const p = `%${q}%`; binds.push(p, p, p); }

    sql += ' ORDER BY ers.is_official DESC, erl.created_at DESC LIMIT ? OFFSET ?';
    binds.push(limit, offset);

    const { results } = await context.env.DB.prepare(sql).bind(...binds).all();
    return Response.json({ data: results });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : 'Error interno' }, { status: 500 });
  }
}
