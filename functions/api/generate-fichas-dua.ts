import { getAuthenticatedUserId } from '../_lib/auth';
import { generateFichasDua } from '../core/FichasDuaEngine';
import type { AIEngineEnv, DuaGuide } from '../core/types';

interface Env extends AIEngineEnv {
  JWT_SECRET: string;
}

interface GenerateFichasRequest {
  duaGuide?: DuaGuide;
  level?: string;
  subject?: string;
  topic?: string;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function isValidDuaGuide(value: unknown): value is DuaGuide {
  if (!value || typeof value !== 'object') return false;
  const guide = value as Record<string, unknown>;
  return Array.isArray(guide.nivel_apoyo) && Array.isArray(guide.nivel_estandar) && Array.isArray(guide.nivel_desafio);
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) {
      return jsonResponse({ error: 'Sesión inválida o expirada' }, 401);
    }

    const body = await context.request.json<GenerateFichasRequest>();
    const level = String(body.level || '').trim();
    const subject = String(body.subject || '').trim();
    const topic = String(body.topic || '').trim();

    if (!isValidDuaGuide(body.duaGuide)) {
      return jsonResponse({ error: 'duaGuide con nivel_apoyo, nivel_estandar y nivel_desafio es requerido.' }, 400);
    }
    if (!level || !subject) {
      return jsonResponse({ error: 'level y subject son obligatorios.' }, 400);
    }

    const fichas = await generateFichasDua(context.env, body.duaGuide, { level, subject, topic });

    return jsonResponse({ fichas });
  } catch (error) {
    console.error('[generate-fichas-dua] Error:', error);
    const message = error instanceof Error ? error.message : String(error);

    if (message.includes('AI no está configurado')) {
      return jsonResponse({ error: 'Error de configuración del servidor.' }, 500);
    }

    return jsonResponse({ error: 'No se pudieron generar las fichas diferenciadas.' }, 500);
  }
}

export async function onRequest(): Promise<Response> {
  return jsonResponse({ error: 'Método no permitido. Use POST.' }, 405);
}
