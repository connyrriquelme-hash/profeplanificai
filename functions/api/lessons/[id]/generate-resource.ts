import { buildLocalGeneration, getCurriculumContext, getLessonBundle, getTeacherId, json, labelForAction, randomId, readJson, type Env } from '../../../_lib/my-classes';
import { orchestrate } from '../../../_lib/ai/orchestrator';
import type { AIEnv, AIRequest, TaskType } from '../../../_lib/ai/types';

function taskForResourceAction(action: string): TaskType {
  if (action === 'guia') return 'crear_guia';
  if (action === 'rubrica') return 'crear_rubrica';
  if (action === 'ticket') return 'crear_ticket_salida';
  if (action === 'presentation') return 'crear_ppt';
  if (action === 'mejora') return 'mejorar';
  if (['descendidos', 'alta_exigencia', 'dua'].includes(action)) return 'adaptar';
  return 'generar';
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const teacherId = await getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const lessonId = String(context.params.id || '');
  const body = await readJson(context.request);
  const bundle = await getLessonBundle(context.env.DB, lessonId, teacherId);
  if (!bundle) return json({ error: 'Clase no encontrada' }, 404);

  const action = String(body.action || body.resource_type || 'guia');

  let curriculumContext;
  if (bundle.curriculum?.objective_id) {
    curriculumContext = await getCurriculumContext(context.env.DB, String(bundle.curriculum.objective_id), String(bundle.curriculum.level_id), String(bundle.curriculum.subject_id));
  } else {
    const levelId = String(bundle.lesson.level_id || '');
    const subjectId = String(bundle.lesson.subject_id || '');
    const courseName = String(bundle.lesson.course_name || '');
    curriculumContext = {
      level_id: levelId, subject_id: subjectId, axis_id: null,
      objective: { id: '', code: 'OA pendiente', official_text: `Actividad curricular para ${courseName}. El OA debe ser revisado y ajustado por el docente.`, normalized_text: '' },
      indicators: [], skills: [], attitudes: [], methodologies: [],
    };
  }
  if (!curriculumContext) return json({ error: 'No se pudo recuperar contexto curricular.' }, 400);

  const localContent = buildLocalGeneration('resource', action, curriculumContext, bundle.lesson, bundle.plan || {});
  const objective = curriculumContext.objective as Record<string, unknown>;
  const aiEnv: AIEnv = {
    DB: context.env.DB,
    JWT_SECRET: context.env.JWT_SECRET,
    GEMINI_API_KEY: context.env.GEMINI_API_KEY,
    OPENROUTER_API_KEY: context.env.OPENROUTER_API_KEY,
    HUGGINGFACE_API_KEY: context.env.HUGGINGFACE_API_KEY,
    AI_DEFAULT_MODEL_GEMINI: context.env.AI_DEFAULT_MODEL_GEMINI,
    AI: context.env.AI,
    REPO_PEDAGOGICO: context.env.REPO_PEDAGOGICO,
  };
  const aiRequest: AIRequest = {
    agentType: action === 'dua' ? 'dua' : 'generador_recursos',
    taskType: taskForResourceAction(action),
    lessonId,
    course: String(bundle.lesson.course_name || ''),
    subject: String(bundle.lesson.subject_id || ''),
    grade: String(bundle.lesson.course_name || ''),
    oaCode: String(objective.code || ''),
    oaText: String(objective.official_text || objective.normalized_text || ''),
    indicators: (curriculumContext.indicators as Record<string, unknown>[]).map((i) => String(i.description || i.indicator_text || '')).filter(Boolean),
    skills: (curriculumContext.skills as Record<string, unknown>[]).map((s) => String(s.description || s.official_text || '')).filter(Boolean),
    attitudes: (curriculumContext.attitudes as Record<string, unknown>[]).map((a) => String(a.description || a.official_text || '')).filter(Boolean),
    instructions: `${labelForAction(action)}. ${String(bundle.plan?.teacher_observations || '')}`.trim(),
    outputFormat: 'json',
    existingContent: JSON.stringify(bundle.plan || {}),
  };

  let content: Record<string, unknown> = localContent;
  let provider = 'local';
  let warnings: string[] = [];
  try {
    const ai = await orchestrate(aiEnv, aiRequest, teacherId);
    provider = ai.provider;
    warnings = ai.warnings || [];
    if (ai.ok && ai.structured && Object.keys(ai.structured).length > 0) {
      content = {
        ...localContent,
        aiGenerated: true,
        provider: ai.provider,
        model: ai.model,
        warnings: ai.warnings,
        detailed: ai.structured,
      };
    } else if (ai.ok && ai.content) {
      content = {
        ...localContent,
        aiGenerated: true,
        provider: ai.provider,
        model: ai.model,
        warnings: ai.warnings,
        content: [ai.content],
      };
    }
  } catch (err) {
    warnings = [`IA no disponible; se usó generación local. ${err instanceof Error ? err.message : ''}`.trim()];
  }
  const id = randomId('lesson_resource');
  await context.env.DB.prepare(`INSERT INTO lesson_generated_resources
    (id, lesson_plan_id, resource_type, title, content_json, file_url, source_context_json, ai_provider, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
    .bind(
      id,
      bundle.plan?.id,
      action,
      labelForAction(action),
      JSON.stringify(content),
      null,
      JSON.stringify({ ...curriculumContext, warnings }),
      provider,
    ).run();

  return json({ ok: true, provider, warnings, message: 'Recurso guardado automaticamente', data: { id, type: action, title: labelForAction(action), content } }, 201);
}
