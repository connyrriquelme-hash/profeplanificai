import { z } from 'zod';

/**
 * Herramientas de lectura del copilot (Fase 1). Cada herramienta define su
 * propio schema Zod de argumentos — la IA nunca ejecuta SQL directamente,
 * solo propone { tool, arguments } (ver CopilotActionSchema en
 * copilotSchema.ts) y el endpoint (functions/api/copilot/chat.ts) valida
 * esos argumentos contra el schema de la herramienta antes de llamar a la
 * función correspondiente. Las herramientas de escritura (generate_material,
 * edit_material, save_to_bank) llegan en Fase 2.
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
