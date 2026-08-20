import { z } from 'zod';
import type { AIEngineEnv } from '../../core/types';
import { createToken } from '../auth';
import { onRequestPost as generateGuideEndpoint } from '../../api/materials/guide';
import { onRequestPost as generateEvaluationEndpoint } from '../../api/materials/evaluation';
import { onRequestPost as generateRubricEndpoint } from '../../api/materials/rubric';
import { onRequestPost as generatePresentationEndpoint } from '../../api/materials/presentation';
import { onRequestPost as generateMaterialEndpoint } from '../../api/materials/generate';
import { onRequestPost as editProductEndpoint } from '../../api/materials/edit-product';
import { onRequest as resourceBankEndpoint } from '../../api/resources';

/**
 * Herramientas del copilot. Cada herramienta define su propio schema Zod de
 * argumentos — la IA nunca ejecuta SQL directamente, solo propone
 * { tool, arguments } (ver CopilotActionSchema en copilotSchema.ts) y el
 * endpoint que la ejecuta valida esos argumentos contra el schema de la
 * herramienta antes de llamar a la función correspondiente.
 *
 * Fase 1 — herramientas de lectura (se auto-ejecutan sin confirmación,
 * ver READ_ONLY_TOOLS): search_curriculum, list_resources, navigate_to_view.
 *
 * Fase 2 — herramientas de escritura (NUNCA se auto-ejecutan, ver
 * WRITE_TOOLS): generate_material, save_to_bank, edit_material. En vez de
 * duplicar lógica de generación/persistencia, cada una invoca el
 * onRequestPost real del endpoint que ya usa el wizard (Paso 5 de
 * FlujoDocenteView) con un EventContext armado internamente — ver
 * callInternalEndpoint más abajo. Solo se ejecutan desde
 * functions/api/copilot/confirm.ts, tras confirmación explícita del
 * profesor.
 */

export interface CopilotToolEnv {
  DB: D1Database;
}

// ─── search_curriculum ───────────────────────────────────────────────────

export const SearchCurriculumArgsSchema = z.object({
  query: z.string().min(1, 'query no puede estar vacío'),
  level: z.string().optional(),
  subject: z.string().optional(),
});

export type SearchCurriculumArgs = z.infer<typeof SearchCurriculumArgsSchema>;

export interface CurriculumSearchResult {
  kind: 'objetivo' | 'indicador';
  code: string;
  text: string;
}

const MAX_CURRICULUM_RESULTS = 5;

export async function searchCurriculum(
  env: CopilotToolEnv,
  args: SearchCurriculumArgs,
): Promise<CurriculumSearchResult[]> {
  const like = `%${args.query.trim()}%`;

  let objectivesQuery = `
    SELECT o.code, o.official_text
    FROM objectives o
    LEFT JOIN courses c ON c.id = o.course_id
    LEFT JOIN subjects s ON s.id = o.subject_id
    WHERE (o.official_text LIKE ? OR o.code LIKE ?)
  `;
  const objectivesParams: unknown[] = [like, like];
  if (args.level) {
    objectivesQuery += ' AND c.name LIKE ?';
    objectivesParams.push(`%${args.level}%`);
  }
  if (args.subject) {
    objectivesQuery += ' AND s.name LIKE ?';
    objectivesParams.push(`%${args.subject}%`);
  }
  objectivesQuery += ' LIMIT ?';
  objectivesParams.push(MAX_CURRICULUM_RESULTS);

  const objectives = await env.DB.prepare(objectivesQuery).bind(...objectivesParams).all<{ code: string; official_text: string }>();

  const results: CurriculumSearchResult[] = (objectives.results || [])
    .map((row) => ({ kind: 'objetivo' as const, code: row.code, text: row.official_text }));

  const remaining = MAX_CURRICULUM_RESULTS - results.length;
  if (remaining > 0) {
    const indicators = await env.DB.prepare(`
      SELECT ci.oa_code, ci.indicator_text
      FROM curriculum_indicators ci
      WHERE ci.indicator_text LIKE ?
      LIMIT ?
    `).bind(like, remaining).all<{ oa_code: string; indicator_text: string }>();

    for (const row of indicators.results || []) {
      results.push({ kind: 'indicador', code: row.oa_code, text: row.indicator_text });
    }
  }

  return results.slice(0, MAX_CURRICULUM_RESULTS);
}

// ─── list_resources ───────────────────────────────────────────────────────

