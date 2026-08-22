import { AIEngine } from '../../core/AIEngine';
import { getAuthenticatedUserId } from '../../_lib/auth';
import { validatePedagogicalProduct } from '../../_lib/pedagogicalQualityGate';
import type { AIEngineEnv, PedagogicalPlan } from '../../core/types';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  AI?: Ai;
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
}

interface DuaGuideRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  topic: string;
}

// Producto "Guía DUA" de Flujo Docente -- mismo AIEngine.generateDuaGuide()
// que ya usan Project Copilot/Guía DUA (Multinivel) via generate-project.ts,
// pero como endpoint MaterialRequest-based independiente (sin generar
// también una planificación, que ese flujo hace y este no necesita).
export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as DuaGuideRequest;
    const userId = context.env.JWT_SECRET ? await getAuthenticatedUserId(context.request, context.env.JWT_SECRET) : null;

    if (!body.level || !body.subject || !body.objectiveCode) {
      return Response.json({ error: 'level, subject y objectiveCode son requeridos' }, { status: 400 });
    }

    const skills = [...(body.skills || [])].filter(Boolean);
    const plan: PedagogicalPlan = {
      tema: body.topic || body.objectiveText,
      curso: body.level,
      asignatura: body.subject,
      objetivo_aprendizaje: `${body.objectiveCode}: ${body.objectiveText}`,
      habilidades: skills.length ? skills.join(', ') : 'Comprender y aplicar',
      taxonomia_bloom_sugerida: 'Comprender y Aplicar',
      ...(body.indicators?.length ? { indicadores_seleccionados: body.indicators } : {}),
      estructura_clase: {
        inicio: { tiempo_minutos: 15, descripcion: `Activar conocimientos previos sobre ${body.topic || body.objectiveText}.` },
        desarrollo: { tiempo_minutos: 60, descripcion: `Desarrollar actividades guiadas sobre ${body.objectiveCode}: ${body.objectiveText}.` },
        cierre: { tiempo_minutos: 15, descripcion: 'Sintetizar los aprendizajes de la clase.' },
      },
    };

    const duaGuide = await AIEngine.generateDuaGuide(
      { AI: context.env.AI, GEMINI_API_KEY: context.env.GEMINI_API_KEY, GROQ_API_KEY: context.env.GROQ_API_KEY } as AIEngineEnv,
      plan,
    );

    const quality = validatePedagogicalProduct(duaGuide, {
      objectiveCode: body.objectiveCode,
      objectiveText: body.objectiveText,
      productType: 'guia_dua',
    });

    const resourceId = `dua_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await context.env.DB.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, user_id, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, 'guia_dua', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      duaGuide.titulo_guia || `Guía DUA: ${body.objectiveCode}`,
      JSON.stringify(duaGuide),
      JSON.stringify({ topic: body.topic }),
      body.level,
      body.subject,
      body.objectiveCode,
      userId,
      JSON.stringify(body.indicators || []),
      JSON.stringify(body.skills || []),
      `Guía DUA generada para ${body.objectiveCode}`
    ).run();

    return Response.json({ ok: true, resourceId, duaGuide, quality });
  } catch (err) {
    return Response.json({ error: 'Error al generar guía DUA', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
