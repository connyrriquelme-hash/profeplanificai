interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const course = url.searchParams.get('course');
  const query = course
    ? context.env.DB.prepare(`SELECT s.*,COUNT(o.id) AS objective_count FROM subjects s JOIN objectives o ON o.subject_id=s.id JOIN courses c ON c.id=o.course_id WHERE c.id=? OR c.code=? OR c.name=? GROUP BY s.id ORDER BY s.name`).bind(course, course, course)
    : context.env.DB.prepare(`SELECT s.*,COUNT(o.id) AS objective_count FROM subjects s LEFT JOIN objectives o ON o.subject_id=s.id GROUP BY s.id ORDER BY s.name`);
  const { results } = await query.all();
  return Response.json({ data: results, attribution: 'Currículum Nacional — MINEDUC Chile' });
}
