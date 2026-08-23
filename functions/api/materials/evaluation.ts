import { generateEducationalImage, type ImageEnv } from '../../_lib/images';
import { validatePedagogicalProduct } from '../../_lib/pedagogicalQualityGate';
import { getAuthenticatedUserId } from '../../_lib/auth';
import { generateEvaluacionEscrita, type EvaluacionEscritaQuestion, type EvaluacionEscritaTipo } from '../../core/EvaluacionEscritaEngine';
import type { AIEngineEnv } from '../../core/types';

interface Env {
  DB: D1Database;
  JWT_SECRET?: string;
  AI?: ImageEnv['AI'];
  GEMINI_API_KEY?: string;
  GROQ_API_KEY?: string;
  ENABLE_IMAGE_AI?: string;
  IMAGE_PROVIDER_ORDER?: string;
  HF_API_TOKEN?: string;
  IMAGE_CACHE_TTL_DAYS?: string;
}

interface EvaluationRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  topic: string;
  questionCount?: number;
  difficulty?: string;
  type?: EvaluacionEscritaTipo;
}

function correctAnswerLetter(q: EvaluacionEscritaQuestion): string {
  if (q.type === 'alternativa' && q.options) {
    const idx = q.options.findIndex((o) => o.isCorrect);
    return idx >= 0 ? String.fromCharCode(65 + idx) : 'A';
  }
  if (q.type === 'verdadero_falso') return q.answer || 'V';
  return 'Respuesta modelo (ver pauta)';
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as EvaluationRequest;
    const userId = context.env.JWT_SECRET ? await getAuthenticatedUserId(context.request, context.env.JWT_SECRET) : null;

    if (!body.level || !body.subject || !body.objectiveCode) {
      return Response.json({ error: 'level, subject y objectiveCode son requeridos' }, { status: 400 });
    }

    const db = context.env.DB;
    const objective = await db.prepare(
      `SELECT o.*, c.name as course_name, s.name as subject_name FROM objectives o LEFT JOIN courses c ON o.course_id = c.id LEFT JOIN subjects s ON o.subject_id = s.id WHERE o.code = ?`
    ).bind(body.objectiveCode).first();

    const indicatorsRows = await db.prepare(
      `SELECT ci.indicator_text FROM curriculum_indicators ci WHERE ci.oa_code = ? LIMIT 10`
    ).bind(body.objectiveCode).all();
    const indText = ((indicatorsRows as any)?.results || []).map((i: any) => i.indicator_text).filter(Boolean);

    // Mismo motor real que ya usa Flujo Docente para el resto de los
    // productos (callAIConValidacion con cascada Workers AI → Gemini →
    // Groq). Antes este endpoint SIEMPRE devolvía texto fijo interpolado
    // ("Alternativa correcta"/"Pregunta de selección múltiple sobre X" para
    // cualquier tema), sin llamar nunca a un proveedor de IA.
    const generated = await generateEvaluacionEscrita(
      { AI: context.env.AI, GEMINI_API_KEY: context.env.GEMINI_API_KEY, GROQ_API_KEY: context.env.GROQ_API_KEY } as AIEngineEnv,
      {
        level: body.level,
        subject: body.subject,
        objectiveCode: body.objectiveCode,
        objectiveText: body.objectiveText || body.topic || '',
        topic: body.topic || body.objectiveText || '',
        indicators: (body.indicators && body.indicators.length ? body.indicators : indText),
        tipo: body.type || 'formativa',
        questionCount: body.questionCount,
      },
    );

    const ctx = (objective as any)?.course_name || body.level;
    const subj = (objective as any)?.subject_name || body.subject;

    const evaluation: any = {
      metadata: {
        course: ctx,
        subject: subj,
        unit: body.topic || body.objectiveCode,
        oa: body.objectiveCode,
        total_score: generated.totalPoints,
        type: body.type || 'formativa',
      },
      title: generated.title,
      instructions: generated.instructions,
      questions: generated.questions,
      answerKey: {
        summary: 'Pauta de corrección: revisa cada pregunta según el puntaje indicado y la justificación cuando corresponda.',
        question_answers: generated.questions.map((q) => ({
          number: q.number,
          correct_answer: correctAnswerLetter(q),
          explanation: q.type === 'desarrollo'
            ? q.teacher_rubric?.sample_answer || 'Ver pauta de desarrollo.'
            : (q.justification_if_false || 'Respuesta correcta según el OA evaluado.'),
        })),
        total_points: generated.totalPoints,
      },
      usedFallback: generated.usedFallback,
    };

    const quality = validatePedagogicalProduct(evaluation, {
      objectiveCode: body.objectiveCode,
      objectiveText: body.objectiveText,
      productType: 'evaluacion',
    });
    // Generate images for open-ended questions. En paralelo: cada pregunta
    // es independiente, y en secuencia una evaluación con varias preguntas
    // desarrollo/verdadero_falso podía acumular demasiada latencia total
    // (mismo problema resuelto para rubric.ts).
    const imageEnv: ImageEnv = { DB: context.env.DB, AI: context.env.AI, ENABLE_IMAGE_AI: context.env.ENABLE_IMAGE_AI, IMAGE_PROVIDER_ORDER: context.env.IMAGE_PROVIDER_ORDER, HF_API_TOKEN: context.env.HF_API_TOKEN, IMAGE_CACHE_TTL_DAYS: context.env.IMAGE_CACHE_TTL_DAYS };
    const imageableQuestions = (evaluation.questions || []).filter((q) => q.type === 'desarrollo' || q.type === 'verdadero_falso');
    const questionImageResults = await Promise.all(imageableQuestions.map(async (q) => {
      try {
        const result = await generateEducationalImage({
          grade: body.level,
          subject: body.subject,
          oa: body.objectiveText || body.topic || body.objectiveCode,
          resourceTitle: body.topic || 'Evaluación',
          slideTitle: q.text?.slice(0, 100) || 'Pregunta de evaluación',
          slideContent: q.text?.slice(0, 300) || '',
        }, imageEnv);
        if (result.ok) {
          return { image: { url: result.url, alt: `Imagen: Pregunta ${q.number}`, source: result.source, attribution: result.attribution || '' }, title: `Pregunta ${q.number}` };
        }
      } catch {
        // Image generation failure is non-fatal
      }
      return null;
    }));
    const questionImages = questionImageResults.filter((r): r is NonNullable<typeof r> => r !== null).map((r) => r.image);
    const imageTitles = questionImageResults.filter((r): r is NonNullable<typeof r> => r !== null).map((r) => r.title);

    if (questionImages.length > 0) {
      evaluation.images = questionImages;
      evaluation.imageTitles = imageTitles;
    }

    const resourceId = `eval_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, user_id, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, 'evaluacion', ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      `Evaluación: ${body.objectiveCode}`,
      JSON.stringify(evaluation),
      JSON.stringify({ type: body.type || 'formativa', questionCount: body.questionCount || 10 }),
      body.level,
      body.subject,
      body.objectiveCode,
      userId,
      JSON.stringify(body.indicators || []),
      JSON.stringify(body.skills || []),
      `Evaluación generada para ${body.objectiveCode}`
    ).run();

    return Response.json({ ok: true, resourceId, evaluation, quality, context: { objective, indicators: (indicatorsRows as any)?.results || [] } });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar evaluación', details: err.message }, { status: 500 });
  }
}
