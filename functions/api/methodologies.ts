interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const subjectId = url.searchParams.get('subject_id');
    const levelId = url.searchParams.get('level_id');

    let query = `SELECT m.*, 
      (SELECT COUNT(*) FROM methodology_subject_fit msf WHERE msf.methodology_id = m.id) as subject_fits
      FROM methodologies m WHERE 1=1`;
    const params: any[] = [];

    if (subjectId) {
      query += ` AND m.id IN (SELECT msf.methodology_id FROM methodology_subject_fit msf WHERE msf.subject_id = ?)`;
      params.push(subjectId);
    }

    query += ` ORDER BY m.name ASC`;

    const { results } = await context.env.DB.prepare(query).bind(...params).all();

    return Response.json({ data: results });
  } catch (err: any) {
    return Response.json({ error: 'Error al cargar metodologías', details: err.message }, { status: 500 });
  }
}
