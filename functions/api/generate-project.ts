import { AIEngine } from '../core/AIEngine';
import { PedagogicalEngine } from '../core/PedagogicalEngine';
import type { AIEngineEnv, PedagogicalEngineEnv } from '../core/types';

interface GenerateProjectEnv extends PedagogicalEngineEnv, AIEngineEnv {}

interface GenerateProjectRequest {
  nivel?: string;
  asignatura?: string;
  tema?: string;
  objectiveId?: string;
  objectiveCode?: string;
  objectiveText?: string;
  indicators?: string[];
  skills?: string[];
  criteria?: string[];
  curricularSkills?: string[];
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

export async function onRequestPost(context: EventContext<GenerateProjectEnv>): Promise<Response> {
  try {
    const body = await context.request.json<GenerateProjectRequest>();
    const nivel = String(body.nivel || '').trim();
    const asignatura = String(body.asignatura || '').trim();
    const tema = String(body.tema || '').trim();

    if (!nivel || !asignatura || !tema) {
      return jsonResponse({ ok: false, error: 'nivel, asignatura y tema son obligatorios.' }, 400);
    }

    const selectedObjectiveCode = String(body.objectiveCode || '').trim();

    if (!selectedObjectiveCode) {
      return jsonResponse({ ok: false, error: 'Selecciona un objetivo de aprendizaje antes de generar' }, 400);
    }

    const curriculumContext = {
      objectiveId: String(body.objectiveId || '').trim(),
      objectiveCode: selectedObjectiveCode,
      objectiveText: String(body.objectiveText || '').trim(),
      indicators: Array.isArray(body.indicators) ? body.indicators.filter(Boolean) : [],
      skills: Array.isArray(body.skills) ? body.skills.filter(Boolean) : [],
      criteria: Array.isArray(body.criteria) ? body.criteria.filter(Boolean) : [],
      curricularSkills: Array.isArray(body.curricularSkills) ? body.curricularSkills.filter(Boolean) : [],
    };

    const plan = await PedagogicalEngine.buildPlan(context.env, nivel, asignatura, tema, curriculumContext);
    const duaGuide = await AIEngine.generateDuaGuide(context.env, plan);

    return jsonResponse({
      ok: true,
      plan,
      duaGuide,
      data: {
        ...plan,
        ...duaGuide,
      },
    });
  } catch (error) {
    console.error('[generate-project] Error:', error);
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('No se encontró OA') || message.includes('No se encontró el OA seleccionado')) {
      return jsonResponse({ ok: false, error: 'No se encontró un objetivo de aprendizaje para los parámetros indicados.' }, 404);
    }

    if (message.includes('CORE_DB') || message.includes('AI no está configurado')) {
      return jsonResponse({ ok: false, error: 'Error de configuración del servidor.' }, 500);
    }

    return jsonResponse({ ok: false, error: 'No se pudo generar el proyecto pedagógico.' }, 500);
  }
}

export async function onRequest(): Promise<Response> {
  return jsonResponse({ ok: false, error: 'Método no permitido. Use POST.' }, 405);
}
