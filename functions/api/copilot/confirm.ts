import { getAuthenticatedUserId } from '../../_lib/auth';
import {
  WRITE_TOOLS,
  GenerateMaterialArgsSchema,
  SaveToBankArgsSchema,
  EditMaterialArgsSchema,
  generateMaterial,
  saveToBank,
  editMaterial,
  type CopilotWriteToolEnv,
  type WriteToolName,
} from '../../_lib/copilot/tools';

interface Env extends CopilotWriteToolEnv {}

interface ConfirmedAction {
  tool?: string;
  arguments?: Record<string, unknown>;
}

interface ConfirmRequest {
  conversationId?: string;
  confirmedAction?: ConfirmedAction;
}

interface ConversationRow {
  id: string;
  active_context_json: string;
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function parseActiveContext(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

const MATERIAL_LABELS: Record<string, string> = {
  guia_estudiante: 'la guía de estudiante',
  guia_docente: 'la guía docente',
  planificacion: 'la planificación',
  evaluacion: 'la evaluación',
  rubrica: 'la rúbrica',
  presentacion: 'la presentación',
  ticket_salida: 'el ticket de salida',
  actividad_dua: 'la actividad DUA',
};

// Único endpoint que puede ejecutar generate_material, save_to_bank y
// edit_material — chat.ts nunca las auto-ejecuta (ver READ_ONLY_TOOLS ahí).
// Este endpoint vuelve a exigir que `tool` esté en WRITE_TOOLS antes de
// tocar nada: recibir un { conversationId, confirmedAction } es, en sí
// mismo, la confirmación explícita del profesor — no hay un segundo gate.
export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const db = context.env.DB;
  let conversationId = '';
  let tool = '';
  let toolArguments: Record<string, unknown> = {};

  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) {
      return jsonResponse({ error: 'Sesión inválida o expirada' }, 401);
    }

    const body = await context.request.json<ConfirmRequest>();
    conversationId = String(body.conversationId || '').trim();
    tool = String(body.confirmedAction?.tool || '').trim();
    toolArguments = body.confirmedAction?.arguments || {};

    if (!conversationId) {
      return jsonResponse({ error: 'conversationId es requerido' }, 400);
    }
    if (!WRITE_TOOLS.has(tool as WriteToolName)) {
      return jsonResponse({ error: 'Herramienta no válida para confirmación' }, 400);
    }

    const conversation = await db.prepare(
      `SELECT id, active_context_json FROM copilot_conversations WHERE id = ? AND user_id = ?`,
    ).bind(conversationId, userId).first<ConversationRow>();
    if (!conversation) {
      return jsonResponse({ error: 'Conversación no encontrada' }, 404);
    }

    let message: string;
    let result: unknown;
    let contextPatch: Record<string, unknown> | null = null;

    if (tool === 'generate_material') {
      const args = GenerateMaterialArgsSchema.parse(toolArguments);
      const data = await generateMaterial(context.env, args);
      message = `Listo: generé ${MATERIAL_LABELS[data.type] || 'el material'}. Puedes revisarlo o pedirme que lo guarde en tu Banco de Recursos.`;
      result = data;
      contextPatch = { lastResourceId: data.resourceId, lastResourceType: data.type };
    } else if (tool === 'save_to_bank') {
      const args = SaveToBankArgsSchema.parse(toolArguments);
      const data = await saveToBank(context.env, userId, args);
      message = 'Guardado en tu Banco de Recursos.';
      result = data;
    } else {
      const args = EditMaterialArgsSchema.parse(toolArguments);
      const data = await editMaterial(context.env, userId, args);
      message = data.explicacion;
      result = data;
    }

    if (contextPatch) {
      const merged = { ...parseActiveContext(conversation.active_context_json), ...contextPatch };
      await db.prepare(
        `UPDATE copilot_conversations SET active_context_json = ? WHERE id = ?`,
      ).bind(JSON.stringify(merged), conversationId).run();
    }

    await db.prepare(
      `INSERT INTO copilot_messages (id, conversation_id, role, content, tool_calls_json, tool_result_json) VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      conversationId,
      'tool',
      message,
      JSON.stringify({ tool, arguments: toolArguments }),
      JSON.stringify({ ok: true, result }),
    ).run();

    await db.prepare(
      `UPDATE copilot_conversations SET updated_at = datetime('now') WHERE id = ?`,
    ).bind(conversationId).run();

    return jsonResponse({ ok: true, conversationId, tool, message, result });
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error('[copilot/confirm] error:', err);

    // Auditoría best-effort también en caso de fallo, si ya sabemos qué se
    // intentó ejecutar — nunca debe tapar la respuesta de error real.
    if (conversationId && tool) {
      try {
        await db.prepare(
          `INSERT INTO copilot_messages (id, conversation_id, role, content, tool_calls_json, tool_result_json) VALUES (?, ?, ?, ?, ?, ?)`,
        ).bind(
          crypto.randomUUID(),
          conversationId,
          'tool',
          'No pude completar esa acción.',
          JSON.stringify({ tool, arguments: toolArguments }),
          JSON.stringify({ ok: false, error: detail }),
        ).run();
      } catch {
        // best-effort
      }
    }

    return jsonResponse({ error: 'Error al ejecutar la acción confirmada', details: detail }, 500);
  }
}

export async function onRequest(): Promise<Response> {
  return jsonResponse({ error: 'Método no permitido. Use POST.' }, 405);
}
