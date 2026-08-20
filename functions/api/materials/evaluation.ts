import { generateEducationalImage, type ImageEnv } from '../../_lib/images';
import { validatePedagogicalProduct } from '../../_lib/pedagogicalQualityGate';

interface Env { DB: D1Database; AI?: ImageEnv['AI']; ENABLE_IMAGE_AI?: string; IMAGE_PROVIDER_ORDER?: string; HF_API_TOKEN?: string; IMAGE_CACHE_TTL_DAYS?: string }

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
  type?: 'formativa' | 'sumativa' | 'diagnostica';
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as EvaluationRequest;

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

    const evaluation = buildEvaluation(body, objective as any, (indicators as any)?.results || []);
    const quality = validatePedagogicalProduct(evaluation, {
      objectiveCode: body.objectiveCode,
      objectiveText: body.objectiveText,
      productType: 'evaluacion',
    });
    // Generate images for open-ended questions
    const imageEnv: ImageEnv = { DB: context.env.DB, AI: context.env.AI, ENABLE_IMAGE_AI: context.env.ENABLE_IMAGE_AI, IMAGE_PROVIDER_ORDER: context.env.IMAGE_PROVIDER_ORDER, HF_API_TOKEN: context.env.HF_API_TOKEN, IMAGE_CACHE_TTL_DAYS: context.env.IMAGE_CACHE_TTL_DAYS };
    const questionImages: Array<{ url: string; alt: string; source: string; attribution: string }> = [];
    const imageTitles: string[] = [];

    for (const q of (evaluation as any).questions || []) {
      if (q.type === 'open' || q.type === 'true_false') {
        try {
          const result = await generateEducationalImage({
            grade: body.level,
            subject: body.subject,
            oa: body.objectiveText || body.topic || body.objectiveCode,
            resourceTitle: body.topic || 'Evaluación',
            slideTitle: q.question?.slice(0, 100) || 'Pregunta de evaluación',
            slideContent: q.question?.slice(0, 300) || '',
          }, imageEnv);
          if (result.ok) {
            questionImages.push({ url: result.url, alt: `Imagen: Pregunta ${q.number}`, source: result.source, attribution: result.attribution || '' });
            imageTitles.push(`Pregunta ${q.number}`);
          }
        } catch {
          // Image generation failure is non-fatal
        }
      }
    }

    if (questionImages.length > 0) {
      (evaluation as any).images = questionImages;
      (evaluation as any).imageTitles = imageTitles;
    }

    const resourceId = `eval_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, 'evaluacion', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      `Evaluación: ${body.objectiveCode}`,
      JSON.stringify(evaluation),
      JSON.stringify({ type: body.type || 'formativa', questionCount: body.questionCount || 10 }),
      body.level,
      body.subject,
      body.objectiveCode,
      JSON.stringify(body.indicators || []),
      JSON.stringify(body.skills || []),
      `Evaluación generada para ${body.objectiveCode}`
    ).run();

    return Response.json({ ok: true, resourceId, evaluation, quality, context: { objective, indicators: (indicators as any)?.results || [] } });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar evaluación', details: err.message }, { status: 500 });
  }
}

function buildEvaluation(req: EvaluationRequest, objective: any, indicators: any[]): any {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;
  const count = Math.min(req.questionCount || 10, 20);
  const indText = indicators.map((i: any) => i.indicator_text).filter(Boolean);
  const scorePerQuestion = 2;
  const totalScore = count * scorePerQuestion;

  const questions: any[] = [];
  const types = ['alternativa', 'verdadero_falso', 'desarrollo'];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const indicator = indText[i % indText.length] || 'Comprensión del OA';

    if (type === 'alternativa') {
      questions.push({
        number: i + 1,
        type: 'alternativa',
        text: `Pregunta de selección múltiple sobre ${req.topic || req.objectiveCode}.`,
        options: [
          { text: 'Alternativa correcta', isCorrect: true },
          { text: 'Alternativa incorrecta plausible', isCorrect: false },
          { text: 'Alternativa incorrecta plausible', isCorrect: false },
          { text: 'Alternativa incorrecta plausible', isCorrect: false },
        ],
        score: scorePerQuestion,
        indicator,
        skill: 'Comprensión',
      });
    } else if (type === 'verdadero_falso') {
      questions.push({
        number: i + 1,
        type: 'verdadero_falso',
        text: `Afirmación verdadera sobre ${req.topic || req.objectiveCode}.`,
        answer: 'V',
        score: scorePerQuestion,
        indicator,
        skill: 'Análisis',
      });
    } else {
      questions.push({
        number: i + 1,
        type: 'desarrollo',
        text: `Explica con tus propias palabras: ${req.topic || req.objectiveCode}.`,
        score: scorePerQuestion * 2,
        indicator,
        skill: 'Expresión',
        teacher_rubric: {
          criteria: ['Comprensión del concepto', 'Uso correcto del vocabulario'],
          sample_answer: `Respuesta modelo sobre ${req.topic || req.objectiveCode}.`,
          scoring_guide: '1 punto por cada criterio satisfactoriamente cumplido.',
        },
      });
    }
  }

  return {
    metadata: {
      course: ctx,
      subject: subj,
      unit: req.topic || req.objectiveCode,
      oa: req.objectiveCode,
      total_score: totalScore,
      type: req.type || 'formativa',
    },
    instructions: `Lee atentamente cada pregunta. En las de selección múltiple, marca solo una alternativa. En las de verdadero o falso, indica V o F con justificación si es falso. En las de desarrollo, escribe tu respuesta de forma clara y ordenada.`,
    questions,
    answerKey: {
      summary: `Pauta de corrección: cada pregunta de selección múltiple y V/F suma ${scorePerQuestion} puntos. Las de desarrollo suman ${scorePerQuestion * 2} puntos.`,
      question_answers: questions.map((q: any) => ({
        number: q.number,
        correct_answer: q.type === 'alternativa' ? 'A' : q.type === 'verdadero_falso' ? q.answer : 'Respuesta modelo',
        explanation: `Respuesta correcta según el OA evaluado.`,
      })),
      total_points: totalScore,
    },
  };
}
