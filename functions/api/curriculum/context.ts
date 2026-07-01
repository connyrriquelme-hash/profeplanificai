interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const objectiveId = url.searchParams.get('objective_id') || '';
  const objectiveCode = url.searchParams.get('objective_code') || '';

  if (!objectiveId && !objectiveCode) {
    return Response.json({ ok: false, error: 'Se requiere objective_id o objective_code' }, { status: 400 });
  }

  const isId = Boolean(objectiveId);
  const whereClause = isId ? 'o.id = ?' : 'o.code = ?';
  const param = isId ? objectiveId : objectiveCode;

  const { results } = await context.env.DB.prepare(`
    SELECT o.id, o.code, o.official_text, o.normalized_text, o.bloom_level, o.axis_id,
           c.name AS course_name, s.name AS subject_name, a.name AS axis_name
    FROM objectives o
    LEFT JOIN courses c ON c.id = o.course_id
    LEFT JOIN subjects s ON s.id = o.subject_id
    LEFT JOIN axes a ON a.id = o.axis_id
    WHERE ${whereClause}
    LIMIT 1
  `).bind(param).all();

  if (results.length === 0) {
    return Response.json({ ok: false, error: 'OA no encontrado en el Currículum Nacional' }, { status: 404 });
  }

  const obj = results[0] as any;

  const indicators = await context.env.DB.prepare(
    `SELECT id, indicator_text AS description FROM curriculum_indicators WHERE oa_code = ? LIMIT 30`
  ).bind(obj.code).all();

  const skills = await context.env.DB.prepare(`
    SELECT sk.id, sk.official_text AS description
    FROM skills sk
    JOIN objective_skills os ON os.skill_id = sk.id
    WHERE os.objective_id = ?
    LIMIT 20
  `).bind(obj.id).all();

  const attitudes = await context.env.DB.prepare(`
    SELECT att.id, att.official_text AS description
    FROM attitudes att
    JOIN objective_attitudes oa ON oa.attitude_id = att.id
    WHERE oa.objective_id = ?
    LIMIT 20
  `).bind(obj.id).all();

  const methodologies = await context.env.DB.prepare(
    `SELECT id, name, description FROM methodologies WHERE status IS NULL OR status = 'active' ORDER BY name LIMIT 8`
  ).all();

  return Response.json({
    ok: true,
    data: {
      objective_id: obj.id,
      objective_code: obj.code,
      objective_description: obj.official_text || obj.normalized_text,
      subject_name: obj.subject_name,
      axis_name: obj.axis_name,
      course_name: obj.course_name,
      indicators: (indicators.results || []).map((i: any) => ({ id: i.id, description: i.description })),
      skills: (skills.results || []).map((s: any) => ({ id: s.id, description: s.description })),
      attitudes: (attitudes.results || []).map((a: any) => ({ id: a.id, description: a.description })),
      methodologies: (methodologies.results || []).map((m: any) => ({ id: m.id, name: m.name, description: m.description })),
    },
    attribution: 'Currículum Nacional — MINEDUC Chile',
  });
}
