interface Env { DB: D1Database }

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

    return Response.json({ ok: true, resourceId, evaluation, context: { objective, indicators: (indicators as any)?.results || [] } });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar evaluación', details: err.message }, { status: 500 });
  }
}

function buildEvaluation(req: EvaluationRequest, objective: any, indicators: any[]): any {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;
  const count = req.questionCount || 10;
  const indText = indicators.map((i: any) => i.indicator_text).filter(Boolean);

  const questions = [];
  const types = ['multiple_choice', 'open', 'true_false', 'matching'];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const indicator = indText[i % indText.length] || 'Comprensión del OA';

    if (type === 'multiple_choice') {
      questions.push({
        number: i + 1,
        type: 'multiple_choice',
        question: `Pregunta de selección múltiple sobre ${req.topic || req.objectiveCode}.`,
        options: ['A) Opción correcta', 'B) Opción incorrecta', 'C) Opción incorrecta', 'D) Opción incorrecta'],
        correct: 'A',
        indicator,
        skill: 'Comprensión'
      });
    } else if (type === 'open') {
      questions.push({
        number: i + 1,
        type: 'open',
        question: `Explica con tus propias palabras: ${req.topic || req.objectiveCode}.`,
        indicator,
        skill: 'Expresión'
      });
    } else if (type === 'true_false') {
      questions.push({
        number: i + 1,
        type: 'true_false',
        question: `Verdadero o falso: [afirmación sobre ${req.topic || req.objectiveCode}].`,
        correct: 'V',
        indicator,
        skill: 'Análisis'
      });
    } else {
      questions.push({
        number: i + 1,
        type: 'matching',
        question: `Une cada concepto con su definición correcta sobre ${req.topic || req.objectiveCode}.`,
        indicator,
        skill: 'Relación'
      });
    }
  }

  return {
    title: `Evaluación ${req.type || 'formativa'}: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}`,
    objective: req.objectiveText,
    type: req.type || 'formativa',
    indicators: indText.slice(0, 3),
    questions,
    rubric: {
      criteria: [
        { name: 'Comprensión del contenido', levels: ['Logrado', 'En proceso', 'No logrado'] },
        { name: 'Aplicación del concepto', levels: ['Logrado', 'En proceso', 'No logrado'] },
        { name: 'Comunicación de ideas', levels: ['Logrado', 'En proceso', 'No logrado'] }
      ]
    },
    answerKey: 'Pauta de corrección: cada pregunta correcta suma 1 punto. Total: ' + count + ' puntos.'
  };
}
