interface Env { DB: D1Database }

interface FormativeEvaluationRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  topic: string;
  additionalContext?: string;
  methodology?: string;
  evaluationSubType: 'evaluation_exit_ticket' | 'evaluation_321' | 'evaluation_checklist' | 'evaluation_formative_rubric' | 'evaluation_traffic_light';
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as FormativeEvaluationRequest;

    if (!body.level || !body.subject || !body.objectiveCode || !body.evaluationSubType) {
      return Response.json({ error: 'level, subject, objectiveCode, evaluationSubType son requeridos' }, { status: 400 });
    }

    const db = context.env.DB;
    const objective = await db.prepare(
      `SELECT o.*, c.name as course_name, s.name as subject_name FROM objectives o LEFT JOIN courses c ON o.course_id = c.id LEFT JOIN subjects s ON o.subject_id = s.id WHERE o.code = ?`
    ).bind(body.objectiveCode).first();

    const indicators = await db.prepare(
      `SELECT ci.indicator_text FROM curriculum_indicators ci WHERE ci.oa_code = ? LIMIT 10`
    ).bind(body.objectiveCode).all();

    const evaluation = buildFormativeEvaluation(body, objective as any, (indicators as any)?.results || []);

    const resourceId = `eval_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, 'evaluacion', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      `Evaluación Formativa: ${body.objectiveCode} - ${body.evaluationSubType}`,
      JSON.stringify(evaluation),
      JSON.stringify({ type: 'formativa', evaluationSubType: body.evaluationSubType }),
      body.level,
      body.subject,
      body.objectiveCode,
      JSON.stringify(body.indicators || []),
      JSON.stringify(body.skills || []),
      `Evaluación formativa generada para ${body.objectiveCode} tipo ${body.evaluationSubType}`
    ).run();

    return Response.json({ ok: true, resourceId, evaluation, context: { objective, indicators: (indicators as any)?.results || [] } });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar evaluación formativa', details: err.message }, { status: 500 });
  }
}

function buildFormativeEvaluation(req: FormativeEvaluationRequest, objective: any, indicators: any[]): any {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;
  const subType = req.evaluationSubType;

  switch (subType) {
    case 'evaluation_exit_ticket':
      return buildExitTicket(req, ctx, subj);
    case 'evaluation_321':
      return build321Format(req, ctx, subj);
    case 'evaluation_checklist':
      return buildChecklist(req, ctx, subj);
    case 'evaluation_formative_rubric':
      return buildFormativeRubric(req, ctx, subj);
    case 'evaluation_traffic_light':
      return buildTrafficLight(req, ctx, subj);
    default:
      return buildDefaultFormative(req, ctx, subj);
  }
}

function buildExitTicket(req: FormativeEvaluationRequest, ctx: string, subj: string): any {
  return {
    title: `Ticket de Salida: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}`,
    objective: req.objectiveText,
    type: 'ticket_salida',
    evaluationSubType: 'evaluation_exit_ticket',
    instructions: 'Completa antes de salir de clase. Responde con honestidad.',
    questions: [
      {
        number: 1,
        type: 'open',
        question: '¿Cuál fue lo más importante que aprendiste hoy?',
        indicator: 'Comprensión del concepto principal',
        skill: 'Síntesis'
      },
      {
        number: 2,
        type: 'open',
        question: '¿Qué duda te quedó sin resolver?',
        indicator: 'Identificación de lagunas',
        skill: 'Metacognición'
      },
      {
        number: 3,
        type: 'traffic_light',
        question: '¿Cómo te sientes con lo aprendido hoy?',
        options: ['🟢 Lo entendí bien', '🟡 Algunas dudas', '🔴 No lo entendí'],
        indicator: 'Autoevaluación de comprensión',
        skill: 'Autorregulación'
      }
    ],
    teacherNotes: 'Recolectar al final de la clase. Revisar respuestas para ajustar la siguiente sesión.',
    studentNameField: true,
    dateField: true
  };
}

function build321Format(req: FormativeEvaluationRequest, ctx: string, subj: string): any {
  return {
    title: `Formato 3-2-1: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}`,
    objective: req.objectiveText,
    type: 'formato_321',
    evaluationSubType: 'evaluation_321',
    instructions: 'Completa cada sección con tus propias palabras.',
    sections: [
      {
        number: 3,
        title: '3 cosas que aprendí',
        description: 'Escribe tres aprendizajes clave de la clase de hoy',
        lines: 3,
        indicator: 'Identificación de aprendizajes clave',
        skill: 'Síntesis'
      },
      {
        number: 2,
        title: '2 cosas que me interesan / quiero saber más',
        description: 'Escribe dos cosas que te gustaría profundizar',
        lines: 2,
        indicator: 'Curiosidad y motivación',
        skill: 'Curiosidad intelectual'
      },
      {
        number: 1,
        title: '1 duda o pregunta',
        description: 'Escribe una pregunta que aún tienes',
        lines: 1,
        indicator: 'Identificación de brechas',
        skill: 'Pensamiento crítico'
      }
    ],
    teacherNotes: 'Recolectar al final de la clase. Usar para planificar la siguiente sesión y responder dudas.',
    studentNameField: true,
    dateField: true
  };
}

function buildChecklist(req: FormativeEvaluationRequest, ctx: string, subj: string): any {
  return {
    title: `Lista de Cotejo / Autoevaluación: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}`,
    objective: req.objectiveText,
    type: 'lista_cotejo',
    evaluationSubType: 'evaluation_checklist',
    instructions: 'Marca cada criterio según tu desempeño: Sí / No / En proceso',
    criteria: [
      { number: 1, description: 'Comprendo el concepto principal del tema', indicator: 'Comprensión conceptual', skill: 'Comprensión' },
      { number: 2, description: 'Puedo explicar el tema con mis propias palabras', indicator: 'Explicación propia', skill: 'Comunicación' },
      { number: 3, description: 'Identifiqué ejemplos del tema en la vida real', indicator: 'Conexión vida real', skill: 'Transferencia' },
      { number: 4, description: 'Participé activamente en las actividades', indicator: 'Participación', skill: 'Compromiso' },
      { number: 5, description: 'Resolví los ejercicios propuestos correctamente', indicator: 'Aplicación práctica', skill: 'Aplicación' },
      { number: 6, description: 'Puedo enseñarle el tema a un compañero', indicator: 'Dominio para enseñar', skill: 'Enseñanza entre pares' }
    ],
    responseOptions: ['✅ Sí', '⚠️ En proceso', '❌ No'],
    teacherNotes: 'Entregar a estudiantes para autoevaluación. Revisar los que marquen "En proceso" o "No".',
    studentNameField: true,
    dateField: true,
    summaryRow: true
  };
}

function buildFormativeRubric(req: FormativeEvaluationRequest, ctx: string, subj: string): any {
  return {
    title: `Rúbrica Analítica Formativa: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}`,
    objective: req.objectiveText,
    type: 'rubrica_formativa',
    evaluationSubType: 'evaluation_formative_rubric',
    instructions: 'Evalúa cada criterio marcando el nivel alcanzado. Escribe retroalimentación obligatoria.',
    criteria: [
      {
        number: 1,
        name: 'Comprensión del contenido',
        indicator: 'Comprensión conceptual',
        skill: 'Comprensión',
        levels: [
          { level: 'En proceso', description: 'Presenta confusiones en conceptos básicos', points: 1 },
          { level: 'Logrado', description: 'Demuestra comprensión clara de conceptos principales', points: 2 },
          { level: 'Destacado', description: 'Conecta conceptos y explica relaciones complejas', points: 3 }
        ],
        feedbackRequired: true
      },
      {
        number: 2,
        name: 'Aplicación del conocimiento',
        indicator: 'Aplicación práctica',
        skill: 'Aplicación',
        levels: [
          { level: 'En proceso', description: 'Dificultad para aplicar en ejercicios', points: 1 },
          { level: 'Logrado', description: 'Aplica correctamente en situaciones similares', points: 2 },
          { level: 'Destacado', description: 'Aplica en contextos nuevos y complejos', points: 3 }
        ],
        feedbackRequired: true
      },
      {
        number: 3,
        name: 'Comunicación y argumentación',
        indicator: 'Comunicación',
        skill: 'Comunicación',
        levels: [
          { level: 'En proceso', description: 'Explicaciones confusas o incompletas', points: 1 },
          { level: 'Logrado', description: 'Explica con claridad y usa vocabulario adecuado', points: 2 },
          { level: 'Destacado', description: 'Argumenta con evidencia y ejemplos propios', points: 3 }
        ],
        feedbackRequired: true
      }
    ],
    teacherNotes: 'Entregar rúbrica al inicio de la actividad. Estudiantes autoevalúan y docente confirma. Retroalimentación obligatoria en cada criterio.',
    studentNameField: true,
    dateField: true,
    totalScore: 9
  };
}

function buildTrafficLight(req: FormativeEvaluationRequest, ctx: string, subj: string): any {
  return {
    title: `Semáforo de Comprensión: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}`,
    objective: req.objectiveText,
    type: 'semaforo',
    evaluationSubType: 'evaluation_traffic_light',
    instructions: 'Marca el color que representa tu nivel de comprensión para cada aspecto.',
    aspects: [
      { number: 1, description: 'Entiendo el concepto principal', indicator: 'Comprensión conceptual' },
      { number: 2, description: 'Puedo explicarlo con mis palabras', indicator: 'Explicación propia' },
      { number: 3, description: 'Puedo resolver ejercicios relacionados', indicator: 'Aplicación' },
      { number: 4, description: 'Puedo explicárselo a un compañero', indicator: 'Enseñanza entre pares' }
    ],
    colors: [
      { color: '🟢 Verde', meaning: 'Lo entiendo bien, puedo explicarlo', action: 'Ayudar a otros' },
      { color: '🟡 Amarillo', meaning: 'Tengo algunas dudas, necesito repasar', action: 'Preguntar al docente o compañero' },
      { color: '🔴 Rojo', meaning: 'No lo entiendo, necesito ayuda urgente', action: 'Solicitar apoyo docente' }
    ],
    teacherNotes: 'Recolectar semáforos al final. Agrupar estudiantes por color para apoyos diferenciados.',
    studentNameField: true,
    dateField: true
  };
}

function buildDefaultFormative(req: FormativeEvaluationRequest, ctx: string, subj: string): any {
  return {
    title: `Evaluación Formativa: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}`,
    objective: req.objectiveText,
    type: 'formativa',
    instructions: 'Completa la evaluación según las indicaciones.',
    questions: [
      { number: 1, type: 'open', question: '¿Qué aprendiste hoy?' }
    ]
  };
}