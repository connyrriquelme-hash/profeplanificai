interface Env { DB: D1Database; AI?: { run: (model: string, input: unknown) => Promise<unknown> } }

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
  additionalContext?: string;
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

function buildPresentationPrompt(req: PresentationRequest, objective: any, indicators: any[]): string {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;
  const axis = objective?.axis_name || '';
  const indList = indicators.map((i: any) => i.indicator_text).filter(Boolean);
  const indText = indList.slice(0, 5).join('; ');
  const skillText = (req.skills || []).slice(0, 4).join('; ');

  const baseContext = [
    `Curso: ${ctx}`,
    `Asignatura: ${subj}`,
    axis ? `Eje: ${axis}` : '',
    `OA: ${req.objectiveCode} — ${req.objectiveText}`,
    indText ? `Indicadores: ${indText}` : '',
    skillText ? `Habilidades: ${skillText}` : '',
    req.topic ? `Tema: ${req.topic}` : '',
    req.additionalContext ? `Contexto adicional: ${req.additionalContext}` : '',
  ].filter(Boolean).join('\n');

  return `Eres un experto en diseño de presentaciones educativas premium para el Currículum Nacional de Chile.

REGLAS CRÍTICAS:

1. SEPARACIÓN HABILIDAD/CONTENIDO:
   - Si el OA dice "Observar mediante la exploración los animales invertebrados", el TEMA CENTRAL son "Los animales invertebrados", NO "la exploración".
   - Las habilidades (observar, explorar, analizar) son ACCIONES PEDAGÓGICAS, no contenido.
   - El contenido son los CONCEPTOS: animales invertebrados, células, Revolución Francesa, fracciones, etc.

2. PROFUNDIDAD:
   - Cada slide DEBE tener contenido explicativo REAL (mínimo 2-3 oraciones por slide).
   - PROHIBIDO: frases genéricas, plantillas huecas, "Contenido breve", "Título del slide".
   - Desarrolla el contenido científico/humanista apropiado para el nivel.

3. IMAGEPROMPT:
   - DEBE ser en INGLÉS y descriptivo.
   - PROHIBIDO placeholders con emojis como "🎨exploración".
   - Ejemplo: "Colorful educational illustration of butterflies, ants, and snails on a green leaf, Chilean classroom context, flat design, no text"

4. NUNCA TRUNCAR:
   - PROHIBIDO usar "..." para cortar oraciones.
   - Escribe oraciones completas y coherentes.

5. ESTRUCTURA: EXACTAMENTE 10 diapositivas:
   cover, hook, objective, concept_cards, visual_explanation, guided_activity, collaborative_activity, dua_supports, formative_assessment, closure.

Contexto:
${baseContext}

Responde SOLO con JSON válido (sin markdown, sin explicaciones):
{
  "titulo": "Título específico de la clase",
  "diapositivas": [
    {
      "numero": 1,
      "layout": "cover",
      "titulo": "Título atractivo",
      "contenido": "Subtítulo con tema específico",
      "notasDocente": "Instrucciones para presentar",
      "imagePrompt": "Educational cover illustration, [tema], Chilean context, professional, no text",
      "ejemplosClave": [],
      "actividadOral": ""
    },
    {
      "numero": 2,
      "layout": "hook",
      "titulo": "Activación",
      "contenido": "Pregunta motivadora concreta y específica al tema. Mínimo 2 oraciones.",
      "notasDocente": "Tiempo y estrategia",
      "imagePrompt": "Engaging image of [tema], educational, thought-provoking, no text",
      "ejemplosClave": ["Pregunta 1", "Pregunta 2"],
      "actividadOral": "Pregunta oral"
    },
    {
      "numero": 3,
      "layout": "objective",
      "titulo": "Objetivo de aprendizaje",
      "contenido": "Objetivo en lenguaje estudiantil. Por qué es importante. Mínimo 2 oraciones.",
      "notasDocente": "Cómo presentar",
      "imagePrompt": "Objective illustration, [concepto], educational, no text",
      "ejemplosClave": [],
      "actividadOral": "Hoy aprenderemos sobre [tema]."
    },
    {
      "numero": 4,
      "layout": "concept_cards",
      "titulo": "Conceptos clave",
      "contenido": "2-4 conceptos con definición y ejemplo concreto cada uno.",
      "notasDocente": "Cómo explicar",
      "imagePrompt": "Concept cards, [conceptos], infographic, no text",
      "ejemplosClave": ["Concepto 1", "Concepto 2"],
      "actividadOral": "¿Pueden dar un ejemplo?"
    },
    {
      "numero": 5,
      "layout": "visual_explanation",
      "titulo": "Desarrollo del contenido",
      "contenido": "Explicación detallada. Mínimo 3-4 oraciones con información específica.",
      "notasDocente": "Estrategia visual",
      "imagePrompt": "Detailed diagram of [contenido], infographic, professional, no text",
      "ejemplosClave": ["Ejemplo 1", "Ejemplo 2"],
      "actividadOral": "¿Qué observan?"
    },
    {
      "numero": 6,
      "layout": "guided_activity",
      "titulo": "Actividad guiada",
      "contenido": "Instrucciones paso a paso. Materiales. Tiempo. Producto esperado.",
      "notasDocente": "Cómo modelar",
      "imagePrompt": "Students hands-on activity, [tema], Chilean classroom, no text",
      "ejemplosClave": ["Paso 1", "Paso 2"],
      "actividadOral": "Vamos a hacer: paso 1."
    },
    {
      "numero": 7,
      "layout": "collaborative_activity",
      "titulo": "Actividad colaborativa",
      "contenido": "Actividad grupal. Roles. Producto. Tiempo.",
      "notasDocente": "Cómo organizar",
      "imagePrompt": "Students teamwork, [tema], collaborative, classroom, no text",
      "ejemplosClave": ["Rol 1", "Rol 2"],
      "actividadOral": "Trabajen en grupo."
    },
    {
      "numero": 8,
      "layout": "dua_supports",
      "titulo": "Apoyos DUA",
      "contenido": "Estrategias DUA específicas: representación, acción, implicación.",
      "notasDocente": "Cómo implementar",
      "imagePrompt": "Universal Design for Learning, inclusive, [tema], no text",
      "ejemplosClave": ["Representación", "Acción", "Implicación"],
      "actividadOral": ""
    },
    {
      "numero": 9,
      "layout": "formative_assessment",
      "titulo": "Evaluación formativa",
      "contenido": "Preguntas específicas al OA. Criterios de éxito.",
      "notasDocente": "Cómo evaluar",
      "imagePrompt": "Formative assessment, students reflecting, educational, no text",
      "ejemplosClave": ["Pregunta 1", "Pregunta 2"],
      "actividadOral": "¿Qué aprendiste hoy?"
    },
    {
      "numero": 10,
      "layout": "closure",
      "titulo": "Cierre",
      "contenido": "Síntesis. Conexión próxima clase. Pregunta metacognitiva.",
      "notasDocente": "Cómo cerrar",
      "imagePrompt": "Reflection summary, [tema], educational, inspiring, no text",
      "ejemplosClave": ["Aprendizaje 1", "Aprendizaje 2"],
      "actividadOral": "¿Qué fue lo más interesante?"
    }
  ],
  "tiempoTotalMin": 45
}`;
}

