interface Env { DB: D1Database }

function unwrapD1(response: any): any[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.results)) return response.results;
  if (Array.isArray(response?.data?.results)) return response.data.results;
  if (Array.isArray(response?.data)) return response.data;
  return [];
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const objectiveId = url.searchParams.get('objective_id') || '';
  const objectiveCode = url.searchParams.get('objective_code') || '';
  const subject = url.searchParams.get('subject') || '';
  const level = url.searchParams.get('level') || '';
  const course = url.searchParams.get('course') || '';
  const include = url.searchParams.get('include') || '';

  try {
    let raw: any;

    if (objectiveId || objectiveCode) {
      const oid = objectiveId || objectiveCode;

      const linkedSkills = await context.env.DB.prepare(`
        SELECT DISTINCT cs.id, cs.code, cs.name as title, cs.description,
               cs.nivel_desde as levelRange, cs.actividades_principales_json as activities,
               cs.source_type as source, h.id as unidad_id, h.nombre as unidad_nombre,
               h.descripcion as unidad_descripcion, h.unidad_numero, h.keywords_json
        FROM curricular_skills cs
        JOIN habilidades h ON h.curricular_skill_id = cs.id
        JOIN oa_habilidades_curriculares oac ON oac.habilidad_id = h.id
        WHERE oac.objetivo_id = ?
        ORDER BY cs.code, h.unidad_numero
      `).bind(oid).all();

      const results = unwrapD1(linkedSkills);

      if (results.length > 0) {
        return Response.json({
          ok: true,
          data: results,
          count: results.length,
          source: 'curricular_skills_linked',
        });
      }

      const obj = await context.env.DB.prepare(
        'SELECT nivel, asignatura FROM objetivos_aprendizaje WHERE id = ? OR codigo = ?'
      ).bind(oid, oid).first<{ nivel: string; asignatura: string }>();

      if (obj) {
        raw = await context.env.DB.prepare(`
          SELECT sk.id, sk.code, sk.official_text, sk.subject_id
          FROM skills sk
          JOIN objective_skills os ON os.skill_id = sk.id
          WHERE os.objective_id = ?
          ORDER BY sk.code
        `).bind(oid).all();
      } else {
        raw = { results: [] };
      }
    } else if (level && subject) {
      raw = await context.env.DB.prepare(`
        SELECT cs.id, cs.code, cs.name as title, cs.description,
               cs.nivel_desde as levelRange, cs.actividades_principales_json as activities,
               cs.source_type as source
        FROM curricular_skills cs
        WHERE cs.nivel_desde <= ? AND cs.nivel_hasta >= ?
        ORDER BY cs.code
      `).bind(level, level).all();
    } else if (subject) {
      raw = await context.env.DB.prepare(`
        SELECT sk.id, sk.code, sk.official_text, sk.subject_id
        FROM skills sk
        JOIN subjects s ON s.id = sk.subject_id
        WHERE s.name = ? OR s.normalized_name = ? OR s.id = ?
        ORDER BY sk.code
      `).bind(subject, subject.toLowerCase().replace(/\s+/g, '-'), subject).all();
    } else if (course) {
      raw = await context.env.DB.prepare(`
        SELECT DISTINCT sk.id, sk.code, sk.official_text, sk.subject_id
        FROM skills sk
        JOIN objective_skills os ON os.skill_id = sk.id
        JOIN objectives o ON o.id = os.objective_id
        JOIN courses c ON c.id = o.course_id
        WHERE c.code = ? OR c.name = ?
        ORDER BY sk.code
      `).bind(course, course).all();
    } else {
      raw = await context.env.DB.prepare(`
        SELECT id, code, name as title, description, nivel_desde as levelRange,
               actividades_principales_json as activities, source_type as source
        FROM curricular_skills
        ORDER BY code
      `).all();
    }

    const results = unwrapD1(raw);

    return Response.json({
      ok: true,
      data: results,
      count: results.length,
      source: 'D1',
      message: results.length === 0 ? 'No hay habilidades curriculares vinculadas' : undefined,
    });
  } catch (err: any) {
    return Response.json({ ok: false, error: err.message, data: [], count: 0 }, { status: 500 });
  }
}
