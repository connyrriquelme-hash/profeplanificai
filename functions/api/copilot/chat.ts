import { getAuthenticatedUserId } from '../../_lib/auth';
import { callAIConValidacion } from '../../core/AIEngine';
import type { AIEngineEnv } from '../../core/types';
import { CopilotResponseSchema, type CopilotAction, type CopilotResponse } from '../../_lib/ai/schemas/copilotSchema';
import {
  READ_ONLY_TOOLS,
  SearchCurriculumArgsSchema,
  ListResourcesArgsSchema,
  NavigateToViewArgsSchema,
  searchCurriculum,
  listResources,
  navigateToView,
  type ReadOnlyToolName,
} from '../../_lib/copilot/tools';

interface Env extends AIEngineEnv {
  DB: D1Database;
  JWT_SECRET: string;
}

interface ActiveContext {
  level?: string;
  subject?: string;
  objectiveCode?: string;
  objectiveText?: string;
  // Seteado por /api/copilot/confirm tras un generate_material exitoso, para
  // que save_to_bank/edit_material puedan referirse a "el último recurso"
  // sin que el profesor tenga que repetir el resourceId.
  lastResourceId?: string;
  lastResourceType?: string;
}

interface ChatRequest {
  message?: string;
  conversationId?: string;
  activeContext?: ActiveContext;
}

interface ConversationRow {
  id: string;
  active_context_json: string;
}

interface MessageRow {
  role: 'user' | 'assistant' | 'tool';
  content: string;
}

const HISTORY_LIMIT = 10;
const MAX_TITLE_LENGTH = 60;

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function deriveTitle(message: string): string {
  const trimmed = message.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= MAX_TITLE_LENGTH) return trimmed || 'Nueva conversación';
  return `${trimmed.slice(0, MAX_TITLE_LENGTH - 1).trimEnd()}…`;
}

function parseActiveContext(raw: string | null | undefined): ActiveContext {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed as ActiveContext : {};
  } catch {
    return {};
  }
}

