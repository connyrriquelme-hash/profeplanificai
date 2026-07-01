interface Env { DB: D1Database }

interface AgentRequest {
  agent: string;
  context: {
    level: string;
    subject: string;
    objectiveCode: string;
    objectiveText: string;
    indicators?: string[];
    skills?: string[];
    attitudes?: string[];
    methodology?: string;
    topic?: string;
    additionalContext?: string;
    duration?: string;
    studentCount?: number;
    designStyle?: string;
  };
  input?: any;
}

const VALID_AGENTS = [
  'curriculum', 'methodology', 'planning', 'assessment',
  'materials', 'presentation', 'dua', 'simce', 'reflection'
];

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as AgentRequest;

    if (!body.agent || !VALID_AGENTS.includes(body.agent)) {
      return Response.json({
        error: `Agente inválido. Disponibles: ${VALID_AGENTS.join(', ')}`,
        availableAgents: VALID_AGENTS,
      }, { status: 400 });
    }

    const ctx = body.context;
    if (!ctx?.level || !ctx?.subject || !ctx?.objectiveCode) {
      return Response.json({
        error: 'context requiere level, subject y objectiveCode',
      }, { status: 400 });
    }

    // Get curriculum context from D1 first
    const db = context.env.DB;
    const objective = await db.prepare(
      `SELECT o.*, c.name as course_name, s.name as subject_name, a.name as axis_name
       FROM objectives o LEFT JOIN courses c ON o.course_id = c.id LEFT JOIN subjects s ON o.subject_id = s.id LEFT JOIN axes a ON a.id = o.axis_id
       WHERE o.code = ?`
    ).bind(ctx.objectiveCode).first();

    const indicators = await db.prepare(
      `SELECT ci.indicator_text FROM curriculum_indicators ci WHERE ci.oa_code = ? LIMIT 10`
    ).bind(ctx.objectiveCode).all();

    const skills = await db.prepare(
      `SELECT s.official_text FROM skills s JOIN objective_skills os ON os.skill_id = s.id JOIN objectives o ON os.objective_id = o.id WHERE o.code = ? LIMIT 10`
    ).bind(ctx.objectiveCode).all();

    // Enrich context with D1 data
    const enrichedContext = {
      ...ctx,
      objectiveText: objective ? (objective as any).official_text : ctx.objectiveText,
      level: objective ? (objective as any).course_name : ctx.level,
      subject: objective ? (objective as any).subject_name : ctx.subject,
      indicators: ctx.indicators || ((indicators as any)?.results?.map((i: any) => i.indicator_text) || []),
      skills: ctx.skills || ((skills as any)?.results?.map((s: any) => s.official_text) || []),
    };

    // Generate agent response based on type
    const startTime = Date.now();
    let content: any;

    switch (body.agent) {
      case 'curriculum':
        content = { objective, indicators: (indicators as any)?.results || [], skills: (skills as any)?.results || [] };
        break;
      case 'methodology':
        const meth = await db.prepare(`SELECT * FROM methodologies LIMIT 5`).all();
        content = { suggestedMethodologies: (meth as any)?.results || [] };
        break;
      case 'planning':
        content = generatePlan(enrichedContext);
        break;
      case 'assessment':
        content = generateAssessment(enrichedContext, body.input);
        break;
      case 'materials':
        content = generateMaterials(enrichedContext, body.input);
        break;
      case 'presentation':
        content = generatePresentation(enrichedContext);
        break;
      case 'dua':
        content = generateDUA(enrichedContext);
        break;
      case 'simce':
        content = generateSIMCE(enrichedContext, body.input);
        break;
      case 'reflection':
        content = generateReflection(enrichedContext);
        break;
      default:
        return Response.json({ error: 'Agente no implementado' }, { status: 500 });
    }

    const duration = Date.now() - startTime;

    // Save agent run to D1
    const runId = `run_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO agent_runs (id, agent_name, input_json, context_json, output_json, curriculum_context_json, status, duration_ms, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, datetime('now'))`
    ).bind(
      runId,
      body.agent,
      JSON.stringify(body.input || {}),
      JSON.stringify(ctx),
      JSON.stringify(content).substring(0, 50000),
      JSON.stringify(enrichedContext),
      duration
    ).run();

    return Response.json({
      ok: true,
      agentName: body.agent,
      content,
      curriculumContext: enrichedContext,
      metadata: { durationMs: duration, runId },
    });
  } catch (err: any) {
    return Response.json({ error: 'Error al ejecutar agente', details: err.message }, { status: 500 });
  }
}

