import type { Env } from '../_middleware';

interface Methodology {
  id: string;
  code: string;
  name: string;
  description?: string;
  educational_focus?: string;
  target_levels?: string;
  target_subjects?: string;
  pedagogical_approach?: string;
  status?: string;
}

interface MethodologyWithFit extends Methodology {
  fit_level?: string;
  adaptation_notes?: string;
}

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const subject = url.searchParams.get('subject') || '';
  const level = url.searchParams.get('level') || '';
  const q = url.searchParams.get('q')?.trim() || '';
  const fit_level = url.searchParams.get('fit_level') || '';

  let query = '';
  const params: unknown[] = [];

  if (subject) {
    query = `
      SELECT m.id, m.code, m.name, m.description, m.educational_focus, m.target_levels, m.target_subjects, m.pedagogical_approach, m.status,
             ms.fit_level, ms.adaptation_notes
      FROM methodologies m
      JOIN methodology_subject_fit ms ON ms.methodology_id = m.id
      JOIN subjects s ON ms.subject_id = s.id
      JOIN education_levels e ON s.education_level_id = e.id
      WHERE s.name LIKE ? OR e.name LIKE ?
    `;
    params.push(`%${subject}%`, `%${subject}%`);

    if (fit_level) {
      query += ` AND ms.fit_level = ?`;
      params.push(fit_level);
    }

    query += ` ORDER BY ms.fit_level, m.name`;
  } else if (level) {
    query = `
      SELECT m.id, m.code, m.name, m.description, m.educational_focus, m.target_levels, m.target_subjects, m.pedagogical_approach, m.status,
             ms.fit_level, ms.adaptation_notes
      FROM methodologies m
      JOIN methodology_subject_fit ms ON ms.methodology_id = m.id
      JOIN subjects s ON ms.subject_id = s.id
      JOIN education_levels e ON s.education_level_id = e.id
      WHERE e.name LIKE ?
    `;
    params.push(`%${level}%`);

    if (fit_level) {
      query += ` AND ms.fit_level = ?`;
      params.push(fit_level);
    }

    query += ` ORDER BY ms.fit_level, m.name`;
  } else if (q) {
    query = `
      SELECT m.id, m.code, m.name, m.description, m.educational_focus, m.target_levels, m.target_subjects, m.pedagogical_approach, m.status,
             ms.fit_level, ms.adaptation_notes
      FROM methodologies m
      JOIN methodology_subject_fit ms ON ms.methodology_id = m.id
      JOIN subjects s ON ms.subject_id = s.id
      JOIN education_levels e ON s.education_level_id = e.id
      WHERE m.name LIKE ? OR m.description LIKE ? OR m.code LIKE ? OR e.name LIKE ? OR s.name LIKE ?
    `;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);

    if (fit_level) {
      query += ` AND ms.fit_level = ?`;
      params.push(fit_level);
    }

    query += ` ORDER BY ms.fit_level, m.name`;
  } else {
    query = `
      SELECT m.id, m.code, m.name, m.description, m.educational_focus, m.target_levels, m.target_subjects, m.pedagogical_approach, m.status,
             ms.fit_level, ms.adaptation_notes
      FROM methodologies m
      JOIN methodology_subject_fit ms ON ms.methodology_id = m.id
      JOIN subjects s ON ms.subject_id = s.id
      JOIN education_levels e ON s.education_level_id = e.id
      ORDER BY ms.fit_level, m.name
    `;
  }

  const { results } = await context.env.DB.prepare(query).bind(...params).all();

  return Response.json({
    data: results,
    count: results.length,
    attribution: 'Currículum Nacional — MINEDUC Chile (Metodologías Pedagógicas)',
  });
}
