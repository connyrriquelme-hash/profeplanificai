import { getAuthenticatedUserId } from '../../_lib/auth';

interface Env {
  JWT_SECRET: string;
  GEMINI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
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

    // Try Gemini first, fallback to OpenRouter
    const provider = context.env.GEMINI_API_KEY ? 'gemini' : 'openrouter';
    const apiKey = provider === 'gemini' ? context.env.GEMINI_API_KEY : context.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return Response.json({ error: 'Proveedor de IA no configurado' }, { status: 503 });
    }

    const userPrompt = `Presentación actual:\n${JSON.stringify(presentation, null, 2)}\n\nInstrucción del usuario: ${instruction}\n\nDevuelve el JSON modificado:`;

    let aiResponse: string;

    if (provider === 'gemini') {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: MUTATION_SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: { temperature: 0.4, maxOutputTokens: 8000 },
          }),
        }
      );
      const data = await r.json() as Record<string, unknown>;
      if (!r.ok) {
        const err = data?.error as Record<string, unknown> | undefined;
        return Response.json({ error: err?.message || 'Error Gemini' }, { status: 502 });
      }
      const candidates = data?.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      aiResponse = (candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('\n');
    } else {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'openrouter/auto',
          messages: [
            { role: 'system', content: MUTATION_SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: 8000,
        }),
      });
      const data = await r.json() as Record<string, unknown>;
      if (!r.ok) {
        const err = data?.error as Record<string, unknown> | undefined;
        return Response.json({ error: err?.message || 'Error del proveedor' }, { status: 502 });
      }
      const choices = data?.choices as Array<{ message?: { content?: string } }>;
      aiResponse = choices?.[0]?.message?.content || '';
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
