import type { AIEnv, AIRequest } from './types';
import { sanitizeForPrompt } from './limits';

type Row = Record<string, unknown>;

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function compact(items: unknown[], limit = 8): string[] {
  return items.map((item) => text(item)).filter(Boolean).slice(0, limit);
}

function rowsToLines(rows: Row[], fields: string[], limit = 8): string[] {
  return rows.slice(0, limit).map((row) => {
    const parts = fields.map((field) => text(row[field])).filter(Boolean);
    return parts.join(' — ');
  }).filter(Boolean);
}

async function safeAll(db: D1Database, query: string, params: unknown[] = []): Promise<Row[]> {
  try {
    const result = await db.prepare(query).bind(...params).all<Row>();
    return result.results || [];
  } catch {
    return [];
  }
}

async function safeFirst(db: D1Database, query: string, params: unknown[] = []): Promise<Row | null> {
  try {
    return await db.prepare(query).bind(...params).first<Row>();
  } catch {
    return null;
  }
}

async function resolveObjective(env: AIEnv, req: AIRequest): Promise<Row | null> {
  const explicit = text(req.oaCode || req.oa);
  if (explicit) {
    const objective = await safeFirst(env.DB, `
      SELECT o.id, o.code, o.official_text, o.normalized_text, o.bloom_level,
             c.name AS course_name, s.name AS subject_name, a.name AS axis_name
      FROM objectives o
      LEFT JOIN courses c ON c.id = o.course_id
      LEFT JOIN subjects s ON s.id = o.subject_id
      LEFT JOIN axes a ON a.id = o.axis_id
      WHERE o.id = ? OR o.code = ?
      LIMIT 1
    `, [explicit, explicit]);
    if (objective) return objective;
  }

  const lessonId = text(req.lessonId);
  if (!lessonId) return null;

  return safeFirst(env.DB, `
    SELECT o.id, o.code, o.official_text, o.normalized_text, o.bloom_level,
           c.name AS course_name, s.name AS subject_name, a.name AS axis_name
    FROM lesson_instances li
    JOIN lesson_plans lp ON lp.lesson_instance_id = li.id
    JOIN lesson_plan_curriculum lpc ON lpc.lesson_plan_id = lp.id
    JOIN objectives o ON o.id = lpc.objective_id
    LEFT JOIN courses c ON c.id = o.course_id
    LEFT JOIN subjects s ON s.id = o.subject_id
    LEFT JOIN axes a ON a.id = o.axis_id
    WHERE li.id = ?
    LIMIT 1
  `, [lessonId]);
}

async function queryVectorize(env: AIEnv, queryText: string): Promise<string[]> {
  if (!env.AI || !env.REPO_PEDAGOGICO || !queryText.trim()) return [];

  try {
    const embeddingResponse = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
      text: [queryText],
    }) as { data?: number[][] };
    const embedding = embeddingResponse?.data?.[0];
    if (!Array.isArray(embedding) || embedding.length === 0) return [];

    const results = await env.REPO_PEDAGOGICO.query(embedding, {
      topK: 3,
      returnMetadata: true,
    });

    return (results.matches || []).map((match, index) => {
      const title = text(match.metadata?.titulo) || text(match.metadata?.title) || `Documento ${index + 1}`;
      const author = text(match.metadata?.autor) || text(match.metadata?.author) || 'Autor no informado';
      const summary = text(match.metadata?.resumen) || text(match.metadata?.summary) || text(match.metadata?.descripcion);
      return `${title} (${author})${summary ? `: ${summary}` : ''}`;
    }).filter(Boolean);
  } catch {
    return [];
  }
}

