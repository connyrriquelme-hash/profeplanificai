export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const { DB } = context.env;
    const activities = await DB.prepare(`
      SELECT ga.id, ga.title, ga.activity_type, ga.duration_minutes, ga.grade_level, ga.subject, ga.created_at, o.code AS objective_code, o.official_text AS objective_text
      FROM generated_activities ga
      LEFT JOIN objectives o ON o.id = ga.objective_id
      ORDER BY ga.created_at DESC
      LIMIT 50
    `).all();
    return Response.json({ data: activities.results });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Error al obtener actividades' }, { status: 500 });
  }
}
