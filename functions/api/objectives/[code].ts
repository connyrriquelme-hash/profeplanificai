interface Env { DB: D1Database }

function parseJson(value: unknown): unknown[] { try { return JSON.parse(String(value || '[]')); } catch { return []; } }

export async function onRequestGet(context: EventContext<Env, string, { code: string }>): Promise<Response> {
  const code = decodeURIComponent(context.params.code).toUpperCase().replace(/\s+/g, ' ');
  const objective = await context.env.DB.prepare(`SELECT o.*,c.code AS course_code,c.name AS course_name,c.cycle,s.name AS subject_name,a.name AS axis_name,u.name AS unit_name FROM objectives o JOIN courses c ON c.id=o.course_id JOIN subjects s ON s.id=o.subject_id LEFT JOIN axes a ON a.id=o.axis_id LEFT JOIN units u ON u.id=o.unit_id WHERE o.code=?`).bind(code).first<any>();
  if (!objective) return Response.json({ error: 'Objetivo no encontrado' }, { status: 404 });
  const [skills, attitudes, resources, questions] = await Promise.all([
    context.env.DB.prepare(`SELECT sk.* FROM skills sk JOIN objective_skills os ON os.skill_id=sk.id WHERE os.objective_id=?`).bind(objective.id).all(),
    context.env.DB.prepare(`SELECT at.* FROM attitudes at JOIN objective_attitudes oa ON oa.attitude_id=at.id WHERE oa.objective_id=?`).bind(objective.id).all(),
    context.env.DB.prepare(`SELECT * FROM resources WHERE objective_id=? ORDER BY title`).bind(objective.id).all(),
    context.env.DB.prepare(`SELECT * FROM questions WHERE objective_id=? ORDER BY title`).bind(objective.id).all(),
  ]);
  return Response.json({ data: { ...objective, skill_tags: parseJson(objective.skill_tags_json), attitude_tags: parseJson(objective.attitude_tags_json), skills: skills.results, attitudes: attitudes.results, resources: resources.results.map((x: any) => ({ ...x, metadata: (() => { try { return JSON.parse(x.metadata_json); } catch { return {}; } })() })), questions: questions.results.map((x: any) => ({ ...x, alternatives: parseJson(x.alternatives_json) })) }, attribution: { name: objective.source_name, url: objective.source_url, note: objective.license_note } });
}
