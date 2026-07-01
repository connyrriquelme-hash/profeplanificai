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

    planificacion: `Genera una planificación clase a clase en formato JSON con:
{
  "unit": "Nombre de unidad",
  "classes": [
    {"number": 1, "objective": "OA específico", "opening": "...", "development": "...", "closure": "...", "duration": "min", "materials": ["..."], "assessment": "..."}
  ],
  "methodology": "metodología principal",
  "dua": ["adaptaciones"],
  "evaluation": "tipo de evaluación"
}
Contexto: ${baseContext}
Requisitos: 3-5 clases, progresión lógica, contexto chileno, DUA en cada clase.`,

    evaluacion: `Genera una evaluación en formato JSON con:
{
  "title": "Título de evaluación",
  "objective": "OA evaluado",
  "type": "formativa|sumativa|diagnóstica",
  "questions": [
    {"number": 1, "type": "multiple_choice|open|matching", "question": "...", "options": ["A)", "B)", "C)", "D)"], "correct": "A", "skill": "habilidad evaluada"}
  ],
  "rubric": {"criteria": [{"name": "...", "levels": ["logrado", "en proceso", "no logrado"]}]},
  "answerKey": "pauta de corrección"
}
Contexto: ${baseContext}
Requisitos: 8-12 preguntas, progresión de dificultad, alineadas a indicadores, contexto chileno.`,

    rubrica: `Genera una rúbrica en formato JSON con:
{
  "title": "Título de rúbrica",
  "objective": "OA evaluado",
  "criteria": [
    {"name": "Criterio 1", "description": "...", "levels": [
      {"level": "Excelente", "description": "..."},
      {"level": "Bueno", "description": "..."},
      {"level": "Satisfactorio", "description": "..."},
      {"level": "En proceso", "description": "..."}
    ]}
  ],
  "scoring": "escala de puntaje",
  "feedback": "espacio para retroalimentación"
}
Contexto: ${baseContext}
Requisitos: 3-5 criterios, descriptores claros por nivel, lenguaje accesible.`,

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