function generatePlan(ctx: any): any {
  return {
    title: `Planificación: ${ctx.objectiveCode}`,
    classes: [
      { number: 1, title: 'Introducción', opening: { activity: 'Activación', time: '15 min' }, development: { activity: 'Explicación', time: '50 min' }, closure: { activity: 'Síntesis', time: '15 min' } },
      { number: 2, title: 'Práctica', opening: { activity: 'Revisión', time: '15 min' }, development: { activity: 'Práctica guiada', time: '50 min' }, closure: { activity: 'Ticket', time: '15 min' } },
      { number: 3, title: 'Aplicación', opening: { activity: 'Activación', time: '15 min' }, development: { activity: 'Trabajo individual', time: '50 min' }, closure: { activity: 'Cierre', time: '15 min' } },
    ],
  };
}

function generateAssessment(ctx: any, input?: any): any {
  const count = input?.questionCount || 10;
  return {
    title: `Evaluación: ${ctx.objectiveCode}`,
    type: input?.type || 'formativa',
    questions: Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      type: ['multiple_choice', 'open', 'true_false'][i % 3],
      question: `Pregunta ${i + 1} sobre ${ctx.topic || ctx.objectiveCode}`,
    })),
  };
}

function generateMaterials(ctx: any, input?: any): any {
  const type = input?.type || 'guia_estudiante';
  return {
    title: `${type === 'guia_estudiante' ? 'Guía Estudiante' : 'Guía Docente'}: ${ctx.objectiveCode}`,
    objective: ctx.objectiveText,
    activities: [
      { name: 'Activación', description: '¿Qué sabes?' },
      { name: 'Desarrollo', description: 'Lee y responde' },
      { name: 'Aplicación', description: 'Aplica lo aprendido' },
    ],
  };
}

function generatePresentation(ctx: any): any {
  return {
    title: `Presentación: ${ctx.objectiveCode}`,
    slides: [
      { type: 'cover', title: ctx.topic || ctx.objectiveCode, subtitle: `${ctx.level} — ${ctx.subject}` },
      { type: 'activation', title: 'Activación', bullets: ['¿Qué sabes?', '¿Dónde lo has visto?'] },
      { type: 'explanation', title: 'Concepto clave', bullets: ['Definición', 'Ejemplo chileno'] },
      { type: 'guided-practice', title: 'Práctica guiada', activity: 'Resolver en parejas' },
      { type: 'independent-practice', title: 'Trabajo individual', activity: 'Resolver solo' },
      { type: 'formative-assessment', title: 'Evaluación', activity: 'Ticket de salida' },
      { type: 'closure', title: 'Cierre', bullets: ['Síntesis', 'Metacognición'] },
    ],
  };
}

function generateDUA(ctx: any): any {
  return {
    representation: ['Visual', 'Auditivo', 'Manipulativo'],
    action: ['Oral', 'Escrita', 'Dibujada'],
    engagement: ['Intereses', 'Opciones', 'Feedback'],
  };
}

function generateSIMCE(ctx: any, input?: any): any {
  const count = input?.questionCount || 10;
  return {
    title: `Evaluación SIMCE: ${ctx.objectiveCode}`,
    questions: Array.from({ length: count }, (_, i) => ({
      number: i + 1,
      type: 'multiple_choice',
      question: `Pregunta SIMCE ${i + 1}`,
      options: ['A)', 'B)', 'C)', 'D)'],
    })),
  };
}

function generateReflection(ctx: any): any {
  return {
    parentReport: {
      title: `Informe: ${ctx.level} — ${ctx.subject}`,
      objective: ctx.objectiveText,
      whatWeLearned: `Trabajamos el OA ${ctx.objectiveCode}`,
      howToSupport: ['Pregunte qué aprendió', 'Revise el cuaderno', 'Celebre el esfuerzo'],
    },
    teacherReflection: {
      whatWorked: 'Aspectos positivos',
      whatToImprove: 'Áreas de mejora',
    },
  };
}
