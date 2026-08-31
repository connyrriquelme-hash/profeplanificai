import { getAuthenticatedUserId } from '../../_lib/auth';
import { extractWorkersAIText } from '../../_lib/workersAI';

interface Env {
  JWT_SECRET: string;
  AI?: { run: (model: string, input: unknown) => Promise<unknown> };
  GROQ_API_KEY?: string;
}

interface SlideMutationRequest {
  presentation: Record<string, unknown>;
  instruction: string;
}

const MUTATION_SYSTEM_PROMPT = `Eres un asistente especializado en modificar presentaciones educativas chilenas.

Tu tarea es recibir un JSON de presentación (VisualLessonDeck) y una instrucción del usuario, y devolver el JSON modificado.

REGLAS ESTRICTAS:
1. Devuelve SOLO el JSON modificado, sin explicaciones ni markdown.
2. Mantén toda la estructura intacta (id, title, slides, etc.).
3. Solo modifica lo que el usuario pida explícitamente.
4. Si la instrucción es ambigua, haz la interpretación más razonable para educación chilena.
5. Preserve los campos existentes: layout, palette, visual, bullets, etc.
6. Si piden cambiar colores, usa paletas válidas: violet, indigo, teal, amber, rose, slate, emerald, fuchsia.
7. Si piden cambiar layouts, usa válidos: cover-hero, split-image-right, split-image-left, full-image-overlay, cards-grid, timeline, steps, quote, checklist, reflection.

RESPUESTA esperado: JSON válido del tipo VisualLessonDeck.`;

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    if (!(await getAuthenticatedUserId(context.request, context.env.JWT_SECRET))) {
      return Response.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
    }

    const { presentation, instruction } = await context.request.json() as SlideMutationRequest;

    if (!instruction?.trim()) {
      return Response.json({ error: 'Instrucción requerida' }, { status: 400 });
    }

    if (instruction.length > 5000) {
      return Response.json({ error: 'Instrucción demasiado extensa' }, { status: 413 });
    }

    if (!presentation) {
      return Response.json({ error: 'Presentación requerida' }, { status: 400 });
    }

    if (!context.env.AI && !context.env.GROQ_API_KEY) {
      return Response.json({ error: 'Proveedor de IA no configurado' }, { status: 503 });
    }

    const userPrompt = `Presentación actual:\n${JSON.stringify(presentation, null, 2)}\n\nInstrucción del usuario: ${instruction}\n\nDevuelve el JSON modificado:`;

    // Workers AI primero (gratis, sin dependencia de API key externa),
    // Groq como respaldo. Gemini se sacó de aquí: su llamada directa
    // devolvía 400 INVALID_ARGUMENT de forma consistente en producción.
    let aiResponse = '';

    if (context.env.AI) {
      try {
        const result = await context.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
          messages: [
            { role: 'system', content: MUTATION_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: 4096,
        }) as unknown;
        aiResponse = extractWorkersAIText(result);
      } catch (err) {
        console.error('[mutate-json] Workers AI falló:', err instanceof Error ? err.message : err);
      }
    }

    if (!aiResponse.trim() && context.env.GROQ_API_KEY) {
      try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${context.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: 'openai/gpt-oss-120b',
            messages: [
              { role: 'system', content: MUTATION_SYSTEM_PROMPT },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.4,
            max_tokens: 8000,
          }),
        });
        const data = await r.json() as Record<string, unknown>;
        if (r.ok) {
          const choices = data?.choices as Array<{ message?: { content?: string } }>;
          aiResponse = choices?.[0]?.message?.content || '';
        } else {
          console.error('[mutate-json] Groq falló:', JSON.stringify(data?.error || data).slice(0, 300));
        }
      } catch (err) {
        console.error('[mutate-json] excepción llamando a Groq:', err instanceof Error ? err.message : err);
      }
    }

    if (!aiResponse.trim()) {
      return Response.json({ error: 'Ningún proveedor de IA pudo procesar la instrucción. Intenta de nuevo.' }, { status: 502 });
    }

    // Parse the AI response as JSON
    let updatedPresentation: Record<string, unknown>;
    try {
      // Strip markdown code fences if present
      const cleaned = aiResponse
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```\s*$/, '')
        .trim();
      updatedPresentation = JSON.parse(cleaned) as Record<string, unknown>;
    } catch {
      return Response.json(
        { error: 'La IA no devolvió un JSON válido. Intenta reformular la instrucción.' },
        { status: 422 }
      );
    }

    return Response.json({
      updatedPresentation,
      message: 'Presentación actualizada correctamente.',
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
