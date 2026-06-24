interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const { results } = await context.env.DB.prepare(`SELECT c.*, COUNT(o.id) AS objective_count FROM courses c LEFT JOIN objectives o ON o.course_id=c.id GROUP BY c.id ORDER BY c.sort_order,c.name`).all();
  return Response.json({ data: results, attribution: 'Currículum Nacional — MINEDUC Chile' });
}
