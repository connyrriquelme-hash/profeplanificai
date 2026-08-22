import { buildLocalGeneration, getCurriculumContext, getLessonBundle, getTeacherId, json, randomId, readJson, type Env, type JsonRecord } from '../../../_lib/my-classes';
import { generateDeckContent } from '../../../core/PptContentEngine';
import { suggestMasterTemplate } from '../../../core/pptMasterTemplates';
import { pptDeckToLegacySlides } from '../../materials/presentation';
import type { AIEngineEnv, PedagogicalPlan } from '../../../core/types';

// Construye el PedagogicalPlan que espera generateDeckContent() a partir del
// contexto curricular + plan de clase ya guardados para esta lección (los
// mismos datos que buildLocalGeneration ya usaba para el wrapper de
// metadata) -- ver auditoría "Mis Clases genera presentaciones sin IA real".
function buildPlanFromLessonContext(ctx: JsonRecord, lesson: JsonRecord, plan: JsonRecord): PedagogicalPlan {
  const objective = (ctx.objective as JsonRecord) || {};
  const skills = ((ctx.skills as JsonRecord[]) || []).map((s) => String(s.description || s.official_text || '')).filter(Boolean);
  const tema = String(lesson.title || objective.official_text || 'Tema de la clase');
  const curso = String(lesson.course_name || '');
  const asignatura = String(ctx.subject_id || lesson.subject_id || '');

  return {
    tema,
    curso,
    asignatura,
    objetivo_aprendizaje: `${objective.code || 'OA'}: ${objective.official_text || tema}`,
    habilidades: skills.join(', ') || 'Comprender y aplicar',
    taxonomia_bloom_sugerida: 'Comprender y Aplicar',
    estructura_clase: {
      inicio: { tiempo_minutos: 15, descripcion: String(plan.beginning_text || `Activar conocimientos previos sobre ${tema}.`) },
      desarrollo: { tiempo_minutos: 60, descripcion: String(plan.development_text || `Desarrollar actividades guiadas sobre ${tema}.`) },
      cierre: { tiempo_minutos: 15, descripcion: String(plan.closure_text || 'Sintetizar los aprendizajes de la clase.') },
    },
  };
}

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

  // Mismo motor real que ya usa Flujo Docente (/api/materials/presentation
  // → PptContentEngine.generateDeckContent) en vez del arreglo de 4 slides
  // fijas que este endpoint tenía antes, que nunca llamaba a ningún
  // proveedor de IA pese a guardar `ai_provider: 'gemini-ready'`.
  const plan = buildPlanFromLessonContext(curriculumContext as unknown as JsonRecord, bundle.lesson, bundle.plan || {});
  const masterTemplate = suggestMasterTemplate(plan.asignatura, plan.curso);
  const deck = await generateDeckContent(
    { AI: context.env.AI, GEMINI_API_KEY: context.env.GEMINI_API_KEY, GROQ_API_KEY: context.env.GROQ_API_KEY } as AIEngineEnv,
    plan,
    { masterTemplate },
  );

  const content = {
    ...base,
    format: 'pptx-editable-metadata',
    slides: pptDeckToLegacySlides(deck),
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
      deck._fallbackReason ? 'local' : 'ai',
    ).run();

  return json({ ok: true, message: 'Recurso guardado automaticamente', data: { id, type: 'presentation', title: 'Presentacion PPT editable', content } }, 201);
}