export async function enrichAIRequestWithPedagogicalContext(env: AIEnv, req: AIRequest): Promise<AIRequest> {
  const objective = await resolveObjective(env, req);
  const objectiveId = text(objective?.id);
  const objectiveCode = text(objective?.code || req.oaCode);
  const objectiveText = text(objective?.official_text || objective?.normalized_text || req.oaText);

  const [indicators, skills, attitudes, methodologies, strategies, templates, searchDocs] = await Promise.all([
    objectiveCode ? safeAll(env.DB, `
      SELECT indicator_text, observable_action, evaluation_type
      FROM curriculum_indicators
      WHERE oa_code = ?
      LIMIT 12
    `, [objectiveCode]) : Promise.resolve([]),
    objectiveId ? safeAll(env.DB, `
      SELECT sk.code, sk.official_text
      FROM objective_skills os
      JOIN skills sk ON sk.id = os.skill_id
      WHERE os.objective_id = ?
      LIMIT 10
    `, [objectiveId]) : Promise.resolve([]),
    objectiveId ? safeAll(env.DB, `
      SELECT att.code, att.official_text
      FROM objective_attitudes oa
      JOIN attitudes att ON att.id = oa.attitude_id
      WHERE oa.objective_id = ?
      LIMIT 10
    `, [objectiveId]) : Promise.resolve([]),
    safeAll(env.DB, `
      SELECT name, description, educational_focus, pedagogical_approach
      FROM methodologies
      WHERE status IS NULL OR status = 'active'
      ORDER BY name
      LIMIT 8
    `),
    safeAll(env.DB, `
      SELECT ms.name, ms.description
      FROM methodology_strategies ms
      ORDER BY ms.name
      LIMIT 8
    `),
    safeAll(env.DB, `
      SELECT title, resource_type, description
      FROM resource_templates
      ORDER BY updated_at DESC
      LIMIT 6
    `),
    safeAll(env.DB, `
      SELECT title, snippet, source_type
      FROM search_documents
      ORDER BY updated_at DESC
      LIMIT 6
    `),
  ]);

  const need = text(req.instructions || req.existingContent || req.oaText || objectiveText || req.subject || req.course);
  const vectorDocs = await queryVectorize(env, need);

  const blocks = [
    'CONTEXTO PEDAGÓGICO RECUPERADO DESDE LAS BASES DEL PROYECTO:',
    objective ? [
      `Objetivo D1: ${objectiveCode || 'Sin código'} — ${objectiveText || 'Sin texto oficial'}`,
      text(objective.course_name) ? `Curso D1: ${objective.course_name}` : '',
      text(objective.subject_name) ? `Asignatura D1: ${objective.subject_name}` : '',
      text(objective.axis_name) ? `Eje D1: ${objective.axis_name}` : '',
    ].filter(Boolean).join('\n') : 'Objetivo D1: no encontrado; usar el contexto entregado por el docente sin inventar código OA.',
    compact(rowsToLines(indicators, ['indicator_text', 'observable_action', 'evaluation_type']), 8).length
      ? `Indicadores D1:\n- ${compact(rowsToLines(indicators, ['indicator_text', 'observable_action', 'evaluation_type']), 8).join('\n- ')}`
      : '',
    compact(rowsToLines(skills, ['code', 'official_text']), 6).length
      ? `Habilidades D1:\n- ${compact(rowsToLines(skills, ['code', 'official_text']), 6).join('\n- ')}`
      : '',
    compact(rowsToLines(attitudes, ['code', 'official_text']), 6).length
      ? `Actitudes D1:\n- ${compact(rowsToLines(attitudes, ['code', 'official_text']), 6).join('\n- ')}`
      : '',
    compact(rowsToLines(methodologies, ['name', 'description', 'educational_focus', 'pedagogical_approach']), 6).length
      ? `Metodologías D1:\n- ${compact(rowsToLines(methodologies, ['name', 'description', 'educational_focus', 'pedagogical_approach']), 6).join('\n- ')}`
      : '',
    compact(rowsToLines(strategies, ['name', 'description']), 6).length
      ? `Estrategias metodológicas D1:\n- ${compact(rowsToLines(strategies, ['name', 'description']), 6).join('\n- ')}`
      : '',
    compact(rowsToLines(templates, ['title', 'resource_type', 'description']), 4).length
      ? `Plantillas de recursos D1:\n- ${compact(rowsToLines(templates, ['title', 'resource_type', 'description']), 4).join('\n- ')}`
      : '',
    compact(rowsToLines(searchDocs, ['title', 'snippet', 'source_type']), 4).length
      ? `Documentos indexados D1:\n- ${compact(rowsToLines(searchDocs, ['title', 'snippet', 'source_type']), 4).join('\n- ')}`
      : '',
    vectorDocs.length
      ? `Contexto semántico Vectorize repo-pedagogico:\n- ${vectorDocs.join('\n- ')}`
      : '',
    'Usa este contexto para generar clases más detalladas, situadas en Chile, alineadas al MINEDUC, con DUA/PIE y evaluación formativa.',
  ].filter(Boolean).join('\n\n');

  const previousContext = text(req.pedagogicalContext);
  const nextContext = previousContext ? `${previousContext}\n\n${blocks}` : blocks;

  return {
    ...req,
    pedagogicalContext: sanitizeForPrompt(nextContext).slice(0, 8000),
  };
}