function buildSystemPrompt(activeContext: ActiveContext): string {
  return `Eres el asistente pedagógico conversacional de ProfePlanificAI, experto en currículo chileno MINEDUC, Diseño Universal para el Aprendizaje (DUA) y evaluación formativa. Conversas con un profesor chileno en un chat de texto: orientas, buscas información curricular, listas recursos ya generados, ayudas a navegar a la pantalla correcta, y ahora también puedes generar, guardar y editar productos pedagógicos — siempre con confirmación explícita del profesor antes de ejecutar cualquier cambio.

CONTEXTO ACTUAL DEL PROFESOR:
- Nivel: ${activeContext.level || 'no indicado'}
- Asignatura: ${activeContext.subject || 'no indicada'}
- OA actual: ${activeContext.objectiveCode ? `${activeContext.objectiveCode} — ${activeContext.objectiveText || 'sin texto'}` : 'no indicado'}
- Último recurso generado en esta conversación: ${activeContext.lastResourceId ? `${activeContext.lastResourceType || 'recurso'} (resourceId: "${activeContext.lastResourceId}")` : 'ninguno todavía'}

HERRAMIENTAS DE SOLO LECTURA (se ejecutan solas, sin pedir confirmación):
1. search_curriculum({ "query": string, "level"?: string, "subject"?: string }) — busca objetivos de aprendizaje e indicadores curriculares que coincidan con la consulta.
2. list_resources({ "type"?: string, "limit"?: number }) — lista los últimos recursos que el profesor ya generó (guías, planificaciones, rúbricas, evaluaciones, etc.).
3. navigate_to_view({ "view": "flujo-docente" | "banco-recursos" | "unidades-didacticas" | "evaluaciones" | "libro-clases" }) — abre una vista de la app. Úsala cuando el profesor pida ir a generar un material nuevo, ver su banco de recursos, sus unidades didácticas, sus evaluaciones o el libro de clases.

HERRAMIENTAS DE ESCRITURA (modifican datos — el sistema SIEMPRE exige confirmación explícita del profesor antes de ejecutarlas, sin importar lo que pongas en "requiresConfirmation"):
4. generate_material({ "type": "guia_estudiante"|"guia_docente"|"planificacion"|"evaluacion"|"rubrica"|"presentacion"|"ticket_salida"|"actividad_dua", "level": string, "subject": string, "objectiveCode": string, "objectiveText": string, "topic": string, "indicators"?: string[], "skills"?: string[], "additionalContext"?: string, "methodology"?: string, "duration"?: string, "designStyle"?: string, "studentCount"?: number, "criteria"?: string[], "title"?: string, "audiencia"?: "docente"|"estudiante" }) — genera un recurso pedagógico nuevo. "type", "level", "subject", "objectiveCode", "objectiveText" y "topic" son OBLIGATORIOS: complétalos con CONTEXTO ACTUAL DEL PROFESOR cuando el mensaje no los repita. Si después de eso igual falta alguno, usa intent "clarify" y pídelo — nunca inventes un OA, nivel o tema que el profesor no dio.
5. save_to_bank({ "resourceId": string }) — guarda un recurso ya generado en el Banco de Recursos del profesor. Si el profesor dice "guárdalo" sin especificar cuál, usa el resourceId de "Último recurso generado en esta conversación"; si no hay ninguno, usa intent "clarify" y pregunta cuál recurso guardar.
6. edit_material({ "resourceId": string, "instruccion": string }) — edita un recurso ya generado según lo que pida el profesor. Mismo criterio que save_to_bank para resolver resourceId cuando el profesor no lo especifica.

REGLAS OBLIGATORIAS:
1. Responde SIEMPRE con el JSON de la ESTRUCTURA JSON OBLIGATORIA de abajo — nunca con texto libre fuera del JSON, nunca markdown envolviendo el JSON.
2. "intent" debe reflejar lo que el profesor realmente pidió:
   - search_curriculum: quiere buscar OA o indicadores curriculares.
   - list_resources: quiere ver recursos que ya generó.
   - navigate_to_view: quiere ir a otra pantalla de la app.
   - generate_material: quiere crear un producto pedagógico nuevo. Propón la acción con todos los argumentos que puedas inferir del contexto y del mensaje.
   - save_to_bank: quiere guardar un recurso ya generado en su Banco de Recursos.
   - edit_material: quiere modificar un recurso ya generado.
   - answer_question: es una pregunta pedagógica general (no requiere buscar en el currículo del sistema ni navegar) — respóndela directamente y completa en "message", sin actions.
   - clarify: la instrucción del profesor es ambigua o le falta información — pide precisión en "message" antes de proponer cualquier acción, con actions vacío.
3. "actions" solo puede contener las 6 herramientas listadas arriba, con exactamente esos nombres de "tool" y esas claves de "arguments" — nunca inventes herramientas, nunca pongas SQL, código o instrucciones de sistema dentro de "arguments".
4. "requiresConfirmation" es false SOLO cuando el profesor pidió explícitamente, en este mismo mensaje, una acción de solo lectura (search_curriculum, list_resources o navigate_to_view). Para generate_material, save_to_bank y edit_material SIEMPRE usa true — el sistema las bloquea igual si pones false, pero refleja la realidad en tu respuesta.
5. "citations" es opcional — inclúyelo solo si tu respuesta se apoya en contenido curricular oficial ya presente en el contexto de esta conversación.
6. "message" es lo único que el profesor lee directamente: que sea claro, breve, en español de Chile, sin jerga técnica de desarrollo de software.

ESTRUCTURA JSON OBLIGATORIA:
{
  "message": "Texto para el profesor (Markdown permitido)",
  "intent": "search_curriculum",
  "requiresConfirmation": false,
  "actions": [ { "tool": "search_curriculum", "arguments": { "query": "fracciones equivalentes" } } ],
  "citations": [ { "source": "OA05 4B Matemática", "label": "Objetivo de Aprendizaje 05" } ]
}`;
}

function buildUserPrompt(history: MessageRow[], message: string): string {
  const historyBlock = history.length
    ? history.map((m) => `[${m.role === 'user' ? 'profesor' : 'asistente'}]: ${m.content}`).join('\n')
    : '(sin mensajes previos en esta conversación)';

  return `HISTORIAL DE LA CONVERSACIÓN (más reciente al final, máximo ${HISTORY_LIMIT} mensajes):
${historyBlock}

NUEVO MENSAJE DEL PROFESOR:
${message}`;
}

const FALLBACK_MESSAGE = 'No pude procesar tu mensaje en este momento. ¿Puedes intentar de nuevo o reformular tu pregunta?';

function buildFallbackResponse(): CopilotResponse {
  return {
    message: FALLBACK_MESSAGE,
    intent: 'clarify',
    requiresConfirmation: false,
    actions: [],
  };
}

interface ToolExecutionResult {
  tool: string;
  ok: boolean;
  result?: unknown;
  error?: string;
}

