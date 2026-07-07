interface Env { DB: D1Database; CORE_DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const course = url.searchParams.get('course');

  let results: any[] = [];
  if (course) {
    const { results: r } = await context.env.DB.prepare(
      `SELECT s.*, COUNT(o.id) AS objective_count FROM subjects s JOIN objectives o ON o.subject_id=s.id JOIN courses c ON c.id=o.course_id WHERE c.id=? OR c.code=? OR c.name=? GROUP BY s.id ORDER BY s.name`
    ).bind(course, course, course).all();
    results = r;
  } else {
    const { results: r } = await context.env.DB.prepare(
      `SELECT s.*, COUNT(o.id) AS objective_count FROM subjects s LEFT JOIN objectives o ON o.subject_id=s.id GROUP BY s.id ORDER BY s.name`
    ).all();
    results = r;
  }

  const hasData = results.length > 0;
  if (hasData) {
    return Response.json({ data: results, attribution: 'Currículum Nacional — MINEDUC Chile' });
  }

  try {
    if (course) {
      const nivelId = course.replace(/^course-/, '').replace(/(\d)[bB]/, '$1-basico').replace(/(\d)[mM]/, '$1-medio');
      const { results: coreResults } = await context.env.CORE_DB.prepare(`
        SELECT a.id, a.nombre AS name, a.nivel_id AS normalized_name,
               COUNT(DISTINCT oa.id) AS objective_count
        FROM asignaturas a
        JOIN unidades u ON u.asignatura_id = a.id
        JOIN objetivos_aprendizaje oa ON oa.unidad_id = u.id
        WHERE a.nivel_id = ? OR a.nivel_id LIKE ? OR a.nivel_id LIKE ?
        GROUP BY a.id ORDER BY a.nombre
      `).bind(course, nivelId, `%${nivelId}%`).all();
      if (coreResults.length > 0) {
        return Response.json({ data: coreResults, attribution: 'Currículum Nacional — MINEDUC Chile (Core DB)' });
      }
    } else {
      const { results: coreResults } = await context.env.CORE_DB.prepare(`
        SELECT a.id, a.nombre AS name, a.nivel_id AS normalized_name,
               COUNT(DISTINCT oa.id) AS objective_count
        FROM asignaturas a
        LEFT JOIN unidades u ON u.asignatura_id = a.id
        LEFT JOIN objetivos_aprendizaje oa ON oa.unidad_id = u.id
        GROUP BY a.id ORDER BY a.nombre
      `).all();
      if (coreResults.length > 0) {
        return Response.json({ data: coreResults, attribution: 'Currículum Nacional — MINEDUC Chile (Core DB)' });
      }
    }
  } catch {}

  return Response.json({ data: results, attribution: 'Currículum Nacional — MINEDUC Chile' });
}
