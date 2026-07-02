import { buildLocalGeneration, getCurriculumContext, getLessonBundle, getTeacherId, json, randomId, readJson, type Env } from '../../../_lib/my-classes';

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  const teacherId = await getTeacherId(context);
  if (!teacherId) return json({ error: 'No autorizado' }, 401);

  const lessonId = String(context.params.id || '');
  const body = await readJson(context.request);
  const bundle = await getLessonBundle(context.env.DB, lessonId, teacherId);
  if (!bundle) return json({ error: 'Clase no encontrada' }, 404);

  let curriculumContext;
  if (bundle.curriculum?.objective_id) {
    curriculumContext = await getCurriculumContext(context.env.DB, String(bundle.curriculum.objective_id), String(bundle.curriculum.level_id), String(bundle.curriculum.subject_id));
  } else {
    const levelId = String(bundle.lesson.level_id || '');
    const subjectId = String(bundle.lesson.subject_id || '');
    const courseName = String(bundle.lesson.course_name || '');
    curriculumContext = {
      level_id: levelId, subject_id: subjectId, axis_id: null,
      objective: { id: '', code: 'OA pendiente', official_text: `Presentacion para ${courseName}. El OA debe ser revisado y ajustado por el docente.`, normalized_text: '' },
      indicators: [], skills: [], attitudes: [], methodologies: [],
    };
  }
  if (!curriculumContext) return json({ error: 'No se pudo recuperar contexto curricular.' }, 400);

  const base = buildLocalGeneration('resource', 'presentation', curriculumContext, bundle.lesson, bundle.plan || {});
  const content = {
    ...base,
    format: 'pptx-editable-metadata',
    slides: [
      { title: 'Inicio', bullets: ['Pregunta activadora', 'Conexion con experiencias previas'] },
      { title: 'OA de la clase', bullets: [String((curriculumContext.objective as any)?.code || 'OA'), String((curriculumContext.objective as any)?.official_text || '')] },
      { title: 'Desarrollo', bullets: ['Modelamiento docente', 'Practica guiada', 'Trabajo colaborativo'] },
      { title: 'Cierre', bullets: ['Ticket de salida', 'Metacognicion breve'] },
    ],
  };
  const id = randomId('lesson_ppt');
  await context.env.DB.prepare(`INSERT INTO lesson_generated_resources
    (id, lesson_plan_id, resource_type, title, content_json, file_url, source_context_json, ai_provider, created_at, updated_at)
    VALUES (?, ?, 'presentation', ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
    .bind(
      id,
      bundle.plan?.id,
      String(body.title || 'Presentacion PPT editable'),
      JSON.stringify(content),
      null,
      JSON.stringify(curriculumContext),
      context.env.GEMINI_API_KEY ? 'gemini-ready' : 'local',
    ).run();

  return json({ ok: true, message: 'Recurso guardado automaticamente', data: { id, type: 'presentation', title: 'Presentacion PPT editable', content } }, 201);
}
