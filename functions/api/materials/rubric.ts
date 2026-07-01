interface Env { DB: D1Database }

interface RubricRequest {
  level: string;
  subject: string;
  objectiveCode: string;
  objectiveText: string;
  indicators?: string[];
  topic: string;
  criteria?: string[];
}

export async function onRequestPost(context: EventContext<Env>): Promise<Response> {
  try {
    const body = await context.request.json() as RubricRequest;

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

    const rubric = buildRubric(body, objective as any, (indicators as any)?.results || []);

    const resourceId = `rubric_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
    await db.prepare(
      `INSERT INTO generated_resources (id, title, type, content, content_json, level, subject, objective_code, indicators_used_json, prompt_used, created_at, updated_at)
       VALUES (?, ?, 'rubrica', ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`
    ).bind(
      resourceId,
      `Rúbrica: ${body.objectiveCode}`,
      JSON.stringify(rubric),
      JSON.stringify({ criteria: body.criteria || [] }),
      body.level,
      body.subject,
      body.objectiveCode,
      JSON.stringify(body.indicators || []),
      `Rúbrica generada para ${body.objectiveCode}`
    ).run();

    return Response.json({ ok: true, resourceId, rubric });
  } catch (err: any) {
    return Response.json({ error: 'Error al generar rúbrica', details: err.message }, { status: 500 });
  }
}

function buildRubric(req: RubricRequest, objective: any, indicators: any[]): any {
  const ctx = objective?.course_name || req.level;
  const subj = objective?.subject_name || req.subject;
  const indText = indicators.map((i: any) => i.indicator_text).filter(Boolean).slice(0, 3);

  const criteria = req.criteria || [
    { name: 'Comprensión del contenido', description: 'Demuestra comprensión del OA trabajado' },
    { name: 'Aplicación del concepto', description: 'Aplica el concepto en situaciones nuevas' },
    { name: 'Comunicación de ideas', description: 'Expresa sus ideas con claridad' },
    { name: 'Trabajo colaborativo', description: 'Participa activamente en equipo' }
  ];

  const levels = [
    { level: 'Excelente', score: 4, color: '#10B981', description: 'Supera las expectativas' },
    { level: 'Bueno', score: 3, color: '#3B82F6', description: 'Cumple con lo esperado' },
    { level: 'Satisfactorio', score: 2, color: '#F59E0B', description: 'Cumple parcialmente' },
    { level: 'En proceso', score: 1, color: '#EF4444', description: 'Requiere apoyo' }
  ];

  return {
    title: `Rúbrica: ${req.objectiveCode}`,
    subtitle: `${ctx} — ${subj}`,
    objective: req.objectiveText,
    indicators: indText,
    criteria: criteria.map(c => ({
      name: c.name,
      description: c.description,
      levels: levels.map(l => ({
        level: l.level,
        score: l.score,
        color: l.color,
        description: `${l.description}: ${c.description.toLowerCase()} de forma ${l.level.toLowerCase()}.`
      }))
    })),
    scoring: `Puntaje total: ${criteria.length * 4} puntos. Nota: (puntaje obtenido / ${criteria.length * 4}) * 7`,
    feedback: 'Espacio para retroalimentación cualitativa al estudiante.',
    dua: 'Esta rúbrica puede adaptarse según las necesidades del estudiante. Criterios flexibles y múltiples formas de demostrar aprendizaje.'
  };
}
