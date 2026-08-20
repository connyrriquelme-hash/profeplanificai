import { generateEducationalImage, type ImageEnv } from '../../_lib/images';
import { generateGuia, type GuiaEngineInput } from '../../core/GuiaEngine';
import type { AIEngineEnv } from '../../core/types';
import { validatePedagogicalProduct } from '../../_lib/pedagogicalQualityGate';
import { getAuthenticatedUserId } from '../../_lib/auth';

interface Env { DB: D1Database; JWT_SECRET?: string; AI?: ImageEnv['AI']; GEMINI_API_KEY?: string; ENABLE_IMAGE_AI?: string; IMAGE_PROVIDER_ORDER?: string; HF_API_TOKEN?: string; IMAGE_CACHE_TTL_DAYS?: string }

interface GuideRequest {
  type: 'guia_estudiante' | 'guia_docente';
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  topic: string;
  additionalContext?: string;
  methodology?: string;
  duration?: string;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as GuideRequest;
    const userId = context.env.JWT_SECRET ? await getAuthenticatedUserId(context.request, context.env.JWT_SECRET) : null;

    if (!body.level || !body.subject || !body.objectiveCode) {
      return Response.json({ error: 'level, subject y objectiveCode son requeridos' }, { status: 400 });
    }

    const db = context.env.DB;

    // Get curriculum context
    const objective = await db.prepare(
      `SELECT o.*, c.name as course_name, s.name as subject_name, a.name as axis_name
       FROM objectives o LEFT JOIN courses c ON o.course_id = c.id LEFT JOIN subjects s ON o.subject_id = s.id LEFT JOIN axes a ON a.id = o.axis_id
       WHERE o.code = ?`
    ).bind(body.objectiveCode).first();

    const indicators = await db.prepare(
      `SELECT ci.indicator_text FROM curriculum_indicators ci WHERE ci.oa_code = ? LIMIT 10`
    ).bind(body.objectiveCode).all();

    // Build guide structure
    const guiaInput: GuiaEngineInput = {
      level: body.level,
      subject: body.subject,
      objectiveCode: body.objectiveCode,
      objectiveText: body.objectiveText,
      topic: body.topic,
      indicators: (indicators as any)?.results?.map((i: any) => i.indicator_text) || [],
      duration: body.duration,
      additionalContext: body.additionalContext,
    };
    const guide = await generateGuia(
      { AI: context.env.AI, GEMINI_API_KEY: context.env.GEMINI_API_KEY } as AIEngineEnv,
      guiaInput,
      body.type === 'guia_estudiante' ? 'estudiante' : 'docente',
    );
    const quality = validatePedagogicalProduct(guide, {
      objectiveCode: body.objectiveCode,
      objectiveText: body.objectiveText,
      productType: body.type,
    });
    // Generate images for guide sections (en paralelo — antes era secuencial)
    const imageEnv: ImageEnv = { DB: context.env.DB, AI: context.env.AI, ENABLE_IMAGE_AI: context.env.ENABLE_IMAGE_AI, IMAGE_PROVIDER_ORDER: context.env.IMAGE_PROVIDER_ORDER, HF_API_TOKEN: context.env.HF_API_TOKEN, IMAGE_CACHE_TTL_DAYS: context.env.IMAGE_CACHE_TTL_DAYS };

    const imageResults = await Promise.allSettled(
      guide.sections.map((section) =>
        generateEducationalImage({
          grade: body.level,
          subject: body.subject,
          oa: body.objectiveText || body.topic || body.objectiveCode,
          resourceTitle: body.topic || 'Guía de aprendizaje',
          slideTitle: section.title,
          slideContent: section.content.slice(0, 300),
        }, imageEnv)
      ),
    );

    // Array alineado 1:1 con guide.sections (huecos undefined si falló) —
    // antes era denso vía push() secuencial, lo que desalineaba
    // guideImages[index] contra sections[index] en GuideRenderer.tsx si
    // alguna imagen intermedia fallaba.
    const guideImages: Array<{ url: string; alt: string; source: string; attribution: string } | undefined> = imageResults.map((r, i) =>
      r.status === 'fulfilled' && r.value.ok
        ? { url: r.value.url, alt: `Imagen: ${guide.sections[i].title}`, source: r.value.source, attribution: r.value.attribution || '' }
        : undefined
    );
    const imageTitles = guideImages.map((img, i) => img ? guide.sections[i].title : null).filter(Boolean);

    // Attach images to guide data
    (guide as any).images = guideImages;
    (guide as any).imageTitles = imageTitles;

    // Save to D1
    const resourceId = `guide_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, user_id, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      `${body.type === 'guia_estudiante' ? 'Guía Estudiante' : 'Guía Docente'}: ${body.objectiveCode}`,
      body.type,
      JSON.stringify(guide),
      JSON.stringify({ topic: body.topic, methodology: body.methodology }),
      body.level,
      body.subject,
      body.objectiveCode,
      userId,
      JSON.stringify(body.indicators || []),
      JSON.stringify(body.skills || []),
      `Guía generada para ${body.objectiveCode} — ${body.subject}`
    ).run();

    return Response.json({ ok: true, resourceId, guide, quality, context: { objective, indicators: (indicators as any)?.results || [] } });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar guía', details: err.message }, { status: 500 });
  }
}

