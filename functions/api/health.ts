interface Env { DB: D1Database; GEMINI_API_KEY?: string; AI?: unknown }

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  try {
    const row = await context.env.DB.prepare('SELECT COUNT(*) AS total FROM objectives').first<{ total: number }>();
    return Response.json({
      ok: true,
      database: { configured: true, status: 'ok', objectives: Number(row?.total || 0) },
      ai: { configured: Boolean(context.env.GEMINI_API_KEY || context.env.AI), provider: context.env.GEMINI_API_KEY ? 'gemini' : context.env.AI ? 'workers-ai' : 'mock' },
      source: { name: 'Currículum Nacional — MINEDUC Chile', url: 'https://www.curriculumnacional.cl/curriculum' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, database: { configured: false, status: 'error' }, ai: { configured: Boolean(context.env.GEMINI_API_KEY || context.env.AI) }, error: error instanceof Error ? error.message : 'D1 no disponible' }, { status: 503 });
  }
}
