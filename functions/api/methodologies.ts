import type { Env } from '../_middleware';

interface Methodology {
  id: string;
  name: string;
  short_name?: string;
  description?: string;
  when_to_use?: string;
  steps_json?: string;
  advantages_json?: string;
  risks_json?: string;
  dua_accommodations_json?: string;
  suggested_evaluations_json?: string;
  classroom_examples_json?: string;
  source_type?: string;
  source_url?: string;
}

interface MethodologyWithFit extends Methodology {
  fit_score?: number;
  notes?: string;
}

const BASE_COLUMNS = `m.id, m.name, m.short_name, m.description, m.when_to_use, m.steps_json,
       m.advantages_json, m.risks_json, m.dua_accommodations_json, m.suggested_evaluations_json,
       m.classroom_examples_json, m.source_type, m.source_url`;

export async function onRequestGet(context: EventContext<Env>): Promise<Response> {
  const url = new URL(context.request.url);
  const subject = url.searchParams.get('subject') || '';
  const q = url.searchParams.get('q')?.trim() || '';

  let query = '';
  const params: unknown[] = [];

  if (subject) {
    query = `
      SELECT ${BASE_COLUMNS}, ms.fit_score, ms.notes
      FROM methodologies m
      JOIN methodology_subject_fit ms ON ms.methodology_id = m.id
      JOIN subjects s ON ms.subject_id = s.id
      WHERE s.name LIKE ?
      ORDER BY ms.fit_score DESC, m.name
    `;
    params.push(`%${subject}%`);
  } else if (q) {
    query = `
      SELECT ${BASE_COLUMNS}
      FROM methodologies m
      WHERE m.name LIKE ? OR m.description LIKE ? OR m.short_name LIKE ?
      ORDER BY m.name
    `;
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  } else {
    query = `SELECT ${BASE_COLUMNS} FROM methodologies m ORDER BY m.name`;
  }

  const { results } = await context.env.DB.prepare(query).bind(...params).all();

  return Response.json({
    data: results,
    count: results.length,
    attribution: 'Currículum Nacional — MINEDUC Chile (Metodologías Pedagógicas)',
  });
}
