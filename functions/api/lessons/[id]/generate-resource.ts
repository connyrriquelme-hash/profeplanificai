import { buildLocalGeneration, getCurriculumContext, getLessonBundle, getTeacherId, json, labelForAction, randomId, readJson, type Env } from '../../../_lib/my-classes';

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const teacherId = getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const lessonId = String(context.params.id || '');
  const body = await readJson(context.request);
  const bundle = await getLessonBundle(context.env.DB, lessonId, teacherId);
  if (!bundle) return json({ error: 'Clase no encontrada' }, 404);
  if (!bundle.curriculum?.objective_id) {
    return json({ error: 'Selecciona nivel, asignatura y OA antes de generar recursos con IA.' }, 400);
  }

  const action = String(body.action || body.resource_type || 'guia');
  const curriculumContext = await getCurriculumContext(context.env.DB, String(bundle.curriculum.objective_id), String(bundle.curriculum.level_id), String(bundle.curriculum.subject_id));
  if (!curriculumContext) return json({ error: 'No se pudo recuperar contexto curricular D1 para el OA seleccionado.' }, 400);

  const content = buildLocalGeneration('resource', action, curriculumContext, bundle.lesson, bundle.plan || {});
  const id = randomId('lesson_resource');
  const provider = context.env.GEMINI_API_KEY ? 'gemini-ready' : 'local';
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
      JSON.stringify(curriculumContext),
      provider,
    ).run();

  return json({ ok: true, message: 'Recurso guardado automaticamente', data: { id, type: action, title: labelForAction(action), content } }, 201);
}
