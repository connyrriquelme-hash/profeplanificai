export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const { DB } = context.env;
    const id = context.params.id as string;
    const activity = await DB.prepare(`
      SELECT ga.*, o.code AS objective_code, o.official_text AS objective_text, o.source_url
      FROM generated_activities ga
      LEFT JOIN objectives o ON o.id = ga.objective_id
      WHERE ga.id = ?
    `).bind(id).first<any>();
    if (!activity) return Response.json({ error: 'Actividad no encontrada' }, { status: 404 });
    let result: any = null;
    try { result = JSON.parse(activity.result_json); } catch { result = activity.result_json; }
    return Response.json({ data: { ...activity, result_json: undefined, result } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Error al obtener actividad' }, { status: 500 });
  }
}
