import { getAuthenticatedUserId } from '../../../_lib/auth';
import { editSeccionGuia } from '../../../core/GuiaEditEngine';
import type { GuiaResult } from '../../../core/GuiaEngine';
import type { AIEngineEnv } from '../../../core/types';

interface Env extends AIEngineEnv {
  DB: D1Database;
  JWT_SECRET: string;
  GEMINI_API_KEY?: string;
}

interface EditGuideRequest {
  resourceId?: string;
  instruccion?: string;
  seccionIndex?: number;
  guia?: unknown;
}

interface GeneratedResourceRow {
  id: string;
  level: string | null;
  subject: string | null;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function isValidGuia(value: unknown): value is GuiaResult {
  if (!value || typeof value !== 'object') return false;
  const guia = value as Record<string, unknown>;
  return typeof guia.title === 'string' && Array.isArray(guia.sections) && guia.sections.length > 0;
}

export async function onRequestPatch(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) {
      return jsonResponse({ error: 'Sesión inválida o expirada' }, 401);
    }

    const body = await context.request.json<EditGuideRequest>();
    const resourceId = String(body.resourceId || '').trim();
    const instruccion = String(body.instruccion || '').trim();

    if (!resourceId) {
      return jsonResponse({ error: 'resourceId es requerido' }, 400);
    }
    if (!instruccion) {
      return jsonResponse({ error: 'instruccion es requerida' }, 400);
    }
    if (!isValidGuia(body.guia)) {
      return jsonResponse({ error: 'guia con title y sections es requerida' }, 400);
    }

    const db = context.env.DB;
    const resource = await db.prepare(
      `SELECT id, level, subject FROM generated_resources WHERE id = ? AND user_id = ?`,
    ).bind(resourceId, userId).first<GeneratedResourceRow>();

    if (!resource) {
      return jsonResponse({ error: 'Recurso no encontrado' }, 400);
    }

    const seccionIndex = typeof body.seccionIndex === 'number' && Number.isInteger(body.seccionIndex)
      ? body.seccionIndex
      : undefined;

    // Inyectar explícitamente GEMINI_API_KEY para que callAIConValidacion
    // en GuiaEditEngine tenga el fallback a Gemini 2.5 Flash disponible.
    const aiEnv: AIEngineEnv = {
      AI: context.env.AI,
      GEMINI_API_KEY: context.env.GEMINI_API_KEY,
    };

    const result = await editSeccionGuia(aiEnv, {
      guia: body.guia,
      instruccion,
      seccionIndex,
      level: resource.level || '',
      subject: resource.subject || '',
    });

    // La guía completa (con sus secciones) vive en la columna `content`, no
    // en `content_json` (que en guide.ts solo guarda { topic, methodology }
    // como metadata) — ver guide.ts:90-106, el mismo INSERT que crea esta
    // fila.
    await db.prepare(
      `UPDATE generated_resources SET content = ?, updated_at = ? WHERE id = ? AND user_id = ?`,
    ).bind(JSON.stringify(result.guia), new Date().toISOString(), resourceId, userId).run();

    return jsonResponse({
      ok: true,
      seccionModificada: result.seccionModificada,
      guiaActualizada: result.guia,
      explicacion: result.explicacion,
    });
  } catch (err: any) {
    return jsonResponse({ error: 'Error al editar la guía', details: err?.message }, 500);
  }
}

export async function onRequest(): Promise<Response> {
  return jsonResponse({ error: 'Método no permitido. Use PATCH.' }, 405);
}
