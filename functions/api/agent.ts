import { getAuthenticatedUserId } from '../_lib/auth';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  GEMINI_API_KEY: string;
}

const SYSTEM = `Eres Planifica, agente pedagógico para docentes de Chile. Trabajas con el Currículum Nacional,
DUA, Decreto 67, evaluación formativa y lenguaje profesional chileno. Tu respuesta debe ser práctica,
lista para usar, inclusiva y dejar explícitos OA, evidencia de aprendizaje, apoyos y criterios de logro.
No inventes códigos OA: si el usuario no entrega el código exacto, indícalo como pendiente de validación.
Usa Markdown claro. No afirmes que ejecutaste acciones externas que no hayas ejecutado.`;

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) return Response.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
    if (!context.env.GEMINI_API_KEY) return Response.json({ error: 'El agente IA aún no tiene una clave de servidor configurada' }, { status: 503 });

    const body = await context.request.json() as {
      message?: string;
      mode?: 'chat' | 'secuencia' | 'unidad' | 'diferenciacion' | 'evaluacion';
      context?: { nivel?: string; asignatura?: string; oa?: string };
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    };
    const message = body.message?.trim();
    if (!message) return Response.json({ error: 'Escribe una solicitud para el agente' }, { status: 400 });
    if (message.length > 12000) return Response.json({ error: 'La solicitud es demasiado extensa' }, { status: 413 });

    const ctx = body.context || {};
    const mode = body.mode || 'chat';
    const modeInstructions: Record<string, string> = {
      chat: 'Responde y propone el siguiente paso útil.',
      secuencia: 'Crea una secuencia de 3 clases conectadas con inicio, desarrollo, cierre y evidencia por clase.',
      unidad: 'Crea una miniunidad completa: propósito, progresión, clases, recursos, evaluación y diferenciación.',
      diferenciacion: 'Genera tres versiones: apoyo, estándar y desafío, manteniendo el mismo objetivo.',
      evaluacion: 'Diseña evaluación, tabla de especificaciones, pauta, rúbrica y retroalimentación por error frecuente.',
    };
    const contextLine = `Nivel: ${ctx.nivel || 'no indicado'} | Asignatura: ${ctx.asignatura || 'no indicada'} | OA: ${ctx.oa || 'pendiente'}`;
    const history = (body.history || []).slice(-8).map(x => ({
      role: x.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: x.content.slice(0, 6000) }],
    }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(context.env.GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [...history, { role: 'user', parts: [{ text: `${modeInstructions[mode]}\n${contextLine}\n\nSolicitud:\n${message}` }] }],
          generationConfig: { temperature: 0.55, maxOutputTokens: 5000 },
        }),
      },
    );
    const data = await response.json() as any;
    if (!response.ok) return Response.json({ error: data?.error?.message || 'Gemini no respondió' }, { status: 502 });
    const content = (data?.candidates?.[0]?.content?.parts || []).map((part: any) => part.text || '').join('\n').trim();
    if (!content) return Response.json({ error: 'El agente devolvió una respuesta vacía' }, { status: 502 });

    return Response.json({ content, mode, userId });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Error interno del agente' }, { status: 500 });
  }
}