export const ListResourcesArgsSchema = z.object({
  type: z.string().optional(),
  limit: z.number().int().positive().max(20).optional(),
});

export type ListResourcesArgs = z.infer<typeof ListResourcesArgsSchema>;

export interface ResourceListItem {
  id: string;
  type: string;
  title: string;
  createdAt: string;
}

const DEFAULT_RESOURCES_LIMIT = 10;

export async function listResources(
  env: CopilotToolEnv,
  userId: string,
  args: ListResourcesArgs,
): Promise<ResourceListItem[]> {
  const limit = args.limit ?? DEFAULT_RESOURCES_LIMIT;

  let query = `SELECT id, type, title, created_at FROM generated_resources WHERE user_id = ?`;
  const params: unknown[] = [userId];
  if (args.type) {
    query += ' AND type = ?';
    params.push(args.type);
  }
  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  const rows = await env.DB.prepare(query).bind(...params).all<{ id: string; type: string; title: string; created_at: string }>();

  return (rows.results || []).map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    createdAt: row.created_at,
  }));
}

// ─── navigate_to_view ───────────────────────────────────────────────────────

export const NAVIGABLE_VIEWS = [
  'flujo-docente',
  'banco-recursos',
  'unidades-didacticas',
  'evaluaciones',
  'libro-clases',
] as const;

export const NavigateToViewArgsSchema = z.object({
  view: z.enum(NAVIGABLE_VIEWS),
});

export type NavigateToViewArgs = z.infer<typeof NavigateToViewArgsSchema>;

// No toca el backend en absoluto — el frontend interpreta { view } y navega
// con su propio router. Existe como función (en vez de que el endpoint
// devuelva la vista directamente desde la acción de la IA sin validar) para
// que la vista pase por NavigateToViewArgsSchema como cualquier otra
// herramienta, y no se pueda "navegar" a un string arbitrario que la IA
// inventó.
export function navigateToView(args: NavigateToViewArgs): { view: string } {
  return { view: args.view };
}

// ─── Registro de herramientas de solo lectura ──────────────────────────────
// Único lugar que decide qué herramientas se auto-ejecutan sin confirmación
// del profesor. Una acción cuyo `tool` no está acá NUNCA se ejecuta
// automáticamente, sin importar lo que la IA haya puesto en
// requiresConfirmation — ver functions/api/copilot/chat.ts.

export type ReadOnlyToolName = 'search_curriculum' | 'list_resources' | 'navigate_to_view';

export const READ_ONLY_TOOLS: ReadonlySet<ReadOnlyToolName> = new Set([
  'search_curriculum',
  'list_resources',
  'navigate_to_view',
]);

// ─── Infraestructura común de las herramientas de escritura (Fase 2) ──────

export interface CopilotWriteToolEnv extends AIEngineEnv {
  DB: D1Database;
  JWT_SECRET: string;
  ENABLE_IMAGE_AI?: string;
  IMAGE_PROVIDER_ORDER?: string;
  HF_API_TOKEN?: string;
  IMAGE_CACHE_TTL_DAYS?: string;
}

