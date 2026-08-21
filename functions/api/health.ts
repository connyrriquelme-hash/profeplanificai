interface Env { DB: D1Database; GEMINI_API_KEY?: string; AI?: unknown }

// Ping liviano (lista de modelos, sin generar contenido) para detectar una caida real
// de Gemini y no solo "hay una API key configurada". Timeout corto para que el health
// check no se cuelgue si el proveedor esta lento.
async function checkGeminiReachable(apiKey: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { signal: AbortSignal.timeout(3000) }
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const provider = context.env.GEMINI_API_KEY ? 'gemini' : context.env.AI ? 'workers-ai' : 'mock';
  // Workers AI no tiene un endpoint de ping sin costo; solo confirmamos que el binding existe.
  const reachable = provider === 'gemini' ? await checkGeminiReachable(context.env.GEMINI_API_KEY!) : null;

  // Diagnostico temporal: GEMINI_API_KEY aparece configurado como secret
  // encriptado en el dashboard de Cloudflare (confirmado, entrada unica,
  // sin duplicados) pero context.env.GEMINI_API_KEY sigue leyendose como
  // falsy en produccion. typeof/length no revelan el valor y ayudan a
  // distinguir "el binding nunca llega" (undefined) de "llega vacio"
  // (string, length 0) de "llega con basura invisible" (length > 0 pero
  // sigue sin funcionar contra la API real).
  const geminiDiag = {
    typeofValue: typeof context.env.GEMINI_API_KEY,
    length: typeof context.env.GEMINI_API_KEY === 'string' ? context.env.GEMINI_API_KEY.length : null,
    envKeys: Object.keys(context.env).sort(),
  };

  try {
    const row = await context.env.DB.prepare('SELECT COUNT(*) AS total FROM objectives').first<{ total: number }>();
    return Response.json({
      ok: true,
      database: { configured: true, status: 'ok', objectives: Number(row?.total || 0) },
      ai: { configured: Boolean(context.env.GEMINI_API_KEY || context.env.AI), provider, reachable },
      geminiDiag,
      source: { name: 'Currículum Nacional — MINEDUC Chile', url: 'https://www.curriculumnacional.cl/curriculum' },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ ok: false, database: { configured: false, status: 'error' }, ai: { configured: Boolean(context.env.GEMINI_API_KEY || context.env.AI), provider, reachable }, geminiDiag, error: error instanceof Error ? error.message : 'D1 no disponible' }, { status: 503 });
  }
}
