interface Env { DB: D1Database }

interface PresentationRequest {
  title: string;
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  topic: string;
  designStyle?: string;
  slides?: Array<{
    type: string;
    title: string;
    subtitle?: string;
    bullets?: string[];
    activity?: string;
    example?: string;
    questions?: string[];
    speakerNotes?: string;
  }>;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as PresentationRequest;

    if (!body.level || !body.subject || !body.objectiveCode) {
      return Response.json({ error: 'level, subject y objectiveCode son requeridos' }, { status: 400 });
    }

    const db = context.env.DB;

    // Get curriculum context from D1
    const objective = await db.prepare(
      `SELECT o.*, c.name as course_name, s.name as subject_name, a.name as axis_name
       FROM objectives o LEFT JOIN courses c ON o.course_id = c.id LEFT JOIN subjects s ON o.subject_id = s.id LEFT JOIN axes a ON a.id = o.axis_id
       WHERE o.code = ?`
    ).bind(body.objectiveCode).first();

    const indicators = await db.prepare(
      `SELECT ci.indicator_text FROM curriculum_indicators ci WHERE ci.oa_code = ? LIMIT 10`
    ).bind(body.objectiveCode).all();

    // Build presentation structure if not provided
    const slides = body.slides || buildDefaultSlides(body, objective as any, (indicators as any)?.results || []);

    // Save to D1
    const resourceId = `pptx_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, 'presentacion', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      body.title || `Presentación: ${body.objectiveCode}`,
      JSON.stringify(slides),
      JSON.stringify({ slideCount: slides.length, designStyle: body.designStyle || 'claro' }),
      body.level,
      body.subject,
      body.objectiveCode,
      JSON.stringify(body.indicators || []),
      JSON.stringify(body.skills || []),
      `Presentación generada para ${body.objectiveCode} — ${body.subject}`
    ).run();

    // Save presentation metadata
    await db.prepare(
      `INSERT INTO generated_presentations (id, resource_id, slides_json, slide_count, visual_style, include_images, prefer_regional_context, image_prompts_json, created_at)
       VALUES (?, ?, ?, ?, ?, 1, 'chile', ?, datetime('now'))`
    ).bind(
      `pptx_meta_${resourceId}`,
      resourceId,
      JSON.stringify(slides),
      slides.length,
      body.designStyle || 'claro',
      JSON.stringify(slides.map((s: any) => s.title))
    ).run();

    return Response.json({
      ok: true,
      resourceId,
      slides,
      metadata: {
        objective,
        indicators: (indicators as any)?.results || [],
        slideCount: slides.length,
      }
    });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar presentación', details: err.message }, { status: 500 });
  }
}

function buildDefaultSlides(req: PresentationRequest, objective: any, indicators: any[]): any[] {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;
  const axis = objective?.axis_name || '';
  const indText = indicators.map((i: any) => i.indicator_text).filter(Boolean).slice(0, 3).join('; ');

  return [
    {
      type: 'cover',
      title: req.topic || `Clase: ${req.objectiveCode}`,
      subtitle: `${ctx} — ${subj}${axis ? ` — ${axis}` : ''}`,
      speakerNotes: 'Presentar el objetivo de la clase y motivar a los estudiantes con una pregunta inicial.'
    },
    {
      type: 'activation',
      title: 'Activación de conocimientos previos',
      bullets: ['¿Qué sabes sobre este tema?', '¿Dónde lo has visto antes?', 'Comparte con tu compañero'],
      activity: 'En grupos, los estudiantes escriben en post-its todo lo que saben sobre el tema.',
      questions: ['¿Qué sabemos sobre este tema?', '¿Dónde lo hemos visto en la vida diaria?'],
      speakerNotes: 'Dar 2 minutos para pensar individualmente antes de compartir.'
    },
    {
      type: 'explanation',
      title: 'Concepto clave de la clase',
      subtitle: req.objectiveText,
      bullets: [
        `Definición clara del concepto`,
        `Conexión con contexto chileno`,
        indText ? `Indicador: ${indText.substring(0, 80)}...` : 'Indicador curricular'
      ],
      example: 'Ejemplo concreto aplicado a la realidad chilena.',
      speakerNotes: 'Usar preguntas guiadas: "¿Qué observan?", "¿Qué creen que pasará?"'
    },
    {
      type: 'guided-practice',
      title: 'Práctica guiada',
      activity: 'Los estudiantes resuelven un problema o analizan un caso en parejas con mediación docente.',
      instructions: 'Formar grupos de 2-3. Entregar guía. Monitorear y preguntar.',
      materials: ['Guía de trabajo', 'Material concreto', 'Apoyo visual'],
      speakerNotes: 'Circular constantemente. Preguntar "por qué" y "cómo".'
    },
    {
      type: 'independent-practice',
      title: 'Trabajo individual',
      bullets: ['Aplica el concepto aprendido', 'Resuelve el ejercicio propuesto', 'Revisa tu trabajo'],
      activity: 'Cada estudiante resuelve un ejercicio que demuestre su comprensión del OA.',
      questions: ['¿Qué aprendí hoy?', '¿Qué fue lo más fácil?', '¿Qué me costó más?'],
      speakerNotes: 'Ofrecer apoyo diferenciado a quienes lo necesiten.'
    },
    {
      type: 'formative-assessment',
      title: 'Evaluación formativa',
      activity: 'Ticket de salida: pregunta breve que cada estudiante responde antes de irse.',
      questions: ['Explica con tus palabras el concepto principal', 'Escribe un ejemplo de lo aprendido', '¿Qué dudas te quedan?'],
      speakerNotes: 'Revisar rápidamente los tickets para ajustar la próxima clase.'
    },
    {
      type: 'closure',
      title: 'Cierre y metacognición',
      bullets: ['Síntesis de aprendizajes clave', 'Conexión con la próxima clase', 'Reconocimiento del esfuerzo'],
      metacognition: '¿Qué estrategia usaste hoy que te ayudó a aprender mejor?',
      exitTicket: 'Escribe en una palabra lo que te llevas de la clase.',
      speakerNotes: 'Dar tiempo para que 2-3 estudiantes compartan. Cerrar con entusiasmo.'
    }
  ];
}
