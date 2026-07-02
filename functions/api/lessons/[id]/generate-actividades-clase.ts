import { buildActividadesClase, ensureLessonPlan, getCurriculumContext, getLessonBundle, getTeacherId, json, nowIso, readJson, text, type Env } from '../../../_lib/my-classes';

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
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
  const actividades = buildActividadesClase(curriculumContext, bundle.lesson, bundle.plan || {}, instructions || undefined);

  const ac = actividades.actividadesClase as Record<string, string>;
  const planId = await ensureLessonPlan(context.env.DB, lessonId, teacherId, String(bundle.lesson.title || 'Clase'));
  const now = nowIso();

  const planFields: [string, string][] = [
    ['objective_text', ac.objetivoEspecifico || ''],
    ['purpose_text', ac.proposito || ''],
    ['beginning_text', ac.inicio || ''],
    ['development_text', ac.desarrollo || ''],
    ['closure_text', ac.cierre || ''],
    ['evaluation_text', ac.evaluacionFormativa || ''],
    ['instruments_text', ac.ticketSalida || ''],
    ['resources_text', Array.isArray(ac.recursosMateriales) ? ac.recursosMateriales.join('\n') : ''],
    ['dua_adjustments_text', ac.adecuacionesDUA || ''],
    ['abp_project_text', ac.apoyoEstudiantesDescendidos || ''],
    ['challenge_question', ac.extensionAvanzados || ''],
    ['ai_summary', JSON.stringify(actividades)],
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

  await context.env.DB.prepare(`UPDATE lesson_plans SET ${updates.join(', ')} WHERE id = ? AND teacher_id = ?`)
    .bind(...values).run();

  return json({
    ok: true,
    message: 'Actividades de clase generadas. Recuerda guardar los cambios.',
    data: actividades,
  }, 201);
}
