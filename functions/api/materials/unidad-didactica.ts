import { generateUnidadDidactica, type ObjetivoAprendizajeInput } from '../../core/UnidadDidacticaEngine';
import type { AIEngineEnv } from '../../core/types';
import { METODOLOGIAS_ACTIVAS, type MetodologiaActiva } from '../../../schemas/UnidadDidacticaSchema';
import { getAuthenticatedUserId } from '../../_lib/auth';

interface Env { DB: D1Database; AI?: Ai; JWT_SECRET: string }

interface UnidadDidacticaRequestBody {
  titulo?: string;
  nivel: string;
  metodologiaActiva: string;
  oas: Array<{ subject: string; objective: string }>;
  instructions?: string;
}

// Deriva un código corto de OA a partir del texto libre que hoy escribe
// el docente en UnidadesDidacticasView.tsx (ej. "OA 08: Mostrar que...").
// Si no hay un código reconocible, usa un placeholder posicional — la
// unidad igual se genera, solo pierde la referencia exacta al código MINEDUC.
function deriveOaCode(objective: string, index: number): string {
  const match = objective.match(/^([A-Za-zÁÉÍÓÚáéíóúÑñ0-9]{1,10}\s*OA\s*\d{1,3})/i);
  if (match) return match[1].trim().slice(0, 30);
  return `OA-${index + 1}`;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) {
      return Response.json({ error: 'Sesión inválida o expirada' }, { status: 401 });
    }

    const body = await context.request.json() as UnidadDidacticaRequestBody;

    if (!body.nivel || !body.metodologiaActiva || !Array.isArray(body.oas) || body.oas.length === 0) {
      return Response.json({ error: 'nivel, metodologiaActiva y oas (al menos 1) son requeridos' }, { status: 400 });
    }

    if (!(METODOLOGIAS_ACTIVAS as readonly string[]).includes(body.metodologiaActiva)) {
      return Response.json({
        error: `metodologiaActiva inválida. Valores permitidos: ${METODOLOGIAS_ACTIVAS.join(', ')}`,
      }, { status: 400 });
    }

    // El mock actual (UnidadesDidacticasView.tsx) permite una asignatura
    // distinta por OA (unidad interdisciplinaria); el schema modela una
    // sola `asignatura` para la unidad completa, así que se combinan.
    const asignaturas = [...new Set(body.oas.map((o) => o.subject).filter(Boolean))];
    const asignatura = asignaturas.join(' + ') || 'Interdisciplinario';

    const objetivosAprendizaje: ObjetivoAprendizajeInput[] = body.oas
      .filter((o) => o.objective && o.objective.trim().length > 0)
      .map((o, i) => ({ code: deriveOaCode(o.objective, i), text: o.objective.trim() }));

    if (objetivosAprendizaje.length === 0) {
      return Response.json({ error: 'Al menos un OA debe tener texto de objetivo' }, { status: 400 });
    }

    const unidad = await generateUnidadDidactica(
      { AI: context.env.AI } as AIEngineEnv,
      {
        nivel: body.nivel,
        asignatura,
        metodologiaActiva: body.metodologiaActiva as MetodologiaActiva,
        objetivosAprendizaje,
        temaSugerido: body.titulo || body.instructions,
      },
    );

    const id = `unidad_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    await context.env.DB.prepare(
      `INSERT INTO unidades_didacticas (id, user_id, titulo, nivel, asignatura, metodologia_activa, clase_count, content_json, ai_model, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    ).bind(
      id,
      userId,
      unidad.titulo,
      unidad.nivel,
      unidad.asignatura,
      unidad.metodologiaActiva,
      unidad.clases.length,
      JSON.stringify(unidad),
      '@cf/meta/llama-3.2-3b-instruct',
    ).run();

    return Response.json({ ok: true, id, unidad });
  } catch (err: unknown) {
    return Response.json({
      error: 'Error al generar unidad didáctica',
      details: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
