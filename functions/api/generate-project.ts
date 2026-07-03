import { AIEngine } from '../core/AIEngine';
import { PedagogicalEngine } from '../core/PedagogicalEngine';
import type { AIEngineEnv, PedagogicalEngineEnv } from '../core/types';

interface GenerateProjectEnv extends PedagogicalEngineEnv, AIEngineEnv {}

interface GenerateProjectRequest {
  nivel?: string;
  asignatura?: string;
  tema?: string;
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

    const plan = await PedagogicalEngine.buildPlan(context.env, nivel, asignatura, tema);
    const contenido = await AIEngine.generateClassContent(context.env, plan);

    return jsonResponse({
      ok: true,
      plan,
      contenido,
      data: {
        ...plan,
        ...contenido,
      },
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: 'No se pudo generar el proyecto pedagógico.',
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
}
