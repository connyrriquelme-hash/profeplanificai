interface Env { DB: D1Database }

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
    const guide = body.type === 'guia_estudiante'
      ? buildStudentGuide(body, objective as any, (indicators as any)?.results || [])
      : buildTeacherGuide(body, objective as any, (indicators as any)?.results || []);

    // Save to D1
    const resourceId = `guide_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      `${body.type === 'guia_estudiante' ? 'Guía Estudiante' : 'Guía Docente'}: ${body.objectiveCode}`,
      body.type,
      JSON.stringify(guide),
      JSON.stringify({ topic: body.topic, methodology: body.methodology }),
      body.level,
      body.subject,
      body.objectiveCode,
      JSON.stringify(body.indicators || []),
      JSON.stringify(body.skills || []),
      `Guía generada para ${body.objectiveCode} — ${body.subject}`
    ).run();

    return Response.json({ ok: true, resourceId, guide, context: { objective, indicators: (indicators as any)?.results || [] } });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar guía', details: err.message }, { status: 500 });
  }
}

function buildStudentGuide(req: GuideRequest, objective: any, indicators: any[]): any {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;
  const indText = indicators.map((i: any) => i.indicator_text).filter(Boolean).slice(0, 2);

  return {
    title: req.topic || `Guía: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}`,
    objective: req.objectiveText,
    indicators: indText,
    instructions: 'Lee atentamente cada sección. Responde las preguntas con tus propias palabras. Si tienes dudas, pregunta a tu profesor o compañera.',
    activities: [
      {
        name: 'Actividad 1: Activación',
        description: 'Responde las siguientes preguntas sobre lo que ya sabes del tema.',
        steps: [
          '¿Qué sabes sobre este tema?',
          '¿Dónde lo has visto antes?',
          'Escribe 3 palabras que se te vengan a la mente.'
        ]
      },
      {
        name: 'Actividad 2: Desarrollo',
        description: 'Lee el texto y responde las preguntas de comprensión.',
        steps: [
          'Lee el texto atentamente.',
          'Subraya las ideas principales.',
          'Responde las preguntas con tus propias palabras.'
        ]
      },
      {
        name: 'Actividad 3: Aplicación',
        description: 'Aplica lo aprendido en una situación nueva.',
        steps: [
          'Resuelve el ejercicio propuesto.',
          'Explica tu procedimiento.',
          'Comparte tu respuesta con un compañero.'
        ]
      }
    ],
    vocabulary: [
      { term: 'Concepto clave', definition: 'Definición clara y simple del concepto principal.' },
      { term: 'Término 2', definition: 'Definición del segundo término importante.' }
    ],
    selfAssessment: [
      '¿Qué aprendí hoy?',
      '¿Qué me resultó fácil?',
      '¿Qué me costó más?',
      '¿Qué puedo hacer para mejorar?'
    ]
  };
}

function buildTeacherGuide(req: GuideRequest, objective: any, indicators: any[]): any {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;
  const axis = objective?.axis_name || '';
  const indText = indicators.map((i: any) => i.indicator_text).filter(Boolean).slice(0, 3);

  return {
    title: `Guía Docente: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}${axis ? ` — ${axis}` : ''}`,
    objective: req.objectiveText,
    indicators: indText,
    duration: req.duration || '90 minutos',
    materials: ['Guía impresa', 'Pizarra o proyector', 'Material concreto según asignatura', 'Post-its o tarjetas'],
    opening: {
      activity: 'Activación de conocimientos previos con preguntas provocadoras',
      time: '15 min',
      instructions: 'Presentar pregunta inicial. Dar 2 minutos para pensar individualmente. Compartir en parejas. Plenaria breve.'
    },
    development: {
      activity: 'Explicación del concepto clave con ejemplo contextualizado + práctica guiada',
      time: '50 min',
      instructions: 'Modelar el concepto. Usar ejemplo chileno. Práctica guiada en parejas. Monitorear y retroalimentar.'
    },
    closure: {
      activity: 'Síntesis y ticket de salida',
      time: '15 min',
      instructions: 'Síntesis oral con participación estudiantil. Ticket de salida individual. Cierre positivo.'
    },
    differentiation: [
      'Ofrecer apoyo visual con organizadores gráficos',
      'Permitir respuesta oral o escrita según necesidad',
      'Agrupar estudiantes de forma heterogénea',
      'Ofrecer tiempo adicional si es necesario'
    ],
    assessment: 'Evaluación formativa mediante observación, ticket de salida y participación. Criterios: comprensión del OA, aplicación del concepto, calidad de la explicación.'
  };
}
