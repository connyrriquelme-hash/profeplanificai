interface Env { DB: D1Database; CORE_DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const { results } = await context.env.DB.prepare(`SELECT c.*, COUNT(o.id) AS objective_count FROM courses c LEFT JOIN objectives o ON o.course_id=c.id GROUP BY c.id ORDER BY c.sort_order,c.name`).all();

  const hasData = results.length > 0 && results.some((r: any) => (r.objective_count || 0) > 0);
  if (hasData) {
    return Response.json({ data: results, attribution: 'Currículum Nacional — MINEDUC Chile' });
  }

  try {
    const coreResults = await context.env.CORE_DB.prepare(`
      SELECT n.id, n.nombre AS name, n.nombre AS code,
             CASE
               WHEN n.id LIKE '%basico%' THEN 'Educación Básica'
               WHEN n.id LIKE '%medio%' THEN 'Educación Media'
               ELSE 'Educación Parvularia'
             END AS cycle,
             0 AS sort_order,
             COUNT(DISTINCT oa.id) AS objective_count
      FROM niveles n
      LEFT JOIN asignaturas a ON a.nivel_id = n.id
      LEFT JOIN unidades u ON u.asignatura_id = a.id
      LEFT JOIN objetivos_aprendizaje oa ON oa.unidad_id = u.id
      GROUP BY n.id
      ORDER BY n.id
    `).all();
    if (coreResults.results.length > 0) {
      return Response.json({ data: coreResults.results, attribution: 'Currículum Nacional — MINEDUC Chile (Core DB)' });
    }
  } catch {}

  return Response.json({ data: results, attribution: 'Currículum Nacional — MINEDUC Chile' });
}