// Invoca el onRequestPost/onRequest real de un endpoint existente con un
// EventContext armado en memoria (sin red) — nunca un fetch HTTP real. Así
// cada herramienta reutiliza 100% la lógica de generación/persistencia ya
// probada de ese endpoint (incluida su propia escritura en D1) en vez de
// que tools.ts arme su propio INSERT/UPDATE.
async function callInternalEndpoint<T>(
  handler: (context: EventContext<any>) => Promise<Response>,
  env: CopilotWriteToolEnv,
  path: string,
  body: unknown,
  authHeader?: string,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers.Authorization = authHeader;

  const request = new Request(`https://copilot.internal${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const response = await handler({ request, env } as unknown as EventContext<any>);
  const data = await response.json() as Record<string, unknown>;

  if (!response.ok || data.ok === false) {
    const detail = (data.details as string) || (data.error as string) || `Error al llamar a ${path}`;
    throw new Error(detail);
  }

  return data as T;
}

interface GeneratedResourceRow {
  id: string;
  title: string;
  type: string;
  content: string;
  content_json: string;
  level: string;
  subject: string;
  objective_code: string | null;
}

// Único punto de lectura de un recurso ya generado para las herramientas de
// escritura — exige que pertenezca al profesor autenticado (nunca cae a
// "cualquier recurso" si no hay match).
async function loadOwnedResource(
  env: CopilotWriteToolEnv,
  userId: string,
  resourceId: string,
): Promise<GeneratedResourceRow> {
  const row = await env.DB.prepare(
    `SELECT id, title, type, content, content_json, level, subject, objective_code
     FROM generated_resources WHERE id = ? AND user_id = ?`,
  ).bind(resourceId, userId).first<GeneratedResourceRow>();

  if (!row) throw new Error('Recurso no encontrado o no te pertenece');
  return row;
}

// ─── generate_material ─────────────────────────────────────────────────────

export const MATERIAL_TYPES = [
  'guia_estudiante',
  'guia_docente',
  'planificacion',
  'evaluacion',
  'rubrica',
  'presentacion',
  'ticket_salida',
  'actividad_dua',
] as const;

export const GenerateMaterialArgsSchema = z.object({
  type: z.enum(MATERIAL_TYPES),
  level: z.string().min(1, 'level no puede estar vacío'),
  subject: z.string().min(1, 'subject no puede estar vacío'),
  objectiveCode: z.string().min(1, 'objectiveCode no puede estar vacío'),
  objectiveText: z.string().min(1, 'objectiveText no puede estar vacío'),
  topic: z.string().min(1, 'topic no puede estar vacío'),
  indicators: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  additionalContext: z.string().optional(),
  methodology: z.string().optional(),
  duration: z.string().optional(),
  designStyle: z.string().optional(),
  // .min(0) en vez de .positive(): un LLM que no sabe el valor a veces manda
  // 0 en lugar de omitir el campo — tratamos 0 como "no especificado" en vez
  // de rechazar la acción entera por eso.
  studentCount: z.number().int().min(0).optional(),
  criteria: z.array(z.string()).optional(),
  title: z.string().optional(),
  audiencia: z.enum(['docente', 'estudiante']).optional(),
});

export type GenerateMaterialArgs = z.infer<typeof GenerateMaterialArgsSchema>;

export interface GenerateMaterialResult {
  resourceId: string;
  type: string;
  preview: unknown;
}

function buildGenerateMaterialPayload(args: GenerateMaterialArgs) {
  return {
    level: args.level,
    subject: args.subject,
    objectiveCode: args.objectiveCode,
    objectiveText: args.objectiveText,
    topic: args.topic,
    indicators: args.indicators,
    skills: args.skills,
    additionalContext: args.additionalContext,
    methodology: args.methodology,
    duration: args.duration,
    designStyle: args.designStyle,
    studentCount: args.studentCount,
  };
}

// Despacha al mismo endpoint que usa el wizard para cada tipo de producto
// (ver src/components/FlujoDocenteView.tsx y src/services/materialGeneratorService.ts)
// y normaliza la respuesta a { resourceId, type, preview }. Pasa un token
// interno firmado para userId — guide.ts/generate.ts/rubric.ts/evaluation.ts
// leen el userId del header Authorization para guardarlo en user_id, y sin
// esto los recursos quedan huérfanos: loadOwnedResource jamás los
// encontraría después para save_to_bank/edit_material.
export async function generateMaterial(
  env: CopilotWriteToolEnv,
  userId: string,
  args: GenerateMaterialArgs,
): Promise<GenerateMaterialResult> {
  const base = buildGenerateMaterialPayload(args);
  const internalAuth = `Bearer ${await createToken(userId, '', env.JWT_SECRET)}`;

  switch (args.type) {
    case 'guia_estudiante':
    case 'guia_docente': {
      const data = await callInternalEndpoint<{ resourceId: string; guide: unknown }>(
        generateGuideEndpoint, env, '/api/materials/guide', { ...base, type: args.type }, internalAuth,
      );
      return { resourceId: data.resourceId, type: args.type, preview: data.guide };
    }
    case 'evaluacion': {
      const data = await callInternalEndpoint<{ resourceId: string; evaluation: unknown }>(
        generateEvaluationEndpoint, env, '/api/materials/evaluation', base, internalAuth,
      );
      return { resourceId: data.resourceId, type: args.type, preview: data.evaluation };
    }
    case 'rubrica': {
      const data = await callInternalEndpoint<{ resourceId: string; rubric: unknown }>(
        generateRubricEndpoint, env, '/api/materials/rubric', { ...base, criteria: args.criteria }, internalAuth,
      );
      return { resourceId: data.resourceId, type: args.type, preview: data.rubric };
    }
    case 'presentacion': {
      const data = await callInternalEndpoint<{ resourceId: string; slides?: unknown; pptDeck?: unknown }>(
        generatePresentationEndpoint, env, '/api/materials/presentation',
        { ...base, title: args.title || args.topic, audiencia: args.audiencia }, internalAuth,
      );
      return { resourceId: data.resourceId, type: args.type, preview: data.pptDeck ?? data.slides };
    }
    case 'planificacion':
    case 'ticket_salida':
    case 'actividad_dua': {
      const data = await callInternalEndpoint<{ resourceId: string; planificacion?: unknown; prompt?: string }>(
        generateMaterialEndpoint, env, `/api/materials/generate?type=${args.type}`, base, internalAuth,
      );
      return { resourceId: data.resourceId, type: args.type, preview: data.planificacion ?? data.prompt };
    }
    default: {
      const exhaustive: never = args.type;
      throw new Error(`Tipo de material no soportado: ${exhaustive}`);
    }
  }
}

// ─── save_to_bank ───────────────────────────────────────────────────────────

export const SaveToBankArgsSchema = z.object({
  resourceId: z.string().min(1, 'resourceId no puede estar vacío'),
});

export type SaveToBankArgs = z.infer<typeof SaveToBankArgsSchema>;

export interface SaveToBankResult {
  bankResourceId: string;
}

export async function saveToBank(
  env: CopilotWriteToolEnv,
  userId: string,
  args: SaveToBankArgs,
): Promise<SaveToBankResult> {
  const resource = await loadOwnedResource(env, userId, args.resourceId);

  // /api/resources exige Authorization Bearer real (ya no confía en un
  // user_id del body) — mismo patrón de token interno que editMaterial.
  const internalToken = await createToken(userId, '', env.JWT_SECRET);
  const data = await callInternalEndpoint<{ data: { id: string } }>(
    resourceBankEndpoint, env, '/api/resources',
    {
      user_id: userId,
      title: resource.title,
      type: resource.type,
      content: resource.content_json || resource.content,
      level: resource.level,
      subject: resource.subject,
      objectiveCode: resource.objective_code || '',
    },
    `Bearer ${internalToken}`,
  );

  return { bankResourceId: data.data.id };
}

// ─── edit_material ──────────────────────────────────────────────────────────

export const EditMaterialArgsSchema = z.object({
  resourceId: z.string().min(1, 'resourceId no puede estar vacío'),
  instruccion: z.string().min(1, 'instruccion no puede estar vacía'),
});

export type EditMaterialArgs = z.infer<typeof EditMaterialArgsSchema>;

export interface EditMaterialResult {
  camposModificados: string[];
  explicacion: string;
  preview: Record<string, unknown>;
}

// edit-product.ts exige un Authorization Bearer válido (401 si falta), así
// que se le pasa un token interno firmado con el mismo JWT_SECRET para el
// userId ya autenticado por el endpoint que llama a esta herramienta — nunca
// se reenvía ni se confía en un token que venga del cliente.
export async function editMaterial(
  env: CopilotWriteToolEnv,
  userId: string,
  args: EditMaterialArgs,
): Promise<EditMaterialResult> {
  const resource = await loadOwnedResource(env, userId, args.resourceId);

  const producto = {
    type: resource.type,
    metadata: {
      title: resource.title,
      level: resource.level,
      subject: resource.subject,
      oaCode: resource.objective_code || undefined,
    },
    data: JSON.parse(resource.content_json || resource.content || '{}'),
  };

  const internalToken = await createToken(userId, '', env.JWT_SECRET);
  const data = await callInternalEndpoint<{
    productoModificado: Record<string, unknown>;
    explicacion: string;
    camposModificados: string[];
  }>(
    editProductEndpoint, env, '/api/materials/edit-product',
    { instruccion: args.instruccion, producto, resourceId: args.resourceId },
    `Bearer ${internalToken}`,
  );

  return {
    camposModificados: data.camposModificados,
    explicacion: data.explicacion,
    preview: data.productoModificado,
  };
}

// ─── Registro de herramientas de escritura ─────────────────────────────────
// Igual que READ_ONLY_TOOLS pero al revés: una herramienta que está acá
// SIEMPRE requiere confirmación explícita del profesor, sin importar lo que
// la IA haya puesto en requiresConfirmation. Solo se ejecutan desde
// functions/api/copilot/confirm.ts, nunca desde chat.ts.

export type WriteToolName = 'generate_material' | 'save_to_bank' | 'edit_material';

export const WRITE_TOOLS: ReadonlySet<WriteToolName> = new Set([
  'generate_material',
  'save_to_bank',
  'edit_material',
]);
