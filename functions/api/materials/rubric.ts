import { generateEducationalImage, type ImageEnv } from '../../_lib/images';
import {
  buildPremiumRubric,
  detectSubjectCategory,
  truncate,
  fetchRubricaCurricularContext,
  generateRubricaContent,
  type RubricaContextInput,
} from '../../core/RubricaEngine';

// Re-exportadas para no romper test/serverRubricCoverage.test.ts, que
// importa estas funciones puras directamente desde este archivo.
export { buildPremiumRubric, detectSubjectCategory };

interface Env {
  DB: D1Database;
  AI?: ImageEnv['AI'];
  ENABLE_IMAGE_AI?: string;
  IMAGE_PROVIDER_ORDER?: string;
  HF_API_TOKEN?: string;
  IMAGE_CACHE_TTL_DAYS?: string;
}

interface RubricRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  topic: string;
  additionalContext?: string;
  criteria?: string[];
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as RubricRequest;

    if (!body.level || !body.subject || !body.objectiveCode) {
      return Response.json({ error: 'level, subject y objectiveCode son requeridos' }, { status: 400 });
    }

    const db = context.env.DB;
    const objective = await db.prepare(
      `SELECT o.*, c.name as course_name, s.name as subject_name FROM objectives o LEFT JOIN courses c ON o.course_id = c.id LEFT JOIN subjects s ON o.subject_id = s.id WHERE o.code = ?`
    ).bind(body.objectiveCode).first();

    const indicators = await db.prepare(
      `SELECT ci.indicator_text FROM curriculum_indicators ci WHERE ci.oa_code = ? LIMIT 10`
    ).bind(body.objectiveCode).all();

    const officialIndicators = ((indicators as any)?.results || [])
      .map((i: any) => i.indicator_text)
      .filter(Boolean);
    const indText = officialIndicators.slice(0, 5);

    const oaText = body.objectiveText || body.topic || '';
    const nivel = (objective as any)?.course_name || body.level;
    const asignatura = (objective as any)?.subject_name || body.subject;
    const topic = body.topic || truncate(oaText, 60);
    const officialObjectiveText = (objective as any)?.official_text || oaText;

    const contextInput: RubricaContextInput = {
      level: nivel,
      subject: asignatura,
      objectiveCode: body.objectiveCode,
      objectiveText: oaText,
      topic,
      clientIndicators: [...(body.indicators || []), ...indText],
      clientSkills: body.skills || [],
    };

    const rubric = context.env.AI
      ? await generateRubricaContent(
          { AI: context.env.AI },
          contextInput,
          await fetchRubricaCurricularContext(db, body.objectiveCode, officialObjectiveText, officialIndicators),
        )
      : buildPremiumRubric({
          level: nivel,
          subject: asignatura,
          objectiveCode: body.objectiveCode,
          objectiveText: oaText,
          topic,
          indicators: contextInput.clientIndicators,
          skills: contextInput.clientSkills,
        });

    // Generate images for rubric criteria
    const imageEnv: ImageEnv = { DB: context.env.DB, AI: context.env.AI, ENABLE_IMAGE_AI: context.env.ENABLE_IMAGE_AI, IMAGE_PROVIDER_ORDER: context.env.IMAGE_PROVIDER_ORDER, HF_API_TOKEN: context.env.HF_API_TOKEN, IMAGE_CACHE_TTL_DAYS: context.env.IMAGE_CACHE_TTL_DAYS };
    const criterionImages: Array<{ url: string; alt: string; source: string; attribution: string }> = [];
    const imageTitles: string[] = [];

    for (const criterion of (rubric as any).criteria || []) {
      try {
        const result = await generateEducationalImage({
          grade: nivel,
          subject: asignatura,
          oa: body.objectiveText || body.topic || body.objectiveCode,
          resourceTitle: body.topic || 'Rúbrica de evaluación',
          slideTitle: criterion.name || criterion.description || 'Criterio',
          slideContent: (criterion.indicators || []).map((i: any) => i.descriptor).join('. ').slice(0, 300),
        }, imageEnv);
        if (result.ok) {
          criterionImages.push({ url: result.url, alt: `Ilustración: ${criterion.name}`, source: result.source, attribution: result.attribution || '' });
          imageTitles.push(criterion.name || 'Criterio');
        }
      } catch {
        // Image generation failure is non-fatal
      }
    }

    if (criterionImages.length > 0) {
      (rubric as any).images = criterionImages;
      (rubric as any).imageTitles = imageTitles;
    }

    const resourceId = `rubric_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, 'rubrica', ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      rubric.title,
      JSON.stringify(rubric),
      JSON.stringify({}),
      nivel,
      asignatura,
      body.objectiveCode,
      JSON.stringify(body.indicators || []),
      `Rúbrica premium generada para ${body.objectiveCode}`
    ).run();

    return Response.json({ ok: true, resourceId, rubric });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar rúbrica', details: err.message }, { status: 500 });
  }
}
