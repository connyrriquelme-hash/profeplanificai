import { generateTicketSalida, type TicketSalidaEngineInput } from '../../../../core/TicketSalidaEngine';
import { generateFormato321, type Format321EngineInput } from '../../../../core/Format321Engine';
import { generateListaCotejo, type ListaCotejoEngineInput } from '../../../../core/ListaCotejoEngine';
import { generateSemaforo, type SemaforoEngineInput } from '../../../../core/SemaforoEngine';
import type { AIEngineEnv } from '../../../../core/types';

interface Env { DB: D1Database; AI?: Ai }

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

    const evaluation = body.evaluationSubType === 'evaluation_exit_ticket'
      ? await buildExitTicketAI(context.env, body, objective as any, (indicators as any)?.results || [])
      : body.evaluationSubType === 'evaluation_321'
        ? await build321FormatAI(context.env, body, objective as any, (indicators as any)?.results || [])
        : body.evaluationSubType === 'evaluation_checklist'
          ? await buildChecklistAI(context.env, body, objective as any, (indicators as any)?.results || [])
          : body.evaluationSubType === 'evaluation_traffic_light'
            ? await buildTrafficLightAI(context.env, body, objective as any, (indicators as any)?.results || [])
            : buildFormativeEvaluation(body, objective as any, (indicators as any)?.results || []);

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
    case 'evaluation_formative_rubric':
      return buildFormativeRubric(req, ctx, subj);
    default:
      return buildDefaultFormative(req, ctx, subj);
  }
}

// Reemplaza a la plantilla fija anterior (ver historial): ahora las
// preguntas de contenido vienen de generateTicketSalida() (IA real con
// fallback determinista); el resto del envelope (subtitle, type,
// studentNameField, dateField) es metadata fija que no requiere IA.
async function buildExitTicketAI(
  env: Env,
  req: FormativeEvaluationRequest,
  objective: any,
  indicators: any[],
): Promise<any> {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;

  const ticketInput: TicketSalidaEngineInput = {
    level: req.level,
    subject: req.subject,
    objectiveCode: req.objectiveCode,
    objectiveText: req.objectiveText,
    topic: req.topic,
    indicators: indicators.map((i: any) => i.indicator_text).filter(Boolean),
  };
  const ticket = await generateTicketSalida({ AI: env.AI } as AIEngineEnv, ticketInput);

  return {
    title: ticket.title,
    subtitle: `${ctx} — ${subj}`,
    objective: ticket.objective,
    type: 'ticket_salida',
    evaluationSubType: 'evaluation_exit_ticket',
    instructions: ticket.instructions,
    questions: ticket.questions,
    teacherNotes: ticket.teacherNotes,
    studentNameField: true,
    dateField: true,
  };
}

// Reemplaza a la plantilla fija anterior (ver historial): ahora las
// consignas de cada bloque vienen de generateFormato321() (IA real con
// fallback determinista); el resto del envelope (subtitle, type,
// studentNameField, dateField) es metadata fija que no requiere IA.
async function build321FormatAI(
  env: Env,
  req: FormativeEvaluationRequest,
  objective: any,
  indicators: any[],
): Promise<any> {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;

  const formatoInput: Format321EngineInput = {
    level: req.level,
    subject: req.subject,
    objectiveCode: req.objectiveCode,
    objectiveText: req.objectiveText,
    topic: req.topic,
    indicators: indicators.map((i: any) => i.indicator_text).filter(Boolean),
  };
  const formato = await generateFormato321({ AI: env.AI } as AIEngineEnv, formatoInput);

  return {
    title: formato.title,
    subtitle: `${ctx} — ${subj}`,
    objective: formato.objective,
    type: 'formato_321',
    evaluationSubType: 'evaluation_321',
    instructions: formato.instructions,
    sections: formato.sections,
    teacherNotes: formato.teacherNotes,
    studentNameField: true,
    dateField: true,
  };
}

// Reemplaza a la plantilla fija anterior (ver historial): ahora los
// criterios vienen de generateListaCotejo() (IA real con fallback
// determinista); el resto del envelope (subtitle, type, responseOptions,
// studentNameField, dateField, summaryRow) es metadata fija que no
// requiere IA.
async function buildChecklistAI(
  env: Env,
  req: FormativeEvaluationRequest,
  objective: any,
  indicators: any[],
): Promise<any> {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;

  const checklistInput: ListaCotejoEngineInput = {
    level: req.level,
    subject: req.subject,
    objectiveCode: req.objectiveCode,
    objectiveText: req.objectiveText,
    topic: req.topic,
    indicators: indicators.map((i: any) => i.indicator_text).filter(Boolean),
  };
  const lista = await generateListaCotejo({ AI: env.AI } as AIEngineEnv, checklistInput);

  return {
    title: lista.title,
    subtitle: `${ctx} — ${subj}`,
    objective: lista.objective,
    type: 'lista_cotejo',
    evaluationSubType: 'evaluation_checklist',
    instructions: lista.instructions,
    criteria: lista.criteria,
    responseOptions: ['✅ Sí', '⚠️ En proceso', '❌ No'],
    teacherNotes: lista.teacherNotes,
    studentNameField: true,
    dateField: true,
    summaryRow: true,
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

// Reemplaza a la plantilla fija anterior (ver historial): ahora los
// indicadores y sus 3 niveles vienen de generateSemaforo() (IA real con
// fallback determinista); el resto del envelope (subtitle, type,
// studentNameField, dateField) es metadata fija que no requiere IA.
async function buildTrafficLightAI(
  env: Env,
  req: FormativeEvaluationRequest,
  objective: any,
  indicators: any[],
): Promise<any> {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;

  const semaforoInput: SemaforoEngineInput = {
    level: req.level,
    subject: req.subject,
    objectiveCode: req.objectiveCode,
    objectiveText: req.objectiveText,
    topic: req.topic,
    indicators: indicators.map((i: any) => i.indicator_text).filter(Boolean),
  };
  const semaforo = await generateSemaforo({ AI: env.AI } as AIEngineEnv, semaforoInput);

  return {
    title: semaforo.title,
    subtitle: `${ctx} — ${subj}`,
    objective: semaforo.objective,
    type: 'semaforo',
    evaluationSubType: 'evaluation_traffic_light',
    instructions: semaforo.instructions,
    aspects: semaforo.aspects,
    colors: semaforo.colors,
    teacherNotes: semaforo.teacherNotes,
    studentNameField: true,
    dateField: true,
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