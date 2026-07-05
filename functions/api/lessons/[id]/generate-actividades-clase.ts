import { buildActividadesClase, ensureLessonPlan, getCurriculumContext, getLessonBundle, getTeacherId, json, nowIso, readJson, text, type Env } from '../../../_lib/my-classes';
import { orchestrate } from '../../../_lib/ai/orchestrator';
import type { AIEnv, AIRequest } from '../../../_lib/ai/types';

const EXPECTED_AI_FIELDS = ['objetivoEspecifico', 'proposito', 'inicio', 'desarrollo', 'cierre', 'evaluacionFormativa', 'ticketSalida', 'recursosMateriales', 'adecuacionesDUA', 'apoyoEstudiantesDescendidos', 'extensionAvanzados'];

function normalizeActividadesFromAI(aiStructured: Record<string, unknown>, fallback: Record<string, string>): Record<string, string> {
  return {
    objetivoEspecifico: text(aiStructured.objetivoEspecifico) || fallback.objetivoEspecifico || '',
    proposito: text(aiStructured.proposito) || fallback.proposito || '',
    inicio: text(aiStructured.inicio) || fallback.inicio || '',
    desarrollo: text(aiStructured.desarrollo) || fallback.desarrollo || '',
    cierre: text(aiStructured.cierre) || fallback.cierre || '',
    evaluacionFormativa: text(aiStructured.evaluacionFormativa) || fallback.evaluacionFormativa || '',
    ticketSalida: text(aiStructured.ticketSalida) || fallback.ticketSalida || '',
    recursosMateriales: Array.isArray(aiStructured.recursosMateriales)
      ? aiStructured.recursosMateriales.map(String).filter(Boolean).join('\n')
      : typeof aiStructured.recursosMateriales === 'string' ? aiStructured.recursosMateriales
      : fallback.recursosMateriales || '',
    adecuacionesDUA: text(aiStructured.adecuacionesDUA) || fallback.adecuacionesDUA || '',
    apoyoEstudiantesDescendidos: text(aiStructured.apoyoEstudiantesDescendidos) || fallback.apoyoEstudiantesDescendidos || '',
    extensionAvanzados: text(aiStructured.extensionAvanzados) || fallback.extensionAvanzados || '',
  };
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const teacherId = await getTeacherId(context);
    if (!teacherId) return json({ error: 'No autorizado' }, 401);

    const lessonId = String(context.params.id || '');
    const body = await readJson(context.request);
    const bundle = await getLessonBundle(context.env.DB, lessonId, teacherId);
    if (!bundle) return json({ error: 'Clase no encontrada' }, 404);

  const existingBeginning = text(bundle.plan?.beginning_text);
  const existingDevelopment = text(bundle.plan?.development_text);
  const existingClosure = text(bundle.plan?.closure_text);
  if (existingBeginning && existingDevelopment && existingClosure && !body.force) {
    return json({
      ok: false,
      error: 'replace_required',
      message: 'Esta clase ya tiene actividades generadas. Deseas reemplazarlas?',
    }, 409);
  }

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

  const instructions = text(body.instructions || bundle.plan?.teacher_observations);
  const objective = curriculumContext.objective as Record<string, unknown>;
  const hasRealOA = objective?.code && objective.code !== 'OA pendiente';
  const courseName = String(bundle.lesson.course_name || '');
  const subjectId = String(bundle.lesson.subject_id || '');
  const lessonTitle = String(bundle.lesson.title || 'Clase');

  const localActividades = buildActividadesClase(curriculumContext, bundle.lesson, bundle.plan || {}, instructions || undefined);
  const localAc = localActividades.actividadesClase as Record<string, string>;

  let provider = 'local';
  let model = 'fallback-pedagogico';
  let usedFallback = true;
  const warnings: string[] = [];

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
    agentType: 'actividades_clase',
    taskType: 'generar',
    lessonId,
    course: courseName,
    subject: subjectId,
    grade: courseName,
    oa: hasRealOA ? `${objective.code}: ${objective.official_text}` : undefined,
    oaCode: hasRealOA ? String(objective.code) : undefined,
    oaText: hasRealOA ? String(objective.official_text) : undefined,
    indicators: (curriculumContext.indicators as Record<string, unknown>[]).map((i) => String(i.indicator_text || i.description || '')).filter(Boolean),
    skills: (curriculumContext.skills as Record<string, unknown>[]).map((s) => String(s.official_text || s.description || '')).filter(Boolean),
    attitudes: (curriculumContext.attitudes as Record<string, unknown>[]).map((a) => String(a.official_text || a.description || '')).filter(Boolean),
    instructions: instructions || undefined,
    outputFormat: 'json',
  };

  let ai: Awaited<ReturnType<typeof orchestrate>> | null = null;
  try {
    ai = await orchestrate(aiEnv, aiRequest, teacherId);
  } catch (e) {
    warnings.push(`Error en orquestador: ${e instanceof Error ? e.message : 'desconocido'}. Se usa generacion local.`);
  }

  let ac: Record<string, string>;
  let aiPartial = false;
  if (ai && ai.ok && ai.structured && Object.keys(ai.structured).length > 0) {
    provider = ai.provider;
    model = ai.model;
    usedFallback = ai.usedFallback;
    warnings.push(...ai.warnings);
    const filledFields = EXPECTED_AI_FIELDS.filter((f) => {
      const v = ai!.structured[f];
      if (Array.isArray(v)) return v.length > 0;
      return typeof v === 'string' ? v.trim().length > 0 : Boolean(v);
    });
    if (filledFields.length < EXPECTED_AI_FIELDS.length * 0.6) {
      aiPartial = true;
      warnings.push('Respuesta IA incompleta; se completaron campos con fallback local.');
    }
    ac = normalizeActividadesFromAI(ai.structured, localAc);
  } else if (ai && ai.ok && ai.content) {
    provider = ai.provider;
    model = ai.model;
    usedFallback = ai.usedFallback;
    warnings.push(...ai.warnings);
    ac = localAc;
    aiPartial = true;
    warnings.push('Respuesta IA no era JSON estructurado. Se uso generacion local para campos.');
  } else {
    if (ai?.warnings?.length) warnings.push(...ai.warnings);
    ac = localAc;
  }

  if (!hasRealOA) {
    warnings.push('Generado sin OA explicito. Puedes seleccionar OA despues para mejorar la alineacion curricular.');
  }

  const planId = await ensureLessonPlan(context.env.DB, lessonId, teacherId, lessonTitle);
  const now = nowIso();

  const planFields: [string, string][] = [
    ['objective_text', ac.objetivoEspecifico || ''],
    ['purpose_text', ac.proposito || ''],
    ['beginning_text', ac.inicio || ''],
    ['development_text', ac.desarrollo || ''],
    ['closure_text', ac.cierre || ''],
    ['evaluation_text', ac.evaluacionFormativa || ''],
    ['instruments_text', ac.ticketSalida || ''],
    ['resources_text', ac.recursosMateriales || ''],
    ['dua_adjustments_text', ac.adecuacionesDUA || ''],
    ['abp_project_text', ac.apoyoEstudiantesDescendidos || ''],
    ['challenge_question', ac.extensionAvanzados || ''],
    ['ai_summary', JSON.stringify({
      provider, model, usedFallback, warnings,
      generatedAt: now,
      agentType: 'actividades_clase',
      taskType: 'generar',
      partialResponse: aiPartial,
    })],
  ];

  const updates: string[] = [];
  const values: unknown[] = [];
  for (const [field, value] of planFields) {
    updates.push(`${field} = ?`);
    values.push(value);
  }
  updates.push('autosave_version = autosave_version + 1');
  updates.push('updated_at = ?');
  values.push(now, planId, teacherId);

  try {
    await context.env.DB.prepare(`UPDATE lesson_plans SET ${updates.join(', ')} WHERE id = ? AND teacher_id = ?`)
      .bind(...values).run();
  } catch (dbErr) {
    console.error('[generate-actividades-clase] DB error:', dbErr);
    return json({
      ok: true,
      provider,
      model,
      usedFallback,
      warnings: [...warnings, 'Las actividades se generaron pero no se guardaron en la base de datos. Intenta guardar manualmente.'],
      message: 'Actividades generadas pero no guardadas. Intenta guardar manualmente.',
      data: localActividades,
    }, 201);
  }

  return json({
    ok: true,
    provider,
    model,
    usedFallback,
    warnings,
    message: 'Actividades de clase generadas. Recuerda guardar los cambios.',
    data: localActividades,
  }, 201);
  } catch (err) {
    console.error('[generate-actividades-clase] Error:', err);
    return json({ error: 'Error al generar actividades de clase.' }, 500);
  }
}
