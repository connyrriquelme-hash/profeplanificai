interface Env { DB: D1Database }

interface CurriculumContext {
  objective_id: string;
  objective_code: string;
  objective_description: string;
  objective_type: string;
  subject_name: string;
  axis_name: string;
  level_name: string;
  course_name: string;
  indicators: any[];
  skills: any[];
  attitudes: any[];
  methodologies: any[];
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const objective_id = url.searchParams.get('objective_id') || '';
  const objective_code = url.searchParams.get('objective_code') || '';

  let query = '';
  const params: unknown[] = [];

  if (objective_id) {
    query = `
      SELECT o.id as objective_id, o.code as objective_code, o.description as objective_description, o.type as objective_type,
             s.name as subject_name, a.name as axis_name,
             e.name as level_name, c.name as course_name,
             JSON_GROUP_ARRAY(i.id) as indicator_ids, JSON_GROUP_ARRAY(i.description) as indicator_descriptions,
             JSON_GROUP_ARRAY(sk.id) as skill_ids, JSON_GROUP_ARRAY(sk.description) as skill_descriptions,
             JSON_GROUP_ARRAY(att.id) as attitude_ids, JSON_GROUP_ARRAY(att.description) as attitude_descriptions
      FROM learning_objectives o
      JOIN subjects s ON s.id = o.subject_id
      JOIN curriculum_axes a ON a.id = o.axis_id
      JOIN education_levels e ON s.education_level_id = e.id
      JOIN courses c ON c.id = o.course_id
      LEFT JOIN evaluation_indicators i ON i.objective_id = o.id
      LEFT JOIN curricular_skills sk ON sk.subject_id = o.subject_id
      LEFT JOIN curricular_attitudes att ON att.subject_id = o.subject_id
      WHERE o.id = ?
      GROUP BY o.id, s.name, a.name, e.name, c.name
    `;
    params.push(objective_id);
  } else if (objective_code) {
    query = `
      SELECT o.id as objective_id, o.code as objective_code, o.description as objective_description, o.type as objective_type,
             s.name as subject_name, a.name as axis_name,
             e.name as level_name, c.name as course_name,
             JSON_GROUP_ARRAY(i.id) as indicator_ids, JSON_GROUP_ARRAY(i.description) as indicator_descriptions,
             JSON_GROUP_ARRAY(sk.id) as skill_ids, JSON_GROUP_ARRAY(sk.description) as skill_descriptions,
             JSON_GROUP_ARRAY(att.id) as attitude_ids, JSON_GROUP_ARRAY(att.description) as attitude_descriptions
      FROM learning_objectives o
      JOIN subjects s ON s.id = o.subject_id
      JOIN curriculum_axes a ON a.id = o.axis_id
      JOIN education_levels e ON s.education_level_id = e.id
      JOIN courses c ON c.id = o.course_id
      LEFT JOIN evaluation_indicators i ON i.objective_id = o.id
      LEFT JOIN curricular_skills sk ON sk.subject_id = o.subject_id
      LEFT JOIN curricular_attitudes att ON att.subject_id = o.subject_id
      WHERE o.code = ?
      GROUP BY o.id, s.name, a.name, e.name, c.name
    `;
    params.push(objective_code);
  } else {
    return Response.json({ error: 'Se requiere objective_id o objective_code' }, { status: 400 });
  }

  const { results } = await context.env.DB.prepare(query).bind(...params).all();

  if (results.length === 0) {
    return Response.json({ error: 'Objetivo no encontrado' }, { status: 404 });
  }

  const row = results[0];

  const curriculumContext: CurriculumContext = {
    objective_id: row.objective_id,
    objective_code: row.objective_code,
    objective_description: row.objective_description,
    objective_type: row.objective_type,
    subject_name: row.subject_name,
    axis_name: row.axis_name,
    level_name: row.level_name,
    course_name: row.course_name,
    indicators: row.indicator_descriptions ? row.indicator_descriptions.map((desc, idx) => ({ id: row.indicator_ids[idx], description: desc })) : [],
    skills: row.skill_descriptions ? row.skill_descriptions.map((desc, idx) => ({ id: row.skill_ids[idx], description: desc })) : [],
    attitudes: row.attitude_descriptions ? row.attitude_descriptions.map((desc, idx) => ({ id: row.attitude_ids[idx], description: desc })) : [],
    methodologies: [],
  };

  return Response.json({
    data: curriculumContext,
    attribution: 'Currículum Nacional — MINEDUC Chile (Contexto enriquecido)',
  });
}