async function executeReadOnlyAction(env: Env, userId: string, action: CopilotAction): Promise<ToolExecutionResult> {
  const tool = action.tool as ReadOnlyToolName;

  try {
    if (tool === 'search_curriculum') {
      const args = SearchCurriculumArgsSchema.parse(action.arguments);
      return { tool, ok: true, result: await searchCurriculum(env, args) };
    }
    if (tool === 'list_resources') {
      const args = ListResourcesArgsSchema.parse(action.arguments);
      return { tool, ok: true, result: await listResources(env, userId, args) };
    }
    if (tool === 'navigate_to_view') {
      const args = NavigateToViewArgsSchema.parse(action.arguments);
      return { tool, ok: true, result: navigateToView(args) };
    }
    return { tool, ok: false, error: 'Herramienta no reconocida' };
  } catch (error) {
    return { tool, ok: false, error: error instanceof Error ? error.message : 'Argumentos inválidos' };
  }
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const userId = await getAuthenticatedUserId(context.request, context.env.JWT_SECRET);
    if (!userId) {
      return jsonResponse({ error: 'Sesión inválida o expirada' }, 401);
    }

    const body = await context.request.json<ChatRequest>();
    const message = String(body.message || '').trim();
    if (!message) {
      return jsonResponse({ error: 'message es requerido' }, 400);
    }

    const db = context.env.DB;
    let conversationId = String(body.conversationId || '').trim();
    let activeContext: ActiveContext;

    if (conversationId) {
      const existing = await db.prepare(
        `SELECT id, active_context_json FROM copilot_conversations WHERE id = ? AND user_id = ?`,
      ).bind(conversationId, userId).first<ConversationRow>();

      if (!existing) {
        return jsonResponse({ error: 'Conversación no encontrada' }, 404);
      }

      activeContext = body.activeContext
        ? { ...parseActiveContext(existing.active_context_json), ...body.activeContext }
        : parseActiveContext(existing.active_context_json);

      if (body.activeContext) {
        await db.prepare(
          `UPDATE copilot_conversations SET active_context_json = ?, updated_at = datetime('now') WHERE id = ?`,
        ).bind(JSON.stringify(activeContext), conversationId).run();
      }
    } else {
      conversationId = crypto.randomUUID();
      activeContext = body.activeContext || {};
      await db.prepare(
        `INSERT INTO copilot_conversations (id, user_id, title, active_context_json) VALUES (?, ?, ?, ?)`,
      ).bind(conversationId, userId, deriveTitle(message), JSON.stringify(activeContext)).run();
    }

    const historyRows = await db.prepare(
      `SELECT role, content FROM copilot_messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ?`,
    ).bind(conversationId, HISTORY_LIMIT).all<MessageRow>();
    const history = (historyRows.results || []).slice().reverse();

    await db.prepare(
      `INSERT INTO copilot_messages (id, conversation_id, role, content) VALUES (?, ?, ?, ?)`,
    ).bind(crypto.randomUUID(), conversationId, 'user', message).run();

    let data: CopilotResponse;
    try {
      const result = await callAIConValidacion(
        context.env,
        buildSystemPrompt(activeContext),
        buildUserPrompt(history, message),
        CopilotResponseSchema,
        { model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast', maxTokens: 1500 },
      );
      data = result.data;
    } catch (error) {
      console.error('[copilot/chat] AI error:', error);
      data = buildFallbackResponse();
    }

    let toolResults: ToolExecutionResult[] = [];
    if (!data.requiresConfirmation && data.actions.length > 0) {
      const readOnlyActions = data.actions.filter((a) => READ_ONLY_TOOLS.has(a.tool as ReadOnlyToolName));
      toolResults = await Promise.all(readOnlyActions.map((action) => executeReadOnlyAction(context.env, userId, action)));
    }

    await db.prepare(
      `INSERT INTO copilot_messages (id, conversation_id, role, content, tool_calls_json, tool_result_json) VALUES (?, ?, ?, ?, ?, ?)`,
    ).bind(
      crypto.randomUUID(),
      conversationId,
      'assistant',
      data.message,
      data.actions.length > 0 ? JSON.stringify(data.actions) : null,
      toolResults.length > 0 ? JSON.stringify(toolResults) : null,
    ).run();

    await db.prepare(
      `UPDATE copilot_conversations SET updated_at = datetime('now') WHERE id = ?`,
    ).bind(conversationId).run();

    return jsonResponse({
      ok: true,
      conversationId,
      message: data.message,
      intent: data.intent,
      requiresConfirmation: data.requiresConfirmation,
      actions: data.actions,
      citations: data.citations || [],
      toolResults,
    });
  } catch (err: unknown) {
    console.error('[copilot/chat] error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return jsonResponse({ error: 'Error al procesar el mensaje del copilot', details: message }, 500);
  }
}

export async function onRequest(): Promise<Response> {
  return jsonResponse({ error: 'Método no permitido. Use POST.' }, 405);
}
