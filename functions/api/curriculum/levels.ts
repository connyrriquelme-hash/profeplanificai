interface Env { DB: D1Database }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, code, name, cycle, sort_order FROM courses ORDER BY sort_order ASC, name ASC`
    ).all();

    return Response.json({ data: results, attribution: 'Currículum Nacional — MINEDUC Chile' });
  } catch (err: any) {
    return Response.json({ error: 'Error al cargar niveles', details: err.message }, { status: 500 });
  }
}
