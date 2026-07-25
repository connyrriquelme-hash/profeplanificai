interface Env { DB: D1Database; AI?: any }

interface GenerateRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  skills?: string[];
  attitudes?: string[];
  methodology?: string;
  topic: string;
  additionalContext?: string;
  designStyle?: string;
  duration?: string;
  studentCount?: number;
}

function getContextFromD1(db: D1Database, req: GenerateRequest): Promise<any> {
  return Promise.all([
    db.prepare(`SELECT o.*, c.name as course_name, s.name as subject_name, a.name as axis_name
      FROM objectives o LEFT JOIN courses c ON o.course_id = c.id LEFT JOIN subjects s ON o.subject_id = s.id LEFT JOIN axes a ON a.id = o.axis_id
      WHERE o.code = ?`).bind(req.objectiveCode).first(),
    db.prepare(`SELECT ci.indicator_text FROM curriculum_indicators ci WHERE ci.oa_code = ? LIMIT 10`).bind(req.objectiveCode).all(),
    db.prepare(`SELECT m.name, m.description, m.steps_json FROM methodologies m WHERE m.name LIKE ? LIMIT 3`).bind(`%${req.methodology || ''}%`).all(),
  ]);
}

function buildMaterialPrompt(type: string, req: GenerateRequest, context: any): string {
  const [objective, indicators, methodologies] = context;
  const obj = objective as any || {};
  const indList = (indicators as any)?.results?.map((i: any) => i.indicator_text).filter(Boolean) || [];
  const methList = (methodologies as any)?.results || [];

  const baseContext = [
    `Nivel: ${req.level}`,
    `Asignatura: ${req.subject}`,
    `OA: ${req.objectiveCode} — ${req.objectiveText}`,
    obj.course_name ? `Curso: ${obj.course_name}` : '',
    obj.subject_name ? `Asignatura oficial: ${obj.subject_name}` : '',
    obj.axis_name ? `Eje: ${obj.axis_name}` : '',
    indList.length > 0 ? `Indicadores: ${indList.join('; ')}` : '',
    methList.length > 0 ? `Metodología sugerida: ${methList.map((m: any) => m.name).join(', ')}` : '',
    req.topic ? `Tema: ${req.topic}` : '',
    req.additionalContext ? `Contexto: ${req.additionalContext}` : '',
    req.duration ? `Duración: ${req.duration}` : '',
    req.studentCount ? `Estudiantes: ${req.studentCount}` : '',
  ].filter(Boolean).join('\n');

  const prompts: Record<string, string> = {
    guia_estudiante: `Genera una guía de estudiante en formato JSON con:
{
  "title": "Título atractivo",
  "objective": "Objetivo de aprendizaje",
  "instructions": "Instrucciones claras",
  "activities": [{"name": "...", "description": "...", "steps": ["..."]}],
  "vocabulary": ["término: definición"],
  "selfAssessment": ["preguntas de autoevaluación"]
}
Contexto: ${baseContext}
Requisitos: lenguaje accesible, máximo 3 actividades, contexto chileno/latinoamericano, DUA implícito.`,

    guia_docente: `Genera una guía docente en formato JSON con:
{
  "title": "Título",
  "objective": "OA completo",
  "duration": "tiempo estimado",
  "materials": ["lista de materiales"],
  "opening": {"activity": "...", "time": "min"},
  "development": {"activity": "...", "time": "min"},
  "closure": {"activity": "...", "time": "min"},
  "differentiation": ["adaptaciones DUA"],
  "assessment": "criterios de evaluación"
}
Contexto: ${baseContext}
Requisitos: estructura clara inicio-desarrollo-cierre, tiempos realistas, adaptaciones DUA.`,

    planificacion: `Genera una planificación de unidad didáctica en formato JSON con EXACTAMENTE esta estructura:
{
  "unit": "Nombre descriptivo de la unidad",
  "classes": [
    {
      "number": 1,
      "objective": "Objetivo de aprendizaje específico alineado al OA proporcionado",
      "opening": "Momento de activación detallado (10-15 min): pregunta motivadora, conexión con contexto chileno, consigna exacta del docente",
      "development": "Construcción detallada (55-65 min): modelamiento docente, práctica guiada, trabajo individual, andamiajes DUA",
      "closure": "Cierre detallado (10-15 min): síntesis guiada, ticket de salida, criterio de logro observable",
      "duration": "90 min",
      "materials": ["Cuaderno del estudiante", "Pizarrón y tiza", "Fichas de trabajo impresas"],
      "assessment": "Criterio de logro observable y evidencia esperada del estudiante"
    }
  ],
  "methodology": "Metodología principal (ABP, Aprendizaje Activo, etc.)",
  "dua": ["Adaptación DUA específica"],
  "evaluation": "Tipo de evaluación: formativa, sumativa o diagnóstica"
}
Contexto: ${baseContext}
REGLAS OBLIGATORIAS:
- Mínimo 3 clases, máximo 10 por unidad.
- Cada clase DEBE tener opening, development y closure como campos de texto descriptivo.
- Duración de cada clase: entre 40 y 120 minutos en formato "X min".
- Materiales: SOLO materiales que existan en escuelas chilenas (cuaderno, pizarrón, fichas, tiza, marcadores, etc.).
- Progresión lógica: cada clase debe avanzar sobre la anterior.
- Contexto chileno: usa referencias geográficas, culturales e históricas de Chile.
- DUA: incluye al menos 1 adaptación por clase (representación, acción o implicación).`,

    evaluacion: `Genera una evaluación en formato JSON válido que cumpla ESTRICTAMENTE con esta estructura:

{
  "metadata": {
    "course": "Curso (ej: 3° Básico)",
    "subject": "Asignatura",
    "unit": "Nombre de la unidad",
    "oa": "Código MINEDUC del OA evaluado",
    "total_score": 20,
    "type": "formativa|sumativa|diagnostica",
    "time_limit": "45 minutos (opcional)"
  },
  "instructions": "Instrucciones claras para el estudiante, adaptadas al nivel. Ej: 'Lee atentamente cada pregunta. Marca solo una alternativa en las de selección múltiple.'",
  "questions": [
    {
      "number": 1,
      "type": "alternativa",
      "text": "Enunciado claro de la pregunta",
      "options": [
        {"text": "Alternativa 1", "isCorrect": false},
        {"text": "Alternativa 2", "isCorrect": true},
        {"text": "Alternativa 3", "isCorrect": false},
        {"text": "Alternativa 4", "isCorrect": false}
      ],
      "score": 2,
      "indicator": "Indicador evaluado",
      "skill": "Habilidad evaluada"
    },
    {
      "number": 2,
      "type": "verdadero_falso",
      "text": "Afirmación para evaluar",
      "answer": "V|F",
      "justification_if_false": "Si es F, justificación que el estudiante debe dar (obligatorio si answer es F)",
      "score": 2,
      "indicator": "Indicador",
      "skill": "Habilidad"
    },
    {
      "number": 3,
      "type": "desarrollo",
      "text": "Pregunta abierta que requiere respuesta escrita",
      "score": 5,
      "indicator": "Indicador",
      "skill": "Habilidad",
      "teacher_rubric": {
        "criteria": ["Criterio 1 para evaluar", "Criterio 2"],
        "sample_answer": "Respuesta modelo orientativa para el docente",
        "scoring_guide": "Cómo distribuir el puntaje"
      }
    }
  ],
  "answerKey": {
    "summary": "Resumen consolidado de la pauta para el docente",
    "question_answers": [
      {"number": 1, "correct_answer": "B", "explication": "Explicación de por qué es correcta"},
      {"number": 2, "correct_answer": "V", "explication": "Explicación"},
      {"number": 3, "correct_answer": "Respuesta modelo breve", "explication": "Puntos clave a buscar"}
    ],
    "total_points": 20
  },
  "tablas": [{"titulo": "Nombre", "columnas": ["col1", "col2"], "filas": [["val1", "val2"]]}],
  "callouts": [{"tipo": "docente|familia|importante|dua|evaluacion", "titulo": "Título", "texto": "Contenido"}],
  "checklist": ["Elemento 1 del checklist"]
}

Contexto: ${baseContext}
REGLAS OBLIGATORIAS:
- OPCIÓN A: 4 alternativas EXACTAS (A, B, C, D), solo 1 correcta (isCorrect: true). Distractores plausibles.
- V/F: Si answer es "F", justification_if_false ES OBLIGATORIA (mín. 15 caracteres).
- DESARROLLO: teacher_rubric CON OBLIGATORIO: array criteria (mín. 2), sample_answer, scoring_guide.
- PAUTA: answerKey DEBE tener question_answers con el MISMO número de preguntas.
- PUNTAJE: total_score en metadata DEBE coincidir con la suma de scores de questions y con answerKey.total_points.
- Mínimo 3 preguntas, máximo 20. Mezclar tipos (alternativa + V/F + desarrollo).
- Contexto chileno: usa referencias geográficas, culturales e históricas de Chile.
- Progresión de dificultad: de menor a mayor complejidad.`,

    rubrica: `Genera una rúbrica en formato JSON válido que cumpla ESTRICTAMENTE con esta estructura:

{
  "metadata": {
    "course": "Curso (ej: 3° Básico)",
    "subject": "Asignatura",
    "unit": "Nombre de la unidad",
    "oa": "Código MINEDUC del OA evaluado"
  },
  "title": "Título descriptivo de la rúbrica",
  "levels": [
    {"name": "Excelente", "score": 4, "color": "#10B981"},
    {"name": "Bueno", "score": 3, "color": "#3B82F6"},
    {"name": "Suficiente", "score": 2, "color": "#F59E0B"},
    {"name": "Por mejorar", "score": 1, "color": "#EF4444"}
  ],
  "criteria": [
    {
      "name": "Dimensión a evaluar (ej: Contenido, Ortografía, Creatividad)",
      "weight": 1,
      "descriptions": [
        "Descripción del nivel Excelente para esta dimensión",
        "Descripción del nivel Bueno para esta dimensión",
        "Descripción del nivel Suficiente para esta dimensión",
        "Descripción del nivel Por mejorar para esta dimensión"
      ]
    }
  ],
  "instructions": "Instrucciones para el docente sobre cómo usar la rúbrica (opcional)",
  "callouts": [{"tipo": "docente", "titulo": "Título", "texto": "Contenido"}],
  "checklist": ["Elemento 1 del checklist"]
}

Contexto: ${baseContext}
REGLAS OBLIGATORIAS:
- EXACTAMENTE 4 niveles ordenados de mayor a menor (score decreciente).
- Cada criterio DEBE tener exactamente 4 descripciones (una por nivel).
- Mínimo 2 criterios, máximo 10. Ejemplos: Contenido, Ortografía, Creatividad, Trabajo en equipo, Presentación.
- Las descripciones deben ser específicas y observables, no genéricas.
- Contexto chileno: usa vocabulario y situaciones del contexto escolar chileno.`,

    ticket_salida: `Genera un ticket de salida en formato JSON con:
{
  "title": "Ticket de salida",
  "objective": "OA de la clase",
  "questions": [
    {"question": "Pregunta de comprensión", "type": "open"},
    {"question": "Ejemplo aplicado", "type": "open"},
    {"question": "Metacognición", "type": "open"}
  ],
  "selfAssessment": "¿Cómo te fue hoy? 😊 😐 😞",
  "teacherNotes": "notas para el docente"
}
Contexto: ${baseContext}
Requisitos: máximo 3 preguntas, breves, alineadas al OA, contexto chileno.`,

    actividad_dua: `Genera una actividad DUA en formato JSON con:
{
  "title": "Título de actividad",
  "objective": "OA",
  "representation": ["múltiples formas de presentar contenido"],
  "action": ["múltiples formas de acción y expresión"],
  "engagement": ["múltiples formas de motivación"],
  "activity": {"description": "...", "steps": ["..."], "materials": ["..."]},
  "adaptations": ["adaptaciones específicas"],
  "assessment": "criterios flexibles"
}
Contexto: ${baseContext}
Requisitos: 3 principios DUA explícitos, accesible para todos, contexto chileno.`,
  };

  return prompts[type] || prompts.guia_estudiante;
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const url = new URL(context.request.url);
    const type = url.searchParams.get('type') || 'guia_estudiante';
    const body = await context.request.json() as GenerateRequest;

    if (!body.level || !body.subject || !body.objectiveCode) {
      return Response.json({ error: 'level, subject y objectiveCode son requeridos' }, { status: 400 });
    }

    const db = context.env.DB;
    const ctx = await getContextFromD1(db, body);
    const prompt = buildMaterialPrompt(type, body, ctx);

    // Save to generated_resources
    const resourceId = `res_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(`INSERT OR IGNORE INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, skills_used_json, prompt_used, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`)
      .bind(
        resourceId,
        `${type} — ${body.objectiveCode}`,
        type,
        prompt,
        JSON.stringify({ status: 'generating' }),
        body.level,
        body.subject,
        body.objectiveCode,
        JSON.stringify(body.indicators || []),
        JSON.stringify(body.skills || []),
        prompt.substring(0, 2000)
      ).run();

    return Response.json({
      ok: true,
      resourceId,
      prompt,
      context: {
        objective: ctx[0],
        indicators: (ctx[1] as any)?.results || [],
        methodologies: (ctx[2] as any)?.results || [],
      }
    });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar material', details: err.message }, { status: 500 });
  }
}