function extractJsonFromAiResponse(raw: string): Record<string, unknown> | null {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) text = fenceMatch[1].trim();
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) return null;
  text = text.substring(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
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

    const indResults = (indicators as any)?.results || [];

    let slides: any[];

    if (body.slides && body.slides.length > 0) {
      // Use provided slides
      slides = body.slides;
    } else if (context.env.AI) {
      // Call AI to generate rich slide content
      try {
        const prompt = buildPresentationPrompt(body, objective, indResults);
        const aiResponse = await context.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: `Genera la presentación para: ${body.objectiveCode} — ${body.objectiveText}. Tema: ${body.topic || body.objectiveText}` },
          ],
          max_tokens: 4096,
          temperature: 0.3,
        });

        const rawText = (aiResponse as any)?.response || (aiResponse as any)?.message || '';
        const parsed = extractJsonFromAiResponse(rawText);

        if (parsed && Array.isArray(parsed.diapositivas) && parsed.diapositivas.length >= 7) {
          slides = parsed.diapositivas.map((s: any, i: number) => ({
            type: s.layout || s.type || 'explanation',
            title: s.titulo || s.title || `Slide ${i + 1}`,
            subtitle: s.subtitulo || s.subtitle || '',
            contenido: s.contenido || s.content || '',
            bullets: s.bullets || (s.ejemplosClave && s.ejemplosClave.length > 0 ? s.ejemplosClave : []),
            activity: s.actividadOral || s.activity || '',
            example: (s.ejemplosClave || []).join('. '),
            questions: [],
            speakerNotes: s.notasDocente || s.speakerNotes || '',
            imagePrompt: s.imagePrompt || '',
            ejemplosClave: s.ejemplosClave || [],
          }));
        } else {
          // Fallback to template slides
          slides = buildDefaultSlides(body, objective as any, indResults);
        }
      } catch (aiErr) {
        console.error('[presentation] AI generation failed, using defaults:', aiErr);
        slides = buildDefaultSlides(body, objective as any, indResults);
      }
    } else {
      // No AI available, use template slides
      slides = buildDefaultSlides(body, objective as any, indResults);
    }

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
      JSON.stringify(slides.map((s: any) => s.imagePrompt || s.title))
    ).run();

    return Response.json({
      ok: true,
      resourceId,
      slides,
      metadata: {
        objective,
        indicators: indResults,
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
      speakerNotes: 'Presentar el objetivo de la clase y motivar a los estudiantes con una pregunta inicial.',
      imagePrompt: `Educational presentation cover for ${subj}, Chilean classroom context, professional colorful design, no text`,
    },
    {
      type: 'activation',
      title: 'Activación de conocimientos previos',
      contenido: `¿Qué sabemos sobre ${req.topic || req.objectiveText}? ¿Dónde lo hemos visto antes? Comparte con tu compañero.`,
      bullets: ['¿Qué sabes sobre este tema?', '¿Dónde lo has visto antes?', 'Comparte con tu compañero'],
      activity: 'En grupos, los estudiantes escriben en post-its todo lo que saben sobre el tema.',
      questions: ['¿Qué sabemos sobre este tema?', '¿Dónde lo hemos visto en la vida diaria?'],
      speakerNotes: 'Dar 2 minutos para pensar individualmente antes de compartir.',
      imagePrompt: `Engaging motivational image for ${subj}, Chilean educational context, thought-provoking, no text`,
    },
    {
      type: 'explanation',
      title: 'Concepto clave de la clase',
      subtitle: req.objectiveText,
      contenido: req.objectiveText || 'Desarrollo del contenido principal del OA con información específica y ejemplos concretos.',
      bullets: [
        `Definición clara del concepto`,
        `Conexión con contexto chileno`,
        indText ? `Indicador: ${indText}` : 'Indicador curricular'
      ],
      example: 'Ejemplo concreto aplicado a la realidad chilena.',
      speakerNotes: 'Usar preguntas guiadas: "¿Qué observan?", "¿Qué creen que pasará?"',
      imagePrompt: `Detailed educational diagram for ${subj}, infographic style, Chilean context, no text`,
    },
    {
      type: 'guided-practice',
      title: 'Práctica guiada',
      contenido: 'Los estudiantes resuelven un problema o analizan un caso en parejas con mediación docente. Formar grupos de 2-3. Entregar guía. Monitorear y preguntar.',
      activity: 'Los estudiantes resuelven un problema o analizan un caso en parejas con mediación docente.',
      instructions: 'Formar grupos de 2-3. Entregar guía. Monitorear y preguntar.',
      materials: ['Guía de trabajo', 'Material concreto', 'Apoyo visual'],
      speakerNotes: 'Circular constantemente. Preguntar "por qué" y "cómo".',
      imagePrompt: `Students hands-on activity with teacher guidance, ${subj}, Chilean classroom, collaborative, no text`,
    },
    {
      type: 'independent-practice',
      title: 'Trabajo individual',
      contenido: 'Cada estudiante resuelve un ejercicio que demuestre su comprensión del OA. Aplica el concepto aprendido. Resuelve el ejercicio propuesto. Revisa tu trabajo.',
      bullets: ['Aplica el concepto aprendido', 'Resuelve el ejercicio propuesto', 'Revisa tu trabajo'],
      activity: 'Cada estudiante resuelve un ejercicio que demuestre su comprensión del OA.',
      questions: ['¿Qué aprendí hoy?', '¿Qué fue lo más fácil?', '¿Qué me costó más?'],
      speakerNotes: 'Ofrecer apoyo diferenciado a quienes lo necesiten.',
      imagePrompt: `Students individual work activity, ${subj}, focused learning, Chilean classroom, no text`,
    },
    {
      type: 'formative-assessment',
      title: 'Evaluación formativa',
      contenido: 'Ticket de salida: cada estudiante responde antes de irse. Explica con tus palabras el concepto principal. Escribe un ejemplo de lo aprendido. ¿Qué dudas te quedan?',
      activity: 'Ticket de salida: pregunta breve que cada estudiante responde antes de irse.',
      questions: ['Explica con tus palabras el concepto principal', 'Escribe un ejemplo de lo aprendido', '¿Qué dudas te quedan?'],
      speakerNotes: 'Revisar rápidamente los tickets para ajustar la próxima clase.',
      imagePrompt: `Formative assessment illustration, students reflecting on learning, educational evaluation, no text`,
    },
    {
      type: 'closure',
      title: 'Cierre y metacognición',
      contenido: 'Síntesis de aprendizajes clave. Conexión con la próxima clase. Reconocimiento del esfuerzo. ¿Qué estrategia usaste hoy que te ayudó a aprender mejor?',
      bullets: ['Síntesis de aprendizajes clave', 'Conexión con la próxima clase', 'Reconocimiento del esfuerzo'],
      metacognition: '¿Qué estrategia usaste hoy que te ayudó a aprender mejor?',
      exitTicket: 'Escribe en una palabra lo que te llevas de la clase.',
      speakerNotes: 'Dar tiempo para que 2-3 estudiantes compartan. Cerrar con entusiasmo.',
      imagePrompt: `Reflection learning summary, ${subj}, educational achievement, inspiring, no text`,
    }
  ];
}
